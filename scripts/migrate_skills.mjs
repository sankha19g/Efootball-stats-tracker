import { initializeApp } from "firebase/app";
import { getFirestore, doc, updateDoc, collection, getDocs } from "firebase/firestore";
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

// Load environment variables from client/.env
dotenv.config({ path: path.join(process.cwd(), 'client', '.env') });

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const USER_ID = "BGB8bopMHOQrVoibmzOnksCMSDe2";
const JSON_FILE_PATH = path.join(process.cwd(), 'data', 'efootball_squad_2026-04-08.json');

async function migrateSkills() {
    try {
        console.log("Loading JSON data...");
        const jsonData = JSON.parse(fs.readFileSync(JSON_FILE_PATH, 'utf8'));
        
        console.log(`Found ${jsonData.length} players in JSON.`);
        
        const playersRef = collection(db, "users", USER_ID, "players");
        const querySnapshot = await getDocs(playersRef);
        console.log(`Found ${querySnapshot.size} players in Firestore.`);

        let updatedCount = 0;
        let skipCount = 0;

        for (const docSnapshot of querySnapshot.docs) {
            const firestorePlayer = docSnapshot.data();
            const playerDocId = docSnapshot.id;
            const playerIdInFirestore = firestorePlayer.playerId || firestorePlayer.id || firestorePlayer.ID;
            
            if (!playerIdInFirestore) {
                console.log(`Skipping doc ${playerDocId} - no playerId found`);
                skipCount++;
                continue;
            }

            // Match by ID
            const jsonPlayer = jsonData.find(p => String(p.ID) === String(playerIdInFirestore));
            
            if (jsonPlayer && jsonPlayer.Skills && Array.isArray(jsonPlayer.Skills)) {
                console.log(`Updating skills for: ${firestorePlayer.name || 'Unknown'} (ID: ${playerIdInFirestore})`);
                await updateDoc(docSnapshot.ref, {
                    skills: jsonPlayer.Skills,
                    Skills: jsonPlayer.Skills // Adding both for safety
                });
                updatedCount++;
            } else {
                // If not found in JSON, skip
                skipCount++;
            }
        }

        console.log("Migration completed!");
        console.log(`Updated: ${updatedCount}`);
        console.log(`Skipped: ${skipCount}`);
        
        process.exit(0);
    } catch (error) {
        console.error("Migration failed:", error);
        process.exit(1);
    }
}

migrateSkills();
