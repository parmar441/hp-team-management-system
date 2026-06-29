# Handoff: Group & Team Manager — Mobile App

## Overview
A mobile (390×844, iOS-sized) companion app for the **Group & Team Manager** system — managing people registrations, organizing them into teams, assigning teams to hotels/rooms, and providing role-based dashboards. This handoff covers the full connected mobile experience across all 13 pages from the product spec.

The primary design file is **`Group Manager Mobile.dc.html`** — a single connected app with bottom-tab navigation and a "More" menu. `People Mobile.dc.html` is a standalone version of just the People screen (same visual language).

## About the Design Files
The files in this bundle are **design references created in HTML** — interactive prototypes showing intended look and behavior. They are **not production code to copy directly.** The `.dc.html` files use an internal "Design Component" runtime (`support.js`) for templating/state — **do not port that runtime.**

The task is to **recreate these designs in the target codebase's environment.** Per the source spec, the intended stack is:
- **React 19 + TypeScript**, **Tailwind CSS 4**, **shadcn/ui (Radix primitives)**
- **React Router 6**, **React Query + Axios** for data
- Backend: **Express + Mongoose + MongoDB** (REST), **JWT auth**
- Fonts: **Inter** (body), **Playfair Display** (headings); **dark mode**, **OKLCH** color system

If implementing in a different environment, use that codebase's established patterns and component library; treat this as the visual + behavioral source of truth.

A copy of the original product specification is included: **`spec/Group-Team-Manager-MERN-Spec-v7.pdf`** — refer to it for exact schemas, REST routes, RBAC, and GDPR rules.

## Fidelity
**High-fidelity (hifi).** Final colors, typography, spacing, and interactions are intentional. Recreate pixel-faithfully using the codebase's component library. Exact tokens are in the **Design Tokens** section.

---

## Information Architecture & Navigation

- **Phone frame:** 390×844 screen; 50px status bar at top; 80px bottom tab bar; content scrolls between.
- **Bottom tab bar (always visible):** `Home` (Dashboard), `People`, `Teams`, `Hotels`, `More`. Active item uses the **accent** color; inactive `oklch(0.55 0.012 280)`.
- **"More" bottom sheet** (opens from the More tab) is a 2-column grid linking to the remaining pages: `Registration`, `Zones`, `Areas`, `List`, `Rooms`, `Assignments`, `Final List`, `Admin Panel`, `Search Assistant`.
- **Role-based access (RBAC):** The design has a `role` prop (`admin` | `zone_lead` | `area_lead`). Admin sees all actions. Leads see read/filter only — admin-only actions (Add, Edit, Delete, ACO/check-in toggles, bulk, Select mode) are hidden. The backend enforces this via `requireAdmin`; the spec's full sidebar-by-role matrix should drive which tabs/pages each role can reach.

---

## Domain Model (drives every screen)

From the spec's `Person` schema — use these exact field names:
`firstName, lastName, email, phone, city, state, country, gender ("M"/"F"), mandal (US state, used for zone/area rule matching), familyId, ageRange, memberId, acoNeeded ("Yes"/"No"), zone, area, category, note, checkedIn ("Yes"/"No")`. Virtuals: `fullName`, `isAcoPlayer`, `isCheckedIn`.

Key concepts:
- **ACO** (`acoNeeded`): whether the person participates. Setting to **"No" removes them from any team** (cascade).
- **zone / area**: computed by configurable **dynamic rules** matched against the person's `mandal`/gender/country/ageRange.
- **checkedIn**: per-person check-in status, tracked on the Dashboard.
- **Team**: `name` ("Team N"), `zone`, `members[]` (Person refs). 2–8 members; only ACO=Yes people not already on a team are eligible; team inherits its first member's zone.
- **Tournament (Hotel)**: `name`, `address`, `totalSlots` (default 8), `status` (`upcoming`/`not_available`/`available`).
- **TournamentSlot**: `slotNumber`, `teamId` (nullable), `roomNumber`. Virtuals `isOccupied`, `hasRoom`.
- **HotelRoom**: pre-defined room numbers per hotel; assignment UI shows available rooms.
- **DynamicZone/Area + Rules**: zone/area = `{name, isDefault}`; rule = `{field ∈ [gender,mandal,country,ageRange], matchValue, priority}` (areas omit `country`).

---

## Screens / Views

> Common header pattern: a **Playfair Display 28px/800** title (letter-spacing −0.5px), a 13px/500 muted subtitle below it, and an optional top-right action button (42×42 rounded-13 accent button with a `+`, or a pill).

