"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Search,
  MapPin,
  Filter,
  Bookmark,
  ExternalLink,
  Building,
  DollarSign,
  Clock,
  Users,
  Star,
  Rocket,
  Palette,
  ChevronDown,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useFirebaseAuth } from "@/providers/firebase-auth-provider";
import { FeatureGate } from "@/components/UpgradePrompt";
import { SkeletonJobCard, SkeletonGrid } from "@/components/ui/loading-skeleton";

// Mock job data - in real app, this would come from APIs
const mockJobs = [
  {
    id: "1",
    title: "Senior Frontend Developer",
    company: "TechCorp Inc.",
    location: "San Francisco, CA",
    salary: "$120k - $160k",
    type: "Full-time",
    level: "Senior",
    posted: "2 days ago",
    description: "We are looking for a Senior Frontend Developer to join our growing team...",
    skills: ["React", "TypeScript", "Node.js"],
    logo: "🏢",
    isRemote: true,
    companySize: "500-1000",
    industry: "Technology",
  },
  {
    id: "2",
    title: "Product Manager",
    company: "StartupXYZ",
    location: "New York, NY",
    salary: "$90k - $130k",
    type: "Full-time",
    level: "Mid-level",
    posted: "1 day ago",
    description: "Join our product team to drive innovative solutions...",
    skills: ["Product Strategy", "Analytics", "Agile"],
    logo: "🚀",
    isRemote: false,
    companySize: "50-200",
    industry: "Technology",
  },
  {
    id: "3",
    title: "UX Designer",
    company: "DesignStudio",
    location: "Austin, TX",
    salary: "$80k - $110k",
    type: "Full-time",
    level: "Mid-level",
    posted: "3 days ago",
    description: "Create beautiful and intuitive user experiences...",
    skills: ["Figma", "User Research", "Prototyping"],
    logo: "🎨",
    isRemote: true,
    companySize: "10-50",
    industry: "Design",
  },
];

// Helper to get icon component by emoji
const getJobIcon = (emoji: string) => {
  const icons: Record<string, any> = {
    "🚀": Rocket,
    "🎨": Palette,
  };
  return icons[emoji] || Building;
};

