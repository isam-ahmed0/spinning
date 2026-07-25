const { V2 } = require('../spinning_core/lib/ui');
const { blacklistSlashCmds, isBlacklisted } = require('./lib/blacklist');

module.exports = {
  api: { slashCommands: [...blacklistSlashCmds] },
  async init(config, runtime) {
    const coreApi = runtime.getPluginAPI?.('spinning_core');
    if (coreApi?.registerSlashCommand) {
      for (const cmd of blacklistSlashCmds) coreApi.registerSlashCommand(cmd);
    }
  },
  hooks: {
    interaction_received: async (payload, runtime) => {
      const { interaction } = payload;
      if (!interaction.isChatInputCommand()) return;
      const cmd = blacklistSlashCmds.find(c => c.name === interaction.commandName);
      if (!cmd) return;
      try { await cmd.execute(interaction, runtime); } catch (e) {
        console.error(`[spinning_blacklist] Error /${interaction.commandName}:`, e.message);
        try { await V2.reply(interaction, V2.error(`Error: ${e.message}`), true); } catch {}
      }
    },

    bot_ready: async (payload, runtime) => {
      const client = payload.client;
      client.on('guildCreate', async (guild) => {
        const result = isBlacklisted(client.user.id, guild.id);
        if (result.blacklisted) {
          console.log(`[spinning_blacklist] Leaving blacklisted guild: ${guild.name} (${guild.id}) — ${result.reason}`);
          await guild.leave().catch(() => {});
        }
      });
    }
  }
};
