// ─── eFootball Stats Tracker Extension Background Service Worker ───

const FIREBASE_API_KEY = 'AIzaSyDpvjE8VgKVHH_OaPcgj6shiBomJm-oSnc';
const PROJECT_ID = 'efootball-8c9c5';
const LOCAL_SERVER_URL = 'http://localhost:5001';
const PROD_SERVER_URL = 'https://efootball-stats-tracker.vercel.app';

// Helper: Convert JS Object to Firestore REST API document format
function toFirestoreDoc(obj) {
    const fields = {};
    for (const [key, value] of Object.entries(obj)) {
        if (value === undefined || value === null) continue;
        if (typeof value === 'string') {
            fields[key] = { stringValue: value };
        } else if (typeof value === 'number') {
            if (Number.isInteger(value)) {
                fields[key] = { integerValue: String(value) };
            } else {
                fields[key] = { doubleValue: value };
            }
        } else if (typeof value === 'boolean') {
            fields[key] = { booleanValue: value };
        } else if (Array.isArray(value)) {
            fields[key] = {
                arrayValue: {
                    values: value.map(v => typeof v === 'string' ? { stringValue: v } : { stringValue: String(v) })
                }
            };
        }
    }
    return { fields };
}

// Helper: Refresh Firebase ID Token if needed
async function getValidIdToken() {
    const storage = await new Promise(r => chrome.storage.local.get(['idToken', 'refreshToken', 'user'], r));
    let idToken = storage.idToken;
    const refreshToken = storage.refreshToken;

    if (!refreshToken) return idToken;

    // Test token or refresh
    try {
        const refreshUrl = `https://securetoken.googleapis.com/v1/token?key=${FIREBASE_API_KEY}`;
        const res = await fetch(refreshUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: `grant_type=refresh_token&refresh_token=${refreshToken}`
        });

        if (res.ok) {
            const data = await res.json();
            idToken = data.id_token;
            await new Promise(r => chrome.storage.local.set({
                idToken: data.id_token,
                refreshToken: data.refresh_token
            }, r));
        }
    } catch (e) {
        console.warn('[Background] Token refresh warning:', e);
    }

    return idToken;
}

// Direct Firestore REST Save
async function saveToFirestore(player, targetDestination) {
    if (!player || !player.id) return { success: false, error: 'Invalid player' };

    const idToken = await getValidIdToken();
    const storage = await new Promise(r => chrome.storage.local.get(['user'], r));
    const localId = storage.user?.localId;

    const docData = toFirestoreDoc({
        ...player,
        search_name: (player.name || '').toLowerCase(),
        lastUpdated: new Date().toISOString()
    });

    const headers = { 'Content-Type': 'application/json' };
    if (idToken) headers['Authorization'] = `Bearer ${idToken}`;

    // 1. Save to global_database (for Add Player From DB)
    const globalUrl = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/global_database/${player.id}?key=${FIREBASE_API_KEY}`;
    
    let globalRes;
    try {
        globalRes = await fetch(globalUrl, {
            method: 'PATCH',
            headers: headers,
            body: JSON.stringify(docData)
        });

        if (!globalRes.ok) {
            const errJson = await globalRes.json().catch(() => ({}));
            console.error('[Background] Firestore Global Save Error:', errJson);
        } else {
            console.log(`[Background] ✅ Successfully saved ${player.name} to Firestore global_database!`);
        }
    } catch (e) {
        console.error('[Background] Network error saving to Firestore:', e);
    }

    // 2. If target is squad, also save to user squad collection
    if (targetDestination === 'squad' && localId && idToken) {
        try {
            const squadUrl = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/users/${localId}/players?key=${FIREBASE_API_KEY}`;
            await fetch(squadUrl, {
                method: 'POST',
                headers: headers,
                body: JSON.stringify(docData)
            });
            console.log(`[Background] ✅ Successfully added ${player.name} to User Squad!`);
        } catch (e) {}
    }

    // Cache last scraped player
    chrome.storage.local.set({ lastScrapedPlayer: player });
    return { success: true };
}

