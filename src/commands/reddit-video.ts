import Discord from "discord.js";
import winston from "winston";
import youtubedl from "youtube-dl-exec";
import fs from "fs";
import getUrls from 'get-urls';

import ICommand from "../command.interface";
import { URL } from "url";

const downloadParams = ["-f", "bestvideo+bestaudio/best", "-o", "videos/%(title)s-%(id)s.%(ext)s"];

export default class RedditVideo implements ICommand {
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
            
            if (url.hostname.endsWith('.reddit.com')) {
                tasks.push(this.doVideo(url.href, message));
            }
        }

        await Promise.all(tasks)
    }

    private doVideo = async (url: string, message: Discord.Message): Promise<void> => {
        try {
            let filename = await this.getFilename(url);

            // download file
            await this.downloadVideo(url);

            // send message
            await this.uploadToDiscord(filename, message);

            // delete file
            this.logger.info("Deleting file.");
            fs.unlinkSync(filename);
        } catch (e) {
            if (e.stderr === "ERROR: No media found") {
                // Not a video. No-op
            } else {
                this.logger.error(e);
            }
        }
    }

    private getFilename = async (url: string): Promise<string> => {
        // Figure out what the filename should be
        const info = await youtubedl(url, { dumpJson: true, format: "bestvideo+bestaudio/best", output: "videos/%(title)s-%(id)s.%(ext)s" });

        return info._filename;
    }

    private downloadVideo = async (url: string): Promise<void> => {
        await youtubedl(url, { format: "bestvideo+bestaudio/best", output: "videos/%(title)s-%(id)s.%(ext)s" });
    }

    private uploadToDiscord = async (filename: string, message: Discord.Message): Promise<void> => {
        this.logger.info("Uploading to Discord: " + filename);

        try {
            await message.reply({
                content: "here's that reddit video you posted.",
                files: [filename]
            });
        } catch (e) {
            if (e && e.httpStatus === 413) {
                await message.reply({
                    content: "I tried to upload the reddit video, but it was too big. Oh well."
                });
            } else {
                this.logger.error(JSON.stringify(e));
            }
        }
    }
}