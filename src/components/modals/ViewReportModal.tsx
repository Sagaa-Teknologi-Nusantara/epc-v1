'use client';

import { useState } from 'react';
import { Icons } from '@/components/ui/Icons';
import type { Report } from '@/types';

interface ViewReportModalProps {
    isOpen: boolean;
    onClose: () => void;
    report: Report | null;
    projectName: string;
}

type TabId = 'overview' | 'progress' | 'cashflow' | 'hse' | 'quality' | 'milestones' | 'activities' | 'uploads';

export function ViewReportModal({ isOpen, onClose, report, projectName }: ViewReportModalProps) {
    const [activeTab, setActiveTab] = useState<TabId>('overview');

    if (!isOpen || !report) return null;

    const evm = report.evm || { bac: 0, bcws: 0, bcwp: 0, acwp: 0, spiValue: 0, cpiValue: 0 };
    const epcc = report.epcc || {};
    const overallProgress = report.overallProgress || { plan: 0, actual: 0, variance: 0 };
    const hse = report.hse || { lagging: {}, leading: {}, manpower: { total: 0 }, safeHours: 0, trir: 0 };
    const quality = report.quality || {};
    const cashFlow = report.cashFlow || {};
    const tkdn = report.tkdn || { plan: 0, actual: 0 };

    const spiColor = (evm.spiValue || 0) >= 1 ? 'text-green-600' : (evm.spiValue || 0) >= 0.9 ? 'text-amber-600' : 'text-red-600';
    const cpiColor = (evm.cpiValue || 0) >= 1 ? 'text-green-600' : (evm.cpiValue || 0) >= 0.9 ? 'text-amber-600' : 'text-red-600';

    const tabs = [
        { id: 'overview' as TabId, label: '📊 Overview' },
        { id: 'progress' as TabId, label: '📈 Progress & EVM' },
        { id: 'cashflow' as TabId, label: '💵 Cash Flow' },
        { id: 'hse' as TabId, label: '🦺 HSE' },
        { id: 'quality' as TabId, label: '📋 Quality' },
        { id: 'milestones' as TabId, label: '🎯 Milestones' },
        { id: 'activities' as TabId, label: '📝 Activities' },
        { id: 'uploads' as TabId, label: '📷 Uploads' },
    ];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
            <div className="w-[95%] max-w-6xl max-h-[90vh] overflow-hidden rounded-2xl bg-white shadow-xl" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="flex items-center justify-between border-b border-slate-200 bg-gradient-to-r from-teal-500 to-teal-600 p-4 text-white">
                    <div>
                        <h2 className="text-lg font-bold">{report.docNo || `Week ${report.weekNo} Report`}</h2>
                        <p className="text-sm opacity-90">{projectName} | {report.periodStart} - {report.periodEnd}</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${report.status === 'Issued' ? 'bg-green-500' : 'bg-amber-500'
                            }`}>
                            {report.status}
                        </span>
                        <button onClick={onClose} className="p-1 hover:bg-white/20 rounded"><Icons.X /></button>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex overflow-x-auto border-b border-slate-200 bg-slate-50">
                    {tabs.map(t => (
                        <button
                            key={t.id}
                            onClick={() => setActiveTab(t.id)}
                            className={`whitespace-nowrap px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === t.id ? 'text-teal-600 border-teal-600 bg-white' : 'text-slate-500 border-transparent hover:text-slate-700'
                                }`}
                        >
                            {t.label}
                        </button>
                    ))}
                </div>

                {/* Content */}
                <div className="p-5 max-h-[65vh] overflow-y-auto bg-slate-100">
                    {/* Overview Tab */}
                    {activeTab === 'overview' && (
                        <div className="space-y-4">
                            {/* General Info */}
                            <div className="rounded-xl bg-white p-4 shadow-sm">
                                <h3 className="text-sm font-bold mb-3">📋 General Information</h3>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                    <div className="rounded-lg bg-slate-50 p-3">
                                        <p className="text-[10px] text-slate-500">Document No</p>
                                        <p className="text-sm font-semibold">{report.docNo || '-'}</p>
                                    </div>
                                    <div className="rounded-lg bg-slate-50 p-3">
                                        <p className="text-[10px] text-slate-500">Week Number</p>
                                        <p className="text-sm font-semibold">Week {report.weekNo}</p>
                                    </div>
                                    <div className="rounded-lg bg-slate-50 p-3">
                                        <p className="text-[10px] text-slate-500">Status</p>
                                        <p className="text-sm font-semibold">{report.status}</p>
                                    </div>
                                    <div className="rounded-lg bg-slate-50 p-3">
                                        <p className="text-[10px] text-slate-500">Approval Status</p>
                                        <p className="text-sm font-semibold">{report.approvalStatus}</p>
                                    </div>
                                    <div className="rounded-lg bg-slate-50 p-3">
                                        <p className="text-[10px] text-slate-500">Prepared By</p>
                                        <p className="text-sm font-semibold">{report.preparedBy || '-'}</p>
                                    </div>
                                    <div className="rounded-lg bg-slate-50 p-3">
                                        <p className="text-[10px] text-slate-500">Checked By</p>
                                        <p className="text-sm font-semibold">{report.checkedBy || '-'}</p>
                                    </div>
                                    <div className="rounded-lg bg-slate-50 p-3">
                                        <p className="text-[10px] text-slate-500">Approved By</p>
                                        <p className="text-sm font-semibold">{report.approvedBy || '-'}</p>
                                    </div>
                                    <div className="rounded-lg bg-slate-50 p-3">
                                        <p className="text-[10px] text-slate-500">Period</p>
                                        <p className="text-sm font-semibold">{report.periodStart} to {report.periodEnd}</p>
                                    </div>
                                </div>
                            </div>

                            {/* KPI Summary */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                <div className="rounded-xl bg-white p-4 shadow-sm">
                                    <p className="text-xs text-slate-500 mb-1">Overall Progress</p>
                                    <p className="text-2xl font-extrabold text-teal-600">{(overallProgress.actual || 0).toFixed(1)}%</p>
                                    <p className={`text-xs ${(overallProgress.variance || 0) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                        {(overallProgress.variance || 0) >= 0 ? '+' : ''}{(overallProgress.variance || 0).toFixed(1)}% vs plan
                                    </p>
                                </div>
                                <div className={`rounded-xl p-4 shadow-sm ${(tkdn.actual || 0) >= (tkdn.plan || 0) ? 'bg-green-50' : 'bg-red-50'}`}>
                                    <p className="text-xs text-slate-500 mb-1">🏭 TKDN</p>
                                    <p className={`text-2xl font-extrabold ${(tkdn.actual || 0) >= (tkdn.plan || 0) ? 'text-green-600' : 'text-red-600'}`}>
                                        {(tkdn.actual || 0).toFixed(1)}%
                                    </p>
                                    <p className="text-xs text-slate-500">Target: {tkdn.plan}%</p>
                                </div>
                                <div className="rounded-xl bg-white p-4 shadow-sm">
                                    <p className="text-xs text-slate-500 mb-1">🦺 Safe Hours</p>
                                    <p className="text-2xl font-extrabold text-blue-600">{((hse.safeHours || 0) / 1000).toFixed(0)}K</p>
                                    <p className="text-xs text-slate-500">TRIR: {(hse.trir || 0).toFixed(2)}</p>
                                </div>
                                <div className={`rounded-xl p-4 shadow-sm ${cashFlow.overallStatus === 'green' ? 'bg-green-50' : cashFlow.overallStatus === 'yellow' ? 'bg-amber-50' : 'bg-red-50'
                                    }`}>
                                    <p className="text-xs text-slate-500 mb-1">💵 Cash Flow</p>
                                    <p className="text-2xl font-extrabold">
                                        {cashFlow.overallStatus === 'green' ? '🟢' : cashFlow.overallStatus === 'yellow' ? '🟡' : '🔴'}
                                    </p>
                                    <p className="text-xs text-slate-500">Score: {(cashFlow.overallScore || 0).toFixed(0)}/100</p>
                                </div>
                            </div>

                            {/* EVM Summary */}
                            <div className="rounded-xl bg-white p-4 shadow-sm">
                                <h3 className="text-sm font-bold mb-3">📊 EVM Summary</h3>
                                <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
                                    <div className="rounded-lg bg-green-50 p-3 text-center">
                                        <p className="text-xs text-slate-500">SPI</p>
                                        <p className={`text-xl font-extrabold ${spiColor}`}>{(evm.spiValue || 0).toFixed(3)}</p>
                                    </div>
                                    <div className="rounded-lg bg-amber-50 p-3 text-center">
                                        <p className="text-xs text-slate-500">CPI</p>
                                        <p className={`text-xl font-extrabold ${cpiColor}`}>{(evm.cpiValue || 0).toFixed(3)}</p>
                                    </div>
                                    <div className="rounded-lg bg-slate-50 p-3 text-center">
                                        <p className="text-xs text-slate-500">BCWS</p>
                                        <p className="text-lg font-bold">${((evm.bcws || 0) / 1e6).toFixed(2)}M</p>
                                    </div>
                                    <div className="rounded-lg bg-slate-50 p-3 text-center">
                                        <p className="text-xs text-slate-500">BCWP</p>
                                        <p className="text-lg font-bold">${((evm.bcwp || 0) / 1e6).toFixed(2)}M</p>
                                    </div>
                                    <div className="rounded-lg bg-slate-50 p-3 text-center">
                                        <p className="text-xs text-slate-500">ACWP</p>
                                        <p className="text-lg font-bold">${((evm.acwp || 0) / 1e6).toFixed(2)}M</p>
                                    </div>
                                    <div className="rounded-lg bg-slate-50 p-3 text-center">
                                        <p className="text-xs text-slate-500">BAC</p>
                                        <p className="text-lg font-bold">${((evm.bac || 0) / 1e6).toFixed(2)}M</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Progress & EVM Tab */}
                    {activeTab === 'progress' && (
                        <div className="space-y-4">
                            {/* EPCC Progress */}
                            <div className="rounded-xl bg-white p-4 shadow-sm">
                                <h3 className="text-sm font-bold mb-4">📊 EPCC Progress Breakdown</h3>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    {[
                                        { key: 'engineering', label: 'Engineering', color: 'from-purple-400 to-purple-600', icon: '🔧' },
                                        { key: 'procurement', label: 'Procurement', color: 'from-amber-400 to-amber-600', icon: '📦' },
                                        { key: 'construction', label: 'Construction', color: 'from-green-400 to-green-600', icon: '🏗️' },
                                        { key: 'commissioning', label: 'Commissioning', color: 'from-red-400 to-red-600', icon: '⚡' },
                                    ].map(({ key, label, color, icon }) => {
                                        const data = (epcc as unknown as Record<string, { plan?: number; actual?: number; weight?: number }>)[key] || {};
                                        const plan = data.plan || 0;
                                        const actual = data.actual || 0;
                                        const variance = actual - plan;
                                        return (
                                            <div key={key} className="rounded-xl bg-slate-50 p-4">
                                                <div className="flex items-center justify-between mb-2">
                                                    <span className="text-xs font-semibold text-slate-600">{icon} {label}</span>
                                                    <span className="text-xs text-slate-400">Weight: {data.weight || 0}%</span>
                                                </div>
                                                <div className="flex items-end gap-2">
                                                    <span className="text-2xl font-extrabold text-slate-700">{actual.toFixed(1)}%</span>
                                                    <span className={`text-xs font-semibold ${variance >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                                        {variance >= 0 ? '+' : ''}{variance.toFixed(1)}%
                                                    </span>
                                                </div>
                                                <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200">
                                                    <div className={`h-full rounded-full bg-gradient-to-r ${color}`} style={{ width: `${Math.min(actual, 100)}%` }} />
                                                </div>
                                                <p className="mt-1 text-[10px] text-slate-400">Plan: {plan.toFixed(1)}%</p>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* EVM Details */}
                            <div className="rounded-xl bg-white p-4 shadow-sm">
                                <h3 className="text-sm font-bold mb-4">📈 Earned Value Management</h3>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <div className={`rounded-lg p-4 text-center ${(evm.spiValue || 0) >= 1 ? 'bg-green-50 border-2 border-green-500' : (evm.spiValue || 0) >= 0.9 ? 'bg-amber-50 border-2 border-amber-500' : 'bg-red-50 border-2 border-red-500'}`}>
                                        <p className="text-xs text-slate-500">Schedule Performance</p>
                                        <p className={`text-3xl font-extrabold ${spiColor}`}>{(evm.spiValue || 0).toFixed(3)}</p>
                                        <p className="text-xs text-slate-500">SPI</p>
                                    </div>
                                    <div className={`rounded-lg p-4 text-center ${(evm.cpiValue || 0) >= 1 ? 'bg-green-50 border-2 border-green-500' : (evm.cpiValue || 0) >= 0.9 ? 'bg-amber-50 border-2 border-amber-500' : 'bg-red-50 border-2 border-red-500'}`}>
                                        <p className="text-xs text-slate-500">Cost Performance</p>
                                        <p className={`text-3xl font-extrabold ${cpiColor}`}>{(evm.cpiValue || 0).toFixed(3)}</p>
                                        <p className="text-xs text-slate-500">CPI</p>
                                    </div>
                                    <div className="rounded-lg bg-slate-50 p-4 text-center">
                                        <p className="text-xs text-slate-500">Estimate at Completion</p>
                                        <p className="text-2xl font-extrabold">${((evm.eac || 0) / 1e6).toFixed(2)}M</p>
                                        <p className="text-xs text-slate-500">EAC</p>
                                    </div>
                                    <div className={`rounded-lg p-4 text-center ${(evm.vac || 0) >= 0 ? 'bg-green-50' : 'bg-red-50'}`}>
                                        <p className="text-xs text-slate-500">Variance at Completion</p>
                                        <p className={`text-2xl font-extrabold ${(evm.vac || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                            ${((evm.vac || 0) / 1e6).toFixed(2)}M
                                        </p>
                                        <p className="text-xs text-slate-500">VAC</p>
                                    </div>
                                </div>
                            </div>

                            {/* TKDN */}
                            <div className={`rounded-xl p-4 shadow-sm ${(tkdn.actual || 0) >= (tkdn.plan || 0) ? 'bg-green-50 border-2 border-green-500' : 'bg-red-50 border-2 border-red-500'}`}>
                                <h3 className="text-sm font-bold mb-3">🏭 TKDN (Tingkat Komponen Dalam Negeri)</h3>
                                <div className="grid grid-cols-4 gap-4 text-center">
                                    <div className="rounded-lg bg-white p-3">
                                        <p className="text-xs text-blue-600">Target</p>
                                        <p className="text-xl font-bold text-blue-600">{tkdn.plan}%</p>
                                    </div>
                                    <div className="rounded-lg bg-white p-3">
                                        <p className="text-xs text-teal-600">Actual</p>
                                        <p className="text-xl font-bold text-teal-600">{(tkdn.actual || 0).toFixed(1)}%</p>
                                    </div>
                                    <div className="rounded-lg bg-white p-3">
                                        <p className="text-xs text-slate-500">Variance</p>
                                        <p className={`text-xl font-bold ${(tkdn.actual - tkdn.plan) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                            {(tkdn.actual - tkdn.plan) >= 0 ? '+' : ''}{((tkdn.actual || 0) - (tkdn.plan || 0)).toFixed(1)}%
                                        </p>
                                    </div>
                                    <div className={`rounded-lg p-3 text-white ${(tkdn.actual || 0) >= (tkdn.plan || 0) ? 'bg-green-500' : 'bg-red-500'}`}>
                                        <p className="text-xs opacity-80">Status</p>
                                        <p className="text-lg font-bold">{(tkdn.actual || 0) >= (tkdn.plan || 0) ? '✅ PASS' : '❌ RISK'}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Cash Flow Tab */}
                    {activeTab === 'cashflow' && (
                        <div className="space-y-4">
                            <div className="rounded-xl bg-white p-4 shadow-sm">
                                <h3 className="text-sm font-bold mb-4">💵 Cash Flow Summary</h3>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <div className="rounded-lg bg-green-50 p-4 text-center">
                                        <p className="text-xs text-slate-500 mb-2">Revenue</p>
                                        <p className="text-xl font-extrabold text-green-600">${((cashFlow.revenue || 0) / 1e6).toFixed(2)}M</p>
                                    </div>
                                    <div className="rounded-lg bg-red-50 p-4 text-center">
                                        <p className="text-xs text-slate-500 mb-2">Cash Out</p>
                                        <p className="text-xl font-extrabold text-red-600">${((cashFlow.cashOut || 0) / 1e6).toFixed(2)}M</p>
                                    </div>
                                    <div className="rounded-lg bg-blue-50 p-4 text-center">
                                        <p className="text-xs text-slate-500 mb-2">Billing</p>
                                        <p className="text-xl font-extrabold text-blue-600">${((cashFlow.billing || 0) / 1e6).toFixed(2)}M</p>
                                    </div>
                                    <div className="rounded-lg bg-purple-50 p-4 text-center">
                                        <p className="text-xs text-slate-500 mb-2">Cash In</p>
                                        <p className="text-xl font-extrabold text-purple-600">${((cashFlow.cashIn || 0) / 1e6).toFixed(2)}M</p>
                                    </div>
                                </div>
                            </div>

                            <div className="rounded-xl bg-white p-4 shadow-sm">
                                <h3 className="text-sm font-bold mb-4">📊 Cash Flow Ratios</h3>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <div className="rounded-lg bg-slate-50 p-3 text-center">
                                        <p className="text-xs text-slate-500">Billing Coverage</p>
                                        <p className="text-lg font-bold text-amber-600">{((cashFlow.billingCoverageRatio || 0) * 100).toFixed(1)}%</p>
                                    </div>
                                    <div className="rounded-lg bg-slate-50 p-3 text-center">
                                        <p className="text-xs text-slate-500">Cash Collection</p>
                                        <p className="text-lg font-bold text-teal-600">{((cashFlow.cashCollectionRatio || 0) * 100).toFixed(1)}%</p>
                                    </div>
                                    <div className="rounded-lg bg-slate-50 p-3 text-center">
                                        <p className="text-xs text-slate-500">Cash Balance</p>
                                        <p className="text-lg font-bold text-blue-600">${((cashFlow.cashFlowBalance || 0) / 1e6).toFixed(2)}M</p>
                                    </div>
                                    <div className="rounded-lg bg-slate-50 p-3 text-center">
                                        <p className="text-xs text-slate-500">Burn Rate</p>
                                        <p className="text-lg font-bold text-slate-600">${((cashFlow.cashBurnRate || 0) / 1e6).toFixed(2)}M</p>
                                    </div>
                                </div>
                            </div>

                            <div className={`rounded-xl p-4 shadow-sm ${cashFlow.overallStatus === 'green' ? 'bg-green-100 border-2 border-green-500' :
                                cashFlow.overallStatus === 'yellow' ? 'bg-amber-100 border-2 border-amber-500' : 'bg-red-100 border-2 border-red-500'
                                }`}>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="text-sm font-bold">Overall Cash Flow Status</h3>
                                        <p className="text-xs text-slate-500">Based on all ratio calculations</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-3xl">
                                            {cashFlow.overallStatus === 'green' ? '🟢' : cashFlow.overallStatus === 'yellow' ? '🟡' : '🔴'}
                                        </p>
                                        <p className="text-lg font-bold">{cashFlow.overallStatus === 'green' ? 'Healthy' : cashFlow.overallStatus === 'yellow' ? 'Monitor' : 'At Risk'}</p>
                                        <p className="text-xs text-slate-500">Score: {(cashFlow.overallScore || 0).toFixed(0)}/100</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* HSE Tab */}
                    {activeTab === 'hse' && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Lagging Indicators */}
                                <div className="rounded-xl bg-white p-4 shadow-sm">
                                    <h3 className="text-sm font-bold text-red-600 mb-4">⚠️ Lagging Indicators</h3>
                                    <div className="grid grid-cols-2 gap-3">
                                        {[
                                            { k: 'fatality', l: 'Fatality', color: 'bg-red-600' },
                                            { k: 'lti', l: 'LTI', color: 'bg-red-500' },
                                            { k: 'medicalTreatment', l: 'Medical Treatment', color: 'bg-amber-500' },
                                            { k: 'firstAid', l: 'First Aid', color: 'bg-blue-500' }
                                        ].map(({ k, l, color }) => (
                                            <div key={k} className="rounded-lg bg-slate-50 p-3 text-center">
                                                <p className="text-xs text-slate-500 mb-1">{l}</p>
                                                <div className={`inline-block ${color} text-white px-4 py-2 rounded-lg`}>
                                                    <p className="text-xl font-extrabold">{(hse.lagging as unknown as Record<string, number>)?.[k] || 0}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Leading Indicators */}
                                <div className="rounded-xl bg-white p-4 shadow-sm">
                                    <h3 className="text-sm font-bold text-green-600 mb-4">✅ Leading Indicators</h3>
                                    <div className="grid grid-cols-2 gap-3">
                                        {[
                                            { k: 'nearMiss', l: 'Near Miss' },
                                            { k: 'safetyObservation', l: 'Safety Observation' },
                                            { k: 'hsseInspection', l: 'HSSE Inspection' },
                                            { k: 'hsseTraining', l: 'HSSE Training' }
                                        ].map(({ k, l }) => (
                                            <div key={k} className="rounded-lg bg-green-50 p-3 text-center">
                                                <p className="text-xs text-slate-500 mb-1">{l}</p>
                                                <p className="text-xl font-extrabold text-green-600">{(hse.leading as unknown as Record<string, number>)?.[k] || 0}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Manpower & Hours */}
                            <div className="rounded-xl bg-white p-4 shadow-sm">
                                <h3 className="text-sm font-bold mb-4">👷 Manpower & Safe Hours</h3>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <div className="rounded-lg bg-blue-50 p-4 text-center">
                                        <p className="text-xs text-slate-500">Office</p>
                                        <p className="text-2xl font-extrabold text-blue-600">{hse.manpower?.office || 0}</p>
                                    </div>
                                    <div className="rounded-lg bg-amber-50 p-4 text-center">
                                        <p className="text-xs text-slate-500">Site</p>
                                        <p className="text-2xl font-extrabold text-amber-600">{hse.manpower?.siteSubcontractor || 0}</p>
                                    </div>
                                    <div className="rounded-lg bg-teal-50 p-4 text-center">
                                        <p className="text-xs text-slate-500">Total Manpower</p>
                                        <p className="text-2xl font-extrabold text-teal-600">{hse.manpower?.total || 0}</p>
                                    </div>
                                    <div className="rounded-lg bg-green-50 p-4 text-center">
                                        <p className="text-xs text-slate-500">Safe Man-Hours</p>
                                        <p className="text-2xl font-extrabold text-green-600">{((hse.safeHours || 0) / 1000).toFixed(0)}K</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Quality Tab */}
                    {activeTab === 'quality' && (() => {
                        const q = quality as unknown as {
                            headOffice?: { afi?: Record<string, { fail?: number; ongoing?: number; pass?: number }>; ncr?: { ownerToContractor?: Record<string, { open?: number; closed?: number }>; contractorToVendor?: Record<string, { open?: number; closed?: number }> }; punchList?: { ownerToContractor?: Record<string, { open?: number; closed?: number }>; contractorToVendor?: Record<string, { open?: number; closed?: number }> } };
                            siteOffice?: { afi?: Record<string, { fail?: number; ongoing?: number; pass?: number }>; ncr?: { ownerToContractor?: Record<string, { open?: number; closed?: number }>; contractorToVendor?: Record<string, { open?: number; closed?: number }> }; punchList?: { ownerToContractor?: Record<string, { open?: number; closed?: number }>; contractorToVendor?: Record<string, { open?: number; closed?: number }> }; welding?: { ndtAccepted?: number; ndtRejected?: number; rejectionRatePlan?: number } };
                            certificate?: { completed?: number; underApplication?: number; notYetApplied?: number };
                        };
                        const disciplines = ['process', 'mechanical', 'piping', 'electrical', 'instrument', 'civil'];
                        const welding = q?.siteOffice?.welding;
                        const total = (welding?.ndtAccepted || 0) + (welding?.ndtRejected || 0);
                        const rate = total > 0 ? ((welding?.ndtRejected || 0) / total) * 100 : 0;
                        const plan = welding?.rejectionRatePlan || 2;

                        // Calculate totals
                        let hoAfiPass = 0, hoAfiTotal = 0, hoNcrOpen = 0, hoPunchOpen = 0;
                        let soAfiPass = 0, soAfiTotal = 0, soNcrOpen = 0, soPunchOpen = 0;
                        disciplines.forEach(d => {
                            const hoAfi = q?.headOffice?.afi?.[d] || {};
                            hoAfiTotal += (hoAfi.fail || 0) + (hoAfi.ongoing || 0) + (hoAfi.pass || 0);
                            hoAfiPass += (hoAfi.pass || 0);
                            const soAfi = q?.siteOffice?.afi?.[d] || {};
                            soAfiTotal += (soAfi.fail || 0) + (soAfi.ongoing || 0) + (soAfi.pass || 0);
                            soAfiPass += (soAfi.pass || 0);
                            ['ownerToContractor', 'contractorToVendor'].forEach(src => {
                                hoNcrOpen += q?.headOffice?.ncr?.[src as 'ownerToContractor']?.[d]?.open || 0;
                                hoPunchOpen += q?.headOffice?.punchList?.[src as 'ownerToContractor']?.[d]?.open || 0;
                                soNcrOpen += q?.siteOffice?.ncr?.[src as 'ownerToContractor']?.[d]?.open || 0;
                                soPunchOpen += q?.siteOffice?.punchList?.[src as 'ownerToContractor']?.[d]?.open || 0;
                            });
                        });

                        return (
                            <div className="space-y-4">
                                {/* Summary Cards */}
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                    <div className="rounded-lg bg-teal-50 p-3 text-center">
                                        <p className="text-[10px] text-slate-500">HO AFI Pass</p>
                                        <p className="text-lg font-bold text-teal-600">{hoAfiPass}/{hoAfiTotal}</p>
                                    </div>
                                    <div className="rounded-lg bg-purple-50 p-3 text-center">
                                        <p className="text-[10px] text-slate-500">Site AFI Pass</p>
                                        <p className="text-lg font-bold text-purple-600">{soAfiPass}/{soAfiTotal}</p>
                                    </div>
                                    <div className="rounded-lg bg-red-50 p-3 text-center">
                                        <p className="text-[10px] text-slate-500">NCR Open</p>
                                        <p className="text-lg font-bold text-red-600">{hoNcrOpen + soNcrOpen}</p>
                                    </div>
                                    <div className="rounded-lg bg-amber-50 p-3 text-center">
                                        <p className="text-[10px] text-slate-500">Punch Open</p>
                                        <p className="text-lg font-bold text-amber-600">{hoPunchOpen + soPunchOpen}</p>
                                    </div>
                                </div>

                                {/* AFI by Discipline */}
                                <div className="rounded-xl bg-white p-4 shadow-sm">
                                    <h3 className="text-sm font-bold mb-3">📋 AFI Status by Discipline</h3>
                                    <table className="w-full text-xs">
                                        <thead>
                                            <tr className="bg-slate-100">
                                                <th className="p-2 text-left">Discipline</th>
                                                <th className="p-2 text-center" colSpan={3}>Head Office</th>
                                                <th className="p-2 text-center" colSpan={3}>Site Office</th>
                                            </tr>
                                            <tr className="bg-slate-50">
                                                <th></th>
                                                <th className="p-1 text-center text-green-600">Pass</th>
                                                <th className="p-1 text-center text-amber-600">Ongoing</th>
                                                <th className="p-1 text-center text-red-600">Fail</th>
                                                <th className="p-1 text-center text-green-600">Pass</th>
                                                <th className="p-1 text-center text-amber-600">Ongoing</th>
                                                <th className="p-1 text-center text-red-600">Fail</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {disciplines.map(d => {
                                                const hoAfi = q?.headOffice?.afi?.[d] || {};
                                                const soAfi = q?.siteOffice?.afi?.[d] || {};
                                                return (
                                                    <tr key={d} className="border-b">
                                                        <td className="p-2 capitalize font-medium">{d}</td>
                                                        <td className="p-1 text-center">{hoAfi.pass || 0}</td>
                                                        <td className="p-1 text-center">{hoAfi.ongoing || 0}</td>
                                                        <td className="p-1 text-center">{hoAfi.fail || 0}</td>
                                                        <td className="p-1 text-center">{soAfi.pass || 0}</td>
                                                        <td className="p-1 text-center">{soAfi.ongoing || 0}</td>
                                                        <td className="p-1 text-center">{soAfi.fail || 0}</td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>

                                {/* NCR & Punch by Discipline */}
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                    <div className="rounded-xl bg-white p-4 shadow-sm">
                                        <h3 className="text-sm font-bold mb-3 text-red-600">⚠️ NCR Status</h3>
                                        <table className="w-full text-xs">
                                            <thead>
                                                <tr className="bg-slate-100">
                                                    <th className="p-1.5 text-left">Discipline</th>
                                                    <th className="p-1.5 text-center">HO Open</th>
                                                    <th className="p-1.5 text-center">Site Open</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {disciplines.map(d => {
                                                    const hoOpen = (q?.headOffice?.ncr?.ownerToContractor?.[d]?.open || 0) + (q?.headOffice?.ncr?.contractorToVendor?.[d]?.open || 0);
                                                    const soOpen = (q?.siteOffice?.ncr?.ownerToContractor?.[d]?.open || 0) + (q?.siteOffice?.ncr?.contractorToVendor?.[d]?.open || 0);
                                                    return (
                                                        <tr key={d} className="border-b">
                                                            <td className="p-1.5 capitalize">{d}</td>
                                                            <td className={`p-1.5 text-center ${hoOpen > 0 ? 'bg-red-50 text-red-600 font-bold' : ''}`}>{hoOpen}</td>
                                                            <td className={`p-1.5 text-center ${soOpen > 0 ? 'bg-red-50 text-red-600 font-bold' : ''}`}>{soOpen}</td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                    <div className="rounded-xl bg-white p-4 shadow-sm">
                                        <h3 className="text-sm font-bold mb-3 text-amber-600">📝 Punch List Status</h3>
                                        <table className="w-full text-xs">
                                            <thead>
                                                <tr className="bg-slate-100">
                                                    <th className="p-1.5 text-left">Discipline</th>
                                                    <th className="p-1.5 text-center">HO Open</th>
                                                    <th className="p-1.5 text-center">Site Open</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {disciplines.map(d => {
                                                    const hoOpen = (q?.headOffice?.punchList?.ownerToContractor?.[d]?.open || 0) + (q?.headOffice?.punchList?.contractorToVendor?.[d]?.open || 0);
                                                    const soOpen = (q?.siteOffice?.punchList?.ownerToContractor?.[d]?.open || 0) + (q?.siteOffice?.punchList?.contractorToVendor?.[d]?.open || 0);
                                                    return (
                                                        <tr key={d} className="border-b">
                                                            <td className="p-1.5 capitalize">{d}</td>
                                                            <td className={`p-1.5 text-center ${hoOpen > 0 ? 'bg-amber-50 text-amber-600 font-bold' : ''}`}>{hoOpen}</td>
                                                            <td className={`p-1.5 text-center ${soOpen > 0 ? 'bg-amber-50 text-amber-600 font-bold' : ''}`}>{soOpen}</td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                {/* Welding & Certificate Row */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {/* Welding Performance */}
                                    <div className={`rounded-xl p-4 shadow-sm ${rate <= plan ? 'bg-green-50 border-2 border-green-500' : 'bg-red-50 border-2 border-red-500'}`}>
                                        <h3 className="text-sm font-bold mb-3">🔧 Welding Performance</h3>
                                        <div className="grid grid-cols-4 gap-2">
                                            <div className="rounded-lg bg-white p-2 text-center">
                                                <p className="text-[10px] text-slate-500">Accepted</p>
                                                <p className="text-lg font-bold text-green-600">{welding?.ndtAccepted || 0}</p>
                                            </div>
                                            <div className="rounded-lg bg-white p-2 text-center">
                                                <p className="text-[10px] text-slate-500">Rejected</p>
                                                <p className="text-lg font-bold text-red-600">{welding?.ndtRejected || 0}</p>
                                            </div>
                                            <div className="rounded-lg bg-white p-2 text-center">
                                                <p className="text-[10px] text-slate-500">Rate</p>
                                                <p className={`text-lg font-bold ${rate <= plan ? 'text-green-600' : 'text-red-600'}`}>{rate.toFixed(1)}%</p>
                                            </div>
                                            <div className="rounded-lg bg-white p-2 text-center">
                                                <p className="text-[10px] text-slate-500">Target</p>
                                                <p className="text-lg font-bold text-blue-600">≤{plan}%</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Certificate Status */}
                                    <div className="rounded-xl bg-purple-50 p-4 shadow-sm border-2 border-purple-400">
                                        <h3 className="text-sm font-bold mb-3 text-purple-700">📜 Certificate Status</h3>
                                        <div className="grid grid-cols-3 gap-2">
                                            <div className="rounded-lg bg-green-100 p-2 text-center">
                                                <p className="text-lg font-bold text-green-600">{q?.certificate?.completed || 0}</p>
                                                <p className="text-[9px]">Completed</p>
                                            </div>
                                            <div className="rounded-lg bg-amber-100 p-2 text-center">
                                                <p className="text-lg font-bold text-amber-600">{q?.certificate?.underApplication || 0}</p>
                                                <p className="text-[9px]">Under App.</p>
                                            </div>
                                            <div className="rounded-lg bg-slate-100 p-2 text-center">
                                                <p className="text-lg font-bold text-slate-600">{q?.certificate?.notYetApplied || 0}</p>
                                                <p className="text-[9px]">Not Yet</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })()}

                    {/* Milestones Tab */}
                    {activeTab === 'milestones' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Schedule Milestones */}
                            <div className="rounded-xl bg-white p-4 shadow-sm">
                                <h3 className="text-sm font-bold text-violet-600 mb-4">📅 Schedule Milestones</h3>
                                {(report.milestonesSchedule || []).length > 0 ? (
                                    <div className="space-y-2">
                                        {report.milestonesSchedule?.map((m, i) => (
                                            <div key={i} className={`rounded-lg p-3 ${m.status === 'Completed' ? 'bg-green-50' :
                                                m.status === 'On Track' ? 'bg-amber-50' : 'bg-red-50'
                                                }`}>
                                                <div className="flex items-center justify-between">
                                                    <span className="text-xs font-semibold">#{m.no} {m.description}</span>
                                                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${m.status === 'Completed' ? 'bg-green-500 text-white' :
                                                        m.status === 'On Track' ? 'bg-amber-500 text-white' : 'bg-red-500 text-white'
                                                        }`}>
                                                        {m.status}
                                                    </span>
                                                </div>
                                                <div className="flex gap-4 mt-1 text-[10px] text-slate-500">
                                                    <span>Plan: {m.planDate}</span>
                                                    <span>Actual: {m.actualForecastDate || '-'}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-center text-slate-400 py-8">No schedule milestones</p>
                                )}
                            </div>

                            {/* Payment Milestones */}
                            <div className="rounded-xl bg-white p-4 shadow-sm">
                                <h3 className="text-sm font-bold text-amber-600 mb-4">💳 Payment Milestones</h3>
                                {(report.milestonesPayment || []).length > 0 ? (
                                    <div className="space-y-2">
                                        {report.milestonesPayment?.map((m, i) => (
                                            <div key={i} className={`rounded-lg p-3 ${m.status === 'Completed' ? 'bg-green-50' :
                                                m.status === 'On Track' ? 'bg-amber-50' : 'bg-red-50'
                                                }`}>
                                                <div className="flex items-center justify-between">
                                                    <span className="text-xs font-semibold">#{m.no} {m.description}</span>
                                                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${m.status === 'Completed' ? 'bg-green-500 text-white' :
                                                        m.status === 'On Track' ? 'bg-amber-500 text-white' : 'bg-red-500 text-white'
                                                        }`}>
                                                        {m.status}
                                                    </span>
                                                </div>
                                                <div className="flex gap-4 mt-1 text-[10px] text-slate-500">
                                                    <span>Plan: {m.planDate}</span>
                                                    <span>Actual: {m.actualForecastDate || '-'}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-center text-slate-400 py-8">No payment milestones</p>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Activities Tab */}
                    {activeTab === 'activities' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* This Week */}
                            <div className="rounded-xl bg-white p-4 shadow-sm">
                                <h3 className="text-sm font-bold text-teal-600 mb-4">✅ This Week Activities</h3>
                                {(['engineering', 'procurement', 'construction', 'precommissioning'] as const).map(key => {
                                    const items = (report.thisWeekActivities as unknown as Record<string, string[]>)?.[key] || [];
                                    if (items.length === 0 || (items.length === 1 && !items[0])) return null;
                                    return (
                                        <div key={key} className="mb-3">
                                            <p className="text-xs font-semibold text-slate-600 capitalize mb-1">{key}</p>
                                            <ul className="text-xs text-slate-500 list-disc list-inside bg-slate-50 rounded-lg p-2">
                                                {items.filter(Boolean).map((item, i) => <li key={i}>{item}</li>)}
                                            </ul>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Next Week */}
                            <div className="rounded-xl bg-white p-4 shadow-sm">
                                <h3 className="text-sm font-bold text-blue-600 mb-4">📆 Next Week Plan</h3>
                                {(['engineering', 'procurement', 'construction', 'precommissioning'] as const).map(key => {
                                    const items = (report.nextWeekPlan as unknown as Record<string, string[]>)?.[key] || [];
                                    if (items.length === 0 || (items.length === 1 && !items[0])) return null;
                                    return (
                                        <div key={key} className="mb-3">
                                            <p className="text-xs font-semibold text-slate-600 capitalize mb-1">{key}</p>
                                            <ul className="text-xs text-slate-500 list-disc list-inside bg-blue-50 rounded-lg p-2">
                                                {items.filter(Boolean).map((item, i) => <li key={i}>{item}</li>)}
                                            </ul>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Uploads Tab */}
                    {activeTab === 'uploads' && (
                        <div className="space-y-4">
                            {/* S-Curve Images */}
                            <div className="rounded-xl bg-white p-4 shadow-sm">
                                <h3 className="text-sm font-bold text-teal-600 mb-4">📈 S-Curve Images</h3>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    {[
                                        { key: 'sCurveGeneral', label: 'General EPCC', color: 'from-teal-400 to-teal-600' },
                                        { key: 'sCurveEngineering', label: 'Engineering', color: 'from-blue-400 to-blue-600' },
                                        { key: 'sCurveProcurement', label: 'Procurement', color: 'from-amber-400 to-amber-600' },
                                        { key: 'sCurveConstruction', label: 'Construction', color: 'from-purple-400 to-purple-600' },
                                    ].map(item => {
                                        const upload = (report.uploads as Record<string, { name: string; data: string }>)?.[item.key];
                                        return (
                                            <div key={item.key} className="rounded-lg overflow-hidden border border-slate-200">
                                                <div className={`bg-gradient-to-r ${item.color} text-white text-xs font-semibold p-2 text-center`}>
                                                    {item.label}
                                                </div>
                                                {upload?.data ? (
                                                    <img src={upload.data} alt={item.label} className="w-full h-24 object-cover hover:scale-105 transition cursor-pointer" />
                                                ) : (
                                                    <div className="h-24 bg-slate-50 flex items-center justify-center">
                                                        <span className="text-slate-400 text-xs">No image</span>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Cash Flow & QR Codes */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Cash Flow Image */}
                                <div className="rounded-xl bg-white p-4 shadow-sm">
                                    <h3 className="text-sm font-bold text-green-600 mb-4">💵 Cash Flow Chart</h3>
                                    {(() => {
                                        const upload = (report.uploads as Record<string, { name: string; data: string }>)?.cashFlow;
                                        return upload?.data ? (
                                            <img src={upload.data} alt="Cash Flow" className="w-full h-32 object-contain rounded-lg bg-slate-50" />
                                        ) : (
                                            <div className="h-32 bg-slate-50 rounded-lg flex items-center justify-center">
                                                <span className="text-slate-400 text-xs">No cash flow image uploaded</span>
                                            </div>
                                        );
                                    })()}
                                </div>

                                {/* QR Codes */}
                                <div className="rounded-xl bg-white p-4 shadow-sm">
                                    <h3 className="text-sm font-bold text-purple-600 mb-4">📱 QR Codes</h3>
                                    <div className="grid grid-cols-3 gap-4">
                                        {[
                                            { key: 'qrPhotos', label: 'Photos', color: 'bg-blue-500' },
                                            { key: 'qrVideos', label: 'Videos', color: 'bg-purple-500' },
                                            { key: 'qrReport', label: 'Report', color: 'bg-teal-500' },
                                        ].map(qr => {
                                            const upload = (report.uploads as Record<string, { name: string; data: string }>)?.[qr.key];
                                            return (
                                                <div key={qr.key} className="text-center">
                                                    <div className={`${qr.color} text-white text-[10px] font-semibold py-1 px-2 rounded-t`}>
                                                        {qr.label}
                                                    </div>
                                                    {upload?.data ? (
                                                        <img src={upload.data} alt={qr.label} className="w-full h-16 object-cover rounded-b border border-t-0 border-slate-200" />
                                                    ) : (
                                                        <div className="h-16 bg-slate-50 rounded-b border border-t-0 border-slate-200 flex items-center justify-center">
                                                            <span className="text-slate-400 text-[10px]">No QR</span>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex justify-end border-t border-slate-200 p-4 bg-white">
                    <button onClick={onClose} className="px-6 py-2 rounded-lg bg-slate-100 text-slate-600 font-medium text-sm hover:bg-slate-200">
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}
