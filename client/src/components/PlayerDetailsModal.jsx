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

const PlayerDetailsModal = ({ player, players = [], onClose, onUpdate, initialEditMode = false, settings, showAlert, showConfirm }) => {
    const [isEditing, setIsEditing] = useState(initialEditMode);
    const [showProgressions, setShowProgressions] = useState(false);
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
        'Date Added': player['Date Added'] ?? player.DateAdded ?? null
    });
    const [tagInput, setTagInput] = useState('');
    const [isLeaguePopupOpen, setIsLeaguePopupOpen] = useState(false);
    const [isRankingDropdownOpen, setIsRankingDropdownOpen] = useState(false);
    const [modalPage, setModalPage] = useState(0); // 0: Overview, 1: Comparison, 2: Skills
    const [skills, setSkills] = useState(player.skills || []);
    const [additionalSkills, setAdditionalSkills] = useState(() => {
        const arr = (player.additionalSkills || []).filter(Boolean);
        return [...arr, ...Array(5 - arr.length).fill('')];
    });
    const [activeAdditionalSlot, setActiveAdditionalSlot] = useState(null);
    const [isSkillsLoading, setIsSkillsLoading] = useState(false);
    const [skillsError, setSkillsError] = useState(null);
    const [skillSearch, setSkillSearch] = useState('');
    const [isEditingSkills, setIsEditingSkills] = useState(false);
    const [showAddCoreSkill, setShowAddCoreSkill] = useState(false);
    const [coreSkillSearch, setCoreSkillSearch] = useState('');
    const [leagueLogos, setLeagueLogos] = useState({});
    const [_isLoadingLogos, setIsLoadingLogos] = useState(false);
    const leaguePopupRef = useRef(null);
    const rankingDropdownRef = useRef(null);
    const comparisonDropdownRef = useRef(null);
    const [comparisonStat, setComparisonStat] = useState('goals');
    const [isComparisonDropdownOpen, setIsComparisonDropdownOpen] = useState(false);
    const [isBulkEditingSkills, setIsBulkEditingSkills] = useState(false);
    const [bulkSkillsInput, setBulkSkillsInput] = useState('');

    const [comparisonContext, setComparisonContext] = useState('all');
    const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false);
    const filterDropdownRef = useRef(null);

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

    // Close popup on click outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (leaguePopupRef.current && !leaguePopupRef.current.contains(event.target)) {
                setIsLeaguePopupOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Click outside ranking dropdown
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (rankingDropdownRef.current && !rankingDropdownRef.current.contains(event.target)) {
                setIsRankingDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Click outside comparison dropdown
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (comparisonDropdownRef.current && !comparisonDropdownRef.current.contains(event.target)) {
                setIsComparisonDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Click outside filter dropdown
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (filterDropdownRef.current && !filterDropdownRef.current.contains(event.target)) {
                setIsFilterDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const fetchSkills = async (forceRescrape = false) => {
        const pesdbId = player.pesdb_id || player.playerId;
        if (!pesdbId) {
            setSkillsError("No PESDB ID found for this player.");
            return;
        }

        setIsSkillsLoading(true);
        setSkillsError(null);
        try {
            const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5001';
            let data;

            if (forceRescrape && player._id) {
                // Use the POST endpoint to scrape fresh and save
                const token = localStorage.getItem('authToken');
                const response = await fetch(`${baseUrl}/api/players/${player._id}/skills`, {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (!response.ok) throw new Error("Failed to re-scrape skills");
                data = await response.json();
            } else {
                // Use GET endpoint (cached)
                const response = await fetch(`${baseUrl}/api/skills/${pesdbId}`);
                if (!response.ok) throw new Error("Failed to fetch skills");
                data = await response.json();
            }

            if (data.skills && data.skills.length > 0) {
                const cleanSkills = data.skills.map(s => s?.trim()).filter(s => s && s !== '');
                setSkills(cleanSkills);
                if (player._id && !forceRescrape) {
                    onUpdate(player._id, { skills: cleanSkills }, false);
                }
            } else {
                setSkillsError("No skills found. The scraper might need adjustment.");
            }
        } catch (err) {
            console.error("Error fetching skills:", err);
            setSkillsError("Error loading skills. Please try again.");
        } finally {
            setIsSkillsLoading(false);
        }
    };

    useEffect(() => {
        if (modalPage === 2 && skills.length === 0 && !isSkillsLoading && !skillsError) {
            fetchSkills();
        }
    }, [modalPage]);

    useEffect(() => {
        setFormData({
            ...player,
            playstyle: player.playstyle || 'None',
            tags: player.tags || [],
            age: player.age || '',
            height: player.height || '',
            strongFoot: player.strongFoot || 'Right',
            secondaryPosition: player.secondaryPosition || ''
        });
        setSkills(player.skills || []);
        const paddedAddSkills = (player.additionalSkills || []).filter(Boolean);
        setAdditionalSkills([...paddedAddSkills, ...Array(5 - paddedAddSkills.length).fill('')]);
        setSkillsError(null);
    }, [player]);

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
            [name]: ['rating', 'goals', 'assists', 'matches', 'age', 'height'].includes(name) ? Number(newValue) : newValue
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

        // Ensure current player is included even if filtered out (unless strictly adhering to filter logic, but here likely want to compare within group)
        // If current player doesn't match filter, they won't be in sorted.
        // We should just use sorted list. If player is not in it, they are not ranked in that context.
        // EXCEPT we want to show player's comparison. 
        // If sorting context excludes player, we should probably warn or handle it.
        // But for "Same Position", player will always be in list. Same for others.
        // If data is missing (e.g. no league), might be issue.

        // Check if player is in top 5
        const playerIndex = sorted.findIndex(p => (p._id && p._id === player._id) || (p.id && p.id === player.id) || p.name === player.name);

        let displayPlayers = sorted.slice(0, 5);
        if (playerIndex > 4) {
            displayPlayers = [...sorted.slice(0, 4), player];
        } else if (playerIndex === -1 && sorted.length > 0) {
            // If player not found in filtered list (shouldn't happen if filters match player props), add them for comparison anyway?
            // Actually if context is "Same Position" and player is that position, they must be in list.
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
                image: p.image,
                rank: sorted.findIndex(s => (s._id && s._id === p._id) || (s.id && s.id === p.id) || s.name === p.name) + 1,
                isCurrent: (p._id && p._id === player._id) || (p.id && p.id === player.id) || p.name === player.name
            }))
        };
    }, [players, player, comparisonStat, comparisonContext]);

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
        <div className={`fixed inset-0 bg-[#0a0a0c] z-[150] overflow-hidden flex flex-col ${settings?.highPerf ? '' : 'animate-fade-in'} `}>
            {showProgressions && (
                <SavedProgressionsModal
                    player={player}
                    onClose={() => setShowProgressions(false)}
                    onUpdatePlayer={onUpdate}
                    settings={settings}
                    showConfirm={showConfirm}
                    showAlert={showAlert}
                />
            )}

            <div className={`relative w-full h-full bg-[#0a0a0c] flex flex-col md:flex-row ${settings?.highPerf ? '' : 'animate-slide-up'} ${isEditing ? 'h-auto overflow-y-auto' : ''}`}>

                {/* Close/Back Button */}
                <button
                    onClick={onClose}
                    className="absolute top-6 left-6 z-50 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white transition-all active:scale-95 border border-white/10 backdrop-blur-md group"
                >
                    <span className="text-xl group-hover:-translate-x-1 transition-transform">←</span>
                    <span className="text-[10px] font-black uppercase tracking-widest hidden sm:inline">Back to Squad</span>
                </button>

                {/* Left Side: Card Visual & Quick Info */}
                <div className={`w-full md:w-1/3 p-6 md:p-8 pt-24 md:pt-28 flex flex-col md:flex-col gap-4 md:gap-6 ${getCardStyles(formData.cardType).bg} no-scrollbar md:border-r border-white/5 relative overflow-hidden h-fit md:h-full shrink-0`}>

                    <div className="flex flex-row md:flex-col items-center md:items-center gap-4 w-full h-full">
                        {/* Dynamic Background Glow based on Image */}
                        {formData.image && (
                            <div className="absolute inset-0 z-0 opacity-20 pointer-events-none">
                                <img src={formData.image} className={`w-full h-full object-cover object-top scale-150 ${settings?.highPerf ? '' : 'blur-[60px]'} `} alt="" />
                                <div className={`absolute inset-0 bg-black/40 ${settings?.highPerf ? '' : getCardStyles(formData.cardType).glow} `}></div>
                            </div>
                        )}

                        <div className={`relative z-10 w-28 h-40 sm:w-40 sm:h-60 md:w-48 md:h-72 rounded-xl overflow-hidden border-[3px] md:border-[5px] border-white/20 bg-black/40 shrink-0 group/card ${settings?.highPerf ? '' : `transition-all duration-500 ${getCardStyles(formData.cardType).glow}`} `}>
                            {/* Internal Effects: Light Leak & Shine */}
                            {!settings?.highPerf && (
                                <div className="absolute inset-0 z-10 pointer-events-none overflow-hidden">
                                    {/* Static Light Leak */}
                                    <div className={`absolute -top-10 -left-10 w-40 h-40 bg-gradient-to-br ${getCardStyles(formData.cardType).leak} blur - 3xl opacity - 60`}></div>
                                    <div className={`absolute -bottom-10 -right-10 w-40 h-40 bg-gradient-to-tl ${getCardStyles(formData.cardType).leak} blur - 3xl opacity - 40`}></div>

                                    {/* Radial Glow/Flare */}
                                    <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full ${getCardStyles(formData.cardType).flare} blur - [80px] opacity - 30`}></div>

                                    {/* Animated Shine Sweep */}
                                    <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent -translate-x-full animate-shine pointer-events-none"></div>
                                </div>
                            )}

                            {formData.image ? (
                                <img src={formData.image} alt={formData.name} className="w-full h-full object-cover object-top relative z-0" />
                            ) : (
                                <div className="w-full h-full flex flex-col items-center justify-center bg-white/5 border-2 border-dashed border-white/10 relative z-0">
                                    <span className="text-4xl mb-4">📸</span>
                                    <span className="text-xs font-black uppercase tracking-widest opacity-40">No Photo Found</span>
                                </div>
                            )}

                            {/* Top Left: HUD Container (Rating, Position & Badges Combined) */}
                            <div className="absolute top-0 left-0 z-20 flex flex-col items-center bg-black w-[48px] pt-[10px] pb-[4px] rounded-br-[15px] border-r border-b border-white/10 backdrop-blur-md shadow-lg gap-2 md:gap-3">
                                {/* Rating and Position */}
                                <div className="flex flex-col items-center justify-center">
                                    <span className="text-base md:text-2xl font-black text-ef-accent leading-none tracking-tighter mb-0.5">
                                        {formData.rating}
                                    </span>
                                    <span className="text-[10px] md:text-xs font-black text-ef-accent italic uppercase tracking-tighter leading-none">
                                        {formData.position}
                                    </span>
                                </div>

                                {/* Badges */}
                                <div className="flex flex-col items-center gap-1 md:gap-2">
                                    {(formData.logos?.club || player.club_badge_url) && (
                                        <div className="w-5 h-5 md:w-8 md:h-8">
                                            <img src={formData.logos?.club || player.club_badge_url} alt="" className="w-full h-full object-contain filter drop-shadow-md" />
                                        </div>
                                    )}
                                    {(player.logos?.country || player.nationality_flag_url) && (
                                        <div className="w-5 h-5 md:w-8 md:h-8 overflow-hidden">
                                            <img src={player.logos?.country || player.nationality_flag_url} alt="" className="w-full h-full object-contain filter drop-shadow-md" />
                                        </div>
                                    )}
                                </div>
                            </div>

                            {isEditing && (
                                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 opacity-0 hover:opacity-100 transition cursor-pointer">
                                    <span className="text-white font-bold bg-black/50 px-4 py-2 rounded-full border border-white/30">Upload / Paste Photo</span>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleImageChange}
                                        className="absolute inset-0 opacity-0 cursor-pointer"
                                    />
                                </div>
                            )}
                        </div>

                        {/* Image URL Input (Edit Mode Only) */}
                        {isEditing && (
                            <div className="w-full px-2 flex gap-4">
                                <div className="flex-1">
                                    <label className="block text-[8px] font-black uppercase tracking-widest opacity-30 mb-1.5 ml-1">Image Link</label>
                                    <input
                                        type="text"
                                        placeholder="https://..."
                                        value={formData.image && !formData.image.startsWith('data:') ? formData.image : ''}
                                        onChange={(e) => setFormData(prev => ({ ...prev, image: e.target.value }))}
                                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-[10px] text-white focus:outline-none focus:border-ef-accent/40 transition-all font-medium"
                                    />
                                </div>
                                <div className="w-24">
                                    <label className="block text-[8px] font-black uppercase tracking-widest opacity-30 mb-1.5">Direct Paste</label>
                                    <div
                                        onPaste={handlePaste}
                                        tabIndex="0"
                                        className="w-full h-[34px] bg-white/5 border border-white/10 border-dashed rounded-lg flex items-center justify-center text-center cursor-pointer hover:bg-white/10 hover:border-ef-accent/30 transition-all outline-none focus:border-ef-accent/50 focus:bg-ef-accent/5 group"
                                    >
                                        <span className="text-[12px] group-focus:scale-110 transition-transform">📋</span>
                                        <span className="ml-2 text-[6px] font-black uppercase tracking-widest text-white/20 group-focus:text-ef-accent">Paste</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Stats under photo */}
                        {/* Player Details List (Moved from Right Side) */}
                        <div className="flex-1 md:w-full space-y-4 px-0 md:px-2 text-white/80 z-10 overflow-y-auto custom-scrollbar no-scrollbar">
                            {/* Main Identity Area (Name, Position, etc) */}
                            <div className="flex flex-col gap-1 items-start md:items-start text-left">
                                <h1 className="text-xl md:text-2xl font-black text-white uppercase tracking-tighter leading-tight">
                                    {formData.name}
                                </h1>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-ef-accent text-ef-dark uppercase tracking-widest leading-none">
                                        {formData.position}
                                    </span>
                                    {formData.secondaryPosition && (
                                        <span className="text-[9px] font-black text-ef-accent opacity-40 uppercase tracking-widest">
                                            {formData.secondaryPosition}
                                        </span>
                                    )}
                                </div>
                                {formData.playstyle && formData.playstyle !== 'None' && (
                                     <div className="mt-2 text-[8px] font-black uppercase tracking-[0.2em] text-ef-accent px-2 py-1 bg-ef-accent/5 rounded-lg border border-ef-accent/10 whitespace-nowrap overflow-hidden text-ellipsis max-w-full">
                                        {formData.playstyle}
                                     </div>
                                )}
                                {formData.tags && formData.tags.length > 0 && (
                                    <div className="flex flex-wrap gap-1.5 mt-3">
                                        {formData.tags.map(tag => (
                                            <span key={tag} className="px-2 py-1 bg-ef-accent/5 border border-ef-accent/20 rounded-full text-ef-accent text-[7px] font-black uppercase tracking-widest hover:bg-ef-accent/10 transition-colors">
                                                #{tag}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Compact vertical list */}
                            <div className="flex flex-col gap-1 md:gap-1.5 pt-2 border-t border-white/10">
                                <div className="flex items-center justify-between text-[10px] py-1 border-b border-white/5">
                                    <span className="opacity-40 uppercase font-black tracking-widest">Club</span>
                                    <div className="flex items-center gap-1.5 max-w-[120px]">
                                        {formData.logos?.club && <img src={formData.logos.club} className="w-3.5 h-3.5 object-contain" alt="" />}
                                        <span className="font-bold truncate">{formData.club}</span>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between text-[10px] py-1 border-b border-white/5">
                                    <span className="opacity-40 uppercase font-black tracking-widest">Country</span>
                                    <div className="flex items-center gap-1.5 max-w-[120px]">
                                        {player.logos?.country && <img src={player.logos.country} alt="" className="w-4 h-3 object-cover rounded-sm shadow-sm" />}
                                        <span className="font-bold truncate">{player.nationality}</span>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between text-[10px] py-1 border-b border-white/5">
                                    <span className="opacity-40 uppercase font-black tracking-widest">League</span>
                                    <div className="flex items-center gap-1.5 max-w-[120px]">
                                        {formData.logos?.league && <img src={formData.logos.league} className="w-3.5 h-3.5 object-contain" alt="" />}
                                        <span className="font-bold truncate">{formData.league || 'N/A'}</span>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between text-[10px] py-1 border-b border-white/5">
                                    <span className="opacity-40 uppercase font-black tracking-widest">Type</span>
                                    <span className={`${formData.cardType === 'Legendary' ? 'text-yellow-400' :
                                        formData.cardType === 'Epic' ? 'text-green-400' :
                                            formData.cardType === 'Featured' ? 'text-purple-400' :
                                                formData.cardType === 'POTW' ? 'text-cyan-400' :
                                                    'text-blue-400'
                                        } font-bold`}>{formData.cardType}</span>
                                </div>
                                <div className="flex items-center justify-between text-[10px] py-1 border-b border-white/5">
                                    <span className="opacity-40 uppercase font-black tracking-widest">Player ID</span>
                                    <span className="font-mono opacity-60">{formData.playerId || formData.pesdb_id || '-'}</span>
                                </div>
                                
                                <div className="flex items-center justify-between text-[10px] py-1 border-b border-white/5">
                                    <span className="opacity-40 uppercase font-black tracking-widest">Form</span>
                                    <span className="font-bold text-ef-accent">{formData['Form'] || 'Standard'}</span>
                                </div>

                                <div className="flex items-center justify-between text-[10px] py-1 border-b border-white/5">
                                    <span className="opacity-40 uppercase font-black tracking-widest">Weak Foot Usage</span>
                                    <span className="font-bold uppercase">{formData['Weak Foot Usage'] || '-'}</span>
                                </div>
                                
                                <div className="flex items-center justify-between text-[10px] py-1 border-b border-white/5">
                                    <span className="opacity-40 uppercase font-black tracking-widest">Weak Foot Accuracy</span>
                                    <span className="font-bold uppercase">{formData['Weak Foot Accuracy'] || '-'}</span>
                                </div>

                                <div className="flex items-center justify-between text-[10px] py-1 border-b border-white/5">
                                    <span className="opacity-40 uppercase font-black tracking-widest">Injury Resistance</span>
                                    <span className="font-bold uppercase">{formData['Injury Resistance'] || '-'}</span>
                                </div>

                                <div className="flex items-center justify-between text-[10px] py-1 border-b border-white/5">
                                    <span className="opacity-40 uppercase font-black tracking-widest">Uploaded</span>
                                    <span className="font-bold opacity-60 text-[9px]">
                                        {formData.createdAt ? new Date(formData.createdAt).toLocaleDateString() : 'N/A'}
                                    </span>
                                </div>

                                <div className="flex items-center justify-between text-[10px] py-1 border-b border-white/5">
                                    <span className="opacity-40 uppercase font-black tracking-widest">Date Added</span>
                                    <span className="font-bold opacity-60 text-[9px]">
                                        {(() => {
                                            const d = parseEfDate(formData['Date Added']);
                                            return d ? d.toLocaleDateString() : 'Unknown';
                                        })()}
                                    </span>
                                </div>

                                <div className="flex items-center justify-between text-[10px] py-1 border-b border-white/5">
                                    <span className="opacity-40 uppercase font-black tracking-widest">Featured Players</span>
                                    <span className={`font-bold text-right text-[9px] uppercase ${formData['Featured Players'] && formData['Featured Players'] !== 'Standard' ? 'text-ef-blue' : 'opacity-20'} `}>
                                        {formData['Featured Players'] || 'Standard'}
                                    </span>
                                </div>
                                <div className="grid grid-cols-4 gap-2 mt-4">
                                    <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-3 flex flex-col items-center justify-center transition-all hover:bg-white/10 hover:border-white/20 group">
                                        <span className="text-sm font-black text-white leading-none mb-1.5 group-hover:scale-110 transition-transform">
                                            {formData.age || '-'}
                                        </span>
                                        <span className="text-[8px] font-black uppercase tracking-[0.2em] text-white/20 group-hover:text-ef-accent transition-colors">Age</span>
                                    </div>
                                    <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-3 flex flex-col items-center justify-center transition-all hover:bg-white/10 hover:border-white/20 group">
                                        <span className="text-sm font-black text-white leading-none mb-1.5 group-hover:scale-110 transition-transform">
                                            {formData.strongFoot ? (formData.strongFoot.charAt(0)) : '-'}
                                        </span>
                                        <span className="text-[8px] font-black uppercase tracking-[0.2em] text-white/20 group-hover:text-ef-accent transition-colors">Foot</span>
                                    </div>
                                    <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-3 flex flex-col items-center justify-center transition-all hover:bg-white/10 hover:border-white/20 group">
                                        <span className="text-sm font-black text-white leading-none mb-1.5 group-hover:scale-110 transition-transform">
                                            {formData.height || '-'}
                                        </span>
                                        <span className="text-[8px] font-black uppercase tracking-[0.2em] text-white/20 group-hover:text-ef-accent transition-colors">Height</span>
                                    </div>
                                    <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-3 flex flex-col items-center justify-center transition-all hover:bg-white/10 hover:border-white/20 group">
                                        <span className="text-sm font-black text-white leading-none mb-1.5 group-hover:scale-110 transition-transform">
                                            {formData.weight || '-'}
                                        </span>
                                        <span className="text-[8px] font-black uppercase tracking-[0.2em] text-white/20 group-hover:text-ef-accent transition-colors">Weight</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Side: Details / Edit Form */}
                <div className="w-full md:w-2/3 p-8 md:p-12 pt-24 md:pt-28 bg-black flex flex-col justify-start relative overflow-hidden group/modal overflow-y-auto custom-scrollbar">
                    {isEditing ? (
                        <form onSubmit={handleSubmit} onPaste={handlePaste} className="space-y-4 h-full flex flex-col">
                            <h3 className="text-2xl font-black mb-4 flex items-center gap-2">
                                <span className="text-ef-accent">✍️</span> Edit Details
                            </h3>

                            <div className="flex-1 overflow-y-auto pr-2 space-y-4 custom-scrollbar">
                                {/* Form content - keeping structure but refining styles */}
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black uppercase tracking-widest opacity-40">Player Name</label>
                                    <input
                                        type="text" name="name"
                                        value={formData.name} onChange={handleChange}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:border-ef-accent focus:outline-none focus:bg-white/10 transition font-bold text-lg"
                                    />
                                </div>

                                <div className="space-y-1">
                                    <label className="text-[10px] font-black uppercase tracking-widest opacity-40">Player ID</label>
                                    <div className="relative flex gap-2">
                                        <input
                                            type="text" name="pesdb_id"
                                            value={formData.pesdb_id || formData.playerId || ''} onChange={handleChange}
                                            className="flex-1 bg-white/5 border border-white/10 rounded-xl p-3 text-white/70 focus:border-ef-accent focus:outline-none transition font-mono text-xs"
                                        />
                                        <button
                                            type="button"
                                            onClick={async () => {
                                                const text = await navigator.clipboard.readText();
                                                if (text) setFormData(prev => ({ ...prev, playerId: text, pesdb_id: text }));
                                            }}
                                            className="px-4 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95"
                                        >
                                            Paste
                                        </button>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1 relative">
                                        <label className="text-[10px] font-black uppercase tracking-widest opacity-40">Club</label>
                                        <div className="relative">
                                            <input
                                                type="text" name="club"
                                                value={formData.club || ''} onChange={handleChange}
                                                onBlur={() => setTimeout(() => setShowClubResults(false), 200)}
                                                onFocus={() => formData.club && formData.club.length >= 2 && setShowClubResults(true)}
                                                className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:border-ef-accent focus:outline-none transition font-bold text-sm"
                                            />
                                            {isSearchingClub && (
                                                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                                    <div className="w-3 h-3 border-2 border-ef-accent border-t-transparent rounded-full animate-spin"></div>
                                                </div>
                                            )}
                                        </div>
                                        {showClubResults && (
                                            <div className="absolute z-50 w-full mt-2 bg-[#1a1a1e] border border-white/10 rounded-xl shadow-2xl overflow-hidden max-h-[200px] overflow-y-auto">
                                                {clubResults.length > 0 ? (
                                                    clubResults.map(club => (
                                                        <div
                                                            key={club.idTeam}
                                                            onClick={() => handleSelectClub(club)}
                                                            className="px-4 py-3 hover:bg-white/5 cursor-pointer flex items-center gap-3 transition-colors border-b border-white/5 last:border-0"
                                                        >
                                                            <img src={club.strBadge} alt="" className="w-6 h-6 object-contain" />
                                                            <div className="flex-1 min-w-0">
                                                                <div className="text-xs font-black text-white truncate">{club.strTeam}</div>
                                                                <div className="text-[8px] uppercase font-bold opacity-30 truncate">{club.strLeague}</div>
                                                            </div>
                                                        </div>
                                                    ))
                                                ) : (
                                                    !isSearchingClub && formData.club.length >= 2 && (
                                                        <div className="px-4 py-6 text-center text-white/40 text-[10px] font-bold uppercase tracking-widest">
                                                            No clubs found
                                                        </div>
                                                    )
                                                )}
                                            </div>
                                        )}
                                    </div>
                                    <div className="space-y-1 relative" ref={leaguePopupRef}>
                                        <div className="flex justify-between items-center">
                                            <label className="text-[10px] font-black uppercase tracking-widest opacity-40">League</label>
                                            <button
                                                type="button"
                                                onClick={() => setIsCustomLeague(!isCustomLeague)}
                                                className="text-[10px] font-black uppercase tracking-widest text-ef-accent hover:opacity-80 transition-opacity"
                                            >
                                                {isCustomLeague ? '←' : '+'}
                                            </button>
                                        </div>
                                        {isCustomLeague ? (
                                            <input
                                                type="text" name="league"
                                                placeholder="League"
                                                value={formData.league || ''} onChange={handleChange}
                                                onBlur={handleLeagueBlur}
                                                className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:border-ef-accent focus:outline-none transition font-bold text-sm"
                                            />
                                        ) : (
                                            <div className="relative">
                                                <button
                                                    type="button"
                                                    onClick={() => setIsLeaguePopupOpen(!isLeaguePopupOpen)}
                                                    className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white flex items-center justify-between hover:bg-white/10 transition-all font-bold text-sm"
                                                >
                                                    <div className="flex items-center gap-2 overflow-hidden">
                                                        {formData.league && leagueLogos[formData.league] ? (
                                                            <img src={leagueLogos[formData.league]} alt="" className="w-5 h-5 object-contain flex-shrink-0" />
                                                        ) : (
                                                            <div className="w-5 h-5 rounded bg-white/5 flex items-center justify-center text-[8px] font-black opacity-40 flex-shrink-0">?</div>
                                                        )}
                                                        <span className={`truncate text-xs ${formData.league ? 'text-white' : 'text-white/30'} `}>
                                                            {formData.league || 'Select'}
                                                        </span>
                                                    </div>
                                                    <span className="text-[8px] opacity-50">▼</span>
                                                </button>
                                                {isLeaguePopupOpen && (
                                                    <div className="absolute top-full left-0 w-full mt-2 bg-[#1a1a1e] border border-white/10 rounded-xl shadow-2xl overflow-hidden z-[100] max-h-[200px] overflow-y-auto">
                                                        {TOP_LEAGUES.map(league => (
                                                            <button
                                                                key={league}
                                                                type="button"
                                                                onClick={() => {
                                                                    setFormData(prev => ({
                                                                        ...prev,
                                                                        league: league,
                                                                        logos: { ...prev.logos, league: leagueLogos[league] || '' }
                                                                    }));
                                                                    setIsLeaguePopupOpen(false);
                                                                }}
                                                                className={`flex items-center gap-3 px-3 py-2 w-full text-left hover:bg-white/5 border-b border-white/5 last:border-0 ${formData.league === league ? 'text-ef-accent' : 'text-white/70'} `}
                                                            >
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

                                <div className="grid grid-cols-3 gap-4">
                                    <div className="space-y-1 relative">
                                        <label className="text-[10px] font-black uppercase tracking-widest opacity-40">Country</label>
                                        <div className="relative">
                                            <input
                                                type="text" name="nationality"
                                                value={formData.nationality || ''} onChange={handleChange}
                                                onBlur={() => setTimeout(() => setShowCountryResults(false), 200)}
                                                onFocus={() => formData.nationality && formData.nationality.length >= 2 && setShowCountryResults(true)}
                                                className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:border-ef-accent focus:outline-none font-bold text-sm"
                                            />
                                            {isSearchingCountry && (
                                                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                                    <div className="w-3 h-3 border-2 border-ef-accent border-t-transparent rounded-full animate-spin"></div>
                                                </div>
                                            )}
                                        </div>
                                        {showCountryResults && (
                                            <div className="absolute z-50 w-full mt-2 bg-[#1a1a1e] border border-white/10 rounded-xl shadow-2xl overflow-hidden max-h-[200px] overflow-y-auto">
                                                {countryResults.length > 0 ? (
                                                    countryResults.map(c => (
                                                        <div
                                                            key={c.name}
                                                            onClick={() => handleSelectCountry(c)}
                                                            className="px-4 py-3 hover:bg-white/5 cursor-pointer flex items-center gap-3 transition-colors border-b border-white/5 last:border-0"
                                                        >
                                                            <img src={getFlagUrl(c.name)} alt="" className="w-6 h-4 object-cover rounded-sm border border-white/10" />
                                                            <span className="text-xs font-bold text-white">{c.name}</span>
                                                        </div>
                                                    ))
                                                ) : (
                                                    !isSearchingCountry && formData.nationality && formData.nationality.length >= 2 && (
                                                        <div className="px-4 py-6 text-center text-white/40 text-[10px] font-bold uppercase tracking-widest">
                                                            No countries found
                                                        </div>
                                                    )
                                                )}
                                            </div>
                                        )}
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black uppercase tracking-widest opacity-40">Age</label>
                                        <input type="number" name="age" value={formData.age || ''} onChange={handleChange} className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:border-ef-accent focus:outline-none font-bold text-sm" />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black uppercase tracking-widest opacity-40">Height (cm)</label>
                                        <input type="number" name="height" value={formData.height || ''} onChange={handleChange} className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:border-ef-accent focus:outline-none font-bold text-sm" />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black uppercase tracking-widest opacity-40">Strong Foot</label>
                                        <select name="strongFoot" value={formData.strongFoot} onChange={handleChange} className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:border-ef-accent focus:outline-none font-bold text-sm appearance-none">
                                            <option value="Right">Right</option>
                                            <option value="Left">Left</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black uppercase tracking-widest opacity-40">Position</label>
                                        <select name="position" value={formData.position} onChange={handleChange} className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:border-ef-accent focus:outline-none font-bold text-sm appearance-none">
                                            {['CF', 'SS', 'LWF', 'RWF', 'LMF', 'RMF', 'AMF', 'CMF', 'DMF', 'LB', 'RB', 'CB', 'GK'].map(pos => (
                                                <option key={pos} value={pos} className="bg-ef-dark">{pos}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black uppercase tracking-widest opacity-40">Secondary</label>
                                        <input
                                            type="text"
                                            name="secondaryPosition"
                                            placeholder="Built-in"
                                            value={formData.secondaryPosition || ''}
                                            onChange={handleChange}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:border-ef-accent focus:outline-none font-bold text-sm"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black uppercase tracking-widest opacity-40">Additional (Trained)</label>
                                        <input
                                            type="text"
                                            name="additionalPositions"
                                            placeholder="From Training"
                                            value={formData.additionalPositions || ''}
                                            onChange={handleChange}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-ef-blue focus:border-ef-blue focus:outline-none font-bold text-sm"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black uppercase tracking-widest opacity-40">Playstyle</label>
                                        <select name="playstyle" value={formData.playstyle || ''} onChange={handleChange} className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:border-ef-accent focus:outline-none font-bold text-xs appearance-none">
                                            {PLAYSTYLES.map(style => <option key={style} value={style} className="bg-ef-dark">{style}</option>)}
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-4 gap-2">
                                    <div className="space-y-1">
                                        <label className="text-[8px] font-black uppercase tracking-widest opacity-40 text-center block">Rat</label>
                                        <input type="number" name="rating" value={formData.rating || ''} onChange={handleChange} className="w-full bg-white/5 border border-white/10 rounded-xl p-2 text-ef-accent focus:border-ef-accent focus:outline-none text-center font-black text-lg" />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[8px] font-black uppercase tracking-widest opacity-40 text-center block">Mat</label>
                                        <input type="number" name="matches" value={formData.matches || 0} onChange={handleChange} className="w-full bg-white/5 border border-white/10 rounded-xl p-2 text-white focus:border-ef-accent focus:outline-none text-center font-bold text-sm" />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[8px] font-black uppercase tracking-widest opacity-40 text-center block">Gls</label>
                                        <input type="number" name="goals" value={formData.goals} onChange={handleChange} className="w-full bg-white/5 border border-white/10 rounded-xl p-2 text-white focus:border-ef-accent focus:outline-none text-center font-bold text-sm" />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[8px] font-black uppercase tracking-widest opacity-40 text-center block">Ast</label>
                                        <input type="number" name="assists" value={formData.assists} onChange={handleChange} className="w-full bg-white/5 border border-white/10 rounded-xl p-2 text-white focus:border-ef-accent focus:outline-none text-center font-bold text-sm" />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black uppercase tracking-widest opacity-40">Condition</label>
                                        <input type="text" name="Form" value={formData['Form'] || ''} onChange={handleChange} placeholder="Standard" className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:border-ef-accent focus:outline-none font-bold text-sm" />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black uppercase tracking-widest opacity-40">WF Usage</label>
                                        <input type="text" name="Weak Foot Usage" value={formData['Weak Foot Usage'] || ''} onChange={handleChange} className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:border-ef-accent focus:outline-none font-bold text-sm" />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black uppercase tracking-widest opacity-40">WF Acc.</label>
                                        <input type="text" name="Weak Foot Accuracy" value={formData['Weak Foot Accuracy'] || ''} onChange={handleChange} className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:border-ef-accent focus:outline-none font-bold text-sm" />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black uppercase tracking-widest opacity-40">Injury Res.</label>
                                        <input type="text" name="Injury Resistance" value={formData['Injury Resistance'] || ''} onChange={handleChange} className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:border-ef-accent focus:outline-none font-bold text-sm" />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black uppercase tracking-widest opacity-40">Card Type</label>
                                        <select name="cardType" value={formData.cardType} onChange={handleChange} className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:border-ef-accent focus:outline-none font-bold text-xs appearance-none">
                                            {['Normal', 'Legend', 'Epic', 'Featured', 'POTW', 'BigTime', 'ShowTime'].map(type => (
                                                <option key={type} value={type} className="bg-ef-dark">{type}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="space-y-1 text-left">
                                        <label className="text-[10px] font-black uppercase tracking-widest opacity-40">Featured</label>
                                        <input 
                                            type="text"
                                            name="Featured Players" 
                                            value={formData['Featured Players'] || ''} 
                                            onChange={handleChange}
                                            placeholder="Standard"
                                            className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:border-ef-accent focus:outline-none font-bold text-xs"
                                        />
                                    </div>
                                    <div className="space-y-1 col-span-2 lg:col-span-1">
                                        <label className="text-[10px] font-black uppercase tracking-widest opacity-40">Date Added</label>
                                        <input 
                                            type="text" 
                                            name="Date Added" 
                                            value={formData['Date Added'] || ''} 
                                            onChange={handleChange}
                                            placeholder="2026/04/06"
                                            className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:border-ef-accent focus:outline-none font-bold text-xs" 
                                        />
                                    </div>
                                </div>

                                {/* Tags Management */}
                                <div className="space-y-2 pt-2 border-t border-white/5">
                                    <label className="text-[10px] font-black uppercase tracking-widest opacity-40 flex items-center gap-2">
                                        <span className="text-ef-accent">#</span> Tags
                                    </label>
                                    <div className="flex flex-wrap gap-2 mb-2">
                                        {formData.tags.map(tag => (
                                            <span key={tag} className="flex items-center gap-2 px-3 py-1.5 bg-ef-accent/10 border border-ef-accent/20 rounded-full text-ef-accent text-[10px] font-black uppercase tracking-widest group">
                                                #{tag}
                                                <button type="button" onClick={() => handleRemoveTag(tag)} className="hover:text-white transition-colors">✕</button>
                                            </span>
                                        ))}
                                    </div>
                                    <div className="relative flex gap-2">
                                        <input
                                            type="text"
                                            placeholder="Add tag (e.g. Speedster, Header)"
                                            value={tagInput}
                                            onChange={(e) => setTagInput(e.target.value)}
                                            onKeyDown={handleAddTag}
                                            className="flex-1 bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:border-ef-accent focus:outline-none transition text-xs font-bold"
                                        />
                                        <button
                                            type="button"
                                            onClick={handleAddTag}
                                            className="px-4 py-3 bg-ef-accent/20 hover:bg-ef-accent/30 border border-ef-accent/30 rounded-xl text-ef-accent text-[10px] font-black uppercase tracking-widest transition-all active:scale-95"
                                        >
                                            Add
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-white/10">
                                <button type="button" onClick={() => { setFormData({ ...player }); setIsEditing(false); }} className="px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 transition font-bold text-sm">Cancel</button>
                                <button type="submit" className="px-4 py-3 rounded-xl bg-gradient-to-r from-ef-accent to-ef-blue text-white font-black hover:scale-[1.02] active:scale-95 transition-all duration-300 text-xs tracking-[0.2em] uppercase shadow-lg">Save Changes</button>
                            </div>
                        </form>
                    ) : (
                        <div className="flex-1 flex flex-col relative bg-[#0a0a0c] group/details overflow-hidden">
                            {/* Abstract Background Decoration */}
                            <div className="absolute top-0 right-0 w-64 h-64 bg-ef-accent/5 rounded-full blur-3xl -z-10 translate-x-1/3 -translate-y-1/3"></div>

                            {/* Tab Navigation */}
                            <div className="flex items-center gap-1 p-1 bg-white/5 rounded-2xl mx-4 md:mx-6 mt-4 md:mt-6 mb-2 border border-white/5 backdrop-blur-md z-30">
                                {[
                                    { id: 0, label: 'Identity', icon: '👤' },
                                    { id: 1, label: 'Analytics', icon: '📊' },
                                    { id: 2, label: 'Skills', icon: '🪄' },
                                    { id: 3, label: 'Builds', icon: '📈' }
                                ].map((tab) => (
                                    <button
                                        key={tab.id}
                                        onClick={() => setModalPage(tab.id)}
                                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${modalPage === tab.id 
                                            ? 'bg-ef-accent text-ef-dark shadow-[0_0_20px_rgba(0,255,136,0.2)]' 
                                            : 'text-white/40 hover:text-white hover:bg-white/5'
                                        }`}
                                    >
                                        <span>{tab.icon}</span>
                                        <span className={modalPage === tab.id ? 'block' : 'hidden md:block'}>{tab.label}</span>
                                    </button>
                                ))}
                            </div>

                            <div className="flex-1 relative overflow-hidden">
                                <div className="absolute inset-0 p-4 md:p-6 overflow-y-auto no-scrollbar">

                            {/* Page 0: Full Player Details */}
                            <div className={`flex-1 flex flex-col transition-all duration-500 transform overflow-y-auto no-scrollbar ${modalPage === 0 ? 'translate-x-0 opacity-100' : '-translate-x-full opacity-0 pointer-events-none absolute inset-0 p-4 md:p-6'} `}>

                                {/* Main Stats Grid */}
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
                                    <div className="bg-white/5 border border-white/10 rounded-xl p-3 flex flex-col items-center justify-center">
                                        <span className="text-xl font-black text-white">{player.matches || 0}</span>
                                        <span className="text-[8px] font-black uppercase tracking-widest opacity-30">Matches</span>
                                    </div>
                                    <div className="bg-ef-accent/10 border border-ef-accent/20 rounded-xl p-3 flex flex-col items-center justify-center text-ef-accent">
                                        <span className="text-xl font-black">{player.goals + player.assists}</span>
                                        <span className="text-[8px] font-black uppercase tracking-widest">G+A Total</span>
                                    </div>
                                    <div className="bg-ef-blue/10 border border-ef-blue/20 rounded-xl p-3 flex flex-col items-center justify-center">
                                        <span className="text-xl font-black text-white">{player.goals}</span>
                                        <span className="text-[8px] font-black uppercase tracking-widest text-ef-blue">Goals</span>
                                    </div>
                                    <div className="bg-white/5 border border-white/10 rounded-xl p-3 flex flex-col items-center justify-center">
                                        <span className="text-xl font-black text-white">{player.assists}</span>
                                        <span className="text-[8px] font-black uppercase tracking-widest opacity-30">Assists</span>
                                    </div>
                                </div>


                                {/* Ranking Dropdown */}
                                <div className="mb-3 relative" ref={rankingDropdownRef}>
                                    <button
                                        onClick={() => setIsRankingDropdownOpen(!isRankingDropdownOpen)}
                                        className="w-full flex items-center justify-between px-3 py-2 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all font-bold"
                                    >
                                        <div className="flex items-center gap-3">
                                            <span className="text-base">{rankingOptions.find(opt => opt.id === rankingContext)?.icon}</span>
                                            <span className="text-[10px] font-black uppercase tracking-widest text-white">{rankingOptions.find(opt => opt.id === rankingContext)?.label}</span>
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

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                                    {/* Analysis Box */}
                                    <div className="space-y-2 bg-white/5 rounded-xl p-3 border border-white/5">
                                        <h4 className="text-[8px] font-black uppercase tracking-[0.2em] opacity-20 border-b border-white/10 pb-1">Efficiency</h4>
                                        <div className="space-y-1.5 pt-1">
                                            <div className="flex justify-between items-center group">
                                                <span className="text-[9px] opacity-40 uppercase font-bold tracking-widest">Goals / GM</span>
                                                <span className="font-mono text-sm font-black text-ef-accent">{(player.goals / (player.matches || 1)).toFixed(2)}</span>
                                            </div>
                                            <div className="flex justify-between items-center group">
                                                <span className="text-[9px] opacity-40 uppercase font-bold tracking-widest">Assists / GM</span>
                                                <span className="font-mono text-sm font-black text-ef-blue">{(player.assists / (player.matches || 1)).toFixed(2)}</span>
                                            </div>
                                            <div className="flex justify-between items-center group">
                                                <span className="text-[9px] opacity-40 uppercase font-bold tracking-widest">G+A / GM</span>
                                                <span className="font-mono text-sm font-black text-white">{((player.goals + player.assists) / (player.matches || 1)).toFixed(2)}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Ranking Box */}
                                    <div className="space-y-2 bg-white/5 rounded-xl p-3 border border-white/5">
                                        <h4 className="text-[8px] font-black uppercase tracking-[0.2em] opacity-20 border-b border-white/10 pb-1 flex justify-between">
                                            <span>RANKING OUT OF</span>
                                            <span className="text-ef-accent">{rankInfo.total}</span>
                                        </h4>
                                        <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 pt-0.5">
                                            <div className="flex justify-between items-center">
                                                <span className="text-[8px] opacity-40 font-bold uppercase">Matches</span>
                                                <span className="font-mono text-[11px] font-black">#{rankInfo.matches}</span>
                                            </div>
                                            <div className="flex justify-between items-center text-ef-accent">
                                                <span className="text-[8px] opacity-40 font-bold uppercase">G+A</span>
                                                <span className="font-mono text-[11px] font-black">#{rankInfo.ga}</span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-[8px] opacity-40 font-bold uppercase">Goals</span>
                                                <span className="font-mono text-[11px] font-black">#{rankInfo.goals}</span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-[8px] opacity-40 font-bold uppercase">Assists</span>
                                                <span className="font-mono text-[11px] font-black">#{rankInfo.assists}</span>
                                            </div>
                                            <div className="flex justify-between items-center border-t border-white/5 pt-1">
                                                <span className="text-[8px] opacity-40 font-bold uppercase">Goals/GM</span>
                                                <span className="font-mono text-[11px] font-black text-ef-accent">#{rankInfo.gpg}</span>
                                            </div>
                                            <div className="flex justify-between items-center border-t border-white/5 pt-1">
                                                <span className="text-[8px] opacity-40 font-bold uppercase">Ast/GM</span>
                                                <span className="font-mono text-[11px] font-black text-ef-blue">#{rankInfo.apg}</span>
                                            </div>
                                            <div className="flex justify-between items-center col-span-2 bg-white/5 p-1 px-2 rounded">
                                                <span className="text-[8px] opacity-40 font-bold uppercase">G+A / Game</span>
                                                <span className="font-mono text-[11px] font-black text-ef-accent">#{rankInfo.gapg}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="mt-auto flex flex-col gap-3 pt-4">
                                    <button onClick={() => setIsEditing(true)} className="w-full py-3 rounded-xl bg-white/5 border border-white/10 hover:border-ef-accent/50 hover:bg-white/10 hover:text-ef-accent transition-all font-black text-[9px] tracking-widest uppercase flex items-center justify-center gap-2">
                                        <span>⚡</span> Edit Data
                                    </button>
                                </div>
                            </div>

                            {/* Page 1: Analytics / Comparison Graph */}
                            <div className={`flex-1 flex flex-col transition-all duration-500 transform overflow-y-auto no-scrollbar ${modalPage === 1 ? 'translate-x-0 opacity-100' : modalPage < 1 ? 'translate-x-full opacity-0 pointer-events-none absolute inset-0' : '-translate-x-full opacity-0 pointer-events-none absolute inset-0'} `}>
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
                                                            <span className={`text-[9px] font-black uppercase tracking-widest ${comparisonStat === opt.id ? 'text-ef-accent' : 'text-white/50'} `}>{opt.label}</span>
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
                                        <span className="text-[10px] font-black uppercase tracking-widest opacity-40">Ranked</span>
                                        <div className="flex items-baseline gap-1.5">
                                            <span className="text-2xl font-black text-white">#{comparisonData.rank}</span>
                                            <span className="text-[10px] font-bold opacity-40">of {comparisonData.total}</span>
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-end">
                                        <span className="text-[10px] font-black uppercase tracking-widest opacity-40 text-right">{compContextOptions.find(o => o.id === comparisonContext)?.label}</span>
                                        <div className="flex items-center gap-1.5 text-ef-accent">
                                            <span className="text-xs">{compOptions.find(o => o.id === comparisonStat)?.icon}</span>
                                            <span className="text-sm font-black uppercase">{compOptions.find(o => o.id === comparisonStat)?.label}</span>
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
                            <div className={`flex-1 flex flex-col transition-all duration-500 transform overflow-y-auto no-scrollbar ${modalPage === 2 ? 'translate-x-0 opacity-100' : modalPage < 2 ? 'translate-x-full opacity-0 pointer-events-none absolute inset-0 p-4 md:p-6' : '-translate-x-full opacity-0 pointer-events-none absolute inset-0 p-4 md:p-6'} `}>
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-xl font-black text-white uppercase tracking-tighter flex items-center gap-2">
                                        <span className="text-ef-accent">🪄</span> Player Skills
                                    </h3>
                                    <div className="flex items-center gap-2">
                                        {!isSkillsLoading && (
                                            <>
                                                {(player.pesdb_id || player.playerId) && (
                                                    <button
                                                        onClick={() => fetchSkills(true)}
                                                        className="px-3 py-1 bg-ef-accent/10 border border-ef-accent/20 rounded-lg text-[9px] font-black uppercase tracking-widest text-ef-accent hover:bg-ef-accent/20 transition-all"
                                                        title="Force re-scrape from PESDB"
                                                    >
                                                        🔄 Re-scrape
                                                    </button>
                                                )}
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
                                                        className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border transition-all ${isBulkEditingSkills
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
                                                    className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border transition-all ${isEditingSkills
                                                            ? 'bg-ef-accent/20 border-ef-accent/40 text-ef-accent'
                                                            : 'bg-white/5 border-white/10 text-white/40 hover:text-white hover:bg-white/10'
                                                        }`}
                                                >
                                                    {isEditingSkills ? '✓ Done' : '✏ Edit'}
                                                </button>
                                            </>
                                        )}
                                        <button onClick={() => { setModalPage(0); setIsBulkEditingSkills(false); setIsEditingSkills(false); }} className="text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-white transition-colors">
                                            ✕ Back
                                        </button>
                                    </div>
                                </div>

                                {isBulkEditingSkills && (
                                    <div className="mb-4 animate-fade-in">
                                        <div className="flex items-center justify-between mb-1.5">
                                            <span className="text-[8px] font-black uppercase tracking-widest text-ef-accent">Paste Skills List (One per line)</span>
                                            <button onClick={() => setIsBulkEditingSkills(false)} className="text-[8px] font-black text-white/30 hover:text-white">Cancel</button>
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

                                {isSkillsLoading ? (
                                    <div className="flex flex-col items-center justify-center py-20 gap-4">
                                        <div className="w-10 h-10 border-4 border-ef-accent border-t-transparent rounded-full animate-spin"></div>
                                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 animate-pulse">Scraping skills from PESDB...</span>
                                    </div>
                                ) : skillsError ? (
                                    <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
                                        <span className="text-4xl">⚠️</span>
                                        <p className="text-sm font-bold text-white/60">{skillsError}</p>
                                        <button onClick={() => fetchSkills(false)} className="px-6 py-2 bg-white/5 border border-white/10 rounded-full text-white/60 text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all">
                                            Try Again
                                        </button>
                                        {(player.pesdb_id || player.playerId) && (
                                            <button onClick={() => fetchSkills(true)} className="px-6 py-2 bg-ef-accent/10 border border-ef-accent/20 rounded-full text-ef-accent text-[10px] font-black uppercase tracking-widest hover:bg-ef-accent/20 transition-all">
                                                🔄 Force Re-scrape
                                            </button>
                                        )}
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-2 gap-4 flex-1 min-h-0">

                                        {/* ── Left: Core Skills ── */}
                                        <div className="flex flex-col gap-2 min-h-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="text-[9px] font-black uppercase tracking-widest text-ef-accent">Core Skills</span>
                                                <div className="h-px bg-white/10 flex-1"></div>
                                                <span className="text-[9px] font-black text-white/20">{skills.length}</span>
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
                                                            <span className={`text-[10px] font-bold uppercase tracking-tight leading-tight flex-1 ${isSpecial ? 'text-red-300' : 'text-white'}`}>{skill}</span>
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
                                                    <div className="text-center py-6 opacity-30 text-[9px] uppercase font-black tracking-widest italic">No core skills found</div>
                                                )}

                                                {/* Add Skill row (edit mode only) */}
                                                {isEditingSkills && (
                                                    <div className="relative">
                                                        <button
                                                            onClick={() => { setShowAddCoreSkill(s => !s); setCoreSkillSearch(''); }}
                                                            className="w-full flex items-center gap-2 px-3 py-2.5 border border-dashed border-ef-accent/30 rounded-xl bg-ef-accent/5 hover:bg-ef-accent/10 transition-all text-[10px] font-bold text-ef-accent/60 hover:text-ef-accent"
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
                                                                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-[10px] text-white placeholder-white/20 focus:outline-none focus:border-ef-accent/40"
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
                                                                                    className={`w-full text-left px-3 py-2 text-[10px] font-bold flex items-center gap-2 border-b border-white/5 last:border-0 transition-all ${isSp ? 'text-red-300 hover:bg-red-500/10' : 'text-white/60 hover:text-white hover:bg-white/5'
                                                                                        }`}>
                                                                                    <span className={`w-1 h-1 rounded-full flex-shrink-0 ${isSp ? 'bg-red-400' : 'bg-ef-accent/40'}`}></span>
                                                                                    {skill}
                                                                                    {isSp && <span className="ml-auto text-[6px] bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded font-black">🔥</span>}
                                                                                </button>
                                                                            );
                                                                        })
                                                                    }
                                                                    {ALL_SKILLS.filter(s => !skills.includes(s)).filter(s => !coreSkillSearch || s.toLowerCase().includes(coreSkillSearch.toLowerCase())).length === 0 && (
                                                                            <div className="px-3 py-4 text-center text-[9px] text-white/30 font-black uppercase tracking-widest">All skills added</div>
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
                                                <span className="text-[9px] font-black uppercase tracking-widest text-blue-400">Additional</span>
                                                <div className="h-px bg-white/10 flex-1"></div>
                                                <span className="text-[9px] font-black text-white/20">{additionalSkills.filter(Boolean).length}/5</span>
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
                                                            <span className={`text-[10px] font-bold uppercase tracking-tight flex-1 leading-tight ${addedSkill ? 'text-white' : 'text-white/25 italic'
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
                                                                <span className="text-[9px] text-white/15">+</span>
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
                                                                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-[10px] text-white placeholder-white/20 focus:outline-none focus:border-blue-400/40"
                                                                        onClick={e => e.stopPropagation()}
                                                                    />
                                                                </div>
                                                                <div className="overflow-y-auto max-h-[180px] custom-scrollbar">
                                                                    {PLAYER_SKILLS
                                                                        .filter(s => !skills.includes(s) && !additionalSkills.includes(s))
                                                                        .filter(s => !skillSearch || s.toLowerCase().includes(skillSearch.toLowerCase()))
                                                                        .map(skill => (
                                                                            <button key={skill} onClick={() => {
                                                                                const next = [...additionalSkills];
                                                                                next[idx] = skill;
                                                                                setAdditionalSkills(next);
                                                                                setActiveAdditionalSlot(null);
                                                                                setSkillSearch('');
                                                                                if (player._id) onUpdate(player._id, { additionalSkills: next.filter(Boolean) }, false);
                                                                            }}
                                                                                className="w-full text-left px-3 py-2 text-[10px] font-bold text-white/60 hover:text-white hover:bg-white/5 flex items-center gap-2 border-b border-white/5 last:border-0 transition-all">
                                                                                <span className="w-1 h-1 rounded-full flex-shrink-0 bg-ef-accent/40"></span>
                                                                                {skill}
                                                                            </button>
                                                                        ))
                                                                    }
                                                                    {PLAYER_SKILLS
                                                                        .filter(s => !skills.includes(s) && !additionalSkills.includes(s))
                                                                        .filter(s => !skillSearch || s.toLowerCase().includes(skillSearch.toLowerCase()))
                                                                        .length === 0 && (
                                                                            <div className="px-3 py-4 text-center text-[9px] text-white/30 font-black uppercase tracking-widest">No skills available</div>
                                                                        )}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div className="mt-4 pt-4 border-t border-white/5">
                                    <button
                                        onClick={() => setModalPage(0)}
                                        className="w-full py-3 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] text-white hover:bg-white/10 transition-all active:scale-95"
                                    >
                                        Back to Overview
                                    </button>
                                </div>
                            </div>

                            {/* Page 3: Builds / Progressions */}
                            <div className={`flex-1 flex flex-col transition-all duration-500 transform overflow-y-auto no-scrollbar ${modalPage === 3 ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0 pointer-events-none absolute inset-0 p-4 md:p-6'} `}>
                                <div className="flex-1 flex flex-col items-center justify-center text-center p-6 bg-white/5 rounded-3xl border border-white/10 backdrop-blur-md">
                                    <div className="w-20 h-20 bg-ef-accent/10 rounded-full flex items-center justify-center mb-6 border border-ef-accent/20">
                                        <span className="text-4xl text-ef-accent">📊</span>
                                    </div>
                                    <h3 className="text-xl font-black text-white uppercase tracking-widest mb-2">Saved Builds</h3>
                                    <p className="text-[10px] text-white/40 uppercase font-black tracking-widest leading-relaxed max-w-[200px] mb-8">
                                        View and manage your optimized progression paths for {formData.name}
                                    </p>
                                    
                                    <button 
                                        onClick={() => setShowProgressions(true)}
                                        className="w-full py-4 bg-ef-accent text-ef-dark rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-[0_0_30px_rgba(0,255,136,0.2)] hover:scale-[1.02] active:scale-95 transition-all"
                                    >
                                        Open Progressions Manager
                                    </button>
                                    
                                    {player.progressions?.length > 0 ? (
                                        <div className="mt-8 pt-8 border-t border-white/5 w-full">
                                            <div className="flex justify-between items-center mb-4 px-2">
                                                <span className="text-[8px] font-black uppercase tracking-widest opacity-20 text-white">Active Build Status</span>
                                                <span className="px-2 py-0.5 bg-ef-accent/20 text-ef-accent rounded text-[8px] font-black">{player.progressions.length} Builds Saved</span>
                                            </div>
                                            <div className="text-[9px] text-white/30 font-bold italic">
                                                Tap the button above to view all saved progression sets.
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="mt-8 opacity-20 text-[8px] font-black uppercase tracking-widest">No builds saved yet</div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                )}
            </div>
        </div>
    </div>
);
};

export default PlayerDetailsModal;
