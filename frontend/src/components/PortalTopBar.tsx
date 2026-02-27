import { useNavigate } from 'react-router-dom';
import { useSchoolContext } from '../contexts/SchoolContext';
import { useAuthStore } from '../stores/useAuthStore';
import { useTenantStore } from '../stores/useTenantStore';
import { useTheme } from '../contexts/ThemeContext';

interface Props {
    onToggleSidebar: () => void;
    onToggleMobileSidebar: () => void;
}

export function PortalTopBar({ onToggleSidebar, onToggleMobileSidebar }: Props) {
    const { currentSchool, portalType, slug } = useSchoolContext();
    const email = useAuthStore((s) => s.email);
    const logout = useAuthStore((s) => s.logout);
    const tenants = useTenantStore((s) => s.tenants);
    const { theme, toggleTheme } = useTheme();
    const navigate = useNavigate();

    const otherSchools = tenants.filter((t) => t.slug !== slug);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const profilePath = `/school/${slug}/portal/profile`;
    const settingsPath = `/school/${slug}/portal/settings`;

    return (
        <div className="header">
            {/* Header Left - Logo & Toggle */}
            <div className="header-left active">
                <a href="/" className="logo logo-normal">
                    <img src="/assets/img/logo.svg" alt="Logo" />
                </a>
                <a href="/" className="logo-small">
                    <img src="/assets/img/logo-small.svg" alt="Logo" />
                </a>
                <a href="/" className="dark-logo">
                    <img src="/assets/img/logo-dark.svg" alt="Logo" />
                </a>
                <a
                    id="toggle_btn"
                    href="javascript:void(0);"
                    onClick={(e) => {
                        e.preventDefault();
                        onToggleSidebar();
                    }}
                >
                    <i className="ti ti-menu-deep"></i>
                </a>
            </div>

            {/* Mobile Toggle */}
            <a
                id="mobile_btn"
                className="mobile_btn"
                href="#sidebar"
                onClick={(e) => {
                    e.preventDefault();
                    onToggleMobileSidebar();
                }}
            >
                <span className="bar-icon">
                    <span></span>
                    <span></span>
                    <span></span>
                </span>
            </a>

            {/* Header User Area */}
            <div className="header-user">
                <div className="nav user-menu">
                    {/* Search */}
                    <div className="nav-item nav-search-inputs me-auto">
                        <div className="top-nav-search">
                            <a href="javascript:void(0);" className="responsive-search">
                                <i className="fa fa-search"></i>
                            </a>
                            <form action="#" className="dropdown" onSubmit={(e) => e.preventDefault()}>
                                <div className="searchinputs" id="dropdownMenuClickable">
                                    <input type="text" placeholder="Search" />
                                    <div className="search-addon">
                                        <button type="submit">
                                            <i className="ti ti-command"></i>
                                        </button>
                                    </div>
                                </div>
                            </form>
                        </div>
                    </div>

                    <div className="d-flex align-items-center">
                        {/* School Switcher */}
                        {otherSchools.length > 0 && (
                            <div className="pe-1">
                                <select
                                    className="form-select form-select-sm"
                                    value=""
                                    onChange={(e) => {
                                        if (e.target.value) {
                                            navigate(`/school/${e.target.value}/${portalType}`);
                                        }
                                    }}
                                >
                                    <option value="" disabled>
                                        Switch School
                                    </option>
                                    {otherSchools.map((s) => (
                                        <option key={s.id} value={s.slug}>
                                            {s.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}

                        {/* Dark Mode Toggle */}
                        <div className="pe-1">
                            {theme === 'light' ? (
                                <a
                                    href="#"
                                    id="dark-mode-toggle"
                                    className="dark-mode-toggle activate btn btn-outline-light bg-white btn-icon me-1"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        toggleTheme();
                                    }}
                                >
                                    <i className="ti ti-moon"></i>
                                </a>
                            ) : (
                                <a
                                    href="#"
                                    id="light-mode-toggle"
                                    className="dark-mode-toggle btn btn-outline-light bg-white btn-icon me-1"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        toggleTheme();
                                    }}
                                >
                                    <i className="ti ti-brightness-up"></i>
                                </a>
                            )}
                        </div>

                        {/* Notifications */}
                        <div className="pe-1" id="notification_item">
                            <a
                                href="#"
                                className="btn btn-outline-light bg-white btn-icon position-relative me-1"
                                id="notification_popup"
                                onClick={(e) => e.preventDefault()}
                            >
                                <i className="ti ti-bell"></i>
                                <span className="notification-status-dot"></span>
                            </a>
                        </div>

                        {/* User Profile Dropdown */}
                        <div className="dropdown ms-1">
                            <a
                                href="javascript:void(0);"
                                className="dropdown-toggle d-flex align-items-center"
                                data-bs-toggle="dropdown"
                            >
                                <span className="avatar avatar-md rounded">
                                    <span
                                        className="d-flex align-items-center justify-content-center w-100 h-100 bg-primary text-white fw-bold rounded"
                                        style={{ fontSize: '1rem' }}
                                    >
                                        {email?.charAt(0).toUpperCase() || '?'}
                                    </span>
                                </span>
                            </a>
                            <div className="dropdown-menu">
                                <div className="d-block">
                                    <div className="d-flex align-items-center p-2">
                                        <span className="avatar avatar-md me-2 online avatar-rounded">
                                            <span
                                                className="d-flex align-items-center justify-content-center w-100 h-100 bg-primary text-white fw-bold rounded-circle"
                                                style={{ fontSize: '1rem' }}
                                            >
                                                {email?.charAt(0).toUpperCase() || '?'}
                                            </span>
                                        </span>
                                        <div>
                                            <h6 className="mb-0">{currentSchool?.name || 'School'}</h6>
                                            <p className="text-primary mb-0">{email}</p>
                                        </div>
                                    </div>
                                    <hr className="m-0" />
                                    <a
                                        className="dropdown-item d-inline-flex align-items-center p-2"
                                        href={profilePath}
                                        onClick={(e) => {
                                            e.preventDefault();
                                            navigate(profilePath);
                                        }}
                                    >
                                        <i className="ti ti-user-circle me-2"></i>My Profile
                                    </a>
                                    <a
                                        className="dropdown-item d-inline-flex align-items-center p-2"
                                        href={settingsPath}
                                        onClick={(e) => {
                                            e.preventDefault();
                                            navigate(settingsPath);
                                        }}
                                    >
                                        <i className="ti ti-settings me-2"></i>Settings
                                    </a>
                                    <hr className="m-0" />
                                    <a
                                        className="dropdown-item d-inline-flex align-items-center p-2"
                                        href="/login"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            handleLogout();
                                        }}
                                    >
                                        <i className="ti ti-login me-2"></i>Logout
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Mobile User Menu */}
            <div className="dropdown mobile-user-menu">
                <a
                    href="javascript:void(0);"
                    className="nav-link dropdown-toggle"
                    data-bs-toggle="dropdown"
                    aria-expanded="false"
                >
                    <i className="fa fa-ellipsis-v"></i>
                </a>
                <div className="dropdown-menu dropdown-menu-end">
                    <a
                        className="dropdown-item"
                        href={profilePath}
                        onClick={(e) => {
                            e.preventDefault();
                            navigate(profilePath);
                        }}
                    >
                        My Profile
                    </a>
                    <a
                        className="dropdown-item"
                        href={settingsPath}
                        onClick={(e) => {
                            e.preventDefault();
                            navigate(settingsPath);
                        }}
                    >
                        Settings
                    </a>
                    <a
                        className="dropdown-item"
                        href="/login"
                        onClick={(e) => {
                            e.preventDefault();
                            handleLogout();
                        }}
                    >
                        Logout
                    </a>
                </div>
            </div>
        </div>
    );
}
