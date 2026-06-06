import { getDashboardStats } from "@/services/dashboard.server";
import { DashboardGreeting } from "@/components/DashboardGreeting";
import { DashboardCharts } from "@/components/dashboard/DashboardCharts";
import { DashboardStatTiles } from "@/components/dashboard/DashboardStatTiles";

// Server Component
export const dynamic = 'force-dynamic';
export default async function Dashboard() {
  const dashboardData = await getDashboardStats();

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-10">
      <DashboardGreeting />
      <DashboardStatTiles stats={dashboardData.stats} />
      <DashboardCharts />
    </div>
  );
}
