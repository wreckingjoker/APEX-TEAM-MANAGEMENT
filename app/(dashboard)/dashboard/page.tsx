import { auth } from "@/lib/auth";
import { getTasksWithAssignees } from "@/lib/sheets/tasks";
import { getRecentActivity } from "@/lib/sheets/activity";
import { CheckCircle2, Clock, Loader2, ListTodo, AlertTriangle } from "lucide-react";
import { LocalTime } from "@/components/ui/LocalTime";
import type { Task, ActivityLog } from "@/types";

function StatCard({ label, value, icon, color }: { label: string; value: number; icon: React.ReactNode; color: string }) {
  return (
    <div className="apex-card p-5 flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white shrink-0 ${color}`}>
        {icon}
      </div>
      <div>
        <p className="text-sm text-slate-500">{label}</p>
        <p className="text-2xl font-bold text-[#1A1A3E]">{value}</p>
      </div>
    </div>
  );
}

const priorityColors: Record<string, string> = {
  low: "bg-slate-100 text-slate-600",
  medium: "bg-blue-50 text-blue-700",
  high: "bg-orange-50 text-orange-700",
  urgent: "bg-red-50 text-red-700",
};

export default async function DashboardPage() {
  const session = await auth();
  const isAdmin = session?.user.role === "admin";
  const userId = session?.user.id ?? "";

  const [tasksWithAssignees, activity] = await Promise.all([
    getTasksWithAssignees(isAdmin ? undefined : userId),
    getRecentActivity(10),
  ]);

  const tasks = tasksWithAssignees as unknown as Task[];

  const stats = {
    total: tasks.length,
    pending: tasks.filter((t) => t.status === "pending").length,
    inProgress: tasks.filter((t) => t.status === "in-progress").length,
    done: tasks.filter((t) => t.status === "done").length,
  };

  const now = new Date();
  const overdue = tasks.filter(
    (t) => t.deadline && new Date(t.deadline) < now && t.status !== "done"
  );

  return (
    <div className="flex flex-col gap-4 md:gap-6 p-4 md:p-6">
      <div>
        <h1 className="text-xl md:text-2xl font-bold text-[#1A1A3E]">
          Welcome back, {session?.user.name?.split(" ")[0]}
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          {isAdmin ? "Here's what's happening with your team." : "Here's your task overview."}
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Tasks" value={stats.total} icon={<ListTodo className="w-5 h-5" />} color="apex-gradient" />
        <StatCard label="Pending" value={stats.pending} icon={<Clock className="w-5 h-5" />} color="bg-slate-500" />
        <StatCard label="In Progress" value={stats.inProgress} icon={<Loader2 className="w-5 h-5" />} color="bg-[#4F7FFF]" />
        <StatCard label="Completed" value={stats.done} icon={<CheckCircle2 className="w-5 h-5" />} color="bg-emerald-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="apex-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-4 h-4 text-red-500" />
            <h2 className="font-semibold text-[#1A1A3E]">
              Overdue Tasks{" "}
              {overdue.length > 0 && (
                <span className="ml-1 px-1.5 py-0.5 rounded-full bg-red-100 text-red-700 text-xs">{overdue.length}</span>
              )}
            </h2>
          </div>
          {overdue.length === 0 ? (
            <p className="text-slate-400 text-sm">No overdue tasks. Great work!</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {overdue.slice(0, 5).map((task) => (
                <li key={task.id} className="flex items-center justify-between gap-3 py-2 border-b border-slate-50 last:border-0">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-[#1A1A3E] truncate">{task.title}</p>
                    {task.deadline && (
                      <p className="text-xs text-red-500 flex items-center gap-1">Due <LocalTime iso={task.deadline} /></p>
                    )}
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium shrink-0 ${priorityColors[task.priority]}`}>
                    {task.priority}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="apex-card p-5">
          <h2 className="font-semibold text-[#1A1A3E] mb-4">Recent Activity</h2>
          {activity.length === 0 ? (
            <p className="text-slate-400 text-sm">No activity yet.</p>
          ) : (
            <ul className="flex flex-col gap-3">
              {(activity as unknown as ActivityLog[]).map((log) => (
                <li key={log.id} className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-full apex-gradient flex items-center justify-center text-white text-xs font-bold shrink-0 mt-0.5">
                    {log.user?.full_name?.charAt(0).toUpperCase() ?? "?"}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm text-slate-700">
                      <span className="font-medium">{log.user?.full_name}</span>{" "}
                      {log.action}{" "}
                      {log.task && <span className="font-medium">{log.task.title}</span>}
                    </p>
                    <LocalTime iso={log.created_at} className="text-xs text-slate-400" />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
