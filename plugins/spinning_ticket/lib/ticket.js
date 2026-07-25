const { V2 } = require('../../spinning_core/lib/ui');
const { ChannelType, PermissionFlagsBits } = require('discord.js');
const { Database, Table } = require('../../../lib/db');
const emojis = require('../../../emojis.json');

const db = new Database();
const ticketsTable = new Table(db, 'tickets');

function getConfig(runtime) {
  return runtime.getPluginConfig('spinning_ticket');
}

async function createTicket(interaction, runtime, category) {
  const config = getConfig(runtime);
  const guild = interaction.guild;
  const user = interaction.user;

  const openTickets = ticketsTable.find({ userId: user.id, guildId: guild.id, status: 'open' });
  if (openTickets.length >= (config.ticket_max_open || 3)) {
    return V2.reply(interaction, V2.error('You already have the maximum number of open tickets.'), true);
  }

  const ticketNum = ticketsTable.find({ guildId: guild.id }).length + 1;
  const channelName = `ticket-${ticketNum}`;

  const permissionOverwrites = [
    { id: guild.id, deny: [PermissionFlagsBits.ViewChannel] },
    { id: user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory] },
    { id: interaction.client.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory, PermissionFlagsBits.ManageChannels] }
  ];

  for (const roleId of (config.ticket_staff_roles || [])) {
    permissionOverwrites.push({
      id: roleId,
      allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory]
    });
  }

  const channel = await guild.channels.create({
    name: channelName,
    type: ChannelType.GuildText,
    parent: config.ticket_category_id || null,
    permissionOverwrites
  });

  ticketsTable.insert({
    channelId: channel.id,
    guildId: guild.id,
    userId: user.id,
    category: category || 'General',
    status: 'open',
    claimedBy: null,
    createdAt: Date.now()
  });

  const container = V2.container(V2.config.brand_color, [
    V2.text(`${emojis.cat_tickets} **Ticket #${ticketNum}**`),
    V2.separator(),
    V2.text(`Welcome <@${user.id}>, your ticket has been created.`),
    V2.text(`**Category:** ${category || 'General'}`),
    V2.separator(),
    V2.text('A staff member will be with you shortly.')
  ]);

  const row = V2.buttonRow(
    V2.button('Danger', 'Close Ticket', `ticket_close_${channel.id}`)
  );

  await channel.send({ components: [container, row] });

  const logChannel = config.ticket_log_channel ? guild.channels.cache.get(config.ticket_log_channel) : null;
  if (logChannel) {
    const logContainer = V2.container('#57F287', [
      V2.text(`${emojis.cat_tickets} **Ticket Created**`),
      V2.separator(),
      V2.text(`**User:** <@${user.id}>`),
      V2.text(`**Channel:** <#${channel.id}>`),
      V2.text(`**Category:** ${category || 'General'}`)
    ]);
    await logChannel.send({ components: [logContainer], flags: V2.FLAG }).catch(() => {});
  }

  await V2.reply(interaction, V2.success(`Ticket created: <#${channel.id}>`), true);
}

