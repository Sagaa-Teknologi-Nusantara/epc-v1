// Seed data generator for EPC Dashboard
// Creates sample projects and weekly reports

import { createClient } from '@/lib/supabase/client';

export interface SeedProject {
    name: string;
    owner: string;
    contractor: string;
    contractType: string;
    contractPrice: number;
    bac: number;
    ldDelay: number;
    ldPerformance: number;
    startDate: string;
    finishDate: string;
    guaranteedPower: number;
    status: string;
    ntpDate: string;
    codDate: string;
    termOfPayment: string;
    scopeByOwner: string;
}

export interface SeedReport {
    projectId: string;
    weekNo: number;
    periodStart: string;
    periodEnd: string;
    status: string;
    approvalStatus: string;
    evm: {
        bac: number;
        bcws: number;
        bcwp: number;
        acwp: number;
        spiValue: number;
        cpiValue: number;
        eac?: number;
        vac?: number;
    };
    overallProgress: {
        plan: number;
        actual: number;
        variance: number;
    };
    epcc?: {
        engineering: { plan: number; actual: number };
        procurement: { plan: number; actual: number };
        construction: { plan: number; actual: number };
        commissioning: { plan: number; actual: number };
    };
    hse: {
        lagging: { fatality: number; lti: number; medicalTreatment: number; firstAid: number };
        leading: { nearMiss: number; safetyObservation: number; hsseInspection: number; hsseTraining: number };
        manpower: { office: number; siteSubcontractor: number; total: number };
        safeHours: number;
        trir: number;
    };
    cashFlow: {
        cashOut: number;
        billing: number;
        cashIn: number;
    };
    tkdn: {
        plan: number;
        actual: number;
    };
}

// Sample projects data
const sampleProjects: SeedProject[] = [
    {
        name: 'Solar Power Plant Jawa Barat',
        owner: 'PLN Nusantara Power',
        contractor: 'Rekayasa Engineering',
        contractType: 'Lump Sum',
        contractPrice: 125000000,
        bac: 125000000,
        ldDelay: 50000,
        ldPerformance: 1000,
        startDate: '2024-01-15',
        finishDate: '2025-06-30',
        guaranteedPower: 50,
        status: 'Active',
        ntpDate: '2024-01-15',
        codDate: '2025-06-30',
        termOfPayment: 'Progress Payment',
        scopeByOwner: 'Site preparation, access road, temporary facilities, grid connection'
    },
    {
        name: 'Gas Processing Facility Sumatra',
        owner: 'Pertamina EP',
        contractor: 'Tripatra Engineering',
        contractType: 'Lump Sum Turn Key',
        contractPrice: 280000000,
        bac: 280000000,
        ldDelay: 100000,
        ldPerformance: 2000,
        startDate: '2024-03-01',
        finishDate: '2026-02-28',
        guaranteedPower: 100,
        status: 'Active',
        ntpDate: '2024-03-01',
        codDate: '2026-02-28',
        termOfPayment: 'Progress Payment & Milestone',
        scopeByOwner: 'Land acquisition, utilities connection, environmental permits'
    },
    {
        name: 'Geothermal Plant Sulawesi',
        owner: 'Star Energy',
        contractor: 'Wijaya Karya',
        contractType: 'EPC',
        contractPrice: 180000000,
        bac: 180000000,
        ldDelay: 75000,
        ldPerformance: 1500,
        startDate: '2024-05-01',
        finishDate: '2025-12-31',
        guaranteedPower: 70,
        status: 'Active',
        ntpDate: '2024-05-01',
        codDate: '2025-12-31',
        termOfPayment: 'Milestone',
        scopeByOwner: 'Wellhead facilities, steam pipelines'
    }
];

