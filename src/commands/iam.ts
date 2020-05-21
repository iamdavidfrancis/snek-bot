import Discord from "discord.js";
import Config from "../config"
import winston from "winston";
import ICommand from "../command.interface";
import DBService from "../services/db-service";
import ServiceFactory from "../services/serviceFactory";



interface Results {
    numDice: number;
    diceSides: number;
    diceResults: Array<number>
}

export default class IAm implements ICommand {
    private dbService: DBService = ServiceFactory.DBServiceInstance;

    public commandCode: string = "iam";
    description: string = "Add my name on this server.";
    usage?: string | undefined;
    handler: (message: Discord.Message, args: string[]) => Promise<void> = async (message, args) => {
        if (!args || args.length === 0) {
            await message.reply("Invalid arguments.");
            return;
        }

        const name = args.join(' ').toLowerCase();
        await this.dbService.addSnek(message.author.id, name);

        await message.reply("You are in the registry.");
    };

    allowInline: boolean = true;

}