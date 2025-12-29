-- EPC Weekly Report Dashboard - Database Schema
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Projects table
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  owner TEXT,
  contractor TEXT,
  technology_provider TEXT,
  contract_type TEXT,
  term_of_payment TEXT,
  contract_price NUMERIC DEFAULT 0,
  bac NUMERIC DEFAULT 0,
  ld_delay NUMERIC DEFAULT 0,
  ld_performance NUMERIC DEFAULT 0,
  scope_by_owner TEXT,
  start_date DATE,
  finish_date DATE,
  guaranteed_power NUMERIC DEFAULT 0,
  ntp_date DATE,
  cod_date DATE,
  status TEXT DEFAULT 'Active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Weekly Reports table  
CREATE TABLE IF NOT EXISTS reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  week_no INTEGER NOT NULL,
  doc_no TEXT,
  period_start DATE,
  period_end DATE,
  prepared_by TEXT,
  checked_by TEXT,
  approved_by TEXT,
  approval_status TEXT DEFAULT 'Pending',
  status TEXT DEFAULT 'Draft',
  
  -- EVM Data (JSONB)
  evm JSONB DEFAULT '{}',
  
  -- EPCC Progress (JSONB)
  epcc JSONB DEFAULT '{}',
  
  -- Overall Progress (JSONB)  
  overall_progress JSONB DEFAULT '{}',
  
  -- HSE Data (JSONB)
  hse JSONB DEFAULT '{}',
  
  -- Quality Data (JSONB)
  quality JSONB DEFAULT '{}',
  
  -- Cash Flow (JSONB)
  cash_flow JSONB DEFAULT '{}',
  
  -- TKDN (JSONB)
  tkdn JSONB DEFAULT '{}',
  
  -- Activities (JSONB)
  this_week_activities JSONB DEFAULT '{}',
  next_week_plan JSONB DEFAULT '{}',
  
  -- Milestones (JSONB arrays)
  milestones_schedule JSONB DEFAULT '[]',
  milestones_payment JSONB DEFAULT '[]',
  
  -- S-Curve Data (JSONB array)
  s_curve_data JSONB DEFAULT '[]',
  
  -- Uploads (JSONB - store URLs)
  uploads JSONB DEFAULT '{}',
  
  -- Power Output
  actual_forecast_power NUMERIC DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_reports_project_id ON reports(project_id);
CREATE INDEX IF NOT EXISTS idx_reports_week_no ON reports(week_no);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
DROP TRIGGER IF EXISTS update_projects_updated_at ON projects;
CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_reports_updated_at ON reports;
CREATE TRIGGER update_reports_updated_at
  BEFORE UPDATE ON reports
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (but allow all operations for now)
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- Policies to allow all operations (no auth required for this app)
CREATE POLICY "Allow all operations on projects" ON projects FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on reports" ON reports FOR ALL USING (true) WITH CHECK (true);

-- Insert sample project
INSERT INTO projects (name, owner, contractor, technology_provider, contract_type, term_of_payment, contract_price, bac, ld_delay, ld_performance, start_date, finish_date, guaranteed_power, status)
VALUES (
  'SALAK UNIT 7 DEVELOPMENT PROJECT',
  'PT Pertamina Geothermal Energy',
  'PT REKAYASA INDUSTRI',
  'Toshiba Energy Systems',
  'EPC Turnkey',
  'Progress Payment',
  125000000,
  125000000,
  50000,
  1000,
  '2024-02-01',
  '2026-10-01',
  45,
  'Active'
) ON CONFLICT DO NOTHING;

-- Insert sample report (will use the first project's ID)
INSERT INTO reports (
  project_id,
  week_no,
  doc_no,
  period_start,
  period_end,
  status,
  evm,
  overall_progress,
  hse,
  cash_flow,
  tkdn
)
SELECT 
  id,
  52,
  'SEGSK7PMGN00RPW0052',
  '2025-11-22',
  '2025-11-28',
  'Issued',
  '{"bac": 125000000, "bcws": 48987500, "bcwp": 49112500, "acwp": 50125000, "spiValue": 1.003, "cpiValue": 0.98}'::jsonb,
  '{"plan": 39.19, "actual": 39.29, "variance": 0.10}'::jsonb,
  '{"lagging": {"fatality": 0, "lti": 0, "medicalTreatment": 0, "firstAid": 0}, "leading": {"nearMiss": 5, "safetyObservation": 2403}, "manpower": {"office": 122, "siteSubcontractor": 370, "total": 492}, "safeHours": 245000}'::jsonb,
  '{"revenue": 49112500, "cashOut": 45000000, "billing": 47000000, "cashIn": 42000000}'::jsonb,
  '{"plan": 40, "actual": 42.5}'::jsonb
FROM projects
WHERE name = 'SALAK UNIT 7 DEVELOPMENT PROJECT'
LIMIT 1
ON CONFLICT DO NOTHING;
