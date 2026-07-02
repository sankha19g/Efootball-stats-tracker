import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { saveAutoMergeRules, getAutoMergeRules } from '../services/playerService';
import { createPortal } from 'react-dom';

// ─── Summary Modal ───────────────────────────────────────────────────────────
const MergeSummaryModal = ({ summary, onClose }) => {
    const total = summary.reduce((s, r) => s + r.affected, 0);
    const applied = summary.filter(r => r.affected > 0);
    const skipped = summary.filter(r => r.affected === 0);

    return createPortal(
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[300] flex items-center justify-center p-4 animate-fade-in">
            <div className="w-full max-w-lg bg-ef-card rounded-[2.5rem] border border-white/10 shadow-2xl overflow-hidden animate-slide-up text-white">
                {/* Header */}
                <div className="p-8 border-b border-white/5 bg-black/20 flex items-center justify-between">
                    <div>
                        <h3 className="text-xl font-black uppercase tracking-tighter italic text-white flex items-center gap-3">
                            <span className="text-ef-accent">✅</span> Merge Summary
                        </h3>
                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-ef-accent mt-1">
                            {applied.length} rules applied · {total} players updated
                        </p>
                    </div>
                    <button onClick={onClose} className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white/40 hover:text-white transition-all">✕</button>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 divide-x divide-white/5 border-b border-white/5">
                    <div className="p-6 text-center">
                        <p className="text-3xl font-black text-ef-accent">{summary.length}</p>
                        <p className="text-[9px] font-black uppercase tracking-widest text-white/30 mt-1">Rules Run</p>
                    </div>
                    <div className="p-6 text-center">
                        <p className="text-3xl font-black text-white">{applied.length}</p>
                        <p className="text-[9px] font-black uppercase tracking-widest text-white/30 mt-1">Applied</p>
                    </div>
                    <div className="p-6 text-center">
                        <p className="text-3xl font-black text-white/30">{skipped.length}</p>
                        <p className="text-[9px] font-black uppercase tracking-widest text-white/30 mt-1">Skipped</p>
                    </div>
                </div>

                {/* Rule List */}
                <div className="p-6 overflow-y-auto max-h-72 space-y-2">
                    {summary.map((r, i) => (
                        <div
                            key={i}
                            className={`flex items-center gap-4 p-4 rounded-2xl border transition-all ${r.affected > 0 ? 'bg-ef-accent/5 border-ef-accent/20' : 'bg-white/3 border-white/5 opacity-40'}`}
                        >
                            <div className="w-6 h-6 rounded-lg flex items-center justify-center text-xs shrink-0">
                                {r.affected > 0 ? (
                                    <span className="text-ef-accent font-black">✓</span>
                                ) : (
                                    <span className="text-white/20 font-black">–</span>
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                    <span className="text-[11px] font-black uppercase text-white/60 truncate">{r.from}</span>
                                    <span className="text-[10px] text-white/20">→</span>
                                    <span className="text-[11px] font-black uppercase text-white truncate">{r.to}</span>
                                </div>
                                <p className="text-[9px] font-bold text-white/30 uppercase tracking-widest mt-0.5">
                                    {r.type} · {r.affected > 0 ? `${r.affected} players updated` : 'No matches found'}
                                </p>
                            </div>
                            {r.affected > 0 && (
                                <span className="text-xs font-black text-ef-accent shrink-0">{r.affected}</span>
                            )}
                        </div>
                    ))}
                </div>

                <div className="p-6 pt-0">
                    <button
                        onClick={onClose}
                        className="w-full py-4 px-6 rounded-2xl bg-ef-accent text-ef-dark font-black uppercase tracking-widest text-[10px] transition-all hover:scale-[1.02] active:scale-95 shadow-lg shadow-ef-accent/20"
                    >
                        Done
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};

// ─── Autocomplete Input ───────────────────────────────────────────────────────
const AutocompleteInput = ({ value, onChange, suggestions, placeholder, className }) => {
    const [open, setOpen] = useState(false);
    const [highlighted, setHighlighted] = useState(-1);
    const wrapRef = useRef(null);
    const listRef = useRef(null);

    const filtered = useMemo(() => {
        if (!value.trim()) return [];
        const q = value.toLowerCase();
        return suggestions
            .filter(s => s.toLowerCase().includes(q) && s.toLowerCase() !== q)
            .slice(0, 8);
    }, [value, suggestions]);

    // Close on outside click
    useEffect(() => {
        const handler = (e) => {
            if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const handleKeyDown = (e) => {
        if (!open || filtered.length === 0) return;
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setHighlighted(h => Math.min(h + 1, filtered.length - 1));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setHighlighted(h => Math.max(h - 1, 0));
        } else if (e.key === 'Enter' && highlighted >= 0) {
            e.preventDefault();
            onChange(filtered[highlighted]);
            setOpen(false);
            setHighlighted(-1);
        } else if (e.key === 'Escape') {
            setOpen(false);
        }
    };

    return (
        <div ref={wrapRef} className="relative w-full">
            <input
                type="text"
                value={value}
                onChange={e => { onChange(e.target.value); setOpen(true); setHighlighted(-1); }}
                onFocus={() => { if (filtered.length > 0) setOpen(true); }}
                onKeyDown={handleKeyDown}
                placeholder={placeholder}
                className={className}
                autoComplete="off"
            />
            {open && filtered.length > 0 && (
                <div
                    ref={listRef}
                    className="absolute left-0 right-0 top-full mt-1 z-[200] bg-[#1a1a2e] border border-white/10 rounded-xl overflow-hidden shadow-2xl shadow-black/60"
                >
                    {filtered.map((s, i) => (
                        <button
                            key={s}
                            type="button"
                            onMouseDown={e => { e.preventDefault(); onChange(s); setOpen(false); setHighlighted(-1); }}
                            onMouseEnter={() => setHighlighted(i)}
                            className={`w-full text-left px-4 py-2.5 text-sm font-bold truncate transition-colors ${
                                i === highlighted
                                    ? 'bg-ef-accent/20 text-ef-accent'
                                    : 'text-white/70 hover:bg-white/5 hover:text-white'
                            }`}
                        >
                            {s}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

// ─── Rule Row ────────────────────────────────────────────────────────────────
const RuleRow = ({ rule, index, onChange, onRemove, suggestions }) => {
    const typeSuggestions = suggestions[rule.type] || [];

    return (
        <div className="group flex items-center gap-3 p-4 bg-black/30 border border-white/5 rounded-2xl hover:border-white/10 transition-all animate-slide-up" style={{ animationDelay: `${index * 0.04}s` }}>
            {/* Type Pill */}
            <select
                value={rule.type}
                onChange={e => onChange(index, 'type', e.target.value)}
                className="bg-black/40 border border-white/10 rounded-xl px-3 py-2.5 text-[10px] font-black uppercase tracking-widest text-white outline-none focus:border-ef-accent/50 appearance-none cursor-pointer w-28 shrink-0"
            >
                <option value="club">🛡️ Club</option>
                <option value="league">🏆 League</option>
                <option value="national">🌍 Nation</option>
            </select>

            {/* From */}
            <div className="flex-1">
                <AutocompleteInput
                    value={rule.from}
                    onChange={val => onChange(index, 'from', val)}
                    suggestions={typeSuggestions}
                    placeholder="Unlicensed / wrong name…"
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-sm font-bold text-white outline-none focus:border-ef-accent/50 transition-all placeholder:text-white/10"
                />
            </div>

            {/* Arrow */}
            <span className="text-white/20 font-black text-lg shrink-0">→</span>

            {/* To */}
            <div className="flex-1">
                <AutocompleteInput
                    value={rule.to}
                    onChange={val => onChange(index, 'to', val)}
                    suggestions={typeSuggestions}
                    placeholder="Correct name…"
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-sm font-bold text-white outline-none focus:border-ef-accent/50 transition-all placeholder:text-white/10"
                />
            </div>

            {/* Delete */}
            <button
                onClick={() => onRemove(index)}
                className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center text-white/20 hover:bg-red-500/20 hover:text-red-400 transition-all shrink-0 opacity-0 group-hover:opacity-100"
            >
                ✕
            </button>
        </div>
    );
};

// ─── Main Component ──────────────────────────────────────────────────────────
const STORAGE_KEY = 'ef-auto-merge-rules';

const defaultRules = () => {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) return JSON.parse(saved);
    } catch { /* ignore */ }
    return [{ type: 'club', from: '', to: '' }];
};

const writeLocalStorage = (rules) => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(rules)); } catch { /* ignore */ }
};

// ─── Bulk Add Modal ──────────────────────────────────────────────────────────────
const BulkAddModal = ({ onClose, onAdd }) => {
    const [text, setText] = useState('');
    const [bulkType, setBulkType] = useState('club');

    const parse = (raw, type) => {
        return raw
            .split(/[;\n]/)
            .map(line => line.trim())
            .filter(Boolean)
            .map(line => {
                const dashIdx = line.indexOf('-');
                if (dashIdx === -1) return null;
                const from = line.slice(0, dashIdx).trim();
                const to = line.slice(dashIdx + 1).trim();
                if (!from || !to) return null;
                return { type, from, to };
            })
            .filter(Boolean);
    };

    const preview = parse(text, bulkType);

    const handleConfirm = () => {
        if (preview.length > 0) onAdd(preview);
        onClose();
    };

    return createPortal(
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[300] flex items-center justify-center p-4 animate-fade-in">
            <div className="w-full max-w-xl bg-ef-card rounded-[2.5rem] border border-white/10 shadow-2xl overflow-hidden animate-slide-up text-white">
                {/* Header */}
                <div className="p-7 border-b border-white/5 bg-black/20 flex items-center justify-between">
                    <div>
                        <h3 className="text-lg font-black uppercase tracking-tighter italic text-white flex items-center gap-3">
                            <span className="text-ef-accent">📋</span> Bulk Add Rules
                        </h3>
                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30 mt-1">
                            Format: <span className="text-ef-accent">Wrong Name-Correct Name;</span> &mdash; one per line
                        </p>
                    </div>
                    <button onClick={onClose} className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white/40 hover:text-white transition-all">✕</button>
                </div>

                {/* Type selector */}
                <div className="px-7 pt-5">
                    <p className="text-[9px] font-black uppercase tracking-widest text-white/30 mb-2">Apply all as</p>
                    <div className="flex gap-2">
                        {[{ key: 'club', label: '🛡️ Club' }, { key: 'league', label: '🏆 League' }, { key: 'national', label: '🌍 Nation' }].map(t => (
                            <button
                                key={t.key}
                                onClick={() => setBulkType(t.key)}
                                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${
                                    bulkType === t.key
                                        ? 'bg-ef-accent text-ef-dark border-ef-accent'
                                        : 'bg-white/5 border-white/10 text-white/40 hover:text-white'
                                }`}
                            >
                                {t.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Textarea */}
                <div className="px-7 pt-4">
                    <textarea
                        value={text}
                        onChange={e => setText(e.target.value)}
                        placeholder={`chelsea B-Chelsea;\nmanchester B-Manchester City;\nenglish league-Premier League;`}
                        rows={7}
                        className="w-full bg-black/40 border border-white/10 rounded-2xl px-5 py-4 text-sm font-mono text-white outline-none focus:border-ef-accent/50 transition-all placeholder:text-white/10 resize-none leading-relaxed"
                        autoFocus
                    />
                </div>

                {/* Preview */}
                {preview.length > 0 && (
                    <div className="px-7 pt-3">
                        <p className="text-[9px] font-black uppercase tracking-widest text-white/30 mb-2">
                            {preview.length} rule{preview.length !== 1 ? 's' : ''} detected
                        </p>
                        <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1">
                            {preview.map((r, i) => (
                                <div key={i} className="flex items-center gap-3 bg-white/3 border border-white/5 rounded-xl px-4 py-2">
                                    <span className="text-[10px] font-black text-white/50 truncate flex-1">{r.from}</span>
                                    <span className="text-white/20 text-xs">→</span>
                                    <span className="text-[10px] font-black text-ef-accent truncate flex-1">{r.to}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Actions */}
                <div className="p-7 pt-4 flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 py-3.5 rounded-2xl bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-white transition-all"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleConfirm}
                        disabled={preview.length === 0}
                        className={`flex-1 py-3.5 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all ${
                            preview.length === 0
                                ? 'bg-white/5 text-white/20 cursor-not-allowed'
                                : 'bg-ef-accent text-ef-dark hover:scale-[1.02] active:scale-95 shadow-lg shadow-ef-accent/20'
                        }`}
                    >
                        Add {preview.length > 0 ? preview.length : ''} Rule{preview.length !== 1 ? 's' : ''}
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};

const AutoMergeView = ({ players, onBack, onExecuteMerge, userId }) => {
    const [rules, setRules] = useState(defaultRules);
    const [isMerging, setIsMerging] = useState(false);
    const [summary, setSummary] = useState(null);
    const [filterType, setFilterType] = useState('all');
    const [search, setSearch] = useState('');
    const [isBulkOpen, setIsBulkOpen] = useState(false);
    const [isSyncing, setIsSyncing] = useState(false);
    const [saveStatus, setSaveStatus] = useState('idle'); // 'idle' | 'saving' | 'saved' | 'error'
    const hasChanges = useRef(false);

    // Refs so unmount cleanup always has fresh values without stale closures
    const rulesRef = useRef(rules);
    const userIdRef = useRef(userId);
    useEffect(() => { rulesRef.current = rules; }, [rules]);
    useEffect(() => { userIdRef.current = userId; }, [userId]);

    // ── Firestore save helper ─────────────────────────────────────────────────
    const persistToFirestore = useCallback(async (rulesToSave, uid) => {
        const targetUid = uid ?? userIdRef.current;
        if (!targetUid) return;
        setSaveStatus('saving');
        try {
            await saveAutoMergeRules(targetUid, rulesToSave);
            hasChanges.current = false; // reset changes flag on success
            setSaveStatus('saved');
            setTimeout(() => setSaveStatus('idle'), 2000);
        } catch (err) {
            console.error('Failed to save auto merge rules:', err);
            setSaveStatus('error');
        }
    }, []);

    // ── Load rules from Firestore on mount ───────────────────────────────────
    useEffect(() => {
        if (!userId) return;
        let cancelled = false;
        (async () => {
            setIsSyncing(true);
            try {
                const dbRules = await getAutoMergeRules(userId);
                if (cancelled) return;

                if (dbRules && dbRules.length > 0) {
                    // Firestore has rules — use them as the authoritative source
                    setRules(dbRules);
                    writeLocalStorage(dbRules);
                } else {
                    // No Firestore data — bootstrap from localStorage if possible
                    const localRules = defaultRules();
                    const hasRealRules = localRules.some(r => r.from.trim() && r.to.trim());
                    if (hasRealRules) {
                        await saveAutoMergeRules(userId, localRules);
                    }
                }
            } catch (err) {
                console.error('Failed to load/bootstrap auto merge rules:', err);
            } finally {
                if (!cancelled) setIsSyncing(false);
            }
        })();
        return () => { cancelled = true; };
    }, [userId]);

    // ── Save on unmount — ensures navigating away never loses data ────────────
    useEffect(() => {
        return () => {
            const uid = userIdRef.current;
            const latestRules = rulesRef.current;
            // ONLY save on unmount if there are actual unsaved changes
            if (uid && latestRules && hasChanges.current) {
                saveAutoMergeRules(uid, latestRules).catch(err => {
                    console.error('Unmount save failed:', err);
                });
            }
        };
    }, []); // empty deps — only runs on unmount

    // ── Debounced Firestore save for keystroke changes ────────────────────────
    useEffect(() => {
        if (!userId) return;
        // ONLY save if the user made changes (prevents initial state or random triggers from saving)
        if (!hasChanges.current) return;

        const timer = setTimeout(() => {
            persistToFirestore(rules, userId);
        }, 400);

        return () => clearTimeout(timer);
    }, [rules, userId, persistToFirestore]);

    // Build unique sorted suggestion lists from player data
    const suggestions = useMemo(() => {
        const unique = (arr) => [...new Set(arr.filter(Boolean))].sort((a, b) => a.localeCompare(b));
        return {
            club: unique(players.map(p => p.club)),
            league: unique(players.map(p => p.league)),
            national: unique(players.map(p => p.nationality)),
        };
    }, [players]);

    // Commit actions — save immediately to Firestore (don't rely on debounce)
    const saveRules = useCallback((newRules) => {
        hasChanges.current = true;
        setRules(newRules);
        writeLocalStorage(newRules);
        persistToFirestore(newRules);
    }, [persistToFirestore]);

    const handleChange = useCallback((index, field, value) => {
        hasChanges.current = true;
        setRules(prev => {
            const next = prev.map((r, i) => i === index ? { ...r, [field]: value } : r);
            writeLocalStorage(next);
            return next;
        });
    }, []);

    const handleRemove = useCallback((index) => {
        const next = rules.filter((_, i) => i !== index);
        const result = next.length === 0 ? [{ type: 'club', from: '', to: '' }] : next;
        saveRules(result);
    }, [rules, saveRules]);

    const handleAdd = () => {
        saveRules([{ type: 'club', from: '', to: '' }, ...rules]);
    };

    const handleBulkAdd = (parsedRules) => {
        const existing = rules.filter(r => r.from.trim() || r.to.trim());
        saveRules([...parsedRules, ...existing]);
    };

    const handleClearAll = () => {
        saveRules([{ type: 'club', from: '', to: '' }]);
    };

    // Preview: how many players each rule would affect
    const previews = useMemo(() => {
        return rules.map(rule => {
            if (!rule.from.trim()) return 0;
            const q = rule.from.trim().toLowerCase();
            return players.filter(p => {
                if (rule.type === 'club') return (p.club || '').toLowerCase() === q;
                if (rule.type === 'league') return (p.league || '').toLowerCase() === q;
                if (rule.type === 'national') return (p.nationality || '').toLowerCase() === q;
                return false;
            }).length;
        });
    }, [rules, players]);

    const validRules = rules.filter(r => r.from.trim() && r.to.trim());
    const totalAffected = previews.reduce((s, c, i) => rules[i].from.trim() && rules[i].to.trim() ? s + c : s, 0);

    const filteredRules = useMemo(() => {
        let list = rules.map((r, i) => ({ ...r, _index: i }));
        if (filterType !== 'all') list = list.filter(r => r.type === filterType);
        if (search.trim()) {
            const q = search.toLowerCase();
            list = list.filter(r => r.from.toLowerCase().includes(q) || r.to.toLowerCase().includes(q));
        }
        return list;
    }, [rules, filterType, search]);

    const handleMerge = async () => {
        if (validRules.length === 0) return;
        setIsMerging(true);
        try {
            const result = await onExecuteMerge(validRules, players);
            setSummary(result);
        } finally {
            setIsMerging(false);
        }
    };

    return (
        <div className="max-w-5xl mx-auto animate-fade-in">
            {/* Cloud save status badge */}
            {(isSyncing || saveStatus !== 'idle') && (
                <div className={`fixed top-4 right-4 z-50 px-4 py-2 rounded-xl border text-[10px] font-black uppercase tracking-widest flex items-center gap-2 backdrop-blur-sm transition-all ${
                    saveStatus === 'error'
                        ? 'bg-red-500/20 border-red-500/30 text-red-400'
                        : saveStatus === 'saved'
                        ? 'bg-green-500/20 border-green-500/30 text-green-400'
                        : 'bg-black/80 border-white/10 text-white/50'
                }`}>
                    {isSyncing ? (
                        <><span className="animate-spin inline-block w-3 h-3 border-2 border-white/20 border-t-ef-accent rounded-full" /> Loading from cloud…</>
                    ) : saveStatus === 'saving' ? (
                        <><span className="animate-spin inline-block w-3 h-3 border-2 border-white/20 border-t-ef-accent rounded-full" /> Saving…</>
                    ) : saveStatus === 'saved' ? (
                        <>☁️ Saved to cloud</>
                    ) : saveStatus === 'error' ? (
                        <>⚠️ Save failed — check console</>
                    ) : null}
                </div>
            )}
            {/* Header */}
            <div className="mb-8 bg-ef-card/50 backdrop-blur-xl p-8 rounded-[2.5rem] border border-white/10 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-72 h-72 bg-ef-accent/5 rounded-full blur-[120px] -mr-36 -mt-36 animate-pulse pointer-events-none" />

                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={onBack}
                            className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-all shrink-0"
                        >
                            ←
                        </button>
                        <div>
                            <div className="flex items-center gap-3 mb-1">
                                <span className="text-2xl">🤖</span>
                                <h2 className="text-3xl font-black bg-gradient-to-r from-white via-white to-white/40 bg-clip-text text-transparent uppercase italic tracking-tighter">
                                    Auto Merge Rules
                                </h2>
                            </div>
                            <p className="text-[10px] uppercase font-black tracking-[0.3em] text-ef-accent">
                                {validRules.length} Active Rules · ~{totalAffected} Players Affected
                            </p>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setIsBulkOpen(true)}
                            className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest text-white/60 hover:bg-white/10 hover:text-white transition-all"
                        >
                            <span className="text-base">📋</span> Bulk Add
                        </button>
                        <button
                            onClick={handleAdd}
                            className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest text-white/60 hover:bg-white/10 hover:text-white transition-all"
                        >
                            <span className="text-ef-accent text-base font-black">+</span> Add Rule
                        </button>
                        <button
                            onClick={handleMerge}
                            disabled={isMerging || validRules.length === 0}
                            className={`flex items-center gap-3 px-8 py-3 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all shadow-lg ${
                                validRules.length === 0
                                    ? 'bg-white/5 text-white/20 cursor-not-allowed'
                                    : 'bg-ef-accent text-ef-dark shadow-ef-accent/20 hover:scale-[1.02] active:scale-95'
                            }`}
                        >
                            {isMerging ? (
                                <>
                                    <span className="animate-spin inline-block w-4 h-4 border-2 border-ef-dark/30 border-t-ef-dark rounded-full" />
                                    Merging…
                                </>
                            ) : (
                                <>⚡ Run Merge ({validRules.length})</>
                            )}
                        </button>
                    </div>
                </div>

                {/* Stats bar */}
                <div className="mt-6 grid grid-cols-3 gap-4">
                    {[
                        { label: 'Total Rules', value: rules.length, color: 'text-white' },
                        { label: 'Ready to Run', value: validRules.length, color: 'text-ef-accent' },
                        { label: 'Players Affected', value: totalAffected, color: 'text-blue-400' },
                    ].map(stat => (
                        <div key={stat.label} className="bg-black/30 rounded-2xl p-4 border border-white/5 text-center">
                            <p className={`text-2xl font-black ${stat.color}`}>{stat.value}</p>
                            <p className="text-[9px] font-black uppercase tracking-widest text-white/30 mt-1">{stat.label}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
                {/* Type Filter */}
                <div className="flex bg-black/40 p-1 rounded-2xl border border-white/5 h-12">
                    {[
                        { key: 'all', label: 'All' },
                        { key: 'club', label: '🛡️ Club' },
                        { key: 'league', label: '🏆 League' },
                        { key: 'national', label: '🌍 Nation' },
                    ].map(tab => (
                        <button
                            key={tab.key}
                            onClick={() => setFilterType(tab.key)}
                            className={`px-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filterType === tab.key ? 'bg-ef-accent text-ef-dark' : 'text-white/30 hover:text-white'}`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Search */}
                <div className="relative flex-1 group">
                    <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                        <span className="text-white/20 group-focus-within:text-ef-accent transition-colors">🔍</span>
                    </div>
                    <input
                        type="text"
                        placeholder="Search rules…"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="w-full bg-black/40 border border-white/10 rounded-2xl px-12 py-3.5 text-sm font-bold text-white outline-none focus:border-ef-accent/50 transition-all placeholder:text-white/10"
                    />
                </div>

                {/* Clear All */}
                <button
                    onClick={handleClearAll}
                    className="px-5 py-3 rounded-2xl bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest text-red-400/60 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/20 transition-all"
                >
                    Clear All
                </button>
            </div>

            {/* Column Headers */}
            <div className="flex items-center gap-3 px-4 mb-3">
                <div className="w-28 shrink-0">
                    <span className="text-[9px] font-black uppercase tracking-widest text-white/20">Type</span>
                </div>
                <div className="flex-1">
                    <span className="text-[9px] font-black uppercase tracking-widest text-white/20">From (unlicensed / wrong)</span>
                </div>
                <div className="w-8 shrink-0" />
                <div className="flex-1">
                    <span className="text-[9px] font-black uppercase tracking-widest text-white/20">To (correct name)</span>
                </div>
                <div className="w-9 shrink-0" />
            </div>

            {/* Rules List */}
            {filteredRules.length > 0 ? (
                <div className="space-y-2">
                    {filteredRules.map((rule) => {
                        const idx = rule._index;
                        const affected = previews[idx] ?? 0;
                        return (
                            <div key={idx} className="relative">
                                <RuleRow
                                    rule={rules[idx]}
                                    index={idx}
                                    onChange={handleChange}
                                    onRemove={handleRemove}
                                    suggestions={suggestions}
                                />
                                {/* Affected count badge */}
                                {rules[idx].from.trim() && (
                                    <div className={`absolute top-1/2 -translate-y-1/2 right-14 pointer-events-none px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${affected > 0 ? 'bg-ef-accent/10 text-ef-accent' : 'bg-white/5 text-white/20'}`}>
                                        {affected}p
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="py-24 text-center bg-ef-card/20 border border-dashed border-white/5 rounded-3xl">
                    <span className="text-4xl block mb-4 opacity-20">🤖</span>
                    <p className="text-white/20 font-black uppercase tracking-widest text-xs">No rules match your filter</p>
                </div>
            )}

            {/* Bottom Add Row */}
            <div className="mt-4">
                <button
                    onClick={handleAdd}
                    className="w-full py-4 rounded-2xl border border-dashed border-white/10 text-[10px] font-black uppercase tracking-widest text-white/20 hover:border-ef-accent/30 hover:text-ef-accent/60 transition-all flex items-center justify-center gap-2"
                >
                    <span className="text-base font-black">+</span> Add New Rule
                </button>
            </div>

            {/* Summary Modal */}
            {summary && (
                <MergeSummaryModal
                    summary={summary}
                    onClose={() => setSummary(null)}
                />
            )}

            {/* Bulk Add Modal */}
            {isBulkOpen && (
                <BulkAddModal
                    onClose={() => setIsBulkOpen(false)}
                    onAdd={handleBulkAdd}
                />
            )}
        </div>
    );
};

export default AutoMergeView;
