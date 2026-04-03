# Workflow Frontend

This is the frontend application for the Workflow system, built with React, Vite, and Tailwind CSS. It provides a dashboard for managing leads, drafts, sequences, messages, and approvals.

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```

3. The app will run on `http://localhost:5173` (default Vite port).

## Dependencies

- **React**: UI library
- **React Router**: Client-side routing
- **Tailwind CSS**: Styling framework
- **GSAP**: Animation library
- **Axios**: HTTP client (if used in utils)

## Project Structure

```
frontend/
├── src/
│   ├── components/
│   │   └── Sidebar.jsx          # Navigation sidebar
│   ├── context/
│   │   └── FlowContext.jsx      # Global state management
│   ├── pages/
│   │   ├── Overview.jsx         # Dashboard overview
│   │   ├── Leads.jsx            # Lead management
│   │   ├── Drafts.jsx           # Draft management
│   │   ├── Messages.jsx         # Message logs
│   │   ├── Sequences.jsx        # Sequence management
│   │   ├── Approval.jsx         # Approval workflow
│   │   ├── Login.jsx            # Admin login
│   │   ├── Form.jsx             # Lead input form
│   │   └── Paidplan.jsx         # Pricing plans
│   ├── utils/
│   │   ├── api.jsx              # API utility functions
│   │   └── modeldata.jsx        # Data models/constants
│   ├── App.jsx                  # Main app component
│   └── main.jsx                 # App entry point
├── public/
│   ├── logo.svg                 # App logo
│   ├── exit.svg                 # Logout icon
│   └── diamond.svg              # Settings icon
└── package.json
```

## Pages and Features

### Login (`/`)
- **Purpose**: Admin authentication
- **Features**:
  - Username/password form
  - GSAP animations
  - Redirects to dashboard on success
- **API Calls**: None (static form)
- **Navigation**: Links to `/form` (Contact Us)

### Form (`/form`)
- **Purpose**: Public lead submission form
- **Features**:
  - Lead input form (name, email, phone, query)
  - Submits to both Google Sheets and backend API
  - Success modal
- **API Calls**:
  - `POST http://localhost:5000/lead` - Create lead and generate draft
- **External**: Google Apps Script for sheet integration

### Paidplan (`/plan`)
- **Purpose**: Pricing plans display
- **Features**: Static page showing Pro and Max plans
- **API Calls**: None

### Overview (`/overview`)
- **Purpose**: Dashboard overview with statistics
- **Features**:
  - Cards showing counts of leads, drafts, messages, sequences
  - GSAP animations on load
  - Clickable cards to navigate to respective pages
- **API Calls**: Uses FlowContext (fetches data in context)
- **Context Dependencies**: `leadsCount`, `draftsCount`, `sequencesCount`

### Leads (`/leads`)
- **Purpose**: Lead management and viewing
- **Features**:
  - List all leads with status filtering (all, pending, completed)
  - Display lead details (name, email, phone, query, status)
  - Responsive design
- **API Calls**:
  - `GET http://localhost:5000/lead/get` - Fetch all leads
- **Filters**: Status-based filtering

### Drafts (`/drafts`)
- **Purpose**: AI-generated draft management
- **Features**:
  - List all drafts with status (WAITING_APPROVAL, APPROVED, REJECTED)
  - Approve/reject drafts
  - Edit draft response in modal
  - Assign approved drafts to sequences
  - Remove rejected drafts
- **API Calls**:
  - `GET http://localhost:5000/draft/get` - Fetch all drafts
  - `POST http://localhost:5000/draft/:id` - Update draft status
  - `POST http://localhost:5000/api/sequences/assign-lead` - Assign lead to sequence
- **Context Dependencies**: `selectedSequenceId` for auto-assignment

### Messages (`/messages`)
- **Purpose**: Message delivery logs and tracking
- **Features**:
  - List all message logs with status and channel
  - Display lead info, sequence info, content
  - Retry failed messages
  - Status and channel badges
- **API Calls**:
  - `GET http://localhost:5000/api/messages` - Fetch all messages
  - `POST http://localhost:5000/api/messages/:id/retry` - Retry failed message (if implemented)

### Sequences (`/sequences`)
- **Purpose**: Sequence creation and management
- **Features**:
  - Create new sequences (start in draft status)
  - Add/remove steps to sequences
  - Start/pause/resume sequences
  - Expandable sequence details
  - Step management with triggers and channels
- **API Calls**:
  - `GET http://localhost:5000/api/sequences/get` - Fetch all sequences
  - `POST http://localhost:5000/api/sequences` - Create sequence
  - `POST http://localhost:5000/api/sequences/:id/start` - Start sequence
  - `POST http://localhost:5000/api/sequences/:id/pause` - Pause sequence
  - `POST http://localhost:5000/api/sequences/:id/resume` - Resume sequence
  - `POST http://localhost:5000/api/sequences/:id/steps` - Add step
  - `DELETE http://localhost:5000/api/sequences/:id/steps/:stepId` - Remove step
- **Context Dependencies**: `selectedSequenceId`

### Approvals (`/approvals`)
- **Purpose**: Approve AI-generated sequence steps
- **Features**:
  - List pending approval steps grouped by sequence
  - Approve/reject steps
  - Display step details (channel, message, trigger)
- **API Calls**:
  - `GET http://localhost:5000/api/approvals` - Fetch pending approvals
  - `POST http://localhost:5000/api/approvals/:id/approve` - Approve step
  - `POST http://localhost:5000/api/approvals/:id/reject` - Reject step

## Context and State Management

### FlowContext
- **Purpose**: Global state management across components
- **State**:
  - `leadsCount`: Number of leads
  - `draftsCount`: Number of drafts
  - `sequencesCount`: Number of sequences
  - `selectedSequenceId`: Currently selected sequence for operations
  - `loading`: Loading state
- **API Calls**:
  - Fetches counts from respective endpoints on mount

## Utilities

### api.jsx
- **Purpose**: Centralized API utility functions
- **Functions**: HTTP request helpers, error handling

### modeldata.jsx
- **Purpose**: Data models, constants, and helper functions
- **Contents**: Status enums, channel types, etc.

## Styling

- **Tailwind CSS**: Utility-first CSS framework
- **Responsive Design**: Mobile-first approach with responsive breakpoints
- **Animations**: GSAP for smooth transitions and effects
- **Dark Mode**: Some components use dark backgrounds (Login, Form, Paidplan)

## Routing

- **React Router**: Client-side routing
- **Routes**:
  - `/` - Login
  - `/form` - Lead Form
  - `/plan` - Paid Plans
  - `/overview` - Dashboard
  - `/leads` - Leads Management
  - `/drafts` - Drafts Management
  - `/messages` - Messages Logs
  - `/sequences` - Sequences Management
  - `/approvals` - Approvals Workflow

## Components

### Sidebar
- **Purpose**: Navigation component
- **Features**:
  - Responsive mobile menu
  - GSAP hover animations
  - Logout and settings buttons
  - Logo display

## Development Notes

- **Backend URL**: Assumes backend running on `http://localhost:5000`
- **API Base**: `/api` prefix for sequence-related endpoints
- **Authentication**: Basic login (no JWT shown in code)
- **Error Handling**: Basic try/catch in components
- **Loading States**: Spinner components for async operations

## Build and Deployment

1. Build for production:
   ```bash
   npm run build
   ```

2. Preview build:
   ```bash
   npm run preview
   ```

The built files will be in the `dist/` directory.
