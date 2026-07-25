const { V2 } = require('../../spinning_core/lib/ui');

async function executeModAction(interaction, runtime, action, warningsTable) {
  if (!V2.hasAdminOrOwner(interaction.member, runtime)) {
    return V2.reply(interaction, V2.error('You need Administrator permission.'), true);
  }

  const targetUser = interaction.options.getUser('user');
  const reason = interaction.options.getString('reason') || 'No reason provided';
  const member = await interaction.guild.members.fetch(targetUser.id).catch(() => null);

  if (!member) {
    return V2.reply(interaction, V2.error('User not found in this server.'), true);
  }

  const moderator = interaction.member;

  if (action === 'ban') {
    if (!moderator.permissions.has('BanMembers')) {
      return V2.reply(interaction, V2.error('You need Ban Members permission.'), true);
    }
    if (!member.bannable) {
      return V2.reply(interaction, V2.error('I cannot ban this user. Check role hierarchy.'), true);
    }
    await member.ban({ reason });
    const container = V2.container('#ED4245', [
      V2.text('## Moderation Action'),
      V2.separator(),
      V2.text(`**Banned** <@${targetUser.id}>`),
      V2.text(`**Reason:** ${reason}`),
      V2.text(`**By:** <@${moderator.id}>`)
    ]);
    await V2.reply(interaction, container);
  }

  else if (action === 'kick') {
    if (!moderator.permissions.has('KickMembers')) {
      return V2.reply(interaction, V2.error('You need Kick Members permission.'), true);
    }
    if (!member.kickable) {
      return V2.reply(interaction, V2.error('I cannot kick this user. Check role hierarchy.'), true);
    }
    await member.kick(reason);
    const container = V2.container('#FEE75C', [
      V2.text('## Moderation Action'),
      V2.separator(),
      V2.text(`**Kicked** <@${targetUser.id}>`),
      V2.text(`**Reason:** ${reason}`),
      V2.text(`**By:** <@${moderator.id}>`)
    ]);
    await V2.reply(interaction, container);
  }

  else if (action === 'timeout') {
    const minutes = interaction.options.getInteger('minutes');
    const ms = minutes * 60 * 1000;
    await member.timeout(ms, reason);
    const container = V2.container('#FEE75C', [
      V2.text('## Moderation Action'),
      V2.separator(),
      V2.text(`**Timed out** <@${targetUser.id}> for **${minutes} minute(s)**`),
      V2.text(`**Reason:** ${reason}`),
      V2.text(`**By:** <@${moderator.id}>`)
    ]);
    await V2.reply(interaction, container);
  }

  else if (action === 'warn') {
    warningsTable.insert({
      userId: targetUser.id,
      guildId: interaction.guildId,
      moderatorId: moderator.id,
      reason,
      timestamp: Date.now()
    });
    const count = warningsTable.find({ userId: targetUser.id, guildId: interaction.guildId }).length;
    const container = V2.container('#FEE75C', [
      V2.text('## Moderation Action'),
      V2.separator(),
      V2.text(`**Warned** <@${targetUser.id}>`),
      V2.text(`**Reason:** ${reason}`),
      V2.text(`**By:** <@${moderator.id}>`),
      V2.text(`**Total Warnings:** ${count}`)
    ]);
    await V2.reply(interaction, container);
  }
}

module.exports = { executeModAction };
