import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSchoolContext } from '../../contexts/SchoolContext';
import { apiRequest } from '../../lib/api';
import { PageHeader } from '../../components/ui/PageHeader';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { StatCard } from '../../components/ui/StatCard';
import {
    IconMail, IconSchool, IconCalendar,
    IconCoin, IconClipboardCheck, IconArrowLeft, IconEdit,
} from '@tabler/icons-react';
import { BootstrapModal } from '../../components/ui/BootstrapModal';

interface Student {
    id: string;
    admission_number: string;
    first_name: string;
    last_name: string;
    class_grade: number;
    section: string;
    parent_email: string;
    is_active: boolean;
    created_at: string;
}

// Mock detail-level data (no API yet)
const mockAttendance = [
    { month: 'January', present: 22, total: 23 },
    { month: 'February', present: 18, total: 20 },
    { month: 'March', present: 20, total: 22 },
    { month: 'April', present: 19, total: 21 },
];

const mockFees = [
    { head: 'Tuition Fee', amount: 5000, status: 'paid', date: '2025-01-15' },
    { head: 'Transport Fee', amount: 1500, status: 'paid', date: '2025-01-15' },
    { head: 'Lab Fee', amount: 800, status: 'unpaid', date: null },
    { head: 'Sports Fee', amount: 600, status: 'unpaid', date: null },
];

const mockResults = [
    { exam: 'Mid-Term', date: 'Oct 2025', percentage: 82, grade: 'A' },
    { exam: 'Unit Test 3', date: 'Sep 2025', percentage: 76, grade: 'B+' },
    { exam: 'Half-Yearly', date: 'Aug 2025', percentage: 88, grade: 'A+' },
];

type Tab = 'details' | 'fees' | 'attendance' | 'results';

