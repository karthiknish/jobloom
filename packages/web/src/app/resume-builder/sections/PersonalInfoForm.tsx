"use client";
import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Lightbulb, Users } from 'lucide-react';
import { useResumeBuilder } from '../ResumeBuilderContext';

export const PersonalInfoForm: React.FC = () => {
  const { resumeData, updatePersonalInfo, generateSummarySuggestion } = useResumeBuilder();
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Users className="h-5 w-5"/> Personal Information</CardTitle>
        <CardDescription>Basic details that will appear at the top of your resume</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="fullName">Full Name *</Label>
            <Input id="fullName" value={resumeData.personalInfo.fullName} onChange={e=> updatePersonalInfo('fullName', e.target.value)} placeholder="John Doe" />
          </div>
          <div>
            <Label htmlFor="email">Email *</Label>
            <Input id="email" type="email" value={resumeData.personalInfo.email} onChange={e=> updatePersonalInfo('email', e.target.value)} placeholder="john@example.com" />
          </div>
          <div>
            <Label htmlFor="phone">Phone</Label>
            <Input id="phone" value={resumeData.personalInfo.phone} onChange={e=> updatePersonalInfo('phone', e.target.value)} placeholder="+1 (555) 123-4567" />
          </div>
            <div>
            <Label htmlFor="location">Location</Label>
            <Input id="location" value={resumeData.personalInfo.location} onChange={e=> updatePersonalInfo('location', e.target.value)} placeholder="San Francisco, CA" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="linkedin">LinkedIn</Label>
            <Input id="linkedin" value={resumeData.personalInfo.linkedin} onChange={e=> updatePersonalInfo('linkedin', e.target.value)} placeholder="linkedin.com/in/johndoe" />
          </div>
          <div>
            <Label htmlFor="github">GitHub</Label>
            <Input id="github" value={resumeData.personalInfo.github} onChange={e=> updatePersonalInfo('github', e.target.value)} placeholder="github.com/johndoe" />
          </div>
          <div>
            <Label htmlFor="website">Website</Label>
            <Input id="website" value={resumeData.personalInfo.website} onChange={e=> updatePersonalInfo('website', e.target.value)} placeholder="johndoe.com" />
          </div>
        </div>
        <div>
          <Label htmlFor="summary">Professional Summary</Label>
          <Textarea id="summary" rows={4} value={resumeData.personalInfo.summary} onChange={e=> updatePersonalInfo('summary', e.target.value)} placeholder="Write a compelling summary that highlights your key strengths and career goals..." />
          <p className="text-xs text-muted-foreground mt-1">Keep it concise (2-3 sentences) and tailor it to the job you're applying for.</p>
        </div>
        <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-blue-600" />
            <div>
              <p className="text-sm font-medium text-blue-900">AI-Powered Suggestions</p>
              <p className="text-xs text-blue-700">Get personalized summary suggestions based on your experience</p>
            </div>
          </div>
          <Button size="sm" variant="outline" className="border-blue-300 text-blue-700 hover:bg-blue-100" onClick={generateSummarySuggestion}>Generate Summary</Button>
        </div>
      </CardContent>
    </Card>
  );
};
