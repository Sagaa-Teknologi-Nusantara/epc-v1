interface GaugeChartProps {
    value: number;
    label: string;
    color?: string;
}

export function GaugeChart({ value, label, color = '#0d9488' }: GaugeChartProps) {
    return (
        <div className="text-center">
            <svg width="90" height="55" viewBox="0 0 90 55">
                <path
                    d="M 10 50 A 35 35 0 0 1 80 50"
                    fill="none"
                    stroke="#e2e8f0"
                    strokeWidth="7"
                    strokeLinecap="round"
                />
                <path
                    d="M 10 50 A 35 35 0 0 1 80 50"
                    fill="none"
                    stroke={color}
                    strokeWidth="7"
                    strokeLinecap="round"
                    strokeDasharray={`${Math.min(value / 1.5, 1) * 110} 110`}
                />
                <text
                    x="45"
                    y="48"
                    textAnchor="middle"
                    fontSize="13"
                    fontWeight="700"
                    fill="#0f172a"
                >
                    {value.toFixed(2)}
                </text>
            </svg>
            <p className="text-[10px] text-slate-500">{label}</p>
        </div>
    );
}
