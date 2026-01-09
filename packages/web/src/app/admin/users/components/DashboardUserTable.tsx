"use client";

import { format } from "date-fns";
import { MoreHorizontal, Eye, Activity, Crown, UserX, Trash2, ShieldCheck, ShieldAlert, RefreshCw } from "lucide-react";
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
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { User } from "../types";

interface DashboardUserTableProps {
    users: User[];
    currentAdminId?: string;
    onViewDetails: (user: User) => void;
    onEditUser: (user: User) => void;
    onSetAdmin: (userId: string) => void;
    onRemoveAdmin: (userId: string) => void;
    onDeleteUser: (userId: string, email: string) => void;
    onRetry: () => void;
    isLoading?: boolean;
    error?: any;
    searchTerm?: string;
    statusFilter?: string;
    planFilter?: string;
    getInitials: (name?: string, email?: string) => string;
    getStatusBadge: (user: User) => React.ReactNode;
}

export function DashboardUserTable({
    users,
    currentAdminId,
    onViewDetails,
    onEditUser,
    onSetAdmin,
    onRemoveAdmin,
    onDeleteUser,
    onRetry,
    isLoading,
    error,
    searchTerm,
    statusFilter,
    planFilter,
    getInitials,
    getStatusBadge,
}: DashboardUserTableProps) {
    if (error) {
        return (
            <div className="text-center py-16 bg-red-50/30">
                <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
                    <RefreshCw className="h-6 w-6 text-red-600" />
                </div>
                <h3 className="text-lg font-bold mb-2">Failed to load users</h3>
                <p className="text-muted-foreground mb-6 max-w-xs mx-auto">
                    We encountered an error while fetching the user directory.
                </p>
                <Button variant="outline" onClick={onRetry} className="border-red-200">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Retry User List
                </Button>
            </div>
        );
    }

    return (
        <div className="rounded-lg border border-gray-200 overflow-x-auto">
            <Table className="min-w-[980px]">
                <TableHeader className="bg-gray-50">
                    <TableRow className="border-gray-200">
                        <TableHead className="font-semibold text-gray-600">User</TableHead>
                        <TableHead className="font-semibold text-gray-600">Status</TableHead>
                        <TableHead className="font-semibold text-gray-600">Plan</TableHead>
                        <TableHead className="hidden lg:table-cell font-semibold text-gray-600">
                            Verification
                        </TableHead>
                        <TableHead className="font-semibold text-gray-600">Joined</TableHead>
                        <TableHead className="font-semibold text-gray-600">Last Login</TableHead>
                        <TableHead className="text-right font-semibold text-gray-600">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {users.map((user) => (
                        <TableRow key={user._id} className="hover:bg-gray-50 transition-colors border-gray-100">
                            <TableCell>
                                <div className="flex items-center gap-3">
                                    <Avatar className="h-9 w-9 border border-gray-200">
                                        <AvatarImage src="" />
                                        <AvatarFallback className="bg-blue-50 text-blue-600 text-xs font-medium">
                                            {getInitials(user.name, user.email)}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="min-w-0 flex-1">
                                        <div className="font-medium truncate text-foreground">
                                            {user.name || "No name"}
                                        </div>
                                        <div className="text-xs text-muted-foreground truncate">{user.email}</div>
                                    </div>
                                </div>
                            </TableCell>
                            <TableCell>{getStatusBadge(user)}</TableCell>
                            <TableCell>
                                <Badge variant="outline" className="capitalize font-normal border-gray-200 text-gray-600">
                                    {user.subscriptionPlan || "free"}
                                </Badge>
                            </TableCell>
                            <TableCell className="hidden lg:table-cell">
                                {user.emailVerified ? (
                                    <div className="flex items-center gap-2 text-emerald-600">
                                        <ShieldCheck className="h-4 w-4" />
                                        <span className="text-sm font-medium">Verified</span>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2 text-amber-600">
                                        <ShieldAlert className="h-4 w-4" />
                                        <span className="text-sm font-medium">Pending</span>
                                    </div>
                                )}
                            </TableCell>
                            <TableCell>
                                <div className="text-sm text-muted-foreground">
                                    {format(new Date(user.createdAt), "PP")}
                                </div>
                            </TableCell>
                            <TableCell>
                                <div className="text-sm text-muted-foreground">
                                    {user.lastLoginAt ? format(new Date(user.lastLoginAt), "PP") : "Never"}
                                </div>
                            </TableCell>
                            <TableCell className="text-right">
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-gray-100">
                                            <MoreHorizontal className="h-4 w-4 text-gray-500" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="border-gray-200">
                                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                        <DropdownMenuItem onClick={() => onViewDetails(user)}>
                                            <Eye className="h-4 w-4 mr-2" />
                                            View Details
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => onEditUser(user)}>
                                            <Activity className="h-4 w-4 mr-2" />
                                            Edit User
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator className="bg-gray-100" />
                                        {user._id !== currentAdminId && (
                                            <>
                                                {user.isAdmin ? (
                                                    <DropdownMenuItem
                                                        onClick={() => onRemoveAdmin(user._id)}
                                                        className="text-red-600 focus:text-red-600 focus:bg-red-50"
                                                    >
                                                        <UserX className="h-4 w-4 mr-2" />
                                                        Remove Admin
                                                    </DropdownMenuItem>
                                                ) : (
                                                    <DropdownMenuItem
                                                        onClick={() => onSetAdmin(user._id)}
                                                        className="text-blue-600 focus:text-blue-600 focus:bg-blue-50"
                                                    >
                                                        <Crown className="h-4 w-4 mr-2" />
                                                        Make Admin
                                                    </DropdownMenuItem>
                                                )}
                                                <DropdownMenuSeparator className="bg-gray-100" />
                                                <DropdownMenuItem
                                                    onClick={() => onDeleteUser(user._id, user.email)}
                                                    className="text-red-600 focus:text-red-600 focus:bg-red-50"
                                                >
                                                    <Trash2 className="h-4 w-4 mr-2" />
                                                    Delete User
                                                </DropdownMenuItem>
                                            </>
                                        )}
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>

            {users.length === 0 && !error && (
                <div className="text-center py-12 text-muted-foreground bg-gray-50/50">
                    {(searchTerm || statusFilter !== "all" || planFilter !== "all")
                        ? "No users match your filters"
                        : "No users found"}
                </div>
            )}
        </div>
    );
}
