const { V2 } = require('../spinning_core/lib/ui');
const { sendWelcome, sendGoodbye, welcomeTable } = require('./lib/welcome');
const { moderationSlashCmds } = require('./lib/moderation');
const { handleAutoRole } = require('./lib/autorole');
const { voiceSlashCmds } = require('./lib/voice');
const { farewellSlashCmds } = require('./lib/farewell');
const { checkAntinukeEvent } = require('./lib/antinuke');
const { checkAutomod } = require('./lib/automod');
const {
  logMemberJoin, logMemberRemove, logBanAdd, logBanRemove,
  logRoleCreate, logRoleDelete, logChannelCreate, logChannelDelete,
  logVoiceState, logMessageEdit, logMessageDelete, loggingTable, getLogConfig
} = require('./lib/logging-extended');

const serverSlashCmds = [
  {
    name: 'setwelcome',
    description: 'Set the welcome channel and type',
    options: [
      { type: 'channel', name: 'channel', description: 'Channel for welcome messages', required: true },
      { type: 'string', name: 'type', description: 'Type: simple or container', required: false }
    ],
    async execute(interaction, runtime) {
      if (!V2.hasAdminOrOwner(interaction.member, runtime)) {
        return V2.reply(interaction, V2.error('You need Administrator permission.'));
      }
      const channel = interaction.options.getChannel('channel');
      const type = interaction.options.getString('type') || 'simple';
      welcomeTable.upsert({ guildId: interaction.guildId }, {
        guildId: interaction.guildId,
        channelId: channel.id,
        type: type === 'container' ? 'container' : 'simple',
        enabled: true
      });
      await V2.reply(interaction, V2.success(`Welcome channel set to <#${channel.id}> (type: ${type})`));
    }
  },
  {
    name: 'setgoodbye',
    description: 'Set the goodbye channel',
    options: [{ type: 'channel', name: 'channel', description: 'Channel for goodbye messages', required: true }],
    async execute(interaction, runtime) {
      if (!V2.hasAdminOrOwner(interaction.member, runtime)) {
        return V2.reply(interaction, V2.error('You need Administrator permission.'));
      }
      const channel = interaction.options.getChannel('channel');
      welcomeTable.upsert({ guildId: interaction.guildId }, {
        guildId: interaction.guildId,
        goodbyeChannelId: channel.id,
        goodbyeEnabled: true,
        goodbyeType: 'simple'
      });
      await V2.reply(interaction, V2.success(`Goodbye channel set to <#${channel.id}>`));
    }
  },
  {
    name: 'testwelcome',
    description: 'Test the welcome message in the current channel',
    options: [],
    async execute(interaction, runtime) {
      if (!V2.hasAdminOrOwner(interaction.member, runtime)) {
        return V2.reply(interaction, V2.error('You need Administrator permission.'));
      }
      await sendWelcome(interaction.member, runtime, interaction.channel);
      await V2.reply(interaction, V2.success('Welcome test sent!'));
    }
  },
  {
    name: 'setlog',
    description: 'Set log channels (per-type or default)',
    options: [
      { type: 'channel', name: 'channel', description: 'Channel for logs', required: true },
      { type: 'string', name: 'type', description: 'Log type: default, member, mod, message, voice, server', required: false }
    ],
    async execute(interaction, runtime) {
      if (!V2.hasAdminOrOwner(interaction.member, runtime)) {
        return V2.reply(interaction, V2.error('You need Administrator permission.'));
      }
      const channel = interaction.options.getChannel('channel');
      const type = interaction.options.getString('type') || 'default';
      const config = getLogConfig(interaction.guildId);
      if (!config.channels) config.channels = {};
      config.channels[type] = channel.id;
      config.enabled = true;
      loggingTable.upsert({ guildId: interaction.guildId }, config);
      await V2.reply(interaction, V2.success(`Log channel for **${type}** set to <#${channel.id}>`));
    }
  },
  {
    name: 'togglelog',
    description: 'Enable or disable logging',
    options: [{ type: 'boolean', name: 'enabled', description: 'Enable or disable', required: true }],
    async execute(interaction, runtime) {
      if (!V2.hasAdminOrOwner(interaction.member, runtime)) {
        return V2.reply(interaction, V2.error('You need Administrator permission.'));
      }
      const enabled = interaction.options.getBoolean('enabled');
      const config = getLogConfig(interaction.guildId);
      config.enabled = enabled;
      loggingTable.upsert({ guildId: interaction.guildId }, config);
      await V2.reply(interaction, V2.success(`Logging ${enabled ? 'enabled' : 'disabled'}.`));
    }
  },
  {
    name: 'setautorole',
    description: 'Set the auto-role for new members',
    options: [{ type: 'role', name: 'role', description: 'Role to auto-assign', required: true }],
    async execute(interaction, runtime) {
      if (!V2.hasAdminOrOwner(interaction.member, runtime)) {
        return V2.reply(interaction, V2.error('You need Administrator permission.'));
      }
      const role = interaction.options.getRole('role');
      const config = runtime.getPluginConfig('spinning_server');
      config.autorole_id = role.id;
      await V2.reply(interaction, V2.success(`Auto-role set to <@&${role.id}>`));
    }
  },
  {
    name: 'removeautorole',
    description: 'Remove the auto-role',
    options: [],
    async execute(interaction, runtime) {
      if (!V2.hasAdminOrOwner(interaction.member, runtime)) {
        return V2.reply(interaction, V2.error('You need Administrator permission.'));
      }
      const config = runtime.getPluginConfig('spinning_server');
      config.autorole_id = '';
      await V2.reply(interaction, V2.success('Auto-role removed.'));
    }
  },
  ...moderationSlashCmds,
  {
    name: 'antinuke',
    description: 'Configure antinuke protection',
    options: [
      { type: 'string', name: 'action', description: 'enable, disable, settings, or whitelist', required: true },
      { type: 'string', name: 'subaction', description: 'For whitelist: add, remove, show', required: false },
      { type: 'string', name: 'value', description: 'User ID or value', required: false }
    ],
    async execute(interaction, runtime) {
      if (!V2.hasAdminOrOwner(interaction.member, runtime)) {
        return V2.reply(interaction, V2.error('You need Administrator permission.'), true);
      }
      const action = interaction.options.getString('action');
      const sub = interaction.options.getString('subaction');
      const value = interaction.options.getString('value');
      const config = runtime.getPluginConfig('spinning_server');

      if (action === 'enable') {
        config.antinuke_enabled = true;
        await V2.reply(interaction, V2.success('Antinuke enabled.'));
      } else if (action === 'disable') {
        config.antinuke_enabled = false;
        await V2.reply(interaction, V2.success('Antinuke disabled.'));
      } else if (action === 'settings') {
        const container = V2.container(V2.config.brand_color, [
          V2.text('## Antinuke Settings'),
          V2.separator(),
          V2.text(`**Enabled:** ${config.antinuke_enabled ? 'Yes' : 'No'}`),
          V2.text(`**Threshold:** ${config.antinuke_threshold || 3} actions`),
          V2.text(`**Punishment:** ${config.antinuke_punishment || 'kick'}`),
          V2.text(`**Whitelist:** ${(config.antinuke_whitelist || []).length} entries`)
        ]);
        await V2.reply(interaction, container);
      } else if (action === 'whitelist') {
        if (!sub) return V2.reply(interaction, V2.error('Specify: add, remove, or show'), true);
        if (!config.antinuke_whitelist) config.antinuke_whitelist = [];
        if (sub === 'add' && value) {
          config.antinuke_whitelist.push({ id: value, events: [] });
          await V2.reply(interaction, V2.success(`Added <@${value}> to antinuke whitelist.`));
        } else if (sub === 'remove' && value) {
          config.antinuke_whitelist = config.antinuke_whitelist.filter(w => w.id !== value);
          await V2.reply(interaction, V2.success(`Removed <@${value}> from antinuke whitelist.`));
        } else if (sub === 'show') {
          const list = config.antinuke_whitelist.map(w => `<@${w.id}>`).join('\n') || 'None';
          await V2.reply(interaction, V2.container(V2.config.brand_color, [
            V2.text('## Antinuke Whitelist'),
            V2.separator(),
            V2.text(list)
          ]));
        }
      }
    }
  },
  {
    name: 'automod',
    description: 'Configure automod rules',
    options: [
      { type: 'string', name: 'action', description: 'enable, disable, or settings', required: true },
      { type: 'string', name: 'rule', description: 'Rule: spam, invite, link, badwords, massmention, ping, caps', required: false },
      { type: 'boolean', name: 'enabled', description: 'Enable/disable the rule', required: false }
    ],
    async execute(interaction, runtime) {
      if (!V2.hasAdminOrOwner(interaction.member, runtime)) {
        return V2.reply(interaction, V2.error('You need Administrator permission.'), true);
      }
      const action = interaction.options.getString('action');
      const rule = interaction.options.getString('rule');
      const enabled = interaction.options.getBoolean('enabled');
      const config = runtime.getPluginConfig('spinning_server');

      if (action === 'enable') {
        config.automod_enabled = true;
        await V2.reply(interaction, V2.success('Automod enabled.'));
      } else if (action === 'disable') {
        config.automod_enabled = false;
        await V2.reply(interaction, V2.success('Automod disabled.'));
      } else if (action === 'settings') {
        const rules = ['spam', 'invite', 'link', 'badwords', 'massmention', 'ping', 'caps'];
        const lines = rules.map(r => `**${r}:** ${config[`automod_${r}_enabled`] ? 'ON' : 'OFF'}`).join('\n');
        const container = V2.container(V2.config.brand_color, [
          V2.text('## Automod Settings'),
          V2.separator(),
          V2.text(`**Global:** ${config.automod_enabled ? 'Enabled' : 'Disabled'}`),
          V2.separator(),
          V2.text(lines)
        ]);
        await V2.reply(interaction, container);
      } else if (action === 'toggle' && rule) {
        const key = `automod_${rule}_enabled`;
        config[key] = enabled !== null ? enabled : !config[key];
        await V2.reply(interaction, V2.success(`${rule} ${config[key] ? 'enabled' : 'disabled'}.`));
      }
    }
  },
  ...voiceSlashCmds,
  ...farewellSlashCmds
];

