import * as React from "react"
import { ComparisonBlock } from "./ComparisonBlock"
import { FeatureGrid } from "./FeatureGrid"
import { FinalCTA } from "./FinalCTA"
import { HeroSection } from "./HeroSection"
import { HowItWorks } from "./HowItWorks"
import { LandingFooter } from "./LandingFooter"
import { LandingNavbar } from "./LandingNavbar"
import { ProblemGrid } from "./ProblemGrid"
import { ProductMockup } from "./ProductMockup"
import { SecuritySection } from "./SecuritySection"

/** The platform's own front page, served on the root domain. */
export function MarketingLanding() {
  return (
    <div className="min-h-screen bg-canvas">
      <LandingNavbar />

      <main>
        <HeroSection />
        <ProductMockup />
        <ProblemGrid />
        <HowItWorks />
        <FeatureGrid />
        <ComparisonBlock />
        <SecuritySection />
        <FinalCTA
          secondaryAction={{ href: "/login", label: "I already have an account" }}
        />
      </main>

      <LandingFooter />
    </div>
  )
}
