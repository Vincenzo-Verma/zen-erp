import { useState, useEffect, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSchoolContext } from '../../contexts/SchoolContext';
import { apiRequest } from '../../lib/api';
import { CredentialCard } from '../../components/CredentialCard';
import { PageHeader } from '../../components/ui/PageHeader';
import { IconArrowLeft, IconArrowRight, IconCheck } from '@tabler/icons-react';

interface OnboardResponse {
    success: boolean;
    error?: string;
    message?: string;
    credentials?: { email: string; password: string };
}

type Step = 0 | 1 | 2;

const stepLabels = ['Personal Info', 'Employment Details', 'Review & Submit'];

export function AddStaff() {
    const navigate = useNavigate();
    const { currentSchool: school } = useSchoolContext();
    const token = localStorage.getItem('erp_token');

    const [step, setStep] = useState<Step>(0);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [credentialsModal, setCredentialsModal] = useState<{ email: string; password: string } | null>(null);

    // Step 0 — Personal
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [dateOfBirth, setDateOfBirth] = useState('');
    const [gender, setGender] = useState('');

    // Step 1 — Employment
    const [employeeNumber, setEmployeeNumber] = useState('');
    const [designation, setDesignation] = useState('teacher');
    const [department, setDepartment] = useState('');
    const [joiningDate, setJoiningDate] = useState(new Date().toISOString().split('T')[0]);
    const [qualification, setQualification] = useState('');

    // Auto-fetch next employee number
    const [isFetchingNumber, setIsFetchingNumber] = useState(false);

    const fetchNextNumber = async () => {
        if (!school?.id) return;
        setIsFetchingNumber(true);
        try {
            const data = await apiRequest<{ number: string }>(`/api/v1/school/next-number/${school.id}/staff`, { token });
            if (data.number) setEmployeeNumber(data.number);
        } catch {
            // ignore – user can still type manually
        } finally {
            setIsFetchingNumber(false);
        }
    };

    useEffect(() => {
        if (school?.id) fetchNextNumber();
    }, [school?.id]);

    const canNext = (): boolean => {
        if (step === 0) return !!(firstName.trim() && lastName.trim());
        if (step === 1) return !!(employeeNumber.trim() && designation.trim());
        return true;
    };

    const handleSubmit = async (e: FormEvent) => {
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
                    department: department || undefined,
                },
            });

            if (!data.success) {
                throw new Error(data.error || data.message || 'Failed to onboard staff');
            }

            if (data.credentials) {
                setCredentialsModal(data.credentials);
            } else {
                navigate('../staff');
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="animate-fadeIn">
            <PageHeader
                title="Add New Staff"
                breadcrumbs={[
                    { label: 'Dashboard', href: '../../' },
                    { label: 'Staff', href: '../staff' },
                    { label: 'Add Staff' },
                ]}
            >
                <button className="btn btn-outline-secondary btn-sm" onClick={() => navigate('../staff')}>
                    <IconArrowLeft size={14} className="me-1" /> Back
                </button>
            </PageHeader>

            {/* Step Indicator */}
            <div className="card border-0 shadow-sm mb-4">
                <div className="card-body py-3">
                    <div className="d-flex align-items-center justify-content-between">
                        {stepLabels.map((label, i) => (
                            <div key={i} className="d-flex align-items-center gap-2 flex-fill">
                                <div
                                    className="d-flex align-items-center justify-content-center rounded-circle flex-shrink-0"
                                    style={{
                                        width: 32, height: 32,
                                        background: i < step ? 'var(--erp-success)' : i === step ? 'var(--erp-primary)' : 'var(--erp-soft-secondary)',
                                        color: i <= step ? '#fff' : 'var(--erp-text-muted)',
                                        fontWeight: 600, fontSize: 13,
                                        transition: 'all 0.2s',
                                    }}
                                >
                                    {i < step ? <IconCheck size={16} /> : i + 1}
                                </div>
                                <span
                                    className="d-none d-md-inline"
                                    style={{
                                        fontSize: 13,
                                        fontWeight: i === step ? 600 : 400,
                                        color: i === step ? 'var(--erp-text-primary)' : 'var(--erp-text-muted)',
                                    }}
                                >
                                    {label}
                                </span>
                                {i < stepLabels.length - 1 && (
                                    <div className="flex-fill mx-2" style={{ height: 2, background: i < step ? 'var(--erp-success)' : 'var(--erp-soft-secondary)' }} />
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <form onSubmit={handleSubmit}>
                {/* Step 0: Personal */}
                {step === 0 && (
                    <div className="card border-0 shadow-sm">
                        <div className="card-header bg-transparent border-bottom">
                            <h6 className="mb-0 fw-semibold">Personal Information</h6>
                        </div>
                        <div className="card-body">
                            <div className="row g-3">
                                <div className="col-md-6">
                                    <label className="form-label">First Name <span className="text-danger">*</span></label>
                                    <input className="form-control" required value={firstName} onChange={(e) => setFirstName(e.target.value)} />
                                </div>
                                <div className="col-md-6">
                                    <label className="form-label">Last Name <span className="text-danger">*</span></label>
                                    <input className="form-control" required value={lastName} onChange={(e) => setLastName(e.target.value)} />
                                </div>
                                <div className="col-md-6">
                                    <label className="form-label">Email</label>
                                    <input className="form-control" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                                </div>
                                <div className="col-md-6">
                                    <label className="form-label">Phone</label>
                                    <input className="form-control" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
                                </div>
                                <div className="col-md-6">
                                    <label className="form-label">Date of Birth</label>
                                    <input className="form-control" type="date" value={dateOfBirth} onChange={(e) => setDateOfBirth(e.target.value)} />
                                </div>
                                <div className="col-md-6">
                                    <label className="form-label">Gender</label>
                                    <select className="form-select" value={gender} onChange={(e) => setGender(e.target.value)}>
                                        <option value="">Select...</option>
                                        <option value="male">Male</option>
                                        <option value="female">Female</option>
                                        <option value="other">Other</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Step 1: Employment */}
                {step === 1 && (
                    <div className="card border-0 shadow-sm">
                        <div className="card-header bg-transparent border-bottom">
                            <h6 className="mb-0 fw-semibold">Employment Details</h6>
                        </div>
                        <div className="card-body">
                            <div className="row g-3">
                                <div className="col-md-6">
                                    <label className="form-label">Employee Number <span className="text-danger">*</span></label>
                                    <div className="input-group">
                                        <input className="form-control" required value={employeeNumber} readOnly style={{ backgroundColor: '#f8f9fa' }} />
                                        <button className="btn btn-outline-secondary" type="button" onClick={fetchNextNumber} disabled={isFetchingNumber} title="Refresh number">
                                            {isFetchingNumber ? <span className="spinner-border spinner-border-sm" /> : <i className="ti ti-refresh" />}
                                        </button>
                                    </div>
                                </div>
                                <div className="col-md-6">
                                    <label className="form-label">Designation <span className="text-danger">*</span></label>
                                    <select className="form-select" required value={designation} onChange={(e) => setDesignation(e.target.value)}>
                                        <option value="teacher">Teacher</option>
                                        <option value="receptionist">Receptionist</option>
                                        <option value="accountant">Accountant</option>
                                        <option value="principal">Principal</option>
                                        <option value="librarian">Librarian</option>
                                        <option value="lab_assistant">Lab Assistant</option>
                                    </select>
                                </div>
                                <div className="col-md-6">
                                    <label className="form-label">Department</label>
                                    <input className="form-control" placeholder="e.g., Science" value={department} onChange={(e) => setDepartment(e.target.value)} />
                                </div>
                                <div className="col-md-6">
                                    <label className="form-label">Joining Date</label>
                                    <input className="form-control" type="date" value={joiningDate} onChange={(e) => setJoiningDate(e.target.value)} />
                                </div>
                                <div className="col-md-6">
                                    <label className="form-label">Qualification</label>
                                    <input className="form-control" placeholder="e.g., M.Ed, B.Tech" value={qualification} onChange={(e) => setQualification(e.target.value)} />
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Step 2: Review */}
                {step === 2 && (
                    <div className="card border-0 shadow-sm">
                        <div className="card-header bg-transparent border-bottom">
                            <h6 className="mb-0 fw-semibold">Review & Submit</h6>
                        </div>
                        <div className="card-body">
                            <div className="row g-4">
                                <div className="col-md-6">
                                    <h6 className="text-muted fw-semibold mb-2" style={{ fontSize: 12 }}>PERSONAL</h6>
                                    <div className="mb-1"><strong>Name:</strong> {firstName} {lastName}</div>
                                    {email && <div className="mb-1"><strong>Email:</strong> {email}</div>}
                                    {phone && <div className="mb-1"><strong>Phone:</strong> {phone}</div>}
                                    {dateOfBirth && <div className="mb-1"><strong>DoB:</strong> {dateOfBirth}</div>}
                                    {gender && <div className="mb-1"><strong>Gender:</strong> {gender}</div>}
                                </div>
                                <div className="col-md-6">
                                    <h6 className="text-muted fw-semibold mb-2" style={{ fontSize: 12 }}>EMPLOYMENT</h6>
                                    <div className="mb-1"><strong>Employee No:</strong> <code>{employeeNumber}</code></div>
                                    <div className="mb-1"><strong>Designation:</strong> <span className="text-capitalize">{designation}</span></div>
                                    {department && <div className="mb-1"><strong>Department:</strong> {department}</div>}
                                    {joiningDate && <div className="mb-1"><strong>Joining Date:</strong> {joiningDate}</div>}
                                    {qualification && <div className="mb-1"><strong>Qualification:</strong> {qualification}</div>}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {error && <div className="alert alert-danger mt-3 py-2">{error}</div>}

                {/* Navigation Buttons */}
                <div className="d-flex justify-content-between mt-4">
                    <button
                        type="button"
                        className="btn btn-outline-secondary"
                        disabled={step === 0}
                        onClick={() => setStep((s) => (s - 1) as Step)}
                    >
                        <IconArrowLeft size={14} className="me-1" /> Previous
                    </button>

                    {step < 2 ? (
                        <button
                            type="button"
                            className="btn btn-primary"
                            disabled={!canNext()}
                            onClick={() => setStep((s) => (s + 1) as Step)}
                        >
                            Next <IconArrowRight size={14} className="ms-1" />
                        </button>
                    ) : (
                        <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={isSubmitting || !school?.id}
                        >
                            {isSubmitting ? (
                                <>
                                    <span className="spinner-border spinner-border-sm me-1" />
                                    Onboarding...
                                </>
                            ) : (
                                <>
                                    <IconCheck size={14} className="me-1" /> Onboard Staff
                                </>
                            )}
                        </button>
                    )}
                </div>
            </form>

            {/* Credentials Modal */}
            {credentialsModal && (
                <CredentialCard
                    title="Staff Onboarded!"
                    subtitle="The staff account has been successfully created."
                    email={credentialsModal.email}
                    password={credentialsModal.password}
                    personName={`${firstName} ${lastName}`}
                    schoolName={school?.name}
                    onClose={() => {
                        setCredentialsModal(null);
                        navigate('../staff');
                    }}
                />
            )}
        </div>
    );
}
