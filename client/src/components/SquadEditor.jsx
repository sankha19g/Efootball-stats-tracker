import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { getDatabasePlayers, normalizeString } from '../services/footballApi';

const FORMATIONS = {
    '4-3-3': [
        { pos: 'GK', x: 50, y: 88, role: 'GK' },
        { pos: 'CB', x: 35, y: 72, role: 'CB' }, { pos: 'CB', x: 65, y: 72, role: 'CB' },
        { pos: 'LB', x: 15, y: 68, role: 'LB' }, { pos: 'RB', x: 85, y: 68, role: 'RB' },
        { pos: 'CMF', x: 50, y: 52, role: 'CMF' }, { pos: 'CMF', x: 28, y: 48, role: 'CMF' }, { pos: 'CMF', x: 72, y: 48, role: 'CMF' },
        { pos: 'LWF', x: 20, y: 22, role: 'LWF' }, { pos: 'RWF', x: 80, y: 22, role: 'RWF' }, { pos: 'CF', x: 50, y: 12, role: 'CF' }
    ],
    '4-4-2': [
        { pos: 'GK', x: 50, y: 88, role: 'GK' },
        { pos: 'CB', x: 35, y: 72, role: 'CB' }, { pos: 'CB', x: 65, y: 72, role: 'CB' },
        { pos: 'LB', x: 15, y: 68, role: 'LB' }, { pos: 'RB', x: 85, y: 68, role: 'RB' },
        { pos: 'LMF', x: 15, y: 42, role: 'LMF' }, { pos: 'RMF', x: 85, y: 42, role: 'RMF' },
        { pos: 'CMF', x: 35, y: 48, role: 'CMF' }, { pos: 'CMF', x: 65, y: 48, role: 'CMF' },
        { pos: 'CF', x: 35, y: 18, role: 'CF' }, { pos: 'CF', x: 65, y: 18, role: 'CF' }
    ],
    '3-2-4-1': [
        { pos: 'GK', x: 50, y: 88, role: 'GK' },
        { pos: 'CB', x: 50, y: 72, role: 'CB' }, { pos: 'CB', x: 25, y: 72, role: 'CB' }, { pos: 'CB', x: 75, y: 72, role: 'CB' },
        { pos: 'DMF', x: 35, y: 58, role: 'DMF' }, { pos: 'DMF', x: 65, y: 58, role: 'DMF' },
        { pos: 'AMF', x: 35, y: 38, role: 'AMF' }, { pos: 'AMF', x: 65, y: 38, role: 'AMF' },
        { pos: 'LMF', x: 15, y: 38, role: 'LMF' }, { pos: 'RMF', x: 85, y: 38, role: 'RMF' },
        { pos: 'CF', x: 50, y: 12, role: 'CF' }
    ]
};

