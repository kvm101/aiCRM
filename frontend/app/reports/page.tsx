"use client";

import { useState } from "react";
import { format } from "date-fns";
import { generateReportAction } from "./actions";
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
import { FileBarChart, Download, Loader2, Calendar as CalendarIcon, FileSpreadsheet } from "lucide-react";

type ReportStatus = "Completed" | "Processing" | "Failed";

interface Report {
  id: string;
  name: string;
  type: string;
  dateGenerated: string;
  status: ReportStatus;
}

const initialReports: Report[] = [
  { id: "rep_1", name: "Q3 Sales Summary", type: "SALES_SUMMARY", dateGenerated: "2023-10-01T10:00:00Z", status: "Completed" },
  { id: "rep_2", name: "October Activity", type: "USER_ACTIVITY", dateGenerated: "2023-11-01T09:30:00Z", status: "Completed" },
  { id: "rep_3", name: "Lost Deals Analysis", type: "SALES_SUMMARY", dateGenerated: "2023-11-15T14:20:00Z", status: "Completed" },
];

export default function ReportsPage() {
  const [reports, setReports] = useState<Report[]>(initialReports);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [reportName, setReportName] = useState("");

  const handleGenerateReport = async () => {
    if (!reportName) return;
    setIsGenerating(true);

    try {
      // Call our Next.js Server Action (BFF Pattern)
      const result = await generateReportAction(reportName, "SALES_SUMMARY");
      
      if (!result.success) throw new Error(result.error);

      const newReport: Report = {
        id: result.reportId as string,
        name: reportName,
        type: "SALES_SUMMARY",
        dateGenerated: result.dateGenerated as string,
        status: "Processing"
      };

      setReports([newReport, ...reports]);
      setIsDialogOpen(false);
      setReportName("");

      // Simulate async completion where we would normally poll or receive a WebSocket event
      setTimeout(() => {
        setReports(current => current.map(r => r.id === result.reportId ? { ...r, status: "Completed" } : r));
      }, 5000);

    } catch (error) {
      console.error("Failed to generate report", error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = (report: Report) => {
    // Mock download action
    alert(`Downloading ${report.name}.xlsx...`);
    // In reality: window.open(`${API_URL}/reporting/download/${report.id}`, '_blank');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">Reporting Center</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Generate and download analytical reports.</p>
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
                Configure your report parameters. Generation happens asynchronously.
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
                <label className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
                  Report Type
                </label>
                <select className="flex h-9 w-full rounded-md border border-zinc-200 bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-zinc-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-800 dark:placeholder:text-zinc-400 dark:focus-visible:ring-indigo-500">
                  <option value="SALES_SUMMARY">Sales Summary</option>
                  <option value="USER_ACTIVITY">User Activity</option>
                  <option value="LOST_DEALS">Lost Deals Analysis</option>
                </select>
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
                  Date Range
                </label>
                <div className="flex gap-2 items-center text-sm text-zinc-500 border border-zinc-200 dark:border-zinc-800 rounded-md px-3 py-2">
                  <CalendarIcon className="h-4 w-4" /> Last 30 Days (Mock)
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleGenerateReport} disabled={!reportName || isGenerating} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileSpreadsheet className="mr-2 h-4 w-4" />}
                Generate
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
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
            {reports.map((report) => (
              <TableRow key={report.id}>
                <TableCell className="font-medium flex items-center gap-2">
                  <FileSpreadsheet className="h-4 w-4 text-zinc-400" />
                  {report.name}
                </TableCell>
                <TableCell className="text-zinc-500">{report.type.replace('_', ' ')}</TableCell>
                <TableCell className="text-zinc-500">{format(new Date(report.dateGenerated), 'MMM d, yyyy h:mm a')}</TableCell>
                <TableCell>
                  <Badge variant={report.status === "Completed" ? "default" : report.status === "Processing" ? "secondary" : "destructive"}>
                    {report.status === "Processing" && <Loader2 className="mr-1 h-3 w-3 animate-spin inline" />}
                    {report.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    disabled={report.status !== "Completed"}
                    onClick={() => handleDownload(report)}
                    className="text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 dark:hover:bg-indigo-900/50"
                  >
                    <Download className="h-4 w-4 mr-2" /> Download XLSX
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {reports.length === 0 && (
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
  );
}
