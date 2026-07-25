const { V2 } = require('../spinning_core/lib/ui');
const { listSlashCmds } = require('./lib/list');

const listPluginSlashCmds = [...listSlashCmds];

module.exports = {
  api: { slashCommands: listPluginSlashCmds },
  async init(config, runtime) {
    const coreApi = runtime.getPluginAPI?.('spinning_core');
    if (coreApi?.registerSlashCommand) {
      for (const cmd of listPluginSlashCmds) coreApi.registerSlashCommand(cmd);
    }
  },
  hooks: {
    interaction_received: async (payload, runtime) => {
      const { interaction } = payload;
      if (!interaction.isChatInputCommand()) return;
      const cmd = listPluginSlashCmds.find(c => c.name === interaction.commandName);
      if (!cmd) return;
      try { await cmd.execute(interaction, runtime); } catch (e) {
        console.error(`[spinning_list] Error /${interaction.commandName}:`, e.message);
        try { await V2.reply(interaction, V2.error(`Error: ${e.message}`), true); } catch {}
      }
    }
  }
};
