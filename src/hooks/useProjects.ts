'use client';

import { useState, useEffect, useCallback } from 'react';
import type { Project } from '@/types';

export function useProjects() {
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchProjects = useCallback(async () => {
        try {
            setLoading(true);
            const response = await fetch('/api/projects');
            if (!response.ok) throw new Error('Failed to fetch projects');
            const data = await response.json();

            // Transform snake_case to camelCase
            const transformed = data.map((p: Record<string, unknown>) => ({
                id: p.id,
                name: p.name,
                owner: p.owner,
                contractor: p.contractor,
                technologyProvider: p.technology_provider,
                contractType: p.contract_type,
                termOfPayment: p.term_of_payment,
                contractPrice: p.contract_price,
                bac: p.bac,
                ldDelay: p.ld_delay,
                ldPerformance: p.ld_performance,
                scopeByOwner: p.scope_by_owner,
                startDate: p.start_date,
                finishDate: p.finish_date,
                guaranteedPower: p.guaranteed_power,
                ntpDate: p.ntp_date,
                codDate: p.cod_date,
                status: p.status,
                createdAt: p.created_at,
                updatedAt: p.updated_at,
            }));

            setProjects(transformed);
            setError(null);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unknown error');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchProjects();
    }, [fetchProjects]);

    const createProject = async (project: Partial<Project>) => {
        const response = await fetch('/api/projects', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(project),
        });
        if (!response.ok) throw new Error('Failed to create project');
        await fetchProjects();
        return response.json();
    };

    const updateProject = async (id: string, project: Partial<Project>) => {
        const response = await fetch(`/api/projects/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(project),
        });
        if (!response.ok) throw new Error('Failed to update project');
        await fetchProjects();
        return response.json();
    };

    const deleteProject = async (id: string) => {
        const response = await fetch(`/api/projects/${id}`, {
            method: 'DELETE',
        });
        if (!response.ok) throw new Error('Failed to delete project');
        await fetchProjects();
    };

    return {
        projects,
        loading,
        error,
        fetchProjects,
        createProject,
        updateProject,
        deleteProject,
    };
}
