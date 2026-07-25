const { V2 } = require('../../spinning_core/lib/ui');
const { Database, Table } = require('../../../lib/db');

const db = new Database();
const loggingTable = new Table(db, 'logging');

function getLogConfig(guildId) {
  return loggingTable.findOne({ guildId }) || {
    guildId,
    enabled: false,
    channels: {}
  };
}

function getLogChannel(runtime, guild, type = 'default') {
  const config = getLogConfig(guild.id);
  if (!config.enabled) return null;

  const channelId = config.channels?.[type] || config.channels?.default || config.defaultChannel;
  if (!channelId) return null;

  return guild.channels.cache.get(channelId) || null;
}

async function logMemberJoin(member, runtime) {
  const channel = getLogChannel(runtime, member.guild, 'member');
  if (!channel) return;

  const created = `<t:${Math.floor(member.user.createdTimestamp / 1000)}:R>`;
  const age = Math.floor((Date.now() - member.user.createdTimestamp) / 86400000);

  const container = V2.container('#57F287', [
    V2.text('## Member Joined'),
    V2.separator(),
    V2.text(`**User:** <@${member.id}> (${member.user.tag})`),
    V2.text(`**Account Created:** ${created} (${age} days ago)`),
    V2.text(`**Members:** ${member.guild.memberCount}`)
  ]);

  await channel.send({ components: [container], flags: V2.FLAG }).catch(() => {});
}

async function logMemberRemove(member, runtime) {
  const channel = getLogChannel(runtime, member.guild, 'member');
  if (!channel) return;

  const roles = member.roles.cache.filter(r => r.id !== member.guild.id).map(r => `<@&${r.id}>`);
  const roleText = roles.length > 0 ? roles.slice(0, 10).join(', ') + (roles.length > 10 ? ` +${roles.length - 10} more` : '') : 'None';

  const container = V2.container('#ED4245', [
    V2.text('## Member Left'),
    V2.separator(),
    V2.text(`**User:** <@${member.id}> (${member.user.tag})`),
    V2.text(`**Members:** ${member.guild.memberCount}`),
    V2.text(`**Roles:** ${roleText}`)
  ]);

  await channel.send({ components: [container], flags: V2.FLAG }).catch(() => {});
}

async function logBanAdd(ban, runtime) {
  const channel = getLogChannel(runtime, ban.guild, 'mod');
  if (!channel) return;

  const container = V2.container('#ED4245', [
    V2.text('## Member Banned'),
    V2.separator(),
    V2.text(`**User:** <@${ban.user.id}> (${ban.user.tag})`),
    V2.text(`**Reason:** ${ban.reason || 'No reason'}`)
  ]);

  await channel.send({ components: [container], flags: V2.FLAG }).catch(() => {});
}

async function logBanRemove(ban, runtime) {
  const channel = getLogChannel(runtime, ban.guild, 'mod');
  if (!channel) return;

  const container = V2.container('#57F287', [
    V2.text('## Member Unbanned'),
    V2.separator(),
    V2.text(`**User:** <@${ban.user.id}> (${ban.user.tag})`)
  ]);

  await channel.send({ components: [container], flags: V2.FLAG }).catch(() => {});
}

async function logRoleCreate(role, runtime) {
  const channel = getLogChannel(runtime, role.guild, 'server');
  if (!channel) return;

  const container = V2.container(V2.config.brand_color, [
    V2.text('## Role Created'),
    V2.separator(),
    V2.text(`**Name:** <@&${role.id}>`),
    V2.text(`**Color:** ${role.hexColor}`),
    V2.text(`**Mentionable:** ${role.mentionable ? 'Yes' : 'No'}`)
  ]);

  await channel.send({ components: [container], flags: V2.FLAG }).catch(() => {});
}

async function logRoleDelete(role, runtime) {
  const channel = getLogChannel(runtime, role.guild, 'server');
  if (!channel) return;

  const container = V2.container('#ED4245', [
    V2.text('## Role Deleted'),
    V2.separator(),
    V2.text(`**Name:** ${role.name}`),
    V2.text(`**Color:** ${role.hexColor}`)
  ]);

  await channel.send({ components: [container], flags: V2.FLAG }).catch(() => {});
}

