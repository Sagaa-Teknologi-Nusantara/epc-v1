interface SafetyPyramidProps {
    hse: {
        lagging?: {
            fatality?: number;
            lti?: number;
            medicalTreatment?: number;
            firstAid?: number;
        };
        leading?: {
            nearMiss?: number;
            safetyObservation?: number;
        };
    };
}

export function SafetyPyramid({ hse }: SafetyPyramidProps) {
    const levels = [
        { label: 'Fatality', value: hse?.lagging?.fatality || 0, color: '#dc2626', bg: '#fee2e2' },
        { label: 'Lost Time Injury', value: hse?.lagging?.lti || 0, color: '#f97316', bg: '#ffedd5' },
        { label: 'Medical Treatment', value: hse?.lagging?.medicalTreatment || 0, color: '#eab308', bg: '#fef9c3' },
        { label: 'First Aid', value: hse?.lagging?.firstAid || 0, color: '#84cc16', bg: '#ecfccb' },
        { label: 'Near Miss', value: hse?.leading?.nearMiss || 0, color: '#22c55e', bg: '#dcfce7' },
        { label: 'Safety Observation', value: hse?.leading?.safetyObservation || 0, color: '#0d9488', bg: '#ccfbf1' },
    ];

    return (
        <div className="text-center">
            <svg viewBox="0 0 300 210" className="max-w-[380px] w-full">
                {levels.map((l, i) => {
                    const tw = 40 + i * 42;
                    const bw = 82 + i * 42;
                    const y = i * 34;
                    const h = 32;
                    const cx = 150;
                    return (
                        <g key={i}>
                            <path
                                d={`M${cx - tw / 2} ${y} L${cx + tw / 2} ${y} L${cx + bw / 2} ${y + h} L${cx - bw / 2} ${y + h} Z`}
                                fill={l.bg}
                                stroke={l.color}
                                strokeWidth="2"
                            />
                            <text
                                x={cx}
                                y={y + h / 2 + 5}
                                textAnchor="middle"
                                fontSize="13"
                                fontWeight="800"
                                fill={l.color}
                            >
                                {l.value}
                            </text>
                        </g>
                    );
                })}
            </svg>
            <div className="flex flex-wrap gap-2 justify-center mt-2">
                {levels.map((l, i) => (
                    <div key={i} className="flex items-center gap-1 text-[9px]">
                        <div
                            className="w-2.5 h-2.5 rounded-sm"
                            style={{ background: l.bg, border: `1px solid ${l.color}` }}
                        />
                        <span className="text-slate-500">{l.label}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}
