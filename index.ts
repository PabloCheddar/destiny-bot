import Eris from "eris";
import * as dotEnv from "dotenv";
import colours from "./Structures/colours";
import * as db from "./Structures/Database";
import fs from "fs";
import clicolours from "./Structures/CLIColors";
import Client from "./Structures/Bot";
dotEnv.config();

const bot = new Client(`Bot ${(process.env.TOKEN as string)}`, {
  maxShards: "auto",
  getAllUsers: true,
  intents: [
    "guilds",
    "guildMessages",
    "guildMembers",
    "guildEmojisAndStickers",
    "directMessages",
    "guildPresences",
    "guildMessageReactions"
  ],
  autoreconnect: true,
  devMode: true,
  testingGuildID: "943824727242321980"
});

["commandHandler"].forEach(async (handler) => {
  const handlerFunc = await import(`./Handlers/${handler}`);
  handlerFunc.default(bot);
});

bot.on("ready", async () => {
  bot.editStatus("online", { name: `${bot.guilds.size} servers`, type: 3 });

  console.log(`${clicolours.brightGreen}[INFO]${clicolours.reset} Successfully connected to Discord API. Logged in as ${bot.user.username}#${bot.user.discriminator}\nActive on ${bot.guilds.size} servers.`);

  for (const cmd of bot.commands) {
    let command = bot.commands.get(cmd[0]);

    if (bot.devMode === true) {
      const guildCommandID = await (bot as any).createGuildCommand(bot.testingGuildID, { 
        name: command.name,
        description: command.description,
        options: command.options || undefined,
        type: 1,
        default_member_permissions: command.default_member_permissions
      });
      command.ID = guildCommandID.id;
      bot.commands.set(command.name, command);

      console.log(`${clicolours.brightGreen}[INFO]${clicolours.reset} Created guild application command "${command.name}".`);

    } else if (bot.devMode === false) {
      const commandID = await (bot as any).createCommand({
        name: command.name,
        description: command.description,
        options: command.options || undefined,
        type: 1,
        default_member_permissions: command.default_member_permissions
      });
      command.ID = commandID.id;
      bot.commands.set(command.name, command);

      console.log(`${clicolours.brightGreen}[INFO]${clicolours.reset} Created "${command.name}" application command.`);
    }
  }
});

bot.on("shardReady", (id) => {
  console.log(`${clicolours.brightGreen}[INFO]${clicolours.reset} Shard ${id} ready!`);
});

