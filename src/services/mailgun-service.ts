import Config from "../config";
import axios, { AxiosRequestConfig, AxiosBasicCredentials, AxiosInstance } from "axios";
import mailgun from "mailgun-js";

import { MailgunMember, ListMemberResponse } from './mailgun.interfaces';

export default class MailgunService {
    private axios: AxiosInstance;
    private mg = mailgun({ apiKey: Config.mailgunApiKey, domain: Config.newsletterDomain });

    private getMembersUrl: string = `lists/${Config.newsletterAddress}/members`;
    private sendEmailUrl: string = `${Config.newsletterDomain}/messages`;

    constructor() {
        const auth: AxiosBasicCredentials = {
            username: 'api',
            password: Config.mailgunApiKey
        }
        
        this.axios = axios.create({
            auth,
            baseURL: 'https://api.mailgun.net/v3/',
            timeout: 1000
        });
    }

    public async checkIfSubscribed(email: string): Promise<boolean> {
        const url = this.getMembersUrl + `/${email}`;
        var response = await this.axios.get<ListMemberResponse>(url)

        if (response.status === 200 && response.data) {
            return response.data.member.subscribed
        }

        return false;
    }

    public async subscribe(email: string): Promise<boolean> {
        const operation: MailgunMember = {
            address: email,
            subscribed: true,
            upsert: true
        };

        const result = await this.axios.post(this.getMembersUrl, operation);

        if (result.status >= 400) {
            return false;
        }

        return true;
    }

    public async unsubscribe(email: string): Promise<boolean> {
        const url = this.getMembersUrl + `/${email}`;
        var result = await this.axios.delete<MailgunMember>(url)

        if (result.status >= 400) {
            return false;
        }

        return true;
    }

    public sendInvitationEmail(email: string, otp: string): Promise<boolean> {
        const data = {
            from: "Snek Bot <postmaster@mg.iamusingtheinter.net>",
            to: email,
            subject: "Plex Newsletter Invitations",
            template: "newsletter.invitation",
            'h:X-Mailgun-Variables': JSON.stringify({ otp, to: email })
        };

        return new Promise((res, rej) => {
            this.mg.messages().send(data, (error, body) => {
                if (error) {
                    res(false);
                }

                res(true);
            });
        });
    }
}