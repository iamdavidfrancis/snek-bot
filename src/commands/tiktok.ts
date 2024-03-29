import Discord from "discord.js";
import winston from "winston";
import youtubedl from "youtube-dl-exec";
import fs from "fs";
import getUrls from 'get-urls';
import path from "path";
import axios from "axios";

import ICommand from "../command.interface.js";

export default class TikTok implements ICommand {
    public commandCode: string = "tt";
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
            if (url.hostname == 'tiktok.com') {
                tasks.push(this.doVxTiktok(url.href, message));
            }
        }

        await Promise.all(tasks)
    }

    private doVxTiktok = async (url: string, message: Discord.Message): Promise<void> => {
        const vxUrl = url.replace("tiktok", "vxtiktok");

        await message.reply(vxUrl);
    }

    private doVideo = async (url: string, message: Discord.Message): Promise<void> => {
        if (url.endsWith("/")) {
            url = url.substring(0, url.length - 1);
        }

        const urlParts = url.split("/");
        const id = urlParts[urlParts.length - 1];
        const inputFilename =  path.join('videos', `${id}.mp4`);
        // const backupFilename = path.join('videos', `${id}-backup.mp4`);
        
        const video = await youtubedl(url, { 
            userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 10_3 like Mac OS X) AppleWebKit/602.1.50 (KHTML, like Gecko) CriOS/56.0.2924.75 Mobile/14E5239e Safari/602.1",
            output: inputFilename
        });
        this.logger.info(JSON.stringify(video, null, 2));

        try {
            try {
                await message.reply({
                    // content: "fine, you win. But no one else has to watch it on TikTok now.",
                    files: [inputFilename]
                });

                // If the entire message is just the url, delete it.
                if (message.deletable && url === message.content) {
                    try {
                        await message.delete();
                    } catch (e) {}
                }
            } catch (e: any) {
                if (e && e.httpStatus === 413) {
                    await message.reply({
                        content: "wow that's a big video. It ain't happening dawg. Try something smaller next time. Bet that's the first time you heard that sentence right?",
                    });
                }
            }
        }
        catch (e: any) {
            this.logger.error(JSON.stringify(e));
        }
        finally
        {
            this.logger.info("Deleting file.");
            fs.unlinkSync(inputFilename);
            return;
        }
    }
}