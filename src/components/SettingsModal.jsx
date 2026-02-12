import { useState } from 'react';

const SettingsModal = ({ onClose, settings, setSettings }) => {
    const sizeMap = ['xs', 'sm', 'md', 'lg'];
    const currentIndex = sizeMap.indexOf(settings.cardSize);

    const handleSliderChange = (e) => {
        const index = parseInt(e.target.value);
        setSettings(prev => ({ ...prev, cardSize: sizeMap[index] }));
    };

    const toggleSetting = (key) => {
        setSettings(prev => ({ ...prev, [key]: !prev[key] }));
    };

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[120] p-4 animate-fade-in backdrop-blur-sm">
            <div className="bg-[#0f172a] border border-white/10 rounded-2xl w-full max-w-[340px] shadow-2xl animate-slide-up overflow-hidden">
                {/* Compact Header */}
                <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between bg-white/[0.01]">
                    <div className="flex items-center gap-2">
                        <span className="text-ef-accent text-sm">⚙️</span>
                        <h2 className="text-sm font-black uppercase tracking-widest text-white">Settings</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-white/40 hover:text-white transition-colors text-[10px] font-black tracking-widest"
                    >
                        CLOSE
                    </button>
                </div>

                <div className="p-5 space-y-6">
                    {/* Performance Category */}
                    <section className="space-y-4">
                        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/50 border-b border-white/5 pb-2">Optimization</h3>

                        <button
                            onClick={() => toggleSetting('highPerf')}
                            className="w-full flex items-center justify-between group"
                        >
                            <div className="flex flex-col text-left">
                                <span className="text-[10px] font-black text-white/80 uppercase tracking-widest">Eco Mode</span>
                            </div>
                            <div className={`w-9 h-5 rounded-full relative transition-all duration-300 ${settings.highPerf ? 'bg-ef-accent' : 'bg-white/10'}`}>
                                <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all duration-300 shadow-sm ${settings.highPerf ? 'translate-x-5' : 'translate-x-1'}`}></div>
                            </div>
                        </button>
                    </section>

                    {/* Card Grid Category */}
                    <section className="space-y-4">
                        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/50 border-b border-white/5 pb-2">Card Grid</h3>

                        {/* Size Slider */}
                        <div className="space-y-3 pt-1">
                            <div className="flex justify-between items-center">
                                <span className="text-[10px] font-black text-white/80 uppercase tracking-widest">Gallery Density</span>
                                <span className="text-[10px] font-black text-ef-accent uppercase">{settings.cardSize}</span>
                            </div>
                            <div className="px-1">
                                <input
                                    type="range" min="0" max="3" step="1"
                                    value={currentIndex}
                                    onChange={handleSliderChange}
                                    className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-ef-accent"
                                />
                                <div className="flex justify-between mt-2">
                                    {['TINY', 'SML', 'REG', 'LRG'].map((label, i) => (
                                        <span key={label} className={`text-[8px] font-bold tracking-tighter ${i === currentIndex ? 'text-ef-accent opacity-100' : 'opacity-20 text-white'}`}>
                                            {label}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Visibility Toggles */}
                        <div className="space-y-3 pt-2">
                            <button
                                onClick={() => toggleSetting('showLabels')}
                                className="w-full flex items-center justify-between group"
                            >
                                <span className="text-[10px] font-black text-white/80 uppercase tracking-widest">Player Name & Club</span>
                                <div className={`w-9 h-5 rounded-full relative transition-all duration-300 ${settings.showLabels ? 'bg-ef-accent' : 'bg-white/10'}`}>
                                    <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all duration-300 shadow-sm ${settings.showLabels ? 'translate-x-5' : 'translate-x-1'}`}></div>
                                </div>
                            </button>

                            <button
                                onClick={() => toggleSetting('showRatings')}
                                className="w-full flex items-center justify-between group"
                            >
                                <span className="text-[10px] font-black text-white/80 uppercase tracking-widest">Player Rating</span>
                                <div className={`w-9 h-5 rounded-full relative transition-all duration-300 ${settings.showRatings ? 'bg-ef-accent' : 'bg-white/10'}`}>
                                    <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all duration-300 shadow-sm ${settings.showRatings ? 'translate-x-5' : 'translate-x-1'}`}></div>
                                </div>
                            </button>

                            <button
                                onClick={() => toggleSetting('showStats')}
                                className="w-full flex items-center justify-between group"
                            >
                                <span className="text-[10px] font-black text-white/80 uppercase tracking-widest">Efficiency Stats</span>
                                <div className={`w-9 h-5 rounded-full relative transition-all duration-300 ${settings.showStats ? 'bg-ef-accent' : 'bg-white/10'}`}>
                                    <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all duration-300 shadow-sm ${settings.showStats ? 'translate-x-5' : 'translate-x-1'}`}></div>
                                </div>
                            </button>
                        </div>
                    </section>
                </div>

                {/* Status Bar */}
                <div className="px-5 py-3 bg-black/40 border-t border-white/5 text-center">
                    <p className="text-[8px] font-bold uppercase tracking-[0.4em] text-white/20">Preferences synced automatically</p>
                </div>
            </div>
        </div>
    );
};

export default SettingsModal;
