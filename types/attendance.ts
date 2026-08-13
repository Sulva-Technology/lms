export interface AttendanceRecordPayload {
  studentId: string;
  status: 'present' | 'absent' | 'late' | 'excused';
}

export interface MarkAttendancePayload {
  courseSectionId: string;
  date: string;
  title: string;
  liveClassId?: string;
  records: AttendanceRecordPayload[];
}
