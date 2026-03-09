import React from 'react';

const CustomDialog = ({ isOpen, title, message, type = 'info', onConfirm, onCancel, confirmText = 'Confirm', cancelText = 'Cancel' }) => {
    if (!isOpen) return null;

    const showCancel = !!onCancel;

    return (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
            <div className="w-full max-w-md bg-ef-card border border-white/10 rounded-3xl overflow-hidden shadow-2xl animate-slide-up">
                {/* Header Decoration */}
                <div className={`h-1.5 w-full ${type === 'danger' ? 'bg-red-500' : 'bg-ef-accent'}`}></div>

                <div className="p-8">
                    <div className="flex items-center gap-4 mb-4">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl ${type === 'danger' ? 'bg-red-500/20 text-red-500' :
                            type === 'success' ? 'bg-ef-accent/20 text-ef-accent' :
                                'bg-ef-blue/20 text-ef-blue'
                            }`}>
                            {type === 'danger' ? '⚠️' : type === 'success' ? '✅' : 'ℹ️'}
                        </div>
                        <div>
                            <h3 className="text-xl font-black text-white uppercase tracking-tighter italic">
                                {title}
                            </h3>
                            <div className="h-0.5 w-12 bg-white/10 rounded-full mt-1"></div>
                        </div>
                    </div>

                    <p className="text-white/60 text-sm font-bold leading-relaxed mb-8">
                        {message}
                    </p>

                    <div className="flex gap-3">
                        {showCancel && (
                            <button
                                onClick={onCancel}
                                className="flex-1 px-6 py-4 rounded-xl bg-white/5 border border-white/10 text-white/40 font-black uppercase tracking-widest text-[10px] hover:bg-white/10 hover:text-white transition-all active:scale-95"
                            >
                                {cancelText}
                            </button>
                        )}
                        <button
                            onClick={onConfirm}
                            className={`flex-1 px-6 py-4 rounded-xl font-black uppercase tracking-widest text-[10px] transition-all active:scale-95 shadow-lg ${type === 'danger'
                                ? 'bg-red-500 text-white shadow-red-500/20'
                                : 'bg-ef-accent text-ef-dark shadow-ef-accent/20'
                                }`}
                        >
                            {confirmText}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CustomDialog;
