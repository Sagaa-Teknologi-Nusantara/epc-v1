import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

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
                technology_provider: body.technologyProvider,
                contract_type: body.contractType,
                term_of_payment: body.termOfPayment,
                contract_price: body.contractPrice,
                bac: body.bac || body.contractPrice,
                ld_delay: body.ldDelay,
                ld_performance: body.ldPerformance,
                scope_by_owner: body.scopeByOwner,
                start_date: body.startDate,
                finish_date: body.finishDate,
                guaranteed_power: body.guaranteedPower,
                ntp_date: body.ntpDate,
                cod_date: body.codDate,
                status: body.status || 'Active',
            }])
            .select()
            .single();

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json(data, { status: 201 });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to create project' }, { status: 500 });
    }
}
