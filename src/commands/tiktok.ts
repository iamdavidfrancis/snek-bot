import Discord from "discord.js";
import winston from "winston";
import youtubedl from "youtube-dl-exec";
import fs from "fs";
import getUrls from 'get-urls';
import path from "path";
import axios from "axios";

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

        let urlSet = getUrls(args[0]);
        let urls = Array.from(urlSet);

        const tasks: Array<Promise<void>> = [];
        for (let idx = 0; idx < urls.length; ++idx) {
            const url = urls[idx];
            if (url.indexOf('tiktok.com') > 0) {
                tasks.push(this.doVideo(urls[idx], message));
            }
        }

        await Promise.all(tasks)
    }

    private doVideo = async (url: string, message: Discord.Message): Promise<void> => {
        if (url.endsWith("/")) {
            url = url.substring(0, url.length - 1);
        }

        const urlParts = url.split("/");
        const id = urlParts[urlParts.length - 1];
        const inputFilename =  path.join('videos', `${id}.mp4`);
        // const backupFilename = path.join('videos', `${id}-backup.mp4`);

        const video = await youtubedl(url, { output: inputFilename });
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
            return;
        }

        // return new Promise((resolve, reject) => {
        //     try {
        //         this.logger.info("Initiating download.");
        //         const video = youtubedl(url, [], {  }); // `-o ${inputFilename}` // { cwd: __dirname }

        //         this.logger.info("Register callbacks");
        //         video.on('info', (info) => {
        //             this.logger.info('Download started: ' + url);
        //             this.logger.info('filename: ' + info.filename);
        //             this.logger.info('size: ' + info.size);
        //         });
    
        //         const handleWrite = async (fileName: string) => {
        //             this.logger.info("Uploading to Discord: " + fileName);
        
        //             try {
        //                 try {
        //                     await message.reply({
        //                         // content: "fine, you win. But no one else has to watch it on TikTok now.",
        //                         files: [fileName]
        //                     });
    
        //                     // If the entire message is just the url, delete it.
        //                     if (message.deletable && url === message.content) {
        //                         try {
        //                             await message.delete();
        //                         } catch (e) {}
        //                     }
        //                 } catch (e) {
        //                     if (e && e.httpStatus === 413) {
        //                         await message.reply({
        //                             content: "wow that's a big video. It ain't happening dawg. Try something smaller next time. Bet that's the first time you heard that sentence right?",
        //                         });
        //                     }
        //                 }
        //             }
        //             catch (e) {
        //                 this.logger.error(JSON.stringify(e));
        //             }
        //             finally
        //             {
        //                 this.logger.info("Deleting file.");
        //                 fs.unlinkSync(fileName);
        //                 resolve();
        //             }
        //         };
        
        //         video.on('end', async () => {
        //             await handleWrite(inputFilename);
        //         });
    
        //         video.on('error', async (e: any) => {
        //             this.logger.error('youtube-dl failed. Trying backup (hacky) solution.');
        //             this.logger.error(JSON.stringify(e, null, '\t'))
    
        //             fs.unlinkSync(inputFilename);
    
        //             if (e && e.stderr) {
        //                 const lines = e.stderr.split('\n');
    
        //                 if (lines.length == 2 && lines[0] == 'WARNING: Falling back on generic information extractor.' && lines[1].startsWith('ERROR: Unsupported URL: ')) {
                            
        //                     const finalUrl: string = lines[1].replace('ERROR: Unsupported URL: ', '').split('?')[0];
    
        //                     if (finalUrl.indexOf("tiktok.com") > 0) {
        //                         const encodedUrl = encodeURIComponent(finalUrl);
    
        //                         const fetchUrl = `https://onlinetik.com/wp-admin/admin-ajax.php?action=wppress_tt_download&url=${encodedUrl}&key=video`
        //                         const writer = fs.createWriteStream(backupFilename);
    
        //                         const response = await axios({url: fetchUrl, method: 'GET', responseType: 'stream'});
    
        //                         response.data.pipe(writer);
    
        //                         writer.on('finish', async () => {
        //                             this.logger.info('Holy shit the backup hack worked.');
        //                             await handleWrite(backupFilename);
        //                         });
        //                         writer.on('error', (err) => {
        //                             this.logger.error(JSON.stringify(err, null, '\t'))

        //                             this.logger.info("Deleting file.");
        //                             fs.unlinkSync(backupFilename);

        //                             resolve();
        //                         });
        //                     }
        //                 }
        //             }
        //         })
        
        //         this.logger.info("Register pipe");
        //         video.pipe(fs.createWriteStream(inputFilename));
        //     }
        //     catch (e) {
        //         this.logger.verbose("An error has occurred");
        //         this.logger.error(JSON.stringify(e, null, '\t'))
        //         resolve();
        //     }
        // });
    }
}