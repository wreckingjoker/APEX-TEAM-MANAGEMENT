---
name: apex-frontend
description: Build UI components and pages for the Apex Digital team management platform using Next.js 14, Tailwind CSS, and ShadCN/UI with the correct brand identity
user-invocable: true
argument-hint: "[component or page name to build]"
allowed-tools: Read, Edit, Write, Glob, Grep, Bash
---

# Apex Frontend Skill

Activate this skill when building any UI component, page, or layout for this project.

## Brand Identity

```
Logo: /public/images/apex-logo.jpeg (geometric triangular A mark)

Colors (use EXACTLY these):
  --apex-cyan:   #00C8FF   /* primary accent, CTAs */
  --apex-blue:   #4F7FFF   /* secondary, hover states */
  --apex-purple: #8B2FBE   /* gradient terminus, badges */
  --apex-navy:   #1A1A3E   /* headings, sidebar bg */
  --apex-dark:   #0D0D1A   /* dark mode background */
  --apex-white:  #FFFFFF   /* light backgrounds */

Gradient: linear-gradient(135deg, #00C8FF 0%, #4F7FFF 50%, #8B2FBE 100%)

Typography:
  Font: Inter (from next/font/google)
  Headings: font-bold tracking-tight text-[#1A1A3E]
  Body: font-normal text-slate-700

Style: Modern, geometric, sharp edges — no heavy rounded corners on major elements
```

## Tailwind Custom Classes (already in tailwind.config.ts)

```
bg-apex-gradient   → gradient background
text-apex-navy     → #1A1A3E
text-apex-cyan     → #00C8FF
border-apex-cyan   → cyan border
btn-apex-primary   → gradient button with hover lift
card-apex          → white card with subtle shadow + left cyan border accent
```

## Component Patterns

### Page Layout (inside dashboard group)
```tsx
export default function PageName() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1A1A3E]">Page Title</h1>
          <p className="text-slate-500 text-sm mt-1">Subtitle description</p>
        </div>
        {/* Action button if needed */}
      </div>
      {/* Page content */}
    </div>
  )
}
```

### Stat Card
```tsx
<div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5 flex items-center gap-4">
  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-[#00C8FF] to-[#8B2FBE] flex items-center justify-center text-white">
    <Icon className="w-5 h-5" />
  </div>
  <div>
    <p className="text-sm text-slate-500">{label}</p>
    <p className="text-2xl font-bold text-[#1A1A3E]">{value}</p>
  </div>
</div>
```

### Primary Button
```tsx
<button className="px-4 py-2 rounded-lg bg-gradient-to-r from-[#00C8FF] to-[#8B2FBE] text-white font-medium text-sm hover:opacity-90 transition-opacity shadow-sm">
  Label
</button>
```

### Priority Badge
```tsx
const priorityStyles = {
  low:    'bg-slate-100 text-slate-600',
  medium: 'bg-blue-50 text-blue-700',
  high:   'bg-orange-50 text-orange-700',
  urgent: 'bg-red-50 text-red-700',
}
<span className={`px-2 py-0.5 rounded-full text-xs font-medium ${priorityStyles[priority]}`}>
  {priority}
</span>
```

### Status Badge
```tsx
const statusStyles = {
  pending:     'bg-slate-100 text-slate-600',
  'in-progress': 'bg-blue-50 text-blue-700',
  done:        'bg-green-50 text-green-700',
}
```

## ShadCN Components to Use
Import from `@/components/ui/` — already initialized.
- `Button` — use variant="default" for primary, variant="outline" for secondary
- `Dialog` + `DialogContent` — for modals
- `DropdownMenu` — for action menus
- `Select` — for status/priority dropdowns
- `Input`, `Label` — for forms
- `Table`, `TableBody`, `TableCell`, `TableHead`, `TableHeader`, `TableRow` — for lists
- `Badge` — for tags
- `Avatar` — for user images
- `Separator` — for dividers

## Accessibility Requirements
- All interactive elements must have `aria-label` or visible text
- Modals must trap focus and close on Escape
- Color is never the ONLY indicator (always pair with icon or text)
- Minimum touch target: 44x44px
- Form inputs always have associated `<label>`

## File Naming
- Pages: `app/(dashboard)/page-name/page.tsx`
- Components: `components/section/ComponentName.tsx` (PascalCase)
- Hooks: `hooks/useFeatureName.ts` (camelCase)
- Client components: add `'use client'` at top
- Server components: no directive needed (default in App Router)
