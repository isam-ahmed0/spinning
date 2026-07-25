const { V2 } = require('../spinning_core/lib/ui');
const { statsSlashCmds } = require('./lib/stats');

const statsPluginSlashCmds = [...statsSlashCmds];

module.exports = {
  api: { slashCommands: statsPluginSlashCmds },
  async init(config, runtime) {
    const coreApi = runtime.getPluginAPI?.('spinning_core');
    if (coreApi?.registerSlashCommand) {
      for (const cmd of statsPluginSlashCmds) coreApi.registerSlashCommand(cmd);
    }
  },
  hooks: {
    interaction_received: async (payload, runtime) => {
      const { interaction } = payload;
      if (!interaction.isChatInputCommand()) return;
      const cmd = statsPluginSlashCmds.find(c => c.name === interaction.commandName);
      if (!cmd) return;
      try { await cmd.execute(interaction, runtime); } catch (e) {
        console.error(`[spinning_stats] Error /${interaction.commandName}:`, e.message);
        try { await V2.reply(interaction, V2.error(`Error: ${e.message}`), true); } catch {}
      }
    }
  }
};
