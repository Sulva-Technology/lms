import * as React from "react"
import Link from "next/link"
import { LayoutTemplate } from "lucide-react"

export function LandingFooter() {
  return (
    <footer id="resources" className="border-t border-white/10 bg-slate-950 pt-20 pb-10 px-6 relative z-10">
       <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-5 gap-10 mb-16">
          <div className="col-span-2">
            <Link href="/" className="flex items-center gap-3 mb-6 inline-flex">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center font-outfit font-bold text-white shadow-glow-blue">
                <LayoutTemplate size={16} />
              </div>
              <span className="font-outfit font-bold text-xl tracking-wide text-white">VUI LMS</span>
            </Link>
            <p className="text-slate-500 max-w-sm">The operating system for modern education. Seamless, powerful, and beautifully designed.</p>
          </div>
          
          <div>
            <h4 className="font-medium text-white mb-6">Platform</h4>
            <ul className="space-y-4 text-sm text-slate-400">
              <li><Link href="/student" className="hover:text-white transition-colors">Student Experience</Link></li>
              <li><Link href="/lecturer" className="hover:text-white transition-colors">Lecturer Tools</Link></li>
              <li><Link href="/admin" className="hover:text-white transition-colors">Admin Dashboard</Link></li>
              <li><Link href="/student/live-classes" className="hover:text-white transition-colors">Live Classes</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-medium text-white mb-6">Resources</h4>
            <ul className="space-y-4 text-sm text-slate-400">
              <li><Link href="/design-system" className="hover:text-white transition-colors">Design System</Link></li>
              <li><Link href="/docs/vui-lms-master-design-system" className="hover:text-white transition-colors">Documentation</Link></li>
              <li><Link href="/docs/component-library" className="hover:text-white transition-colors">Component Library</Link></li>
              <li><Link href="/docs/live-class-design" className="hover:text-white transition-colors">Live Class Guide</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-medium text-white mb-6">Company</h4>
            <ul className="space-y-4 text-sm text-slate-400">
              <li><Link href="#solutions" className="hover:text-white transition-colors">Solutions</Link></li>
              <li><Link href="#security" className="hover:text-white transition-colors">Security</Link></li>
              <li><Link href="#contact" className="hover:text-white transition-colors">Contact</Link></li>
              <li><Link href="/docs/auth-onboarding-design" className="hover:text-white transition-colors">Onboarding</Link></li>
            </ul>
          </div>
       </div>
       
       <div className="max-w-7xl mx-auto pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-slate-500">
          <p>© {new Date().getFullYear()} VUI Software Inc. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <Link href="/docs/security-section" className="hover:text-slate-300 transition-colors">Security Notes</Link>
            <Link href="/docs/auth-onboarding-design" className="hover:text-slate-300 transition-colors">Access Terms</Link>
            <Link href="/login" className="hover:text-slate-300 transition-colors">Account Settings</Link>
          </div>
       </div>
    </footer>
  )
}
