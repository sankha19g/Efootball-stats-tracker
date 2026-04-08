import { db } from '../config/firebase';
import API_URL from '../config/api';
import {
    collection,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    getDocs,
    query,
    orderBy,
    arrayUnion,
    setDoc,
    getDoc,
    where,
    limit as firestoreLimit
} from 'firebase/firestore';

const PLAYERS_COLLECTION = 'players';
const GLOBAL_DB_COLLECTION = 'global_database';
const IMGBB_API_KEY = import.meta.env.VITE_IMGBB_API_KEY;

export const saveToGlobalDatabase = async (players) => {
    if (!players || players.length === 0) return;

    // We use setDoc with player.id as the document ID to prevent duplicates
    const promises = players.map(async (p) => {
        const docRef = doc(db, GLOBAL_DB_COLLECTION, String(p.id));
        const cleanPlayer = JSON.parse(JSON.stringify(p));
        return setDoc(docRef, {
            ...cleanPlayer,
            lastUpdated: new Date().toISOString()
        }, { merge: true });
    });

    await Promise.all(promises);
};

export const deleteFromGlobalDatabase = async (playerIds) => {
    if (!playerIds || playerIds.length === 0) return;

    const promises = playerIds.map(async (id) => {
        const docRef = doc(db, GLOBAL_DB_COLLECTION, String(id));
        return deleteDoc(docRef);
    });

    await Promise.all(promises);
};

export const searchGlobalFirestore = async (nameQuery) => {
    if (!nameQuery || nameQuery.length < 2) return [];

    try {
        const queryText = nameQuery.toLowerCase();
        
        // 1. Direct ID Lookup (for manual/hidden players)
        if (/^\d{5,}/.test(nameQuery)) {
            const docRef = doc(db, GLOBAL_DB_COLLECTION, nameQuery);
            const d = await getDoc(docRef);
            if (d.exists()) {
                return [{ id: d.id, ...d.data() }];
            }
        }

        // 2. Search by 'search_name'
        const q = query(
            collection(db, GLOBAL_DB_COLLECTION),
            where('search_name', '>=', queryText),
            where('search_name', '<=', queryText + '\uf8ff'),
            firestoreLimit(20)
        );

        const snapshot = await getDocs(q);
        let players = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        // 3. Fallback to 'name' (for older manual entries)
        if (players.length === 0) {
            const qFallback = query(
                collection(db, GLOBAL_DB_COLLECTION),
                where('name', '>=', nameQuery), 
                where('name', '<=', nameQuery + '\uf8ff'),
                firestoreLimit(20)
            );
            const snapFallback = await getDocs(qFallback);
            players = snapFallback.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        }

        return players;
    } catch (err) {
        console.error("Global Firestore search error:", err);
        return [];
    }
};

export const getRecentGlobalPlayers = async (limitNum = 50) => {
    try {
        const q = query(
            collection(db, GLOBAL_DB_COLLECTION),
            orderBy('lastUpdated', 'desc'),
            firestoreLimit(limitNum)
        );

        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (err) {
        console.error("Error fetching recent players:", err);
        // Fallback: Just get any players if orderBy fails (likely due to missing index/fields)
        const qFallback = query(collection(db, GLOBAL_DB_COLLECTION), firestoreLimit(limitNum));
        const snap = await getDocs(qFallback);
        return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    }
};

export const getPlayers = async (userId) => {
    if (!userId) return [];
    const q = query(collection(db, `users/${userId}/${PLAYERS_COLLECTION}`), orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
        _id: doc.id,
        ...doc.data()
    }));
};

export const addPlayer = async (userId, player) => {
    if (!userId) throw new Error("User not authenticated");

    // Clean up data before saving (remove undefined)
    const cleanPlayer = JSON.parse(JSON.stringify(player));

    const createdAt = new Date().toISOString();
    const docRef = await addDoc(collection(db, `users/${userId}/${PLAYERS_COLLECTION}`), {
        ...cleanPlayer,
        createdAt
    });

    return { _id: docRef.id, ...cleanPlayer, createdAt };
};

export const addPlayersBulk = async (userId, playersList) => {
    if (!userId) throw new Error("User not authenticated");

    const results = [];
    // Doing these in a loop for simplicity, or we could use WriteBatch if Firestore
    // Since we are using addDoc, let's just do them in parallel
    const promises = playersList.map(async (player) => {
        const cleanPlayer = JSON.parse(JSON.stringify(player));
        const createdAt = new Date().toISOString();
        const docRef = await addDoc(collection(db, `users/${userId}/${PLAYERS_COLLECTION}`), {
            ...cleanPlayer,
            createdAt
        });
        return { _id: docRef.id, ...cleanPlayer, createdAt };
    });

    return await Promise.all(promises);
};

export const updatePlayer = async (userId, playerId, updates) => {
    if (!userId) throw new Error("User not authenticated");

    const playerRef = doc(db, `users/${userId}/${PLAYERS_COLLECTION}`, playerId);
    await updateDoc(playerRef, updates);
    return { _id: playerId, ...updates };
};

export const updatePlayersBulk = async (userId, playerIds, updates) => {
    if (!userId) throw new Error("User not authenticated");

    // If tags are present, we treat it as an addition (union)
    const finalUpdates = { ...updates };
    if (updates.tags && Array.isArray(updates.tags)) {
        finalUpdates.tags = arrayUnion(...updates.tags);
    }

    const promises = playerIds.map(async (id) => {
        const playerRef = doc(db, `users/${userId}/${PLAYERS_COLLECTION}`, id);
        await updateDoc(playerRef, finalUpdates);
    });

    await Promise.all(promises);
};

export const deletePlayer = async (userId, playerId) => {
    if (!userId) throw new Error("User not authenticated");

    const playerRef = doc(db, `users/${userId}/${PLAYERS_COLLECTION}`, playerId);
    await deleteDoc(playerRef);
};

// Deprecated: uploadPlayerImage (File object) - mapped to uploadBase64Image for now or removed if unused
// Keeping for compatibility but throwing error if used directly without refactor
export const uploadPlayerImage = async (userId, file) => {
    throw new Error("Direct file upload not supported with ImgBB implementation yet. Use base64.");
};

export const uploadBase64Image = async (userId, base64String) => {
    if (!userId) throw new Error("User not authenticated");
    if (!IMGBB_API_KEY) throw new Error("ImgBB API Key is missing! Check .env file.");

    try {
        // Remove data:image/...;base64, prefix for ImgBB
        const base64Data = base64String.replace(/^data:image\/\w+;base64,/, "");

        const formData = new FormData();
        formData.append("image", base64Data);

        const response = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
            method: "POST",
            body: formData,
        });

        const data = await response.json();

        if (data.success) {
            return data.data.url;
        } else {
            throw new Error(data.error?.message || "ImgBB Upload Failed");
        }
    } catch (err) {
        console.error("Error uploading to ImgBB:", err);
        throw err;
    }
};

export const lookupPlaystyles = async (players) => {
    try {
        const response = await fetch(`${API_URL}/api/maintenance/lookup-playstyles`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ players })
        });
        if (!response.ok) throw new Error('Failed to lookup playstyles');
        return await response.json();
    } catch (err) {
        console.error('Lookup error:', err);
        return [];
    }
};

export const updatePlayerPlaystyle = async (userId, playerId, playstyle) => {
    if (!userId || !playerId) return;
    const playerRef = doc(db, `users/${userId}/${PLAYERS_COLLECTION}`, playerId);
    await updateDoc(playerRef, { playstyle });
};
