"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Users, 
  Globe, 
  Star, 
  Briefcase, 
  GraduationCap, 
  Award,
  ArrowRight,
  CheckCircle2,
  Heart,
  Clock,
  MapPin,
  Laptop,
  Zap,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

const benefits = [
  {
    icon: Globe,
    title: "Work with UK Clients",
    description: "Gain real-world experience working with clients based in the United Kingdom",
    highlight: "International Experience"
  },
  {
    icon: Briefcase,
    title: "Build Your Portfolio",
    description: "Add meaningful projects to your portfolio that showcase your skills",
    highlight: "Portfolio Growth"
  },
  {
    icon: GraduationCap,
    title: "Learn New Technologies",
    description: "Expand your skillset by working on diverse projects with modern tech stacks",
    highlight: "Skill Development"
  },
  {
    icon: Award,
    title: "Get References",
    description: "Receive professional references and recommendations for your future career",
    highlight: "Career Boost"
  },
  {
    icon: Clock,
    title: "Flexible Hours",
    description: "Work on your own schedule - we understand you have other commitments",
    highlight: "Work-Life Balance"
  },
  {
    icon: Users,
    title: "Join a Community",
    description: "Connect with like-minded developers and designers from around the world",
    highlight: "Networking"
  }
];

const requirements = [
  "Passion for technology and willingness to learn",
  "Basic understanding of web development (HTML, CSS, JavaScript)",
  "Available to commit 5-10 hours per week",
  "Good communication skills in English",
  "Self-motivated and able to work independently",
  "Reliable internet connection"
];

const stats = [
  { value: "50+", label: "Active Volunteers", icon: Users },
  { value: "100+", label: "Projects Completed", icon: Briefcase },
  { value: "25+", label: "UK Clients Served", icon: Globe },
  { value: "4.9", label: "Average Rating", icon: Star }
];

const faqs = [
  {
    q: "What kind of projects will I work on?",
    a: "You'll work on real client projects including web development, design, content creation, and more. Projects vary based on client needs and your skills."
  },
  {
    q: "Is this a paid position?",
    a: "This is a volunteer program focused on gaining experience. While unpaid, you'll receive professional references, portfolio pieces, and valuable industry experience."
  },
  {
    q: "How many hours per week do I need to commit?",
    a: "We ask for a minimum commitment of 5-10 hours per week, but you can adjust based on your availability and project requirements."
  },
  {
    q: "Can I volunteer remotely?",
    a: "Yes! Our program is fully remote. You can work from anywhere in the world as long as you have a reliable internet connection."
  }
];

function FAQItem({ faq, index }: { faq: { q: string; a: string }; index: number }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
    >
      <div 
        className={cn(
          "border rounded-xl overflow-hidden transition-all duration-300",
          isOpen ? "bg-primary/5 border-primary/20" : "bg-card border-border hover:border-primary/20"
        )}
      >
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full p-5 flex items-center justify-between text-left"
        >
          <span className="font-semibold text-foreground pr-4">{faq.q}</span>
          <div className={cn(
            "p-1.5 rounded-full transition-colors",
            isOpen ? "bg-primary text-primary-foreground" : "bg-muted"
          )}>
            {isOpen ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </div>
        </button>
        <motion.div
          initial={false}
          animate={{ height: isOpen ? "auto" : 0 }}
          className="overflow-hidden"
        >
          <p className="px-5 pb-5 text-muted-foreground leading-relaxed">
            {faq.a}
          </p>
        </motion.div>
      </div>
    </motion.div>
  );
}

