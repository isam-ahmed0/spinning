const { SlashCommandBuilder } = require('discord.js');
const { REST, Routes } = require('discord.js');
const path = require('path');
const { buildHelp } = require('./lib/commands');
const { V2 } = require('./lib/ui');

let allSlashCommands = [];

async function registerSlashCommands(client, runtime) {
  const clientId = runtime.config.clientId;
  if (!clientId) {
    console.error('[spinning_core] No clientId in spiral.json — skipping slash registration');
    return;
  }

  const rest = new REST({ version: '10' }).setToken(runtime.config.token);

  const body = allSlashCommands.map(cmd => {
    const builder = new SlashCommandBuilder()
      .setName(cmd.name)
      .setDescription(cmd.description);

    if (cmd.options) {
      for (const opt of cmd.options) {
        if (opt.type === 'user') builder.addUserOption(o => o.setName(opt.name).setDescription(opt.description).setRequired(opt.required || false));
        else if (opt.type === 'channel') builder.addChannelOption(o => o.setName(opt.name).setDescription(opt.description).setRequired(opt.required || false));
        else if (opt.type === 'string') builder.addStringOption(o => o.setName(opt.name).setDescription(opt.description).setRequired(opt.required || false));
        else if (opt.type === 'integer') builder.addIntegerOption(o => o.setName(opt.name).setDescription(opt.description).setRequired(opt.required || false));
        else if (opt.type === 'boolean') builder.addBooleanOption(o => o.setName(opt.name).setDescription(opt.description).setRequired(opt.required || false));
      }
    }

    return builder.toJSON();
  });

  try {
    console.log(`[spinning_core] Registering ${body.length} slash commands...`);
    await rest.put(Routes.applicationCommands(clientId), { body });
    console.log(`[spinning_core] Slash commands registered.`);
  } catch (e) {
    console.error('[spinning_core] Slash registration error:', e.message);
  }
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
    const coreCmds = require('./lib/slash');
    for (const cmd of coreCmds) {
      allSlashCommands.push(cmd);
    }
  },

  hooks: {
    bot_ready: async (payload, runtime) => {
      const { client, config } = payload;

      await registerSlashCommands(client, runtime);

      try {
        await client.user.setActivity('Minimal bot for maximal vibes', { type: 0 });
      } catch {}

      console.log(`[spinning_core] Ready as ${client.user.tag} | ${client.guilds.cache.size} servers`);
    },

    interaction_received: async (payload, runtime) => {
      const { interaction } = payload;
      if (!interaction.isChatInputCommand()) return;

      const cmd = allSlashCommands.find(c => c.name === interaction.commandName);
      if (!cmd) return;

      try {
        await cmd.execute(interaction, runtime);
      } catch (e) {
        console.error(`[spinning_core] Error executing /${interaction.commandName}:`, e.message);
        const errReply = V2.error(`An error occurred: ${e.message}`);
        if (interaction.replied || interaction.deferred) {
          await interaction.followUp({ components: [errReply], flags: V2.FLAG, ephemeral: true }).catch(() => {});
        } else {
          await interaction.reply({ components: [errReply], flags: V2.FLAG, ephemeral: true }).catch(() => {});
        }
      }
    }
  }
};