// Generate weekly reports for a project
function generateReportsForProject(projectId: string, projectIndex: number): SeedReport[] {
    const reports: SeedReport[] = [];
    const baseDate = new Date('2024-01-01');

    for (let week = 1; week <= 3; week++) {
        const weekStart = new Date(baseDate);
        weekStart.setDate(weekStart.getDate() + (week - 1) * 7 + projectIndex * 7);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 6);

        // Progressive data - improves over weeks
        const progressMultiplier = 1 + (week - 1) * 0.15;
        const planProgress = 10 + week * 8 + projectIndex * 5;
        const actualProgress = planProgress * (0.9 + Math.random() * 0.2);

        const bac = sampleProjects[projectIndex].bac;
        const bcws = bac * (planProgress / 100);
        const bcwp = bac * (actualProgress / 100);
        const acwp = bcwp * (0.95 + Math.random() * 0.1);

        const spi = bcwp / bcws;
        const cpi = bcwp / acwp;

        reports.push({
            projectId,
            weekNo: week + projectIndex * 3,
            periodStart: weekStart.toISOString().split('T')[0],
            periodEnd: weekEnd.toISOString().split('T')[0],
            status: week === 3 ? 'Issued' : 'Draft',
            approvalStatus: week === 3 ? 'Approved' : 'Pending',
            evm: {
                bac,
                bcws,
                bcwp,
                acwp,
                spiValue: Number(spi.toFixed(3)),
                cpiValue: Number(cpi.toFixed(3)),
                eac: bac / cpi,
                vac: bac - (bac / cpi)
            },
            overallProgress: {
                plan: Number(planProgress.toFixed(2)),
                actual: Number(actualProgress.toFixed(2)),
                variance: Number((actualProgress - planProgress).toFixed(2))
            },
            epcc: {
                engineering: {
                    plan: Math.min(100, 20 + week * 15 + projectIndex * 5),
                    actual: Math.min(100, 18 + week * 14 + projectIndex * 5)
                },
                procurement: {
                    plan: Math.min(100, 10 + week * 12 + projectIndex * 3),
                    actual: Math.min(100, 9 + week * 11 + projectIndex * 3)
                },
                construction: {
                    plan: Math.min(100, 5 + week * 8 + projectIndex * 2),
                    actual: Math.min(100, 4 + week * 7 + projectIndex * 2)
                },
                commissioning: {
                    plan: Math.min(100, week * 2),
                    actual: Math.min(100, week * 1.5)
                }
            },
            hse: {
                lagging: {
                    fatality: 0,
                    lti: 0,
                    medicalTreatment: week === 2 ? 1 : 0,
                    firstAid: week
                },
                leading: {
                    nearMiss: 2 + week,
                    safetyObservation: 15 + week * 5,
                    hsseInspection: 8 + week * 2,
                    hsseTraining: 4 + week
                },
                manpower: {
                    office: 25 + projectIndex * 5,
                    siteSubcontractor: 150 + week * 20 + projectIndex * 30,
                    total: 175 + week * 20 + projectIndex * 35
                },
                safeHours: (50000 + week * 15000 + projectIndex * 10000),
                trir: Number((0.5 + Math.random() * 0.3).toFixed(2))
            },
            cashFlow: {
                cashOut: bcwp * 0.9,
                billing: bcwp * 0.95,
                cashIn: bcwp * 0.8
            },
            tkdn: {
                plan: 40 + projectIndex * 5,
                actual: Number((38 + projectIndex * 5 + week * 1.5).toFixed(1))
            }
        });
    }

    return reports;
}

// Main seed function
export async function seedDatabase(): Promise<{ success: boolean; message: string; projectCount: number; reportCount: number }> {
    const supabase = createClient();

    try {
        // Clear existing data (optional - careful in production!)
        await supabase.from('reports').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        await supabase.from('projects').delete().neq('id', '00000000-0000-0000-0000-000000000000');

        const createdProjects: string[] = [];
        let totalReports = 0;

        // Insert projects
        for (let i = 0; i < sampleProjects.length; i++) {
            const project = sampleProjects[i];
            const { data: insertedProject, error: projectError } = await supabase
                .from('projects')
                .insert({
                    name: project.name,
                    owner: project.owner,
                    contractor: project.contractor,
                    contract_type: project.contractType,
                    contract_price: project.contractPrice,
                    bac: project.bac,
                    ld_delay: project.ldDelay,
                    ld_performance: project.ldPerformance,
                    start_date: project.startDate,
                    finish_date: project.finishDate,
                    guaranteed_power: project.guaranteedPower,
                    status: project.status,
                    ntp_date: project.ntpDate,
                    cod_date: project.codDate,
                    term_of_payment: project.termOfPayment,
                    scope_by_owner: project.scopeByOwner
                })
                .select()
                .single();

            if (projectError) {
                console.error('Error inserting project:', projectError);
                throw projectError;
            }

            createdProjects.push(insertedProject.id);

            // Generate and insert reports for this project
            const reports = generateReportsForProject(insertedProject.id, i);

            for (const report of reports) {
                const { error: reportError } = await supabase
                    .from('reports')
                    .insert({
                        project_id: report.projectId,
                        week_no: report.weekNo,
                        period_start: report.periodStart,
                        period_end: report.periodEnd,
                        status: report.status,
                        approval_status: report.approvalStatus,
                        evm: report.evm,
                        overall_progress: report.overallProgress,
                        epcc: report.epcc,
                        hse: report.hse,
                        cash_flow: report.cashFlow,
                        tkdn: report.tkdn
                    });

                if (reportError) {
                    console.error('Error inserting report:', reportError);
                    throw reportError;
                }

                totalReports++;
            }
        }

        return {
            success: true,
            message: `Successfully seeded database with ${createdProjects.length} projects and ${totalReports} reports`,
            projectCount: createdProjects.length,
            reportCount: totalReports
        };
    } catch (error) {
        console.error('Seed error:', error);
        return {
            success: false,
            message: error instanceof Error ? error.message : 'Unknown error during seeding',
            projectCount: 0,
            reportCount: 0
        };
    }
}
