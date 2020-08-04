import Discord, { TextChannel } from "discord.js";
import winston, { debug } from "winston";
import Config from "./config";
import Messages from "./messages";
// import ytdl  from 'ytdl-core';
import TikTok from "./commands/tiktok";
import RedditVideo from "./commands/reddit-video";

const DIMMA_VOICE = "704098346343858386";
const DIMMA_FILE = "/usr/src/APP/dimmadome.mp3"; // "D:\\Stream Assets\\keys\\dimmadome.mp3"; //
const DIMMA_YOUTUBE = "https://www.youtube.com/watch?v=SBxpeuxUiOA";

class Main {
    private logger: winston.Logger;
    private client: Discord.Client = new Discord.Client();
    private messages: Messages;
    private connection?: Discord.VoiceConnection;
    private tikTok: TikTok;
    private redditVideo: RedditVideo;

    constructor() {
        this.logger = winston.createLogger({
            level: 'debug',
            format: winston.format.simple(),
            transports: [
                new winston.transports.Console()
            ],
        });
        
        this.messages = new Messages(this.logger);

        this.initializeDiscord();

        this.tikTok = new TikTok(this.logger);
        this.redditVideo = new RedditVideo(this.logger);
    }

    public start() {
        this.client.login(Config.discordToken);
    }

    private initializeDiscord(): void {
        this.client.once<'ready'>('ready', this.readyHandler);
        this.client.on<'message'>('message', this.messageHandler);
        this.client.on<'channelDelete'>('channelDelete', this.channelDeleteHandler);
    }

    private channelDeleteHandler = async (channel: Discord.Channel | Discord.PartialDMChannel) => {
        this.logger.info(JSON.stringify(channel, null, '\t'));
        if (channel.type == "text") {
            const textChannel = channel as Discord.TextChannel;

            const guild = await textChannel.guild.fetch();

            const auditLogs = await guild.fetchAuditLogs({ type: Discord.GuildAuditLogs.Actions.CHANNEL_DELETE });

            const auditEntry = auditLogs.entries.find(a => (a && a.target && (a.target as any).id) === textChannel.id);

            const announceChannel = guild.channels.cache.find(c => c.name == "announcements");

            let message: string;
            if (auditEntry) {
                const initiator = auditEntry.executor.id;
    
                message = `What the fuck, <@!${initiator}>? You just deleted #${textChannel.name}!`;
            } else {
                message = `Someone just deleted #${textChannel.name}!`;
            }

            await (announceChannel as TextChannel).send({
                content: message
            });
        }
    }

    private readyHandler = async () => {
        this.logger.info('Connected');

        if (!this.client.user) {
            this.logger.error('The current user is not defined!');
        }
        else {
            this.logger.info(`Logged in as: ${this.client.user.tag}.`);
            this.client.user.setActivity(`${Config.commandPrefix}${Config.helpCommand}`, { type: 'LISTENING'});
        }
    }

    private messageHandler = async (message: Discord.Message): Promise<void> => {
        // Don't handle messages from bots.
        if (message.author.bot) {
            return;
        }

        // Only handle commands with our prefix.
        if (message.content.substring(0, 1) !== Config.commandPrefix) {
            // Custom tiktok link response.
            if (message.content.indexOf("tiktok.com/") >= 0) {
                // await message.reply("Fuck TikTok.");
                try {
                    await this.tikTok.handler(message, [message.content]);
                } catch (e) {
                    await message.reply("Fuck TikTok.");
                }
            }

            if (message.content.indexOf("reddit.com/") >= 0) {
                try {
                    await this.redditVideo.handler(message, [message.content]);
                } catch (e) {
                    this.logger.error(e);
                }
            }

            if (message.content.indexOf("Fuck you, robot") >= 0) {
                await message.reply("No, fuck you.", { files: ["https://i.imgur.com/84MOMYV.png"]});
            }

            // Don't actually send a reply as other bots can use this prefix as well.
            return;
        }

        let args = message.content.substring(1).split(" ");

        if (args.length === 0) {
            // No arguments, bail out.
            return;
        }

        const cmd = args[0].toLowerCase();
        args = args.splice(1);

        await this.messages.handleCommand(message, cmd, args);
    }
    
}

// Run the app
const app = new Main();
app.start();