const { V2 } = require('./ui');

const commands = [
  {
    name: 'help',
    description: 'List all available commands',
    options: [],
    async execute(interaction, runtime) {
      const helpText = buildHelp(runtime);
      await interaction.reply({ components: [helpText], flags: V2.FLAG });
    }
  },
  {
    name: 'ping',
    description: 'Check bot latency',
    options: [],
    async execute(interaction, runtime) {
      const sent = await interaction.reply({ components: [V2.text('Pinging...')], flags: V2.FLAG, fetchReply: true });
      const latency = sent.createdTimestamp - interaction.createdTimestamp;
      const container = V2.container(V2.config.brand_color, [
        V2.text('## Pong!'),
        V2.separator(),
        V2.text(`**Latency:** ${latency}ms`),
        V2.text(`**API:** ${Math.round(runtime.client.ws.ping)}ms`)
      ]);
      await interaction.editReply({ components: [container] });
    }
  },
  {
    name: 'info',
    description: 'Show bot information',
    options: [],
    async execute(interaction, runtime) {
      const client = runtime.client;
      const uptime = formatUptime(client.uptime);
      const servers = client.guilds.cache.size;
      const users = client.guilds.cache.reduce((a, g) => a + g.memberCount, 0);
      const container = V2.container(V2.config.brand_color, [
        V2.text('## Spinning'),
        V2.separator(),
        V2.text(`**Servers:** ${servers}`),
        V2.text(`**Users:** ${users.toLocaleString()}`),
        V2.text(`**Uptime:** ${uptime}`),
        V2.text(`**Discord.js:** v${require('discord.js').version}`),
        V2.separator(),
        V2.text('*Minimal bot for maximal vibes*')
      ]);
      await interaction.reply({ components: [container], flags: V2.FLAG });
    }
  },
  {
    name: 'uptime',
    description: 'Show bot uptime',
    options: [],
    async execute(interaction, runtime) {
      const uptime = formatUptime(runtime.client.uptime);
      const container = V2.container(V2.config.brand_color, [
        V2.text('## Uptime'),
        V2.separator(),
        V2.text(`**${uptime}**`)
      ]);
      await interaction.reply({ components: [container], flags: V2.FLAG });
    }
  },
  {
    name: 'invite',
    description: 'Get bot invite link',
    options: [],
    async execute(interaction, runtime) {
      const clientId = runtime.config.clientId;
      const url = `https://discord.com/oauth2/authorize?client_id=${clientId}&permissions=8&scope=bot%20applications.commands`;
      const container = V2.container(V2.config.brand_color, [
        V2.text('## Invite Spinning'),
        V2.separator(),
        V2.text(`[Click here to invite](${url})`)
      ]);
      await interaction.reply({ components: [container], flags: V2.FLAG });
    }
  }
];

function formatUptime(ms) {
  const s = Math.floor(ms / 1000);
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const parts = [];
  if (d > 0) parts.push(`${d}d`);
  if (h > 0) parts.push(`${h}h`);
  if (m > 0) parts.push(`${m}m`);
  parts.push(`${sec}s`);
  return parts.join(' ');
}

module.exports = commands;
