const { V2 } = require('../../spinning_core/lib/ui');
const { Database, Table } = require('../../../lib/db');

const db = new Database();
const invitesTable = new Table(db, 'invites');
const messagesTable = new Table(db, 'messages');

function trackInvite(guildId, code, uses, inviterId) {
  invitesTable.upsert({ guildId, code }, {
    guildId,
    code,
    uses: uses || 0,
    inviterId: inviterId || null,
    lastUpdated: Date.now()
  });
}

function trackMessage(guildId, userId) {
  const existing = messagesTable.findOne({ guildId, userId });
  if (existing) {
    messagesTable.upsert({ guildId, userId }, {
      guildId,
      userId,
      count: (existing.count || 0) + 1,
      lastMessage: Date.now()
    });
  } else {
    messagesTable.insert({
      guildId,
      userId,
      count: 1,
      lastMessage: Date.now()
    });
  }
}

function getInviteStats(guildId) {
  return invitesTable.find({ guildId });
}

function getMessageStats(guildId, limit = 10) {
  return messagesTable.find({ guildId }).sort((a, b) => (b.count || 0) - (a.count || 0)).slice(0, limit);
}

const trackingSlashCmds = [
  {
    name: 'leaderboard',
    description: 'Show message leaderboard',
    options: [{ type: 'string', name: 'type', description: 'Type: messages', required: false }],
    async execute(interaction) {
      const type = interaction.options.getString('type') || 'messages';
      const stats = getMessageStats(interaction.guildId, 15);

      if (!stats.length) {
        return V2.reply(interaction, V2.container(V2.config.brand_color, [
          V2.text('### Leaderboard'),
          V2.separator(),
          V2.text('No data yet.')
        ]));
      }

      const medals = ['🥇', '🥈', '🥉'];
      const lines = stats.map((s, i) => {
        const medal = medals[i] || `**${i + 1}.**`;
        return `${medal} <@${s.userId}> — **${s.count.toLocaleString()}** messages`;
      }).join('\n');

      await V2.reply(interaction, V2.container(V2.config.brand_color, [
        V2.text('### 📊 Message Leaderboard'),
        V2.separator(),
        V2.text(lines)
      ]));
    }
  },
  {
    name: 'invites',
    description: 'Show server invite stats',
    async execute(interaction) {
      const stats = getInviteStats(interaction.guildId);
      if (!stats.length) {
        return V2.reply(interaction, V2.container(V2.config.brand_color, [
          V2.text('### Invites'),
          V2.separator(),
          V2.text('No invite data tracked yet.')
        ]));
      }

      const sorted = stats.sort((a, b) => (b.uses || 0) - (a.uses || 0)).slice(0, 10);
      const lines = sorted.map(s =>
        `**${s.code}** — ${s.uses || 0} uses${s.inviterId ? ` (by <@${s.inviterId}>)` : ''}`
      ).join('\n');

      await V2.reply(interaction, V2.container(V2.config.brand_color, [
        V2.text('### 🔗 Invite Stats'),
        V2.separator(),
        V2.text(lines)
      ]));
    }
  }
];

module.exports = { trackingSlashCmds, trackInvite, trackMessage, invitesTable, messagesTable };
