import { PageHeader } from '../../components/ui/PageHeader';
import { StatCard } from '../../components/ui/StatCard';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { IconCoin, IconCheck, IconHourglass } from '@tabler/icons-react';

const feeItems = [
    { head: 'Tuition Fee', amount: 5000, status: 'paid', paidDate: '2025-01-15' },
    { head: 'Transport Fee', amount: 1500, status: 'paid', paidDate: '2025-01-15' },
    { head: 'Library Fee', amount: 500, status: 'paid', paidDate: '2025-01-15' },
    { head: 'Lab Fee', amount: 800, status: 'unpaid', paidDate: null },
    { head: 'Sports Fee', amount: 600, status: 'unpaid', paidDate: null },
];

export function FeePayment() {
    const paid = feeItems.filter((f) => f.status === 'paid').reduce((s, f) => s + f.amount, 0);
    const pending = feeItems.filter((f) => f.status === 'unpaid').reduce((s, f) => s + f.amount, 0);
    const total = paid + pending;

    return (
        <div className="animate-fadeIn">
            <PageHeader
                title="Fee Payment"
                breadcrumbs={[
                    { label: 'Dashboard', href: '../' },
                    { label: 'Fees' },
                ]}
            />

            {/* Demo banner */}
            <div className="alert alert-warning d-flex align-items-center gap-2 py-2 mb-3" style={{ fontSize: 14 }}>
                <span className="badge bg-warning text-dark" style={{ fontSize: 10, letterSpacing: '0.05em' }}>SAMPLE DATA</span>
                Fee payment is under development. The data shown below is for demonstration purposes only.
            </div>

            <div className="row g-3 mb-4">
                <div className="col-sm-4">
                    <StatCard label="Total Fees" value={total} prefix="$" icon={<IconCoin size={22} />} variant="primary" />
                </div>
                <div className="col-sm-4">
                    <StatCard label="Paid" value={paid} prefix="$" icon={<IconCheck size={22} />} variant="success" />
                </div>
                <div className="col-sm-4">
                    <StatCard label="Pending" value={pending} prefix="$" icon={<IconHourglass size={22} />} variant="warning" />
                </div>
            </div>

            <div className="card border-0 shadow-sm">
                <div className="card-body p-0">
                    <div className="table-responsive">
                        <table className="table table-hover align-middle mb-0">
                            <thead>
                                <tr>
                                    <th>Fee Head</th>
                                    <th>Amount</th>
                                    <th>Status</th>
                                    <th>Paid Date</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {feeItems.map((f, i) => (
                                    <tr key={i}>
                                        <td style={{ fontWeight: 600, color: 'var(--erp-text-primary)' }}>{f.head}</td>
                                        <td>${f.amount.toLocaleString()}</td>
                                        <td><StatusBadge label={f.status === 'paid' ? 'Paid' : 'Pending'} /></td>
                                        <td>{f.paidDate || '—'}</td>
                                        <td>
                                            {f.status === 'unpaid' && (
                                                <button className="btn btn-primary btn-sm">Pay Now</button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
