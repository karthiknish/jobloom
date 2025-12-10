"use client";

import { format, formatDistanceToNow } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import type { User } from "../types";

interface RecentUsersTableProps {
    users: User[];
    title: string;
    description: string;
    isAdmin?: boolean;
}

function getInitials(name?: string, email?: string) {
    if (name) {
        return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
    }
    return email?.[0]?.toUpperCase() || "U";
}

function getStatusBadge(user: User) {
    if (user.isAdmin) {
        return <Badge variant="default" className="bg-primary/10 text-primary">Admin</Badge>;
    }
    if (user.emailVerified) {
        return <Badge variant="default" className="bg-secondary/10 text-secondary">Verified</Badge>;
    }
    return <Badge variant="secondary">Unverified</Badge>;
}

export function RecentUsersTable({ users, title, description, isAdmin = false }: RecentUsersTableProps) {
    if (users.length === 0) return null;

    return (
        <Card className="border-gray-200">
            <CardHeader>
                <CardTitle>{title}</CardTitle>
                <CardDescription>{description}</CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow className="hover:bg-transparent border-gray-100">
                            <TableHead>{isAdmin ? "Admin" : "Name"}</TableHead>
                            <TableHead>Email</TableHead>
                            {!isAdmin && <TableHead className="hidden sm:table-cell">Status</TableHead>}
                            <TableHead className="text-right">{isAdmin ? "Added" : "Joined"}</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {users.map((user) => (
                            <TableRow key={user._id} className="hover:bg-gray-50 border-gray-100">
                                <TableCell className="font-medium flex items-center gap-2">
                                    <Avatar className="h-8 w-8 border border-gray-200">
                                        <AvatarImage
                                            src={`https://www.gravatar.com/avatar/${btoa(user.email.trim().toLowerCase())}?d=identicon`}
                                            alt={user.name || user.email}
                                        />
                                        <AvatarFallback className={isAdmin ? "bg-purple-50 text-purple-600" : "bg-gray-100 text-gray-600"}>
                                            {getInitials(user.name, user.email)}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="min-w-0">
                                        <p className="truncate text-sm font-medium text-foreground">
                                            {user.name || (isAdmin ? "Unnamed Admin" : "Unnamed User")}
                                        </p>
                                        <p className="text-xs text-muted-foreground truncate">
                                            {isAdmin ? "Admin" : "Joined"} {formatDistanceToNow(user.createdAt, { addSuffix: true })}
                                        </p>
                                    </div>
                                </TableCell>
                                <TableCell className="text-muted-foreground text-sm">
                                    {user.email}
                                </TableCell>
                                {!isAdmin && (
                                    <TableCell className="hidden sm:table-cell">
                                        {getStatusBadge(user)}
                                    </TableCell>
                                )}
                                <TableCell className="text-right text-sm text-muted-foreground">
                                    {format(new Date(user.createdAt), "PP")}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}
