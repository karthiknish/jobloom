'use client';

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ResumeData } from '../types';

interface LanguagesFormProps {
  languages: ResumeData['languages'];
  setLanguages: (languages: ResumeData['languages']) => void;
}

const PROFICIENCY_LEVELS = [
  'Beginner',
  'Elementary',
  'Intermediate',
  'Upper Intermediate',
  'Advanced',
  'Proficient',
  'Native'
];

export default function LanguagesForm({ languages, setLanguages }: LanguagesFormProps) {
  const [newLanguage, setNewLanguage] = useState({
    language: '',
    proficiency: 'Intermediate'
  });

  const addLanguage = () => {
    if (newLanguage.language) {
      const language = {
        id: Date.now().toString(),
        language: newLanguage.language,
        proficiency: newLanguage.proficiency
      };
      setLanguages([...(languages || []), language]);
      setNewLanguage({
        language: '',
        proficiency: 'Intermediate'
      });
    }
  };

  const removeLanguage = (id: string) => {
    setLanguages((languages || []).filter(lang => lang.id !== id));
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Languages</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="language">Language</Label>
          <Input
            id="language"
            type="text"
            placeholder="Language"
            value={newLanguage.language}
            onChange={(e) => setNewLanguage({ ...newLanguage, language: e.target.value })}
          />
        </div>
        <div>
          <Label htmlFor="proficiency">Proficiency</Label>
          <Select
            value={newLanguage.proficiency}
            onValueChange={(value) => setNewLanguage({ ...newLanguage, proficiency: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select proficiency" />
            </SelectTrigger>
            <SelectContent>
              {PROFICIENCY_LEVELS.map(level => (
                <SelectItem key={level} value={level}>{level}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <Button
        type="button"
        onClick={addLanguage}
      >
        Add Language
      </Button>

      {(languages || []).map((lang) => (
        <div key={lang.id} className="p-4 border rounded-md">
          <div className="flex justify-between items-center">
            <div>
              <h4 className="font-medium">{lang.language}</h4>
              <p className="text-muted-foreground">{lang.proficiency}</p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => removeLanguage(lang.id)}
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