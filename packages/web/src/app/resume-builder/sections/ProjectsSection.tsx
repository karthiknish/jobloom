"use client";
import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Sparkles, Plus, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { useResumeBuilder } from '../ResumeBuilderContext';

export const ProjectsSection: React.FC = () => {
  const { resumeData, addProject, updateProject, removeProject } = useResumeBuilder();
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2"><Sparkles className="h-5 w-5"/> Projects</CardTitle>
          <CardDescription>Showcase your best work and personal projects</CardDescription>
        </div>
        <Button onClick={addProject}><Plus className="h-4 w-4 mr-2"/>Add Project</Button>
      </CardHeader>
      <CardContent className="space-y-6">
        {resumeData.projects.map((project,index)=>(
          <motion.div key={project.id} layout className="p-6 border rounded-lg bg-card space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">Project {index+1}</h4>
              <Button variant="ghost" size="sm" onClick={()=> removeProject(project.id)} className="text-destructive hover:text-destructive"><Trash2 className="h-4 w-4"/></Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><Label>Project Name</Label><Input value={project.name} onChange={e=> updateProject(index,{ name: e.target.value })} placeholder="E-commerce Platform" /></div>
              <div><Label>Technologies Used</Label><Input value={project.technologies.join(', ')} onChange={e=> updateProject(index,{ technologies: e.target.value.split(',').map(t=> t.trim()).filter(Boolean) })} placeholder="React, Node.js, MongoDB" /></div>
              <div><Label>Project Link (Optional)</Label><Input value={project.link} onChange={e=> updateProject(index,{ link: e.target.value })} placeholder="https://myproject.com" /></div>
              <div><Label>GitHub Repository (Optional)</Label><Input value={project.github} onChange={e=> updateProject(index,{ github: e.target.value })} placeholder="github.com/username/project" /></div>
            </div>
            <div><Label>Description</Label><Textarea rows={3} value={project.description} onChange={e=> updateProject(index,{ description: e.target.value })} placeholder="Describe the project, your role, and the impact it had..." /></div>
          </motion.div>
        ))}
        {resumeData.projects.length===0 && (
          <div className="text-center py-12 text-muted-foreground">
            <Sparkles className="h-12 w-12 mx-auto mb-4 opacity-50"/>
            <p className="text-lg font-medium mb-2">No projects added yet</p>
            <p className="text-sm">Add your projects to demonstrate your skills and experience</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
