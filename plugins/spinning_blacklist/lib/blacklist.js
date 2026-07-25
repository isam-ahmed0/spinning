const { V2 } = require('../../spinning_core/lib/ui');
const { Database, Table } = require('../../../lib/db');

const db = new Database();
const blacklistTable = new Table(db, 'blacklist');

function isBlacklisted(userId, guildId) {
  const userEntry = blacklistTable.findOne({ type: 'user', targetId: userId });
  if (userEntry) return { blacklisted: true, reason: userEntry.reason, type: 'user' };

  const guildEntry = blacklistTable.findOne({ type: 'guild', targetId: guildId });
  if (guildEntry) return { blacklisted: true, reason: guildEntry.reason, type: 'guild' };

  return { blacklisted: false };
}

const blacklistSlashCmds = [
  {
    name: 'blacklist',
    description: 'Blacklist commands',
    options: [
      { type: 'string', name: 'action', description: 'add, remove, show, check', required: true },
      { type: 'string', name: 'type', description: 'user or guild', required: false },
      { type: 'string', name: 'target', description: 'User or Guild ID', required: false },
      { type: 'string', name: 'reason', description: 'Reason for blacklisting', required: false }
    ],
    async execute(interaction, runtime) {
      const ownerId = runtime.config?.owner_id;
      if (interaction.user.id !== ownerId) {
        return V2.reply(interaction, V2.error('Only the bot owner can manage blacklists.'), true);
      }

      const action = interaction.options.getString('action');
      const type = interaction.options.getString('type');
      const target = interaction.options.getString('target');
      const reason = interaction.options.getString('reason') || 'No reason provided';

      if (action === 'add') {
        if (!type || !target) return V2.reply(interaction, V2.error('Provide type (user/guild) and target ID.'), true);
        if (type !== 'user' && type !== 'guild') return V2.reply(interaction, V2.error('Type must be "user" or "guild".'), true);

        const existing = blacklistTable.findOne({ type, targetId: target });
        if (existing) return V2.reply(interaction, V2.error('Already blacklisted.'), true);

        blacklistTable.insert({ type, targetId: target, reason, addedAt: Date.now(), addedBy: interaction.user.id });
        await V2.reply(interaction, V2.success(`Blacklisted ${type} \`${target}\`.`), true);
      }

      else if (action === 'remove') {
        if (!type || !target) return V2.reply(interaction, V2.error('Provide type and target ID.'), true);
        const existing = blacklistTable.findOne({ type, targetId: target });
        if (!existing) return V2.reply(interaction, V2.error('Not blacklisted.'), true);
        blacklistTable.remove({ type, targetId: target });
        await V2.reply(interaction, V2.success(`Unblacklisted ${type} \`${target}\`.`), true);
      }

      else if (action === 'show') {
        const all = blacklistTable.find({});
        if (!all.length) return V2.reply(interaction, V2.container(V2.config.brand_color, [
          V2.text('### Blacklist'),
          V2.separator(),
          V2.text('No entries.')
        ]));

        const lines = all.map(e => `**${e.type}** \`${e.targetId}\` — ${e.reason} (by <@${e.addedBy}>)`).join('\n');
        await V2.reply(interaction, V2.container(V2.config.brand_color, [
          V2.text('### Blacklist'),
          V2.separator(),
          V2.text(lines.slice(0, 1500))
        ]));
      }

      else if (action === 'check') {
        if (!target) return V2.reply(interaction, V2.error('Provide a user or guild ID.'), true);
        const result = isBlacklisted(target, target);
        if (result.blacklisted) {
          await V2.reply(interaction, V2.error(`Blacklisted (${result.type}): ${result.reason}`), true);
        } else {
          await V2.reply(interaction, V2.success('Not blacklisted.'), true);
        }
      }
    }
  }
];

module.exports = { blacklistSlashCmds, blacklistTable, isBlacklisted };
