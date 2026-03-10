import { searchGlobalFirestore, getRecentGlobalPlayers } from './playerService';

// Client-side search implementation (No backend server required)
// This service loads the large player database ONLY when needed.

let cachedPlayers = null;
let cachedGlobalPlayers = null;
let cachedLeagues = null;

// Expose a method to invalidate cache after scraping
export const invalidatePlayerCache = () => {
    cachedPlayers = null;
    cachedGlobalPlayers = null;
};

// Helper for diacritic-insensitive search
export const normalizeString = (str) => {
    return str ? str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase() : "";
};

// Helper to load players data lazily
const loadPlayers = async (searchQuery = '') => {
    try {
        let players = [];

        // 1. Load from static JSON (cached)
        if (!cachedPlayers) {
            const response = await fetch(`/data/pesdb_players.json?t=${new Date().getTime()}`);
            if (response.ok) {
                cachedPlayers = await response.json();
                console.log(`✅ Loaded ${cachedPlayers.length} players locally`);
            } else {
                cachedPlayers = [];
            }
        }
        players = [...cachedPlayers];

        // 2. Load the Most Recent Global players if not done yet
        if (!cachedGlobalPlayers) {
            console.log("Fetching recent global players from Firestore...");
            cachedGlobalPlayers = await getRecentGlobalPlayers(100);
        }

        // Merge global players with JSON players (Prepend global ones so they show up first)
        if (cachedGlobalPlayers && cachedGlobalPlayers.length > 0) {
            const mergedMap = new Map();
            // Add local players first
            players.forEach(p => mergedMap.set(String(p.id), p));
            // Overwrite/Prepend global players
            cachedGlobalPlayers.forEach(p => mergedMap.set(String(p.id), p));

            // Reconstruct array: Global first, then Local (not in Global)
            const globalIds = new Set(cachedGlobalPlayers.map(p => String(p.id)));
            const localOnly = players.filter(p => !globalIds.has(String(p.id)));
            players = [...cachedGlobalPlayers, ...localOnly];
        }

        // 3. If there's a specific search query, fetch more matches from Firestore
        if (searchQuery && searchQuery.length >= 2) {
            const communityPlayers = await searchGlobalFirestore(searchQuery);
            if (communityPlayers.length > 0) {
                const mergedMap = new Map();
                players.forEach(p => mergedMap.set(String(p.id), p));
                communityPlayers.forEach(p => mergedMap.set(String(p.id), p));
                players = Array.from(mergedMap.values());
            }
        }

        return players;
    } catch (err) {
        console.error('Error loading players:', err);
        return cachedPlayers || [];
    }
};

// Helper to load leagues data lazily
const loadLeagues = async () => {
    if (cachedLeagues) return cachedLeagues;
    try {
        const response = await fetch('/data/leagues.json');
        if (!response.ok) throw new Error('Failed to load leagues database');
        const data = await response.json();
        cachedLeagues = data.countries || data; // Handle both formats
        return cachedLeagues;
    } catch (err) {
        console.error('Error loading leagues:', err);
        return [];
    }
};

/**
 * Search for players by name (Client-side DB)
 * @param {string} name 
 * @param {object} filters - Optional filters
 */
export const searchPlayers = async (name, filters = {}) => {
    try {
        const allPlayers = await loadPlayers(name);
        let results = [...allPlayers];

        // Search Filter
        if (name && name.length >= 2) {
            const query = normalizeString(name);
            results = results.filter(p =>
                normalizeString(p.name).includes(query) ||
                normalizeString(p.search_name).includes(query)
            );
        }

        // Attribute Filters
        const { position, cardType, league, club, nationality } = filters;

        if (position && position !== 'All') {
            results = results.filter(p => p.position === position);
        }
        if (cardType && cardType !== 'All') {
            results = results.filter(p => (p.card_type || p.cardType) === cardType);
        }
        if (league && league !== 'All') {
            results = results.filter(p => p.league === league);
        }
        if (club && club !== 'All') {
            results = results.filter(p => (p.club_original || p.club)?.toLowerCase().includes(club.toLowerCase()));
        }
        if (nationality && nationality !== 'All') {
            results = results.filter(p => p.nationality?.toLowerCase().includes(nationality.toLowerCase()));
        }

        // Map format
        return results.map(p => ({
            idPlayer: p.id,
            strPlayer: p.name,
            strTeam: p.club_original || p.club,
            strNationality: p.nationality,
            strCutout: p.image,
            strThumb: p.image,
            strPosition: p.position,
            strLeague: p.league,
            nationality_flag_url: p.nationality_flag_url,
            club_badge_url: p.club_badge_url,
            card_type: p.card_type || p.cardType
        })).slice(0, 50); // Limit results for performance
    } catch (err) {
        console.error('Error searching players:', err);
        return [];
    }
};

/**
 * Fetch players for the database explorer with full pagination info
 */
