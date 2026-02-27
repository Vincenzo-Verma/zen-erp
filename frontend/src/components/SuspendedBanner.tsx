import './SuspendedBanner.css';

interface Props {
    tenantName: string;
}

export function SuspendedBanner({ tenantName }: Props) {
    return (
        <div className="suspended-banner">
            <div className="suspended-banner-content">
                <svg className="suspended-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                    <line x1="12" y1="9" x2="12" y2="13" />
                    <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
                <div className="suspended-text">
                    <strong>{tenantName}</strong> is suspended due to insufficient wallet balance.
                    Please add funds to restore access.
                </div>
                <button className="btn btn-danger btn-sm">
                    Make Payment
                </button>
            </div>
        </div>
    );
}
