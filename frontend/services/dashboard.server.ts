import { serverFetch } from './serverApiClient';

export interface DashboardStat {
  title: string;
  value: string;
  change: string;
  trend: 'up' | 'down';
  icon: string; // ключ для іконки
}

export interface DashboardData {
  stats: DashboardStat[];
  totalDeals: number;
  activeDeals: number;
  wonDeals: number;
  unreadMessages: number;
}

interface BackendDashboardStats {
  totalContacts: number;
  totalTasks: number;
  openChats: number;
  totalDeals: number;
  activeDeals: number;
  wonDeals: number;
  unreadMessages: number;
}

/**
 * BFF Aggregation Service for the Dashboard.
 * Fetches real data from the backend /dashboard/stats endpoint.
 */
export async function getDashboardStats(): Promise<DashboardData> {
  try {
    const s = await serverFetch<BackendDashboardStats>('/dashboard/stats');

    const stats: DashboardStat[] = [
      {
        title: "Контакти",
        value: s.totalContacts.toLocaleString(),
        change: `${s.totalContacts} загалом`,
        trend: "up",
        icon: "users",
      },
      {
        title: "Активні задачі",
        value: s.totalTasks.toLocaleString(),
        change: "на Kanban-дошці",
        trend: "up",
        icon: "tasks",
      },
      {
        title: "Відкриті чати",
        value: s.openChats.toLocaleString(),
        change: s.openChats > 0 ? `${s.openChats} активних` : "Немає активних",
        trend: s.openChats > 0 ? "up" : "down",
        icon: "chats",
      },
      {
        title: "Непрочитані повідомлення",
        value: s.unreadMessages.toLocaleString(),
        change: s.unreadMessages > 0 ? "Потребують уваги" : "Все прочитано",
        trend: s.unreadMessages > 0 ? "up" : "down",
        icon: "unread",
      },
      {
        title: "Усього угод",
        value: s.totalDeals.toLocaleString(),
        change: `${s.activeDeals} активних`,
        trend: "up",
        icon: "deals",
      },
      {
        title: "Виграні угоди",
        value: s.wonDeals.toLocaleString(),
        change: s.totalDeals > 0 ? `${Math.round((s.wonDeals / s.totalDeals) * 100)}% win rate` : "0%",
        trend: s.wonDeals > 0 ? "up" : "down",
        icon: "won",
      },
    ];

    return {
      stats,
      totalDeals: s.totalDeals,
      activeDeals: s.activeDeals,
      wonDeals: s.wonDeals,
      unreadMessages: s.unreadMessages,
    };
  } catch (error) {
    console.error("BFF Dashboard aggregation failed:", error);
    return {
      stats: [
        { title: "Контакти", value: "N/A", change: "—", trend: "up", icon: "users" },
        { title: "Активні задачі", value: "N/A", change: "—", trend: "up", icon: "tasks" },
        { title: "Відкриті чати", value: "N/A", change: "—", trend: "down", icon: "chats" },
        { title: "Непрочитані повідомлення", value: "N/A", change: "—", trend: "down", icon: "unread" },
        { title: "Усього угод", value: "N/A", change: "—", trend: "up", icon: "deals" },
        { title: "Виграні угоди", value: "N/A", change: "—", trend: "down", icon: "won" },
      ],
      totalDeals: 0,
      activeDeals: 0,
      wonDeals: 0,
      unreadMessages: 0,
    };
  }
}
