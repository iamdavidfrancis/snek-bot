import { SlashCommandBuilder } from "discord.js";
import { DateTime } from "luxon";
import ServiceFactory from "../../services/serviceFactory.js";
import { Command } from "../models/Command.js";

export default new Command({
  builder: new SlashCommandBuilder()
    .setName("set-birthday")
    .setDescription("Set your birthday")
    .addIntegerOption((option) =>
      option
        .setName("month")
        .setDescription("Your birth month (1-12)")
        .setRequired(true)
        .setMinValue(1)
        .setMaxValue(12))
    .addIntegerOption((option) =>
      option
        .setName("day")
        .setDescription("Your birth day (1-31)")
        .setRequired(true)
        .setMinValue(1)
        .setMaxValue(31)),
  // .addUserOption((option) => 
  //   option
  //     .setName("user")
  //     .setDescription("Set birthday for another user (admin only)")
  //     .setRequired(false)),
  run: async ({ interaction }) => {
    const month = interaction.options.getInteger("month", true);
    const day = interaction.options.getInteger("day", true);
    const dbService = ServiceFactory.DBServiceInstance;

    const date = DateTime.fromObject({ month, day }).setZone('America/New_York'); // Validate date

    if (!date.isValid) {
      await interaction.reply({ content: "Invalid date. Please provide a valid month and day.", ephemeral: true });
      return;
    }

    await dbService.setBirthday(interaction.user.id, day, month);
    await interaction.reply({ content: `Your birthday has been set to ${date.toFormat("MMMM d")}.`, ephemeral: true });
  }
})