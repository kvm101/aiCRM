"use server";

import { serverFetch } from "@/services/serverApiClient";

export type BackendReportType =
  | "SALES_FUNNEL"
  | "REVENUE_GROWTH"
  | "USER_ACTIVITY"
  | "CLIENT_RETENTION";

interface ReportTaskDTO {
  id: string;
  name: string;
  type: BackendReportType;
  status: "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";
  projectId: number;
  requestedByUserId: number | null;
  createdAt: string;
  completedAt: string | null;
  downloadable: boolean;
  downloadUrl: string | null;
}

export async function generateReportAction(reportName: string, reportType: BackendReportType) {
  try {
    const task = await serverFetch<ReportTaskDTO>("/reports/request", {
      method: "POST",
      body: JSON.stringify({ name: reportName, type: reportType }),
    });

    return {
      success: true as const,
      task,
    };
  } catch (error) {
    console.error("Failed to request report:", error);
    return { success: false as const, error: "Report generation failed" };
  }
}
