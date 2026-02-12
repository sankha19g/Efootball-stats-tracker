const BASE_URL = 'https://www.thesportsdb.com/api/v1/json/3';

/**
 * Search for players by name
 * @param {string} name 
 */
export const searchPlayers = async (name) => {
    if (!name || name.length < 3) return [];
    try {
        const res = await fetch(`${BASE_URL}/searchplayers.php?p=${encodeURIComponent(name)}`);
        const data = await res.json();
        return data.player || [];
    } catch (err) {
        console.error('Error searching players:', err);
        return [];
    }
};

/**
 * Get detailed player info by ID
 * @param {string} id 
 */
export const getPlayerDetails = async (id) => {
    try {
        const res = await fetch(`${BASE_URL}/lookupplayer.php?id=${id}`);
        const data = await res.json();
        return data.players?.[0] || null;
    } catch (err) {
        console.error('Error fetching player details:', err);
        return null;
    }
};

/**
 * Get player former teams (history) by ID
 * @param {string} id 
 */
export const getPlayerHistory = async (id) => {
    try {
        const res = await fetch(`${BASE_URL}/lookupformerteams.php?id=${id}`);
        const data = await res.json();
        return data.formerteams || [];
    } catch (err) {
        console.error('Error fetching player history:', err);
        return [];
    }
};

/**
 * Search for teams (clubs) by name
 * @param {string} teamName 
 */
export const searchTeams = async (teamName) => {
    if (!teamName || teamName.length < 2) return [];
    try {
        const res = await fetch(`${BASE_URL}/searchteams.php?t=${encodeURIComponent(teamName)}`);
        const data = await res.json();
        return data.teams || [];
    } catch (err) {
        console.error('Error searching teams:', err);
        return [];
    }
};

/**
 * Get Team details (for logos) by Name
 * @param {string} teamName 
 */
export const getTeamDetails = async (teamName) => {
    if (!teamName) return null;
    try {
        const res = await fetch(`${BASE_URL}/searchteams.php?t=${encodeURIComponent(teamName)}`);
        const data = await res.json();
        return data.teams?.[0] || null;
    } catch (err) {
        console.error('Error fetching team details:', err);
        return null;
    }
};

let cachedCountries = null;
let countryFetchPromise = null;

/**
 * Search/List all countries
 */
export const searchCountries = async (query = '') => {
    try {
        if (!cachedCountries) {
            if (!countryFetchPromise) {
                countryFetchPromise = fetch(`${BASE_URL}/all_countries.php`)
                    .then(res => res.json())
                    .catch(err => {
                        console.error('Failed to fetch countries', err);
                        countryFetchPromise = null;
                        return { countries: [] };
                    });
            }
            const data = await countryFetchPromise;
            cachedCountries = data.countries || [];
        }

        if (!query) return cachedCountries;
        const search = query.toLowerCase();
        return cachedCountries.filter(c => c.name.toLowerCase().includes(search));
    } catch (err) {
        console.error('Error searching countries:', err);
        return [];
    }
};

let cachedLeagues = null;
let leagueFetchPromise = null;

const LEAGUE_MAP = {
    'Premier League': 'English Premier League',
    'La Liga': 'Spanish La Liga',
    'Serie A': 'Italian Serie A',
    'Bundesliga': 'German Bundesliga',
    'Ligue 1': 'French Ligue 1',
    'Eredivisie': 'Dutch Eredivisie',
    'Liga Portugal': 'Portuguese Primeira Liga',
    'Saudi Pro League': 'Saudi Professional League',
    'MLS': 'American MLS',
    'Brasileirão': 'Brazilian Serie A'
};

/**
 * Get League details (for logos) by Name
 * @param {string} leagueName 
 */
export const searchLeagues = async (leagueName) => {
    if (!leagueName) return null;
    try {
        if (!cachedLeagues) {
            if (!leagueFetchPromise) {
                leagueFetchPromise = fetch(`${BASE_URL}/search_all_leagues.php?s=Soccer`)
                    .then(res => res.json())
                    .catch(err => {
                        console.error('Failed to fetch league list', err);
                        leagueFetchPromise = null;
                        cachedLeagues = null; // Reset cache to allow retry
                        return { countries: [] };
                    });
            }
            const data = await leagueFetchPromise;
            cachedLeagues = data.countries || [];
        }

        const targetName = LEAGUE_MAP[leagueName] || leagueName;
        const search = targetName.toLowerCase();

        // 1. Try Exact match with mapped or original name
        let league = cachedLeagues.find(l => l.strLeague === targetName);

        // 2. Try Case-insensitive Exact match
        if (!league) {
            league = cachedLeagues.find(l => l.strLeague.toLowerCase() === search);
        }

        // 3. Try Partial match (prioritize English Premier League over others if "Premier League" is used)
        if (!league) {
            league = cachedLeagues.find(l => l.strLeague.toLowerCase().includes(search));
        }

        return league || null;
    } catch (err) {
        console.error('Error fetching league details:', err);
        return null;
    }
};

/**
 * Calculate age from birth date string (YYYY-MM-DD)
 * @param {string} birthDate 
 * @param {string|number} atYear - Optional year to calculate age at
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

const COUNTRY_CODES = {
    'england': 'gb-eng',
    'scotland': 'gb-sct',
    'wales': 'gb-wls',
    'northern ireland': 'gb-nir',
    'united states': 'us',
    'usa': 'us',
    'korea republic': 'kr',
    'south korea': 'kr',
    'china pr': 'cn',
    'dr congo': 'cd',
    'côte d\'ivoire': 'ci',
    'ivory coast': 'ci'
};

/**
 * Get Nationality Flag URL
 * @param {string} nationality 
 */
export const getFlagUrl = (nationality) => {
    if (!nationality) return '';

    // ISO 3166-1 alpha-2 codes are usually the first 2 letters of the country name
    // But there are many exceptions.

    const cleanName = nationality.toLowerCase();
    let code = COUNTRY_CODES[cleanName];

    if (!code) {
        // Fallback: try to guess using first 2 chars (works for fr, de, it, es, br, ar, pt, nl, be, etc.)
        // But we should be careful.
        // Better fallback: api.flags with name? 
        // For now, let's just use the first 2 letters if not in map, but special case the errors if user reports them.
        code = cleanName.substring(0, 2);
    }

    return `https://flagcdn.com/w40/${code}.png`;
};
