'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { Icons } from '@/components/ui/Icons';
import { cn } from '@/lib/utils';

const navItems = [
    { id: 'dashboard', label: 'Dashboard', href: '/', icon: Icons.Dashboard },
    { id: 'projects', label: 'Projects', href: '/projects', icon: Icons.Project },
    { id: 'reports', label: 'Reports', href: '/reports', icon: Icons.Report },
    // { id: 's-curve', label: 'S-Curve', href: '/s-curve', icon: Icons.Chart },
    { id: 'analysis', label: 'Risk Analysis', href: '/analysis', icon: Icons.Analysis },
    { id: 'trend', label: 'Trend Analysis', href: '/trend', icon: Icons.Chart },
    { id: 'data', label: 'Data Management', href: '/data', icon: Icons.Database },
];

export function Sidebar() {
    const [collapsed, setCollapsed] = useState(false);
    const pathname = usePathname();

    return (
        <aside
            className={cn(
                'fixed left-0 top-0 z-[100] min-h-screen bg-gradient-to-b from-teal-700 to-teal-800 p-5 transition-all duration-300',
                collapsed ? 'w-[60px]' : 'w-[240px]'
            )}
        >
            {/* Logo / Title */}
            <div className="mb-8">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20">
                        <span className="text-lg font-bold text-white">E</span>
                    </div>
                    {!collapsed && (
                        <div>
                            <h1 className="text-lg font-bold text-white">EPC Dashboard</h1>
                            <p className="text-xs text-white/70">Weekly Report v4</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Toggle Button */}
            <button
                onClick={() => setCollapsed(!collapsed)}
                className="mb-6 flex w-full items-center justify-center rounded-lg p-2 text-white/70 transition-colors hover:bg-white/10 hover:text-white"
            >
                {collapsed ? (
                    <Icons.ChevronRight className="h-5 w-5" />
                ) : (
                    <Icons.ChevronLeft className="h-5 w-5" />
                )}
            </button>

            {/* Navigation */}
            <nav className="flex flex-col gap-1">
                {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.href;

                    return (
                        <Link
                            key={item.id}
                            href={item.href}
                            className={cn(
                                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-white/70 transition-all hover:bg-white/10 hover:text-white',
                                isActive && 'bg-white/20 text-white font-semibold'
                            )}
                        >
                            <Icon className="h-[18px] w-[18px] flex-shrink-0" />
                            {!collapsed && <span>{item.label}</span>}
                        </Link>
                    );
                })}
            </nav>

            {/* Footer
            {!collapsed && (
                <div className="absolute bottom-6 left-4 right-4">
                    <div className="rounded-lg bg-white/10 p-3">
                        <p className="text-xs text-white/60">Need help?</p>
                        <p className="text-sm font-medium text-white">View Documentation</p>
                    </div>
                </div>
            )} */}
        </aside>
    );
}
