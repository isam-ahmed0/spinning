const { V2 } = require('../../spinning_core/lib/ui');

async function sendWelcome(member, runtime, testChannel = null) {
  const config = runtime.getPluginConfig('spinning_server');
  const channelId = testChannel?.id || config.welcome_channel;
  if (!channelId) return;

  const channel = testChannel || member.guild.channels.cache.get(channelId);
  if (!channel) return;

  const msg = (config.welcome_message || 'Welcome to **{server}**, {user}!')
    .replace('{server}', member.guild.name)
    .replace('{user}', `<@${member.id}>`)
    .replace('{count}', member.guild.memberCount);

  const avatarURL = member.user.displayAvatarURL({ extension: 'png', size: 256 });

  const container = V2.container(V2.config.brand_color, [
    V2.section(
      [V2.text(msg)],
      V2.thumbnail(avatarURL)
    ),
    V2.separator(),
    V2.text(`Member #${member.guild.memberCount}`)
  ]);

  await channel.send({ components: [container], flags: V2.FLAG });
}

async function sendGoodbye(member, runtime) {
  const config = runtime.getPluginConfig('spinning_server');
  const channelId = config.goodbye_channel;
  if (!channelId) return;

  const channel = member.guild.channels.cache.get(channelId);
  if (!channel) return;

  const msg = (config.goodbye_message || `Goodbye **{user}**, we'll miss you!`)
    .replace('{server}', member.guild.name)
    .replace('{user}', member.user.tag);

  const container = V2.container(V2.config.brand_color, [
    V2.text(msg)
  ]);

  await channel.send({ components: [container], flags: V2.FLAG });
}

module.exports = { sendWelcome, sendGoodbye };
