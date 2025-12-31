'use client';

import { useState } from 'react';
import { Icons } from './Icons';

interface ExportPDFButtonProps {
    onExport: () => Promise<void>;
    label?: string;
    className?: string;
}

export function ExportPDFButton({ onExport, label = 'Export PDF', className = '' }: ExportPDFButtonProps) {
    const [exporting, setExporting] = useState(false);

    const handleClick = async () => {
        setExporting(true);
        try {
            await onExport();
        } catch (error) {
            console.error('PDF Export failed:', error);
            alert('Export gagal: ' + (error instanceof Error ? error.message : 'Unknown error'));
        } finally {
            setExporting(false);
        }
    };

    return (
        <button
            onClick={handleClick}
            disabled={exporting}
            className={`flex items-center gap-2 rounded-lg bg-red-500 px-4 py-2 font-semibold text-white hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
        >
            {exporting ? (
                <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Exporting...
                </>
            ) : (
                <>
                    <Icons.Download className="w-4 h-4" />
                    {label}
                </>
            )}
        </button>
    );
}
