"use client";

import { useAuthStore } from "@/store/useAuthStore";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, DollarSign, Activity, MessageSquare } from "lucide-react";

export default function Dashboard() {
  const { currentUser } = useAuthStore();

  const stats = [
    { title: "Total Contacts", value: "2,543", icon: Users, change: "+12%" },
    { title: "Active Deals", value: "$45,231", icon: DollarSign, change: "+5.4%" },
    { title: "Open Chats", value: "12", icon: MessageSquare, change: "-2" },
    { title: "AI Suggestions Used", value: "843", icon: Activity, change: "+24%" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          Welcome back, {currentUser.name}
        </h1>
        <p className="text-zinc-500 dark:text-zinc-400 mt-2">
          Here's what's happening with your CRM today.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                {stat.title}
              </CardTitle>
              <stat.icon className="h-4 w-4 text-zinc-500 dark:text-zinc-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
                {stat.value}
              </div>
              <p className={`text-xs ${stat.change.startsWith("+") ? "text-green-500" : "text-red-500"}`}>
                {stat.change} from last month
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
