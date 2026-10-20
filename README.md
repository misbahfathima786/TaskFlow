# TaskFlow — Intelligent Productivity SaaS Platform

TaskFlow is a modern, full-stack productivity and task management platform designed to help builders, students, and professionals organize their commitments, prioritize high-impact work, and maintain steady execution momentum.

Built with **React 19 + Vite**, **Node.js + Express**, and **MongoDB Atlas**, TaskFlow delivers calm visual clarity, automated urgency prioritization, visual Kanban workflows, interactive calendar scheduling, and native browser & desktop notifications.

---

## 🎨 Visual Identity & Design System

TaskFlow strictly adheres to a focused, calm productivity palette:
- **Deep Navy:** `#061E29` — Grounded primary text and header elements
- **Dark Blue-Teal:** `#1D546D` — Brand accents, navigation, and primary surfaces
- **Muted Teal:** `#5F9598` — Action buttons, focus highlights, and badges
- **Light Background:** `#F3F4F4` — Clean workspace and canvas background
- **White Surface:** `#FFFFFF` — Card elevation and active form panels

---

## 🚀 Key Features

### 1. Smart Urgency Prioritization & Today's Focus
- Automated scoring engine prioritizes tasks based on impending deadlines, user-assigned priority tiers (Low, Medium, High, Urgent), and focus categories.
- Dedicated **Today's Focus** view highlights your single most critical commitment to eliminate decision fatigue.

### 2. Dual Kanban & List Views
- Seamlessly toggle between visual drag-and-drop Kanban columns (To Do, In Progress, Completed) and structured, compact list views with bulk operations.

### 3. Natural Language Task Capture (NLP)
- Type naturally: e.g., *"Submit project documentation by Friday 5pm high priority"*
- TaskFlow's regex & token parsing engine automatically extracts due dates, times, categories, and urgency levels.

### 4. Interactive Calendar Timeline
- Full Month and Week agenda views synced to the user's local timezone.
- One-click scheduling and date adjustments without UTC offset bugs or leap year boundaries.

### 5. In-App & Native Desktop Notifications
- Idempotent fingerprint tracking ensures zero duplicate alerts.
- Native browser **Web Notifications API** delivers real-time notifications for overdue and due-today tasks even when working in other tabs.

### 6. Modern Sliding-Window Authentication Experience
- Double-sliding container with smooth transitions between Login and Registration.
- Integrated **Continue with Google** powered by Google Identity Services (GIS).
- In-app configuration helper banner when credentials are not yet supplied (no intrusive browser alert popups).
- Secure account linking modal preventing account hijacking for existing password accounts.
- Fully responsive mobile segmented control (`Sign In` / `Create Account`) avoiding clipped inputs or horizontal scrolling.

### 7. Role-Based Access Control (RBAC) & Admin Governance
- Public registration strictly enforces standard `user` role (protected against mass assignment).
- Dedicated `/admin` governance console for administrative operators with:
  - System metrics and user directory management (activation/deactivation, role upgrades).
  - Safety guards preventing self-deactivation and demotion of the last active administrator.
  - Privacy-conscious, first-party visitor telemetry with automated 90-day TTL index.

---

## 🔑 Google OAuth 2.0 Configuration Guide

TaskFlow includes complete, production-ready integration with Google Identity Services (GIS) on the frontend and token verification on the backend via `google-auth-library`.

To activate Google Sign-In:

### Step 1: Create Credentials in Google Cloud Console
1. Navigate to the [Google Cloud Console Credentials Page](https://console.cloud.google.com/apis/credentials).
2. Click **Create Credentials** > **OAuth client ID**.
3. Select **Web application** as the application type.
4. Set the name to `TaskFlow Web Client`.

### Step 2: Configure Authorized Origins & Redirect URIs
In the OAuth Client ID settings:
- **Authorized JavaScript origins:**
  - `http://localhost:5173`
  - `http://127.0.0.1:5173`
  *(Add your production frontend domain when deploying)*
- **Authorized redirect URIs:**
  - `http://localhost:5173`
  *(Note: Google Identity Services popup / One-Tap renders within the page, so the redirect URI matches the client domain)*

### Step 3: Configure Environment Variables
Copy your generated **Client ID** (ending in `.apps.googleusercontent.com`):

**In `server/.env`:**
```env
GOOGLE_CLIENT_ID=your-actual-client-id.apps.googleusercontent.com
```

**In `client/.env`:**
```env
VITE_GOOGLE_CLIENT_ID=your-actual-client-id.apps.googleusercontent.com
```

### Step 4: Restart Development Servers
Restart your Vite frontend and Express backend servers to load the new environment variables.

> **Security Note:** The Google Client Secret is never required or exposed to the frontend client. The backend verifies Google-issued ID tokens directly using Google's public cryptographic keys via `OAuth2Client.verifyIdToken`.

---

## 🛠️ Tech Stack & Architecture

- **Frontend:** React 19, Vite, React Router v7, Context API, CSS Variables
- **Backend:** Node.js (v20+), Express.js, `google-auth-library`, `bcryptjs`, `jsonwebtoken`
- **Database:** MongoDB Atlas, Mongoose ODM
- **Testing:** Custom zero-dependency automated test runner (`server/tests/runTests.js`), ESLint

---

## 🏃 Getting Started

### 1. Prerequisites
- Node.js (v18+)
- MongoDB Atlas cluster connection string

### 2. Backend Setup
```bash
cd server
cp .env.example .env
# Edit .env and supply your MONGO_URI, JWT_SECRET, and GOOGLE_CLIENT_ID
npm install
npm run dev
```

### 3. Frontend Setup
```bash
cd client
cp .env.example .env
# Edit .env and verify VITE_API_URL and VITE_GOOGLE_CLIENT_ID
npm install
npm run dev
```

### 4. Bootstrap an Admin Account
To grant administrator privileges to an existing user:
```bash
cd server
node scripts/makeAdmin.js <user-email>
```

---

## 🧪 Automated Testing & Verification

TaskFlow includes an automated security and reliability test suite verifying RBAC guards, task ownership isolation, anti-hijacking Google link flow, calendar math, and analytics sanitization:

```bash
# Run server test suite
cd server
npm test
# (or: node tests/runTests.js)

# Run frontend linting & build verification
cd client
npm run lint
npm run build
```

---

## 📄 License
MIT License. Crafted for high-performance productivity and portfolio demonstration.
