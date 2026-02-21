import path from 'node:path';
import type {
  DMChannel,
  GuildTextBasedChannel,
  Interaction,
  Message,
  NonThreadGuildBasedChannel,
  OmitPartialGroupDMChannel,
  TextChannel} from 'discord.js';
import {
  ActivityType,
  AuditLogEvent,
  ChannelType,
  Client,
  Collection,
  Events,
  GatewayIntentBits,
  MessageFlags,
  Partials
} from 'discord.js';
import { Settings } from 'luxon';
import winston from 'winston';
import RedditVideo from './commands/reddit-video.js';
import Twitter from './commands/twitter.js';
import type { Command } from './commands-v2/models/Command.js';
import Config from './config.js';
import Messages from './messages.js';
import CronService from './utils/cron.js';
import { getItems } from './utils/file-utils.js';
import getUrls from 'get-urls';

const generalChannelId = '1018609613320499321';

class Main {
  private readonly logger: winston.Logger;
  
  private commands = new Collection<string, Command>()

  private client: Client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.GuildMessageReactions,
      GatewayIntentBits.MessageContent,
      GatewayIntentBits.GuildVoiceStates,
    ],
    partials: [Partials.Channel, Partials.Message, Partials.Reaction],
  });

  private readonly messages: Messages;

  private readonly twitter: Twitter;

  private readonly redditVideo: RedditVideo;

  private readonly cronService: CronService;

  public constructor() {
    this.logger = winston.createLogger({
      level: 'debug',
      format: winston.format.simple(),
      transports: [new winston.transports.Console()],
    });

    this.messages = new Messages(this.logger);

    this.initializeDiscord();

    this.twitter = new Twitter();
    this.redditVideo = new RedditVideo(this.logger);
    this.cronService = new CronService(this.client);
  }

  public async start() {
    await this.client.login(Config.discordToken);
  }

  private initializeDiscord(): void {
    this.client.once<Events.ClientReady>(Events.ClientReady, this.readyHandler);
    this.client.on<Events.MessageCreate>(Events.MessageCreate, this.messageHandler);
    this.client.on<Events.ChannelDelete>(Events.ChannelDelete, this.channelDeleteHandler);
    this.client.on<Events.InteractionCreate>(Events.InteractionCreate, this.interactionHandler);

    this.resolveV2Commands();
  }

  private resolveV2Commands(): void {
    const commands: Command[] = getItems<Command>(path.join('commands-v2', 'commands'), command => {
      if (command.disabled) {
        return false;
      }

      if (command.permissions) {
        command.builder.setDefaultMemberPermissions(command.permissions);
      }

      return true;
    });

    for (const command of commands) {
      console.log(`Registering command: ${command.builder.name}`);
      this.commands.set(command.builder.name, command);
    }
  }

  private readonly deployCommands = async (): Promise<void> => {
    const commandJson = this.commands.map((command) => command.builder.toJSON());

    const channel = this.client.channels.cache.get(generalChannelId) as GuildTextBasedChannel | undefined;
    
    if (channel) {
      const guild = await channel.guild.fetch();

      await guild.commands.set(commandJson);
    }
  }

  private readonly channelDeleteHandler = async (channel: DMChannel | NonThreadGuildBasedChannel) => {
    this.logger.info(JSON.stringify(channel, null, '\t'));
    if (channel.type === ChannelType.GuildText) {
      const textChannel = channel as TextChannel;

      const guild = await textChannel.guild.fetch();

      const auditLogs = await guild.fetchAuditLogs({ type: AuditLogEvent.ChannelDelete });

      const auditEntry = auditLogs.entries.find((a) => (a?.target && (a.target as any).id) === textChannel.id);

      const announceChannel = guild.channels.cache.find((channel) => channel.name === 'announcements');

      let message: string;
      if (auditEntry?.executor) {
        const initiator = auditEntry.executor.id;

        message = `What the fuck, <@!${initiator}>? You just deleted #${textChannel.name}!`;
      } else {
        message = `Someone just deleted #${textChannel.name}!`;
      }

      await (announceChannel as TextChannel).send({
        content: message,
      });
    }
  };

  private readonly interactionHandler = async (interaction: Interaction) => {
    if (!interaction.isChatInputCommand()) return;

    const command = this.commands.get(interaction.commandName);

    if (!command) {
      console.error(`No command matching ${interaction.commandName} was found.`);
      return;
    }

    try {
      await command.run({ client: this.client, interaction });
    } catch (error) {
      console.error(`Error executing command ${interaction.commandName}:`, error);
      
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({ content: 'There was an error while executing this command!', flags: MessageFlags.Ephemeral });
      } else {
        await interaction.reply({ content: 'There was an error while executing this command!', flags: MessageFlags.Ephemeral });
      }
    }
  }

  private readonly readyHandler = async () => {
    this.logger.info('Connected');

    if (this.client.user) {
      this.logger.info(`Logged in as: ${this.client.user.tag}.`);
      this.client.user.setActivity(`${Config.commandPrefix}${Config.helpCommand}`, { type: ActivityType.Listening });

      await this.deployCommands();
      this.cronService.scheduleTasks();
    } else {
      this.logger.error('The current user is not defined!');
    }
  };

  private readonly messageHandler = async (message: OmitPartialGroupDMChannel<Message<boolean>>): Promise<void> => {
    // Don't handle messages from bots.
    if (message.author.bot) {
      return;
    }

    // Only handle commands with our prefix.
    if (message.content.slice(0, 1) !== Config.commandPrefix) {
      const urlSet = getUrls(message.content, {
        requireSchemeOrWww: true,
        defaultProtocol: 'https',
        normalizeProtocol: true,
        forceHttps: true,
      });

      if (urlSet?.size > 0) {
        let hasReddit = false;
        let hasTwitter = false;

        for(const url_ of urlSet) {
          const url = new URL(url_);

          if (url.hostname === "reddit.com" || url.hostname.endsWith(".reddit.com")) {
            hasReddit = true;
          }

          if (url.hostname === "twitter.com" || url.hostname === "x.com" ||
              url.hostname.endsWith(".twitter.com") || url.hostname.endsWith(".x.com")
          ) {
            hasTwitter = true;
          }
        }

        if (hasReddit) {
          try {
            await this.redditVideo.handler(message, [message.content]);
          } catch (error) {
            this.logger.error(error);
          }
        }

        if (hasTwitter) {
          try {
            await this.twitter.handler(message, [message.content]);
          } catch (error) {
            this.logger.error(error);
          }
        }
      }

      if (message.content.includes('Fuck you, robot')) {
        await message.reply({
          content: 'No, fuck you.',
          files: ['https://i.imgur.com/84MOMYV.png'],
        });
      }

      // Don't actually send a reply as other bots can use this prefix as well.
      return;
    }

    let args = message.content.slice(1).split(' ');

    if (args.length === 0) {
      // No arguments, bail out.
      return;
    }

    const cmd = args[0].toLowerCase();
    args = args.splice(1);

    await this.messages.handleCommand(message, cmd, args);
  };
}

Settings.defaultZone = "America/New_York";

// Run the app
const app = new Main();
await app.start();