// Slash-command handler
bot.on("interactionCreate", async (interaction: Eris.Interaction) => {
//######################################################
//##                Command Handling                  ##
//######################################################
if ((interaction instanceof Eris.CommandInteraction)) {
  const command = bot.commands.get(interaction.data.name);

  const permission = command.permission;

  if (command && permission) {
    let permissionString = new Eris.Permission(permission);
    permissionString.toString();
    if (interaction.member?.permissions.has(permission)) await command.run(bot, interaction);
    else return interaction.createMessage({ content: `You are missing the following permission: ${permissionString}\n\nIf you think this is a mistake, please contact the bot's developer.`, flags: 64});
  } else if (command && !permission) {
    await command.run(bot, interaction);
  }
}
//######################################################
//##                 Ticket System                    ##
//######################################################

if (interaction instanceof Eris.ComponentInteraction) {
  const options = [
    { label: "Support", value: "support", description: "Your ticket will be about support.", emoji: {name: "⛑", id:null} },
    { label: "Question", value: "question", description: "Your ticket will be about a question.", emoji: {name: "❓", id: null} },
    { label: "Report", value: "report", description: "Your ticket will be about a report.", emoji: { name: "♻", id: null} },
    { label: "Application", value: "application", description: "Your ticket will be about an application.", emoji: { name: "🎯", id: null} }
  ];

  if (interaction.data.custom_id === "ticket_creation_button") {
    const ticketCreationReasonEmbed = {
      title: "Ticket creation reason",
      description: "Please choose the reason for creating this ticket.",
      color: colours.default,
    };
    
    await interaction.createMessage({
      embeds: [ticketCreationReasonEmbed],
      components: [
        { type: 1, components: [ { type: 3, options: options, custom_id: "ticket_creation_reason_dropdown", min_values: 1, max_values: 1} ] },
      ], 
      flags: 64
    });
  } else if (interaction.data.custom_id === "ticket_creation_reason_dropdown") {
    await interaction.deferUpdate();

    let ticketCategoryID = await db.fetch("SELECT ticket_category_id FROM tickets WHERE guild_id = $1", [ interaction.channel.guild.id ]);
    let ticketOpenMessage = await db.fetch("SELECT ticket_open_message FROM tickets WHERE guild_id = $1", [ interaction.channel.guild.id ]);

    let ticketCategory = bot.getChannel(ticketCategoryID[0].ticket_category_id);

    if (!ticketOpenMessage[0].ticket_open_message) {
      const openMSGExists = await db.fetch("SELECT * FROM tickets WHERE guild_id = $1", [interaction.channel.guild.id]);

      if (openMSGExists.lenth <= 0) {
        const sql = "INSERT INTO tickets (guild_id, ticket_open_message) VALUES ($1, $2)";
        const binds = [interaction.channel.guild.id, "Moderators will soon be with you, please wait."];
        await db.modify(sql, binds);
      } else if (openMSGExists.length > 0) {
        const sql = "UPDATE tickets SET ticket_open_message = $1 WHERE guild_id = $2";
        const binds = ["Moderators will soon be with you, please wait.", interaction.channel.guild.id];
        await db.modify(sql, binds);
    }

      ticketOpenMessage = await db.fetch("SELECT ticket_open_message FROM tickets WHERE guild_id = $1", [ interaction.channel.guild.id ]);
    }

    let ticketCreationEmbed = {
      title: "Your Ticket",
      description: ticketOpenMessage[0].ticket_open_message,
      color: colours.default
    };

    let ticketChannel = await bot.createChannel(interaction.channel.guild.id, `ticket-${interaction.member?.username}`, 0, { parentID: ticketCategory.id });

    const now = Math.round((new Date()).getTime() / 1000);

    await ticketChannel.createMessage({ embeds: [ticketCreationEmbed], 
    components: [
      { type: 1, components: [ { type: 2, label: "Close Ticket", style: 1, custom_id: "ticket_close_button", disabled: false } ] }
    ]});

    await ticketChannel.editPermission((interaction.member?.id as string), 0x0000000000000400, 0x0000010000000000, 1, "PLACEHOLDER");

    let ticketBinds = [ interaction.channel.guild.id, ticketChannel.id, ticketChannel.name, interaction.member?.id, now.toString(), (interaction as any).data.values[0] ];
    await db.modify("INSERT INTO ticket_data(guild_id, channel_id, name, creator_id, open_time, ticket_open_reason) VALUES($1,$2,$3,$4,$5,$6);", ticketBinds);

    await (interaction as any).editParent({ embeds: null, content: `Your new ticket has been created! Check it out at <#${ticketChannel.id}>`, 
    components: [
      { type: 1, components: [ { type: 3, options: options, custom_id: "ticket_creation_reason_dropdown", min_values: 1, max_values: 1, disabled: true } ] },
    ]});
    const ticketLogChannelID = await db.fetch("SELECT ticket_log_channel_id FROM tickets WHERE guild_id = $1", [interaction.channel.guild.id]);

    const ticketLogChannel: Eris.TextChannel = await (bot as any).getChannel(ticketLogChannelID[0].ticket_log_channel_id);

    if (ticketLogChannel) {
      const newTicketCreatedEmbed = {
        title: "New ticket has been opened",
        color: colours.default,
        fields: [
          { name: "Creator", value: `<@!${interaction.member?.id}>` },
          { name: "Channel", value: `<#${ticketChannel.id}>` },
          { name: "Opened at", value: `<t:${now}>` },
          { name: "Creation Reason", value: (interaction as any).data.values[0] }
        ]
      };

      await ticketLogChannel.createMessage({embeds: [ newTicketCreatedEmbed ]});
    }

  } else if (interaction.data.custom_id === "ticket_close_button") {
    const now = Math.round((new Date()).getTime() / 1000);

    await db.modify("UPDATE ticket_data SET closed_by_id = $1 WHERE channel_id = $2", [interaction.member?.id, interaction.channel.id]);
    await db.modify("UPDATE ticket_data SET close_time = $1 WHERE channel_id = $2", [now.toString(), interaction.channel.id]);

    let ticketLogChannelID = await db.fetch("SELECT ticket_log_channel_id FROM tickets WHERE guild_id = $1", [interaction.channel.guild.id]);

    let ticketLogChannel: Eris.TextChannel = (bot as any).getChannel(ticketLogChannelID[0].ticket_log_channel_id);

    await interaction.deferUpdate();

    if (ticketLogChannel) {
      let ticketData = await db.fetch("SELECT * FROM ticket_data WHERE channel_id = $1", [interaction.channel.id]);
      let ticketDeletionEmbed = {
          title: "Ticket has been closed",
          fields: [
              {name: "Ticket Name", value: `${ticketData[0].name}`},
              {name: "Ticket Creator", value: `<@${ticketData[0].creator_id}>`},
              {name: "Ticket Creation Reason", value: `${ticketData[0].ticket_open_reason}`},
              {name: "Ticket Creation Time", value: `<t:${ticketData[0].open_time}>`},
              {name: "Ticket Closer", value: `<@${ticketData[0].closed_by_id}>`},
              {name: "Ticket Closing Time", value: `<t:${now}>`},
              {name: "Ticket Closing Reason", value: `\`\`\`No reason provided.\`\`\``}
          ],
          color: colours.default
      }
      
      if (ticketData[0].transcript) {
        fs.writeFile(`./tmp/ticket-${ticketData[0].channel_id}.txt`, ticketData[0].transcript, async () => {
          await ticketLogChannel.createMessage({ embeds: [ticketDeletionEmbed] }, {file: fs.readFileSync(`./tmp/ticket-${ticketData[0].channel_id}.txt`), name: `ticket-${interaction.member?.username}.txt`});
          fs.unlinkSync(`./tmp/ticket-${ticketData[0].channel_id}.txt`)
        });
      } else {
        await ticketLogChannel.createMessage({ embeds: [ticketDeletionEmbed] });
      }
    }

    await db.modify("DELETE FROM ticket_data WHERE channel_id = $1", [interaction.channel.id]);
    await interaction.createMessage("Ticket will be closed in 5 seconds.");
    setTimeout(async () => {
        await bot.deleteChannel(interaction.channel.id, "Ticket was closed.");
    }, 5000);
  }
}
});

