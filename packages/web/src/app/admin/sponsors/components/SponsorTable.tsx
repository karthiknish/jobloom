"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
import { Edit, Trash2, Eye, MoreHorizontal, Building2, ExternalLink } from "lucide-react";

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
  aliases: string[];
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
}

export function SponsorTable({
  sponsors,
  selectedSponsors,
  onSelectionChange,
  onEditSponsor,
  onDeleteSponsor,
  onViewSponsor,
}: SponsorTableProps) {
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      onSelectionChange(sponsors.map((sponsor) => sponsor._id));
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

  const isAllSelected = sponsors.length > 0 && selectedSponsors.length === sponsors.length;
  const isIndeterminate = selectedSponsors.length > 0 && selectedSponsors.length < sponsors.length;

  const getSponsorshipTypeBadge = (type: string) => {
    switch (type?.toLowerCase()) {
      case "platinum":
        return "default";
      case "gold":
        return "secondary";
      case "silver":
        return "outline";
      case "bronze":
        return "outline";
      default:
        return "outline";
    }
  };

  return (
    <div className="relative w-full overflow-auto">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="w-12">
              <Checkbox
                checked={isAllSelected}
                onCheckedChange={handleSelectAll}
                aria-label="Select all"
                data-indeterminate={isIndeterminate}
              />
            </TableHead>
            <TableHead>Sponsor</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Industry</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Created</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sponsors.map((sponsor: Sponsor) => (
            <TableRow key={sponsor._id} className="hover:bg-muted/50 transition-colors">
              <TableCell>
                <Checkbox
                  checked={selectedSponsors.includes(sponsor._id)}
                  onCheckedChange={(checked) => handleSelectSponsor(sponsor._id, checked as boolean)}
                  aria-label="Select sponsor"
                />
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-3">
                  <Avatar className="h-9 w-9 border">
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {sponsor.name.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-medium">{sponsor.name}</div>
                    {sponsor.aliases.length > 0 && (
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
                  variant={getSponsorshipTypeBadge(sponsor.sponsorshipType)}
                  className="capitalize font-normal"
                >
                  {sponsor.sponsorshipType}
                </Badge>
              </TableCell>
              <TableCell>
                <span className="capitalize text-sm text-muted-foreground">{sponsor.industry || "Unknown"}</span>
              </TableCell>
              <TableCell>
                <Badge
                  variant={sponsor.isActive !== false ? "default" : "secondary"}
                  className={sponsor.isActive !== false ? "bg-green-500/15 text-green-700 hover:bg-green-500/25 dark:text-green-400 border-0" : ""}
                >
                  {sponsor.isActive !== false ? "Active" : "Inactive"}
                </Badge>
              </TableCell>
              <TableCell className="text-muted-foreground text-sm">
                {new Date(sponsor.createdAt).toLocaleDateString()}
              </TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onViewSponsor(sponsor)}>
                      <Eye className="mr-2 h-4 w-4" />
                      View Details
                    </DropdownMenuItem>
                    {sponsor.website && (
                      <DropdownMenuItem asChild>
                        <a
                          href={sponsor.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center"
                        >
                          <ExternalLink className="mr-2 h-4 w-4" />
                          Visit Website
                        </a>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem onClick={() => onEditSponsor(sponsor)}>
                      <Edit className="mr-2 h-4 w-4" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => onDeleteSponsor(sponsor._id)}
                      className="text-destructive focus:text-destructive"
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
