const { V2 } = require('../spinning_core/lib/ui');
const { giveawaySlashCmds, giveawayEntries, giveawaysTable, checkGiveaways } = require('./lib/giveaway');

let giveawayInterval = null;

module.exports = {
  api: {
    slashCommands: giveawaySlashCmds,
    giveawaysTable,
    giveawayEntries
  },

  async init(config, runtime) {
    const coreApi = runtime.getPluginAPI?.('spinning_core');
    if (coreApi?.registerSlashCommand) {
      for (const cmd of giveawaySlashCmds) {
        coreApi.registerSlashCommand(cmd);
      }
    }
  },

  hooks: {
    bot_ready: async (payload, runtime) => {
      if (giveawayInterval) clearInterval(giveawayInterval);
      giveawayInterval = setInterval(() => {
        checkGiveaways(payload.client);
      }, 10000);
    },

    interaction_received: async (payload, runtime) => {
      const { interaction } = payload;

      if (interaction.isButton() && interaction.customId.startsWith('giveaway_enter_')) {
        const giveawayId = interaction.customId.replace('giveaway_enter_', '');
        const giveaway = giveawaysTable.findOne({ _id: giveawayId });
        if (!giveaway) {
          return V2.reply(interaction, V2.error('Giveaway not found.'), true);
        }
        if (giveaway.ended) {
          return V2.reply(interaction, V2.error('Giveaway already ended.'), true);
        }

        const existing = giveawayEntries.findOne({ giveawayId, userId: interaction.user.id });
        if (existing) {
          return V2.reply(interaction, V2.error('You already entered!'), true);
        }

        giveawayEntries.insert({ giveawayId, userId: interaction.user.id, enteredAt: Date.now() });
        const entries = giveawayEntries.find({ giveawayId });
        await V2.reply(interaction, V2.success(`You entered! (${entries.length} entries)`), true);
        return;
      }

      if (interaction.isButton() && interaction.customId.startsWith('giveaway_participants_')) {
        const giveawayId = interaction.customId.replace('giveaway_participants_', '');
        const entries = giveawayEntries.find({ giveawayId });
        if (entries.length === 0) {
          return V2.reply(interaction, V2.info('No entries yet.'), true);
        }

        const list = entries.slice(0, 25).map((e, i) => `${i + 1}. <@${e.userId}>`).join('\n');
        const container = V2.container(V2.config.brand_color, [
          V2.text(`**Entries (${entries.length})**`),
          V2.separator(),
          V2.text(list)
        ]);

        await V2.reply(interaction, container, true);
        return;
      }

      if (!interaction.isChatInputCommand()) return;
      const cmd = giveawaySlashCmds.find(c => c.name === interaction.commandName);
      if (!cmd) return;
      try {
        await cmd.execute(interaction, runtime);
      } catch (e) {
        console.error(`[spinning_giveaway] Error /${interaction.commandName}:`, e.message);
        const errReply = V2.error(`Error: ${e.message}`);
        try {
          if (interaction.replied || interaction.deferred) {
            await interaction.followUp({ components: [errReply], flags: V2.FLAG });
          } else {
            await interaction.reply({ components: [errReply], flags: V2.FLAG });
          }
        } catch {}
      }
    }
  }
};
