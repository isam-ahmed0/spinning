const { V2 } = require('../../spinning_core/lib/ui');

async function getLogChannel(runtime, guild) {
  const config = runtime.getPluginConfig('spinning_server');
  if (!config.logging_enabled) return null;
  if (!config.log_channel) return null;
  return guild.channels.cache.get(config.log_channel) || null;
}

async function logMessageEdit(oldMessage, newMessage, runtime) {
  const channel = await getLogChannel(runtime, newMessage.guild);
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
  const channel = await getLogChannel(runtime, message.guild);
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

module.exports = { logMessageEdit, logMessageDelete };
