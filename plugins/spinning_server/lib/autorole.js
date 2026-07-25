async function handleAutoRole(member, runtime) {
  const config = runtime.getPluginConfig('spinning_server');
  const roleId = config.autorole_id;
  if (!roleId) return;

  const role = member.guild.roles.cache.get(roleId);
  if (!role) return;

  try {
    await member.roles.add(role);
  } catch (e) {
    console.error(`[spinning_server] Auto-role failed for ${member.user.tag}:`, e.message);
  }
}

module.exports = { handleAutoRole };
