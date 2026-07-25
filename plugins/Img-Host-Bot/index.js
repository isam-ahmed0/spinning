const { V2 } = require('../spinning_core/lib/ui');
const { uploadImage, fetchAsBase64 } = require('./src/imgbb');
const {
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require('discord.js');

const MAX_FILE_SIZE = 32 * 1024 * 1024;
const NAME_REGEX = /^[\w.\-]+$/;
const EXPIRATION_MIN = 60;
const EXPIRATION_MAX = 15552000;

const COLORS = {
  container: 0x26272F,
  danger: 0xed4245,
};

function successContainer(data) {
  const sizeBytes = Number(data.size) || 0;
  const sizeKb = (sizeBytes / 1024).toFixed(2);
  const sizeMb = (sizeBytes / (1024 * 1024)).toFixed(2);
  const sizeText = sizeBytes > 1024 * 1024 ? `${sizeMb} MB` : `${sizeKb} KB`;

  const filename = data.image?.filename || data.title || 'uploaded image';
  const mime = data.image?.mime || 'image';
  const dims = data.width && data.height ? `${data.width}x${data.height}` : 'unknown';

  return new ContainerBuilder()
    .setAccentColor(COLORS.container)
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        '## Details\n' +
          `Filename: \`${filename}\`\n` +
          `Type: \`${mime}\`\n` +
          `Size: ${sizeText}\n` +
          `Dimensions: ${dims}`
      )
    )
    .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small))
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(`## Direct URL\n${data.url}`)
    )
    .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small))
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(`## Viewer URL\n${data.url_viewer}`)
    )
    .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small))
    .addActionRowComponents(
      new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setLabel('Open Direct')
          .setStyle(ButtonStyle.Link)
          .setURL(data.url),
        new ButtonBuilder()
          .setLabel('Open Viewer')
          .setStyle(ButtonStyle.Link)
          .setURL(data.url_viewer),
        new ButtonBuilder()
          .setLabel('Open Thumbnail')
          .setStyle(ButtonStyle.Link)
          .setURL(data.thumb?.url || data.url)
      )
    );
}

function validateUploadOptions({ attachment, customName, expiration }) {
  if (!attachment) {
    return { title: 'Missing Image', message: 'Please attach an image to upload.' };
  }

  const contentType = attachment.contentType || '';
  if (!contentType.startsWith('image/')) {
    return {
      title: 'Invalid File',
      message: `\`${attachment.name}\` is not an image (got \`${contentType || 'unknown'}\`).`,
    };
  }

  if (attachment.size > MAX_FILE_SIZE) {
    const sizeMB = (attachment.size / 1024 / 1024).toFixed(2);
    return {
      title: 'File Too Large',
      message: `Maximum size is **32 MB**. Yours is **${sizeMB} MB**.`,
    };
  }

  if (expiration !== null && (expiration < EXPIRATION_MIN || expiration > EXPIRATION_MAX)) {
    return {
      title: 'Invalid Expiration',
      message: `\`expiration\` must be between **${EXPIRATION_MIN}** and **${EXPIRATION_MAX}** seconds.`,
    };
  }

  if (customName !== null && !NAME_REGEX.test(customName)) {
    return {
      title: 'Invalid Name',
      message: '`name` may only contain letters, digits, underscore, dot, and dash.',
    };
  }

  return null;
}

const uploadSlashCmd = {
  name: 'upload',
  description: 'Upload an image to imgbb and receive its hosted URL (owner only).',
  options: [
    { type: 'string', name: 'image_url', description: 'URL of the image to upload', required: true },
    { type: 'string', name: 'name', description: 'Custom filename for the upload', required: false },
    { type: 'integer', name: 'expiration', description: 'Auto-delete after seconds (60-15552000)', required: false },
  ],
  async execute(interaction, runtime) {
    if (!V2.isOwner(interaction.member, runtime)) {
      return V2.reply(interaction, V2.error('Only the bot owner can use this command.'), true);
    }

    const imgbbKey = runtime.config?.imgbb_api_key;
    if (!imgbbKey) {
      return V2.reply(interaction, V2.error('imgbb API key is not configured.'), true);
    }

    const imageUrl = interaction.options.getString('image_url');
    const customName = interaction.options.getString('name');
    const expiration = interaction.options.getInteger('expiration');

    if (customName !== null && !NAME_REGEX.test(customName)) {
      return V2.reply(interaction, V2.error('`name` may only contain letters, digits, underscore, dot, and dash.'), true);
    }

    if (expiration !== null && (expiration < EXPIRATION_MIN || expiration > EXPIRATION_MAX)) {
      return V2.reply(interaction, V2.error(`\`expiration\` must be between **${EXPIRATION_MIN}** and **${EXPIRATION_MAX}** seconds.`), true);
    }

    await interaction.deferReply({ flags: require('discord.js').MessageFlags.IsComponentsV2 });

    try {
      const base64 = await fetchAsBase64(imageUrl);
      const data = await uploadImage({
        apiKey: imgbbKey,
        base64,
        name: customName || undefined,
        expiration: expiration ?? undefined,
      });

      await interaction.editReply({
        components: [successContainer(data)],
        flags: require('discord.js').MessageFlags.IsComponentsV2,
      });
    } catch (err) {
      console.error('[spinning_imghost] Upload error:', err.message);
      await interaction.editReply({
        components: [V2.error(`Upload failed: ${err.message}`)],
        flags: require('discord.js').MessageFlags.IsComponentsV2,
      });
    }
  }
};

const imghostSlashCmds = [uploadSlashCmd];

module.exports = {
  api: {
    slashCommands: imghostSlashCmds,
  },

  async init(config, runtime) {
    const coreApi = runtime.getPluginAPI?.('spinning_core');
    if (coreApi?.registerSlashCommand) {
      for (const cmd of imghostSlashCmds) {
        coreApi.registerSlashCommand(cmd);
      }
    }
  },

  hooks: {
    interaction_received: async (payload, runtime) => {
      const { interaction } = payload;
      if (!interaction.isChatInputCommand()) return;
      const cmd = imghostSlashCmds.find(c => c.name === interaction.commandName);
      if (!cmd) return;
      try {
        await cmd.execute(interaction, runtime);
      } catch (e) {
        console.error(`[spinning_imghost] Error /${interaction.commandName}:`, e.message);
        const errReply = V2.error(`Error: ${e.message}`);
        try {
          if (interaction.replied || interaction.deferred) {
            await interaction.followUp({ components: [errReply], flags: V2.FLAG });
          } else {
            await interaction.reply({ components: [errReply], flags: V2.FLAG });
          }
        } catch {}
      }
    }
  }
};
