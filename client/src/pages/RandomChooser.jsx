import React, { useState, useMemo, useTransition } from 'react';
import { Shuffle, Filter, AlertCircle, Users, ChevronDown, ChevronUp, X, Sparkles, PlusSquare, Search } from 'lucide-react';
import PlayerCard from '../components/PlayerCard';
import { PLAYSTYLES, ALL_SKILLS } from '../constants';

const RandomChooser = ({ players, settings, onPlayerClick }) => {
    const [isPending, startTransition] = useTransition();
    const [filters, setFilters] = useState({
        position: 'All',
        club: '',
        nationality: '',
        league: '',
        foot: 'All',
        playstyle: 'All',
        skills: [],
        minGames: 0,
        maxGames: ''
    });
    const [isFiltersExpanded, setIsFiltersExpanded] = useState(false);
    const [totalOutput, setTotalOutput] = useState(1);
    const [randomPlayers, setRandomPlayers] = useState([]);
    const [error, setError] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 20;
    const [skillSearch, setSkillSearch] = useState('');

    const filteredPlayers = useMemo(() => {
        return players.filter(p => {
            const playstyleVal = p.playstyle || '';
            const playerPlaystyle = (typeof playstyleVal === 'object' ? (playstyleVal.name || playstyleVal.label || '') : String(playstyleVal)).toLowerCase();
            const matchesPlaystyle = filters.playstyle === 'All' || playerPlaystyle === filters.playstyle.toLowerCase();
            
            const playerPos = (p.position || '').toUpperCase();
            const matchesPos = filters.position === 'All' || 
                              playerPos === filters.position.toUpperCase() || 
                              (p.secondaryPosition && String(p.secondaryPosition).toUpperCase().includes(filters.position.toUpperCase()));
            
            const matchesClub = !filters.club || (p.club && p.club.toLowerCase().includes(filters.club.toLowerCase()));
            const matchesNat = !filters.nationality || (p.nationality && p.nationality.toLowerCase().includes(filters.nationality.toLowerCase()));
            const matchesLeague = !filters.league || (p.league && p.league.toLowerCase().includes(filters.league.toLowerCase()));
            const footVal = p.strongFoot || p.Foot || p.foot || p['Preferred Foot'] || p['Strong Foot'] || '';
            const playerFoot = (typeof footVal === 'object' ? (footVal.name || footVal.label || '') : String(footVal)).toLowerCase();
            const matchesFoot = filters.foot === 'All' || 
                              playerFoot.includes(filters.foot.toLowerCase()) ||
                              (filters.foot === 'Right' && playerFoot === 'r') ||
                              (filters.foot === 'Left' && playerFoot === 'l');
            const matchesMinGames = (p.matches || 0) >= filters.minGames;
            const matchesMaxGames = filters.maxGames === '' || (p.matches || 0) <= filters.maxGames;
            
            const playerSkills = [...(p.skills || []), ...(p.additionalSkills || [])];
            const matchesSkills = filters.skills.length === 0 || filters.skills.every(skill => playerSkills.includes(skill));

            return matchesPos && matchesClub && matchesNat && matchesLeague && matchesFoot && matchesPlaystyle && matchesSkills && matchesMinGames && matchesMaxGames;
        });
    }, [players, filters]);

    const displayedPlayers = useMemo(() => {
        const start = (currentPage - 1) * pageSize;
        return randomPlayers.slice(start, start + pageSize);
    }, [randomPlayers, currentPage]);

    const totalPages = Math.ceil(randomPlayers.length / pageSize);

    const handleGenerate = () => {
        setError('');
        if (totalOutput > filteredPlayers.length) {
            setError(`Please change the number of outputs. Only ${filteredPlayers.length} players found matching these filters.`);
            setRandomPlayers([]);
            return;
        }

        if (filteredPlayers.length === 0) {
            setError('No players found matching these filters.');
            setRandomPlayers([]);
            return;
        }

        const shuffled = [...filteredPlayers].sort(() => 0.5 - Math.random());
        setRandomPlayers(shuffled.slice(0, totalOutput));
        setCurrentPage(1);
    };

    const handleShowAll = () => {
        setError('');
        if (filteredPlayers.length === 0) {
            setError('No players found matching these filters.');
            setRandomPlayers([]);
            return;
        }
        setRandomPlayers(filteredPlayers);
        setCurrentPage(1);
    };

    const toggleSkill = (skill) => {
        startTransition(() => {
            setFilters(prev => ({
                ...prev,
                skills: prev.skills.includes(skill)
                    ? prev.skills.filter(s => s !== skill)
                    : [...prev.skills, skill]
            }));
        });
    };

    const handleFilterChange = (key, value) => {
        startTransition(() => {
            setFilters(prev => ({ ...prev, [key]: value }));
        });
    };

    const filteredSkills = ALL_SKILLS.filter(s => 
        s.toLowerCase().includes(skillSearch.toLowerCase()) && !filters.skills.includes(s)
    ).slice(0, 5);

    return (
        <div className="max-w-6xl mx-auto p-4 md:p-8 animate-fade-in font-inter text-[13px] bg-black min-h-screen">
            {/* Header Section — Atlas Titlebar Style */}
            <div className="mb-8 border border-[#1e1e1e] bg-[#0f0f0f] rounded-lg overflow-hidden">
                <div className="h-8 px-4 flex items-center justify-between border-b border-[#141414] bg-black/20">
                    <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#0070f3]"></div>
                        <span className="text-[11px] font-bold text-[#aaaaaa] uppercase tracking-[0.08em]">Tools / Randomizer</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <span className="text-[10px] font-mono text-[#585858]">POOL: {filteredPlayers.length} / {players.length}</span>
                    </div>
                </div>
                <div className="px-6 md:px-8 py-3 flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="space-y-1">
                        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white flex items-center gap-3">
                            <Shuffle className="w-6 h-6 text-[#0070f3]" strokeWidth={1.5} />
                            Random <span className="text-white/40">Chooser</span>
                        </h1>
                        <p className="text-[#777777] text-xs max-w-md">Generate random selections or view filtered subsets of your squad using the dense Atlas filtering system.</p>
                    </div>
                    
                    <div className="flex items-center gap-2 bg-black border border-[#1e1e1e] p-1 rounded-md">
                        <div className="px-4 py-2 text-center border-r border-[#1e1e1e]">
                            <div className="text-[10px] font-bold text-[#585858] uppercase tracking-widest mb-0.5">MATCHED</div>
                            <div className="text-lg font-mono font-bold text-white">{filteredPlayers.length}</div>
                        </div>
                        <div className="px-4 py-2 text-center">
                            <div className="text-[10px] font-bold text-[#585858] uppercase tracking-widest mb-0.5">TOTAL</div>
                            <div className="text-lg font-mono font-bold text-[#aaaaaa]">{players.length}</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filter Section — Atlas Card/Panel Style */}
            <div className="mb-6 bg-[#0f0f0f] border border-[#1e1e1e] rounded-lg overflow-hidden shadow-sm">
                <button 
                    onClick={() => setIsFiltersExpanded(!isFiltersExpanded)}
                    className="w-full flex items-center justify-between h-10 px-4 hover:bg-white/[0.02] transition-colors group"
                >
                    <div className="flex items-center gap-3">
                        <Filter className={`w-4 h-4 transition-colors ${isFiltersExpanded ? 'text-[#0070f3]' : 'text-[#777777] group-hover:text-[#aaaaaa]'}`} strokeWidth={1.5} />
                        <span className="text-[11px] font-bold uppercase tracking-widest text-[#aaaaaa]">Filters & Parameters</span>
                        {Object.values(filters).some(v => v !== 'All' && v !== '' && (Array.isArray(v) ? v.length > 0 : true)) && (
                            <span className="w-1.5 h-1.5 rounded-full bg-[#0070f3] shadow-[0_0_8px_rgba(0,112,243,0.5)]"></span>
                        )}
                    </div>
                    {isFiltersExpanded ? <ChevronUp className="w-4 h-4 text-[#333333]" strokeWidth={1.5} /> : <ChevronDown className="w-4 h-4 text-[#333333]" strokeWidth={1.5} />}
                </button>

                {isFiltersExpanded && (
                    <div className="p-6 pt-2 border-t border-[#141414] space-y-6 animate-in fade-in slide-in-from-top-1 duration-200">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                            <div className="space-y-2">
                                <label className="text-[11px] font-bold uppercase tracking-widest text-[#777777]">Position</label>
                                <select
                                    value={filters.position}
                                    onChange={(e) => handleFilterChange('position', e.target.value)}
                                    className="w-full h-7 bg-[#0a0a0a] border border-[#1e1e1e] rounded-md px-2 text-[12px] text-white outline-none focus:border-[#0070f3] transition-colors cursor-pointer appearance-none"
                                >
                                    {['All', 'CF', 'SS', 'LWF', 'RWF', 'LMF', 'RMF', 'AMF', 'CMF', 'DMF', 'CB', 'LB', 'RB', 'GK'].map(pos => (
                                        <option key={pos} value={pos} className="bg-[#0f0f0f]">{pos === 'All' ? 'All Positions' : pos}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[11px] font-bold uppercase tracking-widest text-[#777777]">Club</label>
                                <input
                                    type="text"
                                    placeholder="Search club..."
                                    value={filters.club}
                                    onChange={(e) => handleFilterChange('club', e.target.value)}
                                    className="w-full h-7 bg-[#0a0a0a] border border-[#1e1e1e] rounded-md px-2 text-[12px] text-white outline-none focus:border-[#0070f3] transition-colors placeholder:text-[#333333]"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[11px] font-bold uppercase tracking-widest text-[#777777]">League</label>
                                <input
                                    type="text"
                                    placeholder="Search league..."
                                    value={filters.league}
                                    onChange={(e) => handleFilterChange('league', e.target.value)}
                                    className="w-full h-7 bg-[#0a0a0a] border border-[#1e1e1e] rounded-md px-2 text-[12px] text-white outline-none focus:border-[#0070f3] transition-colors placeholder:text-[#333333]"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[11px] font-bold uppercase tracking-widest text-[#777777]">Nationality</label>
                                <input
                                    type="text"
                                    placeholder="Search nation..."
                                    value={filters.nationality}
                                    onChange={(e) => handleFilterChange('nationality', e.target.value)}
                                    className="w-full h-7 bg-[#0a0a0a] border border-[#1e1e1e] rounded-md px-2 text-[12px] text-white outline-none focus:border-[#0070f3] transition-colors placeholder:text-[#333333]"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-[#141414]">
                            <div className="space-y-2">
                                <label className="text-[11px] font-bold uppercase tracking-widest text-[#777777]">Matches (Min)</label>
                                <input
                                    type="number"
                                    min="0"
                                    value={filters.minGames}
                                    onChange={(e) => handleFilterChange('minGames', parseInt(e.target.value) || 0)}
                                    className="w-full h-7 bg-[#0a0a0a] border border-[#1e1e1e] rounded-md px-2 font-mono text-[12px] text-white outline-none focus:border-[#0070f3] transition-colors"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[11px] font-bold uppercase tracking-widest text-[#777777]">Matches (Max)</label>
                                <input
                                    type="number"
                                    min="0"
                                    placeholder="No limit"
                                    value={filters.maxGames}
                                    onChange={(e) => handleFilterChange('maxGames', e.target.value === '' ? '' : parseInt(e.target.value))}
                                    className="w-full h-7 bg-[#0a0a0a] border border-[#1e1e1e] rounded-md px-2 font-mono text-[12px] text-white outline-none focus:border-[#0070f3] transition-colors placeholder:text-[#333333]"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-[#141414]">
                            <div className="space-y-2">
                                <label className="text-[11px] font-bold uppercase tracking-widest text-[#777777]">Preferred Foot</label>
                                <select
                                    value={filters.foot}
                                    onChange={(e) => handleFilterChange('foot', e.target.value)}
                                    className="w-full h-7 bg-[#0a0a0a] border border-[#1e1e1e] rounded-md px-2 text-[12px] text-white outline-none focus:border-[#0070f3] transition-colors cursor-pointer appearance-none"
                                >
                                    <option value="All" className="bg-[#0f0f0f]">All Feet</option>
                                    <option value="Right" className="bg-[#0f0f0f]">Right Foot</option>
                                    <option value="Left" className="bg-[#0f0f0f]">Left Foot</option>
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[11px] font-bold uppercase tracking-widest text-[#777777]">Playstyle</label>
                                <select
                                    value={filters.playstyle}
                                    onChange={(e) => handleFilterChange('playstyle', e.target.value)}
                                    className="w-full h-7 bg-[#0a0a0a] border border-[#1e1e1e] rounded-md px-2 text-[12px] text-white outline-none focus:border-[#0070f3] transition-colors cursor-pointer appearance-none"
                                >
                                    <option value="All" className="bg-[#0f0f0f]">All Playstyles</option>
                                    {PLAYSTYLES.map(style => (
                                        <option key={style} value={style} className="bg-[#0f0f0f]">{style}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[11px] font-bold uppercase tracking-widest text-[#777777]">Skill Filter</label>
                                <div className="relative">
                                    <div className="absolute left-2 top-1/2 -translate-y-1/2 text-[#333333]">
                                        <Search className="w-3 h-3" />
                                    </div>
                                    <input
                                        type="text"
                                        placeholder="Search skills..."
                                        value={skillSearch}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            startTransition(() => {
                                                setSkillSearch(val);
                                            });
                                        }}
                                        className="w-full h-7 bg-[#0a0a0a] border border-[#1e1e1e] rounded-md pl-7 pr-2 text-[12px] text-white outline-none focus:border-[#0070f3] transition-colors placeholder:text-[#333333]"
                                    />
                                    {skillSearch && (
                                        <div className="absolute top-[calc(100%+4px)] left-0 w-full bg-[#0f0f0f] border border-[#1e1e1e] rounded-md overflow-hidden z-20 shadow-xl">
                                            {filteredSkills.map(skill => (
                                                <button
                                                    key={skill}
                                                    onClick={() => {
                                                        toggleSkill(skill);
                                                        setSkillSearch('');
                                                    }}
                                                    className="w-full text-left px-3 py-1.5 text-[11px] text-[#aaaaaa] hover:text-white hover:bg-[#171717] transition-colors flex items-center justify-between group"
                                                >
                                                    {skill}
                                                    <PlusSquare className="w-3 h-3 text-[#333333] group-hover:text-[#0070f3] transition-colors" strokeWidth={1.5} />
                                                </button>
                                            ))}
                                            {filteredSkills.length === 0 && (
                                                <div className="px-3 py-2 text-[10px] text-[#585858] italic text-center">No skills found</div>
                                            )}
                                        </div>
                                    )}
                                </div>
                                
                                {filters.skills.length > 0 && (
                                    <div className="flex flex-wrap gap-1.5 mt-2">
                                        {filters.skills.map(skill => (
                                            <span 
                                                key={skill}
                                                className="px-2 py-0.5 rounded-sm bg-[#171717] border border-[#3d3d3d] text-[#aaaaaa] text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 hover:border-[#777777] transition-colors group"
                                            >
                                                {skill}
                                                <X 
                                                    className="w-2.5 h-2.5 cursor-pointer text-[#333333] group-hover:text-white transition-colors" 
                                                    onClick={() => toggleSkill(skill)}
                                                    strokeWidth={2}
                                                />
                                            </span>
                                        ))}
                                        <button 
                                            onClick={() => setFilters(prev => ({...prev, skills: []}))}
                                            className="text-[10px] font-bold uppercase tracking-widest text-[#585858] hover:text-[#dc2626] transition-colors px-1"
                                        >
                                            Reset
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="pt-4 flex justify-between items-center">
                            <span className="text-[10px] font-mono text-[#585858]">PARAM_COUNT: {Object.values(filters).filter(v => v !== 'All' && v !== '' && (Array.isArray(v) ? v.length > 0 : true)).length}</span>
                            <button 
                                onClick={() => setFilters({
                                    position: 'All',
                                    club: '',
                                    nationality: '',
                                    league: '',
                                    foot: 'All',
                                    playstyle: 'All',
                                    skills: [],
                                    minGames: 0,
                                    maxGames: ''
                                })}
                                className="h-6 px-3 rounded-md border border-[#1e1e1e] text-[10px] font-bold uppercase tracking-widest text-[#aaaaaa] hover:bg-white/[0.04] hover:text-white transition-all flex items-center gap-2"
                            >
                                <X className="w-3 h-3" strokeWidth={1.5} />
                                Clear All Parameters
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Controls Area — Atlas Toolbar Style */}
            <div className="mb-10 flex flex-col md:flex-row items-stretch md:items-end gap-3 p-1 bg-[#0f0f0f] border border-[#1e1e1e] rounded-lg shadow-sm">
                <div className="flex-1 flex flex-col sm:flex-row items-stretch md:items-end gap-3 p-4">
                    <div className="w-full sm:w-32 space-y-2">
                        <label className="text-[11px] font-bold uppercase tracking-widest text-[#777777]">Output</label>
                        <div className="relative">
                            <input
                                type="number"
                                min="1"
                                value={totalOutput}
                                onChange={(e) => setTotalOutput(parseInt(e.target.value) || 1)}
                                className="w-full h-7 bg-[#0a0a0a] border border-[#1e1e1e] rounded-md pl-7 pr-2 font-mono text-[12px] text-white outline-none focus:border-[#0070f3] transition-colors"
                            />
                            <Users className="w-3.5 h-3.5 text-[#333333] absolute left-2 top-1/2 -translate-y-1/2" strokeWidth={1.5} />
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-2 flex-1 sm:flex-none">
                        <button
                            onClick={handleGenerate}
                            disabled={filteredPlayers.length === 0}
                            className={`flex-1 sm:flex-none h-7 px-4 rounded-md text-[11px] font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${
                                filteredPlayers.length === 0 
                                ? 'bg-[#0a0a0a] text-[#333333] cursor-not-allowed border border-[#1e1e1e]' 
                                : 'bg-[#ededed] text-black hover:bg-white active:scale-[0.98]'
                            }`}
                        >
                            <Shuffle className="w-3.5 h-3.5" strokeWidth={1.5} />
                            Generate
                        </button>

                        <button
                            onClick={handleShowAll}
                            disabled={filteredPlayers.length === 0}
                            className={`flex-1 sm:flex-none h-7 px-4 rounded-md text-[11px] font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2 border ${
                                filteredPlayers.length === 0 
                                ? 'border-[#1e1e1e] bg-black text-[#333333] cursor-not-allowed' 
                                : 'border-[#1e1e1e] bg-[#0a0a0a] text-[#aaaaaa] hover:bg-[#171717] hover:text-white active:scale-[0.98]'
                            }`}
                        >
                            <Users className="w-3.5 h-3.5" strokeWidth={1.5} />
                            View All
                        </button>
                    </div>
                </div>

                {filteredPlayers.length > 0 && (
                    <div className="hidden lg:flex flex-col items-end justify-center p-4 border-l border-[#141414] bg-black/20 min-w-[120px]">
                        <span className="text-[10px] font-bold text-[#585858] uppercase tracking-[0.2em] leading-none mb-1">POOL_SIZE</span>
                        <span className="text-[12px] font-mono font-bold text-[#0070f3] leading-none">
                            {filteredPlayers.length} UNIT(S)
                        </span>
                    </div>
                )}
            </div>

            {/* Error Interface — Atlas Alert Style */}
            {error && (
                <div className="mb-8 p-4 bg-[#f44747]/[0.08] border border-[#f44747]/30 rounded-md flex items-start gap-3 text-[#f44747] animate-in slide-in-from-right-1">
                    <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" strokeWidth={1.5} />
                    <div className="space-y-1">
                        <span className="block text-[11px] font-bold uppercase tracking-widest">Operation Failed</span>
                        <span className="block text-[11px] text-[#f44747]/80">{error}</span>
                    </div>
                </div>
            )}

            {/* Results Grid — Atlas Masonry/Grid Patterns */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {displayedPlayers.map(player => (
                    <div 
                        key={player._id} 
                        className="animate-in fade-in zoom-in-95 duration-300 cursor-pointer hover:translate-y-[-2px] transition-transform"
                        onClick={() => onPlayerClick(player)}
                    >
                        <div className="p-1.5 bg-[#0f0f0f] border border-[#1e1e1e] rounded-md hover:border-[#3d3d3d] transition-colors shadow-sm">
                            <PlayerCard 
                                player={player} 
                                players={players}
                                settings={{...settings, cardSize: 'sm'}} 
                            />
                        </div>
                    </div>
                ))}
                
                {randomPlayers.length === 0 && !error && (
                    <div className="col-span-full py-24 flex flex-col items-center justify-center border border-dashed border-[#1e1e1e] rounded-lg bg-[#0f0f0f]/50">
                        <Sparkles className="w-8 h-8 mb-4 text-[#333333]" strokeWidth={1} />
                        <p className="font-bold uppercase tracking-[0.3em] text-[11px] text-[#585858]">READY_FOR_INPUT</p>
                        <p className="text-[10px] text-[#333333] mt-2">Adjust filters and press Generate to begin.</p>
                    </div>
                )}
            </div>

            {/* Pagination — Atlas Pagination Style */}
            {totalPages > 1 && (
                <div className="mt-12 py-8 border-t border-[#1e1e1e] flex flex-col items-center gap-4">
                    <nav className="flex items-center gap-1.5">
                        <button
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                            className={`w-8 h-8 rounded-md border border-[#1e1e1e] flex items-center justify-center transition-all ${currentPage === 1 ? 'opacity-20 cursor-not-allowed' : 'hover:bg-[#171717] hover:border-[#3d3d3d] active:scale-95'}`}
                        >
                            <ChevronUp className="w-4 h-4 -rotate-90 text-[#aaaaaa]" strokeWidth={1.5} />
                        </button>

                        <div className="flex items-center gap-1.5">
                            {[...Array(totalPages)].map((_, i) => {
                                const p = i + 1;
                                if (p === 1 || p === totalPages || (p >= currentPage - 1 && p <= currentPage + 1)) {
                                    return (
                                        <button
                                            key={p}
                                            onClick={() => setCurrentPage(p)}
                                            className={`w-8 h-8 rounded-md border text-[11px] font-bold transition-all ${currentPage === p ? 'bg-[#ededed] border-[#ededed] text-black' : 'border-[#1e1e1e] text-[#aaaaaa] hover:bg-[#171717] hover:border-[#3d3d3d]'}`}
                                        >
                                            {p}
                                        </button>
                                    );
                                }
                                if (p === 2 || p === totalPages - 1) {
                                    return <span key={p} className="text-[#333333] px-1 font-mono">..</span>;
                                }
                                return null;
                            })}
                        </div>

                        <button
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                            className={`w-8 h-8 rounded-md border border-[#1e1e1e] flex items-center justify-center transition-all ${currentPage === totalPages ? 'opacity-20 cursor-not-allowed' : 'hover:bg-[#171717] hover:border-[#3d3d3d] active:scale-95'}`}
                        >
                            <ChevronDown className="w-4 h-4 -rotate-90 text-[#aaaaaa]" strokeWidth={1.5} />
                        </button>
                    </nav>
                    
                    <div className="flex items-center gap-3">
                        <span className="text-[10px] font-mono text-[#585858] uppercase tracking-widest">Page</span>
                        <span className="px-2 py-0.5 rounded-sm bg-[#171717] text-[#0070f3] font-mono text-[11px] font-bold">{currentPage}</span>
                        <span className="text-[10px] font-mono text-[#585858] uppercase tracking-widest">of {totalPages}</span>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RandomChooser;
