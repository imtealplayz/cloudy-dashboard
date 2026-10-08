'use client';

import { useEffect, useMemo, useState } from 'react';

const sections = [
  { id: 'overview', label: 'Overview' },
  { id: 'general', label: 'General' },
  { id: 'tickets', label: 'Tickets' },
  { id: 'security', label: 'Security' },
  { id: 'automod', label: 'AutoMod' },
  { id: 'moderation', label: 'Moderation data' },
  { id: 'data', label: 'Advanced data' }
];

function Icon({ name }) {
  const paths = {
    overview: 'M4 13h6V4H4v9Zm10 7h6V4h-6v16ZM4 20h6v-3H4v3Zm10-11h6V6h-6v3Z',
    general: 'M5 4h14a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-5l-2 3-2-3H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z',
    tickets: 'M4 6h16v12H4zM8 6v12M12 9h5M12 12h5',
    security: 'M12 3 20 7v5c0 5-3.5 8.7-8 10-4.5-1.3-8-5-8-10V7l8-4Z',
    automod: 'M5 12h14M12 5v14',
    moderation: 'M7 3h10v18H7zM9 7h6M9 11h6M9 15h4',
    data: 'M4 5h16v4H4zM4 11h16v8H4zM8 7h.01M8 15h.01'
  };
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="nav-icon">
      <path d={paths[name]} fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function DashboardClient({ guildId }) {
  const [section, setSection] = useState('overview');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [state, setState] = useState({ loading: true, error: null, guilds: [], data: null, user: null });
  const [message, setMessage] = useState(null);

  useEffect(() => {
    Promise.all([
      fetch('/api/guilds').then(async (res) => {
        if (res.status === 401) throw new Error('AUTH_REQUIRED');
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Could not load servers.');
        return data;
      }),
      fetch('/api/guilds/' + guildId).then(async (res) => {
        if (res.status === 401) throw new Error('AUTH_REQUIRED');
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Could not load Cloudy.');
        return data;
      }),
      fetch('/api/session').then((res) => res.json())
    ])
      .then(([guilds, data, session]) => {
        setState({ loading: false, error: null, guilds: guilds.guilds || [], data, user: session.user || null });
      })
      .catch((error) => {
        if (error.message === 'AUTH_REQUIRED') {
          window.location.href = '/';
          return;
        }
        setState((current) => ({ ...current, loading: false, error: error.message }));
      });
  }, [guildId]);

  useEffect(() => {
    const hash = window.location.hash.slice(1);
    if (sections.some((item) => item.id === hash)) setSection(hash);
  }, []);

  function selectSection(next) {
    setSection(next);
    setMobileOpen(false);
    window.history.replaceState(null, '', '#' + next);
  }

  async function save(patch) {
    setMessage(null);
    try {
      const response = await fetch('/api/guilds/' + guildId, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch)
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Save failed.');
      setState((current) => ({ ...current, data: { ...current.data, settings: data.settings } }));
      setMessage({ type: 'success', text: 'Cloudy saved the changes.' });
    } catch (error) {
      setMessage({ type: 'error', text: error.message });
    }
  }

  async function saveAllData(value) {
    setMessage(null);
    try {
      const parsed = JSON.parse(value);
      const response = await fetch('/api/guilds/' + guildId + '/data', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsed)
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Save failed.');
      setState((current) => ({ ...current, data: { ...current.data, settings: data.settings } }));
      setMessage({ type: 'success', text: 'Advanced data saved.' });
      return data.settings;
    } catch (error) {
      setMessage({ type: 'error', text: error.message });
      return null;
    }
  }

  const currentGuild = useMemo(
    () => state.guilds.find((guild) => guild.id === guildId),
    [state.guilds, guildId]
  );

  if (state.loading) return <div className="center-state">Loading Cloudy...</div>;
  if (state.error) return <div className="center-state"><div className="empty-card"><h2>Dashboard unavailable</h2><p className="muted">{state.error}</p></div></div>;
  if (!state.data) return null;

  const settings = state.data.settings;
  const resources = state.data.resources || { channels: [], roles: [] };

  return (
    <div className="app-shell">
      <aside className={'sidebar ' + (mobileOpen ? 'mobile-open' : '')}>
        <div className="sidebar-top">
          <div className="brand-row">
            <div className="brand-mark small">C</div>
            <div>
              <strong>Cloudy</strong>
              <span>Dashboard</span>
            </div>
          </div>

          <nav className="nav" aria-label="Dashboard navigation">
            {sections.map((item) => (
              <button
                key={item.id}
                className={'nav-item ' + (section === item.id ? 'active' : '')}
                onClick={() => selectSection(item.id)}
              >
                <Icon name={item.id} />
                <span>{item.label}</span>
              </button>
            ))}
          </nav>
        </div>

        <div className="sidebar-bottom">
          <div className="user-chip">
            <div className="avatar user-avatar">
              {state.user?.avatar
                ? <img src={'https://cdn.discordapp.com/avatars/' + state.user.id + '/' + state.user.avatar + '.png?size=64'} alt="" />
                : <span>{(state.user?.globalName || 'U').slice(0, 1)}</span>}
            </div>
            <div className="ellipsis">
              <strong>{state.user?.globalName || state.user?.username}</strong>
              <span>Discord account</span>
            </div>
          </div>
          <a className="sidebar-link" href="/api/auth/logout">Sign out</a>
        </div>
      </aside>

      <div className={'scrim ' + (mobileOpen ? 'visible' : '')} onClick={() => setMobileOpen(false)} />

      <main className="main">
        <header className="topbar">
          <button className="hamburger" aria-label="Open navigation" onClick={() => setMobileOpen(true)}>
            <span /><span /><span />
          </button>

          <div className="server-picker-wrap">
            <label htmlFor="server-picker">Server</label>
            <select
              id="server-picker"
              value={guildId}
              onChange={(event) => { window.location.href = '/dashboard/' + event.target.value; }}
            >
              {state.guilds.map((guild) => <option key={guild.id} value={guild.id}>{guild.name}</option>)}
            </select>
          </div>

          <div className="topbar-right">
            <span className={'status-dot ' + (state.data.bot?.ready ? 'online' : '')} />
            <span>{state.data.bot?.ready ? 'Cloudy online' : 'Cloudy offline'}</span>
          </div>
        </header>

        <div className="content">
          {message && <div className={'toast ' + message.type}>{message.text}</div>}

          <div className="page-heading">
            <div>
              <p className="eyebrow">SERVER CONTROL</p>
              <h1>{currentGuild?.name || state.data.guild?.name || 'Server'}</h1>
              <p className="muted">Configure Cloudy without editing files.</p>
            </div>
            <div className="server-meta">
              {state.data.guild?.icon
                ? <img src={state.data.guild.icon} alt="" />
                : <div className="server-fallback">C</div>}
              <span>{state.data.guild?.memberCount || 0} members</span>
            </div>
          </div>

          {section === 'overview' && <Overview settings={settings} state={state.data} />}
          {section === 'general' && <General settings={settings} resources={resources} onSave={save} />}
          {section === 'tickets' && <Tickets settings={settings} resources={resources} onSave={save} />}
          {section === 'security' && <Security settings={settings} onSave={save} />}
          {section === 'automod' && <AutoMod settings={settings} onSave={save} />}
          {section === 'moderation' && <Moderation settings={settings} />}
          {section === 'data' && <AdvancedData settings={settings} onSave={saveAllData} />}
        </div>
      </main>
    </div>
  );
}

function Card({ title, description, children }) {
  return (
    <section className="panel">
      <div className="panel-head">
        <div>
          <h2>{title}</h2>
          {description && <p className="muted">{description}</p>}
        </div>
      </div>
      <div className="panel-body">{children}</div>
    </section>
  );
}

function Toggle({ label, description, checked, onChange }) {
  return (
    <label className="toggle-row">
      <span>
        <strong>{label}</strong>
        <small>{description}</small>
      </span>
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />
      <span className="toggle" aria-hidden="true"><span /></span>
    </label>
  );
}

function Field({ label, hint, children }) {
  return (
    <div className="field">
      <label>{label}</label>
      {children}
      {hint && <small>{hint}</small>}
    </div>
  );
}

function Select({ value, onChange, options, placeholder = 'Not configured' }) {
  return (
    <select value={value || ''} onChange={(event) => onChange(event.target.value || null)}>
      <option value="">{placeholder}</option>
      {options.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
    </select>
  );
}

function Overview({ settings, state }) {
  const activeWarnings = Object.values(settings.warnings || {}).reduce(
    (total, list) => total + list.filter((item) => item.active).length,
    0
  );
  const historyCount = (settings.history || []).length;
  const ticketCount = Object.keys(settings.tickets || {}).length;

  return (
    <div className="stack">
      <div className="stats-grid">
        <Stat label="Prefix" value={settings.prefix} code />
        <Stat label="Active warnings" value={activeWarnings} />
        <Stat label="History records" value={historyCount} />
        <Stat label="Ticket records" value={ticketCount} />
      </div>

      <div className="two-col">
        <Card title="Cloudy status" description="Current connection information.">
          <div className="summary-list">
            <Summary label="Bot" value={state.bot?.tag || 'Unknown'} />
            <Summary label="Status" value={state.bot?.ready ? 'Online' : 'Offline'} />
            <Summary label="Stored prefix" value={settings.prefix} code />
            <Summary label="Native AutoMod" value={settings.automod?.enabled ? 'Enabled' : 'Disabled'} />
          </div>
        </Card>

        <Card title="Security" description="Current protection switches.">
          <div className="summary-list">
            <Summary label="Anti-spam" value={settings.security.antiSpam ? 'Enabled' : 'Disabled'} />
            <Summary label="Anti-raid" value={settings.security.antiRaid ? 'Enabled' : 'Disabled'} />
            <Summary label="Anti-link" value={settings.security.antiLink ? 'Enabled' : 'Disabled'} />
          </div>
        </Card>
      </div>
    </div>
  );
}

function Stat({ label, value, code }) {
  return <div className="stat-card"><span>{label}</span><strong className={code ? 'mono' : ''}>{value}</strong></div>;
}

function Summary({ label, value, code }) {
  return <div className="summary-row"><span>{label}</span><strong className={code ? 'mono' : ''}>{value}</strong></div>;
}

function General({ settings, resources, onSave }) {
  const [prefix, setPrefix] = useState(settings.prefix);
  const [channelId, setChannelId] = useState(settings.welcome.channelId);
  const [welcomeMessage, setWelcomeMessage] = useState(settings.welcome.message);
  const [logsChannelId, setLogsChannelId] = useState(settings.logsChannelId);

  return (
    <div className="stack">
      <Card title="Prefix" description="The default prefix is ?. Changes are stored per server.">
        <div className="form-grid">
          <Field label="Prefix" hint="1 to 5 non-space characters.">
            <input value={prefix} maxLength={5} onChange={(event) => setPrefix(event.target.value)} />
          </Field>
        </div>
        <SaveButton onClick={() => onSave({ prefix })} />
      </Card>

      <Card title="Welcome messages" description="Choose the channel and content Cloudy sends when a member joins.">
        <div className="form-grid">
          <Field label="Welcome channel">
            <Select value={channelId} onChange={setChannelId} options={resources.channels.filter((c) => c.type === 0)} />
          </Field>
          <Field label="Message" hint="Available placeholders: {user}, {username}, {server}, {count}.">
            <textarea rows={5} value={welcomeMessage} onChange={(event) => setWelcomeMessage(event.target.value)} />
          </Field>
        </div>
        <SaveButton onClick={() => onSave({ welcome: { channelId, message: welcomeMessage } })} />
      </Card>

      <Card title="Moderation logs" description="Cloudy sends moderation and security events to this channel.">
        <Field label="Log channel">
          <Select value={logsChannelId} onChange={setLogsChannelId} options={resources.channels.filter((c) => c.type === 0)} />
        </Field>
        <SaveButton onClick={() => onSave({ logsChannelId })} />
      </Card>
    </div>
  );
}

function Tickets({ settings, resources, onSave }) {
  const [panelChannelId, setPanelChannelId] = useState(settings.ticket.panelChannelId);
  const [categoryId, setCategoryId] = useState(settings.ticket.categoryId);
  const [supportRoleId, setSupportRoleId] = useState(settings.ticket.supportRoleId);

  return (
    <div className="stack">
      <Card title="Ticket system" description="Set where the panel lives and where private ticket channels are created.">
        <div className="form-grid">
          <Field label="Panel channel">
            <Select value={panelChannelId} onChange={setPanelChannelId} options={resources.channels.filter((c) => c.type === 0)} />
          </Field>
          <Field label="Ticket category">
            <Select value={categoryId} onChange={setCategoryId} options={resources.channels.filter((c) => c.type === 4)} />
          </Field>
          <Field label="Support role">
            <Select value={supportRoleId} onChange={setSupportRoleId} options={resources.roles} />
          </Field>
        </div>
        <SaveButton onClick={() => onSave({ ticket: { panelChannelId, categoryId, supportRoleId } })} />
        <div className="note">
          Changing the stored panel channel does not automatically move an already-sent panel message. Use Cloudy's ticket setup command when you need to recreate the panel.
        </div>
      </Card>
    </div>
  );
}

function Security({ settings, onSave }) {
  const current = settings.security;
  const [antiSpam, setAntiSpam] = useState(current.antiSpam);
  const [antiRaid, setAntiRaid] = useState(current.antiRaid);
  const [antiLink, setAntiLink] = useState(current.antiLink);
  const [spamLimit, setSpamLimit] = useState(current.spamLimit);
  const [spamWindow, setSpamWindow] = useState(Math.round(current.spamWindowMs / 1000));
  const [raidJoins, setRaidJoins] = useState(current.raidJoins);
  const [raidWindow, setRaidWindow] = useState(Math.round(current.raidWindowMs / 1000));

  return (
    <div className="stack">
      <Card title="Protection" description="Cloudy's application-level security filters.">
        <div className="toggle-list">
          <Toggle label="Anti-spam" description="Deletes repeated messages and may apply a temporary timeout." checked={antiSpam} onChange={setAntiSpam} />
          <Toggle label="Anti-raid" description="Tracks bursts of joins and restricts new members while raid mode is active." checked={antiRaid} onChange={setAntiRaid} />
          <Toggle label="Anti-link / invite protection" description="Deletes links and invites from non-moderators." checked={antiLink} onChange={setAntiLink} />
        </div>
      </Card>

      <Card title="Anti-spam threshold" description="Controls how many messages trigger the protection.">
        <div className="form-grid three">
          <Field label="Messages">
            <input type="number" min="3" max="20" value={spamLimit} onChange={(event) => setSpamLimit(Number(event.target.value))} />
          </Field>
          <Field label="Window (seconds)">
            <input type="number" min="3" max="30" value={spamWindow} onChange={(event) => setSpamWindow(Number(event.target.value))} />
          </Field>
        </div>
      </Card>

      <Card title="Anti-raid threshold" description="Controls when Cloudy enters raid mode.">
        <div className="form-grid three">
          <Field label="Joins">
            <input type="number" min="3" max="50" value={raidJoins} onChange={(event) => setRaidJoins(Number(event.target.value))} />
          </Field>
          <Field label="Window (seconds)">
            <input type="number" min="5" max="60" value={raidWindow} onChange={(event) => setRaidWindow(Number(event.target.value))} />
          </Field>
        </div>
      </Card>

      <div className="sticky-save">
        <button
          className="button button-primary"
          onClick={() => onSave({
            security: {
              antiSpam,
              antiRaid,
              antiLink,
              spamLimit,
              spamWindowMs: spamWindow * 1000,
              raidJoins,
              raidWindowMs: raidWindow * 1000
            }
          })}
        >
          Save security
        </button>
      </div>
    </div>
  );
}

function AutoMod({ settings, onSave }) {
  const [enabled, setEnabled] = useState(Boolean(settings.automod?.enabled));

  return (
    <div className="stack">
      <Card title="Discord native AutoMod" description="Cloudy can manage Discord's native AutoMod rules for spam, mention spam, and keyword presets.">
        <Toggle label="Native AutoMod" description="Cloudy will create or remove its native AutoMod rules." checked={enabled} onChange={setEnabled} />
        <div className="note">Saving here synchronizes Cloudy's stored state and the actual Discord AutoMod rules.</div>
        <SaveButton onClick={() => onSave({ automod: { enabled } })} />
      </Card>

      <Card title="Managed rules" description="Rules created by Cloudy when AutoMod is enabled.">
        <div className="summary-list">
          <Summary label="State" value={enabled ? 'Enabled' : 'Disabled'} />
          <Summary label="Rule IDs" value={settings.automod?.ruleIds?.length || 0} />
        </div>
      </Card>
    </div>
  );
}

function Moderation({ settings }) {
  const warnings = Object.entries(settings.warnings || {}).flatMap(([userId, list]) =>
    list.map((item) => ({ ...item, userId }))
  ).sort((a, b) => b.createdAt - a.createdAt);

  const history = [...(settings.history || [])].sort((a, b) => b.timestamp - a.timestamp).slice(0, 50);

  const stats = Object.entries(settings.stats || {}).map(([userId, actions]) => ({
    userId,
    total: Object.values(actions).reduce((sum, count) => sum + count, 0),
    actions
  })).sort((a, b) => b.total - a.total);

  return (
    <div className="stack">
      <Card title="Warnings" description="Stored warning records. Use Cloudy's moderation commands to issue or deactivate warnings.">
        {warnings.length ? (
          <div className="table-wrap"><table><thead><tr><th>User</th><th>Warning</th><th>Reason</th><th>State</th></tr></thead><tbody>
            {warnings.slice(0, 50).map((warning) => (
              <tr key={warning.id}>
                <td className="mono">{warning.userId}</td>
                <td className="mono">{warning.id}</td>
                <td>{warning.reason}</td>
                <td><span className={'badge ' + (warning.active ? 'good' : 'neutral')}>{warning.active ? 'Active' : 'Inactive'}</span></td>
              </tr>
            ))}
          </tbody></table></div>
        ) : <Empty text="No warning records." />}
      </Card>

      <Card title="Moderation history" description="The latest 50 stored actions.">
        {history.length ? (
          <div className="table-wrap"><table><thead><tr><th>Action</th><th>Target</th><th>Moderator</th><th>Reason</th></tr></thead><tbody>
            {history.map((item) => (
              <tr key={item.id}>
                <td className="mono">{item.type}</td>
                <td className="mono">{item.targetId}</td>
                <td className="mono">{item.moderatorId}</td>
                <td>{item.reason}</td>
              </tr>
            ))}
          </tbody></table></div>
        ) : <Empty text="No moderation history." />}
      </Card>

      <Card title="Moderator statistics" description="Counters stored by Cloudy for each moderator or system action.">
        {stats.length ? (
          <div className="table-wrap"><table><thead><tr><th>Moderator</th><th>Total</th><th>Breakdown</th></tr></thead><tbody>
            {stats.map((item) => (
              <tr key={item.userId}>
                <td className="mono">{item.userId}</td>
                <td>{item.total}</td>
                <td>{Object.entries(item.actions).map(([name, count]) => name + ': ' + count).join(' · ')}</td>
              </tr>
            ))}
          </tbody></table></div>
        ) : <Empty text="No moderation statistics yet." />}
      </Card>
    </div>
  );
}

function AdvancedData({ settings, onSave }) {
  const [value, setValue] = useState(JSON.stringify(settings, null, 2));
  const [confirm, setConfirm] = useState(false);

  useEffect(() => setValue(JSON.stringify(settings, null, 2)), [settings]);

  return (
    <div className="stack">
      <Card title="Advanced data editor" description="Edit the complete stored guild object used by Cloudy.">
        <div className="danger-note">
          This is an advanced control. Invalid or destructive changes can affect moderation records and configuration. Keep a backup before changing raw data.
        </div>
        <textarea className="json-editor" value={value} onChange={(event) => setValue(event.target.value)} spellCheck="false" />
        <div className="editor-actions">
          <button className="button button-secondary" onClick={() => setValue(JSON.stringify(settings, null, 2))}>Reset editor</button>
          <button className="button button-primary" onClick={() => setConfirm(true)}>Save raw data</button>
        </div>
      </Card>

      {confirm && (
        <div className="confirm-panel">
          <div>
            <strong>Save the complete guild object?</strong>
            <p className="muted">This replaces Cloudy's stored guild data after basic validation.</p>
          </div>
          <div className="inline-actions">
            <button className="button button-secondary" onClick={() => setConfirm(false)}>Cancel</button>
            <button className="button button-danger" onClick={async () => { setConfirm(false); await onSave(value); }}>Replace data</button>
          </div>
        </div>
      )}
    </div>
  );
}

function SaveButton({ onClick }) {
  return <div className="save-row"><button className="button button-primary" onClick={onClick}>Save changes</button></div>;
}

function Empty({ text }) {
  return <div className="empty-inline">{text}</div>;
}
