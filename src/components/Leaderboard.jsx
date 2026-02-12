import { useState } from 'react';

const LeaderboardCard = ({ title, players, valueKey, colorClass, suffix = '', isRatio = false, onExpand, onPlayerClick }) => (
    <div className="bg-ef-card p-6 rounded-2xl border border-white/10 shadow-xl flex flex-col h-full animate-slide-up relative overflow-hidden group">
        <div className="flex justify-between items-start mb-6">
            <h3 className={`text-lg font-black uppercase tracking-widest ${colorClass}`}>{title}</h3>
            <button
                onClick={onExpand}
                className="text-[10px] font-black uppercase tracking-widest opacity-20 hover:opacity-100 hover:text-ef-accent transition-all flex items-center gap-1.5 bg-white/5 px-3 py-1.5 rounded-lg border border-white/5 hover:border-ef-accent/30"
            >
                Expand <span>↗</span>
            </button>
        </div>

        <ul className="space-y-4 flex-1">
            {players.slice(0, 5).map((player, idx) => {
                let rawValue = valueKey === 'totalGA'
                    ? (player.goals || 0) + (player.assists || 0)
                    : (player[valueKey] || 0);

                const displayValue = isRatio
                    ? (rawValue / (player.matches || 1)).toFixed(2)
                    : rawValue;

                return (
                    <li key={player._id} className="flex items-center gap-4 group/item cursor-pointer" onClick={() => onPlayerClick(player)}>
                        <span className="font-mono text-sm opacity-20 group-hover/item:opacity-100 transition-opacity w-6 shrink-0">
                            {idx + 1 < 10 ? `0${idx + 1}` : idx + 1}
                        </span>
                        <div className="flex flex-col flex-1 min-w-0">
                            <span className="font-bold text-white truncate text-[10px] sm:text-sm leading-tight group-hover/item:text-ef-accent transition-colors">{player.name}</span>
                            <span className="text-[9px] opacity-40 uppercase font-black tracking-wider">{player.position}</span>
                        </div>
                        <div className="flex items-baseline gap-1 shrink-0 text-right">
                            <span className={`font-black text-xl leading-none ${colorClass}`}>{displayValue}</span>
                            {suffix && <span className="text-[9px] opacity-20 font-black uppercase tracking-tighter">{suffix}</span>}
                        </div>
                    </li>
                );
            })}
            {players.length === 0 && <li className="text-white/20 italic text-sm py-4 text-center">No data available</li>}
        </ul>

        {players.length > 5 && (
            <div className="mt-4 pt-4 border-t border-white/5">
                <p className="text-[8px] font-black uppercase tracking-widest opacity-20 text-center">
                    + {players.length - 5} more players
                </p>
            </div>
        )}
    </div>
);

const getCardStyles = (type) => {
    switch (type?.toLowerCase()) {
        case 'legendary': return {
            bg: 'bg-gradient-to-b from-[#1a1608] to-[#0a0a0c] border-yellow-500/20',
            glow: 'shadow-[0_0_20px_rgba(234,179,8,0.15)]',
            accent: 'text-yellow-500',
            leak: 'from-yellow-500/10 via-transparent to-transparent'
        };
        case 'epic': return {
            bg: 'bg-gradient-to-b from-[#081a12] to-[#0a0a0c] border-green-500/20',
            glow: 'shadow-[0_0_20px_rgba(34,197,94,0.15)]',
            accent: 'text-green-500',
            leak: 'from-green-500/10 via-transparent to-transparent'
        };
        case 'featured': return {
            bg: 'bg-gradient-to-b from-[#14081a] to-[#0a0a0c] border-purple-500/20',
            glow: 'shadow-[0_0_20px_rgba(168,85,247,0.15)]',
            accent: 'text-purple-500',
            leak: 'from-purple-500/10 via-transparent to-transparent'
        };
        default: return {
            bg: 'bg-gradient-to-b from-[#0a121a] to-[#0a0a0c] border-blue-500/20',
            glow: 'shadow-[0_0_20px_rgba(59,130,246,0.15)]',
            accent: 'text-blue-500',
            leak: 'from-blue-500/10 via-transparent to-transparent'
        };
    }
};

