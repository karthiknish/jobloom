"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Search,
  Building,
  MapPin,
  Users,
  DollarSign,
  Star,
  TrendingUp,
  Globe,
  Calendar,
  Award,
  AlertTriangle,
  CheckCircle,
  XCircle,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { useFirebaseAuth } from "@/providers/firebase-auth-provider";
import { FeatureGate } from "@/components/UpgradePrompt";

// Mock company data
const companyData = {
  "TechCorp Inc.": {
    overview: {
      industry: "Technology",
      size: "500-1000 employees",
      founded: 2015,
      headquarters: "San Francisco, CA",
      website: "https://techcorp.com",
      description: "Leading technology company focused on AI and machine learning solutions.",
    },
    culture: {
      rating: 4.2,
      reviews: 847,
      workLifeBalance: 4.1,
      cultureValues: 4.3,
      careerOpportunities: 4.0,
      compensation: 4.2,
      management: 3.9,
    },
    reviews: [
      {
        id: "1",
        rating: 5,
        title: "Great place to grow",
        content: "Excellent learning opportunities and supportive management. The company really invests in employee development.",
        pros: ["Learning opportunities", "Good work-life balance", "Competitive compensation"],
        cons: ["Fast-paced environment", "High expectations"],
        position: "Software Engineer",
        tenure: "2 years",
        date: "2024-01-15",
      },
      {
        id: "2",
        rating: 4,
        title: "Solid company with room for improvement",
        content: "Good benefits and interesting projects, but management could be more transparent about company direction.",
        pros: ["Interesting projects", "Good benefits", "Smart colleagues"],
        cons: ["Management transparency", "Workload can be heavy"],
        position: "Product Manager",
        tenure: "1.5 years",
        date: "2024-01-10",
      },
    ],
    salary: {
      softwareEngineer: {
        entry: 95000,
        mid: 125000,
        senior: 165000,
      },
      productManager: {
        entry: 110000,
        mid: 145000,
        senior: 185000,
      },
    },
    benefits: [
      "Health insurance",
      "Dental insurance",
      "401(k) matching",
      "Flexible PTO",
      "Remote work options",
      "Professional development budget",
      "Gym membership",
      "Free lunch",
    ],
    news: [
      {
        title: "TechCorp Raises $50M in Series C Funding",
        date: "2024-01-20",
        summary: "Funding will be used to expand AI capabilities and hire top talent.",
      },
      {
        title: "New Office Opening in Austin, TX",
        date: "2024-01-05",
        summary: "Company expands presence with new engineering hub in Texas.",
      },
    ],
  },
  "StartupXYZ": {
    overview: {
      industry: "Technology",
      size: "50-200 employees",
      founded: 2020,
      headquarters: "New York, NY",
      website: "https://startupxyz.com",
      description: "Fast-growing startup building the future of fintech solutions.",
    },
    culture: {
      rating: 4.5,
      reviews: 234,
      workLifeBalance: 4.2,
      cultureValues: 4.6,
      careerOpportunities: 4.4,
      compensation: 3.8,
      management: 4.1,
    },
    reviews: [
      {
        id: "3",
        rating: 5,
        title: "Amazing startup culture",
        content: "Incredible energy and opportunity to make an impact. Everyone is passionate about the mission.",
        pros: ["Impactful work", "Great team culture", "Equity potential"],
        cons: ["Lower base salary", "Fast-paced, can be stressful"],
        position: "Frontend Developer",
        tenure: "1 year",
        date: "2024-01-08",
      },
    ],
    salary: {
      softwareEngineer: {
        entry: 85000,
        mid: 110000,
        senior: 140000,
      },
    },
    benefits: [
      "Health insurance",
      "Equity package",
      "Flexible hours",
      "Learning stipend",
      "Team outings",
    ],
    news: [
      {
        title: "StartupXYZ Launches New Product",
        date: "2024-01-18",
        summary: "Revolutionary fintech product hits the market with strong initial reception.",
      },
    ],
  },
};

