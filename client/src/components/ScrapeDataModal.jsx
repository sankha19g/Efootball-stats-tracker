import { useState } from 'react';
import API_URL from '../config/api';
import { saveToGlobalDatabase, deleteFromGlobalDatabase } from '../services/playerService';

// ─── Special Skills ─────────────────────────────────────────────────────────────
const SPECIAL_SKILLS_SET = new Set([
    'Blitz Curler',
    'Long-Reach Tackle',
    'Acceleration Burst',
    'Phenomenal Pass',
    'Momentum Dribbling',
    'Phenomenal Finishing',
    'Magnetic Feet',
    'Attack Trigger',
    'Aerial Fort',
    'Edged Crossing',
    'Low Screamer',
    'Bullet Header',
    'Visionary Pass',
    'Willpower',
    'Fortress',
    'Game-Changing Pass',
    'GK Directing Defense',
    'GK Spirit Roar',
]);

// ─── Tiny stat pill component ──────────────────────────────────────────────────
const StatPill = ({ label, value, accent }) => {
    if (!value && value !== 0) return null;
    return (
        <div className="flex items-center gap-1.5 bg-white/5 rounded-lg px-2 py-1 border border-white/5">
            <span className="text-[7px] font-black uppercase tracking-widest opacity-25">{label}</span>
            <span className={`text-[10px] font-bold leading-none ${accent ? 'text-ef-accent' : 'text-white/70'}`}>{value}</span>
        </div>
    );
};

