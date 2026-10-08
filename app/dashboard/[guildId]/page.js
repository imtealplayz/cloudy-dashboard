import DashboardClient from './DashboardClient';

export default async function GuildDashboardPage({ params }) {
  const { guildId } = await params;
  return <DashboardClient guildId={guildId} />;
}