const PlayerCard = ({ player, onClick, isActive, isSelected, role, size = "small", draggable, onDragStart, onDragEnd, showPlaystyles }) => {
    const isSmall = size === "small";

    return (
        <div className={`relative ${isSmall ? 'w-full' : ''}`}>
            {/* Dynamic Aura (Only for pitch players) */}
            {!isSmall && player && (
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-0 scale-125">
                    <div className="absolute w-[120%] h-[120%] bg-cover bg-center blur-[25px] opacity-20 overflow-hidden rounded-full"
                        style={{ backgroundImage: `url(${player.image})` }}></div>
                </div>
            )}

            <button
                onClick={onClick}
                disabled={isSelected && !isActive}
                draggable={draggable}
                onDragStart={onDragStart}
                onDragEnd={onDragEnd}
                className={`group relative overflow-hidden transition-all duration-300 rounded-lg border-2
                    ${isSmall ? 'aspect-[10/9] w-full' : 'w-16 h-16 md:w-20 md:h-20 shadow-[0_0_20px_rgba(0,255,136,0.15)]'}
                    ${isSelected ? 'opacity-20 grayscale border-white/5' : 'border-ef-accent hover:border-ef-accent hover:scale-105 hover:shadow-[0_0_25px_rgba(0,255,136,0.3)]'}
                    ${isActive ? 'border-white ring-4 ring-ef-accent/40 z-30 scale-110 shadow-[0_0_30px_rgba(0,255,136,0.4)]' : ''}
                    ${draggable ? 'cursor-grab active:cursor-grabbing' : ''}
                    bg-black/80
                `}
            >
                {player ? (
                    <>
                        <img src={player.image} alt="" className="w-full h-full object-cover object-top relative z-0" />

                        {/* Rating HUD */}
                        <div className="absolute bottom-0 right-0 z-20 bg-black/95 px-1 py-0 rounded-tl-sm border-l border-t border-white/5">
                            <span className={`${isSmall ? 'text-[7px]' : 'text-[12px]'} font-black text-[#00FF88] italic leading-none`}>
                                {player.rating}
                            </span>
                        </div>

                        {/* Position HUD */}
                        <div className="absolute top-0 left-0 z-20 bg-black/95 px-1 py-0 rounded-br-sm border-r border-b border-white/5">
                            <span className={`${isSmall ? 'text-[6px]' : 'text-[10px]'} font-black text-ef-accent italic uppercase tracking-tighter`}>
                                {role || player.position}
                            </span>
                        </div>
                    </>
                ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-black/40 border border-dashed border-white/5 opacity-40">
                        <span className={isSmall ? "text-lg" : "text-xl"}>+</span>
                    </div>
                )}
            </button>

            {/* Playstyle Label (MINIMAL TEXT - WITH POINTER LINE) */}
            {!isSmall && showPlaystyles && player && player.playstyle && (
                <div className="absolute left-full top-1/2 -translate-y-1/2 whitespace-nowrap z-[200] animate-in fade-in slide-in-from-left-4 duration-500">
                    <div className="flex items-center">
                        {/* Pointer Line */}
                        <div className="h-px w-12 bg-gradient-to-r from-transparent to-[#00FF88]/40 shadow-[0_0_8px_#00FF88]/20"></div>

                        <div className="flex items-center gap-1.5 px-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-[#00FF88] shadow-[0_0_5px_#00FF88] animate-pulse shrink-0"></div>
                            <span className="text-[10px] font-black text-[#00FF88] uppercase tracking-[0.2em] italic [text-shadow:0_0_10px_rgba(0,255,136,0.4)]">
                                {player.playstyle}
                            </span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};



const SquadEditor = ({ squad, players, onSave, onUpdatePlayer, onAddPlayers, onClose }) => {
    const [name, setName] = useState(squad?.name || 'New Squad');
    const [formation, setFormation] = useState(squad?.formation || '4-3-3');
    const [startingXI, setStartingXI] = useState(squad?.startingXI || Array(11).fill({ playerId: null }));
    const [subs, setSubs] = useState(squad?.subs || Array(14).fill({ playerId: null }));
    const [positions, setPositions] = useState(squad?.positions || FORMATIONS[squad?.formation || '4-3-3']);

    const pitchRef = useRef(null);
    const quickImageInputRef = useRef(null);

    // Filter UI State
    const [searchTerm, setSearchTerm] = useState('');
    const [sortBy, setSortBy] = useState('rating');
    const [isEditMode, setIsEditMode] = useState(false);
    const [isRoleEditMode, setIsRoleEditMode] = useState(false);
    const [canMoveCustom, setCanMoveCustom] = useState(false);
    const [showFilters, setShowFilters] = useState(false);
    const [showPlaystyles, setShowPlaystyles] = useState(false);
    const [isDPadCollapsed, setIsDPadCollapsed] = useState(false);
    const [editingRoleIndex, setEditingRoleIndex] = useState(null);
    const [roleInputValue, setRoleInputValue] = useState("");
    const [isEditingName, setIsEditingName] = useState(false);

    // Quick Update State
    const [isQuickUpdateMode, setIsQuickUpdateMode] = useState(false);
    const [updatingPlayer, setUpdatingPlayer] = useState(null);
    const [updateForm, setUpdateForm] = useState({
        rating: 0,
        goals: 0,
        assists: 0,
        matches: 0,
        image: ""
    });



    const [activeFilters, setActiveFilters] = useState({
        position: '',
        club: '',
        league: '',
        nationality: '',
        playstyle: ''
    });

    // Mobile Panel State
    const [showBench, setShowBench] = useState(false);
    const [showLibrary, setShowLibrary] = useState(false);

    // Database Discovery State
    const [libraryTab, setLibraryTab] = useState('owned'); // 'owned' | 'database'
    const [dbPlayers, setDbPlayers] = useState([]);
    const [dbLoading, setDbLoading] = useState(false);
    const [dbSearch, setDbSearch] = useState('');
    const [dbSelectedPlayers, setDbSelectedPlayers] = useState(new Map());
    const [dbPage, setDbPage] = useState(1);
    const [dbTotalPages, setDbTotalPages] = useState(1);
    const [isImporting, setIsImporting] = useState(false);

    const fetchDbPlayers = useCallback(async (page, search) => {
        setDbLoading(true);
        try {
            const data = await getDatabasePlayers({
                q: search,
                page: page,
                limit: 30
            });
            if (page === 1) {
                setDbPlayers(data.players || []);
            } else {
                setDbPlayers(prev => [...prev, ...(data.players || [])]);
            }
            setDbTotalPages(data.totalPages || 1);
        } catch (err) {
            console.error('Error loading DB players:', err);
        } finally {
            setDbLoading(false);
        }
    }, []);

    useEffect(() => {
        if (libraryTab === 'database') {
            const timer = setTimeout(() => {
                setDbPage(1);
                fetchDbPlayers(1, dbSearch);
            }, 300);
            return () => clearTimeout(timer);
        }
    }, [dbSearch, libraryTab, fetchDbPlayers]);

    const handleAddFromDb = async () => {
        if (dbSelectedPlayers.size === 0 || isImporting) return;
        const playersList = Array.from(dbSelectedPlayers.values());

        const playersToAdd = playersList.map(p => ({
            name: p.name,
            image: p.image,
            nationality: p.nationality,
            club: p.club_original || p.club,
            league: p.league,
            position: p.position,
            playstyle: p.playstyle || 'None',
            cardType: p.card_type || p.cardType,
            playerId: p.id,
            rating: 90,
            goals: 0,
            assists: 0,
            matches: 0,
            logos: {
                club: p.club_badge_url || '',
                country: p.nationality_flag_url || '',
                league: p.league_logo_url || ''
            }
        }));

        if (onAddPlayers) {
            setIsImporting(true);
            try {
                await onAddPlayers(playersToAdd);
                setDbSelectedPlayers(new Map());
            } finally {
                setIsImporting(false);
            }
        }
    };

    // Auto-open only on desktop/large screens
    useEffect(() => {
        if (window.innerWidth >= 1024) {
            setShowBench(true);
            setShowLibrary(true);
        } else {
            setShowBench(false);
            setShowLibrary(false);
        }
    }, []);

    const categories = useMemo(() => {
        return {
            positions: [...new Set(players.map(p => p.position))].filter(Boolean).sort(),
            clubs: [...new Set(players.map(p => p.club))].filter(Boolean).sort(),
            leagues: [...new Set(players.map(p => p.league))].filter(Boolean).sort(),
            nationalities: [...new Set(players.map(p => p.nationality))].filter(Boolean).sort(),
            playstyles: [...new Set(players.map(p => p.playstyle))].filter(Boolean).sort(),
        };
    }, [players]);



    const filteredPlayers = useMemo(() => {
        let result = players;

        if (searchTerm) {
            const normalizedQuery = normalizeString(searchTerm);
            result = result.filter(p => {
                return normalizeString(p.name).includes(normalizedQuery) ||
                    normalizeString(p.position).includes(normalizedQuery) ||
                    normalizeString(p.search_name || "").includes(normalizedQuery) ||
                    (p.tags && p.tags.some(tag => normalizeString(tag).includes(normalizedQuery)));
            });
        }

        if (activeFilters.position) result = result.filter(p => p.position === activeFilters.position);
        if (activeFilters.club) result = result.filter(p => p.club === activeFilters.club);
        if (activeFilters.league) result = result.filter(p => p.league === activeFilters.league);
        if (activeFilters.nationality) result = result.filter(p => p.nationality === activeFilters.nationality);
        if (activeFilters.playstyle) result = result.filter(p => p.playstyle === activeFilters.playstyle);

        result = [...result].sort((a, b) => {
            if (sortBy === 'rating') return b.rating - a.rating;
            return a.name.localeCompare(b.name);
        });
        return result;
    }, [players, searchTerm, activeFilters, sortBy]);

    const handleSelectPlayer = (player, slot = activeSlot) => {
        if (!slot) return;
        if (slot.type === 'starting') {
            const newXI = [...startingXI];
            newXI[slot.index] = { ...newXI[slot.index], playerId: player._id };
            setStartingXI(newXI);
        } else {
            const newSubs = [...subs];
            newSubs[slot.index] = { ...newSubs[slot.index], playerId: player._id };
            setSubs(newSubs);
        }
        setActiveSlot(null);
    };

    const handleQuickUpdateClick = (player) => {
        if (!player) return;
        setUpdatingPlayer(player);
        setUpdateForm({
            rating: player.rating || 0,
            goals: player.goals || 0,
            assists: player.assists || 0,
            matches: player.matches || 0,
            image: player.image || ""
        });
    };

    const toggleDbSelect = (player) => {
        setDbSelectedPlayers(prev => {
            const next = new Map(prev);
            if (next.has(player.id)) {
                next.delete(player.id);
            } else {
                next.set(player.id, player);
            }
            return next;
        });
    };

    const handleUpdateRole = (index, newRole) => {
        const newPositions = [...positions];
        const update = { ...newPositions[index], role: newRole, pos: newRole };
        newPositions[index] = update;
        setPositions(newPositions);
    };

    const [activeSlot, setActiveSlot] = useState(null);

    const movePlayer = (direction, amount = 0.5) => {
        if (!activeSlot || activeSlot.type !== 'starting' || !canMoveCustom) return;
        const index = activeSlot.index;
        setPositions(prev => {
            const next = [...prev];
            const pos = { ...next[index] };
            if (direction === 'up') pos.y = Math.max(0, pos.y - amount);
            if (direction === 'down') pos.y = Math.min(100, pos.y + amount);
            if (direction === 'left') pos.x = Math.max(0, pos.x - amount);
            if (direction === 'right') pos.x = Math.min(100, pos.x + amount);
            next[index] = pos;
            return next;
        });
    };

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (!canMoveCustom || !activeSlot || activeSlot.type !== 'starting') return;
            const step = e.shiftKey ? 2 : 0.5;
            if (e.key === 'ArrowUp') { e.preventDefault(); movePlayer('up', step); }
            if (e.key === 'ArrowDown') { e.preventDefault(); movePlayer('down', step); }
            if (e.key === 'ArrowLeft') { e.preventDefault(); movePlayer('left', step); }
            if (e.key === 'ArrowRight') { e.preventDefault(); movePlayer('right', step); }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [canMoveCustom, activeSlot]);

    const handleSave = () => {
        onSave({ ...squad, name, formation, startingXI, subs, positions, players: startingXI });
        onClose();
    };

    // Drag and Drop Logic
    const onDragStart = (e, source, idOrIdx, extraData = null) => {
        e.dataTransfer.setData("sourceType", source);
        if (source === 'library') {
            e.dataTransfer.setData("playerId", idOrIdx);
        } else if (source === 'database') {
            e.dataTransfer.setData("playerData", JSON.stringify(extraData));
        } else {
            e.dataTransfer.setData("sourceIndex", idOrIdx.toString());
        }
    };

    const onDrop = async (e, targetType, targetIdx) => {
        e.preventDefault();
        const sourceType = e.dataTransfer.getData("sourceType");

        // Case 1: From Library (Owned)
        if (sourceType === 'library') {
            const playerId = e.dataTransfer.getData("playerId");
            const player = players.find(p => p._id === playerId);
            if (player) handleSelectPlayer(player, { type: targetType, index: targetIdx });
            return;
        }

        // Case 3: From Scout DB (Not Owned yet)
        if (sourceType === 'database') {
            try {
                const rawData = e.dataTransfer.getData("playerData");
                if (!rawData) return;
                const p = JSON.parse(rawData);

                // Format for import (sync with handleAddFromDb logic)
                const playerToImport = {
                    name: p.name,
                    image: p.image,
                    nationality: p.nationality,
                    club: p.club_original || p.club,
                    league: p.league,
                    position: p.position,
                    playstyle: p.playstyle || 'None',
                    cardType: p.card_type || p.cardType,
                    playerId: p.id,
                    rating: 90,
                    goals: 0,
                    assists: 0,
                    matches: 0,
                    logos: {
                        club: p.club_badge_url || '',
                        country: p.nationality_flag_url || '',
                        league: p.league_logo_url || ''
                    }
                };

                if (onAddPlayers) {
                    setIsImporting(true);
                    try {
                        const added = await onAddPlayers([playerToImport]);
                        if (added && added.length > 0) {
                            // Find the new player in the returned list (it should be the first and only one)
                            const newPlayer = added[0];
                            // Update the slot with the new _id
                            if (targetType === 'starting') {
                                const newXI = [...startingXI];
                                newXI[targetIdx] = { ...newXI[targetIdx], playerId: newPlayer._id };
                                setStartingXI(newXI);
                            } else {
                                const newSubs = [...subs];
                                newSubs[targetIdx] = { ...newSubs[targetIdx], playerId: newPlayer._id };
                                setSubs(newSubs);
                            }
                        }
                    } finally {
                        setIsImporting(false);
                    }
                }
            } catch (err) {
                console.error("Drop from DB failed:", err);
            }
            return;
        }

        // Case 2: Between Pitch and Bench
        const sourceIdx = parseInt(e.dataTransfer.getData("sourceIndex"));
        if (isNaN(sourceIdx)) return;

        const newXI = [...startingXI];
        const newSubs = [...subs];

        if (sourceType === 'pitch' && targetType === 'starting') {
            const temp = newXI[sourceIdx];
            newXI[sourceIdx] = newXI[targetIdx];
            newXI[targetIdx] = temp;
            setStartingXI(newXI);
        } else if (sourceType === 'bench' && targetType === 'sub') {
            const temp = newSubs[sourceIdx];
            newSubs[sourceIdx] = newSubs[targetIdx];
            newSubs[targetIdx] = temp;
            setSubs(newSubs);
        } else if (sourceType === 'pitch' && targetType === 'sub') {
            const temp = newXI[sourceIdx];
            newXI[sourceIdx] = newSubs[targetIdx];
            newSubs[targetIdx] = temp;
            setStartingXI(newXI);
            setSubs(newSubs);
        } else if (sourceType === 'bench' && targetType === 'starting') {
            const temp = newSubs[sourceIdx];
            newSubs[sourceIdx] = newXI[targetIdx];
            newXI[targetIdx] = temp;
            setStartingXI(newXI);
            setSubs(newSubs);
        }
    };

    const onDragOver = (e) => {
        e.preventDefault();
    };

    const handlePitchDragEnd = (e, index) => {
        if (!canMoveCustom || !pitchRef.current) return;
        if (formation !== 'Custom') setFormation('Custom');

        const rect = pitchRef.current.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;
        if (x < 0 || x > 100 || y < 0 || y > 100) return;
        const newPositions = [...positions];
        newPositions[index] = { ...newPositions[index], x, y };
        setPositions(newPositions);
    };

    const handleQuickImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setUpdateForm(prev => ({ ...prev, image: reader.result }));
            };
            reader.readAsDataURL(file);
        }
    };

    const handleQuickPaste = (e) => {
        const items = e.clipboardData?.items;
        if (items) {
            for (let i = 0; i < items.length; i++) {
                if (items[i].type.indexOf('image') !== -1) {
                    const file = items[i].getAsFile();
                    if (file) {
                        const reader = new FileReader();
                        reader.onloadend = () => {
                            setUpdateForm(prev => ({ ...prev, image: reader.result }));
                        };
                        reader.readAsDataURL(file);
                    }
                }
            }
        }
    };

    return (
        <div className="fixed inset-0 mt-0 bg-black flex items-center justify-center z-[2000] p-0 animate-fade-in overflow-hidden">
            <div className="bg-[#0a0a0c] flex flex-col overflow-hidden relative w-full h-full">

                {/* Desktop Navbar (Pro Compact Design) */}
                <div className="hidden md:flex h-20 bg-black/20 border-b border-white/5 items-center justify-between px-10 relative z-50 backdrop-blur-2xl shrink-0">
                    <div className="flex items-center gap-6">
                        <button onClick={onClose} className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center hover:bg-white/10 transition-all border border-white/10 group backdrop-blur-3xl">
                            <span className="text-xl group-hover:-translate-x-1 transition-transform">←</span>
                        </button>
                        <div className="flex flex-col">
                            {isEditingName ? (
                                <input
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    onBlur={() => setIsEditingName(false)}
                                    onKeyDown={(e) => e.key === 'Enter' && setIsEditingName(false)}
                                    autoFocus
                                    className="bg-white/5 border border-ef-accent/50 rounded px-2 py-1 text-2xl font-black text-white outline-none w-64 uppercase italic"
                                />
                            ) : (
                                <div className="flex items-center gap-2">
                                    <h1 className="text-3xl font-black text-white italic tracking-tighter uppercase leading-none">{name}</h1>
                                    <button
                                        onClick={() => setIsEditingName(true)}
                                        className="text-ef-accent hover:scale-110 transition-transform text-sm"
                                    >
                                        ✏️
                                    </button>
                                </div>
                            )}
                            <span className="text-[10px] text-ef-accent font-black tracking-[0.3em] uppercase opacity-60">Squad Management</span>
                        </div>
                    </div>


                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => {
                                const next = !isEditMode;
                                setIsEditMode(next);
                                setCanMoveCustom(next);
                                if (next) setIsRoleEditMode(false);
                            }}
                            className={`px-5 py-2.5 rounded-xl border flex items-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all ${isEditMode ? 'bg-ef-accent text-black border-ef-accent shadow-[0_0_20px_rgba(0,255,136,0.3)]' : 'bg-white/5 text-white/40 border-white/10 hover:bg-white/10'}`}
                        >
                            <span>⚙️</span> EDIT
                        </button>



                        <button
                            onClick={() => {
                                setIsRoleEditMode(!isRoleEditMode);
                                if (!isRoleEditMode) {
                                    setIsEditMode(false);
                                    setIsQuickUpdateMode(false);
                                }
                            }}
                            className={`px-5 py-2.5 rounded-xl border flex items-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all ${isRoleEditMode ? 'bg-ef-blue text-black border-ef-blue shadow-[0_0_20px_rgba(0,120,255,0.3)]' : 'bg-white/5 text-white/40 border-white/10 hover:bg-white/10'}`}
                        >
                            <span>🏷️</span> ROLES
                        </button>

                        <button
                            onClick={() => {
                                setIsQuickUpdateMode(!isQuickUpdateMode);
                                if (!isQuickUpdateMode) {
                                    setIsEditMode(false);
                                    setIsRoleEditMode(false);
                                }
                            }}
                            className={`px-5 py-2.5 rounded-xl border flex items-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all ${isQuickUpdateMode ? 'bg-ef-accent text-black border-ef-accent shadow-[0_0_20px_rgba(0,255,136,0.3)]' : 'bg-white/5 text-white/40 border-white/10 hover:bg-white/10'}`}
                        >
                            <span>⚡</span> UPDATE
                        </button>

                        <button
                            onClick={() => setShowLibrary(!showLibrary)}
                            className={`px-5 py-2.5 rounded-xl border flex items-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all ${showLibrary ? 'bg-[#fffd00] text-black border-[#fffd00] shadow-[0_0_20px_rgba(255,253,0,0.2)]' : 'bg-white/5 text-white/40 border-white/10 hover:bg-white/10'}`}
                        >
                            <span>📖</span> LIBRARY
                        </button>

                        <div className="w-px h-6 bg-white/10 mx-2" />

                        <div className="flex items-center gap-1.5 mr-2">
                            <button onClick={() => setCanMoveCustom(!canMoveCustom)} className={`w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center transition-all ${canMoveCustom ? 'text-ef-accent border-ef-accent shadow-[0_0_15px_rgba(0,255,136,0.1)]' : 'text-white/20 hover:text-white'}`}>✥</button>
                            <button onClick={() => setShowPlaystyles(!showPlaystyles)} className={`w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center transition-all ${showPlaystyles ? 'text-ef-accent border-ef-accent shadow-[0_0_15px_rgba(0,255,136,0.1)]' : 'text-white/20 hover:text-white'}`}>🏃</button>
                        </div>

                        <div className="relative group/formation mr-4">
                            <select
                                value={formation}
                                onChange={(e) => {
                                    const next = e.target.value;
                                    setFormation(next);
                                    if (next !== 'Custom') setPositions(FORMATIONS[next]);
                                }}
                                className="appearance-none bg-black/40 h-10 px-6 pr-10 rounded-xl border border-white/10 text-[10px] font-black text-[#00FF88] uppercase tracking-widest outline-none cursor-pointer hover:border-[#00FF88]/40 transition-all"
                            >
                                {Object.keys(FORMATIONS).map(f => (
                                    <option key={f} value={f} className="bg-[#0a0a0c] text-white uppercase">{f}</option>
                                ))}
                                <option value="Custom" className="bg-[#0a0a0c] text-ef-accent font-black">✨ CUSTOM</option>
                            </select>
                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[#00FF88]/40 text-[8px] pointer-events-none">▼</span>
                        </div>

                        <button
                            onClick={handleSave}
                            className="bg-[#00FF88] hover:bg-[#00e67a] px-10 py-3 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] text-black shadow-[0_0_30px_rgba(0,255,136,0.3)] transition-all flex items-center gap-2 group ml-2"
                        >
                            <span>💾</span>
                            <span>SAVE</span>
                        </button>
                    </div>


                </div>


                {/* Mobile Header (Hidden on Desktop) */}
                <div className="md:hidden shrink-0 px-6 py-3 flex items-center justify-between border-b border-white/5 bg-black/40 backdrop-blur-xl">
                    <div className="flex items-center gap-3">
                        {isEditingName ? (
                            <input
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                onBlur={() => setIsEditingName(false)}
                                onKeyDown={(e) => e.key === 'Enter' && setIsEditingName(false)}
                                autoFocus
                                className="bg-white/5 border border-ef-accent/50 rounded px-2 py-1 text-lg font-black text-white outline-none w-48 uppercase italic"
                            />
                        ) : (
                            <h2 className="text-xl font-black text-white uppercase italic tracking-tighter flex items-center gap-2">
                                {name}
                                <button
                                    onClick={() => setIsEditingName(true)}
                                    className="text-ef-accent text-sm"
                                >
                                    ✏️
                                </button>
                            </h2>
                        )}
                    </div>
                    <button
                        onClick={handleSave}
                        className="bg-[#CCFF00] hover:bg-[#b8e600] text-black font-black px-8 py-2.5 rounded-full text-[13px] uppercase tracking-wider transition-all shadow-[0_0_20px_rgba(204,255,0,0.2)] active:scale-95"
                    >
                        Save
                    </button>
                </div>


                {/* Main Content Area (Scrollable on Mobile, Pane-based on Desktop) */}
                <div className="flex-1 flex flex-col md:flex-row overflow-y-auto md:overflow-hidden stylish-scrollbar">

                    {/* Left Sidebar (Compact Pro) */}
                    {showBench && (
                        <div className="hidden md:flex md:w-[200px] bg-black/40 border-r border-white/5 flex-col overflow-hidden shrink-0 px-5 py-6">

                            <div className="flex justify-between items-center mb-6 shrink-0">
                                <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-white/20 italic">SUB BENCH</h4>
                            </div>
                            <div className="flex-1 overflow-y-auto pr-1 stylish-scrollbar relative">
                                <div className="grid grid-cols-2 gap-2.5">
                                    {subs.slice(0, 12).map((sub, idx) => {
                                        const player = players.find(p => p._id === sub.playerId);
                                        const isSlotActive = activeSlot?.type === 'sub' && activeSlot?.index === idx;
                                        return (
                                            <div
                                                key={idx}
                                                className="relative"
                                                onDragOver={onDragOver}
                                                onDrop={(e) => onDrop(e, 'sub', idx)}
                                            >
                                                <PlayerCard
                                                    player={player}
                                                    isActive={isSlotActive}
                                                    onClick={() => {
                                                        if (isQuickUpdateMode && player) {
                                                            handleQuickUpdateClick(player);
                                                        } else if (isEditMode) {
                                                            setActiveSlot({ type: 'sub', index: idx });
                                                        }
                                                    }}
                                                    size="small"
                                                    draggable={isEditMode && !!player}
                                                    onDragStart={(e) => onDragStart(e, 'bench', idx)}
                                                    showPlaystyles={showPlaystyles}
                                                />
                                            </div>
                                        );
                                    })}
                                </div>
                                {/* Accent Line */}
                                <div className="absolute right-0 top-0 bottom-0 w-0.5 bg-[#00FF88]/10 rounded-full"></div>
                            </div>
                        </div>
                    )}






                    <div className="flex-1 flex flex-col min-w-0">
                        {/* Mobile Action Buttons (Hidden on Desktop) */}
                        <div className="md:hidden px-6 py-3 flex gap-3 overflow-x-auto no-scrollbar shrink-0">
                            <div className="flex items-center bg-white/5 border border-white/10 px-4 py-2 rounded-xl shrink-0 min-w-[100px] justify-center gap-2">
                                <span className="text-[10px]">🏆</span>
                                <select
                                    value={formation}
                                    onChange={(e) => {
                                        const next = e.target.value;
                                        setFormation(next);
                                        if (next !== 'Custom') setPositions(FORMATIONS[next]);
                                    }}
                                    className="bg-transparent text-[11px] font-black text-white uppercase outline-none cursor-pointer"
                                >
                                    {Object.keys(FORMATIONS).map(f => (
                                        <option key={f} value={f} className="bg-[#0a0a0c] text-white uppercase">{f}</option>
                                    ))}
                                    <option value="Custom" className="bg-ef-accent text-ef-dark font-black">✨ Custom</option>
                                </select>
                            </div>

                            <button
                                onClick={() => {
                                    setIsRoleEditMode(!isRoleEditMode);
                                    if (!isRoleEditMode) setIsEditMode(false);
                                }}
                                className={`flex-1 min-w-[100px] py-2.5 rounded-xl text-[11px] font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all border shrink-0 ${isRoleEditMode ? 'bg-[#fffd00] text-black border-[#fffd00]' : 'bg-white/5 text-white/80 border-white/10'}`}
                            >
                                <span>👤</span> ROLES
                            </button>

                            <button
                                onClick={() => {
                                    setFormation('Custom');
                                    setCanMoveCustom(!canMoveCustom);
                                    if (!canMoveCustom) setIsRoleEditMode(false);
                                }}
                                className={`flex-1 min-w-[100px] py-2.5 rounded-xl text-[11px] font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all border shrink-0 ${formation === 'Custom' && canMoveCustom ? 'bg-[#2a2a2c] text-white border-white/20' : 'bg-white/5 text-white/80 border-white/10'}`}
                            >
                                <span>☩</span> CUSTOM
                            </button>
                        </div>




                        {/* Pitch Section */}
                        <div className="h-[450px] md:flex-1 flex flex-col relative shrink-0">


                            <div ref={pitchRef} className="w-full h-full relative bg-gradient-to-b from-[#0a210a]/60 to-[#050d05] shadow-inner flex items-center justify-center overflow-hidden">
                                {/* Pitch Texture and Lines */}
                                <div className="absolute inset-0 opacity-[0.1] bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>

                                {/* Professional Pitch Markings */}
                                <div className="absolute inset-x-10 inset-y-10 border-2 border-white/10 rounded-[3rem]"></div>
                                <div className="absolute top-1/2 left-10 right-10 h-0.5 bg-white/10"></div>
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[30%] aspect-square border-2 border-white/10 rounded-full"></div>
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-white/10 rounded-full"></div>

                                {/* Penalty Areas */}
                                <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[40%] h-[15%] border-2 border-white/10 border-t-0 rounded-b-2xl"></div>
                                <div className="absolute bottom-10 left-1/2 -translate-x-1/2 w-[40%] h-[15%] border-2 border-white/10 border-b-0 rounded-t-2xl"></div>

                                {/* Players on Pitch (Correct Sizes and Components) */}
                                {positions.map((pos, idx) => {
                                    const squadPlayer = startingXI[idx];
                                    const player = players.find(p => p._id === squadPlayer?.playerId);
                                    const isSlotActive = activeSlot?.type === 'starting' && activeSlot?.index === idx;
                                    return (
                                        <div
                                            key={idx}
                                            style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
                                            className={`absolute -translate-x-1/2 -translate-y-1/2 transition-all ${formation === 'Custom' ? 'duration-0' : 'duration-700'} ${isSlotActive ? 'z-[100]' : 'z-10'}`}
                                            onDragOver={onDragOver}
                                            onDrop={(e) => onDrop(e, 'starting', idx)}
                                        >
                                            <PlayerCard
                                                player={player}
                                                isActive={isSlotActive}
                                                onClick={() => {
                                                    if (isRoleEditMode) {
                                                        setRoleInputValue(pos.role || pos.pos);
                                                        setEditingRoleIndex(idx);
                                                    } else if (isQuickUpdateMode && player) {
                                                        handleQuickUpdateClick(player);
                                                    } else if (isEditMode || canMoveCustom) {
                                                        setActiveSlot({ type: 'starting', index: idx });
                                                    }
                                                }}

                                                role={pos.role}
                                                size="large"
                                                draggable={canMoveCustom && !!player}
                                                onDragStart={(e) => onDragStart(e, 'pitch', idx)}
                                                onDragEnd={(e) => handlePitchDragEnd(e, idx)}
                                                showPlaystyles={showPlaystyles}
                                            />


                                        </div>

                                    );
                                })}

                                {/* Desktop Alignment Lines (Only on PC) */}
                                <div className="hidden md:block absolute inset-0 pointer-events-none">
                                    {canMoveCustom && activeSlot?.type === 'starting' && positions.map((otherPos, idx) => {
                                        if (idx === activeSlot.index) return null;
                                        const activePos = positions[activeSlot.index];
                                        const threshold = 0.5;
                                        const elements = [];
                                        if (Math.abs(otherPos.x - activePos.x) < threshold) {
                                            elements.push(<div key={`v-${idx}`} className="absolute top-0 bottom-0 border-l border-ef-accent/20 w-0" style={{ left: `${otherPos.x}%` }} />);
                                        }
                                        if (Math.abs(otherPos.y - activePos.y) < threshold) {
                                            elements.push(<div key={`h-${idx}`} className="absolute left-0 right-0 border-t border-ef-accent/20 h-0" style={{ top: `${otherPos.y}%` }} />);
                                        }
                                        return elements;
                                    })}
                                </div>

                            </div>

                            {/* Precision D-Pad */}
                            {canMoveCustom && activeSlot?.type === 'starting' && (
                                <div className={`absolute bottom-6 right-6 z-[200] transition-all duration-300 ${isDPadCollapsed ? 'w-12 h-12 p-0 rounded-2xl overflow-hidden' : 'p-4 rounded-[2rem]'} bg-black/90 backdrop-blur-2xl border border-white/10 shadow-2xl border-b-4 border-b-ef-accent`}>
                                    {isDPadCollapsed ? (
                                        <button
                                            onClick={() => setIsDPadCollapsed(false)}
                                            className="w-full h-full flex items-center justify-center text-ef-accent text-lg"
                                        >
                                            ✥
                                        </button>
                                    ) : (
                                        <div className="flex flex-col gap-3">
                                            <div className="flex items-center justify-between w-full">
                                                <span className="text-[8px] font-black text-white/40 uppercase tracking-widest pl-1">MOVE</span>
                                                <button
                                                    onClick={() => setIsDPadCollapsed(true)}
                                                    className="w-5 h-5 flex items-center justify-center text-white/20 hover:text-white transition-colors"
                                                >
                                                    ×
                                                </button>
                                            </div>
                                            <div className="grid grid-cols-3 gap-1.5">
                                                <div />
                                                <button onClick={() => movePlayer('up')} className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-ef-accent hover:text-ef-dark transition-all text-sm font-bold">↑</button>
                                                <div />
                                                <button onClick={() => movePlayer('left')} className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-ef-accent hover:text-ef-dark transition-all text-sm font-bold">←</button>
                                                <button onClick={() => movePlayer('down')} className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-ef-accent hover:text-ef-dark transition-all text-sm font-bold">↓</button>
                                                <button onClick={() => movePlayer('right')} className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-ef-accent hover:text-ef-dark transition-all text-sm font-bold">→</button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>


                        {/* Sub Bench Content (Mobile Vertical) */}
                        <div className="px-6 py-3 flex flex-col gap-2 shrink-0 md:hidden">
                            <div className="flex justify-between items-center">
                                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 italic">Sub Bench</h4>
                                <span className="text-[10px] font-black text-ef-accent italic">{subs.filter(s => s.playerId).length} / 12</span>
                            </div>
                            <div className="flex gap-3 overflow-x-auto no-scrollbar py-2">
                                {subs.slice(0, 12).map((sub, idx) => {
                                    const player = players.find(p => p._id === sub.playerId);
                                    const isSlotActive = activeSlot?.type === 'sub' && activeSlot?.index === idx;
                                    return (
                                        <div key={idx} className="flex flex-col items-center gap-2 shrink-0">
                                            <button
                                                onClick={() => setActiveSlot({ type: 'sub', index: idx })}
                                                className={`w-14 h-14 rounded-xl overflow-hidden border-2 transition-all ${isSlotActive ? 'border-[#fffd00] bg-black/60 shadow-[0_0_15px_rgba(255,253,0,0.3)]' : player ? 'border-white/10 bg-black/40' : 'border-white/5 bg-white/5 opacity-40'}`}
                                            >
                                                {player ? (
                                                    <img src={player.image} alt="" className="w-full h-full object-cover object-top" />
                                                ) : (
                                                    <span className="text-white/20">+</span>
                                                )}
                                            </button>
                                            <span className="text-[8px] font-black text-white/50 uppercase italic tracking-widest">{player ? 'SUB' : ''}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Player Library Content (Mobile Vertical) */}
                        <div className="mt-2 bg-[#121214] rounded-t-[2.5rem] flex-1 flex flex-col border-t border-white/5 min-h-[300px] md:hidden">
                            <div className="px-8 py-6 flex flex-col gap-4">
                                <div className="flex justify-between items-center">
                                    <h3 className="text-sm font-black text-white uppercase tracking-widest italic">Player Library</h3>
                                    <button className="text-white/40 hover:text-white transition-colors">
                                        <span className="text-lg">≡</span>
                                    </button>
                                </div>

                                <div className="flex bg-black/40 p-1 rounded-2xl border border-white/5 mb-2">
                                    <button
                                        onClick={() => setLibraryTab('owned')}
                                        className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${libraryTab === 'owned' ? 'bg-ef-accent text-ef-dark' : 'text-white/40'}`}
                                    >
                                        My Collection
                                    </button>
                                    <button
                                        onClick={() => setLibraryTab('database')}
                                        className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${libraryTab === 'database' ? 'bg-[#fffd00] text-ef-dark' : 'text-white/40'}`}
                                    >
                                        Discover DB
                                    </button>
                                </div>

                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20">🔍</span>
                                    <input
                                        type="text"
                                        placeholder={libraryTab === 'owned' ? "Search collection..." : "Search whole DB..."}
                                        value={libraryTab === 'owned' ? searchTerm : dbSearch}
                                        onChange={(e) => libraryTab === 'owned' ? setSearchTerm(e.target.value) : setDbSearch(e.target.value)}
                                        className="w-full bg-black/60 border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-xs font-bold text-white focus:outline-none focus:border-ef-accent/20 transition-all placeholder:text-white/10"
                                    />
                                </div>

                                <div className="grid grid-cols-5 gap-3 relative">
                                    {libraryTab === 'owned' ? (
                                        filteredPlayers.slice(0, 50).map(player => {
                                            const isAdded = startingXI.some(p => p.playerId === player._id) || subs.some(p => p.playerId === player._id);
                                            return (
                                                <PlayerCard
                                                    key={player._id}
                                                    player={player}
                                                    onClick={() => {
                                                        if (isQuickUpdateMode) {
                                                            handleQuickUpdateClick(player);
                                                        } else {
                                                            handleSelectPlayer(player);
                                                        }
                                                    }}
                                                    isSelected={isAdded}
                                                    size="small"
                                                    showPlaystyles={false}
                                                />
                                            );
                                        })
                                    ) : (
                                        <>
                                            {dbPlayers.map(player => {
                                                const isOwned = players.some(p => String(p.playerId) === String(player.id));
                                                const isSelected = dbSelectedPlayers.has(player.id);
                                                // Map for PlayerCard
                                                const pForCard = {
                                                    ...player,
                                                    rating: 90, // Hardcoded rating for DB players
                                                };
                                                return (
                                                    <PlayerCard
                                                        key={player.id}
                                                        player={pForCard}
                                                        onClick={() => !isOwned && toggleDbSelect(player)}
                                                        isSelected={isOwned}
                                                        isActive={isSelected}
                                                        size="small"
                                                        draggable={!isOwned}
                                                        onDragStart={(e) => onDragStart(e, 'database', player.id, player)}
                                                    />
                                                );
                                            })}
                                            {dbPlayers.length > 0 && dbPage < dbTotalPages && !dbLoading && (
                                                <button
                                                    onClick={() => {
                                                        const nextPage = dbPage + 1;
                                                        setDbPage(nextPage);
                                                        fetchDbPlayers(nextPage, dbSearch);
                                                    }}
                                                    className="col-span-3 py-6 text-[10px] font-black text-white/40 uppercase tracking-[0.3em] bg-white/5 rounded-2xl mt-4"
                                                >
                                                    Load More
                                                </button>
                                            )}
                                        </>
                                    )}
                                </div>

                                {/* Float Action Button for DB */}
                                {libraryTab === 'database' && dbSelectedPlayers.size > 0 && (
                                    <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[3100] w-[90%] md:hidden animate-in slide-in-from-bottom-10 duration-500">
                                        <button
                                            onClick={handleAddFromDb}
                                            disabled={isImporting}
                                            className={`w-full py-5 bg-[#fffd00] rounded-2xl text-ef-dark font-black uppercase tracking-widest shadow-2xl flex items-center justify-center gap-3 active:scale-95 transition-all ${isImporting ? 'opacity-80 cursor-wait' : ''}`}
                                        >
                                            {isImporting ? (
                                                <>
                                                    <div className="w-5 h-5 border-2 border-ef-dark border-t-transparent rounded-full animate-spin"></div>
                                                    <span>Importing...</span>
                                                </>
                                            ) : (
                                                <>
                                                    <span>Import {dbSelectedPlayers.size} Players</span>
                                                    <span className="text-xl">⚡</span>
                                                </>
                                            )}
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Right Partition (Compact Pro) */}
                    {showLibrary && (
                        <div className="hidden md:flex flex-col w-[460px] border-l border-white/5 bg-black/40">

                            <div className="px-6 py-5 border-b border-white/5 flex flex-col gap-4 shrink-0">
                                <div className="flex justify-between items-center">
                                    <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-white/20 italic">PLAYER LIBRARY</h4>
                                    <span className="bg-white/5 px-2 py-0.5 rounded text-[9px] font-black text-[#00FFCC] italic tracking-tighter uppercase">{filteredPlayers.length}</span>
                                </div>

                                <div className="flex bg-white/5 p-1 rounded-xl">
                                    <button
                                        onClick={() => setLibraryTab('owned')}
                                        className={`flex-1 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${libraryTab === 'owned' ? 'bg-ef-accent text-ef-dark' : 'text-white/40 hover:text-white'}`}
                                    >
                                        Collection
                                    </button>
                                    <button
                                        onClick={() => setLibraryTab('database')}
                                        className={`flex-1 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${libraryTab === 'database' ? 'bg-[#fffd00] text-ef-dark' : 'text-white/40 hover:text-white'}`}
                                    >
                                        Scout DB
                                    </button>
                                </div>

                                <div className="flex items-center gap-2">
                                    <div className="relative flex-1">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 text-[10px]">🔍</span>
                                        <input
                                            type="text"
                                            placeholder={libraryTab === 'owned' ? "SEARCH COLLECTION..." : "SEARCH ENTIRE DB..."}
                                            value={libraryTab === 'owned' ? searchTerm : dbSearch}
                                            onChange={(e) => libraryTab === 'owned' ? setSearchTerm(e.target.value) : setDbSearch(e.target.value)}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-12 pr-4 text-[10px] font-black text-white focus:outline-none focus:border-ef-accent/40 transition-all placeholder:text-white/10 uppercase"
                                        />
                                    </div>
                                    {libraryTab === 'owned' && (
                                        <div className="flex items-center gap-2">
                                            <button className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-[#00FFCC] text-xs">💎</button>
                                            <div className="h-9 px-4 rounded-xl bg-white/5 border border-white/10 flex items-center gap-3 text-[9px] font-black text-white/40 uppercase cursor-pointer hover:bg-white/10 transition-all">
                                                <span className="text-[#00FF88]">🏆</span>
                                                RATING
                                                <span className="text-[7px] opacity-20">▼</span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto stylish-scrollbar px-6 py-6 relative">
                                {libraryTab === 'owned' ? (
                                    <div className="grid grid-cols-5 gap-2.5">
                                        {filteredPlayers.slice(0, 100).map(player => {
                                            const isAdded = startingXI.some(p => p.playerId === player._id) || subs.some(p => p.playerId === player._id);
                                            return (
                                                <PlayerCard
                                                    key={player._id}
                                                    player={player}
                                                    onClick={() => {
                                                        if (isQuickUpdateMode) {
                                                            handleQuickUpdateClick(player);
                                                        } else if (isEditMode) {
                                                            handleSelectPlayer(player);
                                                        }
                                                    }}
                                                    isSelected={isAdded}
                                                    size="small"
                                                    draggable={isEditMode && !isAdded}
                                                    onDragStart={(e) => onDragStart(e, 'library', player._id)}
                                                    showPlaystyles={showPlaystyles}
                                                />
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <div className="space-y-3 pb-20">
                                        <div className="grid grid-cols-5 gap-2.5">
                                            {dbPlayers.map(player => {
                                                const isOwned = players.some(p => String(p.playerId) === String(player.id));
                                                const isSelected = dbSelectedPlayers.has(player.id);
                                                const pForCard = { ...player, rating: 90 };
                                                return (
                                                    <PlayerCard
                                                        key={player.id}
                                                        player={pForCard}
                                                        onClick={() => !isOwned && toggleDbSelect(player)}
                                                        isSelected={isOwned}
                                                        isActive={isSelected}
                                                        size="small"
                                                        draggable={!isOwned}
                                                        onDragStart={(e) => onDragStart(e, 'database', player.id, player)}
                                                    />
                                                );
                                            })}
                                        </div>
                                        {dbPlayers.length > 0 && dbPage < dbTotalPages && !dbLoading && (
                                            <button
                                                onClick={() => {
                                                    const nextPage = dbPage + 1;
                                                    setDbPage(nextPage);
                                                    fetchDbPlayers(nextPage, dbSearch);
                                                }}
                                                className="w-full py-4 bg-white/5 border border-white/10 rounded-xl text-[9px] font-black text-white/40 hover:text-white uppercase tracking-widest transition-all"
                                            >
                                                Load More
                                            </button>
                                        )}
                                        {dbLoading && (
                                            <div className="flex justify-center py-4">
                                                <div className="w-5 h-5 border border-ef-accent border-t-transparent rounded-full animate-spin" />
                                            </div>
                                        )}
                                    </div>
                                )}

                                {libraryTab === 'database' && dbSelectedPlayers.size > 0 && (
                                    <div className="absolute bottom-6 left-6 right-6 z-20">
                                        <button
                                            onClick={handleAddFromDb}
                                            disabled={isImporting}
                                            className={`w-full py-4 bg-[#fffd00] hover:bg-[#fffd00]/90 rounded-2xl text-ef-dark font-black uppercase tracking-widest transition-all shadow-2xl flex items-center justify-center gap-3 active:scale-95 ${isImporting ? 'opacity-80 cursor-wait' : ''}`}
                                        >
                                            {isImporting ? (
                                                <>
                                                    <div className="w-4 h-4 border-2 border-ef-dark border-t-transparent rounded-full animate-spin"></div>
                                                    <span className="text-[10px]">IMPORTING...</span>
                                                </>
                                            ) : (
                                                <>
                                                    <span className="text-[10px]">IMPORT {dbSelectedPlayers.size} TO SQUAD</span>
                                                    <span className="text-sm">⚡</span>
                                                </>
                                            )}
                                        </button>
                                    </div>
                                )}
                                {/* Accent Line */}
                                <div className="absolute right-0 top-0 bottom-0 w-1 bg-[#00FFCC]/20 rounded-full"></div>
                            </div>
                        </div>
                    )}




                </div>

                {/* Custom Role Editor Modal (Premium UI) */}
                {editingRoleIndex !== null && (
                    <div className="fixed inset-0 z-[3000] flex items-center justify-center p-6 bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
                        <div className="bg-[#0a0a0c] border border-white/10 rounded-[2.5rem] w-full max-w-sm overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
                            <div className="p-8 flex flex-col gap-6">
                                <div className="space-y-1">
                                    <h3 className="text-xl font-black text-white italic uppercase tracking-tighter">Edit Player Role</h3>
                                    <p className="text-[10px] text-white/30 uppercase font-bold tracking-[0.2em]">Assign a tactical position</p>
                                </div>
                                <div className="relative">
                                    <input
                                        autoFocus
                                        value={roleInputValue}
                                        onChange={(e) => setRoleInputValue(e.target.value.toUpperCase())}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                handleUpdateRole(editingRoleIndex, roleInputValue);
                                                setEditingRoleIndex(null);
                                            }
                                            if (e.key === 'Escape') setEditingRoleIndex(null);
                                        }}
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl py-5 px-6 text-2xl font-black text-ef-accent uppercase focus:outline-none focus:border-ef-accent transition-all text-center tracking-widest"
                                        placeholder="E.G. CMF"
                                    />
                                    <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-ef-accent rounded-full flex items-center justify-center text-black pointer-events-none">✨</div>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        onClick={() => setEditingRoleIndex(null)}
                                        className="py-4 bg-white/5 hover:bg-white/10 rounded-2xl text-[10px] font-black text-white/40 uppercase tracking-widest transition-all"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={() => {
                                            handleUpdateRole(editingRoleIndex, roleInputValue);
                                            setEditingRoleIndex(null);
                                        }}
                                        className="py-4 bg-[#00FF88] hover:bg-[#00e67a] rounded-2xl text-[10px] font-black text-black uppercase tracking-widest transition-all shadow-[0_0_20px_rgba(0,255,136,0.2)]"
                                    >
                                        Confirm
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Quick Update Modal */}
                {updatingPlayer && (
                    <div
                        className="fixed inset-0 z-[3000] flex items-center justify-center p-6 bg-black/60 backdrop-blur-md animate-in fade-in duration-300"
                        onPaste={handleQuickPaste}
                    >
                        <div className="bg-[#0a0a0c] border border-white/10 rounded-[2.5rem] w-full max-w-sm overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
                            <div className="p-8 flex flex-col gap-6">
                                <div className="flex items-center gap-4">
                                    <div
                                        className="relative w-20 h-20 rounded-2xl overflow-hidden border border-white/10 group/updphoto cursor-pointer"
                                        onClick={() => quickImageInputRef.current?.click()}
                                    >
                                        <img src={updateForm.image} alt="" className="w-full h-full object-cover object-top" />
                                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover/updphoto:opacity-100 transition-opacity flex items-center justify-center">
                                            <span className="text-[10px] font-black text-white uppercase tracking-tighter">Edit</span>
                                        </div>
                                        <input
                                            type="file"
                                            ref={quickImageInputRef}
                                            className="hidden"
                                            accept="image/*"
                                            onChange={handleQuickImageChange}
                                        />
                                    </div>
                                    <div className="flex-1 min-w-0 space-y-1">
                                        <h3 className="text-xl font-black text-white italic uppercase tracking-tighter truncate">{updatingPlayer.name}</h3>
                                        <p className="text-[10px] text-ef-accent uppercase font-bold tracking-[0.2em]">{updatingPlayer.position} • QUICK STATS</p>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="space-y-1.5 px-1">
                                        <label className="text-[8px] font-black text-white/30 uppercase tracking-[0.2em] ml-1">Profile Photo Link</label>
                                        <input
                                            type="text"
                                            value={updateForm.image && !updateForm.image.startsWith('data:') ? updateForm.image : ''}
                                            placeholder="https://..."
                                            onChange={(e) => setUpdateForm({ ...updateForm, image: e.target.value })}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 px-4 text-[10px] text-white focus:outline-none focus:border-ef-accent transition-all"
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em] ml-2">Rating</label>
                                            <input
                                                type="number"
                                                value={updateForm.rating}
                                                onChange={(e) => setUpdateForm({ ...updateForm, rating: parseInt(e.target.value) || 0 })}
                                                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-xl font-black text-ef-accent focus:outline-none focus:border-ef-accent transition-all text-center"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em] ml-2">Matches</label>
                                            <input
                                                type="number"
                                                value={updateForm.matches}
                                                onChange={(e) => setUpdateForm({ ...updateForm, matches: parseInt(e.target.value) || 0 })}
                                                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-xl font-black text-white focus:outline-none focus:border-white/40 transition-all text-center"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em] ml-2">Goals</label>
                                            <input
                                                type="number"
                                                value={updateForm.goals}
                                                onChange={(e) => setUpdateForm({ ...updateForm, goals: parseInt(e.target.value) || 0 })}
                                                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-xl font-black text-[#FFEB3B] focus:outline-none focus:border-[#FFEB3B]/40 transition-all text-center"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em] ml-2">Assists</label>
                                            <input
                                                type="number"
                                                value={updateForm.assists}
                                                onChange={(e) => setUpdateForm({ ...updateForm, assists: parseInt(e.target.value) || 0 })}
                                                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-xl font-black text-[#00E5FF] focus:outline-none focus:border-[#00E5FF]/40 transition-all text-center"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3 mt-2">
                                        <button
                                            onClick={() => setUpdatingPlayer(null)}
                                            className="py-4 bg-white/5 hover:bg-white/10 rounded-2xl text-[10px] font-black text-white/40 uppercase tracking-widest transition-all"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={async () => {
                                                if (onUpdatePlayer) {
                                                    await onUpdatePlayer(updatingPlayer._id, updateForm, false);
                                                    setUpdatingPlayer(null);
                                                }
                                            }}
                                            className="py-4 bg-ef-accent hover:bg-[#00e67a] rounded-2xl text-[10px] font-black text-black uppercase tracking-widest transition-all shadow-[0_0_20px_rgba(0,255,136,0.2)]"
                                        >
                                            Update Stats
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
};

export default SquadEditor;
