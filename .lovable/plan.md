

# Plan: Dynamic Overload++ Page Template (Database-Driven)

## Problem
The current `OverloadPP.tsx` is hardcoded with 2025 event data. It needs to become a dynamic template that:
1. Pulls event data from the database (events already managed via dashboard)
2. Works as a reusable template for any year (`/overloadpp`, `/overloadpp/2025`, `/overloadpp/2024`)
3. Matches the original site's visual design (performer cards, timeline schedule, collaborations, gallery glimpses)

## Current Assets Available
- **Performer images**: `public/img/performer/1-9.webp` (event poster thumbnails)
- **Schedule images**: `public/img/program_details/1-9.webp`, `opening ceremony.webp`
- **Brand logos**: `public/img/brand/1-11.png/jpg`
- **Gallery images**: `public/img/gallery/1-11.webp`
- **Hero background**: `public/Assets/bg_overload.webp`
- **About banner**: `public/img/about/overload++ Banner.webp`

## Database Changes

### New table: `overload_editions`
Stores per-year Overload++ festival metadata:
- `id` (uuid, PK)
- `year` (integer, unique, not null) -- e.g. 2025
- `title` (text) -- e.g. "Overload++ 2025"
- `date_label` (text) -- e.g. "20 March, 2025"
- `venue` (text) -- e.g. "Seminar Hall, Acharya Narendra Dev College"
- `description` (text) -- about text
- `hero_image_url` (text, nullable)
- `banner_image_url` (text, nullable)
- `register_url` (text, nullable)
- `is_published` (boolean, default false)
- `created_at`, `updated_at`

RLS: Public read for published editions; role level 3+ for write.

### New table: `overload_events`
Sub-events within an edition:
- `id` (uuid, PK)
- `edition_id` (uuid, FK -> overload_editions)
- `name` (text)
- `type` (text) -- e.g. "Console Gaming"
- `image_url` (text, nullable)
- `link_url` (text, nullable) -- link to event detail
- `sort_order` (integer, default 0)

### New table: `overload_schedule`
Schedule items for an edition:
- `id` (uuid, PK)
- `edition_id` (uuid, FK -> overload_editions)
- `time_label` (text) -- e.g. "9:20am - 10:00am"
- `venue` (text)
- `event_name` (text)
- `image_url` (text, nullable)
- `sort_order` (integer, default 0)

### New table: `overload_sponsors`
Collaborations/brands for an edition:
- `id` (uuid, PK)
- `edition_id` (uuid, FK -> overload_editions)
- `name` (text)
- `logo_url` (text)
- `website_url` (text, nullable)
- `sort_order` (integer, default 0)

### New table: `overload_gallery`
Gallery images per edition:
- `id` (uuid, PK)
- `edition_id` (uuid, FK -> overload_editions)
- `image_url` (text)
- `sort_order` (integer, default 0)

## Frontend Changes

### 1. Rewrite `OverloadPP.tsx` as a dynamic template
- Accept `year` from URL params (default to latest published edition)
- Fetch from `overload_editions` + related tables
- Sections: Hero, About, Events grid (3-col performer cards matching original), Timeline schedule (alternating left/right with vertical center line), Collaborations carousel, Gallery glimpses grid
- Match original styling: Anton font headings, `#FF4533` accent for event types, dark background, performer card layout with image + heading + colored span

### 2. Update routing in `App.tsx`
- `/overloadpp` -> OverloadPP (latest year)
- `/overloadpp/:year` -> OverloadPP (specific year, show Coming Soon if no data)

### 3. New dashboard page: `DashboardOverload.tsx`
- CRUD for overload editions (create new year, edit metadata)
- Manage sub-events, schedule, sponsors, gallery per edition
- Accessible at role level 3+
- Add route `/dashboard/overload`

### 4. Navigation update
- Update dropdown so years link to `/overloadpp/2025`, `/overloadpp/2024` etc. dynamically, or keep static with the current hardcoded years

### 5. Seed 2025 data
- Insert the existing hardcoded data (events, schedule, sponsors from the old HTML) as the initial 2025 edition via migration

## Visual Design (matching original)

**Hero**: Full-height slider background with overlay gradient, centered text (date in red/amber, title in Anton font, venue below)

**Events Grid**: 3-column grid, each card has full-width image + heading (Anton, white) + type span (#FF4533 red), margin-bottom between cards

**Schedule**: Timeline with vertical center line, alternating left/right layout, each item shows time (red, Anton font), venue, thumbnail image, and event name. On mobile: single column with left-aligned line.

**Collaborations**: Horizontal scrolling row of sponsor logos

**Gallery**: Grid of clickable images (lightbox optional, or simple grid)

## Technical Details

- 5 new tables with RLS policies
- 1 new dashboard page with tabbed CRUD interface
- 1 rewritten page component
- 1 migration to seed 2025 data
- Route updates in App.tsx and Navigation.tsx

