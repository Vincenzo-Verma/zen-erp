type Variant = 'success' | 'danger' | 'warning' | 'primary' | 'info' | 'secondary';

interface Props {
    label: string;
    variant?: Variant;
}

const variantMap: Record<string, Variant> = {
    active: 'success',
    inactive: 'danger',
    paid: 'success',
    overdue: 'danger',
    pending: 'warning',
    partial: 'warning',
    present: 'success',
    absent: 'danger',
    approved: 'success',
    rejected: 'danger',
    draft: 'secondary',
};

export function StatusBadge({ label, variant }: Props) {
    const v = variant || variantMap[label.toLowerCase()] || 'secondary';
    return (
        <span className={`badge badge-soft-${v}`}>
            {label}
        </span>
    );
}
