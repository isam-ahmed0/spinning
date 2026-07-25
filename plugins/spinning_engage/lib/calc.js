const { V2 } = require('../../spinning_core/lib/ui');
const emojis = require('../../../emojis.json');

function createCalculatorButtons(calcId) {
  const make = (id, label, style) => ({ type: 2, custom_id: `${calcId}_${id}`, label, style });

  return [
    { type: 1, components: [
      make('clear', 'C', 4), make('divide', '÷', 1),
      make('multiply', '×', 1), make('delete', '⌫', 2)
    ]},
    { type: 1, components: [
      make('7', '7', 2), make('8', '8', 2), make('9', '9', 2), make('subtract', '-', 1)
    ]},
    { type: 1, components: [
      make('4', '4', 2), make('5', '5', 2), make('6', '6', 2), make('add', '+', 1)
    ]},
    { type: 1, components: [
      make('1', '1', 2), make('2', '2', 2), make('3', '3', 2), make('equals', '=', 3)
    ]},
    { type: 1, components: [
      make('0', '0', 2), make('decimal', '.', 2), make('00', '00', 2), make('percent', '%', 1)
    ]}
  ];
}

function buildCalcContainer(display, rows) {
  return [
    V2.container(0x2B2D31, [
      V2.text('# Calculator'),
      V2.separator(),
      V2.text(`\`\`\`\n${display}\n\`\`\``)
    ]),
    ...rows
  ];
}

function handleCalculatorAction(calc, action) {
  if (['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'].includes(action)) {
    if (calc.currentValue === '0' || calc.display === 'Error') {
      calc.currentValue = action;
      calc.display = calc.operator === null ? action : calc.display + action;
    } else {
      calc.currentValue += action;
      calc.display += action;
    }
  } else if (action === '00') {
    if (calc.currentValue !== '0') {
      calc.currentValue += '00';
      calc.display += '00';
    }
  } else if (action === 'decimal') {
    if (!calc.currentValue.includes('.')) {
      if (calc.currentValue === '0') {
        calc.currentValue = '0.';
        calc.display = calc.operator === null ? '0.' : calc.display + '0.';
      } else {
        calc.currentValue += '.';
        calc.display += '.';
      }
    }
  } else if (action === 'clear') {
    calc.display = '0';
    calc.currentValue = '0';
    calc.operator = null;
    calc.previousValue = null;
  } else if (action === 'delete') {
    if (calc.currentValue.length > 1) {
      calc.currentValue = calc.currentValue.slice(0, -1);
      calc.display = calc.display.slice(0, -1);
    } else {
      calc.currentValue = '0';
      calc.display = calc.operator === null ? '0' : calc.display.slice(0, -1);
    }
  } else if (['add', 'subtract', 'multiply', 'divide'].includes(action)) {
    if (calc.operator && calc.previousValue !== null && calc.currentValue !== '0') {
      performCalculation(calc);
    }
    calc.previousValue = parseFloat(calc.currentValue);
    calc.operator = action;
    calc.display += ` ${getOperatorSymbol(action)} `;
    calc.currentValue = '0';
  } else if (action === 'equals') {
    if (calc.operator && calc.previousValue !== null) {
      performCalculation(calc);
      calc.operator = null;
      calc.previousValue = null;
    }
  } else if (action === 'percent') {
    const num = parseFloat(calc.currentValue);
    const result = num / 100;
    calc.currentValue = String(result);
    if (calc.operator === null) {
      calc.display = String(result);
    } else {
      const parts = calc.display.split(/\s[+\-×÷]\s/);
      calc.display = parts[0] + calc.display.substring(parts[0].length, calc.display.length - calc.currentValue.length + result.toString().length) + String(result);
    }
  }
}

function performCalculation(calc) {
  const prev = calc.previousValue;
  const current = parseFloat(calc.currentValue);
  let result;
  try {
    switch (calc.operator) {
      case 'add': result = prev + current; break;
      case 'subtract': result = prev - current; break;
      case 'multiply': result = prev * current; break;
      case 'divide':
        if (current === 0) { calc.display = 'Error: Division by zero'; calc.currentValue = '0'; return; }
        result = prev / current; break;
      default: return;
    }
    result = Math.round(result * 1000000000) / 1000000000;
    calc.display = String(result);
    calc.currentValue = String(result);
  } catch { calc.display = 'Error'; calc.currentValue = '0'; }
}

