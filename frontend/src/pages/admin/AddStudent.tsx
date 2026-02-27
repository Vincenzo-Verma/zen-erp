import { useState, useEffect, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSchoolContext } from '../../contexts/SchoolContext';
import { apiRequest } from '../../lib/api';
import { CredentialCard } from '../../components/CredentialCard';

interface AdmitResponse {
    success: boolean;
    error?: string;
    message?: string;
    credentials?: { email: string; password: string };
}

export function AddStudent() {
    const navigate = useNavigate();
    const { currentSchool: school } = useSchoolContext();
    const token = localStorage.getItem('erp_token');

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [credentialsModal, setCredentialsModal] = useState<{ email: string; password: string } | null>(null);

    // Personal
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [dateOfBirth, setDateOfBirth] = useState('');
    const [gender, setGender] = useState('');
    const [phone, setPhone] = useState('');

    // Parent / Guardian
    const [parentName, setParentName] = useState('');
    const [parentEmail, setParentEmail] = useState('');
    const [parentPhone, setParentPhone] = useState('');
    const [address, setAddress] = useState('');

    // Academic
    const [admissionNumber, setAdmissionNumber] = useState('');
    const [classGrade, setClassGrade] = useState('');
    const [section, setSection] = useState('A');
    const [admissionDate, setAdmissionDate] = useState(new Date().toISOString().split('T')[0]);

    // Auto-fetch next admission number
    const [isFetchingNumber, setIsFetchingNumber] = useState(false);

    const fetchNextNumber = async () => {
        if (!school?.id) return;
        setIsFetchingNumber(true);
        try {
            const data = await apiRequest<{ number: string }>(`/api/v1/school/next-number/${school.id}/student`, { token });
            if (data.number) setAdmissionNumber(data.number);
        } catch {
            // ignore – user can still type manually
        } finally {
            setIsFetchingNumber(false);
        }
    };

    useEffect(() => {
        if (school?.id) fetchNextNumber();
    }, [school?.id]);

    const handleSubmit = async (e: FormEvent) => {
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
                    parent_email: parentEmail || undefined,
                },
            });

            if (!data.success) {
                throw new Error(data.error || data.message || 'Failed to admit student');
            }

            if (data.credentials) {
                setCredentialsModal(data.credentials);
            } else {
                navigate('../students');
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <>
            {/* Page Header */}
            <div className="d-md-flex d-block align-items-center justify-content-between mb-3">
                <div className="my-auto mb-2">
                    <h3 className="mb-1">Add Student</h3>
                    <nav>
                        <ol className="breadcrumb mb-0">
                            <li className="breadcrumb-item">
                                <a href="#" onClick={(e) => { e.preventDefault(); navigate('../../'); }}>Dashboard</a>
                            </li>
                            <li className="breadcrumb-item">
                                <a href="#" onClick={(e) => { e.preventDefault(); navigate('../students'); }}>Students</a>
                            </li>
                            <li className="breadcrumb-item active" aria-current="page">Add Student</li>
                        </ol>
                    </nav>
                </div>
            </div>

            <div className="row">
                <div className="col-md-12">
                    <form onSubmit={handleSubmit}>

                        {/* Personal Information */}
                        <div className="card">
                            <div className="card-header bg-light">
                                <div className="d-flex align-items-center">
                                    <span className="bg-white avatar avatar-sm me-2 text-gray-7 flex-shrink-0">
                                        <i className="ti ti-info-square-rounded fs-16"></i>
                                    </span>
                                    <h4 className="text-dark">Personal Information</h4>
                                </div>
                            </div>
                            <div className="card-body pb-1">
                                <div className="row row-cols-xxl-5 row-cols-md-6">
                                    <div className="col-xxl col-xl-3 col-md-6">
                                        <div className="mb-3">
                                            <label className="form-label">First Name <span className="text-danger">*</span></label>
                                            <input type="text" className="form-control" required value={firstName} onChange={(e) => setFirstName(e.target.value)} />
                                        </div>
                                    </div>
                                    <div className="col-xxl col-xl-3 col-md-6">
                                        <div className="mb-3">
                                            <label className="form-label">Last Name <span className="text-danger">*</span></label>
                                            <input type="text" className="form-control" required value={lastName} onChange={(e) => setLastName(e.target.value)} />
                                        </div>
                                    </div>
                                    <div className="col-xxl col-xl-3 col-md-6">
                                        <div className="mb-3">
                                            <label className="form-label">Date of Birth</label>
                                            <div className="input-icon position-relative">
                                                <span className="input-icon-addon">
                                                    <i className="ti ti-calendar"></i>
                                                </span>
                                                <input type="date" className="form-control" value={dateOfBirth} onChange={(e) => setDateOfBirth(e.target.value)} />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="col-xxl col-xl-3 col-md-6">
                                        <div className="mb-3">
                                            <label className="form-label">Gender</label>
                                            <select className="select form-control" value={gender} onChange={(e) => setGender(e.target.value)}>
                                                <option value="">Select</option>
                                                <option value="male">Male</option>
                                                <option value="female">Female</option>
                                                <option value="other">Other</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div className="col-xxl col-xl-3 col-md-6">
                                        <div className="mb-3">
                                            <label className="form-label">Phone</label>
                                            <input type="tel" className="form-control" value={phone} onChange={(e) => setPhone(e.target.value)} />
                                        </div>
                                    </div>
                                    <div className="col-xxl col-xl-3 col-md-6">
                                        <div className="mb-3">
                                            <label className="form-label">Admission Number <span className="text-danger">*</span></label>
                                            <div className="input-group">
                                                <input type="text" className="form-control" required value={admissionNumber} readOnly style={{ backgroundColor: '#f8f9fa' }} />
                                                <button className="btn btn-outline-secondary" type="button" onClick={fetchNextNumber} disabled={isFetchingNumber} title="Refresh number">
                                                    {isFetchingNumber ? <span className="spinner-border spinner-border-sm" /> : <i className="ti ti-refresh" />}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="col-xxl col-xl-3 col-md-6">
                                        <div className="mb-3">
                                            <label className="form-label">Admission Date</label>
                                            <div className="input-icon position-relative">
                                                <span className="input-icon-addon">
                                                    <i className="ti ti-calendar"></i>
                                                </span>
                                                <input type="date" className="form-control" value={admissionDate} onChange={(e) => setAdmissionDate(e.target.value)} />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="col-xxl col-xl-3 col-md-6">
                                        <div className="mb-3">
                                            <label className="form-label">Class Grade <span className="text-danger">*</span></label>
                                            <input type="number" className="form-control" required min={1} max={12} placeholder="e.g., 10" value={classGrade} onChange={(e) => setClassGrade(e.target.value)} />
                                        </div>
                                    </div>
                                    <div className="col-xxl col-xl-3 col-md-6">
                                        <div className="mb-3">
                                            <label className="form-label">Section <span className="text-danger">*</span></label>
                                            <input type="text" className="form-control" required placeholder="e.g., A" value={section} onChange={(e) => setSection(e.target.value)} />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Parents & Guardian Information */}
                        <div className="card">
                            <div className="card-header bg-light">
                                <div className="d-flex align-items-center">
                                    <span className="bg-white avatar avatar-sm me-2 text-gray-7 flex-shrink-0">
                                        <i className="ti ti-user-shield fs-16"></i>
                                    </span>
                                    <h4 className="text-dark">Parents & Guardian Information</h4>
                                </div>
                            </div>
                            <div className="card-body pb-1">
                                <div className="row">
                                    <div className="col-lg-3 col-md-6">
                                        <div className="mb-3">
                                            <label className="form-label">Parent / Guardian Name</label>
                                            <input type="text" className="form-control" value={parentName} onChange={(e) => setParentName(e.target.value)} />
                                        </div>
                                    </div>
                                    <div className="col-lg-3 col-md-6">
                                        <div className="mb-3">
                                            <label className="form-label">Email</label>
                                            <input type="email" className="form-control" value={parentEmail} onChange={(e) => setParentEmail(e.target.value)} />
                                        </div>
                                    </div>
                                    <div className="col-lg-3 col-md-6">
                                        <div className="mb-3">
                                            <label className="form-label">Phone Number</label>
                                            <input type="tel" className="form-control" value={parentPhone} onChange={(e) => setParentPhone(e.target.value)} />
                                        </div>
                                    </div>
                                    <div className="col-lg-3 col-md-6">
                                        <div className="mb-3">
                                            <label className="form-label">Address</label>
                                            <textarea className="form-control" rows={2} value={address} onChange={(e) => setAddress(e.target.value)} />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {error && (
                            <div className="alert alert-danger" role="alert">
                                {error}
                            </div>
                        )}

                        {/* Submit Actions */}
                        <div className="d-flex align-items-center justify-content-end">
                            <a
                                href="#"
                                className="btn btn-light me-3"
                                onClick={(e) => { e.preventDefault(); navigate('../students'); }}
                            >
                                Cancel
                            </a>
                            <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                                {isSubmitting ? (
                                    <>
                                        <span className="spinner-border spinner-border-sm me-2"></span>
                                        Submitting...
                                    </>
                                ) : (
                                    'Add Student'
                                )}
                            </button>
                        </div>

                    </form>
                </div>
            </div>

            {/* Credentials Modal */}
            {credentialsModal && (
                <CredentialCard
                    title="Student Admitted!"
                    subtitle="The student account has been successfully created."
                    email={credentialsModal.email}
                    password={credentialsModal.password}
                    personName={`${firstName} ${lastName}`}
                    schoolName={school?.name}
                    onClose={() => {
                        setCredentialsModal(null);
                        navigate('../students');
                    }}
                />
            )}
        </>
    );
}
