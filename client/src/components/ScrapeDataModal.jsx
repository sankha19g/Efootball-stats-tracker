import { useState } from 'react';
import API_URL from '../config/api';

const ScrapeDataModal = ({ isOpen, onClose, onScrapeSuccess }) => {
    const [url, setUrl] = useState('');
    const [isScraping, setIsScraping] = useState(false);
    const [error, setError] = useState('');
    const [scrapedPlayers, setScrapedPlayers] = useState(null); // Will store the array of players once done
    const [stats, setStats] = useState({ added: 0, updated: 0 });

    if (!isOpen) return null;

    const handleClose = () => {
        // Reset state on close
        setUrl('');
        setScrapedPlayers(null);
        setError('');
        onClose();
    }

    const handleScrape = async () => {
        if (!url) {
            setError('Please enter a PESDB URL');
            return;
        }

        setError('');
        setIsScraping(true);

        try {
            const response = await fetch(`${API_URL}/api/scrape`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ url })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to scrape data');
            }

            console.log('Scrape successful:', data);

            // Set stats and show confirmation list
            setStats({ added: data.added, updated: data.updated });
            setScrapedPlayers(data.players || []);

            // Call success callback immediately so parent knows to refresh the background list 
            // but we keep modal open to show the confirmation list
            onScrapeSuccess && onScrapeSuccess(data);
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

            {/* Conditional max-width based on state (wide for table, normal for input) */}
            <div className={`relative w-full ${scrapedPlayers ? 'max-w-4xl' : 'max-w-md'} bg-[#1a1f26] border border-white/10 rounded-2xl p-6 shadow-2xl animate-fade-in-up transition-all duration-300`}>
                <button
                    onClick={handleClose}
                    className="absolute top-4 right-4 text-white/40 hover:text-white transition-colors p-2"
                >
                    ✕
                </button>

                {!scrapedPlayers ? (
                    // ---------------- INPUT VIEW ----------------
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
                                    className={`px-5 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest text-ef-dark bg-ef-accent transition-all flex items-center gap-2 ${isScraping
                                        ? 'opacity-70 cursor-wait'
                                        : 'hover:scale-105 active:scale-95 shadow-[0_0_15px_rgba(0,255,136,0.2)] hover:shadow-[0_0_20px_rgba(0,255,136,0.4)]'
                                        }`}
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
                    // ---------------- CONFIRMATION LIST VIEW ----------------
                    <div className="flex flex-col h-[70vh]">
                        <div className="flex justify-between items-end mb-4 pr-8">
                            <div>
                                <h2 className="text-xl font-black uppercase text-ef-accent tracking-wider mb-1">Import Successful</h2>
                                <p className="text-xs text-white/50">
                                    Added <strong className="text-white">{stats.added}</strong> new players, updated <strong className="text-white">{stats.updated}</strong> players.
                                </p>
                            </div>
                            <span className="text-[10px] font-bold opacity-40 uppercase tracking-widest">
                                {scrapedPlayers.length} Total Extracted
                            </span>
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
                                        <th className="px-4 py-3 font-bold">Nation</th>
                                        <th className="px-4 py-3 font-bold">Card Type</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {scrapedPlayers.map((p, idx) => (
                                        <tr key={p.id || idx} className="hover:bg-white/5 transition-colors">
                                            <td className="px-4 py-2 text-center">
                                                <div className="w-8 h-8 rounded-full overflow-hidden border border-white/10 bg-white/5 inline-block relative">
                                                    <img src={p.image} alt={p.name} className="w-full h-full object-cover object-top scale-110" loading="lazy" />
                                                </div>
                                            </td>
                                            <td className="px-4 py-2 font-black text-white">{p.name}</td>
                                            <td className="px-4 py-2 text-center">
                                                <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-ef-accent/20 text-ef-accent uppercase border border-ef-accent/20">
                                                    {p.position}
                                                </span>
                                            </td>
                                            <td className="px-4 py-2 text-white/50 text-[10px] font-bold uppercase truncate max-w-[100px]" title={p.playstyle}>
                                                {p.playstyle}
                                            </td>
                                            <td className="px-4 py-2 text-white/70 truncate max-w-[150px]" title={p.club_original || p.club}>
                                                {p.club_original || p.club}
                                            </td>
                                            <td className="px-4 py-2 text-white/70">
                                                <div className="flex items-center gap-2">
                                                    {p.nationality_flag_url && <img src={p.nationality_flag_url} className="w-4 h-3 rounded-[1px]" alt="" />}
                                                    {p.nationality}
                                                </div>
                                            </td>
                                            <td className="px-4 py-2">
                                                <span className="text-[9px] font-black text-white/50 bg-black/40 px-2 py-1 rounded inline-block">
                                                    {p.card_type}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                    {scrapedPlayers.length === 0 && (
                                        <tr>
                                            <td colSpan="7" className="px-4 py-8 text-center text-white/30 uppercase font-bold text-[10px] tracking-widest">
                                                No players extracted.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        <div className="flex justify-end mt-4">
                            <button
                                onClick={handleClose}
                                className="px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest text-ef-dark bg-ef-accent transition-all hover:scale-105 active:scale-95 shadow-[0_0_15px_rgba(0,255,136,0.2)]"
                            >
                                Done
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ScrapeDataModal;
