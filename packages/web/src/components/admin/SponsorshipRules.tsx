// components/admin/SponsorshipRules.tsx
import { useState } from "react";
import { useApiMutation, useApiQuery } from "../../hooks/useApi";
import { adminApi } from "../../utils/api/admin";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";

export function SponsorshipRules() {
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    jobSite: "",
    selectors: [""],
    keywords: [""],
    isActive: true
  });

  const { data: rules, refetch: refetchRules } = useApiQuery(
    () => adminApi.getAllSponsorshipRules(),
    []
  );

  const { mutate: addRule, loading: addRuleLoading } = useApiMutation(
    (variables: Record<string, unknown>) => {
      const { name, description, jobSite, selectors, keywords, isActive } = variables;
      return adminApi.addSponsorshipRule({
        name: name as string,
        description: description as string,
        jobSite: jobSite as string,
        selectors: selectors as string[],
        keywords: keywords as string[],
        isActive: isActive as boolean
      });
    }
  );

  const { mutate: updateRuleStatus } = useApiMutation(
    (variables: Record<string, unknown>) => {
      const { ruleId, isActive } = variables;
      return adminApi.updateSponsorshipRuleStatus(ruleId as string, isActive as boolean);
    }
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      [name]: value 
    }));
  };

  const addSelectorField = () => {
    setFormData(prev => ({
      ...prev,
      selectors: [...prev.selectors, ""]
    }));
  };

  const updateSelector = (index: number, value: string) => {
    const updatedSelectors = [...formData.selectors];
    updatedSelectors[index] = value;
    setFormData(prev => ({ ...prev, selectors: updatedSelectors }));
  };

  const removeSelector = (index: number) => {
    const updatedSelectors = formData.selectors.filter((_, i) => i !== index);
    setFormData(prev => ({
      ...prev,
      selectors: updatedSelectors.length > 0 ? updatedSelectors : [""]
    }));
  };

  const addKeywordField = () => {
    setFormData(prev => ({
      ...prev,
      keywords: [...prev.keywords, ""]
    }));
  };

  const updateKeyword = (index: number, value: string) => {
    const updatedKeywords = [...formData.keywords];
    updatedKeywords[index] = value;
    setFormData(prev => ({ ...prev, keywords: updatedKeywords }));
  };

  const removeKeyword = (index: number) => {
    const updatedKeywords = formData.keywords.filter((_, i) => i !== index);
    setFormData(prev => ({
      ...prev,
      keywords: updatedKeywords.length > 0 ? updatedKeywords : [""]
    }));
  };

  const handleActiveChange = (checked: boolean) => {
    setFormData(prev => ({ ...prev, isActive: checked }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await addRule({
        ...formData,
        selectors: formData.selectors.filter(s => s.trim() !== ""),
        keywords: formData.keywords.filter(k => k.trim() !== "")
      });
      
      toast.success("Sponsorship rule added successfully!");
      setShowAddForm(false);
      setFormData({
        name: "",
        description: "",
        jobSite: "",
        selectors: [""],
        keywords: [""],
        isActive: true
      });
      refetchRules();
    } catch (error) {
      toast.error("Failed to add sponsorship rule");
      console.error("Error adding rule:", error);
    }
  };

  const toggleRuleStatus = async (ruleId: string, isActive: boolean) => {
    try {
      await updateRuleStatus({ ruleId, isActive: !isActive });
      toast.success(`Rule ${!isActive ? 'activated' : 'deactivated'} successfully!`);
      refetchRules();
    } catch (error) {
      toast.error(`Failed to ${!isActive ? 'activate' : 'deactivate'} rule`);
      console.error("Error updating rule:", error);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Sponsorship Rules</CardTitle>
            <CardDescription>
              Manage rules for automatically identifying sponsored jobs.
            </CardDescription>
          </div>
          <Button onClick={() => setShowAddForm(!showAddForm)}>
            {showAddForm ? "Cancel" : "Add Rule"}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {showAddForm && (
          <div className="border rounded-lg p-6 mb-6">
            <h3 className="text-lg font-medium mb-4">Add New Rule</h3>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Rule Name</Label>
                  <Input
                    id="name"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="e.g., LinkedIn Sponsored Jobs"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="jobSite">Job Site</Label>
                  <Input
                    id="jobSite"
                    name="jobSite"
                    required
                    value={formData.jobSite}
                    onChange={handleChange}
                    placeholder="e.g., linkedin.com"
                  />
                </div>
                <div className="sm:col-span-2 space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows={2}
                    placeholder="Describe what this rule identifies"
                  />
                </div>
                <div className="sm:col-span-2 space-y-2">
                  <Label>CSS Selectors</Label>
                  <div className="space-y-3">
                    {formData.selectors.map((selector, index) => (
                      <div key={index} className="flex gap-2">
                        <Input
                          value={selector}
                          onChange={(e) => updateSelector(index, e.target.value)}
                          placeholder="e.g., .job-card-container.sponsored"
                        />
                        {formData.selectors.length > 1 && (
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => removeSelector(index)}
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
                      onClick={addSelectorField}
                    >
                      + Add another selector
                    </Button>
                  </div>
                </div>
                <div className="sm:col-span-2 space-y-2">
                  <Label>Keywords</Label>
                  <div className="space-y-3">
                    {formData.keywords.map((keyword, index) => (
                      <div key={index} className="flex gap-2">
                        <Input
                          value={keyword}
                          onChange={(e) => updateKeyword(index, e.target.value)}
                          placeholder="e.g., SPONSORED, PROMOTED"
                        />
                        {formData.keywords.length > 1 && (
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => removeKeyword(index)}
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
                      onClick={addKeywordField}
                    >
                      + Add another keyword
                    </Button>
                  </div>
                </div>
                <div className="sm:col-span-2 flex items-center space-x-2">
                  <Switch
                    id="isActive"
                    checked={formData.isActive}
                    onCheckedChange={handleActiveChange}
                  />
                  <Label htmlFor="isActive">Active</Label>
                </div>
              </div>
              <div className="flex justify-end">
                <Button type="submit" disabled={addRuleLoading}>
                  {addRuleLoading ? "Adding..." : "Add Rule"}
                </Button>
              </div>
            </form>
          </div>
        )}

        {rules && rules.length > 0 ? (
          <div className="space-y-4">
            {rules.map((rule) => (
              <div key={rule._id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <p className="text-sm font-medium text-foreground truncate">
                        {rule.name}
                      </p>
                      <Badge variant={rule.isActive ? "default" : "secondary"}>
                        {rule.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                    <div className="mt-2 flex flex-wrap items-center text-sm text-muted-foreground gap-2">
                      <span>{rule.jobSite}</span>
                      <span>•</span>
                      <span>{rule.selectors.length} selectors</span>
                      <span>•</span>
                      <span>{rule.keywords.length} keywords</span>
                    </div>
                    <div className="mt-2">
                      <p className="text-sm text-foreground">{rule.description}</p>
                    </div>
                  </div>
                  <div className="flex-shrink-0">
                    <Button
                      variant={rule.isActive ? "destructive" : "default"}
                      size="sm"
                      onClick={() => toggleRuleStatus(rule._id, rule.isActive)}
                    >
                      {rule.isActive ? 'Deactivate' : 'Activate'}
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <span className="text-4xl">📋</span>
            <h3 className="mt-2 text-sm font-medium text-foreground">No sponsorship rules yet</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Get started by adding a new rule.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}