var Discord = require('discord.js');
var winston = require('winston');
var config = require("./config");
var messages = require("./messages");

// Set up logging
const logger = winston.createLogger({
    level: 'debug',
    format: winston.format.simple(),
    transports: [
        new winston.transports.Console({ colorize: true })
    ]
});

// Initialize Discord bot
logger.info("Signing in");
var client = new Discord.Client();

client.on('ready', () => {
    logger.info('Connected');
    logger.info(`Logged in as: ${client.user.tag}.`);
    logger.info(`Bot has started, with ${client.users.size} users, in ${client.channels.size} channels of ${client.guilds.size} guilds.`);
});

client.on('disconnect', (errMsg, code) => {
    logger.warn(errMsg);
    logger.warn(code);
});

client.on('message', message => {
    if (message.author.bot) {
        return;
    }

    if (message.content.substring(0, 1) == config.commandPrefix) {
        let args = message.content.substring(1).split(" ");
        if (args.length === 0) {
            return;
        }

        const cmd = args[0].toLowerCase();

        args = args.splice(1);

        if (messages[cmd]) {
            message.channel.send({
                content: messages[cmd]
            });
            // message.reply(messages[cmd]);
        }
        else {
            message.channel.send({
                content: `Unknown option. Use ${config.commandPrefix}help to view the command list.`
            })
        }

        // TODO: Handle other stuff here.
    }
});

client.login(config.discordToken);