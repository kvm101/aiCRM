"use client";

import React, { useMemo, useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip as RechartsTooltip, ResponsiveContainer, Cell,
} from "recharts";
import { Loader2, TrendingUp, Target, DollarSign, Settings2, FileBarChart, Trophy, Layers } from "lucide-react";
import { useFunnelAnalytics, useGoalsAnalytics, useUpdateGoalsAnalytics, useDeals, useClients, useTasks } from "@/hooks/useSales";
import { useLanguageStore } from "@/store/useLanguageStore";
import { t } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogDescription,
  DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const COLORS = ["#6366f1", "#0ea5e9", "#f59e0b", "#10b981", "#ef4444"];
const CLIENT_COLORS: Record<string, string> = {
  NEW: "#6366f1",
  IN_WORK: "#0ea5e9",
  CLIENT: "#10b981",
  ARCHIVED: "#a1a1aa",
};

export function DashboardCharts() {
  const { lang } = useLanguageStore();
  const tr = t(lang);

  const { data: funnelData, isLoading: isFunnelLoading } = useFunnelAnalytics();
  const { data: goalsData, isLoading: isGoalsLoading } = useGoalsAnalytics();
  const { data: dealsData } = useDeals();
  const { data: clientsData } = useClients();
  const { data: tasksData } = useTasks();
  const updateGoalsMutation = useUpdateGoalsAnalytics();

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [targetRevenueStr, setTargetRevenueStr] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [targetPeriod, setTargetPeriod] = useState("MONTH");

  useEffect(() => {
    if (goalsData) {
      setTargetRevenueStr(goalsData.targetRevenue.toString());
      setCurrency(goalsData.currency || "USD");
      setTargetPeriod(goalsData.targetPeriod || "MONTH");
    }
  }, [goalsData]);

  const handleSaveGoals = async () => {
    await updateGoalsMutation.mutateAsync({ targetRevenue: targetRevenueStr, currency, targetPeriod });
    setIsEditModalOpen(false);
  };

  // ── Funnel (count by status) ──────────────────────────────────────────────
  const formattedFunnelData = useMemo(() => {
    if (!funnelData) return [];
    const order = ["NEW", "QUALIFICATION", "DELIVERY", "DONE", "LOST"];
    return order
      .filter((k) => k in funnelData)
      .map((k, i) => ({
        name: tr.dealStatus[k as keyof typeof tr.dealStatus] || k,
        value: funnelData[k],
        fill: COLORS[i % COLORS.length],
      }));
  }, [funnelData, lang]);

  // ── Pipeline Value (budget sum by status) ─────────────────────────────────
  const pipelineValue = useMemo(() => {
    if (!dealsData) return [];
    const order = ["NEW", "QUALIFICATION", "DELIVERY", "DONE", "LOST"];
    const map = new Map<string, number>();
    for (const deal of dealsData) {
      map.set(deal.status, (map.get(deal.status) ?? 0) + (deal.budget ?? 0));
    }
    return order
      .filter((s) => map.has(s))
      .map((s, i) => ({
        name: tr.dealStatus[s as keyof typeof tr.dealStatus] || s,
        value: map.get(s) ?? 0,
        fill: COLORS[i % COLORS.length],
      }));
  }, [dealsData, lang]);

  // ── Tasks overview (PLANNED / IN_WORK / DONE) ────────────────────────────
  const TASK_COLORS: Record<string, string> = {
    PLANNED: "#6366f1",
    IN_WORK: "#f59e0b",
    DONE: "#10b981",
  };
  const tasksOverview = useMemo(() => {
    if (!tasksData) return [];
    const order = ["PLANNED", "IN_WORK", "DONE"];
    const map = new Map<string, number>();
    for (const task of tasksData) map.set(task.tag, (map.get(task.tag) ?? 0) + 1);
    return order.map((tag) => ({
      name: tr.taskStatus[tag as keyof typeof tr.taskStatus] || tag,
      value: map.get(tag) ?? 0,
      fill: TASK_COLORS[tag],
    }));
  }, [tasksData, lang]);

  // ── Client status distribution ────────────────────────────────────────────
  const clientStatusData = useMemo(() => {
    if (!clientsData) return [];
    const order = ["NEW", "IN_WORK", "CLIENT", "ARCHIVED"];
    const map = new Map<string, number>();
    for (const c of clientsData) map.set(c.status, (map.get(c.status) ?? 0) + 1);
    return order
      .filter((s) => map.has(s))
      .map((s) => ({
        name: tr.clientStatus[s as keyof typeof tr.clientStatus] || s,
        value: map.get(s) ?? 0,
        fill: CLIENT_COLORS[s] ?? "#a1a1aa",
      }));
  }, [clientsData, lang]);

  // ── Extra KPIs ────────────────────────────────────────────────────────────
  const extraKpis = useMemo(() => {
    if (!dealsData) return null;
    const active = dealsData.filter((d) => d.status !== "DONE" && d.status !== "LOST");
    const pipelineTotal = active.reduce((s, d) => s + (d.budget ?? 0), 0);
    const avgDeal = dealsData.length ? Math.round(dealsData.reduce((s, d) => s + (d.budget ?? 0), 0) / dealsData.length) : 0;
    const done = dealsData.filter((d) => d.status === "DONE").length;
    const lost = dealsData.filter((d) => d.status === "LOST").length;
    const winPct = done + lost > 0 ? Math.round((done / (done + lost)) * 100) : null;
    return { pipelineTotal, avgDeal, winPct, done, closed: done + lost };
  }, [dealsData]);

  const progressPercentage = useMemo(() => {
    if (!goalsData || goalsData.targetRevenue === 0) return 0;
    return Math.min(100, Math.round((goalsData.achievedRevenue / goalsData.targetRevenue) * 100));
  }, [goalsData]);

  const currencySymbol = (c: string) =>
    c === "USD" ? "$" : c === "EUR" ? "€" : c === "GBP" ? "£" : "₴";
  const sym = currencySymbol(currency);
  const currentMonth = new Date().toLocaleString(lang === "ua" ? "uk-UA" : "en-US", { month: "long" });
  const fmt = (v: number) =>
    v >= 1_000_000 ? `${(v / 1_000_000).toFixed(1)}M` : v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v);

  if (isFunnelLoading || isGoalsLoading) {
    return <div className="flex h-64 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-zinc-400" /></div>;
  }

  return (
    <div className="space-y-6 mt-6">
      {/* ── Section header ── */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold tracking-tight">
          {tr.dashboard.goalsTitle} ({tr.goalsDialog.periods[goalsData?.targetPeriod as keyof typeof tr.goalsDialog.periods || 'MONTH']})
        </h2>
        <Button variant="outline" size="sm" onClick={() => setIsEditModalOpen(true)}>
          <Settings2 className="mr-2 h-4 w-4" />
          {tr.dashboard.configureGoal}
        </Button>
      </div>

      {/* ── KPI Row 1: goals ── */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-zinc-500">{tr.kpi.revenue}</CardTitle>
            <DollarSign className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{sym}{goalsData?.achievedRevenue?.toLocaleString() || 0}</div>
            <p className="text-xs text-zinc-500 mt-1">{tr.kpi.wonDealsPeriod(currency, goalsData?.targetPeriod || 'MONTH')}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-zinc-500">{tr.kpi.target}</CardTitle>
            <Target className="h-4 w-4 text-indigo-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{sym}{goalsData?.targetRevenue?.toLocaleString() || 0}</div>
            <div className="w-full bg-zinc-200 dark:bg-zinc-800 h-2 rounded-full mt-3 overflow-hidden">
              <div className="bg-indigo-500 h-full rounded-full transition-all duration-1000 ease-in-out" style={{ width: `${progressPercentage}%` }} />
            </div>
            <p className="text-xs text-zinc-500 mt-2">
              {tr.kpi.achieved} {sym}{goalsData?.achievedRevenue?.toLocaleString() || 0} {tr.kpi.of} {sym}{goalsData?.targetRevenue?.toLocaleString() || 0} ({progressPercentage}%)
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-zinc-500">{tr.kpi.planExecution}</CardTitle>
            <TrendingUp className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{progressPercentage}%</div>
            <p className="text-xs text-zinc-500 mt-1">{tr.kpi.planExecutionPeriod(goalsData?.targetPeriod || 'MONTH')}</p>
          </CardContent>
        </Card>
      </div>

      {/* ── KPI Row 2: deal metrics ── */}
      {extraKpis && (
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-zinc-500">{tr.kpi.winRate}</CardTitle>
              <Trophy className="h-4 w-4 text-emerald-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {extraKpis.winPct !== null ? `${extraKpis.winPct}%` : "—"}
              </div>
              <p className="text-xs text-zinc-500 mt-1">
                {extraKpis.winPct !== null
                  ? tr.kpi.winRateDesc(extraKpis.done, extraKpis.closed)
                  : tr.charts.noData}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-zinc-500">{tr.kpi.avgDeal}</CardTitle>
              <DollarSign className="h-4 w-4 text-indigo-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{sym}{extraKpis.avgDeal.toLocaleString()}</div>
              <p className="text-xs text-zinc-500 mt-1">{tr.kpi.avgDealDesc}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-zinc-500">{tr.kpi.pipelineTotal}</CardTitle>
              <Layers className="h-4 w-4 text-amber-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{sym}{extraKpis.pipelineTotal.toLocaleString()}</div>
              <p className="text-xs text-zinc-500 mt-1">{tr.kpi.pipelineTotalDesc}</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ── Charts Row 1: Funnel count + Pipeline Value ── */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{tr.charts.funnel}</CardTitle>
            <CardDescription>{tr.charts.funnelDesc}</CardDescription>
          </CardHeader>
          <CardContent className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={formattedFunnelData} margin={{ top: 16, right: 24, left: 0, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e4e4e7" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "#71717a", fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: "#71717a", fontSize: 12 }} allowDecimals={false} />
                <RechartsTooltip cursor={{ fill: "rgba(0,0,0,0.05)" }} contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 4px 6px -1px rgb(0 0 0/0.1)" }} />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {formattedFunnelData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{tr.charts.pipelineValue}</CardTitle>
            <CardDescription>{tr.charts.pipelineValueDesc}</CardDescription>
          </CardHeader>
          <CardContent className="h-[280px]">
            {pipelineValue.length === 0 ? (
              <div className="flex h-full items-center justify-center text-sm text-zinc-400">{tr.charts.noData}</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={pipelineValue} margin={{ top: 16, right: 24, left: 0, bottom: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e4e4e7" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "#71717a", fontSize: 12 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: "#71717a", fontSize: 12 }} tickFormatter={fmt} />
                  <RechartsTooltip
                    cursor={{ fill: "rgba(0,0,0,0.05)" }}
                    formatter={(v: any) => [Number(v || 0).toLocaleString("uk-UA"), tr.charts.budgetSum]}
                    contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 4px 6px -1px rgb(0 0 0/0.1)" }}
                  />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                    {pipelineValue.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Charts Row 2: Tasks Overview + Client Status ── */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Tasks overview */}
        <Card>
          <CardHeader>
            <CardTitle>{tr.charts.tasksOverview}</CardTitle>
            <CardDescription>{tr.charts.tasksOverviewDesc}</CardDescription>
          </CardHeader>
          <CardContent className="h-[280px]">
            {tasksOverview.every((t) => t.value === 0) ? (
              <div className="flex h-full items-center justify-center text-sm text-zinc-400">{tr.charts.noData}</div>
            ) : (
              <div className="flex flex-col justify-center gap-5 h-full px-2">
                {tasksOverview.map((item) => {
                  const total = tasksOverview.reduce((s, x) => s + x.value, 0) || 1;
                  const pct = Math.round((item.value / total) * 100);
                  return (
                    <div key={item.name}>
                      <div className="flex justify-between items-center mb-1.5">
                        <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">{item.name}</span>
                        <span className="text-sm font-bold" style={{ color: item.fill }}>
                          {item.value} <span className="text-xs font-normal text-zinc-400">({pct}%)</span>
                        </span>
                      </div>
                      <div className="w-full bg-zinc-100 dark:bg-zinc-800 h-3 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-700 ease-out"
                          style={{ width: `${pct}%`, backgroundColor: item.fill }}
                        />
                      </div>
                    </div>
                  );
                })}
                <p className="text-xs text-zinc-400 text-right -mt-2">
                  {tr.charts.tasksTotal}: {tasksOverview.reduce((s, x) => s + x.value, 0)}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Client status distribution */}
        <Card>
          <CardHeader>
            <CardTitle>{tr.charts.clientStatus}</CardTitle>
            <CardDescription>{tr.charts.clientStatusDesc}</CardDescription>
          </CardHeader>
          <CardContent className="h-[280px]">
            {clientStatusData.length === 0 ? (
              <div className="flex h-full items-center justify-center text-sm text-zinc-400">{tr.charts.noData}</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  layout="vertical"
                  data={clientStatusData}
                  margin={{ top: 8, right: 48, left: 8, bottom: 8 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e4e4e7" />
                  <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: "#71717a", fontSize: 12 }} allowDecimals={false} />
                  <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "#71717a", fontSize: 12 }} width={90} />
                  <RechartsTooltip contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 4px 6px -1px rgb(0 0 0/0.1)" }} />
                  <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                    {clientStatusData.map((e, i) => <Cell key={i} fill={e.fill} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Reports banner ── */}
      <Card className="border-indigo-200/70 dark:border-indigo-900/50 bg-gradient-to-br from-indigo-50/90 via-white to-white dark:from-indigo-950/35 dark:via-zinc-950 dark:to-zinc-950 shadow-sm">
        <CardContent className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-6">
          <div className="space-y-1">
            <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">{tr.reports.title}</h3>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 max-w-xl">{tr.reports.desc}</p>
          </div>
          <Button asChild className="bg-indigo-600 hover:bg-indigo-700 text-white shrink-0 w-full sm:w-auto gap-2">
            <Link href="/reports">
              <FileBarChart className="h-4 w-4" />
              {tr.reports.button}
            </Link>
          </Button>
        </CardContent>
      </Card>

      {/* ── Goals dialog ── */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{tr.goalsDialog.title}</DialogTitle>
            <DialogDescription>{tr.goalsDialog.desc}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="revenue" className="text-right">{tr.goalsDialog.targetAmount}</Label>
              <Input id="revenue" type="number" value={targetRevenueStr} onChange={(e) => setTargetRevenueStr(e.target.value)} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="currency" className="text-right">{tr.goalsDialog.baseCurrency}</Label>
              <div className="col-span-3">
                <Select value={currency} onValueChange={setCurrency}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">{tr.goalsDialog.currencies.USD}</SelectItem>
                    <SelectItem value="EUR">{tr.goalsDialog.currencies.EUR}</SelectItem>
                    <SelectItem value="GBP">{tr.goalsDialog.currencies.GBP}</SelectItem>
                    <SelectItem value="UAH">{tr.goalsDialog.currencies.UAH}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="targetPeriod" className="text-right">{tr.goalsDialog.targetPeriod}</Label>
              <div className="col-span-3">
                <Select value={targetPeriod} onValueChange={setTargetPeriod}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="WEEK">{tr.goalsDialog.periods.WEEK}</SelectItem>
                    <SelectItem value="MONTH">{tr.goalsDialog.periods.MONTH}</SelectItem>
                    <SelectItem value="YEAR">{tr.goalsDialog.periods.YEAR}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>{tr.goalsDialog.cancel}</Button>
            <Button type="button" onClick={handleSaveGoals} disabled={updateGoalsMutation.isPending || !targetRevenueStr}>
              {updateGoalsMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {tr.goalsDialog.save}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
