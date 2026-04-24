const admin = require('firebase-admin');

let initialized = false;

const initAdmin = () => {
    if (initialized || admin.apps.length > 0) return;
    try {
        if (process.env.FIREBASE_SERVICE_ACCOUNT) {
            admin.initializeApp({
                credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT))
            });
        } else {
            // Minimal init — only used for token verification
            admin.initializeApp({
                projectId: process.env.FIREBASE_PROJECT_ID
            });
        }
        initialized = true;
        console.log('✅ Firebase Admin initialized');
    } catch (err) {
        console.error('❌ Firebase Admin init error:', err.message);
    }
};

initAdmin();

/**
 * Verifies Firebase ID token from Authorization: Bearer <token>
 * Sets req.userId (Firebase UID) and req.userEmail
 */
const authMiddleware = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.replace('Bearer ', '');
        if (!token) return res.status(401).json({ error: 'Authentication required' });

        const decoded = await admin.auth().verifyIdToken(token);
        req.userId = decoded.uid;
        req.userEmail = decoded.email || '';
        next();
    } catch (err) {
        return res.status(401).json({ error: 'Invalid or expired token' });
    }
};

module.exports = { authMiddleware };
