import React from 'react';
import { 
    Zap, 
    Bell, 
    SlidersHorizontal, 
    Search, 
    CheckSquare, 
    X, 
    Edit3,
    ArrowLeft
} from 'lucide-react';

const TopNav = ({ 
    searchQuery, 
    setSearchQuery, 
    setIsOpen, 
    isOpen, 
    isSubView, 
    setView, 
    view, 
    settings, 
    totalPlayers,
    user,
    setShowRemainder,
    setShowFilters,
    showFilters,
    isSelectionMode,
    setIsSelectionMode,
    selectedIds,
    setSelectedIds,
    setShowBulkEdit,
    handleBulkDelete
}) => {
    return (
        <nav className="fixed top-0 left-0 right-0 z-[100] bg-[#0a0a0c]/80 backdrop-blur-2xl border-b border-white/5 shadow-2xl">
            <div className="max-w-[1920px] mx-auto px-4 h-16 flex items-center justify-between gap-4">
                {/* Left Section: Menu Toggle & Logo */}
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => {
                            if (isOpen) {
                                setIsOpen(false);
                            } else if (isSubView && !['leaderboard', 'squad-builder', 'quick-stats', 'squad-db', 'badges', 'activity-log', 'settings'].includes(view)) {
                                setView('list');
                            } else {
                                setIsOpen(true);
                            }
                        }}
                        className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/5 border border-white/10 hover:border-ef-accent/50 transition-all active:scale-95 group"
                    >
                        {isOpen ? (
                            <X className="w-5 h-5 text-white" />
                        ) : (isSubView && !['leaderboard', 'squad-builder', 'quick-stats', 'squad-db', 'badges', 'activity-log', 'settings'].includes(view)) ? (
                            <ArrowLeft className="w-5 h-5 text-white" />
                        ) : (
                            <div className="flex flex-col gap-1.5 w-5">
                                <div className="h-0.5 bg-white rounded-full transition-all" />
                                <div className="h-0.5 bg-white rounded-full transition-all" />
                                <div className="h-0.5 bg-white rounded-full transition-all" />
                            </div>
                        )}
                    </button>

                    <div className="flex items-center gap-2.5">
                        <img 
                            src={settings?.appLogo || "/favicon.jpg"} 
                            alt="Logo" 
                            className="w-7 h-7 object-contain rounded-lg"
                        />
                        <h1 className="text-lg font-black text-white tracking-tighter uppercase italic hidden sm:block">
                            eFootball <span className="text-ef-accent">Stats</span>
                        </h1>
                    </div>
                </div>

                {/* Center Section: Search Bar (Desktop) */}
                <div className="flex-1 max-w-xl flex items-center gap-4 hidden md:flex">
                    <div className="flex-1 relative group">
                        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none opacity-20 group-focus-within:opacity-100 group-focus-within:text-ef-accent transition-all">
                            <Search className="w-5 h-5" />
                        </div>
                        <input
                            type="text"
                            placeholder="Search players, clubs, skills..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-12 py-2 text-sm font-bold text-white placeholder:text-white/20 focus:outline-none focus:border-ef-accent/40 focus:bg-white/10 transition-all"
                        />
                    </div>
                </div>

                {/* Right Section: Action Buttons */}
                <div className="flex items-center gap-2">
                    {/* Stats Button */}
                    {user && view === 'list' && (
                        <button
                            onClick={() => setView('quick-stats')}
                            className="w-10 h-10 flex items-center justify-center rounded-xl bg-ef-accent/10 border border-ef-accent/20 text-ef-accent hover:bg-ef-accent hover:text-black transition-all active:scale-95"
                            title="Quick Stats Update"
                        >
                            <Zap className="w-4 h-4 fill-current" />
                        </button>
                    )}

                    {/* Remainder Button */}
                    {user && view === 'list' && (
                        <button
                            onClick={() => setShowRemainder(true)}
                            className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/5 border border-white/10 text-white/40 hover:text-white hover:bg-white/10 transition-all active:scale-95"
                            title="Reminders"
                        >
                            <Bell className="w-4 h-4" />
                        </button>
                    )}

                    {/* Filter Button */}
                    {view === 'list' && (
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all active:scale-95 border ${showFilters ? 'bg-ef-accent text-black border-ef-accent' : 'bg-white/5 text-white/40 border-white/10 hover:text-white'}`}
                            title="Filter & Sort"
                        >
                            <SlidersHorizontal className="w-4 h-4" />
                        </button>
                    )}

                    {/* Selection/Bulk Actions */}
                    {user && view === 'list' && (
                        <div className="flex items-center gap-2">
                            {isSelectionMode ? (
                                <>
                                    {selectedIds.size > 0 && (
                                        <button
                                            onClick={() => setShowBulkEdit(true)}
                                            className="h-10 px-4 rounded-xl bg-ef-blue text-white text-[10px] font-black uppercase tracking-widest border border-ef-blue/50 hover:bg-ef-blue/80 transition-all flex items-center gap-2"
                                        >
                                            <Edit3 className="w-3.5 h-3.5" />
                                            <span>Edit ({selectedIds.size})</span>
                                        </button>
                                    )}
                                    <button
                                        onClick={() => { setIsSelectionMode(false); setSelectedIds(new Set()); }}
                                        className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/10 border border-white/20 text-white hover:bg-white/20 transition-all"
                                        title="Cancel Selection"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </>
                            ) : (
                                <button
                                    onClick={() => setIsSelectionMode(true)}
                                    className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/5 border border-white/10 text-white/40 hover:text-white hover:bg-white/10 transition-all"
                                    title="Select Mode"
                                >
                                    <CheckSquare className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                    )}

                    <div className="h-8 w-[1px] bg-white/5 mx-2 hidden sm:block"></div>

                    <div className="flex flex-col items-end px-3 py-1 bg-white/5 border border-white/10 rounded-xl min-w-[80px] hidden sm:flex">
                        <span className="text-[8px] font-black text-ef-accent uppercase tracking-widest leading-none mb-0.5">Size</span>
                        <span className="text-sm font-black text-white italic leading-none">{totalPlayers}</span>
                    </div>
                </div>
            </div>

            {/* Mobile Search Bar & Actions */}
            <div className="md:hidden border-t border-white/5 px-4 py-2 bg-black/20">
                <div className="flex items-center gap-2 mb-2">
                    <div className="flex-1 relative">
                        <input
                            type="text"
                            placeholder="Search..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-10 py-2 text-xs font-bold text-white placeholder:text-white/20 focus:outline-none"
                        />
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                    </div>
                    <div className="flex flex-col items-center justify-center px-3 py-1 bg-white/5 border border-white/10 rounded-xl min-w-[60px]">
                        <span className="text-[7px] font-black text-ef-accent uppercase tracking-tighter leading-none mb-0.5">Size</span>
                        <span className="text-xs font-black text-white italic leading-none">{totalPlayers}</span>
                    </div>
                </div>

                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
                    {user && view === 'list' && (
                        <button
                            onClick={() => setView('quick-stats')}
                            className="flex-1 py-2 rounded-lg bg-ef-accent/10 border border-ef-accent/20 text-ef-accent text-[10px] font-black uppercase flex items-center justify-center gap-2"
                        >
                            <Zap className="w-3 h-3 fill-current" /> Stats
                        </button>
                    )}
                    {user && view === 'list' && (
                        <button
                            onClick={() => setShowRemainder(true)}
                            className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white/40 text-[10px] font-black uppercase flex items-center justify-center"
                        >
                            <Bell className="w-3.5 h-3.5" />
                        </button>
                    )}
                    {view === 'list' && (
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className={`px-3 py-2 rounded-lg border text-[10px] font-black uppercase flex items-center justify-center transition-all ${showFilters ? 'bg-ef-accent text-black border-ef-accent' : 'bg-white/5 text-white/40 border-white/10'}`}
                        >
                            <SlidersHorizontal className="w-3.5 h-3.5" />
                        </button>
                    )}
                    {user && view === 'list' && (
                        <button
                            onClick={() => setIsSelectionMode(!isSelectionMode)}
                            className={`flex-1 py-2 rounded-lg border text-[10px] font-black uppercase flex items-center justify-center gap-2 transition-all ${isSelectionMode ? 'bg-white/20 text-white border-white/40' : 'bg-white/5 text-white/40 border-white/10'}`}
                        >
                            <CheckSquare className="w-3 h-3" /> {isSelectionMode ? 'Mode ON' : 'Select'}
                        </button>
                    )}
                </div>
            </div>
        </nav>
    );
};

export default TopNav;
