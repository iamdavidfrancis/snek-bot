export default interface IDBSchema {
  pendingInvites: IPendingInvite[];
  users: SnekMember[];
}

export interface SnekMember {
  realname: string;
  userid: string;
}

export interface IPendingInvite {
  email: string;
  inviteExpirationTime: Date | undefined;
  inviteSendCount: number;
  inviteSentTime?: Date | undefined;
  otp: string;
  redeemed?: boolean | undefined;
  subscribed?: boolean;
}

export interface ICustomCommand {
  approved?: boolean | undefined;
  commandCode: string;
  description?: string | undefined;
  respondText: string;
}
