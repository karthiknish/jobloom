import { 
  Job, 
  Application, 
  JobStats, 
  SavedView, 
  KanbanStatus, 
  DashboardView as SharedDashboardView, 
  BoardMode,
  SalaryInfo
} from "@hireall/shared";

export type ApplicationStatus = 
  | "interested"
  | "applied"
  | "interviewing"
  | "offered"
  | "rejected"
  | "withdrawn";

export type { 
  Job, 
  Application, 
  JobStats, 
  SavedView, 
  KanbanStatus, 
  BoardMode,
  SalaryInfo
};

export type DashboardView = SharedDashboardView | "feedback";