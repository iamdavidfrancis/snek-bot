import type { ChatInputCommandInteraction} from "discord.js";
import { MessageFlags, SlashCommandBuilder } from "discord.js";
import { DateTime } from "luxon";
import ServiceFactory from "../../services/serviceFactory.js";
import { Command } from "../models/Command.js";


const getHandler = async (interaction: ChatInputCommandInteraction) => {
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

const clearHandler = async (interaction: ChatInputCommandInteraction) => {
  const user = interaction.user;
  const dbService = ServiceFactory.DBServiceInstance;

  await dbService.removeBirthdayForUser(user.id);

  await interaction.reply({ content: `Your birthday has been cleared.`, flags: MessageFlags.Ephemeral });
}


const setHandler = async (interaction: ChatInputCommandInteraction) => {
  const month = interaction.options.getInteger("month", true);
  const day = interaction.options.getInteger("day", true);
  const dbService = ServiceFactory.DBServiceInstance;

  const date = DateTime.fromObject({ month, day }).setZone('America/New_York'); // Validate date

  if (!date.isValid) {
    await interaction.reply({ content: "Invalid date. Please provide a valid month and day.", flags: MessageFlags.Ephemeral });
    return;
  }

  await dbService.setBirthday(interaction.user.id, day, month);
  await interaction.reply({ content: `Your birthday has been set to ${date.toFormat("MMMM d")}.`, flags: MessageFlags.Ephemeral });
}

export default new Command({
  builder: new SlashCommandBuilder()
    .setName("birthday")
    .setDescription("Add or update your birthday")
    .addSubcommand((subcommand) => 
      subcommand
        .setName("set")
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
            .setMaxValue(31)))
    .addSubcommand((subcommand) =>
      subcommand
        .setName("get") 
        .setDescription("Get your birthday or another user's birthday")
        .addUserOption((option) =>
          option.setName("user")
            .setDescription("The user whose birthday you want to get")
            .setRequired(false)))
    .addSubcommand((subcommand) =>
      subcommand
        .setName("clear") 
        .setDescription("Clear your birthday")),
  run: async ({ interaction }) => {
    const subcommand = interaction.options.getSubcommand();

    switch (subcommand) {
      case "set":
        await setHandler(interaction);
        break;
      case "get":
        await getHandler(interaction);
        break;
      case "clear":
        await clearHandler(interaction);
        break;
      default:
        await interaction.reply({ content: "Unknown subcommand.", flags: MessageFlags.Ephemeral });
    }
  }
});