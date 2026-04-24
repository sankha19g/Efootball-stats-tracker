import React from 'react';

const TopNav = ({ searchQuery, setSearchQuery, setIsOpen, isSubView, setView, view, settings, totalPlayers }) => {
    return (
        <nav className="fixed top-0 left-0 right-0 z-[100] bg-[#0a0a0c]/80 backdrop-blur-2xl border-b border-white/5 shadow-2xl">
            <div className="max-w-[1920px] mx-auto px-4 h-16 flex items-center justify-between gap-4">
                {/* Left Section: Menu Toggle & Logo */}
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => isSubView ? setView('list') : setIsOpen(true)}
                        className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/5 border border-white/10 hover:border-ef-accent/50 transition-all active:scale-95 group"
                    >
                        {isSubView ? (
                            <span className="text-xl text-white group-hover:text-ef-accent transition-all duration-300 group-hover:-translate-x-0.5">←</span>
                        ) : (
                            <div className="flex flex-col gap-1 w-5">
                                <div className="h-[2px] w-full bg-white group-hover:bg-ef-accent rounded-full transition-all"></div>
                                <div className="h-[2px] w-3/4 bg-white group-hover:bg-ef-accent rounded-full transition-all"></div>
                                <div className="h-[2px] w-full bg-white group-hover:bg-ef-accent rounded-full transition-all"></div>
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
                <div className="flex-1 max-w-2xl flex items-center gap-4 hidden md:flex">
                    <div className="flex-1 relative group">
                        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none opacity-20 group-focus-within:opacity-100 group-focus-within:text-ef-accent transition-all">
                            <span className="text-lg">🔍</span>
                        </div>
                        <input
                            type="text"
                            placeholder="Search players, clubs, skills..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-12 py-2.5 text-sm font-bold text-white placeholder:text-white/20 focus:outline-none focus:border-ef-accent/40 focus:bg-white/10 transition-all"
                        />
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery('')}
                                className="absolute inset-y-0 right-4 flex items-center text-white/20 hover:text-white transition-colors"
                            >
                                ✕
                            </button>
                        )}
                    </div>

                    <div className="flex flex-col items-end px-4 py-1.5 bg-white/5 border border-white/10 rounded-xl min-w-[100px]">
                        <span className="text-[10px] font-black text-ef-accent uppercase tracking-widest leading-none mb-1">Squad Size</span>
                        <span className="text-lg font-black text-white italic leading-none">{totalPlayers}</span>
                    </div>
                </div>

                {/* Right Section: View Switcher (Desktop) */}
                <div className="hidden lg:flex items-center gap-1 bg-white/5 rounded-xl p-1 border border-white/10">
                    <button
                        onClick={() => setView('list')}
                        className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${view === 'list' ? 'bg-ef-accent text-black shadow-lg shadow-ef-accent/20' : 'text-white/40 hover:text-white hover:bg-white/5'}`}
                    >
                        Squad
                    </button>
                    <button
                        onClick={() => setView('leaderboard')}
                        className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${view === 'leaderboard' ? 'bg-ef-accent text-black shadow-lg shadow-ef-accent/20' : 'text-white/40 hover:text-white hover:bg-white/5'}`}
                    >
                        Ranks
                    </button>
                    <button
                        onClick={() => setView('squad-builder')}
                        className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${view === 'squad-builder' ? 'bg-ef-accent text-black shadow-lg shadow-ef-accent/20' : 'text-white/40 hover:text-white hover:bg-white/5'}`}
                    >
                        Tactics
                    </button>
                </div>

                {/* Mobile Search Toggle (Optional icon if we want a cleaner mobile top bar, but I'll stick to a compact layout below) */}
            </div>

            {/* Mobile Search & Tabs (Expanded) */}
            <div className="md:hidden border-t border-white/5 px-4 py-3 bg-black/20">
                <div className="flex items-center gap-3 mb-3">
                    <div className="flex-1 relative">
                        <input
                            type="text"
                            placeholder="Search..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-10 py-2.5 text-xs font-bold text-white placeholder:text-white/20 focus:outline-none"
                        />
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20 text-sm">🔍</span>
                    </div>
                    <div className="flex flex-col items-center justify-center px-3 py-1 bg-white/5 border border-white/10 rounded-xl min-w-[60px]">
                        <span className="text-[7px] font-black text-ef-accent uppercase tracking-tighter leading-none mb-0.5">Size</span>
                        <span className="text-xs font-black text-white italic leading-none">{totalPlayers}</span>
                    </div>
                </div>
                <div className="grid grid-cols-3 gap-1.5">
                    <button
                        onClick={() => setView('list')}
                        className={`py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all text-center ${view === 'list' ? 'bg-ef-accent text-black shadow-lg shadow-ef-accent/20' : 'text-white/40 bg-white/5'}`}
                    >
                        Squad
                    </button>
                    <button
                        onClick={() => setView('leaderboard')}
                        className={`py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all text-center ${view === 'leaderboard' ? 'bg-ef-accent text-black shadow-lg shadow-ef-accent/20' : 'text-white/40 bg-white/5'}`}
                    >
                        Ranks
                    </button>
                    <button
                        onClick={() => setView('squad-builder')}
                        className={`py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all text-center ${view === 'squad-builder' ? 'bg-ef-accent text-black shadow-lg shadow-ef-accent/20' : 'text-white/40 bg-white/5'}`}
                    >
                        Tactics
                    </button>
                </div>
            </div>
        </nav>
    );
};

export default TopNav;
