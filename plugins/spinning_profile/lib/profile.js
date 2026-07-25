const { V2 } = require('../../spinning_core/lib/ui');
const { Database, Table } = require('../../../lib/db');
const emojis = require('../../../emojis.json');

const db = new Database();
const profilesTable = new Table(db, 'profiles');

function getProfile(userId) {
  return profilesTable.findOne({ userId }) || {
    userId,
    bio: '',
    background: '',
    socials: {}
  };
}

const profileSlashCmds = [
  {
    name: 'profile',
    description: 'Profile commands',
    options: [
      { type: 'string', name: 'action', description: 'card, bio, bg, social, or reset', required: true },
      { type: 'string', name: 'value', description: 'Value for the action', required: false }
    ],
    async execute(interaction, runtime) {
      const action = interaction.options.getString('action');
      const value = interaction.options.getString('value');
      const user = interaction.user;
      const profile = getProfile(user.id);

      if (action === 'card') {
        const target = interaction.options.getUser('user') || user;
        const targetProfile = getProfile(target.id);

        const socials = Object.entries(targetProfile.socials || {})
          .map(([platform, handle]) => `${emojis[platform] || '🔗'} **${platform}:** ${handle}`)
          .join('\n');

        const container = V2.container(V2.config.brand_color, [
          V2.section(
            [
              V2.text(`${emojis.crown} **${target.username}'s Profile**`),
              V2.separator(),
              V2.text(targetProfile.bio || '*No bio set*'),
              socials ? V2.separator() : V2.text(''),
              socials ? V2.text(socials) : V2.text('')
            ],
            V2.thumbnail(target.displayAvatarURL({ extension: 'png', size: 256 }))
          )
        ]);

        await V2.reply(interaction, container, true);
      }

      else if (action === 'bio') {
        if (!value) return V2.reply(interaction, V2.error('Provide a bio.'), true);
        profile.bio = value.slice(0, 200);
        profilesTable.upsert({ userId: user.id }, profile);
        await V2.reply(interaction, V2.success(`Bio updated: ${profile.bio}`), true);
      }

      else if (action === 'bg') {
        if (!value) return V2.reply(interaction, V2.error('Provide an image URL.'), true);
        profile.background = value;
        profilesTable.upsert({ userId: user.id }, profile);
        await V2.reply(interaction, V2.success('Background updated.'), true);
      }

      else if (action === 'social') {
        if (!value) return V2.reply(interaction, V2.error('Provide platform and handle (e.g. twitter @username).'), true);
        const parts = value.split(' ');
        const platform = parts[0].toLowerCase();
        const handle = parts.slice(1).join(' ');
        if (!platform || !handle) return V2.reply(interaction, V2.error('Format: /profile social <platform> <handle>'), true);

        if (!profile.socials) profile.socials = {};
        profile.socials[platform] = handle;
        profilesTable.upsert({ userId: user.id }, profile);
        await V2.reply(interaction, V2.success(`${platform} set to **${handle}**.`), true);
      }

      else if (action === 'reset') {
        profilesTable.delete({ userId: user.id });
        await V2.reply(interaction, V2.success('Profile reset.'), true);
      }
    }
  }
];

module.exports = { profileSlashCmds, profilesTable, getProfile };
