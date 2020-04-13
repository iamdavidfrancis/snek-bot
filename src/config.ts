export default class Config {
    public static discordToken: string = process.env.TOKEN || '';
    public static mailgunApiKey: string = process.env.MAILGUN_SECRET || '';
    public static commandPrefix: string = "!";
    public static botName: string = "Snek Meme Bot";
    public static botDescription: string = "Made with love by Franchyze.";
    public static helpCommand: string = "snek-help";
    public static newsletterAddress: string = "newsletter@mg.iamusingtheinter.net";
    public static newsletterDomain: string = "mg.iamusingtheinter.net";
    public static databasePath: string = "database/db.json";
};