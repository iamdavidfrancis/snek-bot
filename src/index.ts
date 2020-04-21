import Discord from "discord.js";
import winston, { debug } from "winston";
import Config from "./config";
import Messages from "./messages";

class Main {
    private logger: winston.Logger;
    private client: Discord.Client = new Discord.Client();
    private messages: Messages;

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
    }

    public start() {
        this.client.login(Config.discordToken);
    }

    private initializeDiscord(): void {
        this.client.once<'ready'>('ready', this.readyHandler);
        this.client.on<'message'>('message', this.messageHandler);
    }

    private readyHandler = () => {
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
                await message.reply("Fuck TikTok.");
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