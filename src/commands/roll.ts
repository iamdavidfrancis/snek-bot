import Discord from "discord.js";
import Config from "../config"

interface Results {
    numDice: number;
    diceSides: number;
    diceResults: Array<number>
}

export default class DiceRoller {
    public static commandCode: string = "roll";
    public static description: string = "A dice roller utility. Supports an arbitrary number of dice combinations.";
    public static usage: string = `${Config.commandPrefix}${DiceRoller.commandCode} 4d8 2d10 11d20`;

    private errorEmbed = this.buildEmbedBoilerplate().addField("Dice Roller Error", "Something went wrong with your command. Please make sure all dice rolls are in the format `XdY`.");

    public handler = (cmd: string, args: Array<string>): Discord.MessageEmbed => {
        const results = this.rollHander(args);

        if (results == null) {
            return this.errorEmbed
        }

        const returnValue = this.buildEmbedBoilerplate();

        let totalElements: string[] = [];
        let totalSum = 0;
        results.forEach(element => {
            let resultString = '';
            let sum = 0;

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

            totalElements.push(`${sum}`);
            totalSum += sum;
            resultString += `${sum}`

            returnValue.addField(`${element.numDice}d${element.diceSides} Results:`, resultString);
        });

        const finalString = totalElements.join(" + ") + " = " + totalSum;
        returnValue.addField("Total Dice Roll", finalString);

        return returnValue;
    }

    private buildEmbedBoilerplate(): Discord.MessageEmbed {
        return new Discord.MessageEmbed()
            .setTitle(Config.botName)
            .setDescription("Dice roll result");
    }

    private rollHander = (args: Array<string>): Array<Results> | null => {
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
            return null;
        }

        try {
            const results: Results = {
                numDice: parseInt(regexResults[1]),
                diceSides: parseInt(regexResults[2]),
                diceResults: []
            }
    
            results.diceResults = this.calculateResults(results.numDice, results.diceSides);
            return results;
        }
        catch {
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