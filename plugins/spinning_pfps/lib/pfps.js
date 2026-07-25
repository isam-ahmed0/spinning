const { V2 } = require('../../spinning_core/lib/ui');
const { MessageFlags } = require('discord.js');
const { createPaginationSession } = require('../../../lib/pagination');

const pfpsSlashCmds = [
  {
    name: 'anime',
    description: 'Get a random anime profile picture',
    async execute(interaction) {
      await interaction.deferReply();

      try {
        const res = await fetch('https://api.waifu.pics/sfw/waifu');
        const data = await res.json();

        if (!data || !data.url) {
          const container = V2.container(0x2B2D31, [
            V2.text('### Anime PFP Error'),
            V2.separator(),
            V2.text('Could not fetch an anime profile picture. Please try again later.')
          ]);
          return await interaction.editReply({ components: [container], flags: MessageFlags.IsComponentsV2 });
        }

        const session = createPaginationSession({
          interactionOrMessage: interaction,
          pages: [data.url],
          userId: interaction.user.id,
          renderPage: async (index, url) => {
            return V2.container(0x2B2D31, [
              V2.text('### Random Anime PFP'),
              V2.separator(),
              V2.mediaGallery(url)
            ]);
          }
        });

        await session.renderInitial();
      } catch (error) {
        const container = V2.container(0x2B2D31, [
          V2.text('### Anime PFP Error'),
          V2.separator(),
          V2.text('Failed to fetch an anime profile picture. Please try again later.')
        ]);
        await interaction.editReply({ components: [container], flags: MessageFlags.IsComponentsV2 });
      }
    }
  },
  {
    name: 'female',
    description: 'Get a random female profile picture',
    async execute(interaction) {
      await interaction.deferReply();

      try {
        const res = await fetch('https://api.waifu.pics/sfw/waifu');
        const data = await res.json();

        if (!data || !data.url) {
          const container = V2.container(0x2B2D31, [
            V2.text('### Female PFP Error'),
            V2.separator(),
            V2.text('Could not fetch a female profile picture. Please try again later.')
          ]);
          return await interaction.editReply({ components: [container], flags: MessageFlags.IsComponentsV2 });
        }

        const session = createPaginationSession({
          interactionOrMessage: interaction,
          pages: [data.url],
          userId: interaction.user.id,
          renderPage: async (index, url) => {
            return V2.container(0x2B2D31, [
              V2.text('### Random Female PFP'),
              V2.separator(),
              V2.mediaGallery(url)
            ]);
          }
        });

        await session.renderInitial();
      } catch (error) {
        const container = V2.container(0x2B2D31, [
          V2.text('### Female PFP Error'),
          V2.separator(),
          V2.text('Failed to fetch a female profile picture. Please try again later.')
        ]);
        await interaction.editReply({ components: [container], flags: MessageFlags.IsComponentsV2 });
      }
    }
  },
  {
    name: 'male',
    description: 'Get a random male profile picture',
    async execute(interaction) {
      await interaction.deferReply();

      try {
        const res = await fetch('https://random.dukeduck.net/gif/male');
        const imageUrl = res.url;

        if (!imageUrl) {
          const container = V2.container(0x2B2D31, [
            V2.text('### Male PFP Error'),
            V2.separator(),
            V2.text('Could not fetch a male profile picture. Please try again later.')
          ]);
          return await interaction.editReply({ components: [container], flags: MessageFlags.IsComponentsV2 });
        }

        const session = createPaginationSession({
          interactionOrMessage: interaction,
          pages: [imageUrl],
          userId: interaction.user.id,
          renderPage: async (index, url) => {
            return V2.container(0x2B2D31, [
              V2.text('### Random Male PFP'),
              V2.separator(),
              V2.mediaGallery(url)
            ]);
          }
        });

        await session.renderInitial();
      } catch (error) {
        const container = V2.container(0x2B2D31, [
          V2.text('### Male PFP Error'),
          V2.separator(),
          V2.text('Failed to fetch a male profile picture. Please try again later.')
        ]);
        await interaction.editReply({ components: [container], flags: MessageFlags.IsComponentsV2 });
      }
    }
  }
];

module.exports = { pfpsSlashCmds };
