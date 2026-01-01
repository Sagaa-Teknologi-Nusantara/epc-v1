'use client';

import { useMemo, useCallback } from 'react';
import { useReportContext } from '@/contexts/ReportContext';
import { ProjectReportSelector } from '@/components/ui/ProjectReportSelector';
import { ExportPDFButton } from '@/components/ui/ExportPDFButton';
import { PDFExporter } from '@/lib/pdf-export';

interface RiskItem {
    category: string;
    level: 'Low' | 'Medium' | 'High' | 'Critical';
    description: string;
    recommendation: string;
}

interface MilestoneMetrics {
    total: number;
    completed: number;
    onTrack: number;
    atRisk: number;
    delayed: number;
    completionRate: number;
    avgDelay: number;
}

export default function AnalysisPage() {
    const { selectedProject, selectedReport, reports, loading } = useReportContext();

    // Calculate milestone metrics
    const calculateMilestoneMetrics = (milestones: Record<string, unknown>[] | undefined, type: 'schedule' | 'payment'): MilestoneMetrics => {
        if (!milestones || milestones.length === 0) {
            return { total: 0, completed: 0, onTrack: 0, atRisk: 0, delayed: 0, completionRate: 0, avgDelay: 0 };
        }

        let completed = 0, onTrack = 0, delayed = 0;
        let totalDelay = 0;

        milestones.forEach((m) => {
            if (m.status === 'Completed') completed++;
            else if (m.status === 'On Track') onTrack++;
            else if (m.status === 'Delay') {
                delayed++;
                // Calculate delay days if dates available
                if (m.planDate && m.actualForecastDate) {
                    const plan = new Date(m.planDate as string);
                    const actual = new Date(m.actualForecastDate as string);
                    const diff = Math.floor((actual.getTime() - plan.getTime()) / (1000 * 60 * 60 * 24));
                    if (diff > 0) totalDelay += diff;
                }
            }
        });

        return {
            total: milestones.length,
            completed,
            onTrack,
            atRisk: 0,
            delayed,
            completionRate: milestones.length > 0 ? (completed / milestones.length) * 100 : 0,
            avgDelay: delayed > 0 ? totalDelay / delayed : 0
        };
    };

    // Generate risks from report data (matching HTML calculateRisks function)
    const risks = useMemo<RiskItem[]>(() => {
        if (!selectedReport) return [];

        const riskList: RiskItem[] = [];
        const evm = selectedReport.evm || {};
        const hse = selectedReport.hse || {};
        const tkdn = selectedReport.tkdn || {};
        const progress = selectedReport.overallProgress || {};
        const msSchedule = (selectedReport.milestonesSchedule as unknown as Record<string, unknown>[]) || [];
        const msPayment = (selectedReport.milestonesPayment as unknown as Record<string, unknown>[]) || [];
        const quality = (selectedReport.quality as unknown as Record<string, unknown>) || {};
        const siteOffice = (quality.siteOffice as Record<string, unknown>) || {};
        const welding = (siteOffice.welding as Record<string, number>) || {};

        // Schedule Risk (SPI)
        const spi = evm.spiValue || 1;
        if (spi < 0.9) {
            riskList.push({
                category: 'Schedule',
                level: spi < 0.8 ? 'Critical' : 'High',
                description: `SPI ${spi.toFixed(3)} indicates ${((1 - spi) * 100).toFixed(0)}% schedule delay`,
                recommendation: 'Accelerate critical path activities, add resources, or reduce scope'
            });
        } else if (spi < 1.0) {
            riskList.push({
                category: 'Schedule',
                level: 'Medium',
                description: `SPI ${spi.toFixed(3)} shows minor schedule slip`,
                recommendation: 'Monitor closely and address bottlenecks'
            });
        }

        // Cost Risk (CPI)
        const cpi = evm.cpiValue || 1;
        if (cpi < 0.9) {
            riskList.push({
                category: 'Cost',
                level: cpi < 0.8 ? 'Critical' : 'High',
                description: `CPI ${cpi.toFixed(3)} indicates ${((1 - cpi) * 100).toFixed(0)}% cost overrun`,
                recommendation: 'Review cost drivers, optimize resources, renegotiate contracts'
            });
        } else if (cpi < 1.0) {
            riskList.push({
                category: 'Cost',
                level: 'Medium',
                description: `CPI ${cpi.toFixed(3)} shows minor cost variance`,
                recommendation: 'Track expenses carefully and optimize where possible'
            });
        }

        // Cash Flow Risk
        const cfStatus = selectedReport.cashFlow?.overallStatus || 'green';
        if (cfStatus === 'red') {
            riskList.push({
                category: 'Cash Flow',
                level: 'Critical',
                description: 'Cash flow is at risk with negative indicators',
                recommendation: 'Expedite billing and collections, negotiate payment terms'
            });
        } else if (cfStatus === 'yellow') {
            riskList.push({
                category: 'Cash Flow',
                level: 'Medium',
                description: 'Cash flow needs monitoring',
                recommendation: 'Review billing schedule and payment collections'
            });
        }

        // TKDN Risk
        const tkdnPlan = tkdn.plan || 0;
        const tkdnActual = tkdn.actual || 0;
        if (tkdnPlan > 0) {
            const variance = tkdnActual - tkdnPlan;
            if (variance < -5) {
                riskList.push({
                    category: 'TKDN',
                    level: variance < -10 ? 'Critical' : 'High',
                    description: `TKDN ${tkdnActual.toFixed(1)}% is ${Math.abs(variance).toFixed(1)}% below target ${tkdnPlan}%`,
                    recommendation: 'Increase local content procurement, review supplier mix'
                });
            }
        }

        // Safety Risk
        const lagging = hse.lagging || {};
        if (lagging.fatality && lagging.fatality > 0) {
            riskList.push({
                category: 'Safety',
                level: 'Critical',
                description: `${lagging.fatality} fatality incident(s) recorded`,
                recommendation: 'Immediate safety stand-down and root cause investigation'
            });
        } else if (lagging.lti && lagging.lti > 0) {
            riskList.push({
                category: 'Safety',
                level: 'High',
                description: `${lagging.lti} Lost Time Injury incident(s)`,
                recommendation: 'Review safety protocols and increase training'
            });
        }

        // Quality Risk (Welding)
        const ndtTotal = (welding.ndtAccepted || 0) + (welding.ndtRejected || 0);
        const rejRate = ndtTotal > 0 ? ((welding.ndtRejected || 0) / ndtTotal) * 100 : 0;
        const targetRate = welding.rejectionRatePlan || 2;
        if (rejRate > targetRate * 1.5) {
            riskList.push({
                category: 'Quality',
                level: 'High',
                description: `Welding rejection rate ${rejRate.toFixed(2)}% exceeds target ${targetRate}%`,
                recommendation: 'Review welder qualifications and welding procedures'
            });
        } else if (rejRate > targetRate) {
            riskList.push({
                category: 'Quality',
                level: 'Medium',
                description: `Welding rejection rate ${rejRate.toFixed(2)}% above target ${targetRate}%`,
                recommendation: 'Monitor welding quality closely'
            });
        }

        // Milestone Schedule Risk
        const msSchedMetrics = calculateMilestoneMetrics(msSchedule, 'schedule');
        if (msSchedMetrics.delayed > 0) {
            riskList.push({
                category: 'Milestone Schedule',
                level: msSchedMetrics.delayed > 2 ? 'Critical' : 'High',
                description: `${msSchedMetrics.delayed} schedule milestone(s) delayed`,
                recommendation: 'Review recovery plan and allocate resources'
            });
        }

        // Milestone Payment Risk
        const msPayMetrics = calculateMilestoneMetrics(msPayment, 'payment');
        if (msPayMetrics.delayed > 0) {
            riskList.push({
                category: 'Milestone Payment',
                level: msPayMetrics.delayed > 2 ? 'Critical' : 'High',
                description: `${msPayMetrics.delayed} payment milestone(s) delayed`,
                recommendation: 'Expedite invoice submission and follow up on collections'
            });
        }

        return riskList;
    }, [selectedReport]);

    // Risk summary
    const riskSummary = useMemo(() => ({
        critical: risks.filter(r => r.level === 'Critical').length,
        high: risks.filter(r => r.level === 'High').length,
        medium: risks.filter(r => r.level === 'Medium').length,
        low: risks.filter(r => r.level === 'Low').length,
    }), [risks]);

    // Group risks by category (moved before loading check to fix hooks order)
    const groupedRisks = useMemo(() => {
        const categories = ['Schedule', 'Cost', 'Cash Flow', 'Safety', 'Quality', 'TKDN', 'Milestone Schedule', 'Milestone Payment'];
        const grouped = categories.map(cat => ({
            category: cat,
            risks: risks.filter(r => r.category === cat)
        })).filter(c => c.risks.length > 0);

        const otherRisks = risks.filter(r => !categories.includes(r.category));
        if (otherRisks.length > 0) grouped.push({ category: 'Other', risks: otherRisks });

        return grouped;
    }, [risks]);

    // Extract metrics with proper defaults - MUST be before loading check for hooks
    const evm = selectedReport?.evm || { spiValue: 1, cpiValue: 1, bac: 0, bcws: 0, bcwp: 0, acwp: 0 };
    const hse = selectedReport?.hse || { lagging: { lti: 0 }, leading: {}, manpower: {}, trir: 0, safeHours: 0 };
    const tkdn = selectedReport?.tkdn || { plan: 0, actual: 0 };
    const cashFlow = selectedReport?.cashFlow || { overallStatus: 'green', overallScore: 0 };

    // Status calculations - needed for PDF export callback
    const cfStatus = cashFlow.overallStatus === 'green' ? 'HEALTHY' : cashFlow.overallStatus === 'yellow' ? 'AT RISK' : 'CRITICAL';
    const safetyStatus = (hse.lagging?.lti || 0) === 0 ? 'GREEN' : 'RED';
    const tkdnStatus = (tkdn.actual || 0) >= (tkdn.plan || 0) ? 'OK' : (tkdn.actual || 0) >= (tkdn.plan || 0) * 0.9 ? 'MONITOR' : 'AT RISK';

    // PDF Export handler - MUST be before any early returns
    const handleExportPDF = useCallback(async () => {
        const exporter = new PDFExporter({
            title: 'Risk Analysis',
            weekNo: selectedReport?.weekNo,
            projectName: selectedProject?.name,
        });
        exporter.addHeader();

        // Risk Summary
        exporter.addSectionTitle('Risk Summary');
        exporter.addStatsRow([
            { label: 'Critical', value: String(riskSummary.critical), status: riskSummary.critical > 0 ? 'bad' : 'good' },
            { label: 'High', value: String(riskSummary.high), status: riskSummary.high > 0 ? 'warning' : 'good' },
            { label: 'Medium', value: String(riskSummary.medium), status: 'neutral' },
            { label: 'Low', value: String(riskSummary.low), status: 'good' },
        ]);
        exporter.addSpacing();

        // Performance Indicators Row 1
        exporter.addSectionTitle('Performance Indicators');
        exporter.addStatsRow([
            { label: 'Schedule (SPI)', value: `${(evm.spiValue || 1).toFixed(3)}`, status: (evm.spiValue || 1) >= 1 ? 'good' : (evm.spiValue || 1) >= 0.9 ? 'warning' : 'bad' },
            { label: 'Cost (CPI)', value: `${(evm.cpiValue || 1).toFixed(3)}`, status: (evm.cpiValue || 1) >= 1 ? 'good' : (evm.cpiValue || 1) >= 0.9 ? 'warning' : 'bad' },
            { label: 'Cash Flow', value: cfStatus, status: cfStatus === 'HEALTHY' ? 'good' : cfStatus === 'AT RISK' ? 'warning' : 'bad' },
            { label: 'Safety', value: safetyStatus, status: safetyStatus === 'GREEN' ? 'good' : 'bad' },
        ]);
        exporter.addSpacing();

        // Quality & TKDN
        exporter.addSectionTitle('Quality & Compliance');
        const qualityLocal = (selectedReport?.quality as unknown as Record<string, unknown>) || {};
        const siteOfficeLocal = (qualityLocal.siteOffice as Record<string, unknown>) || {};
        const weldingLocal = (siteOfficeLocal.welding as Record<string, number>) || {};
        const ndtTotalLocal = (weldingLocal.ndtAccepted || 0) + (weldingLocal.ndtRejected || 0);
        const rejRateLocal = ndtTotalLocal > 0 ? ((weldingLocal.ndtRejected || 0) / ndtTotalLocal) * 100 : 0;
        const qualityStatusLocal = rejRateLocal <= (weldingLocal.rejectionRatePlan || 2) ? 'OK' : 'MONITOR';

        exporter.addStatsRow([
            { label: 'Quality', value: qualityStatusLocal, status: qualityStatusLocal === 'OK' ? 'good' : 'warning' },
            { label: 'Weld Rej Rate', value: `${rejRateLocal.toFixed(2)}%`, status: rejRateLocal <= 2 ? 'good' : 'bad' },
            { label: 'TKDN', value: tkdnStatus, status: tkdnStatus === 'OK' ? 'good' : tkdnStatus === 'MONITOR' ? 'warning' : 'bad' },
            { label: 'TKDN Actual', value: `${(tkdn.actual || 0).toFixed(1)}%`, status: (tkdn.actual || 0) >= (tkdn.plan || 0) ? 'good' : 'bad' },
        ]);
        exporter.addSpacing();

        // Milestone Analysis
        const msScheduleLocal = (selectedReport?.milestonesSchedule as unknown as Record<string, unknown>[]) || [];
        const msPaymentLocal = (selectedReport?.milestonesPayment as unknown as Record<string, unknown>[]) || [];

        if (msScheduleLocal.length > 0 || msPaymentLocal.length > 0) {
            exporter.addSectionTitle('Milestone Analysis');

            // Schedule Milestones
            const calcMsMetrics = (milestones: Record<string, unknown>[]) => {
                let completed = 0, onTrack = 0, delayed = 0, totalDelay = 0;
                milestones.forEach(ms => {
                    const status = String(ms.status || '').toLowerCase();
                    if (status === 'completed' || status === 'done') completed++;
                    else if (status === 'delayed' || status === 'at risk') { delayed++; totalDelay += Number(ms.delay || 0); }
                    else onTrack++;
                });
                return { completed, onTrack, delayed, total: milestones.length, avgDelay: delayed > 0 ? totalDelay / delayed : 0 };
            };

            const msSchedMetrics = calcMsMetrics(msScheduleLocal);
            const msPayMetrics = calcMsMetrics(msPaymentLocal);

            exporter.addText('Schedule Milestones:', 'normal');
            exporter.addStatsRow([
                { label: 'Completed', value: String(msSchedMetrics.completed), status: 'good' },
                { label: 'On Track', value: String(msSchedMetrics.onTrack), status: 'neutral' },
                { label: 'Delayed', value: String(msSchedMetrics.delayed), status: msSchedMetrics.delayed > 0 ? 'bad' : 'good' },
                { label: 'Rate', value: `${msSchedMetrics.total > 0 ? ((msSchedMetrics.completed / msSchedMetrics.total) * 100).toFixed(0) : 0}%`, status: 'neutral' },
            ]);

            exporter.addText('Payment Milestones:', 'normal');
            exporter.addStatsRow([
                { label: 'Completed', value: String(msPayMetrics.completed), status: 'good' },
                { label: 'On Track', value: String(msPayMetrics.onTrack), status: 'neutral' },
                { label: 'Delayed', value: String(msPayMetrics.delayed), status: msPayMetrics.delayed > 0 ? 'bad' : 'good' },
                { label: 'Rate', value: `${msPayMetrics.total > 0 ? ((msPayMetrics.completed / msPayMetrics.total) * 100).toFixed(0) : 0}%`, status: 'neutral' },
            ]);
            exporter.addSpacing();
        }

        // Detailed Risks (show all risks with recommendations)
        if (risks.length > 0) {
            exporter.addSectionTitle('Risk Register');

            // Group risks by category for PDF
            const risksByCategory: Record<string, RiskItem[]> = {};
            risks.forEach(risk => {
                if (!risksByCategory[risk.category]) {
                    risksByCategory[risk.category] = [];
                }
                risksByCategory[risk.category].push(risk);
            });

            // Export each category
            Object.entries(risksByCategory).forEach(([category, categoryRisks]) => {
                exporter.addText(`[${category}]`, 'normal');
                categoryRisks.forEach(risk => {
                    exporter.addKeyValue(`[${risk.level}]`, risk.description, risk.level === 'Critical' || risk.level === 'High');
                    if (risk.recommendation) {
                        exporter.addText(`  > Recommendation: ${risk.recommendation}`, 'small');
                    }
                });
                exporter.addSpacing(3);
            });
        } else {
            exporter.addSectionTitle('Risk Register');
            exporter.addText('No risks identified - All indicators within acceptable thresholds', 'normal');
        }

        const filename = `EPC_RiskAnalysis_Week${selectedReport?.weekNo || ''}_${new Date().toISOString().split('T')[0]}.pdf`;
        exporter.save(filename);
    }, [selectedProject, selectedReport, riskSummary, risks, evm, tkdn, cfStatus, safetyStatus, tkdnStatus]);

    if (loading) {
        return (
            <div className="flex min-h-[50vh] items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-teal-500 border-t-transparent"></div>
            </div>
        );
    }

    // Additional metrics (variables already defined above)
    const quality = (selectedReport?.quality as unknown as Record<string, unknown>) || {};
    const siteOffice = (quality.siteOffice as Record<string, unknown>) || {};
    const welding = (siteOffice.welding as Record<string, number>) || {};
    const msSchedule = (selectedReport?.milestonesSchedule as unknown as Record<string, unknown>[]) || [];
    const msPayment = (selectedReport?.milestonesPayment as unknown as Record<string, unknown>[]) || [];

    const msScheduleMetrics = calculateMilestoneMetrics(msSchedule, 'schedule');
    const msPaymentMetrics = calculateMilestoneMetrics(msPayment, 'payment');

    const ndtTotal = (welding.ndtAccepted || 0) + (welding.ndtRejected || 0);
    const rejRate = ndtTotal > 0 ? ((welding.ndtRejected || 0) / ndtTotal) * 100 : 0;

    // Status calculations for display
    const spiStatus = (evm.spiValue || 1) >= 1 ? 'OK' : (evm.spiValue || 1) >= 0.9 ? 'MONITOR' : 'AT RISK';
    const cpiStatus = (evm.cpiValue || 1) >= 1 ? 'OK' : 'MONITOR';
    const qualityStatus = rejRate <= (welding.rejectionRatePlan || 2) ? 'OK' : 'MONITOR';

    const getMsStatus = (metrics: MilestoneMetrics) => {
        if (metrics.total === 0) return { status: 'N/A', color: '#94a3b8', bg: 'from-slate-100 to-slate-200' };
        if (metrics.delayed > 0) return { status: 'AT RISK', color: '#dc2626', bg: 'from-red-50 to-red-100' };
        if (metrics.onTrack > 0 && metrics.completed < metrics.total) return { status: 'MONITOR', color: '#f59e0b', bg: 'from-amber-50 to-amber-100' };
        return { status: 'OK', color: '#16a34a', bg: 'from-green-50 to-green-100' };
    };

    const msSchedStatus = getMsStatus(msScheduleMetrics);
    const msPayStatus = getMsStatus(msPaymentMetrics);

    const getStatusColor = (status: string) => {
        if (status === 'OK' || status === 'GREEN' || status === 'HEALTHY') return 'text-green-600';
        if (status === 'MONITOR' || status === 'AT RISK') return 'text-amber-600';
        return 'text-red-600';
    };

    const getLevelBg = (level: string) => {
        if (level === 'Critical') return 'bg-red-100 text-red-600 border-red-300';
        if (level === 'High') return 'bg-orange-100 text-orange-600 border-orange-300';
        if (level === 'Medium') return 'bg-amber-100 text-amber-600 border-amber-300';
        return 'bg-green-100 text-green-600 border-green-300';
    };

    const getCategoryIcon = (cat: string) => {
        const icons: Record<string, string> = {
            'Schedule': '📅', 'Cost': '💰', 'Cash Flow': '💵', 'Safety': '🦺',
            'Quality': '🔍', 'TKDN': '🏭', 'Milestone Schedule': '🎯', 'Milestone Payment': '💳'
        };
        return icons[cat] || '📋';
    };

    const getCategoryColor = (cat: string) => {
        const colors: Record<string, string> = {
            'Schedule': '#16a34a', 'Cost': '#f59e0b', 'Cash Flow': '#ec4899', 'Safety': '#2563eb',
            'Quality': '#7c3aed', 'TKDN': '#0891b2', 'Milestone Schedule': '#8b5cf6', 'Milestone Payment': '#f59e0b'
        };
        return colors[cat] || '#64748b';
    };

    return (
        <div className="space-y-5">
            {/* Header */}
            <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-extrabold">📊 Risk Analysis & Trend - Week {selectedReport?.weekNo || '-'}</h1>
                    <p className="text-sm text-slate-500">{selectedProject?.name || 'Select a project'}</p>
                </div>
                <div className="flex items-center gap-3">
                    <ExportPDFButton onExport={handleExportPDF} label="Export PDF" />
                    <ProjectReportSelector />
                </div>
            </div>

            {/* Risk Summary Cards - Row 1 (4 cards) */}
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                {/* Schedule */}
                <div className="rounded-xl bg-gradient-to-br from-green-50 to-green-100 p-4 shadow-sm">
                    <p className="text-xs font-semibold text-green-600">📅 Schedule</p>
                    <p className={`text-xl font-extrabold ${getStatusColor(spiStatus)}`}>{spiStatus}</p>
                    <p className="text-xs text-slate-500">SPI: {(evm.spiValue || 1).toFixed(3)}</p>
                </div>

                {/* Cost */}
                <div className="rounded-xl bg-gradient-to-br from-amber-50 to-amber-100 p-4 shadow-sm">
                    <p className="text-xs font-semibold text-amber-600">💰 Cost</p>
                    <p className={`text-xl font-extrabold ${getStatusColor(cpiStatus)}`}>{cpiStatus}</p>
                    <p className="text-xs text-slate-500">CPI: {(evm.cpiValue || 1).toFixed(3)}</p>
                </div>

                {/* Cash Flow */}
                <div className="rounded-xl bg-gradient-to-br from-pink-50 to-pink-100 p-4 shadow-sm">
                    <p className="text-xs font-semibold text-pink-600">💵 Cash Flow</p>
                    <p className={`text-xl font-extrabold ${getStatusColor(cfStatus)}`}>{cfStatus}</p>
                    <p className="text-xs text-slate-500">Score: {((cashFlow.overallScore || 0) * 100).toFixed(0)}%</p>
                </div>

                {/* Safety */}
                <div className="rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 p-4 shadow-sm">
                    <p className="text-xs font-semibold text-blue-600">🦺 Safety</p>
                    <p className={`text-xl font-extrabold ${getStatusColor(safetyStatus)}`}>{safetyStatus}</p>
                    <p className="text-xs text-slate-500">TRIR: {(hse.trir || 0).toFixed(2)}</p>
                </div>
            </div>

            {/* Risk Summary Cards - Row 2 (4 cards) */}
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                {/* Quality */}
                <div className="rounded-xl bg-gradient-to-br from-purple-50 to-purple-100 p-4 shadow-sm">
                    <p className="text-xs font-semibold text-purple-600">🔍 Quality</p>
                    <p className={`text-xl font-extrabold ${getStatusColor(qualityStatus)}`}>{qualityStatus}</p>
                    <p className="text-xs text-slate-500">Weld Rej: {rejRate.toFixed(2)}%</p>
                </div>

                {/* TKDN */}
                <div className={`rounded-xl bg-gradient-to-br ${tkdnStatus === 'OK' ? 'from-cyan-50 to-cyan-100' : 'from-red-50 to-red-100'} p-4 shadow-sm`}>
                    <p className="text-xs font-semibold text-cyan-600">🏭 TKDN</p>
                    <p className={`text-xl font-extrabold ${getStatusColor(tkdnStatus)}`}>{tkdnStatus}</p>
                    <p className="text-xs text-slate-500">Act: {(tkdn.actual || 0).toFixed(1)}% / Plan: {tkdn.plan || 0}%</p>
                </div>

                {/* MS Schedule */}
                <div className={`rounded-xl bg-gradient-to-br ${msSchedStatus.bg} p-4 shadow-sm`}>
                    <p className="text-xs font-semibold text-violet-600">🎯 MS Schedule</p>
                    <p className="text-xl font-extrabold" style={{ color: msSchedStatus.color }}>{msSchedStatus.status}</p>
                    <p className="text-xs text-slate-500">{msScheduleMetrics.completed}/{msScheduleMetrics.total} done ({msScheduleMetrics.completionRate.toFixed(0)}%)</p>
                </div>

                {/* MS Payment */}
                <div className={`rounded-xl bg-gradient-to-br ${msPayStatus.bg} p-4 shadow-sm`}>
                    <p className="text-xs font-semibold text-amber-600">💳 MS Payment</p>
                    <p className="text-xl font-extrabold" style={{ color: msPayStatus.color }}>{msPayStatus.status}</p>
                    <p className="text-xs text-slate-500">{msPaymentMetrics.completed}/{msPaymentMetrics.total} done ({msPaymentMetrics.completionRate.toFixed(0)}%)</p>
                </div>
            </div>

            {/* Milestone Analysis Section */}
            {(msSchedule.length > 0 || msPayment.length > 0) && (
                <div className="rounded-2xl bg-white p-5 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-bold">🎯 Milestone Analysis</h3>
                        <span className="text-xs text-slate-500">Schedule & Payment Milestones Status</span>
                    </div>

                    <div className="grid gap-5 md:grid-cols-2">
                        {/* Schedule Milestones */}
                        <div className="rounded-xl bg-gradient-to-br from-violet-50 to-violet-100 border-2 border-violet-300 p-4">
                            <h4 className="font-semibold text-violet-700 mb-3">📅 Schedule Milestones</h4>
                            <div className="grid grid-cols-2 gap-3 mb-3">
                                {/* Status Distribution */}
                                <div className="rounded-lg bg-white p-3 space-y-2">
                                    <div className="flex justify-between text-xs">
                                        <span className="text-green-600">✅ Completed</span>
                                        <span className="font-bold">{msScheduleMetrics.completed}</span>
                                    </div>
                                    <div className="flex justify-between text-xs">
                                        <span className="text-amber-600">🟡 On Track</span>
                                        <span className="font-bold">{msScheduleMetrics.onTrack}</span>
                                    </div>
                                    <div className="flex justify-between text-xs">
                                        <span className="text-red-600">🔴 Delayed</span>
                                        <span className="font-bold">{msScheduleMetrics.delayed}</span>
                                    </div>
                                </div>

                                {/* Metrics */}
                                <div className="space-y-2">
                                    <div className="rounded-lg bg-white p-2">
                                        <p className="text-[10px] text-slate-500">Completion Rate</p>
                                        <div className="flex items-center gap-2">
                                            <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                                                <div className="h-full bg-violet-500 rounded-full" style={{ width: `${msScheduleMetrics.completionRate}%` }}></div>
                                            </div>
                                            <span className="text-xs font-bold text-violet-600">{msScheduleMetrics.completionRate.toFixed(0)}%</span>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        <div className="rounded-lg bg-white p-2 text-center">
                                            <p className="text-[9px] text-slate-500">Avg Delay</p>
                                            <p className={`text-sm font-bold ${msScheduleMetrics.avgDelay > 7 ? 'text-red-600' : 'text-slate-600'}`}>{msScheduleMetrics.avgDelay.toFixed(0)} days</p>
                                        </div>
                                        <div className="rounded-lg bg-white p-2 text-center">
                                            <p className="text-[9px] text-slate-500">At Risk</p>
                                            <p className={`text-sm font-bold ${msScheduleMetrics.delayed > 0 ? 'text-amber-600' : 'text-green-600'}`}>{msScheduleMetrics.delayed}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Payment Milestones */}
                        <div className="rounded-xl bg-gradient-to-br from-amber-50 to-amber-100 border-2 border-amber-300 p-4">
                            <h4 className="font-semibold text-amber-700 mb-3">💳 Payment Milestones</h4>
                            <div className="grid grid-cols-2 gap-3 mb-3">
                                {/* Status Distribution */}
                                <div className="rounded-lg bg-white p-3 space-y-2">
                                    <div className="flex justify-between text-xs">
                                        <span className="text-green-600">✅ Completed</span>
                                        <span className="font-bold">{msPaymentMetrics.completed}</span>
                                    </div>
                                    <div className="flex justify-between text-xs">
                                        <span className="text-amber-600">🟡 On Track</span>
                                        <span className="font-bold">{msPaymentMetrics.onTrack}</span>
                                    </div>
                                    <div className="flex justify-between text-xs">
                                        <span className="text-red-600">🔴 Delayed</span>
                                        <span className="font-bold">{msPaymentMetrics.delayed}</span>
                                    </div>
                                </div>

                                {/* Metrics */}
                                <div className="space-y-2">
                                    <div className="rounded-lg bg-white p-2">
                                        <p className="text-[10px] text-slate-500">Collection Rate</p>
                                        <div className="flex items-center gap-2">
                                            <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                                                <div className="h-full bg-amber-500 rounded-full" style={{ width: `${msPaymentMetrics.completionRate}%` }}></div>
                                            </div>
                                            <span className="text-xs font-bold text-amber-600">{msPaymentMetrics.completionRate.toFixed(0)}%</span>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        <div className="rounded-lg bg-white p-2 text-center">
                                            <p className="text-[9px] text-slate-500">Avg Delay</p>
                                            <p className={`text-sm font-bold ${msPaymentMetrics.avgDelay > 7 ? 'text-red-600' : 'text-slate-600'}`}>{msPaymentMetrics.avgDelay.toFixed(0)} days</p>
                                        </div>
                                        <div className="rounded-lg bg-white p-2 text-center">
                                            <p className="text-[9px] text-slate-500">At Risk</p>
                                            <p className={`text-sm font-bold ${msPaymentMetrics.delayed > 0 ? 'text-amber-600' : 'text-green-600'}`}>{msPaymentMetrics.delayed}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* TKDN Performance Section */}
            {(tkdn.plan > 0 || tkdn.actual > 0) && (
                <div className="rounded-2xl bg-gradient-to-r from-cyan-50 to-cyan-100 border-2 border-cyan-400 p-5 shadow-sm">
                    <h3 className="font-bold text-cyan-700 mb-4">🏭 TKDN Performance (Tingkat Komponen Dalam Negeri)</h3>
                    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                        <div className="rounded-lg bg-white p-4 text-center">
                            <p className="text-xs text-slate-500">Target Minimum</p>
                            <p className="text-3xl font-extrabold text-blue-600">{tkdn.plan || 0}%</p>
                        </div>
                        <div className="rounded-lg bg-white p-4 text-center">
                            <p className="text-xs text-slate-500">Realisasi Aktual</p>
                            <p className="text-3xl font-extrabold text-cyan-600">{(tkdn.actual || 0).toFixed(1)}%</p>
                        </div>
                        <div className="rounded-lg bg-white p-4 text-center">
                            <p className="text-xs text-slate-500">Variance</p>
                            <p className={`text-3xl font-extrabold ${((tkdn.actual || 0) - (tkdn.plan || 0)) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {((tkdn.actual || 0) - (tkdn.plan || 0)) >= 0 ? '+' : ''}{((tkdn.actual || 0) - (tkdn.plan || 0)).toFixed(1)}%
                            </p>
                        </div>
                        <div className={`rounded-lg p-4 text-center text-white ${tkdnStatus === 'OK' ? 'bg-green-500' : tkdnStatus === 'MONITOR' ? 'bg-amber-500' : 'bg-red-500'}`}>
                            <p className="text-xs opacity-80">Status</p>
                            <p className="text-lg font-extrabold">{tkdnStatus === 'OK' ? '✅ MEMENUHI' : tkdnStatus === 'MONITOR' ? '⚠️ MONITOR' : '❌ RISK'}</p>
                        </div>
                    </div>

                    {/* Achievement Bar */}
                    <div className="mt-4 rounded-lg bg-white p-3">
                        <p className="text-xs text-slate-500 mb-2">Achievement Rate:</p>
                        <div className="flex items-center gap-3">
                            <div className="flex-1 h-3 bg-slate-200 rounded-full overflow-hidden">
                                <div
                                    className={`h-full rounded-full ${tkdnStatus === 'OK' ? 'bg-gradient-to-r from-green-400 to-green-600' : 'bg-gradient-to-r from-amber-400 to-red-500'}`}
                                    style={{ width: `${Math.min(((tkdn.actual || 0) / (tkdn.plan || 1)) * 100, 100)}%` }}
                                ></div>
                            </div>
                            <span className={`text-sm font-bold ${tkdnStatus === 'OK' ? 'text-green-600' : 'text-amber-600'}`}>
                                {tkdn.plan > 0 ? ((tkdn.actual / tkdn.plan) * 100).toFixed(0) : 0}%
                            </span>
                        </div>
                    </div>
                </div>
            )}

            {/* Risk Register */}
            <div className="rounded-2xl bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold">⚠️ Risk Register</h3>
                    <div className="flex gap-2">
                        <span className="rounded-md bg-red-100 px-2 py-1 text-xs font-semibold text-red-600">High: {riskSummary.critical + riskSummary.high}</span>
                        <span className="rounded-md bg-amber-100 px-2 py-1 text-xs font-semibold text-amber-600">Medium: {riskSummary.medium}</span>
                        <span className="rounded-md bg-green-100 px-2 py-1 text-xs font-semibold text-green-600">Low: {riskSummary.low}</span>
                    </div>
                </div>

                {/* Grouped Risks */}
                {groupedRisks.length > 0 ? (
                    <div className="space-y-4">
                        {groupedRisks.map(group => (
                            <div key={group.category} className="rounded-lg border overflow-hidden">
                                <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 border-b">
                                    <span>{getCategoryIcon(group.category)}</span>
                                    <span className="font-semibold" style={{ color: getCategoryColor(group.category) }}>{group.category}</span>
                                    <span className="text-xs text-slate-500">({group.risks.length} risks)</span>
                                </div>
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="bg-slate-100">
                                            <th className="px-4 py-2 text-left font-semibold w-24">Level</th>
                                            <th className="px-4 py-2 text-left font-semibold">Description</th>
                                            <th className="px-4 py-2 text-left font-semibold">Recommendation</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {group.risks.map((risk, idx) => (
                                            <tr key={idx} className={`border-t ${risk.level === 'Critical' || risk.level === 'High' ? 'bg-red-50' : risk.level === 'Medium' ? 'bg-amber-50' : 'bg-white'} hover:opacity-80`}>
                                                <td className="px-4 py-2">
                                                    <span className={`inline-block rounded-full border px-2.5 py-0.5 text-xs font-semibold ${getLevelBg(risk.level)}`}>
                                                        {risk.level === 'Critical' ? '🔴' : risk.level === 'High' ? '🟠' : risk.level === 'Medium' ? '🟡' : '🟢'} {risk.level}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-2 text-slate-700">{risk.description}</td>
                                                <td className="px-4 py-2 text-slate-500">{risk.recommendation}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-8">
                        <span className="text-4xl">✅</span>
                        <p className="font-semibold text-green-600 mt-2">No significant risks identified</p>
                        <p className="text-xs text-slate-500">All performance indicators are within acceptable range</p>
                    </div>
                )}
            </div>
        </div>
    );
}
