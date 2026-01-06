'use client';

import { useRef, useCallback, useState, useEffect } from 'react';
import { useReportContext } from '@/contexts/ReportContext';
import { ProjectReportSelector } from '@/components/ui/ProjectReportSelector';
import { GaugeChart, SafetyPyramid, AreaChart } from '@/components/charts';
import { ExportPDFButton } from '@/components/ui/ExportPDFButton';
import { PDFExporter } from '@/lib/pdf-export';
import { ImageViewerModal } from '@/components/modals/ImageViewerModal';

export default function DashboardPage() {
  const { selectedProject, selectedReport, loading, error } = useReportContext();
  const sCurveRef = useRef<HTMLDivElement>(null);
  const evmRef = useRef<HTMLDivElement>(null);

  // Signal when page is ready for print (used by Data Management PDF export)
  useEffect(() => {
    if (!loading && selectedReport) {
      // Set attribute to signal that page is fully loaded
      document.body.setAttribute('data-print-ready', 'true');
    } else {
      document.body.removeAttribute('data-print-ready');
    }
    return () => {
      document.body.removeAttribute('data-print-ready');
    };
  }, [loading, selectedReport]);


  // Image viewer state
  const [imageViewerOpen, setImageViewerOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string>('');
  const [imageViewerTitle, setImageViewerTitle] = useState<string>('');

  // Open image viewer
  const openImageViewer = (src: string, title: string) => {
    setSelectedImage(src);
    setImageViewerTitle(title);
    setImageViewerOpen(true);
  };

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

    // KPI Summary
    const progress = selectedReport?.overallProgress || { plan: 0, actual: 0, variance: 0 };
    const evm = selectedReport?.evm || { spiValue: 1, cpiValue: 1, bac: 0, bcws: 0, bcwp: 0, acwp: 0 };
    const progressStatus = (progress.variance || 0) >= 0 ? 'good' : (progress.variance || 0) >= -5 ? 'warning' : 'bad';
    const spiStatus = (evm.spiValue || 1) >= 1 ? 'good' : (evm.spiValue || 1) >= 0.9 ? 'warning' : 'bad';
    const cpiStatus = (evm.cpiValue || 1) >= 1 ? 'good' : (evm.cpiValue || 1) >= 0.9 ? 'warning' : 'bad';

    exporter.addSectionTitle('KPI Summary');
    exporter.addStatsRow([
      { label: 'Progress', value: `${(progress.actual || 0).toFixed(1)}%`, status: progressStatus },
      { label: 'SPI', value: (evm.spiValue || 1).toFixed(3), status: spiStatus },
      { label: 'CPI', value: (evm.cpiValue || 1).toFixed(3), status: cpiStatus },
    ]);
    exporter.addStatsRow([
      { label: 'EAC', value: `$${(((evm as { eac?: number }).eac || evm.bac || 0) / 1e6).toFixed(2)}M`, status: 'neutral' },
      { label: 'Safe Hours', value: `${((selectedReport?.hse?.safeHours || 0) / 1000).toFixed(0)}K`, status: 'neutral' },
      { label: 'Cash Flow', value: selectedReport?.cashFlow?.overallStatus === 'green' ? 'Healthy' : selectedReport?.cashFlow?.overallStatus === 'yellow' ? 'Monitor' : 'At Risk', status: selectedReport?.cashFlow?.overallStatus === 'green' ? 'good' : selectedReport?.cashFlow?.overallStatus === 'yellow' ? 'warning' : 'bad' },
    ]);
    exporter.addSpacing();

    // Schedule & LD Estimation
    if (selectedProject) {
      exporter.addSectionTitle('Schedule & LD Estimation');
      const daysRemaining = selectedProject.finishDate ?
        Math.ceil((new Date(selectedProject.finishDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) : 0;
      const adjustedDays = evm.spiValue > 0 ? Math.ceil(daysRemaining / evm.spiValue) : daysRemaining;
      const delayDays = Math.max(0, adjustedDays - daysRemaining);
      const ldRate = (selectedProject as unknown as { ldDelayRate?: number }).ldDelayRate || 0.001;
      const ldAmount = delayDays * ldRate * (selectedProject.contractPrice || 0);

      exporter.addKeyValue('Planned Finish:', selectedProject.finishDate || 'N/A');
      exporter.addKeyValue('Delay Days:', delayDays <= 0 ? 'On Schedule' : `${delayDays} days`);
      exporter.addKeyValue('LD Delay Estimation:', `$${(ldAmount / 1e6).toFixed(2)}M`);
      exporter.addSpacing();
    }

    // EVM Details
    exporter.addSectionTitle('Earned Value Management');
    exporter.addStatsRow([
      { label: 'BCWS', value: `$${((evm.bcws || 0) / 1e6).toFixed(2)}M`, status: 'neutral' },
      { label: 'BCWP', value: `$${((evm.bcwp || 0) / 1e6).toFixed(2)}M`, status: 'neutral' },
      { label: 'ACWP', value: `$${((evm.acwp || 0) / 1e6).toFixed(2)}M`, status: 'neutral' },
      { label: 'BAC', value: `$${((evm.bac || 0) / 1e6).toFixed(2)}M`, status: 'neutral' },
    ]);
    exporter.addSpacing();

    // Cash Flow Dashboard
    if (selectedReport?.cashFlow) {
      const cf = selectedReport.cashFlow;
      exporter.addSectionTitle('Cash Flow Performance');
      exporter.addStatsRow([
        { label: 'Revenue', value: `$${((cf.revenue || evm.bcwp || 0) / 1e6).toFixed(2)}M`, status: 'good' },
        { label: 'Cash Out', value: `$${((cf.cashOut || 0) / 1e6).toFixed(2)}M`, status: 'bad' },
        { label: 'Billing', value: `$${((cf.billing || 0) / 1e6).toFixed(2)}M`, status: 'neutral' },
        { label: 'Cash In', value: `$${((cf.cashIn || 0) / 1e6).toFixed(2)}M`, status: 'neutral' },
      ]);
      // Cash Flow KPIs
      const balance = (cf.cashIn || 0) - (cf.cashOut || 0);
      const billingCoverage = (cf.revenue || evm.bcwp || 1) > 0 ? (cf.billing || 0) / (cf.revenue || evm.bcwp || 1) : 0;
      const cashCollection = (cf.billing || 1) > 0 ? (cf.cashIn || 0) / (cf.billing || 1) : 0;
      const cashAdequacy = (cf.cashOut || 1) > 0 ? (cf.cashIn || 0) / (cf.cashOut || 1) : 0;
      exporter.addStatsRow([
        { label: 'Balance', value: `$${(balance / 1e6).toFixed(2)}M`, status: balance >= 0 ? 'good' : 'bad' },
        { label: 'Billing Coverage', value: `${(billingCoverage * 100).toFixed(1)}%`, status: billingCoverage >= 0.9 ? 'good' : 'warning' },
        { label: 'Cash Collection', value: `${(cashCollection * 100).toFixed(1)}%`, status: cashCollection >= 0.9 ? 'good' : 'warning' },
        { label: 'Cash Adequacy', value: `${cashAdequacy.toFixed(2)}x`, status: cashAdequacy >= 1 ? 'good' : 'warning' },
      ]);
      exporter.addSpacing();
    }

    // TKDN
    const tkdn = selectedReport?.tkdn || { plan: 0, actual: 0 };
    if (tkdn.plan > 0 || tkdn.actual > 0) {
      exporter.addSectionTitle('TKDN Performance');
      const tkdnStatus = (tkdn.actual || 0) >= (tkdn.plan || 0) ? 'good' : 'bad';
      const variance = (tkdn.actual || 0) - (tkdn.plan || 0);
      exporter.addStatsRow([
        { label: 'Target', value: `${tkdn.plan || 0}%`, status: 'neutral' },
        { label: 'Actual', value: `${(tkdn.actual || 0).toFixed(1)}%`, status: tkdnStatus },
        { label: 'Variance', value: `${variance >= 0 ? '+' : ''}${variance.toFixed(1)}%`, status: tkdnStatus },
        { label: 'Status', value: (tkdn.actual || 0) >= (tkdn.plan || 0) ? 'PASS' : 'AT RISK', status: tkdnStatus },
      ]);
      exporter.addSpacing();
    }

    // EPCC Progress
    if (selectedReport?.epcc) {
      exporter.addSectionTitle('EPCC Progress');
      const epcc = selectedReport.epcc as unknown as Record<string, { plan?: number; actual?: number; weight?: number }>;
      const epccData = ['engineering', 'procurement', 'construction', 'commissioning'].map(key => {
        const data = epcc[key] || {};
        const variance = (data.actual || 0) - (data.plan || 0);
        return {
          label: key.charAt(0).toUpperCase() + key.slice(1),
          value: `${(data.actual || 0).toFixed(1)}%`,
          status: (variance >= 0 ? 'good' : variance >= -5 ? 'warning' : 'bad') as 'good' | 'warning' | 'bad'
        };
      });
      exporter.addStatsRow(epccData);
      exporter.addSpacing();
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

    // Quality
    const quality = (selectedReport?.quality || {}) as Record<string, Record<string, number>>;
    exporter.addSectionTitle('Quality Summary');
    exporter.addStatsRow([
      { label: 'Certificates', value: String(quality?.certificate?.completed || 0), status: 'good' },
      { label: 'Under Application', value: String(quality?.certificate?.underApplication || 0), status: 'warning' },
      { label: 'Not Yet Applied', value: String(quality?.certificate?.notYetApplied || 0), status: 'neutral' },
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

    // Milestones
    const msSchedule = (selectedReport?.milestonesSchedule || []) as Array<{ no?: number; description?: string; name?: string; planDate?: string; actualForecastDate?: string; status?: string }>;
    const msPayment = (selectedReport?.milestonesPayment || []) as Array<{ no?: number; description?: string; name?: string; planDate?: string; actualForecastDate?: string; status?: string }>;

    if (msSchedule.length > 0 || msPayment.length > 0) {
      exporter.addSpacing();
      exporter.addSectionTitle('Milestones');

      if (msSchedule.length > 0) {
        exporter.addText('📅 Schedule Milestones', 'normal');
        // Table header
        exporter.addStatsRow([
          { label: 'No', value: 'Description', status: 'neutral' },
          { label: 'Plan', value: 'Actual/FC', status: 'neutral' },
          { label: 'Status', value: '', status: 'neutral' },
        ]);
        // Table rows
        msSchedule.slice(0, 10).forEach((m, idx) => {
          const status = m.status === 'Completed' ? 'good' : m.status === 'Delay' || m.status === 'Delayed' || m.status === 'Critical' || m.status === 'Overdue' ? 'bad' : 'warning';
          const desc = m.description || m.name || `Milestone ${idx + 1}`;
          exporter.addStatsRow([
            { label: `${m.no || idx + 1}`, value: desc.length > 40 ? desc.substring(0, 40) + '...' : desc, status: 'neutral' },
            { label: m.planDate || '-', value: m.actualForecastDate || '-', status: 'neutral' },
            { label: m.status || '-', value: '', status: status as 'good' | 'bad' | 'warning' },
          ]);
        });
        if (msSchedule.length > 10) {
          exporter.addText(`... and ${msSchedule.length - 10} more schedule milestones`, 'small');
        }
      }

      if (msPayment.length > 0) {
        exporter.addSpacing(3);
        exporter.addText('💰 Payment Milestones', 'normal');
        // Table header
        exporter.addStatsRow([
          { label: 'No', value: 'Description', status: 'neutral' },
          { label: 'Plan', value: 'Actual/FC', status: 'neutral' },
          { label: 'Status', value: '', status: 'neutral' },
        ]);
        // Table rows
        msPayment.slice(0, 10).forEach((m, idx) => {
          const status = m.status === 'Completed' ? 'good' : m.status === 'Delay' || m.status === 'Delayed' || m.status === 'Critical' || m.status === 'Overdue' ? 'bad' : 'warning';
          const desc = m.description || m.name || `Payment ${idx + 1}`;
          exporter.addStatsRow([
            { label: `${m.no || idx + 1}`, value: desc.length > 40 ? desc.substring(0, 40) + '...' : desc, status: 'neutral' },
            { label: m.planDate || '-', value: m.actualForecastDate || '-', status: 'neutral' },
            { label: m.status || '-', value: '', status: status as 'good' | 'bad' | 'warning' },
          ]);
        });
        if (msPayment.length > 10) {
          exporter.addText(`... and ${msPayment.length - 10} more payment milestones`, 'small');
        }
      }
    }

    // Activities
    const thisWeek = (selectedReport?.thisWeekActivities || {}) as Record<string, string[]>;
    const nextWeek = (selectedReport?.nextWeekPlan || {}) as Record<string, string[]>;

    if (Object.keys(thisWeek).length > 0 || Object.keys(nextWeek).length > 0) {
      exporter.addSpacing();
      exporter.addSectionTitle('Activities');

      if (Object.keys(thisWeek).length > 0) {
        exporter.addText('This Week Activities:', 'normal');
        Object.entries(thisWeek).forEach(([cat, items]) => {
          if (Array.isArray(items) && items.length > 0) {
            exporter.addText(`${cat.charAt(0).toUpperCase() + cat.slice(1)}: ${items.slice(0, 3).join('; ')}${items.length > 3 ? '...' : ''}`, 'small');
          }
        });
      }

      if (Object.keys(nextWeek).length > 0) {
        exporter.addSpacing(3);
        exporter.addText('Next Week Plan:', 'normal');
        Object.entries(nextWeek).forEach(([cat, items]) => {
          if (Array.isArray(items) && items.length > 0) {
            exporter.addText(`${cat.charAt(0).toUpperCase() + cat.slice(1)}: ${items.slice(0, 3).join('; ')}${items.length > 3 ? '...' : ''}`, 'small');
          }
        });
      }
    }

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
      {selectedProject && (() => {
        // Calculate duration in days
        const scheduleDuration = selectedProject.startDate && selectedProject.finishDate
          ? Math.ceil((new Date(selectedProject.finishDate).getTime() - new Date(selectedProject.startDate).getTime()) / (1000 * 60 * 60 * 24))
          : 0;

        return (
          <div className="rounded-2xl bg-gradient-to-br from-teal-50 to-cyan-50 border-2 border-teal-200 p-4">
            <h3 className="text-sm font-bold text-teal-700 mb-3">📋 Project Information</h3>

            {/* Row 1: Owner, Contractor, Contract Type, Term of Payment */}
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 mb-2">
              <div className="rounded-lg bg-white p-3">
                <p className="text-[10px] text-slate-500">Owner</p>
                <p className="text-xs font-semibold">{selectedProject.owner || '-'}</p>
              </div>
              <div className="rounded-lg bg-white p-3">
                <p className="text-[10px] text-slate-500">Contractor</p>
                <p className="text-xs font-semibold">{selectedProject.contractor || '-'}</p>
              </div>
              <div className="rounded-lg bg-white p-3">
                <p className="text-[10px] text-slate-500">Contract Type</p>
                <p className="text-xs font-semibold">{selectedProject.contractType || '-'}</p>
              </div>
              <div className="rounded-lg bg-white p-3">
                <p className="text-[10px] text-slate-500">Term of Payment</p>
                <p className="text-xs font-semibold">{(selectedProject as unknown as { termOfPayment?: string }).termOfPayment || 'NET 30'}</p>
              </div>
            </div>

            {/* Row 2: Contract Price, Start Date, Finish Date, Duration, Guaranteed Power */}
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-5 mb-2">
              <div className="rounded-lg bg-white p-3">
                <p className="text-[10px] text-slate-500">Contract Price</p>
                <p className="text-sm font-bold text-teal-600">${((selectedProject.contractPrice || 0) / 1e6).toFixed(2)}M</p>
              </div>
              <div className="rounded-lg bg-white p-3">
                <p className="text-[10px] text-slate-500">Start Date</p>
                <p className="text-xs font-semibold">{selectedProject.startDate || '-'}</p>
              </div>
              <div className="rounded-lg bg-white p-3">
                <p className="text-[10px] text-slate-500">Finish Date</p>
                <p className="text-xs font-semibold">{selectedProject.finishDate || '-'}</p>
              </div>
              <div className="rounded-lg bg-white p-3">
                <p className="text-[10px] text-slate-500">Duration</p>
                <p className="text-xs font-semibold">{scheduleDuration} days</p>
              </div>
              <div className="rounded-lg bg-white p-3">
                <p className="text-[10px] text-slate-500">Guaranteed Power</p>
                <p className="text-sm font-bold text-blue-600">{(selectedProject as unknown as { guaranteedPower?: number }).guaranteedPower || 0} MW</p>
              </div>
            </div>

            {/* Row 3: LD Delay Rate, LD Performance Rate, Scope by Owner */}
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              <div className="rounded-lg bg-white p-3">
                <p className="text-[10px] text-slate-500">LD Delay Rate</p>
                <p className="text-xs font-semibold">${((selectedProject as unknown as { ldDelay?: number }).ldDelay || 0).toLocaleString()}/day</p>
              </div>
              <div className="rounded-lg bg-white p-3">
                <p className="text-[10px] text-slate-500">LD Performance Rate</p>
                <p className="text-xs font-semibold">${((selectedProject as unknown as { ldPerformance?: number }).ldPerformance || 0).toLocaleString()}/kW</p>
              </div>
              <div className="rounded-lg bg-white p-3">
                <p className="text-[10px] text-slate-500">Scope by Owner</p>
                <p className="text-xs font-semibold">{(selectedProject as unknown as { scopeByOwner?: string }).scopeByOwner || '-'}</p>
              </div>
            </div>
          </div>
        );
      })()}


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
        {(() => {
          // Calculate EAC properly: use stored value (eac or eacTypical) or calculate from BAC/CPI
          const evmData = evm as { eac?: number; eacTypical?: number };
          const storedEac = evmData.eac || evmData.eacTypical;
          const calculatedEac = evm.cpiValue > 0 ? evm.bac / evm.cpiValue : evm.bac;
          const eacValue = storedEac && storedEac > 0 ? storedEac : calculatedEac;
          const vacValue = evm.bac - eacValue;
          return (
            <div className={`rounded-2xl p-4 shadow-sm ${vacValue >= 0 ? 'bg-green-50' : 'bg-red-50'}`}>
              <p className="text-xs font-semibold text-slate-500">📉 EAC (Typical)</p>
              <p className="mt-2 text-2xl font-extrabold text-slate-700">
                ${(eacValue / 1e6).toFixed(2)}M
              </p>
              <p className={`mt-1 text-[10px] ${vacValue >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                VAC: {vacValue >= 0 ? '+' : ''}${(vacValue / 1e6).toFixed(2)}M
              </p>
            </div>
          );
        })()}

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

        {/* Cash Flow Status - Use same real-time calculation as Dashboard */}
        {(() => {
          const cf = (selectedReport?.cashFlow || {}) as { cashIn?: number; cashOut?: number; billing?: number; revenue?: number };
          const cashIn = cf.cashIn || 0;
          const cashOut = cf.cashOut || 0;
          const billing = cf.billing || 0;
          const revenue = cf.revenue || evm.bcwp || 1;

          // Calculate ratios for overall score (same as Dashboard)
          const balanceOk = cashIn >= cashOut ? 1 : 0;
          const billingCoverage = revenue > 0 ? billing / revenue : 0;
          const billingOk = billingCoverage >= 0.95 ? 1 : billingCoverage >= 0.85 ? 0.5 : 0;
          const collectionRatio = billing > 0 ? cashIn / billing : 0;
          const collectionOk = collectionRatio >= 0.9 ? 1 : collectionRatio >= 0.8 ? 0.5 : 0;
          const adequacyRatio = cashOut > 0 ? cashIn / cashOut : 0;
          const adequacyOk = adequacyRatio >= 1.0 ? 1 : adequacyRatio >= 0.9 ? 0.5 : 0;

          const overallScore = (balanceOk + billingOk + collectionOk + adequacyOk) / 4;
          const overallStatus = overallScore >= 0.75 ? 'green' : overallScore >= 0.5 ? 'yellow' : 'red';

          return (
            <div className={`rounded-2xl p-4 shadow-sm ${overallStatus === 'green' ? 'bg-green-50' :
              overallStatus === 'yellow' ? 'bg-amber-50' : 'bg-red-50'
              }`}>
              <p className="text-xs font-semibold text-slate-500">💵 Cash Flow</p>
              <p className="mt-2 text-lg font-extrabold">
                {overallStatus === 'green' ? '🟢 Healthy' :
                  overallStatus === 'yellow' ? '🟡 At Risk' : '🔴 Critical'}
              </p>
              <p className="mt-1 text-[10px] text-slate-400">
                Score: {(overallScore * 100).toFixed(0)}%
              </p>
            </div>
          );
        })()}
      </div>


      {/* Schedule & LD Estimation Section */}
      {selectedProject && (() => {
        const daysRemaining = selectedProject.finishDate ?
          Math.ceil((new Date(selectedProject.finishDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) : 0;
        const adjustedDays = evm.spiValue > 0 ? Math.ceil(daysRemaining / evm.spiValue) : daysRemaining;
        const delayDays = Math.max(0, adjustedDays - daysRemaining);
        const estDate = new Date();
        estDate.setDate(estDate.getDate() + adjustedDays);
        const estimatedCompletion = estDate.toISOString().split('T')[0];

        const actualForecastPower = selectedReport?.actualForecastPower || 0;
        const guaranteedPower = (selectedProject as unknown as { guaranteedPower?: number }).guaranteedPower || 0;
        const powerShortfall = Math.max(0, guaranteedPower - actualForecastPower);

        const ldDelayRate = (selectedProject as unknown as { ldDelay?: number }).ldDelay || 0;
        const ldPerformanceRate = (selectedProject as unknown as { ldPerformance?: number }).ldPerformance || 0;
        const ldDelay = delayDays * ldDelayRate;
        const ldPerformance = powerShortfall * 1000 * ldPerformanceRate; // kW * $/kW
        const totalLD = ldDelay + ldPerformance;

        return (
          <div className={`rounded-2xl p-5 shadow-sm ${totalLD > 0 ? 'bg-gradient-to-br from-red-50 to-red-100' : 'bg-gradient-to-br from-green-50 to-green-100'}`}>
            <h3 className={`mb-4 text-sm font-bold ${totalLD > 0 ? 'text-red-700' : 'text-green-700'}`}>⏱️ Schedule & LD Estimation</h3>

            {/* First Row */}
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4 mb-3">
              <div className="rounded-xl bg-white p-3 text-center">
                <p className="text-[10px] text-slate-500">Planned Finish</p>
                <p className="text-sm font-bold">{selectedProject.finishDate || '-'}</p>
              </div>
              <div className="rounded-xl bg-white p-3 text-center">
                <p className="text-[10px] text-slate-500">Estimated Completion</p>
                <p className={`text-sm font-bold ${delayDays > 0 ? 'text-red-600' : 'text-green-600'}`}>{estimatedCompletion}</p>
              </div>
              <div className={`rounded-xl p-3 text-center ${delayDays <= 0 ? 'bg-green-100' : 'bg-red-100'}`}>
                <p className="text-[10px] text-slate-500">Delay Days</p>
                <p className={`text-xl font-extrabold ${delayDays <= 0 ? 'text-green-600' : 'text-red-600'}`}>{delayDays} days</p>
              </div>
              <div className="rounded-xl bg-white p-3 text-center">
                <p className="text-[10px] text-slate-500">Actual/FC Power</p>
                <p className={`text-sm font-bold ${actualForecastPower < guaranteedPower ? 'text-red-600' : 'text-green-600'}`}>{actualForecastPower} MW</p>
              </div>
            </div>

            {/* Second Row - LD Estimations */}
            <div className="grid gap-3 md:grid-cols-3">
              <div className={`rounded-xl p-3 text-center ${ldDelay > 0 ? 'bg-red-100' : 'bg-green-100'}`}>
                <p className="text-[10px] text-slate-500">LD Delay Estimation</p>
                <p className={`text-lg font-extrabold ${ldDelay > 0 ? 'text-red-600' : 'text-green-600'}`}>${ldDelay.toLocaleString()}</p>
                <p className="text-[9px] text-slate-400">{delayDays} days × ${ldDelayRate.toLocaleString()}/day</p>
              </div>
              <div className={`rounded-xl p-3 text-center ${ldPerformance > 0 ? 'bg-red-100' : 'bg-green-100'}`}>
                <p className="text-[10px] text-slate-500">LD Performance Estimation</p>
                <p className={`text-lg font-extrabold ${ldPerformance > 0 ? 'text-red-600' : 'text-green-600'}`}>${ldPerformance.toLocaleString()}</p>
                <p className="text-[9px] text-slate-400">{powerShortfall.toFixed(1)} MW shortfall</p>
              </div>
              <div className={`rounded-xl p-3 text-center ${totalLD > 0 ? 'bg-red-600' : 'bg-green-600'}`}>
                <p className="text-[10px] text-white/80">Total LD Estimation</p>
                <p className="text-xl font-extrabold text-white">${totalLD.toLocaleString()}</p>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Cash Flow Dashboard - 8 KPIs */}
      {selectedReport?.cashFlow && (
        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
            <h3 className="text-sm font-bold">💵 Cash Flow Performance Dashboard</h3>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">Overall Status:</span>
              {(() => {
                const cf = selectedReport.cashFlow;
                const cashIn = cf.cashIn || 0;
                const cashOut = cf.cashOut || 0;
                const billing = cf.billing || 0;
                const revenue = cf.revenue || evm.bcwp || 1;

                // Calculate ratios for overall score
                const balanceOk = cashIn >= cashOut ? 1 : 0;
                const billingCoverage = revenue > 0 ? billing / revenue : 0;
                const billingOk = billingCoverage >= 0.95 ? 1 : billingCoverage >= 0.85 ? 0.5 : 0;
                const collectionRatio = billing > 0 ? cashIn / billing : 0;
                const collectionOk = collectionRatio >= 0.9 ? 1 : collectionRatio >= 0.8 ? 0.5 : 0;
                const adequacyRatio = cashOut > 0 ? cashIn / cashOut : 0;
                const adequacyOk = adequacyRatio >= 1.0 ? 1 : adequacyRatio >= 0.9 ? 0.5 : 0;

                const overallScore = (balanceOk + billingOk + collectionOk + adequacyOk) / 4;
                const overallStatus = overallScore >= 0.75 ? 'green' : overallScore >= 0.5 ? 'yellow' : 'red';

                return (
                  <>
                    <span className="text-sm font-bold">
                      {overallStatus === 'green' ? '🟢 Healthy' : overallStatus === 'yellow' ? '🟡 At Risk' : '🔴 Critical'}
                    </span>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${overallStatus === 'green' ? 'bg-green-100 text-green-600' :
                      overallStatus === 'yellow' ? 'bg-amber-100 text-amber-600' : 'bg-red-100 text-red-600'
                      }`}>
                      {(overallScore * 100).toFixed(0)}%
                    </span>
                  </>
                );
              })()}
            </div>
          </div>
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

          {/* Visual Row: Cash Flow Chart, Primary Summary, QR Codes */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            {/* Cash Flow Chart Visual */}
            <div className="rounded-xl bg-slate-50 p-4">
              <h4 className="text-xs font-semibold text-slate-600 mb-3">Cash Flow Chart</h4>
              {selectedReport.uploads?.cashFlow ? (
                <img
                  src={selectedReport.uploads.cashFlow.data}
                  alt="Cash Flow"
                  className="w-full h-24 object-contain rounded-lg cursor-pointer hover:opacity-80 transition-opacity"
                  onClick={() => openImageViewer(selectedReport.uploads!.cashFlow!.data, 'Cash Flow Chart')}
                  title="Click to enlarge"
                />
              ) : (
                <div className="space-y-2">
                  {[
                    { label: 'Revenue', value: selectedReport.cashFlow.revenue || evm.bcwp || 0, color: 'bg-green-500', max: Math.max(selectedReport.cashFlow.revenue || 0, selectedReport.cashFlow.cashOut || 0, selectedReport.cashFlow.billing || 0, selectedReport.cashFlow.cashIn || 0) || 1 },
                    { label: 'Cash Out', value: selectedReport.cashFlow.cashOut || 0, color: 'bg-red-500', max: Math.max(selectedReport.cashFlow.revenue || 0, selectedReport.cashFlow.cashOut || 0, selectedReport.cashFlow.billing || 0, selectedReport.cashFlow.cashIn || 0) || 1 },
                    { label: 'Billing', value: selectedReport.cashFlow.billing || 0, color: 'bg-blue-500', max: Math.max(selectedReport.cashFlow.revenue || 0, selectedReport.cashFlow.cashOut || 0, selectedReport.cashFlow.billing || 0, selectedReport.cashFlow.cashIn || 0) || 1 },
                    { label: 'Cash In', value: selectedReport.cashFlow.cashIn || 0, color: 'bg-purple-500', max: Math.max(selectedReport.cashFlow.revenue || 0, selectedReport.cashFlow.cashOut || 0, selectedReport.cashFlow.billing || 0, selectedReport.cashFlow.cashIn || 0) || 1 },
                  ].map(({ label, value, color, max }) => (
                    <div key={label} className="flex items-center gap-2">
                      <span className="text-[10px] w-14 text-slate-500">{label}</span>
                      <div className="flex-1 h-4 bg-slate-200 rounded overflow-hidden">
                        <div className={`h-full ${color} rounded`} style={{ width: `${(value / max) * 100}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Primary Summary */}
            <div className="rounded-xl bg-slate-50 p-4">
              <h4 className="text-xs font-semibold text-slate-600 mb-3">Primary Input</h4>
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs"><span>Revenue (BCWP)</span><strong className="text-green-600">${((selectedReport.cashFlow.revenue || evm.bcwp || 0) / 1e6).toFixed(2)}M</strong></div>
                <div className="flex justify-between text-xs"><span>Cash Out</span><strong className="text-red-600">${((selectedReport.cashFlow.cashOut || 0) / 1e6).toFixed(2)}M</strong></div>
                <div className="flex justify-between text-xs"><span>Billing</span><strong className="text-blue-600">${((selectedReport.cashFlow.billing || 0) / 1e6).toFixed(2)}M</strong></div>
                <div className="flex justify-between text-xs"><span>Cash In</span><strong className="text-purple-600">${((selectedReport.cashFlow.cashIn || 0) / 1e6).toFixed(2)}M</strong></div>
              </div>
            </div>

            {/* QR Codes */}
            <div className="rounded-xl bg-slate-50 p-4">
              <h4 className="text-xs font-semibold text-slate-600 mb-3">📱 QR Codes</h4>
              <div className="flex justify-around">
                {[
                  { key: 'qrPhotos', label: 'Photos', color: 'border-blue-500', textColor: 'text-blue-500' },
                  { key: 'qrVideos', label: 'Videos', color: 'border-purple-500', textColor: 'text-purple-500' },
                  { key: 'qrReport', label: 'Report', color: 'border-teal-500', textColor: 'text-teal-500' },
                ].map(qr => (
                  <div key={qr.key} className="text-center">
                    {selectedReport.uploads?.[qr.key as keyof typeof selectedReport.uploads] ? (
                      <img
                        src={(selectedReport.uploads[qr.key as keyof typeof selectedReport.uploads] as { data: string })?.data}
                        alt={qr.label}
                        className={`w-12 h-12 object-cover rounded border-2 ${qr.color} cursor-pointer hover:opacity-80 transition-opacity`}
                        onClick={() => openImageViewer(
                          (selectedReport.uploads![qr.key as keyof typeof selectedReport.uploads] as { data: string })?.data,
                          `QR Code - ${qr.label}`
                        )}
                        title="Click to enlarge"
                      />
                    ) : (
                      <div className={`w-12 h-12 bg-slate-200 rounded border-2 ${qr.color} flex items-center justify-center text-lg`}>📷</div>
                    )}
                    <p className={`text-[8px] font-semibold mt-1 ${qr.textColor}`}>{qr.label}</p>
                  </div>
                ))}
              </div>
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
          {selectedReport?.uploads?.sCurveGeneral ? (
            <img
              src={(selectedReport.uploads.sCurveGeneral as { data: string }).data}
              alt="S-Curve"
              className="w-full h-48 object-contain rounded-lg bg-slate-50 cursor-pointer hover:opacity-90 transition-opacity"
              onClick={() => openImageViewer(
                (selectedReport.uploads!.sCurveGeneral as { data: string }).data,
                'S-Curve Progress'
              )}
              title="Click to enlarge"
            />
          ) : sCurveData.length > 0 ? (
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

      {/* Cash Flow Details Section - COMMENTED OUT
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
      */}

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
      {selectedReport?.quality && (() => {
        const q = selectedReport.quality as unknown as {
          headOffice?: { afi?: Record<string, { fail?: number; ongoing?: number; pass?: number }>; ncr?: { ownerToContractor?: Record<string, { open?: number; closed?: number }>; contractorToVendor?: Record<string, { open?: number; closed?: number }> }; punchList?: { ownerToContractor?: Record<string, { open?: number; closed?: number }>; contractorToVendor?: Record<string, { open?: number; closed?: number }> } };
          siteOffice?: { afi?: Record<string, { fail?: number; ongoing?: number; pass?: number }>; ncr?: { ownerToContractor?: Record<string, { open?: number; closed?: number }>; contractorToVendor?: Record<string, { open?: number; closed?: number }> }; punchList?: { ownerToContractor?: Record<string, { open?: number; closed?: number }>; contractorToVendor?: Record<string, { open?: number; closed?: number }> }; welding?: { ndtAccepted?: number; ndtRejected?: number; rejectionRatePlan?: number } };
          certificate?: { completed?: number; underApplication?: number; notYetApplied?: number };
        };
        const disciplines = ['process', 'mechanical', 'piping', 'electrical', 'instrument', 'civil'];

        // Calculate AFI totals
        let hoAfiPass = 0, hoAfiTotal = 0, soAfiPass = 0, soAfiTotal = 0;
        let hoNcrOpen = 0, hoNcrClosed = 0, soNcrOpen = 0, soNcrClosed = 0;
        let hoPunchOpen = 0, hoPunchClosed = 0, soPunchOpen = 0, soPunchClosed = 0;

        disciplines.forEach(d => {
          const hoAfi = q?.headOffice?.afi?.[d] || {};
          hoAfiTotal += (hoAfi.fail || 0) + (hoAfi.ongoing || 0) + (hoAfi.pass || 0);
          hoAfiPass += (hoAfi.pass || 0);

          const soAfi = q?.siteOffice?.afi?.[d] || {};
          soAfiTotal += (soAfi.fail || 0) + (soAfi.ongoing || 0) + (soAfi.pass || 0);
          soAfiPass += (soAfi.pass || 0);

          ['ownerToContractor', 'contractorToVendor'].forEach(src => {
            const hoNcr = q?.headOffice?.ncr?.[src as 'ownerToContractor' | 'contractorToVendor']?.[d] || {};
            hoNcrOpen += hoNcr.open || 0;
            hoNcrClosed += hoNcr.closed || 0;

            const soNcr = q?.siteOffice?.ncr?.[src as 'ownerToContractor' | 'contractorToVendor']?.[d] || {};
            soNcrOpen += soNcr.open || 0;
            soNcrClosed += soNcr.closed || 0;

            const hoPunch = q?.headOffice?.punchList?.[src as 'ownerToContractor' | 'contractorToVendor']?.[d] || {};
            hoPunchOpen += hoPunch.open || 0;
            hoPunchClosed += hoPunch.closed || 0;

            const soPunch = q?.siteOffice?.punchList?.[src as 'ownerToContractor' | 'contractorToVendor']?.[d] || {};
            soPunchOpen += soPunch.open || 0;
            soPunchClosed += soPunch.closed || 0;
          });
        });

        const welding = q?.siteOffice?.welding;
        const ndtTotal = (welding?.ndtAccepted || 0) + (welding?.ndtRejected || 0);
        const rejRate = ndtTotal > 0 ? ((welding?.ndtRejected || 0) / ndtTotal) * 100 : 0;
        const weldPlan = welding?.rejectionRatePlan || 2;
        const weldStatus = rejRate <= weldPlan ? 'Pass' : rejRate <= weldPlan * 1.5 ? 'Warning' : 'Fail';

        const cert = q?.certificate;
        const certTotal = (cert?.completed || 0) + (cert?.underApplication || 0) + (cert?.notYetApplied || 0);

        // Prepare discipline-level data for tables
        const disciplineData = disciplines.map(d => {
          const hoAfi = q?.headOffice?.afi?.[d] || { fail: 0, ongoing: 0, pass: 0 };
          const soAfi = q?.siteOffice?.afi?.[d] || { fail: 0, ongoing: 0, pass: 0 };

          const hoNcrO2C = q?.headOffice?.ncr?.ownerToContractor?.[d] || { open: 0, closed: 0 };
          const hoNcrC2V = q?.headOffice?.ncr?.contractorToVendor?.[d] || { open: 0, closed: 0 };
          const soNcrO2C = q?.siteOffice?.ncr?.ownerToContractor?.[d] || { open: 0, closed: 0 };
          const soNcrC2V = q?.siteOffice?.ncr?.contractorToVendor?.[d] || { open: 0, closed: 0 };

          const hoPunchO2C = q?.headOffice?.punchList?.ownerToContractor?.[d] || { open: 0, closed: 0 };
          const hoPunchC2V = q?.headOffice?.punchList?.contractorToVendor?.[d] || { open: 0, closed: 0 };
          const soPunchO2C = q?.siteOffice?.punchList?.ownerToContractor?.[d] || { open: 0, closed: 0 };
          const soPunchC2V = q?.siteOffice?.punchList?.contractorToVendor?.[d] || { open: 0, closed: 0 };

          return {
            discipline: d,
            hoAfi: { fail: hoAfi.fail || 0, ongoing: hoAfi.ongoing || 0, pass: hoAfi.pass || 0 },
            soAfi: { fail: soAfi.fail || 0, ongoing: soAfi.ongoing || 0, pass: soAfi.pass || 0 },
            hoNcr: { open: (hoNcrO2C.open || 0) + (hoNcrC2V.open || 0), closed: (hoNcrO2C.closed || 0) + (hoNcrC2V.closed || 0) },
            soNcr: { open: (soNcrO2C.open || 0) + (soNcrC2V.open || 0), closed: (soNcrO2C.closed || 0) + (soNcrC2V.closed || 0) },
            hoPunch: { open: (hoPunchO2C.open || 0) + (hoPunchC2V.open || 0), closed: (hoPunchO2C.closed || 0) + (hoPunchC2V.closed || 0) },
            soPunch: { open: (soPunchO2C.open || 0) + (soPunchC2V.open || 0), closed: (soPunchO2C.closed || 0) + (soPunchC2V.closed || 0) },
          };
        });

        return (
          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <h3 className="mb-4 text-sm font-bold">🔍 Quality Performance Dashboard</h3>

            {/* AFI Status by Discipline */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
              {/* Head Office AFI */}
              <div className="rounded-xl bg-teal-50 p-4">
                <p className="text-xs font-semibold text-teal-700 mb-3">🏢 Head Office - AFI Status</p>
                <div className="space-y-2">
                  {disciplineData.map(d => {
                    const total = d.hoAfi.fail + d.hoAfi.ongoing + d.hoAfi.pass;
                    return total > 0 && (
                      <div key={d.discipline} className="flex items-center gap-2">
                        <span className="text-[10px] w-20 capitalize text-slate-600">{d.discipline}</span>
                        <div className="flex-1 h-4 bg-slate-200 rounded-full overflow-hidden flex">
                          {d.hoAfi.pass > 0 && <div className="bg-green-500" style={{ width: `${(d.hoAfi.pass / total) * 100}%` }} />}
                          {d.hoAfi.ongoing > 0 && <div className="bg-amber-500" style={{ width: `${(d.hoAfi.ongoing / total) * 100}%` }} />}
                          {d.hoAfi.fail > 0 && <div className="bg-red-500" style={{ width: `${(d.hoAfi.fail / total) * 100}%` }} />}
                        </div>
                        <span className="text-[10px] w-16 text-right">{d.hoAfi.pass}/{total}</span>
                      </div>
                    );
                  })}
                </div>
                <div className="flex justify-center gap-4 mt-3 text-[9px]">
                  <span className="flex items-center gap-1"><span className="w-2 h-2 bg-green-500 rounded-full"></span> Pass</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 bg-amber-500 rounded-full"></span> Ongoing</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 bg-red-500 rounded-full"></span> Fail</span>
                </div>
              </div>

              {/* Site Office AFI */}
              <div className="rounded-xl bg-purple-50 p-4">
                <p className="text-xs font-semibold text-purple-700 mb-3">🏗️ Site Office - AFI Status</p>
                <div className="space-y-2">
                  {disciplineData.map(d => {
                    const total = d.soAfi.fail + d.soAfi.ongoing + d.soAfi.pass;
                    return total > 0 && (
                      <div key={d.discipline} className="flex items-center gap-2">
                        <span className="text-[10px] w-20 capitalize text-slate-600">{d.discipline}</span>
                        <div className="flex-1 h-4 bg-slate-200 rounded-full overflow-hidden flex">
                          {d.soAfi.pass > 0 && <div className="bg-green-500" style={{ width: `${(d.soAfi.pass / total) * 100}%` }} />}
                          {d.soAfi.ongoing > 0 && <div className="bg-amber-500" style={{ width: `${(d.soAfi.ongoing / total) * 100}%` }} />}
                          {d.soAfi.fail > 0 && <div className="bg-red-500" style={{ width: `${(d.soAfi.fail / total) * 100}%` }} />}
                        </div>
                        <span className="text-[10px] w-16 text-right">{d.soAfi.pass}/{total}</span>
                      </div>
                    );
                  })}
                </div>
                <div className="flex justify-center gap-4 mt-3 text-[9px]">
                  <span className="flex items-center gap-1"><span className="w-2 h-2 bg-green-500 rounded-full"></span> Pass</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 bg-amber-500 rounded-full"></span> Ongoing</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 bg-red-500 rounded-full"></span> Fail</span>
                </div>
              </div>
            </div>

            {/* NCR & Punch by Discipline */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
              {/* Head Office NCR & Punch */}
              <div className="rounded-xl bg-slate-50 p-4">
                <p className="text-xs font-semibold text-slate-700 mb-3">🏢 Head Office - NCR & Punch List</p>
                <table className="w-full text-[10px]">
                  <thead>
                    <tr className="bg-slate-200">
                      <th className="p-1.5 text-left">Discipline</th>
                      <th className="p-1.5 text-center" colSpan={2}>NCR</th>
                      <th className="p-1.5 text-center" colSpan={2}>Punch</th>
                    </tr>
                    <tr className="bg-slate-100">
                      <th></th>
                      <th className="p-1 text-center text-red-600">Open</th>
                      <th className="p-1 text-center text-green-600">Closed</th>
                      <th className="p-1 text-center text-amber-600">Open</th>
                      <th className="p-1 text-center text-green-600">Closed</th>
                    </tr>
                  </thead>
                  <tbody>
                    {disciplineData.map(d => (
                      <tr key={d.discipline} className="border-b border-slate-200">
                        <td className="p-1.5 capitalize font-medium">{d.discipline}</td>
                        <td className={`p-1.5 text-center ${d.hoNcr.open > 0 ? 'bg-red-50 text-red-600 font-bold' : ''}`}>{d.hoNcr.open}</td>
                        <td className="p-1.5 text-center text-green-600">{d.hoNcr.closed}</td>
                        <td className={`p-1.5 text-center ${d.hoPunch.open > 0 ? 'bg-amber-50 text-amber-600 font-bold' : ''}`}>{d.hoPunch.open}</td>
                        <td className="p-1.5 text-center text-green-600">{d.hoPunch.closed}</td>
                      </tr>
                    ))}
                    <tr className="bg-slate-100 font-bold">
                      <td className="p-1.5">Total</td>
                      <td className="p-1.5 text-center text-red-600">{hoNcrOpen}</td>
                      <td className="p-1.5 text-center text-green-600">{hoNcrClosed}</td>
                      <td className="p-1.5 text-center text-amber-600">{hoPunchOpen}</td>
                      <td className="p-1.5 text-center text-green-600">{hoPunchClosed}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Site Office NCR & Punch */}
              <div className="rounded-xl bg-slate-50 p-4">
                <p className="text-xs font-semibold text-slate-700 mb-3">🏗️ Site Office - NCR & Punch List</p>
                <table className="w-full text-[10px]">
                  <thead>
                    <tr className="bg-slate-200">
                      <th className="p-1.5 text-left">Discipline</th>
                      <th className="p-1.5 text-center" colSpan={2}>NCR</th>
                      <th className="p-1.5 text-center" colSpan={2}>Punch</th>
                    </tr>
                    <tr className="bg-slate-100">
                      <th></th>
                      <th className="p-1 text-center text-red-600">Open</th>
                      <th className="p-1 text-center text-green-600">Closed</th>
                      <th className="p-1 text-center text-amber-600">Open</th>
                      <th className="p-1 text-center text-green-600">Closed</th>
                    </tr>
                  </thead>
                  <tbody>
                    {disciplineData.map(d => (
                      <tr key={d.discipline} className="border-b border-slate-200">
                        <td className="p-1.5 capitalize font-medium">{d.discipline}</td>
                        <td className={`p-1.5 text-center ${d.soNcr.open > 0 ? 'bg-red-50 text-red-600 font-bold' : ''}`}>{d.soNcr.open}</td>
                        <td className="p-1.5 text-center text-green-600">{d.soNcr.closed}</td>
                        <td className={`p-1.5 text-center ${d.soPunch.open > 0 ? 'bg-amber-50 text-amber-600 font-bold' : ''}`}>{d.soPunch.open}</td>
                        <td className="p-1.5 text-center text-green-600">{d.soPunch.closed}</td>
                      </tr>
                    ))}
                    <tr className="bg-slate-100 font-bold">
                      <td className="p-1.5">Total</td>
                      <td className="p-1.5 text-center text-red-600">{soNcrOpen}</td>
                      <td className="p-1.5 text-center text-green-600">{soNcrClosed}</td>
                      <td className="p-1.5 text-center text-amber-600">{soPunchOpen}</td>
                      <td className="p-1.5 text-center text-green-600">{soPunchClosed}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Summary Row: NCR/Punch Totals + Welding + Certificate */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
              {/* HO NCR */}
              <div className="rounded-lg bg-red-50 p-3 text-center">
                <p className="text-[10px] text-slate-500">HO NCR</p>
                <p className="text-lg font-bold text-red-600">{hoNcrOpen} <span className="text-xs text-green-600">/ {hoNcrClosed}</span></p>
                <p className="text-[9px] text-slate-400">Open / Closed</p>
              </div>
              {/* HO Punch */}
              <div className="rounded-lg bg-amber-50 p-3 text-center">
                <p className="text-[10px] text-slate-500">HO Punch</p>
                <p className="text-lg font-bold text-amber-600">{hoPunchOpen} <span className="text-xs text-green-600">/ {hoPunchClosed}</span></p>
                <p className="text-[9px] text-slate-400">Open / Closed</p>
              </div>
              {/* Site NCR */}
              <div className="rounded-lg bg-red-50 p-3 text-center">
                <p className="text-[10px] text-slate-500">Site NCR</p>
                <p className="text-lg font-bold text-red-600">{soNcrOpen} <span className="text-xs text-green-600">/ {soNcrClosed}</span></p>
                <p className="text-[9px] text-slate-400">Open / Closed</p>
              </div>
              {/* Site Punch */}
              <div className="rounded-lg bg-amber-50 p-3 text-center">
                <p className="text-[10px] text-slate-500">Site Punch</p>
                <p className="text-lg font-bold text-amber-600">{soPunchOpen} <span className="text-xs text-green-600">/ {soPunchClosed}</span></p>
                <p className="text-[9px] text-slate-400">Open / Closed</p>
              </div>
              {/* Welding Gauge */}
              <div className={`rounded-lg p-3 text-center ${weldStatus === 'Pass' ? 'bg-green-50 border-2 border-green-400' : weldStatus === 'Warning' ? 'bg-amber-50 border-2 border-amber-400' : 'bg-red-50 border-2 border-red-400'}`}>
                <p className="text-[10px] text-slate-500">🔧 Welding</p>
                <p className={`text-lg font-bold ${weldStatus === 'Pass' ? 'text-green-600' : weldStatus === 'Warning' ? 'text-amber-600' : 'text-red-600'}`}>
                  {weldStatus === 'Pass' ? '✅' : weldStatus === 'Warning' ? '⚠️' : '❌'} {rejRate.toFixed(1)}%
                </p>
                <p className="text-[9px] text-slate-400">Target: ≤{weldPlan}%</p>
              </div>
            </div>

            {/* Certificate Status */}
            <div className="rounded-xl bg-purple-50 border-2 border-purple-400 p-4">
              <p className="text-xs font-semibold text-purple-700 mb-2">📜 Certificate Status</p>
              <div className="grid grid-cols-3 gap-2 text-center text-xs mb-2">
                <div className="rounded-lg bg-green-100 p-2">
                  <p className="text-green-600 font-bold text-lg">{cert?.completed || 0}</p>
                  <p className="text-[10px]">Completed</p>
                </div>
                <div className="rounded-lg bg-amber-100 p-2">
                  <p className="text-amber-600 font-bold text-lg">{cert?.underApplication || 0}</p>
                  <p className="text-[10px]">Under App.</p>
                </div>
                <div className="rounded-lg bg-slate-100 p-2">
                  <p className="text-slate-600 font-bold text-lg">{cert?.notYetApplied || 0}</p>
                  <p className="text-[10px]">Not Yet</p>
                </div>
              </div>
              {certTotal > 0 && (
                <div className="h-3 bg-slate-200 rounded-full overflow-hidden flex">
                  {(cert?.completed || 0) > 0 && <div className="bg-green-500" style={{ width: `${((cert?.completed || 0) / certTotal) * 100}%` }} />}
                  {(cert?.underApplication || 0) > 0 && <div className="bg-amber-500" style={{ width: `${((cert?.underApplication || 0) / certTotal) * 100}%` }} />}
                  {(cert?.notYetApplied || 0) > 0 && <div className="bg-slate-400" style={{ width: `${((cert?.notYetApplied || 0) / certTotal) * 100}%` }} />}
                </div>
              )}
            </div>
          </div>
        );
      })()}


      {/* Milestones Section - Detailed Tables */}
      {((selectedReport?.milestonesSchedule?.length ?? 0) > 0 || (selectedReport?.milestonesPayment?.length ?? 0) > 0) && (
        <div className="grid gap-5 lg:grid-cols-2">
          {/* Schedule Milestones Table */}
          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <h3 className="mb-4 text-sm font-bold text-violet-600">📅 Schedule Milestones</h3>
            <div className="max-h-60 overflow-y-auto">
              <table className="w-full text-xs">
                <thead className="bg-slate-100 sticky top-0">
                  <tr>
                    <th className="p-2 text-left w-8">#</th>
                    <th className="p-2 text-left">Description</th>
                    <th className="p-2 text-center w-20">Plan</th>
                    <th className="p-2 text-center w-20">Actual/FC</th>
                    <th className="p-2 text-center w-24">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {(selectedReport?.milestonesSchedule || []).map((m, i) => (
                    <tr key={i} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="p-2 font-semibold">{m.no || i + 1}</td>
                      <td className="p-2">{m.description}</td>
                      <td className="p-2 text-center text-[10px]">{m.planDate || '-'}</td>
                      <td className="p-2 text-center text-[10px]">{m.actualForecastDate || '-'}</td>
                      <td className="p-2 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-semibold ${m.status === 'Completed' ? 'bg-green-100 text-green-600' :
                          m.status === 'On Track' ? 'bg-blue-100 text-blue-600' :
                            m.status === 'At Risk' ? 'bg-amber-100 text-amber-600' :
                              'bg-red-100 text-red-600'
                          }`}>
                          {m.status === 'Completed' ? '🟢' : m.status === 'On Track' ? '🔵' : m.status === 'At Risk' ? '🟡' : '🔴'} {m.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {(!selectedReport?.milestonesSchedule || selectedReport.milestonesSchedule.length === 0) && (
                    <tr><td colSpan={5} className="p-4 text-center text-slate-400">No schedule milestones</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Payment Milestones Table */}
          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <h3 className="mb-4 text-sm font-bold text-amber-600">💰 Payment Milestones</h3>
            <div className="max-h-60 overflow-y-auto">
              <table className="w-full text-xs">
                <thead className="bg-slate-100 sticky top-0">
                  <tr>
                    <th className="p-2 text-left w-8">#</th>
                    <th className="p-2 text-left">Description</th>
                    <th className="p-2 text-center w-20">Plan</th>
                    <th className="p-2 text-center w-20">Actual/FC</th>
                    <th className="p-2 text-center w-24">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {(selectedReport?.milestonesPayment || []).map((m, i) => (
                    <tr key={i} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="p-2 font-semibold">{m.no || i + 1}</td>
                      <td className="p-2">{m.description}</td>
                      <td className="p-2 text-center text-[10px]">{m.planDate || '-'}</td>
                      <td className="p-2 text-center text-[10px]">{m.actualForecastDate || '-'}</td>
                      <td className="p-2 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-semibold ${m.status === 'Completed' ? 'bg-green-100 text-green-600' :
                          m.status === 'On Track' ? 'bg-blue-100 text-blue-600' :
                            m.status === 'At Risk' ? 'bg-amber-100 text-amber-600' :
                              'bg-red-100 text-red-600'
                          }`}>
                          {m.status === 'Completed' ? '🟢' : m.status === 'On Track' ? '🔵' : m.status === 'At Risk' ? '🟡' : '🔴'} {m.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {(!selectedReport?.milestonesPayment || selectedReport.milestonesPayment.length === 0) && (
                    <tr><td colSpan={5} className="p-4 text-center text-slate-400">No payment milestones</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Activities Section - Full Lists */}
      {(selectedReport?.thisWeekActivities || selectedReport?.nextWeekPlan) && (
        <div className="grid gap-5 lg:grid-cols-2">
          {/* This Week Activities */}
          <div className="rounded-2xl bg-white p-5 shadow-sm overflow-hidden">
            <h3 className="mb-4 text-sm font-bold text-teal-600">📋 This Week Activities</h3>
            <div className="max-h-64 overflow-y-auto overflow-x-hidden space-y-3">
              {Object.entries((selectedReport?.thisWeekActivities || {}) as unknown as Record<string, string[]>).map(([cat, items]) => {
                const filteredItems = (Array.isArray(items) ? items : []).filter(i => i);
                if (filteredItems.length === 0) return null;
                return (
                  <div key={cat}>
                    <p className="text-xs font-semibold text-teal-600 capitalize mb-1">{cat}</p>
                    <ul className="pl-4 space-y-0.5">
                      {filteredItems.map((item, j) => (
                        <li key={j} className="text-xs text-slate-600 list-disc break-all whitespace-normal">{item}</li>
                      ))}
                    </ul>
                  </div>
                );
              })}
              {Object.keys(selectedReport?.thisWeekActivities || {}).length === 0 && (
                <p className="text-center text-slate-400 text-xs py-4">No activities recorded</p>
              )}
            </div>
          </div>

          {/* Next Week Plan */}
          <div className="rounded-2xl bg-white p-5 shadow-sm overflow-hidden">
            <h3 className="mb-4 text-sm font-bold text-blue-600">📅 Next Week Plan</h3>
            <div className="max-h-64 overflow-y-auto overflow-x-hidden space-y-3">
              {Object.entries((selectedReport?.nextWeekPlan || {}) as unknown as Record<string, string[]>).map(([cat, items]) => {
                const filteredItems = (Array.isArray(items) ? items : []).filter(i => i);
                if (filteredItems.length === 0) return null;
                return (
                  <div key={cat}>
                    <p className="text-xs font-semibold text-blue-600 capitalize mb-1">{cat}</p>
                    <ul className="pl-4 space-y-0.5">
                      {filteredItems.map((item, j) => (
                        <li key={j} className="text-xs text-slate-600 list-disc break-all whitespace-normal">{item}</li>
                      ))}
                    </ul>
                  </div>
                );
              })}
              {Object.keys(selectedReport?.nextWeekPlan || {}).length === 0 && (
                <p className="text-center text-slate-400 text-xs py-4">No plans recorded</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Image Viewer Modal */}
      <ImageViewerModal
        isOpen={imageViewerOpen}
        onClose={() => setImageViewerOpen(false)}
        imageSrc={selectedImage}
        imageTitle={imageViewerTitle}
      />
    </div>
  );
}
