import type { Message } from 'discord.js';
import { EmbedBuilder } from 'discord.js';
import type winston from 'winston';
import type ICommand from '../command.interface.js';
import Config from '../config.js';

interface Results {
  diceResults: number[];
  diceSides: number;
  numDice: number;
}

export default class DiceRoller implements ICommand {
  public commandCode: string = 'roll';

  public description: string = 'A dice roller utility. Supports an arbitrary number of dice combinations.';

  public usage: string = `${Config.commandPrefix}${this.commandCode} 4d8 2d10 11d20`;

  public allowInline: boolean = true;

  private errorEmbed = this.buildEmbedBoilerplate().addFields({
    name: 'Dice Roller Error',
    value: 'Something went wrong with your command. Please make sure all dice rolls are in the format `XdY`.',
  });

  private readonly logger: winston.Logger;

  public constructor(logger: winston.Logger) {
    this.logger = logger;
  }

  public handler = async (message: Message, args: string[]): Promise<void> => {
    const results = this.rollHandler(args);

    if (results === null) {
      await message.reply({ embeds: [this.errorEmbed] });
      return;
    }

    const returnValue = this.buildEmbedBoilerplate();

    const totalElements: string[] = [];
    let totalSum = 0;
    for (const element of results) {
      let resultString = '';
      let sum = 0;

      if (element.diceResults.length > 1) {
        for (let idxDie = 0; idxDie < element.diceResults.length; idxDie++) {
          sum += element.diceResults[idxDie];
          resultString += `${element.diceResults[idxDie]} `;

          if (idxDie + 1 < element.diceResults.length) {
            resultString += `+ `;
          } else {
            resultString += `= `;
          }
        }
      } else {
        sum = element.diceResults[0];
      }

      totalElements.push(`${sum}`);
      totalSum += sum;
      resultString += `${sum}`;

      returnValue.addFields({ name: `${element.numDice}d${element.diceSides} Results:`, value: resultString });
    }

    let finalString;

    if (totalElements.length > 1) {
      finalString = totalElements.join(' + ') + ' = ' + totalSum;
    } else {
      finalString = totalSum;
    }

    returnValue.addFields({ name: 'Total Dice Roll', value: `${finalString}` });

    // Send the message
    await message.reply({ embeds: [returnValue] });
  };

  private buildEmbedBoilerplate(): EmbedBuilder {
    return new EmbedBuilder().setTitle(Config.botName).setDescription('Dice roll result');
  }

  private readonly rollHandler = (args: string[]): Results[] | null => {
    const results: Results[] = [];
    let error = false;

    for (const arg of args) {
      const result = this.singleRollHandler(arg);

      if (result === null) {
        error = true;
        continue;
      }

      results.push(result);
    }

    if (error) {
      return null;
    }

    return results;
  };

  private readonly singleRollHandler = (arg: string): Results | null => {
    const regex = /(?<numDice>\d+)d(?<diceSides>\d+)/;

    if (!regex.test(arg)) {
      return null;
    }

    const regexResults = regex.exec(arg);

    if (!regexResults || regexResults.length < 3) {
      this.logger.error(`[singleRollHandler] Bad regex response.`);
      return null;
    }

    try {
      const results: Results = {
        numDice: Number.parseInt(regexResults.groups?.numDice ?? '0', 10),
        diceSides: Number.parseInt(regexResults.groups?.diceSides ?? '0', 10),
        diceResults: [],
      };

      if (results.numDice > 200 || results.diceSides > 200) {
        this.logger.error(
          `[singleRollHandler] Too many dice or sides! Dice: ${results.numDice}. Sides: ${results.diceSides}.`,
        );
        return null;
      }

      results.diceResults = this.calculateResults(results.numDice, results.diceSides);
      return results;
    } catch (error) {
      this.logger.error(`[singleRollHandler] Unexpected error: ${JSON.stringify(error)}`);
      return null;
    }
  };

  private readonly calculateResults = (numDice: number, numSides: number): number[] => {
    const results: number[] = [];

    for (let idx = 0; idx < numDice; idx++) {
      const result = Math.ceil(Math.random() * numSides);

      results.push(result);
    }

    return results;
  };
}
