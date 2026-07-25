const {
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  SectionBuilder,
  ThumbnailBuilder,
  MessageFlags
} = require('discord.js');

const BRAND_COLOR = '#B8A9C9';
const COLORS = {
  success: '#57F287',
  error: '#ED4245',
  warning: '#FEE75C',
  info: BRAND_COLOR
};

const V2 = {
  FLAG: MessageFlags.IsComponentsV2,

  config: {
    brand_color: parseInt(BRAND_COLOR.replace('#', ''), 16)
  },

  text(content) {
    return new TextDisplayBuilder().setContent(content);
  },

  separator(spacing = SeparatorSpacingSize.Small) {
    return new SeparatorBuilder().setDivider(true).setSpacing(spacing);
  },

  container(color, components) {
    const c = new ContainerBuilder();
    if (color) {
      c.setAccentColor(typeof color === 'string' ? parseInt(color.replace('#', ''), 16) : color);
    }
    for (const comp of components) {
      if (comp instanceof TextDisplayBuilder) c.addTextDisplayComponents(comp);
      else if (comp instanceof SeparatorBuilder) c.addSeparatorComponents(comp);
      else if (comp instanceof SectionBuilder) c.addSectionComponents(comp);
    }
    return c;
  },

  section(textParts, accessory) {
    const s = new SectionBuilder();
    const texts = Array.isArray(textParts) ? textParts : [textParts];
    for (const t of texts) {
      if (typeof t === 'string') s.addTextDisplayComponents(new TextDisplayBuilder().setContent(t));
      else if (t instanceof TextDisplayBuilder) s.addTextDisplayComponents(t);
    }
    if (accessory) {
      if (accessory._type === 'thumbnail') s.setThumbnailAccessory(accessory);
      else if (accessory._type === 'button') s.setButtonAccessory(accessory);
    }
    return s;
  },

  thumbnail(url) {
    const t = new ThumbnailBuilder({ media: { url } });
    t._type = 'thumbnail';
    return t;
  },

  success(text) {
    return V2.container(COLORS.success, [V2.text(text)]);
  },

  error(text) {
    return V2.container(COLORS.error, [V2.text(text)]);
  },

  info(text) {
    return V2.container(COLORS.info, [V2.text(text)]);
  },

  async reply(interaction, component, ephemeral = false) {
    const components = Array.isArray(component) ? component : [component];
    const flags = ephemeral ? V2.FLAG | 64 : V2.FLAG;
    const opts = { components, flags };
    if (interaction.replied || interaction.deferred) {
      return interaction.followUp(opts);
    }
    return interaction.reply(opts);
  },

  isOwner(userId, runtime) {
    const ownerId = runtime.getPluginConfig ? runtime.getPluginConfig('spinning_core')?.owner_id : null;
    if (ownerId && userId === ownerId) return true;
    return false;
  },

  hasAdminOrOwner(member, runtime) {
    if (member.permissions.has('Administrator')) return true;
    return V2.isOwner(member.id, runtime);
  }
};

module.exports = { V2, COLORS, BRAND_COLOR };
