"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { AdminAccessDenied } from "@/components/admin/AdminAccessDenied";
import { Skeleton } from "@/components/ui/skeleton";
import { showError, showSuccess } from "@/components/ui/Toast";
import { useFirebaseAuth } from "@/providers/firebase-auth-provider";
import { useApiMutation } from "@/hooks/useApi";
import { adminApi } from "@/utils/api/admin";
import { BlogPostForm, type CreatePostData } from "../components/BlogPostForm";

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

export default function AdminBlogNewPage() {
  const router = useRouter();
  const { user } = useFirebaseAuth();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

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

  const createPostMutation = useApiMutation(async (data: CreatePostData) => {
    return adminApi.blog.createBlogPost(data);
  });

  const handleSubmit = async (data: CreatePostData) => {
    try {
      await createPostMutation.mutate(data);
      showSuccess("Post created successfully");
      router.push("/admin/blog");
    } catch {
      showError("Failed to create post");
    }
  };

  if (isAdmin === null) {
    return (
      <AdminLayout title="Create Blog Post">
        <PageSkeleton />
      </AdminLayout>
    );
  }

  if (!isAdmin) {
    return (
      <AdminLayout title="Create Blog Post">
        <AdminAccessDenied />
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Create Blog Post">
      <div className="max-w-5xl">
        <BlogPostForm
          title="Create New Blog Post"
          description="Write and publish a new blog post."
          initialData={null}
          isSubmitting={createPostMutation.loading}
          onSubmit={handleSubmit}
          onCancel={() => router.push("/admin/blog")}
          submitLabel="Create Post"
        />
      </div>
    </AdminLayout>
  );
}
