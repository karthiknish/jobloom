"use client";
import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Code2, Users, Globe, Settings } from 'lucide-react';
import { useResumeBuilder } from '../ResumeBuilderContext';
import { cn } from '@/lib/utils';

const skillCategoriesMeta = [
  { id: 'technical', icon: Code2, color: 'bg-blue-500' },
  { id: 'soft', icon: Users, color: 'bg-green-500' },
  { id: 'languages', icon: Globe, color: 'bg-purple-500' },
  { id: 'tools', icon: Settings, color: 'bg-orange-500' },
];

export const SkillsSection: React.FC = () => {
  const { resumeData, updateSkills } = useResumeBuilder();
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Code2 className="h-5 w-5"/> Skills & Competencies</CardTitle>
        <CardDescription>Highlight your technical and soft skills</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {resumeData.skills.map((skillGroup, index)=>(
          <div key={skillGroup.category} className="space-y-3">
            <div className="flex items-center gap-2">
              <div className={cn('p-2 rounded-full', skillCategoriesMeta[index]?.color || 'bg-gray-500')}>
                {React.createElement(skillCategoriesMeta[index]?.icon || Code2, { className: 'h-4 w-4 text-white'})}
              </div>
              <Label className="font-medium">{skillGroup.category}</Label>
            </div>
            <Input placeholder="JavaScript, React, Node.js, Python..." value={skillGroup.skills.join(', ')} onChange={e=> updateSkills(index, e.target.value)} />
          </div>
        ))}
      </CardContent>
    </Card>
  );
};
