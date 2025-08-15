# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- `npm run dev` - Start development server on http://localhost:3000
- `npm run build` - Build production bundle
- `npm run start` - Start production server
- `npm run lint` - Run ESLint for code quality checks

## Project Architecture

This is a Next.js 14 E-Procurement system with Supabase backend integration for authentication, database, and file storage.

### Tech Stack
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS + shadcn/ui
- **Authentication**: Supabase Auth with Row Level Security
- **Database**: PostgreSQL via Supabase
- **Storage**: Supabase Storage (PDF documents)
- **Validation**: Zod schemas

### Route Architecture
```
src/app/
├── (auth)/          # Public auth routes (centered layout)
│   ├── login/
│   └── signup/      
├── (protected)/     # Protected routes (sidebar + header layout)
│   ├── dashboard/   # Role-based dashboards
│   ├── admin/       # Admin-only routes
│   └── supplier/    # Supplier-only routes
└── api/            # API endpoints
```

### Critical Supabase Integration Pattern
**IMPORTANT**: Always use the correct Supabase client for the context:
- **Client Components**: Use `@/lib/supabase.ts` (browser client)
- **Server Components/API Routes**: Use `@/lib/supabase-server.ts` (server client)
- **Middleware**: Use special middleware client from `@/lib/supabase-server.ts`
- **Storage Admin Operations**: Use service role client

### Authentication Security
- **Always use `supabase.auth.getUser()`** instead of `getSession()` for security
- Middleware protects routes and enforces role-based access (admin/supplier)
- Custom `useAuth` hook manages auth state and role detection
- All database tables have Row Level Security (RLS) policies

### Database Schema Overview
Core tables with RLS policies:
- `profiles` - User profiles with roles
- `tenders` - Procurement opportunities
- `suppliers` - Supplier company information
- `rfp_docs` - Tender documents
- `proposals` - Supplier submissions
- `events` - Audit trail

### Storage Configuration
- PDF-only storage with strict validation
- Organized by prefixes: `rfps/`, `proposals/`, `contracts/`
- Uses signed URLs for secure access
- Requires service role for admin operations

### Environment Setup
Required in `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=your_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### Key Architectural Decisions
1. **Route Groups**: `(auth)` for public, `(protected)` for authenticated
2. **Component Organization**: Separate `/auth`, `/layout`, `/ui` folders
3. **Security-First**: RLS policies, input validation, secure file handling
4. **Role-Based Access**: Middleware enforces admin vs supplier permissions
5. **Design System**: Brand color `#1a3a5a`, Poppins font, shadcn/ui components

### Current Implementation Status
- ✅ Complete authentication system with Supabase
- ✅ Role-based middleware protection
- ✅ Database schema with RLS policies
- ✅ UI component library setup
- ✅ PDF storage infrastructure
- 🔄 CRUD operations for tenders (in progress)
- 📋 Testing framework (not implemented)