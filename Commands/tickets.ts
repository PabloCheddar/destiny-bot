// TODO: Permissions stuff

import colours from "../Structures/colours";
import Eris from "eris";
import * as db from "../Structures/Database";
import Client from "../Structures/Bot";

module.exports = {
  name: "tickets",
  options: [
    {
        type: 1,
        name: "send",
        description: "Send the ticket creation embed.",
    },
    {
        type: 1,
        name: "supporters",
        description: "Define the ticket support roles.",
        options: [
            {
                type: 3,
                name: "supporter_roles",
                description: "The ticket support roles, each one is seperated by a ','.",
                required: true,
            },
        ],
    },
    {
        type: 1,
        name: "category",
        description: "Define the ticket category.",
        options: [
            {
                type: 7,
                name: "category",
                description: "The ticket category.",
                channel_types: [4],
                required: true,
            },
        ],
    },
    {
        type: 1,
        name: "log_channel",
        description: "Define the ticket log channel.",
        options: [
            {
                type: 7,
                name: "log_channel",
                description: "The ticket log channel.",
                channel_types: [0],
                required: true,
            },
        ],
    },
    {
        type: 1,
        name: "open_msg",
        description: "Define the ticket open message.",
        options: [
            {
                type: 3,
                name: "open_msg",
                description: "The ticket log channel.",
                required: true,
            },
        ],
    }
  ],
  permission: BigInt(1 << 5),
  description: "The ticket system.",
  async run(bot: Client, interaction: Eris.CommandInteraction<Eris.GuildTextableChannel>) {
    const ticketCreationEmbed = {
        title: "Ticket creation",
        description: "Press the button below to create a ticket.",
        color: colours.default
    };

    switch ((interaction as any).data.options[0].name) {
        case "send":
            interaction.createMessage({ content: "The embed has been created! If you haven't already make sure to define the required values using the other ticket commands, if you don't, it won't work.", flags: 64 })
            return interaction.channel.createMessage({
                embed: ticketCreationEmbed,
                components: [
                    {
                        type: 1,
                        components: [{ type: 2, label: "Create a ticket", style: 1, custom_id: "ticket_creation_button", disabled: false, emoji: {name: "✉️", id: null}}]
                    }
                ]
            });
        case "supporters":
            let supportRoles = (interaction as any).data.options[0].options[0].value;

            supportRoles = supportRoles.replace(/\s/g, "");

            supportRoles = supportRoles.replace(/</g, "");
            supportRoles = supportRoles.replace(/>/g, "");

            supportRoles = supportRoles.replace(/@&/g, "");

            supportRoles = supportRoles.split(",");

            let finalSupportRoles = "";

            for (let i = 0; i < supportRoles.length; i++) {
                let role = interaction.channel.guild.roles.find((r: { id: any }) => r.id === supportRoles[i]);

                if (role) {
                    finalSupportRoles += `${role.id},`;
                }
            }

            if (finalSupportRoles.length <= 0) {
                return interaction.createMessage("The given roles are invalid.");
            }

            const supportRolesExists = await db.fetch("SELECT * FROM tickets WHERE guild_id = $1", [interaction.channel.guild.id]);

            if (supportRolesExists.length <= 0) {
                const sql = "INSERT INTO tickets (guild_id, ticket_mod_roles) VALUES ($1, $2)";
                const binds = [interaction.channel.guild.id, finalSupportRoles];
                await db.modify(sql, binds);
            } else if (supportRolesExists.length > 0) {
                const sql = "UPDATE tickets SET ticket_mod_roles = $1 WHERE guild_id = $2";
                const binds = [finalSupportRoles, interaction.channel.guild.id];
                await db.modify(sql, binds);
            }

            await interaction.createMessage(`Successfully set the ticket support roles!`);
            break;

        case "category":
            let categoryID = (interaction as any).data.options[0].options[0].value;

            const category = bot.getChannel(categoryID);

            const categoryExists = await db.fetch("SELECT * FROM tickets WHERE guild_id = $1", [interaction.channel.guild.id]);

            if (categoryExists.length <= 0) {
                const sql = "INSERT INTO tickets (guild_id, ticket_category_id) VALUES ($1, $2)";
                const binds = [interaction.channel.guild.id, category.id];
                await db.modify(sql, binds);
            } else if (categoryExists.length > 0) {
                const sql = "UPDATE tickets SET ticket_category_id = $1 WHERE guild_id = $2";
                const binds = [category.id, interaction.channel.guild.id];
                await db.modify(sql, binds);
            }

            await interaction.createMessage("Successfully set the ticket category!");
            break;
        case "log_channel":
            let logChannelID = (interaction as any).data.options[0].options[0].value;

            const logChannel = bot.getChannel(logChannelID);

            const logChannelExists = await db.fetch("SELECT * FROM tickets WHERE guild_id = $1", [interaction.channel.guild.id]);

            if (logChannelExists.length <= 0) {
                const sql = "INSERT INTO tickets (guild_id, ticket_log_channel_id) VALUES ($1, $2)";
                const binds = [interaction.channel.guild.id, logChannel.id];
                await db.modify(sql, binds);
            } else if (logChannelExists.length > 0) {
                const sql = "UPDATE tickets SET ticket_log_channel_id = $1 WHERE guild_id = $2";
                const binds = [logChannel.id, interaction.channel.guild.id];
                await db.modify(sql, binds);
            }
            
            await interaction.createMessage("Successfully set the ticket log channel!");
            break;
            
            case "open_msg":
                let openMSG = (interaction as any).data.options[0].options[0].value;
    
                const openMSGExists = await db.fetch("SELECT * FROM tickets WHERE guild_id = $1", [interaction.channel.guild.id]);
    
                if (openMSGExists.length <= 0) {
                    const sql = "INSERT INTO tickets (guild_id, ticket_open_message) VALUES ($1, $2)";
                    const binds = [interaction.channel.guild.id, openMSG];
                    await db.modify(sql, binds);
                } else if (openMSGExists.length > 0) {
                    const sql = "UPDATE tickets SET ticket_open_message = $1 WHERE guild_id = $2";
                    const binds = [openMSG, interaction.channel.guild.id];
                    await db.modify(sql, binds);
                }
                
                await interaction.createMessage("Successfully set the ticket open message!");
                break;
    }
  },
};
