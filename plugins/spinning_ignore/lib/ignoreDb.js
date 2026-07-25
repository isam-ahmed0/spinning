const { Database, Table } = require('../../../lib/db');

const db = new Database();
const ignoredCommands = new Table(db, 'ignored_commands');
const ignoredChannels = new Table(db, 'ignored_channels');
const ignoredUsers = new Table(db, 'ignored_users');
const bypassUsers = new Table(db, 'bypass_users');

// Commands
function addIgnoredCommand(guildId, command) {
  const existing = ignoredCommands.findOne({ guildId, command });
  if (existing) return { added: false, reason: 'duplicate' };
  const count = ignoredCommands.count({ guildId });
  if (count >= 25) return { added: false, reason: 'limit' };
  ignoredCommands.insert({ guildId, command });
  return { added: true };
}

function removeIgnoredCommand(guildId, command) {
  const removed = ignoredCommands.delete({ guildId, command });
  return removed > 0;
}

function getAllIgnoredCommands(guildId) {
  return ignoredCommands.find({ guildId }).map(r => r.command);
}

function getIgnoredCommand(guildId, command) {
  return ignoredCommands.findOne({ guildId, command });
}

// Channels
function addIgnoredChannel(guildId, channelId) {
  const existing = ignoredChannels.findOne({ guildId, channelId });
  if (existing) return { added: false, reason: 'duplicate' };
  const count = ignoredChannels.count({ guildId });
  if (count >= 30) return { added: false, reason: 'limit' };
  ignoredChannels.insert({ guildId, channelId });
  return { added: true };
}

function removeIgnoredChannel(guildId, channelId) {
  const removed = ignoredChannels.delete({ guildId, channelId });
  return removed > 0;
}

function getAllIgnoredChannels(guildId) {
  return ignoredChannels.find({ guildId }).map(r => r.channelId);
}

function getIgnoredChannel(guildId, channelId) {
  return ignoredChannels.findOne({ guildId, channelId });
}

// Users
function addIgnoredUser(guildId, userId) {
  const existing = ignoredUsers.findOne({ guildId, userId });
  if (existing) return { added: false, reason: 'duplicate' };
  ignoredUsers.insert({ guildId, userId });
  return { added: true };
}

function removeIgnoredUser(guildId, userId) {
  const removed = ignoredUsers.delete({ guildId, userId });
  return removed > 0;
}

function getAllIgnoredUsers(guildId) {
  return ignoredUsers.find({ guildId }).map(r => r.userId);
}

function getIgnoredUser(guildId, userId) {
  return ignoredUsers.findOne({ guildId, userId });
}

// Bypass Users
function addBypassUser(guildId, userId) {
  const existing = bypassUsers.findOne({ guildId, userId });
  if (existing) return { added: false, reason: 'duplicate' };
  bypassUsers.insert({ guildId, userId });
  return { added: true };
}

function removeBypassUser(guildId, userId) {
  const removed = bypassUsers.delete({ guildId, userId });
  return removed > 0;
}

function getAllBypassUsers(guildId) {
  return bypassUsers.find({ guildId }).map(r => r.userId);
}

function getBypassUser(guildId, userId) {
  return bypassUsers.findOne({ guildId, userId });
}

module.exports = {
  addIgnoredCommand, removeIgnoredCommand, getAllIgnoredCommands, getIgnoredCommand,
  addIgnoredChannel, removeIgnoredChannel, getAllIgnoredChannels, getIgnoredChannel,
  addIgnoredUser, removeIgnoredUser, getAllIgnoredUsers, getIgnoredUser,
  addBypassUser, removeBypassUser, getAllBypassUsers, getBypassUser
};