export const getDatabasePlayers = async (params = {}) => {
    try {
        const {
            q = '',
            position,
            cardType,
            league,
            club,
            nationality,
            page = 1,
            limit = 50
        } = params;

        const allPlayers = await loadPlayers(q);
        let results = [...allPlayers];

        // Search Filter
        if (q && q.length >= 2) {
            const query = normalizeString(q);
            results = results.filter(p =>
                normalizeString(p.name).includes(query) ||
                normalizeString(p.search_name).includes(query)
            );
        }

        // Attribute Filters
        if (position && position !== 'All') {
            results = results.filter(p => p.position === position);
        }
        if (cardType && cardType !== 'All') {
            results = results.filter(p => (p.card_type || p.cardType) === cardType);
        }
        if (league && league !== 'All') {
            results = results.filter(p => p.league === league);
        }
        if (club && club !== 'All') {
            results = results.filter(p => (p.club_original || p.club)?.toLowerCase().includes(club.toLowerCase()));
        }
        if (nationality && nationality !== 'All') {
            results = results.filter(p => p.nationality?.toLowerCase().includes(nationality.toLowerCase()));
        }

        // Pagination
        const total = results.length;
        const startIndex = (page - 1) * limit;
        const paginatedResults = results.slice(startIndex, startIndex + parseInt(limit));

        return {
            players: paginatedResults,
            total,
            page: parseInt(page),
            limit: parseInt(limit),
            totalPages: Math.ceil(total / limit)
        };
    } catch (err) {
        console.error('Error fetching database players:', err);
        return { players: [], total: 0 };
    }
};

/**
 * Get detailed player info by ID
 */
export const getPlayerDetails = async (id) => {
    try {
        const allPlayers = await loadPlayers();
        // ID might be string or number in JSON vs params
        const player = allPlayers.find(p => String(p.id) === String(id));
        if (!player) return null;

        return {
            idPlayer: player.id,
            strPlayer: player.name,
            strTeam: player.club_original || player.club,
            strNationality: player.nationality,
            strCutout: player.image,
            strPosition: player.position,
            strSide: '', // Not in local DB
            dateBorn: '', // Not in local DB
            strTeamBadge: player.club_badge_url,
            nationality_flag_url: player.nationality_flag_url
        };
    } catch (err) {
        console.error('Error fetching player details:', err);
        return null;
    }
};

/**
 * Get player former teams (history) by ID
 */
export const getPlayerHistory = async (id) => {
    // Local DB doesn't have history yet
    return [];
};

/**
 * Search for teams (clubs) by name
 */
export const searchTeams = async (teamName) => {
    if (!teamName || teamName.length < 2) return [];
    try {
        const allPlayers = await loadPlayers();
        const query = teamName.toLowerCase();

        const seenClubs = new Set();
        const results = [];

        for (const p of allPlayers) {
            if (results.length >= 20) break;
            const clubName = p.club_original || p.club;
            if (clubName && clubName.toLowerCase().includes(query) && !seenClubs.has(clubName)) {
                seenClubs.add(clubName);
                results.push({
                    strTeam: clubName,
                    strBadge: p.club_badge_url,
                    strLeague: p.league
                });
            }
        }
        return results;
    } catch (err) {
        console.error('Error searching teams:', err);
        return [];
    }
};

/**
 * Get Team details (for logos) by Name
 */
export const getTeamDetails = async (teamName) => {
    if (!teamName) return null;
    try {
        const teams = await searchTeams(teamName);
        return teams[0] || null;
    } catch (err) {
        console.error('Error fetching team details:', err);
        return null;
    }
};

/**
 * Search/List all countries
 */
export const searchCountries = async (query = '') => {
    try {
        const allPlayers = await loadPlayers();
        const q = query.toLowerCase();

        const seenCountries = new Set();
        const results = [];

        for (const p of allPlayers) {
            if (results.length >= 20) break;
            if (p.nationality && p.nationality.toLowerCase().includes(q) && !seenCountries.has(p.nationality)) {
                seenCountries.add(p.nationality);
                results.push({
                    name: p.nationality,
                    flag: p.nationality_flag_url
                });
            }
        }
        return results;
    } catch (err) {
        console.error('Error searching countries:', err);
        return [];
    }
};

/**
 * Get League details (for logos) by Name
 */
export const searchLeagues = async (leagueName) => {
    if (!leagueName) return null;
    try {
        const leagues = await loadLeagues();
        const query = leagueName.toLowerCase();
        const found = leagues.find(l =>
            l.strLeague.toLowerCase().includes(query) ||
            l.strLeagueAlternate?.toLowerCase().includes(query)
        );
        return found || null;
    } catch (err) {
        console.error('Error fetching league details:', err);
        return null;
    }
};

/**
 * Calculate age from birth date string (YYYY-MM-DD)
 */
export const calculateAge = (birthDate, atYear) => {
    if (!birthDate) return null;
    const target = atYear ? new Date(`${atYear}-12-31`) : new Date();
    const birth = new Date(birthDate);
    let age = target.getFullYear() - birth.getFullYear();
    const m = target.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && target.getDate() < birth.getDate())) {
        age--;
    }
    return age;
};

/**
 * Get Nationality Flag URL
 */
export const getFlagUrl = (nationality) => {
    if (!nationality) return '';
    return `https://flagcdn.com/w40/${nationality.substring(0, 2).toLowerCase()}.png`;
};

