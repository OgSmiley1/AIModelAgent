# Rest Express Application

## Overview

This is a full-stack TypeScript application built with Express.js backend and React frontend, featuring AI-powered business management capabilities focused exclusively on Telegram integration, client management, and intelligent analytics. The application is designed for luxury sales and client relationship management (Vacheron Constantin watches), with sophisticated AI analysis capabilities powered by Google Gemini API for natural language processing and automated appointment reminders.

## User Preferences

Preferred communication style: Simple, everyday language.

## Recent Changes

### October 15, 2025
- **Telegram Ambassador Authentication Implemented**: Added secure session-based access control for Telegram bot with ambassador-scoped data visibility
  - Authentication flow: /start → name prompt (Maaz/Riham/Asma) → password "12001" → chat-to-ambassador binding
  - Database: telegram_ambassadors table tracks chat ID to ambassador mappings with boundAt timestamp
  - Session management: chatSessions Map maintains authentication state and multi-step auth flow
  - Data scoping: All commands filter clients by primaryOwner/salesAssociate matching authenticated ambassador
  - Secured commands: /stats, /due, /lead, /list_confirmed, /list_sold, /list_hesitant, /list_callback, /list_vip, /clients_for
  - Natural language processing: AI requests require authentication and use scoped client data (getClientsByOwner)
  - /switch command: Allows ambassadors to change identity by re-authenticating
  - Security verified: No unauthenticated access, no data leakage, proper scoping on all pathways
  - Storage methods: getClientsByOwner() and getFollowUpsByOwner() filter by ambassador ownership

### October 14, 2025
- **JWT Session Authentication Implemented**: Fixed Advanced AI 403 errors with secure cookie-based JWT authentication system
  - Login credentials: Smiley/Smiley@123jz at /api/auth/advanced-ai
  - JWT tokens stored in httpOnly cookies (12-hour expiration, sameSite=lax)
  - Protected routes: /api/advanced-ai/process, /api/advanced-ai/analyze-psychology, /api/advanced-ai/generate-content
  - Security: Production requires ADVANCED_AI_JWT_SECRET env var (throws error if missing)
  - Frontend mutations properly parse JSON responses for all Advanced AI endpoints
  - E2E tested: Login creates JWT cookie, messages process successfully (200 OK), AI responses render correctly, no 403 errors
- **Live Data Synchronization**: Fixed sidebar client count display to show real-time database count (463) instead of hardcoded value (287)
  - WebSocket integration ensures dashboard, sidebar, and activity feed update in real-time
  - Telegram bot commands (/stats, /due, /lead) all query database live with accurate counts
  - Current client breakdown: 396 requested_callback, 50 changed_mind, 16 sold, 1 prospect
- **Advanced Analytics & SLA Monitoring**: Created dedicated stats module (server/storage/stats.ts) with Drizzle-based queries replacing in-memory storage
- **System Health Endpoints**: Added GET /api/status for integration health checks and GET /api/actions/next for daily action recommendations
- **SLA Breach Detection**: Implemented 24-hour SLA tracking with visual warning banner on dashboard when conversations go unresponded
- **Telegram Power Commands**: Added /status (system health), /due (pending followups), /lead <clientId> (lead details) commands
- **Daily Metrics Rollup**: Created metrics_daily table and jobs/daily-rollup.ts script for historical analytics persistence
- **Dashboard Enhancements**: Added SLA warning banner and Next Actions widget showing due followups and new client contacts
- **Defensive Rendering**: Updated frontend with optional chaining and safe defaults to prevent crashes on missing data
- **E2E Testing**: Verified dashboard renders correctly with all new analytics features and no JavaScript errors

### October 13, 2025
- **PostgreSQL Persistent Storage**: Migrated from in-memory to PostgreSQL database - all data now survives restarts
- **Excel Import Optimization**: Refined import logic to filter MAAZ entries only, deduplicate by Client_ID+Watch_Reference pairs (223 unique clients from 298 rows)
- **Watch Catalog Database**: Created comprehensive watch catalog with 6 Vacheron Constantin models including detailed specifications (case size, movement, complications, materials)
- **FAQ/Knowledge Base**: Built FAQ database with 10 professional client service scripts covering repairs, warranty, product info, and sales scenarios
- **Enhanced Telegram Bot**: Added advanced commands (/list_vip, /watch <reference>, /faq <query>) with AI-powered natural language support for watch and FAQ queries
- **Data Persistence Verified**: E2E testing confirms 223 clients, 6 watches, and 10 FAQs persist across server restarts
- **Robust Error Handling**: Implemented graceful fallback messaging when AI processing is unavailable

