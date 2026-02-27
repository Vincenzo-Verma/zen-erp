import './MiniChart.css';

interface BarChartProps {
    data: number[];
    maxValue?: number;
    color?: string;
    height?: number;
    labels?: string[];
}

export function BarChart({ data, maxValue, color = 'var(--accent-primary)', height = 100, labels }: BarChartProps) {
    const max = maxValue || Math.max(...data, 1);

    return (
        <div className="mini-chart-bar" style={{ height }}>
            <div className="bar-chart-bars">
                {data.map((val, i) => {
                    const pct = (val / max) * 100;
                    return (
                        <div key={i} className="bar-col" title={labels?.[i] ? `${labels[i]}: ${val}` : `${val}`}>
                            <div
                                className="bar-fill"
                                style={{ height: `${pct}%`, background: color }}
                            />
                        </div>
                    );
                })}
            </div>
            {labels && (
                <div className="bar-chart-labels">
                    {labels.map((l, i) => (
                        <span key={i} className="bar-label">{l}</span>
                    ))}
                </div>
            )}
        </div>
    );
}

interface SparklineProps {
    data: number[];
    color?: string;
    height?: number;
}

export function Sparkline({ data, color = 'var(--accent-primary)', height = 40 }: SparklineProps) {
    const max = Math.max(...data, 1);
    const min = Math.min(...data, 0);
    const range = max - min || 1;
    const w = 200;
    const h = height;

    const points = data
        .map((val, i) => {
            const x = (i / (data.length - 1)) * w;
            const y = h - ((val - min) / range) * (h - 4);
            return `${x},${y}`;
        })
        .join(' ');

    const areaPoints = `0,${h} ${points} ${w},${h}`;

    return (
        <svg className="sparkline" viewBox={`0 0 ${w} ${h}`} style={{ height }} preserveAspectRatio="none">
            <polygon points={areaPoints} fill={color} opacity="0.1" />
            <polyline points={points} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}

interface GaugeProps {
    value: number;
    max: number;
    label: string;
    color?: string;
}

export function Gauge({ value, max, label, color = 'var(--accent-primary)' }: GaugeProps) {
    const pct = Math.min((value / max) * 100, 100);

    return (
        <div className="gauge">
            <div className="gauge-ring">
                <svg viewBox="0 0 36 36" className="gauge-svg">
                    <path
                        className="gauge-track"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                    <path
                        className="gauge-fill"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        strokeDasharray={`${pct}, 100`}
                        style={{ stroke: color }}
                    />
                </svg>
                <span className="gauge-value">{Math.round(pct)}%</span>
            </div>
            <span className="gauge-label">{label}</span>
        </div>
    );
}
