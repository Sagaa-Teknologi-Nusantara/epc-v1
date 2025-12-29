// EVM (Earned Value Management) Data
export interface EVMData {
    bac: number;
    bcws: number; // Budgeted Cost of Work Scheduled (Planned Value)
    bcwp: number; // Budgeted Cost of Work Performed (Earned Value)
    acwp: number; // Actual Cost of Work Performed
    spiValue: number; // Schedule Performance Index
    cpiValue: number; // Cost Performance Index
    sv: number; // Schedule Variance
    cv: number; // Cost Variance
    eac: number; // Estimate at Completion
    eacTypical: number;
    eacAtypical: number;
    eacCombined: number;
    vac: number; // Variance at Completion
}

// EPCC Progress
export interface EPCCCategory {
    weight: number;
    plan: number;
    actual: number;
}

export interface EPCCProgress {
    engineering: EPCCCategory;
    procurement: EPCCCategory;
    construction: EPCCCategory;
    commissioning: EPCCCategory;
}

// Overall Progress
export interface OverallProgress {
    plan: number;
    actual: number;
    variance: number;
}

// HSE (Health, Safety, Environment)
export interface LaggingIndicators {
    fatality: number;
    lti: number; // Lost Time Injury
    medicalTreatment: number;
    firstAid: number;
}

export interface LeadingIndicators {
    nearMiss: number;
    safetyObservation: number;
    hsseInspection: number;
    hsseTraining: number;
}

export interface Manpower {
    office: number;
    siteSubcontractor: number;
    total: number;
}

export interface HSEData {
    lagging: LaggingIndicators;
    leading: LeadingIndicators;
    manpower: Manpower;
    safeHours: number;
    trir: number;
}

// Quality Data
export interface AFIData {
    fail: number;
    ongoing: number;
    pass: number;
}

export interface NCRData {
    open: number;
    closed: number;
}

export interface QualityDiscipline {
    process: AFIData | NCRData;
    mechanical: AFIData | NCRData;
    piping: AFIData | NCRData;
    electrical: AFIData | NCRData;
    instrument: AFIData | NCRData;
    civil: AFIData | NCRData;
}

export interface NCRTypes {
    ownerToContractor: Record<string, NCRData>;
    contractorToVendor: Record<string, NCRData>;
}

export interface WeldingData {
    ndtAccepted: number;
    ndtRejected: number;
    rejectionRatePlan: number;
}

export interface CertificateData {
    notYetApplied: number;
    underApplication: number;
    completed: number;
}

export interface QualityOffice {
    afi: Record<string, AFIData>;
    ncr: NCRTypes;
    punchList: NCRTypes;
    welding?: WeldingData;
}

export interface QualityData {
    headOffice: QualityOffice;
    siteOffice: QualityOffice & { welding: WeldingData };
    certificate: CertificateData;
}

// Cash Flow
export interface CashFlowData {
    revenue: number;
    cashOut: number;
    billing: number;
    cashIn: number;
    weekNo: number;
    cashFlowBalance: number;
    billingCoverageRatio: number;
    cashCollectionRatio: number;
    cashAdequacyRatio: number;
    cashBurnRate: number;
    earnedCashRatio: number;
    billingLag: number;
    cashGap: number;
    overallScore: number;
    overallStatus: 'green' | 'yellow' | 'red';
}

// TKDN (Tingkat Komponen Dalam Negeri)
export interface TKDNData {
    plan: number;
    actual: number;
}

// Activities
export interface Activities {
    engineering: string[];
    procurement: string[];
    construction: string[];
    precommissioning: string[];
}

// Milestones
export interface Milestone {
    no: number;
    description: string;
    planDate: string;
    actualForecastDate: string;
    status: 'Completed' | 'On Track' | 'At Risk' | 'Delayed' | 'Critical' | 'Pending' | 'Overdue';
}

// S-Curve Data Point
export interface SCurveDataPoint {
    week: string;
    baseline: number;
    actual: number;
}

// Uploads
export interface UploadFile {
    name: string;
    data: string;
}

export interface Uploads {
    sCurveGeneral?: UploadFile;
    sCurveEngineering?: UploadFile;
    sCurveProcurement?: UploadFile;
    sCurveConstruction?: UploadFile;
    sCurveCommissioning?: UploadFile;
    cashFlow?: UploadFile;
    qrPhotos?: UploadFile;
    qrVideos?: UploadFile;
    qrReport?: UploadFile;
}

// Weekly Report
export interface Report {
    id: string;
    projectId: string;
    weekNo: number;
    docNo: string;
    periodStart: string;
    periodEnd: string;
    preparedBy: string;
    checkedBy: string;
    approvedBy: string;
    approvalStatus: 'Pending' | 'Under Review' | 'Approved' | 'Rejected' | 'Revision Required';
    status: 'Draft' | 'Issued';

    evm: EVMData;
    epcc: EPCCProgress;
    overallProgress: OverallProgress;
    hse: HSEData;
    quality: QualityData;
    cashFlow: CashFlowData;
    tkdn: TKDNData;

    thisWeekActivities: Activities;
    nextWeekPlan: Activities;

    milestonesSchedule: Milestone[];
    milestonesPayment: Milestone[];

    sCurveData: SCurveDataPoint[];

    actualForecastPower: number;

    uploads: Uploads;

    createdAt?: string;
    updatedAt?: string;
}

export interface ReportFormData extends Partial<Report> { }

// Trend Data Types
export interface ScheduleTrendData {
    week: string;
    spi: number;
    planProgress: number;
    actualProgress: number;
    variance: number;
}

export interface CostTrendData {
    week: string;
    cpi: number;
    bcws: number;
    bcwp: number;
    acwp: number;
    cv: number;
}

export interface CashFlowTrendData {
    week: string;
    cashIn: number;
    cashOut: number;
    billing: number;
    balance: number;
}

export interface SafetyTrendData {
    week: string;
    trir: number;
    nearMiss: number;
    observations: number;
    safeHours: number;
    manpower: number;
}

export interface QualityTrendData {
    week: string;
    ncrOpen: number;
    ncrClosed: number;
    punchOpen: number;
    punchClosed: number;
    weldRejectRate: number;
    certCompleted: number;
}

export interface TKDNTrendData {
    week: string;
    plan: number;
    actual: number;
}

export interface TrendData {
    schedule: ScheduleTrendData[];
    cost: CostTrendData[];
    cashFlow: CashFlowTrendData[];
    safety: SafetyTrendData[];
    quality: QualityTrendData[];
    tkdn: TKDNTrendData[];
}

// Risk
export interface Risk {
    category: string;
    level: 'Low' | 'Medium' | 'High' | 'Critical';
    description: string;
    recommendation: string;
}
