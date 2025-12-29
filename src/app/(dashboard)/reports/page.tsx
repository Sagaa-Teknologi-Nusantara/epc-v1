'use client';

import { useState, useMemo } from 'react';
import { Icons } from '@/components/ui/Icons';
import { useReports, useProjects } from '@/hooks';
import { ReportModal } from '@/components/modals';
import type { Report } from '@/types';

export default function ReportsPage() {
    const { reports, loading, error, createReport, updateReport, deleteReport, duplicateReport } = useReports();
    const { projects } = useProjects();
    const [showModal, setShowModal] = useState(false);
    const [editingReport, setEditingReport] = useState<Report | null>(null);
    const [filterProjectId, setFilterProjectId] = useState<string>('all');

    // Filter reports by project
    const filteredReports = useMemo(() => {
        if (filterProjectId === 'all') return reports;
        return reports.filter(r => r.projectId === filterProjectId);
    }, [reports, filterProjectId]);

    // Get project name by ID
    const getProjectName = (projectId: string) => {
        const project = projects.find(p => p.id === projectId);
        return project?.name || 'Unknown Project';
    };

    const handleSave = async (data: Partial<Report>) => {
        if (editingReport) {
            await updateReport(editingReport.id, data);
        } else {
            await createReport(data);
        }
    };

    const openCreate = () => {
        setEditingReport(null);
        setShowModal(true);
    };

    const openEdit = (report: Report) => {
        setEditingReport(report);
        setShowModal(true);
    };

    if (loading) {
        return (
            <div className="flex min-h-[50vh] items-center justify-center">
                <div className="text-center">
                    <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-teal-500 border-t-transparent mx-auto"></div>
                    <p className="text-slate-500">Loading reports...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="rounded-2xl bg-red-50 p-8 text-center">
                <p className="text-red-600">Error: {error}</p>
                <p className="mt-2 text-sm text-slate-500">
                    Make sure the database migration has been run.
                </p>
            </div>
        );
    }

    return (
        <div>
            <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                <h1 className="text-2xl font-extrabold">Weekly Reports</h1>
                <div className="flex items-center gap-3">
                    {/* Project Filter */}
                    <select
                        value={filterProjectId}
                        onChange={(e) => setFilterProjectId(e.target.value)}
                        className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                    >
                        <option value="all">All Projects</option>
                        {projects.map(p => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                    </select>
                    <button
                        onClick={openCreate}
                        disabled={projects.length === 0}
                        className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-teal-500 to-teal-600 px-5 py-2.5 text-sm font-semibold text-white shadow hover:-translate-y-0.5 transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Icons.Plus className="h-4 w-4" />
                        Create Report
                    </button>
                </div>
            </div>

            {projects.length === 0 ? (
                <div className="rounded-2xl bg-amber-50 p-8 text-center">
                    <Icons.Project className="mx-auto h-12 w-12 text-amber-300" />
                    <h3 className="mt-4 text-lg font-semibold text-amber-700">No projects found</h3>
                    <p className="text-sm text-amber-600">You need to create a project first before creating reports.</p>
                </div>
            ) : filteredReports.length === 0 ? (
                <div className="rounded-2xl bg-slate-50 p-12 text-center">
                    <Icons.Report className="mx-auto h-12 w-12 text-slate-300" />
                    <h3 className="mt-4 text-lg font-semibold text-slate-600">
                        {filterProjectId === 'all' ? 'No reports yet' : 'No reports for this project'}
                    </h3>
                    <p className="text-sm text-slate-500">
                        {filterProjectId === 'all' ? 'Create your first weekly report' : 'Try selecting a different project or create a new report'}
                    </p>
                    <button
                        onClick={openCreate}
                        className="mt-4 rounded-lg bg-teal-500 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-600"
                    >
                        Create Report
                    </button>
                </div>
            ) : (
                filteredReports.map((r) => {
                    const cashFlowStatus = (r.cashFlow?.overallStatus as string) || 'green';
                    return (
                        <div key={r.id} className="mb-3 flex items-center justify-between rounded-2xl bg-white p-4 shadow-sm">
                            <div className="flex items-center gap-3">
                                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-teal-600 text-base font-extrabold text-white">
                                    {r.weekNo}
                                </div>
                                <div>
                                    <h3 className="text-sm font-bold">{r.docNo || `Week ${r.weekNo}`}</h3>
                                    <p className="text-xs text-slate-500">{getProjectName(r.projectId)}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-xs">
                                    {cashFlowStatus === 'green' ? '🟢' : cashFlowStatus === 'yellow' ? '🟡' : '🔴'}
                                </span>
                                <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${r.status === 'Issued'
                                    ? 'bg-green-100 text-green-600'
                                    : 'bg-amber-100 text-amber-600'
                                    }`}>
                                    {r.status}
                                </span>
                                <button
                                    onClick={() => openEdit(r)}
                                    className="rounded-lg bg-slate-100 p-2 text-slate-600 hover:bg-slate-200"
                                    title="Edit Report"
                                >
                                    <Icons.Edit className="h-3.5 w-3.5" />
                                </button>
                                <button
                                    onClick={() => duplicateReport(r)}
                                    className="rounded-lg bg-slate-100 p-2 text-slate-600 hover:bg-slate-200"
                                    title="Duplicate Report"
                                >
                                    <Icons.Copy className="h-3.5 w-3.5" />
                                </button>
                                <button
                                    onClick={() => {
                                        if (confirm('Are you sure you want to delete this report?')) {
                                            deleteReport(r.id);
                                        }
                                    }}
                                    className="rounded-lg bg-red-50 p-2 text-red-600 hover:bg-red-100"
                                    title="Delete Report"
                                >
                                    <Icons.Delete className="h-3.5 w-3.5" />
                                </button>
                            </div>
                        </div>
                    );
                })
            )}

            <ReportModal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                onSave={handleSave}
                report={editingReport}
                projects={projects}
            />
        </div>
    );
}
