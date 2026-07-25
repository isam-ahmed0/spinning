const { V2 } = require('../../spinning_core/lib/ui');
const { MessageFlags } = require('discord.js');
const { createPaginationSession } = require('../../../lib/pagination');

const FALLBACK_NEWS = [
  { title: 'AI Revolution: New Language Models Break Records', source: 'TechCrunch', description: 'Latest AI models show unprecedented performance gains.' },
  { title: 'Space Tourism Reaches New Milestone', source: 'BBC News', description: 'Commercial space flight completes 100th mission.' },
  { title: 'Global Climate Summit Reaches Agreement', source: 'Reuters', description: '195 nations commit to new emission targets.' },
  { title: 'Quantum Computing Breakthrough', source: 'Nature', description: 'Scientists achieve 1000-qubit processor milestone.' },
  { title: 'Electric Vehicles Outsell Gas Cars', source: 'Bloomberg', description: 'EV market share exceeds 50% for first time.' },
  { title: 'New Internet Undersea Cable Connects Continents', source: 'The Verge', description: '100Tbps cable links North America and Asia.' },
  { title: 'Open Source AI Models Challenge Big Tech', source: 'Wired', description: 'Community-built models rival proprietary systems.' },
  { title: 'Mars Colony Blueprint Unveiled', source: 'Space.com', description: 'NASA and SpaceX reveal joint habitation plan.' },
  { title: 'Cybersecurity Alert: New Vulnerability Discovered', source: 'Ars Technica', description: 'Critical flaw affects millions of devices worldwide.' },
  { title: 'Digital Currency Adoption Surges Globally', source: 'Financial Times', description: 'Central bank digital currencies now in 80% of nations.' }
];

const newsSlashCmds = [
  {
    name: 'news',
    description: 'Get latest news',
    options: [{ type: 'string', name: 'query', description: 'Search query (optional)', required: false }],
    async execute(interaction) {
      await interaction.deferReply();
      const query = interaction.options.getString('query');

      let news = FALLBACK_NEWS;
      if (query) {
        news = news.filter(n => n.title.toLowerCase().includes(query.toLowerCase()) || n.description.toLowerCase().includes(query.toLowerCase()));
        if (news.length === 0) news = FALLBACK_NEWS;
      }

      const session = createPaginationSession({
        interactionOrMessage: interaction,
        pages: news,
        userId: interaction.user.id,
        renderPage: async (index, data) => {
          const start = index * 5;
          const lines = data.slice(start, start + 5).map((n, i) =>
            `**${start + i + 1}.** ${n.title}\n-# ${n.source} — ${n.description}`
          ).join('\n\n');
          return V2.container(0x2B2D31, [
            V2.text(`### News${query ? ` — "${query}"` : ''}`),
            V2.separator(),
            V2.text(lines)
          ]);
        }
      });

      await session.renderInitial();
    }
  }
];

module.exports = { newsSlashCmds };
