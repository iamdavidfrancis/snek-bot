import Discord from "discord.js";

import Config from "../config";
import ICommand from "../command.interface";
import * as bash from './bash.org.json';
import winston from "winston";


export default class Bash implements ICommand {

    constructor(private logger: winston.Logger)
    {

    }

    public commandCode: string = "bash";
    public description: string = "Random bash.org copypasta.";
    public allowInline: boolean = true;
    public handler = async (message: Discord.Message): Promise<void> => {
        const max = bash.quotes.length - 1;
        const rand = Math.round(Math.random() * max);

        this.logger.info(`Max: ${max}, Idx: ${rand}`);

        const entry = bash.quotes[rand];
        
        const response: Discord.MessageEmbed = new Discord.MessageEmbed();

        response
            .setTitle("Random bash.org entry")
            .setDescription(`[#${entry.id}](http://www.bash.org/?${entry.id})\n${entry.quote}`)
            .setTimestamp()
            .setFooter(`Yeah, I'm still bored -Franchyze`);

        await message.channel.send(response);
        
        // if (message.deletable) {
        //     await message.delete();
        // }
    }
}