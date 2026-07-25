const { V2 } = require('../../spinning_core/lib/ui');
const { MessageFlags } = require('discord.js');
const { createPaginationSession } = require('../../../lib/pagination');

const ITEMS_PER_PAGE = 10;

const channelTypeNames = {
  0: 'Text', 2: 'Voice', 4: 'Category', 5: 'Announcement',
  10: 'Thread (News)', 11: 'Thread (Public)', 12: 'Thread (Private)',
  13: 'Stage', 15: 'Forum'
};

const permissionNames = {
  Administrator: 'Administrator', ManageGuild: 'Manage Server', ManageRoles: 'Manage Roles',
  ManageChannels: 'Manage Channels', ManageMessages: 'Manage Messages', ManageWebhooks: 'Manage Webhooks',
  ManageEmojisAndStickers: 'Manage Emojis & Stickers', ManageThreads: 'Manage Threads',
  CreatePublicThreads: 'Create Public Threads', CreatePrivateThreads: 'Create Private Threads',
  KickMembers: 'Kick Members', BanMembers: 'Ban Members', ModerateMembers: 'Moderate Members',
  ViewAuditLog: 'View Audit Log', ViewGuildInsights: 'View Server Insights',
  SendMessages: 'Send Messages', SendMessagesInThreads: 'Send Messages in Threads',
  EmbedLinks: 'Embed Links', AttachFiles: 'Attach Files', AddReactions: 'Add Reactions',
  UseExternalEmojis: 'Use External Emojis', UseExternalStickers: 'Use External Stickers',
  MentionEveryone: 'Mention Everyone', ManageNicknames: 'Manage Nicknames',
  ChangeNickname: 'Change Nickname', ViewChannel: 'View Channel', ReadMessageHistory: 'Read Message History',
  Connect: 'Connect', Speak: 'Speak', UseVAD: 'Use Voice Activity',
  PrioritySpeaker: 'Priority Speaker', Stream: 'Stream', MuteMembers: 'Mute Members',
  DeafenMembers: 'Deafen Members', MoveMembers: 'Move Members',
  UseApplicationCommands: 'Use Application Commands', RequestToSpeak: 'Request to Speak'
};

