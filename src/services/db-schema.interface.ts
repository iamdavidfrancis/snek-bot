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
    inviteSentTime?: Date | undefined;
    inviteExpirationTime: Date | undefined;
    inviteSendCount: number;
    redeemed?: boolean | undefined;
    subscribed?: boolean;
}

export interface ICustomCommand {
    commandCode: string;
    description?: string | undefined;
    respondText: string;
    approved?: boolean | undefined;
}