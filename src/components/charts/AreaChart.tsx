interface SCurveDataPoint {
    week: string;
    baseline: number;
    actual: number;
}

interface AreaChartProps {
    data: SCurveDataPoint[];
    height?: number;
}

export function AreaChart({ data, height = 180 }: AreaChartProps) {
    if (!data || data.length === 0) {
        return (
            <div className="text-center text-slate-400 p-8">No data</div>
        );
    }

    const w = 100;
    const p = { top: 20, right: 10, bottom: 25, left: 12 };
    const cW = w - p.left - p.right;
    const cH = height - p.top - p.bottom;

    const maxV = Math.max(...data.flatMap(d => [d.baseline || 0, d.actual || 0]), 100);

    const getX = (i: number) => p.left + (i / Math.max(data.length - 1, 1)) * cW;
    const getY = (v: number) => p.top + cH - (v / maxV) * cH;

    const actualPath = data
        .map((d, i) => `${i === 0 ? 'M' : 'L'}${getX(i)},${getY(d.actual || 0)}`)
        .join(' ');
    const baselinePath = data
        .map((d, i) => `${i === 0 ? 'M' : 'L'}${getX(i)},${getY(d.baseline || 0)}`)
        .join(' ');
    const actualArea = `${actualPath} L${getX(data.length - 1)},${p.top + cH} L${p.left},${p.top + cH} Z`;

    return (
        <svg viewBox={`0 0 ${w} ${height}`} className="w-full" style={{ height }}>
            <defs>
                <linearGradient id="aG" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#0d9488" stopOpacity="0.4" />
                    <stop offset="100%" stopColor="#0d9488" stopOpacity="0" />
                </linearGradient>
            </defs>
            {[0, 25, 50, 75, 100].map(v => (
                <g key={v}>
                    <line
                        x1={p.left}
                        y1={getY(v)}
                        x2={w - p.right}
                        y2={getY(v)}
                        stroke="#e2e8f0"
                        strokeWidth="0.2"
                    />
                    <text
                        x={p.left - 1}
                        y={getY(v)}
                        fontSize="2.5"
                        fill="#94a3b8"
                        textAnchor="end"
                        dominantBaseline="middle"
                    >
                        {v}%
                    </text>
                </g>
            ))}
            <path d={actualArea} fill="url(#aG)" />
            <path
                d={baselinePath}
                fill="none"
                stroke="#94a3b8"
                strokeWidth="0.4"
                strokeDasharray="2,1"
            />
            <path d={actualPath} fill="none" stroke="#0d9488" strokeWidth="0.7" />
            {data.map((d, i) => (
                <g key={i}>
                    <circle cx={getX(i)} cy={getY(d.actual || 0)} r="1" fill="#0d9488" />
                    <text x={getX(i)} y={height - 6} fontSize="2.5" fill="#64748b" textAnchor="middle">
                        {d.week}
                    </text>
                </g>
            ))}
        </svg>
    );
}
