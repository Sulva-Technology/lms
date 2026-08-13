import * as React from "react"
import { LucideIcon } from "lucide-react"
import { AuthRole } from "./auth"

export type Role = AuthRole

export interface NavItem {
  id: string
  label: string
  href: string
  icon: LucideIcon
  role: Role[]
  badge?: number
  matchPattern?: string // Regex pattern to match active state if needed
}

export interface NavSection {
  title?: string
  items: NavItem[]
}
