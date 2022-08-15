// TODO: Permissions stuff
import Eris from "eris";
import Client from "../Structures/Bot";

module.exports = {
  name: "clear",
  options: [
    {
      name: "limit",
      description: "The amount of messages to delete.",
      type: 4,
      required: true,
      min_value: 1,
      max_value: 100,
    },
  ],
  permission: BigInt(1 << 13),
  description: "Clears an amount of messages.",
  async run(bot: Client, interaction: Eris.CommandInteraction<Eris.GuildTextableChannel>) {
    const purgedMessages = await interaction.channel.purge({ limit: (interaction as any).data.options[0].value });

    await interaction.createMessage({ content: `Successfully deleted ${purgedMessages} messages.`, flags: 64});
  },
};
