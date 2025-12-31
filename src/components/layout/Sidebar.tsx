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
                'fixed left-0 top-0 z-[100] min-h-screen bg-gradient-to-b from-teal-700 to-teal-800 transition-all duration-300',
                collapsed ? 'w-[70px] px-2 py-4' : 'w-[240px] p-5'
            )}
        >
            {/* Logo / Title */}
            <div className={cn('mb-6', collapsed && 'flex justify-center')}>
                <div className={cn('flex items-center', collapsed ? 'justify-center' : 'gap-3')}>
                    <div className={cn(
                        'flex items-center justify-center rounded-xl bg-white/20',
                        collapsed ? 'h-10 w-10' : 'h-10 w-10'
                    )}>
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
                className={cn(
                    'mb-4 flex items-center rounded-lg p-2 text-white/70 transition-colors hover:bg-white/10 hover:text-white',
                    collapsed ? 'w-full justify-center' : 'w-full justify-center'
                )}
                title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
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
                                'flex items-center rounded-lg text-sm font-medium text-white/70 transition-all hover:bg-white/10 hover:text-white',
                                collapsed ? 'justify-center px-2 py-2.5' : 'gap-3 px-3 py-2.5',
                                isActive && 'bg-white/20 text-white font-semibold'
                            )}
                            title={collapsed ? item.label : undefined}
                        >
                            <Icon className="h-[18px] w-[18px] flex-shrink-0" />
                            {!collapsed && <span>{item.label}</span>}
                        </Link>
                    );
                })}
            </nav>
        </aside>
    );
}
