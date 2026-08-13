import { z } from 'zod';
import { uuidSchema } from './common';

export const facultySchema = z.object({
  name: z.string().min(2),
  code: z.string().min(2).max(10),
});

export const departmentSchema = z.object({
  facultyId: uuidSchema,
  name: z.string().min(2),
  code: z.string().min(2).max(10),
});

export const programSchema = z.object({
  departmentId: uuidSchema,
  name: z.string().min(2),
  code: z.string().min(2).max(10),
  description: z.string().optional(),
});

export const courseSchema = z.object({
  departmentId: uuidSchema,
  title: z.string().min(2),
  code: z.string().min(2).max(20),
  description: z.string().optional(),
  credits: z.number().int().min(1).max(10).default(3),
  status: z.enum(['draft', 'published', 'archived']).default('draft'),
});

export const userRoleUpdateSchema = z.object({
  role: z.enum(['super_admin', 'admin', 'department_admin', 'lecturer', 'student']),
});

export const inviteUserSchema = z.object({
  email: z.string().email('Enter a valid email address'),
  role: z.enum(['super_admin', 'admin', 'department_admin', 'lecturer', 'student']),
  universityId: uuidSchema.nullish(),
  firstName: z.string().min(2).optional().or(z.literal('')),
  lastName: z.string().min(2).optional().or(z.literal('')),
});

export const academicSessionSchema = z.object({
  name: z.string().min(2),
  startDate: z.string().date(),
  endDate: z.string().date(),
  isActive: z.boolean().default(false),
});

export const semesterSchema = z.object({
  academicSessionId: uuidSchema,
  name: z.string().min(2),
  startDate: z.string().date(),
  endDate: z.string().date(),
  isActive: z.boolean().default(false),
});

export const brandingSettingsSchema = z.object({
  name: z.string().optional(),
  logo_url: z.string().url().optional(),
  primary_color: z.string().optional(),
});
