import Discord from "discord.js";
import winston from "winston";
import youtubedl from "youtube-dl";
import fs from "fs";
import urlRegex from "url-regex";
import getUrls from 'get-urls';
import path from "path";

import ICommand from "../command.interface";

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

        let urlSet = getUrls(args[0]);
        let urls = Array.from(urlSet);

        const tasks: Array<Promise<void>> = [];
        for (let idx = 0; idx < urls.length; ++idx) {
            const url = urls[idx];
            if (url.indexOf('reddit.com') > 0) {
                tasks.push(this.doVideo(urls[idx], message));
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
        const info = await new Promise<youtubedl.Info>((res, rej) => youtubedl.getInfo(url, downloadParams, {}, (err, opt) => !!err ? rej(err) : res(opt)));

        return info._filename;
    }

    private downloadVideo = async (url: string): Promise<void> => {
        return new Promise((resolve, reject) => {
            this.logger.info("Initiating download.");
            youtubedl.exec(url, downloadParams, {}, (err, out) => {
                if (err) {
                    reject(err);
                }

                resolve();
            });
        });
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