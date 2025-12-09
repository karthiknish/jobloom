"use client";

import { KineticHero } from "@/components/homepage/KineticHero";
import { BentoFeatures } from "@/components/homepage/BentoFeatures";
import { KineticHowItWorks } from "@/components/homepage/KineticHowItWorks";
import FAQSection from "@/components/custom/FAQSection";

export default function Home() {
  return (
    <div className="min-h-screen bg-background font-sans selection:bg-primary/20">
      <KineticHero />
      <BentoFeatures />
      <KineticHowItWorks />
      <FAQSection />
    </div>
  );
}
