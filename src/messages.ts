import Config from "./config.js";
import Discord from "discord.js";
import winston from "winston";

import ICommand from "./command.interface.js";
import DiceRoller from './commands/roll.js';
import Plagueis from './commands/plagueis.js';
import NavySeal from './commands/navy-seal.js';
import Newsletter from './commands/newsletter.js';
import Bash from './commands/bash.js';
import Dimmadome from './commands/dimma.js';
import WhoIs from './commands/whois.js';
import IAm from './commands/iam.js';

export default class Messages {
    private commands = new Discord.Collection<string, ICommand>();

    constructor(private logger: winston.Logger) {
        var commands: Array<ICommand> = [
            {
                commandCode: Config.helpCommand,
                description: 'Display help.',
                handler: this.helpHandler,
                allowInline: true
            },
            new DiceRoller(this.logger),
            new Plagueis(),
            new NavySeal(),
            new WhoIs(),
            new IAm(),
            new Bash(this.logger),
            new Newsletter(),
            // new Dimmadome()
        ];

        commands.forEach(command => {
            this.commands.set(command.commandCode, command);
        });
    }

    public async handleCommand(message: Discord.Message, cmd: string, args: Array<string>): Promise<void> {
        try {
            await this.commands.get(cmd)?.handler(message, args);
        }
        catch (error) {
            this.logger.error(error)
            message.reply('There was an error trying to execute that command!');
        }
    }

    // Need to keep this here for now so it will have access to the entire list.
    private helpHandler = async (message: Discord.Message, args: Array<string>): Promise<void> => {
        const response: Discord.MessageEmbed = new Discord.MessageEmbed();

        const fields: Array<{name: string, value: string, inline?: boolean}> =[];

        const commandArray = this.commands.array();

        commandArray.forEach(command => {
            if (!command) {
                return;
            }

            let description = command.description;
            if (command.usage) {
                description += `\nUsage: ${command.usage}`;
            }

            fields.push({
                name: Config.commandPrefix + command.commandCode,
                value: description,
                inline: command.allowInline
            });
        });

        response
            .setTitle(Config.botName)
            .setDescription(Config.botDescription)
            .addFields(fields)
            .setTimestamp()
            .setFooter(`Y'all don't realize how bored I was. -Franchyze`);

        await message.channel.send(response);
    }
}