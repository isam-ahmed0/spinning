const { V2 } = require('../../spinning_core/lib/ui');
const emojis = require('../../../emojis.json');

const afkUsers = new Map();

function checkAfk(message, runtime) {
  if (message.author.bot) return;
  if (!message.guild) return;

  const key = `${message.author.id}.${message.guild.id}`;

  if (afkUsers.has(key)) {
    const afkData = afkUsers.get(key);
    afkUsers.delete(key);

    const duration = Math.floor((Date.now() - afkData.timestamp) / 1000);
    const mins = Math.floor(duration / 60);
    const secs = duration % 60;
    const timeStr = mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;

    const container = V2.container('#57F287', [
      V2.text(`${emojis.success} **Welcome Back!**`),
      V2.separator(),
      V2.text(`<@${message.author.id}>, your AFK has been removed. (**${timeStr}**)`)
    ]);

    message.channel.send({ components: [container], flags: V2.FLAG }).catch(() => {});
  }

  for (const [mentionKey, afkData] of afkUsers) {
    const mentionUserId = mentionKey.split('.')[0];
    if (message.mentions.users.has(mentionUserId)) {
      const duration = Math.floor((Date.now() - afkData.timestamp) / 1000);
      const mins = Math.floor(duration / 60);
      const secs = duration % 60;
      const timeStr = mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;

      const container = V2.container('#FEE75C', [
        V2.text(`${emojis.timer} **AFK**`),
        V2.separator(),
        V2.text(`<@${mentionUserId}> is currently AFK${afkData.reason ? `: ${afkData.reason}` : ''} (for **${timeStr}**)`)
      ]);

      message.channel.send({ components: [container], flags: V2.FLAG }).catch(() => {});
      break;
    }
  }
}

const afkSlashCmds = [
  {
    name: 'afk',
    description: 'Set your AFK status',
    options: [{ type: 'string', name: 'reason', description: 'AFK reason', required: false }],
    async execute(interaction) {
      const reason = interaction.options.getString('reason') || '';
      const key = `${interaction.user.id}.${interaction.guild.id}`;

      afkUsers.set(key, {
        reason,
        timestamp: Date.now()
      });

      const container = V2.container(V2.config.brand_color, [
        V2.text(`${emojis.timer} **AFK Set**`),
        V2.separator(),
        V2.text(`<@${interaction.user.id}>, you are now AFK${reason ? `: ${reason}` : ''}.`)
      ]);

      await V2.reply(interaction, container, true);
    }
  }
];

module.exports = { afkSlashCmds, checkAfk, afkUsers };