### October 11, 2025
- **Excel Data Import**: Successfully imported client and appointment data from Vacheron Constantin V1 tracker workbook
- **Appointment Reminders**: Added automated Telegram notification system that sends reminders 24 hours before appointments
- **WhatsApp Removal**: Removed all WhatsApp features from the UI (menu items, status indicators, routes) - system now Telegram-focused only
- **Telegram Bot**: Enhanced with Google Gemini AI for natural language command processing
- **UI Updates**: Sidebar now shows "Telegram Bot: ● Active" status

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript and Vite for development
- **UI Components**: Shadcn/ui component library with Radix UI primitives
- **Styling**: Tailwind CSS with CSS variables for theming (neutral base color)
- **State Management**: TanStack Query for server state management
- **Routing**: Wouter for client-side routing
- **Real-time Communication**: Socket.io client for WebSocket connections
- **Forms**: React Hook Form with Zod validation

### Backend Architecture
- **Runtime**: Node.js with Express.js server
- **Language**: TypeScript with ESNext modules
- **Database**: PostgreSQL with Drizzle ORM for type-safe database operations
- **Real-time**: WebSocket implementation using Socket.io
- **File Structure**: Modular architecture with shared types between client and server
- **Build System**: Vite for frontend, esbuild for backend bundling

### Data Storage Solutions
- **Primary Database**: PostgreSQL with Drizzle ORM
- **Migration System**: Drizzle Kit for database schema management
- **Schema Definition**: Centralized schema in `shared/schema.ts` with Zod validation
- **Connection**: Neon Database serverless PostgreSQL integration

### Authentication and Authorization
- **Session Management**: Connect-pg-simple for PostgreSQL-backed sessions
- **Advanced AI JWT Auth**: Secure JWT-based authentication for Advanced AI features
  - Token system: server/auth/token.ts with sign/verify functions
  - httpOnly cookies (12-hour expiration, sameSite=lax, secure in production)
  - Protected middleware: server/middleware/auth.ts (requireAdvancedAuth)
  - Cookie parser middleware for JWT extraction from requests
- **User System**: Built-in user management with role-based access
- **API Security**: Express middleware for request validation and error handling

### AI and Analytics Integration
- **AI Services**: Google Gemini API (gemini-2.0-flash-exp) for natural language processing
- **Telegram Bot Integration**: Automated message handling with context-aware responses
- **Real-time Analytics**: WebSocket-based live data streaming
- **Message Processing**: Intelligent sentiment analysis and client profiling
- **Appointment Reminders**: Automated Telegram notifications 24 hours before appointments

## External Dependencies

### Database Services
- **Neon Database**: Serverless PostgreSQL hosting with connection pooling
- **Drizzle ORM**: Type-safe database toolkit with schema migrations

### AI and Communication APIs
- **Google Generative AI**: Gemini 2.0 Flash for conversation analysis and business intelligence
- **Telegram Bot API**: Automated message handling and appointment reminders
- **TanStack Query**: Server state synchronization and caching

### UI and Styling
- **Radix UI**: Comprehensive component primitives for accessibility
- **Tailwind CSS**: Utility-first CSS framework with custom design system
- **Lucide React**: Icon library for consistent UI elements
- **React Icons**: Additional icon sets including brand icons

### Development and Build Tools
- **Vite**: Fast development server and build tool with HMR
- **TypeScript**: Type safety across the entire application stack
- **ESBuild**: Fast JavaScript bundler for production builds
- **Replit Integration**: Development environment plugins and runtime error handling

### Real-time and WebSocket
- **Socket.io**: Bidirectional real-time communication
- **WebSocket**: Native browser WebSocket API integration
- **Live Updates**: Real-time client updates and message streaming

### Validation and Forms
- **Zod**: Runtime type validation and schema definition
- **React Hook Form**: Performant form management with validation
- **Hookform Resolvers**: Integration between React Hook Form and Zod