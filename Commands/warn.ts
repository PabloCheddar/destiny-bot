import Eris from "eris";
import colours from "../Structures/colours";
import * as db from "../Structures/Database";
import Client from "../Structures/Bot";

module.exports = {
  name: "warn",
  options: [
    {
      name: "member",
      required: true,
      description: "The member to warn",
      type: 6,
    },
    {
      name: "reason",
      required: false,
      description: "The reason for the warning",
      type: 3,
    },
  ],
  description: "Warns a member.",
  permission: BigInt(1 << 1),
  async run(bot: Client, interaction: Eris.CommandInteraction<Eris.GuildTextableChannel>) {
    let prevWarnID = await db.fetch("SELECT id FROM warnings ORDER BY id DESC LIMIT 1;");

    if (prevWarnID.length === 0) {
      prevWarnID = [{ id: "-1" }];
    }

    const nextWarnID = parseInt(prevWarnID[0].id) + 1;

    let reason;

    if (!(interaction as any).data.options[1]) {
      reason = "No reason given.";
    } else {
      reason = (interaction as any).data.options[1].value;
    }

    await db.modify("INSERT INTO warnings VALUES($1,$2,$3,$4,$5)", [
      interaction.channel.guild.id,
      (interaction as any).data.options[0].value,
      interaction.member?.id,
      reason,
      nextWarnID,
    ]);

    let member = bot.users.get((interaction as any).data.options[0].value);

    let warnEmbed = {
      title: "<a:warning_emoji:1002313405325135922> Warning",
      description: `You have been warned on \`${interaction.channel.guild.name}\` for: \`\`\`${reason}\`\`\``,
      color: colours.warn
    }

    try {
      let DMChannel = await member!.getDMChannel();

      DMChannel.createMessage({ embeds: [warnEmbed] });
    } catch (err) {}
    
    await interaction.createMessage({ content: `Successfully warned <@${(interaction as any).data.options[0].value}>! Reason: \`\`\`${reason}\`\`\``, flags: 64 })
  }
};
