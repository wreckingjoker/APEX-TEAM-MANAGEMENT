import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getAllClients, createClient } from "@/lib/sheets/clients";
import { createClientSchema } from "@/lib/validations";
import { rateLimit } from "@/lib/rate-limit";

export async function GET(req: NextRequest) {
  const limited = rateLimit(req, { max: 60, windowMs: 15 * 60 * 1000 });
  if (limited) return limited;

  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const clients = await getAllClients();
  return NextResponse.json({ data: clients });
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

  const parsed = createClientSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });

  const client = await createClient(parsed.data);
  return NextResponse.json({ data: client }, { status: 201 });
}
