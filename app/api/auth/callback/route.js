import { NextResponse } from 'next/server';
import { setSessionCookie } from '../../../../../lib/session';

export const runtime = 'nodejs';

async function discordToken(code) {
  const body = new URLSearchParams({
    client_id: process.env.DISCORD_CLIENT_ID,
    client_secret: process.env.DISCORD_CLIENT_SECRET,
    grant_type: 'authorization_code',
    code,
    redirect_uri: process.env.DISCORD_REDIRECT_URI
  });

  const response = await fetch('https://discord.com/api/v10/oauth2/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body
  });

  if (!response.ok) throw new Error('Discord token exchange failed.');
  return response.json();
}

async function discordGet(path, accessToken) {
  const response = await fetch('https://discord.com/api/v10' + path, {
    headers: { Authorization: 'Bearer ' + accessToken },
    cache: 'no-store'
  });
  if (!response.ok) throw new Error('Discord API request failed: ' + response.status);
  return response.json();
}

export async function GET(request) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const expectedState = request.cookies.get('cloudy_oauth_state')?.value;

  if (!code || !state || !expectedState || state !== expectedState) {
    return NextResponse.json({ error: 'Invalid OAuth state.' }, { status: 400 });
  }

  try {
    const token = await discordToken(code);
    const [user, guilds] = await Promise.all([
      discordGet('/users/@me', token.access_token),
      discordGet('/users/@me/guilds', token.access_token)
    ]);

    const response = NextResponse.redirect(new URL('/dashboard', request.url));
    setSessionCookie(response, {
      user: {
        id: user.id,
        username: user.username,
        globalName: user.global_name || user.username,
        avatar: user.avatar || null
      },
      accessToken: token.access_token,
      expiresAt: Date.now() + Number(token.expires_in || 604800) * 1000,
      guilds
    });
    response.cookies.set('cloudy_oauth_state', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 0
    });
    return response;
  } catch (error) {
    const response = NextResponse.redirect(new URL('/?error=oauth', request.url));
    return response;
  }
}
