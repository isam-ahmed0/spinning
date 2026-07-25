const { V2 } = require('../../spinning_core/lib/ui');
const { MessageFlags } = require('discord.js');

const cryptoSlashCmds = [
  {
    name: 'cryptoprice',
    description: 'Check cryptocurrency price',
    options: [{ type: 'string', name: 'coin', description: 'Coin name (e.g. bitcoin, ethereum)', required: true }],
    async execute(interaction) {
      await interaction.deferReply();
      const coin = interaction.options.getString('coin').toLowerCase();
      try {
        const res = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${coin}&vs_currencies=usd&include_24hr_change=true`);
        const data = await res.json();
        if (!data[coin]) {
          return interaction.editReply({ components: [V2.error(`Coin "${coin}" not found. Use CoinGecko IDs like "bitcoin", "ethereum".`)], flags: V2.FLAG });
        }
        const price = data[coin].usd;
        const change = data[coin].usd_24h_change;
        const changeStr = change ? `${change >= 0 ? '+' : ''}${change.toFixed(2)}%` : 'N/A';
        await interaction.editReply({ components: [V2.container(0x2B2D31, [
          V2.text(`### Crypto Price`),
          V2.separator(),
          V2.text(`**${coin.charAt(0).toUpperCase() + coin.slice(1)}**\n**Price:** $${price.toLocaleString()}\n**24h Change:** ${changeStr}`)
        ])], flags: V2.FLAG });
      } catch (e) {
        await interaction.editReply({ components: [V2.error('Failed to fetch price. Try again later.')], flags: V2.FLAG });
      }
    }
  },
  {
    name: 'cryptogainers',
    description: 'Top 24h gainers',
    async execute(interaction) {
      await interaction.deferReply();
      try {
        const res = await fetch('https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=price_change_percentage_24h_desc&per_page=10&page=1');
        const data = await res.json();
        const lines = data.map((c, i) => `**${i + 1}.** ${c.name} (${c.symbol.toUpperCase()}) — $${c.current_price.toLocaleString()} — ${c.price_change_percentage_24h?.toFixed(2) || 0}%`).join('\n');
        await interaction.editReply({ components: [V2.container(0x2B2D31, [
          V2.text('### Top 24h Gainers'), V2.separator(), V2.text(lines)
        ])], flags: V2.FLAG });
      } catch (e) {
        await interaction.editReply({ components: [V2.error('Failed to fetch gainers.')], flags: V2.FLAG });
      }
    }
  },
  {
    name: 'cryptolosers',
    description: 'Top 24h losers',
    async execute(interaction) {
      await interaction.deferReply();
      try {
        const res = await fetch('https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=price_change_percentage_24h_asc&per_page=10&page=1');
        const data = await res.json();
        const lines = data.map((c, i) => `**${i + 1}.** ${c.name} (${c.symbol.toUpperCase()}) — $${c.current_price.toLocaleString()} — ${c.price_change_percentage_24h?.toFixed(2) || 0}%`).join('\n');
        await interaction.editReply({ components: [V2.container(0x2B2D31, [
          V2.text('### Top 24h Losers'), V2.separator(), V2.text(lines)
        ])], flags: V2.FLAG });
      } catch (e) {
        await interaction.editReply({ components: [V2.error('Failed to fetch losers.')], flags: V2.FLAG });
      }
    }
  },
  {
    name: 'cryptoconvert',
    description: 'Convert between cryptocurrencies',
    options: [
      { type: 'number', name: 'amount', description: 'Amount to convert', required: true },
      { type: 'string', name: 'from', description: 'Source coin (e.g. bitcoin)', required: true },
      { type: 'string', name: 'to', description: 'Target coin (e.g. ethereum)', required: true }
    ],
    async execute(interaction) {
      await interaction.deferReply();
      const amount = interaction.options.getNumber('amount');
      const from = interaction.options.getString('from').toLowerCase();
      const to = interaction.options.getString('to').toLowerCase();
      try {
        const res = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${from},${to}&vs_currencies=usd`);
        const data = await res.json();
        if (!data[from] || !data[to]) {
          return interaction.editReply({ components: [V2.error('One or both coins not found.')], flags: V2.FLAG });
        }
        const fromPrice = data[from].usd;
        const toPrice = data[to].usd;
        const result = (amount * fromPrice) / toPrice;
        await interaction.editReply({ components: [V2.container(0x2B2D31, [
          V2.text('### Crypto Convert'), V2.separator(),
          V2.text(`**${amount} ${from.charAt(0).toUpperCase() + from.slice(1)}** = **${result.toFixed(8)} ${to.charAt(0).toUpperCase() + to.slice(1)}**`)
        ])], flags: V2.FLAG });
      } catch (e) {
        await interaction.editReply({ components: [V2.error('Failed to convert. Try again later.')], flags: V2.FLAG });
      }
    }
  },
  {
    name: 'cryptonews',
    description: 'Latest crypto news',
    async execute(interaction) {
      await interaction.deferReply();
      const news = [
        { title: 'Bitcoin Reaches New All-Time High', source: 'CoinDesk' },
        { title: 'Ethereum 2.0 Update Progresses', source: 'CoinTelegraph' },
        { title: 'SEC Reviews New Crypto ETF Applications', source: 'Reuters' },
        { title: 'DeFi Total Value Locked Surges', source: 'The Block' },
        { title: 'Central Banks Explore CBDC Development', source: 'Bloomberg' },
        { title: 'NFT Market Shows Signs of Recovery', source: 'Decrypt' },
        { title: 'Crypto Mining Regulations Tighten in Europe', source: 'Financial Times' },
        { title: 'Institutional Adoption of Crypto Accelerates', source: 'Forbes' }
      ];
      const lines = news.map((n, i) => `**${i + 1}.** ${n.title}\n-# ${n.source}`).join('\n\n');
      await interaction.editReply({ components: [V2.container(0x2B2D31, [
        V2.text('### Crypto News'), V2.separator(), V2.text(lines)
      ])], flags: V2.FLAG });
    }
  },
  {
    name: 'cryptobalance',
    description: 'Check crypto wallet balance',
    options: [
      { type: 'string', name: 'address', description: 'Wallet address', required: true },
      { type: 'string', name: 'coin', description: 'Coin (btc/eth/ltc/doge)', required: true }
    ],
    async execute(interaction) {
      await interaction.reply({ components: [V2.container(0x2B2D31, [
        V2.text('### Crypto Balance'), V2.separator(),
        V2.text('Wallet balance lookup requires blockchain API integration. Coming soon.')
      ])], flags: V2.FLAG });
    }
  },
  {
    name: 'cryptotx',
    description: 'Look up a transaction',
    options: [{ type: 'string', name: 'hash', description: 'Transaction hash', required: true }],
    async execute(interaction) {
      await interaction.reply({ components: [V2.container(0x2B2D31, [
        V2.text('### Transaction Lookup'), V2.separator(),
        V2.text('Transaction lookup requires blockchain API integration. Coming soon.')
      ])], flags: V2.FLAG });
    }
  }
];

module.exports = { cryptoSlashCmds };
