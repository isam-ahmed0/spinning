const { V2 } = require('../spinning_core/lib/ui');
const { Database, Table } = require('../../lib/db');
const { funSlashCmds } = require('./lib/fun');
const { levelSlashCmds } = require('./lib/leveling');
const { utilitySlashCmds, cacheDelete } = require('./lib/utility');
const { checkFlood } = require('./lib/antiraid');
const { roleplaySlashCmds } = require('./lib/roleplay');
const { afkSlashCmds, checkAfk } = require('./lib/afk');
const { remindSlashCmds, checkReminders } = require('./lib/reminders');
const { todoSlashCmds } = require('./lib/todo');
const { calcSlashCmds } = require('./lib/calc');

const db = new Database();
const levelsTable = new Table(db, 'levels');
const warningsTable = new Table(db, 'warnings');
const xpCooldowns = new Map();

const engageSlashCmds = [
  ...funSlashCmds,
  ...levelSlashCmds,
  ...utilitySlashCmds,
  ...roleplaySlashCmds,
  ...afkSlashCmds,
  ...remindSlashCmds,
  ...todoSlashCmds,
  ...calcSlashCmds
];

function getConfig(runtime) {
  return runtime.getPluginConfig('spinning_engage');
}

function handleXpGain(message, runtime) {
  if (message.author.bot) return;
  const config = getConfig(runtime);
  const now = Date.now();
  const lastXp = xpCooldowns.get(message.author.id) || 0;
  if (now - lastXp < (config.xp_cooldown || 60) * 1000) return;
  xpCooldowns.set(message.author.id, now);

  const min = config.xp_min || 15;
  const max = config.xp_max || 35;
  const xpGain = Math.floor(Math.random() * (max - min + 1)) + min;

  const current = levelsTable.findOne({ userId: message.author.id, guildId: message.guildId }) || {
    userId: message.author.id,
    guildId: message.guildId,
    xp: 0,
    level: 1
  };

  current.xp += xpGain;
  const nextLevelXp = current.level * 100;

  if (current.xp >= nextLevelXp) {
    current.level++;
    current.xp -= nextLevelXp;
    announceLevelUp(message, current, runtime);
  }

  levelsTable.upsert({ userId: message.author.id, guildId: message.guildId }, current);
}

async function announceLevelUp(message, data, runtime) {
  const config = getConfig(runtime);
  const channelId = config.xp_announce_channel;
  const channel = channelId
    ? message.guild.channels.cache.get(channelId)
    : message.channel;

  if (!channel) return;

  const container = V2.container(V2.config.brand_color, [
    V2.text('## Level Up!'),
    V2.separator(),
    V2.text(`Congratulations <@${message.author.id}>! You reached **Level ${data.level}**!`)
  ]);

  await channel.send({ components: [container], flags: V2.FLAG }).catch(() => {});
}

let reminderInterval = null;

module.exports = {
  api: {
    slashCommands: engageSlashCmds,
    levelsTable,
    warningsTable
  },

  async init(config, runtime) {
    const coreApi = runtime.getPluginAPI?.('spinning_core');
    if (coreApi?.registerSlashCommand) {
      for (const cmd of engageSlashCmds) {
        coreApi.registerSlashCommand(cmd);
      }
    }
  },

  hooks: {
    bot_ready: async (payload, runtime) => {
      if (reminderInterval) clearInterval(reminderInterval);
      reminderInterval = setInterval(() => {
        checkReminders(payload.client);
      }, 10000);
    },

    interaction_received: async (payload, runtime) => {
      const { interaction } = payload;
      if (!interaction.isChatInputCommand()) return;

      if (interaction.isButton()) {
        const customId = interaction.customId;
        if (customId.includes('_back_')) {
          const parts = customId.split('_back_');
          const action = parts[0];
          const initiatorId = parts[1];
          const targetId = parts[2];
          if (interaction.user.id === targetId) {
            const container = V2.container(V2.config.brand_color, [
              V2.section(
                [V2.text(`**${interaction.user.username}** does it back! 🔄`)],
                V2.thumbnail(interaction.user.displayAvatarURL({ extension: 'png', size: 256 }))
              )
            ]);
            await V2.reply(interaction, container);
          } else {
            await V2.reply(interaction, V2.error('This action is not for you.'), true);
          }
        }
        return;
      }

      const cmd = engageSlashCmds.find(c => c.name === interaction.commandName);
      if (!cmd) return;
      try {
        await cmd.execute(interaction, runtime, levelsTable);
      } catch (e) {
        console.error(`[spinning_engage] Error /${interaction.commandName}:`, e.message);
        const errReply = V2.error(`Error: ${e.message}`);
        try {
          if (interaction.replied || interaction.deferred) {
            await interaction.followUp({ components: [errReply], flags: V2.FLAG });
          } else {
            await interaction.reply({ components: [errReply], flags: V2.FLAG });
          }
        } catch {}
      }
    },

    message_received: async (payload, runtime) => {
      const { message } = payload;
      if (!message.guild) return;
      checkAfk(message, runtime);
      handleXpGain(message, runtime);
      await checkFlood(message, runtime);
    },

    message_delete: async (payload, runtime) => {
      const { message } = payload;
      if (!message || !message.guild) return;
      cacheDelete(message);
    }
  }
};
