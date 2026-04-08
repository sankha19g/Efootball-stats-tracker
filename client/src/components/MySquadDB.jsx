import { useState, useMemo, useEffect } from 'react';
import { PLAYSTYLES, PLAYER_SKILLS, SPECIAL_SKILLS } from '../constants';

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

const MySquadDB = ({ players, onBack, onImport }) => {
    const [search, setSearch] = useState('');

    const [showSettings, setShowSettings] = useState(false);
    const [showExport, setShowExport] = useState(false);
    const [showFilters, setShowFilters] = useState(false);
    const [conciseMode, setConciseMode] = useState(() => {
        const saved = localStorage.getItem('ef-mysquad-concise');
        return saved === 'true';
    });
    const [filters, setFilters] = useState({
        sortBy: 'rating',
        sortOrder: 'desc',
        posFilter: 'all',
        includeSecondary: false,
        cardType: 'all',
        inactive: false,
        league: '',
        club: '',
        nationality: '',
        rating: '',
        playstyle: 'all',
        skill: 'all',
        missing: 'all'
    });

    const [visibleCols, setVisibleCols] = useState(() => {
        const saved = localStorage.getItem('ef-mysquad-cols');
        return saved ? JSON.parse(saved) : {
            image: true,
            name: true,
            pos: true,
            rating: true,
            playstyle: true,
            club: true,
            league: true,
            nationality: true,
            card: true,
            id: true,
            height: false,
            weight: false,
            age: false,
            strongFoot: false,
            createdAt: true,
            weakUsage: false,
            weakAccuracy: false,
            form: false,
            injury: false,
            featured: false,
            dateAdded: true
        };
    });

    const colLabels = [
        { id: 'image', label: 'Photo' },
        { id: 'name', label: 'Player Name' },
        { id: 'id', label: 'Player ID' },
        { id: 'pos', label: 'Position' },
        { id: 'rating', label: 'Rating' },
        { id: 'height', label: 'Height' },
        { id: 'weight', label: 'Weight' },
        { id: 'age', label: 'Age' },
        { id: 'strongFoot', label: 'Foot' },
        { id: 'playstyle', label: 'Playstyle' },
        { id: 'club', label: 'Club' },
        { id: 'league', label: 'League' },
        { id: 'nationality', label: 'Nationality' },
        { id: 'card', label: 'Card Type' },
        { id: 'createdAt', label: 'Uploaded' },
        { id: 'dateAdded', label: 'Date Added' },
        { id: 'weakUsage', label: 'Weak Foot Usage' },
        { id: 'weakAccuracy', label: 'Weak Foot Accuracy' },
        { id: 'form', label: 'Form' },
        { id: 'injury', label: 'Injury Resistance' },
        { id: 'featured', label: 'Featured Players' }
    ];

    useEffect(() => {
        localStorage.setItem('ef-mysquad-cols', JSON.stringify(visibleCols));
    }, [visibleCols]);

    useEffect(() => {
        localStorage.setItem('ef-mysquad-concise', conciseMode);
    }, [conciseMode]);

    const filteredPlayers = useMemo(() => {
        let result = [...players];

        // 1. Search Filter
        if (search.trim()) {
            const query = search.toLowerCase();
            result = result.filter(p => 
                p.name?.toLowerCase().includes(query) ||
                p.club?.toLowerCase().includes(query) ||
                p.league?.toLowerCase().includes(query) ||
                p.nationality?.toLowerCase().includes(query) ||
                p.position?.toLowerCase().includes(query) ||
                (p.tags && p.tags.some(tag => tag.toLowerCase().includes(query)))
            );
        }

        // 2. Comprehensive Filters
        if (filters.posFilter !== 'all') {
            if (filters.includeSecondary) {
                result = result.filter(p => 
                    p.position === filters.posFilter || 
                    (p.secondaryPosition && p.secondaryPosition.toUpperCase().includes(filters.posFilter.toUpperCase()))
                );
            } else {
                result = result.filter(p => p.position === filters.posFilter);
            }
        }

        if (filters.cardType !== 'all') {
            result = result.filter(p => p.cardType === filters.cardType);
        }

        if (filters.inactive) {
            result = result.filter(p => (p.matches || 0) === 0);
        }

        if (filters.league) {
            result = result.filter(p => p.league?.toLowerCase().includes(filters.league.toLowerCase()));
        }

        if (filters.club) {
            result = result.filter(p => p.club?.toLowerCase().includes(filters.club.toLowerCase()));
        }

        if (filters.nationality) {
            result = result.filter(p => p.nationality?.toLowerCase().includes(filters.nationality.toLowerCase()));
        }

        if (filters.rating) {
            result = result.filter(p => p.rating?.toString() === filters.rating.toString());
        }

        if (filters.playstyle !== 'all') {
            result = result.filter(p => p.playstyle === filters.playstyle);
        }

        if (filters.skill !== 'all') {
            result = result.filter(p => {
                const pSkills = [...(p.skills || []), ...(p.additionalSkills || [])];
                if (filters.skill === 'Any Special Skill') {
                    return pSkills.some(s => SPECIAL_SKILLS.includes(s));
                }
                return pSkills.includes(filters.skill);
            });
        }

        if (filters.missing !== 'all') {
            result = result.filter(p => {
                switch(filters.missing) {
                    case 'Missing Picture': return !p.image;
                    case 'Missing Player ID': return !p.playerId && !p.pesdb_id;
                    case 'Missing Playstyle': return !p.playstyle || p.playstyle === 'None';
                    case 'Missing Card Type': return !p.cardType || p.cardType === 'Normal';
                    case 'Missing Club': return !p.club;
                    case 'Missing League': return !p.league;
                    case 'Missing Club Badge': return !p.logos?.club && !p.club_badge_url;
                    case 'Missing Country Badge': return !p.logos?.country && !p.nationality_flag_url;
                    case 'Missing Age': return !p.age;
                    case 'Missing Height': return !p.height;
                    case 'Missing Tags': return !p.tags || p.tags.length === 0;
                    case 'Missing Foot': return !p.strongFoot;
                    case 'No Skills Found': return (!p.skills || p.skills.length === 0);
                    case 'No Additional Skills': return (!p.additionalSkills || p.additionalSkills.length === 0);
                    case 'Incomplete Additional Skills': return p.additionalSkills && p.additionalSkills.length > 0 && p.additionalSkills.length < 5;
                    default: return true;
                }
            });
        }

        // 3. Sorting
        result.sort((a, b) => {
            let valA, valB;

            switch(filters.sortBy) {
                case 'rating':
                    valA = Number(a.rating) || 0;
                    valB = Number(b.rating) || 0;
                    break;
                case 'dateAdded':
                case 'dateAdded_desc':
                case 'dateAdded_asc':
                    valA = parseEfDate(a.DateAdded || a['Date Added'] || a.createdAt || 0)?.getTime() || 0;
                    valB = parseEfDate(b.DateAdded || b['Date Added'] || b.createdAt || 0)?.getTime() || 0;
                    break;
                case 'goals':
                    valA = Number(a.goals) || 0;
                    valB = Number(b.goals) || 0;
                    break;
                case 'assists':
                    valA = Number(a.assists) || 0;
                    valB = Number(b.assists) || 0;
                    break;
                case 'name':
                    valA = String(a.name || '').toLowerCase();
                    valB = String(b.name || '').toLowerCase();
                    break;
                case 'position':
                    valA = String(a.position || '').toLowerCase();
                    valB = String(b.position || '').toLowerCase();
                    break;
                default:
                    valA = String(a[filters.sortBy] || '').toLowerCase();
                    valB = String(b[filters.sortBy] || '').toLowerCase();
            }

            const isDateAsc = filters.sortBy === 'dateAdded_asc';
            const isDateDesc = filters.sortBy === 'dateAdded_desc';
            
            let order;
            if (isDateAsc) order = 1;
            else if (isDateDesc) order = -1;
            else order = filters.sortOrder === 'asc' ? 1 : -1;
            
            if (valA < valB) return -1 * order;
            if (valA > valB) return 1 * order;
            return 0;
        });

        return result;
    }, [players, search, filters]);

    const toggleCol = (col) => {
        setVisibleCols(prev => ({ ...prev, [col]: !prev[col] }));
    };

    const handleExport = (format) => {
        // Prepare data based on visible columns
        const exportData = filteredPlayers.map((p, idx) => {
            const entry = { "#": idx + 1 };
            if (visibleCols.image) entry.Photo = p.image || '';
            if (visibleCols.name) entry.Name = p.name || '';
            if (visibleCols.id) entry.ID = p.playerId || p.pesdb_id || '';
            if (visibleCols.pos) entry.Position = p.position || '';
            if (visibleCols.rating) entry.Rating = p.rating || '';
            if (visibleCols.height) entry.Height = p.height || '';
            if (visibleCols.weight) entry.Weight = p.weight || '';
            if (visibleCols.age) entry.Age = p.age || '';
            if (visibleCols.strongFoot) entry.Foot = p.strongFoot || '';
            if (visibleCols.playstyle) entry.Playstyle = p.playstyle || '';
            if (visibleCols.club) entry.Club = p.club || '';
            if (visibleCols.league) entry.League = p.league || '';
            if (visibleCols.nationality) entry.Nationality = p.nationality || '';
            if (visibleCols.card) entry.CardType = p.cardType || '';
            if (visibleCols.weakUsage) entry.WFUsage = p.weakFootUsage || '';
            if (visibleCols.weakAccuracy) entry.WFAccuracy = p.weakFootAccuracy || '';
            if (visibleCols.form) entry.Condition = p.conditioning || '';
            if (visibleCols.injury) entry.InjuryRes = p.injuryResistance || '';
            if (visibleCols.createdAt) entry.DateAdded = p.createdAt ? new Date(p.createdAt).toLocaleDateString() : '';
            return entry;
        });

        if (format === 'json') {
            const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `efootball_squad_${new Date().toISOString().split('T')[0]}.json`;
            a.click();
            URL.revokeObjectURL(url);
        } else if (format === 'excel') {
            // CSV is best for simple Excel export without heavy libraries
            const headers = Object.keys(exportData[0] || {}).join(',');
            const rows = exportData.map(row => 
                Object.values(row).map(val => `"${String(val).replace(/"/g, '""')}"`).join(',')
            ).join('\n');
            const csv = `${headers}\n${rows}`;
            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `efootball_squad_${new Date().toISOString().split('T')[0]}.csv`;
            a.click();
            URL.revokeObjectURL(url);
        }
        setShowExport(false);
    };

    return (
        <div className="fixed inset-0 z-[120] bg-[#0a0f16] flex flex-col text-white animate-fade-in font-outfit">
            {/* Header */}
            <header className="p-4 md:p-6 border-b border-white/10 bg-[#0a0a0c]/80 backdrop-blur-xl flex flex-col md:flex-row gap-4 items-center justify-between sticky top-0 z-[130]">
                <div className="flex items-center gap-4 w-full md:w-auto">
                    <button onClick={onBack} className="p-2 hover:bg-white/10 rounded-xl transition-colors">
                        <span className="text-2xl">←</span>
                    </button>
                    <div>
                        <h1 className="text-xl font-black tracking-tighter bg-gradient-to-r from-ef-accent to-ef-blue bg-clip-text text-transparent uppercase">
                            My Squad DB
                        </h1>
                        <p className="text-[10px] font-bold opacity-40 uppercase tracking-widest">{filteredPlayers.length} / {players.length} Players</p>
                    </div>
                </div>

                <div className="flex flex-1 max-w-3xl w-full gap-2 items-center h-14 relative group/search">
                    {/* Filter Button */}
                    <button 
                        onClick={() => {
                            setShowFilters(!showFilters);
                            setShowSettings(false);
                            setShowExport(false);
                        }}
                        className={`w-14 h-full rounded-2xl flex items-center justify-center border transition-all ${showFilters ? 'bg-ef-blue border-ef-blue text-white' : 'bg-white/5 border-white/10 text-white/40 hover:text-white hover:bg-white/10'}`}
                        title="Sort & Filter"
                    >
                        <span className="text-xl">📊</span>
                    </button>

                    <div className="flex flex-1 h-full bg-white/5 border border-white/10 rounded-2xl overflow-hidden focus-within:border-ef-accent/50 transition-all shadow-inner">
                        <span className="p-4 opacity-30 flex items-center">🔍</span>
                        <input
                            type="text"
                            placeholder="Search in your squad..."
                            className="w-full bg-transparent border-none outline-none py-4 text-sm font-bold placeholder:text-white/20"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            autoFocus
                        />
                    </div>

                    {/* Filter Panel */}
                    {showFilters && (
                        <div className="absolute top-full left-0 mt-3 w-[min(90vw,700px)] bg-[#121216] border border-white/10 rounded-2xl shadow-2xl p-6 z-[140] animate-slide-up cursor-default max-h-[80vh] overflow-y-auto custom-scrollbar">
                             <div className="flex items-center justify-between mb-6 px-1">
                                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40">Squad Explorer Filters</h3>
                                <button 
                                    onClick={() => setFilters({
                                        sortBy: 'rating',
                                        sortOrder: 'desc',
                                        posFilter: 'all',
                                        includeSecondary: false,
                                        cardType: 'all',
                                        inactive: false,
                                        league: '',
                                        club: '',
                                        nationality: '',
                                        rating: '',
                                        playstyle: 'all',
                                        skill: 'all',
                                        missing: 'all'
                                    })}
                                    className="text-[9px] font-black uppercase text-ef-accent hover:opacity-60 transition-opacity"
                                >
                                    Clear All Filters
                                </button>
                             </div>

                             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {/* Left Side: Primary Filters */}
                                <div className="space-y-6">
                                    <div>
                                        <label className="block text-[10px] font-black uppercase tracking-widest opacity-40 mb-3">Position</label>
                                        <select 
                                            value={filters.posFilter}
                                            onChange={(e) => setFilters(prev => ({ ...prev, posFilter: e.target.value }))}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-xs font-bold text-white outline-none focus:border-ef-accent/50 transition-all cursor-pointer"
                                        >
                                            {['all', 'CF', 'SS', 'LWF', 'RWF', 'AMF', 'LMF', 'RMF', 'CMF', 'DMF', 'LB', 'RB', 'CB', 'GK'].map(pos => (
                                                <option key={pos} value={pos} className="bg-[#121216]">{pos === 'all' ? 'All Positions' : pos}</option>
                                            ))}
                                        </select>
                                        {filters.posFilter !== 'all' && (
                                            <div className="mt-3 flex items-center gap-2">
                                                <label className="relative inline-flex items-center cursor-pointer">
                                                    <input 
                                                        type="checkbox" 
                                                        className="sr-only peer"
                                                        checked={filters.includeSecondary}
                                                        onChange={(e) => setFilters(prev => ({ ...prev, includeSecondary: e.target.checked }))}
                                                    />
                                                    <div className="w-8 h-4 bg-white/10 rounded-full peer peer-checked:bg-ef-accent transition-all after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white/40 after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:after:translate-x-4 peer-checked:after:bg-ef-dark"></div>
                                                </label>
                                                <span className={`text-[10px] font-black uppercase tracking-wider transition-colors ${filters.includeSecondary ? 'text-ef-accent' : 'opacity-30'}`}>
                                                    Include Secondary
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-[10px] font-black uppercase tracking-widest opacity-40 mb-3">Card Type</label>
                                        <select 
                                            value={filters.cardType}
                                            onChange={(e) => setFilters(prev => ({ ...prev, cardType: e.target.value }))}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-xs font-bold text-white outline-none focus:border-ef-accent/50 transition-all cursor-pointer"
                                        >
                                            {['all', 'Normal', 'Legend', 'Epic', 'Featured', 'POTW', 'BigTime', 'ShowTime'].map(type => (
                                                <option key={type} value={type} className="bg-[#121216]">{type === 'all' ? 'All Card Types' : type}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-[10px] font-black uppercase tracking-widest opacity-40 mb-2">Club</label>
                                            <input 
                                                type="text"
                                                placeholder="e.g. Barcelona"
                                                value={filters.club}
                                                onChange={(e) => setFilters(prev => ({ ...prev, club: e.target.value }))}
                                                className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-xs font-bold text-white outline-none focus:border-ef-accent/50 transition-all"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-black uppercase tracking-widest opacity-40 mb-2">League</label>
                                            <input 
                                                type="text"
                                                placeholder="e.g. La Liga"
                                                value={filters.league}
                                                onChange={(e) => setFilters(prev => ({ ...prev, league: e.target.value }))}
                                                className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-xs font-bold text-white outline-none focus:border-ef-accent/50 transition-all"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-[10px] font-black uppercase tracking-widest opacity-40 mb-2">Nationality</label>
                                            <input 
                                                type="text"
                                                placeholder="e.g. Brazil"
                                                value={filters.nationality}
                                                onChange={(e) => setFilters(prev => ({ ...prev, nationality: e.target.value }))}
                                                className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-xs font-bold text-white outline-none focus:border-ef-accent/50 transition-all"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-black uppercase tracking-widest opacity-40 mb-2">Rating</label>
                                            <input 
                                                type="number"
                                                placeholder="Exact..."
                                                value={filters.rating}
                                                onChange={(e) => setFilters(prev => ({ ...prev, rating: e.target.value }))}
                                                className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-xs font-bold text-white outline-none focus:border-ef-accent/50 transition-all"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Right Side: Advanced & Sort */}
                                <div className="space-y-6">
                                    <div>
                                        <label className="block text-[10px] font-black uppercase tracking-widest opacity-40 mb-3">Sort Results</label>
                                        <select 
                                            value={filters.sortBy}
                                            onChange={(e) => setFilters(prev => ({ ...prev, sortBy: e.target.value }))}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-xs font-bold text-white outline-none focus:border-ef-accent/50 transition-all cursor-pointer"
                                        >
                                            <option value="rating" className="bg-[#121216]">Overall Rating</option>
                                            <option value="dateAdded_desc" className="bg-[#121216]">Date Added (Newest)</option>
                                            <option value="dateAdded_asc" className="bg-[#121216]">Date Added (Oldest)</option>
                                            <option value="goals" className="bg-[#121216]">Top Scorer</option>
                                            <option value="assists" className="bg-[#121216]">Most Assists</option>
                                            <option value="name" className="bg-[#121216]">Player Name</option>
                                            <option value="position" className="bg-[#121216]">Position</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-[10px] font-black uppercase tracking-widest opacity-40 mb-2">Playstyle</label>
                                        <select 
                                            value={filters.playstyle}
                                            onChange={(e) => setFilters(prev => ({ ...prev, playstyle: e.target.value }))}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-xs font-bold text-white outline-none focus:border-ef-accent/50 transition-all cursor-pointer"
                                        >
                                            <option value="all" className="bg-[#121216]">All Styles</option>
                                            {PLAYSTYLES.map(style => (
                                                <option key={style} value={style} className="bg-[#121216]">{style}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-[10px] font-black uppercase tracking-widest opacity-40 mb-2">Skill Filter</label>
                                        <select 
                                            value={filters.skill}
                                            onChange={(e) => setFilters(prev => ({ ...prev, skill: e.target.value }))}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-xs font-bold text-white outline-none focus:border-ef-accent/50 transition-all cursor-pointer"
                                        >
                                            <option value="all" className="bg-[#121216]">All Skills</option>
                                            <option value="Any Special Skill" className="bg-[#121216] font-black text-ef-accent">✨ Any Special Skill</option>
                                            <optgroup label="Special Skills" className="bg-[#121216] opacity-30">
                                                {SPECIAL_SKILLS.map(s => (
                                                    <option key={s} value={s} className="bg-[#121216] text-white">{s}</option>
                                                ))}
                                            </optgroup>
                                            <optgroup label="Standard Skills" className="bg-[#121216] opacity-30">
                                                {PLAYER_SKILLS.map(s => (
                                                    <option key={s} value={s} className="bg-[#121216] text-white">{s}</option>
                                                ))}
                                            </optgroup>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-[10px] font-black uppercase tracking-widest opacity-40 mb-2">Missing Details</label>
                                        <select 
                                            value={filters.missing}
                                            onChange={(e) => setFilters(prev => ({ ...prev, missing: e.target.value }))}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-xs font-bold text-white outline-none focus:border-ef-accent/50 transition-all cursor-pointer"
                                        >
                                            <option value="all" className="bg-[#121216]">Show All Players</option>
                                            {[
                                                'Missing Picture', 'Missing Player ID', 'Missing Playstyle', 'Missing Card Type',
                                                'Missing Club', 'Missing League', 'Missing Club Badge', 'Missing Country Badge',
                                                'Missing Age', 'Missing Height', 'Missing Tags', 'Missing Foot',
                                                'No Skills Found', 'No Additional Skills', 'Incomplete Additional Skills'
                                            ].map(opt => (
                                                <option key={opt} value={opt} className="bg-[#121216]">{opt}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="pt-2">
                                        <button
                                            onClick={() => setFilters(prev => ({ ...prev, inactive: !prev.inactive }))}
                                            className={`w-full py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${filters.inactive ? 'bg-ef-accent border-ef-accent text-ef-dark shadow-lg' : 'bg-white/5 border-white/10 text-white/40 hover:bg-white/10'}`}
                                        >
                                            {filters.inactive ? '🎯 Showing Inactive Only' : '👻 Show Inactive'}
                                        </button>
                                    </div>
                                </div>
                             </div>

                             <div className="mt-8 pt-6 border-t border-white/5">
                                <button 
                                    onClick={() => setShowFilters(false)}
                                    className="w-full py-4 bg-ef-blue hover:bg-ef-blue/80 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all text-white shadow-xl shadow-ef-blue/20"
                                >
                                    Apply Search Filters
                                </button>
                            </div>
                        </div>
                    )}
                    
                    {/* Import Button */}
                    <button 
                        onClick={() => document.getElementById('squad-import-input').click()}
                        className="px-6 h-full rounded-2xl flex items-center justify-center border bg-white/5 border-white/10 text-white/40 hover:text-white hover:bg-white/10 transition-all gap-2"
                        title="Import JSON Squad"
                    >
                        <span className="text-lg">📥</span>
                        <span className="text-[10px] font-black uppercase tracking-widest hidden sm:inline">Import</span>
                    </button>
                    <input 
                        type="file" 
                        id="squad-import-input" 
                        accept=".json" 
                        className="hidden" 
                        onChange={(e) => {
                            const file = e.target.files[0];
                            if (file) {
                                const reader = new FileReader();
                                reader.onload = (event) => {
                                    try {
                                        const json = JSON.parse(event.target.result);
                                        onImport(json);
                                    } catch (err) {
                                        console.error("JSON Parse Error", err);
                                    }
                                };
                                reader.readAsText(file);
                            }
                            e.target.value = '';
                        }}
                    />

                    {/* Export Button */}
                    <button 
                        onClick={() => setShowExport(!showExport)}
                        className={`px-6 h-full rounded-2xl flex items-center justify-center border transition-all gap-2 ${showExport ? 'bg-ef-blue border-ef-blue text-white' : 'bg-white/5 border-white/10 text-white/40 hover:text-white hover:bg-white/10'}`}
                    >
                        <span className="text-lg">📤</span>
                        <span className="text-[10px] font-black uppercase tracking-widest hidden sm:inline">Export</span>
                    </button>

                    {/* Settings Toggle Button */}
                    <button 
                        onClick={() => {
                            setShowSettings(!showSettings);
                            setShowExport(false);
                        }}
                        className={`w-14 h-full rounded-2xl flex items-center justify-center border transition-all ${showSettings ? 'bg-ef-accent border-ef-accent text-ef-dark' : 'bg-white/5 border-white/10 text-white/40 hover:text-white hover:bg-white/10'}`}
                        title="Column Settings"
                    >
                        <span className="text-xl">⚙️</span>
                    </button>

                    {/* Export Popup */}
                    {showExport && (
                        <div className="absolute top-full right-[68px] mt-3 w-56 bg-[#121216] border border-white/10 rounded-2xl shadow-2xl p-4 z-[140] animate-slide-up cursor-default">
                             <h3 className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40 mb-4 px-1 text-center">Export Format</h3>
                             <div className="grid grid-cols-1 gap-2">
                                <button 
                                    onClick={() => handleExport('json')}
                                    className="flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 transition-all group"
                                >
                                    <div className="w-8 h-8 rounded-lg bg-yellow-500/20 text-yellow-500 flex items-center justify-center text-xs font-black">JS</div>
                                    <div className="text-[11px] font-bold uppercase tracking-wider text-white/80 group-hover:text-white">JSON File</div>
                                </button>
                                <button 
                                    onClick={() => handleExport('excel')}
                                    className="flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 transition-all group"
                                >
                                    <div className="w-8 h-8 rounded-lg bg-green-500/20 text-green-500 flex items-center justify-center text-xs font-black">XL</div>
                                    <div className="text-[11px] font-bold uppercase tracking-wider text-white/80 group-hover:text-white">Excel (CSV)</div>
                                </button>
                             </div>
                        </div>
                    )}

                    {/* Column Settings Panel */}
                    {showSettings && (
                        <div className="absolute top-full right-0 mt-3 w-72 bg-[#121216]/95 border border-white/10 rounded-2xl shadow-2xl p-4 z-[140] animate-slide-up cursor-default backdrop-blur-xl">
                            <div className="flex items-center justify-between mb-4 px-1">
                                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40">Visible Columns</h3>
                                <button 
                                    onClick={() => {
                                        const allOn = {};
                                        colLabels.forEach(l => allOn[l.id] = true);
                                        setVisibleCols(allOn);
                                    }}
                                    className="text-[8px] font-black uppercase text-ef-accent hover:opacity-60 transition-opacity"
                                >
                                    Show All
                                </button>
                            </div>
                            
                            <div className="grid grid-cols-1 gap-0.5 max-h-[50vh] overflow-y-auto custom-scrollbar pr-1 mb-2">
                                {colLabels.map(col => (
                                    <label key={col.id} className="flex items-center justify-between p-2 rounded-xl hover:bg-white/5 cursor-pointer transition-colors group">
                                        <span className={`text-[11px] font-bold uppercase tracking-wider ${visibleCols[col.id] ? 'text-white' : 'opacity-30'}`}>
                                            {col.label}
                                        </span>
                                        <div className="relative">
                                            <input 
                                                type="checkbox" 
                                                className="sr-only peer"
                                                checked={visibleCols[col.id]}
                                                onChange={() => toggleCol(col.id)}
                                            />
                                            <div className="w-8 h-4 bg-white/10 rounded-full peer peer-checked:bg-ef-accent transition-all after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white/40 after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:after:translate-x-4 peer-checked:after:bg-ef-dark"></div>
                                        </div>
                                    </label>
                                ))}
                            </div>

                            <div className="my-3 border-t border-white/5"></div>

                            <div className="space-y-1">
                                <label className="flex items-center justify-between p-2 rounded-xl hover:bg-white/5 cursor-pointer transition-colors group">
                                    <div className="flex flex-col">
                                        <span className={`text-[11px] font-black uppercase tracking-wider ${conciseMode ? 'text-ef-accent' : 'opacity-30'}`}>
                                            Concise Mode
                                        </span>
                                        <span className="text-[8px] font-bold opacity-20 uppercase">No photos + zero padding</span>
                                    </div>
                                    <div className="relative">
                                        <input 
                                            type="checkbox" 
                                            className="sr-only peer"
                                            checked={conciseMode}
                                            onChange={() => setConciseMode(!conciseMode)}
                                        />
                                        <div className="w-8 h-4 bg-white/10 rounded-full peer peer-checked:bg-ef-accent transition-all after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white/40 after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:after:translate-x-4 peer-checked:after:bg-ef-dark"></div>
                                    </div>
                                </label>
                            </div>

                            <div className="mt-4 pt-4 border-t border-white/5">
                                <button 
                                    onClick={() => setShowSettings(false)}
                                    className="w-full py-2 bg-white/5 hover:bg-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                                >
                                    Done
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </header>

            {/* Table Container */}
            <div className="flex-1 overflow-auto custom-scrollbar bg-[radial-gradient(circle_at_top,_#1a1f26_0%,_#0a0f16_100%)] font-outfit">
                <div className="min-w-full inline-block align-middle">
                    <div className="overflow-hidden">
                        <table className="min-w-full divide-y divide-white/5">
                            <thead className="bg-black/40 sticky top-0 z-20 backdrop-blur-md">
                                <tr>
                                    <th className={`px-4 ${conciseMode ? 'py-1' : 'py-3'} text-left text-[10px] font-black uppercase tracking-wider opacity-40`}>#</th>
                                    {visibleCols.image && !conciseMode && <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-wider opacity-40">Photo</th>}
                                    <th className={`px-4 ${conciseMode ? 'py-1' : 'py-3'} text-left text-[10px] font-black uppercase tracking-wider opacity-40`}>Player</th>
                                    {visibleCols.id && <th className={`px-4 ${conciseMode ? 'py-1' : 'py-3'} text-left text-[10px] font-black uppercase tracking-wider opacity-40`}>ID</th>}
                                    {visibleCols.pos && <th className={`px-4 ${conciseMode ? 'py-1' : 'py-3'} text-left text-[10px] font-black uppercase tracking-wider opacity-40`}>Pos</th>}
                                    {visibleCols.rating && <th className={`px-4 ${conciseMode ? 'py-1' : 'py-3'} text-left text-[10px] font-black uppercase tracking-wider opacity-40`}>Rating</th>}
                                    {visibleCols.height && <th className={`px-4 ${conciseMode ? 'py-1' : 'py-3'} text-left text-[10px] font-black uppercase tracking-wider opacity-40`}>Height</th>}
                                    {visibleCols.weight && <th className={`px-4 ${conciseMode ? 'py-1' : 'py-3'} text-left text-[10px] font-black uppercase tracking-wider opacity-40`}>Weight</th>}
                                    {visibleCols.age && <th className={`px-4 ${conciseMode ? 'py-1' : 'py-3'} text-left text-[10px] font-black uppercase tracking-wider opacity-40`}>Age</th>}
                                    {visibleCols.strongFoot && <th className={`px-4 ${conciseMode ? 'py-1' : 'py-3'} text-left text-[10px] font-black uppercase tracking-wider opacity-40`}>Foot</th>}
                                    {visibleCols.playstyle && <th className={`px-4 ${conciseMode ? 'py-1' : 'py-3'} text-left text-[10px] font-black uppercase tracking-wider opacity-40`}>Playstyle</th>}
                                    {visibleCols.club && <th className={`px-4 ${conciseMode ? 'py-1' : 'py-3'} text-left text-[10px] font-black uppercase tracking-wider opacity-40`}>Club</th>}
                                    {visibleCols.league && <th className={`px-4 ${conciseMode ? 'py-1' : 'py-3'} text-left text-[10px] font-black uppercase tracking-wider opacity-40 hidden md:table-cell`}>League</th>}
                                    {visibleCols.nationality && <th className={`px-4 ${conciseMode ? 'py-1' : 'py-3'} text-left text-[10px] font-black uppercase tracking-wider opacity-40`}>Nationality</th>}
                                    {visibleCols.card && <th className={`px-4 ${conciseMode ? 'py-1' : 'py-3'} text-left text-[10px] font-black uppercase tracking-wider opacity-40 hidden sm:table-cell`}>Card</th>}
                                    {visibleCols.weakUsage && <th className={`px-4 ${conciseMode ? 'py-1' : 'py-3'} text-left text-[10px] font-black uppercase tracking-wider opacity-40`}>Weak Foot Usage</th>}
                                    {visibleCols.weakAccuracy && <th className={`px-4 ${conciseMode ? 'py-1' : 'py-3'} text-left text-[10px] font-black uppercase tracking-wider opacity-40`}>Weak Foot Accuracy</th>}
                                    {visibleCols.form && <th className={`px-4 ${conciseMode ? 'py-1' : 'py-3'} text-left text-[10px] font-black uppercase tracking-wider opacity-40`}>Form</th>}
                                    {visibleCols.injury && <th className={`px-4 ${conciseMode ? 'py-1' : 'py-3'} text-left text-[10px] font-black uppercase tracking-wider opacity-40`}>Injury Resistance</th>}
                                    {visibleCols.featured && <th className={`px-4 ${conciseMode ? 'py-1' : 'py-3'} text-left text-[10px] font-black uppercase tracking-wider opacity-40`}>Featured</th>}
                                    {visibleCols.createdAt && <th className={`px-4 ${conciseMode ? 'py-1' : 'py-3'} text-left text-[10px] font-black uppercase tracking-wider opacity-40`}>Uploaded</th>}
                                    {visibleCols.dateAdded && <th className={`px-4 ${conciseMode ? 'py-1' : 'py-3'} text-left text-[10px] font-black uppercase tracking-wider opacity-40`}>Added</th>}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {filteredPlayers.map((player, index) => (
                                    <tr key={player._id || index} className="hover:bg-white/[0.02] transition-colors group">
                                        <td className={`px-4 ${conciseMode ? 'py-0.5' : 'py-3'} whitespace-nowrap text-[10px] font-bold opacity-30`}>
                                            {index + 1}
                                        </td>
                                        {visibleCols.image && !conciseMode && (
                                            <td className="px-4 py-3 whitespace-nowrap">
                                                <div className="w-10 h-10 rounded-lg bg-white/5 overflow-hidden border border-white/10 shrink-0 shadow-lg group-hover:border-ef-accent/30 transition-all">
                                                    <img 
                                                        src={player.image || 'https://efootball-world.com/img/player_placeholder.png'} 
                                                        alt="" 
                                                        className="w-full h-full object-cover object-top"
                                                        loading="lazy"
                                                    />
                                                </div>
                                            </td>
                                        )}
                                        <td className={`px-4 ${conciseMode ? 'py-0.5' : 'py-3'} whitespace-nowrap`}>
                                            <div className="flex flex-col">
                                                {visibleCols.name && (
                                                    <span className="text-xs font-black uppercase leading-none group-hover:text-ef-accent transition-colors">
                                                        {player.name}
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        {visibleCols.id && (
                                            <td className={`px-4 ${conciseMode ? 'py-0.5' : 'py-3'} whitespace-nowrap`}>
                                                <span className="text-[10px] font-bold opacity-30 uppercase tracking-tighter">
                                                    {player.playerId || player.pesdb_id || 'N/A'}
                                                </span>
                                            </td>
                                        )}
                                        {visibleCols.pos && (
                                            <td className={`px-4 ${conciseMode ? 'py-0.5' : 'py-3'} whitespace-nowrap`}>
                                                <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-white/10 text-white uppercase border border-white/5">
                                                    {player.position}
                                                </span>
                                            </td>
                                        )}
                                        {visibleCols.rating && (
                                            <td className={`px-4 ${conciseMode ? 'py-0.5' : 'py-3'} whitespace-nowrap`}>
                                                <span className={`text-xs font-black ${player.rating >= 100 ? 'text-ef-accent' : player.rating >= 95 ? 'text-ef-blue' : 'text-white'}`}>
                                                    {player.rating}
                                                </span>
                                            </td>
                                        )}
                                        {visibleCols.height && (
                                            <td className={`px-4 ${conciseMode ? 'py-0.5' : 'py-3'} whitespace-nowrap text-[10px] font-bold opacity-60`}>
                                                {player.height ? `${player.height}cm` : '---'}
                                            </td>
                                        )}
                                        {visibleCols.weight && (
                                            <td className={`px-4 ${conciseMode ? 'py-0.5' : 'py-3'} whitespace-nowrap text-[10px] font-bold opacity-60`}>
                                                {player.weight ? `${player.weight}kg` : '---'}
                                            </td>
                                        )}
                                        {visibleCols.age && (
                                            <td className={`px-4 ${conciseMode ? 'py-0.5' : 'py-3'} whitespace-nowrap text-[10px] font-bold opacity-60`}>
                                                {player.age || '---'}
                                            </td>
                                        )}
                                        {visibleCols.strongFoot && (
                                            <td className={`px-4 ${conciseMode ? 'py-0.5' : 'py-3'} whitespace-nowrap text-[10px] font-bold opacity-60 uppercase`}>
                                                {player.strongFoot || '---'}
                                            </td>
                                        )}
                                        {visibleCols.playstyle && (
                                            <td className={`px-4 ${conciseMode ? 'py-0.5' : 'py-3'} whitespace-nowrap text-[10px] font-bold opacity-60 uppercase`}>
                                                {player.playstyle || 'None'}
                                            </td>
                                        )}
                                        {visibleCols.club && (
                                            <td className={`px-4 ${conciseMode ? 'py-0.5' : 'py-3'} whitespace-nowrap`}>
                                                <div className="flex items-center gap-2">
                                                    {(player.logos?.club || player.club_badge_url) && (
                                                        <img src={player.logos?.club || player.club_badge_url} alt="" className="w-4 h-4 object-contain" />
                                                    )}
                                                    <span className="text-[10px] font-bold uppercase opacity-80">{player.club}</span>
                                                </div>
                                            </td>
                                        )}
                                        {visibleCols.league && (
                                            <td className={`px-4 ${conciseMode ? 'py-0.5' : 'py-3'} whitespace-nowrap hidden md:table-cell`}>
                                                <div className="flex items-center gap-2">
                                                    {player.logos?.league && (
                                                        <img src={player.logos?.league} alt="" className="w-4 h-4 object-contain" />
                                                    )}
                                                    <span className="text-[10px] font-bold uppercase opacity-40">{player.league}</span>
                                                </div>
                                            </td>
                                        )}
                                        {visibleCols.nationality && (
                                            <td className={`px-4 ${conciseMode ? 'py-0.5' : 'py-3'} whitespace-nowrap`}>
                                                <div className="flex items-center gap-2">
                                                    {(player.logos?.country || player.nationality_flag_url) && (
                                                        <img src={player.logos?.country || player.nationality_flag_url} alt="" className="w-4 h-3 object-cover rounded-[1px]" />
                                                    )}
                                                    <span className="text-[10px] font-bold uppercase opacity-80">{player.nationality}</span>
                                                </div>
                                            </td>
                                        )}
                                        {visibleCols.card && (
                                            <td className={`px-4 ${conciseMode ? 'py-0.5' : 'py-3'} whitespace-nowrap hidden sm:table-cell`}>
                                                <span className="text-[9px] font-black uppercase opacity-20 tracking-widest bg-white/5 px-2 py-1 rounded">
                                                    {player.cardType || 'Normal'}
                                                </span>
                                            </td>
                                        )}
                                        {visibleCols.weakUsage && (
                                            <td className={`px-4 ${conciseMode ? 'py-0.5' : 'py-3'} whitespace-nowrap text-[10px] font-bold opacity-60`}>
                                                {player.weakFootUsage || player['Weak Foot Usage'] || '---'}
                                            </td>
                                        )}
                                        {visibleCols.weakAccuracy && (
                                            <td className={`px-4 ${conciseMode ? 'py-0.5' : 'py-3'} whitespace-nowrap text-[10px] font-bold opacity-60`}>
                                                {player.weakFootAccuracy || player['Weak Foot Accuracy'] || '---'}
                                            </td>
                                        )}
                                        {visibleCols.form && (
                                            <td className={`px-4 ${conciseMode ? 'py-0.5' : 'py-3'} whitespace-nowrap text-[10px] font-bold opacity-60`}>
                                                {player.conditioning || player.Form || player['Player Form'] || '---'}
                                            </td>
                                        )}
                                        {visibleCols.injury && (
                                            <td className={`px-4 ${conciseMode ? 'py-0.5' : 'py-3'} whitespace-nowrap text-[10px] font-bold opacity-60`}>
                                                {player.injuryResistance || player['Injury Resistance'] || '---'}
                                            </td>
                                        )}
                                        {visibleCols.featured && (
                                            <td className={`px-4 ${conciseMode ? 'py-0.5' : 'py-3'} whitespace-nowrap text-[10px] font-bold`}>
                                                {(() => {
                                                    const val = player.featured || player['Featured Players'];
                                                    if (!val || val === 'Standard' || val === 'No' || val === false) {
                                                        return <span className="opacity-20 uppercase text-[9px]">Standard</span>;
                                                    }
                                                    return <span className="text-ef-blue uppercase text-[9px] tracking-tighter">{val}</span>;
                                                })()}
                                            </td>
                                        )}
                                        {visibleCols.createdAt && (
                                            <td className={`px-4 ${conciseMode ? 'py-0.5' : 'py-3'} whitespace-nowrap text-[9px] font-bold opacity-30`}>
                                                {player.createdAt ? new Date(player.createdAt).toLocaleDateString() : '---'}
                                            </td>
                                        )}
                                        {visibleCols.dateAdded && (
                                            <td className={`px-4 ${conciseMode ? 'py-0.5' : 'py-3'} whitespace-nowrap text-[9px] font-bold opacity-30`}>
                                                {(() => {
                                                    const d = parseEfDate(player.DateAdded || player['Date Added']);
                                                    return d ? d.toLocaleDateString() : '---';
                                                })()}
                                            </td>
                                        )}
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {filteredPlayers.length === 0 && (
                            <div className="flex flex-col items-center justify-center py-40 opacity-20 text-center">
                                <span className="text-4xl mb-2">📭</span>
                                <p className="text-[10px] font-black uppercase tracking-[0.2em]">No players found in your squad</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MySquadDB;
