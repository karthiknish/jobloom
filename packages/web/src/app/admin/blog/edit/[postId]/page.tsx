"use client";

import { use, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { AdminAccessDenied } from "@/components/admin/AdminAccessDenied";
import { Skeleton } from "@/components/ui/skeleton";
import { showError, showSuccess } from "@/components/ui/Toast";
import { useFirebaseAuth } from "@/providers/firebase-auth-provider";
import { queryKeys } from "@/hooks/queries";
import { adminApi } from "@/utils/api/admin";
import type { BlogPost } from "@/types/api";
import { BlogPostForm, type CreatePostData } from "../../components/BlogPostForm";

function PageSkeleton() {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-4 w-80" />
      </div>
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-[420px] w-full" />
    </div>
  );
}

export default function AdminBlogEditPage({
  params,
}: {
  params: Promise<{ postId: string }>;
}) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useFirebaseAuth();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  const { postId } = use(params);

  useEffect(() => {
    const checkAdminAccess = async () => {
      if (!user) {
        setIsAdmin(false);
        return;
      }
      try {
        const adminUser = await adminApi.verifyAdminAccess();
        setIsAdmin(adminUser.isAdmin === true);
      } catch {
        setIsAdmin(false);
      }
    };
    checkAdminAccess();
  }, [user?.uid]);

  // Fetch post using TanStack Query
  const { data: post, isLoading: postLoading } = useQuery<BlogPost>({
    queryKey: ["admin", "blog", "post", postId],
    queryFn: async () => {
      const response = await adminApi.blog.getBlogPost(postId);
      return response.post || response;
    },
    enabled: !!postId && isAdmin === true,
    staleTime: 30 * 1000,
  });

  // Update mutation
  const updatePostMutation = useMutation({
    mutationFn: async ({ data }: { data: CreatePostData }) => {
      return adminApi.blog.updateBlogPost(postId, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "blog"] });
      queryClient.invalidateQueries({ queryKey: queryKeys.blogs.all() });
    },
  });

  const initialData = useMemo<CreatePostData | null>(() => {
    if (!post) return null;
    return {
      title: post.title || "",
      excerpt: post.excerpt || "",
      content: post.content || "",
      category: post.category || "",
      tags: Array.isArray(post.tags) ? post.tags : [],
      status: (post.status as any) || "draft",
      featuredImage: post.featuredImage || "",
    };
  }, [post]);

  const handleSubmit = async (data: CreatePostData) => {
    try {
      await updatePostMutation.mutateAsync({ data });
      showSuccess("Post updated successfully");
      router.push("/admin/blog");
    } catch {
      showError("Failed to update post");
    }
  };

  if (isAdmin === null) {
    return (
      <AdminLayout title="Edit Blog Post">
        <PageSkeleton />
      </AdminLayout>
    );
  }

  if (!isAdmin) {
    return (
      <AdminLayout title="Edit Blog Post">
        <AdminAccessDenied />
      </AdminLayout>
    );
  }

  if (postLoading && !post) {
    return (
      <AdminLayout title="Edit Blog Post">
        <PageSkeleton />
      </AdminLayout>
    );
  }

  if (!post) {
    return (
      <AdminLayout title="Edit Blog Post">
        <div className="text-sm text-muted-foreground">Post not found.</div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title={`Edit: ${post.title || "Blog Post"}`}>
      <div className="max-w-5xl">
        <BlogPostForm
          title="Edit Blog Post"
          description="Update the post and save your changes."
          initialData={initialData}
          isSubmitting={updatePostMutation.isPending}
          onSubmit={handleSubmit}
          onCancel={() => router.push("/admin/blog")}
          submitLabel="Update Post"
        />
      </div>
    </AdminLayout>
  );
}
