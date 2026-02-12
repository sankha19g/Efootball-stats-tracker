import { memo } from 'react';

const PlayerCard = memo(({ player, isSelectionMode, isSelected, onToggleSelect, settings }) => {
    const getCardColor = (type) => {
        switch (type?.toLowerCase()) {
            case 'legendary': return 'bg-gradient-to-br from-yellow-500 to-yellow-700 border-yellow-400';
            case 'featured': return 'bg-gradient-to-br from-purple-500 to-indigo-700 border-purple-400';
            case 'standard': return 'bg-gradient-to-br from-gray-500 to-slate-700 border-gray-400';
            default: return 'bg-gradient-to-br from-blue-500 to-blue-700 border-blue-400';
        }
    };

    const isEco = settings?.highPerf;

    return (
        <div
            onClick={() => isSelectionMode && onToggleSelect(player._id)}
            className={`group relative aspect-[7/10] rounded-2xl overflow-hidden transition-all duration-500 cursor-pointer border-t border-l border-white/20
            ${getCardColor(player.cardType)} 
            ${isEco ? 'shadow-lg' : 'shadow-2xl'}
            ${isSelected ? 'ring-4 ring-ef-accent scale-95 shadow-[0_0_30px_rgba(100,255,100,0.4)]' : 'hover:scale-[1.02] hover:-translate-y-1'}
            ${!isEco && !isSelected ? 'hover:shadow-[0_20px_40px_rgba(0,0,0,0.6)]' : ''}`}
        >
            {/* Card Background Patterns */}
            <div className="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(circle_at_center,_var(--tw-gradient-from)_0%,_transparent_70%)]"></div>
            <div className="absolute inset-0 opacity-5 pointer-events-none mix-blend-overlay" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '12px 12px' }}></div>

            {isSelectionMode && (
                <div className={`absolute top-3 right-3 w-6 h-6 rounded-full border-2 flex items-center justify-center z-50 transition-all ${isSelected ? 'bg-ef-accent border-ef-accent scale-110' : 'bg-black/40 border-white/30 truncate'}`}>
                    {isSelected && <span className="text-ef-dark font-black text-xs">✓</span>}
                </div>
            )}

            {/* Main Image Container */}
            <div className={`absolute inset-x-0 top-0 overflow-hidden ${settings.cardSize === 'xs' ? 'bottom-0 sm:bottom-12' : 'bottom-12'} transition-all duration-300`}>
                {player.image ? (
                    <img
                        src={player.image}
                        alt={player.name}
                        loading="lazy"
                        className={`w-full h-full ${settings.cardSize === 'xs' ? 'object-top sm:object-cover' : 'object-cover'} transition-transform duration-700 group-hover:scale-110`}
                    />
                ) : (
                    <div className="w-full h-full bg-black/40 flex flex-col items-center justify-center">
                        <span className="text-4xl opacity-20 filter grayscale">👤</span>
                        <span className="text-[8px] font-black uppercase tracking-[0.3em] opacity-30 mt-2">No Visual</span>
                    </div>
                )}

                {/* Dynamic Shine Effect */}
                <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/5 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 translate-x-[-100%] group-hover:translate-x-[100%]"></div>
            </div>

            {/* Top Info Overlay (Rating & Position) */}
            <div className="absolute top-2 left-2 sm:top-3 sm:left-3 flex flex-col items-start z-10 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                {settings?.showRatings && (
                    <span className={`text-lg sm:text-2xl font-black text-white leading-none tracking-tighter drop-shadow-lg ${settings.cardSize === 'xs' ? 'hidden sm:block' : settings.cardSize === 'sm' ? 'hidden sm:block' : 'block'}`}>
                        {player.rating || 0}
                    </span>
                )}
                <span className="text-[7px] sm:text-[10px] font-black text-white/80 uppercase tracking-widest leading-none mt-0.5">{player.position}</span>
            </div>

            {/* Bottom Content Area */}
            <div className={`absolute inset-x-0 bottom-0 p-3 sm:p-3 ${settings.cardSize === 'xs' ? 'pt-1' : 'pt-6 sm:pt-8'}`}>
                {/* Mobile: Pure Black Fade | PC: Original Blue-tinted Fade */}
                <div className={`absolute inset-0 bg-gradient-to-t from-black via-black/90 to-transparent sm:from-black/98 sm:via-black/80 pointer-events-none`}></div>

                {/* Blur Effect Behind Name/Stats - Mobile Only */}
                {!isEco && (
                    <div className="absolute inset-x-0 bottom-0 h-full backdrop-blur-[8px] bg-black/10 pointer-events-none [mask-image:linear-gradient(to_top,black,transparent)] block sm:hidden"></div>
                )}
                <div className="relative z-10">
                    {settings?.showLabels && (
                        <>
                            <h3 className={`text-[6px] sm:text-sm font-black text-white uppercase tracking-tight sm:truncate whitespace-normal line-clamp-2 sm:line-clamp-none mb-1 drop-shadow-sm leading-[1.1] sm:leading-none block`}>
                                {player.name}
                            </h3>
                            {/* Club is hidden for Tiny (xs) and Small (sm) on mobile */}
                            <div className={`flex items-center gap-1.5 opacity-50 mb-3 ${settings.cardSize === 'xs' ? 'hidden sm:flex' : settings.cardSize === 'sm' ? 'hidden sm:flex' : 'flex'}`}>
                                <span className="text-[8px] font-black uppercase tracking-widest truncate max-w-full">{player.club}</span>
                            </div>
                        </>
                    )}

                    {/* Micro Stats Grid */}
                    {settings?.showStats && (
                        <div className="grid grid-cols-3 gap-1">
                            <div className={`flex flex-col items-center py-1 rounded-lg border bg-black/40 backdrop-blur-md border-white/5 sm:backdrop-blur-none sm:bg-white/5`}>
                                <span className="text-[7px] font-black uppercase tracking-[0.2em] opacity-40 leading-none mb-1">M</span>
                                <span className="text-[10px] font-black text-white leading-none">{player.matches || 0}</span>
                            </div>
                            <div className={`flex flex-col items-center py-1 rounded-lg border bg-black/40 backdrop-blur-md border-white/5 sm:backdrop-blur-none sm:bg-white/5`}>
                                <span className="text-[7px] font-black uppercase tracking-[0.2em] opacity-40 leading-none mb-1 text-ef-accent">G</span>
                                <span className="text-[10px] font-black text-ef-accent leading-none">{player.goals || 0}</span>
                            </div>
                            <div className={`flex flex-col items-center py-1 rounded-lg border bg-black/40 backdrop-blur-md border-white/5 sm:backdrop-blur-none sm:bg-white/5`}>
                                <span className="text-[7px] font-black uppercase tracking-[0.2em] opacity-40 leading-none mb-1 text-ef-blue">A</span>
                                <span className="text-[10px] font-black text-ef-blue leading-none">{player.assists || 0}</span>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
});

export default PlayerCard;
