const { V2 } = require('../../spinning_core/lib/ui');

const voiceSlashCmds = [
  {
    name: 'vc-mute',
    description: 'Mute a user in voice',
    options: [{ type: 'user', name: 'user', description: 'User to mute', required: true }],
    async execute(interaction, runtime) {
      if (!V2.hasAdminOrOwner(interaction.member, runtime)) {
        return V2.reply(interaction, V2.error('You need Administrator permission.'), true);
      }
      const user = interaction.options.getUser('user');
      const member = await interaction.guild.members.fetch(user.id).catch(() => null);
      if (!member) return V2.reply(interaction, V2.error('User not found.'), true);
      if (!member.voice.channel) return V2.reply(interaction, V2.error('User not in voice.'), true);
      await member.voice.setMute(true, `By ${interaction.user.tag}`);
      await V2.reply(interaction, V2.success(`Muted <@${user.id}> in voice.`));
    }
  },
  {
    name: 'vc-unmute',
    description: 'Unmute a user in voice',
    options: [{ type: 'user', name: 'user', description: 'User to unmute', required: true }],
    async execute(interaction, runtime) {
      if (!V2.hasAdminOrOwner(interaction.member, runtime)) {
        return V2.reply(interaction, V2.error('You need Administrator permission.'), true);
      }
      const user = interaction.options.getUser('user');
      const member = await interaction.guild.members.fetch(user.id).catch(() => null);
      if (!member) return V2.reply(interaction, V2.error('User not found.'), true);
      await member.voice.setMute(false, `By ${interaction.user.tag}`);
      await V2.reply(interaction, V2.success(`Unmuted <@${user.id}> in voice.`));
    }
  },
  {
    name: 'vc-deafen',
    description: 'Deafen a user in voice',
    options: [{ type: 'user', name: 'user', description: 'User to deafen', required: true }],
    async execute(interaction, runtime) {
      if (!V2.hasAdminOrOwner(interaction.member, runtime)) {
        return V2.reply(interaction, V2.error('You need Administrator permission.'), true);
      }
      const user = interaction.options.getUser('user');
      const member = await interaction.guild.members.fetch(user.id).catch(() => null);
      if (!member) return V2.reply(interaction, V2.error('User not found.'), true);
      if (!member.voice.channel) return V2.reply(interaction, V2.error('User not in voice.'), true);
      await member.voice.setDeaf(true, `By ${interaction.user.tag}`);
      await V2.reply(interaction, V2.success(`Deafened <@${user.id}> in voice.`));
    }
  },
  {
    name: 'vc-undeafen',
    description: 'Undeafen a user in voice',
    options: [{ type: 'user', name: 'user', description: 'User to undeafen', required: true }],
    async execute(interaction, runtime) {
      if (!V2.hasAdminOrOwner(interaction.member, runtime)) {
        return V2.reply(interaction, V2.error('You need Administrator permission.'), true);
      }
      const user = interaction.options.getUser('user');
      const member = await interaction.guild.members.fetch(user.id).catch(() => null);
      if (!member) return V2.reply(interaction, V2.error('User not found.'), true);
      await member.voice.setDeaf(false, `By ${interaction.user.tag}`);
      await V2.reply(interaction, V2.success(`Undeafened <@${user.id}> in voice.`));
    }
  },
  {
    name: 'vc-kick',
    description: 'Kick a user from voice',
    options: [{ type: 'user', name: 'user', description: 'User to kick', required: true }],
    async execute(interaction, runtime) {
      if (!V2.hasAdminOrOwner(interaction.member, runtime)) {
        return V2.reply(interaction, V2.error('You need Administrator permission.'), true);
      }
      const user = interaction.options.getUser('user');
      const member = await interaction.guild.members.fetch(user.id).catch(() => null);
      if (!member) return V2.reply(interaction, V2.error('User not found.'), true);
      if (!member.voice.channel) return V2.reply(interaction, V2.error('User not in voice.'), true);
      await member.voice.disconnect(`By ${interaction.user.tag}`);
      await V2.reply(interaction, V2.success(`Kicked <@${user.id}> from voice.`));
    }
  },
  {
    name: 'vc-move',
    description: 'Move a user to another voice channel',
    options: [
      { type: 'user', name: 'user', description: 'User to move', required: true },
      { type: 'channel', name: 'channel', description: 'Target voice channel', required: true }
    ],
    async execute(interaction, runtime) {
      if (!V2.hasAdminOrOwner(interaction.member, runtime)) {
        return V2.reply(interaction, V2.error('You need Administrator permission.'), true);
      }
      const user = interaction.options.getUser('user');
      const channel = interaction.options.getChannel('channel');
      const member = await interaction.guild.members.fetch(user.id).catch(() => null);
      if (!member) return V2.reply(interaction, V2.error('User not found.'), true);
      if (!member.voice.channel) return V2.reply(interaction, V2.error('User not in voice.'), true);
      await member.voice.setChannel(channel, `By ${interaction.user.tag}`);
      await V2.reply(interaction, V2.success(`Moved <@${user.id}> to <#${channel.id}>.`));
    }
  },
  {
    name: 'nick',
    description: 'Change a user\'s nickname',
    options: [
      { type: 'user', name: 'user', description: 'User', required: true },
      { type: 'string', name: 'nickname', description: 'New nickname', required: true }
    ],
    async execute(interaction, runtime) {
      if (!V2.hasAdminOrOwner(interaction.member, runtime)) {
        return V2.reply(interaction, V2.error('You need Administrator permission.'), true);
      }
      const user = interaction.options.getUser('user');
      const nick = interaction.options.getString('nickname');
      const member = await interaction.guild.members.fetch(user.id).catch(() => null);
      if (!member) return V2.reply(interaction, V2.error('User not found.'), true);
      await member.setNickname(nick, `By ${interaction.user.tag}`);
      await V2.reply(interaction, V2.success(`Changed <@${user.id}>'s nickname to **${nick}**.`));
    }
  },
  {
    name: 'softban',
    description: 'Ban and unban to purge messages',
    options: [
      { type: 'user', name: 'user', description: 'User to softban', required: true },
      { type: 'string', name: 'reason', description: 'Reason', required: false }
    ],
    async execute(interaction, runtime) {
      if (!V2.hasAdminOrOwner(interaction.member, runtime)) {
        return V2.reply(interaction, V2.error('You need Administrator permission.'), true);
      }
      const user = interaction.options.getUser('user');
      const reason = interaction.options.getString('reason') || 'No reason';
      const member = await interaction.guild.members.fetch(user.id).catch(() => null);
      if (!member) return V2.reply(interaction, V2.error('User not found.'), true);
      if (!member.bannable) return V2.reply(interaction, V2.error('Cannot ban this user.'), true);
      await member.ban({ deleteMessageDays: 7, reason: `Softban: ${reason}` });
      await interaction.guild.members.unban(user.id, 'Softban');
      await V2.reply(interaction, V2.success(`Softbanned <@${user.id}>. Messages purged.`));
    }
  },
  {
    name: 'unban',
    description: 'Unban a user',
    options: [{ type: 'string', name: 'userid', description: 'User ID to unban', required: true }],
    async execute(interaction, runtime) {
      if (!V2.hasAdminOrOwner(interaction.member, runtime)) {
        return V2.reply(interaction, V2.error('You need Administrator permission.'), true);
      }
      const userId = interaction.options.getString('userid');
      try {
        await interaction.guild.members.unban(userId);
        await V2.reply(interaction, V2.success(`Unbanned <@${userId}>.`));
      } catch (e) {
        await V2.reply(interaction, V2.error('Could not unban. Check the user ID.'), true);
      }
    }
  },
  {
    name: 'temprole',
    description: 'Assign a temporary role',
    options: [
      { type: 'user', name: 'user', description: 'Target user', required: true },
      { type: 'role', name: 'role', description: 'Role to assign', required: true },
      { type: 'integer', name: 'minutes', description: 'Duration in minutes', required: true }
    ],
    async execute(interaction, runtime) {
      if (!V2.hasAdminOrOwner(interaction.member, runtime)) {
        return V2.reply(interaction, V2.error('You need Administrator permission.'), true);
      }
      const user = interaction.options.getUser('user');
      const role = interaction.options.getRole('role');
      const minutes = interaction.options.getInteger('minutes');
      const member = await interaction.guild.members.fetch(user.id).catch(() => null);
      if (!member) return V2.reply(interaction, V2.error('User not found.'), true);
      await member.roles.add(role);
      setTimeout(async () => {
        await member.roles.remove(role).catch(() => {});
      }, minutes * 60 * 1000);
      await V2.reply(interaction, V2.success(`Assigned <@&${role.id}> to <@${user.id}> for **${minutes}m**.`));
    }
  }
];

module.exports = { voiceSlashCmds };
