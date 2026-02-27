import { useState, useEffect, useCallback, useMemo } from 'react';
import { useSchoolContext } from '../../contexts/SchoolContext';
import { apiRequest } from '../../lib/api';
import { PageHeader } from '../../components/ui/PageHeader';
import { StatCard } from '../../components/ui/StatCard';
import { StatusBadge } from '../../components/ui/StatusBadge';
import {
    IconUsers, IconClock, IconClipboardCheck, IconBeach,
    IconCircleDot,
} from '@tabler/icons-react';

interface Student {
    id: string;
    first_name: string;
    last_name: string;
    class_grade: number;
    section: string;
    is_active: boolean;
}

const todaySchedule = [
    { period: 1, time: '8:00 - 8:45', class: '10-A', subject: 'Mathematics', room: 'R-201' },
    { period: 2, time: '8:50 - 9:35', class: '9-B', subject: 'Mathematics', room: 'R-105' },
    { period: 3, time: '9:40 - 10:25', class: null, subject: 'Free Period', room: '—' },
    { period: 4, time: '10:45 - 11:30', class: '8-A', subject: 'Mathematics', room: 'R-301' },
    { period: 5, time: '11:35 - 12:20', class: '10-B', subject: 'Mathematics', room: 'R-202' },
    { period: 6, time: '1:00 - 1:45', class: '7-C', subject: 'Mathematics', room: 'R-107' },
];

const pendingTasks = [
    { task: 'Mark attendance for Class 10-A', priority: 'high', due: 'Today' },
    { task: 'Enter mid-term marks for Class 9-B', priority: 'medium', due: 'Feb 22' },
    { task: 'Submit lesson plan for next week', priority: 'medium', due: 'Feb 24' },
    { task: 'Review leave request from Mrs. Desai', priority: 'low', due: 'Feb 23' },
];

const leaveBalance = { casual: 8, sick: 4, earned: 2 };

const priorityColors: Record<string, string> = {
    high: 'var(--erp-danger)',
    medium: 'var(--erp-warning)',
    low: 'var(--erp-success)',
};

