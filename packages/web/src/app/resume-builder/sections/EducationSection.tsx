"use client";
import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { GraduationCap, Plus, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { useResumeBuilder } from '../ResumeBuilderContext';

export const EducationSection: React.FC = () => {
  const { resumeData, addEducation, updateEducation, removeEducation } = useResumeBuilder();
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2"><GraduationCap className="h-5 w-5"/> Education</CardTitle>
          <CardDescription>Add your academic background and qualifications</CardDescription>
        </div>
        <Button onClick={addEducation}><Plus className="h-4 w-4 mr-2"/>Add Education</Button>
      </CardHeader>
      <CardContent className="space-y-6">
        {resumeData.education.map((edu,index)=>(
          <motion.div key={edu.id} layout className="p-6 border rounded-lg bg-card space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">Education {index+1}</h4>
              <Button variant="ghost" size="sm" onClick={()=> removeEducation(edu.id)} className="text-destructive hover:text-destructive"><Trash2 className="h-4 w-4"/></Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><Label>Institution</Label><Input value={edu.institution} onChange={e=> updateEducation(index,{ institution: e.target.value })} placeholder="University of California" /></div>
              <div><Label>Degree</Label><Input value={edu.degree} onChange={e=> updateEducation(index,{ degree: e.target.value })} placeholder="Bachelor of Science" /></div>
              <div><Label>Field of Study</Label><Input value={edu.field} onChange={e=> updateEducation(index,{ field: e.target.value })} placeholder="Computer Science" /></div>
              <div><Label>Graduation Date</Label><Input type="month" value={edu.graduationDate} onChange={e=> updateEducation(index,{ graduationDate: e.target.value })} /></div>
              <div><Label>GPA (Optional)</Label><Input value={edu.gpa} onChange={e=> updateEducation(index,{ gpa: e.target.value })} placeholder="3.8" /></div>
              <div><Label>Honors/Awards (Optional)</Label><Input value={edu.honors} onChange={e=> updateEducation(index,{ honors: e.target.value })} placeholder="Summa Cum Laude, Dean's List" /></div>
            </div>
          </motion.div>
        ))}
        {resumeData.education.length===0 && (
          <div className="text-center py-12 text-muted-foreground">
            <GraduationCap className="h-12 w-12 mx-auto mb-4 opacity-50"/>
            <p className="text-lg font-medium mb-2">No education added yet</p>
            <p className="text-sm">Add your educational background to complete your profile</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
