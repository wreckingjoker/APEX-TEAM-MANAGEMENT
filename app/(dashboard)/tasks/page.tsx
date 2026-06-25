import { auth } from "@/lib/auth";
import { getTasksWithAssignees } from "@/lib/sheets/tasks";
import { getAllUsers } from "@/lib/sheets/users";
import { TasksClient } from "@/components/tasks/TasksClient";
import type { Task, Profile, UserRole } from "@/types";

export default async function TasksPage() {
  const session = await auth();
  const isAdmin = session?.user.role === "admin";
  const userId = session?.user.id ?? "";

  const [tasks, users] = await Promise.all([
    getTasksWithAssignees(isAdmin ? undefined : userId),
    getAllUsers(),
  ]);

  const members: Profile[] = users.map((u) => ({
    id: u.id,
    email: u.email,
    full_name: u.full_name,
    role: u.role,
    avatar_url: u.avatar_url || null,
    created_at: u.created_at,
    updated_at: u.created_at,
  }));

  return (
    <TasksClient
      initialTasks={tasks as unknown as Task[]}
      members={members}
      role={(session?.user.role ?? "member") as UserRole}
      userId={userId}
    />
  );
}
