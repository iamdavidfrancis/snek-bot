import Discord from "discord.js";
import winston from "winston";
import youtubedl from "youtube-dl";
import fs from "fs";
import urlRegex from "url-regex";
import path from "path";

import ICommand from "../command.interface";



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

        let url = args[0];
        
        if (url.endsWith("/")) {
            url = url.substring(0, url.length - 1);
        }

        const urlParts = url.split("/");
        const id = urlParts[urlParts.length - 1];
        const inputFilename =  path.join('videos', `${id}.mp4`);

        try {
            this.logger.info("Initiating download.");
            const video = youtubedl(url, [], {  }); // `-o ${inputFilename}` // { cwd: __dirname }

            this.logger.info("Register callbacks");
            video.on('info', (info) => {
                this.logger.info('Download started: ' + url);
                this.logger.info('filename: ' + info.filename);
                this.logger.info('size: ' + info.size);
            });
    
            video.on('end', async () => {
                this.logger.info("Uploading to Discord: " + inputFilename);
    
                try {
                    try {
                        await message.reply({
                            content: "fine, you win. But no one else has to watch it on TikTok now.",
                            files: [inputFilename]
                        });

                        // If the entire message is just the url, delete it.
                        if (message.deletable && url === message.content) {
                            try {
                                await message.delete();
                            } catch (e) {}
                        }
                    } catch (e) {
                        if (e && e.httpStatus === 413) {
                            await message.reply({
                                content: "wow that's a big video. It ain't happening dawg. Try something smaller next time. Bet that's the first time you heard that sentence right?",
                            });
                        }
                    }
                }
                catch (e) {
                    this.logger.error(JSON.stringify(e));
                }
                finally
                {
                    this.logger.info("Deleting file.");
                    fs.unlinkSync(inputFilename);
                }
            });

            video.on('error', (e) => {
                this.logger.error(JSON.stringify(e, null, '\t'))
            })
    
            this.logger.info("Register pipe");
            video.pipe(fs.createWriteStream(inputFilename));
        }
        catch (e) {
            this.logger.verbose("An error has occurred");
            this.logger.error(JSON.stringify(e, null, '\t'))
        }
    }
}