export default function JobsPage() {
  const { user } = useFirebaseAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [location, setLocation] = useState("");
  const [jobs, setJobs] = useState(mockJobs);
  const [filteredJobs, setFilteredJobs] = useState(mockJobs);
  const [isLoading, setIsLoading] = useState(false);
  const [savedJobs, setSavedJobs] = useState<string[]>([]);
  const [filters, setFilters] = useState({
    jobType: "",
    experience: "",
    salary: "",
    remote: false,
    companySize: "",
    industry: "",
  });

  // Simulate loading on initial load and when filters change
  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => setIsLoading(false), 800); // Simulate API delay
    return () => clearTimeout(timer);
  }, [searchQuery, location, filters]);

  // Filter jobs based on search and filters
  useEffect(() => {
    const filtered = jobs.filter((job) => {
      const matchesSearch =
        job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        job.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
        job.skills.some((skill) =>
          skill.toLowerCase().includes(searchQuery.toLowerCase())
        );

      const matchesLocation =
        !location ||
        job.location.toLowerCase().includes(location.toLowerCase());

      const matchesFilters =
        (!filters.jobType || job.type === filters.jobType) &&
        (!filters.experience || job.level === filters.experience) &&
        (!filters.remote || job.isRemote) &&
        (!filters.companySize || job.companySize === filters.companySize) &&
        (!filters.industry || job.industry === filters.industry);

      return matchesSearch && matchesLocation && matchesFilters;
    });

    setFilteredJobs(filtered);
  }, [searchQuery, location, jobs, filters]);

  const handleSaveJob = (jobId: string) => {
    setSavedJobs((prev) =>
      prev.includes(jobId)
        ? prev.filter((id) => id !== jobId)
        : [...prev, jobId]
    );
  };

  const clearFilters = () => {
    setFilters({
      jobType: "",
      experience: "",
      salary: "",
      remote: false,
      companySize: "",
      industry: "",
    });
  };

  const FilterSidebar = () => (
    <div className="space-y-6">
      <div>
        <h3 className="font-semibold mb-3">Job Type</h3>
        <Select
          value={filters.jobType}
          onValueChange={(value) =>
            setFilters((prev) => ({ ...prev, jobType: value }))
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Any type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Any type</SelectItem>
            <SelectItem value="Full-time">Full-time</SelectItem>
            <SelectItem value="Part-time">Part-time</SelectItem>
            <SelectItem value="Contract">Contract</SelectItem>
            <SelectItem value="Internship">Internship</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <h3 className="font-semibold mb-3">Experience Level</h3>
        <Select
          value={filters.experience}
          onValueChange={(value) =>
            setFilters((prev) => ({ ...prev, experience: value }))
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Any level" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Any level</SelectItem>
            <SelectItem value="Entry">Entry Level</SelectItem>
            <SelectItem value="Mid-level">Mid-level</SelectItem>
            <SelectItem value="Senior">Senior</SelectItem>
            <SelectItem value="Executive">Executive</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <h3 className="font-semibold mb-3">Work Type</h3>
        <div className="flex items-center space-x-2">
          <Checkbox
            id="remote"
            checked={filters.remote}
            onCheckedChange={(checked) =>
              setFilters((prev) => ({ ...prev, remote: !!checked }))
            }
          />
          <Label htmlFor="remote">Remote work</Label>
        </div>
      </div>

      <div>
        <h3 className="font-semibold mb-3">Company Size</h3>
        <Select
          value={filters.companySize}
          onValueChange={(value) =>
            setFilters((prev) => ({ ...prev, companySize: value }))
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Any size" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Any size</SelectItem>
            <SelectItem value="1-10">1-10 employees</SelectItem>
            <SelectItem value="10-50">10-50 employees</SelectItem>
            <SelectItem value="50-200">50-200 employees</SelectItem>
            <SelectItem value="200-500">200-500 employees</SelectItem>
            <SelectItem value="500-1000">500-1000 employees</SelectItem>
            <SelectItem value="1000+">1000+ employees</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <h3 className="font-semibold mb-3">Industry</h3>
        <Select
          value={filters.industry}
          onValueChange={(value) =>
            setFilters((prev) => ({ ...prev, industry: value }))
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Any industry" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Any industry</SelectItem>
            <SelectItem value="Technology">Technology</SelectItem>
            <SelectItem value="Healthcare">Healthcare</SelectItem>
            <SelectItem value="Finance">Finance</SelectItem>
            <SelectItem value="Education">Education</SelectItem>
            <SelectItem value="Marketing">Marketing</SelectItem>
            <SelectItem value="Design">Design</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Button onClick={clearFilters} variant="outline" className="w-full">
        Clear Filters
      </Button>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-muted/30 to-muted/50 pt-16">
      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-gradient-to-r from-primary to-secondary shadow-lg"
      >
        <div className="relative max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: "easeOut" }}
            className="text-center"
          >
            <h1 className="text-4xl font-bold text-white sm:text-5xl lg:text-6xl">
              Find Your Dream Job
            </h1>
            <p className="mt-6 max-w-2xl mx-auto text-xl text-primary-foreground/90">
              Search thousands of jobs from top companies. Get personalized
              recommendations and track your applications.
            </p>

            {/* Search Bar */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="mt-8 max-w-4xl mx-auto"
            >
              <div className="bg-white rounded-lg shadow-lg p-2 flex flex-col sm:flex-row gap-2">
                <div className="flex-1 flex items-center gap-2 px-4 py-3">
                  <Search className="h-5 w-5 text-muted-foreground" />
                  <Input
                    placeholder="Job title, keywords, or company"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="border-0 focus:ring-0 text-lg"
                  />
                </div>
                <div className="flex items-center gap-2 px-4 py-3 border-t sm:border-t-0 sm:border-l border-border">
                  <MapPin className="h-5 w-5 text-muted-foreground" />
                  <Input
                    placeholder="Location"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="border-0 focus:ring-0 text-lg"
                  />
                </div>
                <Button className="px-8 py-3 bg-primary hover:bg-primary/90 text-white">
                  Search Jobs
                </Button>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </motion.div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Filters */}
          <div className="lg:w-80">
            <div className="sticky top-8">
              {/* Mobile Filter Toggle */}
              <div className="lg:hidden mb-4">
                <Sheet>
                  <SheetTrigger asChild>
                    <Button variant="outline" className="w-full">
                      <Filter className="h-4 w-4 mr-2" />
                      Filters
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="left">
                    <SheetHeader>
                      <SheetTitle>Filter Jobs</SheetTitle>
                      <SheetDescription>
                        Narrow down your job search with these filters.
                      </SheetDescription>
                    </SheetHeader>
                    <div className="mt-6">
                      <FilterSidebar />
                    </div>
                  </SheetContent>
                </Sheet>
              </div>

              {/* Desktop Filters */}
              <div className="hidden lg:block">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Filter className="h-5 w-5" />
                      Filters
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <FilterSidebar />
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>

          {/* Job Listings */}
          <div className="flex-1">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-foreground">
                {filteredJobs.length} Jobs Found
              </h2>
              <Select defaultValue="relevance">
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="relevance">Most Relevant</SelectItem>
                  <SelectItem value="recent">Most Recent</SelectItem>
                  <SelectItem value="salary">Highest Salary</SelectItem>
                  <SelectItem value="company">Company A-Z</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-4">
              {isLoading ? (
                <SkeletonGrid items={6} />
              ) : (
                filteredJobs.map((job, index) => (
                  <motion.div
                    key={job.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1, duration: 0.5 }}
                    whileHover={{ y: -2 }}
                    className="transition-shadow duration-200 hover:shadow-lg"
                  >
                    <Card className="hover:shadow-lg transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-4 flex-1">
                            <div className="flex items-center justify-center">
                              {(() => {
                                const Icon = getJobIcon(job.logo);
                                return <Icon className="h-8 w-8" />;
                              })()}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-start justify-between mb-2">
                                <div>
                                  <h3 className="text-xl font-semibold text-foreground">
                                    {job.title}
                                  </h3>
                                  <p className="text-lg text-muted-foreground">
                                    {job.company}
                                  </p>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleSaveJob(job.id)}
                                  className={`${
                                    savedJobs.includes(job.id)
                                      ? "text-primary"
                                      : "text-muted-foreground"
                                  }`}
                                >
                                  <Bookmark
                                    className={`h-5 w-5 ${
                                      savedJobs.includes(job.id)
                                        ? "fill-current"
                                        : ""
                                    }`}
                                  />
                                </Button>
                              </div>

                              <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                                <div className="flex items-center gap-1">
                                  <MapPin className="h-4 w-4" />
                                  {job.location}
                                </div>
                                <div className="flex items-center gap-1">
                                  <DollarSign className="h-4 w-4" />
                                  {job.salary}
                                </div>
                                <div className="flex items-center gap-1">
                                  <Clock className="h-4 w-4" />
                                  {job.posted}
                                </div>
                              </div>

                              <div className="flex items-center gap-2 mb-3">
                                <Badge variant="secondary">{job.type}</Badge>
                                <Badge variant="outline">{job.level}</Badge>
                                {job.isRemote && (
                                  <Badge
                                    variant="outline"
                                    className="text-green-700 border-green-300"
                                  >
                                    Remote
                                  </Badge>
                                )}
                              </div>

                              <p className="text-muted-foreground mb-4 line-clamp-2">
                                {job.description}
                              </p>

                              <div className="flex flex-wrap gap-2 mb-4">
                                {job.skills.map((skill) => (
                                  <Badge
                                    key={skill}
                                    variant="secondary"
                                    className="text-xs"
                                  >
                                    {skill}
                                  </Badge>
                                ))}
                              </div>

                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                  <div className="flex items-center gap-1">
                                    <Building className="h-4 w-4" />
                                    {job.companySize} employees
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <Users className="h-4 w-4" />
                                    {job.industry}
                                  </div>
                                </div>

                                <div className="flex gap-2">
                                  <FeatureGate
                                    fallback={
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        disabled
                                      >
                                        <ExternalLink className="h-4 w-4 mr-2" />
                                        Apply (Premium)
                                      </Button>
                                    }
                                  >
                                    <Button size="sm">
                                      <ExternalLink className="h-4 w-4 mr-2" />
                                      Apply Now
                                    </Button>
                                  </FeatureGate>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))
              )}
            </div>

            {filteredJobs.length === 0 && (
              <div className="text-center py-12">
                <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">
                  No jobs found
                </h3>
                <p className="text-muted-foreground">
                  Try adjusting your search criteria or filters.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
