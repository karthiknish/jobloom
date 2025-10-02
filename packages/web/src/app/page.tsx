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
import TestimonialSection from "@/components/custom/TestimonialSection";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Zap, Shield, Users, TrendingUp, CheckCircle, Sparkles, Target, Eye, List, BarChart3, Calendar } from "lucide-react";

export default async function Home() {
  // TODO: Replace with Firebase server-side auth if needed. For now assume logged-out.
  const userId = null as string | null;

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-background/80 backdrop-blur-sm pt-16">
        {/* Subtle background elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 right-20 w-64 h-64 bg-primary/5 rounded-full filter blur-3xl"></div>
          <div className="absolute bottom-20 left-20 w-48 h-48 bg-secondary/5 rounded-full filter blur-2xl"></div>
        </div>

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32">
          <div className="text-center space-y-8">

            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-foreground leading-tight font-playfair">
              Never Miss a
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">
                Sponsored Opportunity
              </span>
              Again
            </h1>

            <p className="max-w-3xl mx-auto text-xl text-muted-foreground leading-relaxed font-medium px-4">
              Discover exactly which companies are investing thousands in hiring. Our AI-powered platform reveals sponsored jobs across all major job sites.
            </p>

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-4xl mx-auto px-4">
              <div className="bg-card/60 backdrop-blur-sm rounded-2xl p-6 border border-border shadow-sm hover:shadow-md transition-shadow">
                <div className="text-3xl font-bold text-primary mb-1">95%</div>
                <div className="text-sm text-muted-foreground font-medium">More Responses</div>
              </div>
              <div className="bg-card/60 backdrop-blur-sm rounded-2xl p-6 border border-border shadow-sm hover:shadow-md transition-shadow">
                <div className="text-3xl font-bold text-secondary mb-1">3x</div>
                <div className="text-sm text-muted-foreground font-medium">Faster Applications</div>
              </div>
              <div className="bg-card/60 backdrop-blur-sm rounded-2xl p-6 border border-border shadow-sm hover:shadow-md transition-shadow">
                <div className="text-3xl font-bold text-accent-foreground mb-1">100%</div>
                <div className="text-sm text-muted-foreground font-medium">Privacy Protected</div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center px-4">
              {userId ? (
                <Button asChild size="lg" className="text-lg px-8 py-4 bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-primary-foreground font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all w-full sm:w-auto">
                  <Link href="/dashboard" className="flex items-center gap-3">
                    Go to Dashboard
                    <ArrowRight className="h-5 w-5" />
                  </Link>
                </Button>
              ) : (
                <>
                  <Button asChild size="lg" className="text-lg px-8 py-4 bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-primary-foreground font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all w-full sm:w-auto">
                    <Link href="/sign-up" className="flex items-center gap-3">
                      <Sparkles className="h-5 w-5" />
                      Start Free Today
                    </Link>
                  </Button>
                  <Button
                    asChild
                    size="lg"
                    variant="outline"
                    className="text-lg px-8 py-4 border-2 border-border hover:border-primary hover:bg-primary/10 text-foreground hover:text-primary font-semibold rounded-xl transition-all w-full sm:w-auto"
                  >
                    <a href="#how-it-works" className="flex items-center gap-3">
                      <Eye className="h-5 w-5" />
                      See How It Works
                    </a>
                  </Button>
                </>
              )}
            </div>

            <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-secondary" />
                <span>Chrome extension included</span>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile CTA */}
        <div className="fixed bottom-6 right-6 md:hidden z-50">
          <Button
            asChild
            size="lg"
            className="rounded-full w-14 h-14 bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 shadow-xl"
          >
            <Link href="/sign-up">
              <Sparkles className="h-5 w-5" />
            </Link>
          </Button>
        </div>
      </section>

      {/* Problem Section */}
      <section className="py-20 bg-muted/30 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-destructive/10 text-destructive px-4 py-2 rounded-full text-sm font-semibold mb-6">
              <span className="w-2 h-2 bg-destructive rounded-full animate-pulse"></span>
              The Problem
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-foreground font-playfair mb-6">
              You&apos;re Missing Out on the
              <span className="block text-destructive">Best Opportunities</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Companies spend thousands promoting jobs, but you can&apos;t tell which opportunities are real priorities. This information gap costs you time and opportunities.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            <div className="bg-card/80 rounded-2xl p-8 border border-border shadow-sm hover:shadow-md transition-all">
              <div className="w-16 h-16 bg-destructive/10 rounded-2xl flex items-center justify-center mb-6 mx-auto">
                <span className="text-2xl font-bold text-destructive">?</span>
              </div>
              <h3 className="text-xl font-semibold text-foreground text-center mb-4">Invisible Sponsorships</h3>
              <p className="text-muted-foreground text-center leading-relaxed">
                Sponsored jobs look identical to regular listings. You can't tell which companies are actually investing in hiring.
              </p>
            </div>

            <div className="bg-card/80 rounded-2xl p-8 border border-border shadow-sm hover:shadow-md transition-all">
              <div className="w-16 h-16 bg-secondary/10 rounded-2xl flex items-center justify-center mb-6 mx-auto">
                <span className="text-2xl font-bold text-secondary">!</span>
              </div>
              <h3 className="text-xl font-semibold text-foreground text-center mb-4">Scattered Applications</h3>
              <p className="text-muted-foreground text-center leading-relaxed">
                Your job search is fragmented across platforms with no central place to track applications and follow-ups.
              </p>
            </div>

            <div className="bg-card/80 rounded-2xl p-8 border border-border shadow-sm hover:shadow-md transition-all">
              <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-6 mx-auto">
                <TrendingUp className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-foreground text-center mb-4">Wasted Time & Energy</h3>
              <p className="text-muted-foreground text-center leading-relaxed">
                Hours spent applying to jobs without knowing which companies are serious about hiring.
              </p>
            </div>
          </div>

          {/* Stats */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-8 bg-slate-50 rounded-2xl p-8 border border-slate-200/50">
            <div className="text-center">
              <div className="text-4xl font-bold text-red-600 mb-1">78%</div>
              <div className="text-sm text-slate-600">applications get no response</div>
            </div>
            <div className="hidden sm:block w-px h-16 bg-slate-300"></div>
            <div className="text-center">
              <div className="text-4xl font-bold text-amber-600 mb-1">6-8</div>
              <div className="text-sm text-slate-600">hours wasted per week</div>
            </div>
            <div className="hidden sm:block w-px h-16 bg-slate-300"></div>
            <div className="text-center">
              <div className="text-4xl font-bold text-blue-600 mb-1">$2,500+</div>
              <div className="text-sm text-slate-600">average cost per hire</div>
            </div>
          </div>
        </div>
      </section>

      {/* Solution Section */}
      <section id="how-it-works" className="py-20 bg-gradient-to-br from-blue-50 to-teal-50/30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-600 px-4 py-2 rounded-full text-sm font-semibold mb-6">
              <span className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></span>
              The Solution
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 font-playfair mb-6">
              Three Simple Steps to
              <span className="block text-blue-600">Job Search Success</span>
            </h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
              Our intelligent platform transforms how you approach job hunting, giving you the competitive advantage you deserve.
            </p>
          </div>

          {/* Simple 3-step process */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto shadow-lg">
                <span className="text-2xl font-bold text-white">1</span>
              </div>
              <h3 className="text-xl font-semibold text-slate-900">Install Extension</h3>
              <p className="text-slate-600 leading-relaxed">
                Add our lightweight Chrome extension in seconds. Works with LinkedIn, Indeed, and 50+ job sites.
              </p>
            </div>

            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-gradient-to-br from-teal-500 to-teal-600 rounded-2xl flex items-center justify-center mx-auto shadow-lg">
                <span className="text-2xl font-bold text-white">2</span>
              </div>
              <h3 className="text-xl font-semibold text-slate-900">Spot Sponsored Jobs</h3>
              <p className="text-slate-600 leading-relaxed">
                Instantly see which companies are investing in hiring with color-coded badges on job listings.
              </p>
            </div>

            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto shadow-lg">
                <span className="text-2xl font-bold text-white">3</span>
              </div>
              <h3 className="text-xl font-semibold text-slate-900">Track Applications</h3>
              <p className="text-slate-600 leading-relaxed">
                Sync jobs to your dashboard and track every application, interview, and follow-up in one place.
              </p>
            </div>
          </div>

          {/* CTA */}
          <div className="text-center">
            <Button asChild size="lg" className="text-lg px-8 py-4 bg-gradient-to-r from-blue-600 to-teal-600 hover:from-blue-700 hover:to-teal-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all">
              <Link href="/sign-up" className="flex items-center gap-3">
                <Target className="h-5 w-5" />
                Start Finding Better Jobs
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-white/50 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-teal-50 text-teal-600 px-4 py-2 rounded-full text-sm font-semibold mb-6">
              <span className="w-2 h-2 bg-teal-600 rounded-full animate-pulse"></span>
              Key Features
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 font-playfair mb-6">
              Everything You Need to
              <span className="block text-teal-600">Win Your Job Search</span>
            </h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
              Built by job seekers, for job seekers. Every feature gives you a competitive edge.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
            <div className="bg-white/80 rounded-2xl p-8 border border-slate-200/50 shadow-sm hover:shadow-md transition-all text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mb-6 mx-auto">
                <Target className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-4">Smart Detection</h3>
              <p className="text-slate-600 leading-relaxed">
                AI-powered identification of sponsored companies across 50+ job sites.
              </p>
            </div>

            <div className="bg-white/80 rounded-2xl p-8 border border-slate-200/50 shadow-sm hover:shadow-md transition-all text-center">
              <div className="w-16 h-16 bg-teal-100 rounded-2xl flex items-center justify-center mb-6 mx-auto">
                <TrendingUp className="h-8 w-8 text-teal-600" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-4">Analytics</h3>
              <p className="text-slate-600 leading-relaxed">
                Track response rates and identify which companies are most responsive.
              </p>
            </div>

            <div className="bg-white/80 rounded-2xl p-8 border border-slate-200/50 shadow-sm hover:shadow-md transition-all text-center">
              <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center mb-6 mx-auto">
                <Sparkles className="h-8 w-8 text-emerald-600" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-4">Real-time Sync</h3>
              <p className="text-slate-600 leading-relaxed">
                Instant data sync across all devices. Access your history anywhere.
              </p>
            </div>

            <div className="bg-white/80 rounded-2xl p-8 border border-slate-200/50 shadow-sm hover:shadow-md transition-all text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center mb-6 mx-auto">
                <Users className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-4">Company Intelligence</h3>
              <p className="text-slate-600 leading-relaxed">
                Learn which companies are actively investing in hiring opportunities.
              </p>
            </div>

            <div className="bg-white/80 rounded-2xl p-8 border border-slate-200/50 shadow-sm hover:shadow-md transition-all text-center">
              <div className="w-16 h-16 bg-amber-100 rounded-2xl flex items-center justify-center mb-6 mx-auto">
                <Shield className="h-8 w-8 text-amber-600" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-4">Privacy First</h3>
              <p className="text-slate-600 leading-relaxed">
                Your data is encrypted and private. We never share with third parties.
              </p>
            </div>

            <div className="bg-white/80 rounded-2xl p-8 border border-slate-200/50 shadow-sm hover:shadow-md transition-all text-center">
              <div className="w-16 h-16 bg-rose-100 rounded-2xl flex items-center justify-center mb-6 mx-auto">
                <Zap className="h-8 w-8 text-rose-600" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-4">Lightning Fast</h3>
              <p className="text-slate-600 leading-relaxed">
                Ultra-lightweight extension with zero performance impact.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <FAQSection />

      {/* Testimonials Section */}
      <section id="testimonials" className="py-20 bg-white/50 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-purple-50 text-purple-600 px-4 py-2 rounded-full text-sm font-medium mb-6">
              <span className="w-2 h-2 bg-purple-600 rounded-full animate-pulse"></span>
              Success Stories
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 font-playfair mb-6">
              Join <span className="text-purple-600">10,000+</span> Job Seekers
            </h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
              Real stories from people who transformed their job search with HireAll
            </p>
          </div>
        </div>
        <TestimonialSection />
      </section>

      {/* Final CTA Section */}
      <section className="py-20 bg-gradient-to-br from-blue-600 to-teal-600 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-32 h-32 bg-white rounded-full blur-3xl"></div>
          <div className="absolute bottom-10 right-10 w-32 h-32 bg-white rounded-full blur-3xl"></div>
        </div>

        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8 relative">
          <div className="mb-8">
            <div className="inline-flex items-center gap-2 bg-white/20 text-white px-6 py-3 rounded-full text-sm font-semibold mb-8 backdrop-blur-sm">
              <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
              Start Free Today
            </div>

            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 font-playfair">
              Stop Wasting Time on
              <span className="block text-yellow-300">Dead-End Applications</span>
            </h2>

            <p className="text-xl text-white/90 max-w-3xl mx-auto leading-relaxed mb-12">
              Join thousands landing interviews 3x faster with sponsored job intelligence.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-12">
            {userId ? (
              <Button
                asChild
                size="lg"
                className="text-xl px-8 py-4 bg-white text-blue-600 hover:bg-gray-50 shadow-2xl font-bold rounded-xl"
              >
                <Link href="/dashboard" className="flex items-center gap-3">
                  <Sparkles className="h-5 w-5" />
                  Go to Dashboard
                  <ArrowRight className="h-5 w-5" />
                </Link>
              </Button>
            ) : (
              <Button
                asChild
                size="lg"
                className="text-xl px-8 py-4 bg-white text-blue-600 hover:bg-gray-50 shadow-2xl font-bold rounded-xl"
              >
                <Link href="/sign-up" className="flex items-center gap-3">
                  <Sparkles className="h-5 w-5" />
                  Start Free Today
                  <ArrowRight className="h-5 w-5" />
                </Link>
              </Button>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 text-white/80 text-sm">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-yellow-300" />
              <span>Chrome extension included</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-yellow-300" />
              <span>Setup in 2 minutes</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
