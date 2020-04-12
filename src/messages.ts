import Config from "./config";
import Discord from "discord.js";
import winston from "winston";

import ICommand from "./command.interface";
import DiceRoller from './commands/roll';
import Plagueis from './commands/plagueis';
import NavySeal from './commands/navy-seal';


export default class Messages {
    private commands = new Discord.Collection<string, ICommand>();

    constructor(private logger: winston.Logger) {
        var commands: Array<ICommand> = [
            {
                commandCode: Config.helpCommand,
                description: 'Display help.',
                handler: this.helpHandler
            },
            new DiceRoller(this.logger),
            new Plagueis(),
            new NavySeal()
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

    private helpHandler = async (message: Discord.Message, args: Array<string>): Promise<void> => {
        const response: Discord.MessageEmbed = new Discord.MessageEmbed();

        const fields: Array<{name: string, value: string, inline?: boolean}> =[];

        for (const key in this.commands.array()) {
            const value = this.commands.get(key);

            if (!value) {
                continue;
            }

            let description = value.description;
            if (value.usage) {
                description += `\nUsage: \`${value.usage}\``;
            }

            fields.push({
                name: Config.commandPrefix + value.commandCode,
                value: description,
                inline: true
            });
        }

        response
            .setTitle(Config.botName)
            .setDescription(Config.botDescription)
            .addFields(fields)
            .setTimestamp()
            .setFooter(`Y'all don't realize how bored I was. -Franchyze`);

        await message.channel.send(response);
    }
}