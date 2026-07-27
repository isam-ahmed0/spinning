const { buildHelp } = require('./lib/commands');
const { V2 } = require('./lib/ui');
const { ownerSlashCmds } = require('./lib/owner');
const { runEmojiSync } = require('../../lib/emojiSync');

const { SlashCommandBuilder } = require('discord.js');

const coreCommands = [];
const allSlashCommands = [];

function buildCommandBody(cmd) {
  const builder = new SlashCommandBuilder()
    .setName(cmd.name)
    .setDescription(cmd.description);

  if (cmd.options) {
    for (const opt of cmd.options) {
      if (opt.type === 'user') builder.addUserOption(o => o.setName(opt.name).setDescription(opt.description).setRequired(opt.required || false));
      else if (opt.type === 'channel') builder.addChannelOption(o => o.setName(opt.name).setDescription(opt.description).setRequired(opt.required || false));
      else if (opt.type === 'role') builder.addRoleOption(o => o.setName(opt.name).setDescription(opt.description).setRequired(opt.required || false));
      else if (opt.type === 'string') builder.addStringOption(o => o.setName(opt.name).setDescription(opt.description).setRequired(opt.required || false));
      else if (opt.type === 'integer') builder.addIntegerOption(o => o.setName(opt.name).setDescription(opt.description).setRequired(opt.required || false));
      else if (opt.type === 'boolean') builder.addBooleanOption(o => o.setName(opt.name).setDescription(opt.description).setRequired(opt.required || false));
    }
  }

  return builder.toJSON();
}

module.exports = {
  api: {
    slashCommands: allSlashCommands,
    registerSlashCommand(cmd) {
      allSlashCommands.push(cmd);
    },
    getAllSlashCommands() {
      return allSlashCommands;
    }
  },

  async init(config, runtime) {
    await runEmojiSync();

    const cmds = require('./lib/slash');
    for (const cmd of cmds) {
      coreCommands.push(cmd);
      allSlashCommands.push(cmd);
    }
    for (const cmd of ownerSlashCmds) {
      coreCommands.push(cmd);
      allSlashCommands.push(cmd);
    }
  },

  hooks: {
    bot_ready: async (payload, runtime) => {
      const { client } = payload;
      const clientId = runtime.config.clientId;
      if (clientId) {
        try {
          await runtime.registerSlashCommands(clientId, allSlashCommands.map(buildCommandBody));
        } catch (e) {
          console.error('[spinning_core] Slash registration error:', e.message);
        }
      }
      try {
        await client.user.setActivity('Minimal bot for maximal vibes', { type: 0 });
      } catch {}
      try {
        client.user.setPresence({ status: 'online' });
      } catch {}
      console.log(`[spinning_core] Ready as ${client.user.tag} | ${client.guilds.cache.size} servers`);
    },

    guild_joined: async (payload, runtime) => {
      const { guild } = payload;
      const clientId = runtime.config.clientId;
      if (!clientId || !runtime.config.perGuildSlash) return;
      try {
        await runtime.registerSlashCommands(clientId, allSlashCommands.map(buildCommandBody), { guilds: [guild] });
      } catch (e) {
        console.error(`[spinning_core] Failed to register in ${guild.name}:`, e.message);
      }
    },

    interaction_received: async (payload, runtime) => {
      const { interaction } = payload;
      if (!interaction.isChatInputCommand()) return;

      const cmd = coreCommands.find(c => c.name === interaction.commandName);
      if (!cmd) return;

      try {
        await cmd.execute(interaction, runtime);
      } catch (e) {
        console.error(`[spinning_core] Error executing /${interaction.commandName}:`, e.message);
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
