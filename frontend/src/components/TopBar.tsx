import { useLocation } from 'react-router-dom';
import { useTenantStore } from '../stores/useTenantStore';
import './TopBar.css';

const routeTitles: Record<string, string> = {
    '/': 'Dashboard',
    '/billing': 'Billing & Wallet',
    '/settings': 'Settings',
    '/users': 'Users & Roles',
};

export function TopBar() {
    const location = useLocation();
    const activeTenant = useTenantStore((s) => s.activeTenant);

    const pageTitle = routeTitles[location.pathname] || 'Dashboard';

    return (
        <header className="topbar">
            <div className="topbar-left">
                <div className="breadcrumbs">
                    <span className="breadcrumb-org">{activeTenant?.name || 'Organization'}</span>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
                        <polyline points="9 18 15 12 9 6" />
                    </svg>
                    <span className="breadcrumb-page">{pageTitle}</span>
                </div>
            </div>

            <div className="topbar-right">
                {/* Wallet Balance */}
                <div className="topbar-wallet" title="Wallet Balance">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                        <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
                        <line x1="1" y1="10" x2="23" y2="10" />
                    </svg>
                    <span className="wallet-amount">$0.00</span>
                </div>

                {/* Notifications */}
                <button className="topbar-icon-btn" title="Notifications">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                    </svg>
                    <span className="notification-dot" />
                </button>

                {/* Help */}
                <button className="topbar-icon-btn" title="Help & Support">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                        <circle cx="12" cy="12" r="10" />
                        <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                        <line x1="12" y1="17" x2="12.01" y2="17" />
                    </svg>
                </button>
            </div>
        </header>
    );
}
