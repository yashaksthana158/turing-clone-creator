

# Super Admin Bootstrap & Setup System

## Problem
There's no way to create the first SUPER_ADMIN via GUI. The convenor (SUPER_ADMIN) changes periodically, so there needs to be a secure, repeatable mechanism.

## Solution: Edge Function + Setup Page

### 1. Create a backend function: `claim-admin`
A secure edge function that checks if **zero** SUPER_ADMINs exist in the system. If none exist, it promotes the currently authenticated user to SUPER_ADMIN. If one already exists, it rejects the request.

- Uses the service role key (bypasses RLS) to query `user_roles` joined with `roles`
- Only works when no SUPER_ADMIN exists (bootstrap scenario)
- Requires the caller to be authenticated

### 2. Create a Setup page at `/setup`
A simple page accessible to any authenticated user that:
- Checks if any SUPER_ADMIN exists in the system (via the edge function or a read query)
- If **no admin exists**: shows a "Claim Super Admin" button that calls the edge function
- If **admin already exists**: shows a message "System is already configured. Contact the current Super Admin."

### 3. Add a "Transfer Admin" feature in the dashboard
On the existing `/dashboard/roles` page (currently a placeholder), build out:
- A list of all roles and which users hold them
- A **"Transfer Super Admin"** action (visible only to current SUPER_ADMIN) that:
  - Lets them search/select another user
  - Removes SUPER_ADMIN from themselves and assigns it to the selected user
  - This handles the convenor changeover scenario

### 4. Update Navigation
- Add a subtle link to `/setup` only when the system has no SUPER_ADMIN (or hide it entirely once bootstrapped)

## Technical Details

**Edge function `claim-admin`:**
- Validates auth token
- Queries `user_roles` + `roles` for any row where `roles.name = 'SUPER_ADMIN'`
- If count = 0, inserts into `user_roles` with the caller's ID and the SUPER_ADMIN role ID
- Returns success/failure JSON

**`/setup` page:**
- Calls the edge function on button click
- On success, redirects to `/dashboard`
- Shows loading/error states

**`/dashboard/roles` page (Transfer Admin):**
- Fetches all users with their roles
- SUPER_ADMIN sees a "Transfer Super Admin" button next to each user
- Confirmation dialog before transfer
- Two operations in sequence: assign SUPER_ADMIN to new user, remove from current user

## Files to Create/Edit
- **Create**: `supabase/functions/claim-admin/index.ts` (edge function)
- **Create**: `src/pages/Setup.tsx` (bootstrap page)
- **Edit**: `src/pages/dashboard/DashboardRoles.tsx` (role management + transfer admin)
- **Edit**: `src/App.tsx` (add `/setup` route)

