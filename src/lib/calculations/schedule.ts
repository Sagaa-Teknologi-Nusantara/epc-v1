/**
 * Calculate schedule duration in days
 */
export function calculateScheduleDuration(
    startDate: string | undefined,
    finishDate: string | undefined
): number {
    if (!startDate || !finishDate) return 0;
    const start = new Date(startDate);
    const finish = new Date(finishDate);
    const diffTime = Math.abs(finish.getTime() - start.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Calculate estimated completion date based on SPI
 */
export function calculateEstimatedCompletion(
    startDate: string | undefined,
    finishDate: string | undefined,
    spi: number | undefined,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _actualProgress?: number
): string {
    if (!startDate || !finishDate || !spi || spi <= 0) return finishDate || '';

    const start = new Date(startDate);
    const finish = new Date(finishDate);
    const totalDuration = Math.ceil((finish.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    const estimatedDuration = Math.ceil(totalDuration / spi);
    const estimatedDate = new Date(start);
    estimatedDate.setDate(estimatedDate.getDate() + estimatedDuration);

    return estimatedDate.toISOString().split('T')[0];
}

/**
 * Calculate delay days between finish date and estimated date
 */
export function calculateDelayDays(
    finishDate: string | undefined,
    estimatedDate: string | undefined
): number {
    if (!finishDate || !estimatedDate) return 0;

    const finish = new Date(finishDate);
    const estimated = new Date(estimatedDate);
    const diffTime = estimated.getTime() - finish.getTime();
    const delayDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return delayDays > 0 ? delayDays : 0;
}

/**
 * Calculate Liquidated Damages for delay
 */
export function calculateLDDelay(
    delayDays: number,
    ldDelayRate: number = 0
): number {
    return delayDays * ldDelayRate;
}

/**
 * Calculate Liquidated Damages for performance shortfall
 */
export function calculateLDPerformance(
    guaranteedPower: number | undefined,
    actualPower: number | undefined,
    ldPerformanceRate: number = 0
): number {
    if (!guaranteedPower || !actualPower || actualPower >= guaranteedPower) return 0;

    // Convert MW difference to kW
    const powerShortfall = (guaranteedPower - actualPower) * 1000;
    return powerShortfall * ldPerformanceRate;
}
