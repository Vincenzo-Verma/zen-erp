import { PageHeader } from '../../components/ui/PageHeader';
import { StatCard } from '../../components/ui/StatCard';
import { StatusBadge } from '../../components/ui/StatusBadge';
import ReactApexChart from 'react-apexcharts';
import { getDonutOptions } from '../../components/charts/ChartConfig';
import {
    IconUser, IconClipboardCheck, IconCoin, IconSpeakerphone,
} from '@tabler/icons-react';

const children = [
    { name: 'Aarav Patel', class: '10-A', admissionNo: 'ADM-2024-042' },
];

const attendanceData = { present: 79, absent: 7, total: 86 };

const feesSummary = { total: 8400, paid: 7000, pending: 1400 };

const notices = [
    { title: 'Annual Day Rehearsal', desc: 'All participants must report to the auditorium at 2 PM', time: '5 hours ago' },
    { title: 'Winter Uniform Notice', desc: 'Winter uniforms are mandatory from next week', time: '3 days ago' },
    { title: 'PTA Meeting Scheduled', desc: 'Parent-Teacher meeting on Feb 28 at 10 AM', time: '4 days ago' },
];

const recentResults = [
    { exam: 'Mid-Term Examination', percentage: 82, grade: 'A' },
    { exam: 'Unit Test 3', percentage: 76, grade: 'B+' },
];

export function ParentDashboard() {
    const attendancePct = Math.round((attendanceData.present / attendanceData.total) * 100);

    const donutOptions = getDonutOptions(['Present', 'Absent']);

    return (
        <div className="animate-fadeIn">
            <PageHeader
                title="Parent Dashboard"
                breadcrumbs={[{ label: 'Dashboard' }]}
            />

            {/* Demo banner */}
            <div className="alert alert-warning d-flex align-items-center gap-2 py-2 mb-3" style={{ fontSize: 14 }}>
                <span className="badge bg-warning text-dark" style={{ fontSize: 10, letterSpacing: '0.05em' }}>SAMPLE DATA</span>
                Parent dashboard is under development. The data shown below is for demonstration purposes only.
            </div>

            {/* Child Selector */}
            <div className="card border-0 shadow-sm mb-4">
                <div className="card-body py-3 d-flex align-items-center gap-3">
                    <div
                        className="d-flex align-items-center justify-content-center rounded-circle"
                        style={{
                            width: 44, height: 44,
                            background: 'var(--erp-soft-primary)',
                            color: 'var(--erp-primary)',
                            fontWeight: 700, fontSize: 16,
                        }}
                    >
                        {children[0].name.charAt(0)}
                    </div>
                    <div>
                        <div style={{ fontWeight: 600, fontSize: 16, color: 'var(--erp-text-primary)' }}>
                            {children[0].name}
                        </div>
                        <small className="text-muted">
                            Class {children[0].class} &bull; {children[0].admissionNo}
                        </small>
                    </div>
                    {children.length > 1 && (
                        <select className="form-select form-select-sm ms-auto" style={{ maxWidth: 180 }}>
                            {children.map((c, i) => (
                                <option key={i} value={i}>{c.name}</option>
                            ))}
                        </select>
                    )}
                </div>
            </div>

            {/* Stat cards */}
            <div className="row g-3 mb-4">
                <div className="col-sm-6 col-lg-3">
                    <StatCard label="Attendance" value={attendancePct} suffix="%" icon={<IconClipboardCheck size={22} />} variant="success" />
                </div>
                <div className="col-sm-6 col-lg-3">
                    <StatCard label="Latest Grade" value={90} icon={<IconUser size={22} />} variant="primary" />
                </div>
                <div className="col-sm-6 col-lg-3">
                    <StatCard label="Fees Paid" value={feesSummary.paid} prefix="$" icon={<IconCoin size={22} />} variant="info" />
                </div>
                <div className="col-sm-6 col-lg-3">
                    <StatCard label="Fees Pending" value={feesSummary.pending} prefix="$" icon={<IconCoin size={22} />} variant="warning" />
                </div>
            </div>

            <div className="row g-4">
                {/* Attendance Chart */}
                <div className="col-lg-4">
                    <div className="card border-0 shadow-sm h-100">
                        <div className="card-header bg-transparent border-bottom">
                            <h6 className="mb-0 fw-semibold">Attendance Overview</h6>
                        </div>
                        <div className="card-body d-flex flex-column align-items-center justify-content-center">
                            <ReactApexChart
                                options={donutOptions}
                                series={[attendanceData.present, attendanceData.absent]}
                                type="donut"
                                height={220}
                            />
                            <div className="d-flex gap-4 mt-3" style={{ fontSize: 13 }}>
                                <div>
                                    <span className="d-inline-block rounded-circle me-1" style={{ width: 8, height: 8, background: 'var(--erp-primary)' }} />
                                    Present: {attendanceData.present}
                                </div>
                                <div>
                                    <span className="d-inline-block rounded-circle me-1" style={{ width: 8, height: 8, background: 'var(--erp-warning)' }} />
                                    Absent: {attendanceData.absent}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Recent Results */}
                <div className="col-lg-4">
                    <div className="card border-0 shadow-sm h-100">
                        <div className="card-header bg-transparent border-bottom">
                            <h6 className="mb-0 fw-semibold">Recent Results</h6>
                        </div>
                        <div className="card-body p-0">
                            <div className="list-group list-group-flush">
                                {recentResults.map((r, i) => (
                                    <div key={i} className="list-group-item d-flex align-items-center justify-content-between py-3">
                                        <div>
                                            <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--erp-text-primary)' }}>{r.exam}</div>
                                        </div>
                                        <div className="text-center">
                                            <span className="fw-bold" style={{
                                                color: r.percentage >= 80 ? 'var(--erp-success)' : r.percentage >= 60 ? 'var(--erp-warning)' : 'var(--erp-danger)',
                                            }}>
                                                {r.percentage}%
                                            </span>
                                            <StatusBadge label={`Grade ${r.grade}`} variant="primary" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="card-footer bg-transparent text-center">
                            <small className="text-muted">Fee summary: ${feesSummary.paid.toLocaleString()} paid of ${feesSummary.total.toLocaleString()}</small>
                        </div>
                    </div>
                </div>

                {/* Notices */}
                <div className="col-lg-4">
                    <div className="card border-0 shadow-sm h-100">
                        <div className="card-header bg-transparent border-bottom d-flex justify-content-between align-items-center">
                            <h6 className="mb-0 fw-semibold">Notices</h6>
                            <span className="badge badge-soft-warning">{notices.length}</span>
                        </div>
                        <div className="card-body p-0">
                            <div className="list-group list-group-flush">
                                {notices.map((n, i) => (
                                    <div key={i} className="list-group-item py-3">
                                        <div className="d-flex align-items-center gap-2 mb-1">
                                            <IconSpeakerphone size={14} className="text-warning" />
                                            <span style={{ fontWeight: 600, fontSize: 14, color: 'var(--erp-text-primary)' }}>
                                                {n.title}
                                            </span>
                                        </div>
                                        <div className="text-muted" style={{ fontSize: 13 }}>{n.desc}</div>
                                        <small className="text-muted">{n.time}</small>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
