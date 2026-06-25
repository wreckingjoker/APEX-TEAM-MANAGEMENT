---
name: apex-security
description: Security checklist and hardening patterns for the Apex Digital platform — run before adding any new route, auth change, or data model
user-invocable: true
argument-hint: "[feature or area to security-check]"
allowed-tools: Read, Grep, Glob
---

# Apex Security Skill

Activate when adding any new route, auth logic, data model, or before shipping a feature.

## Non-Negotiable Security Rules

1. **Every API route** must have: rate limit → auth check → role check → Zod validate → RLS-backed query
2. **No service role key** in user-facing routes — only anon key with RLS
3. **No sensitive data** in API responses, logs, error messages, or URL params
4. **No secrets** in source code — all in `.env.local`, never committed

---

## Pre-Shipping Checklist

### Authentication
- [ ] JWT stored in HTTP-only, Secure, SameSite=Strict cookie
- [ ] Access token: 1 hour expiry; Refresh token: 7 days, rotated on use
- [ ] Login rate-limited: 5 attempts / 15 minutes per IP
- [ ] Account lockout after 5 failed attempts (Supabase Auth handles this)
- [ ] Email verified before account is active
- [ ] Logout invalidates the session server-side (`supabase.auth.signOut()`)
- [ ] Password reset via email only — no security questions

### Authorization
- [ ] `middleware.ts` protects all `/dashboard/*` and `/api/*` routes
- [ ] Admin-only pages (`/members`, `/settings`) return 403 for members
- [ ] RLS enabled on ALL tables: `profiles`, `tasks`, `activity_log`
- [ ] No direct `.from('table').select()` without the user being authenticated
- [ ] Members cannot read/write other members' data (verify with RLS test)

### Input Validation
- [ ] Zod schema on every POST/PATCH/PUT body
- [ ] All string fields: `.trim()`, `.max(N)` set
- [ ] UUID fields validated with `.uuid()`
- [ ] Dates validated with `.datetime()` or `.coerce.date()`
- [ ] Enum fields explicitly listed — no open strings for status/role/priority
- [ ] File uploads: type whitelist (jpg, png, webp only), max 2MB, store in Supabase Storage

### Injection & XSS
- [ ] All DB queries via Supabase client (parameterized — no raw SQL string concat)
- [ ] React renders all dynamic content via JSX (auto-escaped) — no `dangerouslySetInnerHTML`
- [ ] If rich text is needed: use `DOMPurify.sanitize()` before rendering

### Security Headers (in next.config.js)
```javascript
const securityHeaders = [
  { key: 'X-DNS-Prefetch-Control', value: 'on' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-eval' 'unsafe-inline'",  // Next.js requires unsafe-eval in dev
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https://*.supabase.co",
      "connect-src 'self' https://*.supabase.co wss://*.supabase.co",
      "font-src 'self'",
      "frame-ancestors 'none'",
    ].join('; '),
  },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
]
```

### Rate Limiting
- [ ] `/api/auth/*` — 5 requests / 15 minutes per IP
- [ ] `/api/*` (all other) — 100 requests / 15 minutes per IP
- [ ] Use `@upstash/ratelimit` with sliding window

### Environment & Secrets
- [ ] `.env.local` in `.gitignore` (check with `git status`)
- [ ] `.env.example` committed with placeholder values (no real secrets)
- [ ] `SUPABASE_SERVICE_ROLE_KEY` never used in `app/` directory
- [ ] `NEXTAUTH_SECRET` generated with `openssl rand -base64 32`
- [ ] Vercel production env vars set in Vercel dashboard, not in code

### Password Policy (enforced at signup)
```typescript
const passwordSchema = z.string()
  .min(12, 'Minimum 12 characters')
  .regex(/[A-Z]/, 'Must contain uppercase letter')
  .regex(/[a-z]/, 'Must contain lowercase letter')
  .regex(/[0-9]/, 'Must contain number')
  .regex(/[^A-Za-z0-9]/, 'Must contain special character')
```

### Session Security
- [ ] Session timeout after 30 minutes of inactivity (configure in Supabase Auth settings)
- [ ] New session token issued on every login
- [ ] Old tokens invalidated on logout (not just cookie delete)

---

## Supabase RLS Policy Templates

```sql
-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;

-- Profiles: user can read own + team members; admin can read all
CREATE POLICY "profiles_select_own"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "profiles_select_team"
  ON public.profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

CREATE POLICY "profiles_update_own"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Tasks: admin sees all; member sees only assigned
CREATE POLICY "tasks_select_admin"
  ON public.tasks FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "tasks_select_member"
  ON public.tasks FOR SELECT
  USING (assigned_to = auth.uid());

CREATE POLICY "tasks_insert_admin"
  ON public.tasks FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "tasks_update_admin"
  ON public.tasks FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "tasks_update_member_status"
  ON public.tasks FOR UPDATE
  USING (assigned_to = auth.uid())
  WITH CHECK (
    assigned_to = auth.uid()
    -- Members can only change status, nothing else
    -- Enforce this in the API route via Zod (status only schema)
  );

CREATE POLICY "tasks_delete_admin"
  ON public.tasks FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Activity log: admin sees all; member sees own
CREATE POLICY "activity_select_admin"
  ON public.activity_log FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "activity_select_own"
  ON public.activity_log FOR SELECT
  USING (user_id = auth.uid());
```

---

## Threat Model Summary

| Attack Vector | Defense |
|---|---|
| Brute-force login | 5 attempt limit / 15min; account lockout |
| Stolen JWT | HTTP-only cookie (no JS access); 1hr expiry; refresh rotation |
| CSRF | SameSite=Strict cookie; NextAuth.js CSRF token |
| SQL Injection | Supabase parameterized queries only; Zod rejects unexpected fields |
| XSS | React auto-escaping; CSP header; no dangerouslySetInnerHTML |
| IDOR | RLS at DB level + middleware role check (double guard) |
| Data leakage | Error messages generic; no stack traces; no IDs in URLs |
| Session hijacking | Secure cookie; HTTPS-only (HSTS); token rotation |
| Privilege escalation | Role stored in DB (not JWT); checked server-side every request |
| Mass assignment | Zod strict schemas; only whitelisted fields accepted |
| Clickjacking | X-Frame-Options: DENY; frame-ancestors 'none' in CSP |
| Enumeration | Generic "invalid credentials" on login (no "user not found" vs "wrong password") |
