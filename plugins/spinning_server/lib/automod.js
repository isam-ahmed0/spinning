const { V2 } = require('../../spinning_core/lib/ui');

const spamTracker = new Map();

const INVITE_REGEX = /discord\.(gg|io|me|li|com\/invite)\/[a-zA-Z0-9]+/gi;
const URL_REGEX = /https?:\/\/[^\s]+/gi;

const DEFAULT_BAD_WORDS = ['nigger', 'faggot', 'retard', 'kys'];

function getConfig(runtime) {
  return runtime.getPluginConfig('spinning_server');
}

function isWhitelisted(member, config, module) {
  const wl = config.automod_whitelist || [];
  for (const entry of wl) {
    if (entry.type === 'user' && entry.id === member.id) {
      if (!entry.modules || entry.modules.length === 0 || entry.modules.includes(module)) return true;
    }
    if (entry.type === 'role' && member.roles.cache.has(entry.id)) {
      if (!entry.modules || entry.modules.length === 0 || entry.modules.includes(module)) return true;
    }
    if (entry.type === 'channel') {
      if (!entry.modules || entry.modules.length === 0 || entry.modules.includes(module)) return true;
    }
  }
  return false;
}

function isExempt(member, config) {
  if (member.permissions.has('ManageMessages')) return true;
  if (member.id === member.guild.ownerId) return true;
  return false;
}

async function punish(message, member, config, rule) {
  const punishment = config[`automod_${rule}_punishment`] || 'delete';
  const duration = (config.automod_mute_duration || 300) * 1000;

  try {
    if (punishment === 'delete') {
      await message.delete().catch(() => {});
    } else if (punishment === 'warn') {
      await message.delete().catch(() => {});
    } else if (punishment === 'mute') {
      await message.delete().catch(() => {});
      if (member.moderatable) await member.timeout(duration, `Automod: ${rule}`);
    } else if (punishment === 'kick') {
      if (member.kickable) await member.kick(`Automod: ${rule}`);
    } else if (punishment === 'ban') {
      if (member.bannable) await member.ban({ reason: `Automod: ${rule}` });
    }
  } catch (e) {
    console.error('[spinning_server] Automod punishment failed:', e.message);
  }

  const logChannel = config.log_channel ? message.guild.channels.cache.get(config.log_channel) : null;
  if (logChannel) {
    const container = V2.container('#FEE75C', [
      V2.text('## Automod'),
      V2.separator(),
      V2.text(`**User:** <@${member.id}>`),
      V2.text(`**Rule:** ${rule}`),
      V2.text(`**Punishment:** ${punishment}`)
    ]);
    await logChannel.send({ components: [container], flags: V2.FLAG }).catch(() => {});
  }
}

async function checkAutomod(message, runtime) {
  if (message.author.bot) return;
  if (!message.guild) return;

  const config = getConfig(runtime);
  if (!config.automod_enabled) return;

  const member = message.member;
  if (!member) return;
  if (isExempt(member, config)) return;

  const content = message.content;

  if (config.automod_spam_enabled && !isWhitelisted(member, config, 'spam')) {
    const key = `${message.guild.id}.${message.author.id}`;
    const now = Date.now();
    const windowMs = (config.automod_spam_window || 5) * 1000;
    const threshold = config.automod_spam_threshold || 5;

    if (!spamTracker.has(key)) spamTracker.set(key, []);
    const timestamps = spamTracker.get(key);
    timestamps.push(now);
    const recent = timestamps.filter(t => now - t < windowMs);
    spamTracker.set(key, recent);

    if (recent.length >= threshold) {
      spamTracker.delete(key);
      return punish(message, member, config, 'spam');
    }
  }

  if (config.automod_invite_enabled && !isWhitelisted(member, config, 'invite')) {
    if (INVITE_REGEX.test(content)) {
      INVITE_REGEX.lastIndex = 0;
      return punish(message, member, config, 'invite');
    }
  }

  if (config.automod_link_enabled && !isWhitelisted(member, config, 'link')) {
    if (URL_REGEX.test(content)) {
      URL_REGEX.lastIndex = 0;
      return punish(message, member, config, 'link');
    }
  }

  if (config.automod_badwords_enabled && !isWhitelisted(member, config, 'badwords')) {
    const words = (config.automod_badwords_list || DEFAULT_BAD_WORDS).map(w => w.toLowerCase());
    const lower = content.toLowerCase();
    if (words.some(w => lower.includes(w))) {
      return punish(message, member, config, 'badwords');
    }
  }

  if (config.automod_massmention_enabled && !isWhitelisted(member, config, 'massmention')) {
    const mentionLimit = config.automod_massmention_limit || 5;
    const mentions = (content.match(/<@!?\d+>/g) || []).length + (content.match(/<@&\d+>/g) || []).length;
    if (mentions >= mentionLimit) {
      return punish(message, member, config, 'massmention');
    }
  }

  if (config.automod_ping_enabled && !isWhitelisted(member, config, 'ping')) {
    if (content.includes('@everyone') || content.includes('@here')) {
      return punish(message, member, config, 'ping');
    }
  }

  if (config.automod_caps_enabled && !isWhitelisted(member, config, 'caps')) {
    const minLength = config.automod_caps_minlength || 10;
    const threshold = config.automod_caps_threshold || 70;
    if (content.length >= minLength) {
      const alpha = content.replace(/[^a-zA-Z]/g, '');
      if (alpha.length > 0) {
        const caps = alpha.replace(/[^A-Z]/g, '').length;
        const pct = (caps / alpha.length) * 100;
        if (pct >= threshold) {
          return punish(message, member, config, 'caps');
        }
      }
    }
  }
}

module.exports = { checkAutomod };
