import { useState } from 'react';

const SidebarNav = ({ 
    isOpen, 
    setIsOpen, 
    view, 
    setView, 
    setShowAddPlayer, 
    setShowDatabase, 
    setShowScreenshots, 
    setShowLinks, 
    setShowSettings, 
    user, 
    setShowLogin, 
    handleLogout, 
    showAlert, 
    setShowProfileStats, 
    setShowSocial, 
    setShowBrochure 
}) => {

    const isSubView = view !== 'list';

    const menuItems = [
        {
            label: 'Quick Stats Update',
            icon: '⚡',
            onClick: () => { setView('quick-stats'); setIsOpen(false); },
            view: 'quick-stats',
            desc: 'Bulk update match stats'
        },
        {
            label: 'Add Player from DB',
            icon: '📂',
            onClick: () => { setShowDatabase(true); setIsOpen(false); },
            desc: 'Mass recruitment'
        },
        {
            label: 'My Squad DB',
            icon: '📋',
            onClick: () => { setView('squad-db'); setIsOpen(false); },
            view: 'squad-db',
            desc: 'View all 1000+ players'
        },
        {
            label: 'Manual Entry',
            icon: '✍️',
            onClick: () => { setShowAddPlayer(true); setIsOpen(false); },
            desc: 'Input stats manually'
        },

        {
            label: 'My Profile Statistics',
            icon: '📊',
            onClick: () => { setShowProfileStats(true); setIsOpen(false); },
            desc: 'View profile analysis'
        },
        {
            label: 'Brochure',
            icon: '📖',
            onClick: () => { setShowBrochure(true); setIsOpen(false); },
            desc: 'Squad showcase'
        },
        {
            label: 'Screenshots',
            icon: '📸',
            onClick: () => { setShowScreenshots(true); setIsOpen(false); },
            desc: 'View gallery'
        },
        {
            label: 'Quick Links',
            icon: '🔗',
            onClick: () => { setShowLinks(true); setIsOpen(false); },
            desc: 'External resources'
        },
        {
            label: 'Badges',
            icon: '🛡️',
            onClick: () => { setView('badges'); setIsOpen(false); },
            view: 'badges',
            desc: 'View collected logos'
        },

        {
            label: 'Settings',
            icon: '⚙️',
            onClick: () => { setShowSettings(true); setIsOpen(false); },
            desc: 'App preferences'
        }
    ];

    return (
        <>


            {/* Side Drawer Overlay */}
            <div className={`fixed inset-0 z-[110] pointer-events-none ${isOpen ? 'pointer-events-auto' : ''}`}>
                {/* Backdrop */}
                <div
                    className={`absolute inset-0 bg-black/60 backdrop-blur-md transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0'}`}
                    onClick={() => setIsOpen(false)}
                />

                {/* Drawer Content */}
                <div className={`
                    absolute inset-y-0 left-0 w-[280px] sm:w-80 bg-[#0a0a0c] border-r border-white/10 
                    transform transition-transform duration-300 cubic-bezier(0.16, 1, 0.3, 1)
                    ${isOpen ? 'translate-x-0 shadow-[20px_0_60px_rgba(0,0,0,0.5)]' : '-translate-x-full shadow-none'}
                    flex flex-col
                `}>
                    {/* Header with User Info */}
                    <div className="p-6 sm:p-8 border-b border-white/5">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                {/* Header titles removed as per request */}
                            </div>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center hover:bg-red-500/20 hover:text-red-500 transition-all"
                            >
                                ✕
                            </button>
                        </div>

                        {!user && (
                            <button
                                onClick={() => { setShowLogin(true); setIsOpen(false); }}
                                className="w-full flex items-center gap-3 bg-gradient-to-r from-ef-accent to-green-400 p-2.5 rounded-xl shadow-lg hover:scale-[1.02] active:scale-95 transition-all text-black"
                            >
                                <div className="text-left flex-1">
                                    <p className="text-[10px] font-black uppercase tracking-widest">Sign In</p>
                                </div>
                            </button>
                        )}
                    </div>

                    {/* Navigation Items */}
                    <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-0 sm:space-y-1.5 custom-scrollbar">
                        {menuItems.map((item, index) => (
                            <button
                                key={index}
                                onClick={item.onClick}
                                className={`
                                    w-full group relative flex items-center gap-4 p-2 sm:p-2.5 rounded-none sm:rounded-xl transition-all duration-300
                                    ${item.view && item.view === view ? 'bg-ef-accent/10 border-b sm:border border-white/5 sm:border-ef-accent/30 shadow-[0_0_20px_rgba(0,255,136,0.05)]' :
                                        'hover:bg-white/5 border-b sm:border border-white/5 sm:border-transparent sm:hover:border-white/10'}
                                    text-left last:border-0
                                `}
                            >
                                <div className="flex flex-col flex-1">
                                    <span className={`text-[10px] sm:text-xs font-black uppercase tracking-[0.1em] ${item.view && item.view === view ? 'text-white' : 'text-white/80 group-hover:text-ef-accent'} transition-colors`}>
                                        {item.label}
                                    </span>
                                </div>

                                {item.view && item.view === view && (
                                    <div className="ml-auto w-1 h-6 sm:h-8 rounded-full bg-ef-accent hidden sm:group-hover:block transition-all animate-pulse"></div>
                                )}
                            </button>
                        ))}
                    </div>

                    {/* Bottom Actions Section */}
                    {user && (
                        <div className="p-4 sm:p-5 border-t border-white/5">
                            <button
                                onClick={() => { handleLogout(); setIsOpen(false); }}
                                className="w-full flex items-center justify-center p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 hover:bg-red-500 hover:text-white transition-all duration-300 font-black text-[10px] uppercase tracking-[0.2em] shadow-lg shadow-red-500/10"
                            >
                                Log Out
                            </button>
                        </div>
                    )}

                    {/* Simple Footer */}
                    <div className="p-6 border-t border-white/5 bg-black/20 text-center">
                        <p className="text-[10px] uppercase font-black tracking-[0.3em] opacity-20">Version 1.0.4</p>
                    </div>
                </div>
            </div>
        </>
    );
};

export default SidebarNav;
