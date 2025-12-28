"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SafeNextImage } from "@/components/ui/SafeNextImage";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { TiptapEditor } from "@/components/TiptapEditor";
import { ImageSelector } from "@/components/admin/ImageSelector";
import { Sparkles, Loader2 } from "lucide-react";
import { showError, showSuccess } from "@/components/ui/Toast";

export interface CreatePostData {
  title: string;
  excerpt: string;
  content: string;
  category: string;
  tags: string[];
  status: "draft" | "published" | "archived";
  featuredImage?: string;
}

const BLOG_CATEGORY_OPTIONS: Array<{ value: string; label: string }> = [
  { value: "technology", label: "Technology" },
  { value: "business", label: "Business" },
  { value: "design", label: "Design" },
  { value: "marketing", label: "Marketing" },
  { value: "development", label: "Development" },
  { value: "tutorial", label: "Tutorial" },
  { value: "news", label: "News" },
  { value: "remote-work", label: "Remote Work" },
  { value: "other", label: "Other" },
];

interface BlogPostFormProps {
  initialData?: CreatePostData | null;
  isSubmitting: boolean;
  onSubmit: (data: CreatePostData) => void;
  onCancel: () => void;
  submitLabel: string;
  title: string;
  description?: string;
}

export function BlogPostForm({
  initialData,
  isSubmitting,
  onSubmit,
  onCancel,
  submitLabel,
  title,
  description,
}: BlogPostFormProps) {
  const emptyData = useMemo<CreatePostData>(
    () => ({
      title: "",
      excerpt: "",
      content: "",
      category: "",
      tags: [],
      status: "draft",
      featuredImage: "",
    }),
    []
  );

  const [formData, setFormData] = useState<CreatePostData>(emptyData);
  const [tagsInput, setTagsInput] = useState("");
  const [isImageSelectorOpen, setIsImageSelectorOpen] = useState(false);
  
  // AI Agent Mode state
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [isAiGenerating, setIsAiGenerating] = useState(false);
  const [aiTopic, setAiTopic] = useState("");
  const [aiTone, setAiTone] = useState<"professional" | "casual" | "technical" | "inspirational">("professional");
  const [aiLength, setAiLength] = useState<"short" | "medium" | "long">("medium");
  const [aiContext, setAiContext] = useState("");

  useEffect(() => {
    if (initialData) {
      const normalizeCategory = (raw: unknown): string => {
        const value = String(raw ?? "").trim();
        if (!value) return "";

        const byValue = BLOG_CATEGORY_OPTIONS.find(
          (opt) => opt.value.toLowerCase() === value.toLowerCase()
        );
        if (byValue) return byValue.value;

        const byLabel = BLOG_CATEGORY_OPTIONS.find(
          (opt) => opt.label.toLowerCase() === value.toLowerCase()
        );
        if (byLabel) return byLabel.value;

        // Preserve legacy/custom category strings so they display in the Select.
        return value;
      };

      setFormData({
        title: initialData.title || "",
        excerpt: initialData.excerpt || "",
        content: initialData.content || "",
        category: normalizeCategory(initialData.category),
        tags: initialData.tags || [],
        status: initialData.status || "draft",
        featuredImage: initialData.featuredImage || "",
      });
      setTagsInput(initialData.tags?.join(", ") || "");
    } else {
      setFormData(emptyData);
      setTagsInput("");
    }
  }, [emptyData, initialData]);

  const normalizeStatus = (value: unknown): CreatePostData["status"] => {
    if (value === "draft" || value === "published" || value === "archived") {
      return value;
    }
    return "draft";
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const tagsArray = tagsInput
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean);

    onSubmit({
      ...formData,
      category: (formData.category || "").trim(),
      status: normalizeStatus(formData.status),
      tags: tagsArray,
    });
  };

  const handleImageSelect = (imageUrl: string) => {
    setFormData({ ...formData, featuredImage: imageUrl });
    setIsImageSelectorOpen(false);
  };

  // AI Agent Mode handler
  const handleAiGenerate = async () => {
    if (!aiTopic.trim()) {
      showError("Please enter a topic");
      return;
    }

    setIsAiGenerating(true);
    try {
      const response = await fetch("/api/ai/blog-generator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: aiTopic,
          tone: aiTone,
          length: aiLength,
          additionalContext: aiContext,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || "Failed to generate content");
      }

      const result = await response.json();
      const data = result.data;

      // Auto-fill form fields
      setFormData({
        ...formData,
        title: data.title || "",
        excerpt: data.excerpt || "",
        content: data.content || "",
        category: data.category || "",
        status: "draft",
      });
      setTagsInput(Array.isArray(data.tags) ? data.tags.join(", ") : "");

      showSuccess("Blog post generated!", "Review and edit the content before publishing.");
      setIsAiModalOpen(false);
      setAiTopic("");
      setAiContext("");
    } catch (error: any) {
      showError("Generation failed", error.message || "Please try again");
    } finally {
      setIsAiGenerating(false);
    }
  };

  return (
    <>
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          {description ? (
            <p className="text-sm text-muted-foreground">{description}</p>
          ) : null}
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={() => setIsAiModalOpen(true)}
          className="gap-2 bg-gradient-to-r from-violet-500/10 to-purple-500/10 border-violet-500/30 hover:border-violet-500/50 text-violet-700"
        >
          <Sparkles className="h-4 w-4" />
          AI Agent Mode
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Enter post title"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select
              value={formData.category}
              onValueChange={(value) => setFormData({ ...formData, category: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {formData.category &&
                !BLOG_CATEGORY_OPTIONS.some((opt) => opt.value === formData.category) ? (
                  <SelectItem value={formData.category}>{formData.category}</SelectItem>
                ) : null}
                {BLOG_CATEGORY_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="excerpt">Excerpt</Label>
          <Textarea
            id="excerpt"
            value={formData.excerpt}
            onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
            placeholder="Brief description of the post"
            rows={3}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="tags">Tags</Label>
          <Input
            id="tags"
            value={tagsInput}
            onChange={(e) => setTagsInput(e.target.value)}
            placeholder="Enter tags separated by commas"
          />
        </div>

        <div className="space-y-2">
          <Label>Featured Image</Label>
          <div className="flex gap-2">
            <Input
              value={formData.featuredImage || ""}
              onChange={(e) =>
                setFormData({ ...formData, featuredImage: e.target.value })
              }
              placeholder="Image URL or select from library"
              className="flex-1"
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsImageSelectorOpen(true)}
            >
              Select Image
            </Button>
          </div>
          {formData.featuredImage ? (
            <div className="mt-2 relative h-32 w-32 overflow-hidden rounded bg-muted">
              <SafeNextImage
                src={formData.featuredImage}
                alt="Featured image preview"
                fill
                sizes="128px"
                className="object-cover"
              />
            </div>
          ) : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="content">Content</Label>
          <TiptapEditor
            content={formData.content}
            onChange={(content) => setFormData({ ...formData, content })}
            placeholder="Write your blog post content here..."
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <Select
            value={formData.status}
            onValueChange={(value: "draft" | "published" | "archived") =>
              setFormData({ ...formData, status: value })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="published">Published</SelectItem>
              <SelectItem value="archived">Archived</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center justify-end gap-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : submitLabel}
          </Button>
        </div>
      </form>

      {/* Image Selector Dialog */}
      <Dialog open={isImageSelectorOpen} onOpenChange={setIsImageSelectorOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Select Featured Image</DialogTitle>
            <DialogDescription>
              Choose an image from the gallery to use as the featured image.
            </DialogDescription>
          </DialogHeader>
          <ImageSelector
            selectedImage={formData.featuredImage}
            onImageSelect={handleImageSelect}
            onClose={() => setIsImageSelectorOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* AI Agent Mode Dialog */}
      <Dialog open={isAiModalOpen} onOpenChange={setIsAiModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-violet-500" />
              AI Agent Mode
            </DialogTitle>
            <DialogDescription>
              Describe what you want to write about and AI will generate the entire blog post.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="ai-topic">Topic *</Label>
              <Input
                id="ai-topic"
                value={aiTopic}
                onChange={(e) => setAiTopic(e.target.value)}
                placeholder="e.g., Tips for acing remote job interviews"
                disabled={isAiGenerating}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tone</Label>
                <Select value={aiTone} onValueChange={(v: any) => setAiTone(v)} disabled={isAiGenerating}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="professional">Professional</SelectItem>
                    <SelectItem value="casual">Casual</SelectItem>
                    <SelectItem value="technical">Technical</SelectItem>
                    <SelectItem value="inspirational">Inspirational</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Length</Label>
                <Select value={aiLength} onValueChange={(v: any) => setAiLength(v)} disabled={isAiGenerating}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="short">Short (~500 words)</SelectItem>
                    <SelectItem value="medium">Medium (~800 words)</SelectItem>
                    <SelectItem value="long">Long (~1200 words)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="ai-context">Additional Context (optional)</Label>
              <Textarea
                id="ai-context"
                value={aiContext}
                onChange={(e) => setAiContext(e.target.value)}
                placeholder="Any specific points to include, target audience, keywords..."
                rows={3}
                disabled={isAiGenerating}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAiModalOpen(false)} disabled={isAiGenerating}>
              Cancel
            </Button>
            <Button onClick={handleAiGenerate} disabled={isAiGenerating || !aiTopic.trim()}>
              {isAiGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Generate Blog Post
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
