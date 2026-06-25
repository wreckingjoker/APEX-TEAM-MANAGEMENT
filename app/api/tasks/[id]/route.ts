import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getTaskById, updateTask, deleteTask } from "@/lib/sheets/tasks";
import { logActivity } from "@/lib/sheets/activity";
import { updateTaskSchema, updateTaskStatusSchema } from "@/lib/validations";
import { rateLimit } from "@/lib/rate-limit";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const limited = rateLimit(req, { max: 60, windowMs: 15 * 60 * 1000 });
  if (limited) return limited;

  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const isAdmin = session.user.role === "admin";

  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const existing = await getTaskById(id);
  if (!existing) return NextResponse.json({ error: "Task not found" }, { status: 404 });

  if (!isAdmin && existing.assigned_to !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let updatePayload: Parameters<typeof updateTask>[1];
  let newStatus: string | undefined;

  if (isAdmin) {
    const parsed = updateTaskSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    updatePayload = {
      ...parsed.data,
      description: parsed.data.description ?? undefined,
      deadline: parsed.data.deadline ?? undefined,
    };
    newStatus = parsed.data.status;
  } else {
    const parsed = updateTaskStatusSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    updatePayload = { status: parsed.data.status };
    newStatus = parsed.data.status;
  }

  const updated = await updateTask(id, updatePayload);
  if (!updated) return NextResponse.json({ error: "Update failed" }, { status: 500 });

  if (newStatus && existing.status !== newStatus) {
    await logActivity({
      user_id: session.user.id,
      task_id: id,
      action: `changed status to ${newStatus}`,
      old_value: existing.status,
      new_value: newStatus,
    });
  }

  return NextResponse.json({ data: updated });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const limited = rateLimit(req, { max: 30, windowMs: 15 * 60 * 1000 });
  if (limited) return limited;

  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const ok = await deleteTask(id);
  if (!ok) return NextResponse.json({ error: "Delete failed" }, { status: 500 });

  return NextResponse.json({ data: { id } });
}
