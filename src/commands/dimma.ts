import Discord from "discord.js";
import ICommand from "../command.interface.js";

export default class Dimmadome implements ICommand {
    private isConnected = false;
    private dispatcher?: Discord.StreamDispatcher;
    private connection?: Discord.VoiceConnection;

    public commandCode: string = "dimma";
    public description: string = "Don't worry about it.";
    public allowInline: boolean = true;
    public handler = async (message: Discord.Message, args: Array<string>): Promise<void> => {

        if (!message.member) {
            await message.reply({
                content: "Unknown error."
            });

            return;
        }

        if (message.member.id != "305874191574630410") {
            await message.reply({
                content: "You're not allowed to do this."
            });

            return;
        }

        if (args && args.length > 0 && args[0] == "stop" && !!this.dispatcher) {
            this.dispatcher.pause();
            this.dispatcher.destroy();

            this.connection?.disconnect();

            this.isConnected = false;
        } 

        if (this.isConnected) {
            await message.reply({
                content: "Already connected!"
            });
 
            return;
        }

        if (message.member.voice.channel) {
            this.connection = await message.member.voice.channel.join();
        }
        else {
            await message.reply({
                content: "You need to be connected to a voice channel!"
            });

            return;
        }

        this.isConnected = true;
        this.dispatcher = this.connection.play("D:\\Stream Assets\\keys\\dimmadome.mp3"); //"/usr/src/APP/dimmadome.mp3");

        this.dispatcher.on('end', () => {
            this.connection?.play("/usr/src/APP/dimmadome.mp3");
        })

    }
}