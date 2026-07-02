import { useState, useMemo, useEffect, useRef } from 'react';

export const AutocompleteInput = ({ value, onChange, suggestions, placeholder, className }) => {
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
                    className="absolute left-0 right-0 top-full mt-1 z-[350] bg-[#1a1a2e] border border-white/10 rounded-xl overflow-hidden shadow-2xl shadow-black/60"
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

export const BadgeEditModal = ({ badge, type, onClose, onUpdate }) => {
    const [name, setName] = useState(badge.name);
    const [logo, setLogo] = useState(badge.logo);
    const [league, setLeague] = useState(badge.league || '');

    const handleSubmit = (e) => {
        e.preventDefault();
        onUpdate(badge.name, name, logo, type, league);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[300] flex items-center justify-center p-4 animate-fade-in text-white">
            <div className="w-full max-w-md bg-ef-card rounded-[2.5rem] border border-white/10 shadow-2xl overflow-hidden animate-slide-up">
                <div className="p-8 border-b border-white/5 flex items-center justify-between bg-black/20">
                    <h3 className="text-xl font-black uppercase tracking-tighter italic text-white flex items-center gap-3">
                        <span className="text-ef-accent">✏️</span> Edit {type === 'club' ? 'Club' : type === 'league' ? 'League' : 'Nation'}
                    </h3>
                    <button onClick={onClose} className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white/40 hover:text-white transition-all">✕</button>
                </div>

                <form onSubmit={handleSubmit} className="p-8 space-y-6">
                    <div className="flex justify-center mb-4">
                        <div className="relative w-24 h-24 bg-black/40 rounded-3xl border border-white/10 flex items-center justify-center p-4 shadow-inner">
                            {logo ? (
                                <img src={logo} alt="Preview" className="w-full h-full object-contain drop-shadow-lg" />
                            ) : (
                                <span className="text-white/10 text-4xl">{type === 'club' ? '🛡️' : type === 'national' ? '🌍' : '🏆'}</span>
                            )}
                        </div>
                    </div>

                    <div>
                        <label className="block text-[10px] font-black uppercase tracking-widest text-white/40 mb-2 ml-1">Name</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full bg-black/40 border border-white/10 rounded-2xl px-5 py-4 text-sm font-bold text-white outline-none focus:border-ef-accent/50 transition-all shadow-inner"
                            required
                        />
                    </div>

                    {type === 'club' && (
                        <div>
                            <label className="block text-[10px] font-black uppercase tracking-widest text-white/40 mb-2 ml-1">League</label>
                            <input
                                type="text"
                                value={league}
                                onChange={(e) => setLeague(e.target.value)}
                                className="w-full bg-black/40 border border-white/10 rounded-2xl px-5 py-4 text-sm font-bold text-white outline-none focus:border-ef-accent/50 transition-all shadow-inner"
                                required
                            />
                        </div>
                    )}

                    <div>
                        <label className="block text-[10px] font-black uppercase tracking-widest text-white/40 mb-2 ml-1">Logo URL</label>
                        <input
                            type="text"
                            value={logo}
                            onChange={(e) => setLogo(e.target.value)}
                            className="w-full bg-black/40 border border-white/10 rounded-2xl px-5 py-4 text-sm font-bold text-white outline-none focus:border-ef-accent/50 transition-all shadow-inner"
                        />
                    </div>

                    <div className="pt-4 flex gap-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-4 px-6 rounded-2xl bg-white/5 border border-white/10 text-white font-black uppercase tracking-widest text-[10px] transition-all hover:bg-white/10"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="flex-1 py-4 px-6 rounded-2xl bg-ef-accent text-ef-dark font-black uppercase tracking-widest text-[10px] transition-all shadow-lg shadow-ef-accent/20 hover:scale-[1.02] active:scale-95"
                        >
                            Save Changes
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export const BadgeAddRuleModal = ({ badge, initialType, suggestions, onClose, onAddRule }) => {
    const [type, setType] = useState(initialType);
    const [from, setFrom] = useState(badge.name);
    const [to, setTo] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    const typeSuggestions = suggestions[type] || [];

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!from.trim() || !to.trim()) return;
        setIsSaving(true);
        try {
            await onAddRule({ type, from: from.trim(), to: to.trim() });
            onClose();
        } catch (err) {
            console.error(err);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[300] flex items-center justify-center p-4 animate-fade-in text-white">
            <div className="w-full max-w-md bg-ef-card rounded-[2.5rem] border border-white/10 shadow-2xl overflow-hidden animate-slide-up">
                <div className="p-8 border-b border-white/5 flex items-center justify-between bg-black/20">
                    <h3 className="text-xl font-black uppercase tracking-tighter italic text-white flex items-center gap-3">
                        <span className="text-ef-accent">🤖</span> Add to Merge Rules
                    </h3>
                    <button onClick={onClose} className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white/40 hover:text-white transition-all">✕</button>
                </div>

                <form onSubmit={handleSubmit} className="p-8 space-y-6">
                    <div>
                        <label className="block text-[10px] font-black uppercase tracking-widest text-white/40 mb-2 ml-1">Rule Type</label>
                        <select
                            value={type}
                            onChange={e => setType(e.target.value)}
                            className="w-full bg-black/40 border border-white/10 rounded-2xl px-5 py-4 text-sm font-bold text-white outline-none focus:border-ef-accent/50 appearance-none cursor-pointer transition-all shadow-inner"
                        >
                            <option value="club">🛡️ Club</option>
                            <option value="league">🏆 League</option>
                            <option value="national">🌍 Nation</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-[10px] font-black uppercase tracking-widest text-white/40 mb-2 ml-1">From (Unlicensed / wrong name)</label>
                        <AutocompleteInput
                            value={from}
                            onChange={setFrom}
                            suggestions={typeSuggestions}
                            placeholder="Unlicensed / wrong name…"
                            className="w-full bg-black/40 border border-white/10 rounded-2xl px-5 py-4 text-sm font-bold text-white outline-none focus:border-ef-accent/50 transition-all shadow-inner"
                        />
                    </div>

                    <div>
                        <label className="block text-[10px] font-black uppercase tracking-widest text-white/40 mb-2 ml-1">To (Correct name)</label>
                        <AutocompleteInput
                            value={to}
                            onChange={setTo}
                            suggestions={typeSuggestions}
                            placeholder="Correct name…"
                            className="w-full bg-black/40 border border-white/10 rounded-2xl px-5 py-4 text-sm font-bold text-white outline-none focus:border-ef-accent/50 transition-all shadow-inner"
                        />
                    </div>

                    <div className="pt-4 flex gap-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-4 px-6 rounded-2xl bg-white/5 border border-white/10 text-white font-black uppercase tracking-widest text-[10px] transition-all hover:bg-white/10"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSaving || !from.trim() || !to.trim()}
                            className={`flex-1 py-4 px-6 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all shadow-lg flex items-center justify-center gap-2 ${
                                isSaving || !from.trim() || !to.trim()
                                    ? 'bg-white/5 text-white/20 cursor-not-allowed border border-white/5'
                                    : 'bg-ef-accent text-ef-dark hover:scale-[1.02] active:scale-95 shadow-ef-accent/20'
                            }`}
                        >
                            {isSaving ? 'Adding Rule...' : 'Add Rule'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
