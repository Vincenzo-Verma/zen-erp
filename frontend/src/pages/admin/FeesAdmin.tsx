import { PageHeader } from '../../components/ui/PageHeader';
import { StatCard } from '../../components/ui/StatCard';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { IconCoin, IconHourglass, IconChartBar } from '@tabler/icons-react';
import ReactApexChart from 'react-apexcharts';
import { getBarOptions } from '../../components/charts/ChartConfig';

const feeHeads = [
    { head: 'Tuition Fee', amount: 5000, collected: 4200, pending: 800 },
    { head: 'Transport Fee', amount: 1500, collected: 1100, pending: 400 },
    { head: 'Library Fee', amount: 500, collected: 480, pending: 20 },
    { head: 'Lab Fee', amount: 800, collected: 720, pending: 80 },
    { head: 'Sports Fee', amount: 600, collected: 540, pending: 60 },
];

const recentPayments = [
    { student: 'Ravi Kumar', class: '10-A', amount: 6500, date: '2025-02-18', status: 'paid' },
    { student: 'Priya Sharma', class: '10-B', amount: 5000, date: '2025-02-17', status: 'paid' },
    { student: 'Amit Patel', class: '9-A', amount: 6500, date: '2025-02-16', status: 'paid' },
    { student: 'Sneha Gupta', class: '9-B', amount: 1500, date: '2025-02-15', status: 'partial' },
    { student: 'Rahul Singh', class: '8-A', amount: 0, date: '—', status: 'overdue' },
];

export function FeesAdmin() {
    const totalCollected = feeHeads.reduce((s, f) => s + f.collected, 0);
    const totalPending = feeHeads.reduce((s, f) => s + f.pending, 0);
    const collectionRate = Math.round((totalCollected / (totalCollected + totalPending)) * 100);

    const barOpts = getBarOptions(
        feeHeads.map((f) => f.head.split(' ')[0])
    );

    return (
        <div className="animate-fadeIn">
            <PageHeader
                title="Fee Management"
                breadcrumbs={[
                    { label: 'Dashboard', href: '../' },
                    { label: 'Fees' },
                ]}
            />

            {/* Demo banner */}
            <div className="alert alert-warning d-flex align-items-center gap-2 py-2 mb-3" style={{ fontSize: 14 }}>
                <span className="badge bg-warning text-dark" style={{ fontSize: 10, letterSpacing: '0.05em' }}>SAMPLE DATA</span>
                Fee management is under development. The data shown below is for demonstration purposes only.
            </div>

            <div className="row g-3 mb-4">
                <div className="col-sm-4">
                    <StatCard label="Collected" value={totalCollected} prefix="$" icon={<IconCoin size={22} />} variant="success" trend={{ value: 'Sample data', positive: true }} />
                </div>
                <div className="col-sm-4">
                    <StatCard label="Pending" value={totalPending} prefix="$" icon={<IconHourglass size={22} />} variant="warning" trend={{ value: 'Sample data', positive: false }} />
                </div>
                <div className="col-sm-4">
                    <StatCard label="Collection Rate" value={collectionRate} suffix="%" icon={<IconChartBar size={22} />} variant="primary" />
                </div>
            </div>

            <div className="row g-4 mb-4">
                {/* Chart */}
                <div className="col-lg-6">
                    <div className="card border-0 shadow-sm">
                        <div className="card-header bg-transparent border-bottom d-flex justify-content-between align-items-center">
                            <h6 className="mb-0 fw-semibold">Collection by Fee Head</h6>
                            <span className="badge bg-warning text-dark" style={{ fontSize: 10 }}>Demo</span>
                        </div>
                        <div className="card-body">
                            <ReactApexChart
                                type="bar"
                                height={220}
                                options={barOpts}
                                series={[{ name: 'Collected', data: feeHeads.map((f) => f.collected) }]}
                            />
                        </div>
                    </div>
                </div>

                {/* Fee structure table */}
                <div className="col-lg-6">
                    <div className="card border-0 shadow-sm">
                        <div className="card-header bg-transparent border-bottom d-flex justify-content-between align-items-center">
                            <h6 className="mb-0 fw-semibold">Fee Structure</h6>
                            <span className="badge bg-warning text-dark" style={{ fontSize: 10 }}>Demo</span>
                        </div>
                        <div className="card-body p-0">
                            <div className="table-responsive">
                                <table className="table table-hover align-middle mb-0">
                                    <thead>
                                        <tr>
                                            <th>Fee Head</th>
                                            <th>Amount</th>
                                            <th>Collected</th>
                                            <th>Pending</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {feeHeads.map((f) => (
                                            <tr key={f.head}>
                                                <td style={{ fontWeight: 600, color: 'var(--erp-text-primary)' }}>{f.head}</td>
                                                <td>${f.amount.toLocaleString()}</td>
                                                <td className="text-success">${f.collected.toLocaleString()}</td>
                                                <td className="text-warning">${f.pending.toLocaleString()}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Recent payments */}
            <div className="card border-0 shadow-sm">
                <div className="card-header bg-transparent border-bottom d-flex justify-content-between align-items-center">
                    <h6 className="mb-0 fw-semibold">Recent Payments</h6>
                    <span className="badge bg-warning text-dark" style={{ fontSize: 10 }}>Demo</span>
                </div>
                <div className="card-body p-0">
                    <div className="table-responsive">
                        <table className="table table-hover align-middle mb-0">
                            <thead>
                                <tr>
                                    <th>Student</th>
                                    <th>Class</th>
                                    <th>Amount</th>
                                    <th>Date</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {recentPayments.map((p, i) => (
                                    <tr key={i}>
                                        <td style={{ fontWeight: 600, color: 'var(--erp-text-primary)' }}>{p.student}</td>
                                        <td><span className="badge badge-soft-primary">{p.class}</span></td>
                                        <td>${p.amount.toLocaleString()}</td>
                                        <td>{p.date}</td>
                                        <td><StatusBadge label={p.status} /></td>
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
