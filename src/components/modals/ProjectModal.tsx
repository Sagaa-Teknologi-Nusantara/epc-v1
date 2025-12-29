'use client';

import { useState } from 'react';
import { Icons } from '@/components/ui/Icons';
import type { Project } from '@/types';

interface ProjectModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: Partial<Project>) => Promise<void>;
    project?: Project | null;
}

export function ProjectModal({ isOpen, onClose, onSave, project }: ProjectModalProps) {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState<Partial<Project>>({
        name: project?.name || '',
        owner: project?.owner || '',
        contractor: project?.contractor || '',
        technologyProvider: project?.technologyProvider || '',
        contractType: project?.contractType || 'EPC Turnkey',
        termOfPayment: project?.termOfPayment || 'Progress Payment',
        contractPrice: project?.contractPrice || 0,
        bac: project?.bac || 0,
        ldDelay: project?.ldDelay || 0,
        ldPerformance: project?.ldPerformance || 0,
        scopeByOwner: project?.scopeByOwner || '',
        startDate: project?.startDate || '',
        finishDate: project?.finishDate || '',
        guaranteedPower: project?.guaranteedPower || 0,
        ntpDate: project?.ntpDate || '',
        codDate: project?.codDate || '',
        status: project?.status || 'Active',
    });

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await onSave(formData);
            onClose();
        } catch (error) {
            console.error('Save failed:', error);
        } finally {
            setLoading(false);
        }
    };

    const updateField = (key: keyof Project, value: unknown) => {
        setFormData(prev => ({ ...prev, [key]: value }));
    };

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50" onClick={onClose}>
            <div
                className="max-h-[90vh] w-[800px] overflow-hidden rounded-2xl bg-white shadow-2xl"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between border-b border-slate-200 p-4">
                    <h2 className="text-lg font-bold">{project ? 'Edit' : 'Create'} Project</h2>
                    <button onClick={onClose} className="rounded-lg p-1 hover:bg-slate-100">
                        <Icons.X className="h-5 w-5" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="max-h-[70vh] overflow-y-auto p-4">
                    <div className="grid grid-cols-2 gap-4">
                        {/* Project Name */}
                        <div className="col-span-2">
                            <label className="mb-1 block text-xs font-semibold text-slate-600">Project Name *</label>
                            <input
                                type="text"
                                required
                                value={formData.name || ''}
                                onChange={e => updateField('name', e.target.value)}
                                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none"
                                placeholder="e.g., SALAK UNIT 7 DEVELOPMENT PROJECT"
                            />
                        </div>

                        {/* Owner */}
                        <div>
                            <label className="mb-1 block text-xs font-semibold text-slate-600">Owner</label>
                            <input
                                type="text"
                                value={formData.owner || ''}
                                onChange={e => updateField('owner', e.target.value)}
                                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none"
                            />
                        </div>

                        {/* Contractor */}
                        <div>
                            <label className="mb-1 block text-xs font-semibold text-slate-600">Contractor</label>
                            <input
                                type="text"
                                value={formData.contractor || ''}
                                onChange={e => updateField('contractor', e.target.value)}
                                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none"
                            />
                        </div>

                        {/* Technology Provider */}
                        <div>
                            <label className="mb-1 block text-xs font-semibold text-slate-600">Technology Provider</label>
                            <input
                                type="text"
                                value={formData.technologyProvider || ''}
                                onChange={e => updateField('technologyProvider', e.target.value)}
                                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none"
                            />
                        </div>

                        {/* Contract Type */}
                        <div>
                            <label className="mb-1 block text-xs font-semibold text-slate-600">Contract Type</label>
                            <select
                                value={formData.contractType || ''}
                                onChange={e => updateField('contractType', e.target.value)}
                                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none"
                            >
                                <option value="EPC Turnkey">EPC Turnkey</option>
                                <option value="EPCC">EPCC</option>
                                <option value="EPC">EPC</option>
                                <option value="Lump Sum">Lump Sum</option>
                            </select>
                        </div>

                        {/* Contract Price */}
                        <div>
                            <label className="mb-1 block text-xs font-semibold text-slate-600">Contract Price ($)</label>
                            <input
                                type="number"
                                value={formData.contractPrice || ''}
                                onChange={e => updateField('contractPrice', Number(e.target.value))}
                                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none"
                            />
                        </div>

                        {/* BAC */}
                        <div>
                            <label className="mb-1 block text-xs font-semibold text-slate-600">BAC (Budget at Completion)</label>
                            <input
                                type="number"
                                value={formData.bac || ''}
                                onChange={e => updateField('bac', Number(e.target.value))}
                                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none"
                            />
                        </div>

                        {/* LD Delay */}
                        <div>
                            <label className="mb-1 block text-xs font-semibold text-slate-600">LD Delay ($/day)</label>
                            <input
                                type="number"
                                value={formData.ldDelay || ''}
                                onChange={e => updateField('ldDelay', Number(e.target.value))}
                                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none"
                            />
                        </div>

                        {/* LD Performance */}
                        <div>
                            <label className="mb-1 block text-xs font-semibold text-slate-600">LD Performance ($/kW)</label>
                            <input
                                type="number"
                                value={formData.ldPerformance || ''}
                                onChange={e => updateField('ldPerformance', Number(e.target.value))}
                                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none"
                            />
                        </div>

                        {/* Term of Payment */}
                        <div>
                            <label className="mb-1 block text-xs font-semibold text-slate-600">Term of Payment</label>
                            <select
                                value={formData.termOfPayment || ''}
                                onChange={e => updateField('termOfPayment', e.target.value)}
                                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none"
                            >
                                <option value="Progress Payment">Progress Payment</option>
                                <option value="Progress Payment & Milestone">Progress Payment & Milestone</option>
                                <option value="Milestone">Milestone</option>
                                <option value="Advance Payment">Advance Payment</option>
                                <option value="Down Payment + Progress">Down Payment + Progress</option>
                            </select>
                        </div>

                        {/* Scope By Owner */}
                        <div className="col-span-2">
                            <label className="mb-1 block text-xs font-semibold text-slate-600">Scope By Owner</label>
                            <textarea
                                value={formData.scopeByOwner || ''}
                                onChange={e => updateField('scopeByOwner', e.target.value)}
                                rows={3}
                                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none resize-none"
                                placeholder="e.g., Site preparation, access road, temporary facilities"
                            />
                        </div>

                        {/* Start Date */}
                        <div>
                            <label className="mb-1 block text-xs font-semibold text-slate-600">Start Date</label>
                            <input
                                type="date"
                                value={formData.startDate || ''}
                                onChange={e => updateField('startDate', e.target.value)}
                                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none"
                            />
                        </div>

                        {/* Finish Date */}
                        <div>
                            <label className="mb-1 block text-xs font-semibold text-slate-600">Finish Date</label>
                            <input
                                type="date"
                                value={formData.finishDate || ''}
                                onChange={e => updateField('finishDate', e.target.value)}
                                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none"
                            />
                        </div>

                        {/* Guaranteed Power */}
                        <div>
                            <label className="mb-1 block text-xs font-semibold text-slate-600">Guaranteed Power (MW)</label>
                            <input
                                type="number"
                                step="0.1"
                                value={formData.guaranteedPower || ''}
                                onChange={e => updateField('guaranteedPower', Number(e.target.value))}
                                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none"
                            />
                        </div>

                        {/* Status */}
                        <div>
                            <label className="mb-1 block text-xs font-semibold text-slate-600">Status</label>
                            <select
                                value={formData.status || 'Active'}
                                onChange={e => updateField('status', e.target.value)}
                                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none"
                            >
                                <option value="Active">Active</option>
                                <option value="Completed">Completed</option>
                                <option value="On Hold">On Hold</option>
                            </select>
                        </div>

                        {/* NTP Date */}
                        <div>
                            <label className="mb-1 block text-xs font-semibold text-slate-600">NTP Date</label>
                            <input
                                type="date"
                                value={formData.ntpDate || ''}
                                onChange={e => updateField('ntpDate', e.target.value)}
                                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none"
                            />
                        </div>

                        {/* COD Date */}
                        <div>
                            <label className="mb-1 block text-xs font-semibold text-slate-600">COD Date</label>
                            <input
                                type="date"
                                value={formData.codDate || ''}
                                onChange={e => updateField('codDate', e.target.value)}
                                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none"
                            />
                        </div>
                    </div>
                </form>

                {/* Footer */}
                <div className="flex justify-end gap-3 border-t border-slate-200 p-4">
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-lg bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-200"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        onClick={handleSubmit}
                        disabled={loading}
                        className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-teal-500 to-teal-600 px-5 py-2 text-sm font-semibold text-white hover:from-teal-600 hover:to-teal-700 disabled:opacity-50"
                    >
                        {loading ? (
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                        ) : (
                            <Icons.Save className="h-4 w-4" />
                        )}
                        {project ? 'Update' : 'Create'} Project
                    </button>
                </div>
            </div>
        </div>
    );
}
