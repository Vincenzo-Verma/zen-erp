import { useSchoolContext } from '../contexts/SchoolContext';
import { SchoolDashboard } from './admin/SchoolDashboard';
import { StaffDashboard } from './staff/StaffDashboard';
import { TeacherDashboard } from './staff/TeacherDashboard';
import { StudentDashboard } from './student/StudentDashboard';
import { ParentDashboard } from './student/ParentDashboard';

export function PortalDashboard() {
    const { userRole } = useSchoolContext();

    switch (userRole) {
        case 'admin':
            return <SchoolDashboard />;
        case 'teacher':
            return <TeacherDashboard />;
        case 'receptionist':
        case 'accountant':
            return <StaffDashboard />;
        case 'parent':
            return <ParentDashboard />;
        case 'student':
            return <StudentDashboard />;
        default:
            return <StudentDashboard />;
    }
}
