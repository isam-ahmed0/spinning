const { V2 } = require('../../spinning_core/lib/ui');
const { Database, Table } = require('../../../lib/db');
const emojis = require('../../../emojis.json');

const db = new Database();
const remindersTable = new Table(db, 'reminders');

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

const remindSlashCmds = [
  {
    name: 'remind',
    description: 'Set a reminder',
    options: [
      { type: 'string', name: 'time', description: 'Duration (e.g. 30m, 2h, 1d)', required: true },
      { type: 'string', name: 'message', description: 'Reminder message', required: true }
    ],
    async execute(interaction) {
      const timeStr = interaction.options.getString('time');
      const message = interaction.options.getString('message');
      const duration = parseDuration(timeStr);

      if (!duration || duration < 1000 || duration > 86400000 * 7) {
        return V2.reply(interaction, V2.error('Invalid duration. Use 30s, 5m, 2h, 1d (max 7d).'), true);
      }

      const dueAt = Date.now() + duration;

      remindersTable.insert({
        userId: interaction.user.id,
        guildId: interaction.guildId,
        channelId: interaction.channelId,
        message,
        dueAt,
        createdAt: Date.now()
      });

      const container = V2.container('#57F287', [
        V2.text(`${emojis.success} **Reminder Set**`),
        V2.separator(),
        V2.text(`I'll remind you in **${formatDuration(duration)}**: ${message}`)
      ]);

      await V2.reply(interaction, container, true);
    }
  },
  {
    name: 'reminders',
    description: 'View your active reminders',
    options: [],
    async execute(interaction) {
      const reminders = remindersTable.find({ userId: interaction.user.id });
      if (reminders.length === 0) {
        return V2.reply(interaction, V2.info('No active reminders.'), true);
      }

      const list = reminders.map((r, i) => {
        const remaining = Math.max(0, r.dueAt - Date.now());
        return `${emojis.dots} **${i + 1}.** ${r.message} (in ${formatDuration(remaining)})`;
      }).join('\n');

      const container = V2.container(V2.config.brand_color, [
        V2.text(`${emojis.timer} **Your Reminders**`),
        V2.separator(),
        V2.text(list)
      ]);

      await V2.reply(interaction, container, true);
    }
  },
  {
    name: 'removeremind',
    description: 'Remove a reminder',
    options: [{ type: 'integer', name: 'id', description: 'Reminder number (from /reminders)', required: true }],
    async execute(interaction) {
      const idx = interaction.options.getInteger('id') - 1;
      const reminders = remindersTable.find({ userId: interaction.user.id });
      if (idx < 0 || idx >= reminders.length) {
        return V2.reply(interaction, V2.error('Invalid reminder number.'), true);
      }
      remindersTable.delete({ _id: reminders[idx]._id });
      await V2.reply(interaction, V2.success('Reminder removed.'), true);
    }
  }
];

function checkReminders(client) {
  const now = Date.now();
  const due = remindersTable.find({}).filter(r => r.dueAt <= now);

  for (const reminder of due) {
    remindersTable.delete({ _id: reminder._id });

    const user = client.users.cache.get(reminder.userId);
    const channel = client.channels.cache.get(reminder.channelId);

    const container = V2.container(V2.config.brand_color, [
      V2.text(`${emojis.bell} **Reminder**`),
      V2.separator(),
      V2.text(`<@${reminder.userId}>, you asked me to remind you: **${reminder.message}**`)
    ]);

    if (user) {
      user.send({ components: [container], flags: V2.FLAG }).catch(() => {
        if (channel) channel.send({ components: [container], flags: V2.FLAG }).catch(() => {});
      });
    } else if (channel) {
      channel.send({ components: [container], flags: V2.FLAG }).catch(() => {});
    }
  }
}

module.exports = { remindSlashCmds, checkReminders };
