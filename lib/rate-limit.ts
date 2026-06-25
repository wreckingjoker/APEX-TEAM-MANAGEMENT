import { NextRequest, NextResponse } from "next/server";

// In-memory rate limiter
const store = new Map<string, { count: number; resetAt: number }>();

interface RateLimitOptions {
  max: number;
  windowMs: number;
}

function getKey(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for");
  const ip = forwarded ? forwarded.split(",")[0].trim() : "unknown";
  return ip;
}

export function rateLimit(
  req: NextRequest,
  options: RateLimitOptions
): NextResponse | null {
  const key = getKey(req);
  const now = Date.now();
  const record = store.get(key);

  if (!record || record.resetAt < now) {
    store.set(key, { count: 1, resetAt: now + options.windowMs });
    return null;
  }

  record.count += 1;

  if (record.count > options.max) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      {
        status: 429,
        headers: {
          "Retry-After": String(Math.ceil((record.resetAt - now) / 1000)),
        },
      }
    );
  }

  return null;
}

// Periodically clean up expired entries to prevent memory growth
if (typeof globalThis !== "undefined") {
  setInterval(
    () => {
      const now = Date.now();
      for (const [key, val] of store.entries()) {
        if (val.resetAt < now) store.delete(key);
      }
    },
    5 * 60 * 1000
  );
}
