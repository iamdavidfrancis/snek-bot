import Discord from "discord.js"

export default interface ICommand {
    commandCode: string;
    description: string;
    usage?: string;
    handler: (message: Discord.Message, args: Array<string>) => Promise<void>
};