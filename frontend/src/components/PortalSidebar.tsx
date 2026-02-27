import { NavLink, useNavigate } from 'react-router-dom';
import { useSchoolContext } from '../contexts/SchoolContext';
import { useAuthStore } from '../stores/useAuthStore';
import { getGroupedNavForRole } from '../config/portalNavConfig';

const iconClassMap: Record<string, string> = {
    IconDashboard: 'ti ti-layout-dashboard',
    IconUsers: 'ti ti-school',
    IconUserShield: 'ti ti-users-group',
    IconSchool: 'ti ti-school-bell',
    IconClipboardCheck: 'ti ti-calendar-share',
    IconClock: 'ti ti-table',
    IconNotebook: 'ti ti-notebook',
    IconCash: 'ti ti-report-money',
    IconCreditCard: 'ti ti-credit-card',
    IconBeach: 'ti ti-calendar-stats',
    IconUserPlus: 'ti ti-user-plus',
    IconUserCheck: 'ti ti-user-check',
    IconFileText: 'ti ti-file-text',
    IconUser: 'ti ti-user',
    IconPuzzle: 'ti ti-puzzle',
    IconFileAnalytics: 'ti ti-file-analytics',
    IconSettings: 'ti ti-settings',
};

interface Props {
    mini: boolean;
    mobileOpen: boolean;
    onCloseMobile: () => void;
    onToggleMini?: () => void;
}

export function PortalSidebar({ mini, mobileOpen, onCloseMobile, onToggleMini: _onToggleMini }: Props) {
    const { currentSchool, slug, userRole } = useSchoolContext();
    const logout = useAuthStore((s) => s.logout);
    const navigate = useNavigate();

    const groups = getGroupedNavForRole(userRole);
    const basePath = `/school/${slug}/portal`;

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const sidebarClasses = [
        'sidebar',
        mini ? 'mini-sidebar-active' : '',
        mobileOpen ? 'active' : '',
    ]
        .filter(Boolean)
        .join(' ');

    return (
        <div className={sidebarClasses} id="sidebar">
            <div className="sidebar-inner slimscroll">
                <div id="sidebar-menu" className="sidebar-menu">
                    {/* School identity / organization selector */}
                    <ul>
                        <li>
                            <a
                                href="javascript:void(0);"
                                className="d-flex align-items-center border bg-white rounded p-2 mb-4"
                            >
                                <img
                                    src={'/assets/img/icons/global-img.svg'}
                                    className="avatar avatar-md img-fluid rounded"
                                    alt="Profile"
                                />
                                <span className="text-dark ms-2 fw-normal">
                                    {currentSchool?.name || 'School'}
                                </span>
                            </a>
                        </li>
                    </ul>

                    {/* Navigation groups */}
                    <ul>
                        {groups.map((group) => (
                            <li key={group.section}>
                                <h6 className="submenu-hdr">
                                    <span>{group.section}</span>
                                </h6>
                                <ul>
                                    {group.items.map((item) => (
                                        <li key={item.to}>
                                            <NavLink
                                                to={`${basePath}${item.to}`}
                                                end={item.end}
                                                className={({ isActive }) =>
                                                    isActive ? 'active' : ''
                                                }
                                                onClick={onCloseMobile}
                                            >
                                                <i
                                                    className={
                                                        iconClassMap[item.icon] ||
                                                        'ti ti-circle'
                                                    }
                                                />
                                                <span>{item.label}</span>
                                            </NavLink>
                                        </li>
                                    ))}
                                </ul>
                            </li>
                        ))}

                        {/* Footer links */}
                        <li>
                            <h6 className="submenu-hdr">
                                <span>Account</span>
                            </h6>
                            <ul>
                                <li>
                                    <NavLink
                                        to="/schools"
                                        className={({ isActive }) =>
                                            isActive ? 'active' : ''
                                        }
                                        onClick={onCloseMobile}
                                    >
                                        <i className="ti ti-arrow-back" />
                                        <span>All Schools</span>
                                    </NavLink>
                                </li>
                                <li>
                                    <a
                                        href="#"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            handleLogout();
                                        }}
                                    >
                                        <i className="ti ti-logout" />
                                        <span>Logout</span>
                                    </a>
                                </li>
                            </ul>
                        </li>
                    </ul>
                </div>
            </div>
        </div>
    );
}
