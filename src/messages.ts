import type { Message } from 'discord.js';
import { Collection, EmbedBuilder } from 'discord.js';
import type winston from 'winston';
import type ICommand from './command.interface.js';
import Bash from './commands/bash.js';
import IAm from './commands/iam.js';
import NavySeal from './commands/navy-seal.js';
import Newsletter from './commands/newsletter.js';
import Plagueis from './commands/plagueis.js';
import DiceRoller from './commands/roll.js';
import WhoIs from './commands/whois.js';
import Config from './config.js';

export default class Messages {
  private commands = new Collection<string, ICommand>();

  private readonly logger: winston.Logger;

  public constructor(logger: winston.Logger) {
    this.logger = logger;
    const commands: ICommand[] = [
      {
        commandCode: Config.helpCommand,
        description: 'Display help.',
        handler: this.helpHandler,
        allowInline: true,
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

    for (const command of commands) {
      this.commands.set(command.commandCode, command);
    }
  }

  public async handleCommand(message: Message, cmd: string, args: string[]): Promise<void> {
    try {
      await this.commands.get(cmd)?.handler(message, args);
    } catch (error) {
      this.logger.error(error);
      await message.reply('There was an error trying to execute that command!');
    }
  }

  // Need to keep this here for now so it will have access to the entire list.
  private readonly helpHandler = async (message: Message, _: string[]): Promise<void> => {
    const response: EmbedBuilder = new EmbedBuilder();

    const fields: { inline?: boolean; name: string; value: string }[] = [];

    for (const command of this.commands.values()) {
      if (!command) {
        continue;
      }

      let description = command.description;
      if (command.usage) {
        description += `\nUsage: ${command.usage}`;
      }

      fields.push({
        name: Config.commandPrefix + command.commandCode,
        value: description,
        inline: command.allowInline,
      });
    }

    response
      .setTitle(Config.botName)
      .setDescription(Config.botDescription)
      .addFields(fields)
      .setTimestamp()
      .setFooter({ text: "Y'all don't realize how bored I was. -Franchyze" });

    await message.reply({ embeds: [response] });
  };
}
