

# Plan: Implement Task Management System

## Overview
Build a full task management page replacing the placeholder. The `tasks` table already exists with the right schema (title, description, status, assigned_to, assigned_by, team_id, due_date). Task statuses follow: PENDING → IN_PROGRESS → SUBMITTED → APPROVED/REJECTED.

## Database
No schema changes needed. The `tasks` table and RLS policies are already in place. The approval workflow for tasks is also supported via the `approvals` table (item_type = 'TASK').

## Frontend: Rewrite `DashboardTasks.tsx`

### Role-based views
- **Team Members (level 2)**: See tasks assigned to them, can update status (mark IN_PROGRESS, SUBMITTED)
- **Team Leads (level 3+)**: Can create tasks, assign to team members, approve/reject submitted tasks
- **Presidents (level 4+)**: Can view all tasks across teams, delete tasks

### Features
1. **Task list** with status filter (ALL, PENDING, IN_PROGRESS, SUBMITTED, APPROVED, REJECTED)
2. **Create Task modal** (for leads+): Select team, assign to member, title, description, due date
3. **Task cards** showing title, assignee name (from profiles), team name, due date, status badge
4. **Status actions**: 
   - Assignee: "Start" (PENDING→IN_PROGRESS), "Submit" (IN_PROGRESS→SUBMITTED)
   - Lead: "Approve" (SUBMITTED→APPROVED), "Reject" (SUBMITTED→REJECTED, resets to PENDING)
   - Lead: "Delete" task
5. **Edit task** inline or modal for leads

### Data fetching
- Fetch tasks with team name via join on `teams`
- Fetch assignee/assigner names from `profiles`
- Filter by user's teams for team members, all for presidents

### Components
- `DashboardTasks.tsx` — main page (all logic inline, matching DashboardEvents pattern)
- `CreateTaskModal.tsx` — new modal component for task creation (team select, member select, title, description, due date)

### UI Style
Match existing dashboard aesthetic: dark cards (`bg-[#1c1c1c]`), colored status badges, action buttons with icon + text similar to `EventApprovalActions`.

