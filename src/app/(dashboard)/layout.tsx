import { Sidebar } from '@/components/layout/Sidebar';
import { ReportContextProvider } from '@/contexts/ReportContext';

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <ReportContextProvider>
            <div className="flex min-h-screen bg-slate-50">
                <Sidebar />
                <main className="ml-[240px] flex-1 p-5 transition-all duration-300">
                    {children}
                </main>
            </div>
        </ReportContextProvider>
    );
}
