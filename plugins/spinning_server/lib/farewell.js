const { V2 } = require('../../spinning_core/lib/ui');

async function sendFarewell(member, runtime) {
  const config = runtime.getPluginConfig('spinning_server');
  const channelId = config.farewell_channel || config.goodbye_channel;
  if (!channelId) return;

  const channel = member.guild.channels.cache.get(channelId);
  if (!channel) return;

  const template = config.farewell_message || config.goodbye_message || 'Goodbye **{user}**, we\'ll miss you!';
  const msg = template
    .replace('{server}', member.guild.name)
    .replace('{user}', `<@${member.id}>`)
    .replace('{user_tag}', member.user.tag)
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

  await channel.send({ components: [container], flags: V2.FLAG }).catch(() => {});
}

const farewellSlashCmds = [
  {
    name: 'setfarewell',
    description: 'Set the farewell channel',
    options: [{ type: 'channel', name: 'channel', description: 'Channel for farewell messages', required: true }],
    async execute(interaction, runtime) {
      if (!V2.hasAdminOrOwner(interaction.member, runtime)) {
        return V2.reply(interaction, V2.error('You need Administrator permission.'));
      }
      const channel = interaction.options.getChannel('channel');
      const config = runtime.getPluginConfig('spinning_server');
      config.farewell_channel = channel.id;
      await V2.reply(interaction, V2.success(`Farewell channel set to <#${channel.id}>`));
    }
  },
  {
    name: 'setfarewellmessage',
    description: 'Set the farewell message template',
    options: [{ type: 'string', name: 'message', description: 'Message template ({user}, {server}, {count})', required: true }],
    async execute(interaction, runtime) {
      if (!V2.hasAdminOrOwner(interaction.member, runtime)) {
        return V2.reply(interaction, V2.error('You need Administrator permission.'));
      }
      const message = interaction.options.getString('message');
      const config = runtime.getPluginConfig('spinning_server');
      config.farewell_message = message;
      await V2.reply(interaction, V2.success('Farewell message updated.'));
    }
  },
  {
    name: 'testfarewell',
    description: 'Test the farewell message in the current channel',
    options: [],
    async execute(interaction, runtime) {
      if (!V2.hasAdminOrOwner(interaction.member, runtime)) {
        return V2.reply(interaction, V2.error('You need Administrator permission.'));
      }
      const config = runtime.getPluginConfig('spinning_server');
      const template = config.farewell_message || 'Goodbye **{user}**, we\'ll miss you!';
      const msg = template
        .replace('{server}', interaction.guild.name)
        .replace('{user}', `<@${interaction.user.id}>`)
        .replace('{user_tag}', interaction.user.tag)
        .replace('{count}', interaction.guild.memberCount);

      const container = V2.container(V2.config.brand_color, [
        V2.text(msg)
      ]);
      await V2.reply(interaction, container);
    }
  }
];

module.exports = { sendFarewell, farewellSlashCmds };