// Scrape API caller with smart fallback
async function callScrapeApi(body, customServerUrl) {
    const serversToTry = [];
    if (customServerUrl) serversToTry.push(customServerUrl.replace(/\/$/, ''));
    serversToTry.push(LOCAL_SERVER_URL);
    serversToTry.push(PROD_SERVER_URL);

    const uniqueServers = Array.from(new Set(serversToTry));
    let lastError = null;

    for (const server of uniqueServers) {
        try {
            console.log(`[Background] Connecting to scraper: ${server}/api/scrape`);
            const res = await fetch(`${server}/api/scrape`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });

            if (res.ok) {
                const data = await res.json();
                console.log(`[Background] Scraped successfully via ${server}`);
                return data;
            } else {
                const errData = await res.json().catch(() => ({}));
                console.warn(`[Background] Server ${server} returned ${res.status}:`, errData);
            }
        } catch (err) {
            console.warn(`[Background] Failed to connect to ${server}:`, err.message);
            lastError = err;
        }
    }

    throw lastError || new Error('Could not connect to scraping backend.');
}

// Message Listener
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    (async () => {
        const storage = await new Promise(r => chrome.storage.local.get(['serverUrl', 'targetDestination'], r));
        const targetDestination = storage.targetDestination || 'global';

        // 1. Scrape Single Player
        if (message.action === 'SCRAPE_PLAYER') {
            try {
                const data = await callScrapeApi({ url: message.url }, storage.serverUrl);

                if (data.players && data.players.length > 0) {
                    const player = data.players[0];
                    // Save directly to Firestore Cloud Database
                    await saveToFirestore(player, targetDestination);
                    sendResponse({ success: true, player, players: [player] });
                } else {
                    throw new Error('No player found on this page.');
                }
            } catch (err) {
                console.error('[Background] Scrape Player Error:', err);
                sendResponse({ success: false, error: err.message || 'Scrape failed.' });
            }
            return;
        }

        // 2. Scrape Multiple Players (Batch)
        if (message.action === 'SCRAPE_MULTIPLE') {
            try {
                const data = await callScrapeApi({ urls: message.urls }, storage.serverUrl);

                if (data.players && data.players.length > 0) {
                    for (const p of data.players) {
                        await saveToFirestore(p, targetDestination);
                    }
                    sendResponse({ success: true, players: data.players });
                } else {
                    throw new Error('No players found in table.');
                }
            } catch (err) {
                console.error('[Background] Scrape Multiple Error:', err);
                sendResponse({ success: false, error: err.message || 'Batch scrape failed.' });
            }
            return;
        }

        // 3. Delete / Undo
        if (message.action === 'DELETE_PLAYERS') {
            try {
                const idToken = await getValidIdToken();
                if (message.playerIds && message.playerIds.length) {
                    for (const id of message.playerIds) {
                        const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/global_database/${id}?key=${FIREBASE_API_KEY}`;
                        const headers = {};
                        if (idToken) headers['Authorization'] = `Bearer ${idToken}`;
                        fetch(url, { method: 'DELETE', headers }).catch(() => {});
                    }
                }
                sendResponse({ success: true });
            } catch (err) {
                sendResponse({ success: false, error: err.message });
            }
            return;
        }

        // 4. Test Connection
        if (message.action === 'TEST_CONNECTION') {
            try {
                const idToken = await getValidIdToken();
                const headers = {};
                if (idToken) headers['Authorization'] = `Bearer ${idToken}`;
                const testUrl = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/global_database?pageSize=1&key=${FIREBASE_API_KEY}`;
                const res = await fetch(testUrl, { headers });
                if (res.ok) {
                    sendResponse({ success: true });
                } else {
                    const err = await res.json().catch(() => ({}));
                    sendResponse({ success: false, error: err.error?.message || `Status ${res.status}` });
                }
            } catch (e) {
                sendResponse({ success: false, error: e.message });
            }
            return;
        }

        // 5. Firebase Auth Login
        if (message.action === 'FIREBASE_LOGIN') {
            try {
                const authUrl = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${FIREBASE_API_KEY}`;
                const res = await fetch(authUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        email: message.email,
                        password: message.password,
                        returnSecureToken: true
                    })
                });

                const data = await res.json();
                if (!res.ok) {
                    throw new Error(data.error?.message || 'Authentication failed');
                }

                await new Promise(r => chrome.storage.local.set({
                    idToken: data.idToken,
                    refreshToken: data.refreshToken,
                    user: {
                        email: data.email,
                        localId: data.localId,
                        idToken: data.idToken
                    }
                }, r));

                sendResponse({ success: true, user: data });
            } catch (err) {
                sendResponse({ success: false, error: err.message });
            }
            return;
        }
    })();

    return true; // Keep message channel open for async response
});
