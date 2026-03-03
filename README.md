# DataPraktis — SaaS Marketplace for Data Analysts

A full-stack marketplace platform connecting SMBs with freelance data analysts. Built with modern web technologies, role-based access control, payment integration, and project workflow management.

## Features

- **Analyst-Client Matching**: Smart algorithm to connect projects with qualified analysts
- **Role-Based Access Control**: Separate flows for analysts, clients, and admins
- **Project Management**: Create, bid, accept, and track projects end-to-end
- **Payment Integration**: Secure escrow-style payments via Midtrans API
- **Admin Dashboard**: Monitor platform health, manage disputes, analytics
- **Real-Time Updates**: Live notifications for bids, messages, project status
- **Analyst Profiles**: Portfolio showcase, ratings, review system

## Tech Stack

- **Frontend**: Next.js, TypeScript, Tailwind CSS, React Query
- **Backend**: Next.js API routes, Supabase PostgreSQL
- **Database**: PostgreSQL (via Supabase)
- **Authentication**: Supabase Auth
- **Payments**: Midtrans API
- **Deployment**: Vercel

## How It Works

### For Clients
1. Post a data analysis project (budget, scope, timeline)
2. Receive bids from qualified analysts
3. Review proposals and portfolios
4. Accept an analyst and fund the project
5. Track progress and communicate in-platform
6. Release payment upon completion

### For Analysts
1. Browse available projects
2. Bid on projects matching your expertise
3. Get selected and negotiate scope
4. Deliver analysis/report
5. Receive payment via Midtrans

## Project Structure

```
├── app/
│  ├── (auth)/
│  │  ├── login/
│  │  └── register/
│  ├── (dashboard)/
│  │  ├── analyst/
│  │  │  ├── projects/
│  │  │  ├── bids/
│  │  │  └── earnings/
│  │  ├── client/
│  │  │  ├── post-project/
│  │  │  ├── my-projects/
│  │  │  └── payments/
│  │  └── admin/
│  │     └── analytics/
│  └── api/
│     ├── projects/
│     ├── bids/
│     ├── payments/
│     └── users/
├── components/
│  ├── ProjectCard
│  ├── BidForm
│  ├── PaymentFlow
│  └── ...
├── lib/
│  ├── supabase.ts
│  ├── midtrans.ts
│  └── matching.ts
└── ...
```

## Key Implementation Details

**Matching Algorithm**: 
- Analyzes project requirements against analyst skills
- Considers past ratings and project history
- Suggests top 3-5 analysts per posting

**Payment Flow**:
- Client funds escrow on project acceptance
- Funds held securely via Midtrans
- Released to analyst upon project completion
- Handles disputes and refunds

**Real-Time Features**:
- Supabase Realtime subscriptions for notifications
- Live bid counter updates
- Project status changes push to both parties

## Learnings

- **Full-stack SSR benefits**: Next.js API routes eliminate backend overhead
- **Payment complexity**: Escrow logic requires careful state management
- **Matching is hard**: Simple keyword matching underperforms; need ML
- **User trust**: Payment security and fair dispute resolution are critical
- **Two-sided marketplace dynamics**: Need to balance incentives for both sides

## Future Enhancements

- [ ] AI-powered project categorization
- [ ] Automated bid ranking (not just time-based)
- [ ] Dispute resolution system
- [ ] Milestone-based payments
- [ ] In-platform analytics tools
- [ ] CSV upload for batch projects
- [ ] Team collaboration for larger projects

---

**Author**: Aldrich Vincent  
**Status**: In development (2025-present)  
**Live Demo**: https://datapraktis-g54aricz6-aldricjs-projects.vercel.app  
**Repository**: https://github.com/AldrichVin/DataPraktis
