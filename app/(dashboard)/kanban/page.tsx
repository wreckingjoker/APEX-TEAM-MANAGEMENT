import { auth } from "@/lib/auth";
import { getTasksWithAssignees } from "@/lib/sheets/tasks";
import { KanbanBoard } from "@/components/kanban/KanbanBoard";
import type { Task, UserRole } from "@/types";

export default async function KanbanPage() {
  const session = await auth();
  const isAdmin = session?.user.role === "admin";
  const userId = session?.user.id ?? "";

  const tasks = await getTasksWithAssignees(isAdmin ? undefined : userId);

  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-bold text-[#1A1A3E]">Kanban Board</h1>
        <p className="text-slate-500 text-sm mt-1">
          {isAdmin
            ? "Drag tasks between columns to update their status."
            : "Drag your assigned tasks to update their status."}
        </p>
      </div>

      <KanbanBoard
        initialTasks={tasks as unknown as Task[]}
        role={(session?.user.role ?? "member") as UserRole}
        userId={userId}
      />
    </div>
  );
}
