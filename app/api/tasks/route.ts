import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getTasksWithAssignees, createTask } from "@/lib/sheets/tasks";
import { logActivity } from "@/lib/sheets/activity";
import { createTaskSchema } from "@/lib/validations";
import { rateLimit } from "@/lib/rate-limit";

export async function GET(req: NextRequest) {
  const limited = rateLimit(req, { max: 100, windowMs: 15 * 60 * 1000 });
  if (limited) return limited;

  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const isAdmin = session.user.role === "admin";
  const tasks = await getTasksWithAssignees(isAdmin ? undefined : session.user.id);
  return NextResponse.json({ data: tasks });
}

export async function POST(req: NextRequest) {
  const limited = rateLimit(req, { max: 30, windowMs: 15 * 60 * 1000 });
  if (limited) return limited;

  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const parsed = createTaskSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });

  const task = await createTask({ ...parsed.data, created_by: session.user.id });

  await logActivity({
    user_id: session.user.id,
    task_id: task.id,
    action: "created task",
    new_value: task.title,
  });

  return NextResponse.json({ data: task }, { status: 201 });
}
