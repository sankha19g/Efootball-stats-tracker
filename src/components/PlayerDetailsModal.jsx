import { useState, useEffect, useRef, useMemo } from 'react';
import { PLAYSTYLES, TOP_LEAGUES } from '../constants';
import { searchLeagues, searchTeams, searchCountries, getFlagUrl } from '../services/footballApi';
import SavedProgressionsModal from './SavedProgressionsModal';

const PlayerDetailsModal = ({ player, players = [], onClose, onUpdate, initialEditMode = false, settings }) => {
    const [isEditing, setIsEditing] = useState(initialEditMode);
    const [showProgressions, setShowProgressions] = useState(false);
    const [rankingContext, setRankingContext] = useState('all'); // 'all', 'position', 'league', 'club', 'country'
    const [isCustomLeague, setIsCustomLeague] = useState(false);
    const [formData, setFormData] = useState({ ...player });
    const [isLeaguePopupOpen, setIsLeaguePopupOpen] = useState(false);
    const [isRankingDropdownOpen, setIsRankingDropdownOpen] = useState(false);
    const [modalPage, setModalPage] = useState(0); // 0: Overview, 1: Management
    const [leagueLogos, setLeagueLogos] = useState({});
    const [_isLoadingLogos, setIsLoadingLogos] = useState(false);
    const leaguePopupRef = useRef(null);
    const rankingDropdownRef = useRef(null);
    const comparisonDropdownRef = useRef(null);
    const [comparisonStat, setComparisonStat] = useState('goals');
    const [isComparisonDropdownOpen, setIsComparisonDropdownOpen] = useState(false);

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

    useEffect(() => {
        setFormData({ ...player });
    }, [player]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: name === 'rating' || name === 'goals' || name === 'assists' || name === 'matches' ? Number(value) : value
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
                country: getFlagUrl(country.name)
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

    const handleSubmit = (e) => {
        e.preventDefault();
        onUpdate(player._id, formData, false);
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
            data: displayPlayers.map(p => ({
                id: p._id || p.id || p.name,
                name: p.name,
                value: getValue(p),
                image: p.image,
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
        <div className={`fixed inset-0 bg-black/95 flex items-center justify-center z-50 p-4 ${settings?.highPerf ? '' : 'animate-fade-in'}`}>
            {showProgressions && (
                <SavedProgressionsModal
                    player={player}
                    onClose={() => setShowProgressions(false)}
                    onUpdatePlayer={onUpdate}
                    settings={settings}
                />
            )}

            <div className={`relative w-full max-w-4xl bg-[#0a0a0c] border border-white/5 rounded-3xl overflow-hidden flex flex-col md:flex-row shadow-[0_0_80px_rgba(0,0,0,0.6)] ${settings?.highPerf ? '' : 'animate-slide-up'} ${isEditing ? 'h-auto' : ''} max-h-[90vh]`}>

                {/* Close/Back Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 left-4 md:left-auto md:right-4 z-50 p-2 md:p-2.5 rounded-xl bg-black/40 md:bg-black/20 hover:bg-black/60 md:hover:bg-black/40 text-white transition-all active:scale-95 border border-white/10"
                >
                    <span className="hidden md:block">✕</span>
                    <span className="md:hidden text-xl">←</span>
                </button>

                {/* Left Side: Card Visual & Quick Info */}
                <div className={`w-full md:w-1/3 p-4 md:p-6 flex flex-col md:flex-col gap-4 md:gap-6 ${getCardStyles(formData.cardType).bg} no-scrollbar md:border-r border-white/5 relative overflow-hidden h-fit md:h-full shrink-0`}>

                    {/* Mobile-only Header at the very top (Left Aligned) */}
                    <div className="md:hidden flex flex-col items-start border-b border-white/10 pb-3 pt-1 w-full">
                        <h2 className="text-xl font-black text-white uppercase tracking-tight leading-none truncate w-full">{formData.name}</h2>
                        <div className="flex items-center gap-2 mt-2">
                            <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-ef-accent text-ef-dark uppercase tracking-widest leading-none">
                                {formData.position}
                            </span>
                            <span className="text-sm font-black text-ef-accent leading-none">★ {formData.rating}</span>
                        </div>
                    </div>

                    <div className="flex flex-row md:flex-col items-center md:items-center gap-4 w-full h-full">
                        {/* Dynamic Background Glow based on Image */}
                        {formData.image && (
                            <div className="absolute inset-0 z-0 opacity-20 pointer-events-none">
                                <img src={formData.image} className={`w-full h-full object-cover object-top scale-150 ${settings?.highPerf ? '' : 'blur-[60px]'}`} alt="" />
                                <div className={`absolute inset-0 bg-black/40 ${settings?.highPerf ? '' : getCardStyles(formData.cardType).glow}`}></div>
                            </div>
                        )}

                        <div className={`relative z-10 w-28 h-40 sm:w-40 sm:h-60 md:w-48 md:h-72 rounded-xl overflow-hidden border-[3px] md:border-[5px] border-white/20 bg-black/40 shrink-0 group/card ${settings?.highPerf ? '' : `transition-all duration-500 ${getCardStyles(formData.cardType).glow}`}`}>
                            {/* Internal Effects: Light Leak & Shine */}
                            {!settings?.highPerf && (
                                <div className="absolute inset-0 z-10 pointer-events-none overflow-hidden">
                                    {/* Static Light Leak */}
                                    <div className={`absolute -top-10 -left-10 w-40 h-40 bg-gradient-to-br ${getCardStyles(formData.cardType).leak} blur-3xl opacity-60`}></div>
                                    <div className={`absolute -bottom-10 -right-10 w-40 h-40 bg-gradient-to-tl ${getCardStyles(formData.cardType).leak} blur-3xl opacity-40`}></div>

                                    {/* Radial Glow/Flare */}
                                    <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full ${getCardStyles(formData.cardType).flare} blur-[80px] opacity-30`}></div>

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

                            {/* Overlay Info for Card Look */}
                            <div
                                className={`absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent p-2 md:p-3 pt-8 md:pt-12 pb-3 md:pb-4 text-white ${settings?.highPerf ? '' : 'backdrop-blur-[2px] md:backdrop-blur-[4px]'}`}
                                style={{ maskImage: 'linear-gradient(to top, black 40%, transparent)' }}
                            >
                                <div className="text-xl md:text-3xl font-black mb-0 md:mb-0.5 text-ef-accent drop-shadow-lg leading-none">{formData.rating}</div>
                                <div className="text-[10px] md:text-sm font-bold uppercase tracking-wider opacity-90 drop-shadow-md leading-none">{formData.position}</div>
                            </div>

                            {isEditing && (
                                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 opacity-0 hover:opacity-100 transition cursor-pointer">
                                    <span className="text-white font-bold bg-black/50 px-4 py-2 rounded-full border border-white/30">Upload Photo</span>
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
                            <div className="w-full px-2">
                                <label className="block text-[8px] font-black uppercase tracking-widest opacity-30 mb-1.5 ml-1">Or Paste Image Link</label>
                                <input
                                    type="text"
                                    placeholder="https://..."
                                    value={formData.image && !formData.image.startsWith('data:') ? formData.image : ''}
                                    onChange={(e) => setFormData(prev => ({ ...prev, image: e.target.value }))}
                                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-[10px] text-white focus:outline-none focus:border-ef-accent/40 transition-all font-medium"
                                />
                            </div>
                        )}

                        {/* Stats under photo */}
                        {/* Player Details List (Moved from Right Side) */}
                        <div className="flex-1 md:w-full md:mt-2 space-y-2 px-0 md:px-2 text-white/80 z-10">
                            {/* Compact vertical list */}
                            <div className="flex flex-col gap-1 md:gap-1.5 pt-0 md:pt-2">
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
                                    <span className="opacity-40 uppercase font-black tracking-widest">Style</span>
                                    <span className="font-bold text-ef-accent truncate">{formData.playstyle}</span>
                                </div>
                                <div className="flex items-center justify-between text-[10px] py-1 border-b border-white/5">
                                    <span className="opacity-40 uppercase font-black tracking-widest">Type</span>
                                    <span className={`${formData.cardType === 'Legendary' ? 'text-yellow-400' :
                                        formData.cardType === 'Epic' ? 'text-green-400' :
                                            formData.cardType === 'Featured' ? 'text-purple-400' :
                                                'text-blue-400'} font-bold`}>{formData.cardType}</span>
                                </div>
                                <div className="flex items-center justify-between text-[10px] py-1">
                                    <span className="opacity-40 uppercase font-black tracking-widest">Age / Foot</span>
                                    <span className="font-bold">{formData.age || '-'} • {formData.strongFoot}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Side: Details / Edit Form */}
                <div className="w-full md:w-7/12 p-6 md:p-10 bg-black flex flex-col justify-center relative overflow-hidden group/modal">
                    {isEditing ? (
                        <form onSubmit={handleSubmit} className="space-y-4 h-full flex flex-col">
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
                                                        <span className={`truncate text-xs ${formData.league ? 'text-white' : 'text-white/30'}`}>
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
                                                                className={`flex items-center gap-3 px-3 py-2 w-full text-left hover:bg-white/5 border-b border-white/5 last:border-0 ${formData.league === league ? 'text-ef-accent' : 'text-white/70'}`}
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
                                        <label className="text-[10px] font-black uppercase tracking-widest opacity-40">Foot</label>
                                        <select name="strongFoot" value={formData.strongFoot} onChange={handleChange} className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:border-ef-accent focus:outline-none font-bold text-sm appearance-none">
                                            <option value="Right">Right</option>
                                            <option value="Left">Left</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black uppercase tracking-widest opacity-40">Position</label>
                                        <select name="position" value={formData.position} onChange={handleChange} className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:border-ef-accent focus:outline-none font-bold text-sm appearance-none">
                                            {['CF', 'SS', 'LWF', 'RWF', 'LMF', 'RMF', 'AMF', 'CMF', 'DMF', 'LB', 'RB', 'CB', 'GK'].map(pos => (
                                                <option key={pos} value={pos} className="bg-ef-dark">{pos}</option>
                                            ))}
                                        </select>
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
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black uppercase tracking-widest opacity-40">Card Type</label>
                                    <select name="cardType" value={formData.cardType} onChange={handleChange} className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:border-ef-accent focus:outline-none font-bold text-xs appearance-none">
                                        {['Normal', 'Legend', 'Epic', 'Featured', 'POTW', 'BigTime', 'ShowTime'].map(type => (
                                            <option key={type} value={type} className="bg-ef-dark">{type}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-white/10">
                                <button type="button" onClick={() => { setFormData({ ...player }); setIsEditing(false); }} className="px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 transition font-bold text-sm">Cancel</button>
                                <button type="submit" className="px-4 py-3 rounded-xl bg-gradient-to-r from-ef-accent to-ef-blue text-white font-black hover:scale-[1.02] active:scale-95 transition-all duration-300 text-xs tracking-[0.2em] uppercase shadow-lg">Save Changes</button>
                            </div>
                        </form>
                    ) : (
                        <div className="flex-1 flex flex-col relative p-4 md:p-6 bg-[#0a0a0c] group/details overflow-hidden">
                            {/* Abstract Background Decoration */}
                            <div className="absolute top-0 right-0 w-64 h-64 bg-ef-accent/5 rounded-full blur-3xl -z-10 translate-x-1/3 -translate-y-1/3"></div>

                            {/* Page 0: Full Player Details */}
                            <div className={`flex-1 flex flex-col transition-all duration-500 transform overflow-y-auto no-scrollbar ${modalPage === 0 ? 'translate-x-0 opacity-100' : '-translate-x-full opacity-0 pointer-events-none absolute inset-0 p-4 md:p-6'}`}>
                                <div className="mb-4">
                                    <div className="flex justify-between items-start group">
                                        <div className="flex flex-col md:flex-row md:items-center gap-2">
                                            <div className={`hidden md:block w-1.5 h-6 rounded-full ${player.cardType === 'Legendary' ? 'bg-yellow-500' : player.cardType === 'Epic' ? 'bg-green-500' : 'bg-ef-blue'}`}></div>
                                            <div className="hidden md:block">
                                                <h2 className="text-xl md:text-2xl font-black tracking-tighter text-white uppercase leading-none">{player.name}</h2>
                                                <div className="text-[10px] font-black text-ef-accent font-mono tracking-widest mt-1">{player.position}</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

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
                                                    className={`w-full flex items-center gap-3 px-4 py-2 transition-colors hover:bg-white/5 ${rankingContext === ctx.id ? 'bg-ef-accent/5' : ''}`}
                                                >
                                                    <span className="text-sm">{ctx.icon}</span>
                                                    <span className={`text-[9px] font-black uppercase tracking-widest ${rankingContext === ctx.id ? 'text-ef-accent' : 'text-white/50'}`}>{ctx.label}</span>
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
                                            <div className="flex justify-between items-center border-t border-white/5 pt-1 col-span-2">
                                                <span className="text-[8px] opacity-40 font-bold uppercase">Goals/GM</span>
                                                <span className="font-mono text-[11px] font-black text-ef-accent">#{rankInfo.gpg}</span>
                                            </div>
                                            <div className="flex justify-between items-center col-span-2">
                                                <span className="text-[8px] opacity-40 font-bold uppercase">Ast/GM</span>
                                                <span className="font-mono text-[11px] font-black text-ef-blue">#{rankInfo.apg}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="mt-auto flex gap-3 pt-4">
                                    <button onClick={() => setShowProgressions(true)} className="flex-1 py-3 rounded-xl bg-white/5 border border-white/10 hover:border-ef-accent/50 hover:bg-white/10 hover:text-ef-accent transition-all font-black text-[9px] tracking-widest uppercase flex items-center justify-center gap-2">
                                        <span>📊</span> Progressions
                                    </button>
                                    <button onClick={() => setIsEditing(true)} className="flex-1 py-3 rounded-xl bg-white/5 border border-white/10 hover:border-ef-accent/50 hover:bg-white/10 hover:text-ef-accent transition-all font-black text-[9px] tracking-widest uppercase flex items-center justify-center gap-2">
                                        <span>⚡</span> Edit Data
                                    </button>
                                </div>
                            </div>

                            {/* Page 1: Comparison */}
                            <div className={`flex-1 flex flex-col transition-all duration-500 transform overflow-y-auto no-scrollbar ${modalPage === 1 ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0 pointer-events-none absolute inset-0 p-4 md:p-6'}`}>
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="text-xl font-black text-white uppercase tracking-tighter flex items-center gap-2">
                                        <span className="text-ef-accent">🆚</span> Compare
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
                                                            className={`w-full flex items-center gap-2 px-3 py-2 transition-colors hover:bg-white/5 ${comparisonContext === opt.id ? 'bg-ef-accent/5' : ''}`}
                                                        >
                                                            <span className="text-xs">{opt.icon}</span>
                                                            <span className={`text-[9px] font-black uppercase tracking-widest ${comparisonContext === opt.id ? 'text-ef-accent' : 'text-white/50'}`}>{opt.label}</span>
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
                                                            className={`w-full flex items-center gap-2 px-3 py-2 transition-colors hover:bg-white/5 ${comparisonStat === opt.id ? 'bg-ef-accent/5' : ''}`}
                                                        >
                                                            <span className="text-xs">{opt.icon}</span>
                                                            <span className={`text-[9px] font-black uppercase tracking-widest ${comparisonStat === opt.id ? 'text-ef-accent' : 'text-white/50'}`}>{opt.label}</span>
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
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
                                                <div className={`mb-2 transition-all duration-300 transform ${p.isCurrent ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100'} flex flex-col items-center gap-1`}>
                                                    {/* Image Popup */}
                                                    <div className="w-10 h-12 rounded-lg bg-white/10 border border-white/20 overflow-hidden shadow-xl mb-1 hidden group-hover:block transition-all animate-fade-in relative">
                                                        {p.image ? (
                                                            <img src={p.image} alt={p.name} className="w-full h-full object-cover" />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center bg-ef-dark text-[8px] opacity-50">?</div>
                                                        )}
                                                        <div className="absolute inset-0 ring-1 ring-white/10 rounded-lg"></div>
                                                    </div>
                                                    <span className={`text-[10px] font-black font-mono ${p.isCurrent ? 'text-ef-accent' : 'text-white'}`}>
                                                        {comparisonStat.includes('pg') ? p.value.toFixed(2) : p.value}
                                                    </span>
                                                </div>

                                                {/* The Bar */}
                                                <div
                                                    className={`w-full max-w-[24px] md:max-w-[40px] rounded-t-sm relative transition-all duration-1000 ease-out origin-bottom ${p.isCurrent ? 'bg-ef-accent shadow-[0_0_20px_rgba(0,255,136,0.4)]' : 'bg-ef-blue/40 hover:bg-ef-blue/60'}`}
                                                    style={{ height: `${Math.max(2, (p.value / (comparisonData.max * 1.1)) * 100)}%` }}
                                                >
                                                    {p.isCurrent && (
                                                        <div className="absolute inset-x-0 top-0 h-full bg-gradient-to-b from-white/20 to-transparent pointer-events-none"></div>
                                                    )}
                                                </div>

                                                {/* Label */}
                                                <div className="absolute top-full mt-2 w-full flex justify-center">
                                                    <div className={`text-[8px] font-black uppercase tracking-wider truncate max-w-[60px] text-center transition-colors ${p.isCurrent ? 'text-ef-accent' : 'text-white/30 group-hover:text-white/60'}`}>
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



                            {/* Global Arrow Navigation */}
                            <button
                                onClick={() => setModalPage(p => p === 0 ? 1 : 0)}
                                className="absolute right-0 top-1/2 -translate-y-1/2 w-8 h-20 bg-white/5 border border-white/10 border-r-0 rounded-l-2xl flex items-center justify-center hover:bg-ef-accent/10 hover:border-ef-accent/30 transition-all group/arrow z-50 backdrop-blur-md"
                            >
                                <span className="text-ef-accent text-xl font-black transition-transform group-hover/arrow:scale-125">
                                    {modalPage === 0 ? '❯' : '❮'}
                                </span>
                            </button>

                            {/* Page Dots Overlay */}
                            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                                {[0, 1].map(i => (
                                    <div key={i} className={`w-1 h-1 rounded-full transition-all duration-300 ${modalPage === i ? 'bg-ef-accent w-3' : 'bg-white/20'}`} />
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PlayerDetailsModal;
