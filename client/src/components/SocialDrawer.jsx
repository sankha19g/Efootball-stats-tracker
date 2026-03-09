import { useState, useEffect, useCallback, useRef } from 'react';
import API_URL from '../config/api';

const DEFAULT_SUBREDDITS = [
    { name: 'eFootball', label: 'eFootball', color: '#00FF88', icon: '⚽' },
    { name: 'pesmobile', label: 'PES Mobile', color: '#3B82F6', icon: '📱' },
    { name: 'EfootballTrading', label: 'Trading', color: '#F59E0B', icon: '💹' },
    { name: 'pesmasters', label: 'PES Masters', color: '#8B5CF6', icon: '🏆' },
];

const ICON_OPTIONS = ['⚽', '📱', '💹', '🏆', '🎮', '🔥', '⭐', '🏅', '📊', '💎', '🎯', '🌍'];
const COLOR_OPTIONS = ['#00FF88', '#3B82F6', '#F59E0B', '#8B5CF6', '#EF4444', '#EC4899', '#06B6D4', '#F97316'];

const loadSubs = () => {
    try {
        const saved = localStorage.getItem('ef-social-subs');
        if (saved) return JSON.parse(saved);
    } catch (_) { }
    return DEFAULT_SUBREDDITS;
};
const saveSubs = (subs) => {
    try { localStorage.setItem('ef-social-subs', JSON.stringify(subs)); } catch (_) { }
};

const timeAgo = (utcSeconds) => {
    const diff = Math.floor(Date.now() / 1000) - utcSeconds;
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
};
const fmt = (n) => n >= 1000 ? (n / 1000).toFixed(1) + 'k' : (n?.toString() ?? '0');

const getPostImage = (data) => {
    try {
        const images = data.preview?.images;
        if (images?.length > 0) {
            const res = images[0].resolutions;
            if (res?.length > 0) {
                const best = res.find(r => r.width >= 400) || res[res.length - 1];
                if (best?.url) return best.url;
            }
            if (images[0].source?.url) return images[0].source.url;
        }
    } catch (_) { }
    if (data.thumbnail?.startsWith('http')) return data.thumbnail;
    return null;
};

