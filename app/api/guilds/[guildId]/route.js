import { NextResponse } from 'next/server';
import { getSession } from '../../../../../lib/session';
import { canManageGuild, discordGet } from '../../../../../lib/discord';
import { getCloudyGuild, updateCloudyGuild } from '../../../../../lib/cloudy';

export const runtime = 'nodejs';

async function authorized(session, guildId) {
  const guilds = await discordGet('/users/@me/guilds', session.accessToken);
  return guilds.find((guild) => guild.id === guildId && canManageGuild(guild)) || null;
}

export async function GET(request, { params }) {
  const session = getSession(request);
  if (!session) return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });

  const guildId = (await params).guildId;
  try {
    if (!await authorized(session, guildId)) {
      return NextResponse.json({ error: 'You do not have dashboard access to this server.' }, { status: 403 });
    }
    return NextResponse.json(await getCloudyGuild(guildId));
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 502 });
  }
}

export async function PATCH(request, { params }) {
  const session = getSession(request);
  if (!session) return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });

  const guildId = (await params).guildId;
  try {
    if (!await authorized(session, guildId)) {
      return NextResponse.json({ error: 'You do not have dashboard access to this server.' }, { status: 403 });
    }

    const body = await request.json();
    return NextResponse.json(await updateCloudyGuild(guildId, body));
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 502 });
  }
}
