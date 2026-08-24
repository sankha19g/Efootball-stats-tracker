import { useState, useMemo } from 'react';
import { Search, Plus, Trash2 } from 'lucide-react';

const getProgressionIcon = (key) => {
    const filenameMap = {
        shooting: 'shooting.png',
        passing: 'passing.png',
        dribbling: 'dribbling.png',
        dexterity: 'dexterity.png',
        lowerBody: 'lower-body-strength.png',
        aerial: 'aerial-strength.png',
        defending: 'defending.png',
        gk1: 'gk1.png',
        gk2: 'gk2.png',
        gk3: 'gk3.png'
    };
    return `https://efhub.com/icons/progression/${filenameMap[key] || (key + '.png')}`;
};

const PlayerThumbnail = ({ player, settings }) => {
    const pid = player.playerId || player.pesdb_id || player.id || player.ID;
    const [isFallback, setIsFallback] = useState(false);

    const getPlayerImage = () => {
        if (settings?.preferredImageSource === 3 || !settings?.preferredImageSource) {
            return pid ? `https://efimg.com/efootballhub22/images/mini-cards/mini-cards/${pid}_l.png` : (player.image || player.image2);
        }
        if (settings?.preferredImageSource === 2) {
            return player.image2 || player.image;
        }
        return player.image || player.image2;
    };

    const handleImageError = (e) => {
        e.target.onerror = null;
        setIsFallback(true);
        if (pid) {
            e.target.src = `https://efimg.com/efootballhub22/images/player_cards/${pid}_l.png`;
        }
    };

    const src = getPlayerImage();

    return src ? (
        <div
            className="relative h-full overflow-hidden flex items-center justify-center"
            style={{ aspectRatio: '3/2' }}
        >
            <img
                src={src}
                alt=""
                className={isFallback ? "absolute z-0 top-0 left-0 w-full h-auto border border-[#b030e3]" : "h-full w-auto object-contain"}
                onError={handleImageError}
            />
        </div>
    ) : (
        <div className="w-full h-full flex items-center justify-center bg-white/5 opacity-20">
            <span className="text-xl">👤</span>
        </div>
    );
};

