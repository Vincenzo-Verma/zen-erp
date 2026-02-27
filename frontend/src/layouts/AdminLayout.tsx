import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { PortalSidebar } from '../components/PortalSidebar';
import { PortalTopBar } from '../components/PortalTopBar';
import { SuspendedBanner } from '../components/SuspendedBanner';
import { useSchoolContext } from '../contexts/SchoolContext';


export function AdminLayout() {
    const { currentSchool } = useSchoolContext();
    const isSuspended = currentSchool?.status === 'suspended';
    const [mini, setMini] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);

    return (
        <div className="portal-layout">
            <PortalSidebar mini={mini} mobileOpen={mobileOpen} onCloseMobile={() => setMobileOpen(false)} onToggleMini={() => setMini(m => !m)} />
            <div className="portal-main-area">
                <PortalTopBar onToggleSidebar={() => setMini(m => !m)} onToggleMobileSidebar={() => setMobileOpen(o => !o)} />
                {isSuspended && <SuspendedBanner tenantName={currentSchool?.name || 'School'} />}
                <main className="portal-main-content">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
