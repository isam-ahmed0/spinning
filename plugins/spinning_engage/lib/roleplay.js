const { V2 } = require('../../spinning_core/lib/ui');
const { getNekoGif, hasNekoEndpoint } = require('./nekoHelper');
const { getRandomTenorGif } = require('./gifHelper');

const roleplayActions = {
  hug: {
    title: 'Hug Time',
    nekoAction: 'hug',
    tenorSearch: 'anime hug',
    message: (actor, target) => `**${actor.username}** gives **${target.username}** a warm hug`,
    buttonLabel: 'Hug Back',
    buttonStyle: 'Primary',
    targeted: true
  },
  pat: {
    title: 'Pat Pat',
    nekoAction: 'pat',
    tenorSearch: 'anime pat head',
    message: (actor, target) => `**${actor.username}** pats **${target.username}** on the head`,
    buttonLabel: 'Pat Back',
    buttonStyle: 'Primary',
    targeted: true
  },
  kiss: {
    title: 'Kiss',
    nekoAction: 'kiss',
    tenorSearch: 'anime kiss',
    message: (actor, target) => `**${actor.username}** kisses **${target.username}**`,
    buttonLabel: 'Kiss Back',
    buttonStyle: 'Danger',
    targeted: true
  },
  slap: {
    title: 'Slap',
    nekoAction: 'slap',
    tenorSearch: 'anime slap',
    message: (actor, target) => `**${actor.username}** slaps **${target.username}**`,
    buttonLabel: 'Slap Back',
    buttonStyle: 'Danger',
    targeted: true
  },
  poke: {
    title: 'Poke',
    nekoAction: 'poke',
    tenorSearch: 'anime poke',
    message: (actor, target) => `**${actor.username}** pokes **${target.username}**`,
    buttonLabel: 'Poke Back',
    buttonStyle: 'Primary',
    targeted: true
  },
  tickle: {
    title: 'Tickle Attack',
    nekoAction: 'tickle',
    tenorSearch: 'anime tickle',
    message: (actor, target) => `**${actor.username}** tickles **${target.username}**`,
    buttonLabel: 'Tickle Back',
    buttonStyle: 'Primary',
    targeted: true
  },
  kill: {
    title: 'Kill Action',
    nekoAction: null,
    tenorSearch: 'anime kill',
    message: (actor, target) => `**${actor.username}** eliminates **${target.username}**`,
    buttonLabel: 'Fight Back',
    buttonStyle: 'Danger',
    targeted: true
  },
  lick: {
    title: 'Lick',
    nekoAction: null,
    tenorSearch: 'anime lick',
    message: (actor, target) => `**${actor.username}** licks **${target.username}**`,
    buttonLabel: 'Lick Back',
    buttonStyle: 'Primary',
    targeted: true
  },
  deathstare: {
    title: 'Death Stare',
    nekoAction: 'deathstare',
    tenorSearch: 'anime death stare',
    message: (actor, target) => `**${actor.username}** gives **${target.username}** a deadly stare`,
    buttonLabel: 'Stare Back',
    buttonStyle: 'Danger',
    targeted: true
  },
  dance: {
    title: 'Dance Time',
    nekoAction: 'dance',
    tenorSearch: 'anime dance',
    message: (user) => `**${user.username}** is dancing!`,
    targeted: false
  },
  cry: {
    title: 'Crying',
    nekoAction: 'cry',
    tenorSearch: 'anime cry',
    message: (user) => `**${user.username}** is crying`,
    targeted: false
  },
  laugh: {
    title: 'Laughing',
    nekoAction: 'laugh',
    tenorSearch: 'anime laugh',
    message: (user) => `**${user.username}** is laughing`,
    targeted: false
  },
  smile: {
    title: 'Smiling',
    nekoAction: 'smile',
    tenorSearch: 'anime smile',
    message: (user) => `**${user.username}** is smiling`,
    targeted: false
  },
  blush: {
    title: 'Blushing',
    nekoAction: 'blush',
    tenorSearch: 'anime blush',
    message: (user) => `**${user.username}** is blushing`,
    targeted: false
  },
  wink: {
    title: 'Winking',
    nekoAction: 'wink',
    tenorSearch: 'anime wink',
    message: (user) => `**${user.username}** is winking`,
    targeted: false
  },
  thumbsup: {
    title: 'Thumbs Up',
    nekoAction: 'thumbsup',
    tenorSearch: 'anime thumbs up',
    message: (user) => `**${user.username}** gives a thumbs up`,
    targeted: false
  },
  clap: {
    title: 'Clapping',
    nekoAction: null,
    tenorSearch: 'anime clap',
    message: (user) => `**${user.username}** is clapping`,
    targeted: false
  },
  bow: {
    title: 'Bowing',
    nekoAction: null,
    tenorSearch: 'anime bow',
    message: (user) => `**${user.username}** takes a bow`,
    targeted: false
  },
  salute: {
    title: 'Salute',
    nekoAction: null,
    tenorSearch: 'anime salute',
    message: (user) => `**${user.username}** salutes!`,
    targeted: false
  },
  facepalm: {
    title: 'Facepalm',
    nekoAction: 'facepalm',
    tenorSearch: 'anime facepalm',
    message: (user) => `**${user.username}** facepalms`,
    targeted: false
  },
  shrug: {
    title: 'Shrugging',
    nekoAction: 'shrug',
    tenorSearch: 'anime shrug',
    message: (user) => `**${user.username}** shrugs`,
    targeted: false
  },
  sleep: {
    title: 'Sleeping',
    nekoAction: 'sleep',
    tenorSearch: 'anime sleep',
    message: (user) => `**${user.username}** is sleeping`,
    targeted: false
  },
  eat: {
    title: 'Eating',
    nekoAction: 'eat',
    tenorSearch: 'anime eat',
    message: (user) => `**${user.username}** is eating`,
    targeted: false
  },
  run: {
    title: 'Running',
    nekoAction: 'run',
    tenorSearch: 'anime run',
    message: (user) => `**${user.username}** runs away`,
    targeted: false
  }
};

