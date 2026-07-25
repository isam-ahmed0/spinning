const { V2 } = require('../../spinning_core/lib/ui');
const { Database, Table } = require('../../../lib/db');
const emojis = require('../../../emojis.json');

const db = new Database();
const todosTable = new Table(db, 'todos');

const todoSlashCmds = [
  {
    name: 'todo',
    description: 'Manage your todo list',
    options: [
      { type: 'string', name: 'action', description: 'add, list, remove, or clear', required: true },
      { type: 'string', name: 'item', description: 'Todo item (for add)', required: false },
      { type: 'integer', name: 'id', description: 'Item number (for remove)', required: false }
    ],
    async execute(interaction) {
      const action = interaction.options.getString('action');
      const item = interaction.options.getString('item');
      const id = interaction.options.getInteger('id');

      if (action === 'add') {
        if (!item) return V2.reply(interaction, V2.error('Provide a todo item.'), true);
        todosTable.insert({
          userId: interaction.user.id,
          guildId: interaction.guildId,
          text: item,
          done: false,
          createdAt: Date.now()
        });
        await V2.reply(interaction, V2.success(`Added: **${item}**`), true);
      }

      else if (action === 'list') {
        const todos = todosTable.find({ userId: interaction.user.id, guildId: interaction.guildId });
        if (todos.length === 0) {
          return V2.reply(interaction, V2.info('No todos yet.'), true);
        }
        const list = todos.map((t, i) =>
          `${emojis.dots} **${i + 1}.** ${t.done ? '~~' : ''}${t.text}${t.done ? '~~' : ''}`
        ).join('\n');
        const container = V2.container(V2.config.brand_color, [
          V2.text(`${emojis.clipboard} **Your Todos (${todos.length})**`),
          V2.separator(),
          V2.text(list)
        ]);
        await V2.reply(interaction, container, true);
      }

      else if (action === 'remove') {
        if (!id) return V2.reply(interaction, V2.error('Provide an item number.'), true);
        const todos = todosTable.find({ userId: interaction.user.id, guildId: interaction.guildId });
        const idx = id - 1;
        if (idx < 0 || idx >= todos.length) {
          return V2.reply(interaction, V2.error('Invalid item number.'), true);
        }
        todosTable.delete({ _id: todos[idx]._id });
        await V2.reply(interaction, V2.success(`Removed: **${todos[idx].text}**`), true);
      }

      else if (action === 'clear') {
        const count = todosTable.delete({ userId: interaction.user.id, guildId: interaction.guildId });
        await V2.reply(interaction, V2.success(`Cleared ${count} todo(s).`), true);
      }
    }
  }
];

module.exports = { todoSlashCmds };
