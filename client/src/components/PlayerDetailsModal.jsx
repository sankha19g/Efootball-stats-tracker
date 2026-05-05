import { useState, useEffect, useRef, useMemo } from 'react';
import { PLAYSTYLES, TOP_LEAGUES, SPECIAL_SKILLS, PLAYER_SKILLS, ALL_SKILLS } from '../constants';
import { searchLeagues, searchTeams, searchCountries, getFlagUrl } from '../services/footballApi';
import SavedProgressionsModal from './SavedProgressionsModal';

const parseEfDate = (dateStr) => {
    if (!dateStr) return null;
    let d = new Date(dateStr);
    if (!isNaN(d.getTime())) return d;

    // Handle "2 Apr '26" format
    const match = String(dateStr).match(/(\d+)\s+([A-Za-z]+)\s+'(\d+)/);
    if (match) {
        const day = match[1];
        const month = match[2];
        const year = "20" + match[3];
        const parsed = new Date(`${month} ${day}, ${year}`);
        if (!isNaN(parsed.getTime())) return parsed;
    }
    return null;
};

const PlayerDetailsModal = ({ player, players = [], onClose, onUpdate, onSelectPlayer, onAddToCompare, initialEditMode = false, settings, showAlert, showConfirm }) => {
    const [isEditing, setIsEditing] = useState(initialEditMode);
    const [showProgressions, setShowProgressions] = useState(false);
    const [progressionOpenCreate, setProgressionOpenCreate] = useState(false);
    const [isEditingBuildInline, setIsEditingBuildInline] = useState(false);
    const [selectedProgressionId, setSelectedProgressionId] = useState(null);
    const [rankingContext, setRankingContext] = useState('all'); // 'all', 'position', 'league', 'club', 'country'
    const [isCustomLeague, setIsCustomLeague] = useState(false);
    const [formData, setFormData] = useState({
        ...player,
        playstyle: player.playstyle || player.Playstyle || 'None',
        tags: player.tags || player.Tags || [],
        age: player.age || player.Age || '',
        height: player.height || player.Height || '',
        weight: player.weight || player.Weight || '',
        strongFoot: player.strongFoot || player.Foot || 'Right',
        secondaryPosition: Array.isArray(player.secondaryPosition) ? player.secondaryPosition.join(', ') : (player.secondaryPosition || ''),
        additionalPositions: Array.isArray(player.additionalPositions) ? player.additionalPositions.join(', ') : (player.additionalPositions || ''),
        // Technical normalization using exact JSON keys
        'Weak Foot Usage': player['Weak Foot Usage'] ?? player.weakFootUsage ?? player.WFUsage ?? '',
        'Weak Foot Accuracy': player['Weak Foot Accuracy'] ?? player.weakFootAccuracy ?? player.WFAccuracy ?? '',
        'Form': player['Form'] ?? player.conditioning ?? player['Player Form'] ?? player.Condition ?? '',
        'Injury Resistance': player['Injury Resistance'] ?? player.injuryResistance ?? player.InjuryRes ?? '',
        'Featured Players': player['Featured Players'] ?? player.featured ?? player.Featured ?? '',
        'Date Added': player['Date Added'] ?? player.DateAdded ?? null,
        image2: player.image2 || ''
    });
    const [tagInput, setTagInput] = useState('');
    const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false);
    const filterDropdownRef = useRef(null);

    const [modalPage, setModalPage] = useState(0); // 0: Overview, 1: Comparison, 2: Skills, 3: Builds, 4: Versions
    const [versions, setVersions] = useState([]);
    const [loadingVersions, setLoadingVersions] = useState(false);
    const [skills, setSkills] = useState(player.skills || player.Skills || []);
    const [additionalSkills, setAdditionalSkills] = useState(() => {
        const arr = (player.additionalSkills || player.AdditionalSkills || []).filter(Boolean);
        return [...arr, ...Array(5 - arr.length).fill('')];
    });
    const [activeAdditionalSlot, setActiveAdditionalSlot] = useState(null);

    const [skillSearch, setSkillSearch] = useState('');
    const [isEditingSkills, setIsEditingSkills] = useState(false);
    const [showAddCoreSkill, setShowAddCoreSkill] = useState(false);
    const [coreSkillSearch, setCoreSkillSearch] = useState('');
    const [leagueLogos, setLeagueLogos] = useState({});
    const [_isLoadingLogos, setIsLoadingLogos] = useState(false);
    const leaguePopupRef = useRef(null);
    const comparisonDropdownRef = useRef(null);
    const [comparisonStat, setComparisonStat] = useState('goals');
    const [isComparisonDropdownOpen, setIsComparisonDropdownOpen] = useState(false);
    const [isBulkEditingSkills, setIsBulkEditingSkills] = useState(false);
    const [bulkSkillsInput, setBulkSkillsInput] = useState('');

    const [comparisonContext, setComparisonContext] = useState('all');
    const [isLeaguePopupOpen, setIsLeaguePopupOpen] = useState(false);
    const [isRankingDropdownOpen, setIsRankingDropdownOpen] = useState(false);
    const rankingDropdownRef = useRef(null);
    const [awardFilter, setAwardFilter] = useState('All');

    // Autocomplete State
    const [clubResults, setClubResults] = useState([]);
    const [countryResults, setCountryResults] = useState([]);
    const [isSearchingClub, setIsSearchingClub] = useState(false);
    const [isSearchingCountry, setIsSearchingCountry] = useState(false);
    const [showClubResults, setShowClubResults] = useState(false);
    const [showCountryResults, setShowCountryResults] = useState(false);
    const clubSearchTimeout = useRef(null);
    const countrySearchTimeout = useRef(null);
    const latestClubSearchId = useRef(0);
    const latestCountrySearchId = useRef(0);

    // Fetch League Logos on mount
    useEffect(() => {
        const fetchLogos = async () => {
            setIsLoadingLogos(true);
            const logoMap = {};
            await Promise.all(TOP_LEAGUES.map(async (leagueName) => {
                const data = await searchLeagues(leagueName);
                if (data?.strBadge) {
                    logoMap[leagueName] = data.strBadge;
                }
            }));
            setLeagueLogos(logoMap);
            setIsLoadingLogos(false);
        };
        fetchLogos();
    }, []);

    // Consolidate click outside listeners
    useEffect(() => {
        const handleClickOutside = (event) => {
            // League Popup
            if (leaguePopupRef.current && !leaguePopupRef.current.contains(event.target)) {
                setIsLeaguePopupOpen(false);
            }
            // Comparison Dropdown
            if (comparisonDropdownRef.current && !comparisonDropdownRef.current.contains(event.target)) {
                setIsComparisonDropdownOpen(false);
            }
            // Filter Dropdown
            if (filterDropdownRef.current && !filterDropdownRef.current.contains(event.target)) {
                setIsFilterDropdownOpen(false);
            }
            // Ranking Dropdown
            if (rankingDropdownRef.current && !rankingDropdownRef.current.contains(event.target)) {
                setIsRankingDropdownOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        if (modalPage === 4 && (formData.name || player.name || player.Name)) {
            setLoadingVersions(true);
            try {
                const playerName = (formData.name || player.name || player.Name || '').toLowerCase().trim();
                const currentPlayerId = String(player.id || player.pesdb_id || player._id);
                
                // Search in local squad (players prop)
                const filtered = players.filter(p => {
                    const pName = (p.name || p.Name || '').toLowerCase().trim();
                    const pid = String(p.id || p.pesdb_id || p.ID || p.pes_id || p._id);
                    
                    // Match name
                    return pName === playerName;
                });
                
                setVersions(filtered);
            } catch (err) {
                console.error("Error finding versions in squad:", err);
            } finally {
                setLoadingVersions(false);
            }
        }
    }, [modalPage, formData.name, player.name, player.Name, player.id, player.pesdb_id, player._id, players]);




    useEffect(() => {
        const normalizedData = {
            ...player,
            playstyle: player.playstyle || player.Playstyle || 'None',
            tags: player.tags || player.Tags || [],
            age: player.age || player.Age || '',
            height: player.height || player.Height || '',
            weight: player.weight || player.Weight || '',
            strongFoot: player.strongFoot || player.Foot || 'Right',
            secondaryPosition: Array.isArray(player.secondaryPosition) ? player.secondaryPosition.join(', ') : (player.secondaryPosition || ''),
            additionalPositions: Array.isArray(player.additionalPositions) ? player.additionalPositions.join(', ') : (player.additionalPositions || ''),
            // Technical normalization
            'Weak Foot Usage': player['Weak Foot Usage'] ?? player.weakFootUsage ?? player.WFUsage ?? '',
            'Weak Foot Accuracy': player['Weak Foot Accuracy'] ?? player.weakFootAccuracy ?? player.WFAccuracy ?? '',
            'Form': player['Form'] ?? player.conditioning ?? player['Player Form'] ?? player.Condition ?? '',
            'Injury Resistance': player['Injury Resistance'] ?? player.injuryResistance ?? player.InjuryRes ?? '',
            'Featured Players': player['Featured Players'] ?? player.featured ?? player.Featured ?? '',
            'Date Added': player['Date Added'] ?? player.DateAdded ?? null
        };
        setFormData(normalizedData);
        setSkills(player.skills || player.Skills || []);
        const paddedAddSkills = (player.additionalSkills || player.AdditionalSkills || []).filter(Boolean);
        setAdditionalSkills([...paddedAddSkills, ...Array(5 - paddedAddSkills.length).fill('')]);
    }, [player]);

    const getPlayerImage = (p) => {
        if (settings?.preferredImageSource === 3) {
            const pid = p.playerId || p.pesdb_id || p.id || p.ID;
            return pid ? `https://efimg.com/efootballhub22/images/player_cards/${pid}_l.png` : (p.image || p.image2);
        }
        if (settings?.preferredImageSource === 2) {
            return p.image2 || p.image;
        }
        return p.image || p.image2;
    };

    const handleAddTag = (e) => {
        if (e.key === 'Enter' || e.type === 'click') {
            e.preventDefault();
            const tag = tagInput.trim().replace(/^#/, '');
            if (tag && !formData.tags.includes(tag)) {
                setFormData(prev => ({ ...prev, tags: [...prev.tags, tag] }));
                setTagInput('');
            }
        }
    };

    const handleRemoveTag = (tagToRemove) => {
        setFormData(prev => ({ ...prev, tags: prev.tags.filter(t => t !== tagToRemove) }));
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        let newValue = value;
        if (name === 'secondaryPosition') {
            newValue = value.replace(/,/g, ' ').replace(/\s+/g, ' ');
        }
        if (name === 'playerId' || name === 'pesdb_id') {
            setFormData(prev => ({
                ...prev,
                playerId: newValue,
                pesdb_id: newValue
            }));
            return;
        }
        setFormData(prev => ({
            ...prev,
            [name]: ['rating', 'goals', 'assists', 'matches', 'age', 'height', 'weight'].includes(name) ? Number(newValue) : newValue
        }));

        if (name === 'club') {
            if (clubSearchTimeout.current) clearTimeout(clubSearchTimeout.current);
            clubSearchTimeout.current = setTimeout(() => handleClubSearch(value), 400);
        }

        if (name === 'nationality') {
            if (countrySearchTimeout.current) clearTimeout(countrySearchTimeout.current);
            countrySearchTimeout.current = setTimeout(() => handleCountrySearch(value), 300);
        }
    };

    const handleClubSearch = async (query) => {
        if (query.length < 2) {
            setClubResults([]);
            setShowClubResults(false);
            return;
        }

        const currentId = ++latestClubSearchId.current;
        setIsSearchingClub(true);
        setShowClubResults(true);
        setClubResults([]);

        try {
            const clubs = await searchTeams(query);
            if (currentId === latestClubSearchId.current) {
                setClubResults(clubs ? clubs.slice(0, 5) : []);
            }
        } catch (err) {
            console.error('Club Search Error:', err);
        } finally {
            if (currentId === latestClubSearchId.current) {
                setIsSearchingClub(false);
            }
        }
    };

    const handleCountrySearch = async (query) => {
        if (query.length < 2) {
            setCountryResults([]);
            setShowCountryResults(false);
            return;
        }

        const currentId = ++latestCountrySearchId.current;
        setIsSearchingCountry(true);
        setShowCountryResults(true);
        setCountryResults([]);

        try {
            const countries = await searchCountries(query);
            if (currentId === latestCountrySearchId.current) {
                setCountryResults(countries ? countries.slice(0, 5) : []);
            }
        } catch (err) {
            console.error('Country Search Error:', err);
        } finally {
            if (currentId === latestCountrySearchId.current) {
                setIsSearchingCountry(false);
            }
        }
    };

    const handleSelectClub = async (club) => {
        setShowClubResults(false);
        setFormData(prev => ({
            ...prev,
            club: club.strTeam,
            league: club.strLeague || prev.league,
            logos: {
                ...prev.logos,
                club: club.strBadge || '',
                league: club.strLeagueBadge || prev.logos.league
            }
        }));

        if (club.strLeague && !club.strLeagueBadge) {
            const leagueInfo = await searchLeagues(club.strLeague);
            if (leagueInfo?.strBadge) {
                setFormData(prev => ({
                    ...prev,
                    logos: { ...prev.logos, league: leagueInfo.strBadge }
                }));
            }
        }
    };

    const handleSelectCountry = (country) => {
        setShowCountryResults(false);
        setFormData(prev => ({
            ...prev,
            nationality: country.name,
            logos: {
                ...prev.logos,
                country: country.flag || getFlagUrl(country.name)
            }
        }));
    };

    const handleLeagueBlur = async () => {
        if (isCustomLeague && formData.league) {
            const leagueInfo = await searchLeagues(formData.league);
            if (leagueInfo?.strBadge) {
                setFormData(prev => ({
                    ...prev,
                    logos: { ...prev.logos, league: leagueInfo.strBadge }
                }));
            }
        }
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            // Create an image element to load the file
            const img = new Image();
            img.src = URL.createObjectURL(file);

            img.onload = () => {
                // Calculate new dimensions (max width 400px)
                const MAX_WIDTH = 400;
                let width = img.width;
                let height = img.height;

                if (width > MAX_WIDTH) {
                    height *= MAX_WIDTH / width;
                    width = MAX_WIDTH;
                }

                // Create canvas for compression
                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;

                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);

                // Convert to compressed Base64 (JPEG, 0.7 quality)
                const optimizedImage = canvas.toDataURL('image/jpeg', 0.7);

                setFormData(prev => ({ ...prev, image: optimizedImage }));
                URL.revokeObjectURL(img.src);
            };
        }
    };

    const handleImage2Change = (e) => {
        const file = e.target.files[0];
        if (file) {
            const img = new Image();
            img.src = URL.createObjectURL(file);
            img.onload = () => {
                const MAX_WIDTH = 400;
                let width = img.width;
                let height = img.height;
                if (width > MAX_WIDTH) {
                    height *= MAX_WIDTH / width;
                    width = MAX_WIDTH;
                }
                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);
                const optimizedImage = canvas.toDataURL('image/jpeg', 0.7);
                setFormData(prev => ({ ...prev, image2: optimizedImage }));
                URL.revokeObjectURL(img.src);
            };
        }
    };

    const handlePaste = (e) => {
        const items = e.clipboardData?.items;
        if (items) {
            for (let i = 0; i < items.length; i++) {
                if (items[i].type.indexOf('image') !== -1) {
                    const file = items[i].getAsFile();
                    if (file) {
                        const img = new Image();
                        img.src = URL.createObjectURL(file);
                        img.onload = () => {
                            const MAX_WIDTH = 400;
                            let width = img.width;
                            let height = img.height;
                            if (width > MAX_WIDTH) {
                                height *= MAX_WIDTH / width;
                                width = MAX_WIDTH;
                            }
                            const canvas = document.createElement('canvas');
                            canvas.width = width;
                            canvas.height = height;
                            const ctx = canvas.getContext('2d');
                            ctx.drawImage(img, 0, 0, width, height);
                            const optimizedImage = canvas.toDataURL('image/jpeg', 0.7);
                            setFormData(prev => ({ ...prev, image: optimizedImage }));
                            if (!isEditing) setIsEditing(true); // Auto-enter edit mode if image pasted
                            URL.revokeObjectURL(img.src);
                        };
                    }
                }
            }
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const finalData = {
            ...formData,
            secondaryPosition: typeof formData.secondaryPosition === 'string' ? formData.secondaryPosition.trim() : formData.secondaryPosition,
            additionalPositions: typeof formData.additionalPositions === 'string'
                ? formData.additionalPositions.split(',').map(s => s.trim().toUpperCase()).filter(s => s !== '')
                : formData.additionalPositions
        };
        onUpdate(player._id, finalData, false);
        setIsEditing(false);
    };

    if (!player) return null;

    const rankingOptions = [
        { id: 'all', label: 'Entire Squad', icon: '🌎' },
        { id: 'position', label: 'By Position', icon: '🎯' },
        { id: 'league', label: 'By League', icon: '🏆' },
        { id: 'club', label: 'By Club', icon: '🛡️' },
        { id: 'country', label: 'By Country', icon: '🏳️' }
    ];

    const getRankInfo = () => {
        if (!players || players.length === 0) return { matches: '-', ga: '-', goals: '-', assists: '-', total: 0 };

        let filteredPlayers = [...players];
        if (rankingContext === 'position') {
            filteredPlayers = filteredPlayers.filter(p => p.position === player.position);
        } else if (rankingContext === 'league') {
            filteredPlayers = filteredPlayers.filter(p => p.league === player.league);
        } else if (rankingContext === 'club') {
            filteredPlayers = filteredPlayers.filter(p => p.club === player.club);
        } else if (rankingContext === 'country') {
            filteredPlayers = filteredPlayers.filter(p => p.nationality === player.nationality);
        }

        const calculateRank = (statKey, type = 'normal') => {
            let sorted;
            if (type === 'ratio') {
                const playersWithMatches = filteredPlayers.filter(p => (p.matches || 0) > 0);
                sorted = [...playersWithMatches].sort((a, b) => {
                    let valA, valB;
                    if (statKey === 'gpg') {
                        valA = (a.goals || 0) / a.matches;
                        valB = (b.goals || 0) / b.matches;
                    } else if (statKey === 'apg') {
                        valA = (a.assists || 0) / a.matches;
                        valB = (b.assists || 0) / b.matches;
                    } else if (statKey === 'gapg') {
                        valA = ((a.goals || 0) + (a.assists || 0)) / a.matches;
                        valB = ((b.goals || 0) + (b.assists || 0)) / b.matches;
                    }
                    return valB - valA;
                });
            } else {
                sorted = [...filteredPlayers].sort((a, b) => {
                    const statA = type === 'ga' ? ((a.goals || 0) + (a.assists || 0)) : (a[statKey] || 0);
                    const statB = type === 'ga' ? ((b.goals || 0) + (b.assists || 0)) : (b[statKey] || 0);
                    return statB - statA;
                });
            }
            const rank = sorted.findIndex(p => p._id === player._id) + 1;
            return rank > 0 ? rank : '-';
        };

        return {
            matches: calculateRank('matches'),
            ga: calculateRank(null, 'ga'),
            goals: calculateRank('goals'),
            assists: calculateRank('assists'),
            gpg: calculateRank('gpg', 'ratio'),
            apg: calculateRank('apg', 'ratio'),
            gapg: calculateRank('gapg', 'ratio'),
            total: filteredPlayers.length
        };
    };

    const rankInfo = getRankInfo();

    const comparisonData = useMemo(() => {
        if (!players || players.length === 0) return { label: 'Goals', data: [], max: 1 };

        let label = 'Goals';
        let getValue = p => p.goals || 0;

        switch (comparisonStat) {
            case 'goals': label = 'Goals'; getValue = p => p.goals || 0; break;
            case 'assists': label = 'Assists'; getValue = p => p.assists || 0; break;
            case 'matches': label = 'Matches'; getValue = p => p.matches || 0; break;
            case 'ga': label = 'G+A'; getValue = p => (p.goals || 0) + (p.assists || 0); break;
            case 'gpg': label = 'Goals/Game'; getValue = p => p.matches ? ((p.goals || 0) / p.matches) : 0; break;
            case 'apg': label = 'Assists/Game'; getValue = p => p.matches ? ((p.assists || 0) / p.matches) : 0; break;
            case 'gapg': label = 'G+A/Game'; getValue = p => p.matches ? (((p.goals || 0) + (p.assists || 0)) / p.matches) : 0; break;
            default: label = 'Goals'; getValue = p => p.goals || 0;
        }

        let filteredPlayers = [...players];
        if (comparisonContext === 'position') filteredPlayers = filteredPlayers.filter(p => p.position === player.position);
        if (comparisonContext === 'league') filteredPlayers = filteredPlayers.filter(p => p.league === player.league);
        if (comparisonContext === 'club') filteredPlayers = filteredPlayers.filter(p => p.club === player.club);
        if (comparisonContext === 'country') filteredPlayers = filteredPlayers.filter(p => p.nationality === player.nationality);
        if (comparisonContext === 'playstyle') filteredPlayers = filteredPlayers.filter(p => p.playstyle === player.playstyle);
        if (comparisonContext === 'card_type') filteredPlayers = filteredPlayers.filter(p => (p.card_type || 'base') === (player.card_type || 'base'));

        const sorted = [...filteredPlayers].sort((a, b) => getValue(b) - getValue(a));

        // Check if player is in top 5
        const playerIndex = sorted.findIndex(p => (p._id && p._id === player._id) || (p.id && p.id === player.id) || p.name === player.name);

        let displayPlayers = sorted.slice(0, 5);
        if (playerIndex > 4) {
            displayPlayers = [...sorted.slice(0, 4), player];
        }

        const maxValue = Math.max(...sorted.map(getValue), 1);

        return {
            label,
            max: maxValue,
            rank: playerIndex !== -1 ? playerIndex + 1 : '-',
            total: sorted.length,
            data: displayPlayers.map(p => ({
                id: p._id || p.id || p.name,
                name: p.name,
                value: getValue(p),
                image: getPlayerImage(p),
                rank: sorted.findIndex(s => (s._id && s._id === p._id) || (s.id && s.id === p.id) || s.name === p.name) + 1,
                isCurrent: (p._id && p._id === player._id) || (p.id && p.id === player.id) || p.name === player.name
            }))
        };
    }, [players, player, comparisonStat, comparisonContext, settings?.preferredImageSource]);

    const compOptions = [
        { id: 'goals', label: 'Goals', icon: '⚽' },
        { id: 'assists', label: 'Assists', icon: '🎯' },
        { id: 'matches', label: 'Matches', icon: '🏟️' },
        { id: 'ga', label: 'G+A', icon: '🔥' },
        { id: 'gpg', label: 'Goals/Game', icon: '⚡' },
        { id: 'apg', label: 'Assists/Game', icon: '👟' },
        { id: 'gapg', label: 'G+A/Game', icon: '⭐' }
    ];

    const compContextOptions = [
        { id: 'all', label: 'All Players', icon: '🌎' },
        { id: 'position', label: 'Same Position', icon: '📍' },
        { id: 'league', label: 'Same League', icon: '🏆' },
        { id: 'club', label: 'Same Club', icon: '🛡️' },
        { id: 'country', label: 'Same Country', icon: '🏳️' },
        { id: 'playstyle', label: 'Same Playstyle', icon: '🎮' },
        { id: 'card_type', label: 'Same Card Type', icon: '🃏' }
    ];

    // ─── Smart Awards Computation ─────────────────────────────────────────────
    const playerAwards = useMemo(() => {
        if (!players || players.length < 2) return [];

        const pid = player._id || player.id || player.name;
        const awards = [];

        const statDefs = [
            { key: 'goals',   label: 'Goals',         type: 'raw',   getValue: p => p.goals || 0 },
            { key: 'assists', label: 'Assists',        type: 'raw',   getValue: p => p.assists || 0 },
            { key: 'ga',      label: 'G+A',            type: 'raw',   getValue: p => (p.goals || 0) + (p.assists || 0) },
            { key: 'gpg',     label: 'Goals / Game',   type: 'ratio', getValue: p => p.matches ? (p.goals || 0) / p.matches : 0 },
            { key: 'apg',     label: 'Assists / Game', type: 'ratio', getValue: p => p.matches ? (p.assists || 0) / p.matches : 0 },
            { key: 'gapg',    label: 'G+A / Game',     type: 'ratio', getValue: p => p.matches ? ((p.goals || 0) + (p.assists || 0)) / p.matches : 0 },
        ];

        // Helper: does player p play a given position (primary, secondary, or trained)?
        const playsPosition = (p, pos) => {
            if (!pos) return false;
            if (p.position === pos) return true;
            const sec = Array.isArray(p.secondaryPosition)
                ? p.secondaryPosition
                : (p.secondaryPosition || '').split(',').map(s => s.trim()).filter(Boolean);
            const trained = Array.isArray(p.additionalPositions)
                ? p.additionalPositions
                : (p.additionalPositions || '').split(',').map(s => s.trim()).filter(Boolean);
            return sec.includes(pos) || trained.includes(pos);
        };

        // ── Primary group definitions ─────────────────────────────────────────
        const groupDefs = [
            {
                key: 'position',
                label: player.position,
                groupLabel: 'Position',
                emoji: '🎯',
                filter: p => p.position && player.position && p.position === player.position
            },
            {
                key: 'playstyle',
                label: player.playstyle,
                groupLabel: 'Playstyle',
                emoji: '⚡',
                filter: p => p.playstyle && player.playstyle &&
                             p.playstyle !== 'None' && player.playstyle !== 'None' &&
                             p.playstyle === player.playstyle
            },
            {
                key: 'nationality',
                label: player.nationality,
                groupLabel: 'Nationality',
                emoji: '🌍',
                filter: p => p.nationality && player.nationality && p.nationality === player.nationality
            },
            {
                key: 'league',
                label: player.league,
                groupLabel: 'League',
                emoji: '🏆',
                filter: p => p.league && player.league && p.league === player.league
            },
            {
                key: 'club',
                label: player.club,
                groupLabel: 'Club',
                emoji: '🛡️',
                filter: p => p.club && player.club && p.club === player.club
            },
            {
                key: 'cardType',
                label: player.cardType,
                groupLabel: 'Card Type',
                emoji: '🃏',
                filter: p => (p.cardType || p.card_type) && (player.cardType || player.card_type) &&
                             (p.cardType || p.card_type) === (player.cardType || player.card_type)
            },
            // ── Compound groups (top-1 only) ──────────────────────────────────
            {
                key: 'nationality_position',
                label: player.nationality && player.position ? `${player.position} · ${player.nationality}` : null,
                groupLabel: 'Nationality + Position',
                emoji: '🌍🎯',
                maxRank: 1,
                filter: p => p.nationality && player.nationality && p.nationality === player.nationality &&
                             p.position && player.position && p.position === player.position
            },
            {
                key: 'league_position',
                label: player.league && player.position ? `${player.position} · ${player.league}` : null,
                groupLabel: 'League + Position',
                emoji: '🏆🎯',
                maxRank: 1,
                filter: p => p.league && player.league && p.league === player.league &&
                             p.position && player.position && p.position === player.position
            },
        ];

        const rankBadge = r => r === 1 ? '🥇' : r === 2 ? '🥈' : '🥉';
        const ordinal   = r => r === 1 ? '1st' : r === 2 ? '2nd' : '3rd';

        const MIN_POOL = 4; // anti-padding: need more than 3 players in a group

        // ── Helper: run all stats for a given pool and push awards ────────────
        const evaluateGroup = (group, pool, overrideLabel, posTag) => {
            if (pool.length < MIN_POOL) return;
            for (const stat of statDefs) {
                const eligible = stat.type === 'ratio'
                    ? pool.filter(p => (p.matches || 0) > 0)
                    : pool;
                if (eligible.length < MIN_POOL) continue;

                const sorted = [...eligible].sort((a, b) => stat.getValue(b) - stat.getValue(a));
                const rank = sorted.findIndex(p => (p._id || p.id || p.name) === pid) + 1;

                if (rank >= 1 && rank <= (group.maxRank ?? 3)) {
                    const value = stat.getValue(player);
                    const displayVal = stat.type === 'ratio' ? value.toFixed(2) : value;
                    awards.push({
                        rank,
                        badge: rankBadge(rank),
                        ordinal: ordinal(rank),
                        statLabel: stat.label,
                        groupLabel: group.groupLabel,
                        groupKey: group.key,
                        groupValue: overrideLabel ?? group.label,
                        emoji: group.emoji,
                        value: displayVal,
                        poolSize: eligible.length,
                        pos: posTag || 'General'
                    });
                }
            }
        };

        // ── Run primary groups ────────────────────────────────────────────────
        for (const group of groupDefs) {
            if (!group.label) continue;
            const pool = players.filter(group.filter);
            // Primary groups are associated with the player's main position or 'General'
            // We'll tag them with the main position so they show up when filtered by main pos
            evaluateGroup(group, pool, null, player.position);
        }

        // ── Secondary / trained position rankings ─────────────────────────────
        // Collect all alt positions for this player
        const secPositions = Array.isArray(player.secondaryPosition)
            ? player.secondaryPosition
            : (player.secondaryPosition || '').split(',').map(s => s.trim()).filter(Boolean);
        const trainedPositions = Array.isArray(player.additionalPositions)
            ? player.additionalPositions
            : (player.additionalPositions || '').split(',').map(s => s.trim()).filter(Boolean);

        const altPositions = [...new Set([...secPositions, ...trainedPositions])].filter(Boolean);

        for (const altPos of altPositions) {
            // Global: all players who can play this position
            evaluateGroup(
                { key: `alt_pos_global_${altPos}`, groupLabel: `as ${altPos} (Global)`, emoji: '🎯', maxRank: 3 },
                players.filter(p => playsPosition(p, altPos)),
                `${altPos} · All`,
                altPos
            );
            // Nationality
            if (player.nationality) {
                evaluateGroup(
                    { key: `alt_pos_nat_${altPos}`, groupLabel: `as ${altPos} · ${player.nationality}`, emoji: '🌍🎯', maxRank: 1 },
                    players.filter(p => playsPosition(p, altPos) && p.nationality === player.nationality),
                    `${altPos} · ${player.nationality}`,
                    altPos
                );
            }
            // League
            if (player.league) {
                evaluateGroup(
                    { key: `alt_pos_league_${altPos}`, groupLabel: `as ${altPos} · ${player.league}`, emoji: '🏆🎯', maxRank: 1 },
                    players.filter(p => playsPosition(p, altPos) && p.league === player.league),
                    `${altPos} · ${player.league}`,
                    altPos
                );
            }
        }

        // ── Sort: group priority → rank ───────────────────────────────────────
        const groupPriority = {
            position:             0,
            playstyle:            1,
            nationality:          2,
            nationality_position: 3,
            league:               4,
            league_position:      5,
            club:                 6,
            cardType:             7,
        };
        awards.sort((a, b) => {
            const pa = groupPriority[a.groupKey] ?? 10;
            const pb = groupPriority[b.groupKey] ?? 10;
            if (pa !== pb) return pa - pb;
            return a.rank - b.rank;
        });
        return awards;
    }, [players, player]);

    const availableAwardPositions = useMemo(() => {
        if (!playerAwards.length) return ['All'];
        const positions = ['All', ...new Set(playerAwards.map(a => a.pos))];
        // Sort: 'All' first, then player's primary position, then others
        return positions.sort((a, b) => {
            if (a === 'All') return -1;
            if (b === 'All') return 1;
            if (a === player.position) return -1;
            if (b === player.position) return 1;
            return a.localeCompare(b);
        });
    }, [playerAwards, player.position]);

    const filteredAwards = useMemo(() => {
        if (awardFilter === 'All') return playerAwards;
        return playerAwards.filter(a => a.pos === awardFilter);
    }, [playerAwards, awardFilter]);

    const getCardStyles = (type) => {
        switch (type?.toLowerCase()) {
            case 'legendary': return {
                bg: 'bg-gradient-to-b from-[#1a1608] to-[#0a0a0c] border-yellow-500/20',
                glow: 'shadow-[0_0_50px_rgba(234,179,8,0.15)]',
                accent: 'text-yellow-500',
                leak: 'from-yellow-500/10 via-transparent to-transparent',
                flare: 'bg-yellow-400/5'
            };
            case 'epic': return {
                bg: 'bg-gradient-to-b from-[#081a12] to-[#0a0a0c] border-green-500/20',
                glow: 'shadow-[0_0_50px_rgba(34,197,94,0.15)]',
                accent: 'text-green-500',
                leak: 'from-green-500/10 via-transparent to-transparent',
                flare: 'bg-green-400/5'
            };
            case 'potw': return {
                bg: 'bg-gradient-to-b from-[#081a1a] to-[#0a0a0c] border-cyan-500/20',
                glow: 'shadow-[0_0_50px_rgba(6,182,212,0.15)]',
                accent: 'text-cyan-500',
                leak: 'from-cyan-500/10 via-transparent to-transparent',
                flare: 'bg-cyan-400/5'
            };
            case 'featured': return {
                bg: 'bg-gradient-to-b from-[#14081a] to-[#0a0a0c] border-purple-500/20',
                glow: 'shadow-[0_0_50px_rgba(168,85,247,0.15)]',
                accent: 'text-purple-500',
                leak: 'from-purple-500/10 via-transparent to-transparent',
                flare: 'bg-purple-400/5'
            };
            default: return {
                bg: 'bg-gradient-to-b from-[#0a121a] to-[#0a0a0c] border-blue-500/20',
                glow: 'shadow-[0_0_50px_rgba(59,130,246,0.15)]',
                accent: 'text-blue-500',
                leak: 'from-blue-500/10 via-transparent to-transparent',
                flare: 'bg-blue-400/5'
            };
        }
    };

    return (
        <div className={`fixed inset-0 bg-[#0a0a0c] z-[300] overflow-y-auto md:overflow-hidden flex flex-col ${settings?.highPerf ? '' : 'animate-fade-in'}`}>
            {/* Removed SavedProgressionsModal from top level to show it inline instead */}

            <div className={`relative w-full min-h-full md:h-full bg-[#0a0a0c] flex flex-col md:flex-row ${settings?.highPerf ? '' : 'animate-slide-up'} overflow-visible md:overflow-hidden`}>

                {/* Close/Back Button */}
                <button
                    onClick={onClose}
                    className="absolute top-6 left-6 z-50 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white transition-all active:scale-95 border border-white/10 backdrop-blur-md group"
                >
                    <span className="text-xl group-hover:-translate-x-1 transition-transform">←</span>
                    <span className="text-[10px] font-black uppercase tracking-widest hidden sm:inline">Back to Squad</span>
                </button>

                {/* Left Side: Card Visual & Quick Info */}
                <div className={`w-full md:w-1/3 p-6 md:p-8 pt-24 md:pt-28 flex flex-col gap-4 md:gap-6 ${getCardStyles(formData.cardType).bg} md:border-r border-white/5 relative overflow-hidden h-fit md:h-full shrink-0 group/left font-sans`}>

                    {/* Dynamic Background Glow & Decorative Elements */}
                    <div className="absolute inset-0 pointer-events-none">
                        {getPlayerImage(formData) && (
                            <div className="absolute inset-0 opacity-20 transition-opacity duration-1000">
                                <img src={getPlayerImage(formData)} alt="" className="w-full h-full object-cover object-top blur-[40px] scale-150" />
                                <div className={`absolute inset-0 ${getCardStyles(formData.cardType).glow}`}></div>
                            </div>
                        )}
                        <div className={`absolute -top-24 -left-24 w-64 h-64 bg-gradient-to-br ${getCardStyles(formData.cardType).leak} blur-3xl opacity-30`}></div>
                    </div>

                    <div className="flex-1 flex flex-col gap-6 relative z-10 md:overflow-y-auto md:custom-scrollbar pr-1 md:pr-2">

                        <div className="flex flex-col items-center gap-4 w-full">

                            {/* Player Card Container */}
                            <div className={`relative w-28 sm:w-32 md:w-40 aspect-[0.72] ${settings?.cardCornerStyle === 'sharp' ? 'rounded-none' : 'rounded-2xl'} overflow-hidden border-[3px] md:border-[4px] border-white/20 shadow-2xl transition-all duration-700 ${getCardStyles(formData.cardType).glow} group-hover/left:scale-[1.02] shrink-0`}>
                                {/* Card Shine Effect */}
                                <div className="absolute inset-0 z-10 pointer-events-none bg-gradient-to-tr from-transparent via-white/[0.05] to-transparent -translate-x-full animate-shine"></div>

                                {getPlayerImage(formData) ? (
                                    <img src={getPlayerImage(formData)} alt={formData.name} className="w-full h-full object-cover object-top" />
                                ) : (
                                    <div className="w-full h-full flex flex-col items-center justify-center bg-white/5 border-2 border-dashed border-white/10">
                                        <span className="text-4xl mb-4">📸</span>
                                        <span className="text-[10px] font-black uppercase tracking-widest opacity-30">No Photo</span>
                                    </div>
                                )}

                                {/* Card HUD: Rating & Position & Badges */}
                                {(settings?.showDetailsRatings !== false || settings?.showDetailsPosition !== false || settings?.showDetailsClubBadge !== false || settings?.showDetailsNationBadge !== false) && (
                                    settings?.cardHudStyle === 'efootball' ? (
                                        /* eFootball Style HUD - Scaled Exact Specs */
                                        <div 
                                            className="pointer-events-none absolute flex flex-col items-center text-center leading-none z-20"
                                            style={{ left: '6%', top: '2%', width: '25%' }}
                                        >
                                            {settings?.showDetailsRatings !== false && (
                                                <span 
                                                    className="text-white font-['Big_Shoulders_Stencil_Text'] font-black" 
                                                    style={{ 
                                                        fontSize: '64px', 
                                                        lineHeight: '1', 
                                                        textShadow: 'rgba(0, 0, 0, 0.7) 0px 4px 12px' 
                                                    }}
                                                >
                                                    {formData.rating}
                                                </span>
                                            )}
                                            {settings?.showDetailsPosition !== false && (
                                                <span 
                                                    className="text-white font-['Archivo_Black']" 
                                                    style={{ 
                                                        fontSize: '26px', 
                                                        lineHeight: '1', 
                                                        letterSpacing: '0.05em', 
                                                        textShadow: 'rgba(0, 0, 0, 0.7) 0px 2px 6px',
                                                        marginTop: '-2px'
                                                    }}
                                                >
                                                    {formData.position}
                                                </span>
                                            )}
                                            
                                            {/* Badges for eFootball style */}
                                            <div className="flex flex-col items-center gap-2.5 mt-4">
                                                {settings?.showDetailsNationBadge !== false && (player.logos?.country || player.nationality_flag_url) && (
                                                    <div className="w-10 h-6 md:w-16 md:h-10 overflow-hidden border-2 border-white/20 shadow-2xl">
                                                        <img src={player.logos?.country || player.nationality_flag_url} alt="" className="w-full h-full object-cover" />
                                                    </div>
                                                )}
                                                {settings?.showDetailsClubBadge !== false && (formData.logos?.club || player.club_badge_url) && (
                                                    <div className="w-8 h-8 md:w-12 md:h-12">
                                                        <img src={formData.logos?.club || player.club_badge_url} alt="" className="w-full h-full object-contain filter drop-shadow-2xl" />
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ) : (
                                        /* Default Style HUD */
                                        <div className={`absolute top-0 left-0 z-20 flex flex-col items-center bg-black/80 backdrop-blur-xl w-[44px] pt-3 pb-2 ${settings?.cardCornerStyle === 'sharp' ? 'rounded-none' : 'rounded-br-2xl'} border-r border-b border-white/10 shadow-xl gap-2 transition-all duration-500`}>
                                            {(settings?.showDetailsRatings !== false || settings?.showDetailsPosition !== false) && (
                                                <div className="flex flex-col items-center justify-center">
                                                    {settings?.showDetailsRatings !== false && (
                                                        <span className="text-xl md:text-2xl font-black text-ef-accent leading-none tracking-tighter mb-0.5">{formData.rating}</span>
                                                    )}
                                                    {settings?.showDetailsPosition !== false && (
                                                        <span className="text-[8px] md:text-[10px] font-black text-ef-accent/80 italic uppercase leading-none">{formData.position}</span>
                                                    )}
                                                </div>
                                            )}

                                            {(settings?.showDetailsClubBadge !== false || settings?.showDetailsNationBadge !== false) && (
                                                <div className="flex flex-col items-center gap-2 border-t border-white/10 pt-2 w-full px-2">
                                                    {settings?.showDetailsClubBadge !== false && (formData.logos?.club || player.club_badge_url) && (
                                                        <img src={formData.logos?.club || player.club_badge_url} alt="" className="w-7 h-7 object-contain drop-shadow-lg" />
                                                    )}
                                                    {settings?.showDetailsNationBadge !== false && (player.logos?.country || player.nationality_flag_url) && (
                                                        <img src={player.logos?.country || player.nationality_flag_url} alt="" className="w-7 h-5 object-cover rounded shadow-lg" />
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    )
                                )}

                                {/* Edit Overlay */}
                                {isEditing && (
                                    <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/70 opacity-0 hover:opacity-100 transition-all cursor-pointer backdrop-blur-sm">
                                        <div className="bg-white/10 border border-white/20 p-4 rounded-2xl flex flex-col items-center gap-2 scale-90 hover:scale-100 transition-transform">
                                            <span className="text-2xl">📤</span>
                                            <span className="text-[10px] font-black uppercase tracking-widest text-white">Change Photo</span>
                                        </div>
                                        <input type="file" accept="image/*" onChange={handleImageChange} className="absolute inset-0 opacity-0 cursor-pointer" />
                                    </div>
                                )}
                            </div>

                            {/* Quick Action Overlay for URL/Paste (Edit Mode) */}
                            {isEditing && (
                                <div className="w-full flex flex-col gap-4 mt-2">
                                    <div className="flex flex-col gap-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-ef-accent/60 ml-1">Source 1 (Current)</label>
                                        <div className="relative">
                                            <input
                                                type="text"
                                                placeholder="Paste source 1 URL..."
                                                value={formData.image && !formData.image.startsWith('data:') ? formData.image : ''}
                                                onChange={(e) => setFormData(prev => ({ ...prev, image: e.target.value }))}
                                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-[10px] text-white focus:border-ef-accent/40 transition-all font-bold"
                                            />
                                        </div>
                                    </div>

                                    <div className="flex flex-col gap-2 p-3 bg-ef-blue/5 border border-ef-blue/20 rounded-2xl">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-ef-blue ml-1">Source 2 (New)</label>
                                        <div className="flex gap-2">
                                            <div 
                                                onClick={() => document.getElementById('details-image2-upload').click()}
                                                className="w-12 h-12 bg-black/40 border border-dashed border-white/10 rounded-xl flex items-center justify-center cursor-pointer hover:border-ef-blue/40 transition-all shrink-0 overflow-hidden"
                                            >
                                                {formData.image2 ? (
                                                    <img src={formData.image2} className="w-full h-full object-cover" alt="" />
                                                ) : (
                                                    <span className="text-xl opacity-20">📸</span>
                                                )}
                                            </div>
                                            <input id="details-image2-upload" type="file" accept="image/*" onChange={handleImage2Change} className="hidden" />
                                            <input
                                                type="text"
                                                placeholder="Paste source 2 URL..."
                                                value={formData.image2 && !formData.image2.startsWith('data:') ? formData.image2 : ''}
                                                onChange={(e) => setFormData(prev => ({ ...prev, image2: e.target.value }))}
                                                className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-[10px] text-white focus:border-ef-blue/40 transition-all font-bold"
                                            />
                                        </div>
                                    </div>

                                    <div
                                        onPaste={handlePaste}
                                        className="w-full py-3 bg-white/5 border border-white/10 border-dashed rounded-xl flex items-center justify-center gap-2 hover:bg-white/10 transition-all cursor-pointer"
                                        tabIndex="0"
                                    >
                                        <span className="text-sm">📋</span>
                                        <span className="text-[9px] font-black uppercase tracking-widest opacity-40">Paste to Source 1</span>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Player Details List */}
                        <div className="space-y-1 pr-1 pb-8">
                            {/* Detailed List Header */}
                            <div className="flex items-center gap-3 mt-4 shrink-0">
                                <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent to-white/10"></div>
                                <span className="text-[8px] font-black uppercase tracking-[0.4em] text-white/20 whitespace-nowrap">Technical Specs</span>
                                <div className="h-[1px] flex-1 bg-gradient-to-l from-transparent to-white/10"></div>
                            </div>

                            <div className="space-y-0">
                                {[
                                    { label: 'Player ID', value: formData.playerId || formData.pesdb_id, mono: true },
                                    { label: 'Form', value: formData['Form'] || 'Standard', highlight: true },
                                    { label: 'Trained Positions', value: formData.additionalPositions || '-' },
                                    { label: 'Weak Foot Usage', value: formData['Weak Foot Usage'] },
                                    { label: 'Weak Foot Accuracy', value: formData['Weak Foot Accuracy'] },
                                    { label: 'Injury Resistance', value: formData['Injury Resistance'] },
                                    { label: 'Featured Pack', value: formData['Featured Players'], blue: true },
                                    { label: 'Date Added', value: (() => { const d = parseEfDate(formData['Date Added']); return d ? d.toLocaleDateString() : 'Unknown'; })() },
                                    { label: 'Uploaded', value: formData.createdAt ? new Date(formData.createdAt).toLocaleDateString() : 'N/A', dim: true }
                                ].map((item, i) => (
                                    <div key={i} className="w-full flex items-center justify-between px-[10px] h-[26px] transition-all duration-300 border-l-4 border-transparent hover:bg-white/5 group/spec">
                                        <span className="text-[13px] font-medium tracking-tight text-white/40 font-inter group-hover/spec:text-ef-accent transition-colors">{item.label}</span>
                                        <span className={`text-[13px] font-medium tracking-tight font-inter ${item.mono ? 'font-mono text-[12px]' : ''} ${item.highlight ? 'text-ef-accent' :
                                            item.blue ? 'text-ef-blue' :
                                                'text-white'
                                            }`}>
                                            {item.value || '-'}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>


                {/* Right Side: Details / Edit Form */}
                <div className="w-full md:w-2/3 p-4 md:p-6 pt-4 bg-black flex flex-col justify-start relative overflow-visible md:overflow-y-auto md:custom-scrollbar group/modal">
                    {/* Identity Section */}
                    <>
                    {!isEditing && (
                        <div className="flex flex-col items-start text-left gap-2 w-full px-4 md:px-6 mb-2">
                            <div className="flex flex-wrap items-baseline gap-x-4 gap-y-2">
                                <h1 className="text-3xl md:text-4xl font-black text-white uppercase tracking-tighter leading-tight drop-shadow-lg">
                                    {formData.name}
                                </h1>
                                <div className="flex items-center gap-2.5">
                                    <div className="flex items-center h-[26px] px-[10px] bg-ef-accent rounded-md text-ef-dark shadow-lg shadow-ef-accent/10">
                                        <span className="text-[13px] font-medium tracking-tight font-inter">{formData.position}</span>
                                    </div>
                                    {formData.secondaryPosition && (
                                        <span className="text-[13px] font-medium text-ef-accent/30 tracking-tight font-inter">{formData.secondaryPosition}</span>
                                    )}
                                    {formData.playstyle && formData.playstyle !== 'None' && (
                                        <div className="flex items-center gap-2.5">
                                            <span className="text-white/10 text-[13px] font-medium">/</span>
                                            <span className="text-[13px] font-medium tracking-tight text-ef-accent/60 italic font-inter">
                                                {formData.playstyle}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-x-4 gap-y-3 mt-4 max-w-full">
                                {[
                                    { label: 'Age', value: formData.age || '-', sub: 'yrs' },
                                    { label: 'Foot', value: formData.strongFoot || '-', highlight: true },
                                    { label: 'Height', value: formData.height ? `${formData.height}cm` : '-' },
                                    { label: 'Weight', value: formData.weight ? `${formData.weight}kg` : '-' },
                                    { label: 'Club', value: formData.club, icon: formData.logos?.club },
                                    { label: 'Nation', value: formData.nationality, icon: formData.logos?.country, isFlag: true },
                                    { label: 'League', value: formData.league, icon: formData.logos?.league },
                                    { label: 'Type', value: formData.cardType, isType: true }
                                ].map((item, i) => (
                                    <div key={i} className="flex items-center h-[26px] gap-2 px-[10px] bg-white/[0.03] border border-white/10 rounded-md hover:bg-white/[0.08] transition-all">
                                        <span className="text-[13px] font-medium tracking-tight text-white/40 font-inter">{item.label}</span>
                                        <div className="flex items-center gap-1.5">
                                            {item.icon && <img src={item.icon} className={`${item.isFlag ? 'w-4 h-2.5 object-cover rounded-sm' : 'w-3.5 h-3.5 object-contain'} opacity-80`} alt="" />}
                                            <span className={`text-[13px] font-medium tracking-tight font-inter ${item.highlight ? 'text-ef-accent' :
                                                item.isType ? (
                                                    formData.cardType === 'Legendary' ? 'text-yellow-400' :
                                                        formData.cardType === 'Epic' ? 'text-green-400' :
                                                            formData.cardType === 'Featured' ? 'text-purple-400' :
                                                                formData.cardType === 'POTW' ? 'text-cyan-400' : 'text-blue-400'
                                                ) : 'text-white/80'}`}>
                                                {item.value || 'N/A'}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Tags Pill Container */}
                            {formData.tags && formData.tags.length > 0 && (
                                <div className="flex flex-wrap items-center gap-1.5 mt-3 max-w-full">
                                    {formData.tags.map(tag => (
                                        <span key={tag} className="flex items-center h-[26px] px-[10px] bg-ef-accent/5 border border-ef-accent/10 rounded-md text-[13px] font-medium tracking-tight text-ef-accent/40 hover:text-ef-accent hover:border-ef-accent/30 transition-all font-inter">
                                            #{tag}
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {isEditing ? (
                        <form onSubmit={handleSubmit} onPaste={handlePaste} className="h-full flex flex-col">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-xl font-black flex items-center gap-2">
                                    <span className="text-ef-accent">⚡</span> Edit Player Profile
                                </h3>
                                <div className="flex gap-2">
                                    <button type="button" onClick={() => { setFormData({ ...player }); setIsEditing(false); }} className="px-4 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-[10px] font-black uppercase tracking-widest transition-all">Cancel</button>
                                    <button type="submit" className="px-4 py-1.5 rounded-lg bg-ef-accent text-ef-dark text-[10px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-lg shadow-ef-accent/20">Save Profile</button>
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar flex justify-center">
                                <div className="w-full max-w-xl py-6 space-y-8">

                                    {/* --- Section: Core Identity --- */}
                                    <section>
                                        <div className="flex items-center gap-3 mb-4 opacity-70">
                                            <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent to-ef-accent/20"></div>
                                            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-ef-accent whitespace-nowrap">Core Identity</span>
                                            <div className="h-[1px] flex-1 bg-gradient-to-l from-transparent to-ef-accent/20"></div>
                                        </div>

                                        <div className="space-y-3">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                <div className="flex flex-col gap-1.5">
                                                    <label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-1">Player Name</label>
                                                    <input type="text" name="name" value={formData.name} onChange={handleChange} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white font-black focus:border-ef-accent focus:bg-white/10 focus:outline-none transition-all" />
                                                </div>
                                                <div className="grid grid-cols-2 gap-3">
                                                    <div className="flex flex-col gap-1.5">
                                                        <label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-1">Position</label>
                                                        <input type="text" name="position" value={formData.position} onChange={handleChange} placeholder="CF" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white font-black focus:border-ef-accent focus:bg-white/10 focus:outline-none transition-all placeholder:text-white/20" />
                                                    </div>
                                                    <div className="flex flex-col gap-1.5">
                                                        <label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-1">Rating</label>
                                                        <input type="number" name="rating" value={formData.rating} onChange={handleChange} placeholder="99" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white font-black focus:border-ef-accent focus:bg-white/10 focus:outline-none transition-all placeholder:text-white/20" />
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 gap-3">
                                                <div className="flex flex-col gap-1.5">
                                                    <label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-1">Player ID</label>
                                                    <div className="relative">
                                                        <input type="text" name="pesdb_id" value={formData.pesdb_id || formData.playerId || ''} onChange={handleChange} className="w-full bg-white/5 border border-white/10 rounded-xl pl-4 pr-12 py-3 font-mono text-xs text-white/70 focus:border-ef-accent focus:outline-none focus:text-white transition-all" />
                                                        <button type="button" onClick={async () => { const text = await navigator.clipboard.readText(); if (text) setFormData(prev => ({ ...prev, playerId: text, pesdb_id: text })); }} className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] font-black text-ef-accent uppercase hover:text-white transition-colors">Paste</button>
                                                    </div>
                                                </div>
                                                <div className="flex flex-col gap-1.5">
                                                    <label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-1">Card Type</label>
                                                    <select name="cardType" value={formData.cardType} onChange={handleChange} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 font-bold text-white focus:border-ef-accent focus:outline-none appearance-none cursor-pointer">
                                                        {['Normal', 'Legend', 'Epic', 'Featured', 'POTW', 'BigTime', 'ShowTime'].map(type => (
                                                            <option key={type} value={type} className="bg-ef-dark">{type}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 gap-3">
                                                <div className="flex flex-col gap-1.5">
                                                    <label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-1">Featured Pack</label>
                                                    <input type="text" name="Featured Players" value={formData['Featured Players'] || ''} onChange={handleChange} placeholder="Standard" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm font-bold text-white focus:border-ef-accent focus:outline-none transition-all" />
                                                </div>
                                                <div className="flex flex-col gap-1.5">
                                                    <label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-1">Date Added</label>
                                                    <input type="text" name="Date Added" value={formData['Date Added'] || ''} onChange={handleChange} placeholder="e.g. 2026/04/08" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm font-bold text-white focus:border-ef-accent focus:outline-none transition-all" />
                                                </div>
                                            </div>
                                        </div>
                                    </section>

                                    {/* --- Section: Team & Origin --- */}
                                    <section>
                                        <div className="flex items-center gap-3 mb-4 opacity-70">
                                            <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent to-ef-blue/20"></div>
                                            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-ef-blue whitespace-nowrap">Affiliation</span>
                                            <div className="h-[1px] flex-1 bg-gradient-to-l from-transparent to-ef-blue/20"></div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="flex flex-col gap-1.5 relative">
                                                <label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-1">Club</label>
                                                <div className="relative">
                                                    <input
                                                        type="text" name="club"
                                                        value={formData.club || ''} onChange={handleChange}
                                                        onBlur={() => setTimeout(() => setShowClubResults(false), 200)}
                                                        onFocus={() => formData.club && formData.club.length >= 2 && setShowClubResults(true)}
                                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 font-bold text-white focus:border-ef-accent focus:outline-none"
                                                    />
                                                    {showClubResults && (
                                                        <div className="absolute top-full left-0 right-0 mt-2 bg-[#1a1a1e] border border-white/10 rounded-xl shadow-2xl overflow-hidden z-[110] max-h-[200px] overflow-y-auto backdrop-blur-xl">
                                                            {clubResults.map(club => (
                                                                <div key={club.idTeam} onClick={() => handleSelectClub(club)} className="px-4 py-3 hover:bg-white/5 cursor-pointer flex items-center gap-3 transition-colors border-b border-white/5 last:border-0">
                                                                    <img src={club.strBadge} alt="" className="w-5 h-5 object-contain" />
                                                                    <div className="flex-1 min-w-0">
                                                                        <div className="text-[10px] font-black text-white truncate">{club.strTeam}</div>
                                                                        <div className="text-[7px] uppercase font-bold opacity-30 truncate">{club.strLeague}</div>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="flex flex-col gap-1.5 relative" ref={leaguePopupRef}>
                                                <div className="flex justify-between items-center ml-1">
                                                    <label className="text-[10px] font-black uppercase tracking-widest opacity-40">League</label>
                                                    <button type="button" onClick={() => setIsCustomLeague(!isCustomLeague)} className="text-[8px] text-ef-accent opacity-50 hover:opacity-100 uppercase tracking-widest font-black">{isCustomLeague ? 'Use List' : 'Custom'}</button>
                                                </div>
                                                {isCustomLeague ? (
                                                    <input type="text" name="league" value={formData.league || ''} onChange={handleChange} onBlur={handleLeagueBlur} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 font-bold text-white focus:border-ef-accent focus:outline-none" />
                                                ) : (
                                                    <div className="relative">
                                                        <button type="button" onClick={() => setIsLeaguePopupOpen(!isLeaguePopupOpen)} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-left font-bold text-white hover:text-ef-accent transition-colors flex items-center justify-between">
                                                            <span className="text-xs truncate">{formData.league || 'Select League'}</span>
                                                            <span className="text-[8px] opacity-30">▼</span>
                                                        </button>
                                                        {isLeaguePopupOpen && (
                                                            <div className="absolute top-full left-0 right-0 mt-2 bg-[#1a1a1e] border border-white/10 rounded-xl shadow-2xl overflow-hidden z-[110] max-h-[200px] overflow-y-auto backdrop-blur-xl">
                                                                {TOP_LEAGUES.map(league => (
                                                                    <button key={league} type="button" onClick={() => { setFormData(prev => ({ ...prev, league, logos: { ...prev.logos, league: leagueLogos[league] || '' } })); setIsLeaguePopupOpen(false); }} className={`flex items-center gap-3 px-4 py-3 w-full text-left hover:bg-white/5 border-b border-white/5 last:border-0 ${formData.league === league ? 'text-ef-accent' : 'text-white/70'} `}>
                                                                        {leagueLogos[league] && <img src={leagueLogos[league]} className="w-4 h-4 object-contain opacity-70" />}
                                                                        <span className="text-[10px] font-bold">{league}</span>
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-3 mt-3">
                                            <div className="flex flex-col gap-1.5 relative">
                                                <label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-1">Nationality</label>
                                                <div className="relative">
                                                    <input
                                                        type="text" name="nationality"
                                                        value={formData.nationality || ''} onChange={handleChange}
                                                        onBlur={() => setTimeout(() => setShowCountryResults(false), 200)}
                                                        onFocus={() => formData.nationality && formData.nationality.length >= 2 && setShowCountryResults(true)}
                                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 font-bold text-white focus:border-ef-accent focus:outline-none"
                                                    />
                                                    {showCountryResults && (
                                                        <div className="absolute top-full left-0 right-0 mt-2 bg-[#1a1a1e] border border-white/10 rounded-xl shadow-2xl overflow-hidden z-[110] max-h-[200px] overflow-y-auto backdrop-blur-xl">
                                                            {countryResults.map(c => (
                                                                <div key={c.name} onClick={() => handleSelectCountry(c)} className="px-4 py-3 hover:bg-white/5 cursor-pointer flex items-center gap-3 transition-colors border-b border-white/5 last:border-0">
                                                                    <img src={getFlagUrl(c.name)} alt="" className="w-5 h-3 object-cover rounded-sm" />
                                                                    <span className="text-[10px] font-bold text-white">{c.name}</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex flex-col gap-1.5">
                                                <label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-1">Age</label>
                                                <input type="number" name="age" value={formData.age || ''} onChange={handleChange} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 font-black text-white focus:border-ef-accent focus:outline-none" />
                                            </div>
                                        </div>
                                    </section>

                                    {/* --- Section: Mechanical Specs --- */}
                                    <section>
                                        <div className="flex items-center gap-3 mb-4 opacity-70">
                                            <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent to-purple-500/20"></div>
                                            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-purple-400 whitespace-nowrap">Specifications</span>
                                            <div className="h-[1px] flex-1 bg-gradient-to-l from-transparent to-purple-500/20"></div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="flex flex-col gap-1.5">
                                                <label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-1">Height / Weight</label>
                                                <div className="flex gap-2">
                                                    <input type="number" name="height" value={formData.height || ''} onChange={handleChange} placeholder="CM" className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 font-bold text-white focus:border-ef-accent focus:outline-none" />
                                                    <input type="number" name="weight" value={formData.weight || ''} onChange={handleChange} placeholder="KG" className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 font-bold text-white focus:border-ef-accent focus:outline-none" />
                                                </div>
                                            </div>
                                            <div className="flex flex-col gap-1.5">
                                                <label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-1">Preferred Foot</label>
                                                <select name="strongFoot" value={formData.strongFoot} onChange={handleChange} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 font-bold text-white focus:border-ef-accent focus:outline-none appearance-none cursor-pointer">
                                                    <option value="Right">Right</option>
                                                    <option value="Left">Left</option>
                                                </select>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 gap-3 mt-3">
                                            <div className="flex flex-col gap-1.5">
                                                <label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-1">Playstyle</label>
                                                <select name="playstyle" value={formData.playstyle || ''} onChange={handleChange} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 font-bold text-white focus:border-ef-accent focus:outline-none appearance-none cursor-pointer">
                                                    {PLAYSTYLES.map(style => <option key={style} value={style} className="bg-ef-dark">{style}</option>)}
                                                </select>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 gap-4 mt-3">
                                            <div className="flex flex-col gap-1.5">
                                                <label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-1">Main Position</label>
                                                <select name="position" value={formData.position} onChange={handleChange} className="w-full bg-white/20 border border-ef-accent/30 rounded-xl px-4 py-3 font-black text-ef-accent focus:border-ef-accent focus:outline-none appearance-none cursor-pointer">
                                                    {['CF', 'SS', 'LWF', 'RWF', 'LMF', 'RMF', 'AMF', 'CMF', 'DMF', 'LB', 'RB', 'CB', 'GK'].map(pos => (
                                                        <option key={pos} value={pos} className="bg-ef-dark">{pos}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div className="grid grid-cols-2 gap-3">
                                                <div className="flex flex-col gap-1.5">
                                                    <label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-1">Secondary Icons</label>
                                                    <input type="text" name="secondaryPosition" value={formData.secondaryPosition || ''} onChange={handleChange} placeholder="e.g. SS, AMF" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm font-bold text-white focus:border-ef-accent focus:outline-none" />
                                                </div>
                                                <div className="flex flex-col gap-1.5">
                                                    <label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-1">Trained Positions</label>
                                                    <input type="text" name="additionalPositions" value={formData.additionalPositions || ''} onChange={handleChange} placeholder="e.g. DMF" className="w-full bg-white/5 border border-ef-blue/30 rounded-xl px-4 py-3 text-sm font-bold text-ef-blue focus:border-white focus:outline-none" />
                                                </div>
                                            </div>
                                        </div>
                                    </section>

                                    {/* --- Section: Performance Stats --- */}
                                    <section>
                                        <div className="flex items-center gap-3 mb-4 opacity-70">
                                            <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent to-yellow-500/20"></div>
                                            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-yellow-500 whitespace-nowrap">Performance Data</span>
                                            <div className="h-[1px] flex-1 bg-gradient-to-l from-transparent to-yellow-500/20"></div>
                                        </div>

                                        <div className="grid grid-cols-4 gap-3 mb-4">
                                            <div className="flex flex-col gap-1.5 col-span-1">
                                                <label className="text-[8px] font-black uppercase tracking-widest opacity-40 text-center">Rating</label>
                                                <input type="number" name="rating" value={formData.rating || ''} onChange={handleChange} className="w-full bg-ef-accent/10 border border-ef-accent/30 rounded-xl py-3 text-center font-black text-ef-accent text-xl focus:border-ef-accent focus:outline-none" />
                                            </div>
                                            <div className="flex flex-col gap-1.5 col-span-1">
                                                <label className="text-[8px] font-black uppercase tracking-widest opacity-40 text-center">Matches</label>
                                                <input type="number" name="matches" value={formData.matches || 0} onChange={handleChange} className="w-full bg-white/5 border border-white/10 rounded-xl py-3 text-center font-bold text-white focus:border-ef-accent focus:outline-none" />
                                            </div>
                                            <div className="flex flex-col gap-1.5 col-span-1">
                                                <label className="text-[8px] font-black uppercase tracking-widest opacity-40 text-center">Goals</label>
                                                <input type="number" name="goals" value={formData.goals} onChange={handleChange} className="w-full bg-white/5 border border-white/10 rounded-xl py-3 text-center font-bold text-ef-blue focus:border-ef-accent focus:outline-none" />
                                            </div>
                                            <div className="flex flex-col gap-1.5 col-span-1">
                                                <label className="text-[8px] font-black uppercase tracking-widest opacity-40 text-center">Assists</label>
                                                <input type="number" name="assists" value={formData.assists} onChange={handleChange} className="w-full bg-white/5 border border-white/10 rounded-xl py-3 text-center font-bold text-white/60 focus:border-ef-accent focus:outline-none" />
                                            </div>
                                        </div>
                                    </section>

                                    {/* --- Section: Attributes --- */}
                                    <section>
                                        <div className="flex items-center gap-3 mb-4 opacity-70">
                                            <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent to-cyan-500/20"></div>
                                            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-cyan-400 whitespace-nowrap">Card Attributes</span>
                                            <div className="h-[1px] flex-1 bg-gradient-to-l from-transparent to-cyan-500/20"></div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="flex flex-col gap-1.5">
                                                <label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-1">Form/Condition</label>
                                                <input type="text" name="Form" value={formData['Form'] || ''} onChange={handleChange} placeholder="Standard" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 font-bold text-white focus:border-ef-accent focus:outline-none" />
                                            </div>
                                            <div className="flex flex-col gap-1.5">
                                                <label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-1">Weak Foot Usage</label>
                                                <input type="text" name="Weak Foot Usage" value={formData['Weak Foot Usage'] || ''} onChange={handleChange} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 font-bold text-white focus:border-ef-accent focus:outline-none" />
                                            </div>
                                            <div className="flex flex-col gap-1.5">
                                                <label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-1">Weak Foot Acc.</label>
                                                <input type="text" name="Weak Foot Accuracy" value={formData['Weak Foot Accuracy'] || ''} onChange={handleChange} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 font-bold text-white focus:border-ef-accent focus:outline-none" />
                                            </div>
                                            <div className="flex flex-col gap-1.5">
                                                <label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-1">Injury Resistance</label>
                                                <input type="text" name="Injury Resistance" value={formData['Injury Resistance'] || ''} onChange={handleChange} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 font-bold text-white focus:border-ef-accent focus:outline-none" />
                                            </div>
                                        </div>

                                        <div className="mt-8 mb-8">
                                            <label className="text-[10px] font-black uppercase tracking-[0.3em] text-ef-accent mb-4 block opacity-40 ml-1">Personalized Tags</label>
                                            <div className="flex flex-wrap gap-2 mb-4 p-4 bg-white/[0.03] border border-white/5 rounded-2xl">
                                                {formData.tags.length > 0 ? (
                                                    formData.tags.map(tag => (
                                                        <span key={tag} className="flex items-center gap-2 px-3 py-1.5 bg-ef-accent/10 border border-ef-accent/20 rounded-full text-ef-accent text-[10px] font-black uppercase tracking-widest group hover:bg-ef-accent/20 transition-all">
                                                            #{tag}
                                                            <button type="button" onClick={() => handleRemoveTag(tag)} className="text-white/20 hover:text-white transition-colors">✕</button>
                                                        </span>
                                                    ))
                                                ) : (
                                                    <span className="text-[10px] font-black uppercase tracking-widest opacity-20 py-2">No tags assigned</span>
                                                )}
                                            </div>
                                            <div className="relative flex gap-2">
                                                <input
                                                    type="text"
                                                    placeholder="Add new tag (e.g. Free Kick Specialist)"
                                                    value={tagInput}
                                                    onChange={(e) => setTagInput(e.target.value)}
                                                    onKeyDown={handleAddTag}
                                                    className="flex-1 bg-white/5 border border-white/10 rounded-xl px-5 py-3 text-white focus:border-ef-accent focus:outline-none transition-all text-[11px] font-bold"
                                                />
                                                <button type="button" onClick={handleAddTag} className="px-6 py-3 bg-ef-accent/20 hover:bg-ef-accent/30 border border-ef-accent/30 rounded-xl text-ef-accent text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 shadow-lg shadow-ef-accent/5">Add Tag</button>
                                            </div>
                                        </div>
                                    </section>
                                </div>
                            </div>
                        </form>
                    ) : (
                        <div className="flex-1 flex flex-col relative bg-[#0a0a0c] group/details overflow-hidden">
                            {/* Abstract Background Decoration */}
                            <div className="absolute top-0 right-0 w-64 h-64 bg-ef-accent/5 rounded-full blur-3xl -z-10 translate-x-1/3 -translate-y-1/3"></div>

                            {/* Tab Navigation */}
                            <div className="flex items-center gap-1 p-1 bg-white/5 rounded-xl mx-4 mt-2 mb-2 border border-white/5 backdrop-blur-md z-30">
                                {[
                                    { id: 0, label: 'Identity' },
                                    { id: 1, label: 'Analytics' },
                                    { id: 2, label: 'Skills' },
                                    { id: 3, label: 'Builds' },
                                    { id: 4, label: 'Versions' }
                                ].map((tab) => (
                                    <button
                                        key={tab.id}
                                        onClick={() => setModalPage(tab.id)}
                                        className={`flex-1 flex items-center justify-center h-[26px] rounded-lg text-[13px] font-medium tracking-tight transition-all duration-300 font-inter ${modalPage === tab.id
                                            ? 'bg-white/10 text-white'
                                            : 'text-white/40 hover:text-white hover:bg-white/5'
                                            }`}
                                    >
                                        <span>{tab.label}</span>
                                    </button>
                                ))}
                            </div>

                            <div className="flex-1 relative overflow-hidden">
                                <div className="relative md:absolute md:inset-0 p-4 md:p-4 md:overflow-y-auto no-scrollbar">

                                    {/* Page 0: Full Player Details */}
                                    <div className={`flex-1 flex flex-col transition-opacity duration-150 md:overflow-y-auto no-scrollbar ${modalPage === 0 ? 'opacity-100 relative' : 'opacity-0 pointer-events-none absolute inset-0'} `}>

                                        {/* Main Stats Grid */}
                                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                                            {[
                                                { label: 'Matches', value: player.matches || 0, color: 'text-white' },
                                                { label: 'G+A Total', value: (player.goals || 0) + (player.assists || 0), color: 'text-white' },
                                                { label: 'Goals', value: player.goals || 0, color: 'text-white' },
                                                { label: 'Assists', value: player.assists || 0, color: 'text-white' }
                                            ].map((stat, i) => (
                                                <div key={i} className="bg-[#111111] border border-white/5 rounded-[0.5rem] p-5 flex flex-col items-start justify-center shadow-xl">
                                                    <span className="text-[13px] font-medium tracking-tight text-white/40 font-inter mb-1">{stat.label}</span>
                                                    <span className={`text-3xl font-black ${stat.color} tracking-tighter font-inter`}>{stat.value}</span>
                                                </div>
                                            ))}
                                        </div>


                                        {/* Ranking Dropdown */}
                                        <div className="mb-3 relative" ref={rankingDropdownRef}>
                                            <button
                                                onClick={() => setIsRankingDropdownOpen(!isRankingDropdownOpen)}
                                                className="w-full flex items-center justify-between px-3 py-2 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all font-bold"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <span className="text-base">{rankingOptions.find(opt => opt.id === rankingContext)?.icon}</span>
                                                    <span className="text-[13px] font-medium tracking-tight text-white/80 font-inter">{rankingOptions.find(opt => opt.id === rankingContext)?.label}</span>
                                                </div>
                                                <span className="text-[8px] opacity-30">▼</span>
                                            </button>

                                            {isRankingDropdownOpen && (
                                                <div className="absolute top-full left-0 right-0 mt-1 bg-[#121214] border border-white/10 rounded-xl overflow-hidden z-50 shadow-2xl py-1 backdrop-blur-xl">
                                                    {rankingOptions.map((ctx) => (
                                                        <button
                                                            key={ctx.id}
                                                            onClick={() => { setRankingContext(ctx.id); setIsRankingDropdownOpen(false); }}
                                                            className={`w-full flex items-center gap-3 px-4 py-2 transition-colors hover:bg-white/5 ${rankingContext === ctx.id ? 'bg-ef-accent/5' : ''} `}
                                                        >
                                                            <span className="text-sm">{ctx.icon}</span>
                                                            <span className={`text-[9px] font-black uppercase tracking-widest ${rankingContext === ctx.id ? 'text-ef-accent' : 'text-white/50'} `}>{ctx.label}</span>
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                                            {/* Analysis Box */}
                                            <div className="space-y-4 bg-[#111111] rounded-[1.5rem] p-5 border border-white/5 shadow-xl">
                                                <h4 className="text-[13px] font-medium tracking-tight text-white/40 font-inter border-b border-white/10 pb-1">Efficiency</h4>
                                                <div className="space-y-1.5 pt-1">
                                                    <div className="flex justify-between items-center group">
                                                        <span className="text-[13px] font-medium tracking-tight text-white/40 font-inter">Goals / GM</span>
                                                        <span className="font-mono text-sm font-black text-ef-accent">{(player.goals / (player.matches || 1)).toFixed(2)}</span>
                                                    </div>
                                                    <div className="flex justify-between items-center group">
                                                        <span className="text-[13px] font-medium tracking-tight text-white/40 font-inter">Assists / GM</span>
                                                        <span className="font-mono text-sm font-black text-ef-blue">{(player.assists / (player.matches || 1)).toFixed(2)}</span>
                                                    </div>
                                                    <div className="flex justify-between items-center group">
                                                        <span className="text-[13px] font-medium tracking-tight text-white/40 font-inter">G+A / GM</span>
                                                        <span className="font-mono text-sm font-black text-white">{((player.goals + player.assists) / (player.matches || 1)).toFixed(2)}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Ranking Box */}
                                            <div className="space-y-4 bg-[#111111] rounded-[1.5rem] p-5 border border-white/5 shadow-xl">
                                                <h4 className="text-[13px] font-medium tracking-tight text-white/40 font-inter border-b border-white/10 pb-1 flex justify-between">
                                                    <span>RANKING OUT OF</span>
                                                    <span className="text-ef-accent font-inter">{rankInfo.total}</span>
                                                </h4>
                                                <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 pt-0.5">
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-[13px] font-medium tracking-tight text-white/40 font-inter">Matches</span>
                                                        <span className="font-mono text-[11px] font-black text-white/80">#{rankInfo.matches}</span>
                                                    </div>
                                                    <div className="flex justify-between items-center text-ef-accent">
                                                        <span className="text-[13px] font-medium tracking-tight text-ef-accent/60 font-inter">G+A</span>
                                                        <span className="font-mono text-[11px] font-black text-ef-accent">#{rankInfo.ga}</span>
                                                    </div>
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-[13px] font-medium tracking-tight text-white/40 font-inter">Goals</span>
                                                        <span className="font-mono text-[11px] font-black text-white/80">#{rankInfo.goals}</span>
                                                    </div>
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-[13px] font-medium tracking-tight text-white/40 font-inter">Assists</span>
                                                        <span className="font-mono text-[11px] font-black text-white/80">#{rankInfo.assists}</span>
                                                    </div>
                                                    <div className="flex justify-between items-center border-t border-white/5 pt-1">
                                                        <span className="text-[13px] font-medium tracking-tight text-white/40 font-inter">Goals/GM</span>
                                                        <span className="font-mono text-[11px] font-black text-ef-accent">#{rankInfo.gpg}</span>
                                                    </div>
                                                    <div className="flex justify-between items-center border-t border-white/5 pt-1">
                                                        <span className="text-[13px] font-medium tracking-tight text-white/40 font-inter">Ast/GM</span>
                                                        <span className="font-mono text-[11px] font-black text-ef-blue">#{rankInfo.apg}</span>
                                                    </div>
                                                    <div className="flex justify-between items-center col-span-2 bg-white/5 p-1 px-2 rounded">
                                                        <span className="text-[13px] font-medium tracking-tight text-white/40 font-inter">G+A / Game</span>
                                                        <span className="font-mono text-[11px] font-black text-ef-accent">#{rankInfo.gapg}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* ── Awards Section ── */}
                                        {playerAwards.length > 0 && (
                                            <div className="mt-4 bg-[#0e0e10] border border-white/5 rounded-[1.5rem] p-5 shadow-xl">
                                                <div className="flex items-center gap-3 mb-6 flex-wrap">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-lg">🏆</span>
                                                        <h4 className="text-[13px] font-black uppercase tracking-widest text-white">Awards</h4>
                                                    </div>

                                                    <div className="flex items-center gap-1 bg-white/5 p-1 rounded-xl border border-white/5">
                                                        {availableAwardPositions.map(pos => (
                                                            <button
                                                                key={pos}
                                                                onClick={() => setAwardFilter(pos)}
                                                                className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                                                                    awardFilter === pos
                                                                        ? 'bg-ef-accent text-[#0a0a0c] font-black'
                                                                        : 'text-white/30 hover:text-white hover:bg-white/5'
                                                                }`}
                                                            >
                                                                {pos}
                                                            </button>
                                                        ))}
                                                    </div>

                                                    <span className="ml-auto px-2 py-0.5 rounded bg-ef-accent/15 text-ef-accent text-[9px] font-black tracking-widest">{filteredAwards.length} ACHIEVEMENTS</span>
                                                </div>
                                                <ul className="space-y-2">
                                                    {filteredAwards.map((aw, i) => (
                                                        <li key={i} className="flex items-start gap-3 group">
                                                            <span className="text-base leading-none mt-0.5 shrink-0">{aw.badge}</span>
                                                            <div className="flex flex-1 items-start justify-between gap-2 min-w-0">
                                                                <span className="text-[12px] font-medium text-white/70 leading-snug font-inter">
                                                                    <span className={`font-black ${
                                                                        aw.rank === 1 ? 'text-yellow-400' :
                                                                        aw.rank === 2 ? 'text-slate-300' : 'text-amber-600'
                                                                    }`}>{aw.ordinal}</span>
                                                                    {' '}in <span className="text-white/90 font-semibold">{aw.statLabel}</span>
                                                                    {' '}among{' '}
                                                                    <span className="text-ef-accent font-semibold">{aw.emoji} {aw.groupValue}</span>
                                                                    {' '}{aw.groupLabel.toLowerCase()} ({aw.poolSize} players)
                                                                </span>
                                                                <span className="text-[11px] font-mono font-black text-white/40 shrink-0">{aw.value}</span>
                                                            </div>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}

                                        {/* Action Buttons */}
                                        <div className="mt-auto flex flex-row justify-center gap-1.5 pt-4">
                                            <button onClick={() => setIsEditing(true)} className="w-[100px] h-[32px] rounded-lg bg-white/5 border border-white/10 hover:border-ef-accent/50 hover:bg-white/10 hover:text-ef-accent transition-all font-medium text-[13px] tracking-tight flex items-center justify-center gap-2 font-inter">
                                                <span>⚡</span> Edit Data
                                            </button>
                                            <a
                                                href={`https://pesdb.net/efootball/?id=${player.pesdb_id || player.playerId}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="w-[100px] h-[32px] rounded-lg bg-ef-blue/10 border border-ef-blue/20 hover:border-ef-blue/50 hover:bg-ef-blue/20 text-ef-blue transition-all font-medium text-[13px] tracking-tight flex items-center justify-center gap-2 font-inter"
                                            >
                                                <span>🌐</span> PESDB
                                            </a>
                                            <a
                                                href={`https://efhub.com/players/${player.pesdb_id || player.playerId}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="w-[100px] h-[32px] rounded-lg bg-ef-accent/10 border border-ef-accent/20 hover:border-ef-accent/50 hover:bg-ef-accent/20 text-ef-accent transition-all font-medium text-[13px] tracking-tight flex items-center justify-center gap-2 font-inter"
                                            >
                                                <span>📱</span> efHUB
                                            </a>
                                        </div>
                                    </div>

                                    {/* Page 1: Analytics / Comparison Graph */}
                                    <div className={`flex-1 flex flex-col transition-opacity duration-150 md:overflow-y-auto no-scrollbar ${modalPage === 1 ? 'opacity-100 relative' : 'opacity-0 pointer-events-none absolute inset-0'} `}>
                                        <div className="flex items-center justify-between mb-4">
                                            <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
                                                <span className="text-ef-accent">📊</span> Stat Ranking
                                            </h3>

                                            <div className="flex gap-2">
                                                {/* Filter Dropdown */}
                                                <div className="relative" ref={filterDropdownRef}>
                                                    <button
                                                        onClick={() => setIsFilterDropdownOpen(!isFilterDropdownOpen)}
                                                        className="flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-all"
                                                    >
                                                        <span className="text-xs">{compContextOptions.find(o => o.id === comparisonContext)?.icon}</span>
                                                        <span className="text-[9px] font-black uppercase tracking-widest text-white hidden md:inline">{compContextOptions.find(o => o.id === comparisonContext)?.label}</span>
                                                        <span className="text-[8px] opacity-30">▼</span>
                                                    </button>
                                                    {isFilterDropdownOpen && (
                                                        <div className="absolute top-full right-0 mt-1 min-w-[140px] bg-[#121214] border border-white/10 rounded-xl overflow-hidden z-50 shadow-2xl py-1 backdrop-blur-xl">
                                                            {compContextOptions.map((opt) => (
                                                                <button
                                                                    key={opt.id}
                                                                    onClick={() => { setComparisonContext(opt.id); setIsFilterDropdownOpen(false); }}
                                                                    className={`w-full flex items-center gap-2 px-3 py-2 transition-colors hover:bg-white/5 ${comparisonContext === opt.id ? 'bg-ef-accent/5' : ''} `}
                                                                >
                                                                    <span className="text-xs">{opt.icon}</span>
                                                                    <span className={`text-[9px] font-black uppercase tracking-widest ${comparisonContext === opt.id ? 'text-ef-accent' : 'text-white/50'} `}>{opt.label}</span>
                                                                </button>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Dropdown */}
                                                <div className="relative" ref={comparisonDropdownRef}>
                                                    <button
                                                        onClick={() => setIsComparisonDropdownOpen(!isComparisonDropdownOpen)}
                                                        className="flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-all"
                                                    >
                                                        <span className="text-xs">{compOptions.find(o => o.id === comparisonStat)?.icon}</span>
                                                        <span className="text-[9px] font-black uppercase tracking-widest text-white">{compOptions.find(o => o.id === comparisonStat)?.label}</span>
                                                        <span className="text-[8px] opacity-30">▼</span>
                                                    </button>
                                                    {isComparisonDropdownOpen && (
                                                        <div className="absolute top-full right-0 mt-1 min-w-[120px] bg-[#121214] border border-white/10 rounded-xl overflow-hidden z-50 shadow-2xl py-1 backdrop-blur-xl">
                                                            {compOptions.map((opt) => (
                                                                <button
                                                                    key={opt.id}
                                                                    onClick={() => { setComparisonStat(opt.id); setIsComparisonDropdownOpen(false); }}
                                                                    className={`w-full flex items-center gap-2 px-3 py-2 transition-colors hover:bg-white/5 ${comparisonStat === opt.id ? 'bg-ef-accent/5' : ''} `}
                                                                >
                                                                    <span className="text-xs">{opt.icon}</span>
                                                                    <span className={`text-[13px] font-medium tracking-tight font-inter ${comparisonStat === opt.id ? 'text-ef-accent' : 'text-white/50'} `}>{opt.label}</span>
                                                                </button>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Graph Ranking Header */}
                                        <div className="flex items-center justify-between mb-2 px-2">
                                            <div className="flex flex-col">
                                                <span className="text-[13px] font-medium tracking-tight text-white/40 font-inter">Ranked</span>
                                                <div className="flex items-baseline gap-1.5">
                                                    <span className="text-2xl font-black text-white font-inter">#{comparisonData.rank}</span>
                                                    <span className="text-[13px] font-medium tracking-tight text-white/40 font-inter">of {comparisonData.total}</span>
                                                </div>
                                            </div>
                                            <div className="flex flex-col items-end">
                                                <span className="text-[13px] font-medium tracking-tight text-white/40 font-inter text-right">{compContextOptions.find(o => o.id === comparisonContext)?.label}</span>
                                                <div className="flex items-center gap-1.5 text-ef-accent">
                                                    <span className="text-xs">{compOptions.find(o => o.id === comparisonStat)?.icon}</span>
                                                    <span className="text-[13px] font-medium tracking-tight font-inter">{compOptions.find(o => o.id === comparisonStat)?.label}</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Graph */}
                                        {/* Vertical Bar Graph */}
                                        <div className="flex-1 flex flex-col justify-end pb-4">
                                            <div className="relative h-[220px] w-full flex items-end justify-between gap-2 md:gap-4 px-2">
                                                {/* Grid Background */}
                                                <div className="absolute inset-0 flex flex-col justify-between pointer-events-none z-0">
                                                    {[100, 75, 50, 25, 0].map((line, i) => (
                                                        <div key={i} className="w-full border-t border-white/5 flex items-center">
                                                            <span className="text-[8px] text-white/10 -mt-4 pl-1 font-mono">{Math.round((comparisonData.max * line) / 100)}</span>
                                                        </div>
                                                    ))}
                                                </div>

                                                {/* Bars */}
                                                {comparisonData.data.map((p, idx) => (
                                                    <div key={idx} className="relative z-10 flex flex-col items-center justify-end flex-1 h-full group">
                                                        {/* Custom Tooltip/Value */}
                                                        <div className={`mb-1 transition-all duration-300 transform flex flex-col items-center gap-0.5`}>
                                                            {/* Rank - Always Visible */}
                                                            <span className={`text-[10px] font-black opacity-50 mb-0.5 ${p.isCurrent ? 'text-ef-accent' : 'text-white'}`}>#{p.rank}</span>

                                                            {/* Image Popup */}
                                                            <div className="w-10 h-12 rounded-lg bg-white/10 border border-white/20 overflow-hidden shadow-xl hidden group-hover:block transition-all animate-fade-in absolute bottom-full mb-6 z-50 pointer-events-none">
                                                                {p.image ? (
                                                                    <img src={p.image} alt={p.name} className="w-full h-full object-cover" />
                                                                ) : (
                                                                    <div className="w-full h-full flex items-center justify-center bg-ef-dark text-[8px] opacity-50">?</div>
                                                                )}
                                                                <div className="absolute inset-0 ring-1 ring-white/10 rounded-lg"></div>
                                                            </div>

                                                            <span className={`text-xs font-black font-mono leading-none ${p.isCurrent ? 'text-ef-accent' : 'text-white'} `}>
                                                                {comparisonStat.includes('pg') ? p.value.toFixed(2) : p.value}
                                                            </span>
                                                        </div>

                                                        {/* The Bar */}
                                                        <div
                                                            className={`w-full max-w-[24px] md:max-w-[40px] rounded-t-sm relative transition-all duration-1000 ease-out origin-bottom ${p.isCurrent ? 'bg-ef-accent shadow-[0_0_20px_rgba(0,255,136,0.4)]' : 'bg-ef-blue/40 hover:bg-ef-blue/60'} `}
                                                            style={{ height: `${Math.max(2, (p.value / (comparisonData.max * 1.1)) * 100)}% ` }}
                                                        >
                                                            {p.isCurrent && (
                                                                <div className="absolute inset-x-0 top-0 h-full bg-gradient-to-b from-white/20 to-transparent pointer-events-none"></div>
                                                            )}
                                                        </div>

                                                        {/* Label */}
                                                        <div className="absolute top-full mt-2 w-full flex justify-center">
                                                            <div className={`text-[8px] font-black uppercase tracking-wider truncate max-w-[60px] text-center transition-colors ${p.isCurrent ? 'text-ef-accent' : 'text-white/30 group-hover:text-white/60'} `}>
                                                                {p.name.split(' ').pop()}
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>

                                            {comparisonData.data.length === 0 && (
                                                <div className="h-full flex items-center justify-center">
                                                    <div className="text-center opacity-30 text-[10px] uppercase font-black tracking-widest">No data available</div>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Page 2: Player Skills */}
                                    <div className={`flex-1 flex flex-col transition-opacity duration-150 overflow-y-auto no-scrollbar ${modalPage === 2 ? 'opacity-100 relative' : 'opacity-0 pointer-events-none absolute inset-0'} `}>
                                        <div className="flex items-center justify-between mb-4">
                                            <h3 className="text-xl font-black text-white uppercase tracking-tighter flex items-center gap-2">
                                                <span className="text-ef-accent">🪄</span> Player Skills
                                            </h3>
                                            <div className="flex items-center gap-2">
                                                {isEditingSkills && (
                                                        <button
                                                            onClick={() => {
                                                                if (isBulkEditingSkills) {
                                                                    // Process bulk skills
                                                                    const inputSkills = bulkSkillsInput.split('\n').map(s => s.trim()).filter(Boolean);
                                                                    const matchedSkills = [];
                                                                    const normalize = (s) => s.toLowerCase().replace(/[^a-z0-9]/g, '');

                                                                    const officialNormalized = ALL_SKILLS.map(s => ({ original: s, normalized: normalize(s) }));

                                                                    inputSkills.forEach(input => {
                                                                        const normInput = normalize(input);
                                                                        const match = officialNormalized.find(o => o.normalized === normInput);
                                                                        if (match) {
                                                                            if (!matchedSkills.includes(match.original) && !skills.includes(match.original)) {
                                                                                matchedSkills.push(match.original);
                                                                            }
                                                                        }
                                                                    });

                                                                    if (matchedSkills.length > 0) {
                                                                        const nextSkills = [...skills, ...matchedSkills];
                                                                        setSkills(nextSkills);
                                                                        // Also update parent
                                                                        onUpdate(player._id, {
                                                                            skills: nextSkills.map(s => s?.trim()).filter(s => s && s !== '')
                                                                        }, false);
                                                                    }
                                                                    setBulkSkillsInput('');
                                                                    setIsBulkEditingSkills(false);
                                                                } else {
                                                                    setIsBulkEditingSkills(true);
                                                                }
                                                            }}
                                                            className={`px-3 h-[26px] rounded-lg text-[13px] font-medium tracking-tight border transition-all font-inter ${isBulkEditingSkills
                                                                ? 'bg-ef-accent text-ef-dark border-ef-accent'
                                                                : 'bg-ef-accent/10 border-ef-accent/20 text-ef-accent hover:bg-ef-accent/20'
                                                                }`}
                                                        >
                                                            {isBulkEditingSkills ? '✓ Save Bulk' : '📋 Bulk Edit'}
                                                        </button>
                                                )}
                                                <button
                                                    onClick={() => {
                                                        if (isEditingSkills) {
                                                            onUpdate(player._id, {
                                                                skills: skills.map(s => s?.trim()).filter(s => s && s !== ''),
                                                                additionalSkills: additionalSkills.map(s => s?.trim()).filter(s => s && s !== '')
                                                            }, false);
                                                            setShowAddCoreSkill(false);
                                                            setCoreSkillSearch('');
                                                        }
                                                        setIsEditingSkills(e => !e);
                                                        if (isBulkEditingSkills) setIsBulkEditingSkills(false);
                                                    }}
                                                    className={`px-3 h-[26px] rounded-lg text-[13px] font-medium tracking-tight border transition-all font-inter ${isEditingSkills
                                                        ? 'bg-ef-accent/20 border-ef-accent/40 text-ef-accent'
                                                        : 'bg-white/5 border-white/10 text-white/40 hover:text-white hover:bg-white/10'
                                                        }`}
                                                >
                                                    {isEditingSkills ? '✓ Done' : '✏ Edit'}
                                                </button>

                                                <button onClick={() => { setModalPage(0); setIsBulkEditingSkills(false); setIsEditingSkills(false); }} className="text-[13px] font-medium tracking-tight text-white/40 hover:text-white transition-colors font-inter">
                                                    ✕ Back
                                                </button>
                                            </div>
                                        </div>

                                        {isBulkEditingSkills && (
                                            <div className="mb-4 animate-fade-in">
                                                <div className="flex items-center justify-between mb-1.5">
                                                    <span className="text-[13px] font-medium tracking-tight text-ef-accent font-inter">Paste Skills List (One per line)</span>
                                                    <button onClick={() => setIsBulkEditingSkills(false)} className="text-[13px] font-medium tracking-tight text-white/30 hover:text-white font-inter">Cancel</button>
                                                </div>
                                                <textarea
                                                    autoFocus
                                                    value={bulkSkillsInput}
                                                    onChange={(e) => setBulkSkillsInput(e.target.value)}
                                                    placeholder="Double Touch&#10;One-touch Pass&#10;Interception..."
                                                    className="w-full bg-white/5 border border-white/20 rounded-xl p-4 text-xs font-bold text-white focus:border-ef-accent focus:outline-none transition-all placeholder:white/10 min-h-[120px] custom-scrollbar"
                                                />
                                            </div>
                                        )}

                                        <div className="grid grid-cols-2 gap-4 flex-1 min-h-0">

                                            {/* ── Left: Core Skills ── */}
                                            <div className="flex flex-col gap-2 min-h-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="text-[13px] font-medium tracking-tight text-ef-accent font-inter">Core Skills</span>
                                                    <div className="h-px bg-white/10 flex-1"></div>
                                                    <span className="text-[13px] font-medium tracking-tight text-white/20 font-inter">{skills.length}</span>
                                                </div>
                                                <div className="space-y-1.5 overflow-y-auto pr-1 custom-scrollbar flex-1">
                                                    {skills.length > 0 ? skills.map((skill, i) => {
                                                        const isSpecial = SPECIAL_SKILLS.includes(skill);
                                                        return (
                                                            <div key={i} className={`flex items-center gap-2 px-3 py-2.5 h-[30px] border rounded-xl transition-all group ${isSpecial
                                                                ? 'bg-red-500/10 border-red-500/30 hover:bg-red-500/20 shadow-[0_0_12px_rgba(239,68,68,0.12)]'
                                                                : 'bg-white/5 border-white/10 hover:bg-white/8'
                                                                }`}>
                                                                <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${isSpecial ? 'bg-red-400 shadow-[0_0_6px_rgba(239,68,68,0.8)]' : 'bg-ef-accent'}`} />
                                                                <span className={`text-[13px] font-medium tracking-tight font-inter flex-1 ${isSpecial ? 'text-red-300' : 'text-white'}`}>
                                                                    {typeof skill === 'object' ? (skill.name || skill.label || JSON.stringify(skill)) : skill}
                                                                </span>
                                                                {isEditingSkills ? (
                                                                    <button
                                                                        onClick={() => {
                                                                            const next = skills.filter((_, si) => si !== i);
                                                                            setSkills(next);
                                                                        }}
                                                                        className="text-white/20 hover:text-red-400 text-xs leading-none flex-shrink-0 transition-colors active:scale-90"
                                                                    >✕</button>
                                                                ) : (
                                                                    isSpecial && <span className="ml-auto text-[6px] font-black bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded-full border border-red-500/20 flex-shrink-0">🔥</span>
                                                                )}
                                                            </div>
                                                        );
                                                    }) : (
                                                        <div className="text-center py-6 opacity-30 text-[13px] font-medium tracking-tight font-inter italic">No core skills found</div>
                                                    )}

                                                    {/* Add Skill row (edit mode only) */}
                                                    {isEditingSkills && (
                                                        <div className="relative">
                                                            <button
                                                                onClick={() => { setShowAddCoreSkill(s => !s); setCoreSkillSearch(''); }}
                                                                className="w-full h-[30px] flex items-center gap-2 px-3 border border-dashed border-ef-accent/30 rounded-xl bg-ef-accent/5 hover:bg-ef-accent/10 transition-all text-[13px] font-medium tracking-tight font-inter text-ef-accent/60 hover:text-ef-accent"
                                                            >
                                                                <span className="text-base leading-none">+</span> Add Skill
                                                            </button>
                                                            {showAddCoreSkill && (
                                                                <div className="absolute bottom-full mb-1 left-0 right-0 bg-[#18181c] border border-white/15 rounded-xl shadow-[0_-10px_40px_rgba(0,0,0,0.7)] z-[80] overflow-hidden">
                                                                    <div className="p-2 border-b border-white/5">
                                                                        <input
                                                                            autoFocus
                                                                            value={coreSkillSearch}
                                                                            onChange={e => setCoreSkillSearch(e.target.value)}
                                                                            placeholder="Search all skills..."
                                                                            className="w-full h-[30px] bg-white/5 border border-white/10 rounded-lg px-3 text-[13px] font-medium tracking-tight font-inter text-white placeholder-white/20 focus:outline-none focus:border-ef-accent/40"
                                                                            onClick={e => e.stopPropagation()}
                                                                        />
                                                                    </div>
                                                                    <div className="overflow-y-auto max-h-[160px] custom-scrollbar">
                                                                        {ALL_SKILLS
                                                                            .filter(s => !skills.includes(s))
                                                                            .filter(s => !coreSkillSearch || s.toLowerCase().includes(coreSkillSearch.toLowerCase()))
                                                                            .map(skill => {
                                                                                const isSp = SPECIAL_SKILLS.includes(skill);
                                                                                return (
                                                                                    <button key={skill}
                                                                                        onClick={() => {
                                                                                            setSkills(prev => [...prev, skill]);
                                                                                            setShowAddCoreSkill(false);
                                                                                            setCoreSkillSearch('');
                                                                                        }}
                                                                                        className={`w-full text-left px-3 h-[30px] text-[13px] font-medium tracking-tight font-inter flex items-center gap-2 border-b border-white/5 last:border-0 transition-all ${isSp ? 'text-red-300 hover:bg-red-500/10' : 'text-white/60 hover:text-white hover:bg-white/5'
                                                                                            }`}>
                                                                                        <span className={`w-1 h-1 rounded-full flex-shrink-0 ${isSp ? 'bg-red-400' : 'bg-ef-accent/40'}`}></span>
                                                                                        {skill}
                                                                                        {isSp && <span className="ml-auto text-[6px] bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded font-black">🔥</span>}
                                                                                    </button>
                                                                                );
                                                                            })
                                                                        }
                                                                        {ALL_SKILLS.filter(s => !skills.includes(s)).filter(s => !coreSkillSearch || s.toLowerCase().includes(coreSkillSearch.toLowerCase())).length === 0 && (
                                                                            <div className="px-3 py-4 text-center text-[13px] font-medium tracking-tight font-inter text-white/30">All skills added</div>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* ── Right: Additional Skills ── */}
                                            <div className="flex flex-col gap-2 min-h-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="text-[13px] font-medium tracking-tight text-blue-400 font-inter">Additional</span>
                                                    <div className="h-px bg-white/10 flex-1"></div>
                                                    <span className="text-[13px] font-medium tracking-tight text-white/20 font-inter">{additionalSkills.filter(Boolean).length}/5</span>
                                                </div>
                                                <div className="space-y-1.5">
                                                    {additionalSkills.map((addedSkill, idx) => (
                                                        <div key={idx} className="relative">
                                                            {/* Slot button */}
                                                            <div
                                                                onClick={() => { setActiveAdditionalSlot(activeAdditionalSlot === idx ? null : idx); setSkillSearch(''); }}
                                                                className={`flex items-center gap-2 px-3 py-2.5 h-[30px] border rounded-xl cursor-pointer transition-all group ${addedSkill
                                                                    ? 'bg-blue-500/10 border-blue-500/30 hover:bg-blue-500/15'
                                                                    : 'bg-white/3 border-white/10 border-dashed hover:border-blue-400/40 hover:bg-blue-500/5'
                                                                    }`}
                                                            >
                                                                <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${addedSkill ? 'bg-blue-400' : 'bg-white/15'}`} />
                                                                <span className={`text-[13px] font-medium tracking-tight flex-1 font-inter ${addedSkill ? 'text-white' : 'text-white/25 italic'
                                                                    }`}>{addedSkill || `Empty Slot ${idx + 1}`}</span>
                                                                {addedSkill ? (
                                                                    <button
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            const next = [...additionalSkills];
                                                                            next[idx] = '';
                                                                            setAdditionalSkills(next);
                                                                            setActiveAdditionalSlot(null);
                                                                            if (player._id) onUpdate(player._id, { additionalSkills: next.filter(Boolean) }, false);
                                                                        }}
                                                                        className="text-white/20 hover:text-white text-xs leading-none flex-shrink-0 active:scale-90 transition-all"
                                                                    >✕</button>
                                                                ) : (
                                                                    <span className="text-[13px] text-white/15 font-medium tracking-tight font-inter">+</span>
                                                                )}
                                                            </div>

                                                            {/* Dropdown for this slot */}
                                                            {activeAdditionalSlot === idx && (
                                                                <div className="absolute top-full mt-1 left-0 right-0 bg-[#18181c] border border-white/15 rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.7)] z-[70] overflow-hidden">
                                                                    <div className="p-2 border-b border-white/5">
                                                                        <input
                                                                            autoFocus
                                                                            value={skillSearch}
                                                                            onChange={e => setSkillSearch(e.target.value)}
                                                                            placeholder="Search skills..."
                                                                            className="w-full bg-white/5 border border-white/10 rounded-lg px-[10px] h-[26px] text-[13px] font-medium tracking-tight font-inter text-white placeholder-white/20 focus:outline-none focus:border-blue-400/40"
                                                                            onClick={e => e.stopPropagation()}
                                                                        />
                                                                    </div>
                                                                    <div className="overflow-y-auto max-h-[180px] custom-scrollbar">
                                                                        {PLAYER_SKILLS
                                                                            .filter(s => !skills.includes(s) && !additionalSkills.includes(s))
                                                                            .filter(s => !skillSearch || s.toLowerCase().includes(skillSearch.toLowerCase()))
                                                                            .map(skill => (
                                                                                <button
                                                                                    key={skill}
                                                                                    onClick={() => {
                                                                                        const next = [...additionalSkills];
                                                                                        next[idx] = skill;
                                                                                        setAdditionalSkills(next);
                                                                                        setActiveAdditionalSlot(null);
                                                                                        setSkillSearch('');
                                                                                        if (player._id) onUpdate(player._id, { additionalSkills: next.filter(Boolean) }, false);
                                                                                    }}
                                                                                    className="w-full text-left px-[10px] h-[26px] text-[13px] font-medium tracking-tight font-inter text-white/60 hover:text-white hover:bg-white/5 flex items-center gap-2 border-b border-white/5 last:border-0 transition-all"
                                                                                >
                                                                                    <span className="w-1 h-1 rounded-full flex-shrink-0 bg-ef-accent/40"></span>
                                                                                    {skill}
                                                                                </button>
                                                                            ))
                                                                        }
                                                                        {PLAYER_SKILLS
                                                                            .filter(s => !skills.includes(s) && !additionalSkills.includes(s))
                                                                            .filter(s => !skillSearch || s.toLowerCase().includes(skillSearch.toLowerCase()))
                                                                            .length === 0 && (
                                                                                <div className="px-3 py-4 text-center text-[13px] font-medium tracking-tight text-white/30 font-inter">No skills available</div>
                                                                            )}
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="mt-4 pt-4 border-t border-white/5">
                                            <button
                                                onClick={() => setModalPage(0)}
                                                className="w-full h-[36px] bg-white/5 border border-white/10 rounded-xl text-[13px] font-medium tracking-tight text-white hover:bg-white/10 transition-all active:scale-95 font-inter"
                                            >
                                                Back to Overview
                                            </button>
                                        </div>
                                    </div>

                                    {/* Page 3: Builds / Progressions */}
                                    <div className={`flex-1 flex flex-col transition-opacity duration-150 overflow-y-auto no-scrollbar ${modalPage === 3 ? 'opacity-100 relative' : 'opacity-0 pointer-events-none absolute inset-0'} `}>
                                        {isEditingBuildInline ? (
                                            <div className="flex-1 flex flex-col">
                                                <SavedProgressionsModal
                                                    isInline={true}
                                                    player={player}
                                                    onClose={() => {
                                                        setIsEditingBuildInline(false);
                                                        setSelectedProgressionId(null);
                                                    }}
                                                    onUpdatePlayer={onUpdate}
                                                    settings={settings}
                                                    showConfirm={showConfirm}
                                                    showAlert={showAlert}
                                                    openOnCreate={progressionOpenCreate}
                                                    initialBuildId={selectedProgressionId}
                                                />
                                            </div>
                                        ) : (
                                            <>
                                                {/* Header */}
                                                <div className="flex items-center justify-between mb-3">
                                                    <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
                                                        <span className="text-ef-accent">📊</span> Saved Builds
                                                    </h3>
                                                    {player.progressions?.length > 0 && (
                                                        <span className="px-2 py-0.5 bg-ef-accent/20 text-ef-accent rounded text-[8px] font-black">{player.progressions.length} Saved</span>
                                                    )}
                                                </div>

                                                {/* Add New Progression Box */}
                                                <button
                                                    onClick={() => {
                                                        setProgressionOpenCreate(true);
                                                        setSelectedProgressionId(null);
                                                        setIsEditingBuildInline(true);
                                                    }}
                                                    className="w-full flex items-center gap-3 px-4 py-3 mb-3 bg-ef-accent/5 border border-dashed border-ef-accent/30 rounded-2xl hover:bg-ef-accent/10 hover:border-ef-accent/60 active:scale-95 transition-all group"
                                                >
                                                    <div className="w-8 h-8 rounded-xl bg-ef-accent/10 border border-ef-accent/20 flex items-center justify-center flex-shrink-0 group-hover:bg-ef-accent/20 transition-all">
                                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-ef-accent">
                                                            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                                                        </svg>
                                                    </div>
                                                    <div className="flex flex-col items-start">
                                                        <span className="text-[13px] font-black text-ef-accent tracking-tight">Add New Progression</span>
                                                        <span className="text-[10px] text-white/30 font-medium">Save a skill build for {formData.name}</span>
                                                    </div>
                                                </button>

                                                {/* Saved progressions list */}
                                                {player.progressions?.length > 0 ? (
                                                    <div className="space-y-2">
                                                        {player.progressions.map((build, idx) => (
                                                            <div key={build.id || idx} className="relative group">
                                                                <button
                                                                    onClick={() => {
                                                                        setProgressionOpenCreate(false);
                                                                        setSelectedProgressionId(build.id);
                                                                        setIsEditingBuildInline(true);
                                                                    }}
                                                                    className="w-full flex flex-col gap-2 px-4 py-3 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/8 hover:border-white/20 active:scale-[0.98] transition-all text-left"
                                                                >
                                                                    <div className="flex items-center gap-3 pr-8">
                                                                        <div className="w-8 h-8 rounded-xl bg-ef-accent/10 flex items-center justify-center flex-shrink-0">
                                                                            <span className="text-sm">🏗️</span>
                                                                        </div>
                                                                        <div className="flex flex-col flex-1 min-w-0">
                                                                            <div className="flex items-center gap-2">
                                                                                <span className="text-[13px] font-black text-white truncate">{build.name || `Build ${idx + 1}`}</span>
                                                                                <span className="px-1.5 py-0.5 bg-ef-accent/20 text-ef-accent rounded text-[8px] font-mono font-bold">{build.rating || player.rating}</span>
                                                                            </div>
                                                                            {build.description && (
                                                                                <span className="text-[10px] text-white/30 font-medium truncate">{build.description}</span>
                                                                            )}
                                                                        </div>
                                                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-white/20 group-hover:text-white/50 transition-colors flex-shrink-0">
                                                                            <polyline points="9 18 15 12 9 6" />
                                                                        </svg>
                                                                    </div>

                                                                    <button
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            showConfirm('Delete Progression', 'Delete this build?', () => {
                                                                                const updated = player.progressions.filter(p => p.id !== (build.id || idx));
                                                                                onUpdate(player._id, { ...player, progressions: updated }, false);
                                                                            }, 'danger', 'Delete');
                                                                        }}
                                                                        className="absolute top-3 right-3 p-1.5 text-white/10 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all opacity-0 group-hover:opacity-100 z-10"
                                                                        title="Delete Build"
                                                                    >
                                                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                                            <path d="M3 6h18m-2 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                                                        </svg>
                                                                    </button>

                                                                    {/* Stats Progression Display */}
                                                                    <div className="flex flex-wrap gap-1.5 mt-1">
                                                                        {[
                                                                            { key: 'shooting', label: 'Sho' },
                                                                            { key: 'passing', label: 'Pas' },
                                                                            { key: 'dribbling', label: 'Dri' },
                                                                            { key: 'dexterity', label: 'Dex' },
                                                                            { key: 'lowerBody', label: 'LBS' },
                                                                            { key: 'aerial', label: 'Aer' },
                                                                            { key: 'defending', label: 'Def' },
                                                                            { key: 'gk1', label: 'G1' },
                                                                            { key: 'gk2', label: 'G2' },
                                                                            { key: 'gk3', label: 'G3' }
                                                                        ].map(stat => {
                                                                            const val = build[stat.key];
                                                                            if (!val || val === 0) return null;
                                                                            return (
                                                                                <div key={stat.key} className="flex items-center gap-1 bg-black/40 px-2 py-0.5 rounded-md border border-white/5">
                                                                                    <span className="text-[9px] font-bold text-white/40 uppercase">{stat.label}</span>
                                                                                    <span className="text-[11px] font-mono font-black text-ef-accent">{val}</span>
                                                                                </div>
                                                                            );
                                                                        })}
                                                                    </div>

                                                                    {/* Added Skills Display */}
                                                                    {(build.skill1 || build.skill2 || build.skill3 || build.skill4 || build.skill5) && (
                                                                        <div className="flex flex-wrap gap-1 pt-1 border-t border-white/5">
                                                                            {[1, 2, 3, 4, 5].map(i => {
                                                                                const skill = build[`skill${i}`];
                                                                                if (!skill) return null;
                                                                                return (
                                                                                    <span key={i} className="text-[9px] font-bold px-1.5 py-0.5 bg-white/5 text-white/60 rounded border border-white/5">
                                                                                        {skill}
                                                                                    </span>
                                                                                );
                                                                            })}
                                                                        </div>
                                                                    )}
                                                                </button>

                                                                {/* Optional: Delete button overlay or inside button */}
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-white/[0.02] border border-white/5 rounded-3xl">
                                                        <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center mb-3">
                                                            <span className="text-2xl opacity-20">📊</span>
                                                        </div>
                                                        <h4 className="text-[13px] font-black text-white/40 tracking-tight">No Saved Progressions</h4>
                                                        <p className="text-[10px] text-white/20 font-medium mt-1">Create your first custom build above</p>
                                                    </div>
                                                )}
                                            </>
                                        )}
                                    </div>

                                    {/* Page 4: Versions */}
                                    <div className={`flex-1 flex flex-col transition-opacity duration-150 md:overflow-y-auto no-scrollbar ${modalPage === 4 ? 'opacity-100 relative' : 'opacity-0 pointer-events-none absolute inset-0'} `}>
                                        <div className="flex items-center justify-between mb-4">
                                            <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
                                                <span className="text-ef-accent">🃏</span> Other Versions
                                            </h3>
                                            {versions.length > 0 && (
                                                <div className="flex items-center gap-2">
                                                    <span className="px-2 py-0.5 bg-ef-accent/20 text-ef-accent rounded text-[8px] font-black">{versions.length} Found</span>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            if (onAddToCompare) {
                                                                const currentId = player._id || player.id || player.pesdb_id || player.ID;
                                                                const versionIds = versions.map(v => v._id || v.id || v.ID || v.pesdb_id);
                                                                onAddToCompare([currentId, ...versionIds]);
                                                            }
                                                        }}
                                                        className="px-3 py-1 bg-ef-accent text-ef-dark rounded-lg text-[9px] font-black uppercase hover:scale-105 active:scale-95 transition-transform flex items-center gap-1 shadow-lg shadow-ef-accent/20"
                                                    >
                                                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                                            <path d="M16 3h5v5" /><path d="M8 21H3v-5" /><path d="M21 3l-7 7" /><path d="M3 21l7-7" />
                                                        </svg>
                                                        Compare All
                                                    </button>
                                                </div>
                                            )}
                                        </div>

                                        {loadingVersions ? (
                                            <div className="flex-1 flex flex-col items-center justify-center py-20 gap-3">
                                                <div className="w-8 h-8 border-2 border-ef-accent border-t-transparent rounded-full animate-spin"></div>
                                                <span className="text-[10px] font-black uppercase tracking-widest text-white/20">Searching squad...</span>
                                            </div>
                                        ) : versions.length > 0 ? (
                                            <div className="grid grid-cols-4 sm:grid-cols-5 gap-2 pb-6">
                                                {versions.map((v) => {
                                                    const isCurrent = String(v.id || v.pesdb_id || v.ID || v.pes_id || v._id) === String(player.id || player.pesdb_id || player._id);
                                                    return (
                                                        <div 
                                                            key={v.id || v.pesdb_id || v.ID || v._id} 
                                                            className={`group relative flex flex-col items-center gap-1 cursor-pointer transition-all active:scale-95`}
                                                            onClick={() => {
                                                                if (!isCurrent && onSelectPlayer) {
                                                                    onSelectPlayer(v);
                                                                    setModalPage(0);
                                                                    if (isEditing) setIsEditing(false);
                                                                }
                                                            }}
                                                        >
                                                            {/* Compare Button Overlay */}
                                                            {!isCurrent && (
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        if (onAddToCompare) {
                                                                            const currentId = player._id || player.id || player.pesdb_id || player.ID;
                                                                            const versionId = v._id || v.id || v.ID || v.pesdb_id;
                                                                            onAddToCompare([currentId, versionId]);
                                                                        }
                                                                    }}
                                                                    className="absolute top-1 left-1 z-20 w-8 h-8 bg-ef-accent text-ef-dark rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 hover:scale-110 active:scale-90 transition-all shadow-xl border border-white/20"
                                                                    title="Compare with Current"
                                                                >
                                                                    <div className="flex flex-col items-center leading-none">
                                                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                                                            <path d="M16 3h5v5" /><path d="M8 21H3v-5" /><path d="M21 3l-7 7" /><path d="M3 21l7-7" />
                                                                        </svg>
                                                                        <span className="text-[6px] font-black uppercase mt-0.5">VS</span>
                                                                    </div>
                                                                </button>
                                                            )}

                                                            <div className={`relative w-full aspect-[7/10] bg-[#1a1a1c] border ${isCurrent ? 'border-ef-accent shadow-[0_0_15px_rgba(0,255,136,0.2)]' : 'border-white/10'} rounded-none overflow-hidden hover:border-ef-accent/50 transition-colors shadow-lg`}>
                                                                <img 
                                                                    src={getPlayerImage(v) || 'https://pesdb.net/efootball/images/players/0.png'} 
                                                                    className="w-full h-full object-cover object-center"
                                                                    alt={v.name}
                                                                />
                                                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                                                                
                                                                {/* Current Indicator */}
                                                                {isCurrent && (
                                                                    <div className="absolute top-0 left-0 right-0 py-0.5 bg-ef-accent text-ef-dark text-[6px] font-black uppercase text-center tracking-tighter">
                                                                        Current Card
                                                                    </div>
                                                                )}

                                                                {/* Rating Badge */}
                                                                <div className="absolute top-1 right-1 px-1 bg-black/80 rounded-none border border-white/5">
                                                                    <span className="text-[8px] font-black text-ef-accent italic">{v.rating || v.Rating || '??'}</span>
                                                                </div>

                                                                {/* Position Badge */}
                                                                <div className="absolute bottom-1 left-1 px-1 bg-ef-accent rounded-none">
                                                                    <span className="text-[6px] font-black text-ef-dark uppercase">
                                                                        {v.position || v.Position || '??'}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                            <h4 className={`text-[8px] font-bold truncate w-full text-center leading-tight ${isCurrent ? 'text-ef-accent' : 'text-white/80'}`}>{v.name || v.Name}</h4>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        ) : (
                                            <div className="flex-1 flex flex-col items-center justify-center py-20 opacity-20 text-center">
                                                <span className="text-4xl mb-2">🔎</span>
                                                <p className="text-[10px] font-black uppercase tracking-[0.2em]">No other versions in squad</p>
                                                <p className="text-[8px] font-medium mt-1">Only players already in your team are shown here</p>
                                            </div>
                                        ) }
                                        
                                        <div className="mt-auto pt-4 border-t border-white/5">
                                            <button
                                                onClick={() => setModalPage(0)}
                                                className="w-full h-[36px] bg-white/5 border border-white/10 rounded-xl text-[13px] font-medium tracking-tight text-white hover:bg-white/10 transition-all active:scale-95 font-inter"
                                            >
                                                Back to Overview
                                            </button>
                                        </div>
                                    </div>
                                </div>

                            </div>
                        </div>
                    )}
                    </>
                </div>
            </div>
        </div>
    );
};

export default PlayerDetailsModal;
