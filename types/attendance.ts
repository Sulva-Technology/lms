export type AttendanceStatus = 'present' | 'absent' | 'late' | 'excused';

export interface AttendanceRecordPayload {
  studentId: string;
  status: AttendanceStatus;
  notes?: string;
}

export interface MarkAttendancePayload {
  courseSectionId: string;
  date: string;
  /** Which meeting of the day this register covers. Sections may meet more than once. */
  period?: number;
  title: string;
  liveClassId?: string;
  records: AttendanceRecordPayload[];
}

export interface AttendanceChange {
  id: string;
  studentId: string;
  previousStatus: string | null;
  newStatus: string;
  previousNotes: string | null;
  newNotes: string | null;
  changedBy: string | null;
  changedByName: string;
  changedAt: string;
}
