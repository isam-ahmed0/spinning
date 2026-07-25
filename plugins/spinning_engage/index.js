const { V2 } = require('../spinning_core/lib/ui');
const { Database, Table } = require('../../lib/db');

const { levelSlashCmds } = require('./lib/leveling');
const { utilitySlashCmds, cacheDelete } = require('./lib/utility');
const { checkFlood } = require('./lib/antiraid');
const { roleplaySlashCmds, roleplayActions } = require('./lib/roleplay');
const { afkSlashCmds, handleAfkMessage, handleAfkButton } = require('./lib/afk');
const { remindSlashCmds, checkReminders } = require('./lib/reminders');
const { todoSlashCmds } = require('./lib/todo');
const { calcSlashCmds } = require('./lib/calc');

const db = new Database();
const levelsTable = new Table(db, 'levels');
const warningsTable = new Table(db, 'warnings');
const xpCooldowns = new Map();

const engageSlashCmds = [
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
        if (handleAfkButton(interaction)) return;

        const customId = interaction.customId;
        if (customId.includes('_back_') && !customId.startsWith('j2c_')) {
          const parts = customId.split('_back_');
          if (parts.length === 2) {
            const action = parts[0];
            const ids = parts[1].split('_');
            if (ids.length === 2 && roleplayActions[action]) {
              const [initiatorId, targetId] = ids;

              if (interaction.user.id !== targetId) {
                return V2.reply(interaction, { content: 'This button is not for you!', flags: 64 });
              }

              try {
                const { buildRoleplayResponse } = require('./lib/roleplay');
                const { MessageFlags } = require('discord.js');
                await interaction.deferReply({ flags: MessageFlags.IsPersistent | MessageFlags.IsComponentsV2 });
                const initiator = await interaction.client.users.fetch(initiatorId);
                const responder = interaction.user;
                const container = await buildRoleplayResponse(action, responder, initiator, false);

                if (container) {
                  await interaction.editReply({ components: [container], flags: MessageFlags.IsPersistent | MessageFlags.IsComponentsV2 });
                } else {
                  await interaction.editReply({ content: 'Failed to fetch GIF. Please try again later!' });
                }
              } catch (error) {
                console.error(`[spinning_engage] Error handling roleplay button ${action}:`, error);
                try {
                  if (!interaction.replied && !interaction.deferred) {
                    await interaction.reply({ content: 'There was an error processing this action!', flags: 64 });
                  } else if (interaction.deferred && !interaction.replied) {
                    await interaction.editReply({ content: 'There was an error processing this action!' });
                  }
                } catch {}
              }
              return;
            }
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
      handleAfkMessage(message);
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
