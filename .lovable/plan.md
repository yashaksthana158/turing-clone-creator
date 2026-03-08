

## Plan: Dedicated Overload++ Event Detail Pages

### What We're Building

Create individual event detail pages for each Overload++ sub-event (like the original site's Tekken.html, The Lost Artifact.html, etc.), matching the original layout structure. Each page will have: hero banner, about section, event details (date/time/venue/prizes), rules, format & winning criteria, coordinators, and a register button. The "More Events" grid and "Sponsors" sections from the original will be **removed** as requested.

### Database Changes

Add new columns to `overload_events` table to store event detail content:

- `description` (text, nullable) -- about the event
- `event_date` (text, nullable) -- e.g. "20 March 2025"
- `event_time` (text, nullable) -- e.g. "1:30 PM - 2:30 PM"
- `venue` (text, nullable) -- e.g. "Seminar Hall"
- `prizes` (text, nullable) -- prize details
- `rules` (text, nullable) -- rules list (stored as newline-separated text)
- `event_format` (text, nullable) -- format description
- `winning_criteria` (text, nullable) -- winning criteria text
- `coordinators` (text, nullable) -- coordinator info (newline-separated: "Name | Phone")
- `hero_image_url` (text, nullable) -- hero background for the detail page
- `register_url` (text, nullable) -- event-specific registration link

### New Route & Page

- Add route `/overloadpp/:year/event/:eventId` in `App.tsx`
- Create `src/pages/OverloadEventDetail.tsx` with sections:
  1. **Hero** -- full-width banner with event name
  2. **About** -- description text
  3. **Event Details** -- date, time, venue, prizes in a grid
  4. **Rules** -- bulleted list
  5. **Format & Winning Criteria** -- two-column layout
  6. **Coordinators** -- names and phones
  7. **Register Now** button
  - No "More Events" grid, no sponsors/collaborations section

### Update Existing Pages

- **OverloadPP.tsx**: Update event card links to navigate to `/overloadpp/{year}/event/{eventId}` instead of external `link_url` (fall back to `link_url` if set)
- **DashboardOverload.tsx**: Add form fields in the "events" tab for the new columns (description, date, time, venue, prizes, rules, format, criteria, coordinators, hero image, register URL)

### CSS

Add new styles in `src/index.css` for the event detail page sections, following the existing `overload-*` naming convention and dark theme aesthetic.

### Technical Details

- Rules, format, criteria, and coordinators will be stored as plain text with newline separators, parsed into lists/grids on render
- The detail page will fetch the event by ID and also load the parent edition for context (year, edition title)
- New CSS classes: `overload-detail-hero`, `overload-detail-about`, `overload-detail-grid`, `overload-detail-rules`, `overload-detail-format`, `overload-detail-coordinators`

