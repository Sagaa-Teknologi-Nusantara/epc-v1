'use client';

import { useReportContext } from '@/contexts/ReportContext';
import { ProjectReportSelector } from '@/components/ui/ProjectReportSelector';
import { GaugeChart, SafetyPyramid, AreaChart } from '@/components/charts';

export default function DashboardPage() {
  const { selectedProject, selectedReport, loading, error } = useReportContext();

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <div className="mb-4 h-10 w-10 animate-spin rounded-full border-4 border-teal-500 border-t-transparent mx-auto"></div>
          <p className="text-slate-500">Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl bg-red-50 p-8 text-center">
        <p className="text-red-600 mb-2">Failed to load data</p>
        <p className="text-sm text-slate-500">{error}</p>
      </div>
    );
  }

  // Extract data from selected report
  const evm = selectedReport?.evm || { bac: 0, bcws: 0, bcwp: 0, acwp: 0, spiValue: 0, cpiValue: 0 };
  const overallProgress = selectedReport?.overallProgress || { plan: 0, actual: 0, variance: 0 };
  const hse = selectedReport?.hse || { lagging: {}, leading: {}, manpower: { total: 0 }, safeHours: 0, trir: 0 };
  const quality = selectedReport?.quality || {};
  const tkdn = selectedReport?.tkdn || { plan: 0, actual: 0 };
  const sCurveData = selectedReport?.sCurveData || [];

  // Calculate SPI/CPI status colors
  const spiColor = evm.spiValue >= 1 ? '#22c55e' : evm.spiValue >= 0.9 ? '#f59e0b' : '#ef4444';
  const cpiColor = evm.cpiValue >= 1 ? '#22c55e' : evm.cpiValue >= 0.9 ? '#f59e0b' : '#ef4444';

  return (
    <div className="space-y-5">
      {/* Header with Selector */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800">
            {selectedProject?.name || 'Select a Project'}
          </h1>
          {selectedReport && (
            <p className="text-sm text-slate-500">
              Week {selectedReport.weekNo} | {selectedReport.periodStart || 'N/A'} - {selectedReport.periodEnd || 'N/A'}
            </p>
          )}
        </div>
        <ProjectReportSelector />
      </div>

      {/* Project Info Cards */}
      {selectedProject && (
        <div className="rounded-2xl bg-gradient-to-r from-teal-500 to-teal-600 p-4 text-white">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
            <div className="rounded-lg bg-white/10 p-3">
              <p className="text-[10px] opacity-80">Owner</p>
              <p className="text-sm font-semibold">{selectedProject.owner || '-'}</p>
            </div>
            <div className="rounded-lg bg-white/10 p-3">
              <p className="text-[10px] opacity-80">Contractor</p>
              <p className="text-sm font-semibold">{selectedProject.contractor || '-'}</p>
            </div>
            <div className="rounded-lg bg-white/10 p-3">
              <p className="text-[10px] opacity-80">Contract Type</p>
              <p className="text-sm font-semibold">{selectedProject.contractType || '-'}</p>
            </div>
            <div className="rounded-lg bg-white/10 p-3">
              <p className="text-[10px] opacity-80">Contract Price</p>
              <p className="text-sm font-bold">${((selectedProject.contractPrice || 0) / 1e6).toFixed(2)}M</p>
            </div>
            <div className="rounded-lg bg-white/10 p-3">
              <p className="text-[10px] opacity-80">Start Date</p>
              <p className="text-sm font-semibold">{selectedProject.startDate || '-'}</p>
            </div>
            <div className="rounded-lg bg-white/10 p-3">
              <p className="text-[10px] opacity-80">Finish Date</p>
              <p className="text-sm font-semibold">{selectedProject.finishDate || '-'}</p>
            </div>
          </div>
        </div>
      )}

      {/* KPI Cards Row */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {/* Overall Progress */}
        <div className="rounded-2xl bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold text-slate-500">Overall Progress</p>
          <div className="mt-2 flex items-end gap-2">
            <span className="text-3xl font-extrabold text-teal-600">{(overallProgress.actual || 0).toFixed(1)}%</span>
            <span className={`text-sm font-semibold ${(overallProgress.variance || 0) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {(overallProgress.variance || 0) >= 0 ? '+' : ''}{(overallProgress.variance || 0).toFixed(1)}%
            </span>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200">
            <div
              className="h-full rounded-full bg-gradient-to-r from-teal-400 to-teal-600"
              style={{ width: `${Math.min(overallProgress.actual || 0, 100)}%` }}
            />
          </div>
          <p className="mt-1 text-[10px] text-slate-400">Plan: {(overallProgress.plan || 0).toFixed(1)}%</p>
        </div>

        {/* TKDN */}
        <div className={`rounded-2xl p-4 shadow-sm ${(tkdn.actual || 0) >= (tkdn.plan || 0) ? 'bg-green-50' : 'bg-red-50'
          }`}>
          <p className="text-xs font-semibold text-slate-500">🏭 TKDN</p>
          <div className="mt-2 flex items-end gap-2">
            <span className={`text-3xl font-extrabold ${(tkdn.actual || 0) >= (tkdn.plan || 0) ? 'text-green-600' : 'text-red-600'
              }`}>
              {(tkdn.actual || 0).toFixed(1)}%
            </span>
            <span className="text-sm text-slate-500">/ {tkdn.plan || 0}%</span>
          </div>
          <p className="mt-2 text-xs font-semibold">
            {(tkdn.actual || 0) >= (tkdn.plan || 0) ? '✅ MEMENUHI' : '❌ BELUM MEMENUHI'}
          </p>
        </div>

        {/* Safe Hours */}
        <div className="rounded-2xl bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold text-slate-500">🦺 Safe Hours</p>
          <p className="mt-2 text-3xl font-extrabold text-blue-600">
            {((hse.safeHours || 0) / 1000).toFixed(0)}K
          </p>
          <p className="mt-1 text-[10px] text-slate-400">
            TRIR: {(hse.trir || 0).toFixed(2)} | Manpower: {hse.manpower?.total || 0}
          </p>
        </div>

        {/* Cash Flow Status */}
        <div className={`rounded-2xl p-4 shadow-sm ${selectedReport?.cashFlow?.overallStatus === 'green' ? 'bg-green-50' :
            selectedReport?.cashFlow?.overallStatus === 'yellow' ? 'bg-amber-50' : 'bg-red-50'
          }`}>
          <p className="text-xs font-semibold text-slate-500">💵 Cash Flow</p>
          <p className="mt-2 text-lg font-extrabold">
            {selectedReport?.cashFlow?.overallStatus === 'green' ? '🟢 Healthy' :
              selectedReport?.cashFlow?.overallStatus === 'yellow' ? '🟡 Monitor' : '🔴 At Risk'}
          </p>
          <p className="mt-1 text-[10px] text-slate-400">
            Score: {(selectedReport?.cashFlow?.overallScore || 0).toFixed(0)}/100
          </p>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid gap-5 lg:grid-cols-2">
        {/* S-Curve */}
        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <h3 className="mb-4 text-sm font-bold">📈 S-Curve Progress</h3>
          {sCurveData.length > 0 ? (
            <AreaChart data={sCurveData} height={200} />
          ) : (
            <div className="flex h-48 items-center justify-center text-slate-400">
              No S-Curve data available
            </div>
          )}
        </div>

        {/* EVM Gauges */}
        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <h3 className="mb-4 text-sm font-bold">📊 Earned Value Management</h3>
          <div className="flex justify-around">
            <GaugeChart value={evm.spiValue || 0} label="SPI" color={spiColor} />
            <GaugeChart value={evm.cpiValue || 0} label="CPI" color={cpiColor} />
          </div>
          <div className="mt-4 grid grid-cols-4 gap-2 text-center text-xs">
            <div className="rounded-lg bg-slate-50 p-2">
              <p className="text-slate-500">BCWS</p>
              <p className="font-bold">${((evm.bcws || 0) / 1e6).toFixed(1)}M</p>
            </div>
            <div className="rounded-lg bg-slate-50 p-2">
              <p className="text-slate-500">BCWP</p>
              <p className="font-bold">${((evm.bcwp || 0) / 1e6).toFixed(1)}M</p>
            </div>
            <div className="rounded-lg bg-slate-50 p-2">
              <p className="text-slate-500">ACWP</p>
              <p className="font-bold">${((evm.acwp || 0) / 1e6).toFixed(1)}M</p>
            </div>
            <div className="rounded-lg bg-slate-50 p-2">
              <p className="text-slate-500">BAC</p>
              <p className="font-bold">${((evm.bac || 0) / 1e6).toFixed(1)}M</p>
            </div>
          </div>
        </div>
      </div>

      {/* HSE & Quality Row */}
      <div className="grid gap-5 lg:grid-cols-2">
        {/* Safety Pyramid */}
        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <h3 className="mb-4 text-sm font-bold">🦺 HSE - Safety Pyramid</h3>
          <SafetyPyramid hse={hse} />
        </div>

        {/* Quality Summary */}
        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <h3 className="mb-4 text-sm font-bold">📋 Quality Summary</h3>
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-lg bg-green-50 p-3 text-center">
              <p className="text-2xl font-extrabold text-green-600">
                {(quality as Record<string, Record<string, number>>)?.certificate?.completed || 0}
              </p>
              <p className="text-xs text-slate-500">Certificates</p>
            </div>
            <div className="rounded-lg bg-amber-50 p-3 text-center">
              <p className="text-2xl font-extrabold text-amber-600">
                {(quality as Record<string, Record<string, number>>)?.certificate?.underApplication || 0}
              </p>
              <p className="text-xs text-slate-500">Under App.</p>
            </div>
            <div className="rounded-lg bg-slate-50 p-3 text-center">
              <p className="text-2xl font-extrabold text-slate-600">
                {(quality as Record<string, Record<string, number>>)?.certificate?.notYetApplied || 0}
              </p>
              <p className="text-xs text-slate-500">Not Yet</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
