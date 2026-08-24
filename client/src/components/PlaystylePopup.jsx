import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { getPlaystyleInfo } from '../data/playstyles';

export const PlaystylePopup = ({ playstyleName, type = 'offensive', onClose }) => {
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onClose]);

    if (!playstyleName) return null;

    const info = getPlaystyleInfo(playstyleName, type);
    const isOffensive = info.resolvedType === 'offensive' || type === 'offensive';
    const isDefensive = info.resolvedType === 'defensive' || type === 'defensive';
    const isBasic = info.name === 'Basic' || info.name === 'None';

    const accentColor = isBasic ? '#94a3b8' : (isOffensive ? '#ff2a5f' : '#00e5ff');
    const badgeBg = isBasic ? 'bg-slate-500/10 border-slate-400/30 text-slate-300' : (isOffensive ? 'bg-[#ff2a5f]/15 border-[#ff2a5f] text-[#ff2a5f] shadow-[0_0_15px_rgba(255,42,95,0.3)]' : 'bg-[#00e5ff]/15 border-[#00e5ff] text-[#00e5ff] shadow-[0_0_15px_rgba(0,229,255,0.3)]');

    const popupContent = (
        <div 
            className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-in"
            onClick={onClose}
        >
            <div 
                className="relative w-full max-w-md bg-[#0f1015]/95 border border-white/15 rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.9)] p-6 overflow-hidden animate-scale-up"
                onClick={(e) => e.stopPropagation()}
                style={{
                    boxShadow: `0 0 40px ${isOffensive ? 'rgba(255,42,95,0.15)' : isDefensive ? 'rgba(0,229,255,0.15)' : 'rgba(255,255,255,0.05)'}`
                }}
            >
                {/* Top glow ambient effect */}
                <div 
                    className="absolute -top-20 -left-20 w-48 h-48 rounded-full blur-3xl pointer-events-none opacity-25"
                    style={{ background: accentColor }}
                />

                {/* Header */}
                <div className="flex items-start justify-between gap-4 border-b border-white/10 pb-4 relative z-10">
                    <div className="flex items-center gap-3">
                        {/* Playstyle Icon Badge */}
                        <div className={`w-9 h-9 rounded-lg border-2 flex items-center justify-center shrink-0 transition-transform ${badgeBg}`}>
                            {isOffensive ? (
                                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M12 4l-7 7h4v8h6v-8h4l-7-7z" />
                                </svg>
                            ) : isDefensive ? (
                                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M12 20l7-7h-4V5H9v8H5l7 7z" />
                                </svg>
                            ) : (
                                <span className="text-sm font-black">⚙️</span>
                            )}
                        </div>

                        <div>
                            <div className="flex items-center gap-2">
                                <span 
                                    className="text-[9px] font-black uppercase tracking-[0.2em] px-2 py-0.5 rounded"
                                    style={{
                                        background: `${accentColor}20`,
                                        color: accentColor,
                                        border: `1px solid ${accentColor}40`
                                    }}
                                >
                                    {isOffensive ? 'Offensive Playstyle' : isDefensive ? 'Defensive Playstyle' : 'Standard Style'}
                                </span>
                                {info.subtitle && (
                                    <span className="text-[10px] font-bold text-white/40 italic">
                                        ({info.subtitle})
                                    </span>
                                )}
                            </div>
                            <h3 className="text-xl font-black text-white uppercase tracking-tight mt-1 font-inter">
                                {info.name}
                            </h3>
                        </div>
                    </div>

                    {/* Close Button */}
                    <button
                        onClick={onClose}
                        className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/15 border border-white/10 text-white/50 hover:text-white flex items-center justify-center transition-all cursor-pointer text-sm"
                        title="Close popup (Esc)"
                    >
                        ✕
                    </button>
                </div>

                {/* Description Body */}
                <div className="mt-4 space-y-4 relative z-10">
                    <div className="bg-black/40 border border-white/5 rounded-xl p-4">
                        <span className="text-[9px] font-black uppercase tracking-widest text-white/30 block mb-1.5 font-inter">
                            Tactical Overview
                        </span>
                        <p className="text-[13px] leading-relaxed text-white/90 font-medium font-inter">
                            {info.description}
                        </p>
                    </div>

                    {/* Quick Characteristics */}
                    <div className="flex flex-wrap gap-2 pt-1">
                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-[11px] font-medium text-white/70 font-inter">
                            <span className="text-white/30 font-bold">Category:</span>
                            <span className="text-white font-semibold">{info.category}</span>
                        </div>
                        {isOffensive && (
                            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#ff2a5f]/10 border border-[#ff2a5f]/20 text-[11px] font-medium text-[#ff2a5f] font-inter">
                                <span>⚡ Attack Phase AI</span>
                            </div>
                        )}
                        {isDefensive && (
                            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#00e5ff]/10 border border-[#00e5ff]/20 text-[11px] font-medium text-[#00e5ff] font-inter">
                                <span>🛡️ Defense Phase AI</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer hint */}
                <div className="mt-5 pt-3 border-t border-white/5 flex items-center justify-between text-[10px] text-white/30 font-inter">
                    <span>Click anywhere outside to dismiss</span>
                    <button
                        onClick={onClose}
                        className="px-3 py-1 bg-white/10 hover:bg-white/20 text-white rounded-md font-semibold transition-all cursor-pointer text-[11px]"
                    >
                        Got It
                    </button>
                </div>
            </div>
        </div>
    );

    return createPortal(popupContent, document.body);
};
