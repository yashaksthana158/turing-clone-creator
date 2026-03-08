## Professional Redesign: Events & Teams Pages

### Current State Analysis

Based on my exploration, the current pages are functional but have basic styling:

- **Events page**: Simple inline styles, basic card layout, no hover effects or badges
- **Teams page**: White background cards on black, basic styling, no hero section, minimal visual interest

### Design Goals

1. **Consistent dark theme** with gradient accents
2. **Professional card designs** with hover animations
3. **Hero sections** with proper backgrounds
4. **Better visual hierarchy** and spacing
5. **Social icons** using Lucide React instead of text links
6. **Filter/category badges** for events

---

### Events Page Enhancements

**Hero Section**

- Add animated gradient overlay
- Register Now CTA button

**Event Cards**

- Category badge (top-right corner)
- Status indicator (Upcoming/Past)
- Glassmorphism card style with subtle border
- Hover scale + glow effect
- Better image aspect ratio (16:9)

**Statistics Section**

- Animated counter effect on scroll
- Card-based stat items with icons
- Gradient accent borders

**Live Updates Section**

- Timeline-style with animated dots
- Better visual distinction

---

### Teams Page Enhancements

**Hero Section**

- Add hero banner with "Meet Our Team" heading
- Subtitle with society description
- Background: `/Assets/GroupCore.webp`

**Team Cards**

- Dark theme cards (instead of white)
- Larger circular photos with gradient border
- Social icons (LinkedIn, Instagram, GitHub) using Lucide icons
- Hover effect: card lift + purple glow
- Consistent spacing and alignment

**Section Styling**

- Section dividers with gradient lines
- Better section headers with decorative elements
- Alternating background tones for visual separation

---

### Technical Implementation

**Files to modify:**

1. `src/pages/Events.tsx` - Add  badges, better card structure
2. `src/pages/Teams.tsx` - Add hero, improve cards, add Lucide icons
3. `src/index.css` - Add new professional styles for both pages

**New CSS classes to add:**

- `.events-hero-overlay` - gradient overlay
- `.event-card-pro` - glassmorphism cards
- `.event-badge` - category badges
- `.stat-card` - animated stats
- `.teams-hero` - hero section
- `.team-card-pro` - dark themed cards
- `.social-icon` - icon buttons

**Dependencies:**

- Using existing Lucide React icons (already installed)
- No new packages needed