// ─── Expandable Player Row ─────────────────────────────────────────────────────
const ExpandablePlayerRow = ({ player, index, forceExpand }) => {
    const [localExpanded, setLocalExpanded] = useState(false);
    const expanded = forceExpand || localExpanded;

    const skills = (player.skills || []).filter(Boolean);
    const hasExtras = player.height || player.weight || player.age || player.strongFoot
        || player['Weak Foot Usage'] || player['Weak Foot Accuracy']
        || player['Form'] || player['Injury Resistance']
        || player['Date Added'] || player['Featured Players']
        || skills.length > 0;

    return (
        <div className={`border-b border-white/5 last:border-0 transition-colors ${expanded ? 'bg-white/[0.03]' : 'hover:bg-white/[0.015]'}`}>

            {/* ── Concise summary row ── */}
            <div
                className="flex items-center gap-2.5 px-4 py-2 cursor-pointer select-none"
                onClick={() => setLocalExpanded(e => !e)}
            >
                {/* Index */}
                <span className="text-[9px] font-bold opacity-20 w-5 shrink-0 text-right">{index + 1}</span>

                {/* Thumbnail */}
                <div className="w-7 h-10 rounded bg-black/40 overflow-hidden border border-white/10 shrink-0">
                    <img src={player.image} alt="" className="w-full h-full object-cover object-top" loading="lazy" />
                </div>

                {/* Name / Nat */}
                <div className="flex-1 min-w-0">
                    <div className="font-black uppercase text-[11px] leading-tight truncate">{player.name}</div>
                    <div className="text-[8px] opacity-30 truncate">{player.nationality}</div>
                </div>

                {/* Position */}
                <span className="text-[8px] font-black px-1.5 py-0.5 rounded bg-ef-accent/10 text-ef-accent border border-ef-accent/20 shrink-0">
                    {player.position}
                </span>

                {/* Rating */}
                <span className="text-[11px] font-black text-white/50 shrink-0 w-6 text-right">{player.rating}</span>

                {/* Club */}
                <div className="hidden sm:flex items-center gap-1 min-w-0 max-w-[100px]">
                    {player.club_badge_url && (
                        <img src={player.club_badge_url} className="w-3 h-3 object-contain shrink-0 opacity-60" alt="" />
                    )}
                    <span className="text-[8px] opacity-35 truncate">{player.club_original || player.club}</span>
                </div>

                {/* Playstyle */}
                {player.playstyle && player.playstyle !== 'None' && (
                    <span className="text-[7px] font-black px-1.5 py-0.5 rounded-full bg-pink-500/10 text-pink-400 border border-pink-500/20 shrink-0 hidden md:inline truncate max-w-[90px]">
                        {player.playstyle}
                    </span>
                )}

                {/* Featured Pack */}
                {player['Featured Players'] && (
                    <span className="text-[7px] font-black px-1.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 shrink-0 hidden lg:inline truncate max-w-[110px]">
                        🏆 {player['Featured Players']}
                    </span>
                )}

                {/* Skills count */}
                {skills.length > 0 && (
                    <span className="text-[7px] font-black px-1.5 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20 shrink-0 hidden sm:inline">
                        {skills.length}⚡
                    </span>
                )}

                {/* Chevron */}
                {hasExtras && (
                    <span className={`text-[9px] opacity-25 shrink-0 transition-transform duration-200 ml-1 ${expanded ? 'rotate-180' : ''}`}>▼</span>
                )}
            </div>

            {/* ── Expanded detail panel ── */}
            {expanded && hasExtras && (
                <div className="px-4 pb-3 pt-1 border-t border-white/5">
                    {/* Stat pills */}
                    <div className="flex flex-wrap gap-1.5 mt-1.5 mb-2">
                        <StatPill label="Height"   value={player.height ? `${player.height}cm` : null} />
                        <StatPill label="Weight"   value={player.weight ? `${player.weight}kg` : null} />
                        <StatPill label="Age"      value={player.age} />
                        <StatPill label="Foot"     value={player.strongFoot} />
                        <StatPill label="Form"     value={player['Form']} />
                        <StatPill label="Injury"   value={player['Injury Resistance']} />
                        <StatPill label="WF Use"   value={player['Weak Foot Usage']} />
                        <StatPill label="WF Acc"   value={player['Weak Foot Accuracy']} />
                        <StatPill label="League"   value={player.league} />
                        <StatPill label="Playstyle" value={player.playstyle !== 'None' ? player.playstyle : null} accent />
                        <StatPill label="Date Added" value={player['Date Added']} accent />
                        <StatPill label="Featured"   value={player['Featured Players']} accent />
                    </div>

                    {/* Skills */}
                    {skills.length > 0 && (
                        <div>
                            <div className="text-[7px] font-black uppercase tracking-widest opacity-20 mb-1.5">
                                Skills ({skills.length})
                            </div>
                            <div className="flex flex-wrap gap-1">
                                {skills.map((skill, i) => {
                                    const isSpecial = SPECIAL_SKILLS_SET.has(skill);
                                    return (
                                        <span key={i} className={`text-[7px] font-bold px-1.5 py-0.5 rounded-full border transition-all ${isSpecial ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-white/5 text-white/35 border-white/10'}`}>
                                            {isSpecial ? '🔥 ' : ''}{skill}
                                        </span>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

// ─── Scrape Summary Panel ──────────────────────────────────────────────────────
const ScrapeSummary = ({ players, isUndoing, onUndo, onClose }) => {
    const [expandAll, setExpandAll] = useState(false);

    const totalSkills    = players.reduce((s, p) => s + (p.skills?.length || 0), 0);
    const withHeight     = players.filter(p => p.height).length;
    const withFoot       = players.filter(p => p.strongFoot).length;
    const withForm       = players.filter(p => p['Form']).length;
    const withDateAdded  = players.filter(p => p['Date Added']).length;
    const withFeatured   = players.filter(p => p['Featured Players']).length;
    const withPlaystyle  = players.filter(p => p.playstyle && p.playstyle !== 'None').length;

    return (
        <div className="flex flex-col" style={{ height: '78vh' }}>
            {/* Header */}
            <div className="mb-3 pr-8">
                <h2 className="text-xl font-black uppercase text-ef-accent tracking-wider mb-1">Scrape Complete</h2>
                <p className="text-xs text-white/50">
                    <strong className="text-white">{players.length}</strong> players imported into the Global Database.
                </p>
            </div>

            {/* Coverage chips */}
            <div className="flex flex-wrap gap-1.5 mb-3">
                {[
                    { label: 'Skills',      val: totalSkills,   col: 'text-purple-400' },
                    { label: 'Playstyle',   val: withPlaystyle, col: 'text-pink-400'   },
                    { label: 'Featured',    val: withFeatured,  col: 'text-amber-400'  },
                    { label: 'Height',      val: withHeight,    col: 'text-cyan-400'   },
                    { label: 'Foot',        val: withFoot,      col: 'text-blue-400'   },
                    { label: 'Form',        val: withForm,      col: 'text-yellow-400' },
                    { label: 'Date Added',  val: withDateAdded, col: 'text-ef-accent'  },
                ].map(c => (
                    <div key={c.label} className="flex items-center gap-1 px-2 py-1 rounded-lg bg-white/5 border border-white/5">
                        <span className="text-[7px] font-black uppercase tracking-widest opacity-25">{c.label}</span>
                        <span className={`text-[11px] font-black ${c.col}`}>{c.val}</span>
                    </div>
                ))}
            </div>

            {/* Controls bar */}
            <div className="flex items-center justify-between mb-1.5 px-0.5">
                <span className="text-[9px] font-black uppercase tracking-widest opacity-25">
                    {players.length} Players · click ▼ to expand
                </span>
                <button
                    onClick={() => setExpandAll(v => !v)}
                    className="text-[8px] font-black uppercase tracking-widest text-ef-accent hover:opacity-60 transition-opacity"
                >
                    {expandAll ? '▲ Collapse All' : '▼ Expand All'}
                </button>
            </div>

            {/* Player list */}
            <div className="flex-1 overflow-y-auto border border-white/10 rounded-xl bg-black/40 custom-scrollbar min-h-0">
                {players.map((player, idx) => (
                    <ExpandablePlayerRow
                        key={player.id || idx}
                        player={player}
                        index={idx}
                        forceExpand={expandAll}
                    />
                ))}
            </div>

            {/* Footer */}
            <div className="mt-4 flex justify-between items-center pt-4 border-t border-white/5 shrink-0">
                <p className="text-[9px] text-white/20 uppercase font-black tracking-widest max-w-[180px]">
                    Community Database Updated
                </p>
                <div className="flex items-center gap-3">
                    <button
                        onClick={onUndo}
                        disabled={isUndoing}
                        className="px-5 py-3 rounded-xl border border-red-500/20 bg-red-500/5 text-red-500 font-bold text-xs uppercase tracking-widest hover:bg-red-500/10 transition-all disabled:opacity-50"
                    >
                        {isUndoing ? 'Undoing…' : 'Undo Scrape'}
                    </button>
                    <button
                        onClick={onClose}
                        className="px-8 py-3 rounded-xl bg-ef-accent text-ef-dark font-black text-xs uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-[0_0_30px_rgba(0,255,136,0.3)]"
                    >
                        Finish
                    </button>
                </div>
            </div>
        </div>
    );
};

// ─── Main Modal ────────────────────────────────────────────────────────────────
const ScrapeDataModal = ({ isOpen, onClose, onScrapeSuccess }) => {
    const [url, setUrl]                   = useState('');
    const [isScraping, setIsScraping]     = useState(false);
    const [error, setError]               = useState('');
    const [scrapedPlayers, setScrapedPlayers] = useState(null);
    const [isUndoing, setIsUndoing]       = useState(false);

    if (!isOpen) return null;

    const handleClose = (e) => {
        if (e) e.stopPropagation();
        setUrl('');
        setScrapedPlayers(null);
        setError('');
        if (onClose) onClose();
    };

    const handleScrape = async () => {
        if (!url) return;
        setIsScraping(true);
        setError('');
        try {
            const res = await fetch(`${API_URL}/api/scrape`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ urls: url })
            });
            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                throw new Error(errData.error || `Server error: ${res.status}`);
            }
            const data = await res.json();
            if (data.players?.length > 0) {
                try { await saveToGlobalDatabase(data.players); }
                catch (e) { console.error('Firestore save failed:', e); }
            }
            setScrapedPlayers(data.players || []);
            setError('');
            if (onScrapeSuccess) onScrapeSuccess(data);
        } catch (err) {
            setError(err.message || 'An error occurred while scraping data.');
        } finally {
            setIsScraping(false);
        }
    };

    const handleUndoScrape = async () => {
        if (!scrapedPlayers?.length) return;
        if (!window.confirm(`Undo scrape? All ${scrapedPlayers.length} players will be removed.`)) return;
        setIsUndoing(true);
        try {
            await deleteFromGlobalDatabase(scrapedPlayers.map(p => String(p.id)));
            setScrapedPlayers(null);
            setUrl('');
            if (onScrapeSuccess) onScrapeSuccess({ players: [], added: 0, updated: 0 });
        } catch (err) {
            setError('Failed to undo scrape.');
        } finally {
            setIsUndoing(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4" onClick={handleClose}>
            <div className="absolute inset-0 bg-black/90 backdrop-blur-md" />
            <div
                className={`relative z-10 w-full ${scrapedPlayers ? 'max-w-2xl' : 'max-w-md'} bg-[#1a1f26] border border-white/10 rounded-2xl p-6 shadow-2xl animate-fade-in-up transition-all duration-300 flex flex-col`}
                onClick={e => e.stopPropagation()}
            >
                <button
                    onClick={handleClose}
                    className="absolute top-4 right-4 text-white/40 hover:text-white transition-colors p-2 z-20"
                >✕</button>

                {!scrapedPlayers ? (
                    <>
                        <h2 className="text-xl font-black uppercase text-ef-accent tracking-wider mb-2">Scrape PESDB Data</h2>
                        <p className="text-xs text-white/50 mb-6">
                            Paste one or more PESDB links (each on a new line) to import players in bulk.
                        </p>
                        <textarea
                            placeholder={`https://pesdb.net/pes2022/?featured=1\nhttps://pesdb.net/pes2022/?epic=2`}
                            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-ef-accent/50 text-white placeholder:text-white/20 font-mono resize-none h-48 leading-relaxed"
                            value={url}
                            onChange={e => setUrl(e.target.value)}
                            disabled={isScraping}
                        />
                        {error && <p className="text-red-400 text-[10px] mt-2 font-bold uppercase">{error}</p>}
                        <div className="flex justify-end gap-3 mt-6">
                            <button onClick={handleClose} disabled={isScraping} className="px-5 py-2.5 rounded-xl font-bold text-xs uppercase text-white/50 hover:text-white hover:bg-white/5 transition-colors disabled:opacity-50">
                                Cancel
                            </button>
                            <button
                                onClick={handleScrape}
                                disabled={isScraping}
                                className={`px-5 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest text-ef-dark bg-ef-accent transition-all flex items-center gap-2 ${isScraping ? 'opacity-70 cursor-wait' : 'hover:scale-105 active:scale-95'}`}
                            >
                                {isScraping
                                    ? <><div className="w-3 h-3 border-2 border-ef-dark border-t-transparent rounded-full animate-spin" />Scraping…</>
                                    : <><span>🕸️</span>Start Scrape</>
                                }
                            </button>
                        </div>
                    </>
                ) : (
                    <ScrapeSummary
                        players={scrapedPlayers}
                        isUndoing={isUndoing}
                        onUndo={handleUndoScrape}
                        onClose={handleClose}
                    />
                )}
            </div>
        </div>
    );
};

export default ScrapeDataModal;
