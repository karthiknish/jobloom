"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Trash2,
  Move,
  Edit,
  ChevronDown,
  ChevronUp,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { PortfolioSection, SectionType } from "@/types/portfolio";
import { PortfolioSectionEditor } from "./PortfolioSectionEditor";

interface SectionsManagerProps {
  sections: PortfolioSection[];
  availableSectionTypes: SectionType[];
  onAddSection: (type: PortfolioSection['type']) => void;
  onRemoveSection: (sectionId: string) => void;
  onUpdateSection: (sectionId: string, updates: Partial<PortfolioSection>) => void;
  onUpdateSectionContent: (sectionId: string, content: any) => void;
}

export function SectionsManager({
  sections,
  availableSectionTypes,
  onAddSection,
  onRemoveSection,
  onUpdateSection,
  onUpdateSectionContent,
}: SectionsManagerProps) {
  const [showSectionSelector, setShowSectionSelector] = useState(false);
  const [editingSection, setEditingSection] = useState<string | null>(null);

  const sortedSections = [...sections].sort((a, b) => a.order - b.order);

  const handleMoveSection = (sectionId: string, direction: 'up' | 'down') => {
    const currentIndex = sortedSections.findIndex(s => s.id === sectionId);
    if (currentIndex === -1) return;

    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (newIndex < 0 || newIndex >= sortedSections.length) return;

    const updatedSections = [...sortedSections];
    const temp = updatedSections[currentIndex].order;
    updatedSections[currentIndex].order = updatedSections[newIndex].order;
    updatedSections[newIndex].order = temp;

    updatedSections.forEach(section => {
      onUpdateSection(section.id, { order: section.order });
    });
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <h3 className="text-xl font-semibold">Portfolio Sections</h3>
          <p className="text-base text-muted-foreground">
            Add and arrange sections to build your portfolio
          </p>
        </div>
        <Button 
          size="lg"
          onClick={() => setShowSectionSelector(true)}
          className="shadow-lg hover:shadow-xl transition-all duration-200"
        >
          <Plus className="h-5 w-5 mr-2" />
          Add Section
        </Button>
      </div>

      <SectionSelectorModal
        isOpen={showSectionSelector}
        onClose={() => setShowSectionSelector(false)}
        availableSectionTypes={availableSectionTypes}
        onAddSection={onAddSection}
      />

      <SectionsList
        sections={sortedSections}
        onMoveSection={handleMoveSection}
        onRemoveSection={onRemoveSection}
        onToggleVisibility={(sectionId, visible) => onUpdateSection(sectionId, { visible })}
        onEditSection={setEditingSection}
        editingSection={editingSection}
        onUpdateSectionContent={onUpdateSectionContent}
        availableSectionTypes={availableSectionTypes}
      />
    </div>
  );
}

interface SectionSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  availableSectionTypes: SectionType[];
  onAddSection: (type: PortfolioSection['type']) => void;
}

