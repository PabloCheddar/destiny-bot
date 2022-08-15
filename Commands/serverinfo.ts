import colours from "../Structures/colours";
import Eris from "eris";
import Client from "../Structures/Bot";

module.exports = {
  name: "serverinfo",
  description: "Returns information about the server.",
  async run(bot: Client, interaction: Eris.CommandInteraction<Eris.GuildTextableChannel>) {
    let members = {
      real: interaction.channel.guild.members.filter((x: any) => !x.bot).length,
      bot: interaction.channel.guild.members.filter((x: any) => x.bot).length,
    };

    let roles = interaction.channel.guild.roles.size;
    let creationTime = Math.round(interaction.channel.guild.createdAt / 1000);

    let channels = {
      text: interaction.channel.guild.channels.filter((x: any) => x.type === 0).length,
      voice: interaction.channel.guild.channels.filter((x: any) => x.type === 2).length,
      category: interaction.channel.guild.channels.filter((x: any) => x.type === 4).length,
    };

    let emojis = {
      regular: interaction.channel.guild.emojis.filter((x: any) => !x.animated).length,
      animated: interaction.channel.guild.emojis.filter((x: any) => x.animated).length,
    };

    let icon;
    if (interaction.channel.guild.icon)
      icon = interaction.channel.guild.dynamicIconURL(interaction.channel.guild.iconURL?.startsWith("a_") ? "gif" : "png",128
    );

    const serverInfoEmbed = {
      author: { name: interaction.channel.guild.name },
      color: colours.default,
      description: `**ID**: \`${interaction.channel.guild.id}\`\n**Owner**: <@!${interaction.channel.guild.ownerID}>\n**Creation Time**: <t:${creationTime}>`,
      fields: [
        {name: "🫂 Members", value: `Humans: \`${members.real}\`\nBots: \`${members.bot}\``, inline: true,},
        { name: "💬 Channels", value: `🔊 Voice channels: \`${channels.voice}\`\n💬 Text Channels: \`${channels.text}\`\nCategories: \`${channels.category}\``, inline: true,},
        { name: "😃 Emojis", value: `Regular: \`${emojis.regular}\`\nAnimated: \`${emojis.animated}\``, inline: true,},
        { name: "👑 Roles", value: `Roles: \`${roles}\``, inline: true },
        { name: "🥳 Boosts", value: `Level: \`${interaction.channel.guild.premiumTier}\`\nCount: \`${interaction.channel.guild.premiumSubscriptionCount}\``, inline: true,},
      ],
    };

    if (interaction.channel.guild.banner)
      (serverInfoEmbed as any).image = {url: interaction.channel.guild.dynamicBannerURL("png", 4096),};

    if (icon) (serverInfoEmbed as any).thumbnail = { url: icon };

    return await interaction.createMessage({ embeds: [serverInfoEmbed] });
  },
};
