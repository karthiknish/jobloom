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
    <div className="rounded-md border border-gray-200 overflow-hidden">
      <Table>
        <TableHeader className="bg-gray-50">
          <TableRow className="hover:bg-transparent border-gray-200">
            <TableHead className="w-12">
              <Checkbox
                checked={isAllSelected}
                onCheckedChange={handleSelectAll}
                aria-label="Select all"
                data-indeterminate={isIndeterminate}
                className="border-gray-300"
              />
            </TableHead>
            <TableHead className="text-gray-600 font-medium">Title</TableHead>
            <TableHead className="text-gray-600 font-medium">Status</TableHead>
            <TableHead className="text-gray-600 font-medium">Category</TableHead>
            <TableHead className="text-gray-600 font-medium">Views</TableHead>
            <TableHead className="text-gray-600 font-medium">Likes</TableHead>
            <TableHead className="text-gray-600 font-medium">Created</TableHead>
            <TableHead className="text-right text-gray-600 font-medium">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {posts.map((post: BlogPost) => (
            <TableRow key={post._id} className="hover:bg-gray-50 transition-colors border-gray-200">
              <TableCell>
                <Checkbox
                  checked={selectedPosts.includes(post._id)}
                  onCheckedChange={(checked) => handleSelectPost(post._id, checked as boolean)}
                  aria-label="Select post"
                  className="border-gray-300"
                />
              </TableCell>
              <TableCell className="font-medium max-w-xs">
                <div className="truncate text-gray-900" title={post.title}>
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
                  className={
                    post.status === "published"
                      ? "bg-green-100 text-green-700 hover:bg-green-200 border-0"
                      : post.status === "draft"
                      ? "bg-yellow-100 text-yellow-700 hover:bg-yellow-200 border-0"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200 border-0"
                  }
                >
                  {post.status}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge variant="outline" className="font-normal border-gray-200 text-gray-600">
                  {post.category}
                </Badge>
              </TableCell>
              <TableCell className="text-gray-600">{post.viewCount || 0}</TableCell>
              <TableCell className="text-gray-600">{post.likeCount || 0}</TableCell>
              <TableCell className="text-gray-600 text-sm">
                {new Date(post.createdAt).toLocaleDateString()}
              </TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0 text-gray-500 hover:text-gray-900">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="border-gray-200">
                    <DropdownMenuItem onClick={() => onViewPost(post)} className="text-gray-700 focus:bg-gray-100">
                      <Eye className="mr-2 h-4 w-4" />
                      View
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onEditPost(post)} className="text-gray-700 focus:bg-gray-100">
                      <Edit className="mr-2 h-4 w-4" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="bg-gray-200" />
                    <DropdownMenuItem
                      onClick={() => onDeletePost(post._id)}
                      className="text-red-600 focus:text-red-700 focus:bg-red-50"
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
