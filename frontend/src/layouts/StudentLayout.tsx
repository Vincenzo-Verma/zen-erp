import { Outlet } from 'react-router-dom';
import { PortalSidebar } from '../components/PortalSidebar';
import { PortalTopBar } from '../components/PortalTopBar';


export function StudentLayout() {
    return (
        <div className="portal-layout">
            <PortalSidebar />
            <div className="portal-main-area">
                <PortalTopBar />
                <main className="portal-main-content">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
