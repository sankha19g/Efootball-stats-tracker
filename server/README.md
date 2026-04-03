# eFootball Stats Tracker - Backend

This is the Express.js backend for the eFootball Stats Tracker, deployed on **Vercel**.

## 🌐 Live API
- **Base URL**: [https://efootball-stats-tracker.vercel.app/](https://efootball-stats-tracker.vercel.app/)

## 🛠️ Tech Stack
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: Firebase Firestore (via `firebase-admin`)
- **Hosting**: Vercel (Serverless Functions)

## 📁 Key Files
- `server.js`: Main entry point and middleware configuration.
- `db.js`: Firestore database connection logic.
- `routes/`: API endpoint definitions.
- `vercel.json`: Deployment configuration for Vercel.

## 🚀 Local Development
1. `npm install`
2. Configure `.env` (use `.env.example` as a template).
3. `node server.js`

For more details on deployment architecture and potential limitations of the Vercel infrastructure, see the **[Root README](../README.md)**.
