import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { deleteUser } from "@/lib/sheets/users";
import { unassignUserTasks } from "@/lib/sheets/tasks";
import { rateLimit } from "@/lib/rate-limit";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const limited = rateLimit(req, { max: 20, windowMs: 15 * 60 * 1000 });
  if (limited) return limited;

  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;

  if (id === session.user.id) {
    return NextResponse.json({ error: "You cannot remove yourself." }, { status: 400 });
  }

  await unassignUserTasks(id);
  const ok = await deleteUser(id);
  if (!ok) return NextResponse.json({ error: "Failed to remove member." }, { status: 500 });

  return NextResponse.json({ data: { id } });
}
