import { z } from 'zod';

export const attendanceRecordSchema = z.object({
  studentId: z.string().uuid(),
  status: z.enum(['present', 'absent', 'late', 'excused']),
  notes: z.string().max(500).optional(),
});

export const markAttendanceSchema = z.object({
  courseSectionId: z.string().uuid(),
  date: z.string(),
  period: z.number().int().min(1).max(20).default(1),
  title: z.string().min(2),
  liveClassId: z.string().uuid().optional(),
  records: z.array(attendanceRecordSchema),
});
