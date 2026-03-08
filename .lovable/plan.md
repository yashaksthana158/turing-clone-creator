

# RBAC System with Multi-Level Approval Workflows

## Current State
- Frontend-only React application with no backend/database
- No Supabase connection yet
- Existing pages: Home, Events, About, Teams, OverloadPP, Gallery

## Architecture Overview

```text
┌─────────────────────────────────────────────────────────────┐
│                        FRONTEND                              │
│  React + React Router + TanStack Query                       │
│  ├── Public Pages (Events, About, Gallery)                   │
│  ├── Auth Pages (Login, Register, Reset Password)            │
│  ├── Admin Dashboard (Role-based views)                      │
│  └── Protected Routes (Auth + Role guards)                   │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   SUPABASE BACKEND                           │
│  ├── Auth (Email/Password + optional OAuth)                  │
│  ├── Database (PostgreSQL with RLS)                          │
│  └── Edge Functions (approval workflows)                     │
└─────────────────────────────────────────────────────────────┘
```

---

## Database Schema (12 Tables)

### Core Tables

**1. roles** - Role definitions
```sql
id, name (SUPER_ADMIN, PRESIDENT, TEAM_LEAD, TEAM_MEMBER, PARTICIPANT), 
description, created_at
```

**2. user_roles** - User-to-role mapping (separate table for security)
```sql
id, user_id (FK auth.users), role_id (FK roles), assigned_by, assigned_at
```

**3. profiles** - Extended user info
```sql
id (FK auth.users), full_name, avatar_url, phone, created_at, updated_at
```

**4. teams** - Society teams
```sql
id, name, description, created_by, created_at
```

**5. team_members** - Team membership with positions
```sql
id, team_id (FK teams), user_id (FK auth.users), position (LEAD/MEMBER), 
joined_at
```

### Event System Tables

**6. events** - Event records
```sql
id, title, description, event_date, venue, max_participants, 
created_by, status (DRAFT/PENDING_LEAD/PENDING_PRESIDENT/APPROVED/PUBLISHED/CLOSED),
team_id, created_at, updated_at
```

**7. event_registrations** - Participant registrations
```sql
id, event_id (FK events), user_id (FK auth.users), registered_at, 
status (REGISTERED/CANCELLED/ATTENDED)
```

### Task & Approval System Tables

**8. tasks** - Team tasks
```sql
id, title, description, team_id, assigned_to, assigned_by, 
status (PENDING/IN_PROGRESS/SUBMITTED/APPROVED/REJECTED), 
due_date, created_at
```

**9. approvals** - Workflow tracking
```sql
id, item_type (EVENT/TASK), item_id, level (1=LEAD, 2=PRESIDENT), 
status (PENDING/APPROVED/REJECTED), reviewed_by, comments, reviewed_at
```

### Permission System Tables

**10. permissions** - Granular permissions
```sql
id, name (create_event, approve_event, manage_team, etc.), description
```

**11. role_permissions** - Role-to-permission mapping
```sql
id, role_id (FK roles), permission_id (FK permissions)
```

**12. audit_logs** - Action tracking
```sql
id, user_id, action, table_name, record_id, old_data, new_data, created_at
```

---

## Security Implementation

### Row-Level Security (RLS)
- `has_role()` security definer function to prevent recursion
- Policies per table based on user roles
- Participants can only see published events and their own registrations
- Team members see their team's data
- Admins have broader access

### Role Hierarchy Check
```sql
CREATE FUNCTION get_role_level(role_name TEXT) RETURNS INT
-- SUPER_ADMIN=5, PRESIDENT=4, TEAM_LEAD=3, TEAM_MEMBER=2, PARTICIPANT=1
```

---

## Frontend Structure

### New Pages
```
src/pages/
├── auth/
│   ├── Login.tsx
│   ├── Register.tsx
│   └── ResetPassword.tsx
├── dashboard/
│   ├── Dashboard.tsx (role-based routing)
│   ├── admin/
│   │   ├── ManageRoles.tsx
│   │   ├── ManageTeams.tsx
│   │   └── SystemSettings.tsx
│   ├── events/
│   │   ├── CreateEvent.tsx
│   │   ├── EventApprovals.tsx
│   │   └── EventRegistrations.tsx
│   └── tasks/
│       ├── MyTasks.tsx
│       └── TaskApprovals.tsx
```

### Auth & Permission Hooks
- `useAuth()` - Authentication state
- `useRole()` - Current user's role
- `usePermission(permission)` - Check specific permission
- `<ProtectedRoute requiredRole="TEAM_LEAD">` - Route guard component

---

## Approval Workflow Logic

### Event Approval Flow
```
Member creates → status: DRAFT
Member submits → status: PENDING_LEAD
Lead approves  → status: PENDING_PRESIDENT (creates approval record)
Lead rejects   → status: DRAFT (feedback provided)
President approves → status: APPROVED
President publishes → status: PUBLISHED (open for registration)
```

### Edge Function for Approvals
- Validates approver has correct role
- Updates item status
- Creates audit log
- Sends notifications (optional)

---

## Implementation Phases

### Phase 1: Foundation
1. Enable Supabase (Lovable Cloud)
2. Create database schema (all 12 tables)
3. Set up RLS policies with `has_role()` function
4. Seed initial roles and permissions

### Phase 2: Authentication
1. Auth pages (Login, Register, Reset Password)
2. Auth context and hooks
3. Protected route component
4. Auto-assign PARTICIPANT role on signup

### Phase 3: Admin Dashboard
1. Dashboard layout with role-based navigation
2. Team management (CRUD)
3. User role assignment (Super Admin only)

### Phase 4: Event System
1. Event CRUD with draft/submit workflow
2. Approval interface for leads and president
3. Event registration for participants
4. Registration management view

### Phase 5: Task System
1. Task creation and assignment
2. Task submission workflow
3. Task review interface

---

## Key Security Rules
- Roles stored in separate `user_roles` table (not on profiles)
- `has_role()` security definer function for RLS
- Server-side validation via RLS + edge functions
- Audit logging for sensitive actions
- JWT verification in edge functions

