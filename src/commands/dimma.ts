import { Message } from "discord.js";
import ICommand from "../command.interface.js";
import { 
    AudioPlayer,
    AudioPlayerStatus,
    AudioResource,
    NoSubscriberBehavior,
    VoiceConnection,
    createAudioPlayer,
    createAudioResource,
    joinVoiceChannel,
} from "@discordjs/voice";

export default class Dimmadome implements ICommand {
    private isConnected = false;
    private connection?: VoiceConnection;
    private audioPlayer?: AudioPlayer;
    private audioResource?: AudioResource;

    public commandCode: string = "dimma";
    public description: string = "Don't worry about it.";
    public allowInline: boolean = true;


    public handler = async (message: Message, args: Array<string>): Promise<void> => {

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

        if (args && args.length > 0 && args[0] == "stop" && !!this.audioPlayer) {
                this.audioPlayer.stop();
                this.audioPlayer = undefined;

            this.connection?.destroy();

            this.isConnected = false;
        } 

        if (this.isConnected) {
            await message.reply({
                content: "Already connected!"
            });
 
            return;
        }

        if (message.member.voice.channel) {
            this.connection = joinVoiceChannel({
                channelId: message.member.voice.channel.id,
                guildId: message.member.voice.channel.guild.id,
                adapterCreator: message.member.voice.channel.guild.voiceAdapterCreator
            });
        }
        else {
            await message.reply({
                content: "You need to be connected to a voice channel!"
            });

            return;
        }

        this.isConnected = true;
        this.audioPlayer = createAudioPlayer({
            behaviors: {
                noSubscriber: NoSubscriberBehavior.Pause,

            },
        });

        const audioFile = "D:\\Stream Assets\\keys\\dimmadome.mp3"; //"/usr/src/APP/dimmadome.mp3");

        if (!this.audioResource) {
            this.audioResource = createAudioResource(audioFile);
        }

        //this.dispatcher = this.connection.play("D:\\Stream Assets\\keys\\dimmadome.mp3"); //"/usr/src/APP/dimmadome.mp3");
        this.audioPlayer.play(this.audioResource);
        this.connection.subscribe(this.audioPlayer);

        this.audioPlayer.on(AudioPlayerStatus.Idle, () => {
            if (!this.audioResource) {
                this.audioResource = createAudioResource("audioFile");
            }

            this.audioPlayer?.play(this.audioResource!);
        });
    }
}