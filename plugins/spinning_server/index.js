const { V2 } = require('../spinning_core/lib/ui');
const { Database, Table } = require('../../lib/db');
const { sendWelcome, sendGoodbye } = require('./lib/welcome');
const { logMessageEdit, logMessageDelete } = require('./lib/logging');
const { executeModAction, getWarnings } = require('./lib/moderation');
const { handleAutoRole } = require('./lib/autorole');

const db = new Database();
const warningsTable = new Table(db, 'warnings');

function getConfig(runtime) {
  return runtime.getPluginConfig('spinning_server');
}

const serverSlashCmds = [
  {
    name: 'setwelcome',
    description: 'Set the welcome channel',
    options: [{ type: 'channel', name: 'channel', description: 'Channel for welcome messages', required: true }],
    async execute(interaction, runtime) {
      if (!V2.hasAdminOrOwner(interaction.member, runtime)) {
        return V2.reply(interaction, V2.error('You need Administrator permission.'), true);
      }
      const channel = interaction.options.getChannel('channel');
      const config = getConfig(runtime);
      config.welcome_channel = channel.id;
      runtime.getPluginConfig && runtime.setPluginConfig?.('spinning_server', config);
      await V2.reply(interaction, V2.success(`Welcome channel set to <#${channel.id}>`));
    }
  },
  {
    name: 'setgoodbye',
    description: 'Set the goodbye channel',
    options: [{ type: 'channel', name: 'channel', description: 'Channel for goodbye messages', required: true }],
    async execute(interaction, runtime) {
      if (!V2.hasAdminOrOwner(interaction.member, runtime)) {
        return V2.reply(interaction, V2.error('You need Administrator permission.'), true);
      }
      const channel = interaction.options.getChannel('channel');
      const config = getConfig(runtime);
      config.goodbye_channel = channel.id;
      await V2.reply(interaction, V2.success(`Goodbye channel set to <#${channel.id}>`));
    }
  },
  {
    name: 'testwelcome',
    description: 'Test the welcome message in the current channel',
    options: [],
    async execute(interaction, runtime) {
      if (!V2.hasAdminOrOwner(interaction.member, runtime)) {
        return V2.reply(interaction, V2.error('You need Administrator permission.'), true);
      }
      await sendWelcome(interaction.member, runtime, interaction.channel);
      await V2.reply(interaction, V2.success('Welcome test sent!'));
    }
  },
  {
    name: 'setlog',
    description: 'Set the log channel',
    options: [{ type: 'channel', name: 'channel', description: 'Channel for logs', required: true }],
    async execute(interaction, runtime) {
      if (!V2.hasAdminOrOwner(interaction.member, runtime)) {
        return V2.reply(interaction, V2.error('You need Administrator permission.'), true);
      }
      const channel = interaction.options.getChannel('channel');
      const config = getConfig(runtime);
      config.log_channel = channel.id;
      await V2.reply(interaction, V2.success(`Log channel set to <#${channel.id}>`));
    }
  },
  {
    name: 'togglelog',
    description: 'Enable or disable message logging',
    options: [{ type: 'boolean', name: 'enabled', description: 'Enable or disable', required: true }],
    async execute(interaction, runtime) {
      if (!V2.hasAdminOrOwner(interaction.member, runtime)) {
        return V2.reply(interaction, V2.error('You need Administrator permission.'), true);
      }
      const enabled = interaction.options.getBoolean('enabled');
      const config = getConfig(runtime);
      config.logging_enabled = enabled;
      await V2.reply(interaction, V2.success(`Logging ${enabled ? 'enabled' : 'disabled'}.`));
    }
  },
  {
    name: 'setautorole',
    description: 'Set the auto-role for new members',
    options: [{ type: 'role', name: 'role', description: 'Role to auto-assign', required: true }],
    async execute(interaction, runtime) {
      if (!V2.hasAdminOrOwner(interaction.member, runtime)) {
        return V2.reply(interaction, V2.error('You need Administrator permission.'), true);
      }
      const role = interaction.options.getRole('role');
      const config = getConfig(runtime);
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
        return V2.reply(interaction, V2.error('You need Administrator permission.'), true);
      }
      const config = getConfig(runtime);
      config.autorole_id = '';
      await V2.reply(interaction, V2.success('Auto-role removed.'));
    }
  },
  {
    name: 'ban',
    description: 'Ban a user',
    options: [
      { type: 'user', name: 'user', description: 'User to ban', required: true },
      { type: 'string', name: 'reason', description: 'Reason for ban', required: false }
    ],
    async execute(interaction, runtime) {
      await executeModAction(interaction, runtime, 'ban', warningsTable);
    }
  },
  {
    name: 'kick',
    description: 'Kick a user',
    options: [
      { type: 'user', name: 'user', description: 'User to kick', required: true },
      { type: 'string', name: 'reason', description: 'Reason for kick', required: false }
    ],
    async execute(interaction, runtime) {
      await executeModAction(interaction, runtime, 'kick', warningsTable);
    }
  },
  {
    name: 'timeout',
    description: 'Timeout a user (minutes)',
    options: [
      { type: 'user', name: 'user', description: 'User to timeout', required: true },
      { type: 'integer', name: 'minutes', description: 'Duration in minutes', required: true },
      { type: 'string', name: 'reason', description: 'Reason', required: false }
    ],
    async execute(interaction, runtime) {
      await executeModAction(interaction, runtime, 'timeout', warningsTable);
    }
  },
  {
    name: 'warn',
    description: 'Warn a user',
    options: [
      { type: 'user', name: 'user', description: 'User to warn', required: true },
      { type: 'string', name: 'reason', description: 'Reason', required: false }
    ],
    async execute(interaction, runtime) {
      await executeModAction(interaction, runtime, 'warn', warningsTable);
    }
  },
  {
    name: 'warnings',
    description: 'View warnings for a user',
    options: [{ type: 'user', name: 'user', description: 'User to check', required: true }],
    async execute(interaction, runtime) {
      const user = interaction.options.getUser('user');
      const warns = warningsTable.find({ userId: user.id, guildId: interaction.guildId });
      if (warns.length === 0) {
        return V2.reply(interaction, V2.info(`${user.tag} has no warnings.`), true);
      }
      const list = warns.map((w, i) => `**${i + 1}.** ${w.reason || 'No reason'} — <@${w.moderatorId}>`).join('\n');
      const container = V2.container(V2.config.brand_color, [
        V2.text(`## Warnings for ${user.tag}`),
        V2.separator(),
        V2.text(list),
        V2.text(`\n**Total:** ${warns.length}`)
      ]);
      await V2.reply(interaction, container, true);
    }
  },
  {
    name: 'clearwarns',
    description: 'Clear all warnings for a user',
    options: [{ type: 'user', name: 'user', description: 'User to clear warnings for', required: true }],
    async execute(interaction, runtime) {
      if (!V2.hasAdminOrOwner(interaction.member, runtime)) {
        return V2.reply(interaction, V2.error('You need Administrator permission.'), true);
      }
      const user = interaction.options.getUser('user');
      const count = warningsTable.delete({ userId: user.id, guildId: interaction.guildId });
      await V2.reply(interaction, V2.success(`Cleared ${count} warning(s) for ${user.tag}.`));
    }
  },
  {
    name: 'purge',
    description: 'Bulk delete messages',
    options: [{ type: 'integer', name: 'amount', description: 'Number of messages to delete (1-100)', required: true }],
    async execute(interaction, runtime) {
      if (!V2.hasAdminOrOwner(interaction.member, runtime)) {
        return V2.reply(interaction, V2.error('You need Administrator permission.'), true);
      }
      const amount = interaction.options.getInteger('amount');
      if (amount < 1 || amount > 100) {
        return V2.reply(interaction, V2.error('Amount must be between 1 and 100.'), true);
      }
      await interaction.deferReply();
      const deleted = await interaction.channel.bulkDelete(amount, true);
      await interaction.editReply({ components: [V2.success(`Deleted ${deleted.size} message(s).`)], flags: V2.FLAG });
    }
  },
  {
    name: 'slowmode',
    description: 'Set channel slowmode',
    options: [{ type: 'integer', name: 'seconds', description: 'Slowmode in seconds (0 to disable)', required: true }],
    async execute(interaction, runtime) {
      if (!V2.hasAdminOrOwner(interaction.member, runtime)) {
        return V2.reply(interaction, V2.error('You need Administrator permission.'), true);
      }
      const seconds = interaction.options.getInteger('seconds');
      await interaction.channel.setRateLimitPerUser(seconds);
      await V2.reply(interaction, V2.success(`Slowmode set to ${seconds}s.`));
    }
  },
  {
    name: 'lock',
    description: 'Lock the current channel',
    options: [],
    async execute(interaction, runtime) {
      if (!V2.hasAdminOrOwner(interaction.member, runtime)) {
        return V2.reply(interaction, V2.error('You need Administrator permission.'), true);
      }
      await interaction.channel.permissionOverwrites.edit(interaction.guild.roles.everyone, { SendMessages: false });
      await V2.reply(interaction, V2.success('Channel locked.'));
    }
  },
  {
    name: 'unlock',
    description: 'Unlock the current channel',
    options: [],
    async execute(interaction, runtime) {
      if (!V2.hasAdminOrOwner(interaction.member, runtime)) {
        return V2.reply(interaction, V2.error('You need Administrator permission.'), true);
      }
      await interaction.channel.permissionOverwrites.edit(interaction.guild.roles.everyone, { SendMessages: true });
      await V2.reply(interaction, V2.success('Channel unlocked.'));
    }
  }
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
        await cmd.execute(interaction, runtime);
      } catch (e) {
        console.error(`[spinning_server] Error /${interaction.commandName}:`, e.message);
        const errReply = V2.error(`Error: ${e.message}`);
        if (interaction.replied || interaction.deferred) {
          await interaction.followUp({ components: [errReply], flags: V2.FLAG, ephemeral: true }).catch(() => {});
        } else {
          await interaction.reply({ components: [errReply], flags: V2.FLAG, ephemeral: true }).catch(() => {});
        }
      }
    },

    guild_member_add: async (payload, runtime) => {
      const { member } = payload;
      await handleAutoRole(member, runtime);
      await sendWelcome(member, runtime);
    },

    guild_member_remove: async (payload, runtime) => {
      const { member } = payload;
      await sendGoodbye(member, runtime);
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
    }
  }
};
