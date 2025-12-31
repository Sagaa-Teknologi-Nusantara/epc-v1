'use client';

import { Icons } from '@/components/ui/Icons';
import type { Project } from '@/types';

interface ViewProjectModalProps {
    isOpen: boolean;
    onClose: () => void;
    project: Project | null;
}

export function ViewProjectModal({ isOpen, onClose, project }: ViewProjectModalProps) {
    if (!isOpen || !project) return null;

    // Type casting for extended project properties
    const extProject = project as unknown as {
        technologyProvider?: string;
        termOfPayment?: string;
        ldDelay?: number;
        ldPerformance?: number;
        scopeByOwner?: string;
        guaranteedPower?: number;
        ntpDate?: string;
        codDate?: string;
        currency?: string;
        description?: string;
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
            <div className="w-[95%] max-w-4xl max-h-[90vh] overflow-hidden rounded-2xl bg-white shadow-xl" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="flex items-center justify-between border-b border-slate-200 bg-gradient-to-r from-teal-500 to-teal-600 p-4 text-white">
                    <div>
                        <h2 className="text-lg font-bold">{project.name}</h2>
                        <p className="text-sm opacity-90">{project.contractor}</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${project.status === 'Active' ? 'bg-green-500' :
                                project.status === 'Completed' ? 'bg-blue-500' : 'bg-amber-500'
                            }`}>
                            {project.status}
                        </span>
                        <button onClick={onClose} className="p-1 hover:bg-white/20 rounded"><Icons.X /></button>
                    </div>
                </div>

                {/* Content */}
                <div className="p-5 max-h-[70vh] overflow-y-auto bg-slate-50 space-y-4">

                    {/* General Information */}
                    <div className="rounded-xl bg-white p-4 shadow-sm">
                        <h3 className="text-sm font-bold mb-3 flex items-center gap-2">📋 General Information</h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            <div className="rounded-lg bg-slate-50 p-3">
                                <p className="text-[10px] text-slate-500">Project Name</p>
                                <p className="text-sm font-semibold">{project.name}</p>
                            </div>
                            <div className="rounded-lg bg-slate-50 p-3">
                                <p className="text-[10px] text-slate-500">Owner</p>
                                <p className="text-sm font-semibold">{project.owner || '-'}</p>
                            </div>
                            <div className="rounded-lg bg-slate-50 p-3">
                                <p className="text-[10px] text-slate-500">Contractor</p>
                                <p className="text-sm font-semibold">{project.contractor || '-'}</p>
                            </div>
                            <div className="rounded-lg bg-slate-50 p-3">
                                <p className="text-[10px] text-slate-500">Technology Provider</p>
                                <p className="text-sm font-semibold">{extProject.technologyProvider || '-'}</p>
                            </div>
                            <div className="rounded-lg bg-slate-50 p-3">
                                <p className="text-[10px] text-slate-500">Status</p>
                                <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${project.status === 'Active' ? 'bg-green-100 text-green-600' :
                                        project.status === 'Completed' ? 'bg-blue-100 text-blue-600' : 'bg-amber-100 text-amber-600'
                                    }`}>{project.status}</span>
                            </div>
                        </div>
                    </div>

                    {/* Contract Details */}
                    <div className="rounded-xl bg-white p-4 shadow-sm">
                        <h3 className="text-sm font-bold mb-3 flex items-center gap-2">💼 Contract Details</h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            <div className="rounded-lg bg-teal-50 p-3">
                                <p className="text-[10px] text-slate-500">Contract Type</p>
                                <p className="text-sm font-semibold text-teal-600">{project.contractType || '-'}</p>
                            </div>
                            <div className="rounded-lg bg-green-50 p-3">
                                <p className="text-[10px] text-slate-500">Contract Price</p>
                                <p className="text-lg font-bold text-green-600">${((project.contractPrice || 0) / 1e6).toFixed(2)}M</p>
                            </div>
                            <div className="rounded-lg bg-blue-50 p-3">
                                <p className="text-[10px] text-slate-500">BAC (Budget at Completion)</p>
                                <p className="text-lg font-bold text-blue-600">${((project.bac || 0) / 1e6).toFixed(2)}M</p>
                            </div>
                            <div className="rounded-lg bg-purple-50 p-3">
                                <p className="text-[10px] text-slate-500">Term of Payment</p>
                                <p className="text-sm font-semibold text-purple-600">{extProject.termOfPayment || '-'}</p>
                            </div>
                        </div>
                    </div>

                    {/* LD (Liquidated Damages) */}
                    <div className="rounded-xl bg-white p-4 shadow-sm">
                        <h3 className="text-sm font-bold mb-3 flex items-center gap-2">⚠️ Liquidated Damages (LD)</h3>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                            <div className="rounded-lg bg-red-50 p-3">
                                <p className="text-[10px] text-slate-500">LD Delay ($/day)</p>
                                <p className="text-lg font-bold text-red-600">${(extProject.ldDelay || 0).toLocaleString()}</p>
                            </div>
                            <div className="rounded-lg bg-amber-50 p-3">
                                <p className="text-[10px] text-slate-500">LD Performance ($/kW)</p>
                                <p className="text-lg font-bold text-amber-600">${(extProject.ldPerformance || 0).toLocaleString()}</p>
                            </div>
                            <div className="rounded-lg bg-orange-50 p-3">
                                <p className="text-[10px] text-slate-500">Guaranteed Power</p>
                                <p className="text-lg font-bold text-orange-600">{extProject.guaranteedPower || 0} MW</p>
                            </div>
                        </div>
                    </div>

                    {/* Schedule */}
                    <div className="rounded-xl bg-white p-4 shadow-sm">
                        <h3 className="text-sm font-bold mb-3 flex items-center gap-2">📅 Schedule</h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            <div className="rounded-lg bg-blue-50 p-3">
                                <p className="text-[10px] text-slate-500">Start Date</p>
                                <p className="text-sm font-semibold text-blue-600">{project.startDate || '-'}</p>
                            </div>
                            <div className="rounded-lg bg-amber-50 p-3">
                                <p className="text-[10px] text-slate-500">Finish Date</p>
                                <p className="text-sm font-semibold text-amber-600">{project.finishDate || '-'}</p>
                            </div>
                            <div className="rounded-lg bg-green-50 p-3">
                                <p className="text-[10px] text-slate-500">NTP Date</p>
                                <p className="text-sm font-semibold text-green-600">{extProject.ntpDate || '-'}</p>
                            </div>
                            <div className="rounded-lg bg-purple-50 p-3">
                                <p className="text-[10px] text-slate-500">COD Date</p>
                                <p className="text-sm font-semibold text-purple-600">{extProject.codDate || '-'}</p>
                            </div>
                            <div className="rounded-lg bg-slate-100 p-3 md:col-span-2">
                                <p className="text-[10px] text-slate-500">Duration</p>
                                <p className="text-sm font-semibold">
                                    {project.startDate && project.finishDate ?
                                        `${Math.ceil((new Date(project.finishDate).getTime() - new Date(project.startDate).getTime()) / (1000 * 60 * 60 * 24))} days` : '-'}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Scope By Owner */}
                    {extProject.scopeByOwner && (
                        <div className="rounded-xl bg-white p-4 shadow-sm">
                            <h3 className="text-sm font-bold mb-3 flex items-center gap-2">🏗️ Scope By Owner</h3>
                            <p className="text-sm text-slate-600 bg-slate-50 rounded-lg p-3">{extProject.scopeByOwner}</p>
                        </div>
                    )}

                </div>

                {/* Footer */}
                <div className="flex justify-end border-t border-slate-200 p-4 bg-white">
                    <button onClick={onClose} className="px-6 py-2 rounded-lg bg-slate-100 text-slate-600 font-medium text-sm hover:bg-slate-200">
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}
