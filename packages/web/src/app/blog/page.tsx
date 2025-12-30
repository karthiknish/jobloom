"use client";

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { SkeletonGrid } from "@/components/ui/loading-skeleton";
import { motion } from "framer-motion";
import {
  Calendar,
  Clock,
  User,
  Tag,
  Search,
  Filter,
  Eye,
  Heart,
  ArrowRight,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { SafeNextImage } from "@/components/ui/SafeNextImage";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { queryKeys, fetchApi } from "@/hooks/queries";
import type { BlogPost } from "../../types/api";
import { cn } from "@/lib/utils";

interface BlogPostWithPagination {
  posts: BlogPost[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export default function BlogPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  // Fetch blog posts using TanStack Query
  const { data, isLoading, refetch } = useQuery({
    queryKey: queryKeys.blogs.list({ 
      page: currentPage, 
      search: searchTerm, 
      category: selectedCategory 
    }),
    queryFn: async () => {
      const params = new URLSearchParams();
      params.set("page", String(currentPage));
      params.set("limit", "9");
      if (searchTerm) params.set("search", searchTerm);
      if (selectedCategory) params.set("category", selectedCategory);
      
      const response = await fetch(`/api/blog/posts?${params.toString()}`);
      const json = await response.json();
      // withApi wraps responses as { success, data, meta }
      return (json?.data ?? json) as BlogPostWithPagination;
    },
    staleTime: 30 * 1000, // 30 seconds
  });

  const posts = data?.posts || [];
  const pagination = data?.pagination;
  const featuredPost = posts.length > 0 && currentPage === 1 && !searchTerm && !selectedCategory ? posts[0] : null;
  const gridPosts = featuredPost ? posts.slice(1) : posts;

  // Get unique categories
  const categories = Array.from(
    new Set(posts.map((post) => post.category).filter(Boolean))
  );

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedCategory]);

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

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="relative bg-muted/30 border-b border-border/50 overflow-hidden">
        <div className="absolute inset-0 bg-grid-black/[0.02]" />
        <div className="max-w-7xl mx-auto py-20 px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-3xl mx-auto"
          >
            <Badge variant="outline" className="mb-4 px-3 py-1 border-primary/20 bg-primary/5 text-primary">
              <Sparkles className="w-3 h-3 mr-2" />
              Career Insights & Tips
            </Badge>
            <h1 className="text-4xl font-bold sm:text-5xl lg:text-6xl tracking-tight mb-6 text-foreground">
              The HireAll Blog
            </h1>
            <p className="text-xl text-muted-foreground leading-relaxed">
              Expert advice, industry trends, and success stories to help you navigate your professional journey with confidence.
            </p>
          </motion.div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        {/* Search and Filters */}
        <div className="sticky top-16 z-20 bg-background/80 backdrop-blur-md py-4 -mx-4 px-4 mb-8 border-b border-border/50">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between max-w-7xl mx-auto">
            <div className="flex flex-col sm:flex-row gap-4 flex-1 w-full sm:w-auto">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search articles..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 bg-muted/50 border-muted-foreground/20 focus:bg-background transition-colors"
                />
              </div>

              <Select
                value={selectedCategory ?? "__all__"}
                onValueChange={(value) =>
                  setSelectedCategory(value === "__all__" ? null : value)
                }
              >
                <SelectTrigger className="w-full sm:w-[200px] bg-muted/50 border-muted-foreground/20">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">All Categories</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="text-sm text-muted-foreground font-medium hidden sm:block">
              {pagination && `${pagination.total} articles`}
            </div>
          </div>
        </div>

        {isLoading ? (
          <SkeletonGrid items={6} />
        ) : posts.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-24 bg-muted/30 rounded-3xl border border-dashed border-muted-foreground/20"
          >
            <div className="text-6xl mb-6"><Search className="w-16 h-16 mx-auto text-muted-foreground" /></div>
            <h3 className="text-2xl font-semibold text-foreground mb-2">
              No articles found
            </h3>
            <p className="text-muted-foreground mb-8 max-w-md mx-auto">
              We couldn't find any articles matching your search. Try adjusting your filters or search terms.
            </p>
            {(searchTerm || selectedCategory) && (
              <Button
                variant="outline"
                onClick={() => {
                  setSearchTerm("");
                  setSelectedCategory(null);
                }}
              >
                Clear Filters
              </Button>
            )}
          </motion.div>
        ) : (
          <>
            {/* Featured Post */}
            {featuredPost && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-16"
              >
                <Link href={`/blog/${featuredPost.slug}`} className="group block">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center bg-card rounded-3xl overflow-hidden border border-border/50 shadow-sm hover:shadow-md transition-all duration-300">
                    <div className="aspect-video lg:aspect-square lg:h-full overflow-hidden relative">
                      {featuredPost.featuredImage ? (
                        <SafeNextImage
                          src={featuredPost.featuredImage}
                          alt={featuredPost.title}
                          fill
                          sizes="(max-width: 1024px) 100vw, 50vw"
                          className="object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full bg-muted flex items-center justify-center">
                          <TrendingUp className="h-16 w-16 text-muted-foreground/30" />
                        </div>
                      )}
                      <div className="absolute top-4 left-4">
                        <Badge className="bg-primary text-primary-foreground hover:bg-primary/90">
                          Featured
                        </Badge>
                      </div>
                    </div>
                    <div className="p-8 lg:p-12 flex flex-col justify-center">
                      <div className="flex items-center gap-3 text-sm text-muted-foreground mb-4">
                        <Badge variant="secondary" className="rounded-full px-3">
                          {featuredPost.category}
                        </Badge>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" />
                          {getReadingTime(featuredPost.content)} min read
                        </span>
                      </div>
                      <h2 className="text-3xl sm:text-4xl font-bold mb-4 group-hover:text-primary transition-colors leading-tight">
                        {featuredPost.title}
                      </h2>
                      <p className="text-lg text-muted-foreground mb-6 line-clamp-3">
                        {featuredPost.excerpt}
                      </p>
                      <div className="flex items-center justify-between mt-auto pt-6 border-t border-border/50">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
                            {featuredPost.author.name.charAt(0)}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-foreground">{featuredPost.author.name}</p>
                            <p className="text-xs text-muted-foreground">{formatDate(featuredPost.createdAt)}</p>
                          </div>
                        </div>
                        <span className="text-primary font-medium flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                          Read Article <ArrowRight className="h-4 w-4" />
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            )}

            {/* Blog Posts Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
              {gridPosts.map((post, index) => (
                <motion.div
                  key={post._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05, duration: 0.5 }}
                >
                  <Link href={`/blog/${post.slug}`} className="group h-full block">
                    <Card className="h-full flex flex-col overflow-hidden border-border/50 hover:border-primary/30 hover:shadow-lg transition-all duration-300 bg-card">
                      <div className="aspect-video overflow-hidden relative bg-muted">
                        {post.featuredImage ? (
                          <SafeNextImage
                            src={post.featuredImage}
                            alt={post.title}
                            fill
                            sizes="(max-width: 1024px) 100vw, 33vw"
                            className="object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <TrendingUp className="h-12 w-12 text-muted-foreground/30" />
                          </div>
                        )}
                        <div className="absolute top-3 left-3">
                          <Badge variant="secondary" className="bg-background/80 backdrop-blur-sm hover:bg-background">
                            {post.category}
                          </Badge>
                        </div>
                      </div>
                      
                      <CardHeader className="pb-3 pt-5">
                        <h3 className="text-xl font-bold text-foreground group-hover:text-primary transition-colors line-clamp-2 mb-2">
                          {post.title}
                        </h3>
                        <p className="text-muted-foreground text-sm line-clamp-2 leading-relaxed">
                          {post.excerpt}
                        </p>
                      </CardHeader>

                      <CardContent className="py-0 flex-grow">
                        {/* Spacer */}
                      </CardContent>

                      <CardFooter className="pt-4 pb-5 border-t border-border/30 mt-4 flex items-center justify-between text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-3.5 w-3.5" />
                          {formatDate(post.createdAt)}
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1">
                            <Eye className="h-3.5 w-3.5" />
                            {post.viewCount}
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5" />
                            {getReadingTime(post.content)}m
                          </div>
                        </div>
                      </CardFooter>
                    </Card>
                  </Link>
                </motion.div>
              ))}
            </div>

            {/* Pagination */}
            {pagination && pagination.pages > 1 && (
              <div className="flex justify-center items-center gap-2 py-8 border-t border-border/50">
                <Button
                  variant="outline"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(currentPage - 1)}
                  className="w-24"
                >
                  Previous
                </Button>

                <div className="flex gap-1 mx-4">
                  {Array.from({ length: pagination.pages }, (_, i) => i + 1)
                    .filter((page) => {
                      return (
                        page === 1 ||
                        page === pagination.pages ||
                        Math.abs(page - currentPage) <= 1
                      );
                    })
                    .map((page, index, array) => (
                      <div key={page} className="flex items-center">
                        {index > 0 && array[index - 1] !== page - 1 && (
                          <span className="px-2 text-muted-foreground">...</span>
                        )}
                        <Button
                          variant={page === currentPage ? "default" : "ghost"}
                          size="sm"
                          onClick={() => setCurrentPage(page)}
                          className={cn(
                            "w-9 h-9 rounded-full p-0",
                            page === currentPage ? "bg-primary text-primary-foreground" : "text-muted-foreground"
                          )}
                        >
                          {page}
                        </Button>
                      </div>
                    ))}
                </div>

                <Button
                  variant="outline"
                  disabled={currentPage === pagination.pages}
                  onClick={() => setCurrentPage(currentPage + 1)}
                  className="w-24"
                >
                  Next
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
