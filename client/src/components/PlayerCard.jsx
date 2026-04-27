import { memo, useMemo } from 'react';
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
    
    const playerImage = useMemo(() => {
        if (settings?.preferredImageSource === 3) {
            const pid = player.playerId || player.pesdb_id || player.id || player.ID;
            return pid ? `https://efimg.com/efootballhub22/images/player_cards/${pid}_l.png` : (player.image || player.image2);
        }
        if (settings?.preferredImageSource === 2) {
            return player.image2 || player.image;
        }
        return player.image || player.image2;
    }, [player.image, player.image2, player.playerId, player.pesdb_id, player.id, player.ID, settings?.preferredImageSource]);

    if (settings?.cardSize === 'mini') {
        return (
            <div
                onClick={() => isSelectionMode && onToggleSelect(player._id)}
                className={`group relative overflow-hidden transition-all duration-300 ${settings?.cardCornerStyle === 'sharp' ? 'rounded-none' : 'rounded-lg'} border-2 w-full aspect-[10/9]
                    ${isSelected ? 'opacity-20 grayscale border-white/5' : `border-ef-accent hover:border-ef-accent hover:scale-105 hover:shadow-[0_0_25px_rgba(0,255,136,0.3)]`}
                    bg-black/80 cursor-pointer
                `}
            >
                {playerImage ? (
                    <img src={playerImage} alt={player.name} className="w-full h-full object-cover object-top relative z-0" loading="lazy" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center opacity-10 text-2xl">👤</div>
                )}

                {/* Rating HUD */}
                {settings?.showRatings !== false && (
                    <div className={`absolute bottom-0 right-0 z-20 bg-black/95 px-1.5 py-0.5 ${settings?.cardCornerStyle === 'sharp' ? 'rounded-none' : 'rounded-tl-[10px]'} border-l border-t border-white/10`}>
                        <span className={`text-[12px] font-black text-[#00FF88] italic leading-none`}>
                            {player.rating || 0}
                        </span>
                    </div>
                )}

                {/* Position HUD */}
                {settings?.showPosition !== false && (
                    <div className={`absolute top-0 left-0 z-20 bg-black/95 px-1.5 py-0.5 ${settings?.cardCornerStyle === 'sharp' ? 'rounded-none' : 'rounded-br-[10px]'} border-r border-b border-white/10`}>
                        <span className={`text-[10px] font-black text-ef-accent italic uppercase tracking-tighter`}>
                            {role || player.position}
                        </span>
                    </div>
                )}

                {/* Selection Overlay */}
                {isSelectionMode && (
                    <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 rounded-full border-2 flex items-center justify-center z-50 transition-all ${isSelected ? 'bg-ef-accent border-ef-accent scale-110' : 'bg-black/40 border-white/30 truncate'}`}>
                        {isSelected && <span className="text-ef-dark font-black text-xs">✓</span>}
                    </div>
                )}

                {/* Secondary Position Match Indicator */}
                {secondaryMatch && !isSelectionMode && (
                    <div className={`absolute top-0 right-0 z-20 bg-black/80 backdrop-blur-md ${settings?.cardCornerStyle === 'sharp' ? 'rounded-none' : 'rounded-bl-[10px]'} border-l border-b border-white/10 shadow-lg px-2 py-0.5`}>
                        <span className="text-[10px] font-black text-ef-accent italic uppercase tracking-tighter leading-none pulse-ef">
                            {secondaryMatch}
                        </span>
                    </div>
                )}

                {/* Optional Club/Nation badges aligned left, right below position if enabled */}
                {(settings?.showClubBadge !== false || settings?.showNationBadge !== false) && (
                    <div className="absolute top-6 left-1 z-20 flex flex-col items-center gap-1">
                        {settings?.showClubBadge !== false && (player.logos?.club || player.club_badge_url) && (
                            <img src={player.logos?.club || player.club_badge_url} alt="" className="w-4 h-4 object-contain filter drop-shadow-md brightness-110" />
                        )}
                        {settings?.showNationBadge !== false && (player.logos?.country || player.nationality_flag_url) && (
                            <img src={player.logos?.country || player.nationality_flag_url} alt="" className="w-4 h-4 object-contain filter drop-shadow-md brightness-110" />
                        )}
                    </div>
                )}
            </div>
        );
    }

    return (
        <div
            onClick={() => isSelectionMode && onToggleSelect(player._id)}
            className={`group relative aspect-[7/10] ${settings?.cardCornerStyle === 'sharp' ? 'rounded-none' : 'rounded-2xl'} overflow-hidden transition-all duration-500 cursor-pointer border-t border-l border-white/20 outline outline-1 outline-ef-accent/10 -outline-offset-1
            ${getCardColor(player.cardType)} 
            ${isEco ? 'shadow-lg' : 'shadow-2xl'}
            ${isSelected ? 'outline-4 outline-ef-accent outline-offset-[-4px] scale-95 shadow-[0_0_30px_rgba(100,255,100,0.4)]' : 'hover:scale-[1.02] hover:-translate-y-1'}
            ${!isEco && !isSelected ? 'hover:shadow-[0_20px_40px_rgba(0,0,0,0.6)]' : ''}`}
        >
            {/* Card Background Patterns */}
            {/* Card Background Patterns Removed */}


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
                {playerImage ? (
                    <img
                        src={playerImage}
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
            {(settings?.showRatings !== false || settings?.showPosition !== false || settings?.showClubBadge !== false || settings?.showNationBadge !== false) && (
                settings?.cardHudStyle === 'efootball' ? (
                    /* eFootball Style HUD - Exact Specs (Reduced) */
                    <div 
                        className="pointer-events-none absolute flex flex-col items-center text-center leading-none z-20"
                        style={{ left: '6%', top: '2%', width: '25%' }}
                    >
                        {settings?.showRatings !== false && (
                            <span 
                                className="text-white font-['Big_Shoulders_Stencil_Text'] font-black" 
                                style={{ 
                                    fontSize: '32px', 
                                    lineHeight: '1', 
                                    textShadow: 'rgba(0, 0, 0, 0.7) 0px 2px 8px' 
                                }}
                            >
                                {player.rating || 0}
                            </span>
                        )}
                        {settings?.showPosition !== false && (
                            <span 
                                className="text-white font-['Archivo_Black']" 
                                style={{ 
                                    fontSize: '14px', 
                                    lineHeight: '1', 
                                    letterSpacing: '0.05em', 
                                    textShadow: 'rgba(0, 0, 0, 0.7) 0px 1px 4px',
                                    marginTop: '-1px'
                                }}
                            >
                                {role || player.position}
                            </span>
                        )}
                        
                        {/* Badges Column (Relative to the new centered layout) */}
                        <div className="flex flex-col items-center gap-1.5 mt-2">
                            {settings?.showNationBadge !== false && (player.logos?.country || player.nationality_flag_url) && (
                                <div className="w-8 h-5 sm:w-10 sm:h-6 overflow-hidden border border-white/20 shadow-lg">
                                    <img src={player.logos?.country || player.nationality_flag_url} alt="" className="w-full h-full object-cover" />
                                </div>
                            )}
                            {settings?.showClubBadge !== false && (player.logos?.club || player.club_badge_url) && (
                                <div className="w-6 h-6 sm:w-8 sm:h-8">
                                    <img src={player.logos?.club || player.club_badge_url} alt="" className="w-full h-full object-contain filter drop-shadow-md" />
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    /* Default Style HUD */
                    <div className={`absolute top-0 left-0 z-20 flex flex-col items-start bg-transparent ${settings?.cardCornerStyle === 'sharp' ? 'rounded-none' : 'rounded-br-[13px]'} border-r border-b border-white/5 w-[44px] overflow-hidden`}>
                        {/* Console Box for Rating/Position */}
                        {(settings?.showRatings !== false || settings?.showPosition !== false) && (
                        <div className="w-full py-1 flex flex-col items-center justify-center border-b border-white/5">
                            {settings?.showRatings !== false && (
                                <span className="text-sm sm:text-lg font-black text-ef-accent leading-none tracking-tighter mb-0.5">
                                    {player.rating || 0}
                                </span>
                            )}
                            {settings?.showPosition !== false && (
                                <span className="text-[10px] sm:text-[12px] font-black text-ef-accent italic uppercase tracking-tighter leading-none">
                                    {role || player.position}
                                </span>
                            )}
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
                )
            )}

            {/* Bottom Content Area */}
            <div className={`absolute inset-x-0 bottom-0 p-3 sm:p-3 ${settings.cardSize === 'xs' ? 'pt-1' : 'pt-6 sm:pt-8'}`}>
                {/* Overlays Completely Removed */}


                {/* Blur Effect Behind Name/Stats - Mobile Only */}
                {/* Blur Removed */}

                <div className="relative z-10">
                    {settings?.showLabels && (
                        <h3 className={`text-[6px] sm:text-sm font-black text-white uppercase tracking-tight sm:truncate whitespace-normal line-clamp-2 sm:line-clamp-none mb-1 drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)] leading-[1.1] sm:leading-none block`}>
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
