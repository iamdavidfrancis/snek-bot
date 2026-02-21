import type { Client, ChatInputCommandInteraction, SharedSlashCommand } from "discord.js"

export type CommandArgs = {
  client: Client;
  interaction: ChatInputCommandInteraction;
}

export class Command {
  public disabled?: boolean;

  public permissions?: bigint;

  public builder!: SharedSlashCommand; // SharedSlashCommandOptions<any> | SlashCommandBuilder;

  public run!: (args: CommandArgs) => Promise<any>;

  public constructor(options: NonNullable<Command>) {
    Object.assign(this, options);
  }
}