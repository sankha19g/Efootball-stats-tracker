import { useState } from 'react';
import API_URL from '../config/api';
import { saveToGlobalDatabase } from '../services/playerService';

const ScrapeDataModal = ({ isOpen, onClose, onScrapeSuccess }) => {
    const [url, setUrl] = useState('');
    const [isScraping, setIsScraping] = useState(false);
    const [error, setError] = useState('');
    const [scrapedPlayers, setScrapedPlayers] = useState(null);
    const [stats, setStats] = useState({ added: 0, updated: 0 });

    if (!isOpen) return null;

    const handleClose = () => {
        setUrl('');
        setScrapedPlayers(null);
        setError('');
        onClose();
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

            // Save to Community/Global Database if we found players
            if (data.players && data.players.length > 0) {
                try {
                    await saveToGlobalDatabase(data.players);
                } catch (saveErr) {
                    console.error("Firestore global save failed:", saveErr);
                }
            }

            setScrapedPlayers(data.players || []);
            setStats({
                added: data.added || 0,
                updated: data.updated || 0
            });
            setError('');
            if (onScrapeSuccess) onScrapeSuccess(data);
        } catch (err) {
            console.error('Error during scraping:', err);
            setError(err.message || 'An error occurred while scraping data.');
        } finally {
            setIsScraping(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={handleClose} />

            <div className={`relative w-full ${scrapedPlayers ? 'max-w-4xl' : 'max-w-md'} bg-[#1a1f26] border border-white/10 rounded-2xl p-6 shadow-2xl animate-fade-in-up transition-all duration-300`}>
                <button
                    onClick={handleClose}
                    className="absolute top-4 right-4 text-white/40 hover:text-white transition-colors p-2"
                >
                    ✕
                </button>

                {!scrapedPlayers ? (
                    <>
                        <h2 className="text-xl font-black uppercase text-ef-accent tracking-wider mb-2">Scrape PESDB Data</h2>
                        <p className="text-xs text-white/50 mb-6">
                            Paste one or multiple PESDB links (each on a new line) to automatically import players in bulk.
                        </p>

                        <div className="space-y-4">
                            <div>
                                <textarea
                                    placeholder={`https://pesdb.net/pes2022/?featured=1\nhttps://pesdb.net/pes2022/?epic=2`}
                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-ef-accent/50 text-white placeholder:text-white/20 font-mono resize-none h-32 leading-relaxed"
                                    value={url}
                                    onChange={(e) => setUrl(e.target.value)}
                                    disabled={isScraping}
                                />
                                {error && <p className="text-red-400 text-[10px] mt-2 font-bold uppercase">{error}</p>}
                            </div>

                            <div className="flex justify-end gap-3 mt-8">
                                <button
                                    onClick={handleClose}
                                    className="px-5 py-2.5 rounded-xl font-bold text-xs uppercase text-white/50 hover:text-white hover:bg-white/5 transition-colors disabled:opacity-50"
                                    disabled={isScraping}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleScrape}
                                    className={`px-5 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest text-ef-dark bg-ef-accent transition-all flex items-center gap-2 ${isScraping ? 'opacity-70 cursor-wait' : 'hover:scale-105 active:scale-95'}`}
                                    disabled={isScraping}
                                >
                                    {isScraping ? (
                                        <>
                                            <div className="w-3 h-3 border-2 border-ef-dark border-t-transparent rounded-full animate-spin" />
                                            Scraping...
                                        </>
                                    ) : (
                                        <>
                                            <span>🕸️</span> Start Scrape
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="flex flex-col h-[70vh]">
                        <div className="flex justify-between items-end mb-4 pr-8">
                            <div>
                                <h2 className="text-xl font-black uppercase text-ef-accent tracking-wider mb-1">Scrape Successful</h2>
                                <p className="text-xs text-white/50">
                                    Found <strong className="text-white">{scrapedPlayers.length}</strong> players.
                                </p>
                            </div>
                        </div>

                        <div className="flex-1 overflow-auto border border-white/10 rounded-xl bg-black/40 relative">
                            <table className="w-full text-left text-xs whitespace-nowrap">
                                <thead className="sticky top-0 bg-[#0a0f16] border-b border-white/10 z-10 text-[9px] uppercase tracking-widest text-white/40">
                                    <tr>
                                        <th className="px-4 py-3 font-bold w-12 text-center">Img</th>
                                        <th className="px-4 py-3 font-bold">Name</th>
                                        <th className="px-4 py-3 font-bold w-16 text-center">Pos</th>
                                        <th className="px-4 py-3 font-bold">Playstyle</th>
                                        <th className="px-4 py-3 font-bold">Club</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {scrapedPlayers.map((player, idx) => (
                                        <tr key={player.id || idx} className="hover:bg-white/5 transition-colors group">
                                            <td className="px-4 py-2">
                                                <div className="w-10 h-14 rounded-lg overflow-hidden border border-white/10 bg-black/20">
                                                    <img src={player.image} alt="" className="w-full h-full object-cover object-top" />
                                                </div>
                                            </td>
                                            <td className="px-4 py-2">
                                                <div className="font-black uppercase text-sm">{player.name}</div>
                                                <div className="text-[10px] opacity-40">{player.nationality}</div>
                                            </td>
                                            <td className="px-4 py-2 text-center">
                                                <span className="bg-ef-accent text-ef-dark px-1.5 py-0.5 rounded text-[10px] font-black">{player.position}</span>
                                            </td>
                                            <td className="px-4 py-2 text-white/60 font-medium italic">{player.playstyle}</td>
                                            <td className="px-4 py-2">
                                                <div className="flex items-center gap-2">
                                                    {player.club_badge_url && <img src={player.club_badge_url} className="w-4 h-4 object-contain" alt="" />}
                                                    <span className="opacity-80">{player.club_original || player.club}</span>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="mt-6 flex justify-between items-center bg-[#1a1f26]">
                            <p className="text-[10px] text-white/30 uppercase font-bold max-w-sm">
                                Players have been saved to the community database and are now searchable in the explorer.
                            </p>
                            <button
                                onClick={handleClose}
                                className="px-8 py-3 rounded-xl bg-ef-accent text-ef-dark font-black text-xs uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-[0_0_20px_rgba(0,255,136,0.3)]"
                            >
                                Finish
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ScrapeDataModal;
