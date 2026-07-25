const { V2 } = require('../../spinning_core/lib/ui');

const messageTimestamps = new Map();

async function checkFlood(message, runtime) {
  if (message.author.bot) return;
  const config = runtime.getPluginConfig('spinning_engage');
  if (!config.antiraid_enabled) return;

  const threshold = config.antiraid_threshold || 5;
  const windowMs = (config.antiraid_window || 10) * 1000;
  const muteDuration = (config.antiraid_mute_duration || 300) * 1000;

  const key = `${message.author.id}.${message.guildId}`;
  const now = Date.now();

  if (!messageTimestamps.has(key)) {
    messageTimestamps.set(key, []);
  }

  const timestamps = messageTimestamps.get(key);
  timestamps.push(now);

  const recent = timestamps.filter(t => now - t < windowMs);
  messageTimestamps.set(key, recent);

  if (recent.length >= threshold) {
    messageTimestamps.delete(key);

    const member = await message.guild.members.fetch(message.author.id).catch(() => null);
    if (!member || !member.moderatable) return;

    try {
      await member.timeout(muteDuration, 'Auto-muted: message flood detected');

      const container = V2.container('#ED4245', [
        V2.text('## Anti-Raid'),
        V2.separator(),
        V2.text(`**${message.author.tag}** has been auto-muted for **${muteDuration / 1000}s** due to message flooding.`)
      ]);

      const config2 = runtime.getPluginConfig('spinning_server');
      if (config2?.log_channel) {
        const logChannel = message.guild.channels.cache.get(config2.log_channel);
        if (logChannel) {
          await logChannel.send({ components: [container], flags: V2.FLAG }).catch(() => {});
        }
      }
    } catch (e) {
      console.error('[spinning_engage] Anti-raid mute failed:', e.message);
    }
  }
}

module.exports = { checkFlood };
