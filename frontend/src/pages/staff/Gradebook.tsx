import { useState } from 'react';
import { PageHeader } from '../../components/ui/PageHeader';

const students = [
    'Ravi Kumar', 'Priya Sharma', 'Amit Patel', 'Sneha Gupta',
    'Arjun Mehta', 'Kavita Iyer', 'Deepak Tiwari', 'Neha Saxena',
];

const subjects = ['Math', 'Science', 'English', 'Hindi', 'SST'];

export function Gradebook() {
    const [grades, setGrades] = useState<Record<string, Record<string, string>>>({});

    const setGrade = (student: string, subject: string, value: string) => {
        setGrades((prev) => ({
            ...prev,
            [student]: { ...prev[student], [subject]: value },
        }));
    };

    return (
        <div className="animate-fadeIn">
            <PageHeader
                title="Gradebook"
                breadcrumbs={[
                    { label: 'Dashboard', href: '../' },
                    { label: 'Gradebook' },
                ]}
            />

            {/* Demo banner */}
            <div className="alert alert-warning d-flex align-items-center gap-2 py-2 mb-3" style={{ fontSize: 14 }}>
                <span className="badge bg-warning text-dark" style={{ fontSize: 10, letterSpacing: '0.05em' }}>SAMPLE DATA</span>
                Gradebook is under development. The data shown below is for demonstration purposes only.
            </div>

            <div className="card border-0 shadow-sm">
                <div className="card-header bg-transparent border-bottom d-flex justify-content-between align-items-center">
                    <h6 className="mb-0 fw-semibold">Class 10-A — Mid-Term Exam</h6>
                    <span className="badge bg-warning text-dark" style={{ fontSize: 10 }}>Demo</span>
                </div>
                <div className="card-body p-0">
                    <div className="table-responsive">
                        <table className="table table-hover align-middle mb-0">
                            <thead>
                                <tr>
                                    <th style={{ minWidth: 140 }}>Student</th>
                                    {subjects.map((sub) => (
                                        <th key={sub} className="text-center" style={{ minWidth: 80 }}>{sub}</th>
                                    ))}
                                    <th className="text-center" style={{ minWidth: 70 }}>Total</th>
                                    <th className="text-center" style={{ minWidth: 60 }}>%</th>
                                </tr>
                            </thead>
                            <tbody>
                                {students.map((student) => {
                                    const marks = subjects.map((sub) => parseInt(grades[student]?.[sub] || '0', 10) || 0);
                                    const total = marks.reduce((a, b) => a + b, 0);
                                    const pct = Math.round((total / (subjects.length * 100)) * 100);
                                    return (
                                        <tr key={student}>
                                            <td style={{ fontWeight: 600, color: 'var(--erp-text-primary)' }}>{student}</td>
                                            {subjects.map((sub) => (
                                                <td key={sub} className="text-center">
                                                    <input
                                                        className="form-control form-control-sm text-center"
                                                        style={{ width: 60, margin: '0 auto' }}
                                                        type="number"
                                                        min="0"
                                                        max="100"
                                                        placeholder="--"
                                                        value={grades[student]?.[sub] || ''}
                                                        onChange={(e) => setGrade(student, sub, e.target.value)}
                                                    />
                                                </td>
                                            ))}
                                            <td className="text-center fw-bold">{total}</td>
                                            <td className="text-center fw-bold" style={{
                                                color: pct >= 60 ? 'var(--erp-success)' : pct >= 33 ? 'var(--erp-warning)' : 'var(--erp-danger)',
                                            }}>
                                                {pct}%
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
                <div className="card-footer bg-transparent">
                    <button className="btn btn-primary btn-sm">Save Marks</button>
                </div>
            </div>
        </div>
    );
}
