export default class Config {
    public static discordToken: string = process.env.TOKEN || '';
    public static commandPrefix: string = "!";
    public static botName: string = "Snek Meme Bot";
    public static botDescription: string = "Made with love by Franchyze.";
    public static helpCommand: string = "snek-help"
};