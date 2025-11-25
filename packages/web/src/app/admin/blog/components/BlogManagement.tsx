"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useFirebaseAuth } from "@/providers/firebase-auth-provider";
import { showError, showSuccess } from "@/components/ui/Toast";
import { useApiQuery, useApiMutation } from "@/hooks/useApi";
import { adminApi } from "@/utils/api/admin";
import { AdminAccessDenied } from "@/components/admin/AdminAccessDenied";
import { BlogStats } from "./BlogStats";
import { BlogFilters } from "./BlogFilters";
import { BlogTable } from "./BlogTable";
import { BlogPagination } from "./BlogPagination";
import { BulkActions } from "./BulkActions";
import { CreatePostDialog, type CreatePostData } from "./CreatePostDialog";
import type { BlogPost } from "@/types/api";

export function BlogManagement() {
  const { user } = useFirebaseAuth();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [selectedPosts, setSelectedPosts] = useState<string[]>([]);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);

  // Check admin access
  useEffect(() => {
    const checkAdminAccess = async () => {
      if (!user) {
        setIsAdmin(false);
        return;
      }
      try {
        const adminUser = await adminApi.verifyAdminAccess();
        setIsAdmin(adminUser.isAdmin === true);
      } catch (error) {
        setIsAdmin(false);
      }
    };
    checkAdminAccess();
  }, [user]);

  // Fetch blog posts and stats
  const fetchPosts = useCallback(async (status?: string) => {
    const response = await adminApi.blog.getBlogPosts(status);
    return response.posts || response;
  }, []);

  const fetchStats = useCallback(async () => {
    const response = await adminApi.blog.getBlogStats();
    return response.stats || response;
  }, []);

  const { data: posts, refetch: refetchPosts } = useApiQuery(
    () => fetchPosts(statusFilter),
    [isAdmin, statusFilter],
    { enabled: !!user && isAdmin === true },
    "admin-blog-posts"
  );

  const { data: stats } = useApiQuery(
    fetchStats,
    [user?.uid, isAdmin],
    { enabled: !!user && isAdmin === true },
    "admin-blog-stats"
  );

  // Mutations
  const createPostMutation = useApiMutation(async (data: CreatePostData) => {
    return adminApi.blog.createBlogPost(data);
  });

  const updatePostMutation = useApiMutation(
    async ({ postId, data }: { postId: string; data: Partial<CreatePostData> }) => {
      return adminApi.blog.updateBlogPost(postId, data);
    }
  );

  const deletePostMutation = useApiMutation(async (postId: string) => {
    return adminApi.blog.deleteBlogPost(postId);
  });

  // Filter and paginate posts
  const filteredPosts = Array.isArray(posts)
    ? posts.filter((post: BlogPost) => {
        const matchesSearch =
          post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          post.excerpt.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === "all" || post.status === statusFilter;
        return matchesSearch && matchesStatus;
      })
    : [];

  const totalPages = Math.ceil(filteredPosts.length / pageSize);
  const paginatedPosts = filteredPosts.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
    setSelectedPosts([]);
  }, [searchTerm, statusFilter]);

  // Handlers
  const handleCreatePost = async (data: CreatePostData) => {
    try {
      if (editingPost) {
        await updatePostMutation.mutate({ postId: editingPost._id, data });
        showSuccess("Post updated successfully");
      } else {
        await createPostMutation.mutate(data);
        showSuccess("Post created successfully");
      }
      setIsCreateDialogOpen(false);
      setEditingPost(null);
      refetchPosts();
    } catch (error) {
      showError(editingPost ? "Failed to update post" : "Failed to create post");
    }
  };

  const handleEditPost = (post: BlogPost) => {
    setEditingPost(post);
    setIsCreateDialogOpen(true);
  };

  const handleDeletePost = async (postId: string) => {
    if (confirm("Are you sure you want to delete this post?")) {
      try {
        await deletePostMutation.mutate(postId);
        showSuccess("Post deleted successfully");
        refetchPosts();
      } catch (error) {
        showError("Failed to delete post");
      }
    }
  };

  const handleViewPost = (post: BlogPost) => {
    window.open(`/blog/${post.slug}`, "_blank");
  };

  const handleBulkDelete = async () => {
    if (confirm(`Are you sure you want to delete ${selectedPosts.length} posts?`)) {
      try {
        await Promise.all(
          selectedPosts.map((postId) => deletePostMutation.mutate(postId))
        );
        showSuccess("Posts deleted successfully");
        setSelectedPosts([]);
        refetchPosts();
      } catch (error) {
        showError("Failed to delete posts");
      }
    }
  };

  const handleBulkArchive = async () => {
    try {
      await Promise.all(
        selectedPosts.map((postId) =>
          updatePostMutation.mutate({ postId, data: { status: "archived" } })
        )
      );
      showSuccess("Posts archived successfully");
      setSelectedPosts([]);
      refetchPosts();
    } catch (error) {
      showError("Failed to archive posts");
    }
  };

  const handleBulkPublish = async () => {
    try {
      await Promise.all(
        selectedPosts.map((postId) =>
          updatePostMutation.mutate({ postId, data: { status: "published" } })
        )
      );
      showSuccess("Posts published successfully");
      setSelectedPosts([]);
      refetchPosts();
    } catch (error) {
      showError("Failed to publish posts");
    }
  };

  const handleBulkDraft = async () => {
    try {
      await Promise.all(
        selectedPosts.map((postId) =>
          updatePostMutation.mutate({ postId, data: { status: "draft" } })
        )
      );
      showSuccess("Posts set to draft successfully");
      setSelectedPosts([]);
      refetchPosts();
    } catch (error) {
      showError("Failed to update posts");
    }
  };

  if (isAdmin === null) {
    return <div>Loading...</div>;
  }

  if (!isAdmin) {
    return <AdminAccessDenied />;
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-8"
    >
      <motion.div variants={itemVariants} className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Blog Management</h1>
          <p className="text-muted-foreground mt-2">
            Manage your blog posts, content, and analytics
          </p>
        </div>
      </motion.div>

      {/* Stats Cards */}
      <motion.div variants={itemVariants}>
        <BlogStats stats={stats} />
      </motion.div>

      {/* Filters */}
      <motion.div variants={itemVariants}>
        <Card className="p-4">
          <BlogFilters
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            statusFilter={statusFilter}
            onStatusFilterChange={setStatusFilter}
            onCreatePost={() => setIsCreateDialogOpen(true)}
            selectedCount={selectedPosts.length}
            onClearSelection={() => setSelectedPosts([])}
          />
        </Card>
      </motion.div>

      {/* Bulk Actions */}
      {selectedPosts.length > 0 && (
        <motion.div variants={itemVariants}>
          <BulkActions
            selectedCount={selectedPosts.length}
            onBulkDelete={handleBulkDelete}
            onBulkArchive={handleBulkArchive}
            onBulkPublish={handleBulkPublish}
            onBulkDraft={handleBulkDraft}
          />
        </motion.div>
      )}

      {/* Posts Table */}
      <motion.div variants={itemVariants}>
        <Card className="overflow-hidden border-none shadow-md">
          <CardHeader className="bg-muted/30">
            <CardTitle>Blog Posts</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {paginatedPosts.length > 0 ? (
              <>
                <BlogTable
                  posts={paginatedPosts}
                  selectedPosts={selectedPosts}
                  onSelectionChange={setSelectedPosts}
                  onEditPost={handleEditPost}
                  onDeletePost={handleDeletePost}
                  onViewPost={handleViewPost}
                />
                <div className="p-4 border-t">
                  <BlogPagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    totalItems={filteredPosts.length}
                    pageSize={pageSize}
                    onPageChange={setCurrentPage}
                  />
                </div>
              </>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                {searchTerm || statusFilter !== "all"
                  ? "No posts match your filters"
                  : "No blog posts yet. Create your first post!"}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Create Post Dialog */}
      <CreatePostDialog
        open={isCreateDialogOpen}
        onOpenChange={(open) => {
          setIsCreateDialogOpen(open);
          if (!open) setEditingPost(null);
        }}
        onSubmit={handleCreatePost}
        isSubmitting={createPostMutation.loading || updatePostMutation.loading}
        initialData={editingPost}
      />
    </motion.div>
  );
}
