import {
    collection,
    addDoc,
    getDocs,
    updateDoc,
    deleteDoc,
    doc,
    query,
    where,
    orderBy,
    setDoc,
    serverTimestamp
} from 'firebase/firestore';
import { db } from '../config/firebase';

const REMINDERS_COLLECTION = 'remainders';
const REMINDER_ITEMS_COLLECTION = 'reminder_items';

/**
 * Fetch all reminders for a user
 */
export const getRemainders = async (userId) => {
    if (!userId) return [];
    try {
        const q = query(
            collection(db, REMINDERS_COLLECTION),
            where('userId', '==', userId)
        );
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate()?.toISOString() || new Date().toISOString()
        }));
    } catch (error) {
        console.error("Error getting remainders:", error);
        throw error;
    }
};

/**
 * Save a new reminder or update an existing one
 */
export const saveRemainder = async (userId, remainder) => {
    if (!userId) throw new Error("User ID required");

    try {
        const data = {
            ...remainder,
            userId,
            updatedAt: serverTimestamp()
        };

        // Remove ID if it's there for a new document
        const { id, ...finalData } = data;

        if (id && id.length > 15) { // Assuming Firestore IDs are long, manual IDs (Date.now) are shorter strings
            const docRef = doc(db, REMINDERS_COLLECTION, id);
            await updateDoc(docRef, finalData);
            return { id, ...finalData };
        } else {
            const docRef = await addDoc(collection(db, REMINDERS_COLLECTION), {
                ...finalData,
                createdAt: serverTimestamp()
            });
            return { id: docRef.id, ...finalData };
        }
    } catch (error) {
        console.error("Error saving remainder:", error);
        throw error;
    }
};

/**
 * Delete a reminder
 */
export const deleteRemainder = async (remainderId) => {
    if (!remainderId) return;
    try {
        await deleteDoc(doc(db, REMINDERS_COLLECTION, remainderId));
    } catch (error) {
        console.error("Error deleting remainder:", error);
        throw error;
    }
};

/**
 * Mark multiple reminders as completed
 */
export const bulkCompleteRemainders = async (remainderIds) => {
    try {
        const promises = remainderIds.map(id =>
            updateDoc(doc(db, REMINDERS_COLLECTION, id), {
                status: 'completed',
                updatedAt: serverTimestamp()
            })
        );
        await Promise.all(promises);
    } catch (error) {
        console.error("Error in bulk complete:", error);
        throw error;
    }
};

/**
 * Fetch DB Preset Items for a user
 */
export const getReminderItems = async (userId) => {
    if (!userId) return [];
    try {
        const q = query(
            collection(db, REMINDER_ITEMS_COLLECTION),
            where('userId', '==', userId)
        );
        const querySnapshot = await getDocs(q);
        const items = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        // If no items found, return defaults but don't save them yet
        if (items.length === 0) {
            return [
                { id: '1', title: 'Renew Contract' },
                { id: '2', title: 'Player Upgrade' },
                { id: '3', title: 'Level Up' },
                { id: '4', title: 'Skill Training' }
            ];
        }
        return items;
    } catch (error) {
        console.error("Error getting reminder items:", error);
        return [];
    }
};

/**
 * Save/Update a DB Preset Item
 */
export const saveReminderItem = async (userId, item) => {
    if (!userId) throw new Error("User ID required");
    try {
        const { id, ...data } = item;
        const finalData = { ...data, userId, updatedAt: serverTimestamp() };

        if (id && id.length > 15) {
            await updateDoc(doc(db, REMINDER_ITEMS_COLLECTION, id), finalData);
            return { id, ...finalData };
        } else {
            const docRef = await addDoc(collection(db, REMINDER_ITEMS_COLLECTION), {
                ...finalData,
                createdAt: serverTimestamp()
            });
            return { id: docRef.id, ...finalData };
        }
    } catch (error) {
        console.error("Error saving reminder item:", error);
        throw error;
    }
};

/**
 * Delete a DB Preset Item
 */
export const deleteReminderItem = async (itemId) => {
    if (!itemId) return;
    try {
        await deleteDoc(doc(db, REMINDER_ITEMS_COLLECTION, itemId));
    } catch (error) {
        console.error("Error deleting reminder item:", error);
        throw error;
    }
};
