"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Users, 
  Globe, 
  Star, 
  Briefcase, 
  GraduationCap, 
  Award,
  ArrowRight,
  CheckCircle2,
  Heart
} from "lucide-react";

const benefits = [
  {
    icon: Globe,
    title: "Work with UK Clients",
    description: "Gain real-world experience working with clients based in the United Kingdom"
  },
  {
    icon: Briefcase,
    title: "Build Your Portfolio",
    description: "Add meaningful projects to your portfolio that showcase your skills"
  },
  {
    icon: GraduationCap,
    title: "Learn New Technologies",
    description: "Expand your skillset by working on diverse projects with modern tech stacks"
  },
  {
    icon: Award,
    title: "Get References",
    description: "Receive professional references and recommendations for your future career"
  },
  {
    icon: Star,
    title: "Flexible Hours",
    description: "Work on your own schedule - we understand you have other commitments"
  },
  {
    icon: Users,
    title: "Join a Community",
    description: "Connect with like-minded developers and designers from around the world"
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

const fadeInUp = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6 }
};

export default function VolunteerPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background pt-16 sm:pt-20">
      {/* Premium background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 right-20 w-96 h-96 bg-primary/5 rounded-full filter blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 left-20 w-80 h-80 bg-secondary/5 rounded-full filter blur-2xl animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>

      {/* Hero Section */}
      <section className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center space-y-6 max-w-4xl mx-auto"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium">
            <Heart className="h-4 w-4" />
            <span>Volunteer Program</span>
          </div>
          
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight">
            Gain Experience by <span className="text-primary">Working with UK Clients</span>
          </h1>
          
          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Join our volunteer program to build real-world skills, expand your portfolio, 
            and work on meaningful projects with clients from the United Kingdom.
          </p>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="flex flex-col sm:flex-row gap-4 justify-center pt-4"
          >
            <Button size="lg" asChild className="h-12 px-8 text-base font-semibold">
              <Link href="/volunteer/apply">
                Apply Now
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="h-12 px-8 text-base">
              <Link href="#benefits">
                Learn More
              </Link>
            </Button>
          </motion.div>
        </motion.div>
      </section>

      {/* Benefits Section */}
      <section id="benefits" className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">Why Volunteer With Us?</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Discover the benefits of joining our volunteer program
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
              <Card className="h-full border-0 bg-surface shadow-lg hover:shadow-xl transition-shadow">
                <CardHeader>
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                    <benefit.icon className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-xl">{benefit.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">
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
          <Card className="border-0 bg-surface shadow-xl p-8 sm:p-12">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl font-bold mb-4">What We&apos;re Looking For</h2>
                <p className="text-muted-foreground text-lg mb-8">
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
                      className="flex items-start gap-3"
                    >
                      <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                      <span className="text-foreground">{req}</span>
                    </motion.li>
                  ))}
                </ul>
              </div>
              
              <div className="text-center">
                <div className="bg-primary/5 rounded-2xl p-8 sm:p-10">
                  <h3 className="text-2xl font-bold mb-4">Ready to Get Started?</h3>
                  <p className="text-muted-foreground mb-6">
                    Fill out our application form and we&apos;ll get back to you within 48 hours.
                  </p>
                  <Button size="lg" asChild className="w-full sm:w-auto h-12 px-8 text-base font-semibold">
                    <Link href="/volunteer/apply">
                      Apply to Volunteer
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>
      </section>

      {/* FAQ Section */}
      <section className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">Frequently Asked Questions</h2>
        </motion.div>

        <div className="space-y-6">
          {[
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
          ].map((faq, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
            >
              <Card className="border-0 bg-surface shadow-md">
                <CardHeader>
                  <CardTitle className="text-lg">{faq.q}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{faq.a}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>
    </main>
  );
}