bot.on("messageReactionAdd", async (message:Eris.Message, emoji: { name: string; id: string}, reactor: Eris.User) => {
  if (emoji.id !== null) {
    emoji.name = `<:${emoji.name}:${emoji.id}>`;
  }
  let reactionRole = await db.fetch("SELECT * FROM reaction_roles WHERE message_id = $1 AND emoji = $2;", [message.id, emoji.name]);

  if (reactionRole.length > 0) {
    reactionRole = reactionRole[0];
    const role: Eris.Role = (message as any).channel.guild.roles.get(reactionRole.role_id);

    if (role) {
      let member: Eris.Member = (message as any).channel.guild.members.get(reactor.id) ||await (message as any).channel.guild.fetchMembers({ userIDs: [reactor.id] });

      if (member instanceof Array) {
        member = member[0];
      }

      if (member) {
        member.addRole(role.id, "Reaction role added.").catch(async () => {
          let DMChannel = await member.user.getDMChannel();

          DMChannel.createMessage(`The bot was unable to add the \`${role.name}\` reaction role to you. This usually happens because the bot doesn't have necessary permissions.\n\nPlease contact the guild owner to resolve this.`).catch(() => {});
        });
      }
    }
  }
});

bot.on("messageReactionRemove", async (message:Eris.Message, emoji: { name: string; id: string}, userID: string) => {
  if (emoji.id !== null) {
    emoji.name = `<:${emoji.name}:${emoji.id}>`;
  }
  let reactionRole = await db.fetch("SELECT * FROM reaction_roles WHERE message_id = $1 AND emoji = $2;", [message.id, emoji.name]);

  if (reactionRole.length > 0) {
    reactionRole = reactionRole[0];
    let role: Eris.Role = (message as any).channel.guild.roles.get(reactionRole.role_id);

    if (role) {
      let member: Eris.Member = (message as any).channel.guild.members.get(userID) || await (message as any).channel.guild.fetchMembers({ userIDs: [userID] });

      if (member instanceof Array) {
        member = member[0];
      }

      if (member) {
        member.removeRole(role.id, "Reaction role added.").catch(async () => {
          let DMChannel = await member.user.getDMChannel();

          DMChannel.createMessage(`The bot was unable to remove the \`${role.name}\` reaction role from you. This usually happens because the bot doesn't have necessary permissions.\n\nPlease contact the guild owner to resolve this.`).catch(() => {});
        });
      }
    }
  }
});

