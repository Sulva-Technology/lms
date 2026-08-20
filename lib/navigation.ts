import { 
  LayoutDashboard, 
  BookOpen, 
  Video, 
  FileText, 
  Award, 
  Calendar, 
  Bell, 
  Settings,
  Users,
  Building,
  Briefcase,
  GraduationCap,
  FolderLock,
  Globe,
  CreditCard,
  HelpCircle,
  BarChart,
  Target,
  FileCheck2,
  VideoIcon,
  MessageSquare,
  Megaphone,
  ShieldCheck
} from "lucide-react"
import { NavSection, Role, NavItem } from "@/types/navigation"
import { translateLabel, type Vocabulary } from "@/lib/ui/labels"
import type { TenantMode } from "@/lib/tenant/mode"

export const navigationConfig: NavSection[] = [
  // Student Navigation
  {
    items: [
      { id: "s-dash", label: "Dashboard", href: "/student", icon: LayoutDashboard, role: ["student"] },
      { id: "s-courses", label: "My Courses", href: "/student/courses", icon: BookOpen, role: ["student"] },
      { id: "s-reg", label: "Course Registration", href: "/student/registration", icon: FileCheck2, role: ["student"] },
      { id: "s-live", label: "Live Classes", href: "/student/live-classes", icon: Video, role: ["student"] },
      { id: "s-assign", label: "Assignments", href: "/student/assignments", icon: FileText, role: ["student"] },
      { id: "s-quiz", label: "Quizzes", href: "/student/quizzes", icon: Target, role: ["student"] },
      { id: "s-grades", label: "Grades", href: "/student/grades", icon: Award, role: ["student"] },
      { id: "s-training", label: "My Training", href: "/student/training", icon: Target, role: ["student"] },
      { id: "s-certs", label: "Certificates", href: "/student/certificates", icon: FileCheck2, role: ["student"] },
      { id: "s-cal", label: "Calendar", href: "/student/calendar", icon: Calendar, role: ["student"] },
      { id: "s-notif", label: "Notifications", href: "/student/notifications", icon: Bell, role: ["student"] },
      { id: "s-settings", label: "Settings", href: "/student/settings", icon: Settings, role: ["student"] },
    ]
  },
  
  // Lecturer Navigation
  {
    items: [
      { id: "l-dash", label: "Dashboard", href: "/lecturer", icon: LayoutDashboard, role: ["lecturer"] },
      { id: "l-courses", label: "My Courses", href: "/lecturer/courses", icon: BookOpen, role: ["lecturer"] },
      { id: "l-live", label: "Live Classes", href: "/lecturer/live-classes", icon: VideoIcon, role: ["lecturer"] },
      { id: "l-recordings", label: "Recordings", href: "/lecturer/recordings", icon: Video, role: ["lecturer"] },
      { id: "l-certs", label: "Certificates", href: "/lecturer/certificates", icon: Award, role: ["lecturer"] },
      { id: "l-assign", label: "Assignments", href: "/lecturer/assignments", icon: FileText, role: ["lecturer"] },
      { id: "l-quiz", label: "Quizzes", href: "/lecturer/quizzes", icon: Target, role: ["lecturer"] },
      { id: "l-gradebook", label: "Gradebook", href: "/lecturer/gradebook", icon: Award, role: ["lecturer"] },
      { id: "l-attendance", label: "Attendance", href: "/lecturer/attendance", icon: Users, role: ["lecturer"] },
      { id: "l-qa", label: "Questions", href: "/lecturer/questions", icon: MessageSquare, role: ["lecturer"] },
      { id: "l-announcements", label: "Announcements", href: "/lecturer/announcements", icon: Megaphone, role: ["lecturer"] },
      { id: "l-settings", label: "Settings", href: "/lecturer/settings", icon: Settings, role: ["lecturer"] },
    ]
  },

  // Admin Navigation
  {
    items: [
      { id: "a-dash", label: "Dashboard", href: "/admin", icon: LayoutDashboard, role: ["admin"] },
      { id: "a-users", label: "Users & Invites", href: "/admin/users", icon: Users, role: ["admin"] },
      { id: "tr-list", label: "Trainings", href: "/admin/trainings", icon: GraduationCap, role: ["admin", "lecturer"] },
      { id: "tr-people", label: "People", href: "/admin/people", icon: Users, role: ["admin"] },
      { id: "ad-compliance", label: "Compliance", href: "/admin/compliance", icon: ShieldCheck, role: ["admin", "department_admin"] },
      { id: "a-faculties", label: "Faculties", href: "/admin/faculties", icon: Building, role: ["admin"] },
      { id: "a-depts", label: "Departments", href: "/admin/departments", icon: Briefcase, role: ["admin"] },
      { id: "a-programs", label: "Programs", href: "/admin/programs", icon: GraduationCap, role: ["admin"] },
      { id: "a-students", label: "Students", href: "/admin/students", icon: Users, role: ["admin"] },
      { id: "a-lecturers", label: "Lecturers", href: "/admin/lecturers", icon: BookOpen, role: ["admin"] },
      { id: "a-courses", label: "Courses", href: "/admin/courses", icon: FileText, role: ["admin"] },
      { id: "a-reg", label: "Registration", href: "/admin/registration", icon: FileCheck2, role: ["admin"] },
      { id: "a-reports", label: "Reports", href: "/admin/reports", icon: BarChart, role: ["admin"] },
      { id: "a-storage", label: "Storage", href: "/admin/storage", icon: FolderLock, role: ["admin"] },
      { id: "a-settings", label: "Settings", href: "/admin/settings", icon: Settings, role: ["admin"] },
      { id: "a-audit", label: "Audit Logs", href: "/admin/audit", icon: FileText, role: ["admin"] },
    ]
  },

  // Super Admin Navigation
  {
    items: [
      { id: "sa-overview", label: "Platform Overview", href: "/superadmin", icon: LayoutDashboard, role: ["super_admin"] },
      { id: "sa-unis", label: "Universities", href: "/superadmin/universities", icon: Building, role: ["super_admin"] },
      { id: "sa-plans", label: "Plans", href: "/superadmin/plans", icon: Award, role: ["super_admin"] },
      { id: "sa-billing", label: "Billing", href: "/superadmin/billing", icon: CreditCard, role: ["super_admin"] },
      { id: "sa-usage", label: "Usage", href: "/superadmin/usage", icon: BarChart, role: ["super_admin"] },
      { id: "sa-support", label: "Support", href: "/superadmin/support", icon: HelpCircle, role: ["super_admin"] },
      { id: "sa-settings", label: "System Settings", href: "/superadmin/settings", icon: Settings, role: ["super_admin"] },
    ]
  }
]