### 1. Dashboard (`Home`)
- **Purpose:** At-a-glance status + quick entry points.
- **Layout:** Header row = "Welcome back" / **Dashboard** title on the left, a role pill on the right (accent-soft bg, accent dot + label). Then a **2×2 grid of stat cards** (gap 11px). Then a **"Check-in by zone"** card with one labeled progress bar per zone. Then a **2×2 "Quick actions"** grid.
- **Stat cards:** card bg `oklch(0.21 0.012 280)`, border `oklch(0.29…)`, radius 17px, padding 15px. Top: 34×34 rounded-11 tinted icon chip. Value: **Playfair 28px/800**. Label: 12.5px/500 muted. The four stats: Registered (total people), ACO players, Teams, Hotels.
- **Check-in bars:** track `oklch(0.27 0.012 280)` 8px tall radius 4; fill = accent, width = done/total %, animates in (`scaleX` 0→1, 0.6s). Right label `done/total`.
- **Quick actions:** Register, Assignments, Search, Final List — each a row card with accent-soft icon chip + 13.5px/600 label; navigates to that screen.

### 2. People
- **Purpose:** Browse/manage all registered members.
- **Layout:** Header ("People" + "{N} registered members") with a **filter button** (shows active-filter count badge). Below: **search input** (name/city/member ID). Optional row of removable **active-filter chips**. Then a "SHOWING {N}" row with a **Select** toggle (admin only). Then a vertical list of **person cards**.
- **Person card:** bg `oklch(0.21 0.012 280)`, border `oklch(0.30…)` (accent-border when selected), radius 18px, padding 15px. Row: optional select checkbox (24×24, accent when checked) → 44×44 rounded-14 **avatar** (deterministic per-name OKLCH hue, initials) → name (15.5px/700) + sub "City, ST" (12.5px/500 muted) → check-in dot (22×22 sky chip with check) if checked-in → 32×32 overflow "⋯" button. Second row: **Zone pill** (accent-soft), **ACO pill** (emerald if Yes / neutral if No, with "ACO" mini-label), then "Area · Gender" muted text.
- **Filter sheet** (bottom sheet): grouped chip selectors for **Zone, Area, Gender, Country, ACO participation, Check-in status**; "Reset" + a primary "Show {N} people" button. Single-select per group; selecting toggles live.
- **Action sheet** (from ⋯): person header + actions: **View full details**, **Check in / Mark not checked in**, **Set ACO to Yes/No**, **Delete person** (rose). Non-admins only see View details.
- **Detail sheet:** large avatar + name (Playfair 23px) + sub; Zone/ACO/Check-in badges; a field table (Member ID, Family ID, Gender, Age range, Category, Email, Phone, City, State, Country, Mandal, Zone, Area, Team, Hotel·Room); admin gets Check-in and ACO buttons.
- **Select mode:** checkboxes appear; a floating bottom **bulk bar** shows "{n} selected" + **Check in**, **ACO** (toggle), **Delete** actions.

### 3. Registration
- **Purpose:** Add a new member.
- **Layout:** Title + "Add a new member to the system". Form fields (label 12px/600 muted above each input; inputs 46px tall, bg `oklch(0.20 0.011 280)`, border `oklch(0.29…)`, radius 13px): First name* / Last name (2-col), Email, Phone / Family ID (2-col), City / State (mandal) (2-col). Then segmented/chip selectors: **Country** (USA/Canada/Other), **Gender** (Male/Female), **Age range** (0-12/13-17/18-25/26-40/41-60/60+), **ACO participation** (ACO player/Non-ACO). Primary "Register person" button (54px, accent). First name required → validation toast if empty; on submit, person is added with zone "Unassigned" until rules run.

### 4. Zones  &  5. Areas
- **Purpose:** View/manage dynamic classification rules.
- **Layout:** Title + subtitle + top-right `+` button. Vertical list of **zone/area cards**: header row = name (16.5px/700) + a **DEFAULT** badge (zones, accent-soft) or **zone** badge (areas, neutral) + member count (right, muted). Below, a stack of **rule rows** (bg `oklch(0.185 0.011 280)`, radius 11, padding 10×12): "{field label}  is  **{matchValue}**" with a right-aligned **priority pill** ("P10", accent-soft). Field labels: mandal → "State (mandal)", plus Gender/Country/Age range.

