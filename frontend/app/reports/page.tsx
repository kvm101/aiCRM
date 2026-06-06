"use client";

import { useState, useEffect, useCallback } from "react";
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
import { Badge } from "@/components/ui/badge";
import {
  FileBarChart,
  Download,
  Loader2,
  Calendar as CalendarIcon,
  FileSpreadsheet,
} from "lucide-react";

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

const REPORT_TYPES: { value: BackendReportType; label: string }[] = [
  { value: "SALES_FUNNEL", label: "Sales funnel (статуси угод)" },
  { value: "REVENUE_GROWTH", label: "Закриті угоди / виручка" },
  { value: "USER_ACTIVITY", label: "Активність угод" },
  { value: "CLIENT_RETENTION", label: "База клієнтів" },
];

export default function ReportsPage() {
  const [reports, setReports] = useState<ReportRow[]>([]);
  const [listLoading, setListLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [reportName, setReportName] = useState("");
  const [reportType, setReportType] = useState<BackendReportType>("SALES_FUNNEL");

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

  const handleGenerateReport = async () => {
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
  };

  const handleDownload = (report: ReportRow) => {
    window.open(`/api/reports/${report.id}/download`, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto flex flex-col h-[calc(100vh-7rem)]">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shrink-0">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            Reporting Center
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Асинхронна генерація CSV через чергу; завантаження після статусу Completed.
          </p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2">
              <FileBarChart className="h-4 w-4" /> Generate Report
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Generate New Report</DialogTitle>
              <DialogDescription>
                Запит потрапляє в RabbitMQ; файл з&apos;явиться після обробки.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="flex flex-col gap-2">
                <label htmlFor="name" className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
                  Report Name
                </label>
                <Input
                  id="name"
                  value={reportName}
                  onChange={(e) => setReportName(e.target.value)}
                  placeholder="e.g. November Sales Summary"
                  className="col-span-3"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-zinc-900 dark:text-zinc-50">Report Type</label>
                <select
                  className="flex h-9 w-full rounded-md border border-zinc-200 bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-zinc-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-800 dark:placeholder:text-zinc-400 dark:focus-visible:ring-indigo-500"
                  value={reportType}
                  onChange={(e) => setReportType(e.target.value as BackendReportType)}
                >
                  {REPORT_TYPES.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-zinc-900 dark:text-zinc-50">Період</label>
                <div className="flex gap-2 items-center text-sm text-zinc-500 border border-zinc-200 dark:border-zinc-800 rounded-md px-3 py-2">
                  <CalendarIcon className="h-4 w-4" /> Усі дані проєкту (CSV)
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={() => void handleGenerateReport()}
                disabled={!reportName || isGenerating}
                className="bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                {isGenerating ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <FileSpreadsheet className="mr-2 h-4 w-4" />
                )}
                Generate
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex-1 bg-white dark:bg-zinc-950 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-sm min-h-0">
        <div className="overflow-y-auto h-full">
          <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Report Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Generated At</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {listLoading && (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center text-zinc-500">
                  <Loader2 className="h-5 w-5 animate-spin inline mr-2" />
                  Завантаження…
                </TableCell>
              </TableRow>
            )}
            {!listLoading &&
              reports.map((report) => (
                <TableRow key={report.id}>
                  <TableCell className="font-medium flex items-center gap-2">
                    <FileSpreadsheet className="h-4 w-4 text-zinc-400" />
                    {report.name}
                  </TableCell>
                  <TableCell className="text-zinc-500">{report.type}</TableCell>
                  <TableCell className="text-zinc-500">
                    {format(new Date(report.dateGenerated), "MMM d, yyyy h:mm a")}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        report.status === "COMPLETED"
                          ? "default"
                          : report.status === "PENDING" || report.status === "PROCESSING"
                            ? "secondary"
                            : "destructive"
                      }
                    >
                      {(report.status === "PENDING" || report.status === "PROCESSING") && (
                        <Loader2 className="mr-1 h-3 w-3 animate-spin inline" />
                      )}
                      {report.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={!report.downloadable}
                      onClick={() => handleDownload(report)}
                      className="text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 dark:hover:bg-indigo-900/50"
                    >
                      <Download className="h-4 w-4 mr-2" /> Download CSV
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            {!listLoading && reports.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center text-zinc-500">
                  No reports generated yet.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
