import { Outlet } from 'react-router-dom';
import { PortalSidebar } from '../components/PortalSidebar';
import { PortalTopBar } from '../components/PortalTopBar';
import { SuspendedBanner } from '../components/SuspendedBanner';
import { useSchoolContext } from '../contexts/SchoolContext';


export function AdminLayout() {
    const { currentSchool } = useSchoolContext();
    const isSuspended = currentSchool?.status === 'suspended';

    return (
        <div className="portal-layout">
            <PortalSidebar />
            <div className="portal-main-area">
                <PortalTopBar />
                {isSuspended && <SuspendedBanner tenantName={currentSchool?.name || 'School'} />}
                <main className="portal-main-content">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
