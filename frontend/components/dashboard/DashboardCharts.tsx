"use client";

import React, { useMemo, useState, useEffect } from "react";
import Link from "next/link";
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
import { Loader2, TrendingUp, Target, DollarSign, Settings2, FileBarChart } from "lucide-react";
import { useFunnelAnalytics, useGoalsAnalytics, useUpdateGoalsAnalytics } from "@/hooks/useSales";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const STATUS_MAP: Record<string, string> = {
  NEW: "Нові",
  QUALIFICATION: "Кваліфікація",
  DELIVERY: "Доставка",
  DONE: "Виконано",
  LOST: "Програно",
};

const COLORS = ["#6366f1", "#0ea5e9", "#f59e0b", "#10b981", "#ef4444"];

export function DashboardCharts() {
  const { data: funnelData, isLoading: isFunnelLoading } = useFunnelAnalytics();
  const { data: goalsData, isLoading: isGoalsLoading } = useGoalsAnalytics();
  const updateGoalsMutation = useUpdateGoalsAnalytics();

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [targetRevenueStr, setTargetRevenueStr] = useState("");
  const [currency, setCurrency] = useState("USD");

  useEffect(() => {
    if (goalsData) {
      setTargetRevenueStr(goalsData.targetRevenue.toString());
      setCurrency(goalsData.currency || "USD");
    }
  }, [goalsData]);

  const handleSaveGoals = async () => {
    await updateGoalsMutation.mutateAsync({
      targetRevenue: targetRevenueStr,
      currency: currency,
    });
    setIsEditModalOpen(false);
  };

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
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
      </div>
    );
  }

  const currencySymbol = currency === "USD" ? "$" : currency === "EUR" ? "€" : currency === "GBP" ? "£" : "₴";

  const currentMonth = new Date().toLocaleString('uk-UA', { month: 'long' });

  return (
    <div className="space-y-6 mt-6">
      {/* KPI Goals Cards */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold tracking-tight">Цілі на {currentMonth}</h2>
        <Button variant="outline" size="sm" onClick={() => setIsEditModalOpen(true)}>
          <Settings2 className="mr-2 h-4 w-4" />
          Налаштувати ціль
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-zinc-500">Дохід за {currentMonth}</CardTitle>
            <DollarSign className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{currencySymbol}{goalsData?.achievedRevenue?.toLocaleString() || 0}</div>
            <p className="text-xs text-zinc-500 mt-1">
              Виграні угоди за поточний місяць (у {currency})
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-zinc-500">Ціль на {currentMonth}</CardTitle>
            <Target className="h-4 w-4 text-indigo-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{currencySymbol}{goalsData?.targetRevenue?.toLocaleString() || 0}</div>
            <div className="w-full bg-zinc-200 dark:bg-zinc-800 h-2 rounded-full mt-3 overflow-hidden">
              <div 
                className="bg-indigo-500 h-full rounded-full transition-all duration-1000 ease-in-out" 
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
            <p className="text-xs text-zinc-500 mt-2">
              Набрано {currencySymbol}{goalsData?.achievedRevenue?.toLocaleString() || 0} з {currencySymbol}{goalsData?.targetRevenue?.toLocaleString() || 0} ({progressPercentage}%)
            </p>
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
              Місячний план виконання
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Воронка продажів (Угоди)</CardTitle>
            <CardDescription>Розподіл угод за статусами</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px] min-w-0 min-h-[300px]">
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
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

        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Структура угод</CardTitle>
            <CardDescription>Частка кожного статусу</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px] flex items-center justify-center min-w-0 min-h-[300px]">
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
              <PieChart>
                <Pie
                  data={formattedFunnelData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
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

      <Card className="border-indigo-200/70 dark:border-indigo-900/50 bg-gradient-to-br from-indigo-50/90 via-white to-white dark:from-indigo-950/35 dark:via-zinc-950 dark:to-zinc-950 shadow-sm">
        <CardContent className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-6">
          <div className="space-y-1">
            <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
              Звіти та експорт даних
            </h3>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 max-w-xl">
              Створюйте CSV у фоні (черга) — воронка, угоди, клієнти. Завантажуйте файли, коли статус стане Completed.
            </p>
          </div>
          <Button asChild className="bg-indigo-600 hover:bg-indigo-700 text-white shrink-0 w-full sm:w-auto gap-2">
            <Link href="/reports">
              <FileBarChart className="h-4 w-4" />
              Звіти
            </Link>
          </Button>
        </CardContent>
      </Card>

      {/* Edit Goals Dialog */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Налаштування фінансових цілей</DialogTitle>
            <DialogDescription>
              Оберіть базову валюту для розрахунку доходу. Всі угоди в інших валютах будуть автоматично конвертовані.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="revenue" className="text-right">
                Цільова сума
              </Label>
              <Input
                id="revenue"
                type="number"
                value={targetRevenueStr}
                onChange={(e) => setTargetRevenueStr(e.target.value)}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="currency" className="text-right">
                Базова Валюта
              </Label>
              <div className="col-span-3">
                <Select value={currency} onValueChange={setCurrency}>
                  <SelectTrigger>
                    <SelectValue placeholder="Оберіть валюту" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">Долар (USD)</SelectItem>
                    <SelectItem value="EUR">Євро (EUR)</SelectItem>
                    <SelectItem value="GBP">Фунт (GBP)</SelectItem>
                    <SelectItem value="UAH">Гривня (UAH)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button 
              type="button" 
              onClick={handleSaveGoals} 
              disabled={updateGoalsMutation.isPending || !targetRevenueStr}
            >
              {updateGoalsMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Зберегти зміни
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