const ticketSlashCmds = [
  {
    name: 'ticket',
    description: 'Ticket system commands',
    options: [
      { type: 'string', name: 'action', description: 'setup, panel, close, claim, add, remove', required: true },
      { type: 'string', name: 'value', description: 'Additional value', required: false }
    ],
    async execute(interaction, runtime) {
      const action = interaction.options.getString('action');
      const value = interaction.options.getString('value');
      const config = getConfig(runtime);
      const guild = interaction.guild;

      if (action === 'setup') {
        if (!V2.hasAdminOrOwner(interaction.member, runtime)) {
          return V2.reply(interaction, V2.error('You need Administrator permission.'), true);
        }
        if (!config.ticket_categories) config.ticket_categories = [];
        if (config.ticket_categories.length === 0) {
          config.ticket_categories = [
            { name: 'General', emoji: '📋' },
            { name: 'Support', emoji: '🛠️' },
            { name: 'Report', emoji: '⚠️' }
          ];
        }
        await V2.reply(interaction, V2.success('Ticket system configured. Use `/ticket panel` to send the panel.'), true);
      }

      else if (action === 'panel') {
        if (!V2.hasAdminOrOwner(interaction.member, runtime)) {
          return V2.reply(interaction, V2.error('You need Administrator permission.'), true);
        }
        if (!config.ticket_enabled) {
          return V2.reply(interaction, V2.error('Enable ticket system first with `/ticket setup`.'), true);
        }

        const categories = config.ticket_categories || [];
        const options = categories.map((c, i) => ({
          label: c.name,
          value: c.name,
          emoji: c.emoji || '📋',
          description: `Open a ${c.name} ticket`
        }));

        const { StringSelectMenuBuilder, ActionRowBuilder } = require('discord.js');
        const select = new StringSelectMenuBuilder()
          .setCustomId('ticket_create')
          .setPlaceholder('Select a category...')
          .addOptions(options);

        const row = new ActionRowBuilder().addComponents(select);

        const container = V2.container(V2.config.brand_color, [
          V2.text(`${emojis.cat_tickets} **Support Tickets**`),
          V2.separator(),
          V2.text('Need help? Select a category below to open a ticket.')
        ]);

        await interaction.channel.send({ components: [container, row], flags: V2.FLAG });
        await V2.reply(interaction, V2.success('Ticket panel sent!'), true);
      }

      else if (action === 'close') {
        const channel = interaction.channel;
        const ticket = ticketsTable.findOne({ channelId: channel.id, status: 'open' });
        if (!ticket) {
          return V2.reply(interaction, V2.error('This is not an open ticket.'), true);
        }

        ticketsTable.update({ channelId: channel.id }, { status: 'closed', closedAt: Date.now() });

        const container = V2.container('#ED4245', [
          V2.text(`${emojis.cat_tickets} **Ticket Closed**`),
          V2.separator(),
          V2.text(`Closed by <@${interaction.user.id}>`)
        ]);

        await V2.reply(interaction, container);

        setTimeout(() => {
          channel.delete().catch(() => {});
        }, 5000);
      }

      else if (action === 'claim') {
        const ticket = ticketsTable.findOne({ channelId: interaction.channelId, status: 'open' });
        if (!ticket) {
          return V2.reply(interaction, V2.error('This is not an open ticket.'), true);
        }

        ticketsTable.update({ channelId: interaction.channelId }, { claimedBy: interaction.user.id });

        const container = V2.container(V2.config.brand_color, [
          V2.text(`${emojis.claim} **Ticket Claimed**`),
          V2.separator(),
          V2.text(`Claimed by <@${interaction.user.id}>`)
        ]);

        await V2.reply(interaction, container);
      }

      else if (action === 'add') {
        if (!value) return V2.reply(interaction, V2.error('Provide a user ID.'), true);
        const member = await guild.members.fetch(value).catch(() => null);
        if (!member) return V2.reply(interaction, V2.error('User not found.'), true);

        await interaction.channel.permissionOverwrites.edit(member, {
          ViewChannel: true,
          SendMessages: true,
          ReadMessageHistory: true
        });

        await V2.reply(interaction, V2.success(`Added <@${value}> to this ticket.`));
      }

      else if (action === 'remove') {
        if (!value) return V2.reply(interaction, V2.error('Provide a user ID.'), true);
        const member = await guild.members.fetch(value).catch(() => null);
        if (!member) return V2.reply(interaction, V2.error('User not found.'), true);

        await interaction.channel.permissionOverwrites.edit(member, {
          ViewChannel: false,
          SendMessages: false
        });

        await V2.reply(interaction, V2.success(`Removed <@${value}> from this ticket.`));
      }
    }
  }
];

module.exports = { ticketSlashCmds, ticketsTable, createTicket, getConfig };
