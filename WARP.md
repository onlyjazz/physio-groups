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
This starts the Vite development server with hot module replacement on http://localhost:5173.

### Build
```bash
cd clinic-app
npm run build
```
Builds the application for production using Vite with the standard configuration (vite.config.ts).

### Single-File Build
```bash
cd clinic-app
npx vite build --config vite.config.js
```
Creates a single HTML file (`dist/index.html`) with all assets inlined - useful for distribution as a standalone file. Uses the vite-plugin-singlefile plugin.

### Preview Production Build
```bash
cd clinic-app
npm run preview
```
Serves the production build locally for testing.

### Testing
```bash
cd clinic-app
node test-waitlist.js  # Test waitlist functionality in browser console
```
Note: No automated test runner is configured. Tests should be run manually in the browser console.

### Database Management
```bash
cd clinic-app
node restore-db.js  # Restore database from backup
node debug-patient.js  # Debug patient data issues
```

## Code Architecture

- **Main Component**: `src/App.svelte` handles routing and renders page components
- **Routing**: Custom hash-based router in `src/router.ts` using Svelte stores
- **Data Layer**: Browser localStorage-based database with CRUD operations in `src/lib/db.ts`
- **UI Pages**: Multiple views in `src/pages/` for different entity management

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
All pages are located in `src/pages/`:

**Core Management Pages:**
- **Therapists.svelte**: Manage therapy staff (מנחים)
- **Patients.svelte**: Manage client information with search and CSV export
- **Groups.svelte**: Individual group details and patient enrollment
- **GroupsList.svelte**: Main page listing all groups with quick actions

**Attendance & Tracking:**
- **GroupAttendance.svelte**: Mark attendance for group sessions with therapist tracking
- **PatientAttendance.svelte**: View attendance history for specific patients
- **Waitlist.svelte**: Manage waitlisted patients for full groups

**Payment & Reporting:**
- **Registration.svelte**: Record patient payments for group enrollment
- **History.svelte**: View payment history for patients
- **MonthlyReport.svelte**: Generate monthly attendance and payment reports

**Relationship Views:**
- **PatientsInGroup.svelte**: View/manage patients in a specific group
- **GroupsForPatient.svelte**: View groups a patient is enrolled in

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
- Status management (active/inactive)
- Automatic waitlist management when groups reach capacity
- Attendance tracking with therapist assignment
- Payment record management

### Routing
The application uses a custom hash-based router. Navigation should use the `goto()` function from `src/router.ts`. Routes are defined as simple strings matching the page component names.

Example navigation:
```typescript
import { goto } from './router'
goto('patients') // Navigate to patients page
goto(`groupAttendance/${groupId}`) // Navigate with parameters
```

### State Management
The application reloads the database from localStorage after each operation to ensure UI consistency. Components should call `db = load()` after any database modification.

### UI Patterns
- Forms use grid layouts with consistent column spans
- Dropdowns reset after selection to improve UX
- Delete operations require confirmation dialogs
- Receipt tracking is integrated into patient-group relationships
- Search boxes support wildcard/partial matching
- CSV export buttons placed next to search functionality
- Edit mode pattern: display-only fields become editable in edit mode
- Button styling: blue for save, orange for cancel, red for delete, green for add

### Hebrew/RTL Considerations
- All text inputs have RTL direction set
- UI uses Hebrew labels throughout
- Payment codes use Hebrew characters (ק, א, ת, מ)
- The term "מנחה" (instructor) is used instead of "מטפל" (therapist)

### Testing
Basic testing utilities are available:
```bash
cd clinic-app
node test-waitlist.js  # Test waitlist functionality
```

### TypeScript Configuration
The project uses composite TypeScript configuration with separate configs for application code (`tsconfig.app.json`) and build tools (`tsconfig.node.json`).