bot.on("messageCreate", async (message: Eris.Message) => {
  let ticketChannelID = await db.fetch("SELECT channel_id FROM ticket_data WHERE channel_id = $1", [message.channel.id]);

  if (ticketChannelID.length > 0) {
    let ticketTranscript = await db.fetch("SELECT transcript FROM ticket_data WHERE channel_id = $1", [message.channel.id]);
    ticketTranscript = ticketTranscript[0].transcript;

    if(!ticketTranscript) ticketTranscript = `Transcript of ${(message as any).channel.name}`;

    ticketTranscript += `\n[Message from ${(message as any).member?.username + (message as any).member?.discriminator}, Creation Time: ${message.createdAt}]\n${message.content}`;

    await db.modify("UPDATE ticket_data SET transcript = $1 WHERE channel_id = $2", [ ticketTranscript, message.channel.id]);
  }
});

bot.on("channelDelete", async (channel: Eris.AnyChannel) => {
  let isTicket = await db.fetch("SELECT * FROM ticket_data WHERE channel_id = $1", [channel.id]);

  if (isTicket.length <= 0) return;

  const now = Math.round((new Date()).getTime() / 1000);

  await db.modify("UPDATE ticket_data SET closed_by_id = $1 WHERE channel_id = $2", [0, channel.id]);
  await db.modify("UPDATE ticket_data SET close_time = $1 WHERE channel_id = $2", [now.toString(), channel.id]);

  let ticketLogChannelID = await db.fetch("SELECT ticket_log_channel_id FROM tickets WHERE guild_id = $1", [(channel as any).guild.id]);

  let ticketLogChannel: Eris.TextChannel = (bot as any).getChannel(ticketLogChannelID[0].ticket_log_channel_id);

  if (ticketLogChannel) {
    let ticketData = await db.fetch("SELECT * FROM ticket_data WHERE channel_id = $1", [channel.id]);
    let ticketDeletionEmbed = {
      title: "Ticket has been closed",
      fields: [
          {name: "Ticket Name", value: `${ticketData[0].name}`},
          {name: "Ticket Creator", value: `<@${ticketData[0].creator_id}>`},
          {name: "Ticket Creation Reason", value: `${ticketData[0].ticket_open_reason}`},
          {name: "Ticket Creation Time", value: `<t:${ticketData[0].open_time}>`},
          {name: "Ticket Closer", value: `<@${ticketData[0].closed_by_id}>`},
          {name: "Ticket Closing Time", value: `<t:${now}>`},
          {name: "Ticket Closing Reason", value: `\`\`\`No reason provided.\`\`\``}
      ],
      color: colours.default
    }
    
    if (ticketData[0].transcript) {
      fs.writeFile(`./tmp/ticket-${ticketData[0].channel_id}.txt`, ticketData[0].transcript, async () => {
        await ticketLogChannel.createMessage({ embeds: [ticketDeletionEmbed] }, {file: fs.readFileSync(`./tmp/ticket-${ticketData[0].channel_id}.txt`), name: `ticket-transcript.txt`});
        fs.unlinkSync(`./tmp/ticket-${ticketData[0].channel_id}.txt`)
      });
    } else {
      await ticketLogChannel.createMessage({ embeds: [ticketDeletionEmbed] });
    }
  }

  await db.modify("DELETE FROM ticket_data WHERE channel_id = $1", [channel.id]);
});

bot.connect();