### 6. Teams
- **Purpose:** View teams and members.
- **Layout:** Header ("Teams" + "{n} ACO players available") with a "+ New" pill. List of **team cards**: header = team name (Playfair 19px) + zone badge (accent-soft) + "{n} / 8 members" (right). Below, wrapped **member chips** (bg `oklch(0.185…)`, radius 10): 26×26 avatar + name (12.5px/600).

### 7. Hotels
- **Purpose:** Tournament venues & slot occupancy.
- **Layout:** Header + `+`. List of **hotel cards** (tappable → Assignments): name (16.5px/700) + address (muted) + **status pill** (Available=emerald, Upcoming=amber, Not available=rose). Then "{occupied} / {total} slots filled" + a fill bar (accent).

### 8. Rooms
- **Purpose:** Manage pre-defined room numbers per hotel.
- **Layout:** Header ("Rooms" + "{a}/{t} rooms assigned") + `+`. A horizontal **hotel tab row** (chips; active = accent-soft). A **3-column grid of room tiles**: room number (Playfair 20px) + status ("Assigned" emerald tile / "Available" neutral tile).

### 9. Assignments
- **Purpose:** Assign teams to hotel slots (+ room).
- **Layout:** Title + "{n} teams not yet assigned". Hotel tab row. List of **slot rows** (tappable): 40×40 status chip (emerald when occupied) + "Slot {n}" mini-label + team name (15px/700) or "Empty" + "{n} members · Room {x}" / "Tap to assign · No room set" + chevron. Per spec, room assignment uses a dropdown of available pre-defined rooms when the hotel has them, else free text.

### 10. Final List
- **Purpose:** Final roster grouped by team, with hotel/room; export.
- **Layout:** Header ("Final List" + "{n} people placed") + a **PDF** export button (outline). **Grouped cards**: header = team name (Playfair 18px) + hotel name & room (right). Member rows: 34×34 avatar + name (14px/600) + memberId (right, muted). Export is role-scoped per spec (admin = all; leads = their zones; hotel/regular users blocked).

### 11. List
- **Purpose:** Full flat registry overview + export.
- **Layout:** Header + **PDF** button. One bordered card containing compact rows: 34×34 avatar + name (14px/600) + "Zone · Area · Team" (11.5px muted) + ACO pill (emerald/neutral).

