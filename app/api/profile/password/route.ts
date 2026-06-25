import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getUserById, verifyPassword, updateUser } from "@/lib/sheets/users";
import { changePasswordSchema } from "@/lib/validations";
import { rateLimit } from "@/lib/rate-limit";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  const limited = rateLimit(req, { max: 5, windowMs: 15 * 60 * 1000 });
  if (limited) return limited;

  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const parsed = changePasswordSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });

  const user = await getUserById(session.user.id);
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const valid = await verifyPassword(user.email, parsed.data.current_password);
  if (!valid) return NextResponse.json({ error: "Current password is incorrect." }, { status: 400 });

  const password_hash = await bcrypt.hash(parsed.data.new_password, 12);
  const ok = await updateUser(session.user.id, { password_hash });
  if (!ok) return NextResponse.json({ error: "Failed to update password." }, { status: 500 });

  return NextResponse.json({ data: { success: true } });
}
