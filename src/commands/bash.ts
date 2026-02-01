import { Message, EmbedBuilder} from "discord.js";

import ICommand from "../command.interface.js";
import { quotes } from './bash.org.resources.js';
import winston from "winston";


export default class Bash implements ICommand {
    private logger: winston.Logger;

    constructor(logger: winston.Logger)
    {
        this.logger = logger;
    }

    public commandCode: string = "bash";
    public description: string = "Random bash.org post.";
    public allowInline: boolean = true;
    public handler = async (message: Message): Promise<void> => {
        const max = quotes.length - 1;
        const rand = Math.round(Math.random() * max);

        this.logger.info(`Max: ${max}, Idx: ${rand}`);

        const entry = quotes[rand];
        
        const response: EmbedBuilder = new EmbedBuilder();

        response
            .setTitle("Random bash.org entry")
            .setDescription(`[#${entry.id}](http://www.bash.org/?${entry.id})\n${entry.quote}`)
            .setTimestamp()
            .setFooter({ text: "Yeah, I'm still bored -Franchyze" });

        await message.reply({ embeds: [response] });
        
        // if (message.deletable) {
        //     await message.delete();
        // }
    }
}