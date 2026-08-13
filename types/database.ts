export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      universities: {
        Row: {
          id: string
          name: string
          domain: string | null
          logo_url: string | null
          created_at: string
          updated_at: string
          deleted_at: string | null
        }
        Insert: { /* ... */ }
        Update: { /* ... */ }
      }
      profiles: {
        Row: {
          id: string
          university_id: string | null
          first_name: string
          last_name: string
          avatar_url: string | null
          role: 'super_admin' | 'admin' | 'department_admin' | 'lecturer' | 'student'
          student_id: string | null
          email: string | null
          created_at: string
          updated_at: string
        }
        Insert: { /* ... */ }
        Update: { /* ... */ }
      }
      // Additional tables mapped here
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      auth_user_id: { Args: Record<string, never>; Returns: string }
      current_profile_id: { Args: Record<string, never>; Returns: string }
      current_university_id: { Args: Record<string, never>; Returns: string }
    }
    Enums: {
      user_role: 'super_admin' | 'admin' | 'department_admin' | 'lecturer' | 'student'
      course_status: 'draft' | 'published' | 'archived'
      assignment_status: 'pending' | 'submitted' | 'graded' | 'late'
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
