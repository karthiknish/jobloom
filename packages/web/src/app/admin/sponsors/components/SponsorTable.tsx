"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Edit, Trash2, Eye, MoreHorizontal, Building2, ExternalLink, ChevronLeft, ChevronRight } from "lucide-react";

interface Sponsor {
  _id: string;
  name: string;
  sponsorshipType: string;
  industry?: string;
  website?: string;
  description?: string;
  logo?: string;
  status: string;
  isActive?: boolean;
  aliases?: string[];
  createdAt: number;
  updatedAt?: number;
}

interface SponsorTableProps {
  sponsors: Sponsor[];
  selectedSponsors: string[];
  onSelectionChange: (selectedSponsors: string[]) => void;
  onEditSponsor: (sponsor: Sponsor) => void;
  onDeleteSponsor: (sponsorId: string) => void;
  onViewSponsor: (sponsor: Sponsor) => void;
  isLoading?: boolean;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  pageSize: number;
  onPageSizeChange: (size: number) => void;
  totalItems: number;
}

export function SponsorTable({
  sponsors,
  selectedSponsors,
  onSelectionChange,
  onEditSponsor,
  onDeleteSponsor,
  onViewSponsor,
  isLoading = false,
  currentPage,
  totalPages,
  onPageChange,
  pageSize,
  onPageSizeChange,
  totalItems,
}: SponsorTableProps) {
  // Removed internal pagination state

  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalItems);
  
  // sponsors prop now contains only the current page items
  const currentSponsors = sponsors; 

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      onSelectionChange(currentSponsors.map((sponsor) => sponsor._id));
    } else {
      onSelectionChange([]);
    }
  };

  const handleSelectSponsor = (sponsorId: string, checked: boolean) => {
    if (checked) {
      onSelectionChange([...selectedSponsors, sponsorId]);
    } else {
      onSelectionChange(selectedSponsors.filter((id) => id !== sponsorId));
    }
  };

  const isAllSelected = currentSponsors.length > 0 && currentSponsors.every(s => selectedSponsors.includes(s._id));
  const isIndeterminate = currentSponsors.some(s => selectedSponsors.includes(s._id)) && !isAllSelected;

  const getSponsorshipTypeBadge = (type: string) => {
    switch (type?.toLowerCase()) {
      case "platinum":
        return "bg-slate-900 text-slate-50 border-slate-900 hover:bg-slate-800";
      case "gold":
        return "bg-amber-100 text-amber-800 border-amber-200 hover:bg-amber-200";
      case "silver":
        return "bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200";
      case "bronze":
        return "bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100";
      default:
        return "outline";
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="rounded-md border border-gray-200 overflow-hidden">
          <Table>
            <TableHeader className="bg-gray-50">
              <TableRow>
                <TableHead className="w-12"><div className="h-4 w-4 bg-gray-200 rounded animate-pulse" /></TableHead>
                <TableHead><div className="h-4 w-24 bg-gray-200 rounded animate-pulse" /></TableHead>
                <TableHead><div className="h-4 w-16 bg-gray-200 rounded animate-pulse" /></TableHead>
                <TableHead><div className="h-4 w-20 bg-gray-200 rounded animate-pulse" /></TableHead>
                <TableHead><div className="h-4 w-16 bg-gray-200 rounded animate-pulse" /></TableHead>
                <TableHead><div className="h-4 w-24 bg-gray-200 rounded animate-pulse" /></TableHead>
                <TableHead className="text-right"><div className="h-4 w-8 bg-gray-200 rounded animate-pulse ml-auto" /></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[...Array(5)].map((_, i) => (
                <TableRow key={i}>
                  <TableCell><div className="h-4 w-4 bg-gray-200 rounded animate-pulse" /></TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full bg-gray-200 animate-pulse" />
                      <div className="space-y-2">
                        <div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />
                        <div className="h-3 w-20 bg-gray-200 rounded animate-pulse" />
                      </div>
                    </div>
                  </TableCell>
                  <TableCell><div className="h-5 w-16 bg-gray-200 rounded animate-pulse" /></TableCell>
                  <TableCell><div className="h-4 w-24 bg-gray-200 rounded animate-pulse" /></TableCell>
                  <TableCell><div className="h-5 w-16 bg-gray-200 rounded animate-pulse" /></TableCell>
                  <TableCell><div className="h-4 w-24 bg-gray-200 rounded animate-pulse" /></TableCell>
                  <TableCell><div className="h-8 w-8 bg-gray-200 rounded animate-pulse ml-auto" /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-md border border-gray-200 overflow-hidden">
        <Table>
          <TableHeader className="bg-gray-50">
            <TableRow className="hover:bg-transparent border-gray-200">
              <TableHead className="w-12 pl-4">
                <Checkbox
                  checked={isAllSelected}
                  onCheckedChange={handleSelectAll}
                  aria-label="Select all"
                  className="border-gray-300 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                />
              </TableHead>
              <TableHead className="font-semibold text-gray-600">Sponsor</TableHead>
              <TableHead className="font-semibold text-gray-600">Type</TableHead>
              <TableHead className="font-semibold text-gray-600">Industry</TableHead>
              <TableHead className="font-semibold text-gray-600">Status</TableHead>
              <TableHead className="font-semibold text-gray-600">Created</TableHead>
              <TableHead className="text-right font-semibold text-gray-600 pr-4">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentSponsors.map((sponsor: Sponsor) => (
              <TableRow key={sponsor._id} className="hover:bg-gray-50 transition-colors border-gray-100 group">
                <TableCell className="pl-4">
                  <Checkbox
                    checked={selectedSponsors.includes(sponsor._id)}
                    onCheckedChange={(checked) => handleSelectSponsor(sponsor._id, checked as boolean)}
                    aria-label="Select sponsor"
                    className="border-gray-300 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                  />
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-9 w-9 border border-gray-200 bg-white">
                      {sponsor.logo ? (
                        <AvatarImage src={sponsor.logo} alt={sponsor.name} />
                      ) : null}
                      <AvatarFallback className="bg-blue-50 text-blue-600 font-medium">
                        {sponsor.name.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium text-gray-900">{sponsor.name}</div>
                      {sponsor.aliases && sponsor.aliases.length > 0 && (
                        <div className="text-xs text-muted-foreground">
                          {sponsor.aliases.slice(0, 2).join(", ")}
                          {sponsor.aliases.length > 2 && "..."}
                        </div>
                      )}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className={`capitalize font-medium ${getSponsorshipTypeBadge(sponsor.sponsorshipType)}`}
                  >
                    {sponsor.sponsorshipType}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Building2 className="h-3 w-3 text-gray-400" />
                    <span className="capitalize text-sm text-gray-600">{sponsor.industry || "Unknown"}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge
                    variant={sponsor.isActive !== false ? "default" : "secondary"}
                    className={sponsor.isActive !== false 
                      ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-emerald-200" 
                      : "bg-gray-100 text-gray-600 border-gray-200"}
                  >
                    {sponsor.isActive !== false ? "Active" : "Inactive"}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {new Date(sponsor.createdAt).toLocaleDateString()}
                </TableCell>
                <TableCell className="text-right pr-4">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-gray-100 data-[state=open]:bg-gray-100">
                        <MoreHorizontal className="h-4 w-4 text-gray-500" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48 border-gray-200">
                      <DropdownMenuItem onClick={() => onViewSponsor(sponsor)} className="cursor-pointer">
                        <Eye className="mr-2 h-4 w-4 text-gray-500" />
                        View Details
                      </DropdownMenuItem>
                      {sponsor.website && (
                        <DropdownMenuItem asChild className="cursor-pointer">
                          <a
                            href={sponsor.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center"
                          >
                            <ExternalLink className="mr-2 h-4 w-4 text-gray-500" />
                            Visit Website
                          </a>
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem onClick={() => onEditSponsor(sponsor)} className="cursor-pointer">
                        <Edit className="mr-2 h-4 w-4 text-gray-500" />
                        Edit Sponsor
                      </DropdownMenuItem>
                      <DropdownMenuSeparator className="bg-gray-100" />
                      <DropdownMenuItem
                        onClick={() => onDeleteSponsor(sponsor._id)}
                        className="text-red-600 focus:text-red-600 focus:bg-red-50 cursor-pointer"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete Sponsor
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination Controls */}
      <div className="flex items-center justify-between px-2">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>Rows per page</span>
          <Select
            value={pageSize.toString()}
            onValueChange={(value) => {
              onPageSizeChange(Number(value));
              onPageChange(1);
            }}
          >
            <SelectTrigger className="h-8 w-[70px]">
              <SelectValue placeholder={pageSize.toString()} />
            </SelectTrigger>
            <SelectContent side="top">
              {[10, 20, 30, 50, 100].map((size) => (
                <SelectItem key={size} value={size.toString()}>
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span>
            {totalItems === 0 ? 0 : startIndex + 1}-{Math.min(startIndex + pageSize, totalItems)} of {totalItems}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className="h-8 w-8 p-0"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="text-sm font-medium">
            Page {currentPage} of {totalPages || 1}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages || totalPages === 0}
            className="h-8 w-8 p-0"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
