import type { AxiosBasicCredentials, AxiosInstance } from 'axios';
import axios from 'axios';
import formData from 'form-data';
import Mailgun from 'mailgun.js';
import Config from '../config.js';
import type { MailgunMember, ListMemberResponse } from './mailgun.interfaces.js';

export default class MailgunService {
  private readonly axios: AxiosInstance;

  // private mg = mailgun({ apiKey: Config.mailgunApiKey, domain: Config.newsletterDomain });
  private mailgun = new Mailgun(formData);

  private mg = this.mailgun.client({ username: 'api', key: Config.mailgunApiKey });

  private getMembersUrl: string = `lists/${Config.newsletterAddress}/members`;

  public constructor() {
    const auth: AxiosBasicCredentials = {
      username: 'api',
      password: Config.mailgunApiKey,
    };

    this.axios = axios.create({
      auth,
      baseURL: 'https://api.mailgun.net/v3/',
      timeout: 1_000,
    });
  }

  public async checkIfSubscribed(email: string): Promise<boolean> {
    const url = this.getMembersUrl + `/${email}`;

    try {
      const response = await this.axios.get<ListMemberResponse>(url);

      if (response.status === 200 && response.data) {
        return response.data.member.subscribed;
      }

      return false;
    } catch (error: any) {
      if (error?.response?.status === 404) {
        return false;
      }

      throw error;
    }
  }

  public async subscribe(email: string): Promise<boolean> {
    const postBody = `address=${email}&subscribed=true&upsert=true`;

    const result = await this.axios.post(this.getMembersUrl, postBody);

    return result.status < 400;
  }

  public async unsubscribe(email: string): Promise<boolean> {
    const url = this.getMembersUrl + `/${email}`;
    const result = await this.axios.delete<MailgunMember>(url);

    return result.status < 400;
  }

  public async sendInvitationEmail(email: string, otp: string): Promise<boolean> {
    const data = {
      from: 'Snek Bot <postmaster@mg.iamusingtheinter.net>',
      to: email,
      subject: 'Plex Newsletter Invitations',
      template: 'newsletter.invitation',
      'h:X-Mailgun-Variables': JSON.stringify({ otp, to: email }),
    };

    const result = await this.mg.messages.create(Config.newsletterDomain, data);

    return result.status < 400;
  }
}
