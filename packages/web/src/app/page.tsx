"use client";

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
      <MicroInteractionsSection />
      <BentoFeatures />
      <UKVisaCheckerSection />
      <KineticHowItWorks />
      <FAQSection />
    </div>
  );
}
