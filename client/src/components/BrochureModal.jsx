const BrochureModal = ({ players, onClose, user, activeSquad }) => {
    return (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-2xl z-[1100] flex items-center justify-center p-4 md:p-8 animate-fade-in overflow-y-auto">
            <div className="bg-[#0b0b0d] border border-white/10 rounded-[2.5rem] w-full max-w-5xl md:h-[90vh] flex flex-col shadow-[0_0_100px_rgba(0,0,0,0.8)] overflow-hidden relative group">

                {/* Visual Flair Background */}
                <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-blue-500/5 blur-[120px] pointer-events-none group-hover:bg-blue-500/10 transition-colors duration-1000"></div>
                <div className="absolute bottom-0 left-0 w-1/2 h-1/2 bg-ef-accent/5 blur-[120px] pointer-events-none group-hover:bg-ef-accent/10 transition-colors duration-1000"></div>

                {/* Header */}
                <div className="p-8 md:p-12 pb-6 border-b border-white/5 flex flex-col md:flex-row justify-between items-start md:items-center bg-gradient-to-br from-white/[0.03] to-transparent relative z-10">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <span className="text-[10px] font-black uppercase tracking-[0.5em] text-ef-accent bg-ef-accent/10 px-3 py-1 rounded-full border border-ef-accent/20">Official Brochure</span>
                            <span className="w-1.5 h-1.5 rounded-full bg-white/20"></span>
                            <span className="text-[10px] font-black uppercase tracking-[0.5em] text-white/40">{activeSquad?.name || 'My Ultimate Squad'}</span>
                        </div>
                        <h2 className="text-4xl md:text-6xl font-black uppercase italic tracking-tighter leading-none">
                            THE <span className="bg-gradient-to-r from-ef-accent to-ef-blue bg-clip-text text-transparent">LEGACY</span>
                        </h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="absolute top-8 right-8 w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center hover:bg-white/10 hover:text-ef-accent transition-all border border-white/10 text-xl"
                    >✕</button>
                </div>

                {/* Empty Slate Area */}
                <div className="flex-1 flex items-center justify-center p-8 md:p-12 relative z-10">
                    <div className="text-center opacity-20">
                        <p className="text-[10px] font-black uppercase tracking-[1em]">Empty Slate</p>
                    </div>
                </div>

                {/* Footer Signature */}
                <div className="p-8 border-t border-white/5 bg-black/40 text-center flex items-center justify-center gap-3 relative z-10">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-ef-accent to-ef-blue p-1.5 grayscale opacity-50">
                        <img src="/favicon.jpg" alt="" className="w-full h-full object-contain" />
                    </div>
                    <span className="text-[9px] font-black uppercase tracking-[0.4em] text-white/10">Official Certification of Squad Excellence</span>
                </div>
            </div>
        </div>
    );
};

export default BrochureModal;
