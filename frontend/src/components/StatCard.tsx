import './StatCard.css';

interface Props {
    icon: React.ReactNode;
    label: string;
    value: string | number;
    trend?: { value: string; positive: boolean };
    variant?: 'default' | 'success' | 'accent' | 'warning' | 'danger';
}

export function StatCard({ icon, label, value, trend, variant = 'default' }: Props) {
    return (
        <div className="stat-card glass-card">
            <div className={`stat-icon stat-icon-${variant}`}>
                {icon}
            </div>
            <div className="stat-body">
                <span className="stat-label">{label}</span>
                <span className="stat-value">{value}</span>
                {trend && (
                    <span className={`stat-trend ${trend.positive ? 'stat-trend-up' : 'stat-trend-down'}`}>
                        {trend.positive ? '↑' : '↓'} {trend.value}
                    </span>
                )}
            </div>
        </div>
    );
}
