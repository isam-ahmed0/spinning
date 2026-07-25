const { V2 } = require('./ui');

const ownerSlashCmds = [
  {
    name: 'botinfo',
    description: 'Show detailed bot information',
    options: [],
    async execute(interaction, runtime) {
      const client = runtime.client;
      const uptime = formatUptime(client.uptime);
      const servers = client.guilds.cache.size;
      const users = client.guilds.cache.reduce((a, g) => a + g.memberCount, 0);
      const mem = process.memoryUsage();
      const rss = (mem.rss / 1024 / 1024).toFixed(1);
      const heap = (mem.heapUsed / 1024 / 1024).toFixed(1);

      const container = V2.container(V2.config.brand_color, [
        V2.text('## Bot Info'),
        V2.separator(),
        V2.text(`**Servers:** ${servers}`),
        V2.text(`**Users:** ${users.toLocaleString()}`),
        V2.text(`**Uptime:** ${uptime}`),
        V2.text(`**Memory:** ${rss}MB RSS / ${heap}MB Heap`),
        V2.text(`**Node:** ${process.version}`),
        V2.text(`**Discord.js:** v${require('discord.js').version}`),
        V2.text(`**Platform:** ${process.platform} ${process.arch}`),
        V2.separator(),
        V2.text('*Minimal bot for maximal vibes*')
      ]);
      await V2.reply(interaction, container);
    }
  },
  {
    name: 'eval',
    description: 'Execute JavaScript code (owner only)',
    options: [{ type: 'string', name: 'code', description: 'Code to evaluate', required: true }],
    async execute(interaction, runtime) {
      if (!V2.isOwner(interaction.member, runtime)) {
        return V2.reply(interaction, V2.error('Owner only.'), true);
      }
      const code = interaction.options.getString('code');
      try {
        let result = eval(code);
        if (result instanceof Promise) result = await result;
        if (typeof result !== 'string') result = require('util').inspect(result, { depth: 2 });
        if (result.length > 1900) result = result.slice(0, 1900) + '...';
        await V2.reply(interaction, V2.container('#57F287', [
          V2.text('## Eval Result'),
          V2.separator(),
          V2.text(`\`\`\`js\n${result}\n\`\`\``)
        ]), true);
      } catch (e) {
        await V2.reply(interaction, V2.error(`Error: ${e.message}`), true);
      }
    }
  },
  {
    name: 'reboot',
    description: 'Restart the bot process (owner only)',
    options: [],
    async execute(interaction, runtime) {
      if (!V2.isOwner(interaction.member, runtime)) {
        return V2.reply(interaction, V2.error('Owner only.'), true);
      }
      await V2.reply(interaction, V2.info('Rebooting...'));
      process.exit(0);
    }
  },
  {
    name: 'guildleave',
    description: 'Leave a guild (owner only)',
    options: [{ type: 'string', name: 'guildid', description: 'Guild ID to leave', required: true }],
    async execute(interaction, runtime) {
      if (!V2.isOwner(interaction.member, runtime)) {
        return V2.reply(interaction, V2.error('Owner only.'), true);
      }
      const guildId = interaction.options.getString('guildid');
      const guild = runtime.client.guilds.cache.get(guildId);
      if (!guild) return V2.reply(interaction, V2.error('Guild not found.'), true);
      await guild.leave();
      await V2.reply(interaction, V2.success(`Left **${guild.name}**.`));
    }
  },
  {
    name: 'listservers',
    description: 'List all servers (owner only)',
    options: [],
    async execute(interaction, runtime) {
      if (!V2.isOwner(interaction.member, runtime)) {
        return V2.reply(interaction, V2.error('Owner only.'), true);
      }
      const guilds = [...runtime.client.guilds.cache.values()];
      const list = guilds.map((g, i) => `**${i + 1}.** ${g.name} (${g.memberCount} members)`).join('\n');
      const chunks = [];
      for (let i = 0; i < list.length; i += 1900) {
        chunks.push(list.slice(i, i + 1900));
      }
      for (const chunk of chunks) {
        await V2.reply(interaction, V2.container(V2.config.brand_color, [
          V2.text('## Servers'),
          V2.separator(),
          V2.text(chunk)
        ]));
      }
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

module.exports = { ownerSlashCmds };
