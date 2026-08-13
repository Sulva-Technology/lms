import { z } from 'zod';

export const attendanceRecordSchema = z.object({
  studentId: z.string().uuid(),
  status: z.enum(['present', 'absent', 'late', 'excused']),
});

export const markAttendanceSchema = z.object({
  courseSectionId: z.string().uuid(),
  date: z.string(),
  title: z.string().min(2),
  liveClassId: z.string().uuid().optional(),
  records: z.array(attendanceRecordSchema),
});
