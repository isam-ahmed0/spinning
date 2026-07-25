const { V2 } = require('../../spinning_core/lib/ui');
const { Database, Table } = require('../../../lib/db');
const { ComponentType } = require('discord.js');

const db = new Database();
const afkTable = new Table(db, 'afk');

function formatDuration(ms) {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const parts = [];
  if (days > 0) parts.push(`${days} day${days > 1 ? 's' : ''}`);
  if (hours % 24 > 0) parts.push(`${hours % 24} hour${hours % 24 > 1 ? 's' : ''}`);
  if (minutes % 60 > 0) parts.push(`${minutes % 60} minute${minutes % 60 > 1 ? 's' : ''}`);
  if (seconds % 60 > 0) parts.push(`${seconds % 60} second${seconds % 60 > 1 ? 's' : ''}`);
  return parts.join(', ') || '0 seconds';
}

function handleAfkMessage(message) {
  if (message.author.bot) return;
  if (!message.guild) return;

  const guildId = message.guild.id;
  const userId = message.author.id;

  const existing = afkTable.findOne({ guildId, userId });
  if (existing) {
    afkTable.remove({ guildId, userId });
    const duration = Date.now() - existing.time;

    const container = V2.container(V2.config.brand_color, [
      V2.text('### AFK Removed'),
      V2.separator(),
      V2.text(`Welcome back! You were AFK for **${formatDuration(duration)}**.`)
    ]);

    message.channel.send({ components: [container], flags: V2.FLAG }).then(msg => {
      setTimeout(() => msg.delete().catch(() => {}), 5000);
    }).catch(() => {});
  }

  if (message.mentions.users.size > 0) {
    for (const [mentionedId, user] of message.mentions.users) {
      if (user.bot) continue;
      if (mentionedId === userId) continue;

      const afkData = afkTable.findOne({ guildId, userId: mentionedId });
      if (afkData) {
        const duration = Date.now() - afkData.time;
        const container = V2.container(V2.config.brand_color, [
          V2.text(`### ${user.username} is AFK`),
          V2.separator(),
          V2.text(`**Reason:** ${afkData.reason || 'No reason'}\n**Since:** <t:${Math.round(afkData.time / 1000)}:R> (${formatDuration(duration)} ago)`)
        ]);

        message.channel.send({ components: [container], flags: V2.FLAG }).catch(() => {});
      }
    }
  }
}

function handleAfkButton(interaction) {
  if (!interaction.isButton()) return false;
  if (interaction.customId !== 'afk_yes' && interaction.customId !== 'afk_no') return false;

  const dmStatus = interaction.customId === 'afk_yes';
  const guildId = interaction.guildId;
  const userId = interaction.user.id;

  const pending = afkPending.get(userId);
  if (!pending) {
    return interaction.reply({ components: [V2.error('AFK setup timed out. Run the command again.')], flags: V2.FLAG });
  }
  afkPending.delete(userId);

  afkTable.upsert({ guildId, userId }, {
    guildId,
    userId,
    reason: pending.reason,
    time: Date.now(),
    dm: dmStatus
  });

  const container = V2.container(V2.config.brand_color, [
    V2.text('### AFK Set'),
    V2.separator(),
    V2.text(`**Reason:** ${pending.reason}\n**DM when mentioned:** ${dmStatus ? 'Yes' : 'No'}`)
  ]);

  return interaction.update({ components: [container], flags: V2.FLAG });
}

const afkPending = new Map();

const afkSlashCmds = [
  {
    name: 'afk',
    description: 'Set yourself as AFK with a reason',
    options: [{ type: 'string', name: 'reason', description: 'The reason for being AFK', required: true }],
    async execute(interaction) {
      const reason = interaction.options.getString('reason');

      if (reason.toLowerCase().includes('discord.gg') || reason.toLowerCase().includes('gg/')) {
        return V2.reply(interaction, V2.error('No invite links allowed in AFK reason.'), true);
      }

      const existing = afkTable.findOne({ guildId: interaction.guildId, userId: interaction.user.id });
      if (existing) {
        const container = V2.container(V2.config.brand_color, [
          V2.text('### Already AFK'),
          V2.separator(),
          V2.text(`**Reason:** ${existing.reason}\n**Since:** <t:${Math.round(existing.time / 1000)}:R>`)
        ]);
        return V2.reply(interaction, container, true);
      }

      const yesButton = { type: 2, custom_id: 'afk_yes', label: 'Yes', style: 3 };
      const noButton = { type: 2, custom_id: 'afk_no', label: 'No', style: 4 };

      const promptContainer = V2.container(V2.config.brand_color, [
        V2.text('### DM when mentioned?'),
        V2.separator(),
        V2.text('Should we DM you when someone mentions you while you\'re AFK?')
      ]);

      const message = await interaction.reply({
        components: [promptContainer, { type: 1, components: [yesButton, noButton] }],
        flags: V2.FLAG,
        fetchReply: true
      });

      afkPending.set(interaction.user.id, { reason, guildId: interaction.guildId });

      try {
        const buttonInteraction = await message.awaitMessageComponent({
          filter: (i) => i.user.id === interaction.user.id,
          time: 60000,
          componentType: ComponentType.Button
        });

        afkPending.delete(interaction.user.id);
        const dmStatus = buttonInteraction.customId === 'afk_yes';

        afkTable.upsert({ guildId: interaction.guildId, userId: interaction.user.id }, {
          guildId: interaction.guildId,
          userId: interaction.user.id,
          reason,
          time: Date.now(),
          dm: dmStatus
        });

        const container = V2.container(V2.config.brand_color, [
          V2.text('### AFK Set'),
          V2.separator(),
          V2.text(`**Reason:** ${reason}\n**DM when mentioned:** ${dmStatus ? 'Yes' : 'No'}`)
        ]);

        await buttonInteraction.update({ components: [container], flags: V2.FLAG });
      } catch {
        afkPending.delete(interaction.user.id);
        await interaction.editReply({
          components: [V2.error('Timed out. Run the command again.')],
          flags: V2.FLAG
        }).catch(() => {});
      }
    }
  }
];

module.exports = { afkSlashCmds, handleAfkMessage, handleAfkButton, afkTable, formatDuration };
