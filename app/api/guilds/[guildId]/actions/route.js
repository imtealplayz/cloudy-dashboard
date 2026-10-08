import { NextResponse } from 'next/server';
import { getSession } from '../../../../../../lib/session';
import { canManageGuild, discordGet } from '../../../../../../lib/discord';
import { runCloudyAction } from '../../../../../../lib/cloudy';

export const runtime = 'nodejs';

export async function POST(request, { params }) {
  const session = getSession(request);
  if (!session) return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });

  const guildId = (await params).guildId;

  try {
    const guilds = await discordGet('/users/@me/guilds', session.accessToken);
    const guild = guilds.find((item) => item.id === guildId && canManageGuild(item));

    if (!guild) {
      return NextResponse.json({ error: 'You do not have dashboard access to this server.' }, { status: 403 });
    }

    const body = await request.json();
    return NextResponse.json(await runCloudyAction(guildId, body));
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 502 });
  }
}
