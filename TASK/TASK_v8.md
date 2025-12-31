TASK
1. sesuaikan dashboard agar sama dengan yang di html file weekly-report-dashboard-v4c.html
2. buat plan untuk ini


ADDITIONAL CONTEXT
Lokasi Render Dashboard
Fungsi renderDashboard() terletak di baris ~1134 dengan kode:

📊 Komponen yang Ditampilkan di Dashboard
Dashboard ini menampilkan 10 section utama:

1. Header Project Information
Nama project
Week number
Periode report
Selector untuk memilih report
2. Project Information Card 🏢
Owner, Contractor, Contract Type, Term of Payment
Contract Price, Start/Finish Date, Duration
Guaranteed Power
LD Rates (Delay & Performance)
Scope by Owner
3. KPI Cards Summary (6 cards) 📈
Overall Progress (%)
SPI (Schedule Performance Index)
CPI (Cost Performance Index)
EAC (Estimate at Completion)
Safe Hours (dengan LTI count)
Cash Flow Status (Health indicator)
4. Schedule & LD Estimation ⏱️
Planned vs Estimated Completion Date
Delay Days calculation
Actual/Forecast Power Output
LD Delay Estimation (berdasarkan delay days)
LD Performance Estimation (berdasarkan power shortfall)
Total LD Estimation (kombinasi keduanya)
5. S-Curve & EVM Section 📉
Grid 2 kolom:

Kiri: S-Curve Progress Chart

Upload image atau auto-generated chart
Menampilkan Baseline vs Actual Progress
Kanan: Cost Performance (EVM)

BCWS, BCWP, ACWP values
SPI & CPI Gauges
EAC Formula Box (Typical, Atypical, Combined, VAC)
6. Cash Flow Performance Dashboard 💵
4 sub-section:

a) Cash Flow Chart (visual bar chart)

Revenue, Cash Out, Billing, Cash In
b) Primary Input Display

Revenue (from BCWP)
Cash Out
Billing
Cash In
c) QR Codes Section

QR Photos
QR Videos
QR Report
d) Cash Flow KPIs (8 indicators):

A. Cash Flow Balance (Cash In - Cash Out)
B. Billing Coverage Ratio (Billing / Revenue)
C. Cash Collection Ratio (Cash In / Billing)
D. Cash Adequacy Ratio (Cash In / Cash Out)
E. Cash Burn Rate (Cash Out / Week)
F. Earned Cash Ratio (Cash In / BCWP)
G. Billing Lag (BCWP - Billing)
H. Cash Gap (Cash Out - Cash In)
Setiap KPI ditampilkan dengan:

Nilai aktual
Status color-coded (green/yellow/red)
Formula/rumus perhitungan
Threshold indicators
7. TKDN Performance Section 🏭
(Hanya muncul jika ada data TKDN)

3 komponen:

TKDN Gauge Chart

Visual semi-circle gauge
Plan vs Actual percentage
Variance calculation
Status indicator (Pass/Monitor/Risk)
TKDN Trend Chart

Line chart Plan vs Actual over time
Gradient area fill
TKDN Info Box

Target Minimum
Realisasi Aktual
Variance
Achievement Rate with progress bar
8. Safety & Quality Summary 🦺
Grid 2 kolom:

Kiri: Safety Pyramid

Lagging indicators (Fatality, LTI, Medical Treatment, First Aid)
Leading indicators (Near Miss, Safety Observation)
Manpower breakdown (Office, Site, Total)
Kanan: Quality Summary

Head Office vs Site Office metrics
AFI (Pass/Total)
NCR Open count
Punch List Open count
Welding Performance (rejection rate dengan status Pass/Warning/Fail)
9. Quality Performance Dashboard 🔍
6 chart components:

a) AFI Status Charts (2 charts: Head Office & Site Office)

Stacked bar per discipline (Process, Mechanical, Piping, Electrical, Instrument, Civil)
Fail, Ongoing, Pass breakdown
b) NCR & Punch Comparison Charts (2 charts: HO & Site)

Bar comparison Open vs Closed
Per discipline breakdown
c) Summary Donut Charts (4 donuts)

HO NCR, HO Punch, Site NCR, Site Punch
Open vs Closed ratio
d) Welding Performance Gauge

Semi-circle gauge dengan color gradient
Accepted vs Rejected count
Rejection rate dengan threshold
Status indicator (Pass/Warning/Fail)
e) Certificate Status

Donut chart distribution
Progress bar (Not Yet Applied, Under Application, Completed)
Total count dengan breakdown percentages
10. EPCC Progress 🏗️
Grid 4 kolom:

Engineering (weight, plan%, actual%, progress bar)
Procurement (weight, plan%, actual%, progress bar)
Construction (weight, plan%, actual%, progress bar)
Commissioning (weight, plan%, actual%, progress bar)
11. Milestones Status 📅
Grid 2 kolom:

Kiri: Schedule Milestones Table

No, Description, Plan Date, Actual/Forecast, Status
Color-coded status badges
Kanan: Payment Milestones Table

No, Description, Plan Date, Actual/Forecast, Status
Color-coded status badges
12. Activities Section 📋
Grid 2 kolom:

Kiri: This Week Activities

Engineering, Procurement, Construction, Pre-commissioning
Bullet list per category
Kanan: Next Week Plan

Engineering, Procurement, Construction, Pre-commissioning
Bullet list per category
