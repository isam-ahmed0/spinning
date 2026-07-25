const { V2 } = require('../../spinning_core/lib/ui');

const HELP_CATEGORIES = [
  {
    name: 'General',
    emoji: '📋',
    commands: [
      { name: '/help', desc: 'Show this help menu' },
      { name: '/ping', desc: 'Check bot latency' },
      { name: '/info', desc: 'Bot information' },
      { name: '/uptime', desc: 'Bot uptime' },
      { name: '/invite', desc: 'Get bot invite link' },
      { name: '/botinfo', desc: 'Detailed bot info' }
    ]
  },
  {
    name: 'Moderation',
    emoji: '🛡️',
    commands: [
      { name: '/ban', desc: 'Ban a member' },
      { name: '/kick', desc: 'Kick a member' },
      { name: '/mute', desc: 'Timeout a member' },
      { name: '/unmute', desc: 'Remove timeout' },
      { name: '/warn', desc: 'Warn a member' },
      { name: '/warnings', desc: 'View warnings' },
      { name: '/purge', desc: 'Bulk delete messages' },
      { name: '/lock', desc: 'Lock a channel' },
      { name: '/unlock', desc: 'Unlock a channel' }
    ]
  },
  {
    name: 'Fun',
    emoji: '🎮',
    commands: [
      { name: '/meme', desc: 'Random meme' },
      { name: '/joke', desc: 'Random joke' },
      { name: '/fact', desc: 'Random fact' },
      { name: '/8ball', desc: 'Magic 8-ball' },
      { name: '/coinflip', desc: 'Flip a coin' },
      { name: '/roll', desc: 'Roll dice' },
      { name: '/ship', desc: 'Ship two users' },
      { name: '/rizz', desc: 'Get a rizz line' },
      { name: '/wizz', desc: 'Hacker animation' }
    ]
  },
  {
    name: 'Roleplay',
    emoji: '💕',
    commands: [
      { name: '/hug', desc: 'Hug someone' },
      { name: '/kiss', desc: 'Kiss someone' },
      { name: '/slap', desc: 'Slap someone' },
      { name: '/pat', desc: 'Pat someone' },
      { name: '/wave', desc: 'Wave at someone' },
      { name: '/poke', desc: 'Poke someone' },
      { name: '/dance', desc: 'Dance with someone' },
      { name: '/cry', desc: 'Cry' }
    ]
  },
  {
    name: 'Utility',
    emoji: '🔧',
    commands: [
      { name: '/afk', desc: 'Set AFK status' },
      { name: '/remind', desc: 'Set a reminder' },
      { name: '/todo', desc: 'Todo list' },
      { name: '/calc', desc: 'Interactive calculator' },
      { name: '/convert', desc: 'Unit conversion' },
      { name: '/wikipedia', desc: 'Search Wikipedia' },
      { name: '/define', desc: 'Urban Dictionary definition' }
    ]
  },
  {
    name: 'Server',
    emoji: '🏠',
    commands: [
      { name: '/setwelcome', desc: 'Set welcome channel' },
      { name: '/setgoodbye', desc: 'Set goodbye channel' },
      { name: '/setlog', desc: 'Set log channel (per-type)' },
      { name: '/setautorole', desc: 'Set auto-role' },
      { name: '/antinuke', desc: 'Configure antinuke' },
      { name: '/automod', desc: 'Configure automod' },
      { name: '/ticket', desc: 'Ticket system' },
      { name: '/feedback', desc: 'Feedback system' }
    ]
  },
  {
    name: 'Stats',
    emoji: '📊',
    commands: [
      { name: '/channelinfo', desc: 'Channel information' },
      { name: '/roleinfo', desc: 'Role information' },
      { name: '/emojiinfo', desc: 'Emoji information' },
      { name: '/rolecall', desc: 'Members with a role' },
      { name: '/firstjoins', desc: 'Recent first joins' },
      { name: '/lastjoins', desc: 'Recent joins' }
    ]
  },
  {
    name: 'Crypto',
    emoji: '💰',
    commands: [
      { name: '/cryptoprice', desc: 'Crypto price' },
      { name: '/cryptogainers', desc: 'Top gainers' },
      { name: '/cryptolosers', desc: 'Top losers' },
      { name: '/cryptonews', desc: 'Crypto news' }
    ]
  },
  {
    name: 'Profile',
    emoji: '👤',
    commands: [
      { name: '/profile', desc: 'View/edit profile' },
      { name: '/avatar', desc: 'User avatar' },
      { name: '/banner', desc: 'User banner' },
      { name: '/anime', desc: 'Anime PFP' },
      { name: '/female', desc: 'Female PFP' },
      { name: '/male', desc: 'Male PFP' }
    ]
  }
];

