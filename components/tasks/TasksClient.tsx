"use client";

import { useState } from "react";
import { TaskModal } from "./TaskModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Search, Calendar, Trash2 } from "lucide-react";
import type { Task, Profile, TaskStatus, UserRole } from "@/types";

const statusStyles: Record<string, string> = {
  pending: "bg-slate-100 text-slate-700",
  "in-progress": "bg-blue-50 text-blue-700",
  done: "bg-emerald-50 text-emerald-700",
};

const priorityStyles: Record<string, string> = {
  low: "bg-slate-100 text-slate-600",
  medium: "bg-blue-50 text-blue-700",
  high: "bg-orange-50 text-orange-700",
  urgent: "bg-red-50 text-red-700",
};

interface TasksClientProps {
  initialTasks: Task[];
  members: Profile[];
  role: UserRole;
  userId: string;
}

export function TasksClient({ initialTasks, members, role, userId }: TasksClientProps) {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [showModal, setShowModal] = useState(false);

  const isAdmin = role === "admin";

  async function handleStatusChange(taskId: string, newStatus: TaskStatus) {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;
    if (!isAdmin && task.assigned_to !== userId) return;

    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t)));

    const res = await fetch(`/api/tasks/${taskId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });

    if (!res.ok) {
      setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, status: task.status } : t)));
    }
  }

  async function handleDelete(taskId: string) {
    if (!isAdmin) return;
    if (!confirm("Delete this task? This cannot be undone.")) return;
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
    await fetch(`/api/tasks/${taskId}`, { method: "DELETE" });
  }

  function reloadTasks() {
    fetch("/api/tasks")
      .then((r) => r.json())
      .then(({ data }) => { if (data) setTasks(data); });
  }

  const filtered = tasks.filter((t) => {
    if (search && !t.title.toLowerCase().includes(search.toLowerCase())) return false;
    if (statusFilter !== "all" && t.status !== statusFilter) return false;
    if (priorityFilter !== "all" && t.priority !== priorityFilter) return false;
    return true;
  });

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1A1A3E]">Tasks</h1>
          <p className="text-slate-500 text-sm mt-1">{filtered.length} of {tasks.length} tasks</p>
        </div>
        {isAdmin && (
          <Button onClick={() => setShowModal(true)} className="apex-gradient text-white border-0 hover:opacity-90 gap-2">
            <Plus className="w-4 h-4" />New Task
          </Button>
        )}
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input placeholder="Search tasks…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={statusFilter} onValueChange={(v) => v && setStatusFilter(v)}>
          <SelectTrigger className="w-40"><SelectValue placeholder="All statuses" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="in-progress">In Progress</SelectItem>
            <SelectItem value="done">Done</SelectItem>
          </SelectContent>
        </Select>
        <Select value={priorityFilter} onValueChange={(v) => v && setPriorityFilter(v)}>
          <SelectTrigger className="w-40"><SelectValue placeholder="All priorities" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All priorities</SelectItem>
            <SelectItem value="low">Low</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="urgent">Urgent</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="apex-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50">
              <TableHead className="font-semibold text-[#1A1A3E]">Task</TableHead>
              <TableHead className="font-semibold text-[#1A1A3E]">Assignee</TableHead>
              <TableHead className="font-semibold text-[#1A1A3E]">Priority</TableHead>
              <TableHead className="font-semibold text-[#1A1A3E]">Status</TableHead>
              <TableHead className="font-semibold text-[#1A1A3E]">Deadline</TableHead>
              {isAdmin && <TableHead />}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={isAdmin ? 6 : 5} className="text-center text-slate-400 py-12">No tasks found.</TableCell>
              </TableRow>
            ) : (
              filtered.map((task) => {
                const isOverdue = task.deadline && new Date(task.deadline) < new Date() && task.status !== "done";
                const canUpdateStatus = isAdmin || task.assigned_to === userId;
                return (
                  <TableRow key={task.id} className="hover:bg-slate-50">
                    <TableCell>
                      <div>
                        <p className="font-medium text-[#1A1A3E] text-sm">{task.title}</p>
                        {task.description && (
                          <p className="text-slate-400 text-xs line-clamp-1 mt-0.5">{task.description}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {task.assignee ? (
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full apex-gradient flex items-center justify-center text-white text-[10px] font-bold">
                            {task.assignee.full_name.charAt(0).toUpperCase()}
                          </div>
                          <span className="text-sm text-slate-700">{task.assignee.full_name}</span>
                        </div>
                      ) : (
                        <span className="text-slate-400 text-sm">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${priorityStyles[task.priority]}`}>
                        {task.priority}
                      </span>
                    </TableCell>
                    <TableCell>
                      {canUpdateStatus ? (
                        <Select value={task.status} onValueChange={(v) => v && handleStatusChange(task.id, v as TaskStatus)}>
                          <SelectTrigger className="w-36 h-7 text-xs"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="in-progress">In Progress</SelectItem>
                            <SelectItem value="done">Done</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusStyles[task.status]}`}>
                          {task.status}
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      {task.deadline ? (
                        <span className={`flex items-center gap-1 text-xs ${isOverdue ? "text-red-500" : "text-slate-500"}`}>
                          <Calendar className="w-3 h-3" />
                          {new Date(task.deadline).toLocaleDateString("en-US")}
                        </span>
                      ) : (
                        <span className="text-slate-400 text-xs">—</span>
                      )}
                    </TableCell>
                    {isAdmin && (
                      <TableCell>
                        <button onClick={() => handleDelete(task.id)} aria-label="Delete task" className="text-slate-300 hover:text-red-500 transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </TableCell>
                    )}
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {isAdmin && (
        <TaskModal open={showModal} onClose={() => setShowModal(false)} members={members} currentUserId={userId} onTaskCreated={reloadTasks} />
      )}
    </div>
  );
}
