# Busal OS

AI-first multi-tenant operating system for small businesses. Version 1 targets restaurants with an architecture designed to support future industries without redesign.

## Tech Stack

- **Frontend:** Next.js 15 (App Router), React, TypeScript
- **Styling:** Tailwind CSS, shadcn/ui
- **Backend:** Supabase (Auth + PostgreSQL)
- **ORM:** Prisma
- **State:** Zustand
- **Data Fetching:** TanStack Query
- **Forms:** React Hook Form + Zod
- **Tables:** TanStack Table
- **Deployment:** Vercel

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm 9+
- Supabase project

### Setup

1. Clone the repository
2. Copy environment variables:

```bash
cp .env.example .env.local
```

3. Fill in your Supabase credentials in `.env.local`
4. Install dependencies:

```bash
pnpm install
```

5. Run database migrations:

```bash
pnpm db:migrate
```

6. Start the development server:

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

| Script             | Description              |
| ------------------ | ------------------------ |
| `pnpm dev`         | Start development server |
| `pnpm build`       | Production build         |
| `pnpm lint`        | Run ESLint               |
| `pnpm format`      | Run Prettier             |
| `pnpm typecheck`   | TypeScript check         |
| `pnpm db:generate` | Generate Prisma client   |
| `pnpm db:migrate`  | Run database migrations  |

## Project Structure

```
src/
├── app/           # Next.js App Router pages and API routes
├── components/    # Shared UI components (ui/, layout/, common/)
├── features/      # Feature modules by business capability
├── modules/       # Domain modules (auth, tenant, etc.)
├── hooks/         # Custom React hooks
├── lib/           # Core libraries (Supabase, Prisma, utils)
├── services/      # Server-side business services
├── types/         # Shared TypeScript types
├── schemas/       # Zod validation schemas
├── stores/        # Zustand state stores
├── providers/     # React context providers
├── config/        # App configuration and env validation
├── constants/     # App-wide constants
├── utils/         # Utility functions
└── middleware.ts  # Auth middleware
```

## License

Private — All rights reserved.
