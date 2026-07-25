const { V2 } = require('../../spinning_core/lib/ui');
const { Database, Table } = require('../../../lib/db');
const emojis = require('../../../emojis.json');

const db = new Database();
const giveawaysTable = new Table(db, 'giveaways');
const giveawayEntries = new Table(db, 'giveaway_entries');

function parseDuration(str) {
  const match = str.match(/^(\d+)(s|m|h|d)$/i);
  if (!match) return null;
  const num = parseInt(match[1]);
  const unit = match[2].toLowerCase();
  const multipliers = { s: 1000, m: 60000, h: 3600000, d: 86400000 };
  return num * multipliers[unit];
}

function formatDuration(ms) {
  const s = Math.floor(ms / 1000);
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const parts = [];
  if (d > 0) parts.push(`${d}d`);
  if (h > 0) parts.push(`${h}h`);
  if (m > 0) parts.push(`${m}m`);
  if (sec > 0) parts.push(`${sec}s`);
  return parts.join(' ');
}

function buildGiveawayContainer(giveaway) {
  const remaining = Math.max(0, giveaway.endsAt - Date.now());
  const ended = remaining <= 0;
  const entries = giveawayEntries.find({ giveawayId: giveaway._id });

  const lines = [
    `${emojis.gift} **${giveaway.prize}** ${emojis.gift}`,
    '',
    `${emojis.dots} **Winners:** ${giveaway.winnerCount}`,
    `${emojis.dots} **Entries:** ${entries.length}`,
    `${emojis.dots} **Ends:** ${ended ? 'Ended' : `<t:${Math.floor(giveaway.endsAt / 1000)}:R>`}`,
    `${emojis.dots} **Hosted by:** <@${giveaway.hostId}>`
  ];

  const container = V2.container(V2.config.brand_color, [
    V2.text(lines.join('\n'))
  ]);

  return container;
}

const giveawaySlashCmds = [
  {
    name: 'giveaway',
    description: 'Giveaway commands',
    options: [
      { type: 'string', name: 'action', description: 'start, end, or reroll', required: true },
      { type: 'string', name: 'prize', description: 'Prize (for start)', required: false },
      { type: 'string', name: 'duration', description: 'Duration like 1h, 30m, 1d (for start)', required: false },
      { type: 'integer', name: 'winners', description: 'Number of winners (for start)', required: false },
      { type: 'string', name: 'giveaway_id', description: 'Giveaway message ID (for end/reroll)', required: false }
    ],
    async execute(interaction, runtime) {
      const action = interaction.options.getString('action');
      const prize = interaction.options.getString('prize');
      const durationStr = interaction.options.getString('duration');
      const winnerCount = interaction.options.getInteger('winners') || 1;
      const giveawayId = interaction.options.getString('giveaway_id');

      if (action === 'start') {
        if (!prize || !durationStr) {
          return V2.reply(interaction, V2.error('Provide prize and duration.'), true);
        }

        const duration = parseDuration(durationStr);
        if (!duration || duration < 10000) {
          return V2.reply(interaction, V2.error('Invalid duration. Min 10s.'), true);
        }

        const endsAt = Date.now() + duration;

        const giveaway = giveawaysTable.insert({
          guildId: interaction.guildId,
          channelId: interaction.channelId,
          hostId: interaction.user.id,
          prize,
          winnerCount,
          endsAt,
          ended: false,
          messageId: null
        });

        const container = buildGiveawayContainer({ ...giveaway, endsAt });

        const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
        const row = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId(`giveaway_enter_${giveaway._id}`)
            .setLabel('Enter Giveaway')
            .setStyle(ButtonStyle.Success),
          new ButtonBuilder()
            .setCustomId(`giveaway_participants_${giveaway._id}`)
            .setLabel('View Entries')
            .setStyle(ButtonStyle.Secondary)
        );

        const msg = await interaction.channel.send({ components: [container, row], flags: V2.FLAG });
        giveawaysTable.update({ _id: giveaway._id }, { messageId: msg.id });

        await V2.reply(interaction, V2.success('Giveaway started!'), true);
      }

      else if (action === 'end') {
        if (!giveawayId) return V2.reply(interaction, V2.error('Provide a giveaway message ID.'), true);

        const giveaway = giveawaysTable.findOne({ messageId: giveawayId, guildId: interaction.guildId });
        if (!giveaway) return V2.reply(interaction, V2.error('Giveaway not found.'), true);
        if (giveaway.ended) return V2.reply(interaction, V2.error('Giveaway already ended.'), true);

        endGiveaway(giveaway, runtime);
        await V2.reply(interaction, V2.success('Giveaway ended!'), true);
      }

      else if (action === 'reroll') {
        if (!giveawayId) return V2.reply(interaction, V2.error('Provide a giveaway message ID.'), true);

        const giveaway = giveawaysTable.findOne({ messageId: giveawayId, guildId: interaction.guildId });
        if (!giveaway) return V2.reply(interaction, V2.error('Giveaway not found.'), true);

        const entries = giveawayEntries.find({ giveawayId: giveaway._id });
        if (entries.length === 0) {
          return V2.reply(interaction, V2.error('No entries to reroll.'), true);
        }

        const winners = pickWinners(entries, giveaway.winnerCount);
        const winnerMentions = winners.map(w => `<@${w.userId}>`).join(', ');

        const container = V2.container('#57F287', [
          V2.text(`${emojis.gift} **Giveaway Rerolled!**`),
          V2.separator(),
          V2.text(`**Prize:** ${giveaway.prize}`),
          V2.text(`**Winners:** ${winnerMentions}`)
        ]);

        await V2.reply(interaction, container);
      }
    }
  }
];

function pickWinners(entries, count) {
  const shuffled = [...entries].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, shuffled.length));
}

function endGiveaway(giveaway, runtime) {
  giveawaysTable.update({ _id: giveaway._id }, { ended: true });

  const entries = giveawayEntries.find({ giveawayId: giveaway._id });
  const channel = runtime.client.channels.cache.get(giveaway.channelId);

  if (entries.length === 0) {
    const container = V2.container('#ED4245', [
      V2.text(`${emojis.gift} **Giveaway Ended**`),
      V2.separator(),
      V2.text(`**Prize:** ${giveaway.prize}`),
      V2.text('No valid entries.')
    ]);

    if (channel) {
      channel.send({ components: [container], flags: V2.FLAG }).catch(() => {});
    }
    return;
  }

  const winners = pickWinners(entries, giveaway.winnerCount);
  const winnerMentions = winners.map(w => `<@${w.userId}>`).join(', ');

  const container = V2.container('#57F287', [
    V2.text(`${emojis.gift} **Giveaway Ended!**`),
    V2.separator(),
    V2.text(`**Prize:** ${giveaway.prize}`),
    V2.text(`**Winners:** ${winnerMentions}`)
  ]);

  if (channel) {
    channel.send({ components: [container], flags: V2.FLAG }).catch(() => {});
  }
}

function checkGiveaways(client) {
  const now = Date.now();
  const active = giveawaysTable.find({ ended: false });

  for (const giveaway of active) {
    if (giveaway.endsAt <= now) {
      endGiveaway(giveaway, { client });
    }
  }
}

module.exports = { giveawaySlashCmds, giveawayEntries, giveawaysTable, checkGiveaways };
