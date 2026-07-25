const { V2 } = require('../../spinning_core/lib/ui');
const { MessageFlags, AttachmentBuilder } = require('discord.js');

function requireAdmin(interaction) {
  if (!interaction.member.permissions.has('Administrator')) {
    return V2.reply(interaction, V2.error('You need Administrator permission.'), true);
  }
  return null;
}

async function sendDump(interaction, filename, content) {
  const attachment = new AttachmentBuilder(Buffer.from(content, 'utf-8'), { name: filename });
  await interaction.editReply({
    components: [V2.success(`Dump exported as \`${filename}\`. Check your DMs.`)],
    files: [attachment],
    flags: V2.FLAG
  });
  try {
    await interaction.user.send({
      content: `Here is your data dump from **${interaction.guild.name}**:`,
      files: [attachment]
    });
  } catch {}
}

const filesSlashCmds = [
  {
    name: 'dumpbans',
    description: 'Export banned users list',
    async execute(interaction) {
      if (requireAdmin(interaction)) return;
      await interaction.deferReply();
      const bans = await interaction.guild.bans.fetch();
      const lines = bans.map(b => `${b.user.tag} (${b.user.id}) — ${b.reason || 'No reason'}`).join('\n');
      await sendDump(interaction, 'bans.txt', lines || 'No bans found.');
    }
  },
  {
    name: 'dumpbots',
    description: 'Export bots list',
    async execute(interaction) {
      if (requireAdmin(interaction)) return;
      await interaction.deferReply();
      const members = await interaction.guild.members.fetch();
      const bots = members.filter(m => m.user.bot);
      const lines = bots.map(m => `${m.user.tag} (${m.user.id}) — Joined: ${m.joinedAt?.toISOString() || 'Unknown'}`).join('\n');
      await sendDump(interaction, 'bots.txt', lines || 'No bots found.');
    }
  },
  {
    name: 'dumpcategories',
    description: 'Export channel categories',
    async execute(interaction) {
      if (requireAdmin(interaction)) return;
      await interaction.deferReply();
      const cats = interaction.guild.channels.cache.filter(c => c.type === 4);
      const lines = cats.map(c => `${c.name} (${c.id}) — Position: ${c.position}`).join('\n');
      await sendDump(interaction, 'categories.txt', lines || 'No categories found.');
    }
  },
  {
    name: 'dumpchannels',
    description: 'Export all channels',
    async execute(interaction) {
      if (requireAdmin(interaction)) return;
      await interaction.deferReply();
      const channels = interaction.guild.channels.cache;
      const lines = channels.map(c => `${c.name} (${c.id}) — Type: ${c.type} — Category: ${c.parent?.name || 'None'}`).join('\n');
      await sendDump(interaction, 'channels.txt', lines || 'No channels found.');
    }
  },
  {
    name: 'dumpemotes',
    description: 'Export custom emojis',
    async execute(interaction) {
      if (requireAdmin(interaction)) return;
      await interaction.deferReply();
      const emojis = interaction.guild.emojis.cache;
      const lines = emojis.map(e => `${e.name} (${e.id}) — Animated: ${e.animated} — ${e.url}`).join('\n');
      await sendDump(interaction, 'emotes.txt', lines || 'No emotes found.');
    }
  },
  {
    name: 'dumphumans',
    description: 'Export human (non-bot) members',
    async execute(interaction) {
      if (requireAdmin(interaction)) return;
      await interaction.deferReply();
      const members = await interaction.guild.members.fetch();
      const humans = members.filter(m => !m.user.bot);
      const lines = humans.map(m => `${m.user.tag} (${m.user.id}) — Joined: ${m.joinedAt?.toISOString() || 'Unknown'}`).join('\n');
      await sendDump(interaction, 'humans.txt', lines || 'No human members found.');
    }
  },
  {
    name: 'dumpmessages',
    description: 'Export messages (requires event tracking)',
    async execute(interaction) {
      if (requireAdmin(interaction)) return;
      await interaction.reply({ components: [V2.error('Message dump requires event tracking integration. Coming soon.')], flags: V2.FLAG });
    }
  },
  {
    name: 'dumproles',
    description: 'Export roles with member counts',
    async execute(interaction) {
      if (requireAdmin(interaction)) return;
      await interaction.deferReply();
      const roles = interaction.guild.roles.cache.sort((a, b) => b.position - a.position);
      const lines = roles.map(r => `${r.name} (${r.id}) — Members: ${r.members.size} — Color: ${r.hexColor} — Position: ${r.position}`).join('\n');
      await sendDump(interaction, 'roles.txt', lines || 'No roles found.');
    }
  },
  {
    name: 'dumpsettings',
    description: 'Export server settings',
    async execute(interaction) {
      if (requireAdmin(interaction)) return;
      await interaction.deferReply();
      const g = interaction.guild;
      const settings = [
        `Name: ${g.name}`,
        `ID: ${g.id}`,
        `Owner: ${g.ownerId}`,
        `Created: ${g.createdAt.toISOString()}`,
        `Members: ${g.memberCount}`,
        `Boost Level: ${g.premiumTier}`,
        `Boosts: ${g.premiumSubscriptionCount}`,
        `Verification Level: ${g.verificationLevel}`,
        `Explicit Content Filter: ${g.explicitContentFilter}`,
        `Default Notification: ${g.defaultMessageNotificationLevel}`,
        `Vanity URL: ${g.vanityURLCode || 'None'}`,
        `Banner: ${g.bannerURL() || 'None'}`,
        `Icon: ${g.iconURL() || 'None'}`
      ].join('\n');
      await sendDump(interaction, 'settings.txt', settings);
    }
  },
  {
    name: 'dumpusers',
    description: 'Export all users',
    async execute(interaction) {
      if (requireAdmin(interaction)) return;
      await interaction.deferReply();
      const members = await interaction.guild.members.fetch();
      const lines = members.map(m => `${m.user.tag} (${m.user.id}) — Bot: ${m.user.bot} — Joined: ${m.joinedAt?.toISOString() || 'Unknown'} — Created: ${m.user.createdAt.toISOString()}`).join('\n');
      await sendDump(interaction, 'users.txt', lines || 'No users found.');
    }
  },
  {
    name: 'dumpvoicechannels',
    description: 'Export voice channels',
    async execute(interaction) {
      if (requireAdmin(interaction)) return;
      await interaction.deferReply();
      const channels = interaction.guild.channels.cache.filter(c => c.type === 2);
      const lines = channels.map(c => `${c.name} (${c.id}) — Members: ${c.members.size} — Bitrate: ${c.bitrate / 1000}kbps`).join('\n');
      await sendDump(interaction, 'voice_channels.txt', lines || 'No voice channels found.');
    }
  },
  {
    name: 'dumpwarns',
    description: 'Export warnings',
    async execute(interaction) {
      if (requireAdmin(interaction)) return;
      await interaction.reply({ components: [V2.error('Warning dump requires warning data integration. Coming soon.')], flags: V2.FLAG });
    }
  }
];

module.exports = { filesSlashCmds };
