const { V2 } = require('../../spinning_core/lib/ui');
const { ChannelType, PermissionFlagsBits, AttachmentBuilder } = require('discord.js');
const { Database, Table } = require('../../../lib/db');
const emojis = require('../../../emojis.json');

const db = new Database();
const ticketsTable = new Table(db, 'tickets');

function getConfig(runtime) {
  return runtime.getPluginConfig('spinning_ticket');
}

function escapeHtml(text) {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function formatMarkdown(text) {
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/`(.*?)`/g, '<code>$1</code>')
    .replace(/~~(.*?)~~/g, '<del>$1</del>')
    .replace(/\n/g, '<br>');
}

async function generateTranscript(channel, guild) {
  let messages = [];
  let lastId = null;
  while (true) {
    const options = { limit: 100 };
    if (lastId) options.before = lastId;
    const fetched = await channel.messages.fetch(options);
    if (fetched.size === 0) break;
    messages.push(...fetched.values());
    lastId = fetched.last().id;
  }
  messages.reverse();

  const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>Ticket Transcript — ${escapeHtml(guild.name)}</title>
<style>
body{font-family:'Segoe UI',Tahoma,sans-serif;background:#313338;color:#dbdee1;margin:0;padding:20px}
.container{max-width:800px;margin:0 auto}
.header{text-align:center;padding:20px 0;border-bottom:1px solid #3f4147;margin-bottom:20px}
.header h1{color:#b5bac1;margin:0 0 5px}
.header p{color:#949ba4;margin:0;font-size:14px}
.msg-group{display:flex;padding:8px 0;border-bottom:1px solid #2e3035}
.msg-avatar{width:40px;height:40px;border-radius:50%;margin-right:12px;flex-shrink:0}
.msg-body{flex:1;min-width:0}
.msg-author{font-weight:600;color:#f2f3f5;font-size:14px}
.msg-author .bot-tag{background:#5865f2;color:#fff;font-size:10px;padding:1px 5px;border-radius:3px;margin-left:6px;font-weight:500}
.msg-time{color:#949ba4;font-size:12px;margin-left:8px}
.msg-content{color:#dbdee1;margin-top:4px;line-height:1.4;word-wrap:break-word}
.msg-content code{background:#2b2d31;padding:2px 6px;border-radius:3px;font-size:13px;color:#e8e8e8}
.msg-content strong{color:#f2f3f5}
.msg-content em{color:#dbdee1}
.attachment-grid{margin-top:8px}
.attachment-img{max-width:300px;max-height:200px;border-radius:8px;margin:4px 0}
.attachment-file{background:#2b2d31;padding:8px 12px;border-radius:6px;margin:4px 0;display:inline-block}
.attachment-file a{color:#00a8fc;text-decoration:none}
.subtext{color:#949ba4;font-size:12px}
.footer{text-align:center;padding:20px 0;color:#949ba4;font-size:12px;border-top:1px solid #3f4147;margin-top:20px}
</style></head><body><div class="container">
<div class="header"><h1>${escapeHtml(guild.name)} — Ticket Transcript</h1><p>${messages.length} messages • Generated ${new Date().toLocaleString()}</p></div>`;

  let lastAuthorId = null;
  let result = html;

  for (const msg of messages) {
    if (msg.author.bot && !msg.content) continue;
    const isNewGroup = msg.author.id !== lastAuthorId;
    const avatar = msg.author.displayAvatarURL({ extension: 'png', size: 64 });
    const dateStr = msg.createdAt.toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' });
    const isBot = msg.author.bot;

    if (isNewGroup) {
      result += `<div class="msg-group"><img class="msg-avatar" src="${escapeHtml(avatar)}" alt=""><div class="msg-body"><span class="msg-author${isBot ? ' bot' : ''}">${escapeHtml(msg.author.displayName || msg.author.username)}${isBot ? '<span class="bot-tag">BOT</span>' : ''}</span><span class="msg-time">${dateStr}</span></div>`;
    }

    if (msg.content) {
      result += `<div class="msg-content">${formatMarkdown(escapeHtml(msg.content))}</div>`;
    }

    if (msg.attachments?.size > 0) {
      result += '<div class="attachment-grid">';
      msg.attachments.forEach(att => {
        if (att.contentType?.startsWith('image/')) {
          result += `<img class="attachment-img" src="${escapeHtml(att.url)}" alt="${escapeHtml(att.name)}">`;
        } else {
          result += `<div class="attachment-file"><a href="${escapeHtml(att.url)}">${escapeHtml(att.name)}</a> <span class="subtext">(${(att.size / 1024).toFixed(1)} KB)</span></div>`;
        }
      });
      result += '</div>';
    }

    result += '</div>';
    lastAuthorId = msg.author.id;
  }

  result += `<div class="footer">Transcript for ${escapeHtml(guild.name)} — ${new Date().toLocaleString()}</div></div></body></html>`;

  return Buffer.from(result, 'utf-8');
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
      { type: 'string', name: 'action', description: 'setup, panel, close, claim, add, remove, transcript', required: true },
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
        const options = categories.map(c => ({
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

        await interaction.deferReply();

        try {
          const transcriptBuffer = await generateTranscript(channel, guild);
          const filename = `ticket-${ticket.channelId}-${Date.now()}.html`;
          const transcriptAttachment = new AttachmentBuilder(transcriptBuffer, { name: filename });

          const logChannel = config.ticket_log_channel ? guild.channels.cache.get(config.ticket_log_channel) : null;
          if (logChannel) {
            const logContainer = V2.container('#ED4245', [
              V2.text(`${emojis.cat_tickets} **Ticket Closed**`),
              V2.separator(),
              V2.text(`**Ticket:** <#${ticket.channelId}>`),
              V2.text(`**Creator:** <@${ticket.userId}>`),
              V2.text(`**Closed by:** <@${interaction.user.id}>`),
              V2.text(`**Category:** ${ticket.category}`)
            ]);
            await logChannel.send({
              components: [logContainer],
              files: [transcriptAttachment],
              flags: V2.FLAG
            }).catch(() => {});
          }

          const ticketCreator = await guild.members.fetch(ticket.userId).catch(() => null);
          if (ticketCreator) {
            try {
              await ticketCreator.send({
                content: `Your ticket in **${guild.name}** has been closed.`,
                files: [transcriptAttachment]
              }).catch(() => {});
            } catch {}
          }
        } catch (e) {
          console.error('[spinning_ticket] Transcript generation error:', e.message);
        }

        ticketsTable.update({ channelId: channel.id }, { status: 'closed', closedAt: Date.now() });

        const closeContainer = V2.container('#ED4245', [
          V2.text(`${emojis.cat_tickets} **Ticket Closed**`),
          V2.separator(),
          V2.text(`Closed by <@${interaction.user.id}>`)
        ]);

        await interaction.editReply({ components: [closeContainer], flags: V2.FLAG });

        setTimeout(() => {
          channel.delete().catch(() => {});
        }, 5000);
      }

      else if (action === 'transcript') {
        const channel = interaction.channel;
        const ticket = ticketsTable.findOne({ channelId: channel.id });
        if (!ticket) {
          return V2.reply(interaction, V2.error('This is not a ticket channel.'), true);
        }

        await interaction.deferReply();

        try {
          const transcriptBuffer = await generateTranscript(channel, guild);
          const filename = `ticket-${ticket.channelId}-transcript.html`;
          const transcriptAttachment = new AttachmentBuilder(transcriptBuffer, { name: filename });

          const logChannel = config.ticket_log_channel ? guild.channels.cache.get(config.ticket_log_channel) : null;
          if (logChannel) {
            const logContainer = V2.container(V2.config.brand_color, [
              V2.text('### Ticket Transcript'),
              V2.separator(),
              V2.text(`**Ticket:** <#${ticket.channelId}>\n**Creator:** <@${ticket.userId}>\n**Category:** ${ticket.category}`)
            ]);
            await logChannel.send({
              components: [logContainer],
              files: [transcriptAttachment],
              flags: V2.FLAG
            }).catch(() => {});
          }

          const ticketCreator = await guild.members.fetch(ticket.userId).catch(() => null);
          if (ticketCreator) {
            try {
              await ticketCreator.send({
                content: `Here is the transcript for your ticket in **${guild.name}**:`,
                files: [transcriptAttachment]
              }).catch(() => {});
            } catch {}
          }

          await interaction.editReply({
            components: [V2.success('Transcript sent to the ticket creator and log channel.')],
            flags: V2.FLAG
          });
        } catch (e) {
          console.error('[spinning_ticket] Transcript generation error:', e.message);
          await interaction.editReply({
            components: [V2.error('Failed to generate transcript.')],
            flags: V2.FLAG
          });
        }
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

module.exports = { ticketSlashCmds, ticketsTable, createTicket, getConfig, generateTranscript };
