import type { Message } from 'discord.js';
import type ICommand from '../command.interface.js';
import type DBService from '../services/db-service.js';
import ServiceFactory from '../services/serviceFactory.js';

export default class IAm implements ICommand {
  private dbService: DBService = ServiceFactory.DBServiceInstance;

  public commandCode: string = 'iam';

  public description: string = 'Add my name on this server.';

  public usage?: string | undefined;

  public handler: (message: Message, args: string[]) => Promise<void> = async (message, args) => {
    if (!args || args.length === 0) {
      await message.reply('Invalid arguments.');
      return;
    }

    const name = args.join(' ').toLowerCase();
    await this.dbService.addSnek(message.author.id, name);

    await message.reply('You are in the registry.');
  };

  public allowInline: boolean = true;
}
