import CountUp from 'react-countup';
import type { ReactNode } from 'react';

type Variant = 'primary' | 'success' | 'warning' | 'danger' | 'info';

interface Props {
    label: string;
    value: number;
    prefix?: string;
    suffix?: string;
    icon: ReactNode;
    variant?: Variant;
    trend?: { value: string; positive: boolean };
}

const variantColors: Record<Variant, string> = {
    primary: 'var(--erp-primary)',
    success: 'var(--erp-success)',
    warning: 'var(--erp-warning)',
    danger: 'var(--erp-danger)',
    info: 'var(--erp-info)',
};

const variantBgs: Record<Variant, string> = {
    primary: 'var(--erp-soft-primary)',
    success: 'var(--erp-soft-success)',
    warning: 'var(--erp-soft-warning)',
    danger: 'var(--erp-soft-danger)',
    info: 'var(--erp-soft-info)',
};

export function StatCard({ label, value, prefix = '', suffix = '', icon, variant = 'primary', trend }: Props) {
    return (
        <div className="card border-0 shadow-sm">
            <div className="card-body d-flex align-items-center gap-3">
                <div
                    className="d-flex align-items-center justify-content-center rounded-circle flex-shrink-0"
                    style={{
                        width: 48,
                        height: 48,
                        background: variantBgs[variant],
                        color: variantColors[variant],
                    }}
                >
                    {icon}
                </div>
                <div className="flex-grow-1 min-w-0">
                    <p className="mb-1" style={{ fontSize: 13, color: 'var(--erp-text-muted)' }}>{label}</p>
                    <h4 className="mb-0" style={{ fontSize: 22, fontWeight: 700, color: 'var(--erp-text-primary)' }}>
                        {prefix}<CountUp end={value} duration={1.5} separator="," />{suffix}
                    </h4>
                    {trend && (
                        <small style={{ fontSize: 12, color: trend.positive ? 'var(--erp-success)' : 'var(--erp-danger)' }}>
                            {trend.positive ? '+' : ''}{trend.value}
                        </small>
                    )}
                </div>
            </div>
        </div>
    );
}