const BuildsPage = ({ players, onPlayerClick, onBuildClick, onAddBuildClick, onUpdatePlayer, showConfirm, settings }) => {
    const [searchQuery, setSearchQuery] = useState('');

    const filteredPlayers = useMemo(() => {
        return players
            .filter(player => player.progressions && player.progressions.length > 0)
            .filter(player => {
                if (!searchQuery) return true;
                const query = searchQuery.toLowerCase();
                
                // Check player basic info
                const matchPlayer = 
                    player.name?.toLowerCase().includes(query) ||
                    player.club?.toLowerCase().includes(query) ||
                    player.position?.toLowerCase().includes(query) ||
                    player.nationality?.toLowerCase().includes(query);
                    
                if (matchPlayer) return true;
                
                // Check saved builds info
                const matchBuild = player.progressions.some(build => 
                    build.name?.toLowerCase().includes(query) ||
                    build.description?.toLowerCase().includes(query) ||
                    build.position?.toLowerCase().includes(query)
                );
                
                return matchBuild;
            });
    }, [players, searchQuery]);

    const handleDeleteBuild = (player, buildId) => {
        const build = player.progressions?.find(p => p.id === buildId);
        const buildName = build ? build.name : 'Build';
        
        showConfirm(
            'Delete Build',
            `Are you sure you want to delete "${buildName}"?`,
            () => {
                const updatedProgressions = player.progressions.filter(p => p.id !== buildId);
                onUpdatePlayer(player._id, { ...player, progressions: updatedProgressions }, false);
            },
            'danger',
            'Delete'
        );
    };

    return (
        <div className="max-w-6xl mx-auto pb-12 px-4">
            {/* Header section with page title & description */}
            <div className="flex flex-col items-center justify-center mb-8">
                <h2 className="text-lg font-black uppercase tracking-[0.4em] opacity-70 text-center text-ef-accent mb-2">
                    Saved Player Builds
                </h2>
                <p className="text-[10px] font-black uppercase tracking-widest opacity-35 text-center">
                    Explore and manage custom progression builds for your squad
                </p>
            </div>

            {/* Search Bar at Top */}
            <div className="max-w-xl mx-auto mb-8">
                <div className="relative group">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 opacity-20 group-focus-within:opacity-100 transition-opacity">
                        <Search className="w-5 h-5 text-white" />
                    </span>
                    <input
                        type="text"
                        placeholder="Search player, club, position, or build name..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-sm font-bold text-white outline-none focus:border-ef-accent/50 focus:bg-white/[0.07] transition-all"
                    />
                </div>
            </div>

            {/* 2-Column Grid Layout */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredPlayers.map(player => (
                    <div key={player._id} className="bg-[#0b0b0d] border border-white/5 hover:border-white/10 rounded-3xl p-5 flex gap-6 transition-all hover:bg-[#0e0e11] shadow-2xl">
                        {/* Left Column of Card: Player Info */}
                        <div className="w-[140px] shrink-0 flex flex-col items-center border-r border-white/5 pr-6 justify-between">
                            <div className="w-full flex flex-col items-center">
                                {/* Card image container with green rating tag in top-right */}
                                <div className="relative w-full aspect-[3/2] overflow-hidden rounded-xl bg-black/40 border border-white/5 flex items-center justify-center">
                                    <PlayerThumbnail player={player} settings={settings} />
                                    <div className="absolute top-1.5 right-1.5 px-1.5 py-0.5 bg-[#00ff88]/15 border border-[#00ff88]/30 rounded text-[9px] font-black text-ef-accent">
                                        {player.rating}
                                    </div>
                                </div>
                                
                                {/* Player Name */}
                                <h4 className="text-[13px] font-black text-white text-center mt-3 uppercase tracking-wide truncate w-full" title={player.name}>
                                    {player.name}
                                </h4>
                                
                                {/* Position Badge & Badges (Club & Country) */}
                                <div className="flex items-center gap-2 mt-2 justify-center w-full">
                                    <span className="px-1.5 py-0.5 rounded bg-[#0f172a] border border-[#1e293b] text-[#38bdf8] text-[9px] font-black uppercase tracking-wider shrink-0">
                                        {player.position}
                                    </span>
                                    
                                    {/* Country Flag Badge */}
                                    {(player.logos?.country || player.nationality_flag_url) && (
                                        <div 
                                            className="w-5 h-3 overflow-hidden border border-white/10 shadow-sm shrink-0 rounded-[1px]"
                                            title={player.nationality}
                                        >
                                            <img 
                                                src={player.logos?.country || player.nationality_flag_url} 
                                                alt={player.nationality} 
                                                className="w-full h-full object-cover" 
                                            />
                                        </div>
                                    )}

                                    {/* Club Logo Badge */}
                                    {(player.logos?.club || player.club_badge_url) && (
                                        <div 
                                            className="w-5 h-5 shrink-0"
                                            title={player.club}
                                        >
                                            <img 
                                                src={player.logos?.club || player.club_badge_url} 
                                                alt={player.club} 
                                                className="w-full h-full object-contain filter drop-shadow" 
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>
                            
                            {/* Actions Group (View Player and Add Build) */}
                            <div className="flex flex-col gap-2 mt-4 w-full">
                                <button
                                    onClick={() => onPlayerClick(player)}
                                    className="w-full py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-[9px] font-black uppercase tracking-widest text-white transition-all active:scale-95 text-center cursor-pointer font-inter"
                                >
                                    View Player
                                </button>
                                <button
                                    onClick={() => onAddBuildClick(player)}
                                    className="w-full py-2 bg-ef-accent/10 hover:bg-ef-accent/20 border border-ef-accent/20 rounded-xl text-[9px] font-black uppercase tracking-widest text-ef-accent transition-all active:scale-95 text-center cursor-pointer font-inter flex items-center justify-center gap-1"
                                >
                                    <Plus className="w-3.5 h-3.5" /> Add Build
                                </button>
                            </div>
                        </div>

                        {/* Right Column of Card: Saved Builds list */}
                        <div className="flex-1 flex flex-col justify-start min-w-0">
                            <div className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-3 border-b border-white/5 pb-1.5">
                                Saved Builds ({player.progressions?.length || 0})
                            </div>
                            <div className="flex-1 flex flex-col gap-3 overflow-y-auto max-h-[220px] pr-1 custom-scrollbar">
                                {player.progressions?.map((build, buildIdx) => {
                                    const hasSkills = !!(build.skill1 || build.skill2 || build.skill3 || build.skill4 || build.skill5);
                                    return (
                                        <div
                                            key={build.id || buildIdx}
                                            className="w-full bg-[#050507] border border-white/5 rounded-2xl p-3.5 flex flex-col gap-2.5 hover:bg-white/5 hover:border-ef-accent/20 transition-all group/build"
                                        >
                                            {/* Header row: Clickable stats/info area + Delete button */}
                                            <div className="flex items-center justify-between gap-2">
                                                <div
                                                    onClick={() => onBuildClick(player, build.id)}
                                                    className="flex-1 flex items-center justify-between cursor-pointer min-w-0"
                                                >
                                                    <span className="text-xs font-bold text-white group-hover/build:text-ef-accent transition-colors truncate pr-2">
                                                        {build.name || 'Unnamed Build'}
                                                    </span>
                                                    <div className="flex items-center gap-2 flex-shrink-0">
                                                        <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-white/40 flex-shrink-0">
                                                            {build.position || player.position}
                                                        </span>
                                                        <span className="text-[11px] font-black text-ef-accent italic leading-none flex-shrink-0">
                                                            {build.rating || player.rating}
                                                        </span>
                                                    </div>
                                                </div>
                                                
                                                {/* Delete Button */}
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleDeleteBuild(player, build.id);
                                                    }}
                                                    className="p-1 text-white/20 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all flex-shrink-0 cursor-pointer"
                                                    title="Delete Build"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            </div>

                                            {/* Progression Stats Display */}
                                            <div 
                                                onClick={() => onBuildClick(player, build.id)}
                                                className="flex flex-wrap gap-1.5 cursor-pointer"
                                            >
                                                {[
                                                    { key: 'shooting', label: 'SHO' },
                                                    { key: 'passing', label: 'PAS' },
                                                    { key: 'dribbling', label: 'DRI' },
                                                    { key: 'dexterity', label: 'DEX' },
                                                    { key: 'lowerBody', label: 'LBS' },
                                                    { key: 'aerial', label: 'AER' },
                                                    { key: 'defending', label: 'DEF' },
                                                    { key: 'gk1', label: 'GK1' },
                                                    { key: 'gk2', label: 'GK2' },
                                                    { key: 'gk3', label: 'GK3' }
                                                ].map(stat => {
                                                    const val = build[stat.key];
                                                    if (!val || val === 0) return null;
                                                    return (
                                                        <div key={stat.key} className="flex items-center gap-1 bg-[#141414] px-1.5 py-0.5 rounded border border-white/5">
                                                            <img 
                                                                src={getProgressionIcon(stat.key)} 
                                                                alt="" 
                                                                className="w-3.5 h-3.5 object-contain"
                                                            />
                                                            <span className="text-[8px] font-black text-white/40 uppercase">{stat.label}</span>
                                                            <span className="text-[9px] font-mono font-black text-ef-accent">{val}</span>
                                                        </div>
                                                    );
                                                })}
                                            </div>

                                            {/* Added Skills Display */}
                                            {hasSkills && (
                                                <div 
                                                    onClick={() => onBuildClick(player, build.id)}
                                                    className="flex flex-wrap gap-1 pt-2 border-t border-white/5 cursor-pointer"
                                                >
                                                    {[1, 2, 3, 4, 5].map(i => {
                                                        const skill = build[`skill${i}`];
                                                        if (!skill) return null;
                                                        return (
                                                            <span key={i} className="text-[8px] font-medium text-white/50 px-1.5 py-0.5 rounded bg-white/[0.02] border border-white/5">
                                                                {skill}
                                                            </span>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {filteredPlayers.length === 0 && (
                <div className="text-center py-24 opacity-20">
                    <span className="text-5xl block mb-4">⚒️</span>
                    <p className="font-black uppercase tracking-widest text-sm">No player builds found</p>
                </div>
            )}
        </div>
    );
};

export default BuildsPage;
