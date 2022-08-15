import fs from "fs";
import Client from "../Structures/Bot";

export default (bot: Client) => {
  let commandFiles = fs.readdirSync("./Commands/").filter((f: any) => f.endsWith(".ts"));
  if (commandFiles.length <= 0) {
    commandFiles = fs.readdirSync("./Commands/").filter((f: any) => f.endsWith(".js"));
  }

  for (const file of commandFiles) {
    const command = require(`../Commands/${file}`);
    if (command.name) {
      bot.commands.set(command.name, command);
    } else {
      continue;
    }
  }
};
