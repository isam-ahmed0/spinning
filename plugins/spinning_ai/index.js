const { V2 } = require('../spinning_core/lib/ui');
const { aiSlashCmds } = require('./lib/groq');

module.exports = {
  api: {
    slashCommands: aiSlashCmds
  },

  async init(config, runtime) {
    const coreApi = runtime.getPluginAPI?.('spinning_core');
    if (coreApi?.registerSlashCommand) {
      for (const cmd of aiSlashCmds) {
        coreApi.registerSlashCommand(cmd);
      }
    }
  },

  hooks: {
    interaction_received: async (payload, runtime) => {
      const { interaction } = payload;
      if (!interaction.isChatInputCommand()) return;
      const cmd = aiSlashCmds.find(c => c.name === interaction.commandName);
      if (!cmd) return;
      try {
        await cmd.execute(interaction, runtime);
      } catch (e) {
        console.error(`[spinning_ai] Error /${interaction.commandName}:`, e.message);
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
      if (message.author.bot) return;

      const config = runtime.getPluginConfig('spinning_ai');
      if (!config.ai_enabled) return;
      if (!config.ai_channels || !config.ai_channels.includes(message.channelId)) return;

      const apiKey = runtime.config.groq_api_key;
      if (!apiKey) return;

      const { groqRequest } = require('./lib/groq');

      try {
        addToHistory(message.author.id, 'user', message.content);

        const messages = [
          { role: 'system', content: require('./lib/groq').SYSTEM_PROMPT || 'You are a helpful assistant.' },
          ...getHistory(message.author.id)
        ];

        const reply = await groqRequest(messages, config.ai_model || 'llama-3.3-70b-versatile', apiKey);
        addToHistory(message.author.id, 'assistant', reply);

        const container = V2.container(V2.config.brand_color, [
          V2.text(reply.slice(0, 2000))
        ]);

        await message.channel.send({ components: [container], flags: V2.FLAG }).catch(() => {});
      } catch (e) {
        console.error('[spinning_ai] Auto-reply error:', e.message);
      }
    }
  }
};
