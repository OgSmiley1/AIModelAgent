# Rest Express Application

## Overview

This is a full-stack TypeScript application built with Express.js backend and React frontend, featuring AI-powered business management capabilities including WhatsApp integration, client management, and intelligent analytics. The application appears to be focused on luxury sales and client relationship management, with sophisticated AI analysis capabilities for message processing and customer insights.

## User Preferences

Preferred communication style: Simple, everyday language.

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
- **User System**: Built-in user management with role-based access
- **API Security**: Express middleware for request validation and error handling

### AI and Analytics Integration
- **AI Services**: Dedicated AI analyzer service for conversation analysis
- **WhatsApp Integration**: Business API integration with webhook processing
- **Real-time Analytics**: WebSocket-based live data streaming
- **Message Processing**: Intelligent sentiment analysis and client profiling

## External Dependencies

### Database Services
- **Neon Database**: Serverless PostgreSQL hosting with connection pooling
- **Drizzle ORM**: Type-safe database toolkit with schema migrations

### AI and Communication APIs
- **WhatsApp Business API**: Message processing and client communication
- **Google Generative AI**: Conversation analysis and business intelligence
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