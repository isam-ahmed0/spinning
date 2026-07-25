const { V2 } = require('../spinning_core/lib/ui');
const { funSlashCmds } = require('./lib/fun');

const funPluginSlashCmds = [...funSlashCmds];

module.exports = {
  api: {
    slashCommands: funPluginSlashCmds
  },

  async init(config, runtime) {
    const coreApi = runtime.getPluginAPI?.('spinning_core');
    if (coreApi?.registerSlashCommand) {
      for (const cmd of funPluginSlashCmds) {
        coreApi.registerSlashCommand(cmd);
      }
    }
  },

  hooks: {
    interaction_received: async (payload, runtime) => {
      const { interaction } = payload;
      if (!interaction.isChatInputCommand()) return;

      const cmd = funPluginSlashCmds.find(c => c.name === interaction.commandName);
      if (!cmd) return;

      try {
        await cmd.execute(interaction, runtime);
      } catch (e) {
        console.error(`[spinning_fun] Error /${interaction.commandName}:`, e.message);
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