/**
 * What a training organisation sees, per role, in order.
 *
 * A law firm has no faculties, no semesters and no course registration, so
 * those items are absent rather than renamed: relabelling a screen an
 * organisation can never use still leaves it in the way. Ids are listed
 * explicitly so adding an academic screen later cannot leak into this menu by
 * accident.
 */
const TRAINING_MENU: Partial<Record<Role, string[]>> = {
  admin: ["a-dash", "tr-list", "tr-people", "ad-compliance", "a-settings"],
  department_admin: ["a-dash", "ad-compliance", "a-settings"],
  lecturer: ["l-dash", "tr-list", "l-certs", "l-settings"],
  student: ["s-dash", "s-training", "s-certs", "s-settings"],
}

export const getNavigationForRole = (
  role: Role,
  vocabulary: Vocabulary = "academic",
  mode: TenantMode = "academic",
): NavItem[] => {
  const effectiveRole = role === "department_admin" ? "admin" : role

  const visible: NavItem[] = []
  navigationConfig.forEach(section => {
    section.items.forEach(item => {
      if (item.role.includes(role) || item.role.includes(effectiveRole)) visible.push(item)
    })
  })

  const ordered =
    mode === "training" && TRAINING_MENU[role]
      ? (TRAINING_MENU[role] as string[])
          .map(id => visible.find(item => item.id === id))
          .filter((item): item is NavItem => Boolean(item))
      : visible

  // Only the label is rewritten; href and id stay as the routes require.
  return ordered.map(item =>
    vocabulary === "academic" ? item : { ...item, label: translateLabel(item.label, vocabulary) },
  )
}
