const { V2 } = require('../../spinning_core/lib/ui');
const { Database, Table } = require('../../../lib/db');

const db = new Database();
const feedbackTable = new Table(db, 'feedback');

function getAllFeedback(guildId) {
  return feedbackTable.find({ guildId });
}

function getFeedbackStats(guildId) {
  const all = getAllFeedback(guildId);
  const pending = all.filter(f => f.status === 'pending');
  const accepted = all.filter(f => f.status === 'accepted');
  const denied = all.filter(f => f.status === 'denied');
  return { total: all.length, pending: pending.length, accepted: accepted.length, denied: denied.length };
}

const feedbackSlashCmds = [
  {
    name: 'feedback',
    description: 'Feedback commands',
    options: [
      { type: 'string', name: 'action', description: 'submit, list, stats, accept, deny', required: true },
      { type: 'string', name: 'title', description: 'Feedback title (for submit)', required: false },
      { type: 'string', name: 'description', description: 'Feedback description (for submit)', required: false },
      { type: 'string', name: 'id', description: 'Feedback ID (for accept/deny)', required: false }
    ],
    async execute(interaction, runtime) {
      const action = interaction.options.getString('action');
      const title = interaction.options.getString('title');
      const desc = interaction.options.getString('description');
      const id = interaction.options.getString('id');
      const config = runtime.getPluginConfig('spinning_feedback') || {};

      if (action === 'submit') {
        if (!title || !desc) return V2.reply(interaction, V2.error('Provide a title and description.'), true);

        const feedbackId = `fb-${Date.now()}`;
        feedbackTable.insert({
          id: feedbackId,
          guildId: interaction.guildId,
          userId: interaction.user.id,
          title,
          description: desc,
          status: 'pending',
          createdAt: Date.now()
        });

        const logChannel = config.feedback_log_channel ? interaction.guild.channels.cache.get(config.feedback_log_channel) : null;
        if (logChannel) {
          const container = V2.container('#57F287', [
            V2.text('### New Feedback'),
            V2.separator(),
            V2.text(`**ID:** ${feedbackId}\n**From:** <@${interaction.user.id}>\n**Title:** ${title}\n**Description:** ${desc}`)
          ]);
          await logChannel.send({ components: [container], flags: V2.FLAG }).catch(() => {});
        }

        await V2.reply(interaction, V2.success(`Feedback submitted! ID: \`${feedbackId}\``), true);
      }

      else if (action === 'list') {
        const all = getAllFeedback(interaction.guildId);
        const pending = all.filter(f => f.status === 'pending');
        if (!pending.length) return V2.reply(interaction, V2.container(V2.config.brand_color, [
          V2.text('### Feedback List'),
          V2.separator(),
          V2.text('No pending feedback.')
        ]));

        const lines = pending.slice(0, 10).map(f =>
          `**${f.id}** — ${f.title}\n> ${f.description.slice(0, 100)}${f.description.length > 100 ? '...' : ''}\n> By <@${f.userId}> • <t:${Math.round(f.createdAt / 1000)}:R>`
        ).join('\n\n');

        await V2.reply(interaction, V2.container(V2.config.brand_color, [
          V2.text('### Pending Feedback'),
          V2.separator(),
          V2.text(lines)
        ]));
      }

      else if (action === 'stats') {
        const stats = getFeedbackStats(interaction.guildId);
        await V2.reply(interaction, V2.container(V2.config.brand_color, [
          V2.text('### Feedback Stats'),
          V2.separator(),
          V2.text(`**Total:** ${stats.total}\n**Pending:** ${stats.pending}\n**Accepted:** ${stats.accepted}\n**Denied:** ${stats.denied}`)
        ]));
      }

      else if (action === 'accept') {
        if (!V2.hasAdminOrOwner(interaction.member, runtime)) {
          return V2.reply(interaction, V2.error('You need Administrator permission.'), true);
        }
        if (!id) return V2.reply(interaction, V2.error('Provide a feedback ID.'), true);
        const fb = feedbackTable.findOne({ id, guildId: interaction.guildId });
        if (!fb) return V2.reply(interaction, V2.error('Feedback not found.'), true);
        feedbackTable.update({ id }, { status: 'accepted' });
        await V2.reply(interaction, V2.success(`Feedback ${id} accepted.`), true);
      }

      else if (action === 'deny') {
        if (!V2.hasAdminOrOwner(interaction.member, runtime)) {
          return V2.reply(interaction, V2.error('You need Administrator permission.'), true);
        }
        if (!id) return V2.reply(interaction, V2.error('Provide a feedback ID.'), true);
        const fb = feedbackTable.findOne({ id, guildId: interaction.guildId });
        if (!fb) return V2.reply(interaction, V2.error('Feedback not found.'), true);
        feedbackTable.update({ id }, { status: 'denied' });
        await V2.reply(interaction, V2.success(`Feedback ${id} denied.`), true);
      }
    }
  }
];

module.exports = { feedbackSlashCmds, feedbackTable };