export default function VolunteerPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 pt-16 sm:pt-20">
      {/* Premium background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-to-br from-primary/10 via-primary/5 to-transparent rounded-full filter blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-gradient-to-tr from-secondary/10 via-secondary/5 to-transparent rounded-full filter blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-gradient-to-r from-primary/5 via-transparent to-secondary/5 rounded-full filter blur-3xl opacity-50"></div>
      </div>

      {/* Hero Section */}
      <section className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center space-y-8 max-w-4xl mx-auto"
        >
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-primary/20 to-primary/10 text-primary font-medium border border-primary/20"
          >
            <Heart className="h-4 w-4 fill-primary" />
            <span>Volunteer Program</span>
            <Badge variant="secondary" className="ml-1 bg-primary/20 text-primary border-0">Now Open</Badge>
          </motion.div>
          
          <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold tracking-tight leading-[1.1]">
            Gain Experience by{" "}
            <span className="bg-gradient-to-r from-primary via-primary/80 to-primary bg-clip-text text-transparent">
              Working with UK Clients
            </span>
          </h1>
          
          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Join our volunteer program to build real-world skills, expand your portfolio, 
            and work on meaningful projects with clients from the United Kingdom.
          </p>

          {/* Feature pills */}
          <div className="flex flex-wrap justify-center gap-3 pt-2">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-muted/50 text-sm">
              <MapPin className="h-4 w-4 text-primary" />
              <span>100% Remote</span>
            </div>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-muted/50 text-sm">
              <Clock className="h-4 w-4 text-primary" />
              <span>Flexible Hours</span>
            </div>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-muted/50 text-sm">
              <Laptop className="h-4 w-4 text-primary" />
              <span>Real Projects</span>
            </div>
          </div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="flex flex-col sm:flex-row gap-4 justify-center pt-6"
          >
            <Button size="lg" asChild className="h-14 px-10 text-base font-semibold shadow-lg hover:shadow-xl transition-all">
              <Link href="/volunteer/apply">
                Apply Now
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="h-14 px-10 text-base border-2">
              <Link href="#benefits">
                Learn More
              </Link>
            </Button>
          </motion.div>
        </motion.div>
      </section>

      {/* Stats Section */}
      <section className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <Card className="border-0 bg-gradient-to-r from-primary to-primary/80 text-primary-foreground shadow-2xl overflow-hidden">
            <CardContent className="p-0">
              <div className="grid grid-cols-2 lg:grid-cols-4 divide-y lg:divide-y-0 lg:divide-x divide-primary-foreground/20">
                {stats.map((stat, index) => (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: index * 0.1 }}
                    className="p-6 sm:p-8 text-center"
                  >
                    <stat.icon className="h-6 w-6 mx-auto mb-3 opacity-80" />
                    <div className="text-3xl sm:text-4xl font-bold mb-1">{stat.value}</div>
                    <div className="text-sm opacity-80">{stat.label}</div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </section>

      {/* Benefits Section */}
      <section id="benefits" className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <Badge variant="outline" className="mb-4 px-4 py-1.5 text-sm border-primary/30 text-primary">
            Benefits
          </Badge>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">Why Volunteer With Us?</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Discover the benefits of joining our volunteer program and how it can accelerate your career
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {benefits.map((benefit, index) => (
            <motion.div
              key={benefit.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Card className="h-full border-0 bg-card shadow-lg hover:shadow-xl transition-all duration-300 group hover:-translate-y-1">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <benefit.icon className="h-7 w-7 text-primary" />
                    </div>
                    <Badge variant="secondary" className="text-xs bg-muted">
                      {benefit.highlight}
                    </Badge>
                  </div>
                  <CardTitle className="text-xl">{benefit.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base leading-relaxed">
                    {benefit.description}
                  </CardDescription>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Requirements Section */}
      <section className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <Card className="border-0 bg-card shadow-2xl overflow-hidden">
            <div className="grid lg:grid-cols-2">
              {/* Left side - Requirements */}
              <div className="p-8 sm:p-12 lg:p-16">
                <Badge variant="outline" className="mb-6 px-4 py-1.5 text-sm border-primary/30 text-primary">
                  Requirements
                </Badge>
                <h2 className="text-3xl sm:text-4xl font-bold mb-4">What We&apos;re Looking For</h2>
                <p className="text-muted-foreground text-lg mb-8 leading-relaxed">
                  We welcome volunteers from all backgrounds. Here&apos;s what will help you succeed in our program:
                </p>
                <ul className="space-y-4">
                  {requirements.map((req, index) => (
                    <motion.li
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.4, delay: index * 0.1 }}
                      className="flex items-start gap-4 p-3 rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="p-1 rounded-full bg-primary/10">
                        <CheckCircle2 className="h-5 w-5 text-primary" />
                      </div>
                      <span className="text-foreground">{req}</span>
                    </motion.li>
                  ))}
                </ul>
              </div>
              
              {/* Right side - CTA */}
              <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-8 sm:p-12 lg:p-16 flex items-center">
                <div className="w-full text-center lg:text-left">
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
                    <Zap className="h-4 w-4" />
                    <span>Quick Application</span>
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-bold mb-4">Ready to Get Started?</h3>
                  <p className="text-muted-foreground mb-8 text-lg">
                    Fill out our application form and we&apos;ll get back to you within 48 hours.
                  </p>
                  <Button size="lg" asChild className="h-14 px-10 text-base font-semibold w-full sm:w-auto shadow-lg">
                    <Link href="/volunteer/apply">
                      Apply to Volunteer
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Link>
                  </Button>
                  <p className="text-sm text-muted-foreground mt-4">
                    No experience required • All skill levels welcome
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>
      </section>

      {/* FAQ Section */}
      <section className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <Badge variant="outline" className="mb-4 px-4 py-1.5 text-sm border-primary/30 text-primary">
            FAQ
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">Frequently Asked Questions</h2>
          <p className="text-muted-foreground">
            Everything you need to know about our volunteer program
          </p>
        </motion.div>

        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <FAQItem key={index} faq={faq} index={index} />
          ))}
        </div>

        {/* Final CTA */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mt-16 text-center"
        >
          <p className="text-muted-foreground mb-6">
            Still have questions? We&apos;d love to hear from you.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" asChild className="h-12 px-8">
              <Link href="/volunteer/apply">
                Apply Now
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="h-12 px-8">
              <Link href="/contact">
                Contact Us
              </Link>
            </Button>
          </div>
        </motion.div>
      </section>
    </main>
  );
}