async function logChannelCreate(channel, runtime) {
  const logCh = getLogChannel(runtime, channel.guild, 'server');
  if (!logCh) return;

  const type = { 0: 'Text', 2: 'Voice', 4: 'Category' }[channel.type] || 'Other';
  const container = V2.container(V2.config.brand_color, [
    V2.text('## Channel Created'),
    V2.separator(),
    V2.text(`**Name:** <#${channel.id}>`),
    V2.text(`**Type:** ${type}`)
  ]);

  await logCh.send({ components: [container], flags: V2.FLAG }).catch(() => {});
}

async function logChannelDelete(channel, runtime) {
  const logCh = getLogChannel(runtime, channel.guild, 'server');
  if (!logCh) return;

  const type = { 0: 'Text', 2: 'Voice', 4: 'Category' }[channel.type] || 'Other';
  const container = V2.container('#ED4245', [
    V2.text('## Channel Deleted'),
    V2.separator(),
    V2.text(`**Name:** ${channel.name}`),
    V2.text(`**Type:** ${type}`)
  ]);

  await logCh.send({ components: [container], flags: V2.FLAG }).catch(() => {});
}

async function logVoiceState(oldState, newState, runtime) {
  const guild = oldState.guild;
  const logCh = getLogChannel(runtime, guild, 'voice');
  if (!logCh) return;

  const member = newState.member;
  if (!member || member.user.bot) return;

  const joined = !oldState.channel && newState.channel;
  const left = oldState.channel && !newState.channel;
  const switched = oldState.channel && newState.channel && oldState.channel.id !== newState.channel.id;

  let container;
  if (joined) {
    container = V2.container('#57F287', [
      V2.text('## Voice Joined'),
      V2.separator(),
      V2.text(`**User:** <@${member.id}>`),
      V2.text(`**Channel:** <#${newState.channel.id}>`)
    ]);
  } else if (left) {
    container = V2.container('#ED4245', [
      V2.text('## Voice Left'),
      V2.separator(),
      V2.text(`**User:** <@${member.id}>`),
      V2.text(`**Channel:** <#${oldState.channel.id}>`)
    ]);
  } else if (switched) {
    container = V2.container(V2.config.brand_color, [
      V2.text('## Voice Switched'),
      V2.separator(),
      V2.text(`**User:** <@${member.id}>`),
      V2.text(`**From:** <#${oldState.channel.id}> → **To:** <#${newState.channel.id}>`)
    ]);
  } else {
    return;
  }

  await logCh.send({ components: [container], flags: V2.FLAG }).catch(() => {});
}

async function logMessageEdit(oldMessage, newMessage, runtime) {
  const channel = getLogChannel(runtime, newMessage.guild, 'message');
  if (!channel) return;

  const oldContent = oldMessage.content || '*empty*';
  const newContent = newMessage.content || '*empty*';

  const container = V2.container(V2.config.brand_color, [
    V2.text('## Message Edited'),
    V2.separator(),
    V2.text(`**Author:** <@${oldMessage.author.id}>`),
    V2.text(`**Channel:** <#${oldMessage.channel.id}>`),
    V2.separator(),
    V2.text(`**Before:**\n${oldContent.slice(0, 500)}`),
    V2.text(`**After:**\n${newContent.slice(0, 500)}`)
  ]);

  await channel.send({ components: [container], flags: V2.FLAG }).catch(() => {});
}

async function logMessageDelete(message, runtime) {
  const channel = getLogChannel(runtime, message.guild, 'message');
  if (!channel) return;

  const content = message.content || '*empty*';

  const container = V2.container('#ED4245', [
    V2.text('## Message Deleted'),
    V2.separator(),
    V2.text(`**Author:** <@${message.author.id}>`),
    V2.text(`**Channel:** <#${message.channel.id}>`),
    V2.separator(),
    V2.text(`**Content:**\n${content.slice(0, 500)}`)
  ]);

  await channel.send({ components: [container], flags: V2.FLAG }).catch(() => {});
}

module.exports = {
  logMemberJoin,
  logMemberRemove,
  logBanAdd,
  logBanRemove,
  logRoleCreate,
  logRoleDelete,
  logChannelCreate,
  logChannelDelete,
  logVoiceState,
  logMessageEdit,
  logMessageDelete,
  getLogConfig,
  loggingTable
};
