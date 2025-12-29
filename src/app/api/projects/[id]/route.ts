import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

// Helper to convert empty strings to null for database
const nullIfEmpty = (value: unknown) => {
    if (value === '' || value === undefined) return null;
    return value;
};

// GET single project
export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const supabase = await createClient();
        const { id } = await params;

        const { data, error } = await supabase
            .from('projects')
            .select('*')
            .eq('id', id)
            .single();

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 404 });
        }

        return NextResponse.json(data);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch project' }, { status: 500 });
    }
}

// PUT update project
export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const supabase = await createClient();
        const { id } = await params;
        const body = await request.json();

        const { data, error } = await supabase
            .from('projects')
            .update({
                name: body.name,
                owner: body.owner,
                contractor: body.contractor,
                technology_provider: nullIfEmpty(body.technologyProvider),
                contract_type: nullIfEmpty(body.contractType),
                term_of_payment: nullIfEmpty(body.termOfPayment),
                contract_price: nullIfEmpty(body.contractPrice),
                bac: nullIfEmpty(body.bac),
                ld_delay: nullIfEmpty(body.ldDelay),
                ld_performance: nullIfEmpty(body.ldPerformance),
                scope_by_owner: nullIfEmpty(body.scopeByOwner),
                start_date: nullIfEmpty(body.startDate),
                finish_date: nullIfEmpty(body.finishDate),
                guaranteed_power: nullIfEmpty(body.guaranteedPower),
                ntp_date: nullIfEmpty(body.ntpDate),
                cod_date: nullIfEmpty(body.codDate),
                status: body.status,
            })
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error('Supabase update error:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json(data);
    } catch (error) {
        console.error('Update project error:', error);
        return NextResponse.json({ error: 'Failed to update project' }, { status: 500 });
    }
}

// DELETE project
export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const supabase = await createClient();
        const { id } = await params;

        const { error } = await supabase
            .from('projects')
            .delete()
            .eq('id', id);

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to delete project' }, { status: 500 });
    }
}
