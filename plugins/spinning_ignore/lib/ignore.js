const { V2 } = require('../../spinning_core/lib/ui');
const {
  addIgnoredCommand, removeIgnoredCommand, getAllIgnoredCommands,
  addIgnoredChannel, removeIgnoredChannel, getAllIgnoredChannels,
  addIgnoredUser, removeIgnoredUser, getAllIgnoredUsers,
  addBypassUser, removeBypassUser, getAllBypassUsers
} = require('./ignoreDb');

function adminOnly(interaction) {
  if (!interaction.member.permissions.has('Administrator')) {
    return V2.reply(interaction, V2.error('You need Administrator permission.'), true);
  }
  return null;
}

const ignoreSlashCmds = [
  {
    name: 'ignorecmdadd',
    description: 'Add a command to the ignore list',
    options: [{ type: 'string', name: 'command', description: 'Command name to ignore', required: true }],
    async execute(interaction) {
      const deny = adminOnly(interaction);
      if (deny) return;
      const command = interaction.options.getString('command').toLowerCase();
      const result = addIgnoredCommand(interaction.guildId, command);
      if (!result.added) {
        const msg = result.reason === 'duplicate' ? `Command \`${command}\` is already ignored.` : 'Ignore limit reached (25 commands max).';
        return V2.reply(interaction, V2.error(msg), true);
      }
      await V2.reply(interaction, V2.container(0x2B2D31, [
        V2.text('### Command Ignored'),
        V2.separator(),
        V2.text(`Added \`${command}\` to the ignored commands list.`)
      ]));
    }
  },
  {
    name: 'ignorecmdremove',
    description: 'Remove a command from the ignore list',
    options: [{ type: 'string', name: 'command', description: 'Command name to unignore', required: true }],
    async execute(interaction) {
      const deny = adminOnly(interaction);
      if (deny) return;
      const command = interaction.options.getString('command').toLowerCase();
      const removed = removeIgnoredCommand(interaction.guildId, command);
      if (!removed) {
        return V2.reply(interaction, V2.error(`Command \`${command}\` is not in the ignore list.`), true);
      }
      await V2.reply(interaction, V2.container(0x2B2D31, [
        V2.text('### Command Unignored'),
        V2.separator(),
        V2.text(`Removed \`${command}\` from the ignored commands list.`)
      ]));
    }
  },
  {
    name: 'ignorecmdshow',
    description: 'Show all ignored commands',
    async execute(interaction) {
      const deny = adminOnly(interaction);
      if (deny) return;
      const commands = getAllIgnoredCommands(interaction.guildId);
      if (commands.length === 0) {
        return V2.reply(interaction, V2.container(0x2B2D31, [
          V2.text('### Ignored Commands'),
          V2.separator(),
          V2.text('No commands are currently ignored.')
        ]));
      }
      await V2.reply(interaction, V2.container(0x2B2D31, [
        V2.text('### Ignored Commands'),
        V2.separator(),
        V2.text(commands.map(c => `\`${c}\``).join(', '))
      ]));
    }
  },
  {
    name: 'ignorechanneladd',
    description: 'Add a channel to the ignore list',
    options: [{ type: 'channel', name: 'channel', description: 'Channel to ignore', required: true }],
    async execute(interaction) {
      const deny = adminOnly(interaction);
      if (deny) return;
      const channel = interaction.options.getChannel('channel');
      const result = addIgnoredChannel(interaction.guildId, channel.id);
      if (!result.added) {
        const msg = result.reason === 'duplicate' ? `<#${channel.id}> is already ignored.` : 'Ignore limit reached (30 channels max).';
        return V2.reply(interaction, V2.error(msg), true);
      }
      await V2.reply(interaction, V2.container(0x2B2D31, [
        V2.text('### Channel Ignored'),
        V2.separator(),
        V2.text(`Added <#${channel.id}> to the ignored channels list.`)
      ]));
    }
  },
  {
    name: 'ignorechannelremove',
    description: 'Remove a channel from the ignore list',
    options: [{ type: 'channel', name: 'channel', description: 'Channel to unignore', required: true }],
    async execute(interaction) {
      const deny = adminOnly(interaction);
      if (deny) return;
      const channel = interaction.options.getChannel('channel');
      const removed = removeIgnoredChannel(interaction.guildId, channel.id);
      if (!removed) {
        return V2.reply(interaction, V2.error(`<#${channel.id}> is not in the ignore list.`), true);
      }
      await V2.reply(interaction, V2.container(0x2B2D31, [
        V2.text('### Channel Unignored'),
        V2.separator(),
        V2.text(`Removed <#${channel.id}> from the ignored channels list.`)
      ]));
    }
  },
  {
    name: 'ignorechannelshow',
    description: 'Show all ignored channels',
    async execute(interaction) {
      const deny = adminOnly(interaction);
      if (deny) return;
      const channels = getAllIgnoredChannels(interaction.guildId);
      if (channels.length === 0) {
        return V2.reply(interaction, V2.container(0x2B2D31, [
          V2.text('### Ignored Channels'),
          V2.separator(),
          V2.text('No channels are currently ignored.')
        ]));
      }
      await V2.reply(interaction, V2.container(0x2B2D31, [
        V2.text('### Ignored Channels'),
        V2.separator(),
        V2.text(channels.map(c => `<#${c}>`).join(', '))
      ]));
    }
  },
  {
    name: 'ignoreuseradd',
    description: 'Add a user to the ignore list',
    options: [{ type: 'user', name: 'user', description: 'User to ignore', required: true }],
    async execute(interaction) {
      const deny = adminOnly(interaction);
      if (deny) return;
      const user = interaction.options.getUser('user');
      const result = addIgnoredUser(interaction.guildId, user.id);
      if (!result.added) {
        return V2.reply(interaction, V2.error(`<@${user.id}> is already ignored.`), true);
      }
      await V2.reply(interaction, V2.container(0x2B2D31, [
        V2.text('### User Ignored'),
        V2.separator(),
        V2.text(`Added <@${user.id}> to the ignored users list.`)
      ]));
    }
  },
  {
    name: 'ignoreuserremove',
    description: 'Remove a user from the ignore list',
    options: [{ type: 'user', name: 'user', description: 'User to unignore', required: true }],
    async execute(interaction) {
      const deny = adminOnly(interaction);
      if (deny) return;
      const user = interaction.options.getUser('user');
      const removed = removeIgnoredUser(interaction.guildId, user.id);
      if (!removed) {
        return V2.reply(interaction, V2.error(`<@${user.id}> is not in the ignore list.`), true);
      }
      await V2.reply(interaction, V2.container(0x2B2D31, [
        V2.text('### User Unignored'),
        V2.separator(),
        V2.text(`Removed <@${user.id}> from the ignored users list.`)
      ]));
    }
  },
  {
    name: 'ignoreusershow',
    description: 'Show all ignored users',
    async execute(interaction) {
      const deny = adminOnly(interaction);
      if (deny) return;
      const users = getAllIgnoredUsers(interaction.guildId);
      if (users.length === 0) {
        return V2.reply(interaction, V2.container(0x2B2D31, [
          V2.text('### Ignored Users'),
          V2.separator(),
          V2.text('No users are currently ignored.')
        ]));
      }
      await V2.reply(interaction, V2.container(0x2B2D31, [
        V2.text('### Ignored Users'),
        V2.separator(),
        V2.text(users.map(u => `<@${u}>`).join(', '))
      ]));
    }
  },
  {
    name: 'ignorebypassadd',
    description: 'Add a user to the bypass list',
    options: [{ type: 'user', name: 'user', description: 'User to add as bypass', required: true }],
    async execute(interaction) {
      const deny = adminOnly(interaction);
      if (deny) return;
      const user = interaction.options.getUser('user');
      const result = addBypassUser(interaction.guildId, user.id);
      if (!result.added) {
        return V2.reply(interaction, V2.error(`<@${user.id}> is already in the bypass list.`), true);
      }
      await V2.reply(interaction, V2.container(0x2B2D31, [
        V2.text('### Bypass User Added'),
        V2.separator(),
        V2.text(`Added <@${user.id}> to the bypass list.`)
      ]));
    }
  },
  {
    name: 'ignorebypassremove',
    description: 'Remove a user from the bypass list',
    options: [{ type: 'user', name: 'user', description: 'User to remove from bypass', required: true }],
    async execute(interaction) {
      const deny = adminOnly(interaction);
      if (deny) return;
      const user = interaction.options.getUser('user');
      const removed = removeBypassUser(interaction.guildId, user.id);
      if (!removed) {
        return V2.reply(interaction, V2.error(`<@${user.id}> is not in the bypass list.`), true);
      }
      await V2.reply(interaction, V2.container(0x2B2D31, [
        V2.text('### Bypass User Removed'),
        V2.separator(),
        V2.text(`Removed <@${user.id}> from the bypass list.`)
      ]));
    }
  },
  {
    name: 'ignorebypassshow',
    description: 'Show all bypass users',
    async execute(interaction) {
      const deny = adminOnly(interaction);
      if (deny) return;
      const users = getAllBypassUsers(interaction.guildId);
      if (users.length === 0) {
        return V2.reply(interaction, V2.container(0x2B2D31, [
          V2.text('### Bypass Users'),
          V2.separator(),
          V2.text('No users are currently in the bypass list.')
        ]));
      }
      await V2.reply(interaction, V2.container(0x2B2D31, [
        V2.text('### Bypass Users'),
        V2.separator(),
        V2.text(users.map(u => `<@${u}>`).join(', '))
      ]));
    }
  }
];

module.exports = { ignoreSlashCmds };
