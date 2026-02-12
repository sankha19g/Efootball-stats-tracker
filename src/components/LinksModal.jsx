import { useState, useEffect } from 'react';
import { getLinks, addLink, deleteLink } from '../services/miscService';

const LinksModal = ({ user, onClose, onAddApp }) => {
    const [links, setLinks] = useState([]);
    const [newLink, setNewLink] = useState({ name: '', url: '', icon: null });
    const [loading, setLoading] = useState(true);

    const fetchLinks = async () => {
        if (!user) {
            setLinks([]);
            setLoading(false);
            return;
        }

        try {
            const data = await getLinks(user.uid);
            setLinks(data);
        } catch (err) {
            console.error('Error fetching links:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLinks();
    }, [user]);

    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setNewLink(prev => ({ ...prev, icon: reader.result }));
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!newLink.name || !newLink.url || !user) return;

        // Ensure URL has protocol
        let url = newLink.url;
        if (!/^https?:\/\//i.test(url)) {
            url = 'https://' + url;
        }

        try {
            const addedLink = await addLink(user.uid, { ...newLink, url });
            setLinks(prev => [addedLink, ...prev]);
            setNewLink({ name: '', url: '', icon: null });
        } catch (err) {
            console.error('Error saving link:', err);
        }
    };

    const handleDelete = async (index, linkId) => {
        if (!user) return;

        try {
            const oldLinks = [...links];
            setLinks(prev => prev.filter((_, i) => i !== index));

            await deleteLink(user.uid, linkId);
        } catch (err) {
            console.error('Error deleting link:', err);
            // Revert on error
            fetchLinks();
        }
    };

    if (!user) return null;

    return (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-[100] p-4 animate-fade-in">
            <div className="bg-ef-card w-full max-w-2xl rounded-3xl border border-white/10 flex flex-col overflow-hidden shadow-2xl relative">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-ef-accent to-green-500"></div>

                <button
                    onClick={onClose}
                    className="absolute top-4 left-4 md:left-auto md:right-4 z-50 p-2 md:p-2.5 rounded-xl bg-black/40 md:bg-white/5 hover:bg-black/60 md:hover:bg-white/10 text-white transition-all active:scale-95 border border-white/10"
                >
                    <span className="hidden md:block">✕</span>
                    <span className="md:hidden text-xl font-bold">←</span>
                </button>

                <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/5">
                    <div>
                        <h2 className="text-2xl font-black flex items-center gap-3 pt-6 md:pt-0">
                            <span className="text-ef-accent text-3xl">🔗</span>
                            <span className="bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">Quick Links</span>
                        </h2>
                        <p className="text-xs opacity-40 font-bold uppercase tracking-widest mt-1">Access your favorite eFootball resources</p>
                    </div>
                </div>

                <div className="p-8 space-y-8">
                    {/* Add Link Form */}
                    <form onSubmit={handleSubmit} className="bg-black/20 p-6 rounded-2xl border border-white/5 space-y-4">
                        <div className="flex flex-col sm:flex-row gap-4">
                            {/* Icon Upload */}
                            <div className="w-20 h-20 flex-shrink-0 bg-white/5 border border-white/10 rounded-xl overflow-hidden relative group/upload mx-auto sm:mx-0">
                                {newLink.icon ? (
                                    <img src={newLink.icon} alt="Icon" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-2xl grayscale opacity-30">🖼️</div>
                                )}
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleImageUpload}
                                    className="absolute inset-0 opacity-0 cursor-pointer z-10"
                                />
                                <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover/upload:opacity-100 transition text-[8px] font-bold text-center uppercase tracking-widest">
                                    {newLink.icon ? 'Change' : 'Upload Icon'}
                                </div>
                            </div>

                            <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-black uppercase tracking-widest opacity-40 mb-2 ml-1">Link Name</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. eFootballDB"
                                        value={newLink.name}
                                        onChange={(e) => setNewLink({ ...newLink, name: e.target.value })}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm font-bold text-white outline-none focus:border-ef-accent transition-all"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black uppercase tracking-widest opacity-40 mb-2 ml-1">URL</label>
                                    <input
                                        type="text"
                                        placeholder="efootballdb.com"
                                        value={newLink.url}
                                        onChange={(e) => setNewLink({ ...newLink, url: e.target.value })}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm font-bold text-white outline-none focus:border-ef-accent transition-all"
                                    />
                                </div>
                            </div>
                        </div>
                        <button
                            type="submit"
                            className="w-full py-3 bg-ef-accent text-ef-dark font-black rounded-xl hover:opacity-90 transition-all uppercase tracking-widest text-xs shadow-lg shadow-ef-accent/10"
                        >
                            ➕ Add New Link
                        </button>
                    </form>

                    {/* Links List */}
                    <div className="space-y-3 min-h-[200px] max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                        {loading ? (
                            <div className="text-center py-10 opacity-30">Loading Links...</div>
                        ) : links.length === 0 ? (
                            <div className="text-center py-10 opacity-20 italic">No links added yet</div>
                        ) : (
                            links.map((link, index) => (
                                <div key={link.id || index} className="group flex flex-col sm:flex-row sm:items-center justify-between bg-white/5 hover:bg-white/10 p-4 rounded-xl border border-white/5 transition-all gap-4">
                                    <div className="flex items-center gap-4 flex-1 min-w-0">
                                        <div className="w-12 h-12 rounded-xl bg-ef-accent/10 flex items-center justify-center text-xl overflow-hidden flex-shrink-0 border border-white/10 shadow-lg">
                                            {link.icon ? (
                                                <img src={link.icon} alt={link.name} className="w-full h-full object-cover" />
                                            ) : (
                                                <span className="grayscale group-hover:grayscale-0 transition-all text-2xl">🌍</span>
                                            )}
                                        </div>
                                        <div className="min-w-0">
                                            <div className="font-bold text-white truncate">{link.name}</div>
                                            <div className="text-[10px] opacity-30 truncate">{link.url}</div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 justify-between sm:justify-end w-full sm:w-auto pt-3 sm:pt-0 border-t sm:border-0 border-white/5">
                                        <div className="flex items-center gap-2">
                                            {/* Open Button */}
                                            <a
                                                href={link.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="p-2.5 bg-blue-500/10 text-blue-400 hover:bg-blue-500 hover:text-white rounded-lg transition-all"
                                                title="Open Link"
                                            >
                                                ↗
                                            </a>

                                            {/* Edit Button */}
                                            <button
                                                onClick={() => {
                                                    setNewLink({ name: link.name, url: link.url, icon: link.icon });
                                                    handleDelete(index, link.id); // Remove old to simulate edit
                                                }}
                                                className="p-2.5 bg-white/5 text-white/40 hover:bg-white/10 hover:text-white rounded-lg transition-all"
                                                title="Edit Link"
                                            >
                                                ✎
                                            </button>

                                            {/* Add App Shortcut */}
                                            <button
                                                onClick={() => onAddApp && onAddApp({ name: link.name, url: link.url, icon: link.icon })}
                                                className="p-2.5 bg-ef-accent/10 text-ef-accent hover:bg-ef-accent hover:text-black rounded-lg transition-all"
                                                title="Add to Apps Drawer"
                                            >
                                                📱
                                            </button>
                                        </div>

                                        {/* Delete Button */}
                                        <button
                                            onClick={() => handleDelete(index, link.id)}
                                            className="p-2.5 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-lg transition-all"
                                            title="Delete Link"
                                        >
                                            🗑️
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LinksModal;