export default function CompaniesPage() {
  const { user } = useFirebaseAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCompany, setSelectedCompany] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("overview");

  const companies = Object.keys(companyData);
  const filteredCompanies = companies.filter(company =>
    company.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const currentCompany = selectedCompany ? companyData[selectedCompany as keyof typeof companyData] : null;

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted">
        <div className="text-center">
          <p className="mb-4">Please sign in to access company research.</p>
          <a className="underline" href="/sign-in">
            Sign in
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-muted to-muted/80 pt-16">
      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-gradient-to-r from-sky-600 to-indigo-600 shadow-lg"
      >
        <div className="relative max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: "easeOut" }}
            className="text-center"
          >
            <h1 className="text-4xl font-bold text-white sm:text-5xl lg:text-6xl">
              Research Companies
            </h1>
            <p className="mt-6 max-w-2xl mx-auto text-xl text-sky-100">
              Get detailed insights about companies before you apply. Read reviews, check salaries, and make informed decisions.
            </p>
          </motion.div>
        </div>
      </motion.div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <FeatureGate>
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Company Search Sidebar */}
            <div className="lg:col-span-1">
              <Card className="sticky top-8">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building className="h-5 w-5" />
                    Companies
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Search */}
                    <div className="relative">
                      <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search companies..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                      />
                    </div>

                    {/* Company List */}
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {filteredCompanies.map((company) => (
                        <button
                          key={company}
                          onClick={() => setSelectedCompany(company)}
                          className={`w-full text-left p-3 rounded-lg border transition-colors ${
                            selectedCompany === company
                              ? "border-primary bg-primary/5"
                              : "border-border hover:border-border/80"
                          }`}
                        >
                          <div className="font-medium text-sm">{company}</div>
                          <div className="text-xs text-muted-foreground mt-1">
                            {companyData[company as keyof typeof companyData].overview.industry}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Company Details */}
            <div className="lg:col-span-3">
              {currentCompany ? (
                <div className="space-y-6">
                  {/* Company Header */}
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4">
                          <div className="text-4xl">🏢</div>
                          <div>
                            <h1 className="text-3xl font-bold">{selectedCompany}</h1>
                            <p className="text-muted-foreground mt-1">{currentCompany.overview.description}</p>
                            <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <MapPin className="h-4 w-4" />
                                {currentCompany.overview.headquarters}
                              </div>
                              <div className="flex items-center gap-1">
                                <Users className="h-4 w-4" />
                                {currentCompany.overview.size}
                              </div>
                              <div className="flex items-center gap-1">
                                <Calendar className="h-4 w-4" />
                                Founded {currentCompany.overview.founded}
                              </div>
                            </div>
                          </div>
                        </div>
                        <Button variant="outline" asChild>
                          <a href={currentCompany.overview.website} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-4 w-4 mr-2" />
                            Visit Website
                          </a>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Company Tabs */}
                  <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList className="grid w-full grid-cols-5">
                      <TabsTrigger value="overview">Overview</TabsTrigger>
                      <TabsTrigger value="reviews">Reviews</TabsTrigger>
                      <TabsTrigger value="salary">Salary</TabsTrigger>
                      <TabsTrigger value="benefits">Benefits</TabsTrigger>
                      <TabsTrigger value="news">News</TabsTrigger>
                    </TabsList>

                    <TabsContent value="overview" className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Culture Overview */}
                        <Card>
                          <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                              <Star className="h-5 w-5" />
                              Company Culture
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-4">
                              <div className="flex items-center justify-between">
                                <span>Overall Rating</span>
                                <div className="flex items-center gap-1">
                                  <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                                  <span className="font-semibold">{currentCompany.culture.rating}</span>
                                  <span className="text-sm text-muted-foreground">
                                    ({currentCompany.culture.reviews} reviews)
                                  </span>
                                </div>
                              </div>

                              <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                  <span className="text-sm">Work-Life Balance</span>
                                  <div className="flex items-center gap-2">
                                    <Progress value={currentCompany.culture.workLifeBalance * 20} className="w-20 h-2" />
                                    <span className="text-sm font-medium">{currentCompany.culture.workLifeBalance}</span>
                                  </div>
                                </div>
                                <div className="flex justify-between items-center">
                                  <span className="text-sm">Culture & Values</span>
                                  <div className="flex items-center gap-2">
                                    <Progress value={currentCompany.culture.cultureValues * 20} className="w-20 h-2" />
                                    <span className="text-sm font-medium">{currentCompany.culture.cultureValues}</span>
                                  </div>
                                </div>
                                <div className="flex justify-between items-center">
                                  <span className="text-sm">Career Opportunities</span>
                                  <div className="flex items-center gap-2">
                                    <Progress value={currentCompany.culture.careerOpportunities * 20} className="w-20 h-2" />
                                    <span className="text-sm font-medium">{currentCompany.culture.careerOpportunities}</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>

                        {/* Key Information */}
                        <Card>
                          <CardHeader>
                            <CardTitle>Key Information</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-4">
                              <div className="flex justify-between">
                                <span className="text-sm text-muted-foreground">Industry</span>
                                <Badge variant="secondary">{currentCompany.overview.industry}</Badge>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-sm text-muted-foreground">Company Size</span>
                                <span className="text-sm font-medium">{currentCompany.overview.size}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-sm text-muted-foreground">Founded</span>
                                <span className="text-sm font-medium">{currentCompany.overview.founded}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-sm text-muted-foreground">Headquarters</span>
                                <span className="text-sm font-medium">{currentCompany.overview.headquarters}</span>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    </TabsContent>

                    <TabsContent value="reviews" className="space-y-6">
                      <div className="space-y-4">
                        {currentCompany.reviews.map((review) => (
                          <Card key={review.id}>
                            <CardContent className="p-6">
                              <div className="flex items-start justify-between mb-4">
                                <div>
                                  <h3 className="font-semibold">{review.title}</h3>
                                  <div className="flex items-center gap-2 mt-1">
                                    <div className="flex">
                                      {[...Array(5)].map((_, i) => (
                                        <Star
                                          key={i}
                                          className={`h-4 w-4 ${
                                            i < review.rating
                                              ? "fill-yellow-400 text-yellow-400"
                                              : "text-muted-foreground/30"
                                          }`}
                                        />
                                      ))}
                                    </div>
                                    <span className="text-sm text-muted-foreground">
                                      {review.position} • {review.tenure}
                                    </span>
                                  </div>
                                </div>
                                <span className="text-sm text-muted-foreground">
                                  {new Date(review.date).toLocaleDateString()}
                                </span>
                              </div>

                              <p className="text-foreground mb-4">{review.content}</p>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                  <h4 className="font-medium text-emerald-700 mb-2">Pros</h4>
                                  <ul className="space-y-1">
                                    {review.pros.map((pro, index) => (
                                      <li key={index} className="flex items-center gap-2 text-sm">
                                        <CheckCircle className="h-3 w-3 text-green-500" />
                                        {pro}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                                <div>
                                  <h4 className="font-medium text-red-700 mb-2">Cons</h4>
                                  <ul className="space-y-1">
                                    {review.cons.map((con, index) => (
                                      <li key={index} className="flex items-center gap-2 text-sm">
                                        <XCircle className="h-3 w-3 text-red-500" />
                                        {con}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </TabsContent>

                    <TabsContent value="salary" className="space-y-6">
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <DollarSign className="h-5 w-5" />
                            Salary Information
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-6">
                            {Object.entries(currentCompany.salary).map(([role, salaries]) => (
                              <div key={role} className="space-y-3">
                                <h3 className="font-semibold capitalize">
                                  {role.replace(/([A-Z])/g, ' $1').trim()}
                                </h3>
                                <div className="grid grid-cols-3 gap-4">
                                  <div className="text-center p-4 bg-muted rounded-lg">
                                    <p className="text-sm text-muted-foreground">Entry Level</p>
                                    <p className="text-2xl font-bold">${salaries.entry.toLocaleString()}</p>
                                  </div>
                                  <div className="text-center p-4 bg-muted rounded-lg">
                                    <p className="text-sm text-muted-foreground">Mid Level</p>
                                    <p className="text-2xl font-bold">${salaries.mid.toLocaleString()}</p>
                                  </div>
                                  <div className="text-center p-4 bg-muted rounded-lg">
                                    <p className="text-sm text-muted-foreground">Senior Level</p>
                                    <p className="text-2xl font-bold">${salaries.senior.toLocaleString()}</p>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    </TabsContent>

                    <TabsContent value="benefits" className="space-y-6">
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <Award className="h-5 w-5" />
                            Benefits & Perks
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {currentCompany.benefits.map((benefit, index) => (
                              <div key={index} className="flex items-center gap-3 p-3 border rounded-lg">
                                <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                                <span className="text-sm">{benefit}</span>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    </TabsContent>

                    <TabsContent value="news" className="space-y-6">
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <TrendingUp className="h-5 w-5" />
                            Recent News
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            {currentCompany.news.map((item, index) => (
                              <div key={index} className="p-4 border rounded-lg">
                                <h3 className="font-semibold mb-2">{item.title}</h3>
                                <p className="text-sm text-muted-foreground mb-2">
                                  {new Date(item.date).toLocaleDateString()}
                                </p>
                                <p className="text-sm">{item.summary}</p>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    </TabsContent>
                  </Tabs>
                </div>
              ) : (
                <div className="text-center py-12">
                  <Building className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-foreground mb-2">
                    Select a company to research
                  </h3>
                  <p className="text-muted-foreground">
                    Choose a company from the sidebar to view detailed information, reviews, and insights.
                  </p>
                </div>
              )}
            </div>
          </div>
        </FeatureGate>
      </div>
    </div>
  );
}
