# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**DataPraktis** is a niche marketplace connecting Indonesian SMBs with data analysts. Businesses post projects using guided templates, get matched with vetted analysts, and pay via milestone-based escrow.

## Tech Stack

- **Frontend**: Next.js 14 (App Router), React, TypeScript, Tailwind CSS
- **Backend**: Next.js API routes (Phase 1), NestJS (Phase 2+)
- **Database**: PostgreSQL with Prisma ORM
- **Auth**: NextAuth.js (credentials + Google OAuth)
- **Payments**: Midtrans (Indonesian payment gateway)
- **File Storage**: AWS S3 with signed URLs
- **Monorepo**: Turborepo with npm workspaces

## Commands

```bash
# Install all dependencies
npm install

# Development
npm run dev                    # Run all apps in dev mode
npm run dev --filter=web       # Run only frontend

# Database
npm run db:generate            # Generate Prisma client
npm run db:push                # Push schema to database
npm run db:studio              # Open Prisma Studio

# Build & Lint
npm run build                  # Build all packages
npm run lint                   # Lint all packages
npm run format                 # Format with Prettier
```

## Project Structure

```
datapraktis/
├── apps/
│   └── web/                   # Next.js frontend
│       ├── src/app/           # App Router pages
│       │   ├── (auth)/        # Login, register
│       │   ├── (dashboard)/   # Protected dashboard pages
│       │   │   ├── dashboard/ # Main dashboard
│       │   │   ├── projects/  # Client projects list + creation wizard
│       │   │   ├── browse/    # Analyst project discovery
│       │   │   ├── analyst/   # Analyst profile management
│       │   │   └── messages/  # Conversations
│       │   └── api/           # API routes
│       ├── src/components/    # React components
│       │   ├── ui/            # shadcn/ui components
│       │   └── dashboard/     # Dashboard-specific components
│       └── src/lib/           # Utilities, auth config
│
├── packages/
│   ├── db/                    # Prisma schema & client
│   │   └── prisma/
│   │       ├── schema.prisma
│   │       └── seed.ts        # Template seed data
│   └── types/                 # Shared TypeScript types
```

## Key Pages

- `/` - Landing page (public)
- `/login`, `/register` - Authentication
- `/dashboard` - Role-based dashboard (client vs analyst)
- `/projects` - Client's projects list
- `/projects/new` - Multi-step project creation wizard
- `/projects/[id]` - Project detail with proposals management (client)
- `/browse` - Analyst discovers available projects
- `/browse/[id]` - Project detail with proposal submission (analyst)
- `/workspace/[id]` - Active project workspace with milestone management
- `/messages` - In-app messaging/conversations
- `/analyst/profile` - Analyst profile editor
- `/analyst/earnings` - Earnings and withdrawal management

### Admin Pages (require ADMIN role)
- `/admin` - Admin dashboard with platform overview
- `/admin/users` - User management with filters and search
- `/admin/projects` - All projects management
- `/admin/withdrawals` - Withdrawal approval workflow
- `/admin/analytics` - Platform metrics and analytics

## Seeding Database

```bash
npm run db:push                # First push schema
npx tsx packages/db/prisma/seed.ts   # Then seed templates
```

## Architecture

### Database Schema (Core Entities)

- **User**: Both clients and analysts, with `role` field
- **AnalystProfile**: Extended profile for analysts (skills, ratings, bank info)
- **Template**: Guided project templates with questions, suggested budgets
- **Project**: Client's data project (linked to template, files, milestones)
- **Proposal**: Analyst's bid on a project
- **Milestone**: Project phases with payment amounts and status
- **Transaction**: Escrow payments via Midtrans
- **Conversation/Message**: In-app messaging

### Auth Flow

1. Users register as CLIENT or ANALYST via `/register`
2. Analysts go through `/onboarding/analyst` to complete profile
3. JWT-based sessions via NextAuth
4. Role-based access in middleware and API routes

### Payment Flow (Midtrans) - Professional Marketplace Standard

The platform follows Upwork/Toptal-style professional workflow:

**Pre-funded Milestones:**
1. Client accepts proposal → prompted to fund first milestone
2. Client pays via Midtrans (bank transfer, e-wallet, etc.)
3. Midtrans webhook updates transaction to ESCROWED, milestone to IN_PROGRESS
4. Analyst can now start work (funds secured in escrow)

**14-Day Auto-Release Timer:**
1. Analyst submits milestone → `autoReleaseAt` set to 14 days
2. Client has 14 days to: Approve, Request Revision, or Dispute
3. If no action → Cron job auto-approves and releases funds
4. Timer resets on revision request

