# Accommodation Seva

Internal management tool for organizing people into teams for sports events (ACO). Multi-zone organizational structure with role-based access control.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, Tailwind CSS 4, shadcn/ui, wouter, TanStack Query |
| Backend | Express 4, tRPC 11, Zod, Superjson |
| Database | MySQL via Drizzle ORM |
| PDF Export | PDFKit (server-side) |
| Drag & Drop | dnd-kit (Hotels page) |

## Prerequisites

- Node.js 20+ (uses nvm)
- MySQL running on port 3306 (password: `bhavin`)
- Database `accommodation_seva` created

## Quick Start

```bash
# Create the database (if not done)
mysql -u root -pbhavin -e "CREATE DATABASE IF NOT EXISTS accommodation_seva CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

# Run migrations
cd server && npm run db:migrate

# Seed 150 sample people
npm run db:seed

# Start both servers
cd .. && ./dev.sh
```

Open **http://localhost:5173** in your browser.

The first user to sign in automatically becomes **Admin**.

## Development

```bash
# Backend only (port 4500)
cd server && npm run dev

# Frontend only (port 5173, proxies to 4500)
cd client && npm run dev

# Run tests
cd server && npm test
```

## Workflow Pipeline

```
People → List (ACO Players) → Teams → Hotels → Assignments → Final List
```

## Role Permissions

| Role | Access |
|------|--------|
| Admin | Full CRUD on all entities |
| Zone Lead | Manages teams in assigned zones |
| Area Lead | Read access to assigned areas |
| User | Dashboard only |

## Key Features

- **People Management**: CRUD, CSV import/export, bulk operations
- **ACO Players List**: Filter stay=true players, inline team creation
- **Teams**: 2-8 members, same-zone rule enforced
- **Hotels**: Drag-and-drop team assignment to slots
- **Assignments**: Inline room number editing, PDF export
- **Final List**: Consolidated view with pipeline status
- **Admin Panel**: User role management, zone/area assignments, audit log

## Database Schema

9 tables: `users`, `zone_assignments`, `area_assignments`, `people`, `teams`, `team_members`, `hotels`, `hotel_slots`, `audit_log`
