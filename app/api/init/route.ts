import { NextRequest, NextResponse } from "next/server";
import { getAllUsers, createUser } from "@/lib/sheets/users";
import { inviteMemberSchema } from "@/lib/validations";
import { rateLimit } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  const limited = rateLimit(req, { max: 3, windowMs: 60 * 60 * 1000 });
  if (limited) return limited;

  const users = await getAllUsers();
  if (users.length > 0) {
    return NextResponse.json({ error: "Already initialized." }, { status: 409 });
  }

  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const parsed = inviteMemberSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  try {
    const user = await createUser({
      email: parsed.data.email,
      password: parsed.data.password,
      full_name: parsed.data.full_name,
      role: "admin",
    });
    return NextResponse.json(
      { data: { id: user.id, email: user.email, full_name: user.full_name, role: user.role } },
      { status: 201 }
    );
  } catch {
    return NextResponse.json({ error: "Failed to create admin account." }, { status: 500 });
  }
}
