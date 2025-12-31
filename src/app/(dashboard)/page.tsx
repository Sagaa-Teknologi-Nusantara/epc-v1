'use client';

import { useRef, useCallback } from 'react';
import { useReportContext } from '@/contexts/ReportContext';
import { ProjectReportSelector } from '@/components/ui/ProjectReportSelector';
import { GaugeChart, SafetyPyramid, AreaChart } from '@/components/charts';
import { ExportPDFButton } from '@/components/ui/ExportPDFButton';
import { PDFExporter } from '@/lib/pdf-export';

export default function DashboardPage() {
  const { selectedProject, selectedReport, loading, error } = useReportContext();
  const sCurveRef = useRef<HTMLDivElement>(null);
  const evmRef = useRef<HTMLDivElement>(null);

  // PDF Export function
  const handleExportPDF = useCallback(async () => {
    const exporter = new PDFExporter({
      title: 'Dashboard',
      weekNo: selectedReport?.weekNo,
      projectName: selectedProject?.name,
      periodStart: selectedReport?.periodStart,
      periodEnd: selectedReport?.periodEnd,
    });

    exporter.addHeader();

    // Project Info
    exporter.addSectionTitle('Project Information');
    exporter.addKeyValue('Project Name:', selectedProject?.name || 'N/A', true);
    exporter.addKeyValue('Owner:', selectedProject?.owner || 'N/A');
    exporter.addKeyValue('Contractor:', selectedProject?.contractor || 'N/A');
    exporter.addKeyValue('Contract Type:', selectedProject?.contractType || 'N/A');
    exporter.addKeyValue('Contract Price:', `$${((selectedProject?.contractPrice || 0) / 1e6).toFixed(2)}M`);
    exporter.addKeyValue('Duration:', `${selectedProject?.startDate || ''} - ${selectedProject?.finishDate || ''}`);
    exporter.addSpacing();

    // Progress Overview
    const progress = selectedReport?.overallProgress || { plan: 0, actual: 0, variance: 0 };
    exporter.addSectionTitle('Progress Overview');
    const progressStatus = (progress.variance || 0) >= 0 ? 'good' : (progress.variance || 0) >= -5 ? 'warning' : 'bad';
    exporter.addStatsRow([
      { label: 'Plan', value: `${(progress.plan || 0).toFixed(1)}%`, status: 'neutral' },
      { label: 'Actual', value: `${(progress.actual || 0).toFixed(1)}%`, status: progressStatus },
      { label: 'Variance', value: `${(progress.variance || 0) >= 0 ? '+' : ''}${(progress.variance || 0).toFixed(1)}%`, status: progressStatus },
    ]);
    exporter.addSpacing();

    // EVM
    const evm = selectedReport?.evm || { spiValue: 1, cpiValue: 1, bac: 0, bcws: 0, bcwp: 0, acwp: 0 };
    exporter.addSectionTitle('Earned Value Management');
    const spiStatus = (evm.spiValue || 1) >= 1 ? 'good' : (evm.spiValue || 1) >= 0.9 ? 'warning' : 'bad';
    const cpiStatus = (evm.cpiValue || 1) >= 1 ? 'good' : (evm.cpiValue || 1) >= 0.9 ? 'warning' : 'bad';
    exporter.addStatsRow([
      { label: 'SPI', value: (evm.spiValue || 1).toFixed(3), status: spiStatus },
      { label: 'CPI', value: (evm.cpiValue || 1).toFixed(3), status: cpiStatus },
      { label: 'BAC', value: `$${((evm.bac || 0) / 1e6).toFixed(1)}M`, status: 'neutral' },
    ]);
    exporter.addStatsRow([
      { label: 'BCWS', value: `$${((evm.bcws || 0) / 1e6).toFixed(1)}M`, status: 'neutral' },
      { label: 'BCWP', value: `$${((evm.bcwp || 0) / 1e6).toFixed(1)}M`, status: 'neutral' },
      { label: 'ACWP', value: `$${((evm.acwp || 0) / 1e6).toFixed(1)}M`, status: 'neutral' },
    ]);

    // Try to capture S-Curve chart
    if (sCurveRef.current) {
      const svgEl = sCurveRef.current.querySelector('svg');
      if (svgEl) {
        exporter.addSpacing();
        exporter.addSectionTitle('S-Curve Progress');
        await exporter.addChart(svgEl, 180, 80);
      }
    }

    // HSE
    const hse = selectedReport?.hse || { lagging: {}, safeHours: 0, trir: 0, manpower: { total: 0 } };
    const lagging = (hse.lagging || {}) as Record<string, number>;
    exporter.addSectionTitle('HSE Summary');
    exporter.addStatsRow([
      { label: 'Fatality', value: String(lagging.fatality || 0), status: (lagging.fatality || 0) === 0 ? 'good' : 'bad' },
      { label: 'LTI', value: String(lagging.lti || 0), status: (lagging.lti || 0) === 0 ? 'good' : 'bad' },
      { label: 'Medical', value: String(lagging.medicalTreatment || 0), status: 'neutral' },
      { label: 'First Aid', value: String(lagging.firstAid || 0), status: 'neutral' },
    ]);
    exporter.addText(`Safe Hours: ${(hse.safeHours || 0).toLocaleString()}  |  TRIR: ${(hse.trir || 0).toFixed(2)}  |  Manpower: ${(hse.manpower as { total?: number })?.total || 0}`, 'small');
    exporter.addSpacing();

    // TKDN
    const tkdn = selectedReport?.tkdn || { plan: 0, actual: 0 };
    exporter.addSectionTitle('TKDN Performance');
    const tkdnStatus = (tkdn.actual || 0) >= (tkdn.plan || 0) ? 'good' : 'bad';
    exporter.addStatsRow([
      { label: 'Target', value: `${tkdn.plan || 0}%`, status: 'neutral' },
      { label: 'Actual', value: `${(tkdn.actual || 0).toFixed(1)}%`, status: tkdnStatus },
      { label: 'Status', value: (tkdn.actual || 0) >= (tkdn.plan || 0) ? 'PASS' : 'AT RISK', status: tkdnStatus },
    ]);
    exporter.addSpacing();

    // Quality
    const quality = (selectedReport?.quality || {}) as Record<string, Record<string, number>>;
    exporter.addSectionTitle('Quality Summary');
    exporter.addStatsRow([
      { label: 'Certificates', value: String(quality?.certificate?.completed || 0), status: 'good' },
      { label: 'Under Application', value: String(quality?.certificate?.underApplication || 0), status: 'warning' },
      { label: 'Not Yet Applied', value: String(quality?.certificate?.notYetApplied || 0), status: 'neutral' },
    ]);

    // Save
    const filename = `EPC_Dashboard_Week${selectedReport?.weekNo || ''}_${new Date().toISOString().split('T')[0]}.pdf`;
    exporter.save(filename);
  }, [selectedProject, selectedReport]);

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
        <div className="flex items-center gap-3">
          <ExportPDFButton onExport={handleExportPDF} label="Export PDF" />
          <ProjectReportSelector />
        </div>
      </div>

      {/* Project Info Cards - Enhanced */}
      {selectedProject && (
        <div className="rounded-2xl bg-gradient-to-r from-teal-500 to-teal-600 p-4 text-white">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
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
              <p className="text-[10px] opacity-80">Term of Payment</p>
              <p className="text-sm font-semibold">{(selectedProject as unknown as { termOfPayment?: string }).termOfPayment || 'NET 30'}</p>
            </div>
            <div className="rounded-lg bg-white/10 p-3">
              <p className="text-[10px] opacity-80">Contract Price</p>
              <p className="text-sm font-bold">${((selectedProject.contractPrice || 0) / 1e6).toFixed(2)}M</p>
            </div>
            <div className="rounded-lg bg-white/10 p-3">
              <p className="text-[10px] opacity-80">Duration</p>
              <p className="text-sm font-semibold">{selectedProject.startDate} - {selectedProject.finishDate}</p>
            </div>
            <div className="rounded-lg bg-white/10 p-3">
              <p className="text-[10px] opacity-80">Guaranteed Power</p>
              <p className="text-sm font-semibold">{(selectedProject as unknown as { guaranteedPower?: number }).guaranteedPower || 0} MW</p>
            </div>
            <div className="rounded-lg bg-white/10 p-3">
              <p className="text-[10px] opacity-80">LD Rate (Delay)</p>
              <p className="text-sm font-semibold">{((selectedProject as unknown as { ldDelayRate?: number }).ldDelayRate || 0.1) * 100}%/day</p>
            </div>
          </div>
        </div>
      )}


      {/* KPI Cards Row - 6 Cards */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
        {/* Overall Progress */}
        <div className="rounded-2xl bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold text-slate-500">📈 Overall Progress</p>
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

        {/* SPI */}
        <div className={`rounded-2xl p-4 shadow-sm ${evm.spiValue >= 1 ? 'bg-green-50' : evm.spiValue >= 0.9 ? 'bg-amber-50' : 'bg-red-50'}`}>
          <p className="text-xs font-semibold text-slate-500">📊 SPI</p>
          <p className={`mt-2 text-3xl font-extrabold ${evm.spiValue >= 1 ? 'text-green-600' : evm.spiValue >= 0.9 ? 'text-amber-600' : 'text-red-600'}`}>
            {evm.spiValue.toFixed(3)}
          </p>
          <p className="mt-1 text-[10px] text-slate-400">
            {evm.spiValue >= 1 ? '✅ Ahead' : evm.spiValue >= 0.9 ? '⚠️ Monitor' : '❌ Behind'}
          </p>
        </div>

        {/* CPI */}
        <div className={`rounded-2xl p-4 shadow-sm ${evm.cpiValue >= 1 ? 'bg-green-50' : evm.cpiValue >= 0.9 ? 'bg-amber-50' : 'bg-red-50'}`}>
          <p className="text-xs font-semibold text-slate-500">💰 CPI</p>
          <p className={`mt-2 text-3xl font-extrabold ${evm.cpiValue >= 1 ? 'text-green-600' : evm.cpiValue >= 0.9 ? 'text-amber-600' : 'text-red-600'}`}>
            {evm.cpiValue.toFixed(3)}
          </p>
          <p className="mt-1 text-[10px] text-slate-400">
            {evm.cpiValue >= 1 ? '✅ Under Budget' : evm.cpiValue >= 0.9 ? '⚠️ Monitor' : '❌ Over Budget'}
          </p>
        </div>

        {/* EAC */}
        <div className="rounded-2xl bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold text-slate-500">📉 EAC</p>
          <p className="mt-2 text-2xl font-extrabold text-slate-700">
            ${(((evm as { eac?: number }).eac || evm.bac || 0) / 1e6).toFixed(2)}M
          </p>
          <p className="mt-1 text-[10px] text-slate-400">
            BAC: ${((evm.bac || 0) / 1e6).toFixed(2)}M
          </p>
        </div>

        {/* Safe Hours */}
        <div className="rounded-2xl bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold text-slate-500">🦺 Safe Hours</p>
          <p className="mt-2 text-3xl font-extrabold text-blue-600">
            {((hse.safeHours || 0) / 1000).toFixed(0)}K
          </p>
          <p className="mt-1 text-[10px] text-slate-400">
            LTI: {(hse.lagging as Record<string, number>)?.lti || 0} | TRIR: {(hse.trir || 0).toFixed(2)}
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


      {/* Schedule & LD Estimation Section */}
      {selectedProject && (
        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <h3 className="mb-4 text-sm font-bold">⏱️ Schedule & LD Estimation</h3>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {/* Schedule Status */}
            <div className="rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 p-4">
              <p className="text-xs font-semibold text-blue-600 mb-2">📅 Planned Finish</p>
              <p className="text-lg font-bold text-blue-700">{selectedProject.finishDate || '-'}</p>
            </div>
            {/* Estimated Completion */}
            <div className="rounded-xl bg-gradient-to-br from-amber-50 to-amber-100 p-4">
              <p className="text-xs font-semibold text-amber-600 mb-2">📆 Estimated Completion</p>
              <p className="text-lg font-bold text-amber-700">
                {(() => {
                  // Calculate estimated completion based on SPI
                  const daysRemaining = selectedProject.finishDate ?
                    Math.ceil((new Date(selectedProject.finishDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) : 0;
                  const adjustedDays = evm.spiValue > 0 ? Math.ceil(daysRemaining / evm.spiValue) : daysRemaining;
                  const estDate = new Date();
                  estDate.setDate(estDate.getDate() + adjustedDays);
                  return estDate.toISOString().split('T')[0];
                })()}
              </p>
            </div>
            {/* Delay Days */}
            <div className={`rounded-xl p-4 ${(() => {
              const daysRemaining = selectedProject.finishDate ?
                Math.ceil((new Date(selectedProject.finishDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) : 0;
              const adjustedDays = evm.spiValue > 0 ? Math.ceil(daysRemaining / evm.spiValue) : daysRemaining;
              const delayDays = adjustedDays - daysRemaining;
              return delayDays <= 0 ? 'bg-green-50' : delayDays <= 30 ? 'bg-amber-50' : 'bg-red-50';
            })()}`}>
              <p className="text-xs font-semibold text-slate-600 mb-2">⏰ Delay Days</p>
              {(() => {
                const daysRemaining = selectedProject.finishDate ?
                  Math.ceil((new Date(selectedProject.finishDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) : 0;
                const adjustedDays = evm.spiValue > 0 ? Math.ceil(daysRemaining / evm.spiValue) : daysRemaining;
                const delayDays = adjustedDays - daysRemaining;
                return (
                  <p className={`text-2xl font-bold ${delayDays <= 0 ? 'text-green-600' : delayDays <= 30 ? 'text-amber-600' : 'text-red-600'}`}>
                    {delayDays <= 0 ? `${Math.abs(delayDays)} days ahead` : `${delayDays} days`}
                  </p>
                );
              })()}
            </div>
            {/* LD Estimation */}
            <div className="rounded-xl bg-gradient-to-br from-red-50 to-red-100 p-4">
              <p className="text-xs font-semibold text-red-600 mb-2">💸 LD Delay Est.</p>
              {(() => {
                const daysRemaining = selectedProject.finishDate ?
                  Math.ceil((new Date(selectedProject.finishDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) : 0;
                const adjustedDays = evm.spiValue > 0 ? Math.ceil(daysRemaining / evm.spiValue) : daysRemaining;
                const delayDays = Math.max(0, adjustedDays - daysRemaining);
                const ldRate = (selectedProject as unknown as { ldDelayRate?: number }).ldDelayRate || 0.001;
                const ldAmount = delayDays * ldRate * (selectedProject.contractPrice || 0);
                return (
                  <>
                    <p className="text-xl font-bold text-red-700">${(ldAmount / 1e6).toFixed(2)}M</p>
                    <p className="text-[10px] text-slate-500">{delayDays} days × {(ldRate * 100).toFixed(2)}%/day</p>
                  </>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* Cash Flow Dashboard - 8 KPIs */}
      {selectedReport?.cashFlow && (
        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <h3 className="mb-4 text-sm font-bold">💵 Cash Flow Performance Dashboard</h3>
          {/* Primary Values */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            <div className="rounded-xl bg-green-50 p-4 text-center">
              <p className="text-xs text-slate-500">Revenue (BCWP)</p>
              <p className="text-xl font-extrabold text-green-600">${((selectedReport.cashFlow.revenue || evm.bcwp || 0) / 1e6).toFixed(2)}M</p>
            </div>
            <div className="rounded-xl bg-red-50 p-4 text-center">
              <p className="text-xs text-slate-500">Cash Out</p>
              <p className="text-xl font-extrabold text-red-600">${((selectedReport.cashFlow.cashOut || 0) / 1e6).toFixed(2)}M</p>
            </div>
            <div className="rounded-xl bg-blue-50 p-4 text-center">
              <p className="text-xs text-slate-500">Billing</p>
              <p className="text-xl font-extrabold text-blue-600">${((selectedReport.cashFlow.billing || 0) / 1e6).toFixed(2)}M</p>
            </div>
            <div className="rounded-xl bg-purple-50 p-4 text-center">
              <p className="text-xs text-slate-500">Cash In</p>
              <p className="text-xl font-extrabold text-purple-600">${((selectedReport.cashFlow.cashIn || 0) / 1e6).toFixed(2)}M</p>
            </div>
          </div>
          {/* 8 KPI Indicators */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {/* A. Cash Flow Balance */}
            {(() => {
              const cf = selectedReport.cashFlow;
              const balance = (cf.cashIn || 0) - (cf.cashOut || 0);
              const status = balance >= 0 ? 'green' : 'red';
              return (
                <div className={`rounded-lg p-3 ${status === 'green' ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                  <p className="text-[10px] text-slate-500">A. Cash Flow Balance</p>
                  <p className={`text-lg font-bold ${status === 'green' ? 'text-green-600' : 'text-red-600'}`}>
                    ${(balance / 1e6).toFixed(2)}M
                  </p>
                  <p className="text-[9px] text-slate-400">Cash In - Cash Out</p>
                </div>
              );
            })()}
            {/* B. Billing Coverage Ratio */}
            {(() => {
              const cf = selectedReport.cashFlow;
              const ratio = (cf.revenue || evm.bcwp || 1) > 0 ? (cf.billing || 0) / (cf.revenue || evm.bcwp || 1) : 0;
              const status = ratio >= 0.9 ? 'green' : ratio >= 0.7 ? 'amber' : 'red';
              return (
                <div className={`rounded-lg p-3 ${status === 'green' ? 'bg-green-50 border border-green-200' : status === 'amber' ? 'bg-amber-50 border border-amber-200' : 'bg-red-50 border border-red-200'}`}>
                  <p className="text-[10px] text-slate-500">B. Billing Coverage</p>
                  <p className={`text-lg font-bold ${status === 'green' ? 'text-green-600' : status === 'amber' ? 'text-amber-600' : 'text-red-600'}`}>
                    {(ratio * 100).toFixed(1)}%
                  </p>
                  <p className="text-[9px] text-slate-400">Billing / Revenue</p>
                </div>
              );
            })()}
            {/* C. Cash Collection Ratio */}
            {(() => {
              const cf = selectedReport.cashFlow;
              const ratio = (cf.billing || 1) > 0 ? (cf.cashIn || 0) / (cf.billing || 1) : 0;
              const status = ratio >= 0.9 ? 'green' : ratio >= 0.7 ? 'amber' : 'red';
              return (
                <div className={`rounded-lg p-3 ${status === 'green' ? 'bg-green-50 border border-green-200' : status === 'amber' ? 'bg-amber-50 border border-amber-200' : 'bg-red-50 border border-red-200'}`}>
                  <p className="text-[10px] text-slate-500">C. Cash Collection</p>
                  <p className={`text-lg font-bold ${status === 'green' ? 'text-green-600' : status === 'amber' ? 'text-amber-600' : 'text-red-600'}`}>
                    {(ratio * 100).toFixed(1)}%
                  </p>
                  <p className="text-[9px] text-slate-400">Cash In / Billing</p>
                </div>
              );
            })()}
            {/* D. Cash Adequacy Ratio */}
            {(() => {
              const cf = selectedReport.cashFlow;
              const ratio = (cf.cashOut || 1) > 0 ? (cf.cashIn || 0) / (cf.cashOut || 1) : 0;
              const status = ratio >= 1 ? 'green' : ratio >= 0.8 ? 'amber' : 'red';
              return (
                <div className={`rounded-lg p-3 ${status === 'green' ? 'bg-green-50 border border-green-200' : status === 'amber' ? 'bg-amber-50 border border-amber-200' : 'bg-red-50 border border-red-200'}`}>
                  <p className="text-[10px] text-slate-500">D. Cash Adequacy</p>
                  <p className={`text-lg font-bold ${status === 'green' ? 'text-green-600' : status === 'amber' ? 'text-amber-600' : 'text-red-600'}`}>
                    {ratio.toFixed(2)}x
                  </p>
                  <p className="text-[9px] text-slate-400">Cash In / Cash Out</p>
                </div>
              );
            })()}
            {/* E. Cash Burn Rate */}
            {(() => {
              const cf = selectedReport.cashFlow;
              const burnRate = cf.cashBurnRate || ((cf.cashOut || 0) / (selectedReport.weekNo || 1));
              return (
                <div className="rounded-lg p-3 bg-slate-50 border border-slate-200">
                  <p className="text-[10px] text-slate-500">E. Cash Burn Rate</p>
                  <p className="text-lg font-bold text-slate-600">${(burnRate / 1e6).toFixed(2)}M</p>
                  <p className="text-[9px] text-slate-400">Per Week</p>
                </div>
              );
            })()}
            {/* F. Earned Cash Ratio */}
            {(() => {
              const cf = selectedReport.cashFlow;
              const ratio = (evm.bcwp || 1) > 0 ? (cf.cashIn || 0) / (evm.bcwp || 1) : 0;
              const status = ratio >= 0.8 ? 'green' : ratio >= 0.6 ? 'amber' : 'red';
              return (
                <div className={`rounded-lg p-3 ${status === 'green' ? 'bg-green-50 border border-green-200' : status === 'amber' ? 'bg-amber-50 border border-amber-200' : 'bg-red-50 border border-red-200'}`}>
                  <p className="text-[10px] text-slate-500">F. Earned Cash Ratio</p>
                  <p className={`text-lg font-bold ${status === 'green' ? 'text-green-600' : status === 'amber' ? 'text-amber-600' : 'text-red-600'}`}>
                    {(ratio * 100).toFixed(1)}%
                  </p>
                  <p className="text-[9px] text-slate-400">Cash In / BCWP</p>
                </div>
              );
            })()}
            {/* G. Billing Lag */}
            {(() => {
              const cf = selectedReport.cashFlow;
              const lag = (evm.bcwp || 0) - (cf.billing || 0);
              const status = lag <= 0 ? 'green' : lag < (evm.bcwp || 1) * 0.1 ? 'amber' : 'red';
              return (
                <div className={`rounded-lg p-3 ${status === 'green' ? 'bg-green-50 border border-green-200' : status === 'amber' ? 'bg-amber-50 border border-amber-200' : 'bg-red-50 border border-red-200'}`}>
                  <p className="text-[10px] text-slate-500">G. Billing Lag</p>
                  <p className={`text-lg font-bold ${status === 'green' ? 'text-green-600' : status === 'amber' ? 'text-amber-600' : 'text-red-600'}`}>
                    ${(lag / 1e6).toFixed(2)}M
                  </p>
                  <p className="text-[9px] text-slate-400">BCWP - Billing</p>
                </div>
              );
            })()}
            {/* H. Cash Gap */}
            {(() => {
              const cf = selectedReport.cashFlow;
              const gap = (cf.cashOut || 0) - (cf.cashIn || 0);
              const status = gap <= 0 ? 'green' : gap < (cf.cashOut || 1) * 0.2 ? 'amber' : 'red';
              return (
                <div className={`rounded-lg p-3 ${status === 'green' ? 'bg-green-50 border border-green-200' : status === 'amber' ? 'bg-amber-50 border border-amber-200' : 'bg-red-50 border border-red-200'}`}>
                  <p className="text-[10px] text-slate-500">H. Cash Gap</p>
                  <p className={`text-lg font-bold ${status === 'green' ? 'text-green-600' : status === 'amber' ? 'text-amber-600' : 'text-red-600'}`}>
                    ${(gap / 1e6).toFixed(2)}M
                  </p>
                  <p className="text-[9px] text-slate-400">Cash Out - Cash In</p>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* TKDN Performance Section */}
      {(tkdn.plan > 0 || tkdn.actual > 0) && (
        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <h3 className="mb-4 text-sm font-bold">🏭 TKDN Performance</h3>
          <div className="grid gap-4 md:grid-cols-3">
            {/* TKDN Gauge */}
            <div className={`rounded-xl p-4 text-center ${(tkdn.actual || 0) >= (tkdn.plan || 0) ? 'bg-green-50 border-2 border-green-500' : 'bg-red-50 border-2 border-red-500'}`}>
              <p className="text-xs text-slate-500 mb-2">TKDN Achievement</p>
              <p className={`text-4xl font-extrabold ${(tkdn.actual || 0) >= (tkdn.plan || 0) ? 'text-green-600' : 'text-red-600'}`}>
                {(tkdn.actual || 0).toFixed(1)}%
              </p>
              <div className="mt-3 h-3 rounded-full bg-slate-200 overflow-hidden">
                <div
                  className={`h-full rounded-full ${(tkdn.actual || 0) >= (tkdn.plan || 0) ? 'bg-green-500' : 'bg-red-500'}`}
                  style={{ width: `${Math.min((tkdn.actual || 0), 100)}%` }}
                />
              </div>
              <p className="mt-2 text-xs text-slate-500">Target: {tkdn.plan}%</p>
            </div>
            {/* TKDN Info Box */}
            <div className="rounded-xl bg-slate-50 p-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="text-center">
                  <p className="text-xs text-blue-600">Target Minimum</p>
                  <p className="text-2xl font-bold text-blue-600">{tkdn.plan}%</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-teal-600">Realisasi Aktual</p>
                  <p className="text-2xl font-bold text-teal-600">{(tkdn.actual || 0).toFixed(1)}%</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-slate-500">Variance</p>
                  <p className={`text-xl font-bold ${((tkdn.actual || 0) - (tkdn.plan || 0)) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {((tkdn.actual || 0) - (tkdn.plan || 0)) >= 0 ? '+' : ''}{((tkdn.actual || 0) - (tkdn.plan || 0)).toFixed(1)}%
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-slate-500">Achievement Rate</p>
                  <p className="text-xl font-bold text-slate-600">
                    {((tkdn.actual || 0) / (tkdn.plan || 1) * 100).toFixed(1)}%
                  </p>
                </div>
              </div>
            </div>
            {/* TKDN Status */}
            <div className={`rounded-xl p-4 flex flex-col items-center justify-center ${(tkdn.actual || 0) >= (tkdn.plan || 0) ? 'bg-green-500' : 'bg-red-500'}`}>
              <p className="text-4xl mb-2">{(tkdn.actual || 0) >= (tkdn.plan || 0) ? '✅' : '❌'}</p>
              <p className="text-xl font-bold text-white">
                {(tkdn.actual || 0) >= (tkdn.plan || 0) ? 'PASS' : 'AT RISK'}
              </p>
              <p className="text-xs text-white/80 mt-1">
                {(tkdn.actual || 0) >= (tkdn.plan || 0) ? 'Memenuhi Target TKDN' : 'Belum Memenuhi Target'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* EPCC Progress Section */}
      {selectedReport?.epcc && (
        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <h3 className="mb-4 text-sm font-bold">📊 EPCC Progress Breakdown</h3>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { key: 'engineering', label: 'Engineering', color: 'from-purple-400 to-purple-600', icon: '🔧' },
              { key: 'procurement', label: 'Procurement', color: 'from-amber-400 to-amber-600', icon: '📦' },
              { key: 'construction', label: 'Construction', color: 'from-green-400 to-green-600', icon: '🏗️' },
              { key: 'commissioning', label: 'Commissioning', color: 'from-red-400 to-red-600', icon: '⚡' },
            ].map(({ key, label, color, icon }) => {
              const data = (selectedReport.epcc as unknown as Record<string, { plan?: number; actual?: number; weight?: number }>)[key] || {};
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
      )}

      {/* Charts Row */}
      <div className="grid gap-5 lg:grid-cols-2">
        {/* S-Curve */}
        <div ref={sCurveRef} className="rounded-2xl bg-white p-5 shadow-sm">
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

      {/* Cash Flow Bar Chart Section */}
      {selectedReport?.cashFlow && (
        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <h3 className="mb-4 text-sm font-bold">💵 Cash Flow Details</h3>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { label: 'Revenue', value: selectedReport.cashFlow.revenue || 0, color: 'bg-green-500' },
              { label: 'Cash Out', value: selectedReport.cashFlow.cashOut || 0, color: 'bg-red-500' },
              { label: 'Billing', value: selectedReport.cashFlow.billing || 0, color: 'bg-blue-500' },
              { label: 'Cash In', value: selectedReport.cashFlow.cashIn || 0, color: 'bg-purple-500' },
            ].map(({ label, value, color }) => (
              <div key={label} className="rounded-lg bg-slate-50 p-4 text-center">
                <p className="text-xs text-slate-500 mb-2">{label}</p>
                <div className={`inline-block ${color} text-white px-4 py-2 rounded-lg`}>
                  <p className="text-lg font-extrabold">${(value / 1e6).toFixed(2)}M</p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
            <div className="rounded-lg bg-amber-50 p-3 text-center">
              <p className="text-[10px] text-slate-500">Billing Coverage</p>
              <p className="text-lg font-bold text-amber-600">{((selectedReport.cashFlow.billingCoverageRatio || 0) * 100).toFixed(1)}%</p>
            </div>
            <div className="rounded-lg bg-teal-50 p-3 text-center">
              <p className="text-[10px] text-slate-500">Cash Collection</p>
              <p className="text-lg font-bold text-teal-600">{((selectedReport.cashFlow.cashCollectionRatio || 0) * 100).toFixed(1)}%</p>
            </div>
            <div className="rounded-lg bg-blue-50 p-3 text-center">
              <p className="text-[10px] text-slate-500">Cash Balance</p>
              <p className="text-lg font-bold text-blue-600">${((selectedReport.cashFlow.cashFlowBalance || 0) / 1e6).toFixed(2)}M</p>
            </div>
            <div className="rounded-lg bg-slate-100 p-3 text-center">
              <p className="text-[10px] text-slate-500">Burn Rate</p>
              <p className="text-lg font-bold text-slate-600">${((selectedReport.cashFlow.cashBurnRate || 0) / 1e6).toFixed(2)}M</p>
            </div>
          </div>
        </div>
      )}

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

      {/* Quality NCR & Punch List Section */}
      {selectedReport?.quality && (
        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <h3 className="mb-4 text-sm font-bold">🔍 Quality Performance</h3>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* NCR Summary */}
            <div className="rounded-xl bg-gradient-to-br from-red-50 to-red-100 p-4">
              <p className="text-xs font-semibold text-red-600 mb-2">📝 NCR Status</p>
              {(() => {
                const q = selectedReport.quality as unknown as { siteOffice?: { ncr?: { ownerToContractor?: Record<string, { open?: number; closed?: number }>; contractorToVendor?: Record<string, { open?: number; closed?: number }> } } };
                const ncrOpen = (q?.siteOffice?.ncr?.ownerToContractor?.process?.open || 0) + (q?.siteOffice?.ncr?.contractorToVendor?.process?.open || 0);
                const ncrClosed = (q?.siteOffice?.ncr?.ownerToContractor?.process?.closed || 0) + (q?.siteOffice?.ncr?.contractorToVendor?.process?.closed || 0);
                return (
                  <div className="flex justify-around">
                    <div className="text-center">
                      <p className="text-xl font-extrabold text-red-600">{ncrOpen}</p>
                      <p className="text-[10px] text-slate-500">Open</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xl font-extrabold text-green-600">{ncrClosed}</p>
                      <p className="text-[10px] text-slate-500">Closed</p>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Punch List Summary */}
            <div className="rounded-xl bg-gradient-to-br from-amber-50 to-amber-100 p-4">
              <p className="text-xs font-semibold text-amber-600 mb-2">📌 Punch List</p>
              {(() => {
                const q = selectedReport.quality as unknown as { siteOffice?: { punchList?: { ownerToContractor?: Record<string, { open?: number; closed?: number }>; contractorToVendor?: Record<string, { open?: number; closed?: number }> } } };
                const punchOpen = (q?.siteOffice?.punchList?.ownerToContractor?.process?.open || 0) + (q?.siteOffice?.punchList?.contractorToVendor?.process?.open || 0);
                const punchClosed = (q?.siteOffice?.punchList?.ownerToContractor?.process?.closed || 0) + (q?.siteOffice?.punchList?.contractorToVendor?.process?.closed || 0);
                return (
                  <div className="flex justify-around">
                    <div className="text-center">
                      <p className="text-xl font-extrabold text-amber-600">{punchOpen}</p>
                      <p className="text-[10px] text-slate-500">Open</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xl font-extrabold text-green-600">{punchClosed}</p>
                      <p className="text-[10px] text-slate-500">Closed</p>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Welding Rejection */}
            <div className="rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 p-4">
              <p className="text-xs font-semibold text-blue-600 mb-2">🔧 Welding Rejection</p>
              {(() => {
                const q = selectedReport.quality as unknown as { siteOffice?: { welding?: { ndtAccepted?: number; ndtRejected?: number; rejectionRatePlan?: number } } };
                const welding = q?.siteOffice?.welding;
                const total = (welding?.ndtAccepted || 0) + (welding?.ndtRejected || 0);
                const rate = total > 0 ? ((welding?.ndtRejected || 0) / total) * 100 : 0;
                const plan = welding?.rejectionRatePlan || 2;
                return (
                  <div className="text-center">
                    <p className={`text-2xl font-extrabold ${rate <= plan ? 'text-green-600' : 'text-red-600'}`}>
                      {rate.toFixed(2)}%
                    </p>
                    <p className="text-[10px] text-slate-500">Plan: ≤{plan}%</p>
                  </div>
                );
              })()}
            </div>

            {/* Certificate Progress */}
            <div className="rounded-xl bg-gradient-to-br from-green-50 to-green-100 p-4">
              <p className="text-xs font-semibold text-green-600 mb-2">📜 Certificates</p>
              {(() => {
                const q = selectedReport.quality as unknown as { certificate?: { completed?: number; underApplication?: number; notYetApplied?: number } };
                const cert = q?.certificate;
                const total = (cert?.completed || 0) + (cert?.underApplication || 0) + (cert?.notYetApplied || 0);
                const pct = total > 0 ? ((cert?.completed || 0) / total) * 100 : 0;
                return (
                  <div className="text-center">
                    <p className="text-2xl font-extrabold text-green-600">{pct.toFixed(1)}%</p>
                    <p className="text-[10px] text-slate-500">{cert?.completed || 0}/{total} Completed</p>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* Milestones Section */}
      {((selectedReport?.milestonesSchedule?.length ?? 0) > 0 || (selectedReport?.milestonesPayment?.length ?? 0) > 0) && (
        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <h3 className="mb-4 text-sm font-bold">🎯 Milestone Status</h3>
          <div className="grid gap-4 md:grid-cols-2">
            {/* Schedule Milestones */}
            <div className="rounded-xl bg-gradient-to-br from-violet-50 to-violet-100 p-4">
              <p className="text-xs font-semibold text-violet-600 mb-3">📅 Schedule Milestones</p>
              {(() => {
                const ms = selectedReport?.milestonesSchedule || [];
                const completed = ms.filter(m => m.status === 'Completed').length;
                const onTrack = ms.filter(m => m.status === 'On Track').length;
                const atRisk = ms.filter(m => m.status === 'At Risk').length;
                const delayed = ms.filter(m => ['Delayed', 'Critical', 'Overdue'].includes(m.status)).length;
                return (
                  <div className="grid grid-cols-4 gap-2 text-center">
                    <div className="rounded-lg bg-white p-2"><p className="text-lg font-bold text-green-600">{completed}</p><p className="text-[9px] text-slate-500">Done</p></div>
                    <div className="rounded-lg bg-white p-2"><p className="text-lg font-bold text-blue-600">{onTrack}</p><p className="text-[9px] text-slate-500">On Track</p></div>
                    <div className="rounded-lg bg-white p-2"><p className="text-lg font-bold text-amber-600">{atRisk}</p><p className="text-[9px] text-slate-500">At Risk</p></div>
                    <div className="rounded-lg bg-white p-2"><p className="text-lg font-bold text-red-600">{delayed}</p><p className="text-[9px] text-slate-500">Delayed</p></div>
                  </div>
                );
              })()}
            </div>

            {/* Payment Milestones */}
            <div className="rounded-xl bg-gradient-to-br from-amber-50 to-amber-100 p-4">
              <p className="text-xs font-semibold text-amber-600 mb-3">💳 Payment Milestones</p>
              {(() => {
                const ms = selectedReport?.milestonesPayment || [];
                const completed = ms.filter(m => m.status === 'Completed').length;
                const onTrack = ms.filter(m => m.status === 'On Track').length;
                const atRisk = ms.filter(m => m.status === 'At Risk').length;
                const delayed = ms.filter(m => ['Delayed', 'Critical', 'Overdue'].includes(m.status)).length;
                return (
                  <div className="grid grid-cols-4 gap-2 text-center">
                    <div className="rounded-lg bg-white p-2"><p className="text-lg font-bold text-green-600">{completed}</p><p className="text-[9px] text-slate-500">Done</p></div>
                    <div className="rounded-lg bg-white p-2"><p className="text-lg font-bold text-blue-600">{onTrack}</p><p className="text-[9px] text-slate-500">On Track</p></div>
                    <div className="rounded-lg bg-white p-2"><p className="text-lg font-bold text-amber-600">{atRisk}</p><p className="text-[9px] text-slate-500">At Risk</p></div>
                    <div className="rounded-lg bg-white p-2"><p className="text-lg font-bold text-red-600">{delayed}</p><p className="text-[9px] text-slate-500">Delayed</p></div>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* Activities Section */}
      {(selectedReport?.thisWeekActivities || selectedReport?.nextWeekPlan) && (
        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <h3 className="mb-4 text-sm font-bold">📝 Activities Summary</h3>
          <div className="grid gap-4 md:grid-cols-2">
            {/* This Week */}
            <div className="rounded-xl bg-gradient-to-br from-teal-50 to-teal-100 p-4">
              <p className="text-xs font-semibold text-teal-600 mb-3">✅ This Week Completed</p>
              <div className="space-y-2">
                {(['engineering', 'procurement', 'construction', 'precommissioning'] as const).map(key => {
                  const items = (selectedReport.thisWeekActivities as unknown as Record<string, string[]>)?.[key] || [];
                  if (items.length === 0) return null;
                  return (
                    <div key={key} className="rounded-lg bg-white p-2">
                      <p className="text-[10px] font-semibold text-slate-600 capitalize mb-1">{key}</p>
                      <ul className="text-[10px] text-slate-500 list-disc list-inside">
                        {items.slice(0, 2).map((item, i) => <li key={i} className="truncate">{item}</li>)}
                        {items.length > 2 && <li className="text-slate-400">+{items.length - 2} more...</li>}
                      </ul>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Next Week */}
            <div className="rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 p-4">
              <p className="text-xs font-semibold text-blue-600 mb-3">📆 Next Week Plan</p>
              <div className="space-y-2">
                {(['engineering', 'procurement', 'construction', 'precommissioning'] as const).map(key => {
                  const items = (selectedReport.nextWeekPlan as unknown as Record<string, string[]>)?.[key] || [];
                  if (items.length === 0) return null;
                  return (
                    <div key={key} className="rounded-lg bg-white p-2">
                      <p className="text-[10px] font-semibold text-slate-600 capitalize mb-1">{key}</p>
                      <ul className="text-[10px] text-slate-500 list-disc list-inside">
                        {items.slice(0, 2).map((item, i) => <li key={i} className="truncate">{item}</li>)}
                        {items.length > 2 && <li className="text-slate-400">+{items.length - 2} more...</li>}
                      </ul>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
