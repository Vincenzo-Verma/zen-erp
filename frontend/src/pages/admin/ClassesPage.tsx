import { useState, useEffect, useCallback, useMemo } from 'react';
import { useSchoolContext } from '../../contexts/SchoolContext';
import { apiRequest } from '../../lib/api';
import { PageHeader } from '../../components/ui/PageHeader';
import { IconUsers, IconSchool as IconSchoolIcon } from '@tabler/icons-react';

interface Student {
    id: string;
    first_name: string;
    last_name: string;
    class_grade: number;
    section: string;
    is_active: boolean;
}

interface StaffMember {
    id: string;
    full_name: string;
    designation: string;
    is_active: boolean;
}

interface GradeInfo {
    grade: number;
    sections: string[];
    studentCount: number;
    teacherCount: number;
}

export function ClassesPage() {
    const { currentSchool: school } = useSchoolContext();
    const [students, setStudents] = useState<Student[]>([]);
    const [staff, setStaff] = useState<StaffMember[]>([]);
    const [loading, setLoading] = useState(true);

    const token = localStorage.getItem('erp_token');

    const loadData = useCallback(async () => {
        if (!school?.id) return;
        setLoading(true);
        try {
            const [studentsRes, staffRes] = await Promise.allSettled([
                apiRequest<{ students: Student[] }>(`/api/v1/school/students/${school.id}`, { token }),
                apiRequest<{ staff: StaffMember[] }>(`/api/v1/school/staff/${school.id}`, { token }),
            ]);
            if (studentsRes.status === 'fulfilled') setStudents(studentsRes.value.students || []);
            if (staffRes.status === 'fulfilled') setStaff(staffRes.value.staff || []);
        } catch {
            // silent
        } finally {
            setLoading(false);
        }
    }, [school?.id, token]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const grades = useMemo<GradeInfo[]>(() => {
        const gradeMap = new Map<number, Set<string>>();
        const gradeStudentCount = new Map<number, number>();

        for (const s of students.filter(s => s.is_active)) {
            const g = s.class_grade;
            if (!gradeMap.has(g)) gradeMap.set(g, new Set());
            gradeMap.get(g)!.add(s.section || 'A');
            gradeStudentCount.set(g, (gradeStudentCount.get(g) || 0) + 1);
        }

        const teacherCount = staff.filter(s => s.is_active && s.designation === 'teacher').length;
        const totalGrades = gradeMap.size || 1;

        return Array.from(gradeMap.entries())
            .sort((a, b) => a[0] - b[0])
            .map(([grade, sections]) => ({
                grade,
                sections: Array.from(sections).sort(),
                studentCount: gradeStudentCount.get(grade) || 0,
                teacherCount: Math.round(teacherCount / totalGrades),
            }));
    }, [students, staff]);

    return (
        <div className="animate-fadeIn">
            <PageHeader
                title="Classes & Sections"
                breadcrumbs={[
                    { label: 'Dashboard', href: '../' },
                    { label: 'Classes' },
                ]}
            />

            {loading ? (
                <div className="text-center py-5 text-muted">
                    <div className="spinner-border spinner-border-sm me-2" role="status" />
                    Loading classes...
                </div>
            ) : grades.length === 0 ? (
                <div className="card border-0 shadow-sm">
                    <div className="card-body text-center py-5 text-muted">
                        No classes found. Admit students to see class structure.
                    </div>
                </div>
            ) : (
                <div className="row g-3">
                    {grades.map((g) => (
                        <div key={g.grade} className="col-sm-6 col-lg-4">
                            <div className="card border-0 shadow-sm h-100">
                                <div className="card-body">
                                    <div className="d-flex justify-content-between align-items-center mb-3">
                                        <div className="d-flex align-items-center gap-2">
                                            <div
                                                className="d-flex align-items-center justify-content-center rounded"
                                                style={{
                                                    width: 40, height: 40,
                                                    background: 'var(--erp-soft-primary)',
                                                    color: 'var(--erp-primary)',
                                                }}
                                            >
                                                <IconSchoolIcon size={20} stroke={1.7} />
                                            </div>
                                            <h5 className="mb-0" style={{ fontWeight: 600 }}>Grade {g.grade}</h5>
                                        </div>
                                        <span className="badge badge-soft-primary">{g.sections.length} section{g.sections.length !== 1 ? 's' : ''}</span>
                                    </div>

                                    <div className="d-flex flex-wrap gap-1 mb-3">
                                        {g.sections.map((sec) => (
                                            <span key={sec} className="badge badge-soft-success">{g.grade}-{sec}</span>
                                        ))}
                                    </div>

                                    <div className="d-flex gap-3" style={{ fontSize: 13, color: 'var(--erp-text-muted)' }}>
                                        <span className="d-flex align-items-center gap-1">
                                            <IconUsers size={14} stroke={1.7} /> {g.studentCount} students
                                        </span>
                                        {g.teacherCount > 0 && (
                                            <span>~{g.teacherCount} teachers</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
