import React from 'react';

const ImportSummaryModal = ({ data, onSave, onUndo }) => {
    if (!data) return null;

    const { summary, details } = data;

    return (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-[200] p-4 animate-fade-in backdrop-blur-md">
            <div className="w-full max-w-4xl max-h-[90vh] bg-ef-card border border-white/10 rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-slide-up">
                {/* Header */}
                <div className="p-6 border-b border-white/5 bg-black/20 flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-black text-white uppercase tracking-tighter italic">
                            Import <span className="text-ef-accent">Summary</span>
                        </h2>
                        <div className="flex gap-4 mt-2">
                            <span className="text-[10px] font-black uppercase tracking-widest text-ef-blue px-2 py-1 bg-ef-blue/10 rounded-lg">
                                {summary.added} NEW PLAYERS
                            </span>
                            <span className="text-[10px] font-black uppercase tracking-widest text-ef-accent px-2 py-1 bg-ef-accent/10 rounded-lg">
                                {summary.updated} UPDATED PLAYERS
                            </span>
                        </div>
                    </div>
                    <button 
                        onClick={onUndo}
                        className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 text-white transition-all flex items-center justify-center border border-white/10"
                    >
                        ✕
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
                    <div className="space-y-4">
                        {details.length === 0 ? (
                            <div className="text-center py-10 opacity-30 text-sm font-bold uppercase tracking-widest">
                                No changes detected in this import.
                            </div>
                        ) : (
                            details.map((item, idx) => (
                                <div key={idx} className="bg-white/5 border border-white/5 rounded-2xl p-4 hover:border-white/10 transition-colors">
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-2 h-8 rounded-full ${item.type === 'add' ? 'bg-ef-blue' : 'bg-ef-accent'}`}></div>
                                            <div>
                                                <p className="text-xs font-black text-white uppercase tracking-wider">{item.name}</p>
                                                <p className="text-[8px] font-black uppercase tracking-[0.2em] opacity-30">
                                                    {item.type === 'add' ? 'New Player Entry' : 'Existing Player Merge'}
                                                </p>
                                            </div>
                                        </div>
                                        {item.id && <span className="text-[8px] font-mono opacity-20">ID: {item.id}</span>}
                                    </div>
                                    
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                        {item.changes.map((change, cIdx) => (
                                            <div key={cIdx} className="bg-black/20 rounded-xl px-3 py-2 flex items-center justify-between border border-white/5">
                                                <span className="text-[9px] font-black uppercase tracking-widest text-white/40">{change.field}</span>
                                                <div className="flex items-center gap-2">
                                                    {item.type === 'update' && (
                                                        <span className="text-[9px] font-bold line-through opacity-20 text-white truncate max-w-[60px]">
                                                            {change.old || '---'}
                                                        </span>
                                                    )}
                                                    {item.type === 'update' && <span className="text-[8px] opacity-20">➜</span>}
                                                    <span className={`text-[9px] font-black ${item.type === 'add' ? 'text-ef-blue' : 'text-ef-accent'}`}>
                                                        {typeof change.new === 'object' ? JSON.stringify(change.new) : change.new || '---'}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 bg-black/40 border-t border-white/5 flex gap-4">
                    <button 
                        onClick={onUndo}
                        className="flex-1 py-4 px-6 rounded-2xl bg-white/5 border border-white/10 text-white/40 font-black uppercase tracking-widest text-[11px] transition-all hover:bg-white/10 hover:text-white"
                    >
                        Undo & Cancel
                    </button>
                    <button 
                        onClick={onSave}
                        className="flex-[2] py-4 px-6 rounded-2xl bg-ef-accent text-ef-dark font-black uppercase tracking-widest text-[11px] transition-all shadow-xl shadow-ef-accent/20 hover:scale-[1.02] active:scale-95"
                    >
                        Save to Database
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ImportSummaryModal;
