const { V2 } = require('../../spinning_core/lib/ui');
const emojis = require('../../../emojis.json');

const CONVERTERS = {
  cm_ft: (v) => (v / 30.48).toFixed(2),
  ft_cm: (v) => (v * 30.48).toFixed(2),
  kg_lb: (v) => (v * 2.20462).toFixed(2),
  lb_kg: (v) => (v / 2.20462).toFixed(2),
  mi_km: (v) => (v * 1.60934).toFixed(2),
  km_mi: (v) => (v / 1.60934).toFixed(2),
  c_f: (v) => ((v * 9/5) + 32).toFixed(1),
  f_c: (v) => ((v - 32) * 5/9).toFixed(1),
  l_gal: (v) => (v * 0.264172).toFixed(2),
  gal_l: (v) => (v * 3.78541).toFixed(2),
  oz_g: (v) => (v * 28.3495).toFixed(2),
  g_oz: (v) => (v / 28.3495).toFixed(2)
};

const calcSlashCmds = [
  {
    name: 'calc',
    description: 'Calculate a math expression',
    options: [{ type: 'string', name: 'expression', description: 'Math expression (e.g. 2+2)', required: true }],
    async execute(interaction) {
      const expr = interaction.options.getString('expression');
      try {
        const safe = expr.replace(/[^0-9+\-*/().%^sqrtabsin cos tan pi e]/gi, '');
        const result = Function(`"use strict"; return (${safe})`)();
        const container = V2.container(V2.config.brand_color, [
          V2.text(`${emojis.calculator || '🧮'} **Calculator**`),
          V2.separator(),
          V2.text(`**Expression:** \`${expr}\``),
          V2.text(`**Result:** \`${result}\``)
        ]);
        await V2.reply(interaction, container, true);
      } catch (e) {
        await V2.reply(interaction, V2.error('Invalid expression.'), true);
      }
    }
  },
  {
    name: 'wikipedia',
    description: 'Search Wikipedia',
    options: [{ type: 'string', name: 'query', description: 'Search query', required: true }],
    async execute(interaction) {
      const query = interaction.options.getString('query');
      await interaction.deferReply();
      try {
        const wiki = require('wikipedia');
        const result = await wiki.page(query);
        const summary = await result.summary();
        const container = V2.container(V2.config.brand_color, [
          V2.text(`${emojis.globe} **${summary.title}**`),
          V2.separator(),
          V2.text(summary.extract.slice(0, 1500)),
          V2.separator(),
          V2.text(`[Read more](${summary.content_urls.desktop.page})`)
        ]);
        await interaction.editReply({ components: [container], flags: V2.FLAG });
      } catch (e) {
        await interaction.editReply({ components: [V2.error('Could not find that article.')], flags: V2.FLAG });
      }
    }
  },
  {
    name: 'convert',
    description: 'Convert units',
    options: [
      { type: 'string', name: 'value', description: 'Value to convert', required: true },
      { type: 'string', name: 'from', description: 'From unit', required: true },
      { type: 'string', name: 'to', description: 'To unit', required: true }
    ],
    async execute(interaction) {
      const value = parseFloat(interaction.options.getString('value'));
      const from = interaction.options.getString('from').toLowerCase();
      const to = interaction.options.getString('to').toLowerCase();

      if (isNaN(value)) {
        return V2.reply(interaction, V2.error('Invalid number.'), true);
      }

      const key = `${from}_${to}`;
      const converter = CONVERTERS[key];

      if (!converter) {
        return V2.reply(interaction, V2.error(`Unknown conversion: ${from} → ${to}. Try: cm/ft, kg/lb, mi/km, c/f, l/gal, oz/g`), true);
      }

      const result = converter(value);
      const container = V2.container(V2.config.brand_color, [
        V2.text(`${emojis.arrow} **Conversion**`),
        V2.separator(),
        V2.text(`**${value} ${from}** = **${result} ${to}**`)
      ]);

      await V2.reply(interaction, container, true);
    }
  }
];

module.exports = { calcSlashCmds };
