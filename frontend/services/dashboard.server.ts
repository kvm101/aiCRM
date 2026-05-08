import { serverFetch } from './serverApiClient';

export interface DashboardStat {
  title: string;
  value: string;
  change: string;
  trend: 'up' | 'down';
}

export interface DashboardData {
  stats: DashboardStat[];
}

interface BackendDashboardStats {
  totalContacts: number;
  totalTasks: number;
  openChats: number;
}

/**
 * BFF Aggregation Service for the Dashboard.
 * Fetches real data from the backend /dashboard/stats endpoint
 * and transforms it into a format suitable for the frontend UI.
 */
export async function getDashboardStats(): Promise<DashboardData> {
  try {
    const backendStats = await serverFetch<BackendDashboardStats>('/dashboard/stats');

    const stats: DashboardStat[] = [
      {
        title: "Total Contacts",
        value: backendStats.totalContacts.toLocaleString(),
        change: "+12%", // TODO: calculate from historical data
        trend: "up",
      },
      {
        title: "Active Tasks",
        value: backendStats.totalTasks.toLocaleString(),
        change: "+5",
        trend: "up",
      },
      {
        title: "Open Chats",
        value: backendStats.openChats.toLocaleString(),
        change: backendStats.openChats > 0 ? `${backendStats.openChats}` : "0",
        trend: backendStats.openChats > 5 ? "up" : "down",
      },
    ];

    return { stats };
  } catch (error) {
    console.error("BFF Dashboard aggregation failed, using fallback:", error);
    // Fallback data when backend is unavailable
    return {
      stats: [
        { title: "Total Contacts", value: "N/A", change: "0%", trend: "up" },
        { title: "Active Tasks", value: "N/A", change: "0%", trend: "up" },
        { title: "Open Chats", value: "N/A", change: "0", trend: "down" },
      ],
    };
  }
}
