import { useState } from 'react';

const SidebarNav = ({ view, setView, setShowAddPlayer, setShowDatabase, setShowScreenshots, setShowLinks, setShowSettings, user, setShowLogin, handleLogout, showAlert, setShowProfileStats, setShowSocial, setShowBrochure }) => {
    const [isOpen, setIsOpen] = useState(false);

    const isSubView = view !== 'list';

    const menuItems = [
        {
            label: 'Quick Stats Update',
            icon: '⚡',
            onClick: () => { setView('quick-stats'); setIsOpen(false); },
            primary: true,
            desc: 'Bulk update match stats'
        },
        {
            label: 'Add Player from DB',
            icon: '📂',
            onClick: () => { setShowDatabase(true); setIsOpen(false); },
            primary: true,
            desc: 'Mass recruitment'
        },
        {
            label: 'My Squad DB',
            icon: '📋',
            onClick: () => { setView('squad-db'); setIsOpen(false); },
            primary: true,
            desc: 'View all 1000+ players'
        },
        {
            label: 'Manual Entry',
            icon: '✍️',
            onClick: () => { setShowAddPlayer(true); setIsOpen(false); },
            primary: false,
            desc: 'Input stats manually'
        },

        {
            label: 'My Profile Statistics',
            icon: '📊',
            onClick: () => { setShowProfileStats(true); setIsOpen(false); },
            secondary: true,
            desc: 'View profile analysis'
        },
        {
            label: 'Brochure',
            icon: '📖',
            onClick: () => { setShowBrochure(true); setIsOpen(false); },
            secondary: true,
            desc: 'Squad showcase'
        },
        {
            label: 'Screenshots',
            icon: '📸',
            onClick: () => { setShowScreenshots(true); setIsOpen(false); },
            secondary: true,
            desc: 'View gallery'
        },
        {
            label: 'Quick Links',
            icon: '🔗',
            onClick: () => { setShowLinks(true); setIsOpen(false); },
            secondary: true,
            desc: 'External resources'
        },
        {
            label: 'Badges',
            icon: '🛡️',
            onClick: () => { setView('badges'); setIsOpen(false); },
            secondary: true,
            desc: 'View collected logos'
        },

        {
            label: 'Settings',
            icon: '⚙️',
            onClick: () => { setShowSettings(true); setIsOpen(false); },
            secondary: true,
            desc: 'App preferences'
        }
    ];

    return (
        <>
            {/* Context-aware Button - Back or Hamburger */}
            <button
                onClick={() => isSubView ? setView('list') : setIsOpen(true)}
                className="fixed top-5 left-4 z-[100] w-10 h-10 bg-white/10 backdrop-blur-2xl border border-white/20 rounded-xl flex items-center justify-center hover:bg-white/20 hover:border-ef-accent/50 transition-all active:scale-95 group shadow-2xl"
            >
                {isSubView ? (
                    <div className="relative flex items-center justify-center w-full h-full">
                        <span className="text-xl text-white group-hover:text-ef-accent transition-all duration-300 group-hover:-translate-x-1">←</span>
                    </div>
                ) : (
                    <div className="relative flex flex-col items-center justify-center w-6 h-6 group-hover:scale-110 transition-transform duration-500">
                        {/* Kinetic Hamburger Bars */}
                        <div className="w-5 h-[2px] bg-white group-hover:bg-ef-accent rounded-full transition-all duration-300 translate-y-[-4px] group-hover:w-3 group-hover:translate-x-[-1px]"></div>
                        <div className="w-4 h-[2px] bg-white group-hover:bg-ef-accent rounded-full transition-all duration-300 opacity-80 group-hover:w-5"></div>
                        <div className="w-5 h-[2px] bg-white group-hover:bg-ef-accent rounded-full transition-all duration-300 translate-y-[4px] group-hover:w-3 group-hover:translate-x-[1px]"></div>

                        {/* Tech Ring Accent */}
                        <div className="absolute inset-[-4px] border border-ef-accent/0 group-hover:border-ef-accent/20 rounded-full transition-all duration-500 scale-50 group-hover:scale-100 opacity-0 group-hover:opacity-100"></div>
                    </div>
                )}
            </button>

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
                                <h2 className="text-2xl font-black bg-gradient-to-r from-ef-accent to-ef-blue bg-clip-text text-transparent tracking-tighter">
                                    NAVIGATION
                                </h2>
                                <p className="text-[10px] uppercase font-black tracking-widest opacity-30">Management Hub</p>
                            </div>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center hover:bg-red-500/20 hover:text-red-500 transition-all"
                            >
                                ✕
                            </button>
                        </div>

                        {/* User Profile Section */}
                        {user ? (
                            <div className="flex items-center gap-4 bg-white/5 p-4 rounded-2xl border border-white/5 group hover:bg-white/10 transition-all">
                                <img src={user.picture} alt={user.name} className="w-12 h-12 rounded-full border-2 border-ef-accent shadow-[0_0_15px_rgba(0,255,136,0.3)]" />
                                <div className="flex-1 min-w-0">
                                    <h3 className="text-sm font-black text-white truncate">{user.name}</h3>
                                    <p className="text-[10px] text-white/40 truncate">{user.email}</p>
                                </div>
                                <button
                                    onClick={() => { handleLogout(); setIsOpen(false); }}
                                    className="p-2 bg-red-500/10 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-all"
                                    title="Logout"
                                >
                                    ⎋
                                </button>
                            </div>
                        ) : (
                            <button
                                onClick={() => { setShowLogin(true); setIsOpen(false); }}
                                className="w-full flex items-center gap-4 bg-gradient-to-r from-ef-accent to-ef-blue p-4 rounded-2xl shadow-lg hover:scale-[1.02] active:scale-95 transition-all text-white"
                            >
                                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-xl">🔐</div>
                                <div className="text-left">
                                    <p className="text-xs font-black uppercase tracking-widest">Sign In</p>
                                    <p className="text-[9px] font-bold opacity-70">Unlock squad sync</p>
                                </div>
                            </button>
                        )}
                    </div>

                    {/* Navigation Items */}
                    <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-0 sm:space-y-3 custom-scrollbar">
                        {menuItems.map((item, index) => (
                            <button
                                key={index}
                                onClick={item.onClick}
                                className={`
                                    w-full group relative flex items-center gap-4 sm:gap-5 p-3 sm:p-4 rounded-none sm:rounded-2xl transition-all duration-300
                                    ${item.primary ? 'bg-gradient-to-br from-blue-600/10 to-indigo-600/5 sm:bg-gradient-to-br sm:from-blue-600/20 sm:to-indigo-600/10 border-b sm:border border-white/5 sm:border-blue-500/30' :
                                        'hover:bg-white/5 border-b sm:border border-white/5 sm:border-transparent sm:hover:border-white/10'}
                                    text-left last:border-0
                                `}
                            >
                                <div className={`
                                    w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl flex items-center justify-center text-xl sm:text-2xl transition-transform duration-300 group-hover:scale-110
                                    ${item.primary ? 'bg-blue-600/80 sm:bg-blue-600 text-white shadow-lg' : 'bg-white/5 text-white/60'}
                                `}>
                                    {item.icon}
                                </div>
                                <div className="flex flex-col">
                                    <span className={`text-[10px] sm:text-[11px] font-black uppercase tracking-widest ${item.primary ? 'text-white' : 'text-white/80 group-hover:text-ef-accent'}`}>
                                        {item.label}
                                    </span>
                                    <span className="text-[8px] sm:text-[9px] font-bold opacity-30 group-hover:opacity-50 transition-opacity">
                                        {item.desc}
                                    </span>
                                </div>

                                {item.primary && (
                                    <div className="ml-auto w-1 h-6 sm:h-8 rounded-full bg-blue-500 hidden sm:group-hover:block transition-all animate-pulse"></div>
                                )}
                            </button>
                        ))}
                    </div>

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
