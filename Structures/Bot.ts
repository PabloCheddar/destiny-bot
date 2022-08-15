import { Client, ClientOptions } from "eris";
import clicolours from "./CLIColors";

interface BotOptions extends ClientOptions {
    devMode?: boolean;
    testingGuildID?: string;
}

export default class BotClient extends Client {
    commands: Map<string, any>;
    devMode: boolean;
    testingGuildID: string | undefined;

    constructor(token: string, options: BotOptions) {
        super(token, options);

        this.commands = new Map();
        this.devMode = options.devMode || false;
        this.testingGuildID = options.testingGuildID;

        if(!this.testingGuildID && this.devMode === true) {
            console.error(`${clicolours.red}[ERROR]${clicolours.reset} You must specify a testing guild ID if you are in dev mode.`);
            process.exit(1);
        }
    }
}