async function buildRoleplayResponse(action, actor, target, includeButton = true) {
  const actionConfig = roleplayActions[action];
  if (!actionConfig) return null;

  try {
    let gifUrl;
    if (actionConfig.nekoAction && hasNekoEndpoint(actionConfig.nekoAction)) {
      gifUrl = await getNekoGif(actionConfig.nekoAction);
    } else {
      gifUrl = await getRandomTenorGif(actionConfig.tenorSearch);
    }

    const { ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, SeparatorSpacingSize, MediaGalleryBuilder, MediaGalleryItemBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');

    const container = new ContainerBuilder().setAccentColor(0x2B2D31)
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`# ${actionConfig.title}`)
      )
      .addSeparatorComponents(
        new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
      );

    if (gifUrl) {
      container.addMediaGalleryComponents(
        new MediaGalleryBuilder().addItems([
          new MediaGalleryItemBuilder().setURL(gifUrl)
        ])
      );
    }

    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(actionConfig.message(actor, target))
    );

    container.addSeparatorComponents(
      new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
    );

    if (includeButton && actionConfig.targeted) {
      const styleMap = { Primary: ButtonStyle.Primary, Danger: ButtonStyle.Danger, Secondary: ButtonStyle.Secondary };
      const respondButton = new ButtonBuilder()
        .setCustomId(`${action}_back_${actor.id}_${target.id}`)
        .setLabel(actionConfig.buttonLabel)
        .setStyle(styleMap[actionConfig.buttonStyle] || ButtonStyle.Primary);

      const buttonRow = new ActionRowBuilder().addComponents(respondButton);
      container.addActionRowComponents(buttonRow);
    }

    return container;
  } catch (error) {
    console.error(`[roleplay] Error building response for ${action}:`, error);
    return null;
  }
}

const roleplaySlashCmds = Object.entries(roleplayActions).map(([name, action]) => ({
  name,
  description: action.targeted ? `${action.buttonLabel.replace(' Back', '').toLowerCase()} someone` : action.title.toLowerCase(),
  options: action.targeted
    ? [{ type: 'user', name: 'user', description: 'Target user', required: true }]
    : [],
  async execute(interaction) {
    if (action.targeted) {
      const user = interaction.options.getUser('user');
      if (user.id === interaction.user.id) {
        return V2.reply(interaction, V2.info(`You can't ${name} yourself!`), true);
      }
    }

    await interaction.deferReply({ flags: require('discord.js').MessageFlags.IsPersistent | require('discord.js').MessageFlags.IsComponentsV2 });

    const target = action.targeted ? interaction.options.getUser('user') : interaction.user;
    const container = await buildRoleplayResponse(name, interaction.user, target, true);

    if (container) {
      await interaction.editReply({ components: [container], flags: require('discord.js').MessageFlags.IsPersistent | require('discord.js').MessageFlags.IsComponentsV2 });
    } else {
      await interaction.editReply({ content: 'Failed to fetch GIF. Please try again later!' });
    }
  }
}));

module.exports = { roleplaySlashCmds, roleplayActions, buildRoleplayResponse };
