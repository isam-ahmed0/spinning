const { V2 } = require('../../spinning_core/lib/ui');
const emojis = require('../../../emojis.json');

const ROLEPLAY_ACTIONS = {
  hug: { icon: emojis.hug, text: 'hugs' },
  kiss: { icon: emojis.kiss, text: 'kisses' },
  slap: { icon: emojis.slap, text: 'slaps' },
  pat: { icon: emojis.pat, text: 'pats' },
  tickle: { icon: emojis.tickle, text: 'tickles' },
  poke: { icon: emojis.poke, text: 'pokes' },
  lick: { icon: emojis.lick || '👅', text: 'licks' },
  cry: { icon: emojis.cry, text: 'cries' },
  dance: { icon: emojis.dance, text: 'dances with' },
  wave: { icon: emojis.wave, text: 'waves at' },
  smile: { icon: emojis.smile, text: 'smiles at' },
  blush: { icon: emojis.blush, text: 'blushes at' },
  shrug: { icon: emojis.shrug, text: 'shrugs at' },
  facepalm: { icon: emojis.facepalm, text: 'facepalms at' }
};

const roleplaySlashCmds = Object.entries(ROLEPLAY_ACTIONS).map(([name, action]) => ({
  name,
  description: `${action.text} someone`,
  options: [{ type: 'user', name: 'user', description: 'Target user', required: true }],
  async execute(interaction) {
    const user = interaction.options.getUser('user');
    if (user.id === interaction.user.id) {
      return V2.reply(interaction, V2.info(`You ${action.text} yourself... ?`), true);
    }

    const container = V2.container(V2.config.brand_color, [
      V2.section(
        [V2.text(`**${interaction.user.username}** ${action.text} **${user.username}**! ${action.icon}`)],
        V2.thumbnail(interaction.user.displayAvatarURL({ extension: 'png', size: 256 }))
      )
    ]);

    const row = V2.buttonRow(
      V2.button('Secondary', `${action.icon} Back!`, `${name}_back_${interaction.user.id}_${user.id}`)
    );

    await V2.reply(interaction, { components: [container, row] });
  }
}));

module.exports = { roleplaySlashCmds };
