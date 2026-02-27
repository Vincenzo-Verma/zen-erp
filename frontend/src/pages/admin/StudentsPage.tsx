import { useState, useEffect, useCallback, useMemo, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSchoolContext } from '../../contexts/SchoolContext';
import { apiRequest } from '../../lib/api';
import { CredentialCard } from '../../components/CredentialCard';
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

interface AdmitResponse {
    success: boolean;
    error?: string;
    message?: string;
    credentials?: { email: string; password: string };
}

interface UpdateResponse {
    success: boolean;
    error?: string;
    message?: string;
    student?: Student;
}

interface DeleteResponse {
    success: boolean;
    error?: string;
    message?: string;
}

const PAGE_SIZE = 10;
const EDIT_ROLES = ['admin', 'receptionist'];

export function StudentsPage() {
    const { currentSchool: school, userRole } = useSchoolContext();
    const navigate = useNavigate();
    const [students, setStudents] = useState<Student[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAdmitModalOpen, setIsAdmitModalOpen] = useState(false);
    const [credentialsModal, setCredentialsModal] = useState<{ email: string; password: string } | null>(null);
    const [admittedName, setAdmittedName] = useState('');

    // Search, sort & pagination state
    const [searchTerm, setSearchTerm] = useState('');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
    const [currentPage, setCurrentPage] = useState(1);
    const [selectAll, setSelectAll] = useState(false);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

    // Admit form state
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [admissionNumber, setAdmissionNumber] = useState('');
    const [classGrade, setClassGrade] = useState('');
    const [section, setSection] = useState('A');
    const [parentEmail, setParentEmail] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    // Edit modal state
    const [editStudent, setEditStudent] = useState<Student | null>(null);
    const [editFirstName, setEditFirstName] = useState('');
    const [editLastName, setEditLastName] = useState('');
    const [editClassGrade, setEditClassGrade] = useState('');
    const [editSection, setEditSection] = useState('');
    const [editParentEmail, setEditParentEmail] = useState('');
    const [editIsActive, setEditIsActive] = useState(true);
    const [editSubmitting, setEditSubmitting] = useState(false);
    const [editError, setEditError] = useState('');

    // Delete confirmation state
    const [deleteStudent, setDeleteStudent] = useState<Student | null>(null);
    const [deleteSubmitting, setDeleteSubmitting] = useState(false);
    const [deleteError, setDeleteError] = useState('');

    // Password reset state
    const [resetPwStudent, setResetPwStudent] = useState<Student | null>(null);
    const [resetPwSubmitting, setResetPwSubmitting] = useState(false);
    const [resetPwError, setResetPwError] = useState('');
    const [newPassword, setNewPassword] = useState('');

    const token = localStorage.getItem('erp_token');
    const canEdit = EDIT_ROLES.includes(userRole);

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

    // Filtered + sorted students
    const filteredStudents = useMemo(() => {
        let result = students;

        // Search filter
        if (searchTerm.trim()) {
            const term = searchTerm.toLowerCase();
            result = result.filter(
                (s) =>
                    s.first_name.toLowerCase().includes(term) ||
                    s.last_name.toLowerCase().includes(term) ||
                    s.admission_number.toLowerCase().includes(term)
            );
        }

        // Sort by name
        result = [...result].sort((a, b) => {
            const nameA = `${a.first_name} ${a.last_name}`.toLowerCase();
            const nameB = `${b.first_name} ${b.last_name}`.toLowerCase();
            return sortOrder === 'asc' ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA);
        });

        return result;
    }, [students, searchTerm, sortOrder]);

    // Pagination
    const totalPages = Math.max(1, Math.ceil(filteredStudents.length / PAGE_SIZE));
    const paginatedStudents = useMemo(() => {
        const start = (currentPage - 1) * PAGE_SIZE;
        return filteredStudents.slice(start, start + PAGE_SIZE);
    }, [filteredStudents, currentPage]);

    // Reset to page 1 when search changes
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm]);

    // Select all toggle
    const handleSelectAll = () => {
        if (selectAll) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(paginatedStudents.map((s) => s.id)));
        }
        setSelectAll(!selectAll);
    };

    const handleSelectRow = (id: string) => {
        const next = new Set(selectedIds);
        if (next.has(id)) {
            next.delete(id);
        } else {
            next.add(id);
        }
        setSelectedIds(next);
        setSelectAll(next.size === paginatedStudents.length && paginatedStudents.length > 0);
    };

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

    // ── Edit handlers ──

    const openEditModal = (student: Student) => {
        setEditStudent(student);
        setEditFirstName(student.first_name);
        setEditLastName(student.last_name);
        setEditClassGrade(String(student.class_grade));
        setEditSection(student.section);
        setEditParentEmail(student.parent_email || '');
        setEditIsActive(student.is_active);
        setEditError('');
    };

    const closeEditModal = () => {
        setEditStudent(null);
        setEditError('');
    };

    const handleEditSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!school?.id || !editStudent) return;
        setEditSubmitting(true);
        setEditError('');
        try {
            const data = await apiRequest<UpdateResponse>(
                `/api/v1/school/student/${school.id}/${editStudent.id}`,
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
            closeEditModal();
            loadStudents();
        } catch (err: any) {
            setEditError(err.message);
        } finally {
            setEditSubmitting(false);
        }
    };

    // ── Delete handlers ──

    const openDeleteConfirm = (student: Student) => {
        setDeleteStudent(student);
        setDeleteError('');
    };

    const closeDeleteConfirm = () => {
        setDeleteStudent(null);
        setDeleteError('');
    };

    const handleDeleteConfirm = async () => {
        if (!school?.id || !deleteStudent) return;
        setDeleteSubmitting(true);
        setDeleteError('');
        try {
            const params = new URLSearchParams();
            params.set('editor_user_id', localStorage.getItem('erp_user_id') || '');
            params.set('editor_email', localStorage.getItem('erp_user_email') || '');

            const data = await apiRequest<DeleteResponse>(
                `/api/v1/school/student/${school.id}/${deleteStudent.id}?${params.toString()}`,
                { method: 'DELETE', token }
            );
            if (!data.success) {
                throw new Error(data.error || data.message || 'Failed to delete student');
            }
            closeDeleteConfirm();
            loadStudents();
        } catch (err: any) {
            setDeleteError(err.message);
        } finally {
            setDeleteSubmitting(false);
        }
    };

    // ── Password Reset handlers ──

    const openResetPwModal = (student: Student) => {
        setResetPwStudent(student);
        setNewPassword('');
        setResetPwError('');
    };

    const closeResetPwModal = () => {
        setResetPwStudent(null);
        setNewPassword('');
        setResetPwError('');
    };

    const handleResetPwSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!school?.id || !resetPwStudent) return;
        setResetPwSubmitting(true);
        setResetPwError('');
        try {
            const data = await apiRequest<{ success: boolean; error?: string; message?: string; new_password?: string }>(
                `/api/v1/school/student/${school.id}/${resetPwStudent.id}/password`,
                {
                    method: 'POST',
                    token,
                    body: {
                        new_password: newPassword.trim() || undefined,
                        editor_user_id: localStorage.getItem('erp_user_id') || '',
                        editor_email: localStorage.getItem('erp_user_email') || '',
                    },
                }
            );

            if (!data.success) {
                throw new Error(data.error || data.message || 'Failed to reset password');
            }

            if (data.new_password) {
                setAdmittedName(`${resetPwStudent.first_name} ${resetPwStudent.last_name}`);
                setCredentialsModal({
                    email: resetPwStudent.parent_email || `${resetPwStudent.admission_number}@school.com`, // Default fallback if missing
                    password: data.new_password,
                });
            }

            closeResetPwModal();
        } catch (err: any) {
            setResetPwError(err.message);
        } finally {
            setResetPwSubmitting(false);
        }
    };

    const getInitials = (first: string, last: string) => {
        return `${first.charAt(0)}${last.charAt(0)}`.toUpperCase();
    };

    const renderPagination = () => {
        if (totalPages <= 1) return null;

        const pages: (number | string)[] = [];
        const maxVisible = 5;

        if (totalPages <= maxVisible + 2) {
            for (let i = 1; i <= totalPages; i++) pages.push(i);
        } else {
            pages.push(1);
            if (currentPage > 3) pages.push('...');
            const start = Math.max(2, currentPage - 1);
            const end = Math.min(totalPages - 1, currentPage + 1);
            for (let i = start; i <= end; i++) pages.push(i);
            if (currentPage < totalPages - 2) pages.push('...');
            pages.push(totalPages);
        }

        return (
            <div className="d-flex align-items-center justify-content-between p-3">
                <div className="text-muted small">
                    Showing {((currentPage - 1) * PAGE_SIZE) + 1} to{' '}
                    {Math.min(currentPage * PAGE_SIZE, filteredStudents.length)} of{' '}
                    {filteredStudents.length} entries
                </div>
                <nav>
                    <ul className="pagination mb-0">
                        <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                            <a
                                className="page-link"
                                href="#"
                                onClick={(e) => { e.preventDefault(); if (currentPage > 1) setCurrentPage(currentPage - 1); }}
                            >
                                <i className="ti ti-chevron-left"></i>
                            </a>
                        </li>
                        {pages.map((page, idx) =>
                            typeof page === 'string' ? (
                                <li key={`ellipsis-${idx}`} className="page-item disabled">
                                    <span className="page-link">...</span>
                                </li>
                            ) : (
                                <li key={page} className={`page-item ${currentPage === page ? 'active' : ''}`}>
                                    <a
                                        className="page-link"
                                        href="#"
                                        onClick={(e) => { e.preventDefault(); setCurrentPage(page); }}
                                    >
                                        {page}
                                    </a>
                                </li>
                            )
                        )}
                        <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                            <a
                                className="page-link"
                                href="#"
                                onClick={(e) => { e.preventDefault(); if (currentPage < totalPages) setCurrentPage(currentPage + 1); }}
                            >
                                <i className="ti ti-chevron-right"></i>
                            </a>
                        </li>
                    </ul>
                </nav>
            </div>
        );
    };

    return (
        <div className="animate-fadeIn">
            {/* Page Header */}
            <div className="d-md-flex d-block align-items-center justify-content-between mb-3">
                <div className="my-auto mb-2">
                    <h3 className="page-title mb-1">Students List</h3>
                    <nav>
                        <ol className="breadcrumb mb-0">
                            <li className="breadcrumb-item">
                                <a href="#" onClick={(e) => { e.preventDefault(); navigate('../'); }}>Dashboard</a>
                            </li>
                            <li className="breadcrumb-item">Students</li>
                            <li className="breadcrumb-item active" aria-current="page">All Students</li>
                        </ol>
                    </nav>
                </div>
                <div className="d-flex my-xl-auto right-content align-items-center flex-wrap">
                    <div className="pe-1 mb-2">
                        <a
                            className="btn btn-outline-light bg-white btn-icon me-1"
                            href="#"
                            onClick={(e) => { e.preventDefault(); loadStudents(); }}
                            title="Refresh"
                        >
                            <i className="ti ti-refresh"></i>
                        </a>
                    </div>
                    <div className="dropdown me-2 mb-2">
                        <a
                            className="dropdown-toggle btn btn-light fw-medium d-inline-flex align-items-center"
                            href="#"
                            role="button"
                            data-bs-toggle="dropdown"
                            aria-expanded="false"
                        >
                            <i className="ti ti-file-export me-2"></i>Export
                        </a>
                        <ul className="dropdown-menu dropdown-menu-end p-3">
                            <li>
                                <a className="dropdown-item rounded-1" href="#">
                                    <i className="ti ti-file-type-pdf me-2"></i>Export as PDF
                                </a>
                            </li>
                            <li>
                                <a className="dropdown-item rounded-1" href="#">
                                    <i className="ti ti-file-type-xls me-2"></i>Export as Excel
                                </a>
                            </li>
                        </ul>
                    </div>
                    {canEdit && (
                        <>
                            <div className="me-2 mb-2">
                                <a
                                    className="btn btn-primary d-flex align-items-center"
                                    href="#"
                                    onClick={(e) => { e.preventDefault(); navigate('add'); }}
                                >
                                    <i className="ti ti-square-rounded-plus me-2"></i>Add Student
                                </a>
                            </div>
                            <div className="mb-2">
                                <a
                                    className="btn btn-outline-primary d-flex align-items-center"
                                    href="#"
                                    onClick={(e) => { e.preventDefault(); setIsAdmitModalOpen(true); }}
                                >
                                    <i className="ti ti-bolt me-2"></i>Quick Admit
                                </a>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* List Card */}
            <div className="card">
                <div className="card-header d-flex align-items-center justify-content-between flex-wrap pb-0">
                    <h4 className="mb-3">Students List</h4>
                    <div className="d-flex align-items-center flex-wrap">
                        {/* Search input */}
                        <div className="input-icon-start mb-3 me-2 position-relative">
                            <span className="icon-addon">
                                <i className="ti ti-search"></i>
                            </span>
                            <input
                                type="text"
                                className="form-control"
                                placeholder="Search student..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        {/* Sort dropdown */}
                        <div className="dropdown mb-3">
                            <a
                                className="btn btn-outline-light bg-white dropdown-toggle"
                                href="#"
                                role="button"
                                data-bs-toggle="dropdown"
                                aria-expanded="false"
                            >
                                <i className="ti ti-sort-ascending-2 me-2"></i>
                                Sort by {sortOrder === 'asc' ? 'A-Z' : 'Z-A'}
                            </a>
                            <ul className="dropdown-menu p-3">
                                <li>
                                    <a
                                        className={`dropdown-item rounded-1 ${sortOrder === 'asc' ? 'active' : ''}`}
                                        href="#"
                                        onClick={(e) => { e.preventDefault(); setSortOrder('asc'); }}
                                    >
                                        Ascending
                                    </a>
                                </li>
                                <li>
                                    <a
                                        className={`dropdown-item rounded-1 ${sortOrder === 'desc' ? 'active' : ''}`}
                                        href="#"
                                        onClick={(e) => { e.preventDefault(); setSortOrder('desc'); }}
                                    >
                                        Descending
                                    </a>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
                <div className="card-body p-0 py-3">
                    <div className="custom-datatable-filter table-responsive">
                        {loading ? (
                            <div className="text-center py-5">
                                <div className="spinner-border text-primary" role="status">
                                    <span className="visually-hidden">Loading...</span>
                                </div>
                                <p className="mt-2 text-muted">Loading students...</p>
                            </div>
                        ) : filteredStudents.length === 0 ? (
                            <div className="text-center py-5">
                                <i className="ti ti-users-group fs-1 text-muted d-block mb-2"></i>
                                <p className="text-muted mb-0">
                                    {searchTerm
                                        ? 'No students match your search.'
                                        : 'No students admitted yet. Click "Add Student" or "Quick Admit" to get started.'}
                                </p>
                            </div>
                        ) : (
                            <>
                                <table className="table datatable">
                                    <thead className="thead-light">
                                        <tr>
                                            <th className="no-sort">
                                                <div className="form-check form-check-md">
                                                    <input
                                                        className="form-check-input"
                                                        type="checkbox"
                                                        id="select-all"
                                                        checked={selectAll}
                                                        onChange={handleSelectAll}
                                                    />
                                                </div>
                                            </th>
                                            <th>Admission No</th>
                                            <th>Name</th>
                                            <th>Class</th>
                                            <th>Section</th>
                                            <th>Status</th>
                                            <th>Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {paginatedStudents.map((student) => (
                                            <tr key={student.id}>
                                                <td>
                                                    <div className="form-check form-check-md">
                                                        <input
                                                            className="form-check-input"
                                                            type="checkbox"
                                                            checked={selectedIds.has(student.id)}
                                                            onChange={() => handleSelectRow(student.id)}
                                                        />
                                                    </div>
                                                </td>
                                                <td>
                                                    <a
                                                        className="link-primary"
                                                        href="#"
                                                        onClick={(e) => { e.preventDefault(); navigate(student.id); }}
                                                    >
                                                        {student.admission_number}
                                                    </a>
                                                </td>
                                                <td>
                                                    <div className="d-flex align-items-center">
                                                        <a
                                                            className="avatar avatar-md"
                                                            href="#"
                                                            onClick={(e) => { e.preventDefault(); navigate(student.id); }}
                                                        >
                                                            <span
                                                                className="d-flex align-items-center justify-content-center rounded-circle bg-primary-transparent w-100 h-100"
                                                                style={{ fontWeight: 600, fontSize: 14 }}
                                                            >
                                                                {getInitials(student.first_name, student.last_name)}
                                                            </span>
                                                        </a>
                                                        <div className="ms-2">
                                                            <p className="text-dark mb-0">
                                                                <a
                                                                    href="#"
                                                                    onClick={(e) => { e.preventDefault(); navigate(student.id); }}
                                                                >
                                                                    {student.first_name} {student.last_name}
                                                                </a>
                                                            </p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td>{student.class_grade}</td>
                                                <td>{student.section}</td>
                                                <td>
                                                    {student.is_active ? (
                                                        <span className="badge badge-soft-success d-inline-flex align-items-center">
                                                            <i className="ti ti-circle-filled fs-5 me-1"></i>Active
                                                        </span>
                                                    ) : (
                                                        <span className="badge badge-soft-danger d-inline-flex align-items-center">
                                                            <i className="ti ti-circle-filled fs-5 me-1"></i>Inactive
                                                        </span>
                                                    )}
                                                </td>
                                                <td>
                                                    <div className="d-flex align-items-center">
                                                        <div className="dropdown">
                                                            <a
                                                                className="btn btn-white btn-icon btn-sm d-flex align-items-center justify-content-center rounded-circle p-0"
                                                                href="#"
                                                                role="button"
                                                                data-bs-toggle="dropdown"
                                                                aria-expanded="false"
                                                            >
                                                                <i className="ti ti-dots-vertical fs-14"></i>
                                                            </a>
                                                            <ul className="dropdown-menu dropdown-menu-right p-3">
                                                                <li>
                                                                    <a
                                                                        className="dropdown-item rounded-1"
                                                                        href="#"
                                                                        onClick={(e) => { e.preventDefault(); navigate(student.id); }}
                                                                    >
                                                                        <i className="ti ti-menu me-2"></i>View
                                                                    </a>
                                                                </li>
                                                                {canEdit && (
                                                                    <>
                                                                        <li>
                                                                            <a
                                                                                className="dropdown-item rounded-1"
                                                                                href="#"
                                                                                onClick={(e) => { e.preventDefault(); openEditModal(student); }}
                                                                            >
                                                                                <i className="ti ti-edit-circle me-2"></i>Edit
                                                                            </a>
                                                                        </li>
                                                                        <li>
                                                                            <a
                                                                                className="dropdown-item rounded-1"
                                                                                href="#"
                                                                                onClick={(e) => { e.preventDefault(); openResetPwModal(student); }}
                                                                            >
                                                                                <i className="ti ti-key me-2"></i>Reset Password
                                                                            </a>
                                                                        </li>
                                                                        <li>
                                                                            <a
                                                                                className="dropdown-item rounded-1 text-danger"
                                                                                href="#"
                                                                                onClick={(e) => { e.preventDefault(); openDeleteConfirm(student); }}
                                                                            >
                                                                                <i className="ti ti-trash-x me-2"></i>Delete
                                                                            </a>
                                                                        </li>
                                                                    </>
                                                                )}
                                                            </ul>
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                {renderPagination()}
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Quick Admit Modal */}
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
                            onClick={(e) => handleAdmit(e as unknown as FormEvent)}
                            form="admit-form"
                            type="submit"
                        >
                            {isSubmitting ? 'Admitting...' : 'Admit Student'}
                        </button>
                    </>
                }
            >
                <form id="admit-form" onSubmit={handleAdmit}>
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

            {/* Edit Student Modal */}
            <BootstrapModal
                isOpen={!!editStudent}
                onClose={closeEditModal}
                title={editStudent ? `Edit Student: ${editStudent.first_name} ${editStudent.last_name}` : 'Edit Student'}
                footer={
                    <>
                        <button className="btn btn-secondary" onClick={closeEditModal}>Cancel</button>
                        <button
                            className="btn btn-primary"
                            disabled={editSubmitting}
                            onClick={(e) => handleEditSubmit(e as unknown as FormEvent)}
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
                                    id="edit-is-active"
                                    checked={editIsActive}
                                    onChange={(e) => setEditIsActive(e.target.checked)}
                                />
                                <label className="form-check-label" htmlFor="edit-is-active">
                                    Active
                                </label>
                            </div>
                        </div>
                    </div>
                    {editError && <div className="alert alert-danger mt-3 mb-0 py-2">{editError}</div>}
                </form>
            </BootstrapModal>

            {/* Delete Confirmation Modal */}
            <BootstrapModal
                isOpen={!!deleteStudent}
                onClose={closeDeleteConfirm}
                title="Delete Student"
                size="sm"
                footer={
                    <>
                        <button className="btn btn-secondary" onClick={closeDeleteConfirm}>Cancel</button>
                        <button
                            className="btn btn-danger"
                            disabled={deleteSubmitting}
                            onClick={handleDeleteConfirm}
                        >
                            {deleteSubmitting ? 'Deleting...' : 'Delete'}
                        </button>
                    </>
                }
            >
                <p className="mb-1">
                    Are you sure you want to delete <strong>{deleteStudent?.first_name} {deleteStudent?.last_name}</strong>?
                </p>
                <p className="text-muted small mb-0">
                    Admission No: {deleteStudent?.admission_number}. This action cannot be undone.
                </p>
                {deleteError && <div className="alert alert-danger mt-3 mb-0 py-2">{deleteError}</div>}
            </BootstrapModal>

            {/* Reset Password Modal */}
            <BootstrapModal
                isOpen={!!resetPwStudent}
                onClose={closeResetPwModal}
                title={`Reset Password: ${resetPwStudent?.first_name} ${resetPwStudent?.last_name}`}
                footer={
                    <>
                        <button className="btn btn-secondary" onClick={closeResetPwModal}>Cancel</button>
                        <button
                            className="btn btn-primary"
                            disabled={resetPwSubmitting}
                            onClick={(e) => handleResetPwSubmit(e as unknown as FormEvent)}
                            form="reset-pw-form"
                            type="submit"
                        >
                            {resetPwSubmitting ? 'Resetting...' : 'Reset Password'}
                        </button>
                    </>
                }
            >
                <form id="reset-pw-form" onSubmit={handleResetPwSubmit}>
                    <p className="mb-3 text-muted">
                        Leave the password field blank to automatically generate a secure 10-character password.
                    </p>
                    <div className="mb-3">
                        <label className="form-label">New Password <span className="text-muted">(Optional)</span></label>
                        <input
                            type="text"
                            className="form-control"
                            placeholder="Auto-generate if empty"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                        />
                    </div>
                    {resetPwError && <div className="alert alert-danger mb-0 py-2">{resetPwError}</div>}
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
