import { useState, useEffect, useCallback, type FormEvent } from 'react';
import { useSchoolContext } from '../../contexts/SchoolContext';
import { apiRequest } from '../../lib/api';
import { CredentialCard } from '../../components/CredentialCard';
import { PageHeader } from '../../components/ui/PageHeader';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { BootstrapModal } from '../../components/ui/BootstrapModal';
import { DataTable, type Column } from '../../components/ui/DataTable';

interface Student {
    id: string;
    admission_number: string;
    first_name: string;
    last_name: string;
    class_grade: number;
    section: string;
    is_active: boolean;
}

interface AdmitResponse {
    success: boolean;
    error?: string;
    message?: string;
    credentials?: { email: string; password: string };
}

const columns: Column<Student>[] = [
    {
        key: 'admission_number',
        label: 'Admission No',
        sortable: true,
        render: (row) => (
            <span style={{ fontFamily: 'monospace', fontSize: 13 }}>{row.admission_number}</span>
        ),
    },
    {
        key: 'first_name',
        label: 'Student Name',
        sortable: true,
        render: (row) => (
            <div className="d-flex align-items-center gap-2">
                <div
                    className="d-flex align-items-center justify-content-center rounded-circle flex-shrink-0"
                    style={{
                        width: 32, height: 32,
                        background: 'var(--erp-soft-primary)',
                        color: 'var(--erp-primary)',
                        fontWeight: 600, fontSize: 13,
                    }}
                >
                    {row.first_name.charAt(0)}{row.last_name.charAt(0)}
                </div>
                <span style={{ fontWeight: 600, color: 'var(--erp-text-primary)' }}>
                    {row.first_name} {row.last_name}
                </span>
            </div>
        ),
    },
    {
        key: 'class_grade',
        label: 'Class',
        sortable: true,
        render: (row) => <span className="badge badge-soft-primary">{row.class_grade}</span>,
    },
    {
        key: 'section',
        label: 'Section',
        sortable: true,
    },
    {
        key: 'is_active',
        label: 'Status',
        render: (row) => <StatusBadge label={row.is_active ? 'Active' : 'Inactive'} />,
    },
];

export function StaffAdmissions() {
    const { currentSchool: school } = useSchoolContext();
    const [students, setStudents] = useState<Student[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAdmitModalOpen, setIsAdmitModalOpen] = useState(false);
    const [credentialsModal, setCredentialsModal] = useState<{ email: string; password: string } | null>(null);
    const [admittedName, setAdmittedName] = useState('');

    // Form state
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [admissionNumber, setAdmissionNumber] = useState('');
    const [classGrade, setClassGrade] = useState('');
    const [section, setSection] = useState('A');
    const [parentEmail, setParentEmail] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    const token = localStorage.getItem('erp_token');

    const loadStudents = useCallback(async () => {
        if (!school?.id) return;
        setLoading(true);
        try {
            const data = await apiRequest<{ students: Student[] }>(
                `/api/v1/school/students/${school.id}`,
                { token }
            );
            setStudents(data.students || []);
        } catch {
            setStudents([]);
        } finally {
            setLoading(false);
        }
    }, [school?.id, token]);

    useEffect(() => {
        loadStudents();
    }, [loadStudents]);

    const handleAdmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!school?.id) {
            setError('School not loaded. Please refresh the page.');
            return;
        }
        setError('');
        setIsSubmitting(true);
        try {
            const data = await apiRequest<AdmitResponse>('/api/v1/school/students', {
                method: 'POST',
                token,
                body: {
                    tenant_id: school.id,
                    admission_number: admissionNumber,
                    first_name: firstName,
                    last_name: lastName,
                    class_grade: parseInt(classGrade),
                    section,
                    parent_email: parentEmail,
                },
            });

            if (!data.success) {
                throw new Error(data.error || data.message || 'Failed to admit student');
            }

            if (data.credentials) {
                setAdmittedName(`${firstName} ${lastName}`);
                setCredentialsModal(data.credentials);
            }
            setIsAdmitModalOpen(false);
            setFirstName(''); setLastName(''); setAdmissionNumber(''); setClassGrade(''); setSection('A'); setParentEmail('');
            loadStudents();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="animate-fadeIn">
            <PageHeader
                title="Student Admissions"
                breadcrumbs={[
                    { label: 'Dashboard', href: '../' },
                    { label: 'Admissions' },
                ]}
            >
                <button className="btn btn-primary btn-sm" onClick={() => setIsAdmitModalOpen(true)}>
                    + Admit Student
                </button>
            </PageHeader>

            <DataTable<Student>
                columns={columns}
                data={students}
                rowKey="id"
                loading={loading}
                searchPlaceholder="Search by name or admission number..."
                searchKeys={['first_name', 'last_name', 'admission_number']}
                emptyMessage='No students admitted yet. Click "+ Admit Student" to get started.'
                pageSize={10}
            />

            {/* Admit Modal */}
            <BootstrapModal
                isOpen={isAdmitModalOpen}
                onClose={() => setIsAdmitModalOpen(false)}
                title="Admit New Student"
                footer={
                    <>
                        <button className="btn btn-secondary" onClick={() => setIsAdmitModalOpen(false)}>Cancel</button>
                        <button
                            className="btn btn-primary"
                            disabled={isSubmitting || !school?.id}
                            form="staff-admit-form"
                            type="submit"
                        >
                            {isSubmitting ? 'Admitting...' : 'Admit Student'}
                        </button>
                    </>
                }
            >
                <form id="staff-admit-form" onSubmit={handleAdmit}>
                    <div className="row g-3">
                        <div className="col-md-6">
                            <label className="form-label">First Name</label>
                            <input className="form-control" required value={firstName} onChange={e => setFirstName(e.target.value)} />
                        </div>
                        <div className="col-md-6">
                            <label className="form-label">Last Name</label>
                            <input className="form-control" required value={lastName} onChange={e => setLastName(e.target.value)} />
                        </div>
                        <div className="col-12">
                            <label className="form-label">Admission Number</label>
                            <input className="form-control" required placeholder="e.g., ADM-2025-001" value={admissionNumber} onChange={e => setAdmissionNumber(e.target.value)} />
                        </div>
                        <div className="col-md-6">
                            <label className="form-label">Class Grade</label>
                            <input className="form-control" required type="number" placeholder="e.g., 10" value={classGrade} onChange={e => setClassGrade(e.target.value)} />
                        </div>
                        <div className="col-md-6">
                            <label className="form-label">Section</label>
                            <input className="form-control" required placeholder="e.g., A" value={section} onChange={e => setSection(e.target.value)} />
                        </div>
                        <div className="col-12">
                            <label className="form-label">Parent Email <span className="text-muted">(Optional)</span></label>
                            <input className="form-control" type="email" value={parentEmail} onChange={e => setParentEmail(e.target.value)} />
                        </div>
                    </div>
                    {error && <div className="alert alert-danger mt-3 mb-0 py-2">{error}</div>}
                </form>
            </BootstrapModal>

            {/* Credentials Modal */}
            {credentialsModal && (
                <CredentialCard
                    title="Student Admitted!"
                    subtitle="The student's account has been successfully created. Please hand these credentials to the student."
                    email={credentialsModal.email}
                    password={credentialsModal.password}
                    personName={admittedName}
                    schoolName={school?.name}
                    onClose={() => setCredentialsModal(null)}
                />
            )}
        </div>
    );
}
