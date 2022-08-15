import colours from "../Structures/colours";
import Eris from "eris";
import * as db from "../Structures/Database";
import Client from "../Structures/Bot";

module.exports = {
  name: "warns",
  options: [
    {
      type: 1,
      name: "remove",
      description: "Remove a warning.",
      options: [
        {
          name: "id",
          required: true,
          description: "The ID of the warning which is to be removed.",
          type: 4,
        },
      ],
    },
    {
      type: 1,
      name: "reset",
      description: "Reset a member's warnings.",
      options: [
        {
          name: "member",
          required: true,
          description: "Whose warnings to reset",
          type: 6,
        },
      ],
    },
    {
      type: 1,
      name: "list",
      description: "List all warnings.",
    },
  ],
  description: "The warning system.",
  permission: BigInt(1 << 1),
  async run(bot: Client, interaction: Eris.CommandInteraction<Eris.GuildTextableChannel>) {
    switch ((interaction as any).data.options[0].name) {
      /*
      List command
      */
      case "list":
        await interaction.createMessage("Fetching data, this may take a while...");
        const listFetch = await db.fetch("SELECT * FROM warnings WHERE guild_id = $1;", [interaction.channel.guild.id,]);

        let listEmbed = {
          title: "Warnings in this server",
          color: colours.default,
          description: `Total warnings: ${listFetch.length}`,
          fields: []
        };

        let warnedUsers = await db.fetch("SELECT user_id FROM warnings WHERE guild_id = $1;", [interaction.channel.guild.id]);

        // Remove all duplicates
        const seen = new Set();
        warnedUsers = warnedUsers.filter((el: { user_id: any }) => {
          const duplicate = seen.has(el.user_id);
          seen.add(el.user_id);
          return !duplicate;
        });

        if (listFetch !== undefined) {
          for (let userID of warnedUsers) {
            let userWarns = await db.fetch("SELECT * FROM warnings WHERE user_id = $1 AND guild_id = $2;", [userID.user_id, interaction.channel.guild.id]);
            let user = interaction.channel.guild.members.get(userID.user_id) || await (interaction as any).channel.guild.fetchMembers({userIDs: [userID.user_id]});
            if (user instanceof Array) {
              user = user[0];
            }

            let userWarnText = "";
            for (const warning of userWarns) {
              userWarnText += `\nModerator: <@${warning.mod_id}>\nID: ${warning.id}\nReason: \`\`\`${warning.reason}\`\`\`\n`;
            }

            (listEmbed as any).fields.push({ name: `Warnings of ${user.username}#${user.discriminator}`, value: `Total: ${userWarns.length}\n${userWarnText}`, inline: false});
          }
        } else {
          listEmbed.description = "No warnings in this server.";
        }

        await interaction.editOriginalMessage({content: "", embeds: [listEmbed]});
        break;
      /*
      Remove command
      */
      case "remove":
        await db.modify("DELETE FROM warnings WHERE guild_id = $1 AND id = $2;", [interaction.channel.guild.id, (interaction as any).data.options[0].options[0].value,]);

        await interaction.createMessage(`Successfully removed warning ${(interaction as any).data.options[0].options[0].value}`);
        break;
      /*
      Reset command
      */
      case "reset":
        await db.modify("DELETE FROM warnings WHERE user_id = $1 AND guild_id = $2;", [(interaction as any).data.options[0].options[0].value, interaction.channel.guild.id]);

        await interaction.createMessage(`Successfully removed all warnings of <@${(interaction as any).data.options[0].options[0].value}>.`);
        break;
    }
  }
};
