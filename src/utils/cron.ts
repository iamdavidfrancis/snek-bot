import path from 'node:path';
import type { Client, TextChannel } from 'discord.js';
import cron from 'node-cron';
import type DBService from '../services/db-service.js';
import ServiceFactory from '../services/serviceFactory.js';

const generalChannelId = '1018609613320499321';
const healthChannelId = '744712254188159017';
const healthThreadId = '1467559066623672434';

export default class CronService {
  private dbService: DBService = ServiceFactory.DBServiceInstance;
  
  public constructor(private readonly client: Client)
  {

  }

  public scheduleTasks() {
    this.scheduleDailyTasks();
    this.scheduleNonDailyTasks();    
  }

  private scheduleDailyTasks() {
    // Daily Meds Reminder
    cron.schedule('00 09 * * *', async () => {
      const channel = this.client.channels.cache.get(healthChannelId) as TextChannel | undefined;
      if (channel) {
        const thread = channel.threads.cache.get(healthThreadId);

        const postTo = thread ?? channel;

        const videos = ['drugs.mp4', 'pills.mp4', 'pills2.mov'];

        const file = videos.at(Math.floor(videos.length * Math.random())) ?? 'drugs.mp4';

        const fileName = path.join('videos', file);
        await postTo.send({
          content: "Hey <@&967801221031272498>, don't forget to take your meds today!",
          files: [fileName],
        });
      }
    });

    // Birthday posts
    cron.schedule('0 13 * * *', async () => {
      const birthdays = await this.dbService.getBirthdaysForToday();

      if (birthdays.length > 0) {
        const channel = this.client.channels.cache.get(generalChannelId) as TextChannel | undefined;

        if (channel) {
          const mentions = birthdays.map((b) => `<@${b.userid}>`).join(', ');

          await channel.send({
            content: `Happy birthday, ${mentions}! 🎉🎂`,
          });
        }
      }
    });
  }

  private scheduleNonDailyTasks() {
    // The Weekend
    cron.schedule('30 00 * * 6', async () => {
      await this.sendFile(`the-weekend.mp4`);
    });

    // It is Wednesday, My Dudes
    cron.schedule('30 12 * * 3', async () => {
      await this.sendFile(`itiswednesdaymydudescampfire.mp4`);
    });

    // Post the Mean Girls / FMA meme on 10/3
    cron.schedule('30 12 3 10 *', async () => {
      await this.sendFile(`oct3.jpg`);
    });

    // Fuck Columbus
    cron.schedule('30 12 8-14 10 1', async () => {
      await this.sendFile(`columbus.jpg`);
    });

    // November 8th
    cron.schedule('0 9 8 11 *', async () => {
      const channel = this.client.channels.cache.get(generalChannelId) as TextChannel | undefined;
      if (channel) {
        await channel.send({
          content: "It's November 8th.\nhttps://www.youtube.com/watch?v=_zUh7tWXK1I",
        });
      }
    });
  }

  private readonly sendFile = async (filename: string, channelId: string = generalChannelId): Promise<void> => {
    const channel = this.client.channels.cache.get(channelId) as TextChannel | undefined;
    if (channel) {
      const fileName = path.join('videos', filename);
      await channel.send({
        files: [fileName],
      });
    }
  };
}