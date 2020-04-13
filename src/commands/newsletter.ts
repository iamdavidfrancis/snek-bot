import Discord from "discord.js";
import otpGenerator from 'otp-generator';

import ICommand from "../command.interface";
import Config from "../config";

import DBService, {InvitationDBStatus} from "../services/db-service";
import MailgunService from "../services/mailgun-service";
import ServiceFactory from "../services/serviceFactory";

type Handler = (message: Discord.Message, args: Array<string>) => Promise<void>;

export default class Newsletter implements ICommand {
    public commandCode: string = "plex-newsletter";
    public description: string = "Manage your membership in the plex newsletter.";
    public usage: string = `Only works in DMs. Subscribe to the newsletter with \`${Config.commandPrefix}plex-newsletter subscribe {email}\`. Type \`${Config.commandPrefix}plex-newsletter help\` for more information.`;
    public allowInline: boolean = false;

    private subCommands = new Discord.Collection<string, Handler>();

    private dbService: DBService = ServiceFactory.DBServiceInstance;
    private mailgunService: MailgunService = ServiceFactory.MailgunServiceInstance;

    constructor() {
        this.subCommands.set("help", this.helpHandler);
        this.subCommands.set("subscribe", this.subscribeHandler);
        this.subCommands.set("unsubscribe", this.unsubscribeHandler);

        this.dbService.initialize();
    }

    public handler = async (message: Discord.Message, args: Array<string>): Promise<void> => {
        if (message.channel.type !== "dm") {
            if (message.deletable) {
                try {
                    await message.delete();
                }
                catch {}
            }
            
            await message.reply({
                content: "This functionality is only available in DMs. Please try again in DM."
            });
            return;
        }

        if (args.length === 0) {
            await this.invalidMessage(message);
            return;
        }

        var subCommand = args[0];
        
        if (!this.subCommands.has(subCommand)) {
            await this.invalidMessage(message);
            return;
        }

        args = args.splice(1);
        await this.subCommands.get(subCommand)!(message, args);
    }

    private helpHandler = async (message: Discord.Message, args: Array<string>): Promise<void> => {
        const embed = new Discord.MessageEmbed()
            .setTitle(Config.botName)
            .setDescription("Plex Newsletter commands.")
            .addField(Config.commandPrefix + "plex-newsletter help", "View this help topic")
            .addField(Config.commandPrefix + "plex-newsletter subscribe {email}", "Subscribe to the plex newsletter with the provided email.")
            .addField(Config.commandPrefix + "plex-newsletter unsubscribe {email}", "Unsubscribe from the plex newsletter.")
            .setTimestamp()
            .setFooter("This was more work than I thought. -Franchyze");

        await message.channel.send(embed);
    }

    private subscribeHandler = async (message: Discord.Message, args: Array<string>): Promise<void> => {
        if (args.length < 1 || args.length > 2) {
            await this.invalidMessage(message);
            return;
        }

        const email: string = args[0];
        let otp: string = '';
        if (args.length == 2) {
            otp = args[1];
        }

        const status = await this.dbService.getInvitationStatus(email);

        if (!otp) {
            // Bail out early if they're already on the MG list.
            const mailgunStatus = await this.mailgunService.checkIfSubscribed(email);

            if (mailgunStatus) {
                await message.channel.send("It looks like the email is already subscribed. Please contact Franchyze#9084 if you are not receiving the newsletter.");
                return;
            }

            switch (status) {
                case InvitationDBStatus.TooManyAttempts:
                    await message.channel.send("Sorry, there have been too many attempts to add that email address. Please contact Franchyze#9084 for more information.");
                    return;
                case InvitationDBStatus.Subscribed:
                    await message.channel.send("It looks like the email is already subscribed. Please contact Franchyze#9084 if you are not receiving the newsletter.");
                    return;
                case InvitationDBStatus.Unsubscribed:
                    await this.performSubscribe(message, email);
                    return;
                case InvitationDBStatus.Unredeemed:
                case InvitationDBStatus.Uninvited:
                default:
                    await this.performInvite(message, email);
                    return;
            }            
        } else {
            if (status !== InvitationDBStatus.Unredeemed && status !== InvitationDBStatus.TooManyAttempts) {
                await message.channel.send("This email is not currently pending. Please contact Franchyze#9084 if you believe this to be an error.");
                return;
            }

            const pendingInvite = await this.dbService.getInvitation(email);

            if (otp !== pendingInvite.otp) {
                await message.channel.send("The submitted code is not valid. Please send the code exactly as it appears in the email.");
                return;
            }

            if (pendingInvite.inviteExpirationTime && new Date() > pendingInvite.inviteExpirationTime) {
                await message.channel.send(`This code is expired. Please try again with \`${Config.commandPrefix}plex-newsletter subscribe ${email}\``);
                return;
            }

            await this.performSubscribe(message, email, true);
        }
    }

    private unsubscribeHandler = async (message: Discord.Message, args: Array<string>): Promise<void> => {
        if (args.length !== 1) {
            await this.invalidMessage(message);
            return;
        }

        const email = args[0];

        const status = await this.dbService.getInvitationStatus(email);
        const mailgunStatus = await this.mailgunService.checkIfSubscribed(email);

        if (status !== InvitationDBStatus.Subscribed && !mailgunStatus) {
            // User is not subscribed
            message.channel.send("You are not currently subscribed.");
            return;
        }

        if (mailgunStatus) {
            await this.mailgunService.unsubscribe(email);
        }

        if (status === InvitationDBStatus.Subscribed) {
            await this.dbService.updateSubscription(email, false);
        }

        message.channel.send("Unsubscribed successfully.");
    }

    private invalidMessage = async (message: Discord.Message) => {
        await message.channel.send("Sorry, that was not a valid command.");
    }

    private performSubscribe = async (message: Discord.Message, email: string, isRedeem: boolean = false) => {
        // 2. Add to mailing list.
        await this.mailgunService.subscribe(email);
        // 3. Set as subscribed in DB.
        if (isRedeem) {
            await this.dbService.redeem(email);
        } else { 
            await this.dbService.updateSubscription(email, true);
        }
        // 4. Send message.
        await message.channel.send("Successfully subscribed to the newsletter. Thanks :)");
    }

    private performInvite = async (message: Discord.Message, email: string) => {
        // 2. Generate OTP
        const otp = otpGenerator.generate(6, { upperCase: true, specialChars: false, digits: false, alphabets: false});

        // 3. Send Email with OTP
        await this.mailgunService.sendInvitationEmail(email, otp);
        
        // 4. Add to DB
        await this.dbService.createInvitation(email, otp, this.addDays(new Date(), 1));
        
        // 5. Send message
        await message.channel.send("Sent an invitation email. Please check your email and run the command you receive. Thanks :)");
    }

    private addDays(date: Date, days: number) {
        var result = new Date(date);
        result.setDate(result.getDate() + days);
        return result;
    }
}