import { Message } from "discord.js"

export default interface ICommand {
    commandCode: string;
    description: string;
    usage?: string;
    handler: (message: Message, args: Array<string>) => Promise<void>;
    allowInline: boolean;
};