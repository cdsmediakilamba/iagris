# iAgris - Farm Management System

## Overview

iAgris is a comprehensive farm management system designed for agricultural operations in Angola. It's a Progressive Web App (PWA) built with modern web technologies, supporting bilingual operation (Portuguese and English) and providing complete farm management capabilities including animal tracking, crop management, inventory control, task management, and financial reporting.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for client-side navigation
- **State Management**: React Query (TanStack Query) for server state and data fetching
- **UI Components**: Radix UI primitives with Shadcn/UI component library
- **Styling**: Tailwind CSS with custom design system
- **Forms**: React Hook Form with Zod validation
- **Internationalization**: Custom language context with Portuguese/English support
- **Build Tool**: Vite for fast development and optimized builds

### Backend Architecture
- **Runtime**: Node.js with Express.js server
- **Language**: TypeScript for type safety across the stack
- **Database ORM**: Drizzle ORM for type-safe database operations
- **Authentication**: Passport.js with local strategy and session-based auth
- **Session Management**: PostgreSQL-backed sessions with connect-pg-simple
- **API Design**: RESTful API with role-based access control

### Database Architecture
- **Database**: PostgreSQL for robust data persistence
- **Connection**: Neon serverless PostgreSQL with connection pooling
- **Schema Management**: Drizzle Kit for migrations and schema management
- **Seed Data**: Comprehensive seeding scripts for development and testing

## Key Components

### Authentication & Authorization
- **Multi-tier Role System**: Super Admin, Farm Admin, Manager, Employee, Veterinarian, Agronomist, Consultant
- **Permission System**: Module-based permissions with granular access control (FULL, READ_ONLY, MANAGE, EDIT, VIEW, NONE)
- **Session Security**: HTTP-only cookies with CSRF protection
- **Password Hashing**: SHA-256 based password storage

### Core Modules
1. **Animal Management**: Complete livestock tracking with species, breeds, health records, vaccinations, and genealogy
2. **Crop Management**: Plantation tracking with planting cycles, harvest planning, and yield monitoring
3. **Inventory Management**: Stock control with transaction history and automated alerts
4. **Task Management**: Work assignment and progress tracking
5. **Financial Management**: Cost tracking and expense management
6. **Goals & KPIs**: Performance tracking and target management
7. **Reporting**: Comprehensive data analysis and export capabilities

### Data Models
- **Users**: Multi-role user system with farm assignments
- **Farms**: Multi-farm support with location and type classification
- **Animals**: Detailed livestock records with species categorization
- **Species**: Configurable animal species with automatic registration codes
- **Crops**: Plantation management with lifecycle tracking
- **Inventory**: Stock management with category-based organization
- **Tasks**: Work management with priority and status tracking
- **Costs**: Financial tracking with category-based classification

## Data Flow

### User Authentication Flow
1. User submits credentials via login form
2. Passport.js validates against PostgreSQL user table
3. Session created and stored in PostgreSQL
4. User permissions loaded based on role and farm assignments
5. Frontend receives user data and redirects to dashboard

### Data Access Flow
1. Frontend components use React Query hooks
2. API requests include session cookies for authentication
3. Backend validates user permissions for requested resources
4. Database queries filtered by user's farm access rights
5. Response data returned and cached by React Query

### Farm-Based Data Isolation
- Super Admins: Access to all farms and system-wide data
- Farm Admins: Full access to assigned farms only
- Other Roles: Filtered access based on farm assignments and module permissions

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: Serverless PostgreSQL connection
- **drizzle-orm**: Type-safe ORM for database operations
- **passport**: Authentication middleware
- **express-session**: Session management
- **connect-pg-simple**: PostgreSQL session store

### Frontend Dependencies
- **@tanstack/react-query**: Server state management
- **@radix-ui/***: Accessible UI primitives
- **react-hook-form**: Form state management
- **@hookform/resolvers**: Form validation resolvers
- **zod**: Runtime type validation
- **date-fns**: Date manipulation and formatting
- **wouter**: Lightweight routing

### Development Dependencies
- **vite**: Build tool and development server
- **typescript**: Type checking
- **tailwindcss**: Utility-first CSS framework
- **drizzle-kit**: Database schema management

## Deployment Strategy

### Development Environment
- Local development with Vite dev server
- Hot module replacement for fast iteration
- PostgreSQL database connection via environment variables
- Session store configured for development

### Production Deployment
- Express server serves built React application
- Static file serving with proper caching headers
- Environment-based configuration for database and sessions
- Process management for server reliability

### Database Management
- Migration system using Drizzle Kit
- Comprehensive seeding scripts for initial data
- Backup and restore procedures documented
- Connection pooling for performance optimization

## Comprehensive Documentation System

A complete documentation system has been created in the `docs/` directory with 12 comprehensive guides covering all aspects of the iAgris system:

### Installation & Setup
- **Installation Guide**: Complete setup instructions for Ubuntu, CentOS, Windows
- **cPanel Installation**: Specialized guide for shared hosting environments
- **Environment Setup**: Detailed configuration of environment variables
- **Database Setup**: PostgreSQL configuration and schema management

### Technical Documentation
- **Architecture**: Complete system architecture overview
- **API Documentation**: Full REST API specification with examples
- **Development Guide**: Guidelines for developers and contributors

### User & Admin Guides
- **User Manual**: Complete guide for end users
- **Admin Guide**: Administrative functions and user management
- **FAQ**: Frequently asked questions and troubleshooting

### Operations & Maintenance
- **Deployment Guide**: Production deployment procedures
- **Backup & Recovery**: Comprehensive backup strategies and recovery procedures
- **Monitoring**: System monitoring setup with Prometheus and Grafana
- **Updates Guide**: Safe update procedures and rollback strategies

## Changelog

```
Changelog:
- August 11, 2025. Created comprehensive documentation system with 12 detailed guides covering installation (including cPanel), deployment, API documentation, user manuals, admin guides, monitoring, backup/recovery, and update procedures
- January 08, 2025. Removed calendar.tsx page from frontend per user request - Calendar page no longer accessible via navigation menu or direct route
- June 29, 2025. Initial setup
```

## User Preferences

```
Preferred communication style: Simple, everyday language.
```