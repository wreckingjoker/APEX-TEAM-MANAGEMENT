import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getAllUsers } from "@/lib/sheets/users";
import { getAllTasks } from "@/lib/sheets/tasks";
import { MembersClient } from "@/components/members/MembersClient";
import type { Profile } from "@/types";

export default async function MembersPage() {
  const session = await auth();
  if (session?.user.role !== "admin") redirect("/dashboard");

  const [users, tasks] = await Promise.all([getAllUsers(), getAllTasks()]);

  const members: Profile[] = users.map((u) => ({
    id: u.id,
    email: u.email,
    full_name: u.full_name,
    role: u.role,
    avatar_url: u.avatar_url || null,
    created_at: u.created_at,
    updated_at: u.created_at,
  }));

  const taskCounts = tasks.map((t) => ({ assigned_to: t.assigned_to, status: t.status }));

  return (
    <MembersClient
      members={members}
      taskCounts={taskCounts}
      currentUserId={session?.user.id ?? ""}
    />
  );
}
