import colours from "../Structures/colours";
import Eris from "eris";
import Client from "../Structures/Bot";

module.exports = {
  name: "userinfo",
  options: [
    {
      name: "member",
      description: "The member to get information about",
      type: 6,
      required: true,
    },
  ],
  description: "Returns information about a member.",
  async run(bot: Client, interaction: Eris.CommandInteraction<Eris.GuildTextableChannel>) {
    if (!interaction.data.options) return await interaction.createMessage("Required Argument 'member' missing.");
    let member = interaction.channel.guild.members.get((interaction as any).data.options[0].value) || await (interaction as any).channel.guild.fetchMembers({userIDs: [(interaction as any).data.options[0].value]});

    if (member instanceof Array) {
      member = member[0];
    }

    let roles = "@everyone";
    let avatar = member.user.dynamicAvatarURL("png", 4096) || member.defaultAvatarURL;
    const nickname = member.nick || "None";
    const createdAt = Math.round(member.createdAt / 1000);
    const joinedAt = Math.round(member.joinedAt / 1000);
    let status = member.status || "Offline";
    if (status) status = status.charAt(0).toUpperCase() + status.slice(1);
    let activity;

    for (const role_id of member.roles) {
      roles += ` <@&${role_id}>`;
    }

    if (member.activities !== undefined && member.activities.length > 0) {
      activity = {
        name: member.activities[0].name,
        type: member.activities[0].type,
      };
      if (activity.type === 4) activity.name = member.activities[0].state;

      if (activity.type === 0) activity.type = "Playing";
      else if (activity.type === 1) activity.type = "Streaming";
      else if (activity.type === 2) activity.type = "Listening";
      else if (activity.type === 3) activity.type = "Watching";
      else if (activity.type === 4) activity.type = "Custom";
      else if (activity.type === 5) activity.type = "Competing in";
    }

    let userInfoEmbed = {
      author: {
        name: `${member.username}#${member.discriminator} - ${nickname}`,
      },
      thumbnail: { url: avatar },
      fields: [
        { name: "🆔", value: `\`${member.id}\``, inline: true },
        { name: "🕘Account Creation Date", value: `<t:${createdAt}>`, inline: true,},
        { name: `🕒Join Date`, value: `<t:${joinedAt}>`, inline: true },
        { name: "👑 Roles", value: `${roles}`, inline: true },
        { name: "🚦 Status", value: `${status}`, inline: true },
      ],
      color: colours.default,
    };

    if (activity === undefined) {
      userInfoEmbed.fields.push({ name: "⚾ Activity", value: `None`, inline: true});
    } else if (activity !== undefined) {
      userInfoEmbed.fields.push({ name: "⚾ Activity", value: `${activity.type}: ${activity.name}`, inline: true});
    }

    await interaction.createMessage({ embeds: [userInfoEmbed] });
  },
};
