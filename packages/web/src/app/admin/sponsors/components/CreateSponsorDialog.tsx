"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

interface CreateSponsorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CreateSponsorData) => void;
  isSubmitting: boolean;
}

export interface CreateSponsorData {
  name: string;
  aliases: string[];
  sponsorshipType: string;
  description?: string;
  website?: string;
  industry?: string;
  logo?: string;
  isActive: boolean;
}

export function CreateSponsorDialog({
  open,
  onOpenChange,
  onSubmit,
  isSubmitting,
}: CreateSponsorDialogProps) {
  const [formData, setFormData] = useState<CreateSponsorData>({
    name: "",
    aliases: [],
    sponsorshipType: "",
    description: "",
    website: "",
    industry: "",
    logo: "",
    isActive: true,
  });
  const [aliasesInput, setAliasesInput] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const aliasesArray = aliasesInput
      .split(",")
      .map((alias) => alias.trim())
      .filter(Boolean);
    onSubmit({ ...formData, aliases: aliasesArray });
  };

  const resetForm = () => {
    setFormData({
      name: "",
      aliases: [],
      sponsorshipType: "",
      description: "",
      website: "",
      industry: "",
      logo: "",
      isActive: true,
    });
    setAliasesInput("");
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      resetForm();
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create New Sponsor</DialogTitle>
          <DialogDescription>
            Add a new sponsored company to the system.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Company Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter company name"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="sponsorshipType">Sponsorship Type *</Label>
              <Select
                value={formData.sponsorshipType}
                onValueChange={(value) => setFormData({ ...formData, sponsorshipType: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select sponsorship type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="platinum">Platinum</SelectItem>
                  <SelectItem value="gold">Gold</SelectItem>
                  <SelectItem value="silver">Silver</SelectItem>
                  <SelectItem value="bronze">Bronze</SelectItem>
                  <SelectItem value="community">Community</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="aliases">Aliases</Label>
            <Input
              id="aliases"
              value={aliasesInput}
              onChange={(e) => setAliasesInput(e.target.value)}
              placeholder="Enter aliases separated by commas"
            />
            <p className="text-xs text-muted-foreground">
              Alternative names or abbreviations for the company
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="website">Website</Label>
              <Input
                id="website"
                value={formData.website || ""}
                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                placeholder="https://example.com"
                type="url"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="industry">Industry</Label>
              <Select
                value={formData.industry || ""}
                onValueChange={(value) => setFormData({ ...formData, industry: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select industry" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="technology">Technology</SelectItem>
                  <SelectItem value="finance">Finance</SelectItem>
                  <SelectItem value="healthcare">Healthcare</SelectItem>
                  <SelectItem value="education">Education</SelectItem>
                  <SelectItem value="retail">Retail</SelectItem>
                  <SelectItem value="manufacturing">Manufacturing</SelectItem>
                  <SelectItem value="consulting">Consulting</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description || ""}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Brief description of the company"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="logo">Logo URL</Label>
            <Input
              id="logo"
              value={formData.logo || ""}
              onChange={(e) => setFormData({ ...formData, logo: e.target.value })}
              placeholder="https://example.com/logo.png"
              type="url"
            />
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="isActive"
              checked={formData.isActive}
              onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
            />
            <Label htmlFor="isActive">Active Sponsor</Label>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Creating..." : "Create Sponsor"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
