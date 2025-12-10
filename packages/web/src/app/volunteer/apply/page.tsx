"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import Link from "next/link";
import { useApiMutation } from "@/hooks/useApi";
import { contactApi } from "@/utils/api/contact";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { motion } from "framer-motion";
import { Loader2, Mail, User, Send, ArrowLeft, Globe, Clock, Code } from "lucide-react";

const skillOptions = [
  "Frontend Development (React, Vue, Angular)",
  "Backend Development (Node.js, Python, Java)",
  "Full Stack Development",
  "UI/UX Design",
  "Mobile Development (React Native, Flutter)",
  "WordPress/CMS Development",
  "Data Analysis",
  "Content Writing",
  "Digital Marketing",
  "Other"
];

const availabilityOptions = [
  "5-10 hours per week",
  "10-15 hours per week",
  "15-20 hours per week",
  "20+ hours per week"
];

export default function VolunteerApplyPage() {
  const { mutate: createContact } = useApiMutation(
    (variables: Record<string, unknown>) => {
      const { name, email, message } = variables;
      return contactApi.createContact({
        name: name as string,
        email: email as string,
        message: message as string
      });
    }
  );
  
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    skills: "",
    availability: "",
    experience: "",
    motivation: "",
    portfolio: ""
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.name.trim() || !formData.email.trim() || !formData.skills || !formData.motivation.trim()) {
      toast.error("Please fill in all required fields.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast.error("Please enter a valid email address.");
      return;
    }

    if (formData.motivation.trim().length < 50) {
      toast.error("Please write at least 50 characters about your motivation.");
      return;
    }

    setLoading(true);
    try {
      // Format the message for the contact API
      const message = `
VOLUNTEER APPLICATION

Name: ${formData.name}
Email: ${formData.email}
Skills: ${formData.skills}
Availability: ${formData.availability || "Not specified"}
Portfolio/GitHub: ${formData.portfolio || "Not provided"}

Experience:
${formData.experience || "No prior experience mentioned"}

Motivation:
${formData.motivation}
      `.trim();

      await createContact({ 
        name: formData.name, 
        email: formData.email, 
        message 
      });
      
      toast.success("Application submitted! We'll be in touch within 48 hours.");
      setFormData({
        name: "",
        email: "",
        skills: "",
        availability: "",
        experience: "",
        motivation: "",
        portfolio: ""
      });
    } catch (err: any) {
      console.error("Volunteer application error:", err);
      toast.error("Failed to submit application. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center p-4 sm:p-6 lg:p-8 pt-16 sm:pt-20 lg:pt-24 bg-gradient-to-br from-background via-muted/20 to-background">
      {/* Premium background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 right-20 w-96 h-96 bg-primary/2 rounded-full filter blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 left-20 w-80 h-80 bg-secondary/2 rounded-full filter blur-2xl animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-2xl space-y-6 relative z-10"
      >
        {/* Back link */}
        <Link 
          href="/volunteer" 
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Volunteer Program</span>
        </Link>

        <Card className="card-premium-elevated border-0 bg-surface p-8">
          <CardHeader className="space-y-4 text-center pb-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 260, damping: 20 }}
              className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary mb-4"
            >
              <Globe className="h-8 w-8" />
            </motion.div>
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <CardTitle className="text-3xl font-bold">Volunteer Application</CardTitle>
            </motion.div>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              <CardDescription className="text-muted-foreground text-lg">
                Join our program to gain real experience working with UK clients. 
                We&apos;ll review your application within 48 hours.
              </CardDescription>
            </motion.div>
          </CardHeader>
          
          <CardContent>
            <motion.form 
              onSubmit={handleSubmit} 
              className="space-y-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.6 }}
            >
              {/* Name */}
              <div className="space-y-3">
                <Label htmlFor="name" className="text-sm font-semibold text-foreground">
                  Full Name <span className="text-destructive">*</span>
                </Label>
                <div className="relative group">
                  <User className="absolute left-4 top-3.5 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <Input
                    id="name"
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => handleChange("name", e.target.value)}
                    className="input-premium pl-12 h-12"
                    placeholder="Your full name"
                    disabled={loading}
                  />
                </div>
              </div>

              {/* Email */}
              <div className="space-y-3">
                <Label htmlFor="email" className="text-sm font-semibold text-foreground">
                  Email <span className="text-destructive">*</span>
                </Label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-3.5 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <Input
                    id="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => handleChange("email", e.target.value)}
                    className="input-premium pl-12 h-12"
                    placeholder="you@example.com"
                    disabled={loading}
                  />
                </div>
              </div>

              {/* Skills */}
              <div className="space-y-3">
                <Label htmlFor="skills" className="text-sm font-semibold text-foreground">
                  Primary Skills <span className="text-destructive">*</span>
                </Label>
                <Select 
                  value={formData.skills} 
                  onValueChange={(value) => handleChange("skills", value)}
                  disabled={loading}
                >
                  <SelectTrigger className="h-12">
                    <Code className="h-4 w-4 mr-2 text-muted-foreground" />
                    <SelectValue placeholder="Select your primary skill area" />
                  </SelectTrigger>
                  <SelectContent>
                    {skillOptions.map((skill) => (
                      <SelectItem key={skill} value={skill}>
                        {skill}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Availability */}
              <div className="space-y-3">
                <Label htmlFor="availability" className="text-sm font-semibold text-foreground">
                  Weekly Availability
                </Label>
                <Select 
                  value={formData.availability} 
                  onValueChange={(value) => handleChange("availability", value)}
                  disabled={loading}
                >
                  <SelectTrigger className="h-12">
                    <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                    <SelectValue placeholder="How many hours can you commit?" />
                  </SelectTrigger>
                  <SelectContent>
                    {availabilityOptions.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Portfolio/GitHub */}
              <div className="space-y-3">
                <Label htmlFor="portfolio" className="text-sm font-semibold text-foreground">
                  Portfolio/GitHub URL
                </Label>
                <Input
                  id="portfolio"
                  type="url"
                  value={formData.portfolio}
                  onChange={(e) => handleChange("portfolio", e.target.value)}
                  className="input-premium h-12"
                  placeholder="https://github.com/username or portfolio link"
                  disabled={loading}
                />
              </div>

              {/* Experience */}
              <div className="space-y-3">
                <Label htmlFor="experience" className="text-sm font-semibold text-foreground">
                  Relevant Experience
                </Label>
                <Textarea
                  id="experience"
                  value={formData.experience}
                  onChange={(e) => handleChange("experience", e.target.value)}
                  placeholder="Briefly describe any relevant experience (personal projects, coursework, internships, etc.)"
                  className="input-premium min-h-[100px] resize-y p-4"
                  disabled={loading}
                />
              </div>

              {/* Motivation */}
              <div className="space-y-3">
                <Label htmlFor="motivation" className="text-sm font-semibold text-foreground">
                  Why do you want to volunteer? <span className="text-destructive">*</span>
                  <span className="text-xs font-normal text-muted-foreground ml-2">
                    (Min. 50 characters)
                  </span>
                </Label>
                <Textarea
                  id="motivation"
                  required
                  value={formData.motivation}
                  onChange={(e) => handleChange("motivation", e.target.value)}
                  placeholder="Tell us why you're interested in volunteering and what you hope to gain from this experience..."
                  className="input-premium min-h-[120px] resize-y p-4"
                  disabled={loading}
                />
                <p className="text-xs text-muted-foreground">
                  {formData.motivation.length}/50 minimum characters
                </p>
              </div>

              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button
                  type="submit"
                  disabled={loading}
                  className="btn-premium w-full h-12 font-bold text-base"
                  size="lg"
                >
                  {loading ? (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex items-center justify-center"
                    >
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      <span>Submitting...</span>
                    </motion.div>
                  ) : (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex items-center justify-center"
                    >
                      <Send className="mr-2 h-4 w-4" />
                      <span>Submit Application</span>
                    </motion.div>
                  )}
                </Button>
              </motion.div>
            </motion.form>
          </CardContent>
        </Card>
      </motion.div>
    </main>
  );
}
