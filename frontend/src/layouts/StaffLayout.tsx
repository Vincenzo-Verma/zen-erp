import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { PortalSidebar } from '../components/PortalSidebar';
import { PortalTopBar } from '../components/PortalTopBar';


export function StaffLayout() {
    const [mini, setMini] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);

    return (
        <div className="portal-layout">
            <PortalSidebar mini={mini} mobileOpen={mobileOpen} onCloseMobile={() => setMobileOpen(false)} onToggleMini={() => setMini(m => !m)} />
            <div className="portal-main-area">
                <PortalTopBar onToggleSidebar={() => setMini(m => !m)} onToggleMobileSidebar={() => setMobileOpen(o => !o)} />
                <main className="portal-main-content">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
