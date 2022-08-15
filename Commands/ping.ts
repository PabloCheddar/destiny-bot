import colours from "../Structures/colours";
import Eris from "eris";
import Client from "../Structures/Bot";

module.exports = {
  name: "ping",
  description: "Returns current API ping and shard ping.",
  async run(bot: Client, interaction: Eris.CommandInteraction<Eris.GuildTextableChannel>) {
    const shard = interaction.channel.guild.shard;
    const before = new Date().getTime();
    await interaction.createMessage("🏓Pong!");
    const after = new Date().getTime();
    const ping = after - before;

    const pingEmbed = {title: "🏓 Pong!", description: `Shard Latency: **${shard.latency}**ms.\nAPI Latency: **${ping}**ms.`, color: colours.default,};

    await interaction.editOriginalMessage({ content: "", embeds: [pingEmbed] });
  },
};