import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useAuthStore } from './stores/useAuthStore';

import { ProtectedRoute } from './components/ProtectedRoute';
import { SchoolProvider } from './contexts/SchoolContext';

// Layouts
import { AppLayout } from './layouts/AppLayout';
import { PortalLayout } from './layouts/PortalLayout';

// Public Pages
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { SchoolLoginPage } from './pages/SchoolLoginPage';
import { LandingPage } from './pages/LandingPage';

// Super Admin (Global)
import { SchoolSelectorPage } from './pages/SchoolSelectorPage';

// Unified Portal Dashboard (role-adaptive)
import { PortalDashboard } from './pages/PortalDashboard';

// School Admin Pages
import { StudentsPage } from './pages/admin/StudentsPage';
import { StudentDetails } from './pages/admin/StudentDetails';
import { AddStudent } from './pages/admin/AddStudent';
import { AddStaff } from './pages/admin/AddStaff';
import { StaffDirectory } from './pages/admin/StaffDirectory';
import { ClassesPage } from './pages/admin/ClassesPage';
import { FeesAdmin } from './pages/admin/FeesAdmin';
import { AttendanceOverview } from './pages/admin/AttendanceOverview';
import { TimetablePage } from './pages/admin/TimetablePage';

// Staff Portal Pages
import { AttendanceMarking } from './pages/staff/AttendanceMarking';
import { Gradebook } from './pages/staff/Gradebook';
import { MyLeaves } from './pages/staff/MyLeaves';
import { StaffAdmissions } from './pages/staff/StaffAdmissions';
import { StaffOnboarding } from './pages/staff/StaffOnboarding';

// Student Portal Pages
import { ReportCards } from './pages/student/ReportCards';
import { FeePayment } from './pages/student/FeePayment';

// Shared pages
import { BillingPage } from './pages/BillingPage';
import { SettingsPage } from './pages/SettingsPage';
import { UsersPage } from './pages/UsersPage';
import { AuditLogPage } from './pages/AuditLogPage';
import { PluginMarketplacePage } from './pages/PluginMarketplacePage';
import { UserProfilePage } from './pages/UserProfilePage';
import { AdminDashboardPage } from './pages/AdminDashboardPage';
import { AdminTenantsPage } from './pages/AdminTenantsPage';
import { AdminSystemHealthPage } from './pages/AdminSystemHealthPage';

export function App() {
    return (
        <BrowserRouter>
            <SubdomainDetector />
            <Routes>
                {/* ─── Public Routes ─── */}
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/school/:slug/login" element={<SchoolLoginPage />} />

                {/* ─── Super Admin: School Selector ─── */}
                <Route
                    path="/schools"
                    element={
                        <ProtectedRoute>
                            <SchoolSelectorPage />
                        </ProtectedRoute>
                    }
                />

                {/* ─── Unified School Portal (role-driven sidebar) ─── */}
                <Route
                    path="/school/:slug/portal"
                    element={
                        <ProtectedRoute>
                            <SchoolProvider>
                                <PortalLayout />
                            </SchoolProvider>
                        </ProtectedRoute>
                    }
                >
                    <Route index element={<PortalDashboard />} />
                    {/* Admin */}
                    <Route path="students" element={<StudentsPage />} />
                    <Route path="students/add" element={<AddStudent />} />
                    <Route path="students/:studentId" element={<StudentDetails />} />
                    <Route path="staff" element={<StaffDirectory />} />
                    <Route path="staff/add" element={<AddStaff />} />
                    <Route path="classes" element={<ClassesPage />} />
                    <Route path="fees" element={<FeesAdmin />} />
                    <Route path="attendance" element={<RoleAttendance />} />
                    <Route path="timetable" element={<TimetablePage />} />
                    <Route path="plugins" element={<PluginMarketplacePage />} />
                    <Route path="audit" element={<AuditLogPage />} />
                    <Route path="settings" element={<SettingsPage />} />
                    {/* Staff */}
                    <Route path="gradebook" element={<Gradebook />} />
                    <Route path="leaves" element={<MyLeaves />} />
                    <Route path="admissions" element={<StaffAdmissions />} />
                    <Route path="staff-onboarding" element={<StaffOnboarding />} />
                    {/* Accountant */}
                    <Route path="fee-management" element={<FeesAdmin />} />
                    {/* Student / Parent */}
                    <Route path="reports" element={<ReportCards />} />
                    <Route path="fee-payment" element={<FeePayment />} />
                    <Route path="profile" element={<UserProfilePage />} />
                </Route>

                {/* ─── Legacy portal redirects ─── */}
                <Route path="/school/:slug/admin/*" element={<LegacyRedirect />} />
                <Route path="/school/:slug/staff/*" element={<LegacyRedirect />} />
                <Route path="/school/:slug/student/*" element={<LegacyRedirect />} />

                {/* ─── Platform Admin (existing) ─── */}
                <Route
                    element={
                        <ProtectedRoute requireTenant>
                            <AppLayout />
                        </ProtectedRoute>
                    }
                >
                    <Route path="/dashboard" element={<AdminDashboardPage />} />
                    <Route path="/billing" element={<BillingPage />} />
                    <Route path="/settings" element={<SettingsPage />} />
                    <Route path="/users" element={<UsersPage />} />
                    <Route path="/audit" element={<AuditLogPage />} />
                    <Route path="/marketplace" element={<PluginMarketplacePage />} />
                    <Route path="/profile" element={<UserProfilePage />} />
                    <Route path="/admin" element={<AdminDashboardPage />} />
                    <Route path="/admin/tenants" element={<AdminTenantsPage />} />
                    <Route path="/admin/health" element={<AdminSystemHealthPage />} />
                </Route>

                {/* ─── Root: Landing page or redirect to schools ─── */}
                <Route path="/" element={<RootRedirect />} />
                <Route path="*" element={<RootRedirect />} />
            </Routes>
        </BrowserRouter>
    );
}

/** Redirect old /school/:slug/admin|staff|student paths to /school/:slug/portal */
function LegacyRedirect() {
    const slug = window.location.pathname.split('/')[2] || '';
    // Strip the old portal segment and redirect sub-path
    const parts = window.location.pathname.split('/');
    // parts: ['', 'school', slug, 'admin|staff|student', ...rest]
    const rest = parts.slice(4).join('/');
    return <Navigate to={`/school/${slug}/portal${rest ? '/' + rest : ''}`} replace />;
}

/** Admin sees attendance overview; teachers/receptionists see marking UI */
function RoleAttendance() {
    const role = localStorage.getItem('erp_school_role') || '';
    if (role === 'admin') return <AttendanceOverview />;
    return <AttendanceMarking />;
}

/** Detect subdomain and redirect to /school/:slug/login */
function SubdomainDetector() {
    const navigate = useNavigate();

    useEffect(() => {
        const hostname = window.location.hostname;
        const baseDomain = import.meta.env.VITE_BASE_DOMAIN || 'localhost';

        if (
            hostname.endsWith(`.${baseDomain}`) &&
            hostname !== baseDomain &&
            hostname !== `www.${baseDomain}`
        ) {
            const subdomain = hostname.replace(`.${baseDomain}`, '');
            navigate(`/school/${subdomain}/login`, { replace: true });
        }
    }, [navigate]);

    return null;
}

/** Show landing page for guests, redirect to /schools for authenticated users */
function RootRedirect() {
    const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
    return isAuthenticated ? <Navigate to="/schools" replace /> : <LandingPage />;
}
