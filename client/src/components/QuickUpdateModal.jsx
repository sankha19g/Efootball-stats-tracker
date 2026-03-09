import { useState, useMemo, useEffect } from 'react';
import { PLAYSTYLES } from '../constants';

const QuickUpdateModal = ({ players, onUpdate, onClose, user, activeSquad }) => {
    const [search, setSearch] = useState('');
    const [isManualMode, setIsManualMode] = useState(false);
    const [isRatingsUnlocked, setIsRatingsUnlocked] = useState(false);
    const [filterInactive, setFilterInactive] = useState(false);
    const [showMy11, setShowMy11] = useState(false);
    const [activePage, setActivePage] = useState(0); // 0: Stats, 1: NOT USED, 2: Photo Upload
    const [activeFilters, setActiveFilters] = useState({
        position: '',
        club: '',
        league: '',
        nationality: '',
        cardType: '',
        playstyle: ''
    });
    const [searchRating, setSearchRating] = useState('');

    const categories = useMemo(() => {
        return {
            positions: [...new Set(players.map(p => p.position))].filter(Boolean).sort(),
            clubs: [...new Set(players.map(p => p.club))].filter(Boolean).sort(),
            leagues: [...new Set(players.map(p => p.league))].filter(Boolean).sort(),
            nationalities: [...new Set(players.map(p => p.nationality))].filter(Boolean).sort(),
            cardTypes: [...new Set(players.map(p => p.cardType))].filter(Boolean).sort(),
        };
    }, [players]);

    const my11Ids = useMemo(() => {
        if (!activeSquad?.startingXI) return new Set();
        return new Set(activeSquad.startingXI.map(p => p.playerId).filter(Boolean));
    }, [activeSquad]);

    const filteredPlayers = useMemo(() => {
        let result = players;

        if (showMy11) {
            result = result.filter(p => my11Ids.has(p._id));
        }

        if (search) {
            const query = search.toLowerCase();
            result = result.filter(p =>
                p.name.toLowerCase().includes(query) ||
                p.search_name?.toLowerCase().includes(query) ||
                p.club?.toLowerCase().includes(query)
            );
        }

        if (searchRating) {
            result = result.filter(p => (p.rating || 0).toString() === searchRating);
        }

        if (filterInactive) {
            result = result.filter(p => (p.matches || 0) === 0);
        }

        if (activeFilters.position) result = result.filter(p => p.position === activeFilters.position);
        if (activeFilters.club) result = result.filter(p => p.club === activeFilters.club);
        if (activeFilters.league) result = result.filter(p => p.league === activeFilters.league);
        if (activeFilters.nationality) result = result.filter(p => p.nationality === activeFilters.nationality);
        if (activeFilters.cardType) result = result.filter(p => p.cardType === activeFilters.cardType);
        if (activeFilters.playstyle) result = result.filter(p => p.playstyle === activeFilters.playstyle);

        return result;
    }, [players, search, searchRating, filterInactive, activeFilters, showMy11, my11Ids]);

    const handleStep = (player, field, delta) => {
        const newValue = Math.max(0, (player[field] || 0) + delta);
        if (newValue === player[field]) return;
        onUpdate(player._id, { [field]: newValue });
    };

    const handleManualUpdate = (player, field, value) => {
        const newValue = Math.max(0, parseInt(value) || 0);
        onUpdate(player._id, { [field]: newValue });
    };

    return (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-[1100] p-0 md:p-4 animate-fade-in backdrop-blur-xl">
            <div className="w-full max-w-7xl h-full md:h-[85vh] bg-[#0a0a0c] md:rounded-3xl border border-white/10 shadow-2xl overflow-hidden flex relative">

                {/* Sidebar Navigation */}
                <div className="w-16 md:w-20 bg-white/5 border-r border-white/5 flex flex-col items-center py-6 gap-6 z-20">
                    <button
                        onClick={() => setActivePage(0)}
                        className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${activePage === 0 ? 'bg-ef-accent text-ef-dark shadow-lg shadow-ef-accent/20 scale-110' : 'text-white/40 hover:text-white hover:bg-white/5'}`}
                        title="Match Stats & Ratings"
                    >
                        <span className="text-xl">📊</span>
                    </button>
                    <button
                        onClick={() => setActivePage(2)}
                        className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${activePage === 2 ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/20 scale-110' : 'text-white/40 hover:text-white hover:bg-white/5'}`}
                        title="Photo Upload"
                    >
                        <span className="text-xl">📸</span>
                    </button>
                    <button
                        onClick={() => setActivePage(3)}
                        className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${activePage === 3 ? 'bg-ef-blue text-ef-dark shadow-lg shadow-ef-blue/20 scale-110' : 'text-white/40 hover:text-white hover:bg-white/5'}`}
                        title="Secondary Positions"
                    >
                        <span className="text-xl">🏃‍♂️</span>
                    </button>
                </div>

                {/* Main Content Area */}
                <div className="flex-1 flex flex-col relative overflow-hidden">

                    {/* Header */}
                    <div className="p-6 border-b border-white/5 bg-white/5 flex flex-col gap-4">
                        <div className="flex justify-between items-center">
                            <div>
                                <h3 className="text-xl font-black bg-gradient-to-r from-ef-accent to-ef-blue bg-clip-text text-transparent uppercase italic tracking-tighter">
                                    Quick Stats Update
                                </h3>
                                <div className="flex items-center gap-2 mt-1">
                                    <p className="text-[10px] font-black uppercase tracking-widest opacity-40">Update match details instantly</p>
                                    <button
                                        onClick={() => setFilterInactive(!filterInactive)}
                                        className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded border transition-all ${filterInactive ? 'bg-ef-accent/20 border-ef-accent text-ef-accent' : 'bg-white/5 border-white/10 text-white/40 hover:text-white'}`}
                                        title="Show only players with 0 games"
                                    >
                                        {filterInactive ? '🎯 Inactive Only' : 'All Players'}
                                    </button>
                                    <span className="w-1 h-1 rounded-full bg-white/20"></span>
                                    <button
                                        onClick={() => setIsManualMode(!isManualMode)}
                                        className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded border transition-all ${isManualMode ? 'bg-ef-blue/20 border-ef-blue text-ef-blue' : 'bg-white/5 border-white/10 text-white/40 hover:text-white'}`}
                                    >
                                        {isManualMode ? '⌨️ Manual' : '🖱️ Arrow'}
                                    </button>
                                    <span className="w-1 h-1 rounded-full bg-white/20"></span>
                                    <button
                                        onClick={() => setIsRatingsUnlocked(!isRatingsUnlocked)}
                                        className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded border transition-all ${isRatingsUnlocked ? 'bg-yellow-500/20 border-yellow-500 text-yellow-500' : 'bg-white/5 border-white/10 text-white/40 hover:text-white'}`}
                                    >
                                        {isRatingsUnlocked ? '🔓 Ratings' : '🔒 Ratings'}
                                    </button>
                                    <span className="w-1 h-1 rounded-full bg-white/20"></span>
                                    <button
                                        onClick={() => setShowMy11(!showMy11)}
                                        className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded border transition-all ${showMy11 ? 'bg-[#00FF88]/20 border-[#00FF88] text-[#00FF88]' : 'bg-white/5 border-white/10 text-white/40 hover:text-white'}`}
                                        title="Show only players in your active formation"
                                    >
                                        {showMy11 ? '⭐ MY 11' : 'ALL'}
                                    </button>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 text-white transition-all flex items-center justify-center border border-white/10"
                            >✕</button>
                        </div>

                        <div className="flex gap-3">
                            <div className="relative flex-1">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 opacity-20 text-sm">🔍</span>
                                <input
                                    type="text"
                                    placeholder="Filter your squad..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="w-full bg-black/40 border border-white/10 rounded-2xl pl-12 pr-6 py-3.5 text-sm font-bold text-white outline-none focus:border-ef-accent/40 transition-all placeholder:text-white/10"
                                />
                            </div>
                            <div className="relative w-32">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 opacity-20 text-[10px] font-black uppercase">RTG</span>
                                <input
                                    type="number"
                                    placeholder="Rating"
                                    value={searchRating}
                                    onChange={(e) => setSearchRating(e.target.value)}
                                    className="w-full bg-black/40 border border-white/10 rounded-2xl pl-12 pr-4 py-3.5 text-sm font-black text-ef-accent outline-none focus:border-ef-accent/40 transition-all placeholder:text-white/10 appearance-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                />
                            </div>
                        </div>

                        {/* Filter Dropdowns Bar */}
                        <div className="flex gap-2 overflow-x-auto no-scrollbar py-1">
                            <FilterSelect
                                label="Pos"
                                value={activeFilters.position}
                                options={categories.positions}
                                onChange={(val) => setActiveFilters(prev => ({ ...prev, position: val }))}
                            />
                            <FilterSelect
                                label="Club"
                                value={activeFilters.club}
                                options={categories.clubs}
                                onChange={(val) => setActiveFilters(prev => ({ ...prev, club: val }))}
                            />
                            <FilterSelect
                                label="League"
                                value={activeFilters.league}
                                options={categories.leagues}
                                onChange={(val) => setActiveFilters(prev => ({ ...prev, league: val }))}
                            />
                            <FilterSelect
                                label="Nat"
                                value={activeFilters.nationality}
                                options={categories.nationalities}
                                onChange={(val) => setActiveFilters(prev => ({ ...prev, nationality: val }))}
                            />
                            <FilterSelect
                                label="Card"
                                value={activeFilters.cardType}
                                options={categories.cardTypes}
                                onChange={(val) => setActiveFilters(prev => ({ ...prev, cardType: val }))}
                            />
                            <FilterSelect
                                label="Style"
                                value={activeFilters.playstyle}
                                options={PLAYSTYLES}
                                onChange={(val) => setActiveFilters(prev => ({ ...prev, playstyle: val }))}
                            />

                            {(activeFilters.position || activeFilters.club || activeFilters.league || activeFilters.nationality || activeFilters.cardType || activeFilters.playstyle) && (
                                <button
                                    onClick={() => setActiveFilters({ position: '', club: '', league: '', nationality: '', cardType: '', playstyle: '' })}
                                    className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-[9px] font-black uppercase text-white/40 hover:text-white hover:bg-white/10 transition-all shrink-0"
                                >
                                    Reset
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Content Pages */}
                    <div className="flex-1 relative overflow-hidden">
                        {/* Page 0: Match Stats & Ratings */}
                        <div className={`absolute inset-0 flex flex-col transition-all duration-500 transform ${activePage === 0 ? 'translate-x-0 opacity-100' : '-translate-x-full opacity-100 pointer-events-none'}`}>
                            <div className="flex-1 overflow-y-auto custom-scrollbar p-2 md:p-4 space-y-2">
                                {filteredPlayers.length === 0 ? (
                                    <div className="h-60 flex flex-col items-center justify-center opacity-20">
                                        <span className="text-4xl mb-2">👤</span>
                                        <p className="text-xs font-black uppercase tracking-widest">No players found</p>
                                    </div>
                                ) : (
                                    filteredPlayers.map(player => (
                                        <div key={player._id} className="group bg-white/5 hover:bg-white/10 border border-white/5 rounded-2xl p-3 flex items-center justify-between gap-4 transition-all hover:border-white/10">
                                            {/* Photo & Basic Info */}
                                            <div className="flex items-center gap-3 w-1/4 min-w-0">
                                                <div className="w-12 h-12 flex-shrink-0 rounded-xl overflow-hidden border border-white/10 bg-black/40">
                                                    <img src={player.image} alt="" className="w-full h-full object-cover object-top" />
                                                </div>
                                                <div className="truncate">
                                                    <h4 className="text-sm font-black text-white truncate uppercase tracking-tight">{player.name}</h4>
                                                    <div className="flex items-center gap-1 opacity-30 uppercase tracking-widest text-[9px] font-bold truncate">
                                                        <span>{player.position}</span>
                                                        <span>•</span>
                                                        <span className="truncate">{player.club}</span>
                                                        {player.playstyle && player.playstyle !== 'None' && (
                                                            <>
                                                                <span>•</span>
                                                                <span className="text-ef-accent/60 lowercase italic">{player.playstyle}</span>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Combined Controls */}
                                            <div className="flex-1 flex items-center justify-end gap-2 md:gap-4">
                                                <StatControl
                                                    label="OVR"
                                                    value={player.rating || 0}
                                                    isManual={isManualMode}
                                                    isDisabled={!isRatingsUnlocked}
                                                    onUp={() => handleStep(player, 'rating', 1)}
                                                    onDown={() => handleStep(player, 'rating', -1)}
                                                    onManual={(val) => handleManualUpdate(player, 'rating', val)}
                                                    color="ef-accent"
                                                />
                                                <div className="w-px h-8 bg-white/5 mx-2 hidden md:block"></div>
                                                <StatControl
                                                    label="MT"
                                                    value={player.matches || 0}
                                                    isManual={isManualMode}
                                                    onUp={() => handleStep(player, 'matches', 1)}
                                                    onDown={() => handleStep(player, 'matches', -1)}
                                                    onManual={(val) => handleManualUpdate(player, 'matches', val)}
                                                    color="white"
                                                />
                                                <StatControl
                                                    label="GL"
                                                    value={player.goals || 0}
                                                    isManual={isManualMode}
                                                    onUp={() => handleStep(player, 'goals', 1)}
                                                    onDown={() => handleStep(player, 'goals', -1)}
                                                    onManual={(val) => handleManualUpdate(player, 'goals', val)}
                                                    color="ef-accent"
                                                />
                                                <StatControl
                                                    label="AS"
                                                    value={player.assists || 0}
                                                    isManual={isManualMode}
                                                    onUp={() => handleStep(player, 'assists', 1)}
                                                    onDown={() => handleStep(player, 'assists', -1)}
                                                    onManual={(val) => handleManualUpdate(player, 'assists', val)}
                                                    color="ef-blue"
                                                />
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* Page 2: Photos */}
                        <div className={`absolute inset-0 flex flex-col transition-all duration-500 transform ${activePage === 2 ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-100 pointer-events-none'}`}>
                            <div className="flex-1 overflow-y-auto custom-scrollbar p-2 md:p-4 space-y-2">
                                {filteredPlayers.length === 0 ? (
                                    <div className="h-60 flex flex-col items-center justify-center opacity-20">
                                        <span className="text-4xl mb-2">👤</span>
                                        <p className="text-xs font-black uppercase tracking-widest">No players found</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                                        {filteredPlayers.map(player => (
                                            <PhotoUploadCard key={player._id} player={player} onUpdate={onUpdate} />
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Page 3: Secondary Positions */}
                        <div className={`absolute inset-0 flex flex-col transition-all duration-500 transform ${activePage === 3 ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-100 pointer-events-none'}`}>
                            <div className="flex-1 overflow-y-auto custom-scrollbar p-2 md:p-4 space-y-2">
                                {filteredPlayers.length === 0 ? (
                                    <div className="h-60 flex flex-col items-center justify-center opacity-20">
                                        <span className="text-4xl mb-2">👤</span>
                                        <p className="text-xs font-black uppercase tracking-widest">No players found</p>
                                    </div>
                                ) : (
                                    filteredPlayers.map(player => (
                                        <div key={player._id} className="group bg-white/5 hover:bg-white/10 border border-white/5 rounded-2xl p-3 flex items-center justify-between gap-4 transition-all hover:border-white/10">
                                            {/* Photo & Info */}
                                            <div className="flex items-center gap-3 w-1/3 min-w-0">
                                                <div className="w-10 h-10 flex-shrink-0 rounded-lg overflow-hidden border border-white/10 bg-black/40">
                                                    <img src={player.image} alt="" className="w-full h-full object-cover object-top" />
                                                </div>
                                                <div className="truncate">
                                                    <h4 className="text-xs font-black text-white truncate uppercase tracking-tight">{player.name}</h4>
                                                    <div className="flex items-center gap-1.5 mt-0.5">
                                                        <span className="text-[8px] opacity-40 font-black uppercase tracking-widest leading-none">{player.position}</span>
                                                        <span className="text-[9px] opacity-20 font-black">•</span>
                                                        <span className="text-[9px] opacity-20 font-bold uppercase truncate leading-none">{player.club}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Secondary Position Input */}
                                            <div className="flex-1 max-w-sm">
                                                <div className="relative group/input">
                                                    <SecondaryPosInput
                                                        value={player.secondaryPosition}
                                                        onUpdate={(val) => onUpdate(player._id, { secondaryPosition: val })}
                                                    />
                                                    <div className="absolute right-3 top-1/2 -translate-y-1/2 opacity-20 text-[8px] font-black uppercase tracking-widest group-focus-within/input:opacity-0 transition-opacity pointer-events-none">
                                                        SEC POS
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col items-center gap-2 pb-2">
                        <p className="text-[10px] font-black uppercase tracking-widest opacity-30">Changes are saved automatically</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

const StatControl = ({ label, value, onUp, onDown, onManual, isManual, isDisabled, color }) => {
    const [localValue, setLocalValue] = useState(value);

    useEffect(() => {
        setLocalValue(value);
    }, [value]);

    const handleCommit = () => {
        if (localValue !== value) {
            onManual(localValue);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            handleCommit();
            e.target.blur();
        }
    };

    return (
        <div className={`flex flex-col items-center min-w-[60px] md:min-w-[70px] transition-all duration-300 ${isDisabled ? 'opacity-40 grayscale pointer-events-none scale-90' : 'opacity-100'}`}>
            <span className={`text-[8px] font-black uppercase tracking-widest opacity-20 mb-1`}>{label}</span>
            <div className={`flex items-center bg-black/40 border border-white/5 rounded-xl overflow-hidden transition-all h-8 ${isDisabled ? 'bg-white/5' : ''}`}>
                {isManual ? (
                    <input
                        type="number"
                        value={localValue}
                        onChange={(e) => setLocalValue(e.target.value)}
                        onBlur={handleCommit}
                        onKeyDown={handleKeyDown}
                        disabled={isDisabled}
                        className={`w-12 h-full bg-transparent text-center font-black text-sm outline-none ${color === 'ef-accent' ? 'text-ef-accent' : color === 'ef-blue' ? 'text-ef-blue' : 'text-white'}`}
                    />
                ) : (
                    <>
                        <button
                            onClick={onDown}
                            disabled={isDisabled}
                            className="w-5 h-full flex items-center justify-center hover:bg-white/5 active:bg-white/10 transition-colors text-white/40 text-xs"
                        >−</button>
                        <div className={`w-8 h-full flex items-center justify-center font-black text-sm ${color === 'ef-accent' ? 'text-ef-accent' : color === 'ef-blue' ? 'text-ef-blue' : 'text-white'}`}>
                            {value}
                        </div>
                        <button
                            onClick={onUp}
                            disabled={isDisabled}
                            className="w-5 h-full flex items-center justify-center hover:bg-white/5 active:bg-white/10 transition-colors text-white/60 text-xs"
                        >+</button>
                    </>
                )}
            </div>
        </div>
    );
};

const FilterSelect = ({ label, value, options, onChange }) => (
    <div className="flex items-center bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 shrink-0 transition-all hover:bg-white/10">
        <span className="text-[9px] font-black opacity-30 uppercase mr-2">{label}</span>
        <select
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="bg-transparent border-none outline-none text-[10px] font-bold text-white/80 cursor-pointer min-w-[60px]"
        >
            <option value="" className="bg-[#1a1a1e]">All</option>
            {options.map(opt => (
                <option key={opt} value={opt} className="bg-[#1a1a1e]">{opt}</option>
            ))}
        </select>
    </div>
);

const SecondaryPosInput = ({ value, onUpdate }) => {
    const [localValue, setLocalValue] = useState(value || '');

    useEffect(() => {
        setLocalValue(value || '');
    }, [value]);

    const handleCommit = () => {
        const normalized = localValue.replace(/,/g, ' ').toUpperCase();
        if (normalized !== (value || '')) {
            onUpdate(normalized);
        }
    };

    return (
        <input
            type="text"
            placeholder="e.g. AMF SS LWF"
            value={localValue}
            onChange={(e) => setLocalValue(e.target.value)}
            onBlur={handleCommit}
            onKeyDown={(e) => e.key === 'Enter' && e.target.blur()}
            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-xs font-bold text-ef-accent outline-none focus:border-ef-accent/40 transition-all placeholder:text-white/5"
        />
    );
};

const PhotoUploadCard = ({ player, onUpdate }) => {
    const [isDragging, setIsDragging] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);

    const handlePaste = (e) => {
        const items = e.clipboardData?.items;
        if (items) {
            for (let i = 0; i < items.length; i++) {
                if (items[i].type.indexOf('image') !== -1) {
                    const file = items[i].getAsFile();
                    processFile(file);
                }
            }
        }
    };

    const handlePasteClick = async () => {
        try {
            const items = await navigator.clipboard.read();
            for (const item of items) {
                if (item.types && item.types.some(type => type.startsWith('image/'))) {
                    const blob = await item.getType(item.types.find(type => type.startsWith('image/')));
                    processFile(blob);
                }
            }
        } catch (err) {
            console.error('Failed to read clipboard contents: ', err);
        }
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files[0];
        if (file && file.type.startsWith('image/')) {
            processFile(file);
        }
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) processFile(file);
    };

    const processFile = (file) => {
        const img = new Image();
        img.src = URL.createObjectURL(file);
        img.onload = () => {
            const MAX_WIDTH = 400;
            let width = img.width;
            let height = img.height;
            if (width > MAX_WIDTH) {
                height *= MAX_WIDTH / width;
                width = MAX_WIDTH;
            }
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);
            const optimizedImage = canvas.toDataURL('image/jpeg', 0.7);
            onUpdate(player._id, { image: optimizedImage });
            URL.revokeObjectURL(img.src);

            setShowSuccess(true);
            setTimeout(() => setShowSuccess(false), 2000);
        };
    };

    return (
        <div
            className={`group relative bg-white/5 border rounded-xl p-2 flex flex-col gap-2 transition-all ${isDragging ? 'border-purple-500 bg-purple-500/10' : 'border-white/5 hover:bg-white/10 hover:border-white/20'}`}
            onPaste={handlePaste}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            tabIndex="0"
        >
            <div className="flex items-center gap-2">
                <div className="w-12 h-12 rounded-lg overflow-hidden border border-white/10 bg-black/40 shrink-0">
                    <img src={player.image} alt="" className="w-full h-full object-cover object-top" />
                </div>
                <div className="truncate flex-1 min-w-0">
                    <div className="flex items-center gap-1">
                        <div className="text-[10px] font-black text-white truncate">{player.name}</div>
                        {showSuccess && <span className="text-ef-accent text-[10px] animate-bounce">✓</span>}
                    </div>
                    <div className="text-[8px] font-bold opacity-30 truncate flex items-center gap-1">
                        <span className="truncate">{player.club}</span>
                        {player.playstyle && player.playstyle !== 'None' && (
                            <>
                                <span>•</span>
                                <span className="text-ef-accent/60 lowercase italic truncate">{player.playstyle}</span>
                            </>
                        )}
                    </div>
                </div>
                <div className="w-1.5 h-1.5 rounded-full bg-purple-500 opacity-0 group-focus:opacity-100 transition-opacity shrink-0"></div>
            </div>

            <div className={`relative h-20 bg-black/20 border border-dashed rounded-lg flex flex-col items-center justify-center text-center transition-all cursor-pointer overflow-hidden ${isDragging ? 'border-purple-500' : 'border-white/5 group-focus:border-purple-500/50 group-focus:bg-purple-500/5'}`}>
                <input type="file" accept="image/*" onChange={handleFileChange} className="absolute inset-0 opacity-0 cursor-pointer z-10" />
                {isDragging ? (
                    <span className="text-2xl animate-bounce">📂</span>
                ) : (
                    <>
                        <span className="text-xl mb-1 opacity-50 group-hover:scale-110 transition-transform">📸</span>
                        <span className="text-[8px] font-black uppercase tracking-widest opacity-30 group-hover:opacity-60">Paste / Drop</span>
                    </>
                )}
            </div>

            <button
                onClick={handlePasteClick}
                className="w-full py-1.5 bg-white/5 hover:bg-white/10 border border-white/5 rounded-lg text-[8px] font-black uppercase tracking-widest text-white/40 hover:text-white transition-all flex items-center justify-center gap-1.5"
            >
                <span>📋</span> Paste
            </button>
        </div>
    );
};

export default QuickUpdateModal;
