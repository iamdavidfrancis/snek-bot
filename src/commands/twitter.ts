import Discord from "discord.js";
import winston from "winston";
import youtubedl from "youtube-dl-exec";
import fs from "fs";
import getUrls from 'get-urls';
import path from "path";
import ICommand from "../command.interface.js";

export default class Twitter implements ICommand {
    public commandCode: string = "tw";
    public description: string = "";
    public allowInline: boolean = true;

    constructor(private logger: winston.Logger)
    {

    }
    
    public handler =  async (message: Discord.Message, args: Array<string>): Promise<void> => {
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

    private doVxTwitter = async (url: string, message: Discord.Message): Promise<void> => {
        const vxUrl = url
            .replace("twitter.com", "vxtwitter.com")
            .replace("x.com", "vxtwitter.com");

        await message.reply(vxUrl);
    }
}