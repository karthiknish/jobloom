"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { motion, useScroll, useSpring } from "framer-motion";
import {
  Calendar,
  Clock,
  User,
  Tag,
  Heart,
  Share2,
  ArrowLeft,
  Eye,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { showSuccess } from "@/components/ui/Toast";
import { queryKeys } from "@/hooks/queries";
import type { BlogPost } from "../../../types/api";
import { blogApi } from "@/utils/api/blog";
import { SafeNextImage } from "@/components/ui/SafeNextImage";
import { BlogContent } from "@/components/blog/BlogContent";

export default function BlogPostPage() {
  const params = useParams();
  const rawSlug = (params as any)?.slug;
  const slug = Array.isArray(rawSlug) ? rawSlug[0] : rawSlug;
  const shouldFetchPost = typeof slug === "string" && slug.length > 0;
  const [hasLiked, setHasLiked] = useState(false);
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  // Fetch individual blog post using TanStack Query
  const { data: post, isLoading, error: postError } = useQuery({
    queryKey: queryKeys.blogs.detail(slug || ""),
    queryFn: () => blogApi.getPost(slug as string),
    enabled: shouldFetchPost,
    staleTime: 5 * 60 * 1000, // 5 minutes - blog posts are fairly static
  });

  // Fetch related posts using TanStack Query
  const { data: relatedPostsData } = useQuery({
    queryKey: ["blogs", "related", slug],
    queryFn: () => blogApi.getRelated(3),
    enabled: shouldFetchPost,
    staleTime: 5 * 60 * 1000,
  });

  const relatedPosts = relatedPostsData?.posts
    .filter((p) => p.slug !== slug)
    .slice(0, 2) || [];

  const handleLike = async () => {
    if (!post || hasLiked || typeof slug !== "string" || !slug) return;

    try {
      await blogApi.likePost(slug);

      setHasLiked(true);
      showSuccess("Thanks for liking this post!");
    } catch {
      console.error("Error liking post");
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: post?.title,
          text: post?.excerpt,
          url: window.location.href,
        });
      } catch (error) {
        // User cancelled sharing
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      showSuccess("Link copied to clipboard!");
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getReadingTime = (content?: string | null) => {
    if (!content) return 1;
    const wordsPerMinute = 200;
    const words = content.replace(/<[^>]*>/g, "").split(/\s+/).filter(Boolean).length;
    const minutes = Math.ceil(words / wordsPerMinute);
    return minutes || 1;
  };

  // If slug isn't ready yet, or the hook hasn't kicked off its first request,
  // render the skeleton instead of flashing the 404 state.
  const shouldShowInitialSkeleton = !shouldFetchPost || (!post && !isLoading && !postError);

  if (isLoading || shouldShowInitialSkeleton) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse space-y-8">
            <div className="h-8 bg-muted rounded w-3/4"></div>
            <div className="h-96 bg-muted rounded-xl w-full"></div>
            <div className="space-y-4">
              <div className="h-4 bg-muted rounded w-full"></div>
              <div className="h-4 bg-muted rounded w-full"></div>
              <div className="h-4 bg-muted rounded w-3/4"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md w-full border-dashed">
          <CardContent className="p-12 text-center">
            <div className="text-6xl mb-6">404</div>
            <h3 className="text-2xl font-bold text-foreground mb-2">
              Post Not Found
            </h3>
            <p className="text-muted-foreground mb-8">
              The article you're looking for doesn't exist or has been moved.
            </p>
            <Link href="/blog">
              <Button>Back to Blog</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Reading Progress Bar */}
      <motion.div
        className="fixed top-0 left-0 right-0 h-1 bg-primary z-50 origin-left"
        style={{ scaleX }}
      />

      {/* Back Navigation */}
      <div className="sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b border-border/50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/blog">
            <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Blog
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={handleLike} className={hasLiked ? "text-red-500" : ""}>
              <Heart className={`h-5 w-5 ${hasLiked ? "fill-current" : ""}`} />
              <span className="sr-only">{hasLiked ? "Unlike" : "Like"}</span>
            </Button>
            <Button variant="ghost" size="icon" onClick={handleShare}>
              <Share2 className="h-5 w-5" />
              <span className="sr-only">Share post</span>
            </Button>
          </div>
        </div>
      </div>

      <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Article Header */}
        <motion.header
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-12 text-center"
        >
          <div className="flex items-center justify-center gap-2 mb-6">
            <Badge variant="secondary" className="px-3 py-1 text-sm">{post.category}</Badge>
            <span className="text-muted-foreground">•</span>
            <span className="text-sm text-muted-foreground">{getReadingTime(post.content)} min read</span>
          </div>

          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6 leading-tight tracking-tight">
            {post.title}
          </h1>

          <p className="text-xl text-muted-foreground mb-8 leading-relaxed max-w-2xl mx-auto">
            {post.excerpt}
          </p>

          <div className="flex items-center justify-center gap-8 text-sm text-muted-foreground border-y border-border/50 py-6">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                {post.author.name.charAt(0)}
              </div>
              <span className="font-medium text-foreground">{post.author.name}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span>{formatDate(post.createdAt)}</span>
            </div>
            <div className="flex items-center gap-2">
              <Eye className="h-4 w-4" />
              <span>{post.viewCount} views</span>
            </div>
          </div>
        </motion.header>

        {/* Featured Image */}
        {post.featuredImage && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="mb-16 rounded-2xl overflow-hidden shadow-xl aspect-video bg-muted relative"
          >
            <SafeNextImage
              src={post.featuredImage}
              alt={post.title}
              fill
              sizes="100vw"
              className="object-cover"
              priority
            />
          </motion.div>
        )}

        {/* Article Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
        >
          <BlogContent content={post.content} />
        </motion.div>

        <Separator className="my-12" />

        {/* Tags and Share */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6 mb-16">
          <div className="flex flex-wrap gap-2">
            {post.tags.map((tag) => (
              <Badge key={tag} variant="outline" className="px-3 py-1">
                <Tag className="h-3 w-3 mr-2" />
                {tag}
              </Badge>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-muted-foreground">Share this article:</span>
            <Button variant="outline" size="icon" onClick={handleShare} className="rounded-full">
              <Share2 className="h-4 w-4" />
              <span className="sr-only">Share post</span>
            </Button>
          </div>
        </div>

        {/* Author Bio */}
        <Card className="bg-muted/30 border-none mb-16">
          <CardContent className="p-8 flex flex-col sm:flex-row items-center sm:items-start gap-6 text-center sm:text-left">
            <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center text-2xl font-bold text-primary shrink-0">
              {post.author.name.charAt(0)}
            </div>
            <div>
              <h3 className="text-xl font-bold mb-2">About {post.author.name}</h3>
              <p className="text-muted-foreground leading-relaxed">
                Content creator and industry expert sharing insights about career development, professional growth, and the future of work.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Related Posts */}
        {relatedPosts.length > 0 && (
          <div className="border-t border-border/50 pt-16">
            <h2 className="text-3xl font-bold mb-8">Read Next</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {relatedPosts.map((relatedPost) => (
                <Link key={relatedPost._id} href={`/blog/${relatedPost.slug}`} className="group block">
                  <Card className="h-full overflow-hidden border-border/50 hover:border-primary/30 hover:shadow-lg transition-all duration-300">
                    {relatedPost.featuredImage && (
                      <div className="aspect-video overflow-hidden bg-muted relative">
                        <SafeNextImage
                          src={relatedPost.featuredImage}
                          alt={relatedPost.title}
                          fill
                          sizes="(max-width: 768px) 100vw, 50vw"
                          className="object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      </div>
                    )}
                    <CardHeader className="p-6">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
                        <Badge variant="secondary" className="text-xs">{relatedPost.category}</Badge>
                        <span>{getReadingTime(relatedPost.content)} min read</span>
                      </div>
                      <h3 className="text-xl font-bold group-hover:text-primary transition-colors line-clamp-2 mb-2">
                        {relatedPost.title}
                      </h3>
                      <p className="text-muted-foreground text-sm line-clamp-2">
                        {relatedPost.excerpt}
                      </p>
                    </CardHeader>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        )}
      </article>
    </div>
  );
}
