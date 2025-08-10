import Link from "next/link";
import { SignUpButton } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function Home() {
  const { userId } = await auth();

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary/5 via-white to-secondary/5 overflow-hidden pt-16">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-yellow-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
          <div className="absolute top-40 left-40 w-80 h-80 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32">
          <div className="text-center">
            <h1 className="text-4xl font-extrabold text-gray-900 sm:text-5xl lg:text-6xl animate-fade-in-up">
              Stop Missing
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary animate-gradient">
                Sponsored Job Opportunities
              </span>
            </h1>
            <p className="mt-6 max-w-3xl mx-auto text-xl text-gray-600 leading-relaxed">
              Jobloom reveals which companies are paying to promote their jobs,
              giving you the inside track on who&apos;s actively hiring. Track
              your applications and never lose sight of your job search
              progress.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
              {userId ? (
                <Button asChild size="lg" className="text-lg px-8 py-6">
                  <Link href="/dashboard">Go to Dashboard</Link>
                </Button>
              ) : (
                <>
                  <SignUpButton mode="modal">
                    <Button size="lg" className="text-lg px-8 py-6">
                      Start Free Today
                    </Button>
                  </SignUpButton>
                  <Button
                    asChild
                    size="lg"
                    variant="outline"
                    className="text-lg px-8 py-6"
                  >
                    <a href="#how-it-works">See How It Works</a>
                  </Button>
                </>
              )}
            </div>
            <p className="mt-4 text-sm text-gray-500">
              Free forever • No credit card required • Chrome extension included
            </p>
          </div>
        </div>
      </section>

      {/* Problem Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">
              The Hidden Job Market Problem
            </h2>
            <p className="mt-4 text-xl text-gray-600 max-w-3xl mx-auto">
              Companies pay thousands to promote their job postings, but job
              seekers can&apos;t tell which roles are actively sponsored.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="text-center">
              <CardHeader>
                <div className="bg-red-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">😵‍💫</span>
                </div>
                <CardTitle>Invisible Sponsorships</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Sponsored jobs blend in with organic listings, making it
                  impossible to know which companies are actively hiring.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <div className="bg-yellow-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">📊</span>
                </div>
                <CardTitle>Scattered Applications</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Job applications spread across multiple platforms with no
                  central tracking or status management.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">⏰</span>
                </div>
                <CardTitle>Missed Opportunities</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Without knowing which companies are investing in hiring, you
                  might miss the best opportunities.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Solution Section */}
      <section id="how-it-works" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">
              How Jobloom Works
            </h2>
            <p className="mt-4 text-xl text-gray-600 max-w-3xl mx-auto">
              Our Chrome extension and web platform work together to give you
              unprecedented insight into the job market.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-20">
            <div>
              <div className="bg-primary/10 rounded-full w-12 h-12 flex items-center justify-center mb-4">
                <span className="text-xl font-bold text-primary">1</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                Install the Chrome Extension
              </h3>
              <p className="text-lg text-gray-600 mb-6">
                Add our lightweight Chrome extension that works seamlessly with
                LinkedIn, Indeed, Glassdoor, and other major job sites.
              </p>
              <ul className="space-y-2 text-gray-600">
                <li className="flex items-center">
                  <span className="text-green-500 mr-2">✓</span>
                  Works on all major job sites
                </li>
                <li className="flex items-center">
                  <span className="text-green-500 mr-2">✓</span>
                  Lightweight and fast
                </li>
                <li className="flex items-center">
                  <span className="text-green-500 mr-2">✓</span>
                  Privacy-focused design
                </li>
              </ul>
            </div>
            <div className="bg-gradient-to-br from-primary/5 to-secondary/5 rounded-2xl p-8">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardDescription className="text-sm font-medium text-gray-500">
                    Chrome Extension
                  </CardDescription>
                  <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                    Active
                  </span>
                </CardHeader>
                <CardContent>
                  <Button className="w-full bg-primary hover:bg-primary/90">
                    🎯 Check Sponsored Jobs
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-20">
            <div className="order-2 lg:order-1">
              <Card>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="border-l-4 border-orange-400 bg-orange-50 p-4 rounded-r-lg">
                      <div className="flex items-center">
                        <span className="text-orange-600 mr-2">🎯</span>
                        <span className="font-medium text-gray-900">
                          SPONSORED
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        Senior Software Engineer at Google
                      </p>
                    </div>
                    <div className="border-l-4 border-secondary bg-secondary/10 p-4 rounded-r-lg">
                      <div className="flex items-center">
                        <span className="text-secondary mr-2">🎯</span>
                        <span className="font-medium text-gray-900">
                          PROMOTED
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        Product Manager at Microsoft
                      </p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-600">
                        Data Scientist at StartupCorp
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            <div className="order-1 lg:order-2">
              <div className="bg-orange-100 rounded-full w-12 h-12 flex items-center justify-center mb-4">
                <span className="text-xl font-bold text-orange-600">2</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                Reveal Sponsored Jobs
              </h3>
              <p className="text-lg text-gray-600 mb-6">
                Click one button to instantly highlight which companies are
                paying to promote their jobs. See sponsored, promoted, and
                featured listings at a glance.
              </p>
              <ul className="space-y-2 text-gray-600">
                <li className="flex items-center">
                  <span className="text-green-500 mr-2">✓</span>
                  Color-coded sponsorship types
                </li>
                <li className="flex items-center">
                  <span className="text-green-500 mr-2">✓</span>
                  Company-based detection
                </li>
                <li className="flex items-center">
                  <span className="text-green-500 mr-2">✓</span>
                  Real-time highlighting
                </li>
              </ul>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="bg-green-100 rounded-full w-12 h-12 flex items-center justify-center mb-4">
                <span className="text-xl font-bold text-green-600">3</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                Track Your Applications
              </h3>
              <p className="text-lg text-gray-600 mb-6">
                Automatically sync discovered jobs to your personal dashboard.
                Track application status, interview dates, and follow-ups all in
                one place.
              </p>
              <ul className="space-y-2 text-gray-600">
                <li className="flex items-center">
                  <span className="text-green-500 mr-2">✓</span>
                  Automatic job syncing
                </li>
                <li className="flex items-center">
                  <span className="text-green-500 mr-2">✓</span>
                  Status tracking pipeline
                </li>
                <li className="flex items-center">
                  <span className="text-green-500 mr-2">✓</span>
                  Interview scheduling
                </li>
              </ul>
            </div>
            <div className="bg-gradient-to-br from-green-50 to-blue-50 rounded-2xl p-8">
              <Card>
                <CardHeader>
                  <CardTitle>Application Pipeline</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Interested</span>
                      <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                        12
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Applied</span>
                      <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full">
                        8
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">
                        Interviewing
                      </span>
                      <span className="bg-secondary/20 text-secondary text-xs px-2 py-1 rounded-full">
                        3
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Offered</span>
                      <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                        1
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">
              Everything You Need to Land Your Dream Job
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="group hover:shadow-2xl hover:-translate-y-1 transition-all duration-300">
              <CardHeader>
                <div className="bg-primary/10 rounded-lg w-12 h-12 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <span className="text-2xl">🎯</span>
                </div>
                <CardTitle className="group-hover:text-primary transition-colors">
                  Smart Company Detection
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Our algorithm identifies sponsored companies across all major
                  job sites with fuzzy matching and alias support.
                </p>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-2xl hover:-translate-y-1 transition-all duration-300">
              <CardHeader>
                <div className="bg-green-100 rounded-lg w-12 h-12 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <span className="text-2xl">📊</span>
                </div>
                <CardTitle className="group-hover:text-green-600 transition-colors">
                  Application Analytics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Track your job search progress with detailed analytics and
                  insights into your application success rates.
                </p>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-2xl hover:-translate-y-1 transition-all duration-300">
              <CardHeader>
                <div className="bg-secondary/20 rounded-lg w-12 h-12 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <span className="text-2xl">🔄</span>
                </div>
                <CardTitle className="group-hover:text-secondary transition-colors">
                  Real-time Sync
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Your data syncs instantly across all devices. Access your job
                  search from anywhere, anytime.
                </p>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-2xl hover:-translate-y-1 transition-all duration-300">
              <CardHeader>
                <div className="bg-orange-100 rounded-lg w-12 h-12 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <span className="text-2xl">🏢</span>
                </div>
                <CardTitle className="group-hover:text-orange-600 transition-colors">
                  Company Insights
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Learn which companies are actively investing in hiring and
                  prioritize your applications accordingly.
                </p>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-2xl hover:-translate-y-1 transition-all duration-300">
              <CardHeader>
                <div className="bg-blue-100 rounded-lg w-12 h-12 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <span className="text-2xl">🔒</span>
                </div>
                <CardTitle className="group-hover:text-blue-600 transition-colors">
                  Privacy First
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Your job search data is private and secure. We never share
                  your information with employers or third parties.
                </p>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-2xl hover:-translate-y-1 transition-all duration-300">
              <CardHeader>
                <div className="bg-yellow-100 rounded-lg w-12 h-12 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <span className="text-2xl">⚡</span>
                </div>
                <CardTitle className="group-hover:text-yellow-600 transition-colors">
                  Lightning Fast
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Lightweight extension that doesn&apos;t slow down your
                  browsing. Get insights instantly with one click.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">
              Frequently Asked Questions
            </h2>
            <p className="mt-4 text-xl text-gray-600">
              Everything you need to know about Jobloom
            </p>
          </div>

          <div className="space-y-8">
            <Card className="hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle>How does Jobloom detect sponsored jobs?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Our Chrome extension uses advanced algorithms to identify when
                  companies are paying to promote their job listings across
                  LinkedIn, Indeed, Glassdoor, and other major job sites. We
                  analyze various signals including placement, labels, and
                  company patterns.
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle>Is Jobloom free to use?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Yes! Jobloom offers a generous free tier that includes
                  sponsored job detection, basic application tracking, and the
                  Chrome extension. Premium features like advanced analytics and
                  unlimited CV evaluations are available in our paid plans.
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle>Which job sites does Jobloom work with?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Jobloom currently supports LinkedIn, Indeed, Glassdoor,
                  ZipRecruiter, and Monster. We&apos;re constantly adding
                  support for more job sites based on user feedback. The
                  extension automatically activates when you visit supported
                  sites.
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle>Is my job search data private?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Absolutely. We take privacy seriously. Your job search data is
                  encrypted and stored securely. We never share your information
                  with employers or third parties. You have full control over
                  your data and can delete it at any time.
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle>
                  How accurate is the sponsored job detection?
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Our detection algorithm has over 95% accuracy in identifying
                  sponsored listings. We continuously improve our detection
                  methods and update the extension regularly to maintain high
                  accuracy across all supported job sites.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}

      {/* CTA Section */}
      <section className="py-20 bg-secondary">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-800 sm:text-4xl">
            Ready to Supercharge Your Job Search?
          </h2>
          <p className="mt-4 text-xl text-gray-800">
            Join thousands of job seekers who are already using Jobloom to land
            better opportunities faster.
          </p>
          <div className="mt-8">
            {userId ? (
              <Button
                asChild
                size="lg"
                className="text-lg px-8 py-6 bg-white text-primary hover:bg-gray-100"
              >
                <Link href="/dashboard">Go to Dashboard</Link>
              </Button>
            ) : (
              <SignUpButton mode="modal">
                <Button
                  size="lg"
                  className="text-lg px-8 py-6 bg-white text-primary hover:bg-gray-100"
                >
                  Start Free Today
                </Button>
              </SignUpButton>
            )}
          </div>
          <p className="mt-4 text-sm text-gray-500  ">
            No credit card required • Free forever • 2-minute setup
          </p>
        </div>
      </section>
    </div>
  );
}
