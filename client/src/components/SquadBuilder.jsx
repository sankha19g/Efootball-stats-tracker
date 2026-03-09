import { useState, useMemo, useEffect, useRef } from 'react';
import SquadEditor from './SquadEditor';

const FORMATIONS = {
    '4-3-3': [
        { pos: 'GK', x: 50, y: 88 },
        { pos: 'CB', x: 35, y: 72 }, { pos: 'CB', x: 65, y: 72 },
        { pos: 'LB', x: 15, y: 68 }, { pos: 'RB', x: 85, y: 68 },
        { pos: 'CMF', x: 50, y: 52 }, { pos: 'CMF', x: 28, y: 48 }, { pos: 'CMF', x: 72, y: 48 },
        { pos: 'LWF', x: 20, y: 22 }, { pos: 'RWF', x: 80, y: 22 }, { pos: 'CF', x: 50, y: 12 }
    ],
    '4-4-2': [
        { pos: 'GK', x: 50, y: 88 },
        { pos: 'CB', x: 35, y: 72 }, { pos: 'CB', x: 65, y: 72 },
        { pos: 'LB', x: 15, y: 68 }, { pos: 'RB', x: 85, y: 68 },
        { pos: 'LMF', x: 15, y: 42 }, { pos: 'RMF', x: 85, y: 42 },
        { pos: 'CMF', x: 35, y: 48 }, { pos: 'CMF', x: 65, y: 48 },
        { pos: 'CF', x: 35, y: 18 }, { pos: 'CF', x: 65, y: 18 }
    ],
    '3-2-4-1': [
        { pos: 'GK', x: 50, y: 88 },
        { pos: 'CB', x: 50, y: 72 }, { pos: 'CB', x: 25, y: 72 }, { pos: 'CB', x: 75, y: 72 },
        { pos: 'DMF', x: 35, y: 58 }, { pos: 'DMF', x: 65, y: 58 },
        { pos: 'AMF', x: 35, y: 38 }, { pos: 'AMF', x: 65, y: 38 },
        { pos: 'LMF', x: 15, y: 38 }, { pos: 'RMF', x: 85, y: 38 },
        { pos: 'CF', x: 50, y: 12 }
    ]
};

