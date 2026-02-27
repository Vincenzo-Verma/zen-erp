import { useState, useMemo } from 'react';
import { PageHeader } from '../../components/ui/PageHeader';
import { mockTimetables } from '../../data/mockTimetable';

export function TimetablePage() {
    const classOptions = useMemo(
        () => mockTimetables.map((t) => ({ label: `Class ${t.classGrade}-${t.section}`, value: `${t.classGrade}-${t.section}` })),
        []
    );

    const [selectedClass, setSelectedClass] = useState(classOptions[0]?.value || '');

    const timetable = useMemo(
        () => mockTimetables.find((t) => `${t.classGrade}-${t.section}` === selectedClass),
        [selectedClass]
    );

    return (
        <div className="animate-fadeIn">
            <PageHeader
                title="Timetable"
                breadcrumbs={[
                    { label: 'Dashboard', href: '../' },
                    { label: 'Timetable' },
                ]}
            />

            {/* Demo banner */}
            <div className="alert alert-warning d-flex align-items-center gap-2 py-2 mb-3" style={{ fontSize: 14 }}>
                <span className="badge bg-warning text-dark" style={{ fontSize: 10, letterSpacing: '0.05em' }}>SAMPLE DATA</span>
                Timetable is under development. The data shown below is for demonstration purposes only.
            </div>

            {/* Class selector */}
            <div className="d-flex align-items-center gap-3 mb-4">
                <label className="form-label mb-0 fw-semibold" style={{ fontSize: 14 }}>Select Class:</label>
                <select
                    className="form-select form-select-sm"
                    style={{ maxWidth: 200 }}
                    value={selectedClass}
                    onChange={(e) => setSelectedClass(e.target.value)}
                >
                    {classOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                </select>
            </div>

            {/* Weekly Grid */}
            {timetable && (
                <div className="card border-0 shadow-sm">
                    <div className="card-body p-0">
                        <div className="table-responsive">
                            <table className="table table-bordered align-middle mb-0" style={{ fontSize: 13 }}>
                                <thead>
                                    <tr>
                                        <th style={{ width: 90, background: 'var(--erp-soft-primary)' }}>Period</th>
                                        {timetable.schedule.map((d) => (
                                            <th key={d.day} style={{ background: 'var(--erp-soft-primary)', textAlign: 'center' }}>
                                                {d.day}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {timetable.schedule[0].slots.map((_, periodIdx) => (
                                        <tr key={periodIdx}>
                                            <td>
                                                <div style={{ fontWeight: 600 }}>P{periodIdx + 1}</div>
                                                <small className="text-muted">{timetable.schedule[0].slots[periodIdx].time}</small>
                                            </td>
                                            {timetable.schedule.map((day) => {
                                                const slot = day.slots[periodIdx];
                                                return (
                                                    <td key={day.day} className="text-center" style={{ minWidth: 120 }}>
                                                        <div style={{ fontWeight: 600, color: 'var(--erp-text-primary)' }}>
                                                            {slot.subject}
                                                        </div>
                                                        <small className="text-muted d-block">{slot.teacher}</small>
                                                        <small className="text-muted">{slot.room}</small>
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
