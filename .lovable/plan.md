

## Fix Build Errors and Clean Up Teams Redundancy

### Issues Found

**Build Errors:**
1. `supabase/functions/send-registration-email/index.ts` line 82: `error` is typed `unknown` in the catch block. Needs `(error as Error).message`.
2. `src/pages/dashboard/DashboardGallery.tsx` line 206: calls `supabase.rpc('swap_gallery_sort_order', ...)` which doesn't exist as a database function or in the types. Fix: remove the RPC call and use direct sequential updates only.

**Teams Redundancy Analysis:**
- **"Teams"** (`/dashboard/teams` → `ManageTeams.tsx`): Manages internal organizational teams and their members (team_members table) — used for task assignment, event ownership, etc.
- **"Team Members"** (`/dashboard/team-members` → `DashboardTeamMembers.tsx`): Manages the public-facing team page (public_team_members table) — controls what visitors see on `/teams`.
- These serve different purposes and are **not redundant**. However, the sidebar labels are confusing. Rename "Team Members" to "Public Team Page" for clarity.

### Plan

1. **Fix edge function type error** — cast `error` to `Error` in the catch block of `send-registration-email/index.ts`.

2. **Fix gallery RPC error** — remove the `supabase.rpc('swap_gallery_sort_order')` call in `DashboardGallery.tsx` and use only the fallback sequential update approach.

3. **Clarify sidebar labels** — rename "Team Members" nav item to "Public Team Page" in `DashboardLayout.tsx` to distinguish it from internal team management.

