# Changelog

All notable changes to the Physio Groups clinic management application will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2025-01-16

### 🎉 Initial Release

This is the first stable release of the Physio Groups application, a comprehensive clinic management system for physiotherapy practices specializing in group exercise sessions.

### ✨ Features

#### Core Functionality
- **Patient Management**
  - Complete patient registration with personal information (name, phone, national ID)
  - Patient status tracking (active/inactive)
  - Advanced search functionality with wildcard support
  - Patient group enrollment management
  - Export patient data to CSV format

- **Therapist Management** 
  - Therapist registration and profile management
  - Assignment to multiple groups
  - Substitute therapist support for attendance tracking
  - RTL text support for Hebrew names

- **Group Management**
  - Create and manage exercise groups
  - Set group capacity and track available spots
  - Schedule information in free text format
  - Assign primary therapists to groups
  - Enroll patients with automatic capacity management

- **Attendance Tracking**
  - Mark patient attendance for each group session
  - Track which therapist led each session (including substitutes)
  - Historical attendance records
  - Date-based attendance management

- **Payment Tracking**
  - Record patient payments for group enrollment
  - Payment period tracking (from/to dates)
  - Payment codes (ק, א, ת, מ) for different payment types
  - Receipt number recording
  - Payment history view for each patient
  - Integration with patient enrollment process

#### User Interface
- **Modern SPA Design**
  - Single-page application with hash-based routing
  - Responsive layout with TailwindCSS
  - Full RTL (right-to-left) support for Hebrew interface
  - Consistent button styling with color-coded actions
  - Intuitive navigation between sections

- **Data Export**
  - CSV export functionality for all data tables
  - Preserves Hebrew text encoding
  - Includes all visible columns in exports

- **Edit Modes**
  - Dedicated edit modes for safe data modification
  - Clear visual indicators for edit state
  - Consistent save/cancel button styling
  - Confirmation dialogs for delete operations

#### Technical Features
- **Local Data Storage**
  - Browser-based localStorage database
  - No server requirements - fully client-side
  - Automatic data persistence
  - UUID-based entity identification

- **Data Relationships**
  - Many-to-many relationships between entities
  - Cascade delete for maintaining data integrity
  - Automatic timestamp tracking (created/updated)

- **Search Capabilities**
  - Wildcard search across multiple fields
  - Real-time search results
  - Hebrew text search support

### 🛠 Technology Stack
- **Frontend Framework**: Svelte 5
- **Language**: TypeScript
- **Build Tool**: Vite
- **Styling**: TailwindCSS with RTL plugin
- **Storage**: Browser localStorage
- **Routing**: Custom hash-based router

### 📋 Requirements
- Modern web browser with localStorage support
- No server or backend required
- Works offline once loaded

### 🌍 Localization
- Full Hebrew language interface
- RTL layout support throughout
- Hebrew-specific form validations

### 🔒 Data Security
- All data stored locally in browser
- No external data transmission
- User controls all data export

---

For more information, visit the [project repository](https://github.com/onlyjazz/physio-groups).