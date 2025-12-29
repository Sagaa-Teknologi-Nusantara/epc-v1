'use client';

import { useState, useRef } from 'react';
import { useReportContext } from '@/contexts/ReportContext';
import { ProjectReportSelector } from '@/components/ui/ProjectReportSelector';
import { AreaChart } from '@/components/charts';
import { Icons } from '@/components/ui/Icons';

export default function SCurvePage() {
    const { selectedProject, selectedReport, loading } = useReportContext();
    const [activeTab, setActiveTab] = useState<'general' | 'engineering' | 'procurement' | 'construction' | 'commissioning'>('general');
    const fileInputRef = useRef<HTMLInputElement>(null);

    if (loading) {
        return (
            <div className="flex min-h-[50vh] items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-teal-500 border-t-transparent"></div>
            </div>
        );
    }

    // Extract S-Curve data
    const sCurveData = selectedReport?.sCurveData || [];
    const uploads = selectedReport?.uploads || {};

    const tabs = [
        { id: 'general' as const, label: 'General', icon: '📊' },
        { id: 'engineering' as const, label: 'Engineering', icon: '📐' },
        { id: 'procurement' as const, label: 'Procurement', icon: '📦' },
        { id: 'construction' as const, label: 'Construction', icon: '🏗️' },
        { id: 'commissioning' as const, label: 'Commissioning', icon: '⚡' },
    ];

    // Get upload for current tab
    const getUploadKey = () => {
        switch (activeTab) {
            case 'general': return 'sCurveGeneral';
            case 'engineering': return 'sCurveEngineering';
            case 'procurement': return 'sCurveProcurement';
            case 'construction': return 'sCurveConstruction';
            case 'commissioning': return 'sCurveCommissioning';
        }
    };

    const currentUpload = (uploads as Record<string, { name?: string; data?: string }>)?.[getUploadKey()];

    return (
        <div className="space-y-5">
            {/* Header */}
            <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-extrabold">S-Curve Analysis</h1>
                    <p className="text-sm text-slate-500">
                        {selectedProject?.name || 'Select a project'} | Week {selectedReport?.weekNo || '-'}
                    </p>
                </div>
                <ProjectReportSelector />
            </div>

            {/* Tabs */}
            <div className="flex gap-1 overflow-x-auto rounded-xl bg-slate-100 p-1">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-2 whitespace-nowrap rounded-lg px-4 py-2.5 text-sm font-medium transition-all ${activeTab === tab.id
                                ? 'bg-white text-teal-600 shadow-sm'
                                : 'text-slate-500 hover:text-slate-700'
                            }`}
                    >
                        <span>{tab.icon}</span>
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* S-Curve Display */}
            <div className="rounded-2xl bg-white p-5 shadow-sm">
                <h3 className="mb-4 text-sm font-bold">
                    {tabs.find(t => t.id === activeTab)?.icon} {tabs.find(t => t.id === activeTab)?.label} Progress S-Curve
                </h3>

                {/* Show uploaded image if exists */}
                {currentUpload?.data ? (
                    <div className="relative">
                        <img
                            src={currentUpload.data}
                            alt={`${activeTab} S-Curve`}
                            className="w-full rounded-lg"
                        />
                        <p className="mt-2 text-xs text-slate-500">📷 {currentUpload.name}</p>
                    </div>
                ) : activeTab === 'general' && sCurveData.length > 0 ? (
                    <AreaChart data={sCurveData} height={300} />
                ) : (
                    <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 py-16">
                        <Icons.Image className="h-12 w-12 text-slate-300" />
                        <p className="mt-4 text-sm text-slate-500">No S-Curve image uploaded</p>
                        <p className="text-xs text-slate-400">Upload an image for this S-Curve view</p>
                    </div>
                )}
            </div>

            {/* QR Codes Section */}
            <div className="grid gap-5 md:grid-cols-3">
                {['Photos', 'Videos', 'Report'].map(type => {
                    const uploadKey = `qr${type}` as keyof typeof uploads;
                    const qrUpload = (uploads as Record<string, { name?: string; data?: string }>)?.[uploadKey];

                    return (
                        <div key={type} className="rounded-2xl bg-white p-5 shadow-sm">
                            <h4 className="mb-3 text-sm font-bold">📱 QR Code - {type}</h4>
                            {qrUpload?.data ? (
                                <div className="text-center">
                                    <img
                                        src={qrUpload.data}
                                        alt={`QR ${type}`}
                                        className="mx-auto h-32 w-32 rounded-lg"
                                    />
                                    <p className="mt-2 text-xs text-slate-500">{qrUpload.name}</p>
                                </div>
                            ) : (
                                <div className="flex h-32 items-center justify-center rounded-lg bg-slate-50">
                                    <p className="text-xs text-slate-400">No QR uploaded</p>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Progress Summary from Report */}
            {selectedReport?.overallProgress && (
                <div className="rounded-2xl bg-gradient-to-r from-teal-500 to-teal-600 p-5 text-white">
                    <h4 className="mb-3 text-sm font-bold">📊 Overall Progress Summary</h4>
                    <div className="grid grid-cols-3 gap-4">
                        <div className="rounded-lg bg-white/10 p-3 text-center">
                            <p className="text-xs opacity-80">Plan</p>
                            <p className="text-2xl font-extrabold">{(selectedReport.overallProgress.plan || 0).toFixed(1)}%</p>
                        </div>
                        <div className="rounded-lg bg-white/10 p-3 text-center">
                            <p className="text-xs opacity-80">Actual</p>
                            <p className="text-2xl font-extrabold">{(selectedReport.overallProgress.actual || 0).toFixed(1)}%</p>
                        </div>
                        <div className="rounded-lg bg-white/10 p-3 text-center">
                            <p className="text-xs opacity-80">Variance</p>
                            <p className={`text-2xl font-extrabold ${(selectedReport.overallProgress.variance || 0) >= 0 ? '' : 'text-red-200'}`}>
                                {(selectedReport.overallProgress.variance || 0) >= 0 ? '+' : ''}
                                {(selectedReport.overallProgress.variance || 0).toFixed(1)}%
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
