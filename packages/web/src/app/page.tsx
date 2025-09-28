import Link from "next/link";
// Authentication handled by Firebase
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import FAQSection from "@/components/custom/FAQSection";
import { playfair } from "@/font";
import TestimonialSection from "@/components/custom/TestimonialSection";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Zap, Shield, Users, TrendingUp, CheckCircle, Sparkles, Target, Eye } from "lucide-react";

export default async function Home() {
  // TODO: Replace with Firebase server-side auth if needed. For now assume logged-out.
  const userId = null as string | null;

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-background to-secondary/5 pt-16">
        {/* Enhanced animated background elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-r from-primary/20 to-secondary/20 rounded-full mix-blend-multiply filter blur-3xl animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-r from-accent/20 to-primary/20 rounded-full mix-blend-multiply filter blur-3xl animate-pulse animation-delay-2000"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-gradient-to-r from-secondary/15 to-accent/15 rounded-full mix-blend-multiply filter blur-3xl animate-pulse animation-delay-4000"></div>

          {/* Additional background circles */}
          <div className="absolute top-10 right-20 w-64 h-64 bg-gradient-to-r from-primary/10 to-accent/10 rounded-full mix-blend-multiply filter blur-2xl animate-pulse animation-delay-1000"></div>
          <div className="absolute bottom-20 right-10 w-48 h-48 bg-gradient-to-r from-secondary/15 to-primary/10 rounded-full mix-blend-multiply filter blur-2xl animate-pulse animation-delay-3000"></div>

          {/* Circle patches */}
          <div className="absolute top-0 left-0 w-72 h-72 bg-gradient-to-br from-primary/8 to-secondary/8 rounded-full mix-blend-multiply filter blur-3xl animate-pulse animation-delay-500"></div>
          <div className="absolute top-1/4 right-0 w-56 h-56 bg-gradient-to-tl from-accent/12 to-primary/12 rounded-full mix-blend-multiply filter blur-2xl animate-pulse animation-delay-1500"></div>
          <div className="absolute bottom-0 left-1/4 w-80 h-80 bg-gradient-to-tr from-secondary/10 to-accent/10 rounded-full mix-blend-multiply filter blur-3xl animate-pulse animation-delay-2500"></div>
          <div className="absolute top-3/4 left-1/2 w-40 h-40 bg-gradient-to-b from-primary/15 to-secondary/15 rounded-full mix-blend-multiply filter blur-xl animate-pulse animation-delay-3500"></div>
          <div className="absolute bottom-1/3 right-1/3 w-64 h-64 bg-gradient-to-bl from-accent/8 to-primary/8 rounded-full mix-blend-multiply filter blur-2xl animate-pulse animation-delay-700"></div>
          <div className="absolute top-1/3 left-1/6 w-52 h-52 bg-gradient-to-r from-secondary/12 to-accent/12 rounded-full mix-blend-multiply filter blur-xl animate-pulse animation-delay-4200"></div>

          {/* Floating geometric shapes */}
          <div className="absolute top-20 left-10 w-4 h-4 bg-primary/30 rounded-full animate-bounce animation-delay-100"></div>
          <div className="absolute top-40 right-20 w-3 h-3 bg-secondary/40 rounded-full animate-bounce animation-delay-300"></div>
          <div className="absolute bottom-32 left-20 w-2 h-2 bg-accent/50 rounded-full animate-bounce animation-delay-500"></div>
          <div className="absolute top-60 left-32 w-3 h-3 bg-primary/40 rounded-full animate-bounce animation-delay-200"></div>
          <div className="absolute bottom-40 right-32 w-2 h-2 bg-secondary/50 rounded-full animate-bounce animation-delay-400"></div>
          <div className="absolute top-80 left-1/4 w-4 h-4 bg-accent/30 rounded-full animate-bounce animation-delay-600"></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32">
          <div className="text-center">

            <h1
              className={`text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold text-foreground animate-fade-in-up leading-tight ${playfair.className}`}
            >
              Never Miss a
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-primary via-secondary to-accent animate-gradient">
                Sponsored Opportunity
              </span>
              Again
            </h1>

            <p className="mt-8 max-w-4xl mx-auto text-xl sm:text-2xl text-muted-foreground leading-relaxed">
              See exactly which companies are investing thousands in hiring. Our AI-powered platform reveals sponsored jobs across all major job sites, giving you the competitive edge you&apos;ve been missing.
            </p>

            {/* Value proposition highlights */}
            <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              <div className="flex items-center justify-center gap-3 p-4 bg-white/50 backdrop-blur-sm rounded-xl border border-white/20 shadow-sm">
                <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                  <Target className="h-4 w-4 text-primary" />
                </div>
                <span className="font-semibold text-foreground">95% More Responses</span>
              </div>
              <div className="flex items-center justify-center gap-3 p-4 bg-white/50 backdrop-blur-sm rounded-xl border border-white/20 shadow-sm">
                <div className="w-8 h-8 bg-secondary/10 rounded-full flex items-center justify-center">
                  <TrendingUp className="h-4 w-4 text-secondary" />
                </div>
                <span className="font-semibold text-foreground">3x Faster Applications</span>
              </div>
              <div className="flex items-center justify-center gap-3 p-4 bg-white/50 backdrop-blur-sm rounded-xl border border-white/20 shadow-sm">
                <div className="w-8 h-8 bg-accent/10 rounded-full flex items-center justify-center">
                  <Shield className="h-4 w-4 text-accent-foreground" />
                </div>
                <span className="font-semibold text-foreground">Privacy Protected</span>
              </div>
            </div>

            <div className="mt-12 flex flex-col sm:flex-row gap-6 justify-center items-center">
              {userId ? (
                <Button asChild size="lg" className="text-lg px-8 py-6 shadow-lg hover:shadow-xl transition-all duration-300">
                  <Link href="/dashboard" className="flex items-center gap-2">
                    Go to Dashboard
                    <ArrowRight className="h-5 w-5" />
                  </Link>
                </Button>
              ) : (
                <>
                  <Button asChild size="lg" className="text-lg px-8 py-6 shadow-lg hover:shadow-xl transition-all duration-300">
                    <Link href="/sign-up" className="flex items-center gap-2">
                      <Sparkles className="h-5 w-5" />
                      Start Free Today
                    </Link>
                  </Button>
                  <Button
                    asChild
                    size="lg"
                    variant="outline"
                    className="text-lg px-8 py-6 border-2 hover:bg-secondary/10 transition-all duration-300"
                  >
                    <a href="#how-it-works" className="flex items-center gap-2">
                      <Eye className="h-5 w-5" />
                      See How It Works
                    </a>
                  </Button>
                </>
              )}
            </div>

            <div className="mt-8 flex items-center justify-center gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-primary" />
                <span>Chrome extension included</span>
              </div>
            </div>
          </div>
        </div>

        {/* Floating action button for mobile */}
        <div className="fixed bottom-6 right-6 md:hidden z-50">
          <Button
            asChild
            size="lg"
            className="rounded-full w-16 h-16 shadow-2xl bg-primary hover:bg-primary/90"
          >
            <Link href="/sign-up">
              <Sparkles className="h-6 w-6" />
            </Link>
          </Button>
        </div>
      </section>

      {/* Problem Section */}
      <section className="py-20 bg-muted/20 section-depth-strong">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-destructive/10 text-destructive px-4 py-2 rounded-full text-sm font-medium mb-4">
              <span className="w-2 h-2 bg-destructive rounded-full animate-pulse"></span>
              The Problem
            </div>
            <h2
              className={`text-3xl sm:text-4xl md:text-5xl font-bold text-foreground ${playfair.className}`}
            >
              You&apos;re Missing Out on the
              <span className="block text-destructive">Best Opportunities</span>
            </h2>
            <p className="mt-6 text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              While companies spend thousands promoting their jobs, job seekers like you can&apos;t tell which opportunities are real priorities. This information asymmetry costs you time, energy, and missed opportunities.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="group relative overflow-hidden border-0 bg-gradient-to-br from-white to-destructive/5 hover:shadow-2xl transition-all duration-500 hover:-translate-y-2">
              <div className="absolute inset-0 bg-gradient-to-br from-destructive/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <CardHeader className="relative">
                <div className="w-20 h-20 bg-gradient-to-br from-destructive/10 to-destructive/20 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-110">
                  <div className="w-8 h-8 bg-destructive rounded-full flex items-center justify-center">
                    <span className="text-white text-xl font-bold">?</span>
                  </div>
                </div>
                <CardTitle className={`text-xl font-bold text-center group-hover:text-destructive transition-colors ${playfair.className}`}>
                  Invisible Sponsorships
                </CardTitle>
              </CardHeader>
              <CardContent className="relative">
                <p className="text-muted-foreground text-center leading-relaxed">
                  Sponsored jobs look identical to regular listings. You have no way of knowing which companies are actually investing in hiring vs. just posting requirements.
                </p>
                <div className="mt-4 text-center">
                  <span className="text-xs text-destructive font-medium">Hidden Priority Signal</span>
                </div>
              </CardContent>
            </Card>

            <Card className="group relative overflow-hidden border-0 bg-gradient-to-br from-white to-secondary/5 hover:shadow-2xl transition-all duration-500 hover:-translate-y-2">
              <div className="absolute inset-0 bg-gradient-to-br from-secondary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <CardHeader className="relative">
                <div className="w-20 h-20 bg-gradient-to-br from-secondary/10 to-secondary/20 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-110">
                  <div className="w-8 h-8 bg-secondary rounded-full flex items-center justify-center">
                    <span className="text-white text-xl font-bold">!</span>
                  </div>
                </div>
                <CardTitle className={`text-xl font-bold text-center group-hover:text-secondary transition-colors ${playfair.className}`}>
                  Scattered Applications
                </CardTitle>
              </CardHeader>
              <CardContent className="relative">
                <p className="text-muted-foreground text-center leading-relaxed">
                  Your job search is fragmented across multiple platforms. No central place to track applications, follow-ups, or interview schedules.
                </p>
                <div className="mt-4 text-center">
                  <span className="text-xs text-secondary font-medium">No Central Command</span>
                </div>
              </CardContent>
            </Card>

            <Card className="group relative overflow-hidden border-0 bg-gradient-to-br from-white to-accent/5 hover:shadow-2xl transition-all duration-500 hover:-translate-y-2">
              <div className="absolute inset-0 bg-gradient-to-br from-accent/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <CardHeader className="relative">
                <div className="w-20 h-20 bg-gradient-to-br from-accent/10 to-accent/20 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-110">
                  <div className="w-8 h-8 bg-accent-foreground rounded-full flex items-center justify-center">
                    <span className="text-white text-xl font-bold">💸</span>
                  </div>
                </div>
                <CardTitle className={`text-xl font-bold text-center group-hover:text-accent-foreground transition-colors ${playfair.className}`}>
                  Wasted Time & Energy
                </CardTitle>
              </CardHeader>
              <CardContent className="relative">
                <p className="text-muted-foreground text-center leading-relaxed">
                  You spend hours applying to jobs without knowing which companies are serious about hiring. Most applications go into a black hole.
                </p>
                <div className="mt-4 text-center">
                  <span className="text-xs text-accent-foreground font-medium">Low Response Rate</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Problem impact visualization */}
          <div className="mt-16 text-center">
            <div className="inline-flex items-center gap-4 bg-muted/50 rounded-2xl p-6 shadow-sm border border-border/20">
              <div className="text-center">
                <div className="text-3xl font-bold text-destructive">78%</div>
                <div className="text-sm text-muted-foreground">of applications</div>
                <div className="text-sm text-muted-foreground">get no response</div>
              </div>
              <div className="w-px h-12 bg-border"></div>
              <div className="text-center">
                <div className="text-3xl font-bold text-secondary">6-8</div>
                <div className="text-sm text-muted-foreground">hours per week</div>
                <div className="text-sm text-muted-foreground">wasted on job search</div>
              </div>
              <div className="w-px h-12 bg-border"></div>
              <div className="text-center">
                <div className="text-3xl font-bold text-accent-foreground">$2,500+</div>
                <div className="text-sm text-muted-foreground">average cost</div>
                <div className="text-sm text-muted-foreground">per hire (companies)</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Solution Section */}
      <section
        id="how-it-works"
        className="py-24 bg-background section-depth-strong relative overflow-hidden"
      >
        {/* Background decoration with circles */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-20 left-10 w-32 h-32 bg-primary rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 right-10 w-32 h-32 bg-secondary rounded-full blur-3xl animate-pulse animation-delay-2000"></div>
          <div className="absolute top-1/2 left-20 w-24 h-24 bg-accent rounded-full blur-2xl animate-pulse animation-delay-1000"></div>
          <div className="absolute bottom-1/3 right-20 w-40 h-40 bg-primary/50 rounded-full blur-3xl animate-pulse animation-delay-3000"></div>
          <div className="absolute top-1/4 right-1/4 w-16 h-16 bg-secondary/50 rounded-full blur-xl animate-pulse animation-delay-500"></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center mb-20">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-6">
              <span className="w-2 h-2 bg-primary rounded-full animate-pulse"></span>
              The Solution
            </div>
            <h2
              className={`text-4xl sm:text-5xl font-bold text-foreground ${playfair.className}`}
            >
              Three Simple Steps to
              <span className="block text-primary">Job Search Success</span>
            </h2>
            <p className="mt-6 text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Our intelligent platform transforms how you approach job hunting, giving you the competitive advantage you deserve.
            </p>
          </div>

          {/* Step 1 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center mb-24">
            <div className="order-2 lg:order-1">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-primary to-primary/80 rounded-2xl flex items-center justify-center shadow-lg">
                  <span className="text-2xl font-bold text-white">1</span>
                </div>
                <div>
                  <h3 className={`text-2xl font-bold text-foreground ${playfair.className}`}>
                    Install & Activate
                  </h3>
                  <p className="text-muted-foreground">One-click setup across all job sites</p>
                </div>
              </div>

              <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
                Add our lightweight Chrome extension in seconds. It works seamlessly with LinkedIn, Indeed, Glassdoor, and 50+ other major job platforms.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="flex items-center gap-3 p-4 bg-primary/5 rounded-xl border border-primary/20">
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                    <span className="text-primary font-bold">⚡</span>
                  </div>
                  <div>
                    <div className="font-semibold text-foreground">Instant Setup</div>
                    <div className="text-sm text-muted-foreground">2-minute installation</div>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-4 bg-secondary/5 rounded-xl border border-secondary/20">
                  <div className="w-10 h-10 bg-secondary/10 rounded-full flex items-center justify-center">
                    <span className="text-secondary font-bold">🔒</span>
                  </div>
                  <div>
                    <div className="font-semibold text-foreground">Privacy First</div>
                    <div className="text-sm text-muted-foreground">Your data stays secure</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="order-1 lg:order-2">
              <Card className="bg-gradient-to-br from-primary/5 to-secondary/5 border-0 shadow-2xl overflow-hidden">
                <CardContent className="p-8">
                  <div className="text-center">
                    <div className="w-20 h-20 bg-gradient-to-br from-primary to-primary/80 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                      <span className="text-3xl">🧩</span>
                    </div>
                    <h4 className="text-xl font-bold text-foreground mb-4">Extension Active</h4>
                    <Button className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-white shadow-lg">
                      <Eye className="h-4 w-4 mr-2" />
                      Check Sponsored Jobs
                    </Button>
                    <div className="mt-4 flex items-center justify-center gap-2">
                      <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                      <span className="text-sm text-primary font-medium">Ready to scan</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Step 2 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center mb-24">
            <div className="order-2 lg:order-2">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-secondary to-secondary/80 rounded-2xl flex items-center justify-center shadow-lg">
                  <span className="text-2xl font-bold text-white">2</span>
                </div>
                <div>
                  <h3 className={`text-2xl font-bold text-foreground ${playfair.className}`}>
                    Reveal Hidden Opportunities
                  </h3>
                  <p className="text-muted-foreground">See which companies are serious about hiring</p>
                </div>
              </div>

              <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
                Click once to instantly highlight sponsored jobs with color-coded badges. See which companies are investing real money in hiring vs. just posting requirements.
              </p>

              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 bg-destructive/10 rounded-full flex items-center justify-center">
                    <span className="text-destructive font-bold text-sm">🔴</span>
                  </div>
                  <span className="text-muted-foreground">Sponsored positions (high priority)</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 bg-secondary/10 rounded-full flex items-center justify-center">
                    <span className="text-secondary font-bold text-sm">🟡</span>
                  </div>
                  <span className="text-muted-foreground">Promoted listings (medium priority)</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center">
                    <span className="text-primary font-bold text-sm">🟢</span>
                  </div>
                  <span className="text-muted-foreground">Featured opportunities (top priority)</span>
                </div>
              </div>
            </div>

            <div className="order-1 lg:order-1">
              <Card className="bg-gradient-to-br from-secondary/5 to-accent/5 border-0 shadow-2xl overflow-hidden">
                <CardContent className="p-8">
                  <div className="space-y-6">
                    {/* Sponsored job example */}
                    <div className="relative bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-destructive/20 shadow-lg">
                      <div className="absolute -top-2 -right-2 bg-destructive text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg">
                        SPONSORED
                      </div>
                      <div className="space-y-3">
                        <h4 className="font-bold text-lg text-foreground">Senior Software Engineer</h4>
                        <p className="text-muted-foreground">Google • Mountain View, CA</p>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>💰 $150k - $220k</span>
                          <span>🏠 Remote OK</span>
                          <span>📅 Posted 2 days ago</span>
                        </div>
                      </div>
                    </div>

                    {/* Promoted job example */}
                    <div className="relative bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-secondary/20 shadow-lg">
                      <div className="absolute -top-2 -right-2 bg-secondary text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg">
                        PROMOTED
                      </div>
                      <div className="space-y-3">
                        <h4 className="font-bold text-lg text-foreground">Product Manager</h4>
                        <p className="text-muted-foreground">Microsoft • Seattle, WA</p>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>💰 $120k - $180k</span>
                          <span>🏢 Hybrid</span>
                          <span>📅 Posted 1 week ago</span>
                        </div>
                      </div>
                    </div>

                    {/* Regular job example */}
                    <div className="bg-white/60 backdrop-blur-sm rounded-xl p-6 border border-border/20">
                      <div className="space-y-3">
                        <h4 className="font-medium text-foreground">Data Scientist</h4>
                        <p className="text-muted-foreground">StartupCorp • San Francisco, CA</p>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>💰 $90k - $130k</span>
                          <span>🏢 On-site</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Step 3 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="order-2 lg:order-1">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-primary to-primary/80 rounded-2xl flex items-center justify-center shadow-lg">
                  <span className="text-2xl font-bold text-white">3</span>
                </div>
                <div>
                  <h3 className={`text-2xl font-bold text-foreground ${playfair.className}`}>
                    Track & Organize
                  </h3>
                  <p className="text-muted-foreground">Never lose track of your applications</p>
                </div>
              </div>

              <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
                Automatically sync discovered jobs to your personal dashboard. Track every application, interview, and follow-up in one centralized location.
              </p>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-secondary/10 rounded-full flex items-center justify-center">
                      <span className="text-secondary font-bold">📋</span>
                    </div>
                    <div>
                      <div className="font-semibold text-foreground">Smart Sync</div>
                      <div className="text-sm text-muted-foreground">Auto-import jobs</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                      <span className="text-primary font-bold">📊</span>
                    </div>
                    <div>
                      <div className="font-semibold text-foreground">Analytics</div>
                      <div className="text-sm text-muted-foreground">Track progress</div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-accent/10 rounded-full flex items-center justify-center">
                      <span className="text-accent-foreground font-bold">📅</span>
                    </div>
                    <div>
                      <div className="font-semibold text-foreground">Scheduling</div>
                      <div className="text-sm text-muted-foreground">Interview tracking</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-secondary/10 rounded-full flex items-center justify-center">
                      <span className="text-secondary font-bold">🔄</span>
                    </div>
                    <div>
                      <div className="font-semibold text-foreground">Reminders</div>
                      <div className="text-sm text-muted-foreground">Follow-up alerts</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="order-1 lg:order-2">
              <Card className="bg-gradient-to-br from-primary/5 to-secondary/5 border-0 shadow-2xl overflow-hidden">
                <CardHeader className="pb-6">
                  <CardTitle className={`${playfair.className} text-center text-2xl`}>
                    Your Job Search Dashboard
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 text-center border border-secondary/20">
                      <div className="text-2xl font-bold text-secondary">12</div>
                      <div className="text-sm text-muted-foreground">Interested</div>
                    </div>
                    <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 text-center border border-accent/20">
                      <div className="text-2xl font-bold text-accent-foreground">8</div>
                      <div className="text-sm text-muted-foreground">Applied</div>
                    </div>
                    <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 text-center border border-accent/20">
                      <div className="text-2xl font-bold text-accent-foreground">3</div>
                      <div className="text-sm text-muted-foreground">Interviewing</div>
                    </div>
                    <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 text-center border border-primary/20">
                      <div className="text-2xl font-bold text-primary">1</div>
                      <div className="text-sm text-muted-foreground">Offered</div>
                    </div>
                  </div>

                  <div className="bg-white/60 backdrop-blur-sm rounded-xl p-6 border border-primary/20">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                        <CheckCircle className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <div className="font-semibold text-foreground">Application Submitted</div>
                        <div className="text-sm text-muted-foreground">Senior Software Engineer at Google</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span>📅 Interview scheduled for Friday</span>
                      <span className="text-primary">•</span>
                      <span>High priority</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 bg-muted/20 section-depth-strong">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <div className="inline-flex items-center gap-2 bg-secondary/10 text-secondary px-4 py-2 rounded-full text-sm font-medium mb-6">
              <span className="w-2 h-2 bg-secondary rounded-full animate-pulse"></span>
              Powerful Features
            </div>
            <h2
              className={`text-4xl sm:text-5xl font-bold text-foreground ${playfair.className}`}
            >
              Everything You Need to
              <span className="block text-secondary">Dominate Your Job Search</span>
            </h2>
            <p className="mt-6 text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Built by job seekers, for job seekers. Every feature is designed to give you the competitive edge in today&apos;s job market.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <Card className="group relative overflow-hidden bg-gradient-to-br from-primary/5 to-secondary/5 border-0 hover:shadow-2xl transition-all duration-500 hover:-translate-y-3">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <CardHeader className="relative">
                <div className="w-20 h-20 bg-gradient-to-br from-primary/10 to-primary/20 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-110">
                  <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
                    <Target className="h-6 w-6 text-white" />
                  </div>
                </div>
                <CardTitle className={`text-xl font-bold text-center group-hover:text-primary transition-colors ${playfair.className}`}>
                  Smart Company Detection
                </CardTitle>
              </CardHeader>
              <CardContent className="relative">
                <p className="text-muted-foreground text-center leading-relaxed mb-4">
                  Our AI algorithm identifies sponsored companies across 50+ job sites with advanced fuzzy matching and company alias support.
                </p>
                <div className="flex items-center justify-center gap-2">
                  <Badge variant="secondary" className="bg-primary/10 text-primary">
                    AI-Powered
                  </Badge>
                  <Badge variant="secondary" className="bg-secondary/10 text-secondary">
                    50+ Sites
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Feature 2 */}
            <Card className="group relative overflow-hidden bg-gradient-to-br from-primary/5 to-accent/5 border-0 hover:shadow-2xl transition-all duration-500 hover:-translate-y-3">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <CardHeader className="relative">
                <div className="w-20 h-20 bg-gradient-to-br from-primary/10 to-primary/20 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-110">
                  <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
                    <TrendingUp className="h-6 w-6 text-white" />
                  </div>
                </div>
                <CardTitle className={`text-xl font-bold text-center group-hover:text-primary transition-colors ${playfair.className}`}>
                  Advanced Analytics
                </CardTitle>
              </CardHeader>
              <CardContent className="relative">
                <p className="text-muted-foreground text-center leading-relaxed mb-4">
                  Track your application success rates, response times, and identify which companies and roles are most responsive to your applications.
                </p>
                <div className="flex items-center justify-center gap-2">
                  <Badge variant="secondary" className="bg-primary/10 text-primary">
                    Success Tracking
                  </Badge>
                  <Badge variant="secondary" className="bg-accent/10 text-accent-foreground">
                    Insights
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Feature 3 */}
            <Card className="group relative overflow-hidden bg-gradient-to-br from-accent/5 to-secondary/5 border-0 hover:shadow-2xl transition-all duration-500 hover:-translate-y-3">
              <div className="absolute inset-0 bg-gradient-to-br from-accent/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <CardHeader className="relative">
                <div className="w-20 h-20 bg-gradient-to-br from-accent/10 to-accent/20 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-110">
                  <div className="w-10 h-10 bg-accent-foreground rounded-xl flex items-center justify-center">
                    <Sparkles className="h-6 w-6 text-white" />
                  </div>
                </div>
                <CardTitle className={`text-xl font-bold text-center group-hover:text-accent-foreground transition-colors ${playfair.className}`}>
                  Real-time Sync
                </CardTitle>
              </CardHeader>
              <CardContent className="relative">
                <p className="text-muted-foreground text-center leading-relaxed mb-4">
                  Your data syncs instantly across all devices. Access your complete job search history from desktop, mobile, or tablet.
                </p>
                <div className="flex items-center justify-center gap-2">
                  <Badge variant="secondary" className="bg-accent/10 text-accent-foreground">
                    Cross-Platform
                  </Badge>
                  <Badge variant="secondary" className="bg-secondary/10 text-secondary">
                    Instant Sync
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Feature 4 */}
            <Card className="group relative overflow-hidden bg-gradient-to-br from-secondary/5 to-accent/5 border-0 hover:shadow-2xl transition-all duration-500 hover:-translate-y-3">
              <div className="absolute inset-0 bg-gradient-to-br from-secondary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <CardHeader className="relative">
                <div className="w-20 h-20 bg-gradient-to-br from-secondary/10 to-secondary/20 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-110">
                  <div className="w-10 h-10 bg-secondary rounded-xl flex items-center justify-center">
                    <Users className="h-6 w-6 text-white" />
                  </div>
                </div>
                <CardTitle className={`text-xl font-bold text-center group-hover:text-secondary transition-colors ${playfair.className}`}>
                  Company Intelligence
                </CardTitle>
              </CardHeader>
              <CardContent className="relative">
                <p className="text-muted-foreground text-center leading-relaxed mb-4">
                  Learn which companies are actively investing in hiring. Identify patterns and prioritize applications to companies with high hiring intent.
                </p>
                <div className="flex items-center justify-center gap-2">
                  <Badge variant="secondary" className="bg-secondary/10 text-secondary">
                    Hiring Patterns
                  </Badge>
                  <Badge variant="secondary" className="bg-destructive/10 text-destructive">
                    Priority Scoring
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Feature 5 */}
            <Card className="group relative overflow-hidden bg-gradient-to-br from-accent/5 to-primary/5 border-0 hover:shadow-2xl transition-all duration-500 hover:-translate-y-3">
              <div className="absolute inset-0 bg-gradient-to-br from-accent/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <CardHeader className="relative">
                <div className="w-20 h-20 bg-gradient-to-br from-accent/10 to-accent/20 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-110">
                  <div className="w-10 h-10 bg-accent-foreground rounded-xl flex items-center justify-center">
                    <Shield className="h-6 w-6 text-white" />
                  </div>
                </div>
                <CardTitle className={`text-xl font-bold text-center group-hover:text-accent-foreground transition-colors ${playfair.className}`}>
                  Privacy First
                </CardTitle>
              </CardHeader>
              <CardContent className="relative">
                <p className="text-muted-foreground text-center leading-relaxed mb-4">
                  Your job search data is encrypted and private. We never share your information with employers, recruiters, or third parties.
                </p>
                <div className="flex items-center justify-center gap-2">
                  <Badge variant="secondary" className="bg-accent/10 text-accent-foreground">
                    End-to-End Encrypted
                  </Badge>
                  <Badge variant="secondary" className="bg-primary/10 text-primary">
                    GDPR Compliant
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Feature 6 */}
            <Card className="group relative overflow-hidden bg-gradient-to-br from-secondary/5 to-accent/5 border-0 hover:shadow-2xl transition-all duration-500 hover:-translate-y-3">
              <div className="absolute inset-0 bg-gradient-to-br from-secondary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <CardHeader className="relative">
                <div className="w-20 h-20 bg-gradient-to-br from-secondary/10 to-secondary/20 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-110">
                  <div className="w-10 h-10 bg-secondary rounded-xl flex items-center justify-center">
                    <Zap className="h-6 w-6 text-white" />
                  </div>
                </div>
                <CardTitle className={`text-xl font-bold text-center group-hover:text-secondary transition-colors ${playfair.className}`}>
                  Lightning Fast
                </CardTitle>
              </CardHeader>
              <CardContent className="relative">
                <p className="text-muted-foreground text-center leading-relaxed mb-4">
                  Ultra-lightweight extension that doesn&apos;t slow down your browsing. Get instant insights with zero performance impact.
                </p>
                <div className="flex items-center justify-center gap-2">
                  <Badge variant="secondary" className="bg-secondary/10 text-secondary">
                    Zero Lag
                  </Badge>
                  <Badge variant="secondary" className="bg-accent/10 text-accent-foreground">
                    Instant Results
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Additional features showcase */}
          <div className="mt-20 grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-primary to-secondary rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                <span className="text-2xl text-white">🚀</span>
              </div>
              <h3 className={`text-xl font-bold text-foreground mb-2 ${playfair.className}`}>Quick Setup</h3>
              <p className="text-muted-foreground">Install in seconds, start using immediately</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-primary to-accent-foreground rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                <span className="text-2xl text-white">📱</span>
              </div>
              <h3 className={`text-xl font-bold text-foreground mb-2 ${playfair.className}`}>Mobile Ready</h3>
              <p className="text-muted-foreground">Access your dashboard from any device</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-secondary to-destructive rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                <span className="text-2xl text-white">🔄</span>
              </div>
              <h3 className={`text-xl font-bold text-foreground mb-2 ${playfair.className}`}>Auto Updates</h3>
              <p className="text-muted-foreground">Always stays current with latest job sites</p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <FAQSection />

      {/* Testimonials Section */}
      <section id="testimonials" className="py-24 bg-gradient-to-br from-background to-muted/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-accent/10 text-accent-foreground px-4 py-2 rounded-full text-sm font-medium mb-6">
              <span className="w-2 h-2 bg-accent-foreground rounded-full animate-pulse"></span>
              Success Stories
            </div>
            <h2
              className={`text-4xl sm:text-5xl font-bold text-foreground ${playfair.className}`}
            >
              Join <span className="text-accent-foreground">10,000+</span> Job Seekers
              <span className="block text-primary">Who Found Their Dream Jobs</span>
            </h2>
            <p className="mt-6 text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Real stories from real people who transformed their job search with HireAll
            </p>
          </div>
        </div>
        <TestimonialSection />
      </section>

      {/* Final CTA Section */}
      <section className="py-24 bg-gradient-to-br from-primary to-green-600 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-32 h-32 bg-white rounded-full blur-3xl"></div>
          <div className="absolute bottom-10 right-10 w-32 h-32 bg-white rounded-full blur-3xl"></div>
        </div>

        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8 relative">
          <div className="mb-8">
            <div className="inline-flex items-center gap-2 bg-white/20 text-white px-6 py-3 rounded-full text-sm font-medium mb-8 backdrop-blur-sm">
              <span className="w-2 h-2 bg-primary rounded-full animate-pulse"></span>
              Limited Time: Free Premium Features
            </div>

            <h2
              className={`text-4xl sm:text-5xl md:text-6xl font-bold text-white mb-6 ${playfair.className}`}
            >
              Stop Wasting Time on
              <span className="block text-yellow-300">Dead-End Applications</span>
            </h2>

            <p className="text-xl sm:text-2xl text-white/90 max-w-3xl mx-auto leading-relaxed mb-8">
              Join thousands of successful job seekers who are landing interviews 3x faster with HireAll&apos;s sponsored job intelligence.
            </p>
          </div>

          {/* Social proof numbers */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 mb-12">
            <div className="text-center">
              <div className="text-4xl sm:text-5xl font-bold text-primary mb-2">95%</div>
              <div className="text-white/80 text-sm">More interview responses</div>
            </div>
            <div className="text-center">
              <div className="text-4xl sm:text-5xl font-bold text-primary mb-2">3x</div>
              <div className="text-white/80 text-sm">Faster job applications</div>
            </div>
            <div className="text-center">
              <div className="text-4xl sm:text-5xl font-bold text-primary mb-2">50+</div>
              <div className="text-white/80 text-sm">Supported job sites</div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-8">
            {userId ? (
              <Button
                asChild
                size="lg"
                className="text-xl px-12 py-8 bg-white text-primary hover:bg-gray-100 shadow-2xl transform hover:scale-105 transition-all duration-300"
              >
                <Link href="/dashboard" className="flex items-center gap-3">
                  <Sparkles className="h-6 w-6" />
                  Go to Dashboard
                  <ArrowRight className="h-5 w-5" />
                </Link>
              </Button>
            ) : (
              <>
                <Button
                  asChild
                  size="lg"
                  className="text-xl px-12 py-8 bg-white text-primary hover:bg-gray-100 shadow-2xl transform hover:scale-105 transition-all duration-300"
                >
                  <Link href="/sign-up" className="flex items-center gap-3">
                    <Sparkles className="h-6 w-6" />
                    Start Free Today
                    <ArrowRight className="h-5 w-5" />
                  </Link>
                </Button>
              </>
            )}
          </div>

          {/* Trust indicators */}
          <div className="flex flex-wrap items-center justify-center gap-6 text-white/80 text-sm">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-primary" />
              <span>Chrome extension included</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-primary" />
              <span>Setup in 2 minutes</span>
            </div>
          </div>

          {/* Urgency indicator */}
          <div className="mt-8 p-4 bg-destructive/20 backdrop-blur-sm rounded-xl border border-destructive/30">
            <p className="text-white text-sm">
              🚨 <strong>Limited Time:</strong> Premium features free for first 30 days • No commitment required
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
