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
        this.client.on('ready', this.readyHandler);
        this.client.on('message', this.messageHandler);
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

    private messageHandler = (message: Discord.Message) => {
        // Don't handle messages from bots.
        if (message.author.bot) {
            return;
        }

        // Only handle commands with our prefix.
        if (message.content.substring(0, 1) !== Config.commandPrefix) {
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

        const handledMessage = this.messages.handleCommand(cmd, args);

        if (handledMessage) {
            message.channel.send(handledMessage);
        }
    }
    
}

// Run the app
const app = new Main();
app.start();