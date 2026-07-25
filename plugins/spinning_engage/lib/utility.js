const { V2 } = require('../../spinning_core/lib/ui');

const snipeCache = new Map();

const utilitySlashCmds = [
  {
    name: 'avatar',
    description: 'Get a user\'s avatar',
    options: [{ type: 'user', name: 'user', description: 'Target user', required: false }],
    async execute(interaction) {
      const user = interaction.options.getUser('user') || interaction.user;
      const avatarURL = user.displayAvatarURL({ extension: 'png', size: 512 });

      const container = V2.container(V2.config.brand_color, [
        V2.section(
          [V2.text(`## ${user.username}'s Avatar`)],
          V2.thumbnail(avatarURL)
        ),
        V2.separator(),
        V2.text(`[Download](${avatarURL})`)
      ]);
      await V2.reply(interaction, container, true);
    }
  },
  {
    name: 'serverinfo',
    description: 'Show server information',
    options: [],
    async execute(interaction, runtime) {
      const guild = interaction.guild;
      const owner = await guild.fetchOwner().catch(() => null);
      const textChannels = guild.channels.cache.filter(c => c.type === 0).size;
      const voiceChannels = guild.channels.cache.filter(c => c.type === 2).size;
      const roles = guild.roles.cache.size;
      const created = `<t:${Math.floor(guild.createdTimestamp / 1000)}:R>`;

      const container = V2.container(V2.config.brand_color, [
        V2.text(`## ${guild.name}`),
        V2.separator(),
        V2.text(`**Owner:** ${owner ? `<@${owner.id}>` : 'Unknown'}`),
        V2.text(`**Members:** ${guild.memberCount}`),
        V2.text(`**Text Channels:** ${textChannels}`),
        V2.text(`**Voice Channels:** ${voiceChannels}`),
        V2.text(`**Roles:** ${roles}`),
        V2.text(`**Created:** ${created}`)
      ]);
      await V2.reply(interaction, container);
    }
  },
  {
    name: 'userinfo',
    description: 'Show information about a user',
    options: [{ type: 'user', name: 'user', description: 'Target user', required: false }],
    async execute(interaction) {
      const user = interaction.options.getUser('user') || interaction.user;
      const member = await interaction.guild.members.fetch(user.id).catch(() => null);
      const created = `<t:${Math.floor(user.createdTimestamp / 1000)}:R>`;
      const joined = member ? `<t:${Math.floor(member.joinedTimestamp / 1000)}:R>` : 'Unknown';

      const container = V2.container(V2.config.brand_color, [
        V2.section(
          [
            V2.text(`## ${user.username}`),
            V2.separator(),
            V2.text(`**ID:** ${user.id}`),
            V2.text(`**Created:** ${created}`),
            V2.text(`**Joined:** ${joined}`),
            V2.text(`**Roles:** ${member ? member.roles.cache.size - 1 : 0}`)
          ],
          V2.thumbnail(user.displayAvatarURL({ extension: 'png', size: 256 }))
        )
      ]);
      await V2.reply(interaction, container, true);
    }
  },
  {
    name: 'snipe',
    description: 'Show the last deleted message in this channel',
    options: [],
    async execute(interaction) {
      const cached = snipeCache.get(interaction.channelId);
      if (!cached) {
        return V2.reply(interaction, V2.info('No deleted messages cached for this channel.'), true);
      }

      const container = V2.container(V2.config.brand_color, [
        V2.text('## Sniped Message'),
        V2.separator(),
        V2.text(`**Author:** <@${cached.authorId}>`),
        V2.text(`**Channel:** <#${cached.channelId}>`),
        V2.separator(),
        V2.text(cached.content || '*No text content*')
      ]);
      await V2.reply(interaction, container, true);
    }
  }
];

function cacheDelete(message) {
  if (message.author?.bot) return;
  snipeCache.set(message.channelId, {
    authorId: message.author.id,
    channelId: message.channelId,
    content: message.content,
    timestamp: Date.now()
  });

  if (snipeCache.size > 100) {
    const oldest = snipeCache.keys().next().value;
    snipeCache.delete(oldest);
  }
}

module.exports = { utilitySlashCmds, cacheDelete };
