import { ChannelType, Collection, EmbedBuilder, Message } from "discord.js";
import otpGenerator from 'otp-generator';
import { IPendingInvite } from "../services/db-schema.interface.js";

import ICommand from "../command.interface.js";
import Config from "../config.js";

import DBService, {InvitationDBStatus} from "../services/db-service.js";
import MailgunService from "../services/mailgun-service.js";
import ServiceFactory from "../services/serviceFactory.js";

type Handler = (message: Message, args: Array<string>) => Promise<void>;

export default class Newsletter implements ICommand {
    public commandCode: string = "plex-newsletter";
    public description: string = "Manage your membership in the plex newsletter.";
    public usage: string = `Only works in DMs. Subscribe to the newsletter with \`${Config.commandPrefix}plex-newsletter subscribe {email}\`. Type \`${Config.commandPrefix}plex-newsletter help\` for more information.`;
    public allowInline: boolean = false;

    private subCommands = new Collection<string, Handler>();

    private dbService: DBService = ServiceFactory.DBServiceInstance;
    private mailgunService: MailgunService = ServiceFactory.MailgunServiceInstance;

    constructor() {
        this.subCommands.set("help", this.helpHandler);
        this.subCommands.set("subscribe", this.subscribeHandler);
        this.subCommands.set("unsubscribe", this.unsubscribeHandler);

        this.dbService.initialize();
    }

    public handler = async (message: Message, args: Array<string>): Promise<void> => {
        if (message.channel.type !== ChannelType.DM) {
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

    private helpHandler = async (message: Message): Promise<void> => {
        const embed = new EmbedBuilder()
            .setTitle(Config.botName)
            .setDescription("Plex Newsletter commands.")
            .addFields(
                { name: Config.commandPrefix + "plex-newsletter help", value: "View this help topic" },
                { name: Config.commandPrefix + "plex-newsletter subscribe {email}", value: "Subscribe to the plex newsletter with the provided email." },
                { name: Config.commandPrefix + "plex-newsletter unsubscribe {email}", value: "Unsubscribe from the plex newsletter." })
            .setTimestamp()
            .setFooter({
                text: "This was more work than I thought. -Franchyze"
            });

        await message.reply({ embeds: [embed] });
    }

    private subscribeHandler = async (message: Message, args: Array<string>): Promise<void> => {
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
                await message.reply("It looks like the email is already subscribed. Please contact Franchyze#9084 if you are not receiving the newsletter.");
                return;
            }

            switch (status) {
                case InvitationDBStatus.TooManyAttempts:
                    await message.reply("Sorry, there have been too many attempts to add that email address. Please contact Franchyze#9084 for more information.");
                    return;
                case InvitationDBStatus.Subscribed:
                    await message.reply("It looks like the email is already subscribed. Please contact Franchyze#9084 if you are not receiving the newsletter.");
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
                await message.reply("This email is not currently pending. Please contact Franchyze#9084 if you believe this to be an error.");
                return;
            }

            let pendingInvite: IPendingInvite;
            try {
                pendingInvite = await this.dbService.getInvitation(email);
            } catch (e) {
                // Couldn't find it.
                return;
            }
            

            if (otp !== pendingInvite.otp) {
                await message.reply("The submitted code is not valid. Please send the code exactly as it appears in the email.");
                return;
            }

            if (pendingInvite.inviteExpirationTime && new Date() > pendingInvite.inviteExpirationTime) {
                await message.reply(`This code is expired. Please try again with \`${Config.commandPrefix}plex-newsletter subscribe ${email}\``);
                return;
            }

            await this.performSubscribe(message, email, true);
        }
    }

    private unsubscribeHandler = async (message: Message, args: Array<string>): Promise<void> => {
        if (args.length !== 1) {
            await this.invalidMessage(message);
            return;
        }

        const email = args[0];

        const status = await this.dbService.getInvitationStatus(email);
        const mailgunStatus = await this.mailgunService.checkIfSubscribed(email);

        if (status !== InvitationDBStatus.Subscribed && !mailgunStatus) {
            // User is not subscribed
            message.reply("You are not currently subscribed.");
            return;
        }

        if (mailgunStatus) {
            await this.mailgunService.unsubscribe(email);
        }

        if (status === InvitationDBStatus.Subscribed) {
            await this.dbService.updateSubscription(email, false);
        }

        message.reply("Unsubscribed successfully.");
    }

    private invalidMessage = async (message: Message) => {
        await message.reply("Sorry, that was not a valid command.");
    }

    private performSubscribe = async (message: Message, email: string, isRedeem: boolean = false) => {
        // 2. Add to mailing list.
        await this.mailgunService.subscribe(email);
        // 3. Set as subscribed in DB.
        if (isRedeem) {
            await this.dbService.redeem(email);
        } else { 
            await this.dbService.updateSubscription(email, true);
        }
        // 4. Send message.
        await message.reply("Successfully subscribed to the newsletter. Thanks :)");
    }

    private performInvite = async (message: Message, email: string) => {
        // 2. Generate OTP
        const otp = otpGenerator.generate(6, { upperCase: true, specialChars: false, digits: false, alphabets: false});

        // 3. Send Email with OTP
        await this.mailgunService.sendInvitationEmail(email, otp);
        
        // 4. Add to DB
        await this.dbService.createInvitation(email, otp, this.addDays(new Date(), 1));
        
        // 5. Send message
        await message.reply("Sent an invitation email. Please check your email and run the command you receive. Thanks :)");
    }

    private addDays(date: Date, days: number) {
        var result = new Date(date);
        result.setDate(result.getDate() + days);
        return result;
    }
}