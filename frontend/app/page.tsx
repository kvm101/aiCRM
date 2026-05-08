import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, ListTodo, MessageSquare, Activity } from "lucide-react";
import { getDashboardStats } from "@/services/dashboard.server";
import { DashboardGreeting } from "@/components/DashboardGreeting";

// Server Component
export default async function Dashboard() {
  // BFF pattern: Fetch aggregated data directly on the server
  const dashboardData = await getDashboardStats();

  const getIcon = (title: string) => {
    switch (title) {
      case "Total Contacts": return Users;
      case "Active Tasks": return ListTodo;
      case "Open Chats": return MessageSquare;
      default: return Activity;
    }
  };

  return (
    <div className="space-y-6">
      <DashboardGreeting />

      <div className="grid gap-6 md:grid-cols-3">
        {dashboardData.stats.map((stat, i) => {
          const Icon = getIcon(stat.title);
          const isUp = stat.trend === "up";
          
          return (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                  {stat.title}
                </CardTitle>
                <Icon className="h-4 w-4 text-zinc-500 dark:text-zinc-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
                  {stat.value}
                </div>
                <p className={`text-xs ${isUp ? "text-green-500" : "text-red-500"}`}>
                  {stat.change} from last month
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
