import { useState, useMemo, useEffect } from 'react';
import PlayerCard from './PlayerCard';
import { Search, X, GitCompare, Shield, Activity, Zap, Star, Plus, User, Info } from 'lucide-react';

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
                (p.name || '').toLowerCase().includes(searchLower) || 
                (p.position || '').toLowerCase().includes(searchLower) ||
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
        
        const common = [...skillSets[0]].filter(skill => 
            skillSets.every(set => set.has(skill))
        );

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
            return reverse ? (num === minVal && validNumericValues.some(v => v !== minVal)) : (num === maxVal && validNumericValues.some(v => v !== maxVal));
        };

        return (
            <div className="py-2 border-b border-[var(--border-subtle)] group hover:bg-[var(--bg-hover)] transition-all px-4">
                <div className="flex flex-col gap-1.5">
                    <span className="atlas-stat-label !text-[9px] !text-[var(--text-tertiary)] group-hover:!text-[var(--text-secondary)] transition-colors tracking-[0.15em] uppercase font-black">{label}</span>
                    <div className={`grid gap-4 items-center ${
                        selectedIds.length === 2 ? 'grid-cols-2' : 
                        selectedIds.length === 3 ? 'grid-cols-3' : 
                        'grid-cols-2 lg:grid-cols-4'
                    }`}>
                        {values.map((v, i) => (
                            <div key={i} className="flex flex-col min-w-0">
                                {selectedIds.length > 2 && nPlayers[i] && (
                                    <span className="text-[8px] font-black uppercase tracking-[0.1em] text-[var(--text-ghost)] truncate mb-0.5">{nPlayers[i].name}</span>
                                )}
                                <div className="flex items-center gap-1.5">
                                    <div className={`font-mono transition-all duration-120 flex items-baseline gap-0.5 ${isWinner(v, i) ? 'text-[var(--accent-highlight)] font-bold' : 'text-[var(--text-primary)]'}`}>
                                        <span className="text-[12px] tabular-nums">{v || '-'}</span>
                                        {v && suffix && v !== '-' && <span className="text-[8px] opacity-40 font-ui font-black uppercase tracking-tighter ml-0.5">{suffix}</span>}
                                    </div>
                                    {isWinner(v, i) && <div className="w-1 h-1 rounded-full bg-[var(--accent-highlight)] animate-pulse" />}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="max-w-7xl mx-auto px-4 md:px-8 pt-0 pb-32 atlas-reveal">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-12">
                <div className="space-y-1">
                    <div className="flex items-center gap-2 opacity-80">
                        <GitCompare size={12} className="text-[var(--accent-highlight)]" />
                        <p className="atlas-eyebrow !text-[9px]">ANALYTICS ENGINE V2.4</p>
                    </div>
                    <h1 className="atlas-display !text-5xl !tracking-tighter">Compare <span className="text-[var(--text-tertiary)]">Players</span></h1>
                </div>
                
                <div className="flex items-center gap-2 bg-[var(--bg-raised)] p-1.5 rounded-[var(--radius-lg)] border border-[var(--border-subtle)]">
                    <button 
                        onClick={resetComparison}
                        className="atlas-btn atlas-btn-ghost !h-9 !px-4 hover:!text-[var(--status-error)]"
                    >
                        <X size={14} strokeWidth={1.5} />
                        <span className="text-[10px] font-black tracking-widest">PURGE</span>
                    </button>
                    <div className="w-px h-4 bg-[var(--border-subtle)] mx-1"></div>
                    <button 
                        onClick={addSlot}
                        disabled={selectedIds.length >= 4}
                        className="atlas-btn atlas-btn-primary !h-9 !px-6 disabled:opacity-20 shadow-lg shadow-white/5"
                    >
                        <Plus size={14} strokeWidth={1.5} />
                        <span className="text-[10px] font-black tracking-widest">ADD NODE</span>
                    </button>
                </div>
            </div>

            {/* Selection Slots */}
            <div className={`grid gap-4 mb-12 ${
                selectedIds.length === 2 ? 'grid-cols-1 md:grid-cols-2' :
                selectedIds.length === 3 ? 'grid-cols-1 md:grid-cols-3' :
                'grid-cols-1 md:grid-cols-2 lg:grid-cols-4'
            }`}>
                {selectedIds.map((id, idx) => (
                    <div key={idx} className={`atlas-card !overflow-visible relative group transition-all duration-200 ${!id ? 'border-dashed border-[var(--border-strong)]' : ''} ${searchTerms[idx] ? 'z-[100]' : 'z-10'}`}>
                        <div className="atlas-card-header justify-between bg-[var(--bg-raised)]">
                            <div className="flex items-center gap-2">
                                <span className={`atlas-dot ${id ? 'atlas-dot-info' : 'atlas-dot-warning'}`}></span>
                                <span className="atlas-panel-title">Node {idx + 1}</span>
                            </div>
                            {selectedIds.length > 2 && (
                                <button 
                                    onClick={() => removeSlot(idx)}
                                    className="atlas-btn atlas-btn-icon atlas-btn-sm atlas-btn-ghost opacity-0 group-hover:opacity-100"
                                >
                                    <X size={12} strokeWidth={1.5} />
                                </button>
                            )}
                        </div>
                        
                        <div className="p-4 bg-[var(--bg-surface)]">
                            {id ? (
                                <div className="space-y-4">
                                    <div className="flex items-center gap-4">
                                        <div className="w-14 h-14 rounded-[var(--radius-md)] bg-[var(--bg-input)] flex items-center justify-center border border-[var(--border-subtle)] group-hover:border-[var(--border-strong)] transition-colors overflow-hidden">
                                            {selectedPlayers[idx]?.image ? (
                                                <img src={selectedPlayers[idx].image} alt="" className="w-full h-full object-cover" />
                                            ) : (
                                                <User size={24} strokeWidth={1.5} className="text-[var(--text-ghost)]" />
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="text-[13px] font-bold text-[var(--text-primary)] truncate">{selectedPlayers[idx]?.name}</h3>
                                            <div className="flex flex-col gap-0.5 mt-1">
                                                <span className="text-[10px] text-[var(--accent-highlight)] font-black uppercase tracking-wider">{selectedPlayers[idx]?.position}</span>
                                                <span className="text-[9px] text-[var(--text-tertiary)] uppercase tracking-widest font-bold truncate">{selectedPlayers[idx]?.club || 'Free Agent'}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={() => setPlayerId(idx, null)}
                                        className="atlas-btn atlas-btn-secondary w-full atlas-btn-sm"
                                    >
                                        REPLACE PLAYER
                                    </button>
                                </div>
                            ) : (
                                <div className="relative py-2">
                                    <div className="relative">
                                        <Search size={14} strokeWidth={1.5} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-ghost)]" />
                                        <input 
                                            type="text"
                                            placeholder="SEARCH DATABASE..."
                                            className="atlas-input w-full pl-10 !h-10 uppercase text-[10px] font-bold tracking-widest"
                                            value={searchTerms[idx]}
                                            onChange={(e) => setSearchTerm(idx, e.target.value)}
                                        />
                                    </div>
                                    
                                    {searchTerms[idx] && (
                                        <div className="absolute left-0 right-0 top-full mt-3 z-[100] max-h-[250px] overflow-y-auto overscroll-contain custom-scrollbar bg-zinc-950 shadow-[0_20px_50px_rgba(0,0,0,0.8)] border border-[var(--border-strong)] rounded-[var(--radius-lg)] pointer-events-auto">
                                            {filteredPlayers[idx].length > 0 ? (
                                                filteredPlayers[idx].map(p => (
                                                    <div 
                                                        key={p._id}
                                                        onClick={() => setPlayerId(idx, p._id)}
                                                        className="px-4 py-3 hover:bg-[var(--bg-selected)] cursor-pointer flex items-center justify-between border-b border-[var(--border-subtle)] last:border-0 transition-colors group/item"
                                                    >
                                                        <div className="min-w-0 flex items-center gap-3">
                                                            <div className="w-10 h-10 rounded-[var(--radius-sm)] bg-[var(--bg-base)] flex items-center justify-center border border-[var(--border-subtle)] overflow-hidden">
                                                                {p.image ? <img src={p.image} className="w-full h-full object-cover" /> : <User size={14} strokeWidth={1.5} />}
                                                            </div>
                                                            <div>
                                                                <p className="text-[12px] font-bold text-[var(--text-primary)] truncate">{p.name}</p>
                                                                <p className="text-[9px] text-[var(--text-tertiary)] uppercase font-bold tracking-widest">{p.position} · {p.rating} RATING</p>
                                                            </div>
                                                        </div>
                                                        <Plus size={14} strokeWidth={1.5} className="text-[var(--text-ghost)] group-hover/item:text-[var(--accent-highlight)] transition-colors" />
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="p-8 text-center">
                                                    <Info size={20} strokeWidth={1} className="mx-auto mb-3 text-[var(--text-ghost)] opacity-50" />
                                                    <span className="text-[10px] text-[var(--text-ghost)] uppercase tracking-widest font-black block">No Data Points Found</span>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* Comparison Stats */}
            {activeNPlayers.length >= 2 ? (
                <div className="atlas-card !border-white/5 shadow-2xl">
                    <div className="atlas-card-header justify-between px-6 bg-zinc-950/80 backdrop-blur-md border-b border-white/5">
                        <div className="flex items-center gap-3">
                            <div className="w-2 h-2 rounded-full bg-[var(--accent-highlight)] animate-pulse shadow-[0_0_10px_var(--accent-highlight)]"></div>
                            <h2 className="atlas-panel-title !text-[10px] !tracking-[0.2em] font-black text-white">Comparative Diagnostics <span className="mx-2 opacity-20">|</span> {activeNPlayers.length} Nodes Active</h2>
                        </div>
                        <div className="hidden md:flex items-center gap-6">
                            <div className="flex items-center gap-2 px-3 py-1 bg-zinc-900 rounded-full border border-white/5">
                                <Zap size={10} strokeWidth={2} className="text-[var(--accent-highlight)]" />
                                <span className="text-[8px] font-black text-zinc-400 uppercase tracking-widest">Efficiency Lead Highlighted</span>
                            </div>
                        </div>
                    </div>
                    
                    <div className="divide-y divide-white/5 bg-black">
                        {/* Section Generator */}
                        {[
                            { title: 'Performance Metrics', icon: <Star size={10} />, rows: [
                                { label: 'Overall Rating', key: 'rating' },
                                { label: 'Matches Played', key: 'matches' },
                                { label: 'Goals Scored', key: 'goals' },
                                { label: 'Assists Recorded', key: 'assists' },
                                { label: 'Goals Per Game', key: 'goalsPerGame', suffix: 'AVG' },
                                { label: 'Assists Per Game', key: 'assistsPerGame', suffix: 'AVG' },
                                { label: 'G+A Contribution', key: 'gaPerGame', suffix: 'AVG' }
                            ]},
                            { title: 'Physical & Biographical', icon: <Shield size={10} />, rows: [
                                { label: 'Height', key: 'height', suffix: 'CM' },
                                { label: 'Weight', key: 'weight', suffix: 'KG', showWinner: false },
                                { label: 'Biological Age', key: 'age', reverse: true },
                                { label: 'Preferred Foot', key: 'strongFoot', isNumeric: false, showWinner: false }
                            ]},
                            { title: 'Technical & Conditioning', icon: <Zap size={10} />, rows: [
                                { label: 'Form / Conditioning', key: 'form', isNumeric: false },
                                { label: 'Injury Resistance', key: 'injuryResistance', isNumeric: false },
                                { label: 'Weak Foot Usage', key: 'weakFootUsage', isNumeric: false },
                                { label: 'Weak Foot Accuracy', key: 'weakFootAccuracy', isNumeric: false }
                            ]},
                            { title: 'Tactical Profiling', icon: <Activity size={10} />, rows: [
                                { label: 'Main Playstyle', key: 'playstyle', isNumeric: false, showWinner: false }
                            ]}
                        ].map((section, sIdx) => (
                            <div key={sIdx}>
                                <div className="bg-zinc-950 px-6 py-2.5 flex items-center gap-3 border-b border-white/5">
                                    <div className="text-zinc-500">{section.icon}</div>
                                    <span className="text-[9px] font-black text-zinc-500 uppercase tracking-[0.2em]">{section.title}</span>
                                </div>
                                {section.rows.map((row, rIdx) => (
                                    <ComparisonRow 
                                        key={rIdx} 
                                        label={row.label} 
                                        values={nPlayers.map(p => p?.[row.key])}
                                        suffix={row.suffix}
                                        isNumeric={row.isNumeric !== false}
                                        reverse={row.reverse}
                                        showWinner={row.showWinner !== false}
                                    />
                                ))}
                            </div>
                        ))}
                        
                        {/* Positions Display */}
                        <div className={`grid divide-x divide-white/5 border-t border-white/5 ${
                            selectedIds.length === 2 ? 'grid-cols-2' :
                            selectedIds.length === 3 ? 'grid-cols-3' :
                            'grid-cols-2 lg:grid-cols-4'
                        }`}>
                             {nPlayers.map((p, idx) => (
                                 <div key={idx} className="p-8 space-y-8 bg-zinc-950/20">
                                    {p ? (
                                        <>
                                            <div className="flex items-center justify-between border-b border-white/5 pb-4">
                                                <span className="text-[12px] font-black text-white truncate tracking-tight">{p.name}</span>
                                                <span className="atlas-badge !bg-[var(--accent-highlight)]/10 !text-[var(--accent-highlight)] !border-[var(--accent-highlight)]/20 !text-[9px]">{p.position}</span>
                                            </div>
                                            <div className="space-y-6">
                                                {(p.secondaryPosition?.length > 0 || p.additionalPositions?.length > 0) && (
                                                    <div className="space-y-4">
                                                        <span className="text-[8px] font-black text-zinc-600 uppercase tracking-[0.2em] block">Position Matrix</span>
                                                        <div className="flex flex-wrap gap-2">
                                                            {p.secondaryPosition?.map(pos => (
                                                                <span key={pos} className="px-2 py-0.5 rounded-sm bg-zinc-900 border border-white/5 text-[9px] font-bold text-zinc-300">{pos}</span>
                                                            ))}
                                                            {p.additionalPositions?.map(pos => (
                                                                <span key={pos} className="px-2 py-0.5 rounded-sm bg-black border border-zinc-800 text-[9px] font-bold text-zinc-500 opacity-60">{pos}</span>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </>
                                    ) : (
                                        <div className="flex flex-col items-center justify-center h-full opacity-5 py-12">
                                            <span className="text-[10px] font-black tracking-[0.3em]">OFFLINE</span>
                                        </div>
                                    )}
                                 </div>
                             ))}
                        </div>

                        {/* Skills Analysis Section */}
                        {getSkillAnalysis && (
                            <div className="p-10 bg-black border-t border-white/5">
                                <div className="flex items-center gap-4 mb-10">
                                    <div className="w-10 h-10 bg-[var(--accent-highlight)]/10 rounded-[var(--radius-md)] border border-[var(--accent-highlight)]/20 flex items-center justify-center">
                                        <Zap size={18} strokeWidth={2} className="text-[var(--accent-highlight)]" />
                                    </div>
                                    <div>
                                        <span className="text-[11px] font-black text-white uppercase tracking-[0.2em] block">Tactical Correlation Engine</span>
                                        <p className="text-[9px] uppercase tracking-widest text-zinc-500 font-bold mt-1">Synergy and specialization diagnostics report</p>
                                    </div>
                                </div>
                                
                                <div className="space-y-12">
                                    {/* Common Skills */}
                                    <div className="space-y-5 bg-zinc-950 p-8 rounded-[var(--radius-lg)] border border-white/5 shadow-2xl relative overflow-hidden group">
                                        <div className="absolute top-0 left-0 w-1 h-full bg-[var(--accent-highlight)] opacity-50"></div>
                                        <div className="flex items-center justify-between border-b border-white/5 pb-5">
                                            <div className="flex items-center gap-3">
                                                <div className="w-1.5 h-1.5 rounded-full bg-[var(--accent-highlight)] shadow-[0_0_8px_var(--accent-highlight)]"></div>
                                                <span className="text-[10px] font-black text-white uppercase tracking-[0.2em]">Core Synergy Matrix</span>
                                            </div>
                                            <span className="text-[10px] font-black text-[var(--accent-highlight)] uppercase tracking-widest bg-[var(--accent-highlight)]/10 px-3 py-1 rounded-full">{getSkillAnalysis.common.length} Overlapping Skills</span>
                                        </div>
                                        <div className="flex flex-wrap gap-2.5 pt-2">
                                            {getSkillAnalysis.common.map(s => (
                                                <span key={s} className="px-3 py-1 rounded-sm bg-zinc-900 border border-white/10 text-[10px] font-bold text-zinc-300 hover:border-[var(--accent-highlight)]/30 transition-colors uppercase tracking-tight">{s}</span>
                                            ))}
                                            {getSkillAnalysis.common.length === 0 && <span className="text-[10px] text-zinc-600 italic font-black uppercase tracking-widest">Zero tactical overlap detected</span>}
                                        </div>
                                    </div>

                                    {/* Unique Skills Grid */}
                                    <div className="space-y-5">
                                        <span className="text-[8px] font-black text-zinc-600 uppercase tracking-[0.3em] block px-1">Node Specializations</span>
                                        <div className={`grid gap-5 ${
                                            selectedIds.length === 2 ? 'grid-cols-2' :
                                            selectedIds.length === 3 ? 'grid-cols-3' : 
                                            'grid-cols-2 lg:grid-cols-4'
                                        }`}>
                                            {getSkillAnalysis.unique.map((item, idx) => (
                                                <div key={idx} className="space-y-5 p-6 rounded-[var(--radius-lg)] bg-zinc-950/50 border border-white/5 hover:border-white/10 hover:bg-zinc-950 transition-all group">
                                                    <div className="flex items-center gap-2 border-b border-white/5 pb-4">
                                                        <div className="w-1 h-3 bg-zinc-800 group-hover:bg-[var(--accent-highlight)] transition-colors"></div>
                                                        <span className="text-[10px] font-black text-zinc-400 group-hover:text-white uppercase tracking-wider truncate block">{item.name}</span>
                                                    </div>
                                                    <div className="flex flex-wrap gap-1.5">
                                                        {item.skills.map(s => (
                                                            <span key={s} className="text-[9px] font-bold text-zinc-500 hover:text-zinc-300 transition-colors cursor-default">#{s.replace(/\s+/g, '')}</span>
                                                        ))}
                                                        {item.skills.length === 0 && <span className="text-[9px] text-zinc-700 italic font-black">NO_UNIQUE_DATA</span>}
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
                <div className="text-center py-40 bg-black border border-dashed border-white/5 rounded-[var(--radius-lg)] mx-auto max-w-2xl atlas-reveal shadow-[inset_0_20px_50px_rgba(0,0,0,0.5)]">
                    <div className="w-20 h-20 bg-zinc-950 rounded-full flex items-center justify-center border border-white/5 mx-auto mb-8 shadow-2xl">
                        <GitCompare size={32} strokeWidth={1} className="text-zinc-800" />
                    </div>
                    <h2 className="text-[13px] font-black text-white uppercase tracking-[0.4em] mb-4">Engine Awaiting Input</h2>
                    <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-zinc-500 max-w-sm mx-auto leading-relaxed px-6 opacity-60">
                        Populate selection nodes to initialize side-by-side performance analytics and tactical diagnostics
                    </p>
                </div>
            )}
        </div>
    );
};

export default ComparePlayers;
