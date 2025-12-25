"use client";

import { useState, useEffect } from "react";
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
import { SafeNextImage } from "@/components/ui/SafeNextImage";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TiptapEditor } from "@/components/TiptapEditor";
import { ImageSelector } from "@/components/admin/ImageSelector";

interface CreatePostDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CreatePostData) => void;
  isSubmitting: boolean;
  initialData?: CreatePostData | null;
}

export interface CreatePostData {
  title: string;
  excerpt: string;
  content: string;
  category: string;
  tags: string[];
  status: "draft" | "published" | "archived";
  featuredImage?: string;
}

export function CreatePostDialog({
  open,
  onOpenChange,
  onSubmit,
  isSubmitting,
  initialData,
}: CreatePostDialogProps) {
  const [formData, setFormData] = useState<CreatePostData>({
    title: "",
    excerpt: "",
    content: "",
    category: "",
    tags: [],
    status: "draft",
    featuredImage: "",
  });
  const [tagsInput, setTagsInput] = useState("");
  const [isImageSelectorOpen, setIsImageSelectorOpen] = useState(false);

  useEffect(() => {
    if (open && initialData) {
      setFormData({
        title: initialData.title || "",
        excerpt: initialData.excerpt || "",
        content: initialData.content || "",
        category: initialData.category || "",
        tags: initialData.tags || [],
        status: initialData.status || "draft",
        featuredImage: initialData.featuredImage || "",
      });
      setTagsInput(initialData.tags ? initialData.tags.join(", ") : "");
    } else if (open && !initialData) {
      resetForm();
    }
  }, [open, initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const tagsArray = tagsInput
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean);
    onSubmit({ ...formData, tags: tagsArray });
  };

  const handleImageSelect = (imageUrl: string) => {
    setFormData({ ...formData, featuredImage: imageUrl });
    setIsImageSelectorOpen(false);
  };

  const resetForm = () => {
    setFormData({
      title: "",
      excerpt: "",
      content: "",
      category: "",
      tags: [],
      status: "draft",
      featuredImage: "",
    });
    setTagsInput("");
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      resetForm();
    }
    onOpenChange(newOpen);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{initialData ? "Edit Blog Post" : "Create New Blog Post"}</DialogTitle>
          <DialogDescription>
            {initialData ? "Edit the blog post details below." : "Create a new blog post. Fill in the details below."}
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
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
                  <SelectItem value="technology">Technology</SelectItem>
                  <SelectItem value="business">Business</SelectItem>
                  <SelectItem value="design">Design</SelectItem>
                  <SelectItem value="marketing">Marketing</SelectItem>
                  <SelectItem value="development">Development</SelectItem>
                  <SelectItem value="tutorial">Tutorial</SelectItem>
                  <SelectItem value="news">News</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
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
                onChange={(e) => setFormData({ ...formData, featuredImage: e.target.value })}
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
            {formData.featuredImage && (
              <div className="mt-2 relative h-32 w-32 overflow-hidden rounded bg-muted">
                <SafeNextImage
                  src={formData.featuredImage}
                  alt="Featured image preview"
                  fill
                  sizes="128px"
                  className="object-cover"
                />
              </div>
            )}
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

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (initialData ? "Updating..." : "Creating...") : (initialData ? "Update Post" : "Create Post")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>

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
    </>
  );
}
