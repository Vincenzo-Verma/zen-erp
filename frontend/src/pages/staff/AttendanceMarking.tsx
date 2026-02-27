import { useState } from 'react';
import { PageHeader } from '../../components/ui/PageHeader';
import { IconCheck, IconX } from '@tabler/icons-react';

const classes = ['10-A', '10-B', '9-A', '9-B', '8-A', '8-B'];

const studentsByClass: Record<string, { name: string; roll: number }[]> = {
    '10-A': [
        { name: 'Ravi Kumar', roll: 1 }, { name: 'Priya Sharma', roll: 2 },
        { name: 'Amit Patel', roll: 3 }, { name: 'Sneha Gupta', roll: 4 },
        { name: 'Arjun Mehta', roll: 5 }, { name: 'Kavita Iyer', roll: 6 },
        { name: 'Deepak Tiwari', roll: 7 }, { name: 'Neha Saxena', roll: 8 },
        { name: 'Rohit Agarwal', roll: 9 }, { name: 'Sita Devi', roll: 10 },
    ],
};

export function AttendanceMarking() {
    const [selectedClass, setSelectedClass] = useState('10-A');
    const [attendance, setAttendance] = useState<Record<number, 'present' | 'absent'>>({});

    const students = studentsByClass[selectedClass] || studentsByClass['10-A'];

    const toggleAttendance = (roll: number) => {
        setAttendance((prev) => ({
            ...prev,
            [roll]: prev[roll] === 'absent' ? 'present' : prev[roll] === 'present' ? 'absent' : 'present',
        }));
    };

    const presentCount = Object.values(attendance).filter((v) => v === 'present').length;
    const absentCount = Object.values(attendance).filter((v) => v === 'absent').length;
    const unmarked = students.length - presentCount - absentCount;

    return (
        <div className="animate-fadeIn">
            <PageHeader
                title="Mark Attendance"
                breadcrumbs={[
                    { label: 'Dashboard', href: '../' },
                    { label: 'Attendance' },
                ]}
            />

            {/* Demo banner */}
            <div className="alert alert-warning d-flex align-items-center gap-2 py-2 mb-3" style={{ fontSize: 14 }}>
                <span className="badge bg-warning text-dark" style={{ fontSize: 10, letterSpacing: '0.05em' }}>SAMPLE DATA</span>
                Attendance marking is under development. The data shown below is for demonstration purposes only.
            </div>

            {/* Class selector pills */}
            <div className="d-flex flex-wrap gap-2 mb-3">
                {classes.map((c) => (
                    <button
                        key={c}
                        className={`btn btn-sm ${selectedClass === c ? 'btn-primary' : 'btn-outline-secondary'}`}
                        onClick={() => { setSelectedClass(c); setAttendance({}); }}
                    >
                        {c}
                    </button>
                ))}
            </div>

            {/* Stats bar */}
            <div className="d-flex gap-3 mb-3" style={{ fontSize: 14 }}>
                <span className="text-success fw-semibold">Present: {presentCount}</span>
                <span className="text-danger fw-semibold">Absent: {absentCount}</span>
                <span className="text-muted">Unmarked: {unmarked}</span>
            </div>

            {/* Student grid */}
            <div className="row g-2 mb-4">
                {students.map((s) => {
                    const status = attendance[s.roll];
                    let cardClass = 'border';
                    let borderColor = '';
                    if (status === 'present') {
                        cardClass = 'border-success';
                        borderColor = 'rgba(26, 190, 23, 0.12)';
                    } else if (status === 'absent') {
                        cardClass = 'border-danger';
                        borderColor = 'rgba(232, 38, 70, 0.12)';
                    }
                    return (
                        <div key={s.roll} className="col-6 col-sm-4 col-md-3">
                            <div
                                className={`card ${cardClass} h-100`}
                                style={{ cursor: 'pointer', background: borderColor || undefined }}
                                onClick={() => toggleAttendance(s.roll)}
                            >
                                <div className="card-body d-flex align-items-center justify-content-between py-2 px-3">
                                    <div>
                                        <small className="text-muted">#{s.roll}</small>
                                        <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--erp-text-primary)' }}>
                                            {s.name}
                                        </div>
                                    </div>
                                    <div>
                                        {status === 'present' && <IconCheck size={20} className="text-success" />}
                                        {status === 'absent' && <IconX size={20} className="text-danger" />}
                                        {!status && <span className="text-muted" style={{ fontSize: 18 }}>--</span>}
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            <button className="btn btn-primary">Submit Attendance</button>
        </div>
    );
}
