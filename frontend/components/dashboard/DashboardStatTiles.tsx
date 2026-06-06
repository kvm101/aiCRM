"use client";

import { useLanguageStore } from "@/store/useLanguageStore";
import { t } from "@/lib/i18n";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, ListTodo, MessageSquare, Activity, Briefcase, Trophy, BellRing } from "lucide-react";
import type { DashboardStat } from "@/services/dashboard.server";

const ICONS: Record<string, React.ElementType> = {
  users: Users,
  tasks: ListTodo,
  chats: MessageSquare,
  unread: BellRing,
  deals: Briefcase,
  won: Trophy,
};

function buildTile(stat: DashboardStat, tr: ReturnType<typeof t>) {
  const { iconKey, value, rawData, trend } = stat;
  const isUp = trend === "up";

  switch (iconKey) {
    case "users":
      return {
        title: tr.stats.users.title,
        value: value.toLocaleString(),
        change: tr.stats.users.change(rawData.total ?? value),
      };
    case "tasks":
      return {
        title: tr.stats.tasks.title,
        value: value.toLocaleString(),
        change: tr.stats.tasks.change,
      };
    case "chats":
      return {
        title: tr.stats.chats.title,
        value: value.toLocaleString(),
        change: value > 0 ? tr.stats.chats.active(rawData.openChats ?? value) : tr.stats.chats.none,
      };
    case "unread":
      return {
        title: tr.stats.unread.title,
        value: value.toLocaleString(),
        change: value > 0 ? tr.stats.unread.attention : tr.stats.unread.allRead,
      };
    case "deals":
      return {
        title: tr.stats.deals.title,
        value: value.toLocaleString(),
        change: tr.stats.deals.active(rawData.active ?? 0),
      };
    case "won": {
      const total = rawData.total ?? 0;
      const pct = total > 0 ? Math.round(((rawData.won ?? 0) / total) * 100) : 0;
      return {
        title: tr.stats.won.title,
        value: value.toLocaleString(),
        change: total > 0 ? tr.stats.won.winRate(pct) : tr.stats.won.zero,
      };
    }
    default:
      return { title: iconKey, value: value.toLocaleString(), change: "" };
  }
}

interface Props {
  stats: DashboardStat[];
}

export function DashboardStatTiles({ stats }: Props) {
  const { lang } = useLanguageStore();
  const tr = t(lang);

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {stats.map((stat, i) => {
        const Icon = ICONS[stat.iconKey] ?? Activity;
        const tile = buildTile(stat, tr);
        const isUp = stat.trend === "up";
        return (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                {tile.title}
              </CardTitle>
              <Icon className={`h-4 w-4 ${isUp ? "text-indigo-500" : "text-zinc-400"}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
                {tile.value}
              </div>
              <p className="text-xs text-zinc-500 mt-1">{tile.change}</p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
