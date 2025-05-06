# iAgris Architecture

## 1. Overview

iAgris is a comprehensive farm management system designed to help users manage agricultural operations. The application provides functionality for tracking animals, crops, inventory, tasks, and employees, as well as financial management and reporting capabilities. The system supports multiple user roles with different permission levels and is designed to work in both online and offline modes.

The application follows a client-server architecture with a React frontend and a Node.js/Express backend, using PostgreSQL for data persistence. The system is designed to be multi-lingual, with initial support for Portuguese and English.

## 2. System Architecture

iAgris follows a modern web application architecture with clear separation between frontend and backend:

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│    Frontend     │     │     Backend     │     │    Database     │
│    (React)      │<───>│  (Node/Express) │<───>│   (PostgreSQL)  │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

### Frontend (Client)

- Built with React and TypeScript
- Uses React Query for data fetching and state management
- Component library built with Shadcn UI (based on Radix UI)
- Uses wouter for client-side routing
- Implements form validation with React Hook Form and Zod
- Styling with Tailwind CSS

### Backend (Server)

- Built with Node.js and Express
- TypeScript for type safety
- RESTful API design pattern
- Session-based authentication
- Role-based access control

### Database

- PostgreSQL for data storage
- Drizzle ORM for database interactions
- Connection pooling for efficient database access

## 3. Key Components

### 3.1 Frontend Components

#### Core Structure
- **App.tsx**: Main application component that sets up routing
- **DashboardLayout**: Layout wrapper for authenticated pages
- **Pages**: Separate components for different sections of the application (animals, crops, inventory, etc.)

#### State Management
- **React Query**: Used for data fetching, caching, and state management
- **Context API**: Used for global state such as authentication and language preferences

#### UI Components
- **Shadcn UI**: Collection of accessible, reusable components
- **Custom Components**: Domain-specific components for the farm management interface

### 3.2 Backend Components

#### API Layer
- **Express Routes**: Handles HTTP requests and routing
- **Controllers**: Business logic for handling requests
- **Authentication Middleware**: Validates user sessions

#### Database Access
- **Drizzle ORM**: Type-safe database access
- **Schema Definitions**: Defines database schema in TypeScript
- **Storage Layer**: Abstracts database operations

#### Authentication
- **Passport.js**: Authentication middleware
- **Session-based Authentication**: Uses connect-pg-simple for session storage
- **Password Hashing**: Secure password handling

### 3.3 Database Schema

The database schema includes the following main entities:

- **Users**: User accounts with roles and permissions
- **Farms**: Agricultural properties being managed
- **Animals**: Livestock tracking and management
- **Crops**: Crop cultivation tracking
- **Inventory**: Supplies and resources management
- **Tasks**: Work assignments and scheduling
- **Goals**: Performance targets and tracking
- **User-Farm Relationships**: Connecting users to farms they can access
- **Permissions**: Fine-grained access control

## 4. Data Flow

### 4.1 Authentication Flow

1. User submits credentials via login form
2. Server validates credentials against stored user data
3. If valid, server creates a session and returns a session cookie
4. Frontend stores the session information
5. Subsequent requests include the session cookie for authentication

### 4.2 Data Access Flow

1. Client makes a request to the API endpoint
2. Server authenticates the request using session data
3. Server verifies user permissions for the requested resource
4. If authorized, server queries the database
5. Server processes data and returns the response
6. Client updates UI with the received data

### 4.3 Offline Mode

The application includes provisions for offline functionality:
- Client-side data caching
- Synchronization mechanism for updates when connectivity is restored
- Consistent user experience regardless of connection status

## 5. External Dependencies

### 5.1 Frontend Dependencies

- **React**: UI library
- **wouter**: For routing
- **React Query**: Data fetching and caching
- **Tailwind CSS**: Styling
- **Radix UI**: Accessible component primitives
- **React Hook Form**: Form handling
- **Zod**: Schema validation
- **date-fns**: Date manipulation
- **recharts**: Data visualization

### 5.2 Backend Dependencies

- **Express**: Web framework
- **Passport**: Authentication middleware
- **connect-pg-simple**: Session management
- **Drizzle ORM**: Database ORM
- **dotenv**: Environment variable management

### 5.3 Development Tools

- **TypeScript**: Static typing
- **Vite**: Build tool and development server
- **ESBuild**: JavaScript bundler
- **tsx**: TypeScript execution

## 6. Deployment Strategy

The application is configured for deployment using the following strategy:

### 6.1 Build Process

1. Frontend assets are compiled using Vite
2. Backend code is bundled using ESBuild
3. Combined assets are prepared for deployment

### 6.2 Hosting

The application is configured for:
- Replit deployment (as indicated by `.replit` configuration)
- Supports autoscaling deployment
- HTTPS configuration for secure communication

### 6.3 Database Provisioning

- PostgreSQL database with connection pooling
- Support for database migration and backup strategies
- Script-based database seeding for initial setup

### 6.4 Environment Configuration

- Environment variables for configuration management
- Different configurations for development and production environments
- Secure handling of sensitive information (database credentials, session secrets)

## 7. Security Considerations

### 7.1 Authentication & Authorization

- Password hashing using SHA-256
- Session-based authentication
- Role-based access control (RBAC)
- Fine-grained permissions system

### 7.2 Data Protection

- Input validation using Zod schemas
- Prepared statements via ORM to prevent SQL injection
- HTTPS for data transmission security

### 7.3 Session Management

- Secure session cookies
- PostgreSQL-based session storage
- Session timeout and renewal management

## 8. Internationalization

The application supports multiple languages with:
- Language context provider for UI translation
- Translations for Portuguese and English
- Locale-aware date and number formatting
- User preference persistence