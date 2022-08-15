import colours from "../Structures/colours";
import Eris from "eris";
import * as db from "../Structures/Database";
import Client from "../Structures/Bot";

// TODO: Permissions stuff

module.exports = {
  name: "reactions",
  options: [
    {
      type: 1,
      name: "add",
      description: "Add a reaction role.",
      options: [
        {
          name: "message_id",
          required: true,
          description: "The message's ID.",
          type: 3,
        },
        {
          name: "role",
          required: true,
          description: "The role to add on reaction.",
          type: 8,
        },
        {
          name: "emoji",
          required: true,
          description: "The emoji to use.",
          type: 3,
        }
      ],
    },
    {
      type: 1,
      name: "list",
      description: "List all reaction roles.",
    },
    {
      type: 1,
      name: "remove",
      description: "Remove a reaction role.",
      options: [
        {
          name: "message_id",
          required: true,
          description: "The message's ID.",
          type: 3,
        },
        {
          name: "emoji",
          required: true,
          description: "The emoji of the reaction role.",
          type: 3
        }
      ]
    }
  ],
  permission: BigInt(1 << 28 | 	1 << 1),
  description: "Reaction role system",
  async run(bot: Client, interaction: Eris.CommandInteraction<Eris.GuildTextableChannel>) {
    switch ((interaction as any).data.options[0].name) {
      case "add":
        const exists = await db.fetch("SELECT * FROM reaction_roles WHERE message_id = $1 AND emoji = $2;", [(interaction as any).data.options[0].options[0].value, interaction.channel.guild.id]);
        
        if (exists.length > 0) {
          await interaction.createMessage("This reaction role has already been set.");
          return;
        }

        let message = await bot.getMessage(interaction.channel.id, (interaction as any).data.options[0].options[0].value);
        if (!message) {
          await interaction.createMessage("Message not found.");
          return;
        }

        let roleID = (interaction as any).data.options[0].options[1].value;
        let emoji = (interaction as any).data.options[0].options[2].value;

        // Check if the emoji starts with <: and ends with >
        if (emoji.startsWith("<:") && emoji.endsWith(">")) {
          // Replace the <: and > with nothing
          emoji = emoji.replace(/<:/g, "").replace(/>/g, "");
        }

        await db.modify("INSERT INTO reaction_roles(guild_id, message_id, role_id, emoji) VALUES ($1, $2, $3, $4);", [interaction.channel.guild.id, message.id, roleID, (interaction as any).data.options[0].options[2].value]);

        await message.addReaction(emoji);
        await interaction.createMessage("Reaction role added.");
        break;

      case "list":
        const fetchedReactionRoles = await db.fetch("SELECT * FROM reaction_roles WHERE guild_id = $1;", [interaction.channel.guild.id]);

        let reactionListEmbed = {
          "title": "Reaction roles in this server",
          "colour": colours.default,
          "description": ""
        }
        if (fetchedReactionRoles.length > 0) {
          for (let reaction_role of fetchedReactionRoles) {
            reactionListEmbed.description += `\nMessage ID: ${reaction_role.message_id}\nRole: <@&${reaction_role.role_id}>\nEmoji: ${reaction_role.emoji}\n`;
          }
        } else {
          reactionListEmbed.description = "No reaction roles have been added.";
        }

        await interaction.createMessage({embeds: [reactionListEmbed]});
        break;
      
      case "remove":
        let msg;
        const existsRemove = await db.fetch("SELECT * FROM reaction_roles WHERE message_id = $1 AND emoji = $2;", [(interaction as any).data.options[0].options[0].value, (interaction as any).data.options[0].options[1].value]);

        if (existsRemove.length === 0) {
          await interaction.createMessage("This reaction role does not exist.");
          return;
        }

        await db.modify("DELETE FROM reaction_roles WHERE message_id = $1 AND emoji = $2;", [(interaction as any).data.options[0].options[0].value, (interaction as any).data.options[0].options[1].value]);

        try {
          msg = await bot.getMessage(interaction.channel.id, (interaction as any).data.options[0].options[0].value);
        } catch(err) {
          () => {};
        }

        if (msg) {
          let emoji = (interaction as any).data.options[0].options[1].value;

          // Check if the emoji starts with <: and ends with >
          if (emoji.startsWith("<:") && emoji.endsWith(">")) {
            // Replace the <: and > with nothing
            emoji = emoji.replace(/<:/g, "").replace(/>/g, "");
          }

          await msg.removeReaction(emoji);
        }
        await interaction.createMessage("Successfully removed reaction role.");
        break;
      }
  },
};
