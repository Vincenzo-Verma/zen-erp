import { PageHeader } from '../../components/ui/PageHeader';
import { IconNotebook, IconSpeakerphone, IconTrophy, IconChartBar } from '@tabler/icons-react';
import type { ReactNode } from 'react';

const timeline: { type: string; icon: ReactNode; title: string; desc: string; time: string; due?: string }[] = [
    { type: 'homework', icon: <IconNotebook size={18} />, title: 'Math Homework', desc: 'Complete exercises 5.1 to 5.4 (Quadratic Equations)', time: '2 hours ago', due: 'Tomorrow' },
    { type: 'circular', icon: <IconSpeakerphone size={18} />, title: 'Annual Day Rehearsal', desc: 'All participants must report to the auditorium at 2 PM', time: '5 hours ago' },
    { type: 'event', icon: <IconTrophy size={18} />, title: 'Inter-School Science Fair', desc: 'Registrations open for the district-level science fair', time: 'Yesterday' },
    { type: 'homework', icon: <IconNotebook size={18} />, title: 'English Essay', desc: 'Write an essay on "The Role of Technology in Education" (500 words)', time: 'Yesterday', due: 'Feb 25' },
    { type: 'result', icon: <IconChartBar size={18} />, title: 'Unit Test Results Published', desc: 'Science Unit Test 3 marks are now available', time: '2 days ago' },
    { type: 'circular', icon: <IconSpeakerphone size={18} />, title: 'Winter Uniform Notice', desc: 'Winter uniforms are mandatory from next week', time: '3 days ago' },
];

const typeColors: Record<string, string> = {
    homework: 'var(--erp-primary)',
    circular: 'var(--erp-warning)',
    event: 'var(--erp-success)',
    result: 'var(--erp-info)',
};

export function StudentDashboard() {
    return (
        <div className="animate-fadeIn">
            <PageHeader
                title="Welcome Back!"
                breadcrumbs={[{ label: 'Dashboard' }]}
            />

            {/* Demo banner */}
            <div className="alert alert-warning d-flex align-items-center gap-2 py-2 mb-3" style={{ fontSize: 14 }}>
                <span className="badge bg-warning text-dark" style={{ fontSize: 10, letterSpacing: '0.05em' }}>SAMPLE DATA</span>
                Student dashboard is under development. The data shown below is for demonstration purposes only.
            </div>

            {/* Quick stats */}
            <div className="row g-3 mb-4">
                <div className="col-sm-4">
                    <div className="card border-0 shadow-sm text-center">
                        <div className="card-body py-3">
                            <h4 className="mb-1 fw-bold" style={{ color: 'var(--erp-primary)' }}>94.2%</h4>
                            <small className="text-muted">Attendance</small>
                        </div>
                    </div>
                </div>
                <div className="col-sm-4">
                    <div className="card border-0 shadow-sm text-center">
                        <div className="card-body py-3">
                            <h4 className="mb-1 fw-bold" style={{ color: 'var(--erp-success)' }}>82%</h4>
                            <small className="text-muted">Last Exam</small>
                        </div>
                    </div>
                </div>
                <div className="col-sm-4">
                    <div className="card border-0 shadow-sm text-center">
                        <div className="card-body py-3">
                            <h4 className="mb-1 fw-bold" style={{ color: 'var(--erp-warning)' }}>$0</h4>
                            <small className="text-muted">Pending Fees</small>
                        </div>
                    </div>
                </div>
            </div>

            {/* Timeline */}
            <div className="card border-0 shadow-sm">
                <div className="card-header bg-transparent border-bottom d-flex justify-content-between align-items-center">
                    <h6 className="mb-0 fw-semibold">Timeline</h6>
                    <span className="badge bg-warning text-dark" style={{ fontSize: 10 }}>Demo</span>
                </div>
                <div className="card-body p-0">
                    <div className="list-group list-group-flush">
                        {timeline.map((item, i) => (
                            <div key={i} className="list-group-item d-flex gap-3 py-3">
                                <div
                                    className="d-flex align-items-center justify-content-center rounded-circle flex-shrink-0"
                                    style={{
                                        width: 36, height: 36,
                                        background: `${typeColors[item.type]}15`,
                                        color: typeColors[item.type],
                                    }}
                                >
                                    {item.icon}
                                </div>
                                <div className="flex-grow-1">
                                    <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--erp-text-primary)' }}>
                                        {item.title}
                                    </div>
                                    <div className="text-muted" style={{ fontSize: 13 }}>{item.desc}</div>
                                    <div className="d-flex gap-3 mt-1" style={{ fontSize: 12 }}>
                                        <span className="text-muted">{item.time}</span>
                                        {item.due && (
                                            <span className="text-danger fw-semibold">Due: {item.due}</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
