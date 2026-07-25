const { SlashCommandBuilder } = require('discord.js');
const { REST, Routes } = require('discord.js');
const { buildHelp } = require('./lib/commands');
const { V2 } = require('./lib/ui');

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

async function registerSlashCommands(client, runtime) {
  const clientId = runtime.config.clientId;
  if (!clientId) {
    console.error('[spinning_core] No clientId in spiral.json — skipping slash registration');
    return;
  }

  const rest = new REST({ version: '10' }).setToken(runtime.config.token);
  const body = allSlashCommands.map(buildCommandBody);
  const newNames = new Set(body.map(c => c.name));

  try {
    if (runtime.config.perGuildSlash) {
      const guilds = [...client.guilds.cache.values()];
      console.log(`[spinning_core] Registering ${body.length} commands in ${guilds.length} guild(s)...`);

      for (const guild of guilds) {
        const existing = await rest.get(Routes.applicationGuildCommands(clientId, guild.id)).catch(() => []);
        for (const cmd of existing) {
          if (!newNames.has(cmd.name)) {
            await rest.delete(Routes.applicationGuildCommands(clientId, guild.id, cmd.id));
            console.log(`[spinning_core] Deleted stale command: /${cmd.name} in ${guild.name}`);
          }
        }
        await rest.put(Routes.applicationGuildCommands(clientId, guild.id), { body });
        console.log(`[spinning_core] Registered in ${guild.name}`);
      }
    } else {
      console.log(`[spinning_core] Registering ${body.length} commands globally...`);
      const existing = await rest.get(Routes.applicationCommands(clientId)).catch(() => []);
      for (const cmd of existing) {
        if (!newNames.has(cmd.name)) {
          await rest.delete(Routes.applicationCommands(clientId, cmd.id));
          console.log(`[spinning_core] Deleted stale command: /${cmd.name}`);
        }
      }
      await rest.put(Routes.applicationCommands(clientId), { body });
    }
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
    const cmds = require('./lib/slash');
    for (const cmd of cmds) {
      coreCommands.push(cmd);
      allSlashCommands.push(cmd);
    }
  },

  hooks: {
    bot_ready: async (payload, runtime) => {
      const { client } = payload;
      await registerSlashCommands(client, runtime);
      try {
        await client.user.setActivity('Minimal bot for maximal vibes', { type: 0 });
      } catch {}
      console.log(`[spinning_core] Ready as ${client.user.tag} | ${client.guilds.cache.size} servers`);
    },

    guild_joined: async (payload, runtime) => {
      const { guild } = payload;
      const clientId = runtime.config.clientId;
      if (!clientId || !runtime.config.perGuildSlash) return;

      const rest = new REST({ version: '10' }).setToken(runtime.config.token);
      const body = allSlashCommands.map(buildCommandBody);
      const newNames = new Set(body.map(c => c.name));

      try {
        const existing = await rest.get(Routes.applicationGuildCommands(clientId, guild.id)).catch(() => []);
        for (const cmd of existing) {
          if (!newNames.has(cmd.name)) {
            await rest.delete(Routes.applicationGuildCommands(clientId, guild.id, cmd.id));
            console.log(`[spinning_core] Deleted stale command: /${cmd.name} in ${guild.name}`);
          }
        }
        await rest.put(Routes.applicationGuildCommands(clientId, guild.id), { body });
        console.log(`[spinning_core] Registered slash commands in ${guild.name}`);
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
