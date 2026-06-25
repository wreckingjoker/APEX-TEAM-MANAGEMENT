export type UserRole = "admin" | "member";
export type TaskStatus = "pending" | "in-progress" | "done";
export type TaskPriority = "low" | "medium" | "high" | "urgent";

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  avatar_url: string | null;
  role: UserRole;
  created_at: string;
  updated_at?: string;
}

export interface Task {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  assigned_to: string | null;
  created_by: string;
  deadline: string | null;
  created_at: string;
  updated_at: string;
  assignee?: Pick<Profile, "id" | "full_name" | "avatar_url">;
  creator?: Pick<Profile, "id" | "full_name">;
}

export interface ActivityLog {
  id: string;
  user_id: string;
  task_id: string | null;
  action: string;
  old_value: string | null;
  new_value: string | null;
  created_at: string;
  user?: Pick<Profile, "id" | "full_name" | "avatar_url">;
  task?: Pick<Task, "id" | "title">;
}

export interface ApiError {
  error: string;
}

export interface ApiResponse<T> {
  data: T;
}
