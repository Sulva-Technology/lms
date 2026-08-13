'use client';

import { LandingNavbar } from "@/components/landing/LandingNavbar"
import { LandingBackground } from "@/components/landing/LandingBackground"
import { HeroSection } from "@/components/landing/HeroSection"
import { ProductMockup } from "@/components/landing/ProductMockup"
import { FeatureGrid } from "@/components/landing/FeatureGrid"
import { SecuritySection } from "@/components/landing/SecuritySection"
import { FinalCTA } from "@/components/landing/FinalCTA"
import { LandingFooter } from "@/components/landing/LandingFooter"
import { Building2 } from "lucide-react"

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 overflow-hidden font-sans selection:bg-blue-500/30">
      <LandingBackground />
      <LandingNavbar />

      <main>
        <HeroSection />
        <ProductMockup />

        {/* Social Proof */}
        <section className="py-10 border-y border-white/5 bg-white/[0.01]">
          <div className="max-w-7xl mx-auto px-6 text-center">
            <p className="text-sm font-medium text-slate-500 uppercase tracking-widest mb-8">Architecting the future of education at innovative institutions</p>
            <div className="flex flex-wrap justify-center gap-12 sm:gap-20 opacity-50 grayscale">
               <div className="flex items-center gap-2 text-xl font-bold font-outfit"><Building2 /> Stanford</div>
               <div className="flex items-center gap-2 text-xl font-bold font-outfit"><Building2 /> MIT</div>
               <div className="flex items-center gap-2 text-xl font-bold font-outfit"><Building2 /> Oxford</div>
               <div className="flex items-center gap-2 text-xl font-bold font-outfit"><Building2 /> Harvard</div>
            </div>
          </div>
        </section>

        <FeatureGrid />
        <SecuritySection />
        <FinalCTA />
      </main>

      <LandingFooter />
    </div>
  );
}
