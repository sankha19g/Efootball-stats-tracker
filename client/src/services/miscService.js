import { db, storage } from '../config/firebase';
import {
    collection,
    addDoc,
    deleteDoc,
    doc,
    getDocs,
    query,
    orderBy
} from 'firebase/firestore';
import {
    ref,
    uploadBytes,
    getDownloadURL,
    deleteObject
} from 'firebase/storage';

const IMGBB_API_KEY = import.meta.env.VITE_IMGBB_API_KEY;

export const getScreenshots = async (userId) => {
    if (!userId) return [];
    const q = query(collection(db, `users/${userId}/screenshots`), orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const addScreenshot = async (userId, file) => {
    if (!userId) throw new Error("User not authenticated");
    if (!IMGBB_API_KEY) throw new Error("ImgBB API Key is missing! Check .env file.");

    try {
        const formData = new FormData();
        formData.append("image", file);

        const response = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
            method: "POST",
            body: formData,
        });

        const data = await response.json();

        if (data.success) {
            const url = data.data.url;
            const docRef = await addDoc(collection(db, `users/${userId}/screenshots`), {
                url,
                createdAt: new Date().toISOString()
            });

            return { id: docRef.id, url };
        } else {
            throw new Error(data.error?.message || "ImgBB Upload Failed");
        }
    } catch (err) {
        console.error("Error uploading to ImgBB:", err);
        throw err;
    }
};

export const deleteScreenshot = async (userId, screenshotId, url) => {
    if (!userId) throw new Error("User not authenticated");

    await deleteDoc(doc(db, `users/${userId}/screenshots`, screenshotId));

    // Only try to delete from Firebase Storage if it's a firebase URL
    if (url && url.includes('firebasestorage')) {
        try {
            const storageRef = ref(storage, url);
            await deleteObject(storageRef);
        } catch (e) {
            console.warn("Could not delete legacy image from Firebase storage", e);
        }
    }
};

export const getLinks = async (userId) => {
    if (!userId) return [];
    const q = query(collection(db, `users/${userId}/links`), orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const addLink = async (userId, linkData) => {
    if (!userId) throw new Error("User not authenticated");

    const docRef = await addDoc(collection(db, `users/${userId}/links`), {
        ...linkData,
        createdAt: new Date().toISOString()
    });

    return { id: docRef.id, ...linkData };
};

export const deleteLink = async (userId, linkId) => {
    if (!userId) throw new Error("User not authenticated");
    await deleteDoc(doc(db, `users/${userId}/links`, linkId));
};

// Apps methods
export const getApps = async (userId) => {
    if (!userId) return [];
    try {
        const q = query(collection(db, `users/${userId}/apps`), orderBy('createdAt', 'desc'));
        const snap = await getDocs(q);
        return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (e) {
        console.error("Error fetching apps", e);
        return [];
    }
};

export const addApp = async (userId, appData) => {
    if (!userId) throw new Error("User not authenticated");

    const docRef = await addDoc(collection(db, `users/${userId}/apps`), {
        ...appData,
        createdAt: new Date().toISOString()
    });

    return { id: docRef.id, ...appData };
};

export const deleteApp = async (userId, appId) => {
    if (!userId) throw new Error("User not authenticated");
    await deleteDoc(doc(db, `users/${userId}/apps`, appId));
};
