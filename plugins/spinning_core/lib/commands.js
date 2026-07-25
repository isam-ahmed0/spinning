const { V2 } = require('./ui');

function buildHelp(runtime) {
  const allCmds = runtime.getAllCommands ? runtime.getAllCommands() : [];
  const plugins = {};

  for (const [name, cmd] of Object.entries(allCmds)) {
    if (!cmd.slash) continue;
    const plugin = cmd._plugin || 'unknown';
    if (!plugins[plugin]) plugins[plugin] = [];
    plugins[plugin].push({ name, description: cmd.description || 'No description' });
  }

  const pluginLabels = {
    spinning_core: 'Core',
    spinning_server: 'Server',
    spinning_engage: 'Engage',
    spinning_ai: 'AI',
    spinning_ticket: 'Tickets',
    spinning_giveaway: 'Giveaway',
    spinning_profile: 'Profile',
    spinning_automation: 'Automation'
  };

  const components = [
    V2.text('## Commands'),
    V2.separator()
  ];

  for (const [pluginId, cmds] of Object.entries(plugins)) {
    const label = pluginLabels[pluginId] || pluginId;
    const cmdList = cmds.map(c => `\`/${c.name}\` — ${c.description}`).join('\n');
    components.push(V2.text(`### ${label}`));
    components.push(V2.text(cmdList));
    components.push(V2.separator());
  }

  components.push(V2.text('*All commands are slash commands. Type \`/command\` to use them.*'));

  return V2.container(V2.config.brand_color, components);
}

module.exports = { buildHelp };