export function StudentDetails() {
    const { studentId } = useParams<{ studentId: string }>();
    const navigate = useNavigate();
    const { currentSchool: school } = useSchoolContext();
    const [student, setStudent] = useState<Student | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<Tab>('details');

    const token = localStorage.getItem('erp_token');
    const { userRole } = useSchoolContext();
    const canEdit = ['admin', 'receptionist'].includes(userRole);

    // Edit modal state
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editFirstName, setEditFirstName] = useState('');
    const [editLastName, setEditLastName] = useState('');
    const [editClassGrade, setEditClassGrade] = useState('');
    const [editSection, setEditSection] = useState('');
    const [editParentEmail, setEditParentEmail] = useState('');
    const [editIsActive, setEditIsActive] = useState(true);
    const [editSubmitting, setEditSubmitting] = useState(false);
    const [editError, setEditError] = useState('');

    const openEditModal = () => {
        if (!student) return;
        setEditFirstName(student.first_name);
        setEditLastName(student.last_name);
        setEditClassGrade(String(student.class_grade));
        setEditSection(student.section);
        setEditParentEmail(student.parent_email || '');
        setEditIsActive(student.is_active);
        setEditError('');
        setIsEditModalOpen(true);
    };

    const handleEditSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!school?.id || !student) return;
        setEditSubmitting(true);
        setEditError('');
        try {
            const data = await apiRequest<{ success: boolean; error?: string; message?: string }>(
                `/api/v1/school/student/${school.id}/${student.id}`,
                {
                    method: 'PUT',
                    token,
                    body: {
                        first_name: editFirstName,
                        last_name: editLastName,
                        class_grade: parseInt(editClassGrade),
                        section: editSection,
                        parent_email: editParentEmail,
                        is_active: editIsActive,
                        editor_user_id: localStorage.getItem('erp_user_id') || '',
                        editor_email: localStorage.getItem('erp_user_email') || '',
                    },
                }
            );
            if (!data.success) {
                throw new Error(data.error || data.message || 'Failed to update student');
            }
            setIsEditModalOpen(false);
            loadStudent(); // reload details
        } catch (err: any) {
            setEditError(err.message);
        } finally {
            setEditSubmitting(false);
        }
    };

    const loadStudent = useCallback(async () => {
        if (!school?.id || !studentId) return;
        setLoading(true);
        try {
            const data = await apiRequest<{ students: Student[] }>(
                `/api/v1/school/students/${school.id}`,
                { token }
            );
            const found = (data.students || []).find((s) => s.id === studentId);
            setStudent(found || null);
        } catch {
            setStudent(null);
        } finally {
            setLoading(false);
        }
    }, [school?.id, studentId, token]);

    useEffect(() => {
        loadStudent();
    }, [loadStudent]);

    const attendancePct = useMemo(() => {
        const totalPresent = mockAttendance.reduce((s, m) => s + m.present, 0);
        const totalDays = mockAttendance.reduce((s, m) => s + m.total, 0);
        return totalDays > 0 ? Math.round((totalPresent / totalDays) * 100) : 0;
    }, []);

    const feesPaid = mockFees.filter((f) => f.status === 'paid').reduce((s, f) => s + f.amount, 0);
    const feesPending = mockFees.filter((f) => f.status === 'unpaid').reduce((s, f) => s + f.amount, 0);

    if (loading) {
        return (
            <div className="animate-fadeIn">
                <PageHeader
                    title="Student Details"
                    breadcrumbs={[
                        { label: 'Dashboard', href: '../../' },
                        { label: 'Students', href: '../' },
                        { label: 'Loading...' },
                    ]}
                />
                <div className="text-center py-5">
                    <div className="spinner-border text-primary" role="status" />
                </div>
            </div>
        );
    }

    if (!student) {
        return (
            <div className="animate-fadeIn">
                <PageHeader
                    title="Student Not Found"
                    breadcrumbs={[
                        { label: 'Dashboard', href: '../../' },
                        { label: 'Students', href: '../' },
                        { label: 'Not Found' },
                    ]}
                />
                <div className="alert alert-warning">
                    No student found with the given ID. They may have been removed or the link is invalid.
                </div>
                <button className="btn btn-primary btn-sm" onClick={() => navigate('../students')}>
                    <IconArrowLeft size={14} className="me-1" /> Back to Students
                </button>
            </div>
        );
    }

    const tabs: { key: Tab; label: string }[] = [
        { key: 'details', label: 'Details' },
        { key: 'fees', label: 'Fees' },
        { key: 'attendance', label: 'Attendance' },
        { key: 'results', label: 'Results' },
    ];

    return (
        <div className="animate-fadeIn">
            <PageHeader
                title="Student Details"
                breadcrumbs={[
                    { label: 'Dashboard', href: '../../' },
                    { label: 'Students', href: '../' },
                    { label: `${student.first_name} ${student.last_name}` },
                ]}
            >
                <div className="d-flex gap-2">
                    {canEdit && (
                        <button className="btn btn-primary btn-sm" onClick={openEditModal}>
                            <IconEdit size={14} className="me-1" /> Edit Student
                        </button>
                    )}
                    <button className="btn btn-outline-secondary btn-sm" onClick={() => navigate('../students')}>
                        <IconArrowLeft size={14} className="me-1" /> Back
                    </button>
                </div>
            </PageHeader>

            {/* Demo banner */}
            <div className="alert alert-warning d-flex align-items-center gap-2 py-2 mb-3" style={{ fontSize: 14 }}>
                <span className="badge bg-warning text-dark" style={{ fontSize: 10, letterSpacing: '0.05em' }}>SAMPLE DATA</span>
                Fee, attendance, and result data shown below is for demonstration only.
            </div>

            <div className="row g-4">
                {/* Left Sidebar — Student Card */}
                <div className="col-lg-4">
                    <div className="card border-0 shadow-sm">
                        <div className="card-body text-center">
                            <div
                                className="d-inline-flex align-items-center justify-content-center rounded-circle mb-3"
                                style={{
                                    width: 80, height: 80,
                                    background: 'var(--erp-soft-primary)',
                                    color: 'var(--erp-primary)',
                                    fontWeight: 700, fontSize: 28,
                                }}
                            >
                                {student.first_name.charAt(0)}{student.last_name.charAt(0)}
                            </div>
                            <h5 className="fw-bold mb-1">{student.first_name} {student.last_name}</h5>
                            <p className="text-muted mb-2" style={{ fontSize: 13 }}>
                                {student.admission_number}
                            </p>
                            <StatusBadge label={student.is_active ? 'Active' : 'Inactive'} />

                            <hr className="my-3" />

                            <div className="text-start">
                                <div className="d-flex align-items-center gap-2 mb-2" style={{ fontSize: 14 }}>
                                    <IconSchool size={16} className="text-muted" />
                                    <span>Class {student.class_grade} — Section {student.section}</span>
                                </div>
                                {student.parent_email && (
                                    <div className="d-flex align-items-center gap-2 mb-2" style={{ fontSize: 14 }}>
                                        <IconMail size={16} className="text-muted" />
                                        <span className="text-truncate">{student.parent_email}</span>
                                    </div>
                                )}
                                <div className="d-flex align-items-center gap-2 mb-2" style={{ fontSize: 14 }}>
                                    <IconCalendar size={16} className="text-muted" />
                                    <span>Admitted {new Date(student.created_at).toLocaleDateString()}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Quick Stats */}
                    <div className="mt-3 d-flex flex-column gap-3">
                        <StatCard label="Attendance" value={attendancePct} suffix="%" icon={<IconClipboardCheck size={22} />} variant="success" />
                        <StatCard label="Fees Pending" value={feesPending} prefix="$" icon={<IconCoin size={22} />} variant="warning" />
                    </div>
                </div>

                {/* Right Content — Tabs */}
                <div className="col-lg-8">
                    <ul className="nav nav-pills mb-3">
                        {tabs.map((t) => (
                            <li key={t.key} className="nav-item">
                                <button
                                    className={`nav-link${activeTab === t.key ? ' active' : ''}`}
                                    onClick={() => setActiveTab(t.key)}
                                >
                                    {t.label}
                                </button>
                            </li>
                        ))}
                    </ul>

                    {/* Details Tab */}
                    {activeTab === 'details' && (
                        <div className="card border-0 shadow-sm">
                            <div className="card-header bg-transparent border-bottom">
                                <h6 className="mb-0 fw-semibold">Personal Information</h6>
                            </div>
                            <div className="card-body">
                                <div className="row g-3">
                                    <div className="col-md-6">
                                        <label className="form-label text-muted" style={{ fontSize: 12 }}>First Name</label>
                                        <div style={{ fontWeight: 600 }}>{student.first_name}</div>
                                    </div>
                                    <div className="col-md-6">
                                        <label className="form-label text-muted" style={{ fontSize: 12 }}>Last Name</label>
                                        <div style={{ fontWeight: 600 }}>{student.last_name}</div>
                                    </div>
                                    <div className="col-md-6">
                                        <label className="form-label text-muted" style={{ fontSize: 12 }}>Admission Number</label>
                                        <div style={{ fontFamily: 'monospace', fontWeight: 600 }}>{student.admission_number}</div>
                                    </div>
                                    <div className="col-md-6">
                                        <label className="form-label text-muted" style={{ fontSize: 12 }}>Status</label>
                                        <div><StatusBadge label={student.is_active ? 'Active' : 'Inactive'} /></div>
                                    </div>
                                    <div className="col-md-6">
                                        <label className="form-label text-muted" style={{ fontSize: 12 }}>Class / Section</label>
                                        <div>
                                            <span className="badge badge-soft-primary me-1">{student.class_grade}</span>
                                            <span>{student.section}</span>
                                        </div>
                                    </div>
                                    <div className="col-md-6">
                                        <label className="form-label text-muted" style={{ fontSize: 12 }}>Parent Email</label>
                                        <div>{student.parent_email || <span className="text-muted">Not provided</span>}</div>
                                    </div>
                                    <div className="col-md-6">
                                        <label className="form-label text-muted" style={{ fontSize: 12 }}>Admitted On</label>
                                        <div>{new Date(student.created_at).toLocaleDateString()}</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Fees Tab */}
                    {activeTab === 'fees' && (
                        <div className="card border-0 shadow-sm">
                            <div className="card-header bg-transparent border-bottom d-flex justify-content-between align-items-center">
                                <h6 className="mb-0 fw-semibold">Fee Statement</h6>
                                <div className="d-flex gap-3" style={{ fontSize: 13 }}>
                                    <span className="text-success fw-semibold">Paid: ${feesPaid.toLocaleString()}</span>
                                    <span className="text-danger fw-semibold">Pending: ${feesPending.toLocaleString()}</span>
                                </div>
                            </div>
                            <div className="card-body p-0">
                                <div className="table-responsive">
                                    <table className="table table-hover align-middle mb-0">
                                        <thead>
                                            <tr>
                                                <th>Fee Head</th>
                                                <th>Amount</th>
                                                <th>Status</th>
                                                <th>Paid Date</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {mockFees.map((f, i) => (
                                                <tr key={i}>
                                                    <td style={{ fontWeight: 600 }}>{f.head}</td>
                                                    <td>${f.amount.toLocaleString()}</td>
                                                    <td><StatusBadge label={f.status === 'paid' ? 'Paid' : 'Pending'} /></td>
                                                    <td>{f.date || '—'}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Attendance Tab */}
                    {activeTab === 'attendance' && (
                        <div className="card border-0 shadow-sm">
                            <div className="card-header bg-transparent border-bottom d-flex justify-content-between align-items-center">
                                <h6 className="mb-0 fw-semibold">Monthly Attendance</h6>
                                <span className="badge badge-soft-success">Overall: {attendancePct}%</span>
                            </div>
                            <div className="card-body p-0">
                                <div className="table-responsive">
                                    <table className="table table-hover align-middle mb-0">
                                        <thead>
                                            <tr>
                                                <th>Month</th>
                                                <th>Present</th>
                                                <th>Total Days</th>
                                                <th>Percentage</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {mockAttendance.map((m, i) => {
                                                const pct = Math.round((m.present / m.total) * 100);
                                                return (
                                                    <tr key={i}>
                                                        <td style={{ fontWeight: 600 }}>{m.month}</td>
                                                        <td>{m.present}</td>
                                                        <td>{m.total}</td>
                                                        <td>
                                                            <div className="d-flex align-items-center gap-2">
                                                                <div className="progress flex-grow-1" style={{ height: 6 }}>
                                                                    <div
                                                                        className={`progress-bar ${pct >= 90 ? 'bg-success' : pct >= 75 ? 'bg-warning' : 'bg-danger'}`}
                                                                        style={{ width: `${pct}%` }}
                                                                    />
                                                                </div>
                                                                <span style={{ fontSize: 13, fontWeight: 600, minWidth: 36 }}>{pct}%</span>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Results Tab */}
                    {activeTab === 'results' && (
                        <div className="d-flex flex-column gap-3">
                            {mockResults.map((r, i) => (
                                <div key={i} className="card border-0 shadow-sm">
                                    <div className="card-body d-flex align-items-center gap-4 flex-wrap">
                                        <div className="flex-grow-1">
                                            <h6 className="mb-1 fw-semibold">{r.exam}</h6>
                                            <small className="text-muted">{r.date}</small>
                                        </div>
                                        <div className="text-center">
                                            <h4 className="mb-0 fw-bold" style={{
                                                color: r.percentage >= 80 ? 'var(--erp-success)' : r.percentage >= 60 ? 'var(--erp-warning)' : 'var(--erp-danger)',
                                            }}>
                                                {r.percentage}%
                                            </h4>
                                            <StatusBadge label={`Grade ${r.grade}`} variant="primary" />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Edit Student Modal */}
            <BootstrapModal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                title={`Edit Student: ${student.first_name} ${student.last_name}`}
                footer={
                    <>
                        <button className="btn btn-secondary" onClick={() => setIsEditModalOpen(false)}>Cancel</button>
                        <button
                            className="btn btn-primary"
                            disabled={editSubmitting}
                            onClick={(e) => handleEditSubmit(e as unknown as React.FormEvent)}
                            form="edit-student-form"
                            type="submit"
                        >
                            {editSubmitting ? 'Saving...' : 'Save Changes'}
                        </button>
                    </>
                }
            >
                <form id="edit-student-form" onSubmit={handleEditSubmit}>
                    <div className="row g-3">
                        <div className="col-md-6">
                            <label className="form-label">First Name</label>
                            <input className="form-control" required value={editFirstName} onChange={e => setEditFirstName(e.target.value)} />
                        </div>
                        <div className="col-md-6">
                            <label className="form-label">Last Name</label>
                            <input className="form-control" required value={editLastName} onChange={e => setEditLastName(e.target.value)} />
                        </div>
                        <div className="col-md-6">
                            <label className="form-label">Class Grade</label>
                            <input className="form-control" required type="number" value={editClassGrade} onChange={e => setEditClassGrade(e.target.value)} />
                        </div>
                        <div className="col-md-6">
                            <label className="form-label">Section</label>
                            <input className="form-control" required value={editSection} onChange={e => setEditSection(e.target.value)} />
                        </div>
                        <div className="col-12">
                            <label className="form-label">Parent Email <span className="text-muted">(Optional)</span></label>
                            <input className="form-control" type="email" value={editParentEmail} onChange={e => setEditParentEmail(e.target.value)} />
                        </div>
                        <div className="col-12">
                            <div className="form-check form-switch">
                                <input
                                    className="form-check-input"
                                    type="checkbox"
                                    id="edit-is-active-detail"
                                    checked={editIsActive}
                                    onChange={(e) => setEditIsActive(e.target.checked)}
                                />
                                <label className="form-check-label" htmlFor="edit-is-active-detail">
                                    Active
                                </label>
                            </div>
                        </div>
                    </div>
                    {editError && <div className="alert alert-danger mt-3 mb-0 py-2">{editError}</div>}
                </form>
            </BootstrapModal>
        </div>
    );
}
