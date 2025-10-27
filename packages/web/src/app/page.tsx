"use client";

import { HeroSection } from "@/components/homepage/HeroSection";
import { FeaturesSection } from "@/components/homepage/FeaturesSection";
import { HowItWorksSection } from "@/components/homepage/HowItWorksSection";
import FAQSection from "@/components/custom/FAQSection";
import TestimonialSection from "@/components/custom/TestimonialSection";

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      {/* Geometric Background Pattern */}
      <div className="fixed inset-0 pointer-events-none opacity/[0.03]">
        <div className="absolute inset-0" style={{
          backgroundImage: `
            radial-gradient(circle at 20% 20%, currentColor 1px, transparent 1px),
            radial-gradient(circle at 80% 80%, currentColor 1px, transparent 1px),
            radial-gradient(circle at 40% 60%, currentColor 1px, transparent 1px),
            radial-gradient(circle at 60% 40%, currentColor 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px, 80px 80px, 100px 100px, 120px 120px'
        }}></div>
      </div>

      {/* Main Content */}
      <div className="relative z-10">
        <HeroSection />
        <FeaturesSection />
        <HowItWorksSection />
        <TestimonialSection />
        <FAQSection />
      </div>
    </div>
  );
}
