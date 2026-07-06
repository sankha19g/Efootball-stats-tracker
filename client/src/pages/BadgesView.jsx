import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { saveAutoMergeRules, getAutoMergeRules } from '../services/playerService';
import { BadgeEditModal, BadgeAddRuleModal } from '../components/BadgeModals';
import { ListFilterPlus } from "lucide-react";



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

// Shared modals are imported from BadgeModals

const BadgesView = ({ players, onUpdateBadge, onAddBadge, onMergeBadge, onAutoMerge, userId }) => {
    const [mode, setMode] = useState('club'); // 'club', 'national', or 'league'
    const [selectedLeague, setSelectedLeague] = useState('All');
    const [search, setSearch] = useState('');
    const [isEditMode, setIsEditMode] = useState(false);
    const [editingBadge, setEditingBadge] = useState(null);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [logoFilter, setLogoFilter] = useState('all'); // 'all', 'withLogo', 'noLogo'
    const [sortBy, setSortBy] = useState('name'); // 'name', 'players'
    const [isMergeMode, setIsMergeMode] = useState(false);
    const [selectedMergeBadges, setSelectedMergeBadges] = useState([]);
    const [selectedBadgePlayers, setSelectedBadgePlayers] = useState(null); // { badge, players }

    const [contextMenu, setContextMenu] = useState(null); // { x: number, y: number, badge: Badge }
    const [addingRuleBadge, setAddingRuleBadge] = useState(null);
    const [showFilterMenu, setShowFilterMenu] = useState(false);
    const filterMenuRef = useRef(null);

    useEffect(() => {
        const handleClose = (e) => {
            setContextMenu(null);
            if (filterMenuRef.current && !filterMenuRef.current.contains(e.target)) {
                setShowFilterMenu(false);
            }
        };
        window.addEventListener('click', handleClose);
        window.addEventListener('contextmenu', handleClose);
        return () => {
            window.removeEventListener('click', handleClose);
            window.removeEventListener('contextmenu', handleClose);
        };
    }, []);

    const handleContextMenu = (e, badge) => {
        e.preventDefault();
        e.stopPropagation();

        // Bounding check to avoid menu going offscreen
        const menuWidth = 224; // w-56
        const menuHeight = 110;
        let x = e.clientX;
        let y = e.clientY;

        if (x + menuWidth > window.innerWidth) {
            x = window.innerWidth - menuWidth - 10;
        }
        if (y + menuHeight > window.innerHeight) {
            y = window.innerHeight - menuHeight - 10;
        }

        setContextMenu({ x, y, badge });
    };

    const handleAddRule = useCallback(async (newRule) => {
        let currentRules = [];
        if (userId) {
            currentRules = await getAutoMergeRules(userId) || [];
        }
        if (currentRules.length === 0) {
            try {
                const saved = localStorage.getItem('ef-auto-merge-rules');
                if (saved) currentRules = JSON.parse(saved);
            } catch { /* ignore */ }
        }
        if (currentRules.length === 0) {
            currentRules = [{ type: 'club', from: '', to: '' }];
        }

        // Clean up empty rule row if it exists
        const isEmptyDefault = currentRules.length === 1 && !currentRules[0].from.trim() && !currentRules[0].to.trim();
        const cleanedRules = isEmptyDefault ? [] : currentRules;

        // Check if rule already exists to avoid duplicates
        const exists = cleanedRules.some(r => r.type === newRule.type && r.from.toLowerCase() === newRule.from.toLowerCase() && r.to.toLowerCase() === newRule.to.toLowerCase());
        if (exists) return;

        const updatedRules = [newRule, ...cleanedRules];

        // Save
        try {
            localStorage.setItem('ef-auto-merge-rules', JSON.stringify(updatedRules));
            if (userId) {
                await saveAutoMergeRules(userId, updatedRules);
            }
        } catch (err) {
            console.error('Failed to save auto merge rule from BadgesView:', err);
        }
    }, [userId]);

    // Build unique sorted suggestion lists from player data
    const suggestions = useMemo(() => {
        const unique = (arr) => [...new Set(arr.filter(Boolean))].sort((a, b) => a.localeCompare(b));
        return {
            club: unique(players.map(p => p.club)),
            league: unique(players.map(p => p.league)),
            national: unique(players.map(p => p.nationality)),
        };
    }, [players]);

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

        // Apply Logo Presence Filter
        if (logoFilter === 'withLogo') {
            activeList = activeList.filter(b => b.logo);
        } else if (logoFilter === 'noLogo') {
            activeList = activeList.filter(b => !b.logo);
        }

        // Apply League Filter (Clubs only)
        if (mode === 'club' && selectedLeague !== 'All') {
            activeList = activeList.filter(b => b.league === selectedLeague);
        }

        // Apply Search
        if (search) {
            const query = search.toLowerCase();
            activeList = activeList.filter(b =>
                b.name.toLowerCase().includes(query) ||
                (b.subtext && b.subtext.toLowerCase().includes(query))
            );
        }

        // Apply Sorting
        return [...activeList].sort((a, b) => {
            if (sortBy === 'players') {
                if (b.count !== a.count) {
                    return b.count - a.count;
                }
            }
            return a.name.localeCompare(b.name);
        });
    }, [mode, clubBadges, nationalBadges, leagueBadges, search, selectedLeague, logoFilter, sortBy]);

    const activeFilterPills = useMemo(() => {
        const pills = [];
        if (search.trim()) {
            pills.push({
                id: 'search',
                label: 'Search',
                value: `"${search}"`,
                clear: () => setSearch('')
            });
        }
        if (selectedLeague !== 'All') {
            pills.push({
                id: 'league',
                label: 'League',
                value: selectedLeague,
                clear: () => setSelectedLeague('All')
            });
        }
        if (logoFilter !== 'all') {
            pills.push({
                id: 'logoFilter',
                label: 'Logos',
                value: logoFilter === 'withLogo' ? 'Hide Empty' : 'Empty Only',
                clear: () => setLogoFilter('all')
            });
        }
        return pills;
    }, [search, selectedLeague, logoFilter]);

    const handleClearAllFilters = () => {
        setSearch('');
        setSelectedLeague('All');
        setLogoFilter('all');
    };

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
            <div className="flex flex-col gap-6 mb-6 bg-ef-card/50 backdrop-blur-xl p-6 rounded-[2rem] border border-white/10 shadow-2xl relative z-30">
                {/* Decorative background blur with overflow containment */}
                <div className="absolute inset-0 rounded-[2rem] overflow-hidden pointer-events-none">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-ef-accent/5 rounded-full blur-[100px] -mr-32 -mt-32 animate-pulse"></div>
                </div>

                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
                    {/* Mode Switcher Slider */}
                    <div className="flex bg-black/40 p-1.5 rounded-2xl border border-white/5 relative h-12 w-full lg:max-w-[400px]">
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
                            className="absolute inset-y-1.5 transition-all duration-500 cubic-bezier(0.4, 0, 0.2, 1) bg-ef-accent rounded-xl shadow-lg shadow-ef-accent/20"
                            style={{
                                left: mode === 'club' ? '6px' : mode === 'national' ? 'calc(33.33% + 4px)' : 'calc(66.66% + 2px)',
                                width: 'calc(33.33% - 8px)'
                            }}
                        ></div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-stretch gap-4 w-full lg:w-auto">
                        <div className="flex items-center gap-2">
                            {/* Add Badge Button */}
                            <button
                                onClick={() => setIsAddModalOpen(true)}
                                className="flex items-center justify-center w-12 h-12 rounded-2xl bg-white/5 border border-white/10 text-ef-accent hover:bg-ef-accent hover:text-ef-dark transition-all group shrink-0"
                                title="Add New Badge"
                            >
                                <span className="text-xl font-black">+</span>
                            </button>

                            {/* Filter Button */}
                            <div className="relative shrink-0" ref={filterMenuRef}>
                                <button
                                    onClick={() => setShowFilterMenu(!showFilterMenu)}
                                    className={`flex items-center justify-center w-12 h-12 rounded-2xl border transition-all ${showFilterMenu ? 'bg-ef-accent text-ef-dark border-transparent shadow-lg shadow-ef-accent/20' : 'bg-white/5 border border-white/10 text-white/40 hover:text-white hover:bg-white/10'}`}
                                    title="Filters"
                                >
                                    <span className="text-lg"><ListFilterPlus /></span>
                                </button>

                                {/* Filters Dropdown */}
                                {showFilterMenu && (
                                    <div className="absolute top-full right-0 mt-3 w-72 bg-[#121216]/95 border border-white/10 rounded-2xl shadow-2xl p-4 z-[140] animate-slide-up cursor-default backdrop-blur-xl text-white">
                                        <div className="flex items-center justify-between mb-4 border-b border-white/5 pb-2">
                                            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40">Filter Options</h3>
                                            <button
                                                onClick={() => {
                                                    setSelectedLeague('All');
                                                    setLogoFilter('all');
                                                    setSortBy('name');
                                                }}
                                                className="text-[8px] font-black uppercase text-ef-accent hover:opacity-60 transition-opacity"
                                            >
                                                Reset
                                            </button>
                                        </div>

                                        <div className="space-y-4">
                                            {/* League Filter (Club Mode Only) */}
                                            {mode === 'club' && (
                                                <div className="space-y-2">
                                                    <label className="block text-[9px] font-black uppercase tracking-widest text-white/40">League</label>
                                                    <div className="relative group w-full shrink-0">
                                                        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                                                            <span className="text-white/20 group-hover:text-ef-accent transition-colors text-xs">🏆</span>
                                                        </div>
                                                        <select
                                                            value={selectedLeague}
                                                            onChange={(e) => setSelectedLeague(e.target.value)}
                                                            className="w-full bg-black/40 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-xs font-black uppercase tracking-widest text-white outline-none focus:border-ef-accent/50 appearance-none cursor-pointer transition-all hover:bg-black/60 shadow-inner"
                                                        >
                                                            {leaguesList.map(league => (
                                                                <option key={league} value={league} className="bg-ef-card text-white uppercase tracking-widest text-[10px] py-2">{league === 'All' ? 'All Leagues' : league}</option>
                                                            ))}
                                                        </select>
                                                        <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none">
                                                            <span className="text-[8px] text-white/25 group-hover:text-ef-accent transition-colors">▼</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Sort Options */}
                                            <div className="space-y-2">
                                                <label className="block text-[9px] font-black uppercase tracking-widest text-white/40">Sort By</label>
                                                <div className="relative group w-full shrink-0">
                                                    <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                                                        <span className="text-white/20 group-hover:text-ef-accent transition-colors text-xs">🎛️</span>
                                                    </div>
                                                    <select
                                                        value={sortBy}
                                                        onChange={(e) => setSortBy(e.target.value)}
                                                        className="w-full bg-black/40 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-xs font-black uppercase tracking-widest text-white outline-none focus:border-ef-accent/50 appearance-none cursor-pointer transition-all hover:bg-black/60 shadow-inner"
                                                    >
                                                        <option value="name" className="bg-ef-card text-white uppercase tracking-widest text-[10px] py-2">Alphabetical Order</option>
                                                        <option value="players" className="bg-ef-card text-white uppercase tracking-widest text-[10px] py-2">Total Players</option>
                                                    </select>
                                                    <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none">
                                                        <span className="text-[8px] text-white/25 group-hover:text-ef-accent transition-colors">▼</span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Missing Logos Filter */}
                                            <div className="space-y-2">
                                                <label className="block text-[9px] font-black uppercase tracking-widest text-white/40">Missing Logos</label>
                                                <div className="flex flex-col gap-2.5 bg-black/20 px-4 py-3 rounded-xl border border-white/5">
                                                    <label className="flex items-center gap-3 cursor-pointer group">
                                                        <div className="relative w-4 h-4 shrink-0">
                                                            <input
                                                                type="radio"
                                                                name="logoFilter"
                                                                checked={logoFilter === 'all'}
                                                                onChange={() => setLogoFilter('all')}
                                                                className="hidden"
                                                            />
                                                            <div className={`absolute inset-0 rounded-full border-2 transition-all ${logoFilter === 'all' ? 'border-ef-accent' : 'border-white/20 group-hover:border-white/40'}`}></div>
                                                            <div className={`absolute inset-1 rounded-full bg-ef-accent transition-all transform ${logoFilter === 'all' ? 'scale-100 opacity-100' : 'scale-0 opacity-0'}`}></div>
                                                        </div>
                                                        <span className={`text-[9px] font-black uppercase tracking-widest transition-colors ${logoFilter === 'all' ? 'text-white' : 'text-white/40 group-hover:text-white'}`}>Show All</span>
                                                    </label>

                                                    <label className="flex items-center gap-3 cursor-pointer group">
                                                        <div className="relative w-4 h-4 shrink-0">
                                                            <input
                                                                type="radio"
                                                                name="logoFilter"
                                                                checked={logoFilter === 'withLogo'}
                                                                onChange={() => setLogoFilter('withLogo')}
                                                                className="hidden"
                                                            />
                                                            <div className={`absolute inset-0 rounded-full border-2 transition-all ${logoFilter === 'withLogo' ? 'border-ef-accent' : 'border-white/20 group-hover:border-white/40'}`}></div>
                                                            <div className={`absolute inset-1 rounded-full bg-ef-accent transition-all transform ${logoFilter === 'withLogo' ? 'scale-100 opacity-100' : 'scale-0 opacity-0'}`}></div>
                                                        </div>
                                                        <span className={`text-[9px] font-black uppercase tracking-widest transition-colors ${logoFilter === 'withLogo' ? 'text-white' : 'text-white/40 group-hover:text-white'}`}>Hide Empty</span>
                                                    </label>

                                                    <label className="flex items-center gap-3 cursor-pointer group">
                                                        <div className="relative w-4 h-4 shrink-0">
                                                            <input
                                                                type="radio"
                                                                name="logoFilter"
                                                                checked={logoFilter === 'noLogo'}
                                                                onChange={() => setLogoFilter('noLogo')}
                                                                className="hidden"
                                                            />
                                                            <div className={`absolute inset-0 rounded-full border-2 transition-all ${logoFilter === 'noLogo' ? 'border-ef-accent' : 'border-white/20 group-hover:border-white/40'}`}></div>
                                                            <div className={`absolute inset-1 rounded-full bg-ef-accent transition-all transform ${logoFilter === 'noLogo' ? 'scale-100 opacity-100' : 'scale-0 opacity-0'}`}></div>
                                                        </div>
                                                        <span className={`text-[9px] font-black uppercase tracking-widest transition-colors ${logoFilter === 'noLogo' ? 'text-white' : 'text-white/40 group-hover:text-white'}`}>Empty Only</span>
                                                    </label>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
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

                <div className="flex flex-col md:flex-row items-center justify-start gap-6 border-t border-white/5 pt-6">
                    {/* Action buttons */}
                    <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                        <button
                            onClick={onAutoMerge}
                            className="flex items-center gap-3 px-6 py-3.5 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all bg-white/5 border border-white/10 text-ef-accent/70 hover:bg-ef-accent/10 hover:text-ef-accent hover:border-ef-accent/30"
                        >
                            <span>🤖 Auto Merge</span>
                        </button>

                        <button
                            onClick={() => {
                                setIsMergeMode(!isMergeMode);
                                setIsEditMode(false);
                                setSelectedMergeBadges([]);
                            }}
                            className={`flex items-center gap-3 px-6 py-3.5 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all ${isMergeMode ? 'bg-ef-accent text-ef-dark shadow-lg shadow-ef-accent/20' : 'bg-white/5 border border-white/10 text-white/40 hover:bg-white/10 hover:text-white'}`}
                        >
                            <span>{isMergeMode ? '✕ Cancel Merge' : '🔗 Merge Badges'}</span>
                        </button>

                        <button
                            onClick={() => {
                                setIsEditMode(!isEditMode);
                                setIsMergeMode(false);
                            }}
                            className={`flex items-center gap-3 px-6 py-3.5 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all ${isEditMode ? 'bg-ef-accent text-ef-dark shadow-lg shadow-ef-accent/20' : 'bg-white/5 border border-white/10 text-white/40 hover:bg-white/10 hover:text-white'}`}
                        >
                            <span>{isEditMode ? '✕ Cancel Edit' : '✏️ Edit Badges'}</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Active Filters Bar */}
            {activeFilterPills.length > 0 && (
                <div className="mb-6 px-6 py-3.5 bg-ef-card/30 border border-white/10 rounded-[1.5rem] flex flex-wrap gap-2 items-center animate-fade-in relative z-20">
                    <div className="flex flex-wrap gap-2 items-center">
                        {activeFilterPills.map(pill => (
                            <div
                                key={pill.id}
                                className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/5 border border-white/10 rounded-full text-[11px] font-bold tracking-tight text-white/50 hover:border-white/20 transition-all"
                            >
                                <span>{pill.label}</span>
                                <span className="opacity-30">|</span>
                                <span className="text-white">{pill.value}</span>
                                <button
                                    onClick={pill.clear}
                                    className="ml-1 hover:text-ef-accent text-white/40 transition-colors font-black text-xs leading-none"
                                    title={`Clear ${pill.label} filter`}
                                >
                                    ×
                                </button>
                            </div>
                        ))}
                    </div>
                    <button
                        onClick={handleClearAllFilters}
                        className="text-[9px] font-black uppercase text-ef-accent hover:opacity-80 transition-opacity ml-auto"
                    >
                        Clear All
                    </button>
                </div>
            )}

            {/* Collection Gallery count */}
            <div className="flex items-center justify-between mb-8 px-4">
                <p className="text-[10px] uppercase font-black tracking-[0.3em] text-ef-accent/60">
                    Collection Gallery — {filteredBadges.length} Items Found
                </p>
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
                                else {
                                    const badgePlayers = players
                                        .filter(p => {
                                            if (mode === 'club') return p.club === badge.name;
                                            if (mode === 'national') return p.nationality === badge.name;
                                            return p.league === badge.name;
                                        })
                                        .sort((a, b) => a.name.localeCompare(b.name));
                                    setSelectedBadgePlayers({ badge, players: badgePlayers });
                                }
                            }}
                            onContextMenu={(e) => handleContextMenu(e, badge)}
                            className="group relative animate-slide-up cursor-pointer"
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
            {isMergeMode === 'finalizing' && createPortal(
                <BadgeMergeModal
                    selectedBadges={selectedMergeBadges}
                    type={mode}
                    onClose={() => setIsMergeMode(true)}
                    onMerge={async (...args) => {
                        await onMergeBadge(...args);
                        setIsMergeMode(false);
                        setSelectedMergeBadges([]);
                    }}
                />,
                document.body
            )}



            {/* Edit Modal */}
            {editingBadge && createPortal(
                <BadgeEditModal
                    badge={editingBadge}
                    type={mode}
                    suggestions={suggestions}
                    onClose={() => setEditingBadge(null)}
                    onUpdate={onUpdateBadge}
                />,
                document.body
            )}

            {/* Add Modal */}
            {isAddModalOpen && createPortal(
                <BadgeAddModal
                    type={mode}
                    onClose={() => setIsAddModalOpen(false)}
                    onAdd={onAddBadge}
                />,
                document.body
            )}

            {/* Context Menu */}
            {contextMenu && createPortal(
                <div
                    className="fixed z-[400] bg-[#121216]/95 backdrop-blur-xl border border-white/10 rounded-xl p-4 shadow-2xl w-60 animate-in fade-in zoom-in-95 duration-100 text-white"
                    style={{
                        top: contextMenu.y,
                        left: contextMenu.x,
                    }}
                >
                    <h4 className="text-[11px] font-black uppercase tracking-widest text-ef-accent mb-3 border-b border-white/5 pb-1">
                        Badge Options
                    </h4>
                    <div className="space-y-1">
                        <button
                            onClick={() => {
                                setEditingBadge(contextMenu.badge);
                                setContextMenu(null);
                            }}
                            className="w-full text-left px-3 py-2 rounded-lg hover:bg-white/5 transition-all text-[10px] font-black uppercase tracking-widest flex items-center gap-2.5 text-white/70 hover:text-white"
                        >
                            <span>✏️</span> Edit Badge
                        </button>
                        <button
                            onClick={() => {
                                setAddingRuleBadge(contextMenu.badge);
                                setContextMenu(null);
                            }}
                            className="w-full text-left px-3 py-2 rounded-lg hover:bg-white/5 transition-all text-[10px] font-black uppercase tracking-widest flex items-center gap-2.5 text-white/70 hover:text-white"
                        >
                            <span>🤖</span> Add to Merge Rules
                        </button>
                    </div>
                </div>,
                document.body
            )}

            {/* Add Rule Modal */}
            {addingRuleBadge && createPortal(
                <BadgeAddRuleModal
                    badge={addingRuleBadge}
                    initialType={mode}
                    suggestions={suggestions}
                    onClose={() => setAddingRuleBadge(null)}
                    onAddRule={handleAddRule}
                />,
                document.body
            )}

            {/* Players List Popup Modal */}
            {selectedBadgePlayers && createPortal(
                <div 
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[500] flex items-center justify-center p-4 animate-fade-in"
                    onClick={() => setSelectedBadgePlayers(null)}
                >
                    <div 
                        className="bg-[#121216]/95 border border-white/10 rounded-2xl p-5 w-full max-w-xs shadow-2xl max-h-[70vh] flex flex-col animate-scale-in backdrop-blur-xl text-white cursor-default"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between gap-4 border-b border-white/5 pb-3 mb-2 shrink-0">
                            <div className="flex items-center gap-2.5 min-w-0">
                                {selectedBadgePlayers.badge.logo ? (
                                    <img src={selectedBadgePlayers.badge.logo} alt="" className="w-8 h-8 object-contain shrink-0" />
                                ) : (
                                    <span className="text-xl shrink-0">{mode === 'club' ? '🛡️' : mode === 'national' ? '🌍' : '🏆'}</span>
                                )}
                                <h4 className="text-xs font-black uppercase tracking-wider text-white truncate">
                                    {selectedBadgePlayers.badge.name}
                                </h4>
                            </div>
                            
                            {/* Small box with total players */}
                            <div className="bg-ef-accent/15 border border-ef-accent/30 px-2 py-0.5 rounded text-ef-accent font-black text-[9px] uppercase tracking-wider shrink-0">
                                {selectedBadgePlayers.players.length}
                            </div>
                        </div>

                        {/* Players List: simple, no gap/space, no border, small text */}
                        <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar min-h-0">
                            <div className="text-[10px] text-white/60 font-medium">
                                {selectedBadgePlayers.players.length > 0 ? (
                                    selectedBadgePlayers.players.map((p, idx) => (
                                        <div key={p.id || idx} className="py-[1px] hover:text-white transition-colors truncate">
                                            {p.name}
                                        </div>
                                    ))
                                ) : (
                                    <div className="py-4 text-center text-white/20 italic">No players found</div>
                                )}
                            </div>
                        </div>

                        {/* Close button */}
                        <button 
                            onClick={() => setSelectedBadgePlayers(null)}
                            className="mt-3.5 w-full py-2 bg-white/5 border border-white/10 hover:bg-white/10 text-white/60 hover:text-white rounded-xl text-[9px] font-black uppercase tracking-widest transition-all shrink-0"
                        >
                            Close
                        </button>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
};

export default BadgesView;
