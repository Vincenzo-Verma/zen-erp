import { useState, useEffect, useCallback, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSchoolContext } from '../../contexts/SchoolContext';
import { apiRequest } from '../../lib/api';
import { CredentialCard } from '../../components/CredentialCard';
import { PageHeader } from '../../components/ui/PageHeader';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { BootstrapModal } from '../../components/ui/BootstrapModal';
import { DataTable, type Column } from '../../components/ui/DataTable';

interface StaffMember {
    id: string;
    user_id: string;
    employee_number: string;
    full_name: string;
    designation: string;
    department: string;
    is_active: boolean;
    created_at: string;
    [key: string]: unknown;
}

interface OnboardResponse {
    success: boolean;
    error?: string;
    message?: string;
    credentials?: { email: string; password: string };
}

const columns: Column<StaffMember>[] = [
    {
        key: 'full_name',
        label: 'Name',
        sortable: true,
        render: (row) => (
            <div className="d-flex align-items-center gap-2">
                <div
                    className="d-flex align-items-center justify-content-center rounded-circle flex-shrink-0"
                    style={{
                        width: 32, height: 32,
                        background: 'var(--erp-soft-success)',
                        color: 'var(--erp-success)',
                        fontWeight: 600, fontSize: 13,
                    }}
                >
                    {row.full_name?.charAt(0)?.toUpperCase() || '?'}
                </div>
                <span style={{ fontWeight: 600, color: 'var(--erp-text-primary)' }}>{row.full_name}</span>
            </div>
        ),
    },
    {
        key: 'employee_number',
        label: 'Employee No',
        sortable: true,
        render: (row) => (
            <span style={{ fontFamily: 'monospace', fontSize: 13 }}>{row.employee_number}</span>
        ),
    },
    {
        key: 'designation',
        label: 'Designation',
        sortable: true,
        render: (row) => (
            <span className="text-capitalize">{row.designation}</span>
        ),
    },
    {
        key: 'department',
        label: 'Department',
        render: (row) => row.department ? <span className="badge badge-soft-primary">{row.department}</span> : <span className="text-muted">-</span>,
    },
    {
        key: 'is_active',
        label: 'Status',
        render: (row) => <StatusBadge label={row.is_active ? 'Active' : 'Inactive'} />,
    },
    {
        key: 'actions',
        label: 'Actions',
        render: () => (
            <button className="btn btn-sm btn-outline-primary">View</button>
        ),
    },
];

export function StaffDirectory() {
    const { currentSchool: school } = useSchoolContext();
    const navigate = useNavigate();
    const [staffList, setStaffList] = useState<StaffMember[]>([]);
    const [loading, setLoading] = useState(true);
    const [isOnboardModalOpen, setIsOnboardModalOpen] = useState(false);
    const [credentialsModal, setCredentialsModal] = useState<{ email: string; password: string } | null>(null);
    const [onboardedName, setOnboardedName] = useState('');

    // Form state
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [employeeNumber, setEmployeeNumber] = useState('');
    const [designation, setDesignation] = useState('teacher');
    const [department, setDepartment] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    const token = localStorage.getItem('erp_token');

    const loadStaff = useCallback(async () => {
        if (!school?.id) return;
        setLoading(true);
        try {
            const data = await apiRequest<{ staff: StaffMember[] }>(
                `/api/v1/school/staff/${school.id}`,
                { token }
            );
            setStaffList(data.staff || []);
        } catch {
            setStaffList([]);
        } finally {
            setLoading(false);
        }
    }, [school?.id, token]);

    useEffect(() => {
        loadStaff();
    }, [loadStaff]);

    const handleOnboard = async (e: FormEvent) => {
        e.preventDefault();
        if (!school?.id) {
            setError('School not loaded. Please refresh the page.');
            return;
        }
        setError('');
        setIsSubmitting(true);
        try {
            const data = await apiRequest<OnboardResponse>('/api/v1/school/staff', {
                method: 'POST',
                token,
                body: {
                    tenant_id: school.id,
                    first_name: firstName,
                    last_name: lastName,
                    employee_number: employeeNumber,
                    designation,
                    department,
                },
            });

            if (!data.success) {
                throw new Error(data.error || data.message || 'Failed to onboard staff');
            }

            if (data.credentials) {
                setOnboardedName(`${firstName} ${lastName}`);
                setCredentialsModal(data.credentials);
            }
            setIsOnboardModalOpen(false);
            setFirstName(''); setLastName(''); setEmployeeNumber(''); setDesignation('teacher'); setDepartment('');
            loadStaff();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="animate-fadeIn">
            <PageHeader
                title="Staff Directory"
                breadcrumbs={[
                    { label: 'Dashboard', href: '../' },
                    { label: 'Staff' },
                ]}
            >
                <div className="d-flex gap-2">
                    <button className="btn btn-outline-primary btn-sm" onClick={() => navigate('add')}>
                        + Add Staff
                    </button>
                    <button className="btn btn-primary btn-sm" onClick={() => setIsOnboardModalOpen(true)}>
                        + Quick Onboard
                    </button>
                </div>
            </PageHeader>

            <DataTable<StaffMember>
                columns={columns}
                data={staffList}
                rowKey="id"
                loading={loading}
                searchPlaceholder="Search staff..."
                searchKeys={['full_name', 'designation', 'department']}
                emptyMessage='No staff onboarded yet. Click "+ Onboard Staff" to get started.'
                pageSize={10}
            />

            {/* Onboard Modal */}
            <BootstrapModal
                isOpen={isOnboardModalOpen}
                onClose={() => setIsOnboardModalOpen(false)}
                title="Onboard New Staff"
                footer={
                    <>
                        <button className="btn btn-secondary" onClick={() => setIsOnboardModalOpen(false)}>Cancel</button>
                        <button
                            className="btn btn-primary"
                            disabled={isSubmitting || !school?.id}
                            form="onboard-form"
                            type="submit"
                        >
                            {isSubmitting ? 'Onboarding...' : 'Onboard Staff'}
                        </button>
                    </>
                }
            >
                <form id="onboard-form" onSubmit={handleOnboard}>
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
                            <label className="form-label">Employee Number</label>
                            <input className="form-control" required placeholder="e.g., EMP-101" value={employeeNumber} onChange={e => setEmployeeNumber(e.target.value)} />
                        </div>
                        <div className="col-md-6">
                            <label className="form-label">Designation</label>
                            <select className="form-select" required value={designation} onChange={e => setDesignation(e.target.value)}>
                                <option value="teacher">Teacher</option>
                                <option value="receptionist">Receptionist</option>
                                <option value="accountant">Accountant</option>
                                <option value="principal">Principal</option>
                            </select>
                        </div>
                        <div className="col-md-6">
                            <label className="form-label">Department</label>
                            <input className="form-control" placeholder="e.g., Science" value={department} onChange={e => setDepartment(e.target.value)} />
                        </div>
                    </div>
                    {error && <div className="alert alert-danger mt-3 mb-0 py-2">{error}</div>}
                </form>
            </BootstrapModal>

            {/* Credentials Modal */}
            {credentialsModal && (
                <CredentialCard
                    title="Staff Onboarded!"
                    subtitle="The staff account has been successfully generated. Please securely distribute these login credentials."
                    email={credentialsModal.email}
                    password={credentialsModal.password}
                    personName={onboardedName}
                    schoolName={school?.name}
                    onClose={() => setCredentialsModal(null)}
                />
            )}
        </div>
    );
}
