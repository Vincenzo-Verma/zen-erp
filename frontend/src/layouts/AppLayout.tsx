import { Outlet } from 'react-router-dom';
import { Sidebar } from '../components/Sidebar';
import { TopBar } from '../components/TopBar';
import { SuspendedBanner } from '../components/SuspendedBanner';
import { useTenantStore } from '../stores/useTenantStore';
import './AppLayout.css';

export function AppLayout() {
    const activeTenant = useTenantStore((s) => s.activeTenant);
    const isSuspended = activeTenant?.status === 'suspended';

    return (
        <div className="app-layout">
            <Sidebar />
            <div className="main-area">
                <TopBar />
                {isSuspended && <SuspendedBanner tenantName={activeTenant?.name || 'Organization'} />}
                <main className="main-content">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
