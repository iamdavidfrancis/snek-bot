import { MessageFlags, SlashCommandBuilder } from "discord.js";
import { DateTime } from "luxon";
import ServiceFactory from "../../services/serviceFactory.js";
import { Command } from "../models/Command.js";

export default new Command({
  builder: new SlashCommandBuilder()
    .setName("birthdays")
    .setDescription("Get a list of all birthdays for the current month")
    .addStringOption((option) =>
      option
        .setName("type")
        .setDescription("The type of birthdays to list.")
        .addChoices(
          { name: "All", value: "all" },
          { name: "This Month Only", value: "month" },
        )),
  run: async ({ interaction }) => {
    const dbService = ServiceFactory.DBServiceInstance;
    const type = interaction.options.getString("type") ?? "all";
    const thisMonthOnly = type === "month";

    const currentMonth = DateTime.now().month;

    const birthdays = await (thisMonthOnly ? dbService.getBirthdaysForMonth(currentMonth) : dbService.getAllBirthdays());

    if (birthdays.length === 0) {
      await interaction.reply({ content: "No birthdays found.", flags: MessageFlags.Ephemeral });
      return;
    }

    birthdays.sort((a, b) => {
      if (a.month === b.month) {
        return a.day - b.day;
      }

      return a.month - b.month;
    });

    const birthdayList = birthdays.map(b => `<@${b.userid}> - ${DateTime.fromObject({ month: b.month, day: b.day }).toFormat("MMMM d")}`).join("\n");
    await interaction.reply({ content: birthdayList, flags: MessageFlags.Ephemeral });
  }
})