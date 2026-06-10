"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { format } from "date-fns";
import { generateReportAction, type BackendReportType } from "./actions";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ReportStatusBadge } from "@/components/ui/status-badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  FileBarChart,
  Download,
  Loader2,
  Calendar as CalendarIcon,
  FileSpreadsheet,
  Plus,
  Search,
  CheckCircle2,
  AlertTriangle,
  History,
  TrendingUp,
  Activity,
  Users,
  Layers,
} from "lucide-react";
import { useLanguageStore } from "@/store/useLanguageStore";
import { t } from "@/lib/i18n";

type RowStatus = "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";

interface ReportRow {
  id: string;
  name: string;
  type: string;
  dateGenerated: string;
  status: RowStatus;
  downloadable: boolean;
}

interface ReportTaskJson {
  id: string;
  name: string;
  type: string;
  status: RowStatus;
  createdAt: string;
  completedAt: string | null;
  downloadable: boolean;
}

function mapDtoToRow(dto: ReportTaskJson): ReportRow {
  const dateSrc = dto.completedAt || dto.createdAt;
  return {
    id: dto.id,
    name: dto.name,
    type: dto.type.replaceAll("_", " "),
    dateGenerated: dateSrc,
    status: dto.status,
    downloadable: dto.downloadable,
  };
}

const TEMPLATE_CARDS = [
  {
    type: "SALES_FUNNEL" as BackendReportType,
    titleUA: "Воронка продажів",
    titleEN: "Sales Funnel",
    descUA: "Статуси та конверсія угод, етапи просування по воронці.",
    descEN: "Stage transitions, win rates, and pipeline progression.",
    icon: Layers,
    color: "from-blue-500/10 to-primary/10 text-primary",
  },
  {
    type: "REVENUE_GROWTH" as BackendReportType,
    titleUA: "Аналіз виручки та доходу",
    titleEN: "Revenue & Growth",
    descUA: "Закриті угоди, фінансові показники та суми виграних бюджетів.",
    descEN: "Won deal budgets, monthly revenue targets, and sales velocity.",
    icon: TrendingUp,
    color: "from-emerald-500/10 to-teal-500/10 text-emerald-600 dark:text-emerald-400",
  },
  {
    type: "USER_ACTIVITY" as BackendReportType,
    titleUA: "Активність угод",
    titleEN: "User Activity Logs",
    descUA: "Логи дій, оновлення коментарів та загальна активність клієнтів.",
    descEN: "Deal update frequency, activity status, and audit records.",
    icon: Activity,
    color: "from-amber-500/10 to-orange-500/10 text-amber-600 dark:text-amber-400",
  },
  {
    type: "CLIENT_RETENTION" as BackendReportType,
    titleUA: "База клієнтів",
    titleEN: "Client Base Analytics",
    descUA: "Статуси клієнтів, аналітика нових лідів та утримання бази.",
    descEN: "Client lifecycle distribution, lead sources, and profiles.",
    icon: Users,
    color: "from-purple-500/10 to-pink-500/10 text-purple-600 dark:text-purple-400",
  },
];

