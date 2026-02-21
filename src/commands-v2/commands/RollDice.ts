import { EmbedBuilder, MessageFlags, SlashCommandBuilder } from "discord.js";
import Config from "../../config.js";
import { Command } from "../models/Command.js";

interface Results {
  diceResults: number[];
  diceSides: number;
  numDice: number;
}

const calculateResults = (count: number, sides: number): number[] => {
  const results: number[] = [];

  for (let idx = 0; idx < count; idx++) {
    results.push(Math.floor(Math.random() * sides) + 1);
  }

  return results;
}

export default new Command({
  builder: new SlashCommandBuilder()
    .setName("roll")
    .setDescription("Roll a die or dice.")
    .addStringOption((option) =>
      option
        .setName("dice")
        .setDescription("The dice to roll, e.g., '1d6' for one six-sided die.")
        .setRequired(true)),
  run: async ({ interaction }) => {
    const diceInput = interaction.options.getString("dice", true);
    const diceInputs = diceInput.split(" ");

    const results: Results[] = [];

    for (const input of diceInputs) {
      const dicePattern = /^(?<count>\d*)d(?<sides>\d+)$/i;
      const match = dicePattern.exec(input);

      if (!match) {
        await interaction.reply({ content: "Invalid dice format. Please use the format 'XdY', e.g., '2d8' for rolling two eight-sided dice.", flags: MessageFlags.Ephemeral });
        return;
      }

      const count = match.groups?.count ? Number.parseInt(match.groups.count, 10) : 1; // Default to 1 die if count is not specified
      const sides = Number.parseInt(match.groups?.sides ?? "0", 10);
      const result = calculateResults(count, sides);

      results.push({ numDice: count, diceSides: sides, diceResults: result });
    }

    if (results.length === 0) {
      await interaction.reply({ content: "No valid dice rolls found. Please use the format 'XdY', e.g., '2d8' for rolling two eight-sided dice.", flags: MessageFlags.Ephemeral });
      return;
    }

    const resultEmbed = new EmbedBuilder()
      .setTitle(Config.botName)
      .setDescription("Dice Roll Results")

    const totalElements: string[] = [];
    let totalSum = 0;

    for (const result of results) {
      let resultString = '';
      let sum = 0;

      if (result.diceResults.length > 1) {
        for (let idxDie = 0; idxDie < result.diceResults.length; idxDie++) {
          sum += result.diceResults[idxDie];
          resultString += `${result.diceResults[idxDie]} `;

          if (idxDie + 1 < result.diceResults.length) {
            resultString += `+ `;
          } else {
            resultString += `= `;
          }
        }
      } else {
        sum = result.diceResults[0];
      }

      totalElements.push(`${sum}`);
      totalSum += sum;
      resultString += `${sum}`;
      resultEmbed.addFields({ name: `${result.numDice}d${result.diceSides}`, value: resultString });
    }

    let finalString;

    if (totalElements.length > 1) {
      finalString = totalElements.join(' + ') + ' = ' + totalSum;
    } else {
      finalString = `${totalSum}`;
    }

    resultEmbed.addFields({ name: 'Total Dice Roll', value: `${finalString}` });

    await interaction.reply({ embeds: [resultEmbed] });
  },
});