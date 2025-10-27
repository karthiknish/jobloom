"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Edit, Trash2, Eye, MoreHorizontal } from "lucide-react";
import type { BlogPost } from "@/types/api";

interface BlogTableProps {
  posts: BlogPost[];
  selectedPosts: string[];
  onSelectionChange: (selectedPosts: string[]) => void;
  onEditPost: (post: BlogPost) => void;
  onDeletePost: (postId: string) => void;
  onViewPost: (post: BlogPost) => void;
}

export function BlogTable({
  posts,
  selectedPosts,
  onSelectionChange,
  onEditPost,
  onDeletePost,
  onViewPost,
}: BlogTableProps) {
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      onSelectionChange(posts.map((post) => post._id));
    } else {
      onSelectionChange([]);
    }
  };

  const handleSelectPost = (postId: string, checked: boolean) => {
    if (checked) {
      onSelectionChange([...selectedPosts, postId]);
    } else {
      onSelectionChange(selectedPosts.filter((id) => id !== postId));
    }
  };

  const isAllSelected = posts.length > 0 && selectedPosts.length === posts.length;
  const isIndeterminate = selectedPosts.length > 0 && selectedPosts.length < posts.length;

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">
              <Checkbox
                checked={isAllSelected}
                onCheckedChange={handleSelectAll}
                aria-label="Select all"
                data-indeterminate={isIndeterminate}
              />
            </TableHead>
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
          {posts.map((post: BlogPost) => (
            <TableRow key={post._id}>
              <TableCell>
                <Checkbox
                  checked={selectedPosts.includes(post._id)}
                  onCheckedChange={(checked) => handleSelectPost(post._id, checked as boolean)}
                  aria-label="Select post"
                />
              </TableCell>
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
              <TableCell>{post.viewCount || 0}</TableCell>
              <TableCell>{post.likeCount || 0}</TableCell>
              <TableCell>
                {new Date(post.createdAt).toLocaleDateString()}
              </TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onViewPost(post)}>
                      <Eye className="mr-2 h-4 w-4" />
                      View
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onEditPost(post)}>
                      <Edit className="mr-2 h-4 w-4" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => onDeletePost(post._id)}
                      className="text-destructive"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
