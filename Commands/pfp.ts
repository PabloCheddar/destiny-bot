import colours from "../Structures/colours";
import Eris from "eris";
import Client from "../Structures/Bot";

module.exports = {
  name: "pfp",
  options: [
    {
        name: "member",
        required: true,
        description: "The member whose profile picture you want.",
        type: 6,
    }
  ],
  description: "Shows a member's profile picture.",
  async run(bot: Client, interaction: Eris.CommandInteraction<Eris.GuildTextableChannel>) {
    const memberID = (interaction as any).data.options[0].value;
    let member = interaction.channel.guild.members.get(memberID) || await (interaction as any).channel.guild.fetchMembers({userIDs: [memberID]});
    if (member instanceof Array) {
      member = member[0];
    }

    let avatar = member?.user.dynamicAvatarURL("png", 4096) || member?.defaultAvatarURL;

    const pfpEmbed = {
      title: `Profile picture of ${member?.user.username}`,
      color: colours.default,
      image: { url: avatar }
    }

    await interaction.createMessage({ embeds: [ pfpEmbed ] })
  }
};
