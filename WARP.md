# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

Physio Groups is a local/browser-centric JavaScript application that enables physiotherapy clinics to manage exercise groups for patients. The application is built with Svelte 5, TypeScript, Vite, and TailwindCSS, providing a modern single-page application (SPA) for clinic administration.

## Development Commands

### Development Server
```bash
cd clinic-app
npm run dev
```
This starts the Vite development server with hot module replacement.

### Build
```bash
cd clinic-app
npm run build
```
Builds the application for production using Vite.

### Type Checking
```bash
cd clinic-app
npm run check
```
Runs svelte-check and TypeScript compiler to validate types across the application and build configuration.

### Preview Production Build
```bash
cd clinic-app
npm run preview
```
Serves the production build locally for testing.

## Architecture Overview

### Application Structure
The application follows a simple SPA architecture with hash-based routing:

- **Entry Point**: `src/main.ts` mounts the main App component
- **Main Component**: `src/App.svelte` handles routing and renders page components
- **Routing**: Custom hash-based router in `src/router.ts` using Svelte stores
- **Data Layer**: Browser localStorage-based database with CRUD operations in `src/lib/db.ts`
- **UI Pages**: Four main views in `src/pages/` for different entity management

### Data Management
The application uses a client-side database stored in localStorage:

- **Database Schema**: Defined in `src/lib/db.ts` with TypeScript interfaces
- **Entities**: Therapists, Patients, Groups, Statuses, and relationship tables
- **CRUD API**: Centralized API object with methods for all database operations
- **Data Persistence**: Automatic save to localStorage on every operation

### Core Entities
1. **Therapists**: Staff members who run exercise groups
2. **Patients**: Clients with personal information and status tracking
3. **Groups**: Exercise sessions with assigned therapists and enrolled patients
4. **Statuses**: Active/inactive status for entities
5. **Relationships**: Many-to-many mappings between patients/therapists and groups

### Page Components
- **Therapists.svelte**: Manage therapy staff
- **Patients.svelte**: Manage client information and status
- **Groups.svelte**: Create groups, assign therapists, enroll patients with receipt tracking
- **Statuses.svelte**: View/manage entity statuses

### Styling
The application uses TailwindCSS with:
- RTL support configured via `tailwindcss-rtl` plugin
- Hebrew language interface (text content is in Hebrew)
- Responsive design with grid layouts
- Consistent spacing and color scheme

### Development Environment
- **Build Tool**: Vite with SvelteJS plugin
- **Language**: TypeScript with strict type checking
- **Styling**: TailwindCSS with PostCSS processing
- **IDE Support**: VS Code with Svelte extension recommended

## Key Development Considerations

### Database Operations
All data operations must go through the API methods in `src/lib/db.ts`. The database automatically handles:
- UUID generation for new entities
- Timestamp tracking (createdAt/updatedAt)
- Cascade deletes for relationships
- Status management

### Routing
The application uses a custom hash-based router. Navigation should use the `goto()` function from `src/router.ts`. Routes are defined as simple strings matching the page component names.

### State Management
The application reloads the database from localStorage after each operation to ensure UI consistency. Components should call `db = load()` after any database modification.

### UI Patterns
- Forms use grid layouts with consistent column spans
- Dropdowns reset after selection to improve UX
- Delete operations require confirmation dialogs
- Receipt tracking is integrated into patient-group relationships

### TypeScript Configuration
The project uses composite TypeScript configuration with separate configs for application code (`tsconfig.app.json`) and build tools (`tsconfig.node.json`).
