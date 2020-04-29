import Discord from "discord.js";
import winston, { debug } from "winston";
import Config from "./config";
import Messages from "./messages";
// import ytdl  from 'ytdl-core';
import TikTok from "./commands/tiktok";

const DIMMA_VOICE = "704098346343858386";
const DIMMA_FILE = "/usr/src/APP/dimmadome.mp3"; // "D:\\Stream Assets\\keys\\dimmadome.mp3"; //
const DIMMA_YOUTUBE = "https://www.youtube.com/watch?v=SBxpeuxUiOA";

class Main {
    private logger: winston.Logger;
    private client: Discord.Client = new Discord.Client();
    private messages: Messages;
    private connection?: Discord.VoiceConnection;
    private tikTok: TikTok;

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
    }

    public start() {
        this.client.login(Config.discordToken);
    }

    private initializeDiscord(): void {
        this.client.once<'ready'>('ready', this.readyHandler);
        this.client.on<'message'>('message', this.messageHandler);
    }

    private readyHandler = async () => {
        this.logger.info('Connected');

        if (!this.client.user) {
            this.logger.error('The current user is not defined!');
        }
        else {
            this.logger.info(`Logged in as: ${this.client.user.tag}.`);
            this.client.user.setActivity(`${Config.commandPrefix}${Config.helpCommand}`, { type: 'LISTENING'});

            // let voiceChannel = this.client.channels.cache.get(DIMMA_VOICE);

            // if (voiceChannel) {
            //     this.connection = await (voiceChannel as Discord.VoiceChannel).join();

            //     let dispatcher = this.connection.play(ytdl(DIMMA_YOUTUBE, { filter: 'audioonly' }), { volume: 0.75 })
    
            //     dispatcher.on('finish', () => {
            //         this.connection?.play(ytdl(DIMMA_YOUTUBE, { filter: 'audioonly' }), { volume: 0.75 });
            //     });
            // }

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