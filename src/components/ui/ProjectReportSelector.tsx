'use client';

import { useMemo } from 'react';
import { useReportContext } from '@/contexts/ReportContext';

interface ProjectReportSelectorProps {
    className?: string;
}

export function ProjectReportSelector({ className = '' }: ProjectReportSelectorProps) {
    const {
        projects,
        reports,
        loading,
        selectedProject,
        selectedReport,
        setSelectedReportId
    } = useReportContext();

    // Get reports for selected project
    const projectReports = useMemo(() => {
        if (!selectedProject) return reports;
        return reports
            .filter(r => r.projectId === selectedProject.id)
            .sort((a, b) => b.weekNo - a.weekNo);
    }, [reports, selectedProject]);

    // Get project name by ID
    const getProjectName = (projectId: string) => {
        const project = projects.find(p => p.id === projectId);
        return project?.name || 'Unknown';
    };

    if (loading) {
        return (
            <div className={`flex items-center gap-3 ${className}`}>
                <div className="h-9 w-48 animate-pulse rounded-lg bg-slate-200"></div>
                <div className="h-9 w-56 animate-pulse rounded-lg bg-slate-200"></div>
            </div>
        );
    }

    if (projects.length === 0) {
        return (
            <div className={`flex items-center gap-2 text-sm text-amber-600 ${className}`}>
                <span>⚠️ No projects found. Create a project first.</span>
            </div>
        );
    }

    return (
        <div className={`flex flex-wrap items-center gap-3 ${className}`}>
            {/* Project Selector */}
            <div className="flex items-center gap-2">
                <label className="text-xs font-semibold text-slate-500">Project:</label>
                <select
                    value={selectedProject?.id || ''}
                    onChange={(e) => {
                        // Find first report for selected project
                        const projectId = e.target.value;
                        const firstReport = reports
                            .filter(r => r.projectId === projectId)
                            .sort((a, b) => b.weekNo - a.weekNo)[0];
                        if (firstReport) {
                            setSelectedReportId(firstReport.id);
                        }
                    }}
                    className="min-w-[200px] rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                >
                    {projects.map((p) => (
                        <option key={p.id} value={p.id}>
                            {p.name}
                        </option>
                    ))}
                </select>
            </div>

            {/* Report Selector */}
            <div className="flex items-center gap-2">
                <label className="text-xs font-semibold text-slate-500">Report:</label>
                <select
                    value={selectedReport?.id || ''}
                    onChange={(e) => setSelectedReportId(e.target.value)}
                    className="min-w-[240px] rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                >
                    {projectReports.length === 0 ? (
                        <option value="">No reports available</option>
                    ) : (
                        projectReports.map((r) => (
                            <option key={r.id} value={r.id}>
                                Week {r.weekNo} {r.periodStart && r.periodEnd ? `| ${r.periodStart} - ${r.periodEnd}` : ''} {r.docNo ? `(${r.docNo})` : ''}
                            </option>
                        ))
                    )}
                </select>
            </div>

            {/* Status Badge */}
            {selectedReport && (
                <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${selectedReport.status === 'Issued'
                        ? 'bg-green-100 text-green-600'
                        : 'bg-amber-100 text-amber-600'
                    }`}>
                    {selectedReport.status}
                </span>
            )}
        </div>
    );
}
