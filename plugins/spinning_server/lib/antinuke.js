const { V2 } = require('../../spinning_core/lib/ui');

const DANGEROUS_PERMISSIONS = [
  'Administrator', 'BanMembers', 'KickMembers',
  'ManageGuild', 'ManageChannels', 'ManageRoles', 'ManageWebhooks'
];

const actionTracker = new Map();

function getConfig(runtime) {
  return runtime.getPluginConfig('spinning_server');
}

function isWhitelisted(userId, config, eventType) {
  const wl = config.antinuke_whitelist || [];
  return wl.some(w => w.id === userId && (!w.events || w.events.length === 0 || w.events.includes(eventType)));
}

function checkThreshold(guildId, userId, actionType, config) {
  const threshold = config.antinuke_threshold || 3;
  const windowMs = 60000;
  const key = `${guildId}.${userId}.${actionType}`;
  const now = Date.now();

  if (!actionTracker.has(key)) actionTracker.set(key, []);
  const actions = actionTracker.get(key);
  actions.push(now);
  const recent = actions.filter(t => now - t < windowMs);
  actionTracker.set(key, recent);

  return recent.length >= threshold;
}

async function punish(client, guild, userId, config, actionType, runtime) {
  const debounceKey = `${guild.id}.${userId}.punished`;
  if (actionTracker.has(debounceKey)) return;
  actionTracker.set(debounceKey, true);
  setTimeout(() => actionTracker.delete(debounceKey), 30000);

  const member = await guild.members.fetch(userId).catch(() => null);
  if (!member) return;

  const punishment = config.antinuke_punishment || 'kick';

  try {
    if (punishment === 'ban') {
      await member.ban({ reason: `Antinuke: ${actionType}` });
    } else if (punishment === 'kick') {
      await member.kick(`Antinuke: ${actionType}`);
    } else if (punishment === 'strip') {
      const botMember = await guild.members.fetch(client.user.id);
      const safeRoles = member.roles.cache.filter(r => r.id !== guild.id && r.position < botMember.roles.highest.position);
      await member.roles.remove(safeRoles, `Antinuke: ${actionType}`);
    }
  } catch (e) {
    console.error('[spinning_server] Antinuke punishment failed:', e.message);
  }

  const logChannel = config.log_channel ? guild.channels.cache.get(config.log_channel) : null;
  if (logChannel) {
    const container = V2.container('#ED4245', [
      V2.text('## Antinuke Alert'),
      V2.separator(),
      V2.text(`**User:** <@${userId}>`),
      V2.text(`**Action:** ${actionType}`),
      V2.text(`**Punishment:** ${punishment}`)
    ]);
    await logChannel.send({ components: [container], flags: V2.FLAG }).catch(() => {});
  }
}

function checkAntinukeEvent(client, guild, userId, actionType, runtime) {
  const config = getConfig(runtime);
  if (!config.antinuke_enabled) return;
  if (userId === client.user.id) return;
  if (userId === guild.ownerId) return;
  if (isWhitelisted(userId, config, actionType)) return;

  if (checkThreshold(guild.id, userId, actionType, config)) {
    punish(client, guild, userId, config, actionType, runtime);
  }
}

function cleanup() {
  const oneHourAgo = Date.now() - 3600000;
  for (const [key, actions] of actionTracker) {
    const recent = actions.filter(t => t > oneHourAgo);
    if (recent.length === 0) actionTracker.delete(key);
    else actionTracker.set(key, recent);
  }
}

setInterval(cleanup, 300000);

module.exports = { checkAntinukeEvent };
