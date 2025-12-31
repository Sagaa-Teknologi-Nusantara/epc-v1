'use client';

import { useState, useMemo, useCallback, useRef } from 'react';
import { useReportContext } from '@/contexts/ReportContext';
import { Icons } from '@/components/ui/Icons';
import { ExportPDFButton } from '@/components/ui/ExportPDFButton';
import { PDFExporter } from '@/lib/pdf-export';

// Trend Line Chart Component (SVG-based)
interface TrendLine {
    key: string;
    label: string;
    color: string;
    fill?: boolean;
}

interface TrendDataPoint {
    week: string;
    weekNo: number;
    [key: string]: number | string;
}

const TrendLineChart = ({ data, lines, title, yLabel, height = 180 }: {
    data: TrendDataPoint[];
    lines: TrendLine[];
    title: string;
    yLabel?: string;
    height?: number;
}) => {
    if (!data || data.length === 0) {
        return <div className="text-center text-slate-400 py-10">No trend data available</div>;
    }

    if (data.length === 1) {
        const d = data[0];
        return (
            <div className="bg-slate-50 p-3 rounded-lg">
                <p className="text-xs font-semibold mb-2 text-slate-700">{title}</p>
                <div className="text-center py-3">
                    <p className="text-xs text-slate-500 mb-2">{d.week}</p>
                    <div className="flex justify-center gap-3 flex-wrap">
                        {lines.map((line, idx) => (
                            <div key={idx} className="text-center p-2 bg-white rounded-md" style={{ border: `2px solid ${line.color}` }}>
                                <p className="text-[9px] text-slate-500">{line.label}</p>
                                <p className="text-sm font-bold" style={{ color: line.color }}>
                                    {typeof d[line.key] === 'number' ? (d[line.key] as number).toFixed(2) : d[line.key] || 0}
                                </p>
                            </div>
                        ))}
                    </div>
                    <p className="text-[9px] text-slate-400 mt-3">📊 Trend akan tampil setelah 2+ data report</p>
                </div>
            </div>
        );
    }

    const w = 300, h = height, p = { top: 25, right: 20, bottom: 35, left: 50 };
    const chartW = w - p.left - p.right;
    const chartH = h - p.top - p.bottom;

    // Calculate min/max across all lines
    const allValues: number[] = [];
    lines.forEach(line => {
        data.forEach(d => {
            if (d[line.key] !== undefined) allValues.push(Number(d[line.key]));
        });
    });
    const minVal = Math.min(...allValues);
    const maxVal = Math.max(...allValues);
    const range = maxVal - minVal || 1;
    const yMin = minVal - range * 0.1;
    const yMax = maxVal + range * 0.1;

    const getX = (i: number) => p.left + (i / (data.length - 1 || 1)) * chartW;
    const getY = (v: number) => p.top + chartH - (((v - yMin) / (yMax - yMin)) * chartH);

    const formatValue = (val: number) => {
        if (val >= 1000000) return (val / 1e6).toFixed(1) + 'M';
        if (val >= 1000) return (val / 1e3).toFixed(0) + 'K';
        return val.toFixed(2);
    };

    return (
        <div className="bg-slate-50 p-3 rounded-lg">
            <p className="text-xs font-semibold mb-2 text-slate-700">{title}</p>
            <svg viewBox={`0 0 ${w} ${h}`} className="w-full" style={{ height }}>
                <defs>
                    {lines.map((line, idx) => (
                        <linearGradient key={idx} id={`grad-${line.key}-${idx}`} x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor={line.color} stopOpacity="0.3" />
                            <stop offset="100%" stopColor={line.color} stopOpacity="0.05" />
                        </linearGradient>
                    ))}
                </defs>

                {/* Grid lines */}
                {[0, 0.25, 0.5, 0.75, 1].map((pct, i) => {
                    const y = p.top + chartH * pct;
                    const val = yMax - (yMax - yMin) * pct;
                    return (
                        <g key={i}>
                            <line x1={p.left} y1={y} x2={w - p.right} y2={y} stroke="#e2e8f0" strokeWidth="0.5" />
                            <text x={p.left - 4} y={y} fontSize="7" fill="#94a3b8" textAnchor="end" dominantBaseline="middle">
                                {formatValue(val)}
                            </text>
                        </g>
                    );
                })}

                {/* Lines and areas */}
                {lines.map((line, idx) => {
                    const points = data.map((d, i) => ({ x: getX(i), y: getY(Number(d[line.key]) || 0) }));
                    const pathD = points.map((pt, i) => `${i === 0 ? 'M' : 'L'}${pt.x},${pt.y}`).join(' ');
                    const areaD = pathD + ` L${points[points.length - 1].x},${p.top + chartH} L${points[0].x},${p.top + chartH} Z`;
                    return (
                        <g key={idx}>
                            {line.fill && <path d={areaD} fill={`url(#grad-${line.key}-${idx})`} />}
                            <path d={pathD} fill="none" stroke={line.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            {points.map((pt, i) => <circle key={i} cx={pt.x} cy={pt.y} r="3" fill={line.color} stroke="white" strokeWidth="1" />)}
                        </g>
                    );
                })}

                {/* X-axis labels */}
                {data.map((d, i) => (
                    <text key={i} x={getX(i)} y={h - 10} fontSize="7" fill="#64748b" textAnchor="middle">{d.week}</text>
                ))}

                {/* Y-axis label */}
                {yLabel && <text x={12} y={h / 2} fontSize="8" fill="#64748b" textAnchor="middle" transform={`rotate(-90,12,${h / 2})`}>{yLabel}</text>}
            </svg>

            {/* Legend */}
            <div className="flex justify-center gap-4 mt-2">
                {lines.map((line, idx) => (
                    <div key={idx} className="flex items-center gap-1">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: line.color }}></div>
                        <span className="text-[9px] text-slate-600">{line.label}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

// Trend Bar Chart Component
const TrendBarChart = ({ data, bars, title, height = 180 }: {
    data: TrendDataPoint[];
    bars: TrendLine[];
    title: string;
    height?: number;
}) => {
    if (!data || data.length === 0) {
        return <div className="text-center text-slate-400 py-10">No trend data available</div>;
    }

    const w = 300, h = height, p = { top: 25, right: 20, bottom: 35, left: 45 };
    const chartW = w - p.left - p.right;
    const chartH = h - p.top - p.bottom;

    const allValues: number[] = [];
    bars.forEach(bar => data.forEach(d => allValues.push(Number(d[bar.key]) || 0)));
    const maxVal = Math.max(...allValues) || 1;

    const barGroupWidth = chartW / data.length;
    const barWidth = (barGroupWidth * 0.7) / bars.length;

    return (
        <div className="bg-slate-50 p-3 rounded-lg">
            <p className="text-xs font-semibold mb-2 text-slate-700">{title}</p>
            <svg viewBox={`0 0 ${w} ${h}`} className="w-full" style={{ height }}>
                {/* Grid lines */}
                {[0, 0.25, 0.5, 0.75, 1].map((pct, i) => {
                    const y = p.top + chartH * (1 - pct);
                    const val = maxVal * pct;
                    return (
                        <g key={i}>
                            <line x1={p.left} y1={y} x2={w - p.right} y2={y} stroke="#e2e8f0" strokeWidth="0.5" />
                            <text x={p.left - 4} y={y} fontSize="7" fill="#94a3b8" textAnchor="end" dominantBaseline="middle">
                                {val >= 1000 ? (val / 1000).toFixed(0) + 'K' : val.toFixed(0)}
                            </text>
                        </g>
                    );
                })}

                {/* Bars */}
                {data.map((d, i) => {
                    const groupX = p.left + i * barGroupWidth + barGroupWidth * 0.15;
                    return (
                        <g key={i}>
                            {bars.map((bar, j) => {
                                const val = Number(d[bar.key]) || 0;
                                const barH = (val / maxVal) * chartH;
                                return (
                                    <rect
                                        key={j}
                                        x={groupX + j * barWidth}
                                        y={p.top + chartH - barH}
                                        width={barWidth - 2}
                                        height={barH}
                                        fill={bar.color}
                                        rx="2"
                                    />
                                );
                            })}
                            <text x={p.left + i * barGroupWidth + barGroupWidth / 2} y={h - 10} fontSize="7" fill="#64748b" textAnchor="middle">
                                {d.week}
                            </text>
                        </g>
                    );
                })}
            </svg>

            {/* Legend */}
            <div className="flex justify-center gap-4 mt-2">
                {bars.map((bar, idx) => (
                    <div key={idx} className="flex items-center gap-1">
                        <div className="w-3 h-3 rounded" style={{ backgroundColor: bar.color }}></div>
                        <span className="text-[9px] text-slate-600">{bar.label}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default function TrendPage() {
    const { projects, reports, loading } = useReportContext();
    const [selectedProjectId, setSelectedProjectId] = useState<string>('');
    const [weekFrom, setWeekFrom] = useState<number>(1);
    const [weekTo, setWeekTo] = useState<number>(52);
    const chartsRef = useRef<HTMLDivElement>(null);

    // Get project reports for selected project
    const projectReports = useMemo(() => {
        let filtered = reports;

        if (selectedProjectId) {
            filtered = reports.filter(r => r.projectId === selectedProjectId);
        }

        filtered = filtered.filter(r => r.weekNo >= weekFrom && r.weekNo <= weekTo);

        return filtered.sort((a, b) => a.weekNo - b.weekNo);
    }, [reports, selectedProjectId, weekFrom, weekTo]);

    // Generate trend data from reports
    const trendData = useMemo(() => {
        return projectReports.map(r => ({
            week: `W${r.weekNo}`,
            weekNo: r.weekNo,
            // Progress
            planProgress: r.overallProgress?.plan || 0,
            actualProgress: r.overallProgress?.actual || 0,
            engineering: r.epcc?.engineering?.actual || 0,
            procurement: r.epcc?.procurement?.actual || 0,
            construction: r.epcc?.construction?.actual || 0,
            commissioning: r.epcc?.commissioning?.actual || 0,
            // EVM
            spi: r.evm?.spiValue || 1,
            cpi: r.evm?.cpiValue || 1,
            bcws: r.evm?.bcws || 0,
            bcwp: r.evm?.bcwp || 0,
            acwp: r.evm?.acwp || 0,
            // Schedule Variance
            sv: (r.evm?.bcwp || 0) - (r.evm?.bcws || 0),
            svPercent: (r.evm?.bcws || 0) > 0 ? (((r.evm?.bcwp || 0) - (r.evm?.bcws || 0)) / (r.evm?.bcws || 1)) * 100 : 0,
            cv: (r.evm?.bcwp || 0) - (r.evm?.acwp || 0),
            cvPercent: (r.evm?.bcwp || 0) > 0 ? (((r.evm?.bcwp || 0) - (r.evm?.acwp || 0)) / (r.evm?.bcwp || 1)) * 100 : 0,
            // Cash Flow
            cashOut: r.cashFlow?.cashOut || 0,
            billing: r.cashFlow?.billing || 0,
            cashIn: r.cashFlow?.cashIn || 0,
            balance: (r.cashFlow?.cashIn || 0) - (r.cashFlow?.cashOut || 0),
            // Safety
            safeHours: r.hse?.safeHours || 0,
            manpower: r.hse?.manpower?.total || 0,
            nearMiss: r.hse?.leading?.nearMiss || 0,
            observations: r.hse?.leading?.safetyObservation || 0,
            // TKDN
            tkdnPlan: r.tkdn?.plan || 0,
            tkdnActual: r.tkdn?.actual || 0,
            // Quality
            weldingRejectionRate: (() => {
                const quality = r.quality as unknown as Record<string, unknown> | undefined;
                const siteOffice = quality?.siteOffice as Record<string, unknown> | undefined;
                const welding = siteOffice?.welding as Record<string, number> | undefined;
                const ndtTotal = (welding?.ndtAccepted || 0) + (welding?.ndtRejected || 0);
                return ndtTotal > 0 ? ((welding?.ndtRejected || 0) / ndtTotal) * 100 : 0;
            })(),
            weldingTarget: (() => {
                const quality = r.quality as unknown as Record<string, unknown> | undefined;
                const siteOffice = quality?.siteOffice as Record<string, unknown> | undefined;
                const welding = siteOffice?.welding as Record<string, number> | undefined;
                return welding?.rejectionRatePlan || 2;
            })(),
            ndtAccepted: (() => {
                const quality = r.quality as unknown as Record<string, unknown> | undefined;
                const siteOffice = quality?.siteOffice as Record<string, unknown> | undefined;
                const welding = siteOffice?.welding as Record<string, number> | undefined;
                return welding?.ndtAccepted || 0;
            })(),
            ndtRejected: (() => {
                const quality = r.quality as unknown as Record<string, unknown> | undefined;
                const siteOffice = quality?.siteOffice as Record<string, unknown> | undefined;
                const welding = siteOffice?.welding as Record<string, number> | undefined;
                return welding?.ndtRejected || 0;
            })(),
            // NCR Data
            ncrOpen: (() => {
                const quality = r.quality as unknown as Record<string, unknown> | undefined;
                const siteOffice = quality?.siteOffice as Record<string, unknown> | undefined;
                const ncr = siteOffice?.ncr as Record<string, number> | undefined;
                return (ncr?.open || 0);
            })(),
            ncrClosed: (() => {
                const quality = r.quality as unknown as Record<string, unknown> | undefined;
                const siteOffice = quality?.siteOffice as Record<string, unknown> | undefined;
                const ncr = siteOffice?.ncr as Record<string, number> | undefined;
                return (ncr?.closed || 0);
            })(),
            // Punch List Data
            punchOpen: (() => {
                const quality = r.quality as unknown as Record<string, unknown> | undefined;
                const siteOffice = quality?.siteOffice as Record<string, unknown> | undefined;
                const punch = siteOffice?.punchList as Record<string, number> | undefined;
                return (punch?.open || 0);
            })(),
            punchClosed: (() => {
                const quality = r.quality as unknown as Record<string, unknown> | undefined;
                const siteOffice = quality?.siteOffice as Record<string, unknown> | undefined;
                const punch = siteOffice?.punchList as Record<string, number> | undefined;
                return (punch?.closed || 0);
            })(),
            // Certificate Data
            certCompleted: (() => {
                const quality = r.quality as unknown as Record<string, unknown> | undefined;
                const siteOffice = quality?.siteOffice as Record<string, unknown> | undefined;
                const cert = siteOffice?.certificate as Record<string, number> | undefined;
                return (cert?.completed || 0);
            })(),
        }));
    }, [projectReports]);

    // Get available week range
    const weekRange = useMemo(() => {
        if (reports.length === 0) return { min: 1, max: 52 };
        const weeks = reports.map(r => r.weekNo);
        return { min: Math.min(...weeks), max: Math.max(...weeks) };
    }, [reports]);

    const selectedProject = projects.find(p => p.id === selectedProjectId);

    // PDF Export handler - MUST be before any early returns to satisfy Rules of Hooks
    const handleExportPDF = useCallback(async () => {
        const exporter = new PDFExporter({
            title: 'Trend Analysis',
            projectName: selectedProject?.name,
        });
        exporter.addHeader();

        // Summary
        exporter.addSectionTitle('Analysis Summary');
        exporter.addKeyValue('Project:', selectedProject?.name || 'N/A', true);
        exporter.addKeyValue('Period:', `Week ${weekFrom} - ${weekTo}`);
        exporter.addKeyValue('Data Points:', `${trendData.length} weeks`);
        exporter.addSpacing();

        if (trendData.length > 0) {
            // Show Progress for all weeks
            exporter.addSectionTitle('Progress Trend - All Weeks');
            trendData.forEach((week, idx) => {
                const variance = (week.actualProgress as number || 0) - (week.planProgress as number || 0);
                exporter.addStatsRow([
                    { label: week.week, value: '', status: 'neutral' },
                    { label: 'Plan', value: `${(week.planProgress as number || 0).toFixed(1)}%`, status: 'neutral' },
                    { label: 'Actual', value: `${(week.actualProgress as number || 0).toFixed(1)}%`, status: variance >= 0 ? 'good' : 'bad' },
                    { label: 'Var', value: `${variance >= 0 ? '+' : ''}${variance.toFixed(1)}%`, status: variance >= 0 ? 'good' : 'bad' },
                ]);
            });
            exporter.addSpacing();

            // Show EVM for all weeks
            exporter.addSectionTitle('EVM Performance - All Weeks');
            trendData.forEach((week) => {
                exporter.addStatsRow([
                    { label: week.week, value: '', status: 'neutral' },
                    { label: 'SPI', value: (week.spi as number || 1).toFixed(3), status: (week.spi as number) >= 1 ? 'good' : (week.spi as number) >= 0.9 ? 'warning' : 'bad' },
                    { label: 'CPI', value: (week.cpi as number || 1).toFixed(3), status: (week.cpi as number) >= 1 ? 'good' : (week.cpi as number) >= 0.9 ? 'warning' : 'bad' },
                ]);
            });
            exporter.addSpacing();

            // Show Cash Flow for all weeks
            exporter.addSectionTitle('Cash Flow - All Weeks');
            trendData.forEach((week) => {
                exporter.addStatsRow([
                    { label: week.week, value: '', status: 'neutral' },
                    { label: 'Out', value: `$${((week.cashOut as number || 0) / 1e6).toFixed(1)}M`, status: 'bad' },
                    { label: 'In', value: `$${((week.cashIn as number || 0) / 1e6).toFixed(1)}M`, status: 'good' },
                    { label: 'Balance', value: `$${((week.balance as number || 0) / 1e6).toFixed(1)}M`, status: (week.balance as number) >= 0 ? 'good' : 'bad' },
                ]);
            });
            exporter.addSpacing();

            // Show Safety for all weeks
            exporter.addSectionTitle('Safety Trend - All Weeks');
            trendData.forEach((week) => {
                exporter.addStatsRow([
                    { label: week.week, value: '', status: 'neutral' },
                    { label: 'Safe Hrs', value: `${((week.safeHours as number) / 1000 || 0).toFixed(0)}K`, status: 'good' },
                    { label: 'Manpower', value: String(week.manpower || 0), status: 'neutral' },
                    { label: 'Near Miss', value: String(week.nearMiss || 0), status: 'neutral' },
                ]);
            });
            exporter.addSpacing();

            // Show Quality for all weeks
            exporter.addSectionTitle('Quality Performance - All Weeks');
            trendData.forEach((week) => {
                exporter.addStatsRow([
                    { label: week.week, value: '', status: 'neutral' },
                    { label: 'Weld Rej', value: `${((week.weldingRejectionRate as number) || 0).toFixed(2)}%`, status: ((week.weldingRejectionRate as number) || 0) <= 2 ? 'good' : 'bad' },
                    { label: 'NCR Open', value: String(week.ncrOpen || 0), status: (week.ncrOpen as number || 0) === 0 ? 'good' : 'warning' },
                    { label: 'Punch Open', value: String(week.punchOpen || 0), status: (week.punchOpen as number || 0) === 0 ? 'good' : 'warning' },
                ]);
            });
            exporter.addSpacing();

            // Show TKDN for all weeks
            exporter.addSectionTitle('TKDN Performance - All Weeks');
            trendData.forEach((week) => {
                const tkdnVar = (week.tkdnActual as number || 0) - (week.tkdnPlan as number || 0);
                exporter.addStatsRow([
                    { label: week.week, value: '', status: 'neutral' },
                    { label: 'Target', value: `${(week.tkdnPlan as number || 0).toFixed(1)}%`, status: 'neutral' },
                    { label: 'Actual', value: `${(week.tkdnActual as number || 0).toFixed(1)}%`, status: tkdnVar >= 0 ? 'good' : 'bad' },
                    { label: 'Status', value: tkdnVar >= 0 ? 'OK' : 'RISK', status: tkdnVar >= 0 ? 'good' : 'bad' },
                ]);
            });
        }

        exporter.addSpacing();
        exporter.addText(`Report generated: ${new Date().toLocaleString()}`, 'small');

        const filename = `EPC_TrendAnalysis_W${weekFrom}-${weekTo}_${new Date().toISOString().split('T')[0]}.pdf`;
        exporter.save(filename);
    }, [selectedProjectId, selectedProject, weekFrom, weekTo, trendData]);

    if (loading) {
        return (
            <div className="flex min-h-[50vh] items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-teal-500 border-t-transparent"></div>
            </div>
        );
    }

    // selectedProject already defined above


    return (
        <div className="space-y-5">
            {/* Header with Filters */}
            <div className="rounded-2xl bg-gradient-to-r from-teal-600 to-teal-700 p-5 text-white">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-extrabold flex items-center gap-2">
                            <Icons.Chart className="w-7 h-7" />
                            Trend Analysis
                        </h1>
                        <p className="text-sm text-teal-100 mt-1">
                            {selectedProject?.name || 'Select Project'}
                            {' · '}Week {weekFrom} - {weekTo}
                        </p>
                    </div>

                    {/* Filters */}
                    <div className="flex flex-wrap items-center gap-3">
                        {/* Project Filter */}
                        <div>
                            <label className="block text-xs text-teal-200 mb-1">Project</label>
                            <select
                                value={selectedProjectId}
                                onChange={e => setSelectedProjectId(e.target.value)}
                                className="rounded-lg border-0 bg-white/20 text-white px-3 py-2 text-sm focus:ring-2 focus:ring-white/50"
                            >
                                <option value="" className="text-slate-800">Select Project</option>
                                {projects.map(p => (
                                    <option key={p.id} value={p.id} className="text-slate-800">{p.name}</option>
                                ))}
                            </select>
                        </div>

                        {/* Week From */}
                        <div>
                            <label className="block text-xs text-teal-200 mb-1">From Week</label>
                            <input
                                type="number"
                                min={weekRange.min}
                                max={weekTo}
                                value={weekFrom}
                                onChange={e => setWeekFrom(Number(e.target.value))}
                                className="w-20 rounded-lg border-0 bg-white/20 text-white px-3 py-2 text-sm focus:ring-2 focus:ring-white/50"
                            />
                        </div>

                        {/* Week To */}
                        <div>
                            <label className="block text-xs text-teal-200 mb-1">To Week</label>
                            <input
                                type="number"
                                min={weekFrom}
                                max={weekRange.max}
                                value={weekTo}
                                onChange={e => setWeekTo(Number(e.target.value))}
                                className="w-20 rounded-lg border-0 bg-white/20 text-white px-3 py-2 text-sm focus:ring-2 focus:ring-white/50"
                            />
                        </div>

                        {/* Export Button */}
                        <ExportPDFButton onExport={handleExportPDF} label="Export PDF" />
                    </div>
                </div>
            </div>

            {/* Data Summary */}
            <div className="text-sm text-slate-500">
                Showing <span className="font-semibold text-teal-600">{trendData.length}</span> data points
            </div>

            {trendData.length === 0 ? (
                <div className="rounded-2xl bg-white p-10 text-center shadow-sm">
                    <Icons.Chart className="w-16 h-16 mx-auto text-slate-300 mb-4" />
                    <h3 className="text-lg font-semibold text-slate-600">No Data Available</h3>
                    <p className="text-sm text-slate-400 mt-2">Select a different project or week range</p>
                </div>
            ) : (
                <>
                    {/* Progress Trend */}
                    <div className="rounded-2xl bg-white p-5 shadow-sm">
                        <h3 className="font-bold text-green-600 border-b-2 border-green-500 pb-2 mb-4">📈 Progress Trend</h3>
                        <div className="grid md:grid-cols-2 gap-4">
                            <TrendLineChart
                                data={trendData}
                                lines={[
                                    { key: 'planProgress', label: 'Plan', color: '#3b82f6', fill: true },
                                    { key: 'actualProgress', label: 'Actual', color: '#22c55e', fill: true },
                                ]}
                                title="Overall Progress"
                                yLabel="%"
                            />
                            <TrendLineChart
                                data={trendData}
                                lines={[
                                    { key: 'engineering', label: 'Engineering', color: '#8b5cf6' },
                                    { key: 'procurement', label: 'Procurement', color: '#f59e0b' },
                                    { key: 'construction', label: 'Construction', color: '#22c55e' },
                                    { key: 'commissioning', label: 'Commissioning', color: '#ef4444' },
                                ]}
                                title="EPCC Progress"
                                yLabel="%"
                            />
                        </div>
                    </div>

                    {/* EVM Trend */}
                    <div className="rounded-2xl bg-white p-5 shadow-sm">
                        <h3 className="font-bold text-amber-600 border-b-2 border-amber-500 pb-2 mb-4">📊 EVM Trend</h3>
                        <div className="grid md:grid-cols-2 gap-4">
                            <TrendLineChart
                                data={trendData}
                                lines={[
                                    { key: 'spi', label: 'SPI', color: '#16a34a' },
                                    { key: 'cpi', label: 'CPI', color: '#f59e0b' },
                                ]}
                                title="SPI & CPI Trend"
                                yLabel="Index"
                            />
                            <TrendLineChart
                                data={trendData}
                                lines={[
                                    { key: 'bcws', label: 'BCWS (Plan)', color: '#3b82f6', fill: true },
                                    { key: 'bcwp', label: 'BCWP (Earned)', color: '#22c55e' },
                                    { key: 'acwp', label: 'ACWP (Cost)', color: '#ef4444' },
                                ]}
                                title="EVM Values"
                                yLabel="$"
                            />
                        </div>
                    </div>

                    {/* Schedule Variance Trend */}
                    <div className="rounded-2xl bg-white p-5 shadow-sm">
                        <h3 className="font-bold text-indigo-600 border-b-2 border-indigo-500 pb-2 mb-4">📅 Schedule Variance & SPI Trend</h3>
                        <div className="grid md:grid-cols-2 gap-4">
                            <TrendLineChart
                                data={trendData}
                                lines={[
                                    { key: 'spi', label: 'SPI', color: '#16a34a', fill: true },
                                ]}
                                title="Schedule Performance Index (SPI)"
                                yLabel="Index"
                            />
                            <TrendLineChart
                                data={trendData}
                                lines={[
                                    { key: 'sv', label: 'SV ($)', color: '#6366f1', fill: true },
                                ]}
                                title="Schedule Variance (SV)"
                                yLabel="$"
                            />
                            <TrendLineChart
                                data={trendData}
                                lines={[
                                    { key: 'svPercent', label: 'SV %', color: '#8b5cf6', fill: true },
                                ]}
                                title="Schedule Variance %"
                                yLabel="%"
                            />
                            <TrendLineChart
                                data={trendData}
                                lines={[
                                    { key: 'cv', label: 'CV ($)', color: '#f59e0b', fill: true },
                                    { key: 'sv', label: 'SV ($)', color: '#6366f1' },
                                ]}
                                title="Cost Variance vs Schedule Variance"
                                yLabel="$"
                            />
                        </div>
                    </div>

                    {/* Cash Flow Trend */}
                    <div className="rounded-2xl bg-white p-5 shadow-sm">
                        <h3 className="font-bold text-pink-600 border-b-2 border-pink-500 pb-2 mb-4">💵 Cash Flow Trend</h3>
                        <div className="grid md:grid-cols-2 gap-4">
                            <TrendBarChart
                                data={trendData}
                                bars={[
                                    { key: 'cashOut', label: 'Cash Out', color: '#ef4444' },
                                    { key: 'billing', label: 'Billing', color: '#3b82f6' },
                                    { key: 'cashIn', label: 'Cash In', color: '#22c55e' },
                                ]}
                                title="Cash Flow Components"
                            />
                            <TrendLineChart
                                data={trendData}
                                lines={[
                                    { key: 'balance', label: 'Cash Balance', color: '#ec4899', fill: true },
                                ]}
                                title="Cash Flow Balance"
                                yLabel="$"
                            />
                        </div>
                    </div>

                    {/* Safety Trend */}
                    <div className="rounded-2xl bg-white p-5 shadow-sm">
                        <h3 className="font-bold text-blue-600 border-b-2 border-blue-500 pb-2 mb-4">🦺 Safety Trend</h3>
                        <div className="grid md:grid-cols-2 gap-4">
                            <TrendBarChart
                                data={trendData}
                                bars={[
                                    { key: 'nearMiss', label: 'Near Miss', color: '#f59e0b' },
                                    { key: 'observations', label: 'Observations', color: '#22c55e' },
                                ]}
                                title="Safety Leading Indicators"
                            />
                            <TrendLineChart
                                data={trendData}
                                lines={[
                                    { key: 'safeHours', label: 'Safe Hours', color: '#60a5fa', fill: true },
                                    { key: 'manpower', label: 'Manpower', color: '#f97316' },
                                ]}
                                title="Safe Hours & Manpower"
                            />
                        </div>
                    </div>

                    {/* Quality Performance Trend */}
                    <div className="rounded-2xl bg-white p-5 shadow-sm">
                        <h3 className="font-bold text-purple-600 border-b-2 border-purple-500 pb-2 mb-4">🔍 Quality Performance Trend</h3>
                        <div className="grid md:grid-cols-3 gap-4">
                            {/* NCR Status Trend */}
                            <TrendBarChart
                                data={trendData}
                                bars={[
                                    { key: 'ncrOpen', label: 'NCR Open', color: '#ef4444' },
                                    { key: 'ncrClosed', label: 'NCR Closed', color: '#22c55e' },
                                ]}
                                title="NCR Status Trend"
                            />
                            {/* Punch List Status Trend */}
                            <TrendBarChart
                                data={trendData}
                                bars={[
                                    { key: 'punchOpen', label: 'Punch Open', color: '#f59e0b' },
                                    { key: 'punchClosed', label: 'Punch Closed', color: '#22c55e' },
                                ]}
                                title="Punch List Status Trend"
                            />
                            {/* Welding & Certificate Trend */}
                            <div className="bg-slate-50 p-3 rounded-lg">
                                <p className="text-xs font-semibold mb-2 text-slate-700">Welding & Certificate Trend</p>
                                <div className="grid grid-cols-2 gap-2">
                                    <TrendBarChart
                                        data={trendData}
                                        bars={[
                                            { key: 'certCompleted', label: 'Certificates', color: '#a78bfa' },
                                        ]}
                                        title="Certificates"
                                        height={120}
                                    />
                                    <TrendLineChart
                                        data={trendData}
                                        lines={[
                                            { key: 'weldingRejectionRate', label: 'Weld Reject %', color: '#ef4444', fill: true },
                                        ]}
                                        title="Weld Rejection"
                                        yLabel="%"
                                        height={120}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* TKDN Trend */}
                    <div className="rounded-2xl bg-white p-5 shadow-sm">
                        <h3 className="font-bold text-cyan-600 border-b-2 border-cyan-500 pb-2 mb-4">🏭 TKDN Trend</h3>
                        <TrendLineChart
                            data={trendData}
                            lines={[
                                { key: 'tkdnPlan', label: 'Target', color: '#3b82f6' },
                                { key: 'tkdnActual', label: 'Actual', color: '#0891b2', fill: true },
                            ]}
                            title="TKDN Performance"
                            yLabel="%"
                            height={200}
                        />
                    </div>
                </>
            )}
        </div>
    );
}
