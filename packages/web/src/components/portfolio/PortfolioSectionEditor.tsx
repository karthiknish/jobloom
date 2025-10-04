"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import type { PortfolioSection } from "@/types/portfolio";

interface PortfolioSectionEditorProps {
  section: PortfolioSection;
  onUpdate: (sectionId: string, content: any) => void;
  onClose: () => void;
}

type SectionContent = Record<string, any>;

export function PortfolioSectionEditor({ section, onUpdate, onClose }: PortfolioSectionEditorProps) {
  const [localContent, setLocalContent] = useState<SectionContent>(section.content ?? {});

  const handleSave = () => {
    onUpdate(section.id, localContent);
    onClose();
  };

  const handleCancel = () => {
    setLocalContent(section.content ?? {});
    onClose();
  };

  const updateLocalContent = (updates: SectionContent) => {
    setLocalContent((prev: SectionContent) => ({ ...prev, ...updates }));
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: 'auto' }}
        exit={{ opacity: 0, height: 0 }}
        className="overflow-hidden"
      >
        <Card className="mt-4 shadow-lg border-0">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CardTitle className="text-lg">Edit {section.title}</CardTitle>
                <Badge variant="outline" className="text-xs">
                  {section.type}
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={handleCancel}>
                  Cancel
                </Button>
                <Button size="sm" onClick={handleSave}>
                  Save
                </Button>
                <Button variant="ghost" size="sm" onClick={onClose}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <SectionContentEditor
              section={section}
              content={localContent}
              onUpdate={updateLocalContent}
            />
          </CardContent>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
}

interface SectionContentEditorProps {
  section: PortfolioSection;
  content: any;
  onUpdate: (updates: any) => void;
}

