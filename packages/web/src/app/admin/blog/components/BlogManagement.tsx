"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useFirebaseAuth } from "@/providers/firebase-auth-provider";
import { showError, showSuccess } from "@/components/ui/Toast";
import { useApiQuery, useApiMutation } from "@/hooks/useApi";
import { adminApi } from "@/utils/api/admin";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { AdminAccessDenied } from "@/components/admin/AdminAccessDenied";
import { BlogStats } from "./BlogStats";
import { BlogFilters } from "./BlogFilters";
import { BlogTable } from "./BlogTable";
import { BlogPagination } from "./BlogPagination";
import { BulkActions } from "./BulkActions";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import type { BlogPost } from "@/types/api";
import { Skeleton } from "@/components/ui/skeleton";
import { useRouter } from "next/navigation";

function BlogManagementSkeleton() {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-9 w-64" />
          <Skeleton className="h-4 w-80" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="border-none shadow-md">
            <CardHeader className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-16" />
            </CardHeader>
          </Card>
        ))}
      </div>

      <Card className="p-4">
        <div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
          <div className="flex-1">
            <Skeleton className="h-10 w-full" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-40" />
          </div>
        </div>
      </Card>

      <Card className="overflow-hidden border-none shadow-md">
        <CardHeader className="bg-muted/30">
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent className="p-0">
          <div className="p-4 space-y-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between gap-4">
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-2/3" />
                  <Skeleton className="h-3 w-1/3" />
                </div>
                <Skeleton className="h-8 w-24" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export function BlogManagement() {
  const router = useRouter();
  const { user } = useFirebaseAuth();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [selectedPosts, setSelectedPosts] = useState<string[]>([]);

  // Confirm Dialog State
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: "",
    description: "",
    onConfirm: () => {},
  });

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
  }, [user?.uid]);

  // Fetch blog posts and stats
  const fetchPosts = useCallback(async (status?: string) => {
    const response = await adminApi.blog.getBlogPosts(status);
    return response.posts || response;
  }, []);

  const fetchStats = useCallback(async () => {
    const response = await adminApi.blog.getBlogStats();
    return response.stats || response;
  }, []);

  const {
    data: posts,
    loading: postsLoading,
    refetch: refetchPosts,
  } = useApiQuery(
    () => fetchPosts(statusFilter),
    [isAdmin, statusFilter],
    { enabled: !!user && isAdmin === true },
    "admin-blog-posts"
  );

  const {
    data: stats,
    loading: statsLoading,
  } = useApiQuery(
    fetchStats,
    [user?.uid, isAdmin],
    { enabled: !!user && isAdmin === true },
    "admin-blog-stats"
  );

  const updatePostMutation = useApiMutation(
    async ({ postId, data }: { postId: string; data: any }) => {
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

  const handleEditPost = (post: BlogPost) => {
    router.push(`/admin/blog/edit/${post._id}`);
  };

  const handleDeletePost = async (postId: string) => {
    setConfirmDialog({
      isOpen: true,
      title: "Delete Blog Post",
      description: "Are you sure you want to delete this post? This action cannot be undone.",
      onConfirm: async () => {
        try {
          await deletePostMutation.mutate(postId);
          showSuccess("Post deleted successfully");
          refetchPosts();
        } catch (error) {
          showError("Failed to delete post");
        }
      },
    });
  };

  const handleViewPost = (post: BlogPost) => {
    window.open(`/blog/${post.slug}`, "_blank");
  };

  const handleBulkDelete = async () => {
    setConfirmDialog({
      isOpen: true,
      title: "Bulk Delete Posts",
      description: `Are you sure you want to delete ${selectedPosts.length} posts? This action cannot be undone.`,
      onConfirm: async () => {
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
      },
    });
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
    return (
      <AdminLayout title="Blog Management">
        <BlogManagementSkeleton />
      </AdminLayout>
    );
  }

  if (!isAdmin) {
    return (
      <AdminLayout title="Blog Management">
        <AdminAccessDenied />
      </AdminLayout>
    );
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
    <AdminLayout title="Blog Management">
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
        {statsLoading && !stats ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i} className="border-none shadow-md">
                <CardHeader className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-8 w-16" />
                </CardHeader>
              </Card>
            ))}
          </div>
        ) : (
          <BlogStats stats={stats} />
        )}
      </motion.div>

      {/* Filters */}
      <motion.div variants={itemVariants}>
        <Card className="p-4">
          <BlogFilters
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            statusFilter={statusFilter}
            onStatusFilterChange={setStatusFilter}
            onCreatePost={() => router.push("/admin/blog/new")}
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
            {postsLoading && !posts ? (
              <div className="p-4 space-y-3">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="flex items-center justify-between gap-4">
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-2/3" />
                      <Skeleton className="h-3 w-1/3" />
                    </div>
                    <Skeleton className="h-8 w-24" />
                  </div>
                ))}
              </div>
            ) : paginatedPosts.length > 0 ? (
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

      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onOpenChange={(isOpen) => setConfirmDialog(prev => ({ ...prev, isOpen }))}
        title={confirmDialog.title}
        description={confirmDialog.description}
        onConfirm={confirmDialog.onConfirm}
        variant="destructive"
      />
    </motion.div>
    </AdminLayout>
  );
}