module.exports = {
  api: {
    slashCommands: serverSlashCmds
  },

  async init(config, runtime) {
    const coreApi = runtime.getPluginAPI?.('spinning_core');
    if (coreApi?.registerSlashCommand) {
      for (const cmd of serverSlashCmds) {
        coreApi.registerSlashCommand(cmd);
      }
    }
  },

  hooks: {
    interaction_received: async (payload, runtime) => {
      const { interaction } = payload;
      if (!interaction.isChatInputCommand()) return;
      const cmd = serverSlashCmds.find(c => c.name === interaction.commandName);
      if (!cmd) return;
      try {
        const engageApi = runtime.getPluginAPI?.('spinning_engage');
        await cmd.execute(interaction, runtime, engageApi?.warningsTable);
      } catch (e) {
        console.error(`[spinning_server] Error /${interaction.commandName}:`, e.message);
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

    guild_member_add: async (payload, runtime) => {
      const { member } = payload;
      await handleAutoRole(member, runtime);
      await sendWelcome(member, runtime);
      await logMemberJoin(member, runtime);
    },

    guild_member_remove: async (payload, runtime) => {
      const { member } = payload;
      await sendGoodbye(member, runtime);
      await logMemberRemove(member, runtime);
    },

    message_update: async (payload, runtime) => {
      const { oldMessage, newMessage } = payload;
      if (!oldMessage || !newMessage) return;
      if (oldMessage.author?.bot) return;
      if (oldMessage.content === newMessage.content) return;
      await logMessageEdit(oldMessage, newMessage, runtime);
    },

    message_delete: async (payload, runtime) => {
      const { message } = payload;
      if (!message || message.author?.bot) return;
      await logMessageDelete(message, runtime);
    },

    message_received: async (payload, runtime) => {
      const { message } = payload;
      if (!message.guild) return;
      await checkAutomod(message, runtime);
    },

    voice_state_update: async (payload, runtime) => {
      const { oldState, newState } = payload;
      await logVoiceState(oldState, newState, runtime);
    },

    guild_ban_add: async (payload, runtime) => {
      const { ban } = payload;
      await logBanAdd(ban, runtime);
    },

    guild_ban_remove: async (payload, runtime) => {
      const { ban } = payload;
      await logBanRemove(ban, runtime);
    },

    role_create: async (payload, runtime) => {
      const { role } = payload;
      await logRoleCreate(role, runtime);
    },

    role_delete: async (payload, runtime) => {
      const { role } = payload;
      await logRoleDelete(role, runtime);
    },

    channel_create: async (payload, runtime) => {
      const { channel } = payload;
      if (channel.guild) await logChannelCreate(channel, runtime);
    },

    channel_delete: async (payload, runtime) => {
      const { channel } = payload;
      if (channel.guild) await logChannelDelete(channel, runtime);
    }
  }
};
