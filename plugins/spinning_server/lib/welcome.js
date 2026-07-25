const { V2 } = require('../../spinning_core/lib/ui');
const { Database, Table } = require('../../../lib/db');

const db = new Database();
const welcomeTable = new Table(db, 'welcome');

function replacePlaceholders(text, member) {
  if (!text) return text;
  const joinDate = member.joinedAt;
  const createDate = member.user.createdAt;
  const formatDate = (date) => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    return `${days[date.getDay()]}, ${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
  };

  return text
    .replace(/\{mention\}/g, `<@${member.id}>`)
    .replace(/\{avatar\}/g, member.user.displayAvatarURL({ dynamic: true, size: 256 }))
    .replace(/\{user\}/g, member.user.username)
    .replace(/\{user_nick\}/g, member.displayName || member.user.username)
    .replace(/\{joindate\}/g, formatDate(joinDate))
    .replace(/\{user_createdate\}/g, formatDate(createDate))
    .replace(/\{server\}/g, member.guild.name)
    .replace(/\{count\}/g, member.guild.memberCount.toString())
    .replace(/\{server_icon\}/g, member.guild.iconURL({ dynamic: true, size: 256 }) || '');
}

function getWelcomeConfig(guildId) {
  return welcomeTable.findOne({ guildId }) || { guildId, type: 'simple', enabled: false };
}

async function sendWelcome(member, runtime, testChannel = null) {
  const config = getWelcomeConfig(member.guild.id);
  if (!config.enabled) return;

  const channelId = testChannel?.id || config.channelId;
  if (!channelId) return;

  const channel = testChannel || member.guild.channels.cache.get(channelId);
  if (!channel) return;

  if (config.type === 'simple') {
    const msg = replacePlaceholders(config.message || 'Welcome to **{server}**, {mention}!', member);
    await channel.send({ content: msg }).catch(() => {});
  } else {
    const container = V2.container(config.color || V2.config.brand_color, [
      V2.text(`### ${replacePlaceholders(config.title || 'Welcome', member)}`),
      V2.separator(),
      V2.text(replacePlaceholders(config.description || `Welcome to ${member.guild.name}!`, member))
    ]);

    if (config.thumbnailUrl) {
      const thumbUrl = replacePlaceholders(config.thumbnailUrl, member);
      container[0].components[1] = V2.section(
        [V2.text(replacePlaceholders(config.description || `Welcome to ${member.guild.name}!`, member))],
        V2.thumbnail(thumbUrl)
      );
    }

    if (config.imageUrl) {
      container.push(V2.separator());
      container.push(V2.media([replacePlaceholders(config.imageUrl, member)]));
    }

    await channel.send({ components: container, flags: V2.FLAG }).catch(() => {});
  }
}

async function sendGoodbye(member, runtime) {
  const config = getWelcomeConfig(member.guild.id);
  if (!config.goodbyeEnabled) return;

  const channelId = config.goodbyeChannelId;
  if (!channelId) return;

  const channel = member.guild.channels.cache.get(channelId);
  if (!channel) return;

  if (config.goodbyeType === 'simple') {
    const msg = replacePlaceholders(config.goodbyeMessage || `Goodbye **{user}**, we'll miss you!`, member);
    await channel.send({ content: msg }).catch(() => {});
  } else {
    const container = V2.container(config.goodbyeColor || V2.config.brand_color, [
      V2.text(`### ${replacePlaceholders(config.goodbyeTitle || 'Goodbye', member)}`),
      V2.separator(),
      V2.text(replacePlaceholders(config.goodbyeDescription || `Goodbye ${member.user.username}, we'll miss you!`, member))
    ]);

    if (config.goodbyeImageUrl) {
      container.push(V2.separator());
      container.push(V2.media([replacePlaceholders(config.goodbyeImageUrl, member)]));
    }

    await channel.send({ components: container, flags: V2.FLAG }).catch(() => {});
  }
}

module.exports = { sendWelcome, sendGoodbye, getWelcomeConfig, welcomeTable, replacePlaceholders };
