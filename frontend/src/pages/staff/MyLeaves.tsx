import { useState } from 'react';
import { PageHeader } from '../../components/ui/PageHeader';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { BootstrapModal } from '../../components/ui/BootstrapModal';
import { IconCalendar, IconBeach, IconFirstAidKit } from '@tabler/icons-react';

const leaveBalance = [
    { type: 'Casual Leave', total: 12, used: 5, remaining: 7, icon: <IconBeach size={22} /> },
    { type: 'Sick Leave', total: 10, used: 2, remaining: 8, icon: <IconFirstAidKit size={22} /> },
    { type: 'Earned Leave', total: 15, used: 3, remaining: 12, icon: <IconCalendar size={22} /> },
];

const leaveHistory = [
    { type: 'Casual Leave', from: '2025-01-10', to: '2025-01-11', days: 2, status: 'approved' },
    { type: 'Sick Leave', from: '2025-01-25', to: '2025-01-26', days: 2, status: 'approved' },
    { type: 'Casual Leave', from: '2025-02-05', to: '2025-02-05', days: 1, status: 'approved' },
    { type: 'Earned Leave', from: '2025-02-20', to: '2025-02-22', days: 3, status: 'pending' },
];

export function MyLeaves() {
    const [isApplyOpen, setIsApplyOpen] = useState(false);

    return (
        <div className="animate-fadeIn">
            <PageHeader
                title="My Leaves"
                breadcrumbs={[
                    { label: 'Dashboard', href: '../' },
                    { label: 'Leaves' },
                ]}
            >
                <button className="btn btn-primary btn-sm" onClick={() => setIsApplyOpen(true)}>
                    + Apply Leave
                </button>
            </PageHeader>

            {/* Demo banner */}
            <div className="alert alert-warning d-flex align-items-center gap-2 py-2 mb-3" style={{ fontSize: 14 }}>
                <span className="badge bg-warning text-dark" style={{ fontSize: 10, letterSpacing: '0.05em' }}>SAMPLE DATA</span>
                Leave management is under development. The data shown below is for demonstration purposes only.
            </div>

            {/* Leave balance cards */}
            <div className="row g-3 mb-4">
                {leaveBalance.map((lb) => (
                    <div key={lb.type} className="col-sm-4">
                        <div className="card border-0 shadow-sm">
                            <div className="card-body text-center">
                                <div className="d-flex align-items-center justify-content-center rounded-circle mx-auto mb-2"
                                    style={{
                                        width: 44, height: 44,
                                        background: 'var(--erp-soft-primary)',
                                        color: 'var(--erp-primary)',
                                    }}
                                >
                                    {lb.icon}
                                </div>
                                <h3 className="mb-1" style={{ fontWeight: 700, color: 'var(--erp-primary)' }}>
                                    {lb.remaining}
                                </h3>
                                <div className="fw-semibold" style={{ fontSize: 14, color: 'var(--erp-text-primary)' }}>
                                    {lb.type}
                                </div>
                                <small className="text-muted">{lb.used} used of {lb.total}</small>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Leave history */}
            <div className="card border-0 shadow-sm">
                <div className="card-header bg-transparent border-bottom d-flex justify-content-between align-items-center">
                    <h6 className="mb-0 fw-semibold">Leave History</h6>
                    <span className="badge bg-warning text-dark" style={{ fontSize: 10 }}>Demo</span>
                </div>
                <div className="card-body p-0">
                    <div className="table-responsive">
                        <table className="table table-hover align-middle mb-0">
                            <thead>
                                <tr>
                                    <th>Type</th>
                                    <th>From</th>
                                    <th>To</th>
                                    <th>Days</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {leaveHistory.map((l, i) => (
                                    <tr key={i}>
                                        <td style={{ fontWeight: 600, color: 'var(--erp-text-primary)' }}>{l.type}</td>
                                        <td>{l.from}</td>
                                        <td>{l.to}</td>
                                        <td>{l.days}</td>
                                        <td><StatusBadge label={l.status} /></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Apply Leave Modal */}
            <BootstrapModal
                isOpen={isApplyOpen}
                onClose={() => setIsApplyOpen(false)}
                title="Apply for Leave"
                footer={
                    <>
                        <button className="btn btn-secondary" onClick={() => setIsApplyOpen(false)}>Cancel</button>
                        <button className="btn btn-primary" onClick={() => setIsApplyOpen(false)}>Submit</button>
                    </>
                }
            >
                <form>
                    <div className="row g-3">
                        <div className="col-12">
                            <label className="form-label">Leave Type</label>
                            <select className="form-select">
                                <option value="casual">Casual Leave</option>
                                <option value="sick">Sick Leave</option>
                                <option value="earned">Earned Leave</option>
                            </select>
                        </div>
                        <div className="col-md-6">
                            <label className="form-label">From</label>
                            <input className="form-control" type="date" />
                        </div>
                        <div className="col-md-6">
                            <label className="form-label">To</label>
                            <input className="form-control" type="date" />
                        </div>
                        <div className="col-12">
                            <label className="form-label">Reason</label>
                            <textarea className="form-control" rows={3} placeholder="Brief reason for leave..." />
                        </div>
                    </div>
                </form>
            </BootstrapModal>
        </div>
    );
}
