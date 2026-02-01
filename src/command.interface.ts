import type { Message } from 'discord.js';

export default interface ICommand {
  allowInline: boolean;
  commandCode: string;
  description: string;
  handler(message: Message, args: string[]): Promise<void>;
  usage?: string;
}