function SectionContentEditor({ section, content, onUpdate }: SectionContentEditorProps) {
  switch (section.type) {
    case 'hero':
      return (
        <div className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="headline">Headline</Label>
            <Input
              id="headline"
              value={content.headline || ''}
              onChange={(e) => onUpdate({ headline: e.target.value })}
              placeholder="Welcome to my portfolio"
              className="h-11"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="subheadline">Subheadline</Label>
            <Textarea
              id="subheadline"
              value={content.subheadline || ''}
              onChange={(e) => onUpdate({ subheadline: e.target.value })}
              placeholder="I'm a creative professional ready to bring your ideas to life"
              rows={3}
              className="resize-none"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ctaText">CTA Button Text</Label>
            <Input
              id="ctaText"
              value={content.ctaText || ''}
              onChange={(e) => onUpdate({ ctaText: e.target.value })}
              placeholder="Get In Touch"
              className="h-11"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ctaLink">CTA Button Link</Label>
            <Input
              id="ctaLink"
              value={content.ctaLink || ''}
              onChange={(e) => onUpdate({ ctaLink: e.target.value })}
              placeholder="#contact"
              className="h-11"
            />
          </div>
        </div>
      );

    case 'about':
      return (
        <div className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="aboutContent">About Content</Label>
            <Textarea
              id="aboutContent"
              value={content.content || ''}
              onChange={(e) => onUpdate({ content: e.target.value })}
              placeholder="Tell your story here. Share your background, passions, and what drives you."
              rows={8}
              className="resize-none"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="aboutImage">Profile Image URL</Label>
            <Input
              id="aboutImage"
              value={content.image || ''}
              onChange={(e) => onUpdate({ image: e.target.value })}
              placeholder="https://example.com/image.jpg"
              className="h-11"
            />
          </div>
          <div className="space-y-2">
            <Label>Skills (comma-separated)</Label>
            <Input
              value={(content.skills || []).join(', ')}
              onChange={(e) => onUpdate({ 
                skills: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
              })}
              placeholder="React, TypeScript, Node.js, UI/UX Design"
              className="h-11"
            />
          </div>
        </div>
      );

    case 'contact':
      return (
        <div className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={content.email || ''}
              onChange={(e) => onUpdate({ email: e.target.value })}
              placeholder="your@email.com"
              className="h-11"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              value={content.phone || ''}
              onChange={(e) => onUpdate({ phone: e.target.value })}
              placeholder="+1 (555) 123-4567"
              className="h-11"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              value={content.location || ''}
              onChange={(e) => onUpdate({ location: e.target.value })}
              placeholder="San Francisco, CA"
              className="h-11"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="message">Contact Message</Label>
            <Textarea
              id="message"
              value={content.message || ''}
              onChange={(e) => onUpdate({ message: e.target.value })}
              placeholder="Let's work together!"
              rows={3}
              className="resize-none"
            />
          </div>
        </div>
      );

    case 'projects':
      return (
        <div className="space-y-6">
          <h4 className="font-medium">Projects</h4>
          {(content.items || []).map((item: any, index: number) => (
            <div key={item.id || index} className="p-4 border rounded-lg space-y-4">
              <div className="flex items-center justify-between">
                <h5 className="font-medium">Project {index + 1}</h5>
                {content.items.length > 1 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const newItems = content.items.filter((_: any, i: number) => i !== index);
                      onUpdate({ items: newItems });
                    }}
                  >
                    Remove
                  </Button>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Title</Label>
                  <Input
                    value={item.title || ''}
                    onChange={(e) => {
                      const newItems = [...content.items];
                      newItems[index] = { ...newItems[index], title: e.target.value };
                      onUpdate({ items: newItems });
                    }}
                    placeholder="Project Title"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Link</Label>
                  <Input
                    value={item.link || ''}
                    onChange={(e) => {
                      const newItems = [...content.items];
                      newItems[index] = { ...newItems[index], link: e.target.value };
                      onUpdate({ items: newItems });
                    }}
                    placeholder="https://example.com"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={item.description || ''}
                  onChange={(e) => {
                    const newItems = [...content.items];
                    newItems[index] = { ...newItems[index], description: e.target.value };
                    onUpdate({ items: newItems });
                  }}
                  placeholder="Project description"
                  rows={3}
                  className="resize-none"
                />
              </div>
              <div className="space-y-2">
                <Label>Technologies (comma-separated)</Label>
                <Input
                  value={(item.technologies || []).join(', ')}
                  onChange={(e) => {
                    const newItems = [...content.items];
                    newItems[index] = { 
                      ...newItems[index], 
                      technologies: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                    };
                    onUpdate({ items: newItems });
                  }}
                  placeholder="React, TypeScript, Node.js"
                />
              </div>
            </div>
          ))}
          <Button
            variant="outline"
            onClick={() => {
              const newItems = [...(content.items || []), {
                id: Date.now().toString(),
                title: "",
                description: "",
                technologies: [],
                link: "",
                github: "",
                featured: false
              }];
              onUpdate({ items: newItems });
            }}
          >
            Add Project
          </Button>
        </div>
      );

    case 'experience':
      return (
        <div className="space-y-6">
          <h4 className="font-medium">Work Experience</h4>
          {(content.items || []).map((item: any, index: number) => (
            <div key={item.id || index} className="p-4 border rounded-lg space-y-4">
              <div className="flex items-center justify-between">
                <h5 className="font-medium">Experience {index + 1}</h5>
                {content.items.length > 1 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const newItems = content.items.filter((_: any, i: number) => i !== index);
                      onUpdate({ items: newItems });
                    }}
                  >
                    Remove
                  </Button>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Company</Label>
                  <Input
                    value={item.company || ''}
                    onChange={(e) => {
                      const newItems = [...content.items];
                      newItems[index] = { ...newItems[index], company: e.target.value };
                      onUpdate({ items: newItems });
                    }}
                    placeholder="Company Name"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Position</Label>
                  <Input
                    value={item.position || ''}
                    onChange={(e) => {
                      const newItems = [...content.items];
                      newItems[index] = { ...newItems[index], position: e.target.value };
                      onUpdate({ items: newItems });
                    }}
                    placeholder="Job Title"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Start Date</Label>
                  <Input
                    type="month"
                    value={item.startDate || ''}
                    onChange={(e) => {
                      const newItems = [...content.items];
                      newItems[index] = { ...newItems[index], startDate: e.target.value };
                      onUpdate({ items: newItems });
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <Label>End Date</Label>
                  <Input
                    type="month"
                    value={item.endDate || ''}
                    onChange={(e) => {
                      const newItems = [...content.items];
                      newItems[index] = { ...newItems[index], endDate: e.target.value };
                      onUpdate({ items: newItems });
                    }}
                    disabled={item.current}
                  />
                </div>
                <div className="flex items-center space-x-2 pt-6">
                  <input
                    type="checkbox"
                    id={`current-${index}`}
                    checked={item.current || false}
                    onChange={(e) => {
                      const newItems = [...content.items];
                      newItems[index] = { 
                        ...newItems[index], 
                        current: e.target.checked,
                        endDate: e.target.checked ? '' : newItems[index].endDate
                      };
                      onUpdate({ items: newItems });
                    }}
                    className="rounded"
                  />
                  <Label htmlFor={`current-${index}`}>Current Position</Label>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={item.description || ''}
                  onChange={(e) => {
                    const newItems = [...content.items];
                    newItems[index] = { ...newItems[index], description: e.target.value };
                    onUpdate({ items: newItems });
                  }}
                  placeholder="Job description and responsibilities"
                  rows={4}
                  className="resize-none"
                />
              </div>
            </div>
          ))}
          <Button
            variant="outline"
            onClick={() => {
              const newItems = [...(content.items || []), {
                id: Date.now().toString(),
                company: "",
                position: "",
                location: "",
                startDate: "",
                endDate: "",
                current: false,
                description: "",
                achievements: []
              }];
              onUpdate({ items: newItems });
            }}
          >
            Add Experience
          </Button>
        </div>
      );

    default:
      return (
        <div className="text-center py-12 text-muted-foreground">
          <p className="text-lg">Editor for {section.type} sections coming soon!</p>
          <p className="text-sm mt-2">This section type will have a custom editor in a future update.</p>
        </div>
      );
  }
}
