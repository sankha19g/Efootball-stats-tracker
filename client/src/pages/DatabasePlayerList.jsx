import { useState, useEffect, useCallback, useRef } from 'react';
import { RotateCcw, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { getDatabasePlayers, invalidatePlayerCache } from '../services/footballApi';
import { deleteFromGlobalDatabase } from '../services/playerService';
import ScrapeDataModal from '../components/ScrapeDataModal';
import { getOffensivePlaystyle, getDefensivePlaystyle } from '../constants';
import { DualPlaystyles } from '../components/DualPlaystyles';

const DatabasePlayerList = ({ onAddPlayers, onBack, settings, ownersPlayers = [], showAlert, showConfirm }) => {
    const [players, setPlayers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    // Filters
    const [search, setSearch] = useState('');
    const [filters, setFilters] = useState({
        position: 'All',
        cardType: 'All',
        league: 'All',
        club: '',
        nationality: ''
    });

    const [selectedPlayers, setSelectedPlayers] = useState(new Map());
    const [showScrapeModal, setShowScrapeModal] = useState(false);
    const scrollRef = useRef(null);

    // Create a Set of existing player IDs for O(1) lookup
    const existingPlayerIds = new Set(
        ownersPlayers.map(p => p.pesdb_id || p.playerId).filter(id => id)
    );

    const fetchPlayers = useCallback(async (currentPage, currentSearch, currentFilters) => {
        setLoading(true);
        const data = await getDatabasePlayers({
            q: currentSearch,
            ...currentFilters,
            page: currentPage,
            limit: 50 // Exactly 50 cards per page
        });

        setPlayers(data.players || []);
        setTotal(data.total || 0);
        setTotalPages(data.totalPages || 1);
        setLoading(false);
    }, []);

    const [refreshing, setRefreshing] = useState(false);

    const handleRefresh = async () => {
        setRefreshing(true);
        invalidatePlayerCache();
        setPage(1);
        await fetchPlayers(1, search, filters);
        setRefreshing(false);
        if (showAlert) showAlert('Refreshed', 'Player database reloaded!', 'success');
    };

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            setPage(1);
            fetchPlayers(1, search, filters);
        }, 300);
        return () => clearTimeout(timeoutId);
    }, [search, filters, fetchPlayers]);

    const handlePageChange = (newPage) => {
        if (newPage < 1 || newPage > totalPages || newPage === page || loading) return;
        setPage(newPage);
        fetchPlayers(newPage, search, filters);
        scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const getPageNumbers = () => {
        const delta = 2;
        const range = [];
        const rangeWithDots = [];
        let l;

        for (let i = 1; i <= totalPages; i++) {
            if (i === 1 || i === totalPages || (i >= page - delta && i <= page + delta)) {
                range.push(i);
            }
        }

        for (let i of range) {
            if (l) {
                if (i - l === 2) {
                    rangeWithDots.push(l + 1);
                } else if (i - l !== 1) {
                    rangeWithDots.push('...');
                }
            }
            rangeWithDots.push(i);
            l = i;
        }

        return rangeWithDots;
    };

    const toggleSelect = (player) => {
        setSelectedPlayers(prev => {
            const next = new Map(prev);
            if (next.has(player.id)) {
                next.delete(player.id);
            } else {
                next.set(player.id, player);
            }
            return next;
        });
    };

    const handleAddSelected = () => {
        if (selectedPlayers.size === 0) return;

        const playersList = Array.from(selectedPlayers.values());

        // Map to app player format — spread ALL scraped fields first, then override/add app-specific ones
        const playersToAdd = playersList.map(p => ({
            // ── All scraped PESDB fields (pass through everything) ──
            ...p,

            // ── App-specific overrides ──
            name: p.name,
            image: p.image,
            nationality: p.nationality,
            club: p.club_original || p.club,
            league: p.league,
            position: p.position,
            offensivePlaystyle: p.offensivePlaystyle || getOffensivePlaystyle(p),
            defensivePlaystyle: p.defensivePlaystyle || getDefensivePlaystyle(p),
            playstyle: p.playstyle || p.offensivePlaystyle || 'None',
            cardType: p.card_type || 'Normal',
            pesdb_id: p.id,
            playerId: p.id,
            rating: p.rating || 90,
            goals: 0,
            assists: 0,
            matches: 0,
            logos: {
                club: p.club_badge_url || '',
                country: p.nationality_flag_url || '',
                league: ''
            },

            // ── Scraped detail fields (explicit for safety) ──
            height: p.height || '',
            weight: p.weight || '',
            age: p.age || '',
            strongFoot: p.strongFoot || '',
            skills: p.skills || [],
            'Weak Foot Usage': p['Weak Foot Usage'] || '',
            'Weak Foot Accuracy': p['Weak Foot Accuracy'] || '',
            'Form': p['Form'] || '',
            'Injury Resistance': p['Injury Resistance'] || '',
            'Featured Players': p['Featured Players'] || '',
            'Date Added': p['Date Added'] || ''
        }));

        onAddPlayers(playersToAdd);
        setSelectedPlayers(new Map());
    };

    const handleDeleteSelected = () => {
        if (selectedPlayers.size === 0) return;

        const playerIds = Array.from(selectedPlayers.keys());

        showConfirm(
            'Delete from Database',
            `Are you sure you want to permanently delete these ${selectedPlayers.size} players from the global database? This action cannot be undone.`,
            async () => {
                try {
                    setLoading(true);
                    await deleteFromGlobalDatabase(playerIds);
                    invalidatePlayerCache();
                    setSelectedPlayers(new Map());
                    showAlert('Deleted', 'Players removed from global database.', 'success');
                    // Refresh current view
                    setPage(1);
                    fetchPlayers(1, search, filters);
                } catch (err) {
                    console.error('Delete error:', err);
                    showAlert('Error', 'Failed to delete players from database.', 'danger');
                } finally {
                    setLoading(false);
                }
            },
            'danger'
        );
    };

    const positions = ['All', 'CF', 'SS', 'LWF', 'RWF', 'LMF', 'RMF', 'AMF', 'CMF', 'DMF', 'LB', 'RB', 'CB', 'GK'];
    const cardTypes = ['All', 'POTW', 'Legendary', 'Epic', 'Featured', 'Highlight', 'Show Time', 'Normal'];

    return (
        <div className="fixed inset-0 z-[120] bg-[#0a0f16] flex flex-col text-white animate-fade-in">
            {/* Header */}
            <header className="p-4 md:p-6 border-b border-white/10 bg-[#0a0a0c]/80 backdrop-blur-xl flex flex-col md:flex-row gap-4 items-center justify-between sticky top-0 z-10">
                <div className="flex items-center gap-4 w-full md:w-auto">
                    <button onClick={onBack} className="p-2 hover:bg-white/10 rounded-xl transition-colors">
                        <span className="text-2xl">←</span>
                    </button>
                    <div>
                        <h1 className="text-xl font-black tracking-tighter bg-gradient-to-r from-ef-accent to-ef-blue bg-clip-text text-transparent uppercase">
                            Explorer
                        </h1>
                        <p className="text-[10px] font-bold opacity-40 uppercase tracking-widest">{total} Players</p>
                    </div>
                </div>

                <div className="flex flex-1 max-w-2xl w-full gap-2 items-center h-14">
                    <div className="flex flex-1 h-full bg-white/5 border border-white/10 rounded-2xl overflow-hidden focus-within:border-ef-accent/50 transition-all shadow-inner">
                        <span className="p-4 opacity-30 flex items-center">🔍</span>
                        <input
                            type="text"
                            placeholder="Search name..."
                            className="w-full bg-transparent border-none outline-none py-4 text-sm font-bold placeholder:text-white/20"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <button
                        onClick={handleRefresh}
                        disabled={refreshing || loading}
                        className={`h-full aspect-square bg-white/5 hover:bg-white/10 text-white rounded-2xl transition-all shadow-inner border border-white/10 flex items-center justify-center group shrink-0 ${refreshing ? 'opacity-50' : 'hover:border-ef-accent/40'}`}
                        title="Reload / Refresh Player Database"
                    >
                        <RotateCcw className={`w-4 h-4 text-ef-accent transition-transform duration-500 ${refreshing ? 'animate-spin' : 'group-hover:rotate-180'}`} />
                    </button>
                    <button
                        onClick={() => setShowScrapeModal(true)}
                        className="h-full bg-white/5 hover:bg-white/10 text-white px-4 rounded-2xl transition-all shadow-inner font-bold uppercase tracking-wider text-[10px] whitespace-nowrap border border-white/10 shrink-0 flex items-center gap-2 relative group"
                        title="Scrape Data from PESDB"
                    >
                        <span className="text-sm group-hover:scale-110 transition-transform">🕸️</span>
                        <span className="hidden sm:inline">Scrape Data</span>
                    </button>
                    <a
                        href="https://pesdb.net/efootball/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="h-full aspect-square bg-white/5 hover:bg-white/10 text-white rounded-2xl transition-all shadow-inner border border-white/10 flex items-center justify-center group shrink-0"
                        title="Open PESDB Website"
                    >
                        <span className="text-sm group-hover:scale-110 transition-transform">🌐</span>
                    </a>
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto">
                    <div className="flex-1 text-right">
                        <p className="text-[10px] font-black opacity-40 uppercase tracking-widest leading-none mb-1">{selectedPlayers.size} Selected</p>
                        <div className="flex items-center gap-2">
                            {selectedPlayers.size > 0 && (
                                <button
                                    onClick={handleDeleteSelected}
                                    className="px-4 py-3 rounded-xl font-black text-xs uppercase tracking-widest bg-red-500/10 border border-red-500/20 text-red-500 hover:bg-red-500/20 transition-all flex items-center gap-2"
                                >
                                    <span>🗑️</span>
                                    <span>Delete</span>
                                </button>
                            )}
                            <button
                                onClick={handleAddSelected}
                                disabled={selectedPlayers.size === 0}
                                className={`px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${selectedPlayers.size > 0
                                    ? 'bg-ef-accent text-ef-dark shadow-[0_0_20px_rgba(0,255,136,0.2)] hover:scale-105 active:scale-95'
                                    : 'bg-white/5 text-white/20 cursor-not-allowed'
                                    }`}
                            >
                                Confirm
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Filters Bar */}
            <div className="p-3 border-b border-white/5 bg-black/20 flex gap-4 overflow-x-auto no-scrollbar scroll-smooth">
                <div className="flex items-center gap-2 px-2 border-r border-white/10 pr-4 shrink-0">
                    <span className="text-[10px] font-black opacity-30 uppercase">Filters:</span>
                </div>

                <div className="flex items-center gap-2 min-w-[120px]">
                    <span className="text-[9px] font-black opacity-30 uppercase">Pos</span>
                    <select
                        className="bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-[10px] font-black focus:outline-none focus:border-ef-accent/50 w-full"
                        value={filters.position}
                        onChange={(e) => setFilters(prev => ({ ...prev, position: e.target.value }))}
                    >
                        {positions.map(p => <option key={p} value={p} className="bg-[#1a1a1e]">{p}</option>)}
                    </select>
                </div>

                <div className="flex items-center gap-2 min-w-[120px]">
                    <span className="text-[9px] font-black opacity-30 uppercase">Type</span>
                    <select
                        className="bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-[10px] font-black focus:outline-none focus:border-ef-accent/50 w-full"
                        value={filters.cardType}
                        onChange={(e) => setFilters(prev => ({ ...prev, cardType: e.target.value }))}
                    >
                        {cardTypes.map(t => <option key={t} value={t} className="bg-[#1a1a1e]">{t}</option>)}
                    </select>
                </div>

                <div className="flex items-center gap-2 min-w-[150px]">
                    <span className="text-[9px] font-black opacity-30 uppercase">Club</span>
                    <input
                        type="text"
                        placeholder="Club name..."
                        className="bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-[10px] font-black focus:outline-none focus:border-ef-accent/50 w-full uppercase"
                        value={filters.club}
                        onChange={(e) => setFilters(prev => ({ ...prev, club: e.target.value }))}
                    />
                </div>

                <div className="flex items-center gap-2 min-w-[150px]">
                    <span className="text-[9px] font-black opacity-30 uppercase">Nat</span>
                    <input
                        type="text"
                        placeholder="Country..."
                        className="bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-[10px] font-black focus:outline-none focus:border-ef-accent/50 w-full uppercase"
                        value={filters.nationality}
                        onChange={(e) => setFilters(prev => ({ ...prev, nationality: e.target.value }))}
                    />
                </div>

                <button
                    onClick={() => {
                        setSearch('');
                        setFilters({ position: 'All', cardType: 'All', league: 'All', club: '', nationality: '' });
                        setSelectedPlayers(new Map());
                    }}
                    className="shrink-0 px-4 py-1.5 text-[10px] font-black opacity-40 hover:opacity-100 uppercase tracking-widest"
                >
                    Reset
                </button>
            </div>

            {/* Grid Container */}
            <div
                ref={scrollRef}
                className="flex-1 overflow-y-auto p-4 md:p-6 custom-scrollbar bg-[radial-gradient(circle_at_top,_#1a1f26_0%,_#0a0f16_100%)]"
            >
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 2xl:grid-cols-12 gap-2 md:gap-3">
                    {players.map(player => {
                        const isAlreadyOwned = existingPlayerIds.has(player.id);
                        const isSelected = selectedPlayers.has(player.id);

                        return (
                            <div
                                key={player.id}
                                onClick={() => !isAlreadyOwned && toggleSelect(player)}
                                className={`
                                    relative group transition-all duration-300
                                    ${isAlreadyOwned ? 'opacity-40 grayscale cursor-not-allowed' : isSelected ? 'scale-90 cursor-pointer' : 'active:scale-95 cursor-pointer'}
                                `}
                            >
                                {/* Already Added Label */}
                                {isAlreadyOwned && (
                                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30 pointer-events-none">
                                        <div className="bg-black/80 backdrop-blur-md border border-white/10 px-2 py-1 rounded shadow-xl">
                                            <span className="text-[6px] font-black uppercase text-ef-accent tracking-[0.2em]">OWNED</span>
                                        </div>
                                    </div>
                                )}

                                {/* Selection Checkbox Overlay */}
                                {!isAlreadyOwned && (
                                    <div className={`
                                        absolute top-1 right-1 z-20 w-3.5 h-3.5 border flex items-center justify-center transition-all
                                        ${isSelected
                                            ? 'bg-ef-accent border-ef-accent text-ef-dark scale-110 shadow-lg'
                                            : 'bg-black/60 border-white/20 text-transparent group-hover:border-white/40'
                                        }
                                    `}>
                                        <span className="text-[7px] font-black leading-none">✓</span>
                                    </div>
                                )}

                                {/* Card Visual (Sharp Edges, Clean - No overlays) */}
                                <div className={`
                                    aspect-[2/3] rounded-none overflow-hidden border transition-all shadow-xl relative bg-[#0e131b]
                                    ${isSelected ? 'border-ef-accent ring-2 ring-ef-accent/30' : 'border-white/10 hover:border-white/30'}
                                `}>
                                    {/* EFHub Player Card Image with fallback */}
                                    <img
                                        src={`https://efimg.com/efootballhub22/images/player_cards/${player.id}_l.png`}
                                        alt={player.name}
                                        onError={(e) => {
                                            if (e.target.dataset.triedOriginal !== 'true') {
                                                e.target.dataset.triedOriginal = 'true';
                                                e.target.src = player.image || `https://pesdb.net/efootball/images/players/2026/${player.id}.png`;
                                            }
                                        }}
                                        className={`w-full h-full object-cover object-top transition-all duration-500 ${isSelected || isAlreadyOwned ? 'brightness-50 grayscale-[0.5]' : ''}`}
                                        loading="lazy"
                                    />
                                </div>

                                {/* Only Player Name Below Card */}
                                <div className="mt-1 px-0.5 text-center">
                                    <h3 className={`text-[10px] font-bold uppercase tracking-tight truncate ${isAlreadyOwned ? 'text-white/40' : 'text-white/90'}`}>
                                        {player.name}
                                    </h3>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {loading && (
                    <div className="flex flex-col items-center justify-center py-10 gap-2">
                        <div className="w-8 h-8 border-2 border-ef-accent border-t-transparent rounded-full animate-spin"></div>
                    </div>
                )}

                {!loading && players.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-40 opacity-20 text-center">
                        <span className="text-4xl mb-2">📭</span>
                        <p className="text-[10px] font-black uppercase tracking-[0.2em]">No results</p>
                    </div>
                )}
            </div>

            {/* Pagination Controls (50 Cards Per Page) */}
            {totalPages > 1 && (
                <footer className="px-4 py-3 border-t border-white/10 bg-[#0a0a0c]/95 backdrop-blur-xl flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0 z-20">
                    <div className="text-xs font-bold text-white/50 flex items-center gap-1.5">
                        <span>Showing</span>
                        <span className="text-white font-black">{Math.min((page - 1) * 50 + 1, total)}</span>
                        <span>–</span>
                        <span className="text-white font-black">{Math.min(page * 50, total)}</span>
                        <span>of</span>
                        <span className="text-ef-accent font-black">{total.toLocaleString()}</span>
                        <span>players</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                        {/* First Page */}
                        <button
                            onClick={() => handlePageChange(1)}
                            disabled={page === 1 || loading}
                            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 disabled:opacity-20 disabled:hover:bg-white/5 text-white transition-all border border-white/10 shrink-0"
                            title="First Page"
                        >
                            <ChevronsLeft className="w-4 h-4" />
                        </button>

                        {/* Previous Page */}
                        <button
                            onClick={() => handlePageChange(page - 1)}
                            disabled={page === 1 || loading}
                            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 disabled:opacity-20 disabled:hover:bg-white/5 text-white transition-all border border-white/10 shrink-0"
                            title="Previous Page"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </button>

                        {/* Page Numbers */}
                        <div className="flex items-center gap-1 mx-1 overflow-x-auto max-w-[280px] sm:max-w-none no-scrollbar">
                            {getPageNumbers().map((pNum, idx) => {
                                if (pNum === '...') {
                                    return <span key={`dots-${idx}`} className="px-1 text-xs text-white/30 font-black">…</span>;
                                }
                                const isCurrent = pNum === page;
                                return (
                                    <button
                                        key={`page-${pNum}`}
                                        onClick={() => handlePageChange(pNum)}
                                        disabled={loading}
                                        className={`min-w-[32px] h-8 px-2 rounded-xl text-xs font-black transition-all border ${
                                            isCurrent
                                                ? 'bg-ef-accent text-ef-dark border-ef-accent shadow-[0_0_12px_rgba(0,255,136,0.3)]'
                                                : 'bg-white/5 hover:bg-white/10 text-white/70 hover:text-white border-white/10'
                                        }`}
                                    >
                                        {pNum}
                                    </button>
                                );
                            })}
                        </div>

                        {/* Next Page */}
                        <button
                            onClick={() => handlePageChange(page + 1)}
                            disabled={page === totalPages || loading}
                            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 disabled:opacity-20 disabled:hover:bg-white/5 text-white transition-all border border-white/10 shrink-0"
                            title="Next Page"
                        >
                            <ChevronRight className="w-4 h-4" />
                        </button>

                        {/* Last Page */}
                        <button
                            onClick={() => handlePageChange(totalPages)}
                            disabled={page === totalPages || loading}
                            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 disabled:opacity-20 disabled:hover:bg-white/5 text-white transition-all border border-white/10 shrink-0"
                            title="Last Page"
                        >
                            <ChevronsRight className="w-4 h-4" />
                        </button>
                    </div>
                </footer>
            )}

            <ScrapeDataModal
                isOpen={showScrapeModal}
                onClose={() => setShowScrapeModal(false)}
                onScrapeSuccess={(data) => {
                    // Invalidate the cache right now so next render gets fresh players
                    invalidatePlayerCache();
                    // Refetch players using the current search term to update the database view immediately
                    setPage(1); // Reset to the first page
                    fetchPlayers(1, search, filters); // Trigger a re-fetch
                }}
            />
        </div>
    );
};

export default DatabasePlayerList;
