import { 
    ActivityType,
    AuditLogEvent,
    ChannelType,
    Client,
    DMChannel,
    Events,
    GatewayIntentBits,
    Message,
    NonThreadGuildBasedChannel,
    OmitPartialGroupDMChannel,
    Partials,
    TextChannel,
} from "discord.js";

import winston from "winston";
import cron from 'node-cron';
import path from "path";

import Config from "./config.js";
import Messages from "./messages.js";
// import ytdl  from 'ytdl-core';
import Twitter from "./commands/twitter.js";

import RedditVideo from "./commands/reddit-video.js";

// const DIMMA_VOICE = "704098346343858386";
// const DIMMA_FILE = "/usr/src/APP/dimmadome.mp3";
// const DIMMA_YOUTUBE = "https://www.youtube.com/watch?v=SBxpeuxUiOA";

const generalChannelId = '1018609613320499321';
const healthChannelId = '744712254188159017';
const healthThreadId = '1467559066623672434';

class Main {
    private logger: winston.Logger;
    private client: Client = new Client({
        intents: [
            GatewayIntentBits.Guilds,
            GatewayIntentBits.GuildMessages,
            GatewayIntentBits.GuildMessageReactions,
            GatewayIntentBits.MessageContent,
            GatewayIntentBits.GuildVoiceStates,
        ],
        partials: [
            Partials.Channel,
            Partials.Message,
            Partials.Reaction
        ]
    });
    private messages: Messages;
    private twitter: Twitter;
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

        this.twitter = new Twitter();
        this.redditVideo = new RedditVideo(this.logger);
    }

    public start() {
        this.client.login(Config.discordToken);
    }

    private initializeDiscord(): void {
        this.client.once<Events.ClientReady>(Events.ClientReady, this.readyHandler);
        this.client.on<Events.MessageCreate>(Events.MessageCreate, this.messageHandler);
        this.client.on<Events.ChannelDelete>(Events.ChannelDelete, this.channelDeleteHandler);
    }

    private channelDeleteHandler = async (channel: DMChannel | NonThreadGuildBasedChannel) => {
        this.logger.info(JSON.stringify(channel, null, '\t'));
        if (channel.type == ChannelType.GuildText) {
            const textChannel = channel as TextChannel;

            const guild = await textChannel.guild.fetch();

            const auditLogs = await guild.fetchAuditLogs({ type: AuditLogEvent.ChannelDelete });

            const auditEntry = auditLogs.entries.find(a => (a && a.target && (a.target as any).id) === textChannel.id);

            const announceChannel = guild.channels.cache.find(c => c.name == "announcements");

            let message: string;
            if (auditEntry && auditEntry.executor) {
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
            this.client.user.setActivity(`${Config.commandPrefix}${Config.helpCommand}`, { type: ActivityType.Listening });

            cron.schedule('30 00 * * 6', async () => {
                await this.sendFile(`the-weekend.mp4`);
            });

            cron.schedule('30 12 * * 3', async () => {
                await this.sendFile(`itiswednesdaymydudescampfire.mp4`);
            });

            // Post the Mean Girls / FMA meme on 10/3
            cron.schedule('30 12 3 10 *', async () => {
                await this.sendFile(`oct3.jpg`);
            });

            // Fuck Columbus
            cron.schedule('30 12 8-14 10 1', async () => {
                await this.sendFile(`columbus.jpg`);
            });

            cron.schedule('0 9 8 11 *', async () => {
                const channel = this.client.channels.cache.get(generalChannelId) as TextChannel | undefined;
                if (channel) {
                    await channel.send({
                        content: "It's November 8th.\nhttps://www.youtube.com/watch?v=_zUh7tWXK1I",
                    });
                }
            })

            cron.schedule('00 09 * * *', async () => {
                const channel = this.client.channels.cache.get(healthChannelId) as TextChannel | undefined;
                if (channel) {
                    const thread = channel.threads.cache.get(healthThreadId);

                    const postTo = thread || channel;

                    const videos = ['drugs.mp4', 'pills.mp4', 'pills2.mov'];

                    const file = videos.at(Math.floor(videos.length * Math.random())) || 'drugs.mp4';

                    const fileName = path.join('videos', file);
                    await postTo.send({
                        content: "Hey <@&967801221031272498>, don't forget to take your meds today!",
                        files: [fileName]
                    })
                }
            });

            /* cron.schedule('00 21 * * 2', async () => {
                let testChannel = this.client.channels.cache.get('1018609613320499321') as Discord.TextChannel | undefined;
                if (testChannel) {
                    await testChannel.send({
                        content: '<@&618503327474515969> Who\'s in for trivia tomorrow night?\n:thumbsup:: Yes\n:wave:: Maybe\n:thumbsdown:: No',
                    });
                }
            }); // */

            
        }
    }

    private sendFile = async (filename: string, channelId: string = generalChannelId): Promise<void> => {
        const channel = this.client.channels.cache.get(channelId) as TextChannel | undefined;
        if (channel) {
            const fileName = path.join('videos', filename);
            await channel.send({
                files: [fileName]
            })
        }
    }

    private messageHandler = async (message: OmitPartialGroupDMChannel<Message<boolean>>): Promise<void> => {
        // Don't handle messages from bots.
        if (message.author.bot) {
            return;
        }

        // Only handle commands with our prefix.
        if (message.content.substring(0, 1) !== Config.commandPrefix) {
            // Custom tiktok link response.
            // if (message.content.indexOf("tiktok.com/") >= 0) {
            //     try {
            //         await this.tikTok.handler(message, [message.content]);
            //     } catch (e) {
            //         // this.logger.error(e);
            //         await message.reply("Fuck TikTok.");
            //     }
            // }

            if (message.content.indexOf("reddit.com/") >= 0) {
                try {
                    await this.redditVideo.handler(message, [message.content]);
                } catch (e) {
                    this.logger.error(e);
                }
            }

            if (message.content.indexOf("twitter.com") >= 0 || message.content.indexOf("x.com") >= 0)
            {
                try {
                    await this.twitter.handler(message, [message.content]);
                } catch (e) {
                    this.logger.error(e);
                }
            }

            // if (message.content.indexOf("//twitter.com") >= 0) {
            //     try {
            //         await message.reply("Fuck twitter. At least use vxtwitter so the previews work.");
                    
            //     } catch (e) {
            //         this.logger.error(e);
            //     }
            // }

            if (message.content.indexOf("Fuck you, robot") >= 0) {
                await message.reply({
                    content: "No, fuck you.",
                    files: ["https://i.imgur.com/84MOMYV.png"]
                });
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
