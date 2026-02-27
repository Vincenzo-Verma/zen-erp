import { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import { PortalSidebar } from '../components/PortalSidebar';
import { PortalTopBar } from '../components/PortalTopBar';
import { SuspendedBanner } from '../components/SuspendedBanner';
import { useSchoolContext } from '../contexts/SchoolContext';

export function PortalLayout() {
    const { currentSchool } = useSchoolContext();
    const isSuspended = currentSchool?.status === 'suspended';
    const [miniSidebar, setMiniSidebar] = useState(false);
    const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

    useEffect(() => {
        if (miniSidebar) {
            document.body.classList.add('mini-sidebar');
        } else {
            document.body.classList.remove('mini-sidebar');
        }
        return () => {
            document.body.classList.remove('mini-sidebar');
        };
    }, [miniSidebar]);

    const toggleMiniSidebar = () => setMiniSidebar((v) => !v);
    const toggleMobileSidebar = () => setMobileSidebarOpen((v) => !v);
    const closeMobileSidebar = () => setMobileSidebarOpen(false);

    return (
        <div className="main-wrapper">
            <PortalTopBar
                onToggleSidebar={toggleMiniSidebar}
                onToggleMobileSidebar={toggleMobileSidebar}
            />

            <PortalSidebar
                mini={miniSidebar}
                mobileOpen={mobileSidebarOpen}
                onCloseMobile={closeMobileSidebar}
                onToggleMini={toggleMiniSidebar}
            />

            {mobileSidebarOpen && <div className="sidebar-overlay" onClick={closeMobileSidebar} />}

            <div className="page-wrapper">
                {isSuspended && <SuspendedBanner tenantName={currentSchool?.name || 'School'} />}
                <div className="content">
                    <Outlet />
                </div>
            </div>
        </div>
    );
}
