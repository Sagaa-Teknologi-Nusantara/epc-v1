"use client";

import { useState, useEffect, useCallback } from "react";
import type { Report, ReportSummary } from "@/types";

export function useReports(projectId?: string) {
  const [reports, setReports] = useState<ReportSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch report summaries for list display (lightweight)
  const fetchReports = useCallback(async () => {
    try {
      setLoading(true);
      const url = projectId
        ? `/api/reports?summary=true&projectId=${projectId}`
        : "/api/reports?summary=true";
      const response = await fetch(url);
      if (!response.ok) throw new Error("Failed to fetch reports");
      const data = await response.json();

      // Transform snake_case to camelCase (summary fields only)
      const transformed: ReportSummary[] = data.map(
        (r: Record<string, unknown>) => ({
          id: r.id,
          projectId: r.project_id,
          weekNo: r.week_no,
          docNo: r.doc_no,
          status: r.status,
          cashFlowStatus:
            (r.cash_flow as Record<string, unknown>)?.overallStatus || "green",
        })
      );

      setReports(transformed);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  // Fetch full report details by ID (for modal view)
  const fetchReportById = useCallback(
    async (id: string): Promise<Report | null> => {
      try {
        const response = await fetch(`/api/reports/${id}`);
        if (!response.ok) throw new Error("Failed to fetch report");
        const r = await response.json();

        // Transform snake_case to camelCase (full report)
        return {
          id: r.id,
          projectId: r.project_id,
          weekNo: r.week_no,
          docNo: r.doc_no,
          periodStart: r.period_start,
          periodEnd: r.period_end,
          preparedBy: r.prepared_by,
          checkedBy: r.checked_by,
          approvedBy: r.approved_by,
          approvalStatus: r.approval_status,
          status: r.status,
          evm: r.evm || {},
          epcc: r.epcc || {},
          overallProgress: r.overall_progress || {},
          hse: r.hse || {},
          quality: r.quality || {},
          cashFlow: r.cash_flow || {},
          tkdn: r.tkdn || {},
          thisWeekActivities: r.this_week_activities || {},
          nextWeekPlan: r.next_week_plan || {},
          milestonesSchedule: r.milestones_schedule || [],
          milestonesPayment: r.milestones_payment || [],
          sCurveData: r.s_curve_data || [],
          uploads: r.uploads || {},
          actualForecastPower: r.actual_forecast_power,
          createdAt: r.created_at,
          updatedAt: r.updated_at,
        };
      } catch (err) {
        console.error("Failed to fetch report:", err);
        return null;
      }
    },
    []
  );

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const createReport = async (report: Partial<Report>) => {
    const response = await fetch("/api/reports", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(report),
    });
    if (!response.ok) throw new Error("Failed to create report");
    await fetchReports();
    return response.json();
  };

  const updateReport = async (id: string, report: Partial<Report>) => {
    const response = await fetch(`/api/reports/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(report),
    });
    if (!response.ok) throw new Error("Failed to update report");
    await fetchReports();
    return response.json();
  };

  const deleteReport = async (id: string) => {
    const response = await fetch(`/api/reports/${id}`, {
      method: "DELETE",
    });
    if (!response.ok) throw new Error("Failed to delete report");
    await fetchReports();
  };

  const duplicateReport = async (reportSummary: ReportSummary) => {
    // Fetch full report first, then duplicate
    const report = await fetchReportById(reportSummary.id);
    if (!report) throw new Error("Failed to fetch report for duplication");

    const newReport = {
      ...report,
      weekNo: report.weekNo + 1,
      docNo: report.docNo?.replace(/\d+$/, (m) =>
        String(Number(m) + 1).padStart(m.length, "0")
      ),
      status: "Draft" as const,
      approvalStatus: "Pending" as const,
    };
    delete (newReport as Record<string, unknown>).id;
    delete (newReport as Record<string, unknown>).createdAt;
    delete (newReport as Record<string, unknown>).updatedAt;
    return createReport(newReport);
  };

  return {
    reports,
    loading,
    error,
    fetchReports,
    fetchReportById,
    createReport,
    updateReport,
    deleteReport,
    duplicateReport,
  };
}