function buildHelpPage(pageIndex) {
  const category = HELP_CATEGORIES[pageIndex];
  const totalPages = HELP_CATEGORIES.length;

  const commandLines = category.commands.map(c => `\`${c.name}\` — ${c.desc}`).join('\n');

  const components = [
    V2.container(V2.config.brand_color, [
      V2.text(`### ${category.emoji} ${category.name}`),
      V2.separator(),
      V2.text(commandLines),
      V2.separator(),
      V2.text(`Page ${pageIndex + 1}/${totalPages} • Use buttons to navigate`)
    ]),
    { type: 1, components: [
      { type: 2, custom_id: `help_prev_${pageIndex}`, label: '◀ Previous', style: 2, disabled: pageIndex === 0 },
      { type: 2, custom_id: `help_next_${pageIndex}`, label: 'Next ▶', style: 2, disabled: pageIndex === totalPages - 1 },
      { type: 2, custom_id: `help_categories_${pageIndex}`, label: '📋 Categories', style: 2 }
    ]}
  ];

  return components;
}

function handleHelpButton(interaction) {
  if (!interaction.isButton()) return false;
  const id = interaction.customId;
  if (!id.startsWith('help_')) return false;

  const parts = id.split('_');
  const action = parts[1];
  const currentIndex = parseInt(parts[2]);

  if (action === 'prev' && currentIndex > 0) {
    const components = buildHelpPage(currentIndex - 1);
    interaction.update({ components, flags: V2.FLAG }).catch(() => {});
  } else if (action === 'next' && currentIndex < HELP_CATEGORIES.length - 1) {
    const components = buildHelpPage(currentIndex + 1);
    interaction.update({ components, flags: V2.FLAG }).catch(() => {});
  } else if (action === 'categories') {
    const lines = HELP_CATEGORIES.map((c, i) => `${c.emoji} **${c.name}** — ${c.commands.length} commands`).join('\n');
    const components = [
      V2.container(V2.config.brand_color, [
        V2.text('### 📋 Help Categories'),
        V2.separator(),
        V2.text(lines),
        V2.separator(),
        V2.text('Use buttons below to navigate')
      ]),
      { type: 1, components: HELP_CATEGORIES.map((c, i) => ({
        type: 2,
        custom_id: `help_goto_${i}`,
        label: c.emoji,
        style: 2
      })).slice(0, 5) }
    ];
    if (HELP_CATEGORIES.length > 5) {
      components.push({ type: 1, components: HELP_CATEGORIES.slice(5).map((c, i) => ({
        type: 2,
        custom_id: `help_goto_${i + 5}`,
        label: c.emoji,
        style: 2
      })) });
    }
    interaction.update({ components, flags: V2.FLAG }).catch(() => {});
  } else if (action === 'goto') {
    const pageIndex = parseInt(parts[2]);
    if (pageIndex >= 0 && pageIndex < HELP_CATEGORIES.length) {
      const components = buildHelpPage(pageIndex);
      interaction.update({ components, flags: V2.FLAG }).catch(() => {});
    }
  }

  return true;
}

const helpSlashCmds = [
  {
    name: 'help',
    description: 'Show the help menu',
    async execute(interaction) {
      const components = buildHelpPage(0);
      await interaction.reply({ components, flags: V2.FLAG });
    }
  }
];

module.exports = { helpSlashCmds, handleHelpButton };
