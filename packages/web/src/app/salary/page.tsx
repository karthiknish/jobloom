"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  DollarSign,
  TrendingUp,
  Calculator,
  MessageSquare,
  Target,
  Award,
  MapPin,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton, SkeletonCard, SkeletonGrid } from "@/components/ui/loading-skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { useFirebaseAuth } from "@/providers/firebase-auth-provider";
import { FeatureGate } from "@/components/UpgradePrompt";

// Mock salary data
const salaryData = {
  "Software Engineer": {
    entry: { min: 70000, max: 95000, avg: 82000 },
    mid: { min: 95000, max: 135000, avg: 115000 },
    senior: { min: 135000, max: 180000, avg: 157000 },
  },
  "Product Manager": {
    entry: { min: 85000, max: 115000, avg: 100000 },
    mid: { min: 115000, max: 155000, avg: 135000 },
    senior: { min: 155000, max: 220000, avg: 187000 },
  },
  "UX Designer": {
    entry: { min: 65000, max: 85000, avg: 75000 },
    mid: { min: 85000, max: 115000, avg: 100000 },
    senior: { min: 115000, max: 150000, avg: 132000 },
  },
  "Data Scientist": {
    entry: { min: 80000, max: 110000, avg: 95000 },
    mid: { min: 110000, max: 150000, avg: 130000 },
    senior: { min: 150000, max: 200000, avg: 175000 },
  },
};

const negotiationScripts = [
  {
    title: "Salary Counteroffer",
    scenario: "Employer offers $95k, you want $110k",
    script: "Thank you for the offer. I'm excited about the opportunity and the team. Based on my research and experience, I was targeting a salary in the range of $105k-$115k. Would you be able to meet in the middle at $110k?",
  },
  {
    title: "Benefits Negotiation",
    scenario: "Need better health benefits or PTO",
    script: "The salary is competitive, but I'd like to discuss the benefits package. Could we explore options for additional PTO or enhanced health coverage that would make this offer even more attractive?",
  },
  {
    title: "Equity Discussion",
    scenario: "Startup equity negotiation",
    script: "I'm very interested in the equity package. Given the company's stage and my role in driving growth, could we discuss increasing the equity grant from 0.5% to 0.75%?",
  },
];

const costOfLivingData = {
  "San Francisco, CA": { index: 185, housing: 2800, groceries: 450 },
  "New York, NY": { index: 155, housing: 2200, groceries: 420 },
  "Austin, TX": { index: 115, housing: 1400, groceries: 380 },
  "Seattle, WA": { index: 145, housing: 1900, groceries: 410 },
  "Denver, CO": { index: 125, housing: 1600, groceries: 395 },
  "Chicago, IL": { index: 120, housing: 1500, groceries: 400 },
};

export default function SalaryPage() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 pt-16">
        <div className="max-w-4xl mx-auto py-8 px-4">
          <Skeleton className="h-8 w-64 mb-8" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
          <SkeletonGrid items={4} className="mt-8" />
        </div>
      </div>
    );
  }
  const { user } = useFirebaseAuth();
  const [activeTab, setActiveTab] = useState("calculator");
  const [jobTitle, setJobTitle] = useState("");
  const [experience, setExperience] = useState("");
  const [location, setLocation] = useState("");
  const [currentSalary, setCurrentSalary] = useState([80000]);
  const [targetSalary, setTargetSalary] = useState([100000]);
  const [negotiationReadiness, setNegotiationReadiness] = useState(0);

  const getSalaryData = () => {
    if (!jobTitle || !experience) return null;
    return salaryData[jobTitle as keyof typeof salaryData]?.[experience as keyof typeof salaryData["Software Engineer"]];
  };

  const calculateNegotiationScore = () => {
    let score = 0;
    if (jobTitle) score += 25;
    if (experience) score += 25;
    if (location) score += 25;
    if (targetSalary[0] > currentSalary[0]) score += 25;
    return score;
  };

  const getCostOfLiving = (city: string) => {
    return costOfLivingData[city as keyof typeof costOfLivingData];
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <div className="text-center">
          <p className="mb-4">Please sign in to access salary tools.</p>
          <a className="underline" href="/sign-in">
            Sign in
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 pt-16">
      <div>Salary Tools Coming Soon</div>
    </div>
  );
}
