import colours from "../Structures/colours";
import Eris from "eris";
import Client from "../Structures/Bot";

module.exports = {
  name: "help",
  description: "Returns a help Embed.",
  async run(bot: Client, interaction: Eris.CommandInteraction<Eris.GuildTextableChannel>) {
    let helpEmbed = {
        title: "Help",
        description: "A help command is currently not implemented.",
        color: colours.default
    };
    await interaction.createMessage({ embeds: [helpEmbed] });
  },
};
