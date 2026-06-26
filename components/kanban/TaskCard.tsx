"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Calendar, GripVertical, User, FileText } from "lucide-react";
import type { Task } from "@/types";

const priorityStyles: Record<string, string> = {
  low: "bg-slate-100 text-slate-600",
  medium: "bg-blue-50 text-blue-700",
  high: "bg-orange-50 text-orange-700",
  urgent: "bg-red-100 text-red-700",
};

interface TaskCardProps {
  task: Task;
  isDragging?: boolean;
}

export function TaskCard({ task, isDragging }: TaskCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, over } =
    useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const isOverdue =
    task.deadline &&
    new Date(task.deadline) < new Date() &&
    task.status !== "done";

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="bg-white rounded-xl border border-slate-100 shadow-sm p-4 flex flex-col gap-3 cursor-default select-none hover:shadow-md hover:border-[#4F7FFF]/30 transition-all"
    >
      {/* Drag handle + priority */}
      <div className="flex items-center justify-between gap-2">
        <span
          className={`px-2 py-0.5 rounded-full text-xs font-medium ${priorityStyles[task.priority]}`}
        >
          {task.priority}
        </span>
        <button
          {...attributes}
          {...listeners}
          aria-label="Drag task"
          className="text-slate-300 hover:text-slate-500 cursor-grab active:cursor-grabbing touch-none"
        >
          <GripVertical className="w-4 h-4" />
        </button>
      </div>

      {/* Title */}
      <p className="text-sm font-semibold text-[#1A1A3E] leading-snug">
        {task.title}
      </p>

      {/* Description */}
      {task.description && (
        <p className="text-xs text-slate-500 line-clamp-2">{task.description}</p>
      )}

      {/* Completion note indicator */}
      {task.note && (
        <div className="flex items-start gap-1.5 bg-amber-50 border border-amber-100 rounded-lg px-2.5 py-1.5">
          <FileText className="w-3 h-3 text-amber-500 shrink-0 mt-0.5" />
          <p className="text-[11px] text-amber-700 line-clamp-2 leading-relaxed">{task.note}</p>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between gap-2 pt-1">
        {/* Assignee */}
        {task.assignee ? (
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <div className="w-5 h-5 rounded-full apex-gradient flex items-center justify-center text-white text-[10px] font-bold">
              {task.assignee.full_name.charAt(0).toUpperCase()}
            </div>
            <span className="truncate max-w-[80px]">{task.assignee.full_name}</span>
          </div>
        ) : (
          <div className="flex items-center gap-1 text-xs text-slate-400">
            <User className="w-3 h-3" />
            Unassigned
          </div>
        )}

        {/* Deadline */}
        {task.deadline && (
          <div
            className={`flex items-center gap-1 text-xs ${isOverdue ? "text-red-500" : "text-slate-400"}`}
          >
            <Calendar className="w-3 h-3" />
            {new Date(task.deadline).toLocaleDateString("en-GB", {
              day: "numeric",
              month: "short",
            })}
          </div>
        )}
      </div>
    </div>
  );
}
