import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Utility function to merge Tailwind classes
 */
export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

/**
 * Format date to YYYY-MM-DD
 */
export function formatDate(date: Date | string): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toISOString().split('T')[0];
}

/**
 * Format number with commas
 */
export function formatNumber(value: number): string {
    return value.toLocaleString();
}

/**
 * Format percentage
 */
export function formatPercent(value: number, decimals = 2): string {
    return `${value.toFixed(decimals)}%`;
}

/**
 * Format currency (in millions)
 */
export function formatCurrencyM(value: number): string {
    return `$${(value / 1_000_000).toFixed(2)}M`;
}

/**
 * Format large numbers (K/M suffix)
 */
export function formatShortNumber(value: number): string {
    if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
    if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
    return value.toFixed(0);
}
