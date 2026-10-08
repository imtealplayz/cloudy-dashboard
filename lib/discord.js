export const MANAGE_GUILD = 1n << 5n;
export const ADMINISTRATOR = 1n << 3n;

export async function discordGet(path, accessToken) {
  const response = await fetch('https://discord.com/api/v10' + path, {
    headers: { Authorization: 'Bearer ' + accessToken },
    cache: 'no-store'
  });
  if (!response.ok) throw new Error('Discord API request failed: ' + response.status);
  return response.json();
}

export function canManageGuild(guild) {
  try {
    const permissions = BigInt(guild.permissions || '0');
    return (permissions & MANAGE_GUILD) === MANAGE_GUILD || (permissions & ADMINISTRATOR) === ADMINISTRATOR;
  } catch {
    return false;
  }
}

export async function getManageableGuilds(session) {
  if (!session?.accessToken) return [];

  const [userGuilds, botGuilds] = await Promise.all([
    discordGet('/users/@me/guilds', session.accessToken),
    fetch(process.env.CLOUDY_BOT_API_URL + '/api/guilds', {
      headers: { 'x-dashboard-key': process.env.CLOUDY_BOT_API_KEY || '' },
      cache: 'no-store'
    }).then(async (response) => {
      if (!response.ok) throw new Error('Cloudy API request failed: ' + response.status);
      return response.json();
    })
  ]);

  const botMap = new Map((botGuilds.guilds || []).map((guild) => [guild.id, guild]));

  return userGuilds
    .filter(canManageGuild)
    .filter((guild) => botMap.has(guild.id))
    .map((guild) => ({
      id: guild.id,
      name: guild.name,
      icon: guild.icon,
      permissions: guild.permissions,
      bot: botMap.get(guild.id)
    }));
}
