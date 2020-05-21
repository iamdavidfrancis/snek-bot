import lowdb from "lowdb";
import FileAsync from "lowdb/adapters/FileAsync";

import Config from '../config';
import IDBSchema, { IPendingInvite, SnekMember } from './db-schema.interface';

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

    private db!: lowdb.LowdbAsync<IDBSchema>;
    
    public initialize = async () => {
        const adapter = new FileAsync<IDBSchema>(Config.databasePath);
        this.db = await lowdb(adapter);

        this.db.defaults({ pendingInvites: [], users: [] }).value();
    }

    public getSnekById = async (userid: string): Promise<SnekMember|undefined> => {
        await this.initializeGuard();

        return this.db
            .get('users')
            .find({ userid })
            .value();
    }

    public getSnekByName = async (realname: string): Promise<SnekMember|undefined> => {
        await this.initializeGuard();

        return this.db
            .get('users')
            .find({ realname: realname.toLowerCase() })
            .value();
    }

    public addSnek = async (userid: string, realname: string): Promise<void> => {
        await this.initializeGuard();

        const existing = await this.db
            .get("users")
            .find({ userid })
            .value();

        if (!!existing) {
            await this.db
                .get("users")
                .find({ userid })
                .assign({
                    userid,
                    realname: realname.toLowerCase()
                })
                .write();
        }
        else
        {
            await this.db
                .get("users")
                .push({
                    userid,
                    realname: realname.toLowerCase()
                })
                .write();
        }
            
    }

    public getInvitationStatus = async (email: string): Promise<InvitationDBStatus> => {
        await this.initializeGuard();

        var existingInvite = this.db
            .get('pendingInvites')
            .find({ email })
            .value();

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

        return this.db
            .get('pendingInvites')
            .find({ email })
            .value();
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
                    .get('pendingInvites')
                    .find({ email })
                    .value();
                    
                await this.db
                    .get("pendingInvites")
                    .find({ email })
                    .assign({
                        otp,
                        inviteExpirationTime: expiration,
                        inviteSendCount: existingInvite.inviteSendCount++
                    })
                    .write();
                
                return InvitationDBStatus.Invited;
            default:
                await this.db
                    .get("pendingInvites")
                    .push({
                        email,
                        otp,
                        inviteSentTime: new Date(),
                        inviteExpirationTime: expiration,
                        inviteSendCount: 1,
                        redeemed: false
                    })
                    .write();
                
                return InvitationDBStatus.Invited;
        }
    }

    public updateSubscription = async (email: string, subscribed: boolean): Promise<InvitationDBStatus> => {
        const inviteStatus = await this.getInvitationStatus(email);

        if (inviteStatus !== InvitationDBStatus.Subscribed && inviteStatus !== InvitationDBStatus.Unsubscribed) {
            return inviteStatus;
        }

        await this.db
            .get("pendingInvites")
            .find({ email })
            .assign({ subscribed, redeemed: true })
            .write();

        return subscribed ? 
            InvitationDBStatus.Subscribed :
            InvitationDBStatus.Unsubscribed;
    }

    public redeem = async (email: string): Promise<InvitationDBStatus> => {
        const inviteStatus = await this.getInvitationStatus(email);

        if (inviteStatus !== InvitationDBStatus.Unredeemed) {
            return inviteStatus;
        }

        await this.db
            .get("pendingInvites")
            .find({ email })
            .assign({ subscribed: true, redeemed: true })
            .write();

        return InvitationDBStatus.Subscribed;
    }

    private initializeGuard = async () => {
        if (!this.db) {
            await this.initialize();
        }
    }
}