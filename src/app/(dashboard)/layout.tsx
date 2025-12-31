import { Suspense } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { ReportContextProvider } from '@/contexts/ReportContext';

function LoadingFallback() {
    return (
        <div className="flex min-h-screen items-center justify-center bg-slate-50">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-teal-500 border-t-transparent"></div>
        </div>
    );
}

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <Suspense fallback={<LoadingFallback />}>
            <ReportContextProvider>
                <div className="flex min-h-screen bg-slate-50">
                    <Sidebar />
                    <main className="ml-[240px] flex-1 p-5 transition-all duration-300">
                        {children}
                    </main>
                </div>
            </ReportContextProvider>
        </Suspense>
    );
}
