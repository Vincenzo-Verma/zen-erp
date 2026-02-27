export interface TimetableSlot {
    period: number;
    time: string;
    subject: string;
    teacher: string;
    room: string;
}

export interface DaySchedule {
    day: string;
    slots: TimetableSlot[];
}

export interface ClassTimetable {
    classGrade: number;
    section: string;
    schedule: DaySchedule[];
}

const times = [
    '8:00 - 8:45',
    '8:50 - 9:35',
    '9:40 - 10:25',
    '10:45 - 11:30',
    '11:35 - 12:20',
    '1:00 - 1:45',
    '1:50 - 2:35',
];

const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const subjects = ['Mathematics', 'English', 'Science', 'Social Studies', 'Hindi', 'Computer Science', 'Physical Ed.', 'Art'];
const teachers = ['Mr. Sharma', 'Ms. Gupta', 'Mr. Patel', 'Mrs. Verma', 'Ms. Nair', 'Mr. Singh', 'Mrs. Das', 'Ms. Reddy'];
const rooms = ['R-101', 'R-102', 'R-201', 'R-202', 'R-301', 'Lab-1', 'Lab-2', 'Ground'];

function generateDaySlots(): TimetableSlot[] {
    return times.map((time, i) => {
        const subjectIdx = (i + Math.floor(Math.random() * 3)) % subjects.length;
        return {
            period: i + 1,
            time,
            subject: subjects[subjectIdx],
            teacher: teachers[subjectIdx],
            room: rooms[i % rooms.length],
        };
    });
}

function generateClassTimetable(classGrade: number, section: string): ClassTimetable {
    return {
        classGrade,
        section,
        schedule: days.map((day) => ({
            day,
            slots: generateDaySlots(),
        })),
    };
}

export const mockTimetables: ClassTimetable[] = [
    generateClassTimetable(10, 'A'),
    generateClassTimetable(10, 'B'),
    generateClassTimetable(9, 'A'),
    generateClassTimetable(9, 'B'),
    generateClassTimetable(8, 'A'),
    generateClassTimetable(8, 'B'),
    generateClassTimetable(7, 'A'),
    generateClassTimetable(7, 'B'),
];
