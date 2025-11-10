# AISTETH - AI-Powered Medical Assistant Landing Page

## Overview

AISTETH is a production-ready React landing page application for a company that provides AI-powered assistants for physicians. The platform targets Ontario-based healthcare professionals with three specialized AI agents: Admin Agent (scheduling and coordination), Shift Agent (medical knowledge and dose guidance), and Billing Agent (OHIP billing optimization). The application is built as a single-page app with modern web technologies, featuring a responsive design and professional healthcare-focused UI.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
The application uses a **modern React-based architecture** with functional components and hooks. The frontend follows a **component-driven design** pattern using:
- **React 18** with functional components and hooks for state management
- **TypeScript** for type safety throughout the application
- **Vite** as the build tool and development server for fast hot module replacement
- **Client-side routing** using wouter for lightweight navigation
- **Component structure** organized into reusable UI components and page-specific components

### Styling and UI Framework
The application implements a **design system approach** using:
- **Tailwind CSS** for utility-first styling with custom CSS variables
- **Shadcn/UI component library** providing pre-built, accessible React components
- **Radix UI primitives** as the foundation for complex interactive components
- **Responsive design** principles with mobile-first approach
- **Custom design tokens** defined in CSS variables for consistent theming

### State Management
The application uses a **lightweight state management approach**:
- **TanStack Query (React Query)** for server state management and data fetching
- **React hooks** (useState, useEffect) for local component state
- **Context API** for sharing theme and UI state across components
- **Form handling** with React Hook Form and Zod validation

### Backend Architecture
The backend follows a **minimal Express.js server architecture**:
- **Express.js** web server with TypeScript
- **Modular route structure** with separation of concerns
- **Middleware pattern** for request/response processing and logging
- **Development/production environment** handling with Vite integration

### Data Storage Solutions
The application is configured for **PostgreSQL with Drizzle ORM**:
- **Drizzle ORM** for type-safe database operations and schema management
- **PostgreSQL** as the primary database (configured but not actively used in current implementation)
- **Neon Database** integration for serverless PostgreSQL hosting
- **Schema-first approach** with TypeScript type generation
- **Migration system** for database schema versioning

### Development and Build Process
The project uses a **monorepo structure** with shared code:
- **Shared schema definitions** between client and server
- **TypeScript path mapping** for clean imports and module resolution
- **ESBuild** for production server bundling
- **Vite build system** for optimized client-side asset bundling

## External Dependencies

### UI and Styling
- **Tailwind CSS** - Utility-first CSS framework for rapid UI development
- **Shadcn/UI** - Component library built on Radix UI primitives
- **Radix UI** - Low-level UI primitives for building accessible components
- **Lucide React** - Icon library for consistent iconography
- **Font Awesome** - Additional icon set for specialized medical icons

### Database and ORM
- **Drizzle ORM** - TypeScript ORM for type-safe database operations
- **Neon Database** - Serverless PostgreSQL platform for cloud hosting
- **Drizzle Kit** - CLI tools for schema management and migrations

### Form Handling and Validation
- **React Hook Form** - Performant forms library with minimal re-renders
- **Zod** - TypeScript-first schema validation library
- **Hookform Resolvers** - Integration between React Hook Form and Zod

### Data Fetching and State Management
- **TanStack Query** - Server state management and data synchronization
- **Wouter** - Lightweight client-side routing library

### Development Tools
- **Vite** - Next-generation frontend build tool with fast HMR
- **TypeScript** - Static type checking for enhanced developer experience
- **ESBuild** - Fast JavaScript bundler for production builds
- **Replit Integration** - Development environment compatibility tools

### Future Integrations (Planned)
- **Eleven Labs** - Voice AI integration for interactive agent conversations (referenced in component placeholders)
- **Email Integration** - Mailto links for fallback contact functionality
- **Cloudflare R2** - Object storage for data backups (mentioned in security section)
- **Hetzner** - Cloud hosting infrastructure (mentioned in security section)