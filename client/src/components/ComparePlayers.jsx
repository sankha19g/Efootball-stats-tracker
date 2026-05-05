import { useState, useMemo, useEffect } from 'react';
import PlayerCard from './PlayerCard';
import { Search, X, TrendingUp, TrendingDown, Minus, GitCompare, Shield, Activity, Zap, Star, Plus } from 'lucide-react';

const ComparePlayers = ({ players, onPlayerClick, settings, initialSelectedIds, onIdsChange }) => {
    const [selectedIds, setSelectedIds] = useState(initialSelectedIds || [null, null]);
    const [searchTerms, setSearchTerms] = useState(Array((initialSelectedIds || [null, null]).length).fill(''));

    // Sync local state if initialSelectedIds changes from outside
    useEffect(() => {
        if (initialSelectedIds) {
            setSelectedIds(initialSelectedIds);
            if (searchTerms.length !== initialSelectedIds.length) {
                setSearchTerms(Array(initialSelectedIds.length).fill(''));
            }
        }
    }, [initialSelectedIds]);

    const notifyChange = (newIds) => {
        if (onIdsChange) onIdsChange(newIds);
    };

    const addSlot = () => {
        if (selectedIds.length < 4) {
            const next = [...selectedIds, null];
            setSelectedIds(next);
            setSearchTerms([...searchTerms, '']);
            notifyChange(next);
        }
    };

    const resetComparison = () => {
        const next = [null, null];
        setSelectedIds(next);
        setSearchTerms(['', '']);
        notifyChange(next);
    };

    const removeSlot = (index) => {
        let next;
        if (selectedIds.length > 2) {
            next = [...selectedIds];
            const newTerms = [...searchTerms];
            next.splice(index, 1);
            newTerms.splice(index, 1);
            setSelectedIds(next);
            setSearchTerms(newTerms);
        } else {
            next = [...selectedIds];
            next[index] = null;
            setSelectedIds(next);
        }
        notifyChange(next);
    };

    const setPlayerId = (index, id) => {
        const next = [...selectedIds];
        next[index] = id;
        setSelectedIds(next);
        const newTerms = [...searchTerms];
        newTerms[index] = '';
        setSearchTerms(newTerms);
        notifyChange(next);
    };

    const setSearchTerm = (index, term) => {
        const newTerms = [...searchTerms];
        newTerms[index] = term;
        setSearchTerms(newTerms);
    };

    const filteredPlayers = useMemo(() => {
        return searchTerms.map(term => {
            if (!term) return [];
            const searchLower = term.toLowerCase();
            return players.filter(p => 
                p.name.toLowerCase().includes(searchLower) || 
                p.position.toLowerCase().includes(searchLower) ||
                (p.playstyle || '').toLowerCase().includes(searchLower) ||
                (p.club || '').toLowerCase().includes(searchLower)
            );
        });
    }, [players, searchTerms]);

    const normalizePlayer = (p) => {
        if (!p) return null;
        const cleanStat = (val) => (val === undefined || val === null || val === '') ? '-' : val;
        
        const matches = parseInt(p.matches) || 0;
        const goals = parseInt(p.goals) || 0;
        const assists = parseInt(p.assists) || 0;
        
        const goalsPerGame = matches > 0 ? (goals / matches).toFixed(2) : '0.00';
        const assistsPerGame = matches > 0 ? (assists / matches).toFixed(2) : '0.00';
        const gaPerGame = matches > 0 ? ((goals + assists) / matches).toFixed(2) : '0.00';

        return {
            ...p,
            matches,
            goals,
            assists,
            goalsPerGame,
            assistsPerGame,
            gaPerGame,
            rating: p.rating || p.Rating || 0,
            playstyle: p.playstyle || p.Playstyle || 'None',
            age: p.age || p.Age || '??',
            height: p.height || p.Height || '???',
            weight: p.weight || p.Weight || '??',
            strongFoot: p.strongFoot || p.Foot || p.foot || 'Right',
            secondaryPosition: Array.isArray(p.secondaryPosition) 
                ? p.secondaryPosition 
                : (p.secondaryPosition || p.secondary_positions || '').split(/[, ]+/).map(s => s.trim()).filter(Boolean),
            additionalPositions: Array.isArray(p.additionalPositions) 
                ? p.additionalPositions 
                : (p.additionalPositions || p.additional_positions || '').split(/[, ]+/).map(s => s.trim()).filter(Boolean),
            weakFootUsage: cleanStat(p['Weak Foot Usage'] ?? p.weakFootUsage ?? p.WFUsage),
            weakFootAccuracy: cleanStat(p['Weak Foot Accuracy'] ?? p.weakFootAccuracy ?? p.WFAccuracy),
            form: cleanStat(p['Form'] ?? p.conditioning ?? p['Player Form'] ?? p.Condition),
            injuryResistance: cleanStat(p['Injury Resistance'] ?? p.injuryResistance ?? p.InjuryRes),
            skills: Array.isArray(p.skills || p.Skills) ? (p.skills || p.Skills) : [],
            additionalSkills: Array.isArray(p.additionalSkills || p.AdditionalSkills) 
                ? (p.additionalSkills || p.AdditionalSkills).filter(Boolean)
                : []
        };
    };

    const selectedPlayers = useMemo(() => {
        return selectedIds.map(id => id ? players.find(p => p._id === id) || null : null);
    }, [selectedIds, players]);

    const nPlayers = useMemo(() => selectedPlayers.map(p => normalizePlayer(p)), [selectedPlayers]);
    const activeNPlayers = useMemo(() => nPlayers.filter(Boolean), [nPlayers]);

    const getSkillAnalysis = useMemo(() => {
        if (activeNPlayers.length < 2) return null;
        const skillSets = activeNPlayers.map(p => new Set([...(p.skills || []), ...(p.additionalSkills || [])]));
        
        // Common to ALL active players
        const common = [...skillSets[0]].filter(skill => 
            skillSets.every(set => set.has(skill))
        );

        // Unique to each active player
        const unique = activeNPlayers.map((p, i) => {
            const othersSkills = new Set();
            skillSets.forEach((set, j) => {
                if (i !== j) set.forEach(s => othersSkills.add(s));
            });
            return {
                name: p.name,
                skills: [...skillSets[i]].filter(skill => !othersSkills.has(skill))
            };
        });

        return { common, unique };
    }, [activeNPlayers]);

    const ComparisonRow = ({ label, values, suffix = '', isNumeric = true, reverse = false, showWinner = true }) => {
        const ranks = {
            'Almost Never': 1, 'Rarely': 2, 'Occasionally': 3, 'Regularly': 4, 'Very Often': 5,
            'Low': 1, 'Medium': 2, 'High': 3, 'Very High': 4,
            'Inconsistent': 1, 'Standard': 2, 'Unwavering': 3,
            'E': 1, 'D': 2, 'C': 3, 'B': 4, 'A': 5,
            '4': 4, '3': 3, '2': 2, '1': 1
        };

        const numericValues = values.map(v => {
            if (v === null || v === undefined || v === '-') return -Infinity;
            if (isNumeric) return parseFloat(v) || 0;
            return ranks[v] || (isNaN(parseFloat(v)) ? (v === 'None' ? -1 : 0) : parseFloat(v));
        });

        // Calculate max/min only among valid values
        const validNumericValues = numericValues.filter(v => v !== -Infinity);
        let maxVal = validNumericValues.length > 0 ? Math.max(...validNumericValues) : -Infinity;
        let minVal = validNumericValues.length > 0 ? Math.min(...validNumericValues) : -Infinity;
        
        if (reverse) {
            maxVal = minVal;
        }

        const isWinner = (val, idx) => {
            if (val === null || val === undefined || val === '-' || !showWinner) return false;
            if (validNumericValues.length < 2) return false;
            const num = numericValues[idx];
            // Winner if it's the max (or min if reversed) and there's a difference
            if (reverse) {
                return num === minVal && validNumericValues.some(v => v !== minVal);
            }
            return num === maxVal && validNumericValues.some(v => v !== maxVal);
        };

        return (
            <div className="py-2.5 border-b border-white/5 group hover:bg-white/[0.02] transition-all px-6">
                <div className="flex flex-col gap-1.5">
                    <div className="flex items-center gap-2">
                        <div className="w-1 h-2.5 bg-ef-accent/30 rounded-full"></div>
                        <span className="text-[9px] font-black uppercase tracking-[0.2em] text-white/20 group-hover:text-white/60 transition-colors">{label}</span>
                    </div>
                    <div className={`grid gap-2 items-end ${
                        selectedIds.length === 2 ? 'grid-cols-2' : 
                        selectedIds.length === 3 ? 'grid-cols-3' : 
                        'grid-cols-2 lg:grid-cols-4'
                    }`}>
                        {values.map((v, i) => (
                            <div key={i} className="flex flex-col gap-0.5">
                                {selectedIds.length > 2 && nPlayers[i] && (
                                    <span className="text-[7px] font-bold uppercase tracking-widest text-white/10 truncate leading-none">{nPlayers[i].name}</span>
                                )}
                                <div className={`font-black italic transition-all duration-500 leading-tight ${isWinner(v, i) ? 'text-ef-accent text-lg scale-105 drop-shadow-[0_0_12px_rgba(0,255,136,0.3)]' : 'text-white/40 text-[13px]'}`}>
                                    {v || '-'}{v && suffix && v !== '-' ? suffix : ''}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="max-w-7xl mx-auto p-4 md:p-6 animate-slide-up pb-32">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row items-center justify-between mb-8 gap-6 bg-white/[0.02] border border-white/5 p-5 rounded-[2rem]">
                <div className="flex items-center gap-5">
                    <div className="w-14 h-14 rounded-2xl bg-ef-accent/10 border border-ef-accent/20 flex items-center justify-center shadow-lg shadow-ef-accent/5 shrink-0">
                        <GitCompare className="w-7 h-7 text-ef-accent" />
                    </div>
                    <div className="text-left text-center md:text-left">
                        <h1 className="text-xl font-black uppercase tracking-[0.2em] italic text-white mb-1.5">Multi-Player Comparison</h1>
                        <p className="text-[9px] font-bold uppercase tracking-widest text-white/30">Compare up to 4 squad members side-by-side</p>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <button 
                        onClick={resetComparison}
                        className="flex items-center gap-2 px-5 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 hover:bg-red-500 hover:text-white transition-all shadow-lg hover:shadow-red-500/20"
                        title="Remove all players from comparison"
                    >
                        <X className="w-4 h-4" />
                        <span className="text-[10px] font-black uppercase tracking-widest">Reset All</span>
                    </button>

                    {selectedIds.length < 4 && (
                        <button 
                            onClick={addSlot}
                            className="flex items-center gap-2 px-5 py-3 rounded-xl bg-ef-accent/10 border border-ef-accent/20 text-ef-accent hover:bg-ef-accent hover:text-[#0a0a0c] transition-all shadow-lg hover:shadow-ef-accent/20"
                            title="Add an empty slot to compare another player"
                        >
                            <Plus className="w-4 h-4" />
                            <span className="text-[10px] font-black uppercase tracking-widest">Add Slot</span>
                        </button>
                    )}
                </div>
            </div>

            <div className={`grid gap-6 mb-10 ${
                selectedIds.length === 2 ? 'grid-cols-1 md:grid-cols-2' :
                selectedIds.length === 3 ? 'grid-cols-1 md:grid-cols-3' :
                'grid-cols-1 md:grid-cols-2 lg:grid-cols-4'
            }`}>
                {selectedIds.map((id, index) => (
                    <div key={index} className="space-y-6 relative">
                        <div className="relative group">
                            <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-2xl px-5 py-4 focus-within:border-ef-accent/50 focus-within:bg-white/[0.08] transition-all shadow-xl">
                                <Search className="w-4 h-4 text-ef-accent opacity-50 group-focus-within:opacity-100 transition-opacity" />
                                <input 
                                    type="text"
                                    placeholder={`Search Player ${index + 1}...`}
                                    value={searchTerms[index]}
                                    onChange={(e) => setSearchTerm(index, e.target.value)}
                                    className="bg-transparent border-none outline-none text-white font-bold w-full placeholder:text-white/20 text-sm"
                                />
                                {searchTerms[index] && <X className="w-4 h-4 cursor-pointer opacity-40 hover:opacity-100" onClick={() => setSearchTerm(index, '')} />}
                            </div>
                            
                            {searchTerms[index] && filteredPlayers[index] && filteredPlayers[index].length > 0 && (
                                <div className="absolute top-full left-0 right-0 mt-3 bg-[#0a0a0c]/95 border border-white/10 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] z-[100] overflow-y-auto max-h-[400px] backdrop-blur-2xl animate-dropdown custom-scrollbar">
                                    {filteredPlayers[index].map(p => (
                                        <button 
                                            key={p._id}
                                            onClick={() => setPlayerId(index, p._id)}
                                            className="w-full flex items-center gap-4 p-4 hover:bg-ef-accent/10 border-b border-white/5 last:border-none transition-all text-left group/item"
                                        >
                                            <div className="w-10 h-10 rounded-xl overflow-hidden bg-white/5 border border-white/10 group-hover/item:border-ef-accent/30 transition-colors">
                                                {p.image ? <img src={p.image} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center opacity-20">👤</div>}
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-sm font-black text-white group-hover/item:text-ef-accent transition-colors">{p.name}</span>
                                                <span className="text-[10px] opacity-40 uppercase font-bold tracking-wider">{p.position} • {p.playstyle} • Rating {p.rating}</span>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {selectedPlayers[index] ? (
                            <div className="flex flex-col items-center animate-scale-in">
                                <div 
                                    onClick={() => onPlayerClick(selectedPlayers[index])}
                                    className="w-full transform hover:scale-[1.02] transition-all duration-500 shadow-[0_30px_60px_-15px_rgba(0,255,136,0.5)] cursor-pointer max-w-[240px]"
                                >
                                    <PlayerCard player={selectedPlayers[index]} players={players} settings={{ ...settings, cardSize: 'md' }} />
                                </div>
                                <div className="flex gap-2 mt-6">
                                    <button 
                                        onClick={() => setPlayerId(index, null)} 
                                        className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest text-white/40 hover:bg-white/10 hover:text-white transition-all"
                                    >
                                        Change
                                    </button>
                                    {selectedIds.length > 2 && (
                                        <button 
                                            onClick={() => removeSlot(index)} 
                                            className="px-4 py-2 rounded-xl bg-red-500/10 border border-red-500/20 text-[10px] font-black uppercase tracking-widest text-red-500 hover:bg-red-500 hover:text-white transition-all"
                                        >
                                            Remove
                                        </button>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="aspect-[7/10] w-full max-w-[240px] mx-auto rounded-[2.5rem] border-2 border-dashed border-white/5 flex flex-col items-center justify-center gap-6 opacity-30 group hover:opacity-50 transition-opacity">
                                <div className="w-16 h-16 rounded-full border-2 border-dashed border-current flex items-center justify-center group-hover:scale-110 transition-transform">
                                    <span className="text-2xl font-black italic">{index + 1}</span>
                                </div>
                                <div className="text-center">
                                    <span className="block text-[11px] font-black uppercase tracking-[0.2em] mb-1 text-ef-accent">Select Player</span>
                                    <div className="flex flex-col gap-1">
                                        <span className="block text-[9px] font-bold uppercase tracking-widest opacity-40">Candidate for analysis</span>
                                        {selectedIds.length > 2 && (
                                            <button 
                                                onClick={() => removeSlot(index)}
                                                className="text-[8px] text-red-500/60 hover:text-red-500 uppercase mt-2 font-black tracking-widest"
                                            >
                                                [ Remove Slot ]
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                ))}


            </div>

            {/* Comparison Stats */}
            {activeNPlayers.length >= 2 ? (
                <div className="bg-[#0a0a0c] border border-white/10 rounded-[2.5rem] overflow-hidden shadow-2xl backdrop-blur-3xl animate-slide-up relative">
                    <div className="absolute inset-0 bg-gradient-to-b from-ef-accent/[0.02] to-transparent pointer-events-none"></div>
                    
                    <div className="p-5 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                        <div className="flex items-center gap-3">
                            <div className="w-0.5 h-6 bg-ef-accent rounded-full shadow-[0_0_10px_rgba(0,255,136,0.4)]"></div>
                            <h2 className="text-base font-black uppercase tracking-[0.2em] text-white italic">Multi-Player Analysis</h2>
                        </div>
                        <div className="px-3 py-1 rounded-full bg-ef-accent/10 border border-ef-accent/20">
                            <span className="text-[9px] font-black uppercase tracking-widest text-ef-accent">{activeNPlayers.length} Players</span>
                        </div>
                    </div>
                    
                    <div className="py-1">
                        {/* Performance Section */}
                        <div className="px-6 pt-5 pb-2 flex items-center gap-2">
                            <Star className="w-3.5 h-3.5 text-ef-accent" />
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white">Performance Metrics</span>
                        </div>
                        <ComparisonRow label="Overall Rating" values={nPlayers.map(p => p?.rating)} />
                        <ComparisonRow label="Matches Played" values={nPlayers.map(p => p?.matches)} />
                        <ComparisonRow label="Goals Scored" values={nPlayers.map(p => p?.goals)} />
                        <ComparisonRow label="Assists" values={nPlayers.map(p => p?.assists)} />
                        <ComparisonRow label="Goals / Game" values={nPlayers.map(p => p?.goalsPerGame)} />
                        <ComparisonRow label="Assists / Game" values={nPlayers.map(p => p?.assistsPerGame)} />
                        <ComparisonRow label="G+A / Game" values={nPlayers.map(p => p?.gaPerGame)} />
                        
                        <div className="h-4 bg-white/[0.01]"></div>
                        
                        {/* Physical/Bio Section */}
                        <div className="px-6 pt-5 pb-2 flex items-center gap-2">
                            <Shield className="w-3.5 h-3.5 text-ef-accent" />
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white">Physical & Biographical</span>
                        </div>
                        <ComparisonRow label="Height" values={nPlayers.map(p => p?.height)} suffix=" cm" />
                        <ComparisonRow label="Weight" values={nPlayers.map(p => p?.weight)} suffix=" kg" showWinner={false} />
                        <ComparisonRow label="Age" values={nPlayers.map(p => p?.age)} reverse={true} />
                        <ComparisonRow label="Preferred Foot" values={nPlayers.map(p => p?.strongFoot)} isNumeric={false} showWinner={false} />
                        
                        <div className="h-4 bg-white/[0.01]"></div>
                        
                        {/* Technical Section */}
                        <div className="px-6 pt-5 pb-2 flex items-center gap-2">
                            <Zap className="w-3.5 h-3.5 text-ef-accent" />
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white">Technical & Conditioning</span>
                        </div>
                        <ComparisonRow label="Form / Conditioning" values={nPlayers.map(p => p?.form)} isNumeric={false} />
                        <ComparisonRow label="Injury Resistance" values={nPlayers.map(p => p?.injuryResistance)} isNumeric={false} />
                        <ComparisonRow label="Weak Foot Usage" values={nPlayers.map(p => p?.weakFootUsage)} isNumeric={false} />
                        <ComparisonRow label="Weak Foot Accuracy" values={nPlayers.map(p => p?.weakFootAccuracy)} isNumeric={false} />
                        
                        <div className="h-4 bg-white/[0.01]"></div>

                        {/* Tactical Section */}
                        <div className="px-6 pt-5 pb-2 flex items-center gap-2">
                            <Activity className="w-3.5 h-3.5 text-ef-accent" />
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white">Tactical Profiling</span>
                        </div>
                        <ComparisonRow label="Main Playstyle" values={nPlayers.map(p => p?.playstyle)} isNumeric={false} showWinner={false} />
                        
                        {/* Positions Display */}
                        <div className={`grid border-t border-white/5 bg-white/[0.01] ${
                            selectedIds.length === 2 ? 'grid-cols-2' :
                            selectedIds.length === 3 ? 'grid-cols-3' :
                            'grid-cols-2 lg:grid-cols-4'
                        }`}>
                             {nPlayers.map((p, idx) => (
                                 <div key={idx} className={`p-6 border-white/5 ${idx !== nPlayers.length - 1 ? 'border-r' : ''}`}>
                                    {p ? (
                                        <>
                                            <span className="block text-[9px] font-black uppercase tracking-[0.2em] text-white/20 mb-3 truncate">{p.name}</span>
                                            <div className="space-y-3">
                                                <div className="flex flex-col gap-2">
                                                    <div>
                                                        <span className="block text-[7px] uppercase tracking-widest text-white/40 mb-1.5">Main Position</span>
                                                        <span className="px-2 py-0.5 bg-ef-accent text-[#0a0a0c] text-[9px] font-black rounded-md uppercase italic shadow-lg shadow-ef-accent/10">{p.position}</span>
                                                    </div>
                                                    {(p.secondaryPosition?.length > 0 || p.additionalPositions?.length > 0) && (
                                                        <div>
                                                            <span className="block text-[7px] uppercase tracking-widest text-white/40 mb-1.5">Other Positions</span>
                                                            <div className="flex flex-wrap gap-1.5">
                                                                {p.secondaryPosition?.map(pos => (
                                                                    <span key={pos} className="px-2 py-0.5 bg-white/10 text-white text-[9px] font-black rounded-md uppercase italic">{pos}</span>
                                                                ))}
                                                                {p.additionalPositions?.map(pos => (
                                                                    <span key={pos} className="px-2 py-0.5 border border-ef-accent/30 text-ef-accent/70 text-[9px] font-black rounded-md uppercase italic">{pos}</span>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </>
                                    ) : (
                                        <div className="flex flex-col items-center justify-center h-full opacity-10 py-6">
                                            <span className="text-[9px] font-black uppercase tracking-widest">No Player</span>
                                        </div>
                                    )}
                                 </div>
                             ))}
                        </div>

                        {/* Skills Analysis Section */}
                        {getSkillAnalysis && (
                            <div className="border-t border-white/5">
                                <div className="p-6 bg-white/[0.02]">
                                    <div className="flex items-center justify-between mb-6">
                                        <span className="text-[9px] font-black uppercase tracking-[0.2em] text-white/20 flex items-center gap-2">
                                            <Zap className="w-3 h-3 text-ef-accent" />
                                            Advanced Skill Comparison
                                        </span>
                                        <span className="text-[8px] font-bold text-white/20 uppercase tracking-[0.3em]">Intersection Matrix</span>
                                    </div>
                                    
                                    <div className="space-y-8">
                                        {/* Common Skills */}
                                        <div className="space-y-3 bg-ef-accent/[0.03] p-5 rounded-2xl border border-ef-accent/10">
                                            <div className="flex items-center justify-between border-b border-ef-accent/10 pb-3">
                                                <span className="block text-[8px] font-black uppercase tracking-widest text-ef-accent">Shared by All</span>
                                                <span className="text-[9px] font-bold text-ef-accent/60">{getSkillAnalysis.common.length} Shared</span>
                                            </div>
                                            <div className="flex flex-wrap gap-1.5">
                                                {getSkillAnalysis.common.map(s => (
                                                    <span key={s} className="text-[9px] font-bold text-ef-accent bg-ef-accent/10 px-2.5 py-0.5 rounded-md border border-ef-accent/20">{s}</span>
                                                ))}
                                                {getSkillAnalysis.common.length === 0 && <span className="text-[9px] text-white/10 italic">No shared skills</span>}
                                            </div>
                                        </div>

                                        {/* Unique Skills Grid */}
                                        <div className={`grid gap-6 ${
                                            selectedIds.length === 2 ? 'grid-cols-2' :
                                            selectedIds.length === 3 ? 'grid-cols-3' :
                                            'grid-cols-2 lg:grid-cols-4'
                                        }`}>
                                            {getSkillAnalysis.unique.map((item, idx) => (
                                                <div key={idx} className="space-y-3">
                                                    <span className="block text-[7px] font-black uppercase tracking-widest text-white/40 border-b border-white/5 pb-1.5 truncate">Unique to {item.name}</span>
                                                    <div className="flex flex-wrap gap-1.5">
                                                        {item.skills.map(s => (
                                                            <span key={s} className="text-[8px] font-bold text-white/50 bg-white/5 px-1.5 py-0.5 rounded border border-white/5 transition-colors">{s}</span>
                                                        ))}
                                                        {item.skills.length === 0 && <span className="text-[8px] text-white/10 italic">None</span>}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                <div className="text-center py-32 bg-white/5 border border-white/10 rounded-[3rem] border-dashed opacity-20 mx-auto max-w-4xl">
                    <GitCompare className="w-12 h-12 text-white/20 mx-auto mb-6" />
                    <span className="block text-sm font-black uppercase tracking-[0.3em] mb-2">Comparison Engine Standby</span>
                    <p className="text-[10px] uppercase tracking-widest font-bold text-white/40">Select at least two players to initialize side-by-side analysis</p>
                </div>
            )}
        </div>
    );
};

export default ComparePlayers;
