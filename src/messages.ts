import Config from "./config.js";
import { Message, Collection, EmbedBuilder } from "discord.js";
import winston from "winston";

import ICommand from "./command.interface.js";
import DiceRoller from './commands/roll.js';
import Plagueis from './commands/plagueis.js';
import NavySeal from './commands/navy-seal.js';
import Newsletter from './commands/newsletter.js';
import Bash from './commands/bash.js';
import WhoIs from './commands/whois.js';
import IAm from './commands/iam.js';

export default class Messages {
    private commands = new Collection<string, ICommand>();

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

    public async handleCommand(message: Message, cmd: string, args: Array<string>): Promise<void> {
        try {
            await this.commands.get(cmd)?.handler(message, args);
        }
        catch (error) {
            this.logger.error(error)
            message.reply('There was an error trying to execute that command!');
        }
    }

    // Need to keep this here for now so it will have access to the entire list.
    private helpHandler = async (message: Message, _: Array<string>): Promise<void> => {
        const response: EmbedBuilder = new EmbedBuilder();

        const fields: Array<{name: string, value: string, inline?: boolean}> =[];

        this.commands.forEach(command => {
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
            .setFooter({ text: "Y'all don't realize how bored I was. -Franchyze" });

        await message.reply({ embeds: [response] });
    }
}