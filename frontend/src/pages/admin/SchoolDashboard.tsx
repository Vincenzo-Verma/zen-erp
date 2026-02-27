import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSchoolContext } from '../../contexts/SchoolContext';
import { apiRequest } from '../../lib/api';
import { getBarOptions, getDonutOptions, getAreaOptions, getRadialBarOptions } from '../../components/charts/ChartConfig';
import ReactApexChart from 'react-apexcharts';

interface Student {
    id: string;
    admission_number: string;
    first_name: string;
    last_name: string;
    class_grade: number;
    section: string;
    is_active: boolean;
    created_at: string;
}

interface StaffMember {
    id: string;
    user_id: string;
    employee_number: string;
    full_name: string;
    designation: string;
    department: string;
    is_active: boolean;
    created_at: string;
}

interface AuditEvent {
    id: string;
    action: string;
    resource_type: string;
    user_email: string;
    details_json: string;
    created_at: string;
}

function timeAgo(iso: string): string {
    const diff = Date.now() - new Date(iso).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return 'just now';
    if (minutes < 60) return `${minutes} min ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    const days = Math.floor(hours / 24);
    return `${days} day${days > 1 ? 's' : ''} ago`;
}

function actionText(event: AuditEvent): string {
    try {
        const details = JSON.parse(event.details_json);
        const name = details.name || details.role || '';
        switch (event.action) {
            case 'STUDENT_ADMITTED': return `New student admitted — ${name}`;
            case 'STAFF_ONBOARDED': return `New staff onboarded — ${name}`;
            case 'LOGIN': return `${event.user_email} logged in`;
            case 'ROLE_ASSIGNED': return `Role assigned: ${name}`;
            default: return `${event.action} by ${event.user_email}`;
        }
    } catch {
        return `${event.action} by ${event.user_email}`;
    }
}

function actionBadge(action: string): { bg: string; color: string } {
    if (action.includes('STUDENT')) return { bg: 'var(--erp-soft-primary)', color: 'var(--erp-primary)' };
    if (action.includes('STAFF')) return { bg: 'var(--erp-soft-success)', color: 'var(--erp-success)' };
    if (action.includes('LOGIN')) return { bg: 'var(--erp-soft-info)', color: 'var(--erp-info)' };
    if (action.includes('ROLE')) return { bg: 'var(--erp-soft-warning)', color: 'var(--erp-warning)' };
    return { bg: 'var(--erp-soft-primary)', color: 'var(--erp-primary)' };
}

export function SchoolDashboard() {
    const { currentSchool, slug } = useSchoolContext();
    const navigate = useNavigate();
    const [students, setStudents] = useState<Student[]>([]);
    const [staff, setStaff] = useState<StaffMember[]>([]);
    const [recentActivity, setRecentActivity] = useState<AuditEvent[]>([]);
    const [loading, setLoading] = useState(true);

    const tenantId = currentSchool?.id || '';
    const token = localStorage.getItem('erp_token');

    useEffect(() => {
        if (!tenantId) return;

        const fetchData = async () => {
            setLoading(true);
            try {
                const [studentsRes, staffRes, auditRes] = await Promise.allSettled([
                    apiRequest<{ students: Student[] }>(`/api/v1/school/students/${tenantId}`, { token }),
                    apiRequest<{ staff: StaffMember[] }>(`/api/v1/school/staff/${tenantId}`, { token }),
                    apiRequest<{ events: AuditEvent[] }>(`/api/v1/audit/${tenantId}?limit=5`, { token }),
                ]);

                if (studentsRes.status === 'fulfilled') setStudents(studentsRes.value.students || []);
                if (staffRes.status === 'fulfilled') setStaff(staffRes.value.staff || []);
                if (auditRes.status === 'fulfilled') setRecentActivity(auditRes.value.events || []);
            } catch (err) {
                console.error('Dashboard fetch error', err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [tenantId, token]);

    // Derived data
    const activeStudents = useMemo(() => students.filter(s => s.is_active), [students]);
    const activeStaff = useMemo(() => staff.filter(s => s.is_active), [staff]);
    const uniqueGrades = useMemo(() => new Set(activeStudents.map(s => s.class_grade)).size, [activeStudents]);

    const enrollmentByGrade = useMemo(() => {
        const map = new Map<number, number>();
        for (const s of activeStudents) map.set(s.class_grade, (map.get(s.class_grade) || 0) + 1);
        const sorted = Array.from(map.entries()).sort((a, b) => a[0] - b[0]);
        return { data: sorted.map(([, c]) => c), labels: sorted.map(([g]) => `Grade ${g}`) };
    }, [activeStudents]);

    const staffByDesignation = useMemo(() => {
        const map = new Map<string, number>();
        for (const s of activeStaff) {
            const d = s.designation || 'other';
            map.set(d, (map.get(d) || 0) + 1);
        }
        const sorted = Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
        return { data: sorted.map(([, c]) => c), labels: sorted.map(([d]) => d.charAt(0).toUpperCase() + d.slice(1)) };
    }, [activeStaff]);

    const enrollmentTrend = useMemo(() => {
        const monthMap = new Map<string, number>();
        for (const s of students) {
            try {
                const d = new Date(s.created_at);
                const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
                monthMap.set(key, (monthMap.get(key) || 0) + 1);
            } catch { /* skip */ }
        }
        const sorted = Array.from(monthMap.entries()).sort((a, b) => a[0].localeCompare(b[0]));
        let cumulative = 0;
        return {
            data: sorted.map(([, c]) => { cumulative += c; return cumulative; }),
            labels: sorted.map(([k]) => k),
        };
    }, [students]);

    const basePath = `/school/${slug}/portal`;

    return (
        <div className="animate-fadeIn">
            {/* Page Header */}
            <div className="d-md-flex d-block align-items-center justify-content-between mb-3">
                <div className="my-auto mb-2">
                    <h3 className="page-title mb-1">Admin Dashboard</h3>
                    <nav>
                        <ol className="breadcrumb mb-0">
                            <li className="breadcrumb-item">
                                <a href="#">Dashboard</a>
                            </li>
                            <li className="breadcrumb-item active" aria-current="page">Admin Dashboard</li>
                        </ol>
                    </nav>
                </div>
                <div className="d-flex my-xl-auto right-content align-items-center flex-wrap">
                    <div className="mb-2">
                        <a
                            className="btn btn-primary d-flex align-items-center me-3"
                            href="#"
                            onClick={(e) => { e.preventDefault(); navigate(`${basePath}/students/add`); }}
                        >
                            <i className="ti ti-square-rounded-plus me-2"></i>Add New Student
                        </a>
                    </div>
                </div>
            </div>

            {/* Welcome Banner */}
            <div className="row">
                <div className="col-md-12">
                    <div className="card bg-dark">
                        <div className="overlay-img">
                            <img src="/assets/img/bg/shape-04.png" alt="img" className="img-fluid shape-01" />
                            <img src="/assets/img/bg/shape-01.png" alt="img" className="img-fluid shape-02" />
                            <img src="/assets/img/bg/shape-02.png" alt="img" className="img-fluid shape-03" />
                            <img src="/assets/img/bg/shape-03.png" alt="img" className="img-fluid shape-04" />
                        </div>
                        <div className="card-body">
                            <div className="d-flex align-items-xl-center justify-content-xl-between flex-xl-row flex-column">
                                <div className="mb-3 mb-xl-0">
                                    <h1 className="text-white me-2">Welcome Back, {currentSchool?.name}</h1>
                                    <p className="text-white">Have a Good day at work</p>
                                </div>
                                <p className="text-white"><i className="ti ti-refresh me-1"></i>Updated Recently</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Stat Cards */}
            <div className="row">
                {/* Total Students */}
                <div className="col-xxl-3 col-sm-6 d-flex">
                    <div className="card flex-fill animate-card">
                        <div className="card-body">
                            <div className="d-flex align-items-center">
                                <div className="avatar avatar-lg bg-danger-transparent rounded me-2 flex-shrink-0">
                                    <img src="/assets/img/icons/student.svg" alt="Students" />
                                </div>
                                <div>
                                    <h6 className="mb-1">Total Students</h6>
                                    <h3 className="mb-0">{loading ? '...' : students.length}</h3>
                                </div>
                            </div>
                            <div className="d-flex align-items-center justify-content-between border-top mt-3 pt-3">
                                <p className="mb-0">Active: <span className="text-dark fw-semibold">{activeStudents.length}</span></p>
                                <p className="mb-0">Inactive: <span className="text-dark fw-semibold">{students.length - activeStudents.length}</span></p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Total Staff */}
                <div className="col-xxl-3 col-sm-6 d-flex">
                    <div className="card flex-fill animate-card">
                        <div className="card-body">
                            <div className="d-flex align-items-center">
                                <div className="avatar avatar-lg bg-secondary-transparent rounded me-2 flex-shrink-0">
                                    <img src="/assets/img/icons/teacher.svg" alt="Staff" />
                                </div>
                                <div>
                                    <h6 className="mb-1">Total Staff</h6>
                                    <h3 className="mb-0">{loading ? '...' : staff.length}</h3>
                                </div>
                            </div>
                            <div className="d-flex align-items-center justify-content-between border-top mt-3 pt-3">
                                <p className="mb-0">Active: <span className="text-dark fw-semibold">{activeStaff.length}</span></p>
                                <p className="mb-0">Inactive: <span className="text-dark fw-semibold">{staff.length - activeStaff.length}</span></p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Total Classes */}
                <div className="col-xxl-3 col-sm-6 d-flex">
                    <div className="card flex-fill animate-card">
                        <div className="card-body">
                            <div className="d-flex align-items-center">
                                <div className="avatar avatar-lg bg-warning-transparent rounded me-2 flex-shrink-0">
                                    <img src="/assets/img/icons/staff.svg" alt="Classes" />
                                </div>
                                <div>
                                    <h6 className="mb-1">Total Classes</h6>
                                    <h3 className="mb-0">{loading ? '...' : uniqueGrades}</h3>
                                </div>
                            </div>
                            <div className="d-flex align-items-center justify-content-between border-top mt-3 pt-3">
                                <p className="mb-0 text-muted">{uniqueGrades} active grade{uniqueGrades !== 1 ? 's' : ''}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Attendance */}
                <div className="col-xxl-3 col-sm-6 d-flex">
                    <div className="card flex-fill animate-card">
                        <div className="card-body">
                            <div className="d-flex align-items-center">
                                <div className="avatar avatar-lg bg-success-transparent rounded me-2 flex-shrink-0">
                                    <img src="/assets/img/icons/subject.svg" alt="Attendance" />
                                </div>
                                <div>
                                    <h6 className="mb-1">Attendance</h6>
                                    <h3 className="mb-0">0%</h3>
                                </div>
                            </div>
                            <div className="d-flex align-items-center justify-content-between border-top mt-3 pt-3">
                                <p className="mb-0 text-muted">Tracking coming soon</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Charts Row 1 */}
            <div className="row">
                <div className="col-lg-8 d-flex">
                    <div className="card flex-fill">
                        <div className="card-header d-flex align-items-center justify-content-between">
                            <h4 className="card-title">Enrollment by Grade</h4>
                        </div>
                        <div className="card-body">
                            {enrollmentByGrade.data.length > 0 ? (
                                <ReactApexChart
                                    type="bar"
                                    height={260}
                                    options={getBarOptions(enrollmentByGrade.labels)}
                                    series={[{ name: 'Students', data: enrollmentByGrade.data }]}
                                />
                            ) : (
                                <div className="text-center text-muted py-5">No student data yet</div>
                            )}
                        </div>
                    </div>
                </div>
                <div className="col-lg-4 d-flex">
                    <div className="card flex-fill">
                        <div className="card-header d-flex align-items-center justify-content-between">
                            <h4 className="card-title">Staff by Designation</h4>
                        </div>
                        <div className="card-body">
                            {staffByDesignation.data.length > 0 ? (
                                <ReactApexChart
                                    type="donut"
                                    height={260}
                                    options={getDonutOptions(staffByDesignation.labels)}
                                    series={staffByDesignation.data}
                                />
                            ) : (
                                <div className="text-center text-muted py-5">No staff data yet</div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Charts Row 2 */}
            <div className="row">
                <div className="col-lg-8 d-flex">
                    <div className="card flex-fill">
                        <div className="card-header d-flex align-items-center justify-content-between">
                            <h4 className="card-title">Enrollment Growth</h4>
                        </div>
                        <div className="card-body">
                            {enrollmentTrend.data.length > 1 ? (
                                <ReactApexChart
                                    type="area"
                                    height={220}
                                    options={getAreaOptions(enrollmentTrend.labels)}
                                    series={[{ name: 'Students', data: enrollmentTrend.data }]}
                                />
                            ) : (
                                <div className="text-center text-muted py-5">
                                    {students.length === 0 ? 'No enrollment data yet' : 'Enroll students over time to see the trend'}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
                <div className="col-lg-4 d-flex">
                    <div className="card flex-fill">
                        <div className="card-header d-flex align-items-center justify-content-between">
                            <h4 className="card-title">Fee Collection</h4>
                        </div>
                        <div className="card-body d-flex flex-column align-items-center justify-content-center">
                            <ReactApexChart
                                type="radialBar"
                                height={200}
                                options={getRadialBarOptions(['Collection'])}
                                series={[0]}
                            />
                            <small className="text-muted mt-2">Fee tracking coming soon</small>
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="row">
                <div className="col-md-12">
                    <div className="card">
                        <div className="card-header d-flex align-items-center justify-content-between">
                            <h4 className="card-title">Quick Actions</h4>
                        </div>
                        <div className="card-body">
                            <div className="d-flex gap-3 flex-wrap">
                                <a
                                    className="d-flex flex-column align-items-center text-center text-decoration-none"
                                    href="#"
                                    onClick={(e) => { e.preventDefault(); navigate(`${basePath}/students`); }}
                                    style={{ cursor: 'pointer', minWidth: 80 }}
                                >
                                    <div className="avatar avatar-lg bg-primary-transparent rounded-circle mb-2 d-flex align-items-center justify-content-center">
                                        <i className="ti ti-user-plus fs-20 text-primary"></i>
                                    </div>
                                    <span className="text-dark fw-medium small">Admit Student</span>
                                </a>
                                <a
                                    className="d-flex flex-column align-items-center text-center text-decoration-none"
                                    href="#"
                                    onClick={(e) => { e.preventDefault(); navigate(`${basePath}/staff`); }}
                                    style={{ cursor: 'pointer', minWidth: 80 }}
                                >
                                    <div className="avatar avatar-lg bg-success-transparent rounded-circle mb-2 d-flex align-items-center justify-content-center">
                                        <i className="ti ti-shield-check fs-20 text-success"></i>
                                    </div>
                                    <span className="text-dark fw-medium small">Onboard Staff</span>
                                </a>
                                <a
                                    className="d-flex flex-column align-items-center text-center text-decoration-none"
                                    href="#"
                                    onClick={(e) => { e.preventDefault(); navigate(`${basePath}/audit`); }}
                                    style={{ cursor: 'pointer', minWidth: 80 }}
                                >
                                    <div className="avatar avatar-lg bg-info-transparent rounded-circle mb-2 d-flex align-items-center justify-content-center">
                                        <i className="ti ti-file-analytics fs-20 text-info"></i>
                                    </div>
                                    <span className="text-dark fw-medium small">Audit Log</span>
                                </a>
                                <a
                                    className="d-flex flex-column align-items-center text-center text-decoration-none"
                                    href="#"
                                    onClick={(e) => { e.preventDefault(); navigate(`${basePath}/plugins`); }}
                                    style={{ cursor: 'pointer', minWidth: 80 }}
                                >
                                    <div className="avatar avatar-lg bg-warning-transparent rounded-circle mb-2 d-flex align-items-center justify-content-center">
                                        <i className="ti ti-puzzle fs-20 text-warning"></i>
                                    </div>
                                    <span className="text-dark fw-medium small">Plugins</span>
                                </a>
                                <a
                                    className="d-flex flex-column align-items-center text-center text-decoration-none"
                                    href="#"
                                    onClick={(e) => { e.preventDefault(); navigate(`${basePath}/settings`); }}
                                    style={{ cursor: 'pointer', minWidth: 80 }}
                                >
                                    <div className="avatar avatar-lg bg-secondary-transparent rounded-circle mb-2 d-flex align-items-center justify-content-center">
                                        <i className="ti ti-settings fs-20 text-secondary"></i>
                                    </div>
                                    <span className="text-dark fw-medium small">Settings</span>
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Recent Activity */}
            <div className="row">
                <div className="col-md-12">
                    <div className="card">
                        <div className="card-header d-flex align-items-center justify-content-between">
                            <h4 className="card-title">Recent Activity</h4>
                        </div>
                        <div className="card-body">
                            {recentActivity.length === 0 && !loading ? (
                                <div className="text-center text-muted py-4">
                                    No recent activity yet. Actions will appear here as they happen.
                                </div>
                            ) : (
                                <div className="activity-wrap">
                                    {recentActivity.map((event) => {
                                        const badge = actionBadge(event.action);
                                        const borderColor = badge.color;
                                        return (
                                            <div
                                                key={event.id}
                                                className="d-flex align-items-start mb-3 pb-3"
                                                style={{ borderLeft: `2px solid ${borderColor}`, paddingLeft: 16 }}
                                            >
                                                <div
                                                    className="d-flex align-items-center justify-content-center rounded-circle flex-shrink-0 me-3"
                                                    style={{
                                                        width: 36,
                                                        height: 36,
                                                        background: badge.bg,
                                                        color: badge.color,
                                                        fontSize: 14,
                                                        fontWeight: 600,
                                                    }}
                                                >
                                                    {event.action.charAt(0)}
                                                </div>
                                                <div className="flex-grow-1 min-w-0">
                                                    <p className="mb-1 fw-medium" style={{ fontSize: 13, color: 'var(--erp-text-primary)' }}>
                                                        {actionText(event)}
                                                    </p>
                                                    <small className="text-muted">{timeAgo(event.created_at)}</small>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
