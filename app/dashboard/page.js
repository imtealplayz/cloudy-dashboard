'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function DashboardIndex() {
  const router = useRouter();
  const [state, setState] = useState({ loading: true, guilds: [], error: null });

  useEffect(() => {
    fetch('/api/guilds')
      .then(async (res) => {
        if (res.status === 401) {
          router.replace('/');
          return null;
        }
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Could not load servers.');
        return data;
      })
      .then((data) => {
        if (data) setState({ loading: false, guilds: data.guilds || [], error: null });
      })
      .catch((error) => setState({ loading: false, guilds: [], error: error.message }));
  }, [router]);

  if (state.loading) return <div className="center-state">Loading your servers...</div>;
  if (state.error) return <div className="center-state">{state.error}</div>;

  if (!state.guilds.length) {
    return (
      <div className="center-state">
        <div className="empty-card">
          <h2>No manageable servers</h2>
          <p className="muted">Cloudy must be installed in a server where your Discord account has `Manage Server` or `Administrator`.</p>
          <a className="button button-primary" href="/api/auth/discord">Sign in again</a>
        </div>
      </div>
    );
  }

  router.replace('/dashboard/' + state.guilds[0].id);
  return <div className="center-state">Opening your first server...</div>;
}
