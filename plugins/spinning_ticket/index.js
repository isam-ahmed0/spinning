const { V2 } = require('../spinning_core/lib/ui');
const { ticketSlashCmds, ticketsTable, createTicket, getConfig } = require('./lib/ticket');
const emojis = require('../../emojis.json');

module.exports = {
  api: {
    slashCommands: ticketSlashCmds,
    ticketsTable,
    createTicket
  },

  async init(config, runtime) {
    const coreApi = runtime.getPluginAPI?.('spinning_core');
    if (coreApi?.registerSlashCommand) {
      for (const cmd of ticketSlashCmds) {
        coreApi.registerSlashCommand(cmd);
      }
    }
  },

  hooks: {
    interaction_received: async (payload, runtime) => {
      const { interaction } = payload;

      if (interaction.isStringSelectMenu() && interaction.customId === 'ticket_create') {
        const category = interaction.values[0];
        await createTicket(interaction, runtime, category);
        return;
      }

      if (interaction.isButton() && interaction.customId.startsWith('ticket_close_')) {
        const channelId = interaction.customId.replace('ticket_close_', '');
        const ticket = ticketsTable.findOne({ channelId, status: 'open' });
        if (!ticket) {
          return V2.reply(interaction, V2.error('Ticket not found or already closed.'), true);
        }

        ticketsTable.update({ channelId }, { status: 'closed', closedAt: Date.now() });

        const container = V2.container('#ED4245', [
          V2.text(`${emojis.cat_tickets} **Ticket Closed**`),
          V2.separator(),
          V2.text(`Closed by <@${interaction.user.id}>`)
        ]);

        await V2.reply(interaction, container);

        setTimeout(() => {
          interaction.channel.delete().catch(() => {});
        }, 5000);
        return;
      }

      if (!interaction.isChatInputCommand()) return;
      const cmd = ticketSlashCmds.find(c => c.name === interaction.commandName);
      if (!cmd) return;
      try {
        await cmd.execute(interaction, runtime);
      } catch (e) {
        console.error(`[spinning_ticket] Error /${interaction.commandName}:`, e.message);
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
