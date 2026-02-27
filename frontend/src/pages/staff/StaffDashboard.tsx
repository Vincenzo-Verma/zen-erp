import { PageHeader } from '../../components/ui/PageHeader';
import { IconClock, IconCircleDot } from '@tabler/icons-react';

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
    { task: 'Review leave request from Mrs. Desai', priority: 'low', due: 'Feb 23' },
];

const priorityColors: Record<string, string> = {
    high: 'var(--erp-danger)',
    medium: 'var(--erp-warning)',
    low: 'var(--erp-success)',
};

export function StaffDashboard() {
    const role = localStorage.getItem('erp_school_role') || '';

    const isTeacher = role.includes('teacher');
    const isReceptionist = role.includes('receptionist');
    const isAccountant = role.includes('accountant');

    return (
        <div className="animate-fadeIn">
            <PageHeader
                title="Welcome Back!"
                breadcrumbs={[{ label: 'Dashboard' }]}
            />

            {/* Demo banner */}
            <div className="alert alert-warning d-flex align-items-center gap-2 py-2 mb-3" style={{ fontSize: 14 }}>
                <span className="badge bg-warning text-dark" style={{ fontSize: 10, letterSpacing: '0.05em' }}>SAMPLE DATA</span>
                Staff dashboard is under development. The data shown below is for demonstration purposes only.
            </div>

            <div className="row g-4">
                {/* Left column: Schedule or Role-specific overview */}
                {isTeacher && (
                    <div className="col-lg-6">
                        <div className="card border-0 shadow-sm">
                            <div className="card-header bg-transparent border-bottom d-flex justify-content-between align-items-center">
                                <h6 className="mb-0 fw-semibold">Today's Timetable</h6>
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
                                            <div className="d-flex align-items-center justify-content-center rounded"
                                                style={{
                                                    width: 32, height: 32,
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
                )}

                {(isReceptionist || isAccountant) && !isTeacher && (
                    <div className="col-lg-6">
                        <div className="card border-0 shadow-sm">
                            <div className="card-header bg-transparent border-bottom">
                                <h6 className="mb-0 fw-semibold">
                                    {isAccountant ? 'Finance Overview' : 'Admissions Overview'}
                                </h6>
                            </div>
                            <div className="card-body">
                                <div className="d-flex align-items-center justify-content-between py-2">
                                    <div>
                                        <div style={{ fontSize: 14, color: 'var(--erp-text-secondary)' }}>
                                            {isAccountant ? 'Pending Defaults' : 'New Inquiries'}
                                        </div>
                                        <small className="text-muted">
                                            {isAccountant ? '12 Invoices' : '5 Families'}
                                        </small>
                                    </div>
                                    <button className="btn btn-primary btn-sm">Review</button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Right column: Pending Actions + Quick Stats */}
                <div className={isTeacher || ((isReceptionist || isAccountant) && !isTeacher) ? 'col-lg-6' : 'col-12'}>
                    <div className="card border-0 shadow-sm mb-4">
                        <div className="card-header bg-transparent border-bottom d-flex justify-content-between align-items-center">
                            <h6 className="mb-0 fw-semibold">Pending Actions</h6>
                            <span className="badge bg-warning text-dark" style={{ fontSize: 10 }}>Demo</span>
                        </div>
                        <div className="card-body p-0">
                            <div className="list-group list-group-flush">
                                {pendingTasks.map((t, i) => (
                                    <div key={i} className="list-group-item d-flex align-items-center gap-3 py-3">
                                        <IconCircleDot size={12} style={{ color: priorityColors[t.priority], flexShrink: 0 }} />
                                        <div className="flex-grow-1">
                                            <div style={{ fontSize: 14, color: 'var(--erp-text-secondary)' }}>{t.task}</div>
                                            <small className="text-muted">Due: {t.due}</small>
                                        </div>
                                        <button className="btn btn-outline-primary btn-sm">Do it</button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Quick stats */}
                    <div className="row g-3">
                        {isTeacher && (
                            <div className="col-4">
                                <div className="card border-0 shadow-sm text-center">
                                    <div className="card-body py-3">
                                        <h4 className="mb-0" style={{ fontWeight: 700, color: 'var(--erp-primary)' }}>6</h4>
                                        <small className="text-muted">Classes Today</small>
                                    </div>
                                </div>
                            </div>
                        )}
                        <div className={isTeacher ? 'col-4' : 'col-6'}>
                            <div className="card border-0 shadow-sm text-center">
                                <div className="card-body py-3">
                                    <h4 className="mb-0" style={{ fontWeight: 700, color: 'var(--erp-primary)' }}>
                                        {isReceptionist ? '1200' : '182'}
                                    </h4>
                                    <small className="text-muted">Students</small>
                                </div>
                            </div>
                        </div>
                        <div className={isTeacher ? 'col-4' : 'col-6'}>
                            <div className="card border-0 shadow-sm text-center">
                                <div className="card-body py-3">
                                    <h4 className="mb-0" style={{ fontWeight: 700, color: 'var(--erp-primary)' }}>12</h4>
                                    <small className="text-muted">Leaves Left</small>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
