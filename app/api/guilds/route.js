import { NextResponse } from 'next/server';
import { getSession } from '../../../../lib/session';
import { getManageableGuilds } from '../../../lib/discord';

export const runtime = 'nodejs';

export async function GET(request) {
  const session = getSession(request);
  if (!session) return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });

  try {
    const guilds = await getManageableGuilds(session);
    return NextResponse.json({ guilds });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 502 });
  }
}
