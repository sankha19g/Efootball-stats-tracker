import React, { useState } from 'react';
import { getOffensivePlaystyle, getDefensivePlaystyle } from '../data/playstyles';
import { PlaystylePopup } from './PlaystylePopup';

export const DualPlaystyles = ({ 
    player, 
    offensivePlaystyle: customOffensive, 
    defensivePlaystyle: customDefensive,
    size = 'normal', // 'normal' | 'compact' | 'badge-only'
    className = '',
    onPlaystyleClick = null
}) => {
    const [selectedPlaystyle, setSelectedPlaystyle] = useState(null); // { name, type }

    const offensiveStyle = customOffensive || getOffensivePlaystyle(player);
    const defensiveStyle = customDefensive || getDefensivePlaystyle(player);

    const handleItemClick = (name, type, e) => {
        if (e) e.stopPropagation();
        if (onPlaystyleClick) {
            onPlaystyleClick(name, type);
        } else {
            setSelectedPlaystyle({ name, type });
        }
    };

    if (size === 'compact') {
        return (
            <>
                <div className={`flex flex-col gap-1 ${className}`}>
                    {/* Offensive Row */}
                    <button
                        type="button"
                        onClick={(e) => handleItemClick(offensiveStyle, 'offensive', e)}
                        className="group/style flex items-center gap-1.5 text-left bg-transparent border-0 p-0 cursor-pointer hover:opacity-90 transition-all focus:outline-none"
                        title="Click to view Offensive Playstyle details"
                    >
                        <span className="w-3.5 h-3.5 rounded-[3px] bg-[#ff2a5f]/15 border border-[#ff2a5f] flex items-center justify-center text-[#ff2a5f] shrink-0 text-[8px] font-black">
                            ▲
                        </span>
                        <span className="text-[11px] font-black uppercase tracking-tight text-white/90 group-hover/style:text-[#ff2a5f] transition-colors truncate">
                            {offensiveStyle}
                        </span>
                    </button>

                    {/* Defensive Row */}
                    <button
                        type="button"
                        onClick={(e) => handleItemClick(defensiveStyle, 'defensive', e)}
                        className="group/style flex items-center gap-1.5 text-left bg-transparent border-0 p-0 cursor-pointer hover:opacity-90 transition-all focus:outline-none"
                        title="Click to view Defensive Playstyle details"
                    >
                        <span className="w-3.5 h-3.5 rounded-[3px] bg-[#00e5ff]/15 border border-[#00e5ff] flex items-center justify-center text-[#00e5ff] shrink-0 text-[8px] font-black">
                            ▼
                        </span>
                        <span className="text-[11px] font-black uppercase tracking-tight text-white/90 group-hover/style:text-[#00e5ff] transition-colors truncate">
                            {defensiveStyle}
                        </span>
                    </button>
                </div>

                {selectedPlaystyle && (
                    <PlaystylePopup
                        playstyleName={selectedPlaystyle.name}
                        type={selectedPlaystyle.type}
                        onClose={() => setSelectedPlaystyle(null)}
                    />
                )}
            </>
        );
    }

    return (
        <>
            <div className={`flex flex-col gap-1.5 ${className}`}>
                {/* 1st: Offensive Playstyle Row */}
                <button
                    type="button"
                    onClick={(e) => handleItemClick(offensiveStyle, 'offensive', e)}
                    className="group/opt flex items-center gap-2.5 px-1 py-0.5 rounded-lg text-left bg-transparent border-0 cursor-pointer hover:bg-white/[0.04] transition-all focus:outline-none w-fit"
                    title={`Offensive Style: ${offensiveStyle} (Click for details)`}
                >
                    {/* Red/Pink rounded square icon */}
                    <div className="w-[20px] h-[20px] rounded-[4px] bg-[#ff2a5f]/15 border-[1.5px] border-[#ff2a5f] flex items-center justify-center text-[#ff2a5f] shrink-0 shadow-[0_0_10px_rgba(255,42,95,0.25)] group-hover/opt:shadow-[0_0_15px_rgba(255,42,95,0.5)] group-hover/opt:scale-105 transition-all">
                        <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 4l-8 9h5v7h6v-7h5z" />
                        </svg>
                    </div>

                    {/* Playstyle Name */}
                    <span className="text-[13px] sm:text-[14px] font-black uppercase tracking-wider text-white group-hover/opt:text-[#ff2a5f] transition-colors font-inter select-none">
                        {offensiveStyle}
                    </span>
                </button>

                {/* 2nd: Defensive Playstyle Row */}
                <button
                    type="button"
                    onClick={(e) => handleItemClick(defensiveStyle, 'defensive', e)}
                    className="group/dpt flex items-center gap-2.5 px-1 py-0.5 rounded-lg text-left bg-transparent border-0 cursor-pointer hover:bg-white/[0.04] transition-all focus:outline-none w-fit"
                    title={`Defensive Style: ${defensiveStyle} (Click for details)`}
                >
                    {/* Cyan/Teal rounded square icon */}
                    <div className="w-[20px] h-[20px] rounded-[4px] bg-[#00e5ff]/15 border-[1.5px] border-[#00e5ff] flex items-center justify-center text-[#00e5ff] shrink-0 shadow-[0_0_10px_rgba(0,229,255,0.25)] group-hover/dpt:shadow-[0_0_15px_rgba(0,229,255,0.5)] group-hover/dpt:scale-105 transition-all">
                        <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 20l-8-9h5V4h6v7h5z" />
                        </svg>
                    </div>

                    {/* Playstyle Name */}
                    <span className="text-[13px] sm:text-[14px] font-black uppercase tracking-wider text-white group-hover/dpt:text-[#00e5ff] transition-colors font-inter select-none">
                        {defensiveStyle}
                    </span>
                </button>
            </div>

            {selectedPlaystyle && (
                <PlaystylePopup
                    playstyleName={selectedPlaystyle.name}
                    type={selectedPlaystyle.type}
                    onClose={() => setSelectedPlaystyle(null)}
                />
            )}
        </>
    );
};
