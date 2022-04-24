import { Low, JSONFile } from "lowdb";

import Config from '../config.js';
import IDBSchema, { IPendingInvite, SnekMember } from './db-schema.interface.js';

export enum InvitationDBStatus {
    Uninvited,
    Subscribed,
    Unsubscribed,
    Unredeemed,
    TooManyAttempts,
    Invited
}


const MAX_INVITE_ATTEMPTS = 5;

export default class DBService {

    private db!: Low<IDBSchema>;
    
    public initialize = async () => {
        const adapter = new JSONFile<IDBSchema>(Config.databasePath);
        this.db = new Low(adapter);

        await this.db.read();

        this.db.data ||= { pendingInvites: [], users: [] };
        await this.db.write()
    }

    public getSnekById = async (userid: string): Promise<SnekMember|undefined> => {
        await this.initializeGuard();

        return this.db
            .data
            ?.users
            .find((u) => u.userid == userid);
    }

    public getSnekByName = async (realname: string): Promise<SnekMember|undefined> => {
        await this.initializeGuard();

        return this.db
            .data
            ?.users
            .find((u) => u.realname === realname.toLowerCase());
    }

    public addSnek = async (userid: string, realname: string): Promise<void> => {
        await this.initializeGuard();

        const existing = await this.db
            .data
            ?.users
            .find((u) => u.userid == userid);

        if (!!existing) {
            existing.realname = realname.toLowerCase();
            existing.userid = userid;

            await this.db.write();
        }
        else
        {
            this.db
                .data
                ?.users
                .push({
                    userid,
                    realname: realname.toLowerCase()
                });

            await this.db.write();
        }
            
    }

    public getInvitationStatus = async (email: string): Promise<InvitationDBStatus> => {
        await this.initializeGuard();

        var existingInvite = this.db
            .data
            ?.pendingInvites
            .find((pi) => pi.email === email);

        if (!existingInvite) {
            return InvitationDBStatus.Uninvited;
        } else {
            if (existingInvite.redeemed) {
                return existingInvite.subscribed ?
                    InvitationDBStatus.Subscribed :
                    InvitationDBStatus.Unsubscribed
            }

            if (existingInvite.inviteSendCount > MAX_INVITE_ATTEMPTS) {
                return InvitationDBStatus.TooManyAttempts;
            }

            return InvitationDBStatus.Unredeemed
        }
    }

    public getInvitation = async (email: string): Promise<IPendingInvite> => {
        await this.initializeGuard();

        const invite = this.db
            .data
            ?.pendingInvites
            .find((pi) => pi.email === email);

        if (!invite) {
            throw "Failed to find invitation";
        }

        return invite;
    }

    public createInvitation = async (email: string, otp: string, expiration?: Date): Promise<InvitationDBStatus> => {
        const inviteStatus = await this.getInvitationStatus(email);

        switch (inviteStatus) {
            case InvitationDBStatus.TooManyAttempts:
            case InvitationDBStatus.Subscribed:
            case InvitationDBStatus.Unsubscribed:
                return inviteStatus;
            case InvitationDBStatus.Unredeemed:
                var existingInvite = this.db
                    .data
                    ?.pendingInvites
                    .find((pi) => pi.email === email)!;
                    
                existingInvite.otp = otp,
                existingInvite.inviteExpirationTime = expiration;
                existingInvite.inviteSendCount = existingInvite.inviteSendCount++;

                await this.db.write();
                
                return InvitationDBStatus.Invited;
            default:
                this.db
                    .data
                    ?.pendingInvites
                    .push({
                        email,
                        otp,
                        inviteSentTime: new Date(),
                        inviteExpirationTime: expiration,
                        inviteSendCount: 1,
                        redeemed: false
                    });

                await this.db.write();
                
                return InvitationDBStatus.Invited;
        }
    }

    public updateSubscription = async (email: string, subscribed: boolean): Promise<InvitationDBStatus> => {
        const inviteStatus = await this.getInvitationStatus(email);

        if (inviteStatus !== InvitationDBStatus.Subscribed && inviteStatus !== InvitationDBStatus.Unsubscribed) {
            return inviteStatus;
        }

        const existing = this.db
            .data
            ?.pendingInvites
            .find((pi) => pi.email === email)!;

        existing.subscribed = subscribed;
        existing.redeemed = true;

        await this.db.write();

        return subscribed ? 
            InvitationDBStatus.Subscribed :
            InvitationDBStatus.Unsubscribed;
    }

    public redeem = async (email: string): Promise<InvitationDBStatus> => {
        const inviteStatus = await this.getInvitationStatus(email);

        if (inviteStatus !== InvitationDBStatus.Unredeemed) {
            return inviteStatus;
        }

        const existing = await this.db
            .data
            ?.pendingInvites
            .find((pi) => pi.email === email)!;

            existing.subscribed = true;
            existing.redeemed = true;

            await this.db.write();

        return InvitationDBStatus.Subscribed;
    }

    private initializeGuard = async () => {
        if (!this.db) {
            await this.initialize();
        }
    }
}