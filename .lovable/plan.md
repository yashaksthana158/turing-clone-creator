

## Fix Build Errors, Critical Bugs, and Production Issues

### Status of Previously Fixed Items
- **#1** (edge function type error): Already fixed.
- **#10** (sidebar label): Already renamed to "Public Team Page".
- **#2** (gallery RPC error): Already fixed — `swapOrder` mutation uses two sequential updates.

### Remaining Issues to Fix

#### 1. Build Error: `NodeJS.Timeout` in Navigation.tsx (line 17)
The `useRef<NodeJS.Timeout | null>` type requires `@types/node` which isn't installed. Replace with `useRef<ReturnType<typeof setTimeout> | null>(null)`.

#### 2. Gallery Cache Sync (#3)
`Gallery.tsx` uses query key `["public-gallery", displayYear]` but `DashboardGallery.tsx` invalidates `["gallery-images", year]`. Change `Gallery.tsx` query key to `["gallery-images", displayYear]` so admin changes instantly reflect on the public page.

#### 3. Placeholder Row Leak in selectAll (#4)
`filtered` includes `__placeholder__` rows. The `selectAll` function adds placeholder IDs to the selection set. Fix: filter out placeholders from `filtered` at the source (line 104-106) so all downstream consumers (selectAll, bulk delete, bulk visibility, grid render) are safe.

#### 4. ID Card Upload Path (#5)
`Register.tsx` uploads to `signup/{timestamp}` but storage policies may restrict this path. Change to `pending/{timestamp}` and add a storage policy migration allowing inserts to the `pending/` prefix in the `id-cards` bucket for both anon and authenticated users.

#### 5. Missing `storage_path` Column (#6)
`DashboardGallery.tsx` writes `storage_path` on insert (line 237/261) but this column doesn't exist in the DB schema. Add a migration: `ALTER TABLE public.gallery_images ADD COLUMN IF NOT EXISTS storage_path text;`

#### 6. Bulk Visibility Logic (#7)
Line 572: `!allImages.find(i => ids.includes(i.id))?.is_visible` reads only the first match's state. Replace with majority rule: count visible among selected, if majority visible then hide all, else show all.

#### 7. Debounce Overload Input Updates (#8)
Every `onChange` in `DashboardOverload.tsx` calls `updateRow()` immediately (one DB write per keystroke). Add a debounce utility and use local state for text inputs, only calling `updateRow` after 600ms of inactivity.

#### 8. Duplicate Migration Constraints (#9)
`supabase/migrations/20260309035609_...sql` has bare `ADD CONSTRAINT` that crashes if constraints exist. Wrap each in a `DO $$ BEGIN ... EXCEPTION WHEN duplicate_object THEN NULL; END $$;` block to make it idempotent.

### Implementation Order

1. **Navigation.tsx** — fix `NodeJS.Timeout` type (build error, unblocks everything)
2. **Migration** — add `storage_path` column + fix duplicate constraint migration
3. **Storage policy migration** — allow `pending/` uploads in `id-cards` bucket
4. **Register.tsx** — change upload path to `pending/`
5. **Gallery.tsx** — fix query key to `["gallery-images", displayYear]`
6. **DashboardGallery.tsx** — filter placeholders from `filtered`; fix bulk visibility logic
7. **DashboardOverload.tsx** — add debounced input pattern for text fields

### Files to Edit
- `src/components/Navigation.tsx` (line 17)
- `src/pages/Gallery.tsx` (line 76)
- `src/pages/dashboard/DashboardGallery.tsx` (lines 104-106, 570-575)
- `src/pages/auth/Register.tsx` (upload path)
- `src/pages/dashboard/DashboardOverload.tsx` (debounce onChange handlers)
- `supabase/migrations/20260309035609_...sql` (make idempotent)
- New migration for `storage_path` column + `id-cards` storage policy

