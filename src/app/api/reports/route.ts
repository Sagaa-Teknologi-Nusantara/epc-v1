import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

// GET all reports (with optional project filter and summary mode)
export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");
    const summary = searchParams.get("summary") === "true";

    // Summary mode: fetch only fields needed for list display
    const selectFields = summary
      ? "id, project_id, week_no, doc_no, status, cash_flow"
      : "*";

    let query = supabase
      .from("reports")
      .select(selectFields)
      .order("week_no", { ascending: false });

    if (projectId) {
      query = query.eq("project_id", projectId);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch reports" },
      { status: 500 }
    );
  }
}

// POST create a new report
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const body = await request.json();

    const { data, error } = await supabase
      .from("reports")
      .insert([
        {
          project_id: body.projectId,
          week_no: body.weekNo,
          doc_no: body.docNo,
          period_start: body.periodStart,
          period_end: body.periodEnd,
          prepared_by: body.preparedBy,
          checked_by: body.checkedBy,
          approved_by: body.approvedBy,
          approval_status: body.approvalStatus || "Pending",
          status: body.status || "Draft",
          evm: body.evm || {},
          epcc: body.epcc || {},
          overall_progress: body.overallProgress || {},
          hse: body.hse || {},
          quality: body.quality || {},
          cash_flow: body.cashFlow || {},
          tkdn: body.tkdn || {},
          this_week_activities: body.thisWeekActivities || {},
          next_week_plan: body.nextWeekPlan || {},
          milestones_schedule: body.milestonesSchedule || [],
          milestones_payment: body.milestonesPayment || [],
          s_curve_data: body.sCurveData || [],
          uploads: body.uploads || {},
          actual_forecast_power: body.actualForecastPower || 0,
        },
      ])
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to create report" },
      { status: 500 }
    );
  }
}
