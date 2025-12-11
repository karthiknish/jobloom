"use client";

import { motion } from "framer-motion";
import { 
  Shield, 
  CheckCircle2, 
  Building2, 
  FileSearch, 
  Globe2, 
  BadgeCheck,
  AlertTriangle,
  ArrowRight,
  Calendar
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const features = [
  {
    icon: Building2,
    title: "Sponsor Database",
    description: "Access the complete UK Home Office register of 60,000+ licensed sponsors, updated regularly.",
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
  },
  {
    icon: FileSearch,
    title: "SOC Code Matching",
    description: "Automatically detect and validate SOC codes. Checks RQF Level 6 requirement for eligible roles.",
    color: "text-purple-500",
    bgColor: "bg-purple-500/10",
  },
  {
    icon: CheckCircle2,
    title: "Salary Threshold Check",
    description: "Verify if salaries meet the £41,700 minimum or occupation-specific going rates.",
    color: "text-green-500",
    bgColor: "bg-green-500/10",
  },
  {
    icon: Globe2,
    title: "ISL & TSL Lists",
    description: "Check Immigration Salary List and Temporary Shortage List (expires Dec 2026).",
    color: "text-orange-500",
    bgColor: "bg-orange-500/10",
  },
];

const steps = [
  {
    step: "1",
    title: "Browse Jobs on LinkedIn",
    description: "Use our Chrome extension while browsing LinkedIn, Indeed, or other job boards.",
  },
  {
    step: "2",
    title: "Click 'Check Sponsor'",
    description: "Our extension adds a button to each job card for instant sponsorship verification.",
  },
  {
    step: "3",
    title: "Get Instant Results",
    description: "See sponsor status, salary threshold compliance, SOC code eligibility, and ISL/TSL status.",
  },
];

const currentRules = [
  "General minimum salary: £41,700/year",
  "Minimum hourly rate: £17.13 (48hrs/week max)",
  "RQF Level 6 (Bachelor's) required for most roles",
  "ISL threshold for RQF 6+ roles: £33,400",
  "Going rates based on 50th percentile (median)",
  "Care Worker overseas recruitment closed",
];

export function UKVisaCheckerSection() {
  return (
    <section className="py-24 bg-background" id="visa-checker">
      <div className="container px-4 md:px-6 mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="max-w-3xl mx-auto text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
            <Shield className="h-4 w-4" />
            <span>UK Skilled Worker Visa</span>
          </div>
          
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-foreground mb-4">
            Instant UK Visa Sponsorship Check
          </h2>
          <p className="text-lg text-muted-foreground">
            Stop applying to jobs that won't sponsor your visa. Our Chrome extension checks every job listing 
            against the official UK Home Office sponsor register in real-time.
          </p>
        </motion.div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-2 gap-12 max-w-6xl mx-auto mb-16">
          {/* Left: Feature Cards */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="grid sm:grid-cols-2 gap-4"
          >
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.1 * index }}
                className="group p-6 rounded-2xl border border-border bg-card hover:shadow-lg motion-surface"
              >
                <div className={`inline-flex p-3 rounded-xl ${feature.bgColor} mb-4`}>
                  <feature.icon className={`h-6 w-6 ${feature.color}`} />
                </div>
                <h3 className="font-semibold text-foreground mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </motion.div>
            ))}
          </motion.div>

          {/* Right: How It Works */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="relative"
          >
            <div className="sticky top-24">
              <div className="p-8 rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
                <div className="flex items-center gap-2 mb-6">
                  <BadgeCheck className="h-5 w-5 text-primary" />
                  <h3 className="text-xl font-bold text-foreground">How It Works</h3>
                </div>
                
                <div className="space-y-6">
                  {steps.map((step, index) => (
                    <div key={step.step} className="flex gap-4">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold flex items-center justify-center text-sm">
                        {step.step}
                      </div>
                      <div>
                        <h4 className="font-semibold text-foreground mb-1">{step.title}</h4>
                        <p className="text-sm text-muted-foreground">{step.description}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* CTA */}
                <div className="mt-8 pt-6 border-t border-border">
                  <Link href="/sign-up">
                    <Button className="w-full group">
                      Get the Free Extension
                      <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 motion-control" />
                    </Button>
                  </Link>
                  <p className="text-xs text-center text-muted-foreground mt-3">
                    Works on Chrome, Edge, and Brave browsers
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Current Rules */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="max-w-4xl mx-auto mb-8"
        >
          <div className="flex items-center gap-2 mb-6 justify-center">
            <Calendar className="h-5 w-5 text-muted-foreground" />
            <h3 className="text-xl font-bold text-foreground">Current UK Skilled Worker Requirements</h3>
          </div>
          
          <div className="p-6 rounded-2xl border border-green-200 bg-green-50">
            <div className="flex items-center gap-2 mb-4">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <span className="font-bold text-green-800">December 2025 Rules</span>
              <span className="text-xs px-2 py-1 rounded-full bg-green-200 text-green-800">
                In Effect
              </span>
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              {currentRules.map((rule, i) => (
                <div key={i} className="text-sm flex items-start gap-2 text-green-700">
                  <CheckCircle2 className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  {rule}
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Bottom Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="max-w-4xl mx-auto"
        >
          <div className="p-6 rounded-2xl bg-muted/50 border border-border">
            <div className="grid md:grid-cols-4 gap-6 text-center">
              <div>
                <div className="text-3xl font-bold text-foreground mb-1">60,000+</div>
                <p className="text-sm text-muted-foreground">UK Sponsor Licenses</p>
              </div>
              <div>
                <div className="text-3xl font-bold text-foreground mb-1">£41,700</div>
                <p className="text-sm text-muted-foreground">Minimum Salary</p>
              </div>
              <div>
                <div className="text-3xl font-bold text-foreground mb-1">£17.13</div>
                <p className="text-sm text-muted-foreground">Hourly Rate Floor</p>
              </div>
              <div>
                <div className="text-3xl font-bold text-foreground mb-1">RQF 6</div>
                <p className="text-sm text-muted-foreground">Skill Level Required</p>
              </div>
            </div>
          </div>

          {/* Important Notice */}
          <div className="flex items-start gap-3 mt-6 p-4 rounded-xl bg-blue-50 border border-blue-200 text-blue-800">
            <AlertTriangle className="h-5 w-5 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium">Temporary Shortage List Expires December 2026</p>
              <p className="text-xs mt-1">
                Roles on the TSL (sub-degree level) remain eligible until December 2026. 
                After this date, only RQF Level 6+ roles will qualify for sponsorship.
                Our extension is continuously updated with the latest requirements.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

