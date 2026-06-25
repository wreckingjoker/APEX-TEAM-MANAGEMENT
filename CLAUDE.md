# Apex Digital — Team Management Platform

## Project Overview
Internal team management platform for WebApex Digital freelancing brand.
Role-based (admin/member) Kanban task tracker with secure login per team member.

## Tech Stack
- **Framework:** Next.js 14 (App Router) + TypeScript (strict mode)
- **Styling:** Tailwind CSS + ShadCN/UI
- **Database:** Supabase (PostgreSQL) — free tier
- **Auth:** Supabase Auth + NextAuth.js v5
- **Validation:** Zod (required on ALL API inputs)
- **State:** TanStack Query (server) + Zustand (client UI)
- **Drag & Drop:** @dnd-kit/core
- **Hosting:** Vercel (free tier)

## Brand Colors
```
Primary Cyan:    #00C8FF
Royal Blue:      #4F7FFF
Purple:          #8B2FBE
Deep Navy:       #1A1A3E
Dark BG:         #0D0D1A
White:           #FFFFFF
```

## Running the App
```bash
npm run dev      # Start dev server (localhost:3000)
npm run build    # Production build
npm run lint     # ESLint check
```

## Environment Variables
Copy `.env.example` to `.env.local` and fill in all values before running.
Never commit `.env.local` to git.

## Code Conventions
- TypeScript strict mode — no `any` types allowed
- Zod validation on every API route input (no exceptions)
- All Supabase queries use the server client from `lib/supabase/server.ts` in API routes
- Browser Supabase client (`lib/supabase/client.ts`) only in client components
- Use `lib/validations.ts` for all Zod schemas — never inline them
- API error responses must never leak internal details (stack traces, DB errors, user IDs)
- All new pages must be added to `middleware.ts` route protection

## Security Rules (Non-Negotiable)
- Every API route: auth check → role check → Zod validate → DB query
- RLS enforced in Supabase for every table — never bypass with service role on user routes
- Passwords: Supabase Auth handles hashing (bcrypt 12 rounds)
- JWT in HTTP-only Secure SameSite=Strict cookies only
- Rate limiting on all auth routes (5 attempts/15min) and API routes (100/15min)
- Security headers set in `next.config.js` (CSP, X-Frame-Options, etc.)
- Sensitive data never in logs, error messages, or URL params

## Skills to Activate
- `/apex-frontend` — when building UI components or pages
- `/apex-backend` — when writing API routes or Supabase queries
- `/apex-security` — when adding any auth, new route, or new data model

## Project Structure
```
app/
  (auth)/login/          # Login page
  (dashboard)/           # Protected pages (require auth)
    layout.tsx           # Sidebar + TopNav
    dashboard/           # Stats overview
    kanban/              # Kanban board
    tasks/               # Task list
    members/             # Admin only
    profile/             # User profile
    settings/            # Admin only
  api/                   # API routes
lib/                     # Supabase clients, auth, validations
components/              # Reusable components
middleware.ts            # Route protection
```
