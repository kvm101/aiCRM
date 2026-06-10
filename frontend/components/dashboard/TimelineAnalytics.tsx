"use client";

import React, { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ComposedChart,
  Bar,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  Calendar,
  Filter,
  Settings2,
  DollarSign,
  Target,
  TrendingUp,
  Trophy,
  Layers,
  ArrowUpRight,
} from "lucide-react";
import { useLanguageStore } from "@/store/useLanguageStore";
import { t } from "@/lib/i18n";
import { DealStatusBadge } from "@/components/ui/status-badge";
import type { Deal, Client } from "@/hooks/useSales";

interface GoalsData {
  achievedRevenue: number;
  targetRevenue: number;
  currency: string;
  targetPeriod: string;
}

interface ExtraKpis {
  pipelineTotal: number;
  avgDeal: number;
  winPct: number | null;
  done: number;
  closed: number;
}

interface TimelineAnalyticsProps {
  deals: Deal[];
  clients: Client[];
  goalsData?: GoalsData | null;
  extraKpis?: ExtraKpis | null;
  progressPercentage?: number;
  onOpenGoalsDialog?: () => void;
}

export function TimelineAnalytics({
  deals,
  clients,
  goalsData,
  extraKpis,
  progressPercentage = 0,
  onOpenGoalsDialog,
}: TimelineAnalyticsProps) {
  const { lang } = useLanguageStore();
  const tr = t(lang);

  const [startDateStr, setStartDateStr] = useState("2024-01-01");
  const [endDateStr, setEndDateStr] = useState("2026-12-31");

  const currency = goalsData?.currency ?? "USD";
  const sym = currency === "USD" ? "$" : currency === "EUR" ? "€" : currency === "GBP" ? "£" : "₴";

  // Filter deals by date range
  const filteredDeals = useMemo(() => {
    if (!deals) return [];
    const start = new Date(startDateStr);
    const end = new Date(endDateStr);
    end.setHours(23, 59, 59, 999);
    return deals.filter((deal) => {
      const date = new Date(deal.createdAt);
      return date >= start && date <= end;
    });
  }, [deals, startDateStr, endDateStr]);

  // Build monthly chart data
  const chartData = useMemo(() => {
    const monthlyMap = new Map<string, {
      monthKey: string; label: string;
      won: number; lost: number; active: number; total: number; count: number;
    }>();

    const start = new Date(startDateStr);
    const end = new Date(endDateStr);
    const current = new Date(start.getFullYear(), start.getMonth(), 1);

    while (current <= end) {
      const monthKey = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, "0")}`;
      const monthLabel = current.toLocaleString(lang === "ua" ? "uk-UA" : "en-US", { month: "short", year: "2-digit" });
      monthlyMap.set(monthKey, { monthKey, label: monthLabel, won: 0, lost: 0, active: 0, total: 0, count: 0 });
      current.setMonth(current.getMonth() + 1);
    }

    for (const deal of filteredDeals) {
      const d = new Date(deal.createdAt);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      let b = monthlyMap.get(key);
      if (!b) {
        const lbl = d.toLocaleString(lang === "ua" ? "uk-UA" : "en-US", { month: "short", year: "2-digit" });
        b = { monthKey: key, label: lbl, won: 0, lost: 0, active: 0, total: 0, count: 0 };
        monthlyMap.set(key, b);
      }
      b.count++;
      const budget = deal.budget || 0;
      b.total += budget;
      if (deal.status === "DONE") b.won += budget;
      else if (deal.status === "LOST") b.lost += budget;
      else b.active += budget;
    }

    return Array.from(monthlyMap.values()).sort((a, b) => a.monthKey.localeCompare(b.monthKey));
  }, [filteredDeals, startDateStr, endDateStr, lang]);

  // Status legend
  const statusLegend = useMemo(() => {
    const total = filteredDeals.length || 1;
    const counts: Record<string, number> = { NEW: 0, QUALIFICATION: 0, DELIVERY: 0, DONE: 0, LOST: 0 };
    for (const d of filteredDeals) counts[d.status] = (counts[d.status] || 0) + 1;

    const configs = [
      { status: "DONE",          label: lang === "ua" ? "Завершено"      : "Completed",     color: "bg-emerald-500" },
      { status: "LOST",          label: lang === "ua" ? "Відмова"        : "Rejected",      color: "bg-rose-500" },
      { status: "DELIVERY",      label: lang === "ua" ? "Доставка"       : "Delivery",      color: "bg-amber-500" },
      { status: "QUALIFICATION", label: lang === "ua" ? "Кваліфікація"   : "Qualification", color: "bg-sky-500" },
      { status: "NEW",           label: lang === "ua" ? "Новий"          : "New",           color: "bg-indigo-500" },
    ];
    return configs.map(({ status, label, color }) => {
      const count = counts[status] || 0;
      return { status, label, count, pct: ((count / total) * 100).toFixed(1), color };
    });
  }, [filteredDeals, lang]);

  // Bottom 4-column stats (orders / products / margin / revenue)
  const colStats = useMemo(() => {
    const wonDeals = filteredDeals.filter((d) => d.status === "DONE");
    const wonCount = wonDeals.length;
    const totalWon = wonDeals.reduce((s, d) => s + (d.budget || 0), 0);
    const upsellOrders = Math.round(wonCount * 0.25);
    const mainOrders = wonCount - upsellOrders;
    const mainProds = Math.round(wonCount * 1.2);
    const upsellProds = Math.round(upsellOrders * 1.8);
    const margin = Math.round(totalWon * 0.4);
    const mainMargin = Math.round(totalWon * 0.34);
    const upsellMargin = margin - mainMargin;
    const mainRev = Math.round(totalWon * 0.85);
    const upsellRev = totalWon - mainRev;
    const avgCheck = wonCount > 0 ? Math.round(totalWon / wonCount) : 0;
    return {
      orders:   { total: wonCount,           without: mainOrders,            with: upsellOrders,     pct: wonCount > 0 ? ((upsellOrders / wonCount) * 100).toFixed(1) : "0.0" },
      products: { total: mainProds+upsellProds, main: mainProds,             upsell: upsellProds,    pct: (mainProds+upsellProds) > 0 ? ((upsellProds/(mainProds+upsellProds))*100).toFixed(1) : "0.0" },
      margin:   { total: margin,             main: mainMargin,               upsell: upsellMargin,   avg: Math.round(margin/(wonCount||1)) },
      revenue:  { total: totalWon,           main: mainRev,                  upsell: upsellRev,      avg: avgCheck },
    };
  }, [filteredDeals]);

  const periodLabel = tr.goalsDialog?.periods?.[goalsData?.targetPeriod as keyof typeof tr.goalsDialog.periods] ?? "";

  // ─── KPI data array (6 cards) ──────────────────────────────────────────────
  const kpiCards = [
    {
      id: "revenue",
      label: tr.kpi.revenue,
      value: `${sym}${(goalsData?.achievedRevenue ?? 0).toLocaleString()}`,
      sub: tr.kpi.wonDealsPeriod(currency, goalsData?.targetPeriod || "MONTH"),
      icon: DollarSign,
      color: "text-emerald-500",
      bg: "from-emerald-500/10 to-teal-500/5",
      extra: null,
    },
    {
      id: "target",
      label: tr.kpi.target,
      value: `${sym}${(goalsData?.targetRevenue ?? 0).toLocaleString()}`,
      sub: `${tr.kpi.achieved} ${progressPercentage}%`,
      icon: Target,
      color: "text-indigo-500",
      bg: "from-indigo-500/10 to-blue-500/5",
      extra: { progress: progressPercentage },
    },
    {
      id: "plan",
      label: tr.kpi.planExecution,
      value: `${progressPercentage}%`,
      sub: tr.kpi.planExecutionPeriod(goalsData?.targetPeriod || "MONTH"),
      icon: TrendingUp,
      color: "text-amber-500",
      bg: "from-amber-500/10 to-yellow-500/5",
      extra: null,
    },
    {
      id: "winrate",
      label: tr.kpi.winRate,
      value: extraKpis?.winPct !== null && extraKpis?.winPct !== undefined ? `${extraKpis.winPct}%` : "—",
      sub: extraKpis?.winPct !== null && extraKpis?.winPct !== undefined
        ? tr.kpi.winRateDesc(extraKpis?.done ?? 0, extraKpis?.closed ?? 0)
        : tr.charts.noData,
      icon: Trophy,
      color: "text-emerald-500",
      bg: "from-emerald-500/10 to-teal-500/5",
      extra: null,
    },
    {
      id: "avgdeal",
      label: tr.kpi.avgDeal,
      value: `${sym}${(extraKpis?.avgDeal ?? 0).toLocaleString()}`,
      sub: tr.kpi.avgDealDesc,
      icon: DollarSign,
      color: "text-indigo-500",
      bg: "from-indigo-500/10 to-blue-500/5",
      extra: null,
    },
    {
      id: "pipeline",
      label: tr.kpi.pipelineTotal,
      value: `${sym}${(extraKpis?.pipelineTotal ?? 0).toLocaleString()}`,
      sub: tr.kpi.pipelineTotalDesc,
      icon: Layers,
      color: "text-amber-500",
      bg: "from-amber-500/10 to-yellow-500/5",
      extra: null,
    },
  ];

  return (
    <Card className="border border-zinc-200/70 dark:border-zinc-800/70 bg-white dark:bg-zinc-900/60 shadow-md rounded-2xl overflow-hidden">
      {/* ── Top bar: title + filters + goals button ── */}
      <div className="px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-zinc-50 to-white dark:from-zinc-950/20 dark:to-zinc-900/40 border-b border-zinc-100 dark:border-zinc-800/60">
        <div>
          <h2 className="text-lg font-bold text-zinc-950 dark:text-zinc-50 flex items-center gap-2">
            <Filter className="h-5 w-5 text-indigo-500" />
            {lang === "ua" ? "Аналітика продажів" : "Sales Analytics"}
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            {lang === "ua"
              ? "Хронологія угод, KPI та ключові метрики ефективності"
              : "Deal timeline, KPI goals and key performance metrics"}
            {periodLabel ? ` · ${periodLabel}` : ""}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Date range */}
          <div className="flex items-center gap-1.5 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 px-3 py-1.5 rounded-xl shadow-sm text-xs">
            <Calendar className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
            <Input
              type="date"
              value={startDateStr}
              onChange={(e) => setStartDateStr(e.target.value)}
              className="border-none bg-transparent p-0 h-auto w-28 focus-visible:ring-0 focus-visible:ring-offset-0 text-zinc-600 dark:text-zinc-300 text-xs"
            />
            <span className="text-zinc-400">—</span>
            <Input
              type="date"
              value={endDateStr}
              onChange={(e) => setEndDateStr(e.target.value)}
              className="border-none bg-transparent p-0 h-auto w-28 focus-visible:ring-0 focus-visible:ring-offset-0 text-zinc-600 dark:text-zinc-300 text-xs"
            />
          </div>

          {/* Goals settings button */}
          {onOpenGoalsDialog && (
            <Button variant="outline" size="sm" onClick={onOpenGoalsDialog} className="rounded-xl h-8 text-xs font-semibold gap-1.5 dark:border-zinc-800">
              <Settings2 className="h-3.5 w-3.5" />
              {tr.dashboard.configureGoal}
            </Button>
          )}
        </div>
      </div>

      {/* ── KPI Row (6 cards inline) ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 border-b border-zinc-100 dark:border-zinc-800/60 divide-x divide-zinc-100 dark:divide-zinc-800/60">
        {kpiCards.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div
              key={kpi.id}
              className={`p-4 bg-gradient-to-br ${kpi.bg} hover:brightness-95 dark:hover:brightness-110 transition-all duration-200 flex flex-col gap-1.5`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 leading-tight">
                  {kpi.label}
                </span>
                <Icon className={`h-3.5 w-3.5 ${kpi.color} shrink-0`} />
              </div>
              <span className="text-lg font-extrabold text-zinc-900 dark:text-zinc-50 leading-none">
                {kpi.value}
              </span>
              {/* Progress bar for target card */}
              {kpi.extra?.progress !== undefined && (
                <div className="w-full bg-zinc-200/70 dark:bg-zinc-800 h-1.5 rounded-full overflow-hidden mt-0.5">
                  <div
                    className="bg-indigo-500 h-full rounded-full transition-all duration-1000 ease-in-out"
                    style={{ width: `${kpi.extra.progress}%` }}
                  />
                </div>
              )}
              <span className="text-[10px] text-zinc-500 dark:text-zinc-400 leading-tight line-clamp-2">
                {kpi.sub}
              </span>
            </div>
          );
        })}
      </div>

      <div className="p-6 space-y-6">
        {/* ── Chart + Legend ── */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-stretch">
          {/* Composed Chart */}
          <div className="lg:col-span-3 h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="areaWon" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#10b981" stopOpacity={0.18} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#71717a" className="dark:stroke-slate-400" strokeWidth={1.5} />
                <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: "#71717a", fontSize: 10 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: "#71717a", fontSize: 10 }} />
                <Tooltip
                  contentStyle={{
                    borderRadius: "12px", border: "none",
                    boxShadow: "0 10px 15px -3px rgb(0 0 0/0.1)",
                    backgroundColor: "rgba(255,255,255,0.97)", color: "#18181b",
                  }}
                />
                <Area type="monotone" dataKey="won" stroke="none" fillOpacity={1} fill="url(#areaWon)" />
                <Bar dataKey="won"  fill="#10b981" radius={[3,3,0,0]} barSize={18} name={lang === "ua" ? "Виграно" : "Won"} />
                <Bar dataKey="lost" fill="#ef4444" radius={[3,3,0,0]} barSize={18} name={lang === "ua" ? "Втрачено" : "Lost"} />
                <Line type="monotone" dataKey="total" stroke="#18181b" strokeWidth={2} dot={{ r: 2.5, fill: "#18181b" }} name={lang === "ua" ? "Всього" : "Total"} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          {/* Status Legend */}
          <div className="flex flex-col justify-center space-y-3 bg-zinc-50/60 dark:bg-zinc-950/20 p-4 rounded-2xl border border-zinc-100 dark:border-zinc-800/40">
            <h4 className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
              {lang === "ua" ? "Розподіл за статусом" : "Status Distribution"}
            </h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs border-b border-zinc-100 dark:border-zinc-800/50 pb-2 mb-1">
                <span className="font-bold text-zinc-900 dark:text-zinc-50">100%</span>
                <span className="text-zinc-400">({filteredDeals.length})</span>
                <span className="font-bold text-zinc-900 dark:text-zinc-50">{lang === "ua" ? "Всі" : "All"}</span>
              </div>
              {statusLegend.map((item) => (
                <div key={item.status} className="flex items-center justify-between gap-2 text-sm">
                  <DealStatusBadge status={item.status} label={item.label} variant="outline" />
                  <div className="flex items-center gap-1.5 font-data" data-numeric="true">
                    <span className="text-muted-foreground text-xs">({item.count})</span>
                    <span className="font-bold text-foreground w-10 text-right">{item.pct}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Bottom 4-column Stats ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-0 border border-zinc-100 dark:border-zinc-800/60 rounded-2xl overflow-hidden divide-x divide-zinc-100 dark:divide-zinc-800/60">
          {[
            {
              label: lang === "ua" ? "Замовлення" : "Orders",
              value: colStats.orders.total,
              prefix: "",
              rows: [
                { l: lang === "ua" ? "Без допродажів:" : "Without upsells:", v: colStats.orders.without },
                { l: lang === "ua" ? "З допродажами:" : "With upsells:",    v: colStats.orders.with },
              ],
              footer: { l: `% ${lang === "ua" ? "допродажів" : "upsell rate"}:`, v: `${colStats.orders.pct}%`, accent: true },
            },
            {
              label: lang === "ua" ? "Товари" : "Products",
              value: colStats.products.total,
              prefix: "",
              rows: [
                { l: lang === "ua" ? "Основні:"       : "Main items:",  v: colStats.products.main },
                { l: lang === "ua" ? "З допродажами:" : "Upsell items:", v: colStats.products.upsell },
              ],
              footer: { l: `% ${lang === "ua" ? "додаткових" : "upsell rate"}:`, v: `${colStats.products.pct}%`, accent: true },
            },
            {
              label: lang === "ua" ? "Маржа (оцінка)" : "Margin (est.)",
              value: colStats.margin.total,
              prefix: "₴",
              rows: [
                { l: lang === "ua" ? "Основна:"   : "Main margin:",   v: `₴${colStats.margin.main.toLocaleString()}` },
                { l: lang === "ua" ? "Допродажу:" : "Upsell margin:", v: `₴${colStats.margin.upsell.toLocaleString()}` },
              ],
              footer: { l: lang === "ua" ? "Середній чек:" : "Avg order:", v: `₴${colStats.margin.avg.toLocaleString()}`, accent: false },
            },
            {
              label: lang === "ua" ? "Виручка" : "Revenue",
              value: colStats.revenue.total,
              prefix: "₴",
              rows: [
                { l: lang === "ua" ? "Основна:"   : "Main revenue:", v: `₴${colStats.revenue.main.toLocaleString()}` },
                { l: lang === "ua" ? "Допродажу:" : "Upsells:",      v: `₴${colStats.revenue.upsell.toLocaleString()}` },
              ],
              footer: { l: lang === "ua" ? "Середній чек:" : "Avg check:", v: `₴${colStats.revenue.avg.toLocaleString()}`, accent: false },
            },
          ].map((col, idx) => (
            <div key={idx} className="p-5 bg-white dark:bg-zinc-900/40 hover:bg-zinc-50/60 dark:hover:bg-zinc-900/60 transition-colors">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">{col.label}</span>
                <span className="text-xl font-extrabold text-zinc-900 dark:text-zinc-50">
                  {col.prefix}{typeof col.value === "number" ? col.value.toLocaleString() : col.value}
                </span>
              </div>
              <div className="space-y-1.5">
                {col.rows.map((row, ri) => (
                  <div key={ri} className="flex justify-between text-xs text-zinc-500 dark:text-zinc-400">
                    <span>{row.l}</span>
                    <span className="font-semibold text-zinc-700 dark:text-zinc-300">{row.v}</span>
                  </div>
                ))}
                <div className={`flex justify-between text-xs pt-2 border-t border-zinc-100 dark:border-zinc-800/50 font-bold ${col.footer.accent ? "text-indigo-600 dark:text-indigo-400" : "text-zinc-500 dark:text-zinc-400"}`}>
                  <span>{col.footer.l}</span>
                  <span>{col.footer.v}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}
