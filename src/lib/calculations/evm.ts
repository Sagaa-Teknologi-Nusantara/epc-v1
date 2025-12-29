import type { EVMData } from '@/types';

/**
 * Calculate EVM metrics from basic inputs
 * @param bcws - Budgeted Cost of Work Scheduled (Planned Value)
 * @param bcwp - Budgeted Cost of Work Performed (Earned Value)
 * @param acwp - Actual Cost of Work Performed
 * @param bac - Budget at Completion
 * @returns Calculated EVM metrics
 */
export function calculateEVM(
    bcws: number,
    bcwp: number,
    acwp: number,
    bac: number
): Partial<EVMData> {
    // Schedule Performance Index: BCWP / BCWS
    const spiValue = bcws > 0 ? bcwp / bcws : 0;

    // Cost Performance Index: BCWP / ACWP
    const cpiValue = acwp > 0 ? bcwp / acwp : 0;

    // Schedule Variance: BCWP - BCWS
    const sv = bcwp - bcws;

    // Cost Variance: BCWP - ACWP
    const cv = bcwp - acwp;

    // EAC (Typical): BAC / CPI - assumes current CPI continues
    const eacTypical = cpiValue > 0 ? bac / cpiValue : 0;

    // EAC (Atypical): ACWP + (BAC - BCWP) - assumes original estimates remain valid
    const eacAtypical = acwp + (bac - bcwp);

    // EAC (Combined): ACWP + (BAC - BCWP) / (CPI * SPI)
    const eacCombined = cpiValue > 0 && spiValue > 0
        ? acwp + (bac - bcwp) / (cpiValue * spiValue)
        : 0;

    // Variance at Completion: BAC - EAC
    const vac = bac - eacTypical;

    return {
        bac,
        bcws,
        bcwp,
        acwp,
        spiValue,
        cpiValue,
        sv,
        cv,
        eac: eacTypical,
        eacTypical,
        eacAtypical,
        eacCombined,
        vac,
    };
}

/**
 * Get SPI status indicator
 */
export function getSPIStatus(spi: number): { status: string; color: string } {
    if (spi >= 1.0) return { status: 'On Schedule', color: '#16a34a' };
    if (spi >= 0.95) return { status: 'Slightly Behind', color: '#f59e0b' };
    return { status: 'Behind Schedule', color: '#dc2626' };
}

/**
 * Get CPI status indicator
 */
export function getCPIStatus(cpi: number): { status: string; color: string } {
    if (cpi >= 1.0) return { status: 'Under Budget', color: '#16a34a' };
    if (cpi >= 0.95) return { status: 'Slightly Over', color: '#f59e0b' };
    return { status: 'Over Budget', color: '#dc2626' };
}

/**
 * Format currency value
 */
export function formatCurrency(value: number, inMillions = true): string {
    if (inMillions) {
        return `$${(value / 1_000_000).toFixed(2)}M`;
    }
    return `$${value.toLocaleString()}`;
}