### 12. Admin Panel
- **Purpose:** Manage Hotel Person accounts (the spec's "Hotel Persons" tab).
- **Layout:** Title + "Manage hotel person accounts". Section header "Hotel Persons" + "Generate" pill. List of **account cards**: 42×42 accent-soft avatar (initials) + monospace username + "Hotel person account". Assigned-hotel chips. Buttons: "Regenerate password" (neutral) + delete (rose 46px). Generating creates a `hotel_person` user with hashed password; assign/remove hotels per spec.

### 13. Search Assistant
- **Purpose:** Natural-language search over people.
- **Layout:** Title + "Ask in plain language". A prompt input row with an accent send button. "TRY ASKING" example chips. On submit: a **user bubble** (accent, right-aligned) + a **bot answer card** (left, with the natural-language answer and a list of matched-people mini-rows: avatar + name + "zone · team"). Per spec/GDPR, only `name, zone, area, acoNeeded, team, hotel, roomNumber` are sent to the LLM — never city/state/country/gender/ageRange/memberId/mandal.

---

## Interactions & Behavior
- **Tab nav / More menu:** instant screen switch; selecting any More item closes the sheet.
- **Bottom sheets** (filter, action, more, detail): scrim fade-in (0.2s); panel slide-up `translateY(102%→0)` 0.24–0.26s `cubic-bezier(.2,.8,.2,1)`. Tap scrim to dismiss.
- **Toasts:** small centered pill above the nav; slide+fade in 0.22s; auto-dismiss ~1.9s. Used for every mutation (check-in, ACO toggle, delete, register, bulk, export, etc.).
- **ACO toggle cascade:** setting ACO→No removes the person from their team (clear `team`) and toasts "ACO set to No — removed from team."
- **Check-in toggle:** flips `checkedIn` Yes/No; updates Dashboard counts.
- **Bulk actions:** operate on selected ids, then exit Select mode.
- **Search:** parses the question, queries local people, returns an answer + matched list (in production: LLM intent-extraction → DB query → LLM answer, per spec §Search Assistant).
- **Progress/fill bars:** animate width on mount.
- **Active/press feedback:** cards/buttons darken slightly on `:active`; primary buttons scale to ~0.99.

## State Management
Per-screen/global state in the prototype (map to React Query + local component state in production):
- `screen` (current route), `moreOpen`
- People: `query`, `filters {zone, area, gender, country, aco, checkedIn}`, `filterSheetOpen`, `selectMode`, `selected{}`, `actionPerson`, `detailPerson`
- `people[]` (server data via `GET /api/people` with those filters as params)
- `hotelIdx` (selected hotel for Rooms/Assignments)
- `reg{}` (registration form), `chat[]` + `chatInput` (Search Assistant)
- `toast`
Data fetching → React Query hooks per spec (`usePeople(filters)`, `useToggleAco`, `useHotelRooms…`, etc.); mutations invalidate `["people"]` / `["teams"]`.

## Design Tokens

**Fonts**
- Body: `Inter` (400/500/600/700)
- Headings: `Playfair Display` (600/700/800)

**Colors** (OKLCH; dark theme)
- App background (outside frame): `#08090c`
- Screen background: `oklch(0.165 0.008 280)`
- Card / surface: `oklch(0.21 0.012 280)`; border `oklch(0.29–0.30 0.012 280)`
- Input background: `oklch(0.20 0.011 280)`
- Sheet / elevated background: `oklch(0.195 0.011 280)`; inset row `oklch(0.185 0.011 280)`
- Nav bar background: `oklch(0.18 0.009 280)`; top border `oklch(0.27 0.011 280)`
- Text primary: `oklch(0.97 0.003 280)`; muted `oklch(0.62–0.66 0.012 280)`; faint `oklch(0.55 0.012 280)`
- **Accent (default):** `#7c6cf5` — tweakable options: `#4f8ef7`, `#2fbf86`, `#f2607d`. Derived: `accent-soft = rgba(accent, 0.16)`, `accent-border = rgba(accent, 0.40)`.
- ACO = Yes (emerald): bg `oklch(0.31 0.055 162)`, fg `oklch(0.83 0.15 162)`
- Checked-in (sky): bg `oklch(0.31–0.32 0.055 235)`, fg `oklch(0.83 0.13 235)`
- Status Upcoming (amber): bg `oklch(0.32 0.05 85)`, fg `oklch(0.84 0.13 85)`
- Danger / delete (rose): bg `oklch(0.30 0.06 18)`, fg `oklch(0.78 0.15 18)`
- Avatars: per-name hue `h = (Σ charCodes × 37) mod 360` → bg `oklch(0.33 0.07 h)`, fg `oklch(0.85 0.13 h)`

**Radii:** cards 17–18px · sheets 26px (top corners) · inputs 13–15px · chips/pills 7–12px · FAB 17px · avatars 11–18px (rounded squares)

**Spacing:** screen horizontal padding 20px (16px on list-dense screens) · card gaps 11–12px · content bottom padding ~110–130px (clears nav)

**Type scale:** screen title 28px/800 Playfair (−0.5px) · card value 28px Playfair · body 14–15.5px · labels 12–13px · mini-labels/pills 10–12px · nav labels 10.5px

**Frame:** 390×844 screen · frame radius 46px · status bar 50px · bottom nav 80px

**Animation:** sheet slide-up 0.24–0.26s `cubic-bezier(.2,.8,.2,1)` · scrim/fade 0.2s · toast 0.22s · bar grow 0.6s

## Assets
- **No raster assets.** All icons are inline SVG (stroke-based, 1.8–2.2px, rounded caps). Recreate with your icon set (e.g., lucide) at matching weights/colors.
- Fonts via Google Fonts (Inter, Playfair Display) — or your codebase's font pipeline.

## Screenshots
The `screenshots/` folder has a reference image per screen (top-of-screen crop): `01-dashboard`, `02-people`, `03-teams`, `04-hotels`, `05-registration`, `06-zones`, `07-areas`, `08-list`, `09-rooms`, `10-assignments`, `11-final-list`, `12-admin-panel`, `13-search-assistant`. For exact spacing/colors/states, open the HTML files in a browser (they're interactive).

## Files
- `Group Manager Mobile.dc.html` — the full connected app (all 13 screens). Primary reference.
- `People Mobile.dc.html` — standalone People screen (same design language).
- `support.js` — prototype runtime only; **do not port.**
- `spec/Group-Team-Manager-MERN-Spec-v7.pdf` — original product spec (schemas, REST routes, RBAC, GDPR, business logic).
