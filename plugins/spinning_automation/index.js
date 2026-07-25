const { V2 } = require('../spinning_core/lib/ui');
const { automationSlashCmds, getConfig } = require('./lib/automation');

const tempChannels = new Map();

module.exports = {
  api: {
    slashCommands: automationSlashCmds
  },

  async init(config, runtime) {
    const coreApi = runtime.getPluginAPI?.('spinning_core');
    if (coreApi?.registerSlashCommand) {
      for (const cmd of automationSlashCmds) {
        coreApi.registerSlashCommand(cmd);
      }
    }
  },

  hooks: {
    interaction_received: async (payload, runtime) => {
      const { interaction } = payload;
      if (!interaction.isChatInputCommand()) return;
      const cmd = automationSlashCmds.find(c => c.name === interaction.commandName);
      if (!cmd) return;
      try {
        await cmd.execute(interaction, runtime);
      } catch (e) {
        console.error(`[spinning_automation] Error /${interaction.commandName}:`, e.message);
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

      const config = getConfig(runtime);

      if (config.autoreact_enabled && config.autoreact_config) {
        const content = message.content.toLowerCase();
        for (const rule of config.autoreact_config) {
          if (content.includes(rule.trigger)) {
            try {
              await message.react(rule.emoji);
            } catch {}
          }
        }
      }
    },

    voice_state_update: async (payload, runtime) => {
      const { oldState, newState } = payload;
      const config = getConfig(runtime);

      if (!config.j2c_enabled) return;
      if (!config.j2c_trigger_channel) return;

      const joined = !oldState.channel && newState.channel;
      const left = oldState.channel && !newState.channel;

      if (joined && newState.channel.id === config.j2c_trigger_channel) {
        const guild = newState.guild;
        const member = newState.member;
        if (!member || member.user.bot) return;

        try {
          const channel = await guild.channels.create({
            name: `${member.displayName}'s VC`,
            type: 2,
            parent: config.j2c_category || null,
            permissionOverwrites: [
              { id: guild.id, allow: ['Connect', 'Speak'] },
              { id: member.id, allow: ['Connect', 'Speak', 'ManageChannels'] }
            ]
          });

          tempChannels.set(channel.id, { userId: member.id, guildId: guild.id });
          await member.voice.setChannel(channel);
        } catch (e) {
          console.error('[spinning_automation] J2C create failed:', e.message);
        }
      }

      if (left && tempChannels.has(oldState.channel.id)) {
        const tempData = tempChannels.get(oldState.channel.id);
        const channel = oldState.channel;

        if (channel.members.filter(m => !m.user.bot).size === 0) {
          tempChannels.delete(channel.id);
          try {
            await channel.delete();
          } catch {}
        }
      }
    }
  }
};
