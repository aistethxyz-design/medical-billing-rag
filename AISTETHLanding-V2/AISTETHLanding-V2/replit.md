# AISTETH Landing Page

## Overview

AISTETH is a production-ready React landing page for a healthcare AI company that provides AI-powered assistants for physicians. The application helps Ontario-based physicians save time, reduce administrative costs, and optimize billing through seamless integration with their existing tools. The landing page showcases three main AI agents: Admin Agent for scheduling and coordination, Shift Agent for medical guidance, and Billing Agent for OHIP billing optimization.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **React with TypeScript**: Uses functional components and hooks for a modern, type-safe development experience
- **Vite Build System**: Fast development server and optimized production builds with hot module replacement
- **Tailwind CSS**: Utility-first CSS framework for consistent, responsive styling with custom design tokens
- **shadcn/ui Components**: Pre-built, accessible UI components based on Radix UI primitives for professional design consistency
- **Wouter Routing**: Lightweight client-side routing for single-page application navigation

### Backend Architecture  
- **Express.js Server**: Node.js web framework handling API routes and serving static files
- **TypeScript**: End-to-end type safety across client and server code
- **Development/Production Split**: Vite dev server in development, static file serving in production

### Data Storage Architecture
- **Drizzle ORM**: Type-safe database operations with PostgreSQL dialect
- **PostgreSQL Database**: Production-ready relational database via Neon serverless
- **Schema Management**: Centralized database schema with automated migrations

### State Management
- **TanStack Query**: Server state management with caching, background updates, and optimistic updates
- **React Hook Form**: Form state management with validation using Zod schemas

### Styling and Design System
- **CSS Variables**: Dynamic theming system supporting light/dark modes
- **Component Variants**: Class Variance Authority for consistent component styling patterns
- **Responsive Design**: Mobile-first approach with Tailwind's responsive utilities

### Development Tooling
- **ESBuild**: Fast JavaScript bundling for production builds
- **TypeScript Strict Mode**: Enhanced type checking and code quality
- **Path Mapping**: Clean import paths using TypeScript path aliases

## External Dependencies

### Database and Backend Services
- **Neon Database**: Serverless PostgreSQL database hosting with connection pooling
- **Neon WebSocket**: Real-time database connections via WebSocket constructor

### UI and Component Libraries
- **Radix UI**: Accessible, unstyled UI primitives for building high-quality components
- **Lucide React**: Modern icon library with tree-shaking support
- **React Hook Form**: Form library with validation and error handling
- **Zod**: TypeScript-first schema validation for forms and API data

### Development and Build Tools
- **Vite**: Fast build tool with ES modules and hot module replacement
- **PostCSS**: CSS processing with Tailwind CSS and Autoprefixer plugins
- **Drizzle Kit**: Database migration and schema management toolkit

### Styling and Theming
- **Tailwind CSS**: Utility-first CSS framework with custom configuration
- **Class Variance Authority**: Utility for creating component variant systems
- **CLSX/Tailwind Merge**: Dynamic class name composition and conflict resolution

### Additional Utilities
- **Date-fns**: Modern date utility library for date formatting and manipulation
- **TanStack Query**: Powerful data synchronization for server state management
- **Wouter**: Minimalist routing library for React applications