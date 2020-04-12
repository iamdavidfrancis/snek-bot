import Discord from "discord.js";
import Config from "../config"
import winston from "winston";
import ICommand from "../command.interface";

interface Results {
    numDice: number;
    diceSides: number;
    diceResults: Array<number>
}

export default class DiceRoller implements ICommand {
    public commandCode: string = "roll";
    public description: string = "A dice roller utility. Supports an arbitrary number of dice combinations.";
    public usage: string = `${Config.commandPrefix}${this.commandCode} 4d8 2d10 11d20`;

    private errorEmbed = this.buildEmbedBoilerplate().addField("Dice Roller Error", "Something went wrong with your command. Please make sure all dice rolls are in the format `XdY`.");

    constructor(private logger: winston.Logger)
    {

    }

    public handler = async (message: Discord.Message, args: Array<string>): Promise<void> => {
        const results = this.rollHandler(args);

        if (results == null) {
            await message.channel.send(this.errorEmbed);
            return;
        }

        const returnValue = this.buildEmbedBoilerplate();

        let totalElements: string[] = [];
        let totalSum = 0;
        results.forEach(element => {
            let resultString = '';
            let sum = 0;

            if (element.diceResults.length > 1) {
                for (let i = 0; i < element.diceResults.length; i++) {
                    sum += element.diceResults[i];
                    resultString += `${element.diceResults[i]} `;
    
                    if (i + 1 < element.diceResults.length) {
                        resultString += `+ `
                    }
                    else {
                        resultString += `= `
                    }
                }
            } else {
                sum = element.diceResults[0];
            }

            totalElements.push(`${sum}`);
            totalSum += sum;
            resultString += `${sum}`

            returnValue.addField(`${element.numDice}d${element.diceSides} Results:`, resultString);
        });

        let finalString;

        if (totalElements.length > 1) {
            finalString = totalElements.join(" + ") + " = " + totalSum;
        }
        else {
            finalString = totalSum;
        }

        returnValue.addField("Total Dice Roll", finalString);

        // Send the message
        await message.channel.send(returnValue);
    }

    private buildEmbedBoilerplate(): Discord.MessageEmbed {
        return new Discord.MessageEmbed()
            .setTitle(Config.botName)
            .setDescription("Dice roll result");
    }

    private rollHandler = (args: Array<string>): Array<Results> | null => {
        const results: Array<Results> = [];
        let error = false;

        args.forEach(arg => {
            var result = this.singleRollHandler(arg);

            if (result == null) {
                error = true;
                return null;
            }

            results.push(result);
        });

        if (error) {
            return null;
        }

        return results;
    }

    private singleRollHandler = (arg: string): Results | null => {
        const regex = /([0-9]+)d([0-9]+)/;

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
                numDice: parseInt(regexResults[1]),
                diceSides: parseInt(regexResults[2]),
                diceResults: []
            }

            if (results.numDice > 200 || results.diceSides > 200) {
                this.logger.error(`[singleRollHandler] Too many dice or sides! Dice: ${results.numDice}. Sides: ${results.diceSides}.`);
                return null;
            }

            results.diceResults = this.calculateResults(results.numDice, results.diceSides);
            return results;
        }
        catch (ex) {
            
            this.logger.error(`[singleRollHandler] Unexpected error: ${JSON.stringify(ex)}`);
            return null;
        }
    }

    private calculateResults = (numDice: number, numSides: number): Array<number> => {
        const results = []

        for (let i = 0; i < numDice; i++) {
            const result = Math.ceil(Math.random() * numSides);

            results.push(result);
        }

        return results;
    }
}