export default interface IDBSchema {
    pendingInvites: Array<IPendingInvite>;
    users: Array<SnekMember>;
}

export interface SnekMember {
    userid: string;
    realname: string;
}

export interface IPendingInvite {
    email: string;
    otp: string;
    inviteSentTime?: Date;
    inviteExpirationTime?: Date;
    inviteSendCount: number;
    redeemed?: boolean;
    subscribed?: boolean;
}

export interface ICustomCommand {
    commandCode: string;
    description?: string;
    respondText: string;
    approved?: boolean;
}