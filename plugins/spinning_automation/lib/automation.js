const { V2 } = require('../../spinning_core/lib/ui');
const { ChannelType, PermissionFlagsBits } = require('discord.js');
const emojis = require('../../../emojis.json');

function getConfig(runtime) {
  return runtime.getPluginConfig('spinning_automation');
}

const automationSlashCmds = [
  {
    name: 'reactionroles',
    description: 'Reaction roles commands',
    options: [
      { type: 'string', name: 'action', description: 'add, remove, or list', required: true },
      { type: 'string', name: 'message_id', description: 'Message ID', required: false },
      { type: 'string', name: 'emoji', description: 'Emoji', required: false },
      { type: 'role', name: 'role', description: 'Role to assign', required: false }
    ],
    async execute(interaction, runtime) {
      const action = interaction.options.getString('action');
      const config = getConfig(runtime);

      if (!V2.hasAdminOrOwner(interaction.member, runtime)) {
        return V2.reply(interaction, V2.error('You need Administrator permission.'), true);
      }

      if (!config.reactionroles_config) config.reactionroles_config = [];

      if (action === 'add') {
        const messageId = interaction.options.getString('message_id');
        const emoji = interaction.options.getString('emoji');
        const role = interaction.options.getRole('role');
        if (!messageId || !emoji || !role) {
          return V2.reply(interaction, V2.error('Provide message_id, emoji, and role.'), true);
        }

        config.reactionroles_config.push({ messageId, emoji, roleId: role.id });
        await V2.reply(interaction, V2.success(`Added reaction role: ${emoji} → <@&${role.id}>`));
      }

      else if (action === 'remove') {
        const messageId = interaction.options.getString('message_id');
        const emoji = interaction.options.getString('emoji');
        if (!messageId || !emoji) {
          return V2.reply(interaction, V2.error('Provide message_id and emoji.'), true);
        }

        config.reactionroles_config = config.reactionroles_config.filter(
          r => !(r.messageId === messageId && r.emoji === emoji)
        );
        await V2.reply(interaction, V2.success('Reaction role removed.'));
      }

      else if (action === 'list') {
        const list = config.reactionroles_config.map(r =>
          `${emojis.dots} Message \`${r.messageId}\`: ${r.emoji} → <@&${r.roleId}>`
        ).join('\n') || 'None';

        const container = V2.container(V2.config.brand_color, [
          V2.text(`${emojis.cat_reactionroles} **Reaction Roles**`),
          V2.separator(),
          V2.text(list)
        ]);

        await V2.reply(interaction, container);
      }
    }
  },
  {
    name: 'j2c',
    description: 'Join-to-Create commands',
    options: [
      { type: 'string', name: 'action', description: 'enable, disable, or settings', required: true },
      { type: 'channel', name: 'trigger', description: 'Trigger voice channel', required: false },
      { type: 'channel', name: 'category', description: 'Category for temp channels', required: false }
    ],
    async execute(interaction, runtime) {
      const action = interaction.options.getString('action');
      const config = getConfig(runtime);

      if (!V2.hasAdminOrOwner(interaction.member, runtime)) {
        return V2.reply(interaction, V2.error('You need Administrator permission.'), true);
      }

      if (action === 'enable') {
        const trigger = interaction.options.getChannel('trigger');
        const category = interaction.options.getChannel('category');
        if (!trigger || !category) {
          return V2.reply(interaction, V2.error('Provide trigger channel and category.'), true);
        }
        config.j2c_enabled = true;
        config.j2c_trigger_channel = trigger.id;
        config.j2c_category = category.id;
        await V2.reply(interaction, V2.success(`J2C enabled: ${trigger.name} → ${category.name}`));
      }

      else if (action === 'disable') {
        config.j2c_enabled = false;
        await V2.reply(interaction, V2.success('J2C disabled.'));
      }

      else if (action === 'settings') {
        const container = V2.container(V2.config.brand_color, [
          V2.text(`${emojis.cat_join2create} **J2C Settings**`),
          V2.separator(),
          V2.text(`**Enabled:** ${config.j2c_enabled ? 'Yes' : 'No'}`),
          V2.text(`**Trigger:** ${config.j2c_trigger_channel ? `<#${config.j2c_trigger_channel}>` : 'None'}`),
          V2.text(`**Category:** ${config.j2c_category ? `<#${config.j2c_category}>` : 'None'}`)
        ]);
        await V2.reply(interaction, container);
      }
    }
  },
  {
    name: 'autoreact',
    description: 'Auto-react commands',
    options: [
      { type: 'string', name: 'action', description: 'add, remove, or list', required: true },
      { type: 'string', name: 'trigger', description: 'Trigger word', required: false },
      { type: 'string', name: 'emoji', description: 'Emoji to react with', required: false }
    ],
    async execute(interaction, runtime) {
      const action = interaction.options.getString('action');
      const config = getConfig(runtime);

      if (!V2.hasAdminOrOwner(interaction.member, runtime)) {
        return V2.reply(interaction, V2.error('You need Administrator permission.'), true);
      }

      if (!config.autoreact_config) config.autoreact_config = [];

      if (action === 'add') {
        const trigger = interaction.options.getString('trigger');
        const emoji = interaction.options.getString('emoji');
        if (!trigger || !emoji) {
          return V2.reply(interaction, V2.error('Provide trigger and emoji.'), true);
        }
        config.autoreact_config.push({ trigger: trigger.toLowerCase(), emoji });
        await V2.reply(interaction, V2.success(`Auto-react: "${trigger}" → ${emoji}`));
      }

      else if (action === 'remove') {
        const trigger = interaction.options.getString('trigger');
        if (!trigger) return V2.reply(interaction, V2.error('Provide trigger.'), true);
        config.autoreact_config = config.autoreact_config.filter(r => r.trigger !== trigger.toLowerCase());
        await V2.reply(interaction, V2.success('Auto-react removed.'));
      }

      else if (action === 'list') {
        const list = config.autoreact_config.map(r =>
          `${emojis.dots} "${r.trigger}" → ${r.emoji}`
        ).join('\n') || 'None';

        const container = V2.container(V2.config.brand_color, [
          V2.text(`${emojis.sparkles} **Auto-React**`),
          V2.separator(),
          V2.text(list)
        ]);

        await V2.reply(interaction, container);
      }
    }
  },
  {
    name: 'vanityroles',
    description: 'Vanity roles commands',
    options: [
      { type: 'string', name: 'action', description: 'add, remove, or list', required: true },
      { type: 'string', name: 'code', description: 'Vanity code to check for', required: false },
      { type: 'role', name: 'role', description: 'Role to assign', required: false }
    ],
    async execute(interaction, runtime) {
      const action = interaction.options.getString('action');
      const config = getConfig(runtime);

      if (!V2.hasAdminOrOwner(interaction.member, runtime)) {
        return V2.reply(interaction, V2.error('You need Administrator permission.'), true);
      }

      if (!config.vanityroles_config) config.vanityroles_config = [];

      if (action === 'add') {
        const code = interaction.options.getString('code');
        const role = interaction.options.getRole('role');
        if (!code || !role) {
          return V2.reply(interaction, V2.error('Provide code and role.'), true);
        }
        config.vanityroles_config.push({ code: code.toLowerCase(), roleId: role.id });
        await V2.reply(interaction, V2.success(`Vanity role: "${code}" → <@&${role.id}>`));
      }

      else if (action === 'remove') {
        const code = interaction.options.getString('code');
        if (!code) return V2.reply(interaction, V2.error('Provide code.'), true);
        config.vanityroles_config = config.vanityroles_config.filter(r => r.code !== code.toLowerCase());
        await V2.reply(interaction, V2.success('Vanity role removed.'));
      }

      else if (action === 'list') {
        const list = config.vanityroles_config.map(r =>
          `${emojis.dots} "${r.code}" → <@&${r.roleId}>`
        ).join('\n') || 'None';

        const container = V2.container(V2.config.brand_color, [
          V2.text(`${emojis.cat_vanityroles} **Vanity Roles**`),
          V2.separator(),
          V2.text(list)
        ]);

        await V2.reply(interaction, container);
      }
    }
  }
];

module.exports = { automationSlashCmds, getConfig };
