import colours from "../Structures/colours";
import Eris from "eris";
import Client from "../Structures/Bot";

module.exports = {
  name: "say",
  options: [
    {
      name: "message",
      type: 3,
      description: "The message to announce",
      required: true,
    },
    {
      name: "title",
      type: 3,
      description: "The title of the announcement",
      required: true,
    },
  ],
  description: "Repeats your message in a nice embed.",
  permission: BigInt(1 << 13),
  async run(bot: Client, interaction: Eris.CommandInteraction<Eris.GuildTextableChannel>) {
    let sayEmbed = {
      title: (interaction as any).data.options[1].value,
      description: (interaction as any).data.options[0].value,
      color: colours.default,
    }

    await interaction.createMessage({ embeds: [sayEmbed] });
  },
};
