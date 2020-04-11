import Config from "./config";
import Discord from "discord.js";


type CommandHandler = (cmd: string, args: Array<string>) => Message | Discord.MessageEmbed;

export interface Message {
    content: string;
}

export interface Command {
    handler: CommandHandler;
    usage?: string;
    description: string;
    commandCode: string;
}

export default class Messages {

    public handleCommand(cmd: string, args: Array<string>): Message | Discord.MessageEmbed | undefined {
        if (this.commandList[cmd]) {
            return this.commandList[cmd].handler(cmd, args);
        }

        return this.defaultHandler(cmd, args);
    }

    private toMessage = (content: string): Message => {
        return {
            content
        };
    }

    private helpHandler = (cmd: string, args: Array<string>): Discord.MessageEmbed => {
        const response: Discord.MessageEmbed = new Discord.MessageEmbed();

        const fields: Array<{name: string, value: string, inline?: boolean}> = [{
            name: `${Config.commandPrefix}${Config.helpCommand}`,
            value: "Display help.",
            inline: true
        }];

        for (const key in this.commandList) {
            if (key == Config.helpCommand) {
                // We manually added the help command first, so skip it now.
                continue;
            }

            const value = this.commandList[key];
            let description = value.description;
            if (value.usage) {
                description += `\nUsage: ${value.usage}`;
            }

            fields.push({
                name: value.commandCode,
                value: description,
                inline: true
            });
        }

        response
            .setTitle(Config.botName)
            .setDescription(Config.botDescription)
            .addFields(fields)
            .setTimestamp()
            .setFooter(`Y'all don't realize how bored I was. -Franchyze`);

        return response;
    }
    
    private defaultHandler = (cmd: string, args: Array<string>): Message | undefined => {
        // Don't display an error if we can't find the command.
        return;
        // return this.toMessage(`Unknown Command: "${cmd}". Please use ${Config.commandPrefix}help to view available commands`);
    }

    private commandList: {[key: string]: Command} = {
        "plagueis": {
            commandCode: `${Config.commandPrefix}plagueis`,
            description: "The Darth Plagueis the Wise copypasta",
            handler: () => this.toMessage("Did you ever hear the tragedy of Darth Plagueis The Wise? I thought not. It's not a story the Jedi would tell you. It's a Sith legend. Darth Plagueis was a Dark Lord of the Sith, so powerful and so wise he could use the Force to influence the midichlorians to create life… He had such a knowledge of the dark side that he could even keep the ones he cared about from dying. The dark side of the Force is a pathway to many abilities some consider to be unnatural. He became so powerful… the only thing he was afraid of was losing his power, which eventually, of course, he did. Unfortunately, he taught his apprentice everything he knew, then his apprentice killed him in his sleep. Ironic. He could save others from death, but not himself."),

        },
        "navy-seal": {
            commandCode: `${Config.commandPrefix}navy-seal`,
            description: "The Navy Seal copypasta",
            handler: () => this.toMessage("What the fuck did you just fucking say about me, you little bitch? I'll have you know I graduated top of my class in the Navy Seals, and I've been involved in numerous secret raids on Al-Quaeda, and I have over 300 confirmed kills. I am trained in gorilla warfare and I'm the top sniper in the entire US armed forces. You are nothing to me but just another target. I will wipe you the fuck out with precision the likes of which has never been seen before on this Earth, mark my fucking words. You think you can get away with saying that shit to me over the Internet? Think again, fucker. As we speak I am contacting my secret network of spies across the USA and your IP is being traced right now so you better prepare for the storm, maggot. The storm that wipes out the pathetic little thing you call your life. You're fucking dead, kid. I can be anywhere, anytime, and I can kill you in over seven hundred ways, and that's just with my bare hands. Not only am I extensively trained in unarmed combat, but I have access to the entire arsenal of the United States Marine Corps and I will use it to its full extent to wipe your miserable ass off the face of the continent, you little shit. If only you could have known what unholy retribution your little \"clever\" comment was about to Bring Down upon you, maybe you would have held your fucking tongue. But you couldn't, you didn't, and now you're paying the price, you goddamn idiot. I will shit fury all over you and you will drown in it. You're fucking dead, kiddo.")
        },
        [Config.helpCommand]: {
            commandCode: `${Config.commandPrefix}${Config.helpCommand}`,
            description: "",
            handler: this.helpHandler
        }
    };
}