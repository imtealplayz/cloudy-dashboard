import Link from 'next/link';

export default function Home() {
  return (
    <main className="landing">
      <section className="landing-card">
        <div className="brand-mark">C</div>
        <p className="eyebrow">CLOUDY DASHBOARD</p>
        <h1>Manage your Discord server without leaving your browser.</h1>
        <p className="muted">
          Configure Cloudy, review moderation data, and control server security from one clean panel.
        </p>
        <Link className="button button-primary" href="/api/auth/discord">
          Continue with Discord
        </Link>
      </section>
    </main>
  );
}
