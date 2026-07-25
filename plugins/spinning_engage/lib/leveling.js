const { V2 } = require('../../spinning_core/lib/ui');

function getLevelData(levelsTable, userId, guildId) {
  return levelsTable.findOne({ userId, guildId }) || { userId, guildId, xp: 0, level: 1 };
}

function getProgressBar(current, total, length = 10) {
  if (total <= 0) return '░'.repeat(length);
  const filled = Math.round((current / total) * length);
  return '█'.repeat(Math.min(filled, length)) + '░'.repeat(Math.max(length - filled, 0));
}

const levelSlashCmds = [
  {
    name: 'rank',
    description: 'Check your level and XP',
    options: [{ type: 'user', name: 'user', description: 'Check another user\'s rank', required: false }],
    async execute(interaction, runtime, levelsTable) {
      const user = interaction.options.getUser('user') || interaction.user;
      const data = getLevelData(levelsTable, user.id, interaction.guildId);
      const nextLevelXp = data.level * 100;
      const progress = getProgressBar(data.xp, nextLevelXp);

      const container = V2.container(V2.config.brand_color, [
        V2.section(
          [
            V2.text(`## ${user.username}'s Rank`),
            V2.text(`**Level:** ${data.level} | **XP:** ${data.xp} / ${nextLevelXp}`),
            V2.text(`${progress} ${Math.round((data.xp / nextLevelXp) * 100)}%`)
          ],
          V2.thumbnail(user.displayAvatarURL({ extension: 'png', size: 256 }))
        )
      ]);
      await V2.reply(interaction, container, true);
    }
  },
  {
    name: 'leaderboard',
    description: 'Show the XP leaderboard',
    options: [],
    async execute(interaction, runtime, levelsTable) {
      const all = levelsTable.find({ guildId: interaction.guildId });
      all.sort((a, b) => b.level - a.level || b.xp - a.xp);
      const top10 = all.slice(0, 10);

      if (top10.length === 0) {
        return V2.reply(interaction, V2.info('No one has earned XP yet.'));
      }

      const entries = top10.map((d, i) => {
        const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `**${i + 1}.**`;
        return `${medal} <@${d.userId}> — Level ${d.level} (${d.xp} XP)`;
      }).join('\n');

      const container = V2.container(V2.config.brand_color, [
        V2.text('## Leaderboard'),
        V2.separator(),
        V2.text(entries)
      ]);
      await V2.reply(interaction, container);
    }
  },
  {
    name: 'setxp',
    description: 'Set XP for a user (admin only)',
    options: [
      { type: 'user', name: 'user', description: 'Target user', required: true },
      { type: 'integer', name: 'xp', description: 'XP amount', required: true }
    ],
    async execute(interaction, runtime, levelsTable) {
      if (!V2.hasAdminOrOwner(interaction.member, runtime)) {
        return V2.reply(interaction, V2.error('You need Administrator permission.'));
      }

      const user = interaction.options.getUser('user');
      const xp = interaction.options.getInteger('xp');
      const data = getLevelData(levelsTable, user.id, interaction.guildId);
      data.xp = Math.max(0, xp);

      while (data.xp >= data.level * 100) {
        data.xp -= data.level * 100;
        data.level++;
      }

      levelsTable.upsert({ userId: user.id, guildId: interaction.guildId }, data);
      await V2.reply(interaction, V2.success(`Set ${user.tag}'s XP to ${xp} (Level ${data.level}).`));
    }
  }
];

module.exports = { levelSlashCmds };
