import { MessageFlags, SlashCommandBuilder } from "discord.js";
import { DateTime } from "luxon";
import ServiceFactory from "../../services/serviceFactory.js";
import { Command } from "../models/Command.js";

export default new Command({
  builder: new SlashCommandBuilder()
    .setName("get-birthday")
    .setDescription("Get your birthday or another user's birthday")
    .addUserOption((option) =>
      option.setName("user")
        .setDescription("The user whose birthday you want to get")
        .setRequired(false)),
  run: async ({ interaction }) => {
    const user = interaction.options.getUser("user") ?? interaction.user;
    const dbService = ServiceFactory.DBServiceInstance;

    const birthday = await dbService.getBirthdayForUser(user.id);
    if (!birthday) {
      await interaction.reply({ content: `${user.username} has not set their birthday yet.`, flags: MessageFlags.Ephemeral });
      return;
    }

    const date = DateTime.fromObject({ month: birthday.month, day: birthday.day }).setZone('America/New_York');

    await interaction.reply({ content: `${user.username}'s birthday is on ${date.toFormat("MMMM d")}.`, flags: MessageFlags.Ephemeral });
  }
});