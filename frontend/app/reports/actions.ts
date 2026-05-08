"use server";

import { serverFetch } from "@/services/serverApiClient";

interface BackendReportResponse {
  reportId: string;
  metadata: {
    generatedAt: string;
    requestedBy: string;
  };
  metrics: Array<{
    period: string;
    value: number;
  }>;
}

export async function generateReportAction(reportName: string, reportType: string) {
  try {
    // Call the real backend ReportingController
    const rawData = await serverFetch<BackendReportResponse>('/reporting/generate', {
      method: 'POST',
      body: JSON.stringify({ name: reportName, type: reportType }),
    });

    // BFF Transformation: map backend DTO into chart-ready format
    const chartData = rawData.metrics.map(m => ({
      name: m.period,
      total: m.value,
    }));

    return {
      success: true,
      reportId: rawData.reportId,
      dateGenerated: rawData.metadata.generatedAt,
      chartData,
    };
  } catch (error) {
    console.error("Failed to generate report via BFF:", error);
    return { success: false, error: "Report generation failed" };
  }
}
