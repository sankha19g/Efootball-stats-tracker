import { useState, useEffect, useRef } from 'react';
import { searchPlayers, getPlayerDetails, getTeamDetails, calculateAge, getPlayerHistory, searchLeagues, getFlagUrl, searchTeams, searchCountries } from '../services/footballApi';

import { PLAYSTYLES, TOP_LEAGUES } from '../constants';

const PlayerForm = ({ onAdd, initialData, onClose }) => {
    const [formData, setFormData] = useState({
        name: '',
        cardType: 'Normal',
        nationality: '',
        club: '',
        league: '',
        rating: 80,
        position: 'CF',
        matches: 0,
        goals: 0,
        assists: 0,
        playstyle: 'Goal Poacher',
        image: '',
        age: '',
        strongFoot: 'Right',
        logos: { club: '', league: '', country: '' }
    });

    const [searchResults, setSearchResults] = useState([]);
    const [clubResults, setClubResults] = useState([]);
    const [countryResults, setCountryResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [isSearchingClub, setIsSearchingClub] = useState(false);
    const [isSearchingCountry, setIsSearchingCountry] = useState(false);
    const [showResults, setShowResults] = useState(false);
    const [showClubResults, setShowClubResults] = useState(false);
    const [showCountryResults, setShowCountryResults] = useState(false);
    const [isCustomLeague, setIsCustomLeague] = useState(false);
    const [isLeaguePopupOpen, setIsLeaguePopupOpen] = useState(false);
    const [leagueLogos, setLeagueLogos] = useState({});
    const [_isLoadingLogos, setIsLoadingLogos] = useState(false);
    const searchTimeout = useRef(null);
    const clubSearchTimeout = useRef(null);
    const countrySearchTimeout = useRef(null);
    const leaguePopupRef = useRef(null);
    const latestSearchId = useRef(0);
    const latestClubSearchId = useRef(0);
    const latestCountrySearchId = useRef(0);

    const getCardStyles = (type) => {
        switch (type?.toLowerCase()) {
            case 'legendary': return {
                bg: 'bg-gradient-to-b from-[#1a1608] to-[#0a0a0c] border-yellow-500/20',
                glow: 'shadow-[0_0_50px_rgba(234,179,8,0.2)]',
                accent: 'text-yellow-500',
                leak: 'from-yellow-500/10 via-transparent to-transparent',
                flare: 'bg-yellow-400/5'
            };
            case 'epic': return {
                bg: 'bg-gradient-to-b from-[#081a12] to-[#0a0a0c] border-green-500/20',
                glow: 'shadow-[0_0_50px_rgba(34,197,94,0.2)]',
                accent: 'text-green-500',
                leak: 'from-green-500/10 via-transparent to-transparent',
                flare: 'bg-green-400/5'
            };
            case 'featured': return {
                bg: 'bg-gradient-to-b from-[#14081a] to-[#0a0a0c] border-purple-500/20',
                glow: 'shadow-[0_0_50px_rgba(168,85,247,0.2)]',
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

    useEffect(() => {
        if (initialData) {
            setFormData(prev => ({
                ...prev,
                ...initialData
            }));
        }
    }, [initialData]);

    const handleSearch = async (name) => {
        if (name.length < 3) {
            setSearchResults([]);
            setShowResults(false);
            return;
        }

        const currentId = ++latestSearchId.current;
        setIsSearching(true);
        setShowResults(true);
        // Clear previous results to show we are searching
        setSearchResults([]);

        try {
            const players = await searchPlayers(name);

            // If another search started, ignore these results
            if (currentId !== latestSearchId.current) return;

            if (!players || players.length === 0) {
                setSearchResults([]); // Explicitly empty for "No Results" check
                return;
            }

            // Show initial results immediately with local data from search
            const initialResults = players.slice(0, 5).map(p => ({
                ...p,
                displayTeam: p.strTeam,
                teamBadge: '',
                isCurrent: true
            }));

            setSearchResults(initialResults);

            // Fetch history and badges in parallel as an enhancement
            const expandedResults = await Promise.all(players.slice(0, 3).map(async (player) => {
                try {
                    const [currentBadge, history] = await Promise.all([
                        getTeamDetails(player.strTeam),
                        getPlayerHistory(player.idPlayer)
                    ]);

                    const base = {
                        ...player,
                        displayTeam: player.strTeam,
                        teamBadge: currentBadge?.strBadge || '',
                        isCurrent: true
                    };

                    const historyResults = (history || []).slice(0, 2).map(record => {
                        const teamName = record.strFormerTeam || record.strTeam;
                        if (teamName && teamName !== player.strTeam) {
                            return {
                                ...player,
                                displayTeam: teamName,
                                teamBadge: '', // We could fetch this too but it's slow
                                isCurrent: false,
                                tenureYear: record.strDeparted || record.strJoined || ''
                            };
                        }
                        return null;
                    }).filter(Boolean);

                    return [base, ...historyResults];
                } catch (innerErr) {
                    return [{
                        ...player,
                        displayTeam: player.strTeam,
                        teamBadge: '',
                        isCurrent: true
                    }];
                }
            }));

            // Check again before updating with full details
            if (currentId === latestSearchId.current) {
                setSearchResults(expandedResults.flat());
            }
        } catch (err) {
            console.error('API Search Error:', err);
            if (currentId === latestSearchId.current) {
                setSearchResults([]);
            }
        } finally {
            if (currentId === latestSearchId.current) {
                setIsSearching(false);
            }
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
        setClubResults([]); // Clear previous

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
        setCountryResults([]); // Clear previous

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

    const handleChange = async (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: name === 'rating' || name === 'goals' || name === 'assists' || name === 'matches' ? Number(value) : value
        }));

        if (name === 'name') {
            if (searchTimeout.current) clearTimeout(searchTimeout.current);
            searchTimeout.current = setTimeout(() => handleSearch(value), 500);
        }

        if (name === 'club') {
            if (clubSearchTimeout.current) clearTimeout(clubSearchTimeout.current);
            clubSearchTimeout.current = setTimeout(() => handleClubSearch(value), 400);
        }

        if (name === 'nationality') {
            if (countrySearchTimeout.current) clearTimeout(countrySearchTimeout.current);
            countrySearchTimeout.current = setTimeout(() => handleCountrySearch(value), 300);
        }

        if (name === 'league' && isCustomLeague) {
            // Fetch logo for custom league on blur would be better, 
            // but we can do it with a small debounce or just on blur.
            // Let's implement handleBlur or just a timeout here too.
        }
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

        // Try to fetch better league logo if needed
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

    const handleSelectPlayer = async (version) => {
        setShowResults(false);
        setFormData(prev => ({ ...prev, name: version.strPlayer }));

        // Fetch full details
        const details = await getPlayerDetails(version.idPlayer);
        if (details) {
            const targetTeam = version.displayTeam;

            // Fetch Team for logos
            const team = await getTeamDetails(targetTeam);

            // Resolve League Badge (Check team data first, then cached league service)
            let leagueBadge = team?.strLeagueBadge || '';
            if (!leagueBadge && team?.strLeague) {
                const leagueInfo = await searchLeagues(team.strLeague);
                leagueBadge = leagueInfo?.strBadge || '';
            }

            setFormData(prev => ({
                ...prev,
                nationality: details.strNationality || prev.nationality,
                club: targetTeam || prev.club,
                league: team?.strLeague || prev.league,
                age: details.dateBorn ? calculateAge(details.dateBorn, version.tenureYear) : prev.age,
                strongFoot: (details.strSide === 'Left' || details.strSide === 'Right') ? details.strSide : prev.strongFoot,
                position: (() => {
                    const pos = details.strPosition || '';
                    if (pos === 'Left Wing') return 'LWF';
                    if (pos === 'Right Wing') return 'RWF';
                    if (pos === 'Attacking Midfield') return 'AMF';
                    if (pos === 'Second Striker') return 'SS';
                    if (pos === 'Left Midfield') return 'LMF';
                    if (pos === 'Right Midfield') return 'RMF';
                    if (pos === 'Defensive Midfield') return 'DMF';
                    if (pos === 'Left-Back') return 'LB';
                    if (pos === 'Right-Back') return 'RB';

                    if (pos === 'Forward') return 'CF';
                    if (pos === 'Midfielder') return 'CMF';
                    if (pos === 'Defender') return 'CB';
                    if (pos === 'Goalkeeper') return 'GK';
                    return prev.position;
                })(),
                logos: {
                    ...prev.logos,
                    club: team?.strBadge || '',
                    league: leagueBadge,
                    country: getFlagUrl(details.strNationality)
                }
            }));
        }
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setFormData(prev => ({ ...prev, image: reader.result }));
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onAdd(formData);
        setFormData({
            name: '',
            cardType: 'Normal',
            nationality: '',
            club: '',
            league: '',
            rating: 80,
            position: 'CF',
            matches: 0,
            goals: 0,
            assists: 0,
            playstyle: 'Goal Poacher',
            image: '',
            age: '',
            strongFoot: 'Right',
            logos: { club: '', league: '', country: '' }
        });
    };

    return (
        <form onSubmit={handleSubmit} className="bg-ef-card p-6 md:p-8 rounded-3xl border border-white/10 space-y-6 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-ef-accent to-ef-blue"></div>

            {onClose && (
                <button
                    type="button"
                    onClick={onClose}
                    className="absolute top-4 left-4 md:left-auto md:right-4 z-50 p-2 md:p-2.5 rounded-xl bg-black/40 md:bg-white/5 hover:bg-black/60 md:hover:bg-white/10 text-white transition-all active:scale-95 border border-white/10"
                >
                    <span className="hidden md:block">✕</span>
                    <span className="md:hidden text-xl font-bold">←</span>
                </button>
            )}

            <h3 className="text-2xl font-black mb-6 flex items-center gap-3">
                <span className="text-ef-accent">✍️</span>
                <span className="bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">Player Recruitment</span>
            </h3>

            <div className="flex flex-col md:flex-row gap-8">
                {/* Profile Image Section */}
                <div className="flex-shrink-0 space-y-4 pt-2">
                    <div className="relative group/photo">
                        <label className="block text-xs font-black uppercase tracking-widest opacity-40 mb-4 ml-1">Player Photo</label>

                        {/* THE AURA */}
                        {formData.image && (
                            <div className="absolute left-1/2 top-[calc(50%+16px)] -translate-x-1/2 -translate-y-1/2 w-[140%] h-[120%] z-0 pointer-events-none transition-all duration-700">
                                <div className={`absolute inset-0 blur-[60px] opacity-40 rounded-full scale-110 ${formData.cardType?.toLowerCase() === 'legendary' ? 'bg-yellow-500/30' :
                                    formData.cardType?.toLowerCase() === 'epic' ? 'bg-green-500/30' :
                                        formData.cardType?.toLowerCase() === 'featured' ? 'bg-purple-500/30' : 'bg-blue-500/30'}`}></div>
                                <img src={formData.image} className="w-full h-full object-cover blur-[50px] opacity-25 scale-125 rounded-full" alt="" />
                            </div>
                        )}

                        <div
                            className={`relative w-40 h-52 rounded-2xl border-2 ${formData.image ? 'border-white/20' : 'border-dashed border-white/10'} bg-white/5 flex flex-col items-center justify-center cursor-pointer hover:border-ef-accent/50 hover:bg-white/10 transition-all z-10 overflow-hidden shadow-2xl`}
                            onClick={() => document.getElementById('player-image-upload').click()}
                        >
                            {formData.image ? (
                                <div className="absolute inset-0 w-full h-full">
                                    {/* Internal Light Leaks / Effects */}
                                    <div className="absolute inset-0 z-[1] pointer-events-none">
                                        <div className={`absolute inset-0 bg-gradient-to-tr ${getCardStyles(formData.cardType).leak} opacity-60`}></div>
                                        <div className={`absolute -top-1/2 -left-1/2 w-[200%] h-[200%] bg-gradient-to-br ${getCardStyles(formData.cardType).leak} opacity-30 blur-3xl animate-pulse`}></div>
                                        <div className={`absolute inset-0 ${getCardStyles(formData.cardType).flare} opacity-30`}></div>

                                        {/* Animated Shine Sweep */}
                                        <div className="absolute inset-0 pointer-events-none">
                                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full animate-shine-slow"></div>
                                        </div>
                                    </div>

                                    <img src={formData.image} alt="Preview" className="w-full h-full object-cover relative z-10" />
                                </div>
                            ) : (
                                <div className="flex flex-col items-center gap-2 text-white/20 group-hover:text-ef-accent/60 transition-colors">
                                    <span className="text-4xl">👤</span>
                                    <span className="text-[10px] font-bold uppercase tracking-tighter">Upload Photo</span>
                                </div>
                            )}
                            <div className="absolute inset-0 z-20 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <span className="text-xs font-bold text-white bg-ef-accent/20 px-3 py-1 rounded-full border border-ef-accent/40 backdrop-blur-sm">
                                    {formData.image ? 'Change' : 'Choose'}
                                </span>
                            </div>
                        </div>
                        <input
                            id="player-image-upload"
                            type="file" accept="image/*"
                            onChange={handleImageChange}
                            className="hidden"
                        />
                    </div>

                    <div className="w-40">
                        <label className="block text-[8px] font-black uppercase tracking-widest opacity-30 mb-1.5">Or Paste Image Link</label>
                        <input
                            type="text"
                            placeholder="https://..."
                            value={formData.image && !formData.image.startsWith('data:') ? formData.image : ''}
                            onChange={(e) => setFormData(prev => ({ ...prev, image: e.target.value }))}
                            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-[10px] text-white focus:outline-none focus:border-ef-accent/40 transition-all font-medium"
                        />
                    </div>
                </div>

                {/* Top Row Details */}
                <div className="flex-1 space-y-6">
                    <div className="space-y-4">
                        <div className="relative">
                            <label className="block text-xs font-black uppercase tracking-widest opacity-40 mb-2 whitespace-nowrap">Full Name</label>
                            <div className="relative">
                                <input
                                    type="text" name="name" required
                                    placeholder="e.g. Lionel Messi"
                                    value={formData.name} onChange={handleChange}
                                    onBlur={() => setTimeout(() => setShowResults(false), 200)}
                                    onFocus={() => formData.name.length >= 3 && setShowResults(true)}
                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-ef-accent focus:ring-4 focus:ring-ef-accent/10 transition-all font-bold"
                                />
                                {isSearching && (
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2">
                                        <div className="w-4 h-4 border-2 border-ef-accent border-t-transparent rounded-full animate-spin"></div>
                                    </div>
                                )}
                            </div>

                            {/* Autocomplete Dropdown */}
                            {showResults && (
                                <div className="absolute z-50 w-full mt-2 bg-[#1a1a1e] border border-white/10 rounded-xl shadow-2xl overflow-hidden backdrop-blur-xl">
                                    {searchResults.length > 0 ? (
                                        searchResults.map(player => (
                                            <div
                                                key={`${player.idPlayer}-${player.displayTeam}`}
                                                onClick={() => handleSelectPlayer(player)}
                                                className="px-4 py-4 hover:bg-white/5 cursor-pointer flex items-center gap-4 transition-colors border-b border-white/5 last:border-0 group/item"
                                            >
                                                <div className="relative shrink-0">
                                                    <img src={player.strCutout || player.strThumb} alt="" className="w-12 h-12 rounded-full bg-black/20 object-cover border border-white/10" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-3 mb-1">
                                                        <div className="text-base font-black text-white truncate max-w-[180px]">
                                                            {player.strPlayer}
                                                        </div>
                                                        <div className="flex items-center gap-2 shrink-0">
                                                            {player.teamBadge && (
                                                                <img src={player.teamBadge} alt="" className="w-7 h-7 object-contain drop-shadow-lg" title={player.displayTeam} />
                                                            )}
                                                            <img
                                                                src={getFlagUrl(player.strNationality)}
                                                                alt=""
                                                                className="w-6 h-4 object-cover rounded-sm opacity-90 border border-white/10 shadow-sm"
                                                                title={player.strNationality}
                                                            />
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <div className="text-[10px] uppercase font-black tracking-widest opacity-40 group-hover/item:opacity-70 transition-opacity truncate">
                                                            {player.displayTeam} | {player.strNationality}
                                                        </div>
                                                        {player.isCurrent ?
                                                            <span className="text-[8px] bg-ef-accent/20 text-ef-accent px-1.5 py-0.5 rounded font-black uppercase tracking-tighter">Current</span> :
                                                            <span className="text-[8px] bg-white/5 text-white/40 px-1.5 py-0.5 rounded font-black uppercase tracking-tighter">Legacy</span>
                                                        }
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        !isSearching && formData.name.length >= 3 && (
                                            <div className="px-6 py-10 text-center">
                                                <div className="text-3xl mb-2">🕵️‍♂️</div>
                                                <div className="text-sm font-bold text-white/60">No players found</div>
                                                <div className="text-[10px] uppercase tracking-widest opacity-30 mt-1">Try a different name</div>
                                            </div>
                                        )
                                    )}
                                </div>
                            )}
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div>
                                <label className="block text-xs font-black uppercase tracking-widest opacity-40 mb-2 whitespace-nowrap">Type</label>
                                <select
                                    name="cardType"
                                    value={formData.cardType} onChange={handleChange}
                                    className="w-full bg-[#111114] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-ef-accent transition-all font-bold text-sm"
                                >
                                    {['Normal', 'Legend', 'Epic', 'Featured', 'POTW', 'BigTime', 'ShowTime'].map(type => (
                                        <option key={type} value={type} className="bg-ef-dark">{type}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-black uppercase tracking-widest opacity-40 mb-2 whitespace-nowrap">Position</label>
                                <select
                                    name="position"
                                    value={formData.position} onChange={handleChange}
                                    className="w-full bg-[#111114] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-ef-accent transition-all font-bold text-sm"
                                >
                                    {['CF', 'SS', 'LWF', 'RWF', 'LMF', 'RMF', 'AMF', 'CMF', 'DMF', 'LB', 'RB', 'CB', 'GK'].map(pos => (
                                        <option key={pos} value={pos}>{pos}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="col-span-1">
                                <label className="block text-xs font-black uppercase tracking-widest opacity-40 mb-2 whitespace-nowrap">Playstyle</label>
                                <select
                                    name="playstyle"
                                    value={formData.playstyle} onChange={handleChange}
                                    className="w-full bg-[#111114] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-ef-accent transition-all font-bold text-sm"
                                >
                                    {PLAYSTYLES.map(style => (
                                        <option key={style} value={style} className="bg-ef-dark">{style}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-black uppercase tracking-widest opacity-40 mb-2 whitespace-nowrap text-center">Rating</label>
                                <input
                                    type="number" name="rating" min="50" max="111"
                                    value={formData.rating} onChange={handleChange}
                                    className="w-full bg-[#111114] border border-white/10 rounded-xl px-4 py-3 text-ef-accent focus:outline-none focus:border-ef-accent transition-all font-black text-center text-sm"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Row 2: Clubs, League, Nat, Age */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="relative">
                    <label className="block text-xs font-black uppercase tracking-widest opacity-40 mb-2">Club</label>
                    <div className="relative">
                        <input
                            type="text" name="club"
                            placeholder="Club Name"
                            value={formData.club} onChange={handleChange}
                            onBlur={() => setTimeout(() => setShowClubResults(false), 200)}
                            onFocus={() => formData.club.length >= 2 && setShowClubResults(true)}
                            className="w-full bg-[#111114] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-ef-accent transition-all font-bold text-sm"
                        />
                        {isSearchingClub && (
                            <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                <div className="w-3 h-3 border-2 border-ef-accent border-t-transparent rounded-full animate-spin"></div>
                            </div>
                        )}
                    </div>

                    {showClubResults && (
                        <div className="absolute z-50 w-full mt-2 bg-[#1a1a1e] border border-white/10 rounded-xl shadow-2xl overflow-hidden max-h-[240px] overflow-y-auto">
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

                <div className="relative" ref={leaguePopupRef}>
                    <div className="flex justify-between items-center mb-2">
                        <label className="block text-xs font-black uppercase tracking-widest opacity-40">League</label>
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
                            autoFocus
                            value={formData.league} onChange={handleChange}
                            onBlur={handleLeagueBlur}
                            className="w-full bg-[#111114] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-ef-accent transition-all font-bold text-sm"
                        />
                    ) : (
                        <div className="relative">
                            <button
                                type="button"
                                onClick={() => setIsLeaguePopupOpen(!isLeaguePopupOpen)}
                                className="w-full bg-[#111114] border border-white/10 rounded-xl px-4 py-3 text-white flex items-center justify-between hover:border-white/20 transition-all group"
                            >
                                <div className="flex items-center gap-1 overflow-hidden">
                                    {formData.league && leagueLogos[formData.league] ? (
                                        <img src={leagueLogos[formData.league]} alt="" className="w-4 h-4 object-contain flex-shrink-0" />
                                    ) : (
                                        <div className="w-4 h-4 rounded bg-white/5 flex items-center justify-center text-[8px] font-black opacity-40 flex-shrink-0">
                                            ?
                                        </div>
                                    )}
                                    <span className={`font-bold text-[11px] truncate ${formData.league ? 'text-white' : 'text-white/30'}`}>
                                        {formData.league || 'League'}
                                    </span>
                                </div>
                                <span className={`text-[8px] transition-transform ${isLeaguePopupOpen ? 'rotate-180' : ''}`}>▼</span>
                            </button>

                            {/* Popup Overlay - Text Dropdown */}
                            {isLeaguePopupOpen && (
                                <div className="absolute bottom-full left-0 w-64 mb-2 bg-[#1a1a1e] border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-[100] animate-slide-up backdrop-filter-none max-h-[250px] overflow-y-auto">
                                    <div className="text-[10px] font-black uppercase tracking-widest opacity-40 py-3 px-4 border-b border-white/5 bg-white/5 sticky top-0 z-10">Top Leagues</div>
                                    <div className="flex flex-col">
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
                                                className={`flex items-center gap-3 px-4 py-3 text-left transition-all hover:bg-white/5 border-b border-white/5 last:border-0 ${formData.league === league
                                                    ? 'bg-ef-accent/10 border-l-2 border-l-ef-accent text-ef-accent font-black'
                                                    : 'text-white/70 font-bold'
                                                    }`}
                                            >
                                                {leagueLogos[league] ? (
                                                    <img src={leagueLogos[league]} alt="" className="w-5 h-5 object-contain opacity-70" />
                                                ) : (
                                                    <div className="w-5 h-5 rounded bg-white/5 flex items-center justify-center text-[8px] font-black opacity-30">
                                                        {league.substring(0, 1)}
                                                    </div>
                                                )}
                                                <span className="text-xs">{league}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div className="relative">
                    <label className="block text-xs font-black uppercase tracking-widest opacity-40 mb-2">Country</label>
                    <div className="relative">
                        <input
                            type="text" name="nationality"
                            placeholder="Country Name"
                            value={formData.nationality} onChange={handleChange}
                            onBlur={() => setTimeout(() => setShowCountryResults(false), 200)}
                            onFocus={() => formData.nationality.length >= 2 && setShowCountryResults(true)}
                            className="w-full bg-[#111114] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-ef-accent transition-all font-bold text-sm"
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
                                !isSearchingCountry && formData.nationality.length >= 2 && (
                                    <div className="px-4 py-6 text-center text-white/40 text-[10px] font-bold uppercase tracking-widest">
                                        No countries found
                                    </div>
                                )
                            )}
                        </div>
                    )}
                </div>
                <div>
                    <label className="block text-xs font-black uppercase tracking-widest opacity-40 mb-2">Age</label>
                    <input
                        type="number" name="age"
                        placeholder="Age"
                        value={formData.age} onChange={handleChange}
                        className="w-full bg-[#111114] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-ef-accent transition-all font-bold text-sm"
                    />
                </div>
            </div>

            {/* Row 3: Foot, Matches, Goals, Assists */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-white/10">
                <div>
                    <label className="block text-xs font-black uppercase tracking-widest opacity-40 mb-3">Strong Foot</label>
                    <div className="flex bg-[#111114] p-1 rounded-xl border border-white/10">
                        {['Left', 'Right'].map(foot => (
                            <button
                                key={foot}
                                type="button"
                                onClick={() => setFormData(prev => ({ ...prev, strongFoot: foot }))}
                                className={`flex-1 py-2 text-[10px] font-black uppercase tracking-tighter rounded-lg transition-all ${formData.strongFoot === foot
                                    ? 'bg-ef-accent text-ef-dark shadow-lg'
                                    : 'text-white/40 hover:text-white/60 hover:bg-white/5'
                                    }`}
                            >
                                {foot}
                            </button>
                        ))}
                    </div>
                </div>
                <div>
                    <label className="block text-xs font-black uppercase tracking-widest opacity-40 mb-2 text-center whitespace-nowrap">Matches</label>
                    <input
                        type="number" name="matches" min="0"
                        value={formData.matches} onChange={handleChange}
                        className="w-full bg-[#111114] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-ef-accent transition-all font-black text-center text-lg"
                    />
                </div>
                <div>
                    <label className="block text-xs font-black uppercase tracking-widest opacity-40 mb-2 text-center">Goals</label>
                    <input
                        type="number" name="goals" min="0"
                        value={formData.goals} onChange={handleChange}
                        className="w-full bg-[#111114] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-ef-accent transition-all font-black text-center text-lg"
                    />
                </div>
                <div>
                    <label className="block text-xs font-black uppercase tracking-widest opacity-40 mb-2 text-center">Assists</label>
                    <input
                        type="number" name="assists" min="0"
                        value={formData.assists} onChange={handleChange}
                        className="w-full bg-[#111114] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-ef-accent transition-all font-black text-center text-lg"
                    />
                </div>
            </div>

            <div className="sticky bottom-0 bg-[#0f0f12] pt-6 pb-2 border-t border-white/5 z-20 mt-4">
                <button
                    type="submit"
                    className="w-full bg-gradient-to-r from-ef-accent to-blue-600 text-ef-dark font-black py-4 rounded-2xl hover:opacity-90 hover:scale-[1.01] transition-all shadow-xl shadow-ef-accent/10 text-lg uppercase tracking-widest"
                >
                    Add to Squad
                </button>
            </div>
        </form>
    );
};

export default PlayerForm;
