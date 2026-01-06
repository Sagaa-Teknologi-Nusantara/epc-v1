import type { CashFlowData } from '@/types';

/**
 * Calculate Cash Flow Performance KPIs
 * @param revenue - BCWP (Earned Value)
 * @param cashOut - Total cash outflow
 * @param billing - Total billing amount
 * @param cashIn - Total cash inflow
 * @param weekNo - Current week number for burn rate calculation
 * @returns Complete cash flow metrics
 */
export function calculateCashFlowPerformance(
    revenue: number,
    cashOut: number,
    billing: number,
    cashIn: number,
    weekNo: number = 1
): CashFlowData {
    // A. Cash Flow Balance = Cash In - Cash Out
    const cashFlowBalance = cashIn - cashOut;

    // B. Billing Coverage Ratio = Billing / Revenue (BCWP)
    const billingCoverageRatio = revenue > 0 ? billing / revenue : 0;

    // C. Cash Collection Ratio = Cash In / Billing
    const cashCollectionRatio = billing > 0 ? cashIn / billing : 0;

    // D. Cash Adequacy Ratio = Cash In / Cash Out
    const cashAdequacyRatio = cashOut > 0 ? cashIn / cashOut : 0;

    // E. Cash Burn Rate = Cash Out / Period (weeks)
    const cashBurnRate = weekNo > 0 ? cashOut / weekNo : 0;

    // F. Earned Cash Ratio (ECR) = Cash In / BCWP
    const earnedCashRatio = revenue > 0 ? cashIn / revenue : 0;

    // G. Billing Lag = BCWP - Billing
    const billingLag = revenue - billing;

    // H. Cash Gap = Cash Out - Cash In
    const cashGap = cashOut - cashIn;

    // Calculate Overall Score
    const scores: number[] = [];

    // Cash Flow Balance: >=0 is green
    scores.push(cashFlowBalance >= 0 ? 1 : 0);

    // Billing Coverage: >=0.95 is green, >=0.85 yellow
    scores.push(billingCoverageRatio >= 0.95 ? 1 : billingCoverageRatio >= 0.85 ? 0.5 : 0);

    // Collection Ratio: >=0.9 is green, >=0.8 yellow
    scores.push(cashCollectionRatio >= 0.9 ? 1 : cashCollectionRatio >= 0.8 ? 0.5 : 0);

    // Cash Adequacy: >=1.0 is green, >=0.9 yellow
    scores.push(cashAdequacyRatio >= 1.0 ? 1 : cashAdequacyRatio >= 0.9 ? 0.5 : 0);

    const overallScore = scores.reduce((a, b) => a + b, 0) / scores.length;
    const overallStatus: 'green' | 'yellow' | 'red' =
        overallScore >= 0.75 ? 'green' : overallScore >= 0.5 ? 'yellow' : 'red';

    return {
        revenue,
        cashOut,
        billing,
        cashIn,
        weekNo,
        cashFlowBalance,
        billingCoverageRatio,
        cashCollectionRatio,
        cashAdequacyRatio,
        cashBurnRate,
        earnedCashRatio,
        billingLag,
        cashGap,
        overallScore,
        overallStatus,
    };
}

/**
 * Get indicator status based on value and thresholds
 */
export function getIndicatorStatus(
    value: number,
    thresholds: { green: number; yellow: number },
    inverse: boolean = false
): { status: 'green' | 'yellow' | 'red'; emoji: string } {
    let status: 'green' | 'yellow' | 'red';

    if (inverse) {
        status = value <= thresholds.green ? 'green' : value <= thresholds.yellow ? 'yellow' : 'red';
    } else {
        status = value >= thresholds.green ? 'green' : value >= thresholds.yellow ? 'yellow' : 'red';
    }

    const emoji = status === 'green' ? '🟢' : status === 'yellow' ? '🔴' : '🔴';

    return { status, emoji };
}

/**
 * Calculate Cash Flow status from a cashFlow data object (for quick status check)
 * @param cashFlow - Cash flow data object from report
 * @param bcwp - BCWP (Earned Value) as fallback for revenue
 * @returns Status object with overallScore and overallStatus
 */
export function calculateCashFlowStatus(
    cashFlow: Record<string, number> | undefined | null,
    bcwp: number = 0
): { overallScore: number; overallStatus: 'green' | 'yellow' | 'red' } {
    const cashIn = cashFlow?.cashIn || 0;
    const cashOut = cashFlow?.cashOut || 0;
    const billing = cashFlow?.billing || 0;
    const revenue = cashFlow?.revenue || bcwp || 1;

    // Calculate individual scores (same logic as calculateCashFlowPerformance)
    const balanceOk = cashIn >= cashOut ? 1 : 0;
    const billingCoverage = revenue > 0 ? billing / revenue : 0;
    const billingOk = billingCoverage >= 0.95 ? 1 : billingCoverage >= 0.85 ? 0.5 : 0;
    const collectionRatio = billing > 0 ? cashIn / billing : 0;
    const collectionOk = collectionRatio >= 0.9 ? 1 : collectionRatio >= 0.8 ? 0.5 : 0;
    const adequacyRatio = cashOut > 0 ? cashIn / cashOut : 0;
    const adequacyOk = adequacyRatio >= 1.0 ? 1 : adequacyRatio >= 0.9 ? 0.5 : 0;

    const overallScore = (balanceOk + billingOk + collectionOk + adequacyOk) / 4;
    const overallStatus: 'green' | 'yellow' | 'red' =
        overallScore >= 0.75 ? 'green' : overallScore >= 0.5 ? 'yellow' : 'red';

    return { overallScore, overallStatus };
}