const SquadBuilder = ({ players, squads, activeSquadId, onSetActive, onDuplicate, onSave, onDelete, onDeleteBulk, onUpdatePlayer, onAddPlayers, user }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState('updatedAt');
    const [isArchiveExpanded, setIsArchiveExpanded] = useState(false);
    const [isSelectionMode, setIsSelectionMode] = useState(false);
    const [selectedIds, setSelectedIds] = useState(new Set());
    const [selectedSquad, setSelectedSquad] = useState(null);

    const toggleSelection = (id) => {
        const newSelected = new Set(selectedIds);
        if (newSelected.has(id)) newSelected.delete(id);
        else newSelected.add(id);
        setSelectedIds(newSelected);
    };

    const handleMassDelete = () => {
        if (selectedIds.size === 0) return;
        if (onDeleteBulk) {
            onDeleteBulk(Array.from(selectedIds));
            setIsSelectionMode(false);
            setSelectedIds(new Set());
        }
    };

    const handleMassDuplicate = () => {
        if (selectedIds.size === 0) return;
        selectedIds.forEach(id => onDuplicate(id));
        setIsSelectionMode(false);
        setSelectedIds(new Set());
    };

    // Use real squads directly
    const displaySquads = squads;

    const filteredSquads = useMemo(() => {
        let result = displaySquads.filter(s => s.name.toLowerCase().includes(searchQuery.toLowerCase()));
        if (sortBy === 'name') result.sort((a, b) => a.name.localeCompare(b.name));
        else result.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
        return isArchiveExpanded ? result : result.slice(0, 7);
    }, [displaySquads, searchQuery, sortBy, isArchiveExpanded]);

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12 animate-fade-in pb-32">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 pt-4">
                <div className="space-y-1">
                    <h1 className="text-2xl md:text-3xl font-black text-white tracking-tighter uppercase italic leading-none">
                        Saved <span className="text-ef-accent">Formations</span>
                    </h1>
                    <p className="text-[10px] font-bold text-white/30 uppercase tracking-[0.3em] pl-1">Tactical management center</p>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
                    {/* Mass Actions Bar */}
                    <div className="flex items-center gap-2">
                        {isSelectionMode ? (
                            <>
                                <button
                                    onClick={handleMassDuplicate}
                                    disabled={selectedIds.size === 0}
                                    className="px-4 py-3 bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:pointer-events-none border border-white/10 rounded-xl text-[10px] font-black text-white uppercase tracking-widest transition-all flex items-center gap-2"
                                >
                                    <span>📑</span> <span className="hidden sm:inline">Clone ({selectedIds.size})</span>
                                </button>
                                <button
                                    onClick={handleMassDelete}
                                    disabled={selectedIds.size === 0}
                                    className="px-4 py-3 bg-red-500/10 hover:bg-red-500 disabled:opacity-30 disabled:pointer-events-none border border-red-500/20 text-red-500 hover:text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2"
                                >
                                    <span>🗑️</span> <span className="hidden sm:inline">Delete ({selectedIds.size})</span>
                                </button>
                                <div className="w-px h-8 bg-white/10 mx-2"></div>
                                <button
                                    onClick={() => {
                                        setIsSelectionMode(false);
                                        setSelectedIds(new Set());
                                    }}
                                    className="px-4 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-[10px] font-black text-white/40 hover:text-white uppercase tracking-widest transition-all"
                                >
                                    Cancel
                                </button>
                            </>
                        ) : (
                            <button
                                onClick={() => setIsSelectionMode(true)}
                                className="px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-[10px] font-black text-white/60 hover:text-white uppercase tracking-widest transition-all flex items-center gap-2"
                            >
                                <span>☑️</span> Select Squads
                            </button>
                        )}
                    </div>

                    <div className="relative flex-1 sm:min-w-[280px]">
                        <span className="absolute left-5 top-1/2 -translate-y-1/2 text-lg opacity-30">🔍</span>
                        <input type="text" placeholder="Search squads..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 pl-14 pr-6 text-sm font-bold text-white focus:outline-none focus:border-ef-accent/40 transition-all" />
                    </div>
                </div>
            </div>

            {/* Squads Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Create Card */}
                <button
                    onClick={() => {
                        setSelectedSquad({ id: null, name: 'New Tactical Setup', formation: '4-3-3', players: Array(11).fill({ playerId: null }) });
                    }}
                    className="group relative aspect-[2/1] sm:aspect-[4/5] bg-white/[0.02] border border-dashed border-white/10 rounded-[2rem] flex flex-col items-center justify-center gap-4 hover:bg-white/[0.05] transition-all duration-700 shadow-2xl"
                >
                    <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center border border-white/10 group-hover:scale-110 group-hover:border-ef-accent/40 transition-all duration-700">
                        <span className="text-3xl font-light text-white/20 group-hover:text-ef-accent">+</span>
                    </div>
                    <div className="text-center px-6">
                        <h3 className="text-lg font-black text-white uppercase tracking-tight mb-1">Create New</h3>
                    </div>
                </button>

                {/* Squad Cards */}
                {filteredSquads.map((squad, index) => {
                    const isActive = String(activeSquadId || '') === String(squad.id);
                    const isSelected = selectedIds.has(squad.id);

                    return (
                        <div
                            key={squad.id}
                            onClick={() => {
                                if (isSelectionMode) toggleSelection(squad.id);
                                else setSelectedSquad(squad);
                            }}
                            className={`group relative aspect-[4/5] bg-gradient-to-b from-white/[0.07] to-white/[0.03] rounded-[2rem] p-4 flex flex-col animate-slide-up transition-all duration-300 overflow-hidden cursor-pointer outline outline-1 outline-ef-accent/10 -outline-offset-1 ${isSelectionMode && isSelected
                                ? 'outline-2 outline-ef-accent -outline-offset-2 bg-ef-accent/[0.05]'
                                : isActive
                                    ? 'outline-2 outline-ef-accent -outline-offset-2 shadow-[0_0_30px_rgba(0,255,136,0.15)] bg-white/[0.08]'
                                    : 'outline-white/10 hover:outline-white/20'
                                }`}
                        >
                            {/* Selection Checkbox Overlay */}
                            {isSelectionMode && (
                                <div className={`absolute top-4 right-4 z-50 w-6 h-6 rounded-lg border flex items-center justify-center transition-all ${isSelected ? 'bg-ef-accent border-ef-accent text-ef-dark' : 'bg-black/40 border-white/20'}`}>
                                    {isSelected && <span className="text-xs font-bold">✓</span>}
                                </div>
                            )}

                            {/* Top Header */}
                            <div className="flex justify-between items-start mb-3 relative z-20">
                                <div className="flex-1 min-w-0">
                                    <h3 className="text-sm font-black text-white uppercase tracking-tighter line-clamp-1 leading-tight">{squad.name}</h3>
                                    <div className="mt-1">
                                        <span className={`px-1.5 py-0.5 text-[8px] font-black rounded uppercase tracking-wider ${isActive ? 'bg-ef-accent text-ef-dark' : 'bg-white/10 text-white/50'}`}>{squad.formation}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Mini Pitch */}
                            <div className={`flex-1 relative bg-black/60 rounded-[1.2rem] border overflow-hidden p-2 shadow-inner transition-all ${isActive ? 'border-ef-accent/20' : 'border-white/5'}`}>
                                <div className={`absolute inset-2 border rounded-[0.8rem] ${isActive ? 'border-ef-accent/5' : 'border-white/5'}`}></div>
                                <div className={`absolute top-1/2 left-2 right-2 h-px ${isActive ? 'bg-ef-accent/5' : 'bg-white/5'}`}></div>
                                {(() => {
                                    const previewPositions = squad.positions || FORMATIONS[squad.formation] || [];
                                    return previewPositions.map((pos, idx) => {
                                        const player = players.find(p => p._id === squad.players?.[idx]?.playerId);
                                        return (
                                            <div key={idx} className="absolute -translate-x-1/2 -translate-y-1/2" style={{ left: `${pos.x}%`, top: `${pos.y}%` }}>
                                                <div className={`w-9 h-9 sm:w-6 sm:h-6 rounded-md border overflow-hidden shadow-sm bg-[#0a0a0c] transition-all relative group/mini ${isActive ? 'border-ef-accent/30' : 'border-white/10'}`}>
                                                    {player?.image ? <img src={player.image} alt="" className="w-full h-full object-cover object-top" /> : <div className="w-full h-full flex items-center justify-center opacity-10 text-[6px]">👤</div>}
                                                    {/* Mini Role Tag */}
                                                    <div className="absolute bottom-0 inset-x-0 bg-black/80 flex items-center justify-center py-0.5">
                                                        <span className="text-[5px] font-black text-ef-accent leading-none scale-[0.8] tracking-tighter uppercase italic">{pos.role || pos.pos}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    });
                                })()}
                            </div>

                            {/* Active Button Footer */}
                            {!isSelectionMode && (
                                <div className="mt-3 pt-3 border-t border-white/5 flex">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            if (!isActive) onSetActive(squad.id);
                                        }}
                                        disabled={isActive}
                                        className={`w-full py-2 rounded-xl text-[9px] font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2 ${isActive
                                            ? 'bg-ef-accent/10 text-ef-accent cursor-default'
                                            : 'bg-white/5 hover:bg-white/10 text-white/40 hover:text-white group-hover:bg-white/10'
                                            }`}
                                    >
                                        <span>{isActive ? '✓ Selected' : 'Set Active'}</span>
                                    </button>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Archive Toggle */}
            <div className="flex justify-center pt-8">
                <button onClick={() => setIsArchiveExpanded(!isArchiveExpanded)} className="px-10 py-4 bg-white/[0.03] border border-white/10 rounded-2xl hover:bg-white/10 transition-all text-[10px] font-black uppercase tracking-[0.3em] text-white/40 hover:text-white">
                    {isArchiveExpanded ? 'Close Library' : 'View Full Archive'}
                </button>
            </div>

            {/* Strategy Editor Modal */}
            {selectedSquad && (
                <SquadEditor
                    squad={selectedSquad}
                    players={players}
                    onSave={onSave}
                    onUpdatePlayer={onUpdatePlayer}
                    onAddPlayers={onAddPlayers}
                    onClose={() => setSelectedSquad(null)}
                />
            )}
        </div>
    );
};

export default SquadBuilder;