function getOperatorSymbol(op) {
  return { add: '+', subtract: '-', multiply: '×', divide: '÷' }[op] || '';
}

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
  g_oz: (v) => (v / 28.3495).toFixed(2),
  dec_hex: (v) => Math.round(v).toString(16).toUpperCase(),
  hex_dec: (v) => parseInt(v, 16),
  dec_bin: (v) => Math.round(v).toString(2),
  bin_dec: (v) => parseInt(v, 2),
  dec_oct: (v) => Math.round(v).toString(8),
  oct_dec: (v) => parseInt(v, 8),
  str_hex: (v) => Buffer.from(v).toString('hex'),
  hex_str: (v) => Buffer.from(v, 'hex').toString('utf8'),
  str_bin: (v) => [...Buffer.from(v)].map(b => b.toString(2).padStart(8, '0')).join(' '),
  bin_str: (v) => Buffer.from(v.split(' ').map(b => parseInt(b, 2))).toString('utf8')
};

const calcSlashCmds = [
  {
    name: 'calc',
    description: 'Interactive calculator with buttons',
    async execute(interaction) {
      const calcId = `calc-${interaction.user.id}-${Date.now()}`;
      const calc = { display: '0', currentValue: '0', operator: null, previousValue: null };
      const rows = createCalculatorButtons(calcId);

      const components = buildCalcContainer(calc.display, rows);
      await interaction.reply({ components, flags: V2.FLAG });
      const message = await interaction.fetchReply();

      const collector = message.createMessageComponentCollector({ time: 300000 });

      collector.on('collect', async (btn) => {
        if (btn.user.id !== interaction.user.id) {
          return btn.reply({ content: 'This calculator is not for you! Use `/calc` to create your own.', flags: 64 });
        }
        const action = btn.customId.replace(`${calcId}_`, '');
        handleCalculatorAction(calc, action);
        const newComponents = buildCalcContainer(calc.display, rows);
        await btn.update({ components: newComponents, flags: V2.FLAG });
      });

      collector.on('end', async () => {
        const disabledRows = rows.map(row => ({
          ...row,
          components: row.components.map(c => ({ ...c, disabled: true }))
        }));
        const finalComponents = [
          V2.container(0x2B2D31, [
            V2.text('# Calculator'),
            V2.separator(),
            V2.text(`\`\`\`\n${calc.display}\n\`\`\`\n*Calculator expired*`)
          ]),
          ...disabledRows
        ];
        try { await interaction.editReply({ components: finalComponents, flags: V2.FLAG }); } catch {}
      });
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
        const axios = require('axios');
        const searchRes = await axios.get('https://en.wikipedia.org/w/api.php', {
          params: { action: 'query', list: 'search', srsearch: query, format: 'json', srlimit: 5 }
        });
        const results = searchRes.data.query.search;
        if (!results.length) {
          return interaction.editReply({ components: [V2.error('No results found.')], flags: V2.FLAG });
        }

        const pageRes = await axios.get('https://en.wikipedia.org/w/api.php', {
          params: { action: 'query', titles: results[0].title, prop: 'extracts|pageimages|info', exintro: true, explaintext: true, piprop: 'original|thumbnail', pithumbsize: 512, format: 'json' }
        });
        const pages = pageRes.data.query.pages;
        const page = Object.values(pages)[0];
        const content = page.extract ? page.extract.substring(0, 1500) : 'No content available';
        const thumb = page.thumbnail?.source;

        const parts = [
          V2.text(`### ${page.title}`),
          V2.separator(),
          V2.text(content)
        ];
        if (thumb) {
          parts.push(V2.separator());
          parts.push(V2.media([{ url: thumb }]));
        }
        parts.push(V2.separator());
        parts.push(V2.text(`[Read more](https://en.wikipedia.org/wiki/${encodeURIComponent(page.title.replace(/ /g, '_'))})`));

        await interaction.editReply({ components: [V2.container(V2.config.brand_color, parts)], flags: V2.FLAG });
      } catch (e) {
        await interaction.editReply({ components: [V2.error('Could not search Wikipedia.')], flags: V2.FLAG });
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

      if (isNaN(value)) return V2.reply(interaction, V2.error('Invalid number.'), true);

      const key = `${from}_${to}`;
      const converter = CONVERTERS[key];
      if (!converter) return V2.reply(interaction, V2.error(`Unknown conversion: ${from} → ${to}. Try: cm/ft, kg/lb, mi/km, c/f, l/gal, oz/g`), true);

      const result = converter(value);
      const container = V2.container(V2.config.brand_color, [
        V2.text('### Conversion'),
        V2.separator(),
        V2.text(`**${value} ${from}** = **${result} ${to}**`)
      ]);
      await V2.reply(interaction, container, true);
    }
  }
];

module.exports = { calcSlashCmds };
