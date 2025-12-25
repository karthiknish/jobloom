"use client";

import Link from "next/link";
import { KineticHero } from "@/components/homepage/KineticHero";
import { MicroInteractionsSection } from "@/components/homepage/MicroInteractionsSection";
import { BentoFeatures } from "@/components/homepage/BentoFeatures";
import { UKVisaCheckerSection } from "@/components/homepage/UKVisaCheckerSection";
import { KineticHowItWorks } from "@/components/homepage/KineticHowItWorks";
import FAQSection from "@/components/custom/FAQSection";

export default function Home() {
  return (
    <div className="min-h-screen bg-background font-sans selection:bg-primary/20">
      <KineticHero />

      {/* Mobile-only sticky section nav (keeps navigation accessible while scrolling) */}
      <div className="md:hidden sticky top-[var(--header-height-mobile)] z-30 border-y border-border bg-background/95 backdrop-blur">
        <div className="flex items-center gap-2 overflow-x-auto px-4 py-2 scrollbar-hide">
          <a
            href="#features"
            className="shrink-0 rounded-full border border-border bg-muted/40 px-3 py-1.5 text-xs font-semibold text-foreground"
            onClick={(e) => {
              e.preventDefault();
              document.getElementById("features")?.scrollIntoView({ behavior: "smooth" });
            }}
          >
            Features
          </a>
          <a
            href="#visa-checker"
            className="shrink-0 rounded-full border border-border bg-muted/40 px-3 py-1.5 text-xs font-semibold text-foreground"
            onClick={(e) => {
              e.preventDefault();
              document.getElementById("visa-checker")?.scrollIntoView({ behavior: "smooth" });
            }}
          >
            Visa checker
          </a>
          <a
            href="#how-it-works"
            className="shrink-0 rounded-full border border-border bg-muted/40 px-3 py-1.5 text-xs font-semibold text-foreground"
            onClick={(e) => {
              e.preventDefault();
              document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth" });
            }}
          >
            How it works
          </a>
          <a
            href="#faq"
            className="shrink-0 rounded-full border border-border bg-muted/40 px-3 py-1.5 text-xs font-semibold text-foreground"
            onClick={(e) => {
              e.preventDefault();
              document.getElementById("faq")?.scrollIntoView({ behavior: "smooth" });
            }}
          >
            FAQ
          </a>
          <div className="ml-auto flex items-center gap-2">
            <Link
              href="/sign-in"
              className="shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold text-muted-foreground"
            >
              Sign in
            </Link>
            <Link
              href="/sign-up"
              className="shrink-0 rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground"
            >
              Get started
            </Link>
          </div>
        </div>
      </div>

      <MicroInteractionsSection />
      <BentoFeatures />
      <UKVisaCheckerSection />
      <KineticHowItWorks />
      <FAQSection />
    </div>
  );
}
