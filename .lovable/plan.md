

## Plan: Academic Year for Teams, Dynamic Hero Image, Bug Fixes

The user wants a **tenure/session year** attribute on `public_team_members` (not `admission_year` from profiles — that's a student attribute). This will be something like "2024-25" to represent which society session the team member served in.

### 1. Database Migration

**Add `academic_year` column to `public_team_members`:**
```sql
ALTER TABLE public_team_members ADD COLUMN academic_year text NOT NULL DEFAULT '2024-25';
```

**Create `site_settings` table** for hero image and other page-level settings:
```sql
CREATE TABLE public.site_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  value text,
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
-- Anyone can read
CREATE POLICY "Anyone can view site settings" ON public.site_settings FOR SELECT USING (true);
-- Leads+ can upsert
CREATE POLICY "Leads+ can manage site settings" ON public.site_settings FOR ALL TO authenticated
  USING (get_user_role_level(auth.uid()) >= 3)
  WITH CHECK (get_user_role_level(auth.uid()) >= 3);
```
Seed with: `INSERT INTO site_settings (key, value) VALUES ('teams_hero_image', '/Assets/GroupCore.webp');`

### 2. Teams Public Page (`src/pages/Teams.tsx`)

- Fetch distinct `academic_year` values from `public_team_members` to build a year selector
- Default to the latest year; show a dropdown/pill selector below the hero
- Filter fetched members by selected year
- Fetch `teams_hero_image` from `site_settings` and apply as inline `backgroundImage` style on the hero section
- Remove hardcoded background from `.teams-hero` in `src/index.css`

### 3. Dashboard Team Members (`src/pages/dashboard/DashboardTeamMembers.tsx`)

**Year support:**
- Add `academic_year` field to the form (dropdown with common years like "2023-24", "2024-25", "2025-26" + the current value)
- Add year filter tabs/dropdown above section tabs
- Include `academic_year` in the insert/update payload

**Hero image management:**
- Add a "Page Settings" section at the top with an image upload for the teams hero background, reading/writing from `site_settings` table

**Bug fixes:**
- Add `isSaving` guard to `toggleVisibility` and `handleDelete` to prevent concurrent mutations
- Disable action buttons while saving
- Clean up `imagePreview` object URLs on unmount (memory leak)

### 4. CSS Change

Remove the hardcoded background-image from `.teams-hero` in `src/index.css` (line 1103) so the dynamic inline style takes over.

### Files to Modify
- **New migration**: Add `academic_year` column, create `site_settings` table
- `src/pages/Teams.tsx`: Year selector, dynamic hero, year-filtered fetch
- `src/pages/dashboard/DashboardTeamMembers.tsx`: Year field in form/filter, hero image settings, race condition guards
- `src/index.css`: Remove hardcoded hero background

