import { useState, useMemo, useCallback } from 'react';

const BadgeEditModal = ({ badge, type, onClose, onUpdate }) => {
    const [name, setName] = useState(badge.name);
    const [logo, setLogo] = useState(badge.logo);
    const [league, setLeague] = useState(badge.league || '');

    const handleSubmit = (e) => {
        e.preventDefault();
        onUpdate(badge.name, name, logo, type, league);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[300] flex items-center justify-center p-4 animate-fade-in text-white">
            <div className="w-full max-w-md bg-ef-card rounded-[2.5rem] border border-white/10 shadow-2xl overflow-hidden animate-slide-up">
                <div className="p-8 border-b border-white/5 flex items-center justify-between bg-black/20">
                    <h3 className="text-xl font-black uppercase tracking-tighter italic text-white flex items-center gap-3">
                        <span className="text-ef-accent">✏️</span> Edit {type === 'club' ? 'Club' : type === 'league' ? 'League' : 'Nation'}
                    </h3>
                    <button onClick={onClose} className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white/40 hover:text-white transition-all">✕</button>
                </div>

                <form onSubmit={handleSubmit} className="p-8 space-y-6">
                    <div className="flex justify-center mb-4">
                        <div className="relative w-24 h-24 bg-black/40 rounded-3xl border border-white/10 flex items-center justify-center p-4 shadow-inner">
                            {logo ? (
                                <img src={logo} alt="Preview" className="w-full h-full object-contain drop-shadow-lg" />
                            ) : (
                                <span className="text-white/10 text-4xl">{type === 'club' ? '🛡️' : type === 'national' ? '🌍' : '🏆'}</span>
                            )}
                        </div>
                    </div>

                    <div>
                        <label className="block text-[10px] font-black uppercase tracking-widest text-white/40 mb-2 ml-1">Name</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full bg-black/40 border border-white/10 rounded-2xl px-5 py-4 text-sm font-bold text-white outline-none focus:border-ef-accent/50 transition-all shadow-inner"
                            required
                        />
                    </div>

                    {type === 'club' && (
                        <div>
                            <label className="block text-[10px] font-black uppercase tracking-widest text-white/40 mb-2 ml-1">League</label>
                            <input
                                type="text"
                                value={league}
                                onChange={(e) => setLeague(e.target.value)}
                                className="w-full bg-black/40 border border-white/10 rounded-2xl px-5 py-4 text-sm font-bold text-white outline-none focus:border-ef-accent/50 transition-all shadow-inner"
                                required
                            />
                        </div>
                    )}

                    <div>
                        <label className="block text-[10px] font-black uppercase tracking-widest text-white/40 mb-2 ml-1">Logo URL</label>
                        <input
                            type="text"
                            value={logo}
                            onChange={(e) => setLogo(e.target.value)}
                            className="w-full bg-black/40 border border-white/10 rounded-2xl px-5 py-4 text-sm font-bold text-white outline-none focus:border-ef-accent/50 transition-all shadow-inner"
                        />
                    </div>

                    <div className="pt-4 flex gap-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-4 px-6 rounded-2xl bg-white/5 border border-white/10 text-white font-black uppercase tracking-widest text-[10px] transition-all hover:bg-white/10"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="flex-1 py-4 px-6 rounded-2xl bg-ef-accent text-ef-dark font-black uppercase tracking-widest text-[10px] transition-all shadow-lg shadow-ef-accent/20 hover:scale-[1.02] active:scale-95"
                        >
                            Save Changes
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};


const BadgeMergeModal = ({ selectedBadges, type, onClose, onMerge }) => {
    const [name, setName] = useState(selectedBadges[0].name);
    const [logo, setLogo] = useState(selectedBadges[0].logo);
    const [league, setLeague] = useState(selectedBadges[0].league || '');

    const handleSubmit = (e) => {
        e.preventDefault();
        const oldValues = selectedBadges.map(b => b.name);
        onMerge(oldValues, name, logo, type, league);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[300] flex items-center justify-center p-4 animate-fade-in">
            <div className="w-full max-w-2xl bg-ef-card rounded-[2.5rem] border border-white/10 shadow-2xl overflow-hidden animate-slide-up">
                <div className="p-8 border-b border-white/5 flex items-center justify-between bg-black/20">
                    <h3 className="text-xl font-black uppercase tracking-tighter italic text-white flex items-center gap-3">
                        <span className="text-ef-accent">🔗</span> Merge {selectedBadges.length} Badges
                    </h3>
                    <button onClick={onClose} className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white/40 hover:text-white transition-all">✕</button>
                </div>

                <form onSubmit={handleSubmit} className="p-8 space-y-8 overflow-y-auto max-h-[70vh]">
                    {/* Final Result Preview */}
                    <div className="bg-black/40 p-6 rounded-[2rem] border border-ef-accent/20 flex items-center gap-6">
                        <div className="w-20 h-20 bg-black/40 rounded-3xl border border-white/10 flex items-center justify-center p-4 shadow-inner shrink-0">
                            {logo ? (
                                <img src={logo} alt="Preview" className="w-full h-full object-contain drop-shadow-lg" />
                            ) : (
                                <span className="text-white/10 text-4xl">{type === 'club' ? '🛡️' : type === 'national' ? '🌍' : '🏆'}</span>
                            )}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-[10px] font-black uppercase tracking-widest text-ef-accent mb-1">Final Result</p>
                            <h4 className="text-xl font-black text-white truncate uppercase">{name}</h4>
                            <p className="text-xs text-white/40 font-bold truncate uppercase">{type === 'club' ? league : type === 'league' ? 'Official League' : 'National Team'}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Name Selection */}
                        <div className="space-y-4">
                            <label className="block text-[10px] font-black uppercase tracking-widest text-white/40 ml-1">Choose Final Name</label>
                            <div className="space-y-2">
                                {selectedBadges.map(b => (
                                    <button
                                        key={b.name}
                                        type="button"
                                        onClick={() => setName(b.name)}
                                        className={`w-full p-4 rounded-2xl text-left text-sm font-bold uppercase transition-all ${name === b.name ? 'bg-ef-accent text-ef-dark border-transparent' : 'bg-white/5 border border-white/10 text-white/60 hover:bg-white/10'}`}
                                    >
                                        {b.name}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Logo Selection */}
                        <div className="space-y-4">
                            <label className="block text-[10px] font-black uppercase tracking-widest text-white/40 ml-1">Choose Final Logo</label>
                            <div className="grid grid-cols-4 gap-2">
                                {selectedBadges.map((b, i) => (
                                    <button
                                        key={i}
                                        type="button"
                                        onClick={() => setLogo(b.logo)}
                                        className={`w-full aspect-square rounded-2xl p-2 flex items-center justify-center transition-all ${logo === b.logo ? 'bg-ef-accent/20 border-ef-accent shadow-[0_0_20px_rgba(58,255,204,0.2)]' : 'bg-white/5 border border-white/10 hover:bg-white/10'}`}
                                    >
                                        {b.logo ? (
                                            <img src={b.logo} alt="" className="w-full h-full object-contain" />
                                        ) : (
                                            <span className="text-xl opacity-20">{type === 'club' ? '🛡️' : type === 'national' ? '🌍' : '🏆'}</span>
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* League Selection (Club only) */}
                        {type === 'club' && (
                            <div className="space-y-4 md:col-span-2">
                                <label className="block text-[10px] font-black uppercase tracking-widest text-white/40 ml-1">Choose Final League</label>
                                <div className="flex flex-wrap gap-2">
                                    {[...new Set(selectedBadges.map(b => b.league))].map(l => (
                                        <button
                                            key={l}
                                            type="button"
                                            onClick={() => setLeague(l)}
                                            className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${league === l ? 'bg-ef-accent text-ef-dark' : 'bg-white/5 border border-white/10 text-white/60 hover:bg-white/10'}`}
                                        >
                                            {l}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="pt-6 border-t border-white/5 flex gap-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-4 px-6 rounded-2xl bg-white/5 border border-white/10 text-white font-black uppercase tracking-widest text-[10px] transition-all hover:bg-white/10"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="flex-1 py-4 px-6 rounded-2xl bg-ef-accent text-ef-dark font-black uppercase tracking-widest text-[10px] transition-all shadow-lg shadow-ef-accent/20 hover:scale-[1.02] active:scale-95"
                        >
                            Merge All into One
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const BadgeAddModal = ({ type, onClose, onAdd }) => {
    const [name, setName] = useState('');
    const [logo, setLogo] = useState('');
    const [league, setLeague] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();

        const templatePlayer = {
            name: `Player - ${name}`,
            rating: 60,
            position: 'GK',
            cardType: 'Standard',
            playstyle: 'Goal Poacher',
            age: 25,
            height: 180,
            foot: 'Right',
            condition: 'B',
            // Specific badge data
            ...(type === 'club' ? {
                club: name,
                league: league || 'Other',
                logos: { club: logo, country: '', league: '' },
                club_badge_url: logo,
                nationality: 'Unknown'
            } : type === 'league' ? {
                league: name,
                logos: { league: logo, club: '', country: '' },
                club: 'Free Agent',
                nationality: 'Unknown'
            } : {
                nationality: name,
                logos: { country: logo, club: '', league: '' },
                nationality_flag_url: logo,
                club: 'Free Agent',
                league: 'Free Agent'
            }),
            tags: ['badge_template']
        };

        onAdd(templatePlayer);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[300] flex items-center justify-center p-4 animate-fade-in">
            <div className="w-full max-w-md bg-ef-card rounded-[2.5rem] border border-white/10 shadow-2xl overflow-hidden animate-slide-up">
                <div className="p-8 border-b border-white/5 flex items-center justify-between bg-black/20">
                    <h3 className="text-xl font-black uppercase tracking-tighter italic text-white flex items-center gap-3">
                        <span className="text-ef-accent">✨</span> Add {type === 'club' ? 'Club' : type === 'league' ? 'League' : 'Nation'}
                    </h3>
                    <button onClick={onClose} className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white/40 hover:text-white transition-all">✕</button>
                </div>

                <form onSubmit={handleSubmit} className="p-8 space-y-6">
                    <div className="flex justify-center mb-4">
                        <div className="relative w-24 h-24 bg-black/40 rounded-3xl border border-white/10 flex items-center justify-center p-4 shadow-inner">
                            {logo ? (
                                <img src={logo} alt="Preview" className="w-full h-full object-contain drop-shadow-lg" />
                            ) : (
                                <span className="text-white/10 text-4xl">{type === 'club' ? '🛡️' : type === 'national' ? '🌍' : '🏆'}</span>
                            )}
                        </div>
                    </div>

                    <div>
                        <label className="block text-[10px] font-black uppercase tracking-widest text-white/40 mb-2 ml-1">Name</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full bg-black/40 border border-white/10 rounded-2xl px-5 py-4 text-sm font-bold text-white outline-none focus:border-ef-accent/50 transition-all shadow-inner"
                            placeholder={type === 'club' ? "e.g., Real Madrid" : type === 'league' ? "e.g., Premier League" : "e.g., Argentina"}
                            required
                        />
                    </div>

                    {type === 'club' && (
                        <div>
                            <label className="block text-[10px] font-black uppercase tracking-widest text-white/40 mb-2 ml-1">League</label>
                            <input
                                type="text"
                                value={league}
                                onChange={(e) => setLeague(e.target.value)}
                                className="w-full bg-black/40 border border-white/10 rounded-2xl px-5 py-4 text-sm font-bold text-white outline-none focus:border-ef-accent/50 transition-all shadow-inner"
                                placeholder="e.g., Spanish League"
                                required
                            />
                        </div>
                    )}

                    <div>
                        <label className="block text-[10px] font-black uppercase tracking-widest text-white/40 mb-2 ml-1">Logo URL</label>
                        <input
                            type="text"
                            value={logo}
                            onChange={(e) => setLogo(e.target.value)}
                            className="w-full bg-black/40 border border-white/10 rounded-2xl px-5 py-4 text-sm font-bold text-white outline-none focus:border-ef-accent/50 transition-all shadow-inner"
                            placeholder="Paste image URL..."
                        />
                    </div>

                    <div className="pt-4 flex gap-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-4 px-6 rounded-2xl bg-white/5 border border-white/10 text-white font-black uppercase tracking-widest text-[10px] transition-all hover:bg-white/10"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="flex-1 py-4 px-6 rounded-2xl bg-ef-accent text-ef-dark font-black uppercase tracking-widest text-[10px] transition-all shadow-lg shadow-ef-accent/20 hover:scale-[1.02] active:scale-95"
                        >
                            Create Badge
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const BadgesView = ({ players, onUpdateBadge, onAddBadge, onMergeBadge }) => {
    const [mode, setMode] = useState('club'); // 'club', 'national', or 'league'
    const [selectedLeague, setSelectedLeague] = useState('All');
    const [search, setSearch] = useState('');
    const [isEditMode, setIsEditMode] = useState(false);
    const [editingBadge, setEditingBadge] = useState(null);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [showNoLogo, setShowNoLogo] = useState(true);
    const [isMergeMode, setIsMergeMode] = useState(false);
    const [selectedMergeBadges, setSelectedMergeBadges] = useState([]);


    const clubBadges = useMemo(() => {
        const clubs = new Map();
        players.forEach(p => {
            const clubName = p.club;
            if (!clubName) return;

            const logo = p.logos?.club || p.club_badge_url || '';
            const existing = clubs.get(clubName);

            if (!existing) {
                clubs.set(clubName, {
                    name: clubName,
                    logo: logo,
                    league: p.league || 'Unknown League',
                    subtext: p.league || 'Unknown League',
                    count: 1
                });
            } else {
                existing.count += 1;
                if (!existing.logo && logo) {
                    existing.logo = logo;
                }
            }
        });
        return Array.from(clubs.values()).sort((a, b) => a.name.localeCompare(b.name));
    }, [players]);

    const leaguesList = useMemo(() => {
        const leagues = new Set();
        clubBadges.forEach(b => leagues.add(b.league));
        return ['All', ...Array.from(leagues).sort()];
    }, [clubBadges]);

    const leagueBadges = useMemo(() => {
        const leagues = new Map();
        players.forEach(p => {
            const leagueName = p.league;
            if (!leagueName || leagueName === 'Free Agent') return;

            const logo = p.logos?.league || '';
            const existing = leagues.get(leagueName);

            if (!existing) {
                leagues.set(leagueName, {
                    name: leagueName,
                    logo: logo,
                    subtext: 'Official League',
                    count: 1
                });
            } else {
                existing.count += 1;
                if (!existing.logo && logo) {
                    existing.logo = logo;
                }
            }
        });
        return Array.from(leagues.values()).sort((a, b) => a.name.localeCompare(b.name));
    }, [players]);

    const nationalBadges = useMemo(() => {
        const nations = new Map();
        players.forEach(p => {
            const nationName = p.nationality;
            if (!nationName) return;

            const logo = p.logos?.country || p.nationality_flag_url || '';
            const existing = nations.get(nationName);

            if (!existing) {
                nations.set(nationName, {
                    name: nationName,
                    logo: logo,
                    subtext: 'National Team',
                    count: 1
                });
            } else {
                nations.get(nationName).count += 1;
                if (!existing.logo && logo) {
                    existing.logo = logo;
                }
            }
        });
        return Array.from(nations.values()).sort((a, b) => a.name.localeCompare(b.name));
    }, [players]);

    const filteredBadges = useMemo(() => {
        let activeList = [];
        if (mode === 'club') activeList = clubBadges;
        else if (mode === 'national') activeList = nationalBadges;
        else activeList = leagueBadges;

        // Apply No Logo Filter
        if (!showNoLogo) {
            activeList = activeList.filter(b => b.logo);
        }

        // Apply League Filter (Clubs only)
        if (mode === 'club' && selectedLeague !== 'All') {
            activeList = activeList.filter(b => b.league === selectedLeague);
        }

        // Apply Search
        if (!search) return activeList;
        const query = search.toLowerCase();
        return activeList.filter(b =>
            b.name.toLowerCase().includes(query) ||
            (b.subtext && b.subtext.toLowerCase().includes(query))
        );
    }, [mode, clubBadges, nationalBadges, leagueBadges, search, selectedLeague, showNoLogo]);

    const handleModeSwitch = (newMode) => {
        setMode(newMode);
        setSelectedLeague('All'); // Reset league when switching modes
        setIsMergeMode(false);
        setSelectedMergeBadges([]);
    };

    const toggleBadgeSelection = useCallback((badge) => {
        setSelectedMergeBadges(prev => {
            const exists = prev.find(b => b.name === badge.name);
            if (exists) {
                return prev.filter(b => b.name !== badge.name);
            } else {
                return [...prev, badge];
            }
        });
    }, []);


    return (
        <div className="max-w-6xl mx-auto animate-fade-in relative">
            {/* Header section */}
            <div className="flex flex-col gap-8 mb-10 bg-ef-card/50 backdrop-blur-xl p-8 rounded-[2.5rem] border border-white/10 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-ef-accent/5 rounded-full blur-[100px] -mr-32 -mt-32 animate-pulse"></div>

                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                    <div className="flex items-start justify-between lg:justify-start gap-4">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <span className="text-2xl">
                                    {mode === 'club' ? '🛡️' : mode === 'national' ? '🌍' : '🏆'}
                                </span>
                                <h2 className="text-3xl font-black bg-gradient-to-r from-white via-white to-white/40 bg-clip-text text-transparent uppercase italic tracking-tighter">
                                    Badges
                                </h2>
                            </div>
                            <p className="text-[10px] uppercase font-black tracking-[0.3em] text-ef-accent">Collection Gallery — {filteredBadges.length} Items Found</p>
                        </div>

                        {/* Edit Mode Toggle Button */}
                        <button
                            onClick={() => setIsEditMode(!isEditMode)}
                            className={`lg:hidden w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${isEditMode ? 'bg-ef-accent text-ef-dark shadow-lg shadow-ef-accent/20' : 'bg-white/5 border border-white/10 text-white/40'}`}
                        >
                            {isEditMode ? '✕' : '✏️'}
                        </button>
                    </div>

                    <div className="flex flex-col sm:flex-row items-stretch gap-4 w-full lg:w-auto">
                        {/* Edit Toggle (Desktop) */}
                        {/* Merge Mode Toggle Button */}
                        <button
                            onClick={() => {
                                setIsMergeMode(!isMergeMode);
                                setIsEditMode(false);
                                setSelectedMergeBadges([]);
                            }}
                            className={`hidden lg:flex items-center gap-3 px-6 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all ${isMergeMode ? 'bg-ef-accent text-ef-dark shadow-lg' : 'bg-white/5 border border-white/10 text-white/40 hover:bg-white/10 hover:text-white'}`}
                        >
                            <span>{isMergeMode ? '✕ Cancel Merge' : '🔗 Merge Badges'}</span>
                        </button>

                        <button
                            onClick={() => {
                                setIsEditMode(!isEditMode);
                                setIsMergeMode(false);
                            }}
                            className={`hidden lg:flex items-center gap-3 px-6 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all ${isEditMode ? 'bg-ef-accent text-ef-dark shadow-lg' : 'bg-white/5 border border-white/10 text-white/40 hover:bg-white/10 hover:text-white'}`}
                        >
                            <span>{isEditMode ? '✕ Cancel Edit' : '✏️ Edit Badges'}</span>
                        </button>


                        <div className="flex items-center gap-2">
                            {/* Add Badge Button */}
                            <button
                                onClick={() => setIsAddModalOpen(true)}
                                className="flex items-center justify-center w-12 h-12 rounded-2xl bg-white/5 border border-white/10 text-ef-accent hover:bg-ef-accent hover:text-ef-dark transition-all group shrink-0"
                                title="Add New Badge"
                            >
                                <span className="text-xl font-black">+</span>
                            </button>

                            {/* League Filter (Club Mode Only) */}
                            {mode === 'club' && (
                                <div className="relative group shrink-0">
                                    <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                                        <span className="text-white/20 group-hover:text-ef-accent transition-colors">🏆</span>
                                    </div>
                                    <select
                                        value={selectedLeague}
                                        onChange={(e) => setSelectedLeague(e.target.value)}
                                        className="w-40 sm:w-56 bg-black/40 border border-white/10 rounded-2xl pl-12 pr-4 py-4 text-xs font-black uppercase tracking-widest text-white outline-none focus:border-ef-accent/50 appearance-none cursor-pointer transition-all hover:bg-black/60 shadow-inner"
                                    >
                                        {leaguesList.map(league => (
                                            <option key={league} value={league} className="bg-ef-card text-white uppercase tracking-widest text-[10px] py-4">{league === 'All' ? 'All Leagues' : league}</option>
                                        ))}
                                    </select>
                                    <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none">
                                        <span className="text-[8px] text-white/20 group-hover:text-ef-accent transition-colors">▼</span>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Search Input */}
                        <div className="relative flex-1 lg:w-80 group">
                            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                                <span className="text-white/20 group-focus-within:text-ef-accent transition-colors">🔍</span>
                            </div>
                            <input
                                type="text"
                                placeholder={`Search ${mode === 'club' ? 'club' : mode === 'national' ? 'nation' : 'league'}...`}
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full bg-black/40 border border-white/10 rounded-2xl px-12 py-4 text-sm font-bold text-white outline-none focus:border-ef-accent/50 transition-all placeholder:text-white/10 shadow-inner group-hover:bg-black/60"
                            />
                        </div>
                    </div>
                </div>

                {/* Merge Action Row */}
                {isMergeMode === true && selectedMergeBadges.length >= 2 && (
                    <div className="flex items-center justify-center p-4 bg-ef-accent/10 border-t border-white/5 animate-fade-in rounded-2xl">
                        <button
                            onClick={() => setIsMergeMode('finalizing')}
                            className="bg-ef-accent text-ef-dark px-12 py-4 rounded-[2rem] font-black uppercase italic tracking-tighter hover:scale-105 transition-all shadow-xl shadow-ef-accent/20 flex items-center gap-3"
                        >
                            <span>Finalize Merge</span>
                            <span className="bg-ef-dark/20 px-3 py-1 rounded-full text-[10px]">{selectedMergeBadges.length} Selected</span>
                        </button>
                    </div>
                )}


                <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                    {/* Mode Switcher Slider */}
                    <div className="flex bg-black/40 p-1.5 rounded-2xl border border-white/5 relative h-12 w-full max-w-[500px]">
                        <button
                            onClick={() => handleModeSwitch('club')}
                            className={`flex-1 relative z-10 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${mode === 'club' ? 'text-ef-dark' : 'text-white/30 hover:text-white'}`}
                        >
                            Club
                        </button>
                        <button
                            onClick={() => handleModeSwitch('national')}
                            className={`flex-1 relative z-10 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${mode === 'national' ? 'text-ef-dark' : 'text-white/30 hover:text-white'}`}
                        >
                            National
                        </button>
                        <button
                            onClick={() => handleModeSwitch('league')}
                            className={`flex-1 relative z-10 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${mode === 'league' ? 'text-ef-dark' : 'text-white/30 hover:text-white'}`}
                        >
                            League
                        </button>

                        {/* Sliding Background */}
                        <div
                            className={`absolute inset-y-1.5 transition-all duration-500 cubic-bezier(0.4, 0, 0.2, 1) bg-ef-accent rounded-xl shadow-lg shadow-ef-accent/20`}
                            style={{
                                left: mode === 'club' ? '6px' : mode === 'national' ? 'calc(33.33% + 4px)' : 'calc(66.66% + 2px)',
                                width: 'calc(33.33% - 8px)'
                            }}
                        ></div>
                    </div>

                    {/* No Logo Filter Radios */}
                    <div className="flex items-center gap-6 bg-black/20 px-6 py-3 rounded-2xl border border-white/5">
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30">Missing Logos:</span>
                        <div className="flex items-center gap-4">
                            <label className="flex items-center gap-2 cursor-pointer group">
                                <div className="relative w-4 h-4">
                                    <input
                                        type="radio"
                                        name="logoFilter"
                                        checked={showNoLogo}
                                        onChange={() => setShowNoLogo(true)}
                                        className="hidden"
                                    />
                                    <div className={`absolute inset-0 rounded-full border-2 transition-all ${showNoLogo ? 'border-ef-accent' : 'border-white/20 group-hover:border-white/40'}`}></div>
                                    <div className={`absolute inset-1 rounded-full bg-ef-accent transition-all transform ${showNoLogo ? 'scale-100 opacity-100' : 'scale-0 opacity-0'}`}></div>
                                </div>
                                <span className={`text-[10px] font-black uppercase tracking-widest transition-colors ${showNoLogo ? 'text-white' : 'text-white/20 group-hover:text-white/40'}`}>Show All</span>
                            </label>

                            <label className="flex items-center gap-2 cursor-pointer group">
                                <div className="relative w-4 h-4">
                                    <input
                                        type="radio"
                                        name="logoFilter"
                                        checked={!showNoLogo}
                                        onChange={() => setShowNoLogo(false)}
                                        className="hidden"
                                    />
                                    <div className={`absolute inset-0 rounded-full border-2 transition-all ${!showNoLogo ? 'border-ef-accent' : 'border-white/20 group-hover:border-white/40'}`}></div>
                                    <div className={`absolute inset-1 rounded-full bg-ef-accent transition-all transform ${!showNoLogo ? 'scale-100 opacity-100' : 'scale-0 opacity-0'}`}></div>
                                </div>
                                <span className={`text-[10px] font-black uppercase tracking-widest transition-colors ${!showNoLogo ? 'text-white' : 'text-white/20 group-hover:text-white/40'}`}>Hide Empty</span>
                            </label>
                        </div>
                    </div>
                </div>
            </div>

            {/* Grid display */}
            {filteredBadges.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
                    {filteredBadges.map((badge, idx) => (
                        <div
                            key={badge.name}
                            onClick={() => {
                                if (isMergeMode === true) toggleBadgeSelection(badge);
                                else if (isEditMode) setEditingBadge(badge);
                            }}
                            className={`group relative animate-slide-up ${isEditMode || isMergeMode === true ? 'cursor-pointer' : ''}`}
                            style={{ animationDelay: `${idx * 0.05}s` }}
                        >
                            <div className={`bg-ef-card border rounded-[2rem] p-6 flex flex-col items-center gap-4 transition-all duration-500 overflow-hidden ${isEditMode ? 'border-ef-accent/50 bg-white/5 animate-pulse-slow' : isMergeMode === true && selectedMergeBadges.find(b => b.name === badge.name) ? 'border-ef-accent bg-ef-accent/5 ring-1 ring-ef-accent' : 'border-white/10 hover:border-ef-accent/40 hover:bg-white/5 hover:-translate-y-2 hover:shadow-[0_20px_40px_rgba(0,0,0,0.4)]'}`}>
                                {/* Selection checkmark for merge mode */}
                                {isMergeMode === true && selectedMergeBadges.find(b => b.name === badge.name) && (
                                    <div className="absolute top-4 right-4 w-6 h-6 bg-ef-accent rounded-lg flex items-center justify-center text-ef-dark text-[10px] font-black animate-scale-in">✓</div>
                                )}

                                {/* Gradient background accent */}
                                <div className="absolute inset-0 bg-gradient-to-b from-ef-accent/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>

                                {isEditMode && (
                                    <div className="absolute top-4 right-4 text-ef-accent text-xs">✏️</div>
                                )}

                                {/* Player Count Badge (Only visible on hover) */}
                                <div className="absolute top-4 left-4 z-20 flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/40 border border-white/10 backdrop-blur-md opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-1 group-hover:translate-x-0">
                                    <span className="text-ef-accent text-[9px]">👤</span>
                                    <span className="text-[9px] font-black tracking-widest text-white">{badge.count}</span>
                                </div>

                                {/* Logo with shadow effect */}
                                <div className="relative">
                                    <div className="absolute inset-0 bg-black/20 blur-xl rounded-full scale-75 group-hover:scale-110 transition-transform"></div>
                                    {badge.logo ? (
                                        <img
                                            src={badge.logo}
                                            alt={badge.name}
                                            className="w-20 h-20 object-contain relative drop-shadow-[0_10px_10px_rgba(0,0,0,0.3)] group-hover:drop-shadow-[0_15px_15px_rgba(0,0,0,0.5)] transition-all duration-500 transform group-hover:scale-110"
                                            loading="lazy"
                                        />
                                    ) : (
                                        <div className="w-20 h-20 flex items-center justify-center relative transform group-hover:scale-110 transition-transform">
                                            <span className="text-4xl filter drop-shadow-lg opacity-40 group-hover:opacity-100 transition-opacity">
                                                {mode === 'club' ? '🛡️' : mode === 'national' ? '🌍' : '🏆'}
                                            </span>
                                        </div>
                                    )}
                                </div>

                                <div className="text-center relative z-10 w-full">
                                    <h3 className="text-[11px] font-black uppercase tracking-widest text-white leading-tight mb-1 truncate group-hover:text-ef-accent transition-colors">
                                        {badge.name}
                                    </h3>
                                    <p className="text-[8px] font-bold text-white/30 truncate uppercase tracking-tighter">
                                        {badge.subtext}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="py-32 text-center bg-ef-card/20 border border-dashed border-white/5 rounded-3xl animate-fade-in">
                    <span className="text-4xl block mb-4 opacity-20">{mode === 'club' ? '🛡️' : '🌍'}</span>
                    <p className="text-white/20 font-black uppercase tracking-widest text-xs">No badges matching your search</p>
                    <button
                        onClick={() => {
                            setSearch('');
                            setSelectedLeague('All');
                            setShowNoLogo(true);
                        }}
                        className="mt-6 px-6 py-2 rounded-full bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all text-white/40"
                    >
                        Clear Filters
                    </button>
                </div>
            )}

            {/* Merge Modal */}
            {isMergeMode === 'finalizing' && (
                <BadgeMergeModal
                    selectedBadges={selectedMergeBadges}
                    type={mode}
                    onClose={() => setIsMergeMode(true)}
                    onMerge={async (...args) => {
                        await onMergeBadge(...args);
                        setIsMergeMode(false);
                        setSelectedMergeBadges([]);
                    }}
                />
            )}



            {/* Edit Modal */}
            {editingBadge && (
                <BadgeEditModal
                    badge={editingBadge}
                    type={mode}
                    onClose={() => setEditingBadge(null)}
                    onUpdate={onUpdateBadge}
                />
            )}

            {/* Add Modal */}
            {isAddModalOpen && (
                <BadgeAddModal
                    type={mode}
                    onClose={() => setIsAddModalOpen(false)}
                    onAdd={onAddBadge}
                />
            )}
        </div>
    );
};

export default BadgesView;
