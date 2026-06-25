import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getAllUsers, createUser, getUserByEmail } from "@/lib/sheets/users";
import { inviteMemberSchema } from "@/lib/validations";
import { rateLimit } from "@/lib/rate-limit";

export async function GET(req: NextRequest) {
  const limited = rateLimit(req, { max: 60, windowMs: 15 * 60 * 1000 });
  if (limited) return limited;

  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const users = await getAllUsers();
  const data = users.map((u) => ({
    id: u.id, email: u.email, full_name: u.full_name,
    role: u.role, avatar_url: u.avatar_url, created_at: u.created_at,
  }));

  return NextResponse.json({ data });
}

export async function POST(req: NextRequest) {
  const limited = rateLimit(req, { max: 10, windowMs: 15 * 60 * 1000 });
  if (limited) return limited;

  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const parsed = inviteMemberSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });

  const existing = await getUserByEmail(parsed.data.email);
  if (existing) return NextResponse.json({ error: "A member with this email already exists." }, { status: 409 });

  try {
    const user = await createUser({
      email: parsed.data.email,
      password: parsed.data.password,
      full_name: parsed.data.full_name,
      role: parsed.data.role,
    });

    return NextResponse.json({
      data: { id: user.id, email: user.email, full_name: user.full_name, role: user.role, avatar_url: user.avatar_url, created_at: user.created_at },
    }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to create account." }, { status: 500 });
  }
}
