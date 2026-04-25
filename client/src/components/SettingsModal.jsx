import { useState } from 'react';
import { lookupPlaystyles, updatePlayerPlaystyle } from '../services/playerService';
import { STAT_OPTIONS } from '../constants';

const SettingsModal = ({ onClose, settings, setSettings, user, players, setPlayers }) => {
    const sizeMap = ['mini', 'xs', 'sm', 'md', 'lg'];
    const [activeTab, setActiveTab] = useState('card'); // 'general', 'card', 'branding', 'maintenance'
    const [isDragging, setIsDragging] = useState(false);
    const [isFixing, setIsFixing] = useState(false);
    const [fixProgress, setFixProgress] = useState(0);

    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files[0];
        if (file) processFile(file);
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) processFile(file);
    };

    const processFile = (file) => {
        const reader = new FileReader();
        reader.onload = (event) => {
            setSettings(prev => ({ ...prev, appLogo: event.target.result }));
        };
        reader.readAsDataURL(file);
    };

    const currentIndex = sizeMap.indexOf(settings.cardSize);

    const handleSliderChange = (e) => {
        const index = parseInt(e.target.value);
        setSettings(prev => ({ ...prev, cardSize: sizeMap[index] }));
    };

    const toggleSetting = (key) => {
        setSettings(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const handleFixPlaystyles = async () => {
        if (!user || isFixing) return;

        const playersToFix = players.filter(p => !p.playstyle || p.playstyle === 'None');
        if (playersToFix.length === 0) {
            alert('Your squad is already up to date!');
            return;
        }

        setIsFixing(true);
        setFixProgress(0);

        try {
            const results = await lookupPlaystyles(playersToFix.map(p => ({
                id: p._id,
                name: p.name,
                position: p.position
            })));

            const validResults = results.filter(r => r.playstyle);

            if (validResults.length === 0) {
                alert('Could not find matches for missing playstyles.');
                setIsFixing(false);
                return;
            }

            let updatedCount = 0;
            const updatedPlayers = [...players];

            for (const res of validResults) {
                await updatePlayerPlaystyle(user.uid, res.id, res.playstyle);
                const idx = updatedPlayers.findIndex(p => p._id === res.id);
                if (idx !== -1) {
                    updatedPlayers[idx] = { ...updatedPlayers[idx], playstyle: res.playstyle };
                }
                updatedCount++;
                setFixProgress(Math.round((updatedCount / validResults.length) * 100));
            }

            setPlayers(updatedPlayers);
            alert(`Successfully updated ${updatedCount} player playstyles!`);
        } catch (err) {
            console.error(err);
            alert('An error occurred during the fix process.');
        } finally {
            setIsFixing(false);
            setFixProgress(0);
        }
    };

    const tabs = [
        { id: 'card', label: 'Front Card Aesthetics', icon: '🖼️' },
        { id: 'general', label: 'General / Perf', icon: '⚙️' },
        { id: 'branding', label: 'Branding', icon: '🏷️' },
        { id: 'maintenance', label: 'Maintenance', icon: '🛠️' }
    ];

    return (
        <div className="w-full min-h-[calc(100vh-64px)] flex flex-col sm:flex-row bg-black border-x border-b border-white/10 rounded-b-[2rem] shadow-2xl overflow-hidden">
            {/* Sidebar Navigation */}
            <div className="w-full sm:w-[220px] shrink-0 bg-[#0a0a0a] border-b sm:border-b-0 sm:border-r border-white/5 flex flex-col">
                <div className="pt-1 pb-4 px-4">
                    <h2 className="hidden sm:block text-[10px] font-black uppercase tracking-[0.3em] text-white/30 mb-2">Preferences</h2>
                    <nav className="flex sm:flex-col gap-2 overflow-x-auto no-scrollbar snap-x pb-2 sm:pb-0">
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`shrink-0 snap-start w-auto sm:w-full flex items-center gap-2 sm:gap-3 px-4 py-2.5 sm:px-4 sm:py-3 rounded-xl transition-all group ${activeTab === tab.id ? 'bg-white/10 border border-white/20 text-white shadow-lg' : 'text-white/30 bg-white/5 sm:bg-transparent hover:text-white hover:bg-white/10 sm:hover:bg-white/5 border border-white/5 sm:border-transparent'}`}
                            >
                                <span className={`text-base sm:text-sm ${activeTab === tab.id ? 'opacity-100' : 'opacity-40 group-hover:opacity-100'}`}>{tab.icon}</span>
                                <span className="text-[10px] font-black uppercase tracking-widest text-left leading-tight whitespace-nowrap">{tab.label}</span>
                            </button>
                        ))}
                    </nav>
                </div>

                <div className="mt-auto p-6 border-t border-white/5 hidden sm:block">
                    <button
                        onClick={onClose}
                        className="w-full py-3 bg-white/5 hover:bg-white/10 text-white/60 hover:text-white rounded-xl text-[9px] font-black uppercase tracking-widest transition-all border border-white/10"
                    >
                        Back to App
                    </button>
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 flex flex-col min-w-0 bg-white/[0.01]">
                {/* Compact Header for Content */}
                <div className="px-8 py-0 border-b border-white/5 flex items-center justify-between">
                    <h3 className="text-xs font-black uppercase tracking-[0.2em] text-white">
                        {tabs.find(t => t.id === activeTab)?.label}
                    </h3>
                    <button onClick={onClose} className="sm:hidden text-white/40 font-black text-[10px] uppercase">Close</button>
                </div>

                <div className="flex-1 p-6 overflow-y-auto no-scrollbar space-y-8">

                    {activeTab === 'card' && (
                        <div className="animate-fade-in space-y-6">
                            <section className="space-y-4">
                                <p className="text-[8px] font-bold text-white/20 uppercase tracking-[0.3em] mb-4">Toggle visual elements on the player card front</p>

                                <div className="space-y-2">
                                    {[
                                        { id: 'showLabels', label: 'Player Name' },
                                        { id: 'showClub', label: 'Club Name' },
                                        { id: 'showClubBadge', label: 'Club Badge' },
                                        { id: 'showNationBadge', label: 'Country Badge' },
                                        { id: 'showPlaystyle', label: 'Player Playstyle' },
                                        { id: 'showRatings', label: 'Player Rating' }
                                    ].map(item => (
                                        <button
                                            key={item.id}
                                            onClick={() => toggleSetting(item.id)}
                                            className="w-full flex items-center justify-between p-4 bg-white/[0.03] border border-white/5 rounded-2xl hover:bg-white/[0.05] transition-all group"
                                        >
                                            <span className="text-[10px] font-black text-white/80 uppercase tracking-widest">{item.label}</span>
                                            <div className={`w-9 h-5 rounded-full relative transition-all duration-300 ${settings[item.id] !== false ? 'bg-white/40' : 'bg-white/10'}`}>
                                                <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all duration-300 shadow-sm ${settings[item.id] !== false ? 'translate-x-5' : 'translate-x-1'}`}></div>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </section>

                            <section className="space-y-4 pt-6 border-t border-white/5">
                                <h4 className="text-[9px] font-black text-white/40 uppercase tracking-widest pl-1">Grid Display Config</h4>
                                <div className="bg-[#111111] p-6 rounded-[2rem] border border-white/10 space-y-4">
                                    {/* Main Toggle Inside the Box */}
                                    <button
                                        onClick={() => toggleSetting('showStats')}
                                        className="w-full flex items-center justify-between p-4 bg-white/[0.03] border border-white/5 rounded-2xl hover:bg-white/[0.05] transition-all group mb-4"
                                    >
                                        <div className="flex flex-col text-left">
                                            <span className="text-[10px] font-black text-white/80 uppercase tracking-widest leading-none">Enable Player Stats</span>
                                            <span className="text-[7px] font-bold text-white/20 uppercase mt-1.5 leading-none">Shows the dynamic grid at the bottom of cards</span>
                                        </div>
                                        <div className={`w-9 h-5 rounded-full relative transition-all duration-300 ${settings.showStats !== false ? 'bg-white/40' : 'bg-white/10'}`}>
                                            <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all duration-300 shadow-sm ${settings.showStats !== false ? 'translate-x-5' : 'translate-x-1'}`}></div>
                                        </div>
                                    </button>

                                    <div className={`space-y-4 transition-all duration-500 ${settings.showStats === false ? 'opacity-20 pointer-events-none grayscale' : 'opacity-100'}`}>
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">Active Slots</span>
                                            <div className="flex gap-1">
                                                {[1, 2, 3].map(n => (
                                                    <div key={n} className={`w-1.5 h-1.5 rounded-full ${settings.customStatSlots?.length >= n ? 'bg-ef-accent' : 'bg-white/10'}`}></div>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 gap-3">
                                            {[0, 1, 2].map(slotIndex => (
                                                <div key={slotIndex} className="flex items-center gap-3 bg-black/40 p-3 rounded-xl border border-white/5">
                                                    <span className="text-[10px] font-black text-ef-accent w-12 tracking-tighter">SLOT {slotIndex + 1}</span>
                                                    <select
                                                        value={settings.customStatSlots?.[slotIndex] || 'none'}
                                                        disabled={settings.showStats === false}
                                                        onChange={(e) => {
                                                            const newSlots = [...(settings.customStatSlots || ['matches', 'goals', 'assists'])];
                                                            if (e.target.value === 'none') {
                                                                if (newSlots[slotIndex]) newSlots.splice(slotIndex, 1);
                                                            } else {
                                                                newSlots[slotIndex] = e.target.value;
                                                            }
                                                            setSettings(prev => ({ ...prev, customStatSlots: newSlots.filter(s => s) }));
                                                        }}
                                                        className="flex-1 bg-transparent text-[10px] font-black text-white uppercase outline-none cursor-pointer"
                                                    >
                                                        <option value="none" className="text-black">EMPTY / HIDDEN</option>
                                                        {STAT_OPTIONS.map(opt => (
                                                            <option key={opt.id} value={opt.id} className="text-black">{opt.label}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    <p className="text-[8px] font-bold text-white/20 uppercase tracking-widest leading-relaxed mt-2 italic px-2">
                                        * Choose up to 3 fields to show in the player card grid.
                                        Ranks are live-synced to your squad database.
                                    </p>
                                </div>
                            </section>
                        </div>
                    )}

                    {activeTab === 'general' && (
                        <div className="animate-fade-in space-y-10">
                            <section className="space-y-4">
                                <h4 className="text-[9px] font-black text-ef-accent uppercase tracking-widest pl-1">Gallery Density</h4>
                                <div className="bg-white/[0.03] p-6 rounded-[2rem] border border-white/5 space-y-6">
                                    <div className="flex justify-between items-center">
                                        <span className="text-[10px] font-black text-white/80 uppercase tracking-widest">Card Scale</span>
                                        <span className="px-2 py-1 bg-white/20 text-white text-[10px] font-black rounded uppercase">{settings.cardSize}</span>
                                    </div>
                                    <input
                                        type="range" min="0" max="4" step="1"
                                        value={currentIndex}
                                        onChange={handleSliderChange}
                                        className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-white/60"
                                    />
                                    <div className="grid grid-cols-5 gap-2">
                                        {['BOX', 'TINY', 'SMALL', 'NORMAL', 'LARGE'].map((label, i) => (
                                            <span key={label} className={`text-[8px] font-black text-center tracking-widest transition-opacity ${i === currentIndex ? 'text-white' : 'opacity-20 text-white'}`}>
                                                {label}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </section>

                            <section className="space-y-4">
                                <h4 className="text-[9px] font-black text-white/40 uppercase tracking-widest pl-1">Optimization</h4>
                                <button
                                    onClick={() => toggleSetting('highPerf')}
                                    className="w-full flex items-center justify-between p-4 bg-[#111111] border border-white/10 rounded-2xl hover:bg-[#1a1a1a] transition-all group"
                                >
                                    <div className="flex flex-col text-left">
                                        <span className="text-[10px] font-black text-white/80 uppercase tracking-widest">Eco Mode</span>
                                        <span className="text-[7px] font-bold text-white/20 uppercase mt-1">Disables Blur & Bloom for performance</span>
                                    </div>
                                    <div className={`w-9 h-5 rounded-full relative transition-all duration-300 ${settings.highPerf ? 'bg-white/40' : 'bg-white/10'}`}>
                                        <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all duration-300 shadow-sm ${settings.highPerf ? 'translate-x-5' : 'translate-x-1'}`}></div>
                                    </div>
                                </button>
                            </section>
                        </div>
                    )}

                    {activeTab === 'branding' && (
                        <div className="animate-fade-in space-y-6">
                            <section className="space-y-4">
                                <h4 className="text-[9px] font-black text-white/40 uppercase tracking-widest pl-1">Personalization</h4>
                                <div
                                    onDragOver={handleDragOver}
                                    onDragLeave={handleDragLeave}
                                    onDrop={handleDrop}
                                    className={`relative flex flex-col items-center justify-center gap-6 bg-white/[0.01] p-10 rounded-[2.5rem] border-2 border-dashed transition-all group ${isDragging ? 'border-white/40 bg-white/5' : 'border-white/5 hover:border-white/20'}`}
                                >
                                    <div className="w-24 h-24 rounded-3xl bg-black/40 flex items-center justify-center overflow-hidden border border-white/10 shadow-2xl relative">
                                        <img src={settings.appLogo || '/favicon.jpg'} alt="Preview" className="w-full h-full object-contain p-2" />
                                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                            <span className="text-[8px] font-black text-white/60">PREVIEW</span>
                                        </div>
                                    </div>
                                    <div className="text-center space-y-2">
                                        <label className="cursor-pointer block">
                                            <span className="text-[10px] font-black text-white uppercase tracking-[0.2em] px-6 py-3 bg-white/10 rounded-xl border border-white/20 hover:bg-white/20 transition-all inline-block">
                                                Upload New Logo
                                            </span>
                                            <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                                        </label>
                                        <p className="text-[8px] font-bold text-white/20 uppercase tracking-widest">SVG, PNG or JPEG supported</p>
                                    </div>
                                    {settings.appLogo && (
                                        <button
                                            onClick={() => setSettings(prev => {
                                                const { appLogo, ...rest } = prev;
                                                return rest;
                                            })}
                                            className="text-red-500 text-[10px] font-black uppercase tracking-widest hover:underline"
                                        >
                                            Reset to Default
                                        </button>
                                    )}
                                </div>
                            </section>
                        </div>
                    )}

                    {activeTab === 'maintenance' && (
                        <div className="animate-fade-in space-y-6">
                            <section className="space-y-4">
                                <h4 className="text-[9px] font-black text-white/40 uppercase tracking-widest pl-1">Database Repair</h4>
                                <div className="bg-[#111111] p-8 rounded-[2rem] border border-white/10 space-y-8 flex flex-col items-center text-center">
                                    <div className="space-y-2">
                                        <h5 className="text-[11px] font-black text-white uppercase tracking-widest">Playstyle Auto-Fix</h5>
                                        <p className="text-[8px] font-bold text-white/30 uppercase leading-relaxed max-w-[280px]">
                                            Scans 11,000+ players in the master database
                                            to Fill missing "None" playstyles in your squad.
                                        </p>
                                    </div>

                                    <div className="w-full max-w-[200px] flex flex-col gap-4">
                                        <button
                                            onClick={handleFixPlaystyles}
                                            disabled={isFixing}
                                            className={`w-full py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] transition-all shadow-xl ${isFixing ? 'bg-white/10 text-white/20' : 'bg-white/20 text-white border border-white/20 hover:bg-white/30'}`}
                                        >
                                            {isFixing ? `FIXING... ${fixProgress}%` : 'START REPAIR'}
                                        </button>

                                        <div className="flex items-center justify-between px-2">
                                            <span className="text-[8px] font-black text-white/20 uppercase tracking-widest">Pending:</span>
                                            <span className="text-[8px] font-black text-white uppercase tracking-widest">
                                                {players.filter(p => !p.playstyle || p.playstyle === 'None').length} PLAYERS
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </section>
                        </div>
                    )}
                </div>

                {/* Footer Status */}
                <div className="px-8 py-3 bg-black/40 border-t border-white/5">
                    <p className="text-[7px] font-bold uppercase tracking-[0.5em] text-white/10 text-center italic">Settings are hardware accelerated and synced to cloud</p>
                </div>
            </div>
        </div>
    );
};

export default SettingsModal;