const MiniPlayerCard = ({ player }) => {
    const styles = getCardStyles(player.cardType);
    return (
        <div className={`relative w-12 h-16 rounded-lg overflow-hidden border-2 border-white/10 ${styles.bg} ${styles.glow} shrink-0`}>
            {player.image ? (
                <img src={player.image} alt="" className="w-full h-full object-cover relative z-0" />
            ) : (
                <div className="w-full h-full flex items-center justify-center bg-white/5 opacity-20">
                    <span className="text-[10px]">👤</span>
                </div>
            )}
            {/* Smooth Fading Blur & Info */}
            <div className="absolute inset-x-0 bottom-0 py-1 px-1 bg-gradient-to-t from-black/90 to-transparent pt-4 flex flex-col items-center">
                <span className="text-[8px] font-black text-ef-accent leading-none">{player.rating}</span>
                <span className="text-[5px] font-bold text-white/70 uppercase leading-none">{player.position}</span>
            </div>
        </div>
    );
};

const FullListModal = ({ title, players, valueKey, colorClass, suffix, isRatio, onClose, onPlayerClick }) => {
    const [search, setSearch] = useState('');

    const filteredPlayers = players.filter(p =>
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.position.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-xl z-[100] flex items-center justify-center p-4 md:p-8 animate-fade-in">
            <div className="bg-[#0b0b0d] border border-white/10 rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-[0_0_100px_rgba(0,0,0,0.8)] overflow-hidden">
                {/* Modal Header */}
                <div className="p-8 border-b border-white/5 flex justify-between items-center bg-gradient-to-br from-white/[0.02] to-transparent">
                    <div>
                        <h2 className={`text-2xl font-black uppercase tracking-tighter ${colorClass}`}>{title}</h2>
                        <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-30 mt-1">Full Ranking Data</p>
                    </div>
                    <button onClick={onClose} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors border border-white/10 text-xl">✕</button>
                </div>

                {/* Search Bar */}
                <div className="p-6">
                    <div className="relative group">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 opacity-20 group-focus-within:opacity-100 transition-opacity">🔍</span>
                        <input
                            type="text"
                            placeholder="Search players by name or position..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-sm font-bold text-white outline-none focus:border-ef-accent/50 focus:bg-white/[0.07] transition-all"
                        />
                    </div>
                </div>

                {/* List Body */}
                <div className="flex-1 overflow-y-auto custom-scrollbar px-6 pb-8">
                    <ul className="space-y-3">
                        {filteredPlayers.map((player, idx) => {
                            let rawValue = valueKey === 'totalGA'
                                ? (player.goals || 0) + (player.assists || 0)
                                : (player[valueKey] || 0);

                            const displayValue = isRatio
                                ? (rawValue / (player.matches || 1)).toFixed(2)
                                : rawValue;

                            return (
                                <li key={player._id} className="flex items-center gap-4 p-3 rounded-2xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.05] hover:border-white/10 transition-all group/item cursor-pointer" onClick={() => { onPlayerClick(player); onClose(); }}>
                                    <span className="font-mono text-base opacity-20 w-8 shrink-0">{idx + 1}</span>

                                    {/* Mini Card Visual */}
                                    <MiniPlayerCard player={player} />

                                    <div className="flex flex-col flex-1 min-w-0 ml-1">
                                        <span className="font-black text-white truncate text-sm sm:text-base leading-tight group-hover/item:text-ef-accent transition-colors">{player.name}</span>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            <span className="text-[8px] px-1.5 py-0.5 rounded bg-white/5 text-white/40 font-black uppercase tracking-widest">{player.position}</span>
                                            <span className="text-[9px] text-white/20 font-bold uppercase truncate">{player.club}</span>
                                        </div>
                                    </div>

                                    <div className="flex items-baseline gap-1.5 shrink-0 pr-2">
                                        <span className={`font-black text-2xl ${colorClass}`}>{displayValue}</span>
                                        {suffix && <span className="text-[10px] opacity-30 font-black uppercase tracking-widest">{suffix}</span>}
                                    </div>
                                </li>
                            );
                        })}
                        {filteredPlayers.length === 0 && (
                            <div className="text-center py-20 opacity-20">
                                <span className="text-4xl block mb-4">👻</span>
                                <p className="font-black uppercase tracking-widest text-sm">No players match your search</p>
                            </div>
                        )}
                    </ul>
                </div>
            </div>
        </div>
    );
};

