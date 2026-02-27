import { useState, useEffect, useCallback, useMemo } from 'react';
import { useSchoolContext } from '../../contexts/SchoolContext';
import { apiRequest } from '../../lib/api';
import { PageHeader } from '../../components/ui/PageHeader';
import { StatCard } from '../../components/ui/StatCard';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { IconUsers, IconSchool, IconChartBar } from '@tabler/icons-react';

interface Student {
    id: string;
    first_name: string;
    last_name: string;
    admission_number?: string;
    class_grade: number;
    section: string;
    is_active: boolean;
}

interface ClassGroup {
    grade: number;
    section: string;
    students: Student[];
}

export function AttendanceOverview() {
    const { currentSchool: school } = useSchoolContext();
    const [students, setStudents] = useState<Student[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedClass, setSelectedClass] = useState<string | null>(null);

    const token = localStorage.getItem('erp_token');

    const loadStudents = useCallback(async () => {
        if (!school?.id) return;
        setLoading(true);
        try {
            const data = await apiRequest<{ students: Student[] }>(
                `/api/v1/school/students/${school.id}`,
                { token }
            );
            setStudents((data.students || []).filter(s => s.is_active));
        } catch {
            setStudents([]);
        } finally {
            setLoading(false);
        }
    }, [school?.id, token]);

    useEffect(() => {
        loadStudents();
    }, [loadStudents]);

    const classGroups = useMemo(() => {
        const map = new Map<string, ClassGroup>();
        for (const s of students) {
            const key = `${s.class_grade}-${s.section || 'A'}`;
            if (!map.has(key)) {
                map.set(key, { grade: s.class_grade, section: s.section || 'A', students: [] });
            }
            map.get(key)!.students.push(s);
        }
        return Array.from(map.values()).sort((a, b) => a.grade - b.grade || a.section.localeCompare(b.section));
    }, [students]);

    const selectedGroup = selectedClass ? classGroups.find(g => `${g.grade}-${g.section}` === selectedClass) : null;
    const totalStudents = students.length;
    const totalClasses = classGroups.length;

    return (
        <div className="animate-fadeIn">
            <PageHeader
                title="Attendance Overview"
                breadcrumbs={[
                    { label: 'Dashboard', href: '../' },
                    { label: 'Attendance' },
                ]}
            />

            {loading ? (
                <div className="text-center py-5 text-muted">
                    <div className="spinner-border spinner-border-sm me-2" role="status" />
                    Loading class data...
                </div>
            ) : students.length === 0 ? (
                <div className="text-center py-5 text-muted">No students enrolled yet.</div>
            ) : (
                <>
                    <div className="row g-3 mb-4">
                        <div className="col-sm-4">
                            <StatCard label="Total Active Students" value={totalStudents} icon={<IconUsers size={22} />} variant="primary" />
                        </div>
                        <div className="col-sm-4">
                            <StatCard label="Classes / Sections" value={totalClasses} icon={<IconSchool size={22} />} variant="success" />
                        </div>
                        <div className="col-sm-4">
                            <StatCard
                                label="Avg Students / Class"
                                value={totalClasses > 0 ? Math.round(totalStudents / totalClasses) : 0}
                                icon={<IconChartBar size={22} />}
                                variant="warning"
                            />
                        </div>
                    </div>

                    {/* Class cards grid */}
                    <div className="row g-3 mb-4">
                        {classGroups.map((group) => {
                            const key = `${group.grade}-${group.section}`;
                            const isSelected = selectedClass === key;
                            return (
                                <div key={key} className="col-sm-6 col-md-4 col-lg-3">
                                    <div
                                        className={`card border-0 shadow-sm h-100 ${isSelected ? 'border-primary' : ''}`}
                                        style={{
                                            cursor: 'pointer',
                                            borderWidth: isSelected ? 2 : 0,
                                            borderStyle: 'solid',
                                            borderColor: isSelected ? 'var(--erp-primary)' : 'transparent',
                                        }}
                                        onClick={() => setSelectedClass(isSelected ? null : key)}
                                    >
                                        <div className="card-body">
                                            <div className="d-flex justify-content-between align-items-center">
                                                <h6 className="mb-0 fw-semibold">Class {group.grade}-{group.section}</h6>
                                                <span className="badge badge-soft-primary">{group.students.length} students</span>
                                            </div>
                                            <small className="text-muted mt-1 d-block">Click to view student list</small>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Selected class student table */}
                    {selectedGroup && (
                        <div className="card border-0 shadow-sm">
                            <div className="card-header bg-transparent border-bottom">
                                <h6 className="mb-0 fw-semibold">
                                    Class {selectedGroup.grade}-{selectedGroup.section} Students ({selectedGroup.students.length})
                                </h6>
                            </div>
                            <div className="card-body p-0">
                                <div className="table-responsive">
                                    <table className="table table-hover align-middle mb-0">
                                        <thead>
                                            <tr>
                                                <th>#</th>
                                                <th>Student Name</th>
                                                <th>Admission No</th>
                                                <th>Status</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {selectedGroup.students.map((s, i) => (
                                                <tr key={s.id}>
                                                    <td className="text-muted">{i + 1}</td>
                                                    <td style={{ fontWeight: 600, color: 'var(--erp-text-primary)' }}>
                                                        {s.first_name} {s.last_name}
                                                    </td>
                                                    <td style={{ fontFamily: 'monospace', fontSize: 13 }}>
                                                        {s.admission_number || '—'}
                                                    </td>
                                                    <td><StatusBadge label={s.is_active ? 'Active' : 'Inactive'} /></td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
