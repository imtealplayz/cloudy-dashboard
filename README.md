# Cloudy Dashboard

A mobile-first administration dashboard for the Cloudy Discord bot.

## Stack

- Next.js 16.4
- React 19.3
- Vercel-friendly server routes
- Discord OAuth2
- Cloudy server-side HTTP API

The dashboard intentionally uses a restrained interface: solid colors, thin borders, muted slate tones, no gradients, and no neon styling.

## What it manages

For every Discord server where the signed-in user can manage Cloudy:

- Server prefix
- Welcome channel and welcome message
- Moderation log channel
- Ticket panel, category, and support role configuration
- Anti-spam switch and threshold
- Anti-raid switch and threshold
- Anti-link / invite protection
- Discord native AutoMod enable/disable
- Warnings
- Moderation history
- Moderation statistics
- Stored ticket records
- The complete persisted guild object through the Advanced Data editor

The dashboard also loads the actual channels and roles from Cloudy so configuration uses selectors instead of manually copying IDs.

## Architecture

The dashboard must not read the bot's local JSON file.

The flow is:

1. User signs in with Discord on the Vercel dashboard.
2. Next.js verifies the Discord OAuth session and checks that the user has Manage Server or Administrator in the selected server.
3. Next.js calls Cloudy's dashboard API from the server side.
4. Cloudy authenticates that API call with DASHBOARD_API_KEY.
5. Cloudy reads and writes the existing data/cloudy.json store.
6. Discord resources such as channels and roles are read from the running bot.

This keeps DISCORD_TOKEN and DASHBOARD_API_KEY out of browser JavaScript.

## Local development

### 1. Install

    npm install

### 2. Configure .env.local

Copy .env.example to .env.local and set:

    DISCORD_CLIENT_ID=your_discord_application_client_id
    DISCORD_CLIENT_SECRET=your_discord_application_client_secret
    DISCORD_REDIRECT_URI=http://localhost:3000/api/auth/callback
    SESSION_SECRET=use_a_long_random_secret_at_least_32_characters
    CLOUDY_BOT_API_URL=http://localhost:3001
    CLOUDY_BOT_API_KEY=the_same_key_configured_on_cloudy

If both apps run locally at the same time, Cloudy's dashboard API and Next.js cannot use the same port. For example:

Cloudy bot:

    DASHBOARD_API_PORT=3001

Dashboard:

    CLOUDY_BOT_API_URL=http://localhost:3001

### 3. Discord OAuth2

In the Discord Developer Portal for the same application used by Cloudy:

- Add http://localhost:3000/api/auth/callback under OAuth2 redirect URIs.
- The dashboard requests the identify and guilds scopes.
- No Discord bot token is placed in the dashboard.

### 4. Run

    npm run dev

Open http://localhost:3000.

## Vercel deployment

Create a Vercel project from this repository.

Set these environment variables:

    DISCORD_CLIENT_ID=...
    DISCORD_CLIENT_SECRET=...
    DISCORD_REDIRECT_URI=https://YOUR-DOMAIN.vercel.app/api/auth/callback
    SESSION_SECRET=...
    CLOUDY_BOT_API_URL=https://YOUR-CLOUDY-BOT-HOST
    CLOUDY_BOT_API_KEY=...

Then add the production callback URL to the Discord Developer Portal:

    https://YOUR-DOMAIN.vercel.app/api/auth/callback

## Cloudy bot connection

On the host where the bot runs, add:

    DASHBOARD_API_KEY=...
    DASHBOARD_ORIGIN=https://YOUR-DOMAIN.vercel.app

Use exactly the same random value for DASHBOARD_API_KEY in both projects.

Cloudy listens on DASHBOARD_API_PORT when supplied, otherwise it uses the hosting provider's PORT. That is preferable on Railway and similar platforms.

The host running Cloudy must expose that HTTP port publicly over HTTPS so Vercel can reach it.

Example:

    Vercel dashboard
        |
        | HTTPS + server-side API key
        v
    Cloudy dashboard API
        |
        v
    data/cloudy.json

## Security

The browser never receives:

- DISCORD_CLIENT_SECRET
- DISCORD_TOKEN
- DASHBOARD_API_KEY

Dashboard API calls are proxied through Next.js server routes. Each selected guild is re-checked against the signed-in user's Discord guild permissions before Cloudy is contacted.

The Cloudy API independently requires x-dashboard-key.

The Advanced Data editor is intentionally powerful. It can replace a guild's stored JSON object and should be used carefully.

## Production storage note

Cloudy currently uses its existing JSON store. That is acceptable when the bot host has persistent disk storage. If the host uses an ephemeral filesystem, migrate Cloudy to a database such as MongoDB or PostgreSQL before relying on moderation history as permanent storage.

The dashboard does not require a separate database while it talks to Cloudy's API.

## Scripts

    npm run dev
    npm run build
    npm start
