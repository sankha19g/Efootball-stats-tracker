# Firebase Setup Guide

I have migrated your application to use Firebase for Authentication, Database, and Storage.
To run the app, you need to set up a Firebase Project.

## Steps

1.  **Create a Firebase Project**
    *   Go to [Firebase Console](https://console.firebase.google.com/).
    *   Click "Add project" and follow the prompts.

2.  **Register your Web App**
    *   In your project overview, click the Web icon (</>).
    *   Register the app (e.g., "eFootball Stats").
    *   **COPY** the configuration object (apiKey, authDomain, etc.).

3.  **Configure Environment Variables**
    *   In the `client` folder, copy `.env.example` to a new file named `.env`.
    *   Fill in the values from your Firebase configuration.
    
    ```
    VITE_FIREBASE_API_KEY=...
    VITE_FIREBASE_AUTH_DOMAIN=...
    ...
    ```

4.  **Enable Authentication**
    *   Go to **Authentication** > **Get started**.
    *   Go to **Sign-in method** tab.
    *   Enable **Email/Password**.

5.  **Enable Firestore Database**
    *   Go to **Firestore Database** > **Create database**.
    *   Start in **Test mode** (for development) or **Production mode**.
    *   Choose a location near you.

6.  **Enable Storage**
    *   Go to **Storage** > **Get started**.
    *   Start in **Test mode**.
    *   Done.

7.  **Run the App Locally**
    *   `cd client`
    *   `npm run dev`

8.  **Deploy to Firebase Hosting (Optional)**
    *   Install Firebase CLI: `npm install -g firebase-tools`
    *   Login: `firebase login`
    *   Initialize (if not done): `firebase init` (Select Hosting, use existing project, set public dir to `dist`, rewrite to index.html: Yes)
    *   Or use the provided config:
        *   Update `.firebaserc` with your project ID.
        *   Run `npm run build`
        *   Run `firebase deploy`


## Migration Note
This update removes the need for the local Node.js backend server (`server/server.js`). The frontend (`client`) now communicates directly with Firebase.
Your old data in MongoDB has **NOT** been migrated automatically. You will start with a fresh database.
