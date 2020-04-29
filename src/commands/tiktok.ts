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

        let content = args[0];
        const urls = content.match(urlRegex());

        if (!urls) {
            return;
        }

        let url = urls.find(url => url.startsWith("https://v"));

        if (!url) {
            return;
        }

        if (url.endsWith("/")) {
            url = url.substring(0, url.length - 1);
        }

        const urlParts = url.split("/");
        const id = urlParts[urlParts.length - 1];
        const inputFilename =  path.join('videos', `${id}.mp4`);

        const video = youtubedl(url, [], { cwd: __dirname }); // `-o ${inputFilename}`

        video.on('info', (info) => {
            this.logger.info('Download started: ' + url);
            this.logger.info('filename: ' + info.filename);
            this.logger.info('size: ' + info.size);
        });

        video.pipe(fs.createWriteStream(inputFilename));

        video.on('end', async () => {
            this.logger.info("Uploading to Discord: " + inputFilename);

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
    }
}