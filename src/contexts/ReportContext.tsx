'use client';

import { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import { useSearchParams } from 'next/navigation';
import type { Project, Report } from '@/types';

interface ReportContextType {
    // Data
    projects: Project[];
    reports: Report[];
    loading: boolean;
    error: string | null;

    // Selection
    selectedReportId: string | null;
    selectedReport: Report | null;
    selectedProject: Project | null;

    // Actions
    setSelectedReportId: (id: string) => void;
    refreshData: () => Promise<void>;
}

const ReportContext = createContext<ReportContextType | null>(null);

export function useReportContext() {
    const context = useContext(ReportContext);
    if (!context) {
        throw new Error('useReportContext must be used within a ReportContextProvider');
    }
    return context;
}

interface ReportContextProviderProps {
    children: ReactNode;
}

export function ReportContextProvider({ children }: ReportContextProviderProps) {
    const searchParams = useSearchParams();
    const [projects, setProjects] = useState<Project[]>([]);
    const [reports, setReports] = useState<Report[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedReportId, setSelectedReportId] = useState<string | null>(null);

    // Read URL params for project/report selection (for print-to-PDF feature)
    const urlProjectId = searchParams.get('projectId');
    const urlReportId = searchParams.get('reportId');

    // Fetch data on mount
    const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
            const [projectsRes, reportsRes] = await Promise.all([
                fetch('/api/projects'),
                fetch('/api/reports')
            ]);

            if (!projectsRes.ok || !reportsRes.ok) {
                throw new Error('Failed to fetch data');
            }

            const projectsData = await projectsRes.json();
            const reportsData = await reportsRes.json();

            // Transform snake_case to camelCase
            const transformedProjects = projectsData.map((p: Record<string, unknown>) => ({
                id: p.id,
                name: p.name,
                owner: p.owner,
                contractor: p.contractor,
                technologyProvider: p.technology_provider,
                contractType: p.contract_type,
                termOfPayment: p.term_of_payment,
                contractPrice: p.contract_price,
                bac: p.bac,
                ldDelay: p.ld_delay,
                ldPerformance: p.ld_performance,
                scopeByOwner: p.scope_by_owner,
                startDate: p.start_date,
                finishDate: p.finish_date,
                guaranteedPower: p.guaranteed_power,
                ntpDate: p.ntp_date,
                codDate: p.cod_date,
                status: p.status,
                createdAt: p.created_at,
                updatedAt: p.updated_at,
            }));

            const transformedReports = reportsData.map((r: Record<string, unknown>) => ({
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
                evm: r.evm,
                epcc: r.epcc,
                overallProgress: r.overall_progress,
                hse: r.hse,
                quality: r.quality,
                cashFlow: r.cash_flow,
                tkdn: r.tkdn,
                thisWeekActivities: r.this_week_activities,
                nextWeekPlan: r.next_week_plan,
                milestonesSchedule: r.milestones_schedule || [],
                milestonesPayment: r.milestones_payment || [],
                sCurveData: r.s_curve_data || [],
                actualForecastPower: r.actual_forecast_power,
                uploads: r.uploads,
                createdAt: r.created_at,
                updatedAt: r.updated_at,
            }));

            setProjects(transformedProjects);
            setReports(transformedReports);

            // Priority: URL reportId > URL projectId (latest) > auto-select latest
            if (urlReportId && transformedReports.find((r: Report) => r.id === urlReportId)) {
                setSelectedReportId(urlReportId);
            } else if (urlProjectId) {
                // Get latest report for URL project
                const projectReports = transformedReports.filter((r: Report) => r.projectId === urlProjectId);
                if (projectReports.length > 0) {
                    const sorted = [...projectReports].sort((a: Report, b: Report) => b.weekNo - a.weekNo);
                    setSelectedReportId(sorted[0].id);
                }
            } else if (transformedReports.length > 0 && !selectedReportId) {
                const sorted = [...transformedReports].sort((a: Report, b: Report) => b.weekNo - a.weekNo);
                setSelectedReportId(sorted[0].id);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unknown error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [urlProjectId, urlReportId]);

    // Derived state
    const selectedReport = useMemo(() => {
        return reports.find(r => r.id === selectedReportId) || reports[0] || null;
    }, [reports, selectedReportId]);

    const selectedProject = useMemo(() => {
        if (!selectedReport) return projects[0] || null;
        return projects.find(p => p.id === selectedReport.projectId) || null;
    }, [projects, selectedReport]);

    const value: ReportContextType = {
        projects,
        reports,
        loading,
        error,
        selectedReportId,
        selectedReport,
        selectedProject,
        setSelectedReportId,
        refreshData: fetchData,
    };

    return (
        <ReportContext.Provider value={value}>
            {children}
        </ReportContext.Provider>
    );
}
