import colours from "../Structures/colours";
import Eris from "eris";
import * as db from "../Structures/Database";
import fs from "fs";
import Client from "../Structures/Bot";

module.exports = {
  name: "close",
  description: "Closes a ticket.",
  options: [
    {
        type: 3,
        name: "reason",
        description: "Reason for closing the ticket.",
        required: false,
    },
  ],
  async run(bot: Client, interaction: Eris.CommandInteraction<Eris.GuildTextableChannel>) {
    let ticketID = await db.fetch("SELECT * FROM ticket_data WHERE channel_id = $1", [interaction.channel.id]);

    let reason = "No reason provided.";

    if(interaction.data.options) reason = (interaction as any).data.options[0].value;

    if (ticketID.length <= 0) return interaction.createMessage({content: "This channel is not a ticket!", flags: 64});

    const now = Math.round((new Date()).getTime() / 1000);

    await db.modify("UPDATE ticket_data SET closed_by_id = $1 WHERE channel_id = $2", [interaction.member?.id, interaction.channel.id]);
    await db.modify("UPDATE ticket_data SET close_time = $1 WHERE channel_id = $2", [now.toString(), interaction.channel.id]);

    let ticketLogChannelID = await db.fetch("SELECT ticket_log_channel_id FROM tickets WHERE guild_id = $1", [interaction.channel.guild.id]);

  let ticketLogChannel: Eris.TextChannel = (bot as any).getChannel(ticketLogChannelID[0].ticket_log_channel_id);

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
          {name: "Ticket Closing Reason", value: `\`\`\`${reason}\`\`\``}
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

    await db.modify("DELETE FROM ticket_data WHERE channel_id = $1", [interaction.channel.id]);
    await interaction.createMessage("Ticket will be closed in 5 seconds.");
    setTimeout(async () => {
        await bot.deleteChannel(interaction.channel.id, "Ticket was closed.");
    }, 5000);
  },
};
