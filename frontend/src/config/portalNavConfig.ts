export interface NavItem {
    to: string;
    icon: string;
    label: string;
    end?: boolean;
    roles: string[];
    section?: string;
}

const allNavItems: NavItem[] = [
    // Main
    { to: '', icon: 'IconDashboard', label: 'Dashboard', end: true, section: 'Main', roles: ['admin', 'teacher', 'receptionist', 'accountant', 'student', 'parent'] },

    // People
    { to: '/students', icon: 'IconUsers', label: 'Students', section: 'People', roles: ['admin', 'receptionist'] },
    { to: '/staff', icon: 'IconUserShield', label: 'Staff', section: 'People', roles: ['admin'] },

    // Academic
    { to: '/classes', icon: 'IconSchool', label: 'Classes', section: 'Academic', roles: ['admin'] },
    { to: '/attendance', icon: 'IconClipboardCheck', label: 'Attendance', section: 'Academic', roles: ['admin', 'teacher', 'receptionist'] },
    { to: '/timetable', icon: 'IconClock', label: 'Timetable', section: 'Academic', roles: ['admin'] },
    { to: '/gradebook', icon: 'IconNotebook', label: 'Gradebook', section: 'Academic', roles: ['teacher'] },

    // Finance
    { to: '/fees', icon: 'IconCash', label: 'Fees', section: 'Finance', roles: ['admin'] },
    { to: '/fee-management', icon: 'IconCreditCard', label: 'Fee Management', section: 'Finance', roles: ['accountant'] },

    // Staff portal
    { to: '/leaves', icon: 'IconBeach', label: 'My Leaves', section: 'My Portal', roles: ['teacher'] },
    { to: '/admissions', icon: 'IconUserPlus', label: 'Admissions', section: 'Front Office', roles: ['receptionist'] },
    { to: '/staff-onboarding', icon: 'IconUserCheck', label: 'Staff Onboarding', section: 'Front Office', roles: ['receptionist'] },

    // Student / Parent
    { to: '/reports', icon: 'IconFileText', label: 'Report Cards', section: 'My Portal', roles: ['student', 'parent'] },
    { to: '/fee-payment', icon: 'IconCreditCard', label: 'Fee Payment', section: 'My Portal', roles: ['student', 'parent'] },
    { to: '/profile', icon: 'IconUser', label: 'Profile', section: 'My Portal', roles: ['student'] },

    // System
    { to: '/plugins', icon: 'IconPuzzle', label: 'Plugins', section: 'System', roles: ['admin'] },
    { to: '/audit', icon: 'IconFileAnalytics', label: 'Audit Log', section: 'System', roles: ['admin'] },
    { to: '/settings', icon: 'IconSettings', label: 'Settings', section: 'System', roles: ['admin'] },
];

export interface NavGroup {
    section: string;
    items: NavItem[];
}

export function getNavForRole(role: string): NavItem[] {
    return allNavItems.filter((item) => item.roles.includes(role));
}

export function getGroupedNavForRole(role: string): NavGroup[] {
    const items = getNavForRole(role);
    const groups: NavGroup[] = [];
    const seen = new Set<string>();

    for (const item of items) {
        const section = item.section || 'Other';
        if (!seen.has(section)) {
            seen.add(section);
            groups.push({ section, items: [] });
        }
        groups.find(g => g.section === section)!.items.push(item);
    }

    return groups;
}

export const portalLabels: Record<string, string> = {
    admin: 'Admin Portal',
    teacher: 'Teacher Portal',
    receptionist: 'Front Office',
    accountant: 'Accounts Portal',
    student: 'Student Portal',
    parent: 'Parent Portal',
};
