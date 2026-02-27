import { PageHeader } from '../../components/ui/PageHeader';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { IconDownload } from '@tabler/icons-react';

const exams = [
    { name: 'Mid-Term Examination', date: 'October 2025', pct: 82, grade: 'A', subjects: 5, totalMarks: 410 },
    { name: 'Unit Test 3', date: 'September 2025', pct: 76, grade: 'B+', subjects: 5, totalMarks: 380 },
    { name: 'Half-Yearly Examination', date: 'August 2025', pct: 88, grade: 'A+', subjects: 5, totalMarks: 440 },
    { name: 'Unit Test 2', date: 'July 2025', pct: 72, grade: 'B', subjects: 5, totalMarks: 360 },
];

export function ReportCards() {
    return (
        <div className="animate-fadeIn">
            <PageHeader
                title="Report Cards"
                breadcrumbs={[
                    { label: 'Dashboard', href: '../' },
                    { label: 'Report Cards' },
                ]}
            />

            {/* Demo banner */}
            <div className="alert alert-warning d-flex align-items-center gap-2 py-2 mb-3" style={{ fontSize: 14 }}>
                <span className="badge bg-warning text-dark" style={{ fontSize: 10, letterSpacing: '0.05em' }}>SAMPLE DATA</span>
                Report cards are under development. The data shown below is for demonstration purposes only.
            </div>

            <div className="d-flex flex-column gap-3">
                {exams.map((exam, i) => (
                    <div key={i} className="card border-0 shadow-sm">
                        <div className="card-body d-flex align-items-center gap-4 flex-wrap">
                            <div className="flex-grow-1">
                                <h6 className="mb-1 fw-semibold">{exam.name}</h6>
                                <small className="text-muted">{exam.date} - {exam.subjects} subjects - Total: {exam.totalMarks}/500</small>
                            </div>
                            <div className="text-center">
                                <h4 className="mb-0 fw-bold" style={{
                                    color: exam.pct >= 80 ? 'var(--erp-success)' : exam.pct >= 60 ? 'var(--erp-warning)' : 'var(--erp-danger)',
                                }}>
                                    {exam.pct}%
                                </h4>
                                <StatusBadge label={`Grade ${exam.grade}`} variant="primary" />
                            </div>
                            <button className="btn btn-outline-primary btn-sm d-flex align-items-center gap-1">
                                <IconDownload size={14} />
                                PDF
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
