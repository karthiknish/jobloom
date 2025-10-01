'use client';

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ResumeData } from '../types';

interface EducationFormProps {
  education: ResumeData['education'];
  setEducation: (education: ResumeData['education']) => void;
}

export default function EducationForm({ education, setEducation }: EducationFormProps) {
  const [newEducation, setNewEducation] = useState({
    institution: '',
    degree: '',
    field: '',
    graduationDate: '',
    gpa: '',
    honors: ''
  });

  const addEducation = () => {
    if (newEducation.institution && newEducation.degree) {
      setEducation([...education, { ...newEducation, id: Date.now().toString() }]);
      setNewEducation({
        institution: '',
        degree: '',
        field: '',
        graduationDate: '',
        gpa: '',
        honors: ''
      });
    }
  };

  const removeEducation = (id: string) => {
    setEducation(education.filter(edu => edu.id !== id));
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Education</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="institution">Institution</Label>
          <Input
            id="institution"
            type="text"
            placeholder="Institution"
            value={newEducation.institution}
            onChange={(e) => setNewEducation({ ...newEducation, institution: e.target.value })}
          />
        </div>
        <div>
          <Label htmlFor="degree">Degree</Label>
          <Input
            id="degree"
            type="text"
            placeholder="Degree"
            value={newEducation.degree}
            onChange={(e) => setNewEducation({ ...newEducation, degree: e.target.value })}
          />
        </div>
        <div>
          <Label htmlFor="field">Field of Study</Label>
          <Input
            id="field"
            type="text"
            placeholder="Field of Study"
            value={newEducation.field}
            onChange={(e) => setNewEducation({ ...newEducation, field: e.target.value })}
          />
        </div>
        <div>
          <Label htmlFor="gpa">GPA (optional)</Label>
          <Input
            id="gpa"
            type="text"
            placeholder="GPA (optional)"
            value={newEducation.gpa}
            onChange={(e) => setNewEducation({ ...newEducation, gpa: e.target.value })}
          />
        </div>
        <div>
          <Label htmlFor="honors">Honors (optional)</Label>
          <Input
            id="honors"
            type="text"
            placeholder="Honors (optional)"
            value={newEducation.honors}
            onChange={(e) => setNewEducation({ ...newEducation, honors: e.target.value })}
          />
        </div>
        <div>
          <Label htmlFor="graduationDate">Graduation Date</Label>
          <Input
            id="graduationDate"
            type="month"
            placeholder="Graduation Date"
            value={newEducation.graduationDate}
            onChange={(e) => setNewEducation({ ...newEducation, graduationDate: e.target.value })}
          />
        </div>
      </div>
      
      <Button
        type="button"
        onClick={addEducation}
      >
        Add Education
      </Button>

      {education.map((edu) => (
        <div key={edu.id} className="p-4 border rounded-md">
          <div className="flex justify-between items-start">
            <div>
              <h4 className="font-medium">{edu.degree} in {edu.field}</h4>
              <p className="text-muted-foreground">{edu.institution}</p>
              <p className="text-sm text-muted-foreground">
                Graduated: {edu.graduationDate}
                {edu.gpa && ` • GPA: ${edu.gpa}`}
                {edu.honors && ` • ${edu.honors}`}
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => removeEducation(edu.id)}
              className="text-destructive hover:text-destructive"
            >
              Remove
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}