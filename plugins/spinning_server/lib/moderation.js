const { V2 } = require('../../spinning_core/lib/ui');
const { PermissionFlagsBits } = require('discord.js');
const ms = require('ms');

function modReply(interaction, title, body, ephemeral = false) {
  const container = V2.container(0x2B2D31, [
    V2.text(`**${title}**`),
    V2.separator(),
    V2.text(body)
  ]);
  return V2.reply(interaction, container, ephemeral);
}

const moderationSlashCmds = [
  {
    name: 'ban',
    description: 'Ban users from the server',
    options: [
      { type: 'user', name: 'user', description: 'The user to ban', required: true },
      { type: 'string', name: 'reason', description: 'Reason for banning', required: false },
      { type: 'integer', name: 'delete_messages', description: 'Delete messages from the last X days (0-7)', required: false, min_value: 0, max_value: 7 }
    ],
    async execute(interaction) {
      const targetUser = interaction.options.getUser('user');
      const targetMember = interaction.options.getMember('user');
      const reason = interaction.options.getString('reason') || 'No reason provided';
      const deleteMessageDays = interaction.options.getInteger('delete_messages') || 0;

      if (!interaction.member.permissions.has(PermissionFlagsBits.BanMembers))
        return modReply(interaction, 'Permission Denied', 'You need the **Ban Members** permission.', true);
      if (!interaction.guild.members.me.permissions.has(PermissionFlagsBits.BanMembers))
        return modReply(interaction, 'Missing Permissions', 'I need the **Ban Members** permission.', true);
      if (targetMember && targetMember.roles.highest.position >= interaction.member.roles.highest.position)
        return modReply(interaction, 'Cannot Ban User', 'They have an equal or higher role than you.', true);
      if (targetMember && !targetMember.bannable)
        return modReply(interaction, 'Cannot Ban User', 'I cannot ban this user. They may have a higher role than me.', true);

      try {
        await interaction.guild.members.ban(targetUser, { deleteMessageDays, reason });
        await modReply(interaction, 'User Banned',
          `**User:** ${targetUser.tag}\n**Moderator:** ${interaction.user.tag}\n**Reason:** ${reason}` +
          (deleteMessageDays > 0 ? `\n**Messages Deleted:** Last ${deleteMessageDays} day(s)` : ''));
      } catch (error) {
        const msg = error.code === 50013 ? 'I lack the permissions to ban this user.' : 'Failed to ban user.';
        await modReply(interaction, 'Error', msg, true);
      }
    }
  },
  {
    name: 'kick',
    description: 'Kick users from the server',
    options: [
      { type: 'user', name: 'user', description: 'The user to kick', required: true },
      { type: 'string', name: 'reason', description: 'Reason for kicking', required: false }
    ],
    async execute(interaction) {
      const targetUser = interaction.options.getUser('user');
      const targetMember = interaction.options.getMember('user');
      const reason = interaction.options.getString('reason') || 'No reason provided';

      if (!interaction.member.permissions.has(PermissionFlagsBits.KickMembers))
        return modReply(interaction, 'Permission Denied', 'You need the **Kick Members** permission.', true);
      if (!interaction.guild.members.me.permissions.has(PermissionFlagsBits.KickMembers))
        return modReply(interaction, 'Missing Permissions', 'I need the **Kick Members** permission.', true);
      if (!targetMember)
        return modReply(interaction, 'User Not Found', 'User is not in this server.', true);
      if (targetMember.roles.highest.position >= interaction.member.roles.highest.position)
        return modReply(interaction, 'Cannot Kick User', 'They have an equal or higher role than you.', true);
      if (!targetMember.kickable)
        return modReply(interaction, 'Cannot Kick User', 'I cannot kick this user. They may have a higher role than me.', true);

      try {
        await targetMember.kick(reason);
        await modReply(interaction, 'User Kicked',
          `**User:** ${targetUser.tag}\n**Moderator:** ${interaction.user.tag}\n**Reason:** ${reason}`);
      } catch (error) {
        const msg = error.code === 50013 ? 'I lack the permissions to kick this user.' : 'Failed to kick user.';
        await modReply(interaction, 'Error', msg, true);
      }
    }
  },
  {
    name: 'mute',
    description: 'Mute users for a duration',
    options: [
      { type: 'user', name: 'user', description: 'The user to mute', required: true },
      { type: 'string', name: 'duration', description: 'Duration (e.g., 1h, 30m, 1d)', required: true },
      { type: 'string', name: 'reason', description: 'Reason for muting', required: false }
    ],
    async execute(interaction) {
      const targetUser = interaction.options.getUser('user');
      const targetMember = interaction.options.getMember('user');
      const duration = interaction.options.getString('duration');
      const reason = interaction.options.getString('reason') || 'No reason provided';

      if (!interaction.member.permissions.has(PermissionFlagsBits.ModerateMembers))
        return modReply(interaction, 'Permission Denied', 'You need the **Moderate Members** permission.', true);
      if (!interaction.guild.members.me.permissions.has(PermissionFlagsBits.ModerateMembers))
        return modReply(interaction, 'Missing Permissions', 'I need the **Moderate Members** permission.', true);
      if (!targetMember)
        return modReply(interaction, 'User Not Found', 'User is not in this server.', true);

      const time = ms(duration);
      if (!time || time < 1000 || time > 2419200000)
        return modReply(interaction, 'Invalid Duration', 'Provide a valid duration (e.g., 1h, 30m, 1d). Maximum is 28 days.', true);
      if (targetMember.roles.highest.position >= interaction.member.roles.highest.position)
        return modReply(interaction, 'Cannot Mute User', 'They have an equal or higher role than you.', true);
      if (!targetMember.moderatable)
        return modReply(interaction, 'Cannot Mute User', 'I cannot mute this user. They may have a higher role than me.', true);

      try {
        await targetMember.timeout(time, reason);
        await modReply(interaction, 'User Muted',
          `**User:** ${targetUser}\n**Duration:** ${ms(time, { long: true })}\n**Moderator:** ${interaction.user.tag}\n**Reason:** ${reason}`);
      } catch (error) {
        const msg = error.code === 50013 ? 'I lack the permissions to mute this user.' : 'Failed to mute user.';
        await modReply(interaction, 'Error', msg, true);
      }
    }
  },
  {
    name: 'unmute',
    description: 'Unmute muted users',
    options: [
      { type: 'user', name: 'user', description: 'The user to unmute', required: true }
    ],
    async execute(interaction) {
      const targetUser = interaction.options.getUser('user');
      const targetMember = interaction.options.getMember('user');

      if (!interaction.member.permissions.has(PermissionFlagsBits.ModerateMembers))
        return modReply(interaction, 'Permission Denied', 'You need the **Moderate Members** permission.', true);
      if (!interaction.guild.members.me.permissions.has(PermissionFlagsBits.ModerateMembers))
        return modReply(interaction, 'Missing Permissions', 'I need the **Moderate Members** permission.', true);
      if (!targetMember)
        return modReply(interaction, 'User Not Found', 'User is not in this server.', true);
      if (targetMember.roles.highest.position >= interaction.member.roles.highest.position)
        return modReply(interaction, 'Cannot Unmute User', 'They have an equal or higher role than you.', true);
      if (!targetMember.isCommunicationDisabled())
        return modReply(interaction, 'User Not Muted', 'This user is not currently timed out.', true);
      if (!targetMember.moderatable)
        return modReply(interaction, 'Cannot Unmute User', 'I cannot unmute this user. They may have a higher role than me.', true);

      try {
        await targetMember.timeout(null);
        await modReply(interaction, 'User Unmuted',
          `**User:** ${targetUser}\n**Unmuted by:** ${interaction.user.tag}`);
      } catch (error) {
        const msg = error.code === 50013 ? 'I lack the permissions to unmute this user.' : 'Failed to unmute user.';
        await modReply(interaction, 'Error', msg, true);
      }
    }
  },
  {
    name: 'unban',
    description: 'Unban a previously banned user',
    options: [
      { type: 'string', name: 'user_id', description: 'The ID of the user to unban', required: true },
      { type: 'string', name: 'reason', description: 'Reason for unbanning', required: false }
    ],
    async execute(interaction) {
      const userId = interaction.options.getString('user_id');
      const reason = interaction.options.getString('reason') || 'No reason provided';

      if (!interaction.member.permissions.has(PermissionFlagsBits.BanMembers))
        return modReply(interaction, 'Permission Denied', 'You need the **Ban Members** permission.', true);
      if (!interaction.guild.members.me.permissions.has(PermissionFlagsBits.BanMembers))
        return modReply(interaction, 'Missing Permissions', 'I need the **Ban Members** permission.', true);

      try {
        const bannedUser = await interaction.guild.bans.fetch(userId).catch(() => null);
        if (!bannedUser)
          return modReply(interaction, 'User Not Banned', 'This user is not banned from the server.', true);

        await interaction.guild.members.unban(userId, reason);
        await modReply(interaction, 'User Unbanned',
          `**User:** ${bannedUser.user.tag}\n**Moderator:** ${interaction.user.tag}\n**Reason:** ${reason}`);
      } catch (error) {
        const msg = error.code === 50013 ? 'I lack the permissions to unban this user.' : 'Failed to unban user. Check the user ID.';
        await modReply(interaction, 'Error', msg, true);
      }
    }
  },
  {
    name: 'softban',
    description: 'Softban users from the server (ban then unban to delete messages)',
    options: [
      { type: 'user', name: 'user', description: 'The user to softban', required: true },
      { type: 'string', name: 'reason', description: 'Reason for softban', required: false },
      { type: 'integer', name: 'delete_messages', description: 'Delete messages from the last X days (0-7)', required: false, min_value: 0, max_value: 7 }
    ],
    async execute(interaction) {
      const targetUser = interaction.options.getUser('user');
      const targetMember = interaction.options.getMember('user');
      const reason = interaction.options.getString('reason') || 'No reason provided';
      const deleteMessageDays = interaction.options.getInteger('delete_messages') || 1;

      if (!interaction.member.permissions.has(PermissionFlagsBits.BanMembers))
        return modReply(interaction, 'Permission Denied', 'You need the **Ban Members** permission.', true);
      if (!interaction.guild.members.me.permissions.has(PermissionFlagsBits.BanMembers))
        return modReply(interaction, 'Missing Permissions', 'I need the **Ban Members** permission.', true);
      if (targetMember && targetMember.roles.highest.position >= interaction.member.roles.highest.position)
        return modReply(interaction, 'Cannot Softban User', 'They have an equal or higher role than you.', true);
      if (targetMember && !targetMember.bannable)
        return modReply(interaction, 'Cannot Softban User', 'I cannot softban this user. They may have a higher role than me.', true);

      try {
        await interaction.guild.members.ban(targetUser, { deleteMessageDays, reason: `[SOFTBAN] ${reason}` });
        await interaction.guild.members.unban(targetUser, 'Softban - Auto unban');
        await modReply(interaction, 'User Softbanned',
          `**User:** ${targetUser.tag}\n**Moderator:** ${interaction.user.tag}\n**Reason:** ${reason}\n**Messages Deleted:** Last ${deleteMessageDays} day(s)`);
      } catch (error) {
        const msg = error.code === 50013 ? 'I lack the permissions to softban this user.' : 'Failed to softban user.';
        await modReply(interaction, 'Error', msg, true);
      }
    }
  },
  {
    name: 'tempban',
    description: 'Temporarily ban users',
    options: [
      { type: 'user', name: 'user', description: 'The user to temporarily ban', required: true },
      { type: 'string', name: 'duration', description: 'Duration (e.g., 1h, 30m, 1d)', required: true },
      { type: 'string', name: 'reason', description: 'Reason for tempban', required: false },
      { type: 'integer', name: 'delete_messages', description: 'Delete messages from the last X days (0-7)', required: false, min_value: 0, max_value: 7 }
    ],
    async execute(interaction) {
      const targetUser = interaction.options.getUser('user');
      const targetMember = interaction.options.getMember('user');
      const duration = interaction.options.getString('duration');
      const reason = interaction.options.getString('reason') || 'No reason provided';
      const deleteMessageDays = interaction.options.getInteger('delete_messages') || 0;

      if (!interaction.member.permissions.has(PermissionFlagsBits.BanMembers))
        return modReply(interaction, 'Permission Denied', 'You need the **Ban Members** permission.', true);
      if (!interaction.guild.members.me.permissions.has(PermissionFlagsBits.BanMembers))
        return modReply(interaction, 'Missing Permissions', 'I need the **Ban Members** permission.', true);

      const time = ms(duration);
      if (!time || time < 1000 || time > 315360000000)
        return modReply(interaction, 'Invalid Duration', 'Provide a valid duration (e.g., 1h, 30m, 1d, 7d).', true);
      if (targetMember && targetMember.roles.highest.position >= interaction.member.roles.highest.position)
        return modReply(interaction, 'Cannot Ban User', 'They have an equal or higher role than you.', true);
      if (targetMember && !targetMember.bannable)
        return modReply(interaction, 'Cannot Ban User', 'I cannot ban this user. They may have a higher role than me.', true);

      try {
        await interaction.guild.members.ban(targetUser, {
          deleteMessageDays,
          reason: `[TEMPBAN ${ms(time, { long: true })}] ${reason}`
        });

        setTimeout(async () => {
          try { await interaction.guild.members.unban(targetUser, 'Tempban expired'); } catch {}
        }, time);

        await modReply(interaction, 'User Temporarily Banned',
          `**User:** ${targetUser.tag}\n**Duration:** ${ms(time, { long: true })}\n**Moderator:** ${interaction.user.tag}\n**Reason:** ${reason}` +
          (deleteMessageDays > 0 ? `\n**Messages Deleted:** Last ${deleteMessageDays} day(s)` : ''));
      } catch (error) {
        const msg = error.code === 50013 ? 'I lack the permissions to ban this user.' : 'Failed to temporarily ban user.';
        await modReply(interaction, 'Error', msg, true);
      }
    }
  },
  {
    name: 'temprole',
    description: 'Temporarily add roles to users',
    options: [
      { type: 'user', name: 'user', description: 'The user to give the role', required: true },
      { type: 'role', name: 'role', description: 'The role to add', required: true },
      { type: 'string', name: 'duration', description: 'Duration (e.g., 1h, 30m, 1d)', required: true },
      { type: 'string', name: 'reason', description: 'Reason for temporary role', required: false }
    ],
    async execute(interaction) {
      const targetUser = interaction.options.getUser('user');
      const targetMember = interaction.options.getMember('user');
      const role = interaction.options.getRole('role');
      const duration = interaction.options.getString('duration');
      const reason = interaction.options.getString('reason') || 'No reason provided';

      if (!interaction.member.permissions.has(PermissionFlagsBits.ManageRoles))
        return modReply(interaction, 'Permission Denied', 'You need the **Manage Roles** permission.', true);
      if (!interaction.guild.members.me.permissions.has(PermissionFlagsBits.ManageRoles))
        return modReply(interaction, 'Missing Permissions', 'I need the **Manage Roles** permission.', true);
      if (!targetMember)
        return modReply(interaction, 'User Not Found', 'User is not in this server.', true);

      const time = ms(duration);
      if (!time || time < 1000 || time > 315360000000)
        return modReply(interaction, 'Invalid Duration', 'Provide a valid duration (e.g., 1h, 30m, 1d, 7d).', true);
      if (role.position >= interaction.guild.members.me.roles.highest.position)
        return modReply(interaction, 'Role Too High', 'I cannot manage this role as it is higher than or equal to my highest role.', true);
      if (targetMember.roles.cache.has(role.id))
        return modReply(interaction, 'Role Already Assigned', 'User already has this role.', true);

      try {
        await targetMember.roles.add(role, `[TEMPROLE ${ms(time, { long: true })}] ${reason}`);

        setTimeout(async () => {
          try {
            const member = await interaction.guild.members.fetch(targetUser.id).catch(() => null);
            if (member?.roles.cache.has(role.id)) {
              await member.roles.remove(role, 'Temporary role expired');
            }
          } catch {}
        }, time);

        await modReply(interaction, 'Temporary Role Added',
          `**User:** ${targetUser}\n**Role:** ${role}\n**Duration:** ${ms(time, { long: true })}\n**Added by:** ${interaction.user.tag}\n**Reason:** ${reason}`);
      } catch (error) {
        const msg = error.code === 50013 ? 'I lack the permissions to manage this role.' : 'Failed to add temporary role.';
        await modReply(interaction, 'Error', msg, true);
      }
    }
  },
  {
    name: 'rolegive',
    description: 'Give a role to a user',
    options: [
      { type: 'user', name: 'user', description: 'The user to give the role to', required: true },
      { type: 'role', name: 'role', description: 'The role to give', required: true }
    ],
    async execute(interaction) {
      const targetUser = interaction.options.getUser('user');
      const targetMember = interaction.options.getMember('user');
      const role = interaction.options.getRole('role');

      if (!interaction.member.permissions.has(PermissionFlagsBits.ManageRoles))
        return modReply(interaction, 'Permission Denied', 'You need the **Manage Roles** permission.', true);
      if (!interaction.guild.members.me.permissions.has(PermissionFlagsBits.ManageRoles))
        return modReply(interaction, 'Missing Permissions', 'I need the **Manage Roles** permission.', true);
      if (!targetMember)
        return modReply(interaction, 'User Not Found', 'User is not in this server.', true);
      if (role.position >= interaction.guild.members.me.roles.highest.position)
        return modReply(interaction, 'Role Too High', 'I cannot manage this role as it is higher than or equal to my highest role.', true);
      if (interaction.member.id !== interaction.guild.ownerId && role.position >= interaction.member.roles.highest.position)
        return modReply(interaction, 'Role Too High', 'You cannot manage a role higher than or equal to your highest role.', true);
      if (targetMember.roles.cache.has(role.id))
        return modReply(interaction, 'Role Already Assigned', 'User already has this role.', true);

      try {
        await targetMember.roles.add(role, `[ROLEGIVE] By ${interaction.user.tag}`);
        await modReply(interaction, 'Role Given',
          `**User:** ${targetUser}\n**Role:** ${role.name}\n**Given by:** ${interaction.user.tag}`);
      } catch (error) {
        const msg = error.code === 50013 ? 'I lack the permissions to manage this role.' : 'Failed to give role.';
        await modReply(interaction, 'Error', msg, true);
      }
    }
  },
  {
    name: 'roleremove',
    description: 'Remove a role from a user',
    options: [
      { type: 'user', name: 'user', description: 'The user to remove the role from', required: true },
      { type: 'role', name: 'role', description: 'The role to remove', required: true }
    ],
    async execute(interaction) {
      const targetUser = interaction.options.getUser('user');
      const targetMember = interaction.options.getMember('user');
      const role = interaction.options.getRole('role');

      if (!interaction.member.permissions.has(PermissionFlagsBits.ManageRoles))
        return modReply(interaction, 'Permission Denied', 'You need the **Manage Roles** permission.', true);
      if (!interaction.guild.members.me.permissions.has(PermissionFlagsBits.ManageRoles))
        return modReply(interaction, 'Missing Permissions', 'I need the **Manage Roles** permission.', true);
      if (!targetMember)
        return modReply(interaction, 'User Not Found', 'User is not in this server.', true);
      if (role.position >= interaction.guild.members.me.roles.highest.position)
        return modReply(interaction, 'Role Too High', 'I cannot manage this role as it is higher than or equal to my highest role.', true);
      if (interaction.member.id !== interaction.guild.ownerId && role.position >= interaction.member.roles.highest.position)
        return modReply(interaction, 'Role Too High', 'You cannot manage a role higher than or equal to your highest role.', true);
      if (!targetMember.roles.cache.has(role.id))
        return modReply(interaction, 'Role Not Found', 'User does not have this role.', true);

      try {
        await targetMember.roles.remove(role, `[ROLEREMOVE] By ${interaction.user.tag}`);
        await modReply(interaction, 'Role Removed',
          `**User:** ${targetUser}\n**Role:** ${role.name}\n**Removed by:** ${interaction.user.tag}`);
      } catch (error) {
        const msg = error.code === 50013 ? 'I lack the permissions to manage this role.' : 'Failed to remove role.';
        await modReply(interaction, 'Error', msg, true);
      }
    }
  },
  {
    name: 'slowmode',
    description: 'Set the slowmode for a channel',
    options: [
      { type: 'integer', name: 'seconds', description: 'Slowmode duration in seconds (0 to disable)', required: true, min_value: 0, max_value: 21600 },
      { type: 'channel', name: 'channel', description: 'The channel to set slowmode (defaults to current)', required: false }
    ],
    async execute(interaction) {
      const seconds = interaction.options.getInteger('seconds');
      const channel = interaction.options.getChannel('channel') || interaction.channel;

      if (!interaction.member.permissions.has(PermissionFlagsBits.ManageChannels))
        return modReply(interaction, 'Permission Denied', 'You need the **Manage Channels** permission.', true);
      if (!interaction.guild.members.me.permissions.has(PermissionFlagsBits.ManageChannels))
        return modReply(interaction, 'Missing Permissions', 'I need the **Manage Channels** permission.', true);

      try {
        await channel.setRateLimitPerUser(seconds);
        await modReply(interaction, seconds === 0 ? 'Slowmode Disabled' : 'Slowmode Enabled',
          `**Channel:** ${channel}\n**Duration:** ${seconds === 0 ? 'Disabled' : `${seconds} second(s)`}\n**Set by:** ${interaction.user.tag}`);
      } catch (error) {
        const msg = error.code === 50013 ? 'I lack the permissions to modify this channel.' : 'Failed to set slowmode.';
        await modReply(interaction, 'Error', msg, true);
      }
    }
  },
  {
    name: 'lock',
    description: 'Prevent messages in a channel',
    options: [
      { type: 'channel', name: 'channel', description: 'The channel to lock (defaults to current)', required: false },
      { type: 'string', name: 'reason', description: 'Reason for locking', required: false }
    ],
    async execute(interaction) {
      const channel = interaction.options.getChannel('channel') || interaction.channel;
      const reason = interaction.options.getString('reason') || 'No reason provided';

      if (!interaction.member.permissions.has(PermissionFlagsBits.ManageChannels))
        return modReply(interaction, 'Permission Denied', 'You need the **Manage Channels** permission.', true);
      if (!interaction.guild.members.me.permissions.has(PermissionFlagsBits.ManageChannels))
        return modReply(interaction, 'Missing Permissions', 'I need the **Manage Channels** permission.', true);

      try {
        await channel.permissionOverwrites.edit(interaction.guild.roles.everyone, { SendMessages: false }, { reason });
        await modReply(interaction, 'Channel Locked',
          `**Channel:** ${channel}\n**Locked by:** ${interaction.user.tag}\n**Reason:** ${reason}`);
      } catch (error) {
        const msg = error.code === 50013 ? 'I lack the permissions to modify this channel.' : 'Failed to lock channel.';
        await modReply(interaction, 'Error', msg, true);
      }
    }
  },
  {
    name: 'unlock',
    description: 'Unlock a channel',
    options: [
      { type: 'channel', name: 'channel', description: 'The channel to unlock (defaults to current)', required: false }
    ],
    async execute(interaction) {
      const channel = interaction.options.getChannel('channel') || interaction.channel;

      if (!interaction.member.permissions.has(PermissionFlagsBits.ManageChannels))
        return modReply(interaction, 'Permission Denied', 'You need the **Manage Channels** permission.', true);
      if (!interaction.guild.members.me.permissions.has(PermissionFlagsBits.ManageChannels))
        return modReply(interaction, 'Missing Permissions', 'I need the **Manage Channels** permission.', true);

      try {
        await channel.permissionOverwrites.edit(interaction.guild.roles.everyone, { SendMessages: null });
        await modReply(interaction, 'Channel Unlocked',
          `**Channel:** ${channel}\n**Unlocked by:** ${interaction.user.tag}`);
      } catch (error) {
        const msg = error.code === 50013 ? 'I lack the permissions to modify this channel.' : 'Failed to unlock channel.';
        await modReply(interaction, 'Error', msg, true);
      }
    }
  },
  {
    name: 'warn',
    description: 'Warn a user',
    options: [
      { type: 'user', name: 'user', description: 'User to warn', required: true },
      { type: 'string', name: 'reason', description: 'Reason', required: false }
    ],
    async execute(interaction, runtime, warningsTable) {
      const targetUser = interaction.options.getUser('user');
      const reason = interaction.options.getString('reason') || 'No reason provided';
      const moderator = interaction.member;

      warningsTable.insert({
        userId: targetUser.id,
        guildId: interaction.guildId,
        moderatorId: moderator.id,
        reason,
        timestamp: Date.now()
      });
      const count = warningsTable.find({ userId: targetUser.id, guildId: interaction.guildId }).length;
      await modReply(interaction, 'User Warned',
        `**User:** ${targetUser.tag}\n**Moderator:** ${interaction.user.tag}\n**Reason:** ${reason}\n**Total Warnings:** ${count}`);
    }
  },
  {
    name: 'warnings',
    description: 'View warnings for a user',
    options: [
      { type: 'user', name: 'user', description: 'User to check', required: true }
    ],
    async execute(interaction, runtime, warningsTable) {
      const user = interaction.options.getUser('user');
      const warns = warningsTable.find({ userId: user.id, guildId: interaction.guildId });
      if (warns.length === 0) {
        return modReply(interaction, 'No Warnings', `${user.tag} has no warnings.`);
      }
      const list = warns.map((w, i) => `**${i + 1}.** ${w.reason || 'No reason'} — <@${w.moderatorId}>`).join('\n');
      await modReply(interaction, `Warnings for ${user.tag}`, `${list}\n\n**Total:** ${warns.length}`);
    }
  },
  {
    name: 'clearwarns',
    description: 'Clear all warnings for a user',
    options: [
      { type: 'user', name: 'user', description: 'User to clear warnings for', required: true }
    ],
    async execute(interaction, runtime, warningsTable) {
      if (!V2.hasAdminOrOwner(interaction.member, runtime))
        return V2.reply(interaction, V2.error('You need Administrator permission.'), true);
      const user = interaction.options.getUser('user');
      const count = warningsTable.delete({ userId: user.id, guildId: interaction.guildId });
      await modReply(interaction, 'Warnings Cleared', `Cleared ${count} warning(s) for ${user.tag}.`);
    }
  },
  {
    name: 'purge',
    description: 'Bulk delete messages',
    options: [
      { type: 'integer', name: 'amount', description: 'Number of messages to delete (1-100)', required: true, min_value: 1, max_value: 100 }
    ],
    async execute(interaction) {
      if (!V2.hasAdminOrOwner(interaction.member, runtime))
        return V2.reply(interaction, V2.error('You need Administrator permission.'), true);
      const amount = interaction.options.getInteger('amount');
      await interaction.deferReply();
      const deleted = await interaction.channel.bulkDelete(amount, true);
      await interaction.editReply({ components: [V2.success(`Deleted ${deleted.size} message(s).`)], flags: V2.FLAG });
    }
  }
];

module.exports = { moderationSlashCmds };
