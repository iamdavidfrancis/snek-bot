export interface ListMemberResponse {
  member: MailgunMember;
}

export interface MailgunMember {
  address: string;
  name?: string;
  subscribed: boolean;
  upsert?: boolean;
  vars?: any;
}
