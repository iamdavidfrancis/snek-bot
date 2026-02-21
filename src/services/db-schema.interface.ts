export default interface IDBSchema {
  birthdays: IBirthday[];
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

export interface IBirthday {
  day: number;
  month: number;
  userid: string;
}