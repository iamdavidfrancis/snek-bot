import Discord from "discord.js";
import Config from "../config.js"
import winston from "winston";
import ICommand from "../command.interface.js";
import DBService from "../services/db-service.js";
import ServiceFactory from "../services/serviceFactory.js";



interface Results {
    numDice: number;
    diceSides: number;
    diceResults: Array<number>
}

export default class WhoIs implements ICommand {
    private dbService: DBService = ServiceFactory.DBServiceInstance;

    public commandCode: string = "whois";
    description: string = "Figure out who is who in this server.";
    usage?: string | undefined;
    handler: (message: Discord.Message, args: string[]) => Promise<void> = async (message, args) => {
        if (!args || args.length === 0) {
            await message.reply("Invalid arguments.");
            return;
        }

        // Are we doing an AtMention or a name lookup
        let searchTerm = args[0];
        let isAtMention = false;

        if (searchTerm.startsWith('<@')) {
            isAtMention = true;
            var regex = searchTerm.match(/<@!*([0-9]+?)>/);

            if (!regex || regex.length !== 2 || !regex[1]) {
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
        }
        else 
        {
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

    allowInline: boolean = true;

}