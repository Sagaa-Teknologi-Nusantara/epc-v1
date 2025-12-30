'use client';

import { useState } from 'react';
import { useReportContext } from '@/contexts/ReportContext';
import { ProjectReportSelector } from '@/components/ui/ProjectReportSelector';
import { Icons } from '@/components/ui/Icons';

export default function DataPage() {
    const { selectedProject, selectedReport, projects, reports } = useReportContext();
    const [notification, setNotification] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

    const showNotif = (msg: string, type: 'success' | 'error' = 'success') => {
        setNotification({ type, msg });
        setTimeout(() => setNotification(null), 3000);
    };

    // Print-to-PDF: Opens the page in a new window with print dialog
    const printPage = (pageType: 'dashboard' | 'trend' | 'analysis') => {
        const urls = {
            dashboard: '/',
            trend: '/trend',
            analysis: '/analysis'
        };

        const titles = {
            dashboard: 'Dashboard',
            trend: 'Trend Analysis',
            analysis: 'Risk Analysis'
        };

        // Open page in new window
        const printWindow = window.open(urls[pageType], '_blank');

        if (!printWindow) {
            showNotif('Popup blocked. Please allow popups for PDF export.', 'error');
            return;
        }

        showNotif(`Opening ${titles[pageType]} for print...`);

        // Wait for page to load then trigger print
        printWindow.onload = () => {
            // Add print-specific styles
            const style = printWindow.document.createElement('style');
            style.textContent = `
                @media print {
                    /* Hide sidebar and header for cleaner print */
                    aside { display: none !important; }
                    nav { display: none !important; }
                    
                    /* Make main content full width */
                    main { 
                        margin-left: 0 !important;
                        padding: 20px !important;
                    }
                    
                    /* Ensure charts are visible */
                    svg { max-width: 100%; height: auto; }
                    
                    /* Page break settings */
                    .card, .rounded-2xl { 
                        page-break-inside: avoid; 
                        break-inside: avoid;
                    }
                }
            `;
            printWindow.document.head.appendChild(style);

            // Trigger print after styles are applied
            setTimeout(() => {
                printWindow.print();
            }, 1000);
        };
    };

    // Print all pages: Opens each page sequentially
    const printAllPages = async () => {
        const pages = ['dashboard', 'trend', 'analysis'] as const;

        showNotif('Opening pages for print. Save each as PDF when the print dialog appears.');

        for (const page of pages) {
            await new Promise<void>(resolve => {
                printPage(page);
                // Wait before opening next page
                setTimeout(resolve, 2000);
            });
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

    // Import JSON
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
                    Opens the page for printing. Use your browser&apos;s &quot;Save as PDF&quot; option in the print dialog.
                </p>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <button
                        onClick={() => printPage('dashboard')}
                        className="flex items-center justify-center gap-2 rounded-lg bg-red-500 px-4 py-3 font-semibold text-white hover:bg-red-600 transition-colors"
                    >
                        <Icons.Dashboard className="w-4 h-4" />
                        Dashboard
                    </button>
                    <button
                        onClick={() => printPage('trend')}
                        className="flex items-center justify-center gap-2 rounded-lg bg-red-500 px-4 py-3 font-semibold text-white hover:bg-red-600 transition-colors"
                    >
                        <Icons.TrendUp className="w-4 h-4" />
                        Trend Analysis
                    </button>
                    <button
                        onClick={() => printPage('analysis')}
                        className="flex items-center justify-center gap-2 rounded-lg bg-red-500 px-4 py-3 font-semibold text-white hover:bg-red-600 transition-colors"
                    >
                        <Icons.Analysis className="w-4 h-4" />
                        Risk Analysis
                    </button>
                    <button
                        onClick={printAllPages}
                        className="flex items-center justify-center gap-2 rounded-lg bg-red-700 px-4 py-3 font-semibold text-white hover:bg-red-800 transition-colors"
                    >
                        <Icons.Save className="w-4 h-4" />
                        Export All
                    </button>
                </div>

                <p className="text-xs text-red-600 mt-3 italic">
                    Tip: In the print dialog, choose &quot;Save as PDF&quot; as destination and set margins to &quot;None&quot; for best results.
                </p>
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
