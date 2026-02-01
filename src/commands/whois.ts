import type { Message } from 'discord.js';
import type ICommand from '../command.interface.js';
import type DBService from '../services/db-service.js';
import ServiceFactory from '../services/serviceFactory.js';

export default class WhoIs implements ICommand {
  private dbService: DBService = ServiceFactory.DBServiceInstance;

  public commandCode: string = 'whois';

  public description: string = 'Figure out who is who in this server.';

  public usage?: string | undefined;

  public handler: (message: Message, args: string[]) => Promise<void> = async (message, args) => {
    if (!args || args.length === 0) {
      await message.reply('Invalid arguments.');
      return;
    }

    // Are we doing an AtMention or a name lookup
    let searchTerm = args[0];
    let isAtMention = false;

    if (searchTerm.startsWith('<@')) {
      isAtMention = true;
      const regex = /<@!*\d+?>/.exec(searchTerm);

      if (regex?.length !== 2 || !regex[1]) {
        await message.reply("Can't understand the @mention.");
        return;
      }

      searchTerm = regex[1];
    }

    if (isAtMention) {
      const snek = await this.dbService.getSnekById(searchTerm);

      if (!snek) {
        await message.reply("Can't find the user in the Snek list.");
        return;
      }

      await message.reply(`That's ${snek.realname}`);
    } else {
      const snek = await this.dbService.getSnekByName(searchTerm);

      if (!snek) {
        await message.reply("Can't find the user in the Snek list.");
        return;
      }

      await message.reply(`That's <@!${snek.userid}>`);
    }

    // const currentMessageId = message.id;
    // const channelMessages = await message.channel.messages.fetch({ limit: 10 });

    // Find the parent message.
  };

  public allowInline: boolean = true;
}