const Leaderboard = ({ players, onPlayerClick }) => {
    const [expandedCategory, setExpandedCategory] = useState(null);

    // Sorting Utilities
    const getSorted = (calcFn) => [...players].sort((a, b) => calcFn(b) - calcFn(a));
    const activePlayers = players.filter(p => (p.matches || 0) > 0);
    const getSortedRatio = (calcFn) => [...activePlayers].sort((a, b) => calcFn(b) - calcFn(a));

    const categories = [
        { id: 'goals', title: 'Top Scorers', players: getSorted(p => p.goals || 0), valueKey: 'goals', colorClass: 'text-ef-accent' },
        { id: 'assists', title: 'Top Assists', players: getSorted(p => p.assists || 0), valueKey: 'assists', colorClass: 'text-ef-blue' },
        { id: 'matches', title: 'Most Games', players: getSorted(p => p.matches || 0), valueKey: 'matches', colorClass: 'text-white', suffix: 'MTCH' },
        { id: 'ga', title: 'Most G+A', players: getSorted(p => (p.goals || 0) + (p.assists || 0)), valueKey: 'totalGA', colorClass: 'text-pink-500' },
        { id: 'gpg', title: 'Goals / GM', players: getSortedRatio(p => (p.goals || 0) / p.matches), valueKey: 'goals', colorClass: 'text-ef-accent', isRatio: true, suffix: 'AVG', isPerformance: true },
        { id: 'apg', title: 'Assists / GM', players: getSortedRatio(p => (p.assists || 0) / p.matches), valueKey: 'assists', colorClass: 'text-ef-blue', isRatio: true, suffix: 'AVG', isPerformance: true },
        { id: 'gapg', title: 'G+A / GM', players: getSortedRatio(p => ((p.goals || 0) + (p.assists || 0)) / p.matches), valueKey: 'totalGA', colorClass: 'text-pink-500', isRatio: true, suffix: 'AVG', isPerformance: true }
    ];

    return (
        <div className="max-w-6xl mx-auto pb-12 px-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
                {categories.filter(c => !c.isPerformance).map(cat => (
                    <LeaderboardCard
                        key={cat.id}
                        {...cat}
                        onExpand={() => setExpandedCategory(cat)}
                        onPlayerClick={onPlayerClick}
                    />
                ))}
            </div>

            <div className="border-t border-white/5 my-12 pt-12">
                <h2 className="text-sm font-black uppercase tracking-[0.4em] opacity-20 text-center mb-10">Performance Ratios (Per Game)</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {categories.filter(c => c.isPerformance).map(cat => (
                        <LeaderboardCard
                            key={cat.id}
                            {...cat}
                            onExpand={() => setExpandedCategory(cat)}
                            onPlayerClick={onPlayerClick}
                        />
                    ))}
                </div>
            </div>

            {expandedCategory && (
                <FullListModal
                    {...expandedCategory}
                    onClose={() => setExpandedCategory(null)}
                    onPlayerClick={onPlayerClick}
                />
            )}
        </div>
    );
};

export default Leaderboard;

