export default interface IDBSchema {
    pendingInvites: Array<IPendingInvite>
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