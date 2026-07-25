const { V2 } = require('../../spinning_core/lib/ui');
const { MessageFlags } = require('discord.js');
const { createPaginationSession } = require('../../../lib/pagination');

const ITEMS_PER_PAGE = 7;

const listSlashCmds = [
  {
    name: 'boosters',
    description: 'List server boosters',
    async execute(interaction) {
      await interaction.deferReply();
      const members = await interaction.guild.members.fetch();
      const boosters = members.filter(m => m.premiumSince).sort((a, b) => a.premiumSince - b.premiumSince);

      if (boosters.size === 0) {
        return interaction.editReply({ components: [V2.info('No server boosters found.')], flags: V2.FLAG });
      }

      const arr = [...boosters.values()];
      const pages = Math.ceil(arr.length / ITEMS_PER_PAGE);

      const session = createPaginationSession({
        interactionOrMessage: interaction,
        pages: arr,
        userId: interaction.user.id,
        renderPage: async (index, data) => {
          const start = index * ITEMS_PER_PAGE;
          const lines = data.slice(start, start + ITEMS_PER_PAGE).map((m, i) =>
            `**${start + i + 1}.** ${m} — <t:${Math.floor(m.premiumSinceTimestamp / 1000)}:R>`
          ).join('\n');
          return V2.container(0x2B2D31, [
            V2.text(`### Server Boosters [${arr.length}]`),
            V2.separator(),
            V2.text(lines),
            V2.separator(),
            V2.text(`**${interaction.guild.name}** — Boost Level ${interaction.guild.premiumTier}`)
          ]);
        }
      });

      await session.renderInitial();
    }
  },
  {
    name: 'inrole',
    description: 'List members in a role',
    options: [{ type: 'role', name: 'role', description: 'The role to list members of', required: true }],
    async execute(interaction) {
      await interaction.deferReply();
      const role = interaction.options.getRole('role');
      const members = [...role.members.values()];

      if (members.length === 0) {
        return interaction.editReply({ components: [V2.info(`No members found in ${role.name}.`)], flags: V2.FLAG });
      }

      const session = createPaginationSession({
        interactionOrMessage: interaction,
        pages: members,
        userId: interaction.user.id,
        renderPage: async (index, data) => {
          const start = index * ITEMS_PER_PAGE;
          const lines = data.slice(start, start + ITEMS_PER_PAGE).map((m, i) =>
            `**${start + i + 1}.** ${m} — <t:${Math.floor(m.user.createdTimestamp / 1000)}:D>`
          ).join('\n');
          return V2.container(0x2B2D31, [
            V2.text(`### Members in ${role.name} [${members.length}]`),
            V2.separator(),
            V2.text(lines),
            V2.separator(),
            V2.text(`**${role.name}** — Color: \`${role.hexColor}\` — ${members.length} members`)
          ]);
        }
      });

      await session.renderInitial();
    }
  },
  {
    name: 'emojis',
    description: 'List all custom emojis',
    async execute(interaction) {
      await interaction.deferReply();
      const emojis = [...interaction.guild.emojis.cache.values()];

      if (emojis.length === 0) {
        return interaction.editReply({ components: [V2.info('No custom emojis found.')], flags: V2.FLAG });
      }

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
            V2.text(`### Emojis in ${interaction.guild.name} [${emojis.length}]`),
            V2.separator(),
            V2.text(lines),
            V2.separator(),
            V2.text(`**${interaction.guild.name}** — ${emojis.length} emojis`)
          ]);
        }
      });

      await session.renderInitial();
    }
  },
  {
    name: 'bots',
    description: 'List all bots in the server',
    async execute(interaction) {
      await interaction.deferReply();
      const members = await interaction.guild.members.fetch();
      const bots = members.filter(m => m.user.bot).sort((a, b) => a.joinedTimestamp - b.joinedTimestamp);

      if (bots.size === 0) {
        return interaction.editReply({ components: [V2.info('No bots found.')], flags: V2.FLAG });
      }

      const arr = [...bots.values()];
      const session = createPaginationSession({
        interactionOrMessage: interaction,
        pages: arr,
        userId: interaction.user.id,
        renderPage: async (index, data) => {
          const start = index * ITEMS_PER_PAGE;
          const lines = data.slice(start, start + ITEMS_PER_PAGE).map((m, i) =>
            `**${start + i + 1}.** ${m}`
          ).join('\n');
          return V2.container(0x2B2D31, [
            V2.text(`### Bots in ${interaction.guild.name} [${arr.length}]`),
            V2.separator(),
            V2.text(lines),
            V2.separator(),
            V2.text(`**${interaction.guild.name}** — ${arr.length} bots`)
          ]);
        }
      });

      await session.renderInitial();
    }
  },
  {
    name: 'admins',
    description: 'List all admins in the server',
    async execute(interaction) {
      await interaction.deferReply();
      const members = await interaction.guild.members.fetch();
      const admins = members.filter(m => m.permissions.has('Administrator'));

      if (admins.size === 0) {
        return interaction.editReply({ components: [V2.info('No admins found.')], flags: V2.FLAG });
      }

      const arr = [...admins.values()].sort((a, b) => (a.user.bot ? 1 : 0) - (b.user.bot ? 1 : 0));
      const session = createPaginationSession({
        interactionOrMessage: interaction,
        pages: arr,
        userId: interaction.user.id,
        renderPage: async (index, data) => {
          const start = index * ITEMS_PER_PAGE;
          const lines = data.slice(start, start + ITEMS_PER_PAGE).map((m, i) =>
            `**${start + i + 1}.** ${m} — <t:${Math.floor(m.user.createdTimestamp / 1000)}:D>`
          ).join('\n');
          return V2.container(0x2B2D31, [
            V2.text(`### Admins in ${interaction.guild.name} [${arr.length}]`),
            V2.separator(),
            V2.text(lines),
            V2.separator(),
            V2.text(`**${interaction.guild.name}** — ${arr.length} admins`)
          ]);
        }
      });

      await session.renderInitial();
    }
  },
  {
    name: 'invoice',
    description: 'List users in your voice channel',
    async execute(interaction) {
      await interaction.deferReply();
      const voiceState = interaction.member.voice;
      if (!voiceState.channel) {
        return interaction.editReply({ components: [V2.error('You are not in a voice channel.')], flags: V2.FLAG });
      }

      const channel = voiceState.channel;
      const members = [...channel.members.values()];

      if (members.length === 0) {
        return interaction.editReply({ components: [V2.info('Your voice channel is empty.')], flags: V2.FLAG });
      }

      const session = createPaginationSession({
        interactionOrMessage: interaction,
        pages: members,
        userId: interaction.user.id,
        renderPage: async (index, data) => {
          const start = index * ITEMS_PER_PAGE;
          const lines = data.slice(start, start + ITEMS_PER_PAGE).map((m, i) => {
            let status = '🎤';
            if (m.voice.selfMute) status = '🔇';
            if (m.voice.selfDeaf) status = '🔇🎧';
            return `**${start + i + 1}.** ${m} — ${status}`;
          }).join('\n');
          return V2.container(0x2B2D31, [
            V2.text(`### Voice List of ${channel.name} [${members.length}]`),
            V2.separator(),
            V2.text(lines),
            V2.separator(),
            V2.text(`**${channel.name}** — ${members.length} members`)
          ]);
        }
      });

      await session.renderInitial();
    }
  },
  {
    name: 'mods',
    description: 'List all moderators',
    async execute(interaction) {
      await interaction.deferReply();
      const members = await interaction.guild.members.fetch();
      const mods = members.filter(m => m.permissions.has('BanMembers') || m.permissions.has('KickMembers'))
        .sort((a, b) => a.joinedTimestamp - b.joinedTimestamp);

      if (mods.size === 0) {
        return interaction.editReply({ components: [V2.info('No moderators found.')], flags: V2.FLAG });
      }

      const arr = [...mods.values()];
      const session = createPaginationSession({
        interactionOrMessage: interaction,
        pages: arr,
        userId: interaction.user.id,
        renderPage: async (index, data) => {
          const start = index * ITEMS_PER_PAGE;
          const lines = data.slice(start, start + ITEMS_PER_PAGE).map((m, i) =>
            `**${start + i + 1}.** ${m} — <t:${Math.floor(m.user.createdTimestamp / 1000)}:D>`
          ).join('\n');
          return V2.container(0x2B2D31, [
            V2.text(`### Moderators [${arr.length}]`),
            V2.separator(),
            V2.text(lines),
            V2.separator(),
            V2.text(`**${interaction.guild.name}** — ${arr.length} moderators`)
          ]);
        }
      });

      await session.renderInitial();
    }
  },
  {
    name: 'early',
    description: 'List early supporters',
    async execute(interaction) {
      await interaction.deferReply();
      const members = await interaction.guild.members.fetch();
      const early = members.filter(m => m.user.flags?.has('EarlySupporter'))
        .sort((a, b) => a.user.createdTimestamp - b.user.createdTimestamp);

      if (early.size === 0) {
        return interaction.editReply({ components: [V2.info('No early supporters found.')], flags: V2.FLAG });
      }

      const arr = [...early.values()];
      const session = createPaginationSession({
        interactionOrMessage: interaction,
        pages: arr,
        userId: interaction.user.id,
        renderPage: async (index, data) => {
          const start = index * ITEMS_PER_PAGE;
          const lines = data.slice(start, start + ITEMS_PER_PAGE).map((m, i) =>
            `**${start + i + 1}.** ${m} — <t:${Math.floor(m.user.createdTimestamp / 1000)}:D>`
          ).join('\n');
          return V2.container(0x2B2D31, [
            V2.text(`### Early Supporters [${arr.length}]`),
            V2.separator(),
            V2.text(lines),
            V2.separator(),
            V2.text(`**${interaction.guild.name}** — ${arr.length} early supporters`)
          ]);
        }
      });

      await session.renderInitial();
    }
  },
  {
    name: 'createpos',
    description: 'List members by account creation date',
    async execute(interaction) {
      await interaction.deferReply();
      const members = await interaction.guild.members.fetch();
      const sorted = [...members.values()].sort((a, b) => a.user.createdTimestamp - b.user.createdTimestamp);

      const session = createPaginationSession({
        interactionOrMessage: interaction,
        pages: sorted,
        userId: interaction.user.id,
        renderPage: async (index, data) => {
          const start = index * ITEMS_PER_PAGE;
          const lines = data.slice(start, start + ITEMS_PER_PAGE).map((m, i) =>
            `**${start + i + 1}.** ${m} — <t:${Math.floor(m.user.createdTimestamp / 1000)}:D>`
          ).join('\n');
          return V2.container(0x2B2D31, [
            V2.text(`### Account Creation Dates [${sorted.length}]`),
            V2.separator(),
            V2.text(lines),
            V2.separator(),
            V2.text(`**${interaction.guild.name}** — ${sorted.length} members — Sorted by: Account Creation Date`)
          ]);
        }
      });

      await session.renderInitial();
    }
  },
  {
    name: 'roles',
    description: 'List all roles',
    async execute(interaction) {
      await interaction.deferReply();
      const roles = interaction.guild.roles.cache
        .filter(r => r.id !== interaction.guild.id)
        .sort((a, b) => b.position - a.position)
        .values();

      const arr = [...roles];
      if (arr.length === 0) {
        return interaction.editReply({ components: [V2.info('No roles found.')], flags: V2.FLAG });
      }

      const session = createPaginationSession({
        interactionOrMessage: interaction,
        pages: arr,
        userId: interaction.user.id,
        renderPage: async (index, data) => {
          const start = index * ITEMS_PER_PAGE;
          const lines = data.slice(start, start + ITEMS_PER_PAGE).map((r, i) =>
            `**${start + i + 1}.** ${r.name} — \`${r.id}\``
          ).join('\n');
          return V2.container(0x2B2D31, [
            V2.text(`### Roles in ${interaction.guild.name} [${arr.length}]`),
            V2.separator(),
            V2.text(lines),
            V2.separator(),
            V2.text(`**${interaction.guild.name}** — ${arr.length} roles`)
          ]);
        }
      });

      await session.renderInitial();
    }
  }
];

module.exports = { listSlashCmds };
