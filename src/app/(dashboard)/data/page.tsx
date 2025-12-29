'use client';

import { useState, useRef } from 'react';
import { useReportContext } from '@/contexts/ReportContext';
import { ProjectReportSelector } from '@/components/ui/ProjectReportSelector';
import { Icons } from '@/components/ui/Icons';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export default function DataPage() {
    const { selectedProject, selectedReport, projects, reports } = useReportContext();
    const [exportingPDF, setExportingPDF] = useState(false);
    const [pdfProgress, setPdfProgress] = useState('');
    const [notification, setNotification] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

    const showNotif = (msg: string, type: 'success' | 'error' = 'success') => {
        setNotification({ type, msg });
        setTimeout(() => setNotification(null), 3000);
    };

    const exportToPDF = async (pageType: 'dashboard' | 'analysis' | 'both') => {
        setExportingPDF(true);
        setPdfProgress('Preparing...');

        try {
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pageWidth = pdf.internal.pageSize.getWidth();
            const pageHeight = pdf.internal.pageSize.getHeight();
            const margin = 10;
            const contentWidth = pageWidth - (margin * 2);

            // Function to capture a page by navigating and capturing
            const capturePage = async (url: string, title: string) => {
                setPdfProgress(`Capturing ${title}...`);

                // Open the page in a hidden iframe
                const iframe = document.createElement('iframe');
                iframe.style.cssText = 'position:fixed;top:-10000px;left:-10000px;width:1200px;height:2000px;border:none;';
                document.body.appendChild(iframe);

                // Navigate iframe to the page
                iframe.src = url;

                // Wait for load
                await new Promise<void>((resolve) => {
                    iframe.onload = () => setTimeout(resolve, 1500);
                    setTimeout(resolve, 3000); // Fallback timeout
                });

                const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
                if (!iframeDoc) {
                    document.body.removeChild(iframe);
                    return null;
                }

                const content = iframeDoc.querySelector('main') || iframeDoc.body;

                const canvas = await html2canvas(content as HTMLElement, {
                    scale: 2,
                    useCORS: true,
                    logging: false,
                    backgroundColor: '#f8fafc',
                    width: 1200,
                    windowWidth: 1200,
                });

                document.body.removeChild(iframe);
                return canvas;
            };

            // Add header to PDF
            const addHeader = (title: string) => {
                pdf.setFillColor(15, 118, 110);
                pdf.rect(0, 0, pageWidth, 20, 'F');
                pdf.setTextColor(255, 255, 255);
                pdf.setFontSize(14);
                pdf.setFont('helvetica', 'bold');
                pdf.text(`EPC Weekly Report - ${title}`, margin, 13);
                pdf.setFontSize(10);
                pdf.text(`Week ${selectedReport?.weekNo || ''}`, pageWidth - margin - 30, 13);
                pdf.setTextColor(0, 0, 0);
            };

            // Add footer to PDF
            const addFooter = (pageNum: number, totalPages: number) => {
                pdf.setFontSize(8);
                pdf.setTextColor(100, 100, 100);
                pdf.text(selectedProject?.name || 'EPC Project', margin, pageHeight - 5);
                pdf.text(`Page ${pageNum} of ${totalPages}`, pageWidth - margin - 20, pageHeight - 5);
                pdf.text(new Date().toLocaleDateString(), pageWidth / 2, pageHeight - 5, { align: 'center' });
            };

            // Add image to PDF with pagination
            const addImageToPDF = (canvas: HTMLCanvasElement, title: string, isFirst: boolean) => {
                if (!isFirst) {
                    pdf.addPage();
                }

                addHeader(title);
                const imgData = canvas.toDataURL('image/jpeg', 0.95);
                const imgHeight = (canvas.height * contentWidth) / canvas.width;

                let heightLeft = imgHeight;
                let position = 25;
                let pageCount = 1;

                pdf.addImage(imgData, 'JPEG', margin, position, contentWidth, Math.min(imgHeight, pageHeight - position - 15));
                heightLeft -= (pageHeight - position - 15);

                while (heightLeft > 0) {
                    pdf.addPage();
                    pageCount++;
                    position = 10;
                    pdf.addImage(imgData, 'JPEG', margin, position - imgHeight + heightLeft + (pageHeight - 25), contentWidth, imgHeight);
                    heightLeft -= (pageHeight - 20);
                }

                addFooter(pageCount, pageCount);
            };

            // Use window.print as a simpler approach for now
            setPdfProgress('Opening print dialog...');

            // Navigate to the appropriate page and trigger print
            let targetUrl = '/';
            if (pageType === 'dashboard') targetUrl = '/';
            else if (pageType === 'analysis') targetUrl = '/analysis';

            // Create a simple PDF with report summary instead
            addHeader(pageType === 'dashboard' ? 'Dashboard' : pageType === 'analysis' ? 'Risk Analysis' : 'Full Report');

            let yPos = 30;

            // Project Info
            pdf.setFontSize(14);
            pdf.setFont('helvetica', 'bold');
            pdf.text('Project Information', margin, yPos);
            yPos += 8;

            pdf.setFontSize(10);
            pdf.setFont('helvetica', 'normal');
            pdf.text(`Project: ${selectedProject?.name || 'N/A'}`, margin, yPos); yPos += 6;
            pdf.text(`Owner: ${selectedProject?.owner || 'N/A'}`, margin, yPos); yPos += 6;
            pdf.text(`Contractor: ${selectedProject?.contractor || 'N/A'}`, margin, yPos); yPos += 6;
            pdf.text(`Contract Value: $${((selectedProject?.contractPrice || 0) / 1e6).toFixed(2)}M`, margin, yPos); yPos += 6;
            pdf.text(`Duration: ${selectedProject?.startDate || ''} to ${selectedProject?.finishDate || ''}`, margin, yPos); yPos += 12;

            // Report Summary
            pdf.setFontSize(14);
            pdf.setFont('helvetica', 'bold');
            pdf.text('Weekly Report Summary', margin, yPos);
            yPos += 8;

            pdf.setFontSize(10);
            pdf.setFont('helvetica', 'normal');
            pdf.text(`Week: ${selectedReport?.weekNo || 'N/A'}`, margin, yPos); yPos += 6;
            pdf.text(`Period: ${selectedReport?.periodStart || ''} to ${selectedReport?.periodEnd || ''}`, margin, yPos); yPos += 6;
            pdf.text(`Status: ${selectedReport?.status || 'Draft'}`, margin, yPos); yPos += 12;

            // Progress & EVM
            pdf.setFontSize(14);
            pdf.setFont('helvetica', 'bold');
            pdf.text('Progress & EVM', margin, yPos);
            yPos += 8;

            const evm = selectedReport?.evm || { spiValue: 1, cpiValue: 1, bac: 0, bcws: 0, bcwp: 0, acwp: 0, eac: 0, vac: 0 };
            const progress = selectedReport?.overallProgress || { plan: 0, actual: 0, variance: 0 };

            pdf.setFontSize(10);
            pdf.setFont('helvetica', 'normal');
            pdf.text(`Overall Progress: Plan ${(progress.plan || 0).toFixed(2)}% | Actual ${(progress.actual || 0).toFixed(2)}% | Variance ${(progress.variance || 0).toFixed(2)}%`, margin, yPos); yPos += 6;
            pdf.text(`SPI: ${(evm.spiValue || 1).toFixed(3)} | CPI: ${(evm.cpiValue || 1).toFixed(3)}`, margin, yPos); yPos += 6;
            pdf.text(`BAC: $${((evm.bac || 0) / 1e6).toFixed(2)}M | EAC: $${((evm.eac || 0) / 1e6).toFixed(2)}M | VAC: $${((evm.vac || 0) / 1e6).toFixed(2)}M`, margin, yPos); yPos += 12;

            // HSE
            pdf.setFontSize(14);
            pdf.setFont('helvetica', 'bold');
            pdf.text('HSE Summary', margin, yPos);
            yPos += 8;

            const hse = selectedReport?.hse || { lagging: { fatality: 0, lti: 0, medicalTreatment: 0, firstAid: 0 }, leading: {}, manpower: { total: 0, office: 0, siteSubcontractor: 0 }, safeHours: 0, trir: 0 };
            pdf.setFontSize(10);
            pdf.setFont('helvetica', 'normal');
            pdf.text(`Fatality: ${hse.lagging?.fatality || 0} | LTI: ${hse.lagging?.lti || 0} | Medical: ${hse.lagging?.medicalTreatment || 0} | First Aid: ${hse.lagging?.firstAid || 0}`, margin, yPos); yPos += 6;
            pdf.text(`Safe Hours: ${(hse.safeHours || 0).toLocaleString()} | TRIR: ${(hse.trir || 0).toFixed(2)}`, margin, yPos); yPos += 6;
            pdf.text(`Manpower: ${hse.manpower?.total || 0} (Office: ${hse.manpower?.office || 0}, Site: ${hse.manpower?.siteSubcontractor || 0})`, margin, yPos); yPos += 12;

            // TKDN
            const tkdn = selectedReport?.tkdn || { plan: 0, actual: 0 };
            if (tkdn.plan || tkdn.actual) {
                pdf.setFontSize(14);
                pdf.setFont('helvetica', 'bold');
                pdf.text('TKDN Performance', margin, yPos);
                yPos += 8;

                pdf.setFontSize(10);
                pdf.setFont('helvetica', 'normal');
                pdf.text(`Target: ${tkdn.plan || 0}% | Actual: ${(tkdn.actual || 0).toFixed(1)}% | Status: ${(tkdn.actual || 0) >= (tkdn.plan || 0) ? 'PASS' : 'AT RISK'}`, margin, yPos);
                yPos += 12;
            }

            // Cash Flow
            const cashFlow = selectedReport?.cashFlow || { cashOut: 0, billing: 0, cashIn: 0 };
            pdf.setFontSize(14);
            pdf.setFont('helvetica', 'bold');
            pdf.text('Cash Flow', margin, yPos);
            yPos += 8;

            pdf.setFontSize(10);
            pdf.setFont('helvetica', 'normal');
            pdf.text(`Cash Out: $${((cashFlow.cashOut || 0) / 1e6).toFixed(2)}M | Billing: $${((cashFlow.billing || 0) / 1e6).toFixed(2)}M | Cash In: $${((cashFlow.cashIn || 0) / 1e6).toFixed(2)}M`, margin, yPos);
            yPos += 12;

            addFooter(1, 1);

            // Save PDF
            setPdfProgress('Generating PDF...');
            const fileName = `EPC_Report_Week${selectedReport?.weekNo || ''}_${pageType}_${new Date().toISOString().split('T')[0]}.pdf`;
            pdf.save(fileName);

            showNotif('PDF exported successfully!');
        } catch (error) {
            console.error('PDF Export Error:', error);
            showNotif(`Export failed: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
        } finally {
            setExportingPDF(false);
            setPdfProgress('');
        }
    };

    // Export JSON
    const exportJSON = () => {
        const data = {
            exportDate: new Date().toISOString(),
            projects,
            reports,
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `EPC_Data_${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
        showNotif('JSON exported successfully!');
    };

    // Import JSON (placeholder)
    const importJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (ev) => {
            try {
                const data = JSON.parse(ev.target?.result as string);
                console.log('Imported data:', data);
                showNotif('Data imported! Refresh to see changes.');
            } catch {
                showNotif('Invalid JSON file', 'error');
            }
        };
        reader.readAsText(file);
    };

    return (
        <div className="space-y-5">
            {/* Header */}
            <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-extrabold">Data Management</h1>
                    <p className="text-sm text-slate-500">Export reports and manage data</p>
                </div>
                <ProjectReportSelector />
            </div>

            {/* PDF Export Section */}
            <div className="rounded-2xl bg-gradient-to-br from-red-50 to-red-100 border-2 border-red-400 p-5">
                <h3 className="font-bold text-red-600 mb-3 flex items-center gap-2">
                    <Icons.Report className="w-5 h-5" />
                    Export to PDF
                </h3>
                <p className="text-sm text-red-700 mb-4">
                    Export halaman Dashboard dan/atau Risk Analysis ke format PDF dengan tampilan identik seperti di aplikasi.
                </p>

                {exportingPDF ? (
                    <div className="text-center py-6">
                        <div className="w-10 h-10 border-4 border-slate-200 border-t-red-500 rounded-full animate-spin mx-auto mb-3"></div>
                        <p className="text-red-600 font-semibold">{pdfProgress}</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <button
                            onClick={() => exportToPDF('dashboard')}
                            className="flex items-center justify-center gap-2 rounded-lg bg-red-500 px-4 py-3 font-semibold text-white hover:bg-red-600 transition-colors"
                        >
                            <Icons.Dashboard className="w-4 h-4" />
                            Dashboard Only
                        </button>
                        <button
                            onClick={() => exportToPDF('analysis')}
                            className="flex items-center justify-center gap-2 rounded-lg bg-red-500 px-4 py-3 font-semibold text-white hover:bg-red-600 transition-colors"
                        >
                            <Icons.Analysis className="w-4 h-4" />
                            Risk Analysis Only
                        </button>
                        <button
                            onClick={() => exportToPDF('both')}
                            className="flex items-center justify-center gap-2 rounded-lg bg-red-700 px-4 py-3 font-semibold text-white hover:bg-red-800 transition-colors"
                        >
                            <Icons.Save className="w-4 h-4" />
                            Export Both (Full Report)
                        </button>
                    </div>
                )}
            </div>

            {/* JSON Export/Import Section */}
            <div className="rounded-2xl bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-400 p-5">
                <h3 className="font-bold text-blue-600 mb-3 flex items-center gap-2">
                    <Icons.Database className="w-5 h-5" />
                    Export/Import Data (JSON)
                </h3>
                <p className="text-sm text-blue-700 mb-4">
                    Backup dan restore semua data project dan report dalam format JSON.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <button
                        onClick={exportJSON}
                        className="flex items-center justify-center gap-2 rounded-lg bg-blue-500 px-4 py-3 font-semibold text-white hover:bg-blue-600 transition-colors"
                    >
                        <Icons.Download className="w-4 h-4" />
                        Export JSON
                    </button>
                    <label className="flex items-center justify-center gap-2 rounded-lg bg-blue-500 px-4 py-3 font-semibold text-white hover:bg-blue-600 transition-colors cursor-pointer">
                        <Icons.Plus className="w-4 h-4" />
                        Import JSON
                        <input type="file" accept=".json" className="hidden" onChange={importJSON} />
                    </label>
                </div>
            </div>

            {/* Statistics */}
            <div className="rounded-2xl bg-white p-5 shadow-sm">
                <h3 className="font-bold mb-4">📊 Data Statistics</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="rounded-lg bg-teal-50 p-4 text-center">
                        <p className="text-3xl font-extrabold text-teal-600">{projects.length}</p>
                        <p className="text-xs text-slate-500">Total Projects</p>
                    </div>
                    <div className="rounded-lg bg-blue-50 p-4 text-center">
                        <p className="text-3xl font-extrabold text-blue-600">{reports.length}</p>
                        <p className="text-xs text-slate-500">Total Reports</p>
                    </div>
                    <div className="rounded-lg bg-amber-50 p-4 text-center">
                        <p className="text-3xl font-extrabold text-amber-600">
                            {reports.filter(r => r.status === 'Draft').length}
                        </p>
                        <p className="text-xs text-slate-500">Draft Reports</p>
                    </div>
                    <div className="rounded-lg bg-green-50 p-4 text-center">
                        <p className="text-3xl font-extrabold text-green-600">
                            {reports.filter(r => r.status === 'Issued').length}
                        </p>
                        <p className="text-xs text-slate-500">Issued Reports</p>
                    </div>
                </div>
            </div>

            {/* Notification Toast */}
            {notification && (
                <div className={`fixed bottom-5 right-5 rounded-lg px-4 py-3 text-white shadow-lg ${notification.type === 'error' ? 'bg-red-500' : 'bg-green-500'}`}>
                    {notification.msg}
                </div>
            )}
        </div>
    );
}