export default function ReportsPage() {
  const { lang } = useLanguageStore();
  const tr = t(lang);
  const [reports, setReports] = useState<ReportRow[]>([]);
  const [listLoading, setListLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [reportName, setReportName] = useState("");
  const [reportType, setReportType] = useState<BackendReportType>("SALES_FUNNEL");
  const [searchQuery, setSearchQuery] = useState("");

  const refreshList = useCallback(async () => {
    try {
      const res = await fetch("/api/reports", { cache: "no-store" });
      if (!res.ok) return;
      const data: ReportTaskJson[] = await res.json();
      setReports(data.map(mapDtoToRow));
    } catch {
      /* ignore */
    } finally {
      setListLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshList();
  }, [refreshList]);

  useEffect(() => {
    const needsPoll = reports.some(
      (r) => r.status === "PENDING" || r.status === "PROCESSING"
    );
    if (!needsPoll) return;
    const t = setInterval(() => void refreshList(), 3000);
    return () => clearInterval(t);
  }, [reports, refreshList]);

  // Statistics calculation for the summary cards
  const stats = useMemo(() => {
    const total = reports.length;
    const processing = reports.filter((r) => r.status === "PENDING" || r.status === "PROCESSING").length;
    const completed = reports.filter((r) => r.status === "COMPLETED").length;
    const failed = reports.filter((r) => r.status === "FAILED").length;
    return { total, processing, completed, failed };
  }, [reports]);

  // Filtered reports list for search
  const filteredReports = useMemo(() => {
    return reports.filter((r) => 
      r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.type.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [reports, searchQuery]);

  const handleGenerateReport = useCallback(async () => {
    if (!reportName) return;
    setIsGenerating(true);

    try {
      const result = await generateReportAction(reportName, reportType);
      if (!result.success) throw new Error(result.error);

      const row = mapDtoToRow(result.task);
      setReports((prev) => [row, ...prev.filter((r) => r.id !== row.id)]);
      setIsDialogOpen(false);
      setReportName("");
    } catch (error) {
      console.error("Failed to generate report", error);
    } finally {
      setIsGenerating(false);
    }
  }, [reportName, reportType]);

  const handleDownload = (report: ReportRow) => {
    window.open(`/api/reports/${report.id}/download`, "_blank", "noopener,noreferrer");
  };

  const openQuickReport = (type: BackendReportType) => {
    setReportType(type);
    const typeLabel = TEMPLATE_CARDS.find((c) => c.type === type)?.[lang === "ua" ? "titleUA" : "titleEN"];
    setReportName(`${typeLabel} — ${format(new Date(), "dd.MM.yyyy HH:mm")}`);
    setIsDialogOpen(true);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50">
            {lang === "ua" ? "Центр аналітичних звітів" : "Analytical Report Center"}
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            {lang === "ua"
              ? "Генерація та вивантаження статистичних звітів по клієнтах, угодах та воронці через чергу RabbitMQ."
              : "Generate and export statistical reports for customers, deals, and pipeline via RabbitMQ queue."}
          </p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="rounded-xl gap-2">
              <Plus className="h-4 w-4" /> 
              {lang === "ua" ? "Створити звіт" : "Create Report"}
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>{lang === "ua" ? "Параметри нового звіту" : "New Report Configuration"}</DialogTitle>
              <DialogDescription>
                {lang === "ua" 
                  ? "Запит буде надіслано в фонову чергу обробки. Готовий файл з'явиться в таблиці нижче."
                  : "Request will be dispatched to the background processing queue. Ready file will appear below."}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="flex flex-col gap-2">
                <label htmlFor="name" className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                  {lang === "ua" ? "Назва звіту" : "Report Name"}
                </label>
                <Input
                  id="name"
                  value={reportName}
                  onChange={(e) => setReportName(e.target.value)}
                  placeholder={lang === "ua" ? "напр. Звіт з продажів за травень" : "e.g. November Sales Summary"}
                  className="rounded-xl border-zinc-200 dark:border-zinc-800"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                  {lang === "ua" ? "Тип аналітики" : "Analysis Type"}
                </label>
                <select
                  className="flex h-10 w-full rounded-xl border-2 border-zinc-200 bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-zinc-500 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-800 dark:placeholder:text-zinc-400 bg-white dark:bg-zinc-950"
                  value={reportType}
                  onChange={(e) => setReportType(e.target.value as BackendReportType)}
                >
                  {TEMPLATE_CARDS.map((opt) => (
                    <option key={opt.type} value={opt.type} className="bg-white dark:bg-zinc-950">
                      {lang === "ua" ? opt.titleUA : opt.titleEN}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                  {lang === "ua" ? "Таймфрейм" : "Timeframe"}
                </label>
                <div className="flex gap-2 items-center text-xs text-zinc-500 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2 bg-zinc-50/50 dark:bg-zinc-950/20">
                  <CalendarIcon className="h-4 w-4 text-zinc-400 shrink-0" />
                  {lang === "ua" ? "За весь період існування бази" : "All records in the database"}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="rounded-xl">
                {lang === "ua" ? "Скасувати" : "Cancel"}
              </Button>
              <Button
                onClick={() => void handleGenerateReport()}
                disabled={!reportName || isGenerating}
                className="rounded-xl"
              >
                {isGenerating ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <FileSpreadsheet className="mr-2 h-4 w-4" />
                )}
                {lang === "ua" ? "Черга генерації" : "Queue Generation"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Real-time Status Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border border-zinc-200/50 dark:border-zinc-800/50 shadow-sm rounded-2xl">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs text-zinc-500 font-medium uppercase tracking-wider block">
                {lang === "ua" ? "Всього звітів" : "Total Reports"}
              </span>
              <span className="text-2xl font-extrabold text-zinc-900 dark:text-zinc-50 font-data tabular-nums">{stats.total}</span>
            </div>
            <div className="h-10 w-10 bg-primary text-primary-foreground flex items-center justify-center rounded-xl shrink-0">
              <History className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-zinc-200/50 dark:border-zinc-800/50 shadow-sm rounded-2xl">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs text-zinc-500 font-medium uppercase tracking-wider block">
                {lang === "ua" ? "В черзі обробки" : "Processing"}
              </span>
              <span className="text-2xl font-extrabold text-zinc-900 dark:text-zinc-50 flex items-center gap-1.5 font-data tabular-nums">
                {stats.processing}
                {stats.processing > 0 && <Loader2 className="h-4 w-4 animate-spin text-amber-500" />}
              </span>
            </div>
            <div className="h-10 w-10 bg-amber-50 dark:bg-amber-950/40 text-amber-500 flex items-center justify-center rounded-xl shrink-0">
              <Loader2 className={`h-5 w-5 ${stats.processing > 0 ? 'animate-spin' : ''}`} />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-zinc-200/50 dark:border-zinc-800/50 shadow-sm rounded-2xl">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs text-zinc-500 font-medium uppercase tracking-wider block">
                {lang === "ua" ? "Успішно" : "Successful"}
              </span>
              <span className="text-2xl font-extrabold text-zinc-900 dark:text-zinc-50 font-data tabular-nums">{stats.completed}</span>
            </div>
            <div className="h-10 w-10 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-500 flex items-center justify-center rounded-xl shrink-0">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-zinc-200/50 dark:border-zinc-800/50 shadow-sm rounded-2xl">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs text-zinc-500 font-medium uppercase tracking-wider block">
                {lang === "ua" ? "Помилки" : "Failed"}
              </span>
              <span className="text-2xl font-extrabold text-zinc-900 dark:text-zinc-50 font-data tabular-nums">{stats.failed}</span>
            </div>
            <div className="h-10 w-10 bg-rose-50 dark:bg-rose-950/40 text-rose-500 flex items-center justify-center rounded-xl shrink-0">
              <AlertTriangle className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Report Templates Grid */}
      <div className="space-y-3">
        <h2 className="text-lg font-bold text-zinc-950 dark:text-zinc-50">
          {lang === "ua" ? "Шаблони звітів" : "Available Templates"}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {TEMPLATE_CARDS.map((card) => {
            const IconComponent = card.icon;
            return (
              <Card 
                key={card.type} 
                className="border border-zinc-200/40 dark:border-zinc-800/40 bg-zinc-50/30 hover:bg-zinc-50/90 dark:bg-zinc-900/10 dark:hover:bg-zinc-900/40 transition-all duration-200 shadow-sm rounded-2xl flex flex-col group cursor-pointer"
                onClick={() => openQuickReport(card.type)}
              >
                <CardHeader className="p-5 pb-3 flex flex-row items-center gap-3 space-y-0">
                  <div className={`h-9 w-9 rounded-xl bg-gradient-to-tr ${card.color} flex items-center justify-center shrink-0`}>
                    <IconComponent className="h-5 w-5" />
                  </div>
                  <CardTitle className="text-sm font-bold text-zinc-950 dark:text-zinc-100 group-hover:text-primary transition-colors">
                    {lang === "ua" ? card.titleUA : card.titleEN}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-5 pt-0 flex-1 flex flex-col justify-between">
                  <CardDescription className="text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
                    {lang === "ua" ? card.descUA : card.descEN}
                  </CardDescription>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="w-full mt-4 justify-between text-[11px] font-bold text-zinc-600 dark:text-zinc-400 hover:text-primary p-0 hover:bg-transparent"
                  >
                    <span>{lang === "ua" ? "Створити звіт" : "Generate this template"}</span>
                    <Plus className="h-3.5 w-3.5" />
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* History Log Section */}
      <Card className="border border-zinc-200/50 dark:border-zinc-800/50 shadow-md rounded-2xl overflow-hidden">
        <div className="p-5 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-100 dark:border-zinc-800/50 bg-gradient-to-b from-zinc-50/50 to-white dark:from-zinc-950/20 dark:to-zinc-900/30">
          <div>
            <CardTitle className="text-base font-bold text-zinc-950 dark:text-zinc-50 flex items-center gap-2">
              <History className="h-4 w-4 text-zinc-400" />
              {lang === "ua" ? "Історія завантажень та генерації" : "Report Request History"}
            </CardTitle>
            <CardDescription className="text-xs mt-0.5">
              {lang === "ua" ? "Архів створених CSV файлів" : "Archive of generated CSV files"}
            </CardDescription>
          </div>

          {/* Search bar inside list card */}
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
            <Input
              type="text"
              placeholder={lang === "ua" ? "Пошук звітів..." : "Search reports..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 text-xs rounded-xl h-9 border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-zinc-50/50 dark:bg-zinc-950/30">
              <TableRow>
                <TableHead className="font-semibold text-xs text-zinc-500 uppercase tracking-wider pl-6">{lang === "ua" ? "Назва файлу" : "File Name"}</TableHead>
                <TableHead className="font-semibold text-xs text-zinc-500 uppercase tracking-wider">{lang === "ua" ? "Категорія" : "Category"}</TableHead>
                <TableHead className="font-semibold text-xs text-zinc-500 uppercase tracking-wider">{lang === "ua" ? "Створено" : "Created At"}</TableHead>
                <TableHead className="font-semibold text-xs text-zinc-500 uppercase tracking-wider">{lang === "ua" ? "Статус" : "Status"}</TableHead>
                <TableHead className="font-semibold text-xs text-zinc-500 uppercase tracking-wider text-right pr-6">{lang === "ua" ? "Дія" : "Action"}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {listLoading && (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center text-zinc-500 text-xs">
                    <Loader2 className="h-4 w-4 animate-spin inline mr-2 text-primary" />
                    {lang === "ua" ? "Завантаження списку..." : "Loading report list..."}
                  </TableCell>
                </TableRow>
              )}
              {!listLoading && filteredReports.map((report) => (
                <TableRow key={report.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/10">
                  <TableCell className="font-semibold text-sm pl-6 flex items-center gap-2">
                    <FileSpreadsheet className="h-4 w-4 text-emerald-500 shrink-0" />
                    <span className="text-zinc-900 dark:text-zinc-100">{report.name}</span>
                  </TableCell>
                  <TableCell className="text-xs font-mono text-zinc-500 dark:text-zinc-400">{report.type}</TableCell>
                  <TableCell className="text-xs text-zinc-500">
                    {format(new Date(report.dateGenerated), "dd.MM.yyyy HH:mm")}
                  </TableCell>
                  <TableCell>
                    <ReportStatusBadge
                      status={report.status}
                      label={tr.reportStatus[report.status as keyof typeof tr.reportStatus] || report.status}
                      spinning={report.status === "PENDING" || report.status === "PROCESSING"}
                    />
                  </TableCell>
                  <TableCell className="text-right pr-6">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={!report.downloadable}
                      onClick={() => handleDownload(report)}
                      className="h-8 rounded-xl text-xs font-semibold"
                    >
                      <Download className="h-3.5 w-3.5 mr-1.5" /> 
                      {lang === "ua" ? "Завантажити CSV" : "Download CSV"}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {!listLoading && filteredReports.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center text-zinc-500 text-xs">
                    {lang === "ua" ? "Звітів не знайдено." : "No reports found."}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}
