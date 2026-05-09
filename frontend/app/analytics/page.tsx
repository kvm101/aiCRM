"use client";

import React, { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { Loader2, TrendingUp, Target, DollarSign } from "lucide-react";
import { useFunnelAnalytics, useGoalsAnalytics } from "@/hooks/useSales";

const STATUS_MAP: Record<string, string> = {
  NEW: "Нові",
  QUALIFICATION: "Кваліфікація",
  DELIVERY: "Доставка",
  DONE: "Виконано",
  LOST: "Програно",
};

const COLORS = ["#6366f1", "#0ea5e9", "#f59e0b", "#10b981", "#ef4444"];

export default function AnalyticsPage() {
  const { data: funnelData, isLoading: isFunnelLoading } = useFunnelAnalytics();
  const { data: goalsData, isLoading: isGoalsLoading } = useGoalsAnalytics();

  const formattedFunnelData = useMemo(() => {
    if (!funnelData) return [];
    return Object.entries(funnelData).map(([key, value], index) => ({
      name: STATUS_MAP[key] || key,
      value: value,
      fill: COLORS[index % COLORS.length]
    }));
  }, [funnelData]);

  const progressPercentage = useMemo(() => {
    if (!goalsData || goalsData.targetRevenue === 0) return 0;
    return Math.min(100, Math.round((goalsData.achievedRevenue / goalsData.targetRevenue) * 100));
  }, [goalsData]);

  const isLoading = isFunnelLoading || isGoalsLoading;

  if (isLoading) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-zinc-400" />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-10">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">Аналітика</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">Огляд ключових показників вашого бізнесу.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-zinc-500">Дохід (Виконано)</CardTitle>
            <DollarSign className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${goalsData?.achievedRevenue?.toLocaleString() || 0}</div>
            <p className="text-xs text-zinc-500 mt-1">
              Реальний дохід з успішних угод
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-zinc-500">Цільовий дохід</CardTitle>
            <Target className="h-4 w-4 text-indigo-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${goalsData?.targetRevenue?.toLocaleString() || 0}</div>
            <div className="w-full bg-zinc-200 dark:bg-zinc-800 h-2 rounded-full mt-3 overflow-hidden">
              <div 
                className="bg-indigo-500 h-full rounded-full transition-all duration-1000 ease-in-out" 
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-zinc-500">Виконання плану</CardTitle>
            <TrendingUp className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{progressPercentage}%</div>
            <p className="text-xs text-zinc-500 mt-1">
              Відношення реального доходу до цілі
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Funnel Chart */}
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Воронка продажів (Угоди)</CardTitle>
            <CardDescription>Розподіл угод за статусами</CardDescription>
          </CardHeader>
          <CardContent className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={formattedFunnelData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e4e4e7" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#71717a', fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#71717a', fontSize: 12 }} />
                <RechartsTooltip 
                  cursor={{ fill: 'rgba(0,0,0,0.05)' }}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {formattedFunnelData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Status Distribution Pie Chart */}
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Структура угод</CardTitle>
            <CardDescription>Частка кожного статусу</CardDescription>
          </CardHeader>
          <CardContent className="h-[400px] flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={formattedFunnelData}
                  cx="50%"
                  cy="50%"
                  innerRadius={80}
                  outerRadius={120}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {formattedFunnelData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <RechartsTooltip 
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