/* ─── PostCard ─── */
const PostCard = ({ post, accentColor }) => {
    const { title, score, num_comments, author, created_utc, permalink,
        link_flair_text, is_video, post_hint, selftext } = post.data;
    const imageUrl = getPostImage(post.data);
    const isTextPost = post_hint === 'self' || (!imageUrl && !is_video);
    const [imgError, setImgError] = useState(false);
    const showImage = imageUrl && !imgError;

    return (
        <a href={`https://reddit.com${permalink}`} target="_blank" rel="noopener noreferrer" className="block group mb-3">
            <div className="relative bg-white/[0.04] hover:bg-white/[0.07] border border-white/[0.07] hover:border-white/20 rounded-2xl overflow-hidden transition-all duration-200 shadow-lg hover:shadow-xl hover:-translate-y-[1px]">
                {showImage && (
                    <div className="relative w-full overflow-hidden" style={{ aspectRatio: '16/9' }}>
                        <img src={imageUrl} alt={title}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                            onError={() => setImgError(true)} loading="lazy" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                        {is_video && (
                            <div className="absolute top-2 right-2 px-2 py-1 rounded-lg bg-black/60 backdrop-blur-sm border border-white/10">
                                <span className="text-[8px] text-white/80 font-black uppercase tracking-widest">▶ Video</span>
                            </div>
                        )}
                        {link_flair_text && (
                            <div className="absolute bottom-2 left-2">
                                <span className="inline-block text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full text-black"
                                    style={{ backgroundColor: accentColor || '#00FF88' }}>{link_flair_text}</span>
                            </div>
                        )}
                    </div>
                )}
                <div className="p-3">
                    {link_flair_text && !showImage && (
                        <span className="inline-block text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full text-black mb-2"
                            style={{ backgroundColor: accentColor || '#00FF88' }}>{link_flair_text}</span>
                    )}
                    <p className="text-[12px] font-bold text-white/90 group-hover:text-white leading-snug line-clamp-3 transition-colors duration-150 mb-2">{title}</p>
                    {isTextPost && selftext && (
                        <p className="text-[10px] text-white/35 leading-relaxed line-clamp-2 mb-2">{selftext}</p>
                    )}
                    <div className="flex items-center gap-3 pt-2 border-t border-white/[0.05]">
                        <div className="flex-1 min-w-0">
                            <span className="text-[9px] text-white/30 font-medium truncate">u/{author} · {timeAgo(created_utc)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <span className="text-[10px]" style={{ color: accentColor || '#00FF88' }}>▲</span>
                            <span className="text-[10px] font-black" style={{ color: accentColor || '#00FF88' }}>{fmt(score)}</span>
                        </div>
                        <div className="flex items-center gap-1 text-white/30 group-hover:text-white/50 transition-colors">
                            <span className="text-[10px]">💬</span>
                            <span className="text-[10px] font-bold">{fmt(num_comments)}</span>
                        </div>
                    </div>
                </div>
            </div>
        </a>
    );
};

/* ─── Settings Panel ─── */
const SettingsPanel = ({ subreddits, onSave, onBack }) => {
    const [list, setList] = useState(subreddits);
    const [newName, setNewName] = useState('');
    const [newLabel, setNewLabel] = useState('');
    const [newIcon, setNewIcon] = useState('🎮');
    const [newColor, setNewColor] = useState('#00FF88');
    const [addError, setAddError] = useState('');
    const inputRef = useRef(null);

    useEffect(() => { inputRef.current?.focus(); }, []);

    const handleAdd = () => {
        const trimmed = newName.trim().replace(/^r\//i, '');
        if (!trimmed) { setAddError('Enter a subreddit name'); return; }
        if (list.find(s => s.name.toLowerCase() === trimmed.toLowerCase())) {
            setAddError('Already in your list'); return;
        }
        setAddError('');
        setList(prev => [...prev, { name: trimmed, label: newLabel.trim() || trimmed, icon: newIcon, color: newColor }]);
        setNewName(''); setNewLabel('');
    };

    const handleDelete = (name) => setList(prev => prev.filter(s => s.name !== name));

    const handleSave = () => {
        if (list.length === 0) { setAddError('Add at least one subreddit'); return; }
        onSave(list);
        onBack();
    };

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06] flex-shrink-0">
                <div>
                    <h3 className="text-sm font-black text-white uppercase tracking-tight">Manage Subreddits</h3>
                    <p className="text-[9px] text-white/25 uppercase tracking-widest mt-0.5">Add or remove feeds</p>
                </div>
                <button onClick={onBack}
                    className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center text-white/40 hover:bg-white/10 hover:text-white transition-all text-sm">
                    ←
                </button>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-4 custom-scrollbar space-y-4">
                {/* Current list */}
                <div>
                    <p className="text-[9px] font-black uppercase tracking-widest text-white/30 mb-2">Your Subreddits</p>
                    <div className="space-y-2">
                        {list.map(sub => (
                            <div key={sub.name} className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.06]">
                                <span className="text-lg">{sub.icon}</span>
                                <div className="flex-1 min-w-0">
                                    <p className="text-[11px] font-bold text-white/90 truncate">{sub.label}</p>
                                    <p className="text-[9px] text-white/30 truncate">r/{sub.name}</p>
                                </div>
                                <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: sub.color }} />
                                <button onClick={() => handleDelete(sub.name)}
                                    className="w-7 h-7 rounded-lg bg-red-500/10 text-red-400/60 hover:bg-red-500/25 hover:text-red-400 flex items-center justify-center transition-all text-xs font-black flex-shrink-0">
                                    ✕
                                </button>
                            </div>
                        ))}
                        {list.length === 0 && (
                            <p className="text-[10px] text-white/20 text-center py-4">No subreddits. Add one below.</p>
                        )}
                    </div>
                </div>

                <div className="border-t border-white/[0.05]" />

                {/* Add new */}
                <div>
                    <p className="text-[9px] font-black uppercase tracking-widest text-white/30 mb-2">Add New</p>
                    <div className="space-y-2">
                        <div className="flex items-center gap-2 bg-white/[0.04] border border-white/[0.06] rounded-xl px-3 py-2">
                            <span className="text-[10px] text-white/30 font-bold flex-shrink-0">r/</span>
                            <input ref={inputRef} type="text" placeholder="subredditname" value={newName}
                                onChange={e => { setNewName(e.target.value); setAddError(''); }}
                                onKeyDown={e => e.key === 'Enter' && handleAdd()}
                                className="flex-1 bg-transparent text-[11px] text-white/90 placeholder-white/20 outline-none" />
                        </div>
                        <input type="text" placeholder="Display label (optional)" value={newLabel}
                            onChange={e => setNewLabel(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleAdd()}
                            className="w-full bg-white/[0.04] border border-white/[0.06] rounded-xl px-3 py-2 text-[11px] text-white/90 placeholder-white/20 outline-none focus:border-white/20 transition-colors" />
                        <div>
                            <p className="text-[8px] text-white/25 uppercase tracking-widest mb-1.5">Icon</p>
                            <div className="flex flex-wrap gap-1.5">
                                {ICON_OPTIONS.map(ic => (
                                    <button key={ic} onClick={() => setNewIcon(ic)}
                                        className={`w-8 h-8 rounded-lg text-base transition-all ${newIcon === ic ? 'bg-white/20 ring-1 ring-white/40 scale-110' : 'bg-white/[0.04] hover:bg-white/10'}`}>
                                        {ic}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div>
                            <p className="text-[8px] text-white/25 uppercase tracking-widest mb-1.5">Color</p>
                            <div className="flex gap-1.5 flex-wrap">
                                {COLOR_OPTIONS.map(c => (
                                    <button key={c} onClick={() => setNewColor(c)}
                                        className={`w-7 h-7 rounded-full transition-all ${newColor === c ? 'ring-2 ring-white/60 scale-110' : 'hover:scale-105'}`}
                                        style={{ backgroundColor: c }} />
                                ))}
                            </div>
                        </div>
                        {addError && <p className="text-[9px] text-red-400/80">{addError}</p>}
                        <button onClick={handleAdd}
                            className="w-full py-2 rounded-xl text-[10px] font-black uppercase tracking-widest bg-white/[0.06] text-white/60 hover:bg-white/10 hover:text-white transition-all border border-white/[0.08] active:scale-95">
                            + Add Subreddit
                        </button>
                    </div>
                </div>
            </div>

            {/* Save */}
            <div className="flex-shrink-0 p-4 border-t border-white/[0.05]">
                <button onClick={handleSave}
                    className="w-full py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest bg-gradient-to-r from-[#00FF88] to-[#3B82F6] text-black hover:opacity-90 transition-all active:scale-95 shadow-lg">
                    Save Changes
                </button>
            </div>
        </div>
    );
};

/* ─── Feed View ─── */
const FeedView = ({
    subreddits, activeSub, setActiveSub, sortBy, setSortBy,
    loading, error, currentPosts, activeMeta,
    onRefresh, onOpenSettings, onClose
}) => (
    <>
        {/* Header */}
        <div className="flex-shrink-0 p-5 border-b border-white/[0.06] bg-black/30">
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h2 className="text-lg font-black bg-gradient-to-r from-[#00FF88] to-[#3B82F6] bg-clip-text text-transparent tracking-tighter uppercase">
                        Community
                    </h2>
                    <p className="text-[9px] uppercase font-black tracking-widest opacity-25 mt-0.5">Reddit Feed</p>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={onOpenSettings}
                        className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center text-white/40 hover:bg-white/10 hover:text-white transition-all text-base"
                        title="Manage subreddits">
                        ⚙️
                    </button>
                    <button onClick={onClose}
                        className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center text-white/40 hover:bg-red-500/20 hover:text-red-400 transition-all text-sm">
                        ✕
                    </button>
                </div>
            </div>
            {/* Tabs */}
            <div className="flex gap-1.5 flex-wrap">
                {subreddits.map(sub => (
                    <button key={sub.name} onClick={() => setActiveSub(sub.name)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all duration-200 ${activeSub === sub.name ? 'text-black shadow-lg scale-105' : 'bg-white/5 text-white/40 hover:bg-white/10 hover:text-white/70'}`}
                        style={activeSub === sub.name ? { backgroundColor: sub.color } : {}}>
                        <span className="text-sm">{sub.icon}</span>
                        <span className="hidden sm:inline">{sub.label}</span>
                    </button>
                ))}
            </div>
            {/* Sort + Refresh */}
            <div className="flex items-center gap-2 mt-3">
                {['hot', 'new', 'top'].map(s => (
                    <button key={s} onClick={() => setSortBy(s)}
                        className={`flex-1 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${sortBy === s ? 'bg-white/15 text-white' : 'text-white/30 hover:text-white/60'}`}>
                        {s === 'hot' ? '🔥' : s === 'new' ? '✨' : '🏆'} {s}
                    </button>
                ))}
                <button onClick={onRefresh} disabled={loading}
                    className="px-2.5 py-1 rounded-lg bg-white/5 text-white/30 hover:text-white/60 hover:bg-white/10 transition-all text-sm disabled:opacity-30 disabled:cursor-not-allowed"
                    title="Refresh">
                    {loading ? '⏳' : '↻'}
                </button>
            </div>
        </div>

        {/* Label */}
        <div className="flex-shrink-0 px-4 py-2 flex items-center gap-2">
            <span className="text-[9px] font-black uppercase tracking-widest text-white/20">r/</span>
            <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: activeMeta?.color ?? '#fff' }}>
                {activeSub}
            </span>
        </div>

        {/* Posts */}
        <div className="flex-1 overflow-y-auto px-3 pb-6 custom-scrollbar">
            {loading && currentPosts.length === 0 && (
                <div className="flex flex-col items-center justify-center py-16 gap-3">
                    <div className="w-8 h-8 border-2 border-[#00FF88]/30 border-t-[#00FF88] rounded-full animate-spin" />
                    <p className="text-[10px] text-white/30 uppercase tracking-widest">Loading posts…</p>
                </div>
            )}
            {error && (
                <div className="mx-1 mt-4 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-center">
                    <p className="text-[10px] text-red-400/80 leading-relaxed">{error}</p>
                    <button onClick={onRefresh}
                        className="mt-3 px-4 py-1.5 rounded-lg bg-red-500/20 text-red-400 text-[10px] font-black uppercase tracking-widest hover:bg-red-500/30 transition-all">
                        Retry
                    </button>
                </div>
            )}
            {!loading && !error && currentPosts.length === 0 && (
                <div className="flex flex-col items-center justify-center py-16 gap-2">
                    <span className="text-3xl opacity-30">📭</span>
                    <p className="text-[10px] text-white/20 uppercase tracking-widest">No posts found</p>
                </div>
            )}
            {currentPosts.map((post, i) => (
                <PostCard key={post.data.id ?? i} post={post} accentColor={activeMeta?.color} />
            ))}
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 px-4 py-3 border-t border-white/[0.05] bg-black/20 flex items-center justify-between">
            <p className="text-[8px] uppercase font-black tracking-widest opacity-15">Powered by Reddit API</p>
            <a href={`https://reddit.com/r/${activeSub}`} target="_blank" rel="noopener noreferrer"
                className="text-[8px] font-black uppercase tracking-widest text-[#FF4500]/40 hover:text-[#FF4500]/80 transition-colors">
                Open r/{activeSub} ↗
            </a>
        </div>
    </>
);

/* ─── Main Drawer ─── */
const SocialDrawer = ({ isOpen, onClose }) => {
    const [subreddits, setSubreddits] = useState(loadSubs);
    const [activeSub, setActiveSub] = useState(() => loadSubs()[0]?.name ?? 'eFootball');
    const [posts, setPosts] = useState({});
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [sortBy, setSortBy] = useState('hot');
    const [showSettings, setShowSettings] = useState(false);

    const fetchPosts = useCallback(async (sub, sort) => {
        const key = `${sub}_${sort}`;
        if (posts[key]) return;
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(`${API_URL}/api/reddit/${sub}/${sort}?limit=20`);
            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                throw new Error(errData.error || `Server returned ${res.status}`);
            }
            const data = await res.json();
            const fetched = (data?.posts ?? []).filter(p => !p.data?.stickied);
            setPosts(prev => ({ ...prev, [key]: fetched }));
        } catch (err) {
            setError('Failed to load posts. Make sure the backend server is running.');
            console.error('Reddit fetch error:', err);
        } finally {
            setLoading(false);
        }
    }, [posts]);

    useEffect(() => {
        if (isOpen && !showSettings) fetchPosts(activeSub, sortBy);
    }, [isOpen, activeSub, sortBy, showSettings]);

    const handleRefresh = () => {
        const key = `${activeSub}_${sortBy}`;
        setPosts(prev => { const n = { ...prev }; delete n[key]; return n; });
        setTimeout(() => fetchPosts(activeSub, sortBy), 50);
    };

    const handleSaveSettings = (newSubs) => {
        setSubreddits(newSubs);
        saveSubs(newSubs);
        const stillActive = newSubs.find(s => s.name === activeSub);
        if (!stillActive && newSubs.length > 0) setActiveSub(newSubs[0].name);
        setPosts({});
    };

    const currentKey = `${activeSub}_${sortBy}`;
    const currentPosts = posts[currentKey] ?? [];
    const activeMeta = subreddits.find(s => s.name === activeSub);

    return (
        <>
            <div className={`fixed inset-0 z-[120] pointer-events-none ${isOpen ? 'pointer-events-auto' : ''}`}>
                {/* Backdrop */}
                <div
                    className={`absolute inset-0 bg-black/60 backdrop-blur-md transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0'}`}
                    onClick={onClose}
                />

                {/* Drawer */}
                <div className={`absolute inset-y-0 left-0 w-[300px] sm:w-[340px] bg-[#08090b] border-r border-white/10
                    transform transition-transform duration-300 overflow-hidden flex flex-col
                    shadow-[20px_0_80px_rgba(0,0,0,0.7)]
                    ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>

                    {showSettings ? (
                        <SettingsPanel
                            subreddits={subreddits}
                            onSave={handleSaveSettings}
                            onBack={() => setShowSettings(false)}
                        />
                    ) : (
                        <FeedView
                            subreddits={subreddits}
                            activeSub={activeSub}
                            setActiveSub={setActiveSub}
                            sortBy={sortBy}
                            setSortBy={setSortBy}
                            loading={loading}
                            error={error}
                            currentPosts={currentPosts}
                            activeMeta={activeMeta}
                            onRefresh={handleRefresh}
                            onOpenSettings={() => setShowSettings(true)}
                            onClose={onClose}
                        />
                    )}
                </div>
            </div>
        </>
    );
};

export default SocialDrawer;
