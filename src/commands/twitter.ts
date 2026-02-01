import type { Message } from 'discord.js';
import getUrls from 'get-urls';
import type ICommand from '../command.interface.js';

export default class Twitter implements ICommand {
  public commandCode: string = 'tw';

  public description: string = '';

  public allowInline: boolean = true;

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
      if (url.hostname === 'twitter.com' || url.hostname === 'x.com') {
        tasks.push(this.doVxTwitter(url.href, message));
      }
    }

    await Promise.all(tasks);
  };

  private readonly doVxTwitter = async (url: string, message: Message): Promise<void> => {
    const vxUrl = url.replace('twitter.com', 'vxtwitter.com').replace('x.com', 'vxtwitter.com');

    await message.reply(vxUrl);
    await message.suppressEmbeds(true);
  };
}
