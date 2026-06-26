"use client";

import { useState } from "react";
import { TaskModal } from "./TaskModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Search, Calendar, Trash2, FileText, PenLine } from "lucide-react";
import { avatarColor } from "@/lib/avatar-color";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
  const [noteDialog, setNoteDialog] = useState<{ taskId: string; note: string } | null>(null);
  const [noteSaving, setNoteSaving] = useState(false);

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

  async function handleSaveNote() {
    if (!noteDialog) return;
    setNoteSaving(true);
    const res = await fetch(`/api/tasks/${noteDialog.taskId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ note: noteDialog.note }),
    });
    setNoteSaving(false);
    if (res.ok) {
      setTasks((prev) =>
        prev.map((t) => (t.id === noteDialog.taskId ? { ...t, note: noteDialog.note } : t))
      );
      setNoteDialog(null);
    }
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
    <div className="flex flex-col gap-4 md:gap-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-[#1A1A3E]">Tasks</h1>
          <p className="text-slate-500 text-sm mt-1">{filtered.length} of {tasks.length} tasks</p>
        </div>
        {isAdmin && (
          <Button onClick={() => setShowModal(true)} className="apex-gradient text-white border-0 hover:opacity-90 gap-2">
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">New Task</span>
            <span className="sm:hidden">New</span>
          </Button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 md:gap-3">
        <div className="relative flex-1 min-w-[160px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input placeholder="Search tasks…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={statusFilter} onValueChange={(v) => v && setStatusFilter(v)}>
          <SelectTrigger className="w-36 md:w-40"><SelectValue placeholder="All statuses" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="in-progress">In Progress</SelectItem>
            <SelectItem value="done">Done</SelectItem>
          </SelectContent>
        </Select>
        <Select value={priorityFilter} onValueChange={(v) => v && setPriorityFilter(v)}>
          <SelectTrigger className="w-36 md:w-40"><SelectValue placeholder="All priorities" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All priorities</SelectItem>
            <SelectItem value="low">Low</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="urgent">Urgent</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Mobile: card layout */}
      <div className="flex flex-col gap-3 md:hidden">
        {filtered.length === 0 ? (
          <div className="apex-card p-10 text-center text-slate-400 text-sm">No tasks found.</div>
        ) : (
          filtered.map((task) => {
            const overdue = task.deadline && new Date(task.deadline) < new Date() && task.status !== "done";
            const canChange = isAdmin || task.assigned_to === userId;
            return (
              <div key={task.id} className="apex-card p-4 flex flex-col gap-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-[#1A1A3E] text-sm leading-snug">{task.title}</p>
                    {task.description && (
                      <p className="text-xs text-slate-400 mt-0.5 line-clamp-2">{task.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${priorityStyles[task.priority]}`}>
                      {task.priority}
                    </span>
                    {isAdmin && (
                      <button onClick={() => handleDelete(task.id)} aria-label="Delete task" className="text-slate-300 hover:text-red-500 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2 text-xs text-slate-500">
                  {task.assignee ? (
                    <div className="flex items-center gap-1.5">
                      <div
                        className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0"
                        style={{ backgroundColor: avatarColor(task.assignee.id) }}
                      >
                        {task.assignee.full_name.charAt(0).toUpperCase()}
                      </div>
                      <span className="truncate max-w-[140px]">{task.assignee.full_name}</span>
                    </div>
                  ) : (
                    <span className="text-slate-400">Unassigned</span>
                  )}
                  {task.deadline && (
                    <span className={`flex items-center gap-1 ${overdue ? "text-red-500" : ""}`}>
                      <Calendar className="w-3 h-3" />
                      {new Date(task.deadline).toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: true })}
                    </span>
                  )}
                </div>

                {canChange ? (
                  <Select value={task.status} onValueChange={(v) => v && handleStatusChange(task.id, v as TaskStatus)}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="in-progress">In Progress</SelectItem>
                      <SelectItem value="done">Done</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <span className={`self-start px-2 py-0.5 rounded-full text-xs font-medium ${statusStyles[task.status]}`}>
                    {task.status}
                  </span>
                )}

                {/* Note section */}
                {canChange && (
                  <button
                    onClick={() => setNoteDialog({ taskId: task.id, note: task.note ?? "" })}
                    className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-[#4F7FFF] transition-colors"
                  >
                    <PenLine className="w-3.5 h-3.5" />
                    {task.note ? "Edit note" : "Add note"}
                  </button>
                )}
                {task.note && (
                  <div className="flex items-start gap-2 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
                    <FileText className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                    <p className="text-xs text-amber-800 leading-relaxed">{task.note}</p>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Desktop: table layout */}
      <div className="hidden md:block apex-card overflow-hidden">
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
                        {task.note && (
                          <div className="flex items-center gap-1 mt-1">
                            <FileText className="w-3 h-3 text-amber-500 shrink-0" />
                            <p className="text-xs text-amber-700 line-clamp-1">{task.note}</p>
                          </div>
                        )}
                        {canUpdateStatus && (
                          <button
                            onClick={() => setNoteDialog({ taskId: task.id, note: task.note ?? "" })}
                            className="flex items-center gap-1 mt-1 text-[10px] text-slate-400 hover:text-[#4F7FFF] transition-colors"
                          >
                            <PenLine className="w-3 h-3" />
                            {task.note ? "Edit note" : "Add note"}
                          </button>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {task.assignee ? (
                        <div className="flex items-center gap-2">
                          <div
                            className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold"
                            style={{ backgroundColor: avatarColor(task.assignee.id) }}
                          >
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
                          {new Date(task.deadline).toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: true })}
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

      {/* Note Dialog */}
      <Dialog open={!!noteDialog} onOpenChange={(v) => { if (!v) setNoteDialog(null); }}>
        <DialogContent className="w-[calc(100vw-2rem)] sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-[#1A1A3E] flex items-center gap-2">
              <FileText className="w-4 h-4 text-amber-500" />
              Completion Note
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4 mt-2">
            <p className="text-xs text-slate-500">
              Summarise what was done, any blockers encountered, or handover details.
            </p>
            <textarea
              value={noteDialog?.note ?? ""}
              onChange={(e) => setNoteDialog((prev) => prev ? { ...prev, note: e.target.value } : null)}
              placeholder="e.g. Completed the homepage redesign. Final files uploaded to Google Drive..."
              maxLength={2000}
              rows={5}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
            />
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400">{(noteDialog?.note ?? "").length}/2000</span>
              <div className="flex gap-3">
                <Button type="button" variant="outline" onClick={() => setNoteDialog(null)} disabled={noteSaving}>
                  Cancel
                </Button>
                <Button onClick={handleSaveNote} disabled={noteSaving} className="apex-gradient text-white border-0 hover:opacity-90">
                  {noteSaving ? "Saving…" : "Save Note"}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
