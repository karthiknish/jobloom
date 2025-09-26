"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Plus,
  Edit,
  Trash2,
  Eye,
  FileText,
  BarChart3,
  TrendingUp,
  Search,
} from "lucide-react";
import { useFirebaseAuth } from "@/providers/firebase-auth-provider";
import { FeatureGate } from "../../../components/UpgradePrompt";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { TiptapEditor } from "@/components/TiptapEditor";
import { showSuccess, showError } from "@/components/ui/Toast";
import { useApiQuery, useApiMutation } from "../../../hooks/useApi";
import type { BlogPost } from "../../../types/api";

type BlogPostCreatePayload = {
  title: string;
  excerpt: string;
  content: string;
  category: string;
  tags: string[];
  status: "draft" | "published" | "archived";
};

type BlogPostUpdatePayload = Partial<BlogPostCreatePayload>;

type BlogPostPayload = {
  title: string;
  excerpt: string;
  content: string;
  category: string;
  tags: string[];
  status: "draft" | "published" | "archived";
};

export default function AdminBlogPage() {
  const { user } = useFirebaseAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
  const [newPost, setNewPost] = useState<{
    title: string;
    excerpt: string;
    content: string;
    category: string;
    tags: string;
    status: "draft" | "published" | "archived";
  }>({
    title: "",
    excerpt: "",
    content: "",
    category: "",
    tags: "",
    status: "draft",
  });

  // Fetch blog posts and stats
  const { data: posts, refetch: refetchPosts } = useApiQuery(
    () => fetch("/api/blog/admin/posts").then((res) => res.json()),
    [],
    { enabled: !!user }
  );

  const { data: stats } = useApiQuery(
    () => fetch("/api/blog/admin/stats").then((res) => res.json()),
    [],
    { enabled: !!user }
  );

  const createPostMutation = useApiMutation((data: BlogPostPayload) =>
    fetch("/api/blog/admin/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }).then((res) => res.json())
  );

  const updatePostMutation = useApiMutation(
    ({ postId, data }: { postId: string; data: Partial<BlogPostPayload> }) =>
      fetch(`/api/blog/admin/posts/${postId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }).then((res) => res.json())
  );

  const deletePostMutation = useApiMutation((postId: string) =>
    fetch(`/api/blog/admin/posts/${postId}`, {
      method: "DELETE",
    }).then((res) => res.json())
  );

  // Filter posts based on search and status
  const filteredPosts =
    posts?.filter((post: BlogPost) => {
      const matchesSearch =
        post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        post.excerpt.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus =
        statusFilter === "all" || post.status === statusFilter;

      return matchesSearch && matchesStatus;
    }) || [];

  const handleCreatePost = async () => {
    try {
      const tagsArray = newPost.tags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean);
      await createPostMutation.mutate({
        ...newPost,
        tags: tagsArray,
      });

      showSuccess("Blog post created successfully");
      setIsCreateDialogOpen(false);
      setNewPost({
        title: "",
        excerpt: "",
        content: "",
        category: "",
        tags: "",
        status: "draft",
      });
      refetchPosts();
    } catch (error) {
      showError("Failed to create blog post");
    }
  };

  const handleUpdatePost = async () => {
    if (!editingPost) return;

    try {
      const tagsArray = newPost.tags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean);
      await updatePostMutation.mutate({
        postId: editingPost._id,
        data: {
          ...newPost,
          tags: tagsArray,
        },
      });

      showSuccess("Blog post updated successfully");
      setEditingPost(null);
      setNewPost({
        title: "",
        excerpt: "",
        content: "",
        category: "",
        tags: "",
        status: "draft",
      });
      refetchPosts();
    } catch (error) {
      showError("Failed to update blog post");
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!confirm("Are you sure you want to delete this blog post?")) return;

    try {
      await deletePostMutation.mutate(postId);
      showSuccess("Blog post deleted successfully");
      refetchPosts();
    } catch (error) {
      showError("Failed to delete blog post");
    }
  };

  const handleEditPost = (post: BlogPost) => {
    setEditingPost(post);
    setNewPost({
      title: post.title,
      excerpt: post.excerpt,
      content: post.content,
      category: post.category,
      tags: post.tags.join(", "),
      status: post.status,
    });
  };

  const resetForm = () => {
    setNewPost({
      title: "",
      excerpt: "",
      content: "",
      category: "",
      tags: "",
      status: "draft",
    });
    setEditingPost(null);
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle>Please sign in as admin</CardTitle>
            <CardDescription>
              Admin access is required to manage blog posts
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-muted to-muted/80 pt-16">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8"
      >
        <FeatureGate>
          {/* Header */}
          <div className="mb-8">
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, ease: "easeOut" }}
              className="flex items-center justify-between"
            >
              <div className="flex items-center gap-4">
                <motion.div
                  initial={{ scale: 0.9, rotate: -4, opacity: 0 }}
                  animate={{ scale: 1, rotate: 0, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 240, damping: 18 }}
                  className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center"
                >
                  <FileText className="h-6 w-6 text-primary" />
                </motion.div>
                <div>
                  <h1 className="text-3xl font-bold text-foreground">
                    Blog Admin
                  </h1>
                  <p className="text-muted-foreground">
                    Manage your blog posts and content
                  </p>
                </div>
              </div>

              <Dialog
                open={isCreateDialogOpen || !!editingPost}
                onOpenChange={(open) => {
                  if (!open) {
                    setIsCreateDialogOpen(false);
                    setEditingPost(null);
                    resetForm();
                  }
                }}
              >
                <DialogTrigger asChild>
                  <Button onClick={() => setIsCreateDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    New Post
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>
                      {editingPost ? "Edit Blog Post" : "Create New Blog Post"}
                    </DialogTitle>
                    <DialogDescription>
                      {editingPost
                        ? "Update your blog post details below."
                        : "Fill in the details to create a new blog post."}
                    </DialogDescription>
                  </DialogHeader>

                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="title">Title</Label>
                      <Input
                        id="title"
                        value={newPost.title}
                        onChange={(e) =>
                          setNewPost({ ...newPost, title: e.target.value })
                        }
                        placeholder="Enter blog post title"
                      />
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="excerpt">Excerpt</Label>
                      <Textarea
                        id="excerpt"
                        value={newPost.excerpt}
                        onChange={(e) =>
                          setNewPost({ ...newPost, excerpt: e.target.value })
                        }
                        placeholder="Brief summary of the post"
                        rows={3}
                      />
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="content">Content</Label>
                      <TiptapEditor
                        content={newPost.content}
                        onChange={(content) =>
                          setNewPost({ ...newPost, content })
                        }
                        placeholder="Write your blog post content here... Use the AI button above to generate content!"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="category">Category</Label>
                        <Input
                          id="category"
                          value={newPost.category}
                          onChange={(e) =>
                            setNewPost({ ...newPost, category: e.target.value })
                          }
                          placeholder="e.g., Technology, Career Tips"
                        />
                      </div>

                      <div className="grid gap-2">
                        <Label htmlFor="status">Status</Label>
                        <Select
                          value={newPost.status}
                          onValueChange={(
                            value: "draft" | "published" | "archived"
                          ) => setNewPost({ ...newPost, status: value })}
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
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="tags">Tags</Label>
                      <Input
                        id="tags"
                        value={newPost.tags}
                        onChange={(e) =>
                          setNewPost({ ...newPost, tags: e.target.value })
                        }
                        placeholder="Comma-separated tags (e.g., react, javascript, career)"
                      />
                    </div>
                  </div>

                  <DialogFooter>
                    <Button variant="outline" onClick={resetForm}>
                      Cancel
                    </Button>
                    <Button
                      onClick={
                        editingPost ? handleUpdatePost : handleCreatePost
                      }
                      disabled={
                        !newPost.title ||
                        !newPost.content ||
                        !newPost.excerpt ||
                        !newPost.category
                      }
                    >
                      {editingPost ? "Update Post" : "Create Post"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </motion.div>
          </div>

          {/* Stats Cards */}
          {stats && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8"
            >
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Total Posts
                  </CardTitle>
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalPosts}</div>
                  <p className="text-xs text-muted-foreground">
                    {stats.publishedPosts} published
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Total Views
                  </CardTitle>
                  <Eye className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalViews}</div>
                  <p className="text-xs text-muted-foreground">
                    Across all posts
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Total Likes
                  </CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalLikes}</div>
                  <p className="text-xs text-muted-foreground">
                    Reader engagement
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Draft Posts
                  </CardTitle>
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.draftPosts}</div>
                  <p className="text-xs text-muted-foreground">
                    Ready to publish
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Filters and Search */}
          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search posts..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>

                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Posts</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                    <SelectItem value="draft">Drafts</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Posts Table */}
          <Card>
            <CardHeader>
              <CardTitle>All Blog Posts ({filteredPosts.length})</CardTitle>
              <CardDescription>
                Manage your blog posts, edit content, and track performance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Views</TableHead>
                    <TableHead>Likes</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPosts.map((post: BlogPost) => (
                    <TableRow key={post._id}>
                      <TableCell className="font-medium max-w-xs">
                        <div className="truncate" title={post.title}>
                          {post.title}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            post.status === "published"
                              ? "default"
                              : post.status === "draft"
                              ? "secondary"
                              : "outline"
                          }
                        >
                          {post.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{post.category}</TableCell>
                      <TableCell>{post.viewCount}</TableCell>
                      <TableCell>{post.likeCount}</TableCell>
                      <TableCell>
                        {new Date(post.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditPost(post)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeletePost(post._id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {filteredPosts.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  {searchTerm || statusFilter !== "all"
                    ? "No posts match your filters"
                    : "No blog posts yet. Create your first post!"}
                </div>
              )}
            </CardContent>
          </Card>
        </FeatureGate>
      </motion.div>
    </div>
  );
}
