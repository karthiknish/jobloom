// components/admin/AddCompanyForm.tsx
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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

interface AddCompanyFormData {
  name: string;
  aliases: string[];
  sponsorshipType: string;
  description?: string;
  website?: string;
  industry?: string;
  isActive: boolean;
}

interface AddCompanyFormProps {
  onSubmit: (data: AddCompanyFormData) => void;
  onCancel: () => void;
}

export function AddCompanyForm({ onSubmit, onCancel }: AddCompanyFormProps) {
  const [formData, setFormData] = useState({
    name: "",
    aliases: [""],
    sponsorshipType: "sponsored",
    description: "",
    website: "",
    industry: "",
    isActive: true,
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const addAliasField = () => {
    setFormData(prev => ({
      ...prev,
      aliases: [...prev.aliases, ""]
    }));
  };

  const updateAlias = (index: number, value: string) => {
    const updatedAliases = [...formData.aliases];
    updatedAliases[index] = value;
    setFormData(prev => ({ ...prev, aliases: updatedAliases }));
  };

  const removeAlias = (index: number) => {
    const updatedAliases = formData.aliases.filter((_, i) => i !== index);
    setFormData(prev => ({
      ...prev,
      aliases: updatedAliases.length > 0 ? updatedAliases : [""]
    }));
  };

  const handleSponsorshipTypeChange = (value: string) => {
    setFormData((prev) => ({ ...prev, sponsorshipType: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      aliases: formData.aliases.filter((alias) => alias.trim() !== ""),
    });
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Add New Sponsored Company</CardTitle>
        <CardDescription>Add a company to the sponsored list</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Company Name</Label>
              <Input
                id="name"
                name="name"
                required
                value={formData.name}
                onChange={handleChange}
                placeholder="e.g., Google"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="industry">Industry</Label>
              <Input
                id="industry"
                name="industry"
                value={formData.industry}
                onChange={handleChange}
                placeholder="e.g., Technology"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="website">Website</Label>
              <Input
                id="website"
                name="website"
                type="url"
                value={formData.website}
                onChange={handleChange}
                placeholder="https://company.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sponsorshipType">Sponsorship Type</Label>
              <Select
                value={formData.sponsorshipType}
                onValueChange={handleSponsorshipTypeChange}
              >
                <SelectTrigger id="sponsorshipType">
                  <SelectValue placeholder="Select sponsorship type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sponsored">Sponsored</SelectItem>
                  <SelectItem value="promoted">Promoted</SelectItem>
                  <SelectItem value="featured">Featured</SelectItem>
                  <SelectItem value="premium">Premium</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="sm:col-span-2 space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={3}
                placeholder="Why is this company marked as sponsored?"
              />
            </div>
            <div className="sm:col-span-2 space-y-2">
              <Label>Company Aliases</Label>
              <div className="space-y-3">
                {formData.aliases.map((alias, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      value={alias}
                      onChange={(e) => updateAlias(index, e.target.value)}
                      placeholder="e.g., Alphabet Inc, Google LLC"
                    />
                    {formData.aliases.length > 1 && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => removeAlias(index)}
                      >
                        Remove
                      </Button>
                    )}
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addAliasField}
                >
                  + Add another alias
                </Button>
              </div>
            </div>
          </div>
        </form>
      </CardContent>
      <CardFooter className="flex justify-end space-x-3">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={handleSubmit}>Add Sponsored Company</Button>
      </CardFooter>
    </Card>
  );
}