**5-Day Security Hold:**
1. When payment released → `availableAt` set to 5 days from now
2. Funds shown as "Security Hold" in earnings page
3. After 5 days → funds become withdrawable
4. Protects against fraud/chargebacks

**Milestone Statuses:**
- `PENDING` - Awaiting funding
- `FUNDED` - Client paid, awaiting work start
- `IN_PROGRESS` - Analyst working
- `SUBMITTED` - Awaiting client review (14-day timer active)
- `REVISION_REQUESTED` - Client requested changes
- `APPROVED` - Complete, payment released
- `DISPUTED` - In dispute resolution

## Key Patterns

### API Routes

All API routes in `apps/web/src/app/api/` follow this pattern:

```typescript
export async function POST(request: Request) {
  try {
    const body = await request.json();
    // Validate with Zod
    // Business logic with Prisma
    return NextResponse.json({ success: true, data });
  } catch (error) {
    // Handle Zod errors, Prisma errors, etc.
    return NextResponse.json({ error: 'message' }, { status: 400 });
  }
}
```

### UI Components

Using shadcn/ui pattern - components in `src/components/ui/` with:
- Radix UI primitives
- Tailwind styling via `class-variance-authority`
- `cn()` utility for class merging

### Currency

All amounts in IDR (Indonesian Rupiah) stored as integers (no decimals). Use `formatCurrency()` from `@/lib/utils` for display.

## API Routes

### Projects
- `GET/POST /api/projects` - List/create projects
- `GET/PATCH /api/projects/[id]` - Get/update project
- `POST/PATCH /api/projects/[id]/proposals` - Submit/manage proposals

### Conversations
- `GET /api/conversations` - List user's conversations
- `GET /api/conversations/[id]` - Get conversation with messages
- `POST/GET /api/conversations/[id]/messages` - Send/fetch messages

### Milestones
- `GET/PATCH /api/milestones/[id]` - Get/update milestone (submit, approve, request_revision)
  - Submit sets `autoReleaseAt` to 14 days
  - Approve/revision clears `autoReleaseAt`

### Payments
- `POST /api/payments/create` - Create Midtrans payment
- `POST /api/payments/webhook` - Midtrans webhook handler (sets `fundedAt`)
- `POST /api/payments/release` - Release escrow to analyst (sets 5-day `availableAt`)

### Cron Jobs
- `GET/POST /api/cron/auto-release` - Auto-release milestones past 14-day deadline
  - Should be called hourly by scheduler (Vercel Cron, etc.)
  - Set `CRON_SECRET` env var for production security

### Analyst
- `GET/PUT /api/analyst/profile` - Manage analyst profile
- `GET/POST /api/analyst/withdrawals` - Balance and withdrawal requests

### Reviews
- `GET/POST /api/reviews` - Get/create reviews

### Files
- `POST /api/files/upload-url` - Get presigned S3 upload URL
- `GET/DELETE /api/files/[id]` - Download/delete file

### Admin
- `GET /api/admin/stats` - Platform statistics
- `GET /api/admin/users` - List users with pagination
- `GET /api/admin/projects` - List all projects
- `GET/PATCH /api/admin/withdrawals` - Manage withdrawals
- `GET /api/admin/analytics` - Analytics data

## Environment Variables

Required in `apps/web/.env`:

```
DATABASE_URL              # PostgreSQL connection string
NEXTAUTH_URL              # http://localhost:3000 for dev
NEXTAUTH_SECRET           # Random 32+ char secret
GOOGLE_CLIENT_ID          # Optional for Google OAuth
GOOGLE_CLIENT_SECRET      # Optional for Google OAuth
MIDTRANS_SERVER_KEY       # Midtrans server key (sandbox or production)
NEXT_PUBLIC_MIDTRANS_CLIENT_KEY  # Midtrans client key for frontend

# AWS S3 for file storage
AWS_REGION                # ap-southeast-1
AWS_ACCESS_KEY_ID         # IAM access key
AWS_SECRET_ACCESS_KEY     # IAM secret key
AWS_S3_BUCKET             # S3 bucket name (e.g., datapraktis-files)

# Cron Jobs (production)
CRON_SECRET               # Secret for authenticating cron job requests
```

## Workspace Components

Located in `apps/web/src/components/workspace/`:

- **FundMilestoneModal** - Payment prompt shown when accepting proposal
- **MilestoneStatusBadge** - Visual status indicators (PENDING, FUNDED, IN_PROGRESS, etc.)
- **AutoReleaseCountdown** - Shows 14-day countdown timer for client review

## Development Notes

- Indonesian language (Bahasa) for all user-facing text
- Amounts always in IDR, format with `Rp X.XXX.XXX`
- 10% commission taken from analyst payout, not added to client price
- Files encrypted at rest, accessible only after hiring
- Auto-delete files 90 days after project completion
