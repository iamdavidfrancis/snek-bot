import { Message } from "discord.js";
import getUrls from 'get-urls';
import ICommand from "../command.interface.js";
import { URL } from "url";

export default class Twitter implements ICommand {
    public commandCode: string = "tw";
    public description: string = "";
    public allowInline: boolean = true;
    
    public handler =  async (message: Message, args: Array<string>): Promise<void> => {
        if (!args || !args.length) {
            return;
        }

        let urlSet = getUrls(args[0], {
            requireSchemeOrWww: true,
            defaultProtocol: "https",
            normalizeProtocol: true,
            forceHttps: true
        });

        let urls = Array.from(urlSet);

        const tasks: Array<Promise<void>> = [];
        for (let idx = 0; idx < urls.length; ++idx) {
            const url = new URL(urls[idx]);
            if (url.hostname == 'twitter.com' || url.hostname == "x.com") {
                tasks.push(this.doVxTwitter(url.href, message));
            }
        }

        await Promise.all(tasks)
    }

    private doVxTwitter = async (url: string, message: Message): Promise<void> => {
        const vxUrl = url
            .replace("twitter.com", "vxtwitter.com")
            .replace("x.com", "vxtwitter.com");

        await message.reply(vxUrl);
        await message.suppressEmbeds(true);
    }
}