function SectionSelectorModal({
  isOpen,
  onClose,
  availableSectionTypes,
  onAddSection,
}: SectionSelectorModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-background rounded-2xl shadow-2xl max-w-4xl w-full max-h-[85vh] overflow-hidden border"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b bg-muted/30">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-semibold">Add New Section</h3>
                  <p className="text-base text-muted-foreground mt-1">
                    Choose a section type to enhance your portfolio
                  </p>
                </div>
                <Button variant="ghost" size="lg" onClick={onClose} className="rounded-full">
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </div>
            <ScrollArea className="max-h-[60vh]">
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {availableSectionTypes.map(sectionType => (
                  <SectionTypeCard
                    key={sectionType.id}
                    sectionType={sectionType}
                    onAdd={() => {
                      onAddSection(sectionType.type);
                      onClose();
                    }}
                  />
                ))}
              </div>
            </ScrollArea>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

interface SectionTypeCardProps {
  sectionType: SectionType;
  onAdd: () => void;
}

function SectionTypeCard({ sectionType, onAdd }: SectionTypeCardProps) {
  const isDisabled = sectionType.type === 'hero'; // Hero is always included by default

  return (
    <button
      onClick={onAdd}
      disabled={isDisabled}
      className={cn(
        "p-5 border-2 rounded-xl text-left transition-all duration-200 bg-card group",
        isDisabled
          ? "opacity-50 cursor-not-allowed border-muted"
          : "border-border hover:border-primary/50 hover:shadow-lg hover:scale-[1.02]"
      )}
    >
      <div className="flex items-start gap-4">
        <div className={cn(
          "p-3 rounded-lg transition-colors",
          isDisabled ? "bg-muted/50" : "bg-primary/10 group-hover:bg-primary/20"
        )}>
          <sectionType.icon className="h-6 w-6 text-primary" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <div className="font-semibold text-base">{sectionType.name}</div>
            {isDisabled && (
              <Badge variant="secondary" className="text-xs">Required</Badge>
            )}
          </div>
          <div className="text-sm text-muted-foreground mt-2 leading-relaxed">
            {sectionType.description}
          </div>
        </div>
      </div>
    </button>
  );
}

interface SectionsListProps {
  sections: PortfolioSection[];
  onMoveSection: (sectionId: string, direction: 'up' | 'down') => void;
  onRemoveSection: (sectionId: string) => void;
  onToggleVisibility: (sectionId: string, visible: boolean) => void;
  onEditSection: (sectionId: string | null) => void;
  editingSection: string | null;
  onUpdateSectionContent: (sectionId: string, content: any) => void;
  availableSectionTypes: SectionType[];
}

function SectionsList({
  sections,
  onMoveSection,
  onRemoveSection,
  onToggleVisibility,
  onEditSection,
  editingSection,
  onUpdateSectionContent,
  availableSectionTypes,
}: SectionsListProps) {
  return (
    <div className="space-y-4">
      {sections.map((section, index) => (
        <motion.div
          key={section.id}
          layout
          className="flex items-center gap-4 p-5 border-2 rounded-xl bg-card shadow-sm hover:shadow-md transition-all duration-200"
        >
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" className="cursor-move hover:bg-muted rounded-lg">
              <Move className="h-5 w-5" />
            </Button>
            <Switch
              checked={section.visible}
              onCheckedChange={(checked) => onToggleVisibility(section.id, checked)}
            />
          </div>

          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h4 className="font-semibold text-base">{section.title}</h4>
              <Badge variant="outline" className="text-xs font-medium px-2 py-1">
                {availableSectionTypes.find(s => s.id === section.type)?.name}
              </Badge>
              {!section.visible && (
                <Badge variant="secondary" className="text-xs">Hidden</Badge>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onMoveSection(section.id, 'up')}
              disabled={index === 0}
              className="hover:bg-muted rounded-lg"
            >
              <ChevronUp className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onMoveSection(section.id, 'down')}
              disabled={index === sections.length - 1}
              className="hover:bg-muted rounded-lg"
            >
              <ChevronDown className="h-5 w-5" />
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => onEditSection(editingSection === section.id ? null : section.id)}
              className="hover:bg-muted rounded-lg"
            >
              <Edit className="h-5 w-5" />
            </Button>
            {section.type !== 'hero' && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onRemoveSection(section.id)}
                className="text-destructive hover:text-destructive hover:bg-destructive/10 rounded-lg"
              >
                <Trash2 className="h-5 w-5" />
              </Button>
            )}
          </div>
        </motion.div>
      ))}

      <AnimatePresence>
        {editingSection && (
          <PortfolioSectionEditor
            section={sections.find(s => s.id === editingSection)!}
            onUpdate={onUpdateSectionContent}
            onClose={() => onEditSection(null)}
          />
        )}
      </AnimatePresence>

      {sections.length === 0 && (
        <Card className="border-dashed border-2 border-muted-foreground/20">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
              <Plus className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No sections yet</h3>
            <p className="text-muted-foreground mb-4">
              Start building your portfolio by adding sections
            </p>
            <Button onClick={() => {}} disabled>
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Section
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function cn(...classes: (string | undefined | null | boolean)[]): string {
  return classes.filter(Boolean).join(' ');
}
