import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, ListTodo, MessageSquare, Activity, Briefcase, Trophy, BellRing } from "lucide-react";
import { getDashboardStats } from "@/services/dashboard.server";
import { DashboardGreeting } from "@/components/DashboardGreeting";
import { DashboardCharts } from "@/components/dashboard/DashboardCharts";

// Server Component
export const dynamic = 'force-dynamic'; // Завжди SSR, без кешування
export default async function Dashboard() {
  // BFF pattern: Fetch aggregated data directly on the server
  const dashboardData = await getDashboardStats();

  const getIcon = (iconKey: string) => {
    switch (iconKey) {
      case "users": return Users;
      case "tasks": return ListTodo;
      case "chats": return MessageSquare;
      case "unread": return BellRing;
      case "deals": return Briefcase;
      case "won": return Trophy;
      default: return Activity;
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      <DashboardGreeting />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {dashboardData.stats.map((stat, i) => {
          const Icon = getIcon(stat.icon);
          const isUp = stat.trend === "up";
          
          return (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                  {stat.title}
                </CardTitle>
                <Icon className={`h-4 w-4 ${isUp ? "text-indigo-500" : "text-zinc-400"}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
                  {stat.value}
                </div>
                <p className="text-xs text-zinc-500 mt-1">
                  {stat.change}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Analytics Charts Component */}
      <DashboardCharts />
    </div>
  );
}
