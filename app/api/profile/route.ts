import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getUserById, updateUser } from "@/lib/sheets/users";
import { updateProfileSchema } from "@/lib/validations";
import { rateLimit } from "@/lib/rate-limit";

export async function GET(req: NextRequest) {
  const limited = rateLimit(req, { max: 60, windowMs: 15 * 60 * 1000 });
  if (limited) return limited;

  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await getUserById(session.user.id);
  if (!user) return NextResponse.json({ error: "Profile not found" }, { status: 404 });

  return NextResponse.json({
    data: {
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      role: user.role,
      avatar_url: user.avatar_url,
      created_at: user.created_at,
    },
  });
}

export async function PATCH(req: NextRequest) {
  const limited = rateLimit(req, { max: 20, windowMs: 15 * 60 * 1000 });
  if (limited) return limited;

  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const parsed = updateProfileSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const ok = await updateUser(session.user.id, {
    full_name: parsed.data.full_name,
    avatar_url: parsed.data.avatar_url ?? undefined,
  });

  if (!ok) return NextResponse.json({ error: "Update failed" }, { status: 500 });
  return NextResponse.json({ data: { success: true } });
}
