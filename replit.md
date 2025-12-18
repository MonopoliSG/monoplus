# MonoPlus - Insurance Customer Database Platform

## Overview

MonoPlus is an AI-powered insurance agency management platform designed for Turkish insurance companies. The platform enables customer portfolio management, policy tracking, cross-sell recommendations, and segment analytics. Key features include:

- **Customer Database**: Import and manage insurance customer data via CSV
- **Product Management**: Define and categorize insurance products
- **AI-Powered Segmentation**: Automatically segment customers by demographics, product ownership, city, vehicle brand, renewal years
- **Cross-Sell Recommendations**: AI analyzes customer profiles to suggest complementary insurance products
- **Segment Analytics**: AI-driven behavioral analysis of customer segments
- **Campaign Management**: Create and track marketing campaigns targeting specific segments

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight router)
- **State Management**: TanStack Query for server state
- **UI Components**: shadcn/ui built on Radix UI primitives
- **Styling**: Tailwind CSS with custom design tokens
- **Build Tool**: Vite with custom plugins for Replit environment

### Backend Architecture
- **Runtime**: Node.js with Express
- **Language**: TypeScript (ESM modules)
- **API Pattern**: RESTful JSON API under `/api/*` routes
- **Authentication**: Replit OpenID Connect (OAuth) with Passport.js
- **Session Storage**: PostgreSQL-backed sessions via connect-pg-simple

### Data Layer
- **ORM**: Drizzle ORM with PostgreSQL dialect
- **Schema Validation**: Zod with drizzle-zod integration
- **Database**: PostgreSQL (configured for Supabase/Render deployment with SSL)

### AI Integration
- **Provider**: OpenAI API for customer analysis, segmentation insights, and product recommendations
- **Use Cases**: 
  - Customer profile cross-sell analysis
  - Segment behavior analysis
  - New product suggestions based on segment characteristics

### Project Structure
```
├── client/src/          # React frontend
│   ├── components/      # UI components (shadcn/ui + custom)
│   ├── pages/           # Route pages
│   ├── hooks/           # Custom React hooks
│   └── lib/             # Utilities and providers
├── server/              # Express backend
│   ├── routes.ts        # API route definitions
│   ├── storage.ts       # Data access layer
│   └── db.ts            # Database connection
├── shared/              # Shared code
│   └── schema.ts        # Drizzle schema + Zod types
└── migrations/          # Database migrations
```

### Build & Deployment
- **Development**: `npm run dev` - runs tsx with hot reload
- **Production Build**: Custom esbuild script bundles server, Vite builds client
- **Database Migrations**: `npm run db:push` via drizzle-kit

## External Dependencies

### Database
- **PostgreSQL**: Primary database via Drizzle ORM
- **Supabase**: Recommended PostgreSQL hosting for production
- **Connection**: SSL-enabled for external database connections

### Authentication
- **Replit Auth**: OpenID Connect integration for user authentication
- **Session Secret**: Required `SESSION_SECRET` environment variable

### AI Services
- **OpenAI API**: Powers customer analysis and recommendations
- **Required**: `OPENAI_API_KEY` environment variable

### Environment Variables
- `DATABASE_URL`: PostgreSQL connection string
- `SESSION_SECRET`: Secret for session encryption
- `OPENAI_API_KEY`: OpenAI API key for AI features
- `ISSUER_URL`: (Optional) OIDC issuer, defaults to Replit

### Hosting
- **Render**: Recommended for production deployment
- **Replit**: Development environment with integrated Vite plugins