async function request(path, options = {}) {
  const base = process.env.CLOUDY_BOT_API_URL;
  if (!base) throw new Error('CLOUDY_BOT_API_URL is not configured.');

  const response = await fetch(base + path, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'x-dashboard-key': process.env.CLOUDY_BOT_API_KEY || '',
      ...(options.headers || {})
    },
    cache: 'no-store'
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || 'Cloudy API returned ' + response.status);
  }

  return data;
}

export function getCloudyGuild(guildId) {
  return request('/api/guilds/' + encodeURIComponent(guildId));
}

export function updateCloudyGuild(guildId, body) {
  return request('/api/guilds/' + encodeURIComponent(guildId), {
    method: 'PATCH',
    body: JSON.stringify(body)
  });
}

export function replaceCloudyData(guildId, data) {
  return request('/api/guilds/' + encodeURIComponent(guildId) + '/data', {
    method: 'PUT',
    body: JSON.stringify(data)
  });
}
