const { V2 } = require('../../spinning_core/lib/ui');
const { MessageFlags } = require('discord.js');

const miscSlashCmds = [
  {
    name: 'define',
    description: 'Look up a word on Urban Dictionary',
    options: [{ type: 'string', name: 'word', description: 'The word to define', required: true }],
    async execute(interaction) {
      const term = interaction.options.getString('word');
      await interaction.deferReply();

      try {
        const res = await fetch(`https://api.urbandictionary.com/v0/define?term=${encodeURIComponent(term)}`);
        const data = await res.json();

        if (!data.list || data.list.length === 0) {
          const container = V2.container(0x2B2D31, [
            V2.text('### Urban Dictionary'),
            V2.separator(),
            V2.text(`No definition found for **${term}**`)
          ]);
          return await interaction.editReply({ components: [container], flags: MessageFlags.IsComponentsV2 });
        }

        const result = data.list[0];
        const definition = result.definition.replace(/\[/g, '').replace(/\]/g, '');

        const container = V2.container(0x2B2D31, [
          V2.text('### Urban Dictionary'),
          V2.separator(),
          V2.text(`**${result.word}**`),
          V2.text(definition),
          V2.text(`\n*👍 ${result.thumbs_up} | 👎 ${result.thumbs_down}*`)
        ]);

        await interaction.editReply({ components: [container], flags: MessageFlags.IsComponentsV2 });
      } catch (error) {
        const container = V2.container(0x2B2D31, [
          V2.text('### Urban Dictionary Error'),
          V2.separator(),
          V2.text('Failed to fetch definition. Please try again later.')
        ]);
        await interaction.editReply({ components: [container], flags: MessageFlags.IsComponentsV2 });
      }
    }
  },
  {
    name: 'size',
    description: 'Measure someone\'s size',
    options: [{ type: 'user', name: 'user', description: 'The user to measure (defaults to yourself)', required: false }],
    async execute(interaction) {
      const target = interaction.options.getUser('user') || interaction.user;
      const size = parseInt(target.id.slice(-8), 16) % 15 + 1;
      const representation = '8' + '='.repeat(size) + 'D';

      const container = V2.container(0x2B2D31, [
        V2.text('### Size Measurement'),
        V2.separator(),
        V2.text(`**${target.username}'s size:** ${representation}`)
      ]);

      await V2.reply(interaction, container);
    }
  },
  {
    name: 'matrix',
    description: 'Generate a dot matrix image of a user or image',
    options: [
      { type: 'user', name: 'user', description: 'The user to matrix', required: false },
      { type: 'string', name: 'url', description: 'Image URL to matrix', required: false }
    ],
    async execute(interaction) {
      await interaction.deferReply();

      const container = V2.container(0xED4245, [
        V2.text('### Matrix Generation'),
        V2.separator(),
        V2.text('Matrix generation requires canvas library. Coming soon.')
      ]);

      await interaction.editReply({ components: [container], flags: MessageFlags.IsComponentsV2 });
    }
  }
];

module.exports = { miscSlashCmds };
