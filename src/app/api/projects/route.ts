import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

// Helper to convert empty strings to null for database
const nullIfEmpty = (value: unknown) => {
    if (value === '' || value === undefined) return null;
    return value;
};

// GET all projects
export async function GET() {
    try {
        const supabase = await createClient();

        const { data, error } = await supabase
            .from('projects')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json(data);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch projects' }, { status: 500 });
    }
}

// POST create a new project
export async function POST(request: Request) {
    try {
        const supabase = await createClient();
        const body = await request.json();

        const { data, error } = await supabase
            .from('projects')
            .insert([{
                name: body.name,
                owner: body.owner,
                contractor: body.contractor,
                technology_provider: nullIfEmpty(body.technologyProvider),
                contract_type: nullIfEmpty(body.contractType),
                term_of_payment: nullIfEmpty(body.termOfPayment),
                contract_price: nullIfEmpty(body.contractPrice),
                bac: nullIfEmpty(body.bac) || nullIfEmpty(body.contractPrice),
                ld_delay: nullIfEmpty(body.ldDelay),
                ld_performance: nullIfEmpty(body.ldPerformance),
                scope_by_owner: nullIfEmpty(body.scopeByOwner),
                start_date: nullIfEmpty(body.startDate),
                finish_date: nullIfEmpty(body.finishDate),
                guaranteed_power: nullIfEmpty(body.guaranteedPower),
                ntp_date: nullIfEmpty(body.ntpDate),
                cod_date: nullIfEmpty(body.codDate),
                status: body.status || 'Active',
            }])
            .select()
            .single();

        if (error) {
            console.error('Supabase error:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json(data, { status: 201 });
    } catch (error) {
        console.error('Create project error:', error);
        return NextResponse.json({ error: 'Failed to create project' }, { status: 500 });
    }
}

