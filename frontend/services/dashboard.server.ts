import { serverFetch } from './serverApiClient';

export interface DashboardStat {
  iconKey: string; // 'users' | 'tasks' | 'chats' | 'unread' | 'deals' | 'won'
  value: number;
  rawData: Record<string, number>; // raw numbers for client-side i18n formatting
  trend: 'up' | 'down';
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
 * Returns raw numeric data — client translates labels via i18n.
 */
export async function getDashboardStats(): Promise<DashboardData> {
  try {
    const s = await serverFetch<BackendDashboardStats>('/dashboard/stats');

    const stats: DashboardStat[] = [
      {
        iconKey: 'users',
        value: s.totalContacts,
        rawData: { total: s.totalContacts },
        trend: 'up',
      },
      {
        iconKey: 'tasks',
        value: s.totalTasks,
        rawData: { total: s.totalTasks },
        trend: 'up',
      },
      {
        iconKey: 'chats',
        value: s.openChats,
        rawData: { openChats: s.openChats },
        trend: s.openChats > 0 ? 'up' : 'down',
      },
      {
        iconKey: 'unread',
        value: s.unreadMessages,
        rawData: { unread: s.unreadMessages },
        trend: s.unreadMessages > 0 ? 'up' : 'down',
      },
      {
        iconKey: 'deals',
        value: s.totalDeals,
        rawData: { total: s.totalDeals, active: s.activeDeals },
        trend: 'up',
      },
      {
        iconKey: 'won',
        value: s.wonDeals,
        rawData: { won: s.wonDeals, total: s.totalDeals },
        trend: s.wonDeals > 0 ? 'up' : 'down',
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
    console.error('BFF Dashboard aggregation failed:', error);
    return {
      stats: [
        { iconKey: 'users',  value: 0, rawData: { total: 0 }, trend: 'up' },
        { iconKey: 'tasks',  value: 0, rawData: { total: 0 }, trend: 'up' },
        { iconKey: 'chats',  value: 0, rawData: { openChats: 0 }, trend: 'down' },
        { iconKey: 'unread', value: 0, rawData: { unread: 0 }, trend: 'down' },
        { iconKey: 'deals',  value: 0, rawData: { total: 0, active: 0 }, trend: 'up' },
        { iconKey: 'won',    value: 0, rawData: { won: 0, total: 0 }, trend: 'down' },
      ],
      totalDeals: 0,
      activeDeals: 0,
      wonDeals: 0,
      unreadMessages: 0,
    };
  }
}
