import fs from 'node:fs';
import type { Message } from 'discord.js';
import getUrls from 'get-urls';
import type winston from 'winston';
import youtubedl, { Payload } from 'youtube-dl-exec';
import type ICommand from '../command.interface.js';

// const downloadParams = ["-f", "bestvideo+bestaudio/best", "-o", "videos/%(title)s-%(id)s.%(ext)s"];

export default class RedditVideo implements ICommand {
  public commandCode: string = 'tt';

  public description: string = '';

  public allowInline: boolean = true;

  private readonly logger: winston.Logger;

  public constructor(logger: winston.Logger) {
    this.logger = logger;
  }

  public handler = async (message: Message, args: string[]): Promise<void> => {
    if (!args?.length) {
      return;
    }

    const urlSet = getUrls(args[0], {
      requireSchemeOrWww: true,
      defaultProtocol: 'https',
      normalizeProtocol: true,
      forceHttps: true,
    });

    const urls = Array.from(urlSet);

    const tasks: Promise<void>[] = [];
    for (const url_ of urls) {
      const url = new URL(url_);

      if (url.hostname.endsWith('.reddit.com')) {
        tasks.push(this.doVideo(url.href, message));
      }
    }

    await Promise.all(tasks);
  };

  private readonly doVideo = async (url: string, message: Message): Promise<void> => {
    try {
      const filename = await this.getFilename(url);

      // download file
      await this.downloadVideo(url);

      // send message
      await this.uploadToDiscord(filename, message);

      // delete file
      this.logger.info('Deleting file.');
      await fs.promises.unlink(filename);
    } catch (error: any) {
      if (error.stderr === 'ERROR: No media found') {
        // Not a video. No-op
      } else {
        this.logger.error(error);
      }
    }
  };

  private readonly getFilename = async (url: string): Promise<string> => {
    // Figure out what the filename should be
    const info = await youtubedl(url, {
      dumpJson: true,
      format: 'bestvideo+bestaudio/best',
      output: 'videos/%(title)s-%(id)s.%(ext)s',
    });

    return (info as Payload).requested_downloads[0]._filename;
  };

  private readonly downloadVideo = async (url: string): Promise<void> => {
    await youtubedl(url, { format: 'bestvideo+bestaudio/best', output: 'videos/%(title)s-%(id)s.%(ext)s' });
  };

  private readonly uploadToDiscord = async (filename: string, message: Message): Promise<void> => {
    this.logger.info('Uploading to Discord: ' + filename);

    try {
      await message.reply({
        content: "here's that reddit video you posted.",
        files: [filename],
      });
    } catch (error: any) {
      if (error?.httpStatus === 413) {
        await message.reply({
          content: 'I tried to upload the reddit video, but it was too big. Oh well.',
        });
      } else {
        this.logger.error(JSON.stringify(error));
      }
    }
  };
}
