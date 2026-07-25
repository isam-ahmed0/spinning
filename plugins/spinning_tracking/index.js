const { V2 } = require('../spinning_core/lib/ui');
const { trackingSlashCmds, trackMessage } = require('./lib/tracking');

module.exports = {
  api: { slashCommands: [...trackingSlashCmds] },
  async init(config, runtime) {
    const coreApi = runtime.getPluginAPI?.('spinning_core');
    if (coreApi?.registerSlashCommand) {
      for (const cmd of trackingSlashCmds) coreApi.registerSlashCommand(cmd);
    }
  },
  hooks: {
    interaction_received: async (payload, runtime) => {
      const { interaction } = payload;
      if (!interaction.isChatInputCommand()) return;
      const cmd = trackingSlashCmds.find(c => c.name === interaction.commandName);
      if (!cmd) return;
      try { await cmd.execute(interaction, runtime); } catch (e) {
        console.error(`[spinning_tracking] Error /${interaction.commandName}:`, e.message);
        try { await V2.reply(interaction, V2.error(`Error: ${e.message}`), true); } catch {}
      }
    },

    message_received: async (payload, runtime) => {
      const { message } = payload;
      if (!message.guild) return;
      if (message.author.bot) return;
      trackMessage(message.guild.id, message.author.id);
    },

    bot_ready: async (payload, runtime) => {
      const client = payload.client;
      try {
        for (const [, guild] of client.guilds.cache) {
          try {
            const invites = await guild.invites.fetch();
            for (const [code, invite] of invites) {
              const { trackInvite } = require('./lib/tracking');
              trackInvite(guild.id, code, invite.uses, invite.inviter?.id);
            }
          } catch {}
        }
      } catch {}
    }
  }
};
