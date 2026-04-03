# eFootball Stats Tracker

A comprehensive application for tracking player stats, managing squads, and analyzing progressions in eFootball.

## 🚀 Deployment Links

| Environment | Platform | URL |
| :--- | :--- | :--- |
| **Frontend** | Firebase Hosting | [https://efootball-8c9c5.web.app/](https://efootball-8c9c5.web.app/) |
| **Backend** | Vercel | [https://efootball-stats-tracker.vercel.app/](https://efootball-stats-tracker.vercel.app/) |
| **Database** | Firebase Firestore | Managed via Firebase Console |

---

## 🏗️ Project Structure & Components

The project is split into a **Vite + React** frontend and an **Express.js** backend.

### Core Frontend Components (`/client/src/components`)

- **`SquadEditor`**: The central hub for managing your team's formation, player placement, and tactical layouts.
- **`PlayerCard`**: A reusable, highly dynamic component used throughout the app to display player stats, mini-faces, and overall ratings.
- **`PlayerDetailsModal`**: Provides an in-depth breakdown of player attributes, skills, and progression paths.
- **`QuickUpdateModal`**: Designed for high-speed data entry, allowing you to update stats for multiple players without leaving the main view.
- **`SidebarNav`**: Centralized navigation for switching between Squad, Database, Player Lists, and Settings.
- **`SettingsModal`**: Manages application preferences, including API configurations and UI themes.
- **`SocialDrawer`**: A specialized side-panel for Reddit integration and community links.
- **`SquadBuilder`**: A toolset for experimenting with new squad compositions and synergy checks.

### Backend Infrastructure (`/server`)

- **`server.js`**: The main Express entry point.
- **`routes/`**: Defines API endpoints for player data, scraping, and user-specific stats.
- **`db.js`**: Handles the connection and interaction with Firebase Firestore.

---

## ⚠️ Infrastructure Considerations: Vercel (Backend)

The backend is currently hosted on Vercel as Serverless Functions. While convenient, there are several "cons" to keep in mind:

1. **Cold Start Latency**: Requests may take a few seconds to respond if the server hasn't been used recently, as Vercel needs to spin up the function.
2. **Ephemeral File System**: You cannot store files (logs, temp images, or DB backups) on the server's local disk. All persistence must be handled via Firestore.
3. **Execution Timeout**: Vercel limits function execution time (Free: 10s, Pro: 60s). This makes long-running tasks like massive web scraping prone to failure.
4. **Connection Pooling**: Serverless functions can scale rapidly, which may exhaust Firestore or other external API connection limits if not managed carefully.
5. **Memory Limits**: Extremely memory-intensive operations (like complex data processing) might hit the default 1024MB limit of Vercel's standard functions.

---

## 🛠️ Local Development

### Prerequisites
- Node.js (v18+)
- Firebase CLI (`npm install -g firebase-tools`)

### Setup
1. Clone the repository.
2. **Frontend**:
   ```bash
   cd client
   npm install
   npm run dev
   ```
3. **Backend**:
   ```bash
   cd server
   npm install
   node server.js
   ```
