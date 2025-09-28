"use client";
import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Briefcase, Plus, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { Switch } from '@/components/ui/switch';
import { useResumeBuilder } from '../ResumeBuilderContext';

export const ExperienceSection: React.FC = () => {
  const { resumeData, addExperience, updateExperience, removeExperience } = useResumeBuilder();
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2"><Briefcase className="h-5 w-5"/> Work Experience</CardTitle>
          <CardDescription>Add your professional experience, starting with your most recent role</CardDescription>
        </div>
        <Button onClick={addExperience}><Plus className="h-4 w-4 mr-2"/>Add Experience</Button>
      </CardHeader>
      <CardContent className="space-y-6">
        {resumeData.experience.map((exp,index)=>(
          <motion.div key={exp.id} layout className="p-6 border rounded-lg bg-card space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">Position {index+1}</h4>
              <Button variant="ghost" size="sm" onClick={()=> removeExperience(exp.id)} className="text-destructive hover:text-destructive"><Trash2 className="h-4 w-4"/></Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Company</Label>
                <Input value={exp.company} onChange={e=> updateExperience(index,{ company: e.target.value })} placeholder="Company Name"/>
              </div>
              <div>
                <Label>Job Title</Label>
                <Input value={exp.position} onChange={e=> updateExperience(index,{ position: e.target.value })} placeholder="Software Engineer"/>
              </div>
              <div>
                <Label>Location</Label>
                <Input value={exp.location} onChange={e=> updateExperience(index,{ location: e.target.value })} placeholder="San Francisco, CA"/>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1">
                  <Label>Start Date</Label>
                  <Input type="month" value={exp.startDate} onChange={e=> updateExperience(index,{ startDate: e.target.value })} />
                </div>
                <div className="flex-1">
                  <Label>End Date</Label>
                  <Input type="month" value={exp.endDate} onChange={e=> updateExperience(index,{ endDate: e.target.value })} disabled={exp.current} />
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Switch checked={exp.current} onCheckedChange={checked=> updateExperience(index,{ current: checked })} />
                <Label>Currently working here</Label>
              </div>
            </div>
            <div>
              <Label>Job Description</Label>
              <Textarea rows={3} value={exp.description} onChange={e=> updateExperience(index,{ description: e.target.value })} placeholder="Describe your role, responsibilities, and key accomplishments..." />
            </div>
            <div>
              <Label>Key Achievements</Label>
              {exp.achievements.map((achievement, achIndex)=>(
                <div key={achIndex} className="flex gap-2 mt-2">
                  <Input value={achievement} onChange={e=> { const newA=[...exp.achievements]; newA[achIndex]= e.target.value; updateExperience(index,{ achievements: newA }); }} placeholder="Increased team productivity by 30%" />
                  {exp.achievements.length>1 && (
                    <Button variant="outline" size="sm" onClick={()=> { const newA= exp.achievements.filter((_,i)=> i!==achIndex); updateExperience(index,{ achievements: newA }); }}><Trash2 className="h-4 w-4"/></Button>
                  )}
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={()=> updateExperience(index,{ achievements: [...exp.achievements, ''] })} className="mt-2"><Plus className="h-4 w-4 mr-1"/>Add Achievement</Button>
            </div>
          </motion.div>
        ))}
        {resumeData.experience.length===0 && (
          <div className="text-center py-12 text-muted-foreground">
            <Briefcase className="h-12 w-12 mx-auto mb-4 opacity-50"/>
            <p className="text-lg font-medium mb-2">No experience added yet</p>
            <p className="text-sm">Add your work experience to showcase your professional background</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
