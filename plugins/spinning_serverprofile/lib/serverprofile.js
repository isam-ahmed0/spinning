const { V2 } = require('../../spinning_core/lib/ui');

const serverprofileSlashCmds = [
  {
    name: 'botavatar',
    description: 'Show or set the bot\'s server avatar',
    options: [{ type: 'string', name: 'url', description: 'Image URL to set as avatar', required: false }],
    async execute(interaction) {
      const url = interaction.options.getString('url');
      if (url) {
        return V2.reply(interaction, V2.container(0x2B2D31, [
          V2.text('### Bot Avatar'), V2.separator(),
          V2.text('Server-specific bot avatar requires Discord API integration. Coming soon.')
        ]));
      }
      const avatar = interaction.guild.members.me.displayAvatarURL({ extension: 'png', size: 512 });
      await V2.reply(interaction, V2.container(0x2B2D31, [
        V2.text('### Bot Avatar'), V2.separator(),
        V2.text(`**Current Avatar:**\n${avatar}`)
      ]));
    }
  },
  {
    name: 'botbanner',
    description: 'Show or set the bot\'s server banner',
    options: [{ type: 'string', name: 'url', description: 'Image URL to set as banner', required: false }],
    async execute(interaction) {
      const url = interaction.options.getString('url');
      if (url) {
        return V2.reply(interaction, V2.container(0x2B2D31, [
          V2.text('### Bot Banner'), V2.separator(),
          V2.text('Server-specific bot banner requires Discord API integration. Coming soon.')
        ]));
      }
      await V2.reply(interaction, V2.container(0x2B2D31, [
        V2.text('### Bot Banner'), V2.separator(),
        V2.text('Server-specific bot banner requires Discord API integration. Coming soon.')
      ]));
    }
  },
  {
    name: 'botbio',
    description: 'Show or set the bot\'s bio',
    options: [{ type: 'string', name: 'text', description: 'Bio text to set', required: false }],
    async execute(interaction) {
      const text = interaction.options.getString('text');
      if (text) {
        return V2.reply(interaction, V2.container(0x2B2D31, [
          V2.text('### Bot Bio'), V2.separator(),
          V2.text('Bot bio management requires Discord API integration. Coming soon.')
        ]));
      }
      await V2.reply(interaction, V2.container(0x2B2D31, [
        V2.text('### Bot Bio'), V2.separator(),
        V2.text('Bot bio management requires Discord API integration. Coming soon.')
      ]));
    }
  },
  {
    name: 'botname',
    description: 'Show or set the bot\'s nickname',
    options: [{ type: 'string', name: 'name', description: 'Nickname to set', required: false }],
    async execute(interaction) {
      const name = interaction.options.getString('name');
      if (name) {
        if (!interaction.member.permissions.has('ManageNicknames')) {
          return V2.reply(interaction, V2.error('You need Manage Nicknames permission.'), true);
        }
        try {
          await interaction.guild.members.me.setNickname(name);
          await V2.reply(interaction, V2.success(`Bot nickname set to **${name}**.`));
        } catch (e) {
          await V2.reply(interaction, V2.error('Failed to set nickname. Check role hierarchy.'), true);
        }
      } else {
        const nick = interaction.guild.members.me.nickname || interaction.guild.members.me.user.username;
        await V2.reply(interaction, V2.container(0x2B2D31, [
          V2.text('### Bot Nickname'), V2.separator(),
          V2.text(`**Current Nickname:** ${nick}`)
        ]));
      }
    }
  },
  {
    name: 'botresetprofile',
    description: 'Reset the bot\'s server profile',
    async execute(interaction) {
      if (!interaction.member.permissions.has('ManageNicknames')) {
        return V2.reply(interaction, V2.error('You need Manage Nicknames permission.'), true);
      }
      try {
        await interaction.guild.members.me.setNickname(null);
        await V2.reply(interaction, V2.success('Bot profile reset.'));
      } catch (e) {
        await V2.reply(interaction, V2.error('Failed to reset profile.'), true);
      }
    }
  }
];

module.exports = { serverprofileSlashCmds };
