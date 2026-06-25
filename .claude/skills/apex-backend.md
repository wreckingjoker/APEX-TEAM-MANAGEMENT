---
name: apex-backend
description: Build API routes, Supabase queries, and auth logic for the Apex Digital platform with correct security patterns
user-invocable: true
argument-hint: "[API route or feature to implement]"
allowed-tools: Read, Edit, Write, Glob, Grep, Bash
---

# Apex Backend Skill

Activate when writing API routes, Supabase queries, auth logic, or database operations.

## Supabase Client Usage

### In API routes and Server Components (use cookies)
```typescript
// lib/supabase/server.ts
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export function createClient() {
  const cookieStore = cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        },
      },
    }
  )
}
```

### In Client Components only
```typescript
// lib/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr'
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

**NEVER use `SUPABASE_SERVICE_ROLE_KEY` in user-facing routes.** Only use it in admin-only server scripts.

## API Route Template

Every route MUST follow this pattern: auth → role check → validate → query → respond.

```typescript
// app/api/resource/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { resourceSchema } from '@/lib/validations'
import { rateLimit } from '@/lib/rate-limit'

export async function POST(req: NextRequest) {
  // 1. Rate limiting
  const limited = await rateLimit(req, { max: 20, window: '1m' })
  if (limited) return NextResponse.json({ error: 'Too many requests' }, { status: 429 })

  // 2. Auth check
  const supabase = createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // 3. Role check (if admin-only)
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  if (profile?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // 4. Input validation
  const body = await req.json()
  const parsed = resourceSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
    // Note: never return parsed.error.issues in production — they leak field names
  }

  // 5. Database operation (RLS enforces access control at DB level too)
  const { data, error } = await supabase
    .from('resource')
    .insert(parsed.data)
    .select()
    .single()

  if (error) {
    console.error('[API] resource insert error:', error.code) // log code only, not message
    return NextResponse.json({ error: 'Operation failed' }, { status: 500 })
  }

  return NextResponse.json({ data }, { status: 201 })
}
```

## Zod Validation Schemas (add to lib/validations.ts)

```typescript
import { z } from 'zod'

export const createTaskSchema = z.object({
  title: z.string().min(1).max(200).trim(),
  description: z.string().max(2000).nullable().optional(),
  status: z.enum(['pending', 'in-progress', 'done']).default('pending'),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
  assigned_to: z.string().uuid(),
  deadline: z.string().datetime().nullable().optional(),
})

export const updateTaskStatusSchema = z.object({
  status: z.enum(['pending', 'in-progress', 'done']),
})

export const inviteMemberSchema = z.object({
  email: z.string().email().max(255),
  full_name: z.string().min(1).max(100).trim(),
  role: z.enum(['admin', 'member']).default('member'),
})

export const updateProfileSchema = z.object({
  full_name: z.string().min(1).max(100).trim().optional(),
  avatar_url: z.string().url().max(500).nullable().optional(),
})
```

## Error Response Format

Always return consistent error shapes. Never include stack traces, DB error messages, or internal IDs:
```typescript
// Success
{ data: {...} }
{ data: [...] }

// Error
{ error: 'Human readable message' }   // NOT the raw DB error

// Validation error (dev mode only)
{ error: 'Invalid input', fields: ['title', 'deadline'] }  // field names only, no values
```

## Supabase Query Patterns

```typescript
// Get current user's profile
const { data: profile } = await supabase
  .from('profiles')
  .select('id, full_name, role, avatar_url')
  .eq('id', user.id)
  .single()

// Get tasks for member (RLS handles filtering but be explicit)
const { data: tasks } = await supabase
  .from('tasks')
  .select(`
    id, title, description, status, priority, deadline, created_at,
    assignee:profiles!assigned_to(id, full_name, avatar_url),
    creator:profiles!created_by(id, full_name)
  `)
  .order('created_at', { ascending: false })

// Update task status (member updates own tasks only — RLS enforces)
const { error } = await supabase
  .from('tasks')
  .update({ status: newStatus, updated_at: new Date().toISOString() })
  .eq('id', taskId)
```

## Auth Patterns

```typescript
// Check session in Server Component
const { data: { session } } = await supabase.auth.getSession()
if (!session) redirect('/login')

// Sign out
await supabase.auth.signOut()

// Admin invite new member (uses admin API — server-side only)
const { data, error } = await supabase.auth.admin.inviteUserByEmail(email, {
  data: { full_name, role }
})
```

## API Routes to Implement

| Route | Method | Auth | Description |
|-------|--------|------|-------------|
| `/api/tasks` | GET | member+ | Get tasks (RLS filters by role) |
| `/api/tasks` | POST | admin | Create task |
| `/api/tasks/[id]` | PATCH | member+ | Update task (RLS: member only own) |
| `/api/tasks/[id]` | DELETE | admin | Delete task |
| `/api/members` | GET | admin | Get all team members |
| `/api/members` | POST | admin | Invite new member |
| `/api/members/[id]` | DELETE | admin | Remove member |
| `/api/profile` | GET | member+ | Get own profile |
| `/api/profile` | PATCH | member+ | Update own profile |
| `/api/activity` | GET | admin | Get activity log |
