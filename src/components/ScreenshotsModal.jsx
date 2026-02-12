import { useState, useEffect } from 'react';
import { getScreenshots, addScreenshot, deleteScreenshot } from '../services/miscService';

const ScreenshotsModal = ({ user, onClose }) => {
    const [screenshots, setScreenshots] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchScreenshots = async () => {
        if (!user) {
            setScreenshots([]);
            setLoading(false);
            return;
        }

        try {
            const data = await getScreenshots(user.uid);
            setScreenshots(data);
        } catch (err) {
            console.error('Error fetching screenshots:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchScreenshots();
    }, [user]);

    const handleUpload = async (e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0 || !user) return;

        setLoading(true);
        try {
            const newScreenshots = await Promise.all(
                files.map(file => addScreenshot(user.uid, file))
            );

            // Format for display
            const formatted = newScreenshots.map(s => ({
                id: s.id,
                url: s.url
            }));

            setScreenshots(prev => [...prev, ...formatted]);
        } catch (err) {
            console.error('Error uploading screenshots:', err);
            alert("Failed to upload screenshot");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (index, screenshot) => {
        if (!user) return;

        try {
            // Optimistic update
            const oldScreenshots = [...screenshots];
            setScreenshots(prev => prev.filter((_, i) => i !== index));

            await deleteScreenshot(user.uid, screenshot.id, screenshot.url);
        } catch (err) {
            console.error('Error deleting screenshot:', err);
            alert("Failed to delete screenshot");
            fetchScreenshots(); // Revert
        }
    };

    if (!user) return null;

    return (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-[100] p-4 animate-fade-in">
            <div className="bg-ef-card w-full max-w-5xl max-h-[90vh] rounded-3xl border border-white/10 flex flex-col overflow-hidden shadow-2xl relative">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-indigo-600"></div>

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
                            <span className="text-blue-400 text-3xl">🖼️</span>
                            <span className="bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">Game Screenshots</span>
                        </h2>
                        <p className="text-xs opacity-40 font-bold uppercase tracking-widest mt-1">Store and view your in-game memories</p>
                    </div>
                    <div className="flex gap-4 items-center">
                        <label className="cursor-pointer bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2 shadow-lg shadow-blue-600/20 active:scale-95">
                            <span>📤 Upload New</span>
                            <input type="file" multiple accept="image/*" onChange={handleUpload} className="hidden" />
                        </label>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-8">
                    {loading ? (
                        <div className="h-full flex items-center justify-center opacity-30">Loading Gallery...</div>
                    ) : screenshots.length === 0 ? (
                        <div className="h-64 flex flex-col items-center justify-center opacity-20 border-2 border-dashed border-white/10 rounded-2xl">
                            <span className="text-6xl mb-4">📸</span>
                            <span className="text-sm font-bold uppercase tracking-widest">No screenshots uploaded yet</span>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {screenshots.map((item, index) => (
                                <div key={item.id || index} className="group relative aspect-video rounded-2xl overflow-hidden border border-white/10 bg-white/5 hover:border-blue-500/50 transition-all shadow-xl">
                                    <img src={item.url} alt={`Screenshot ${index}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                                        <button
                                            onClick={() => window.open(item.url, '_blank')}
                                            className="p-3 rounded-full bg-white/10 hover:bg-white/20 text-white border border-white/20 backdrop-blur-sm transition-all"
                                            title="View Full"
                                        >
                                            👁️
                                        </button>
                                        <button
                                            onClick={() => handleDelete(index, item)}
                                            className="p-3 rounded-full bg-red-500/20 hover:bg-red-500 text-white border border-red-500/20 backdrop-blur-sm transition-all"
                                            title="Delete"
                                        >
                                            🗑️
                                        </button>
                                    </div>
                                    <div className="absolute bottom-3 left-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <span className="text-[10px] font-black uppercase tracking-tighter bg-black/60 backdrop-blur-md px-2 py-1 rounded-md text-white/60">IMG_{index + 1}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ScreenshotsModal;
