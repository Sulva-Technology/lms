import * as React from "react"
import { labelsFor } from "@/lib/ui/labels"
import type { TenantProfile } from "@/lib/tenant/profile"
import { ComparisonBlock } from "./ComparisonBlock"
import { FeatureGrid } from "./FeatureGrid"
import { FinalCTA } from "./FinalCTA"
import { HowItWorks } from "./HowItWorks"
import { LandingFooter } from "./LandingFooter"
import { LandingNavbar } from "./LandingNavbar"
import { ProductMockup } from "./ProductMockup"
import { SchoolHero } from "./SchoolHero"
import { SchoolStats } from "./SchoolStats"
import { SecuritySection } from "./SecuritySection"

/**
 * The front page of a school host. Same shell as the platform page, but every
 * word, mark and colour belongs to the school rather than to Sulva LMS.
 */
export function SchoolLanding({ profile, host }: { profile: TenantProfile; host: string }) {
  const labels = labelsFor(profile.vocabulary)
  const lower = (value: string) => value.toLowerCase()
  const brand = { name: profile.name, logoUrl: profile.logoUrl }

  return (
    <div className="min-h-screen bg-canvas">
      <LandingNavbar
        brand={brand}
        links={[
          { href: "#about", label: "About" },
          { href: "#how", label: "Getting started" },
          { href: "#platform", label: `For ${lower(labels.learnerPlural)} & ${lower(labels.instructorPlural)}` },
          { href: "#security", label: "Security" },
        ]}
        ctaLabel="Sign in"
        showSignInLink={false}
      />

      <main>
        <SchoolHero
          name={profile.name}
          logoUrl={profile.logoUrl}
          host={host}
          website={profile.domain}
          establishedYear={profile.establishedYear}
          vocabulary={profile.vocabulary}
        />

        <SchoolStats stats={profile.stats} vocabulary={profile.vocabulary} />
        <ProductMockup />

        <HowItWorks
          title={`Getting started at ${profile.name}.`}
          description={`Your ${lower(labels.tenant)} account opens every part of the portal.`}
          vocabulary={profile.vocabulary}
          steps={[
            {
              title: "Use the account you were issued",
              body: `${profile.name} creates your account and sends the invitation. There is no public sign-up on this address.`,
            },
            {
              title: `Find your ${lower(labels.coursePlural)}`,
              body: `Everything you are registered for appears on your dashboard the moment ${lower(labels.registration)} is approved.`,
            },
            {
              title: `Join ${lower(labels.liveClassPlural)}`,
              body: `Sessions open from the ${lower(labels.course)} itself, and attendance is recorded as you join.`,
            },
            {
              title: "Track results as they land",
              body: "Submissions, marks and attendance stay visible through the term rather than arriving at the end of it.",
            },
          ]}
        />

        <FeatureGrid
          title={`Everything ${profile.name} runs, in one place.`}
          description={`${labels.liveClassPlural}, ${lower(labels.registration)}, grading and administration — built for the way ${profile.name} teaches.`}
          vocabulary={profile.vocabulary}
        />

        <ComparisonBlock
          title={`Why ${profile.name} runs it here.`}
          ownColumnLabel={`At ${profile.name}`}
        />

        <SecuritySection
          title={`Your work stays inside ${profile.name}.`}
          description={`This ${lower(labels.tenant)} runs on its own isolated tenant at ${host}. Records are separated at the database level, encrypted in transit and at rest, and reachable only by accounts ${profile.name} has invited.`}
        />

        <FinalCTA
          title={`Welcome back to ${profile.name}.`}
          description={`Sign in with the account your ${lower(labels.tenant)} issued you to reach your ${lower(labels.coursePlural)}, ${lower(labels.liveClassPlural)} and results.`}
          action={{ href: "/login", label: "Sign in" }}
        />
      </main>

      <LandingFooter
        brand={{
          name: profile.name,
          logoUrl: profile.logoUrl,
          tagline: `The learning platform of ${profile.name}.`,
          host,
        }}
      />
    </div>
  )
}
