'use client';

import { useState } from 'react';
import { Icons } from '@/components/ui/Icons';
import { useProjects } from '@/hooks';
import { ProjectModal, ViewProjectModal } from '@/components/modals';
import type { Project } from '@/types';

export default function ProjectsPage() {
    const { projects, loading, error, createProject, updateProject, deleteProject } = useProjects();
    const [showModal, setShowModal] = useState(false);
    const [editingProject, setEditingProject] = useState<Project | null>(null);
    const [viewingProject, setViewingProject] = useState<Project | null>(null);

    const handleSave = async (data: Partial<Project>) => {
        if (editingProject) {
            await updateProject(editingProject.id, data);
        } else {
            await createProject(data);
        }
    };

    const openCreate = () => {
        setEditingProject(null);
        setShowModal(true);
    };

    const openEdit = (project: Project) => {
        setEditingProject(project);
        setShowModal(true);
    };

    if (loading) {
        return (
            <div className="flex min-h-[50vh] items-center justify-center">
                <div className="text-center">
                    <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-teal-500 border-t-transparent mx-auto"></div>
                    <p className="text-slate-500">Loading projects...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="rounded-2xl bg-red-50 p-8 text-center">
                <p className="text-red-600">Error: {error}</p>
                <p className="mt-2 text-sm text-slate-500">
                    Make sure the database migration has been run in Supabase.
                </p>
            </div>
        );
    }

    return (
        <div>
            <div className="mb-6 flex items-center justify-between">
                <h1 className="text-2xl font-extrabold">Projects</h1>
                <button
                    onClick={openCreate}
                    className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-teal-500 to-teal-600 px-5 py-2.5 text-sm font-semibold text-white shadow hover:-translate-y-0.5 transition-transform"
                >
                    <Icons.Plus className="h-4 w-4" />
                    Add Project
                </button>
            </div>

            {projects.length === 0 ? (
                <div className="rounded-2xl bg-slate-50 p-12 text-center">
                    <Icons.Project className="mx-auto h-12 w-12 text-slate-300" />
                    <h3 className="mt-4 text-lg font-semibold text-slate-600">No projects yet</h3>
                    <p className="text-sm text-slate-500">Create your first project to get started</p>
                    <button
                        onClick={openCreate}
                        className="mt-4 rounded-lg bg-teal-500 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-600"
                    >
                        Create Project
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-2 gap-5">
                    {projects.map((p) => (
                        <div key={p.id} className="overflow-hidden rounded-2xl bg-white shadow-sm">
                            <div className="bg-gradient-to-r from-teal-500 to-teal-600 p-4 text-white">
                                <h3 className="text-base font-bold">{p.name}</h3>
                                <p className="text-sm opacity-90">{p.contractor}</p>
                            </div>
                            <div className="p-4">
                                <div className="mb-3 grid grid-cols-2 gap-2 text-xs">
                                    <div>
                                        <span className="text-slate-500">Owner:</span>
                                        <br />
                                        <strong>{p.owner || 'N/A'}</strong>
                                    </div>
                                    <div>
                                        <span className="text-slate-500">BAC:</span>
                                        <br />
                                        <strong>${((p.bac || 0) / 1e6).toFixed(2)}M</strong>
                                    </div>
                                    <div>
                                        <span className="text-slate-500">Status:</span>
                                        <br />
                                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${p.status === 'Active'
                                            ? 'bg-green-100 text-green-600'
                                            : p.status === 'Completed'
                                                ? 'bg-blue-100 text-blue-600'
                                                : 'bg-amber-100 text-amber-600'
                                            }`}>
                                            {p.status}
                                        </span>
                                    </div>
                                    <div>
                                        <span className="text-slate-500">Duration:</span>
                                        <br />
                                        <strong className="text-[10px]">{p.startDate || 'N/A'} - {p.finishDate || 'N/A'}</strong>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setViewingProject(p)}
                                        className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-teal-50 px-3 py-2 text-xs font-semibold text-teal-600 hover:bg-teal-100"
                                        title="View Details"
                                    >
                                        <Icons.Eye className="h-3.5 w-3.5" />
                                        View
                                    </button>
                                    <button
                                        onClick={() => openEdit(p)}
                                        className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200"
                                    >
                                        <Icons.Edit className="h-3.5 w-3.5" />
                                        Edit
                                    </button>
                                    <button
                                        onClick={() => {
                                            if (confirm('Are you sure you want to delete this project? This will also delete all associated reports.')) {
                                                deleteProject(p.id);
                                            }
                                        }}
                                        className="flex items-center justify-center rounded-lg bg-red-50 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-100"
                                    >
                                        <Icons.Delete className="h-3.5 w-3.5" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <ProjectModal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                onSave={handleSave}
                project={editingProject}
            />

            <ViewProjectModal
                isOpen={!!viewingProject}
                onClose={() => setViewingProject(null)}
                project={viewingProject}
            />
        </div>
    );
}
