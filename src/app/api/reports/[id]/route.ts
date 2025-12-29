import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

// GET single report
export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const supabase = await createClient();
        const { id } = await params;

        const { data, error } = await supabase
            .from('reports')
            .select('*')
            .eq('id', id)
            .single();

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 404 });
        }

        return NextResponse.json(data);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch report' }, { status: 500 });
    }
}

// PUT update report
export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const supabase = await createClient();
        const { id } = await params;
        const body = await request.json();

        const { data, error } = await supabase
            .from('reports')
            .update({
                week_no: body.weekNo,
                doc_no: body.docNo,
                period_start: body.periodStart,
                period_end: body.periodEnd,
                prepared_by: body.preparedBy,
                checked_by: body.checkedBy,
                approved_by: body.approvedBy,
                approval_status: body.approvalStatus,
                status: body.status,
                evm: body.evm,
                epcc: body.epcc,
                overall_progress: body.overallProgress,
                hse: body.hse,
                quality: body.quality,
                cash_flow: body.cashFlow,
                tkdn: body.tkdn,
                this_week_activities: body.thisWeekActivities,
                next_week_plan: body.nextWeekPlan,
                milestones_schedule: body.milestonesSchedule,
                milestones_payment: body.milestonesPayment,
                s_curve_data: body.sCurveData,
                uploads: body.uploads,
                actual_forecast_power: body.actualForecastPower,
            })
            .eq('id', id)
            .select()
            .single();

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json(data);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to update report' }, { status: 500 });
    }
}

// DELETE report
export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const supabase = await createClient();
        const { id } = await params;

        const { error } = await supabase
            .from('reports')
            .delete()
            .eq('id', id);

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to delete report' }, { status: 500 });
    }
}
