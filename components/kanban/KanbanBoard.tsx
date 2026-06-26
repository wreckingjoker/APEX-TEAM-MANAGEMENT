"use client";

import { useState } from "react";
import {
  DndContext, DragEndEvent, DragStartEvent, DragOverlay,
  PointerSensor, TouchSensor, useSensor, useSensors, closestCorners,
} from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { useDroppable } from "@dnd-kit/core";
import { TaskCard } from "./TaskCard";
import type { Task, TaskStatus, UserRole } from "@/types";

const COLUMNS: { id: TaskStatus; label: string; color: string }[] = [
  { id: "pending", label: "Pending", color: "border-t-slate-400" },
  { id: "in-progress", label: "In Progress", color: "border-t-[#4F7FFF]" },
  { id: "done", label: "Done", color: "border-t-emerald-500" },
];

function Column({ id, label, color, tasks }: { id: TaskStatus; label: string; color: string; tasks: Task[]; role: UserRole }) {
  const { setNodeRef, isOver } = useDroppable({ id });
  return (
    <div
      ref={setNodeRef}
      className={`flex flex-col gap-3 bg-slate-100 rounded-xl border-t-4 ${color} p-4 min-h-[200px] transition-colors ${isOver ? "bg-blue-50" : ""}`}
    >
      <div className="flex items-center justify-between mb-1">
        <h3 className="font-semibold text-[#1A1A3E] text-sm">{label}</h3>
        <span className="text-xs text-slate-400 bg-white rounded-full px-2 py-0.5">{tasks.length}</span>
      </div>
      <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
        {tasks.map((task) => <TaskCard key={task.id} task={task} />)}
      </SortableContext>
      {tasks.length === 0 && (
        <p className="text-slate-400 text-xs text-center py-6">Drop tasks here</p>
      )}
    </div>
  );
}

interface KanbanBoardProps {
  initialTasks: Task[];
  role: UserRole;
  userId: string;
}

export function KanbanBoard({ initialTasks, role, userId }: KanbanBoardProps) {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [activeTask, setActiveTask] = useState<Task | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } })
  );

  const getTasksByStatus = (status: TaskStatus) => tasks.filter((t) => t.status === status);

  function handleDragStart(event: DragStartEvent) {
    setActiveTask(tasks.find((t) => t.id === event.active.id) ?? null);
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveTask(null);
    if (!over) return;

    const taskId = active.id as string;
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    const newStatus = COLUMNS.find((c) => c.id === over.id)?.id ?? task.status;

    if (role === "member" && task.assigned_to !== userId) return;
    if (newStatus === task.status) return;

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

  return (
    <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {COLUMNS.map((col) => (
          <Column key={col.id} id={col.id} label={col.label} color={col.color} tasks={getTasksByStatus(col.id)} role={role} />
        ))}
      </div>
      <DragOverlay>{activeTask && <TaskCard task={activeTask} isDragging />}</DragOverlay>
    </DndContext>
  );
}