const statsSlashCmds = [
  {
    name: 'channelinfo',
    description: 'Show info about a channel',
    options: [{ type: 'channel', name: 'channel', description: 'Channel to inspect (defaults to current)', required: false }],
    async execute(interaction) {
      const channel = interaction.options.getChannel('channel') || interaction.channel;
      const type = channelTypeNames[channel.type] || `Unknown (${channel.type})`;

      const lines = [
        `**Name:** ${channel.name}`,
        `**ID:** ${channel.id}`,
        `**Type:** ${type}`,
        `**Created:** <t:${Math.floor(channel.createdTimestamp / 1000)}:F>`,
        `**Position:** ${channel.position}`,
        `**NSFW:** ${channel.nsfw ? 'Yes' : 'No'}`
      ];

      if (channel.rateLimitPerUser) lines.push(`**Slowmode:** ${channel.rateLimitPerUser}s`);
      if (channel.bitrate) lines.push(`**Bitrate:** ${channel.bitrate / 1000}kbps`);
      if (channel.userLimit) lines.push(`**User Limit:** ${channel.userLimit}`);
      if (channel.topic) lines.push(`**Topic:** ${channel.topic}`);

      await V2.reply(interaction, V2.container(0x2B2D31, [V2.text(`### Channel Info`), V2.separator(), V2.text(lines.join('\n'))]));
    }
  },
  {
    name: 'emojiinfo',
    description: 'Show info about a custom emoji',
    options: [{ type: 'string', name: 'emoji', description: 'The emoji to inspect', required: true }],
    async execute(interaction) {
      const input = interaction.options.getString('emoji');
      const match = input.match(/<a?:(\w+):(\d+)>/);

      let emoji;
      if (match) {
        emoji = interaction.guild.emojis.cache.get(match[2]);
      } else {
        emoji = interaction.guild.emojis.cache.find(e => e.name === input);
      }

      if (!emoji) return V2.reply(interaction, V2.error('Emoji not found.'), true);

      const lines = [
        `**Name:** ${emoji.name}`,
        `**ID:** ${emoji.id}`,
        `**Animated:** ${emoji.animated ? 'Yes' : 'No'}`,
        `**Created:** <t:${Math.floor(emoji.createdTimestamp / 1000)}:F>`,
        `**Mention:** ${emoji}`,
        `**URL:** ${emoji.url}`
      ];

      await V2.reply(interaction, V2.container(0x2B2D31, [V2.text(`### Emoji Info`), V2.separator(), V2.text(lines.join('\n'))]));
    }
  },
  {
    name: 'emojistats',
    description: 'Show emoji statistics',
    async execute(interaction) {
      await interaction.deferReply();
      const emojis = [...interaction.guild.emojis.cache.values()];
      const staticCount = emojis.filter(e => !e.animated).length;
      const animatedCount = emojis.filter(e => e.animated).length;

      const session = createPaginationSession({
        interactionOrMessage: interaction,
        pages: emojis,
        userId: interaction.user.id,
        renderPage: async (index, data) => {
          const start = index * ITEMS_PER_PAGE;
          const lines = data.slice(start, start + ITEMS_PER_PAGE).map((e, i) =>
            `**${start + i + 1}.** ${e} — \`${e.name}\`${e.animated ? ' (animated)' : ''}`
          ).join('\n');
          return V2.container(0x2B2D31, [
            V2.text(`### Emoji Stats`),
            V2.separator(),
            V2.text(`**Total:** ${emojis.length} | **Static:** ${staticCount} | **Animated:** ${animatedCount}`),
            V2.separator(),
            V2.text(lines || 'No emojis on this page.')
          ]);
        }
      });

      await session.renderInitial();
    }
  },
  {
    name: 'emptyroles',
    description: 'List roles with no members',
    async execute(interaction) {
      await interaction.deferReply();
      const roles = interaction.guild.roles.cache
        .filter(r => r.members.size === 0 && r.id !== interaction.guild.id)
        .sort((a, b) => b.position - a.position)
        .values();

      const arr = [...roles];
      if (arr.length === 0) {
        return interaction.editReply({ components: [V2.info('No empty roles found.')], flags: V2.FLAG });
      }

      const session = createPaginationSession({
        interactionOrMessage: interaction,
        pages: arr,
        userId: interaction.user.id,
        renderPage: async (index, data) => {
          const start = index * ITEMS_PER_PAGE;
          const lines = data.slice(start, start + ITEMS_PER_PAGE).map((r, i) =>
            `**${start + i + 1}.** ${r.name} — Position: ${r.position}`
          ).join('\n');
          return V2.container(0x2B2D31, [
            V2.text(`### Empty Roles [${arr.length}]`),
            V2.separator(),
            V2.text(lines)
          ]);
        }
      });

      await session.renderInitial();
    }
  },
  {
    name: 'firstjoins',
    description: 'Show the earliest members to join',
    options: [{ type: 'integer', name: 'count', description: 'Number of members (1-50, default 10)', required: false, min_value: 1, max_value: 50 }],
    async execute(interaction) {
      await interaction.deferReply();
      const count = interaction.options.getInteger('count') || 10;
      const members = await interaction.guild.members.fetch();
      const sorted = [...members.values()]
        .filter(m => m.joinedTimestamp)
        .sort((a, b) => a.joinedTimestamp - b.joinedTimestamp)
        .slice(0, count);

      const session = createPaginationSession({
        interactionOrMessage: interaction,
        pages: sorted,
        userId: interaction.user.id,
        renderPage: async (index, data) => {
          const start = index * ITEMS_PER_PAGE;
          const lines = data.slice(start, start + ITEMS_PER_PAGE).map((m, i) =>
            `**${start + i + 1}.** ${m} — <t:${Math.floor(m.joinedTimestamp / 1000)}:R>`
          ).join('\n');
          return V2.container(0x2B2D31, [
            V2.text(`### First Joins`),
            V2.separator(),
            V2.text(lines || 'No data on this page.')
          ]);
        }
      });

      await session.renderInitial();
    }
  },
  {
    name: 'lastjoins',
    description: 'Show the most recent members to join',
    options: [{ type: 'integer', name: 'count', description: 'Number of members (1-50, default 10)', required: false, min_value: 1, max_value: 50 }],
    async execute(interaction) {
      await interaction.deferReply();
      const count = interaction.options.getInteger('count') || 10;
      const members = await interaction.guild.members.fetch();
      const sorted = [...members.values()]
        .filter(m => m.joinedTimestamp)
        .sort((a, b) => b.joinedTimestamp - a.joinedTimestamp)
        .slice(0, count);

      const session = createPaginationSession({
        interactionOrMessage: interaction,
        pages: sorted,
        userId: interaction.user.id,
        renderPage: async (index, data) => {
          const start = index * ITEMS_PER_PAGE;
          const lines = data.slice(start, start + ITEMS_PER_PAGE).map((m, i) =>
            `**${start + i + 1}.** ${m} — <t:${Math.floor(m.joinedTimestamp / 1000)}:R>`
          ).join('\n');
          return V2.container(0x2B2D31, [
            V2.text(`### Last Joins`),
            V2.separator(),
            V2.text(lines || 'No data on this page.')
          ]);
        }
      });

      await session.renderInitial();
    }
  },
  {
    name: 'joined',
    description: 'Show when a user joined the server',
    options: [{ type: 'user', name: 'user', description: 'User to check (defaults to yourself)', required: false }],
    async execute(interaction) {
      const user = interaction.options.getUser('user') || interaction.user;
      const member = await interaction.guild.members.fetch(user.id).catch(() => null);
      if (!member) return V2.reply(interaction, V2.error('User not found in this server.'), true);

      const lines = [
        `**User:** ${user}`,
        `**Joined:** <t:${Math.floor(member.joinedTimestamp / 1000)}:F> (<t:${Math.floor(member.joinedTimestamp / 1000)}:R>)`,
        `**Account Created:** <t:${Math.floor(user.createdTimestamp / 1000)}:F>`
      ];

      await V2.reply(interaction, V2.container(0x2B2D31, [V2.text('### Join Info'), V2.separator(), V2.text(lines.join('\n'))]));
    }
  },
  {
    name: 'joinpos',
    description: 'Show the join position of a user',
    options: [{ type: 'user', name: 'user', description: 'User to check (defaults to yourself)', required: false }],
    async execute(interaction) {
      const user = interaction.options.getUser('user') || interaction.user;
      const members = await interaction.guild.members.fetch();
      const sorted = [...members.values()].filter(m => m.joinedTimestamp).sort((a, b) => a.joinedTimestamp - b.joinedTimestamp);
      const pos = sorted.findIndex(m => m.id === user.id);

      if (pos === -1) return V2.reply(interaction, V2.error('User not found in this server.'), true);

      const member = sorted[pos];
      await V2.reply(interaction, V2.container(0x2B2D31, [
        V2.text('### Join Position'),
        V2.separator(),
        V2.text(`**User:** ${user}\n**Position:** ${pos + 1} of ${sorted.length}\n**Joined:** <t:${Math.floor(member.joinedTimestamp / 1000)}:F>`)
      ]));
    }
  },
  {
    name: 'joinedatpos',
    description: 'Show which member joined at a specific position',
    options: [{ type: 'integer', name: 'position', description: 'The join position', required: true, min_value: 1 }],
    async execute(interaction) {
      const position = interaction.options.getInteger('position');
      const members = await interaction.guild.members.fetch();
      const sorted = [...members.values()].filter(m => m.joinedTimestamp).sort((a, b) => a.joinedTimestamp - b.joinedTimestamp);

      if (position > sorted.length) {
        return V2.reply(interaction, V2.error(`Position out of range. Max: ${sorted.length}`), true);
      }

      const member = sorted[position - 1];
      await V2.reply(interaction, V2.container(0x2B2D31, [
        V2.text('### Joined at Position'),
        V2.separator(),
        V2.text(`**User:** ${member}\n**Position:** ${position} of ${sorted.length}\n**Joined:** <t:${Math.floor(member.joinedTimestamp / 1000)}:F>`)
      ]));
    }
  },
  {
    name: 'listchannels',
    description: 'List all channels organized by category',
    async execute(interaction) {
      await interaction.deferReply();
      const categories = interaction.guild.channels.cache
        .filter(c => c.type === 4)
        .sort((a, b) => a.position - b.position);

      const allChannels = [];
      for (const cat of categories.values()) {
        const children = interaction.guild.channels.cache
          .filter(c => c.parentId === cat.id)
          .sort((a, b) => a.position - b.position);
        for (const ch of children.values()) {
          const prefix = ch.type === 0 || ch.type === 5 || ch.type === 15 ? '#' : '🔊';
          allChannels.push(`${prefix} ${ch.name} (${cat.name})`);
        }
      }

      const uncategorized = interaction.guild.channels.cache
        .filter(c => !c.parentId && c.type !== 4)
        .sort((a, b) => a.position - b.position);
      for (const ch of uncategorized.values()) {
        const prefix = ch.type === 0 || ch.type === 5 ? '#' : '🔊';
        allChannels.push(`${prefix} ${ch.name} (Uncategorized)`);
      }

      if (allChannels.length === 0) {
        return interaction.editReply({ components: [V2.info('No channels found.')], flags: V2.FLAG });
      }

      const session = createPaginationSession({
        interactionOrMessage: interaction,
        pages: allChannels,
        userId: interaction.user.id,
        renderPage: async (index, data) => {
          const start = index * 15;
          const lines = data.slice(start, start + 15).map(c => c).join('\n');
          return V2.container(0x2B2D31, [
            V2.text(`### Channels [${allChannels.length}]`),
            V2.separator(),
            V2.text(lines)
          ]);
        }
      });

      await session.renderInitial();
    }
  },
  {
    name: 'permissions',
    description: 'Show permissions for a user',
    options: [{ type: 'user', name: 'user', description: 'User to check (defaults to yourself)', required: false }],
    async execute(interaction) {
      const user = interaction.options.getUser('user') || interaction.user;
      const member = await interaction.guild.members.fetch(user.id).catch(() => null);
      if (!member) return V2.reply(interaction, V2.error('User not found in this server.'), true);

      if (member.permissions.has('Administrator')) {
        return V2.reply(interaction, V2.container(0x2B2D31, [
          V2.text(`### Permissions for ${user.username}`),
          V2.separator(),
          V2.text('**Administrator** — Has all permissions.')
        ]));
      }

      const perms = Object.entries(permissionNames)
        .filter(([key]) => member.permissions.has(key))
        .map(([, name]) => `• ${name}`);

      if (perms.length === 0) {
        return V2.reply(interaction, V2.container(0x2B2D31, [
          V2.text(`### Permissions for ${user.username}`),
          V2.separator(),
          V2.text('No special permissions.')
        ]));
      }

      await V2.reply(interaction, V2.container(0x2B2D31, [
        V2.text(`### Permissions for ${user.username}`),
        V2.separator(),
        V2.text(perms.join('\n')),
        V2.separator(),
        V2.text(`**Total:** ${perms.length} permissions`)
      ]));
    }
  },
  {
    name: 'rolecall',
    description: 'Count members with a specific role',
    options: [{ type: 'role', name: 'role', description: 'The role to count', required: true }],
    async execute(interaction) {
      const role = interaction.options.getRole('role');
      const percentage = ((role.members.size / interaction.guild.memberCount) * 100).toFixed(2);

      await V2.reply(interaction, V2.container(0x2B2D31, [
        V2.text('### Role Call'),
        V2.separator(),
        V2.text(`**Role:** ${role.name}\n**Members:** ${role.members.size}\n**Percentage:** ${percentage}%\n**Color:** \`${role.hexColor}\`\n**Position:** ${role.position}`)
      ]));
    }
  },
  {
    name: 'rolecount',
    description: 'Show role statistics',
    async execute(interaction) {
      const roles = interaction.guild.roles.cache.filter(r => r.id !== interaction.guild.id);
      const withMembers = roles.filter(r => r.members.size > 0).size;
      const empty = roles.filter(r => r.members.size === 0).size;
      const managed = roles.filter(r => r.managed).size;
      const hoisted = roles.filter(r => r.hoist).size;
      const mentionable = roles.filter(r => r.mentionable).size;

      await V2.reply(interaction, V2.container(0x2B2D31, [
        V2.text('### Role Count'),
        V2.separator(),
        V2.text([
          `**Total Roles:** ${roles.size}`,
          `**With Members:** ${withMembers}`,
          `**Empty Roles:** ${empty}`,
          `**Managed Roles:** ${managed}`,
          `**Hoisted Roles:** ${hoisted}`,
          `**Mentionable Roles:** ${mentionable}`
        ].join('\n'))
      ]));
    }
  },
  {
    name: 'roleinfo',
    description: 'Show info about a role',
    options: [{ type: 'role', name: 'role', description: 'The role to inspect', required: true }],
    async execute(interaction) {
      const role = interaction.options.getRole('role');
      const lines = [
        `**Name:** ${role.name}`,
        `**ID:** ${role.id}`,
        `**Color:** \`${role.hexColor}\``,
        `**Members:** ${role.members.size}`,
        `**Position:** ${role.position}`,
        `**Hoisted:** ${role.hoist ? 'Yes' : 'No'}`,
        `**Mentionable:** ${role.mentionable ? 'Yes' : 'No'}`,
        `**Managed:** ${role.managed ? 'Yes' : 'No'}`,
        `**Created:** <t:${Math.floor(role.createdTimestamp / 1000)}:F>`,
        `**Permissions:** ${role.permissions.toArray().length}`
      ];

      await V2.reply(interaction, V2.container(0x2B2D31, [V2.text('### Role Info'), V2.separator(), V2.text(lines.join('\n'))]));
    }
  },
  {
    name: 'roleperms',
    description: 'Show permissions for a role',
    options: [{ type: 'role', name: 'role', description: 'The role to inspect', required: true }],
    async execute(interaction) {
      const role = interaction.options.getRole('role');

      if (role.permissions.has('Administrator')) {
        return V2.reply(interaction, V2.container(0x2B2D31, [
          V2.text(`### Permissions for ${role.name}`),
          V2.separator(),
          V2.text('**Administrator** — Has all permissions.')
        ]));
      }

      const perms = Object.entries(permissionNames)
        .filter(([key]) => role.permissions.has(key))
        .map(([, name]) => `• ${name}`);

      if (perms.length === 0) {
        return V2.reply(interaction, V2.container(0x2B2D31, [
          V2.text(`### Permissions for ${role.name}`),
          V2.separator(),
          V2.text('No special permissions.')
        ]));
      }

      await V2.reply(interaction, V2.container(0x2B2D31, [
        V2.text(`### Permissions for ${role.name}`),
        V2.separator(),
        V2.text(perms.join('\n')),
        V2.separator(),
        V2.text(`**Total:** ${perms.length} permissions`)
      ]));
    }
  },
  {
    name: 'topic',
    description: 'Show the topic of a channel',
    options: [{ type: 'channel', name: 'channel', description: 'Channel to inspect (defaults to current)', required: false }],
    async execute(interaction) {
      const channel = interaction.options.getChannel('channel') || interaction.channel;

      await V2.reply(interaction, V2.container(0x2B2D31, [
        V2.text('### Channel Topic'),
        V2.separator(),
        V2.text(`**Channel:** ${channel}\n**Type:** ${channel.type}\n**Topic:** ${channel.topic || 'This channel has no topic set.'}`)
      ]));
    }
  }
];

module.exports = { statsSlashCmds };
