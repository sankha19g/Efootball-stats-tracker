import React, { useMemo, useState } from 'react';

const ProfileStatsModal = ({ players, onClose }) => {
    const [activeTab, setActiveTab] = useState('cardType');

    const stats = useMemo(() => {
        if (!players || players.length === 0) return null;

        const total = players.length;
        const cardTypes = {};
        const positions = {};
        const playstyles = {};

        players.forEach(p => {
            const type = p.cardType || 'Normal';
            cardTypes[type] = (cardTypes[type] || 0) + 1;

            const pos = p.position || 'Unknown';
            positions[pos] = (positions[pos] || 0) + 1;

            const style = p.playstyle || 'None';
            playstyles[style] = (playstyles[style] || 0) + 1;
        });

        const cardTypeStats = Object.entries(cardTypes).map(([name, count]) => ({
            name,
            count,
            percent: Math.round((count / total) * 100)
        })).sort((a, b) => b.count - a.count);

        const positionStats = Object.entries(positions).map(([name, count]) => ({
            name,
            count,
            percent: Math.round((count / total) * 100)
        })).sort((a, b) => b.count - a.count);

        const playstyleStats = Object.entries(playstyles).map(([name, count]) => ({
            name,
            count,
            percent: Math.round((count / total) * 100)
        })).sort((a, b) => b.count - a.count);

        return { total, cardTypeStats, positionStats, playstyleStats };
    }, [players]);

    if (!stats) return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[2000] flex items-center justify-center p-4">
            <div className="bg-[#0a0a0c] border border-white/10 rounded-[2.5rem] w-full max-w-md overflow-hidden shadow-2xl p-8 text-center">
                <h3 className="text-xl font-black text-white uppercase italic mb-4">No Stats Available</h3>
                <p className="text-white/40 text-sm mb-6">Add some players to your squad first!</p>
                <button
                    onClick={onClose}
                    className="w-full py-4 bg-ef-accent text-black font-black uppercase tracking-widest rounded-2xl"
                >
                    Close
                </button>
            </div>
        </div>
    );

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[2000] flex items-center justify-center p-4 animate-in fade-in duration-300">
            <div className="bg-[#0a0a0c] border border-white/10 rounded-[2.5rem] w-full max-w-lg overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="p-8 pb-4 flex justify-between items-start">
                    <div>
                        <h2 className="text-3xl font-black text-white italic tracking-tighter uppercase">
                            Profile <span className="text-ef-accent">Stats</span>
                        </h2>
                        <p className="text-[10px] text-white/30 uppercase font-black tracking-[0.3em] mt-1">Squad Analytical Overview</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center hover:bg-white/10 transition-all text-white/40 hover:text-white"
                    >
                        ✕
                    </button>
                </div>

                {/* Tabs Navigation */}
                <div className="px-8 pb-4">
                    <div className="flex bg-white/5 p-1 rounded-2xl border border-white/5">
                        <button
                            onClick={() => setActiveTab('cardType')}
                            className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'cardType' ? 'bg-ef-accent text-black shadow-lg shadow-ef-accent/20' : 'text-white/40 hover:text-white/60'}`}
                        >
                            Card Type
                        </button>
                        <button
                            onClick={() => setActiveTab('position')}
                            className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'position' ? 'bg-ef-blue text-white shadow-lg shadow-ef-blue/20' : 'text-white/40 hover:text-white/60'}`}
                        >
                            Position
                        </button>
                        <button
                            onClick={() => setActiveTab('playstyle')}
                            className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'playstyle' ? 'bg-[#fffd00] text-black shadow-lg shadow-[#fffd00]/20' : 'text-white/40 hover:text-white/60'}`}
                        >
                            Playstyle
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar px-8 pb-8 space-y-8">
                    {/* Total Players Card */}
                    <div className="bg-gradient-to-br from-white/5 to-white/0 border border-white/5 p-6 rounded-3xl flex items-center justify-between">
                        <div>
                            <p className="text-[10px] font-black text-white/20 uppercase tracking-widest mb-1">Total Players</p>
                            <h3 className="text-4xl font-black text-white italic">{stats.total}</h3>
                        </div>
                        <div className="text-5xl opacity-10">
                            {activeTab === 'cardType' ? '💎' : activeTab === 'position' ? '🎯' : '⚡'}
                        </div>
                    </div>

                    {/* Content Based on Active Tab */}
                    {activeTab === 'cardType' && (
                        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="flex items-center gap-2">
                                <span className="text-ef-accent">💎</span>
                                <h4 className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">Card Type Distribution</h4>
                            </div>
                            <div className="grid grid-cols-1 gap-3">
                                {stats.cardTypeStats.map((item) => (
                                    <div key={item.name} className="relative group">
                                        <div className="flex justify-between items-end mb-1.5 px-1">
                                            <span className="text-xs font-black text-white uppercase italic tracking-tighter">{item.name}</span>
                                            <div className="flex items-baseline gap-1">
                                                <span className="text-xs font-black text-ef-accent">{item.percent}%</span>
                                                <span className="text-[8px] font-bold text-white/20 uppercase">({item.count})</span>
                                            </div>
                                        </div>
                                        <div className="h-2 bg-white/5 rounded-full overflow-hidden border border-white/5">
                                            <div
                                                className="h-full bg-gradient-to-r from-ef-accent to-ef-blue rounded-full transition-all duration-1000 ease-out"
                                                style={{ width: `${item.percent}%` }}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {activeTab === 'position' && (
                        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="flex items-center gap-2">
                                <span className="text-ef-blue">🎯</span>
                                <h4 className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">Position Breakdown</h4>
                            </div>
                            <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                                {stats.positionStats.map((item) => (
                                    <div key={item.name} className="space-y-1.5">
                                        <div className="flex justify-between items-center px-1">
                                            <span className="text-[10px] font-black text-white/60">{item.name}</span>
                                            <span className="text-[10px] font-black text-white/20">{item.percent}%</span>
                                        </div>
                                        <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-ef-blue/60 rounded-full"
                                                style={{ width: `${item.percent}%` }}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {activeTab === 'playstyle' && (
                        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="flex items-center gap-2">
                                <span className="text-[#fffd00]">⚡</span>
                                <h4 className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">Playstyle Analysis</h4>
                            </div>
                            <div className="grid grid-cols-1 gap-3">
                                {stats.playstyleStats.map((item) => (
                                    <div key={item.name} className="flex items-center gap-4 group">
                                        <div className="w-10 text-[10px] font-black text-white/20 text-right uppercase tracking-tighter truncate">{item.percent}%</div>
                                        <div className="flex-1 space-y-1">
                                            <div className="flex justify-between items-center">
                                                <span className="text-[10px] font-bold text-white group-hover:text-[#fffd00] transition-colors uppercase tracking-widest">{item.name}</span>
                                                <span className="text-[8px] font-black text-white/10 uppercase">{item.count}</span>
                                            </div>
                                            <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-[#fffd00] rounded-full opacity-60 group-hover:opacity-100 transition-all duration-500"
                                                    style={{ width: `${item.percent}%` }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <div className="p-8 pt-0">
                    <button
                        onClick={onClose}
                        className="w-full py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-[10px] font-black text-white/40 hover:text-white uppercase tracking-[0.3em] transition-all"
                    >
                        Close Analysis
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ProfileStatsModal;