export function TeacherDashboard() {
    const { currentSchool: school } = useSchoolContext();
    const [students, setStudents] = useState<Student[]>([]);
    const token = localStorage.getItem('erp_token');

    const loadStudents = useCallback(async () => {
        if (!school?.id) return;
        try {
            const data = await apiRequest<{ students: Student[] }>(
                `/api/v1/school/students/${school.id}`,
                { token }
            );
            setStudents(data.students || []);
        } catch {
            setStudents([]);
        }
    }, [school?.id, token]);

    useEffect(() => {
        loadStudents();
    }, [loadStudents]);

    const totalStudents = students.filter((s) => s.is_active).length;
    const classesTeaching = useMemo(() => {
        return todaySchedule.filter((s) => s.class !== null).length;
    }, []);

    return (
        <div className="animate-fadeIn">
            <PageHeader
                title="Teacher Dashboard"
                breadcrumbs={[{ label: 'Dashboard' }]}
            />

            {/* Demo banner */}
            <div className="alert alert-warning d-flex align-items-center gap-2 py-2 mb-3" style={{ fontSize: 14 }}>
                <span className="badge bg-warning text-dark" style={{ fontSize: 10, letterSpacing: '0.05em' }}>SAMPLE DATA</span>
                Teacher dashboard is under development. Schedule and leave data shown is for demonstration only.
            </div>

            {/* Stat Cards */}
            <div className="row g-3 mb-4">
                <div className="col-sm-6 col-lg-3">
                    <StatCard label="Total Students" value={totalStudents} icon={<IconUsers size={22} />} variant="primary" />
                </div>
                <div className="col-sm-6 col-lg-3">
                    <StatCard label="Classes Today" value={classesTeaching} icon={<IconClock size={22} />} variant="info" />
                </div>
                <div className="col-sm-6 col-lg-3">
                    <StatCard label="Pending Tasks" value={pendingTasks.length} icon={<IconClipboardCheck size={22} />} variant="warning" />
                </div>
                <div className="col-sm-6 col-lg-3">
                    <StatCard label="Leaves Remaining" value={leaveBalance.casual + leaveBalance.sick + leaveBalance.earned} icon={<IconBeach size={22} />} variant="success" />
                </div>
            </div>

            <div className="row g-4">
                {/* Today's Schedule */}
                <div className="col-lg-6">
                    <div className="card border-0 shadow-sm">
                        <div className="card-header bg-transparent border-bottom d-flex justify-content-between align-items-center">
                            <h6 className="mb-0 fw-semibold">Today's Schedule</h6>
                            <span className="badge bg-warning text-dark" style={{ fontSize: 10 }}>Demo</span>
                        </div>
                        <div className="card-body p-0">
                            <div className="list-group list-group-flush">
                                {todaySchedule.map((slot) => (
                                    <div
                                        key={slot.period}
                                        className="list-group-item d-flex align-items-center gap-3 py-3"
                                        style={{ opacity: slot.class ? 1 : 0.5 }}
                                    >
                                        <div
                                            className="d-flex align-items-center justify-content-center rounded"
                                            style={{
                                                width: 36, height: 36,
                                                background: slot.class ? 'var(--erp-soft-primary)' : 'var(--erp-soft-secondary, #f0f0f0)',
                                                color: slot.class ? 'var(--erp-primary)' : 'var(--erp-text-muted)',
                                                fontWeight: 700, fontSize: 13,
                                            }}
                                        >
                                            P{slot.period}
                                        </div>
                                        <div className="flex-grow-1">
                                            <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--erp-text-primary)' }}>
                                                {slot.subject}
                                            </div>
                                            <small className="text-muted">
                                                {slot.class ? `${slot.class} - ${slot.room}` : 'No class'}
                                            </small>
                                        </div>
                                        <div className="d-flex align-items-center gap-1 text-muted" style={{ fontSize: 13 }}>
                                            <IconClock size={14} />
                                            {slot.time}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Pending Tasks + Leave Summary */}
                <div className="col-lg-6">
                    <div className="card border-0 shadow-sm mb-4">
                        <div className="card-header bg-transparent border-bottom d-flex justify-content-between align-items-center">
                            <h6 className="mb-0 fw-semibold">Pending Tasks</h6>
                            <span className="badge badge-soft-warning">{pendingTasks.length}</span>
                        </div>
                        <div className="card-body p-0">
                            <div className="list-group list-group-flush">
                                {pendingTasks.map((t, i) => (
                                    <div key={i} className="list-group-item d-flex align-items-center gap-3 py-3">
                                        <IconCircleDot size={12} style={{ color: priorityColors[t.priority], flexShrink: 0 }} />
                                        <div className="flex-grow-1">
                                            <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--erp-text-primary)' }}>{t.task}</div>
                                            <small className="text-muted">Due: {t.due}</small>
                                        </div>
                                        <StatusBadge label={t.priority} />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Leave Balance */}
                    <div className="card border-0 shadow-sm">
                        <div className="card-header bg-transparent border-bottom">
                            <h6 className="mb-0 fw-semibold">Leave Balance</h6>
                        </div>
                        <div className="card-body">
                            <div className="row g-3 text-center">
                                <div className="col-4">
                                    <h4 className="mb-0 fw-bold" style={{ color: 'var(--erp-primary)' }}>{leaveBalance.casual}</h4>
                                    <small className="text-muted">Casual</small>
                                </div>
                                <div className="col-4">
                                    <h4 className="mb-0 fw-bold" style={{ color: 'var(--erp-warning)' }}>{leaveBalance.sick}</h4>
                                    <small className="text-muted">Sick</small>
                                </div>
                                <div className="col-4">
                                    <h4 className="mb-0 fw-bold" style={{ color: 'var(--erp-success)' }}>{leaveBalance.earned}</h4>
                                    <small className="text-muted">Earned</small>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
