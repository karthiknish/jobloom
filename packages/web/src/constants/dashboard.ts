import { KanbanStatus } from "@/types/dashboard";

export const DASHBOARD_VIEWS = [
  { value: "dashboard", label: "Dashboard" },
  { value: "jobs", label: "Jobs" },
  { value: "analytics", label: "Analytics" },
] as const;

export const BOARD_MODES = [
  { value: "list", label: "List" },
  { value: "kanban", label: "Kanban" },
] as const;

export const KANBAN_COLUMNS: KanbanStatus[] = [
  "interested",
  "applied", 
  "offered",
  "rejected",
  "withdrawn",
];

export const STATUS_OPTIONS = [
  { value: "all", label: "All Statuses" },
  { value: "interested", label: "Interested" },
  { value: "applied", label: "Applied" },
  { value: "offered", label: "Offered" },
  { value: "rejected", label: "Rejected" },
  { value: "withdrawn", label: "Withdrawn" },
] as const;

export const STATUS_BADGE_CONFIG = {
  interested: { variant: "default" as const, color: "bg-muted text-muted-foreground" },
  applied: { variant: "secondary" as const, color: "bg-sky-100 text-sky-800" },
  offered: { variant: "secondary" as const, color: "bg-emerald-100 text-emerald-800" },
  rejected: { variant: "destructive" as const, color: "bg-red-100 text-red-800" },
  withdrawn: { variant: "secondary" as const, color: "bg-muted text-muted-foreground" },
} as const;

export const GREETING_CONFIG = {
  morning: { start: 0, end: 12, greeting: "Good morning" },
  afternoon: { start: 12, end: 18, greeting: "Good afternoon" },
  evening: { start: 18, end: 24, greeting: "Good evening" },
} as const;

export const ANALYTICS_GOALS = {
  weeklyApplications: 10,
  responseRate: 30,
} as const;