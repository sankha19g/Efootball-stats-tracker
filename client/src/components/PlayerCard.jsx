import { memo } from 'react';
import { STAT_OPTIONS } from '../constants';

const PlayerCard = memo(({ player, players = [], isSelectionMode, isSelected, onToggleSelect, settings, role, secondaryMatch }) => {
    const getCardColor = (type) => {
        switch (type?.toLowerCase()) {
            case 'legendary': return 'bg-gradient-to-br from-yellow-500 to-yellow-700 border-yellow-400';
            case 'potw': return 'bg-gradient-to-br from-cyan-500 to-blue-700 border-cyan-400';
            case 'featured': return 'bg-gradient-to-br from-purple-500 to-indigo-700 border-purple-400';
            case 'standard': return 'bg-gradient-to-br from-gray-500 to-slate-700 border-gray-400';
            default: return 'bg-gradient-to-br from-blue-500 to-blue-700 border-blue-400';
        }
    };

    const isEco = settings?.highPerf;

    return (
        <div
            onClick={() => isSelectionMode && onToggleSelect(player._id)}
            className={`group relative aspect-[7/10] rounded-2xl overflow-hidden transition-all duration-500 cursor-pointer border-t border-l border-white/20 outline outline-1 outline-ef-accent/10 -outline-offset-1
            ${getCardColor(player.cardType)} 
            ${isEco ? 'shadow-lg' : 'shadow-2xl'}
            ${isSelected ? 'outline-4 outline-ef-accent outline-offset-[-4px] scale-95 shadow-[0_0_30px_rgba(100,255,100,0.4)]' : 'hover:scale-[1.02] hover:-translate-y-1'}
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

            {/* Top Right: Secondary Position Match Indicator */}
            {secondaryMatch && !isSelectionMode && (
                <div className="absolute top-0 right-0 z-20 bg-black/80 backdrop-blur-md rounded-bl-[13px] border-l border-b border-white/10 shadow-lg px-2 py-1">
                    <span className="text-[10px] sm:text-[12px] font-black text-ef-accent italic uppercase tracking-tighter leading-none pulse-ef">
                        {secondaryMatch}
                    </span>
                </div>
            )}

            {/* Main Image Container */}
            <div className={`absolute inset-0 transition-all duration-300`}>
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

            {/* Top Left: HUD Column (Rating, Position & Badges) */}
            <div className="absolute top-0 left-0 z-20 flex flex-col items-start bg-black rounded-br-[13px] border-r border-b border-white/10 backdrop-blur-md shadow-lg w-[44px] overflow-hidden">
                {/* Console Box for Rating/Position */}
                {settings?.showRatings && (
                    <div className="w-full py-1 flex flex-col items-center justify-center border-b border-white/5">
                        <span className="text-sm sm:text-lg font-black text-ef-accent leading-none tracking-tighter mb-0.5">
                            {player.rating || 0}
                        </span>
                        <span className="text-[10px] sm:text-[12px] font-black text-ef-accent italic uppercase tracking-tighter leading-none">
                            {role || player.position}
                        </span>
                    </div>
                )}

                {/* Badges Column */}
                <div className="flex flex-col items-center gap-1 w-full py-1.5 min-h-[10px]">
                    {settings?.showClubBadge !== false && (player.logos?.club || player.club_badge_url) && (
                        <div className="w-5 h-5 sm:w-6 sm:h-6">
                            <img src={player.logos?.club || player.club_badge_url} alt="" className="w-full h-full object-contain filter drop-shadow-md" />
                        </div>
                    )}
                    {settings?.showNationBadge !== false && (player.logos?.country || player.nationality_flag_url) && (
                        <div className="w-5 h-5 sm:w-6 sm:h-6 overflow-hidden">
                            <img src={player.logos?.country || player.nationality_flag_url} alt="" className="w-full h-full object-contain filter drop-shadow-md" />
                        </div>
                    )}
                </div>
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
                        <h3 className={`text-[6px] sm:text-sm font-black text-white uppercase tracking-tight sm:truncate whitespace-normal line-clamp-2 sm:line-clamp-none mb-1 drop-shadow-sm leading-[1.1] sm:leading-none block`}>
                            {player.name}
                        </h3>
                    )}

                    <div className={`flex flex-col gap-0.5 mb-3 ${settings.cardSize === 'xs' ? 'hidden sm:flex' : settings.cardSize === 'sm' ? 'hidden sm:flex' : 'flex'}`}>
                        {settings?.showClub !== false && (
                            <span className="text-[8px] font-black uppercase tracking-widest truncate max-w-full opacity-50">{player.club}</span>
                        )}
                        {settings?.showPlaystyle !== false && player.playstyle && player.playstyle !== 'None' && (
                            <span className="text-[7px] font-black uppercase tracking-wider text-ef-accent truncate">{player.playstyle}</span>
                        )}
                    </div>

                    {/* Dynamic Stats/Ranks Grid */}
                    {settings?.showStats && (
                        <div className={`grid gap-1 ${settings.customStatSlots?.length === 1 ? 'grid-cols-1' : settings.customStatSlots?.length === 2 ? 'grid-cols-2' : 'grid-cols-3'}`}>
                            {(settings.customStatSlots || ['matches', 'goals', 'assists']).map((slotId, idx) => {
                                const opt = STAT_OPTIONS.find(o => o.id === slotId);
                                if (!opt) return null;

                                let value = 0;
                                let colorClass = 'text-white';

                                if (slotId === 'totalGA') {
                                    value = (player.goals || 0) + (player.assists || 0);
                                    colorClass = 'text-ef-accent';
                                } else if (slotId.startsWith('rank_')) {
                                    const sorted = [...players].sort((a, b) => {
                                        const getVal = (p) => {
                                            const g = p.goals || 0;
                                            const ast = p.assists || 0;
                                            const m = Math.max(1, p.matches || 0);
                                            switch (slotId) {
                                                case 'rank_goals': return g;
                                                case 'rank_assists': return ast;
                                                case 'rank_matches': return p.matches || 0;
                                                case 'rank_ga': return g + ast;
                                                case 'rank_gpg': return g / m;
                                                case 'rank_apg': return ast / m;
                                                case 'rank_gapg': return (g + ast) / m;
                                                default: return p.rating || 0;
                                            }
                                        };
                                        return getVal(b) - getVal(a);
                                    });
                                    value = sorted.findIndex(p => p._id === player._id) + 1;
                                    colorClass = 'text-ef-accent font-black italic';
                                } else {
                                    value = player[slotId] || 0;
                                    if (slotId === 'goals') colorClass = 'text-ef-accent';
                                    if (slotId === 'assists') colorClass = 'text-ef-blue';
                                }

                                return (
                                    <div key={idx} className={`flex flex-col items-center py-1 rounded-lg border bg-black/40 backdrop-blur-md border-white/5 sm:backdrop-blur-none sm:bg-white/5`}>
                                        <span className={`text-[7px] font-black uppercase tracking-[0.2em] opacity-40 leading-none mb-1 ${colorClass}`}>{opt.short}</span>
                                        <span className={`text-[10px] font-black leading-none ${colorClass}`}>{value}</span>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
});

export default PlayerCard;
