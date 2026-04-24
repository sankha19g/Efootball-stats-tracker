import { 
    Users, 
    Trophy, 
    Layout, 
    Zap, 
    PlusSquare, 
    ClipboardList, 
    PenTool, 
    BarChart3, 
    BookOpen, 
    Camera, 
    Link2, 
    Shield, 
    Settings,
    LogOut
} from 'lucide-react';

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
            label: 'Squad',
            icon: Users,
            onClick: () => { setView('list'); setIsOpen(false); },
            view: 'list'
        },
        {
            label: 'Ranks',
            icon: Trophy,
            onClick: () => { setView('leaderboard'); setIsOpen(false); },
            view: 'leaderboard'
        },
        {
            label: 'Tactics',
            icon: Layout,
            onClick: () => { setView('squad-builder'); setIsOpen(false); },
            view: 'squad-builder'
        },
        {
            label: 'Quick Stats Update',
            icon: Zap,
            onClick: () => { setView('quick-stats'); setIsOpen(false); },
            view: 'quick-stats'
        },
        {
            label: 'Add Player from DB',
            icon: PlusSquare,
            onClick: () => { setShowDatabase(true); setIsOpen(false); }
        },
        {
            label: 'My Squad DB',
            icon: ClipboardList,
            onClick: () => { setView('squad-db'); setIsOpen(false); },
            view: 'squad-db'
        },
        {
            label: 'Manual Entry',
            icon: PenTool,
            onClick: () => { setShowAddPlayer(true); setIsOpen(false); }
        },
        {
            label: 'My Profile Statistics',
            icon: BarChart3,
            onClick: () => { setShowProfileStats(true); setIsOpen(false); }
        },
        {
            label: 'Brochure',
            icon: BookOpen,
            onClick: () => { setShowBrochure(true); setIsOpen(false); }
        },
        {
            label: 'Screenshots',
            icon: Camera,
            onClick: () => { setShowScreenshots(true); setIsOpen(false); }
        },
        {
            label: 'Quick Links',
            icon: Link2,
            onClick: () => { setShowLinks(true); setIsOpen(false); }
        },
        {
            label: 'Badges',
            icon: Shield,
            onClick: () => { setView('badges'); setIsOpen(false); },
            view: 'badges'
        },
        {
            label: 'Settings',
            icon: Settings,
            onClick: () => { setShowSettings(true); setIsOpen(false); }
        }
    ];

    return (
        <>
            {/* Side Drawer Wrapper (Push Layout) */}
            <div className={`fixed inset-y-0 left-0 z-[90] pointer-events-none transition-all duration-300 ${isOpen ? 'pointer-events-auto' : ''}`}>
                {/* Drawer Content */}
                <div className={`
                    absolute inset-y-0 left-0 w-[280px] sm:w-80 bg-[#0a0a0c] border-r border-white/5 pt-16
                    transform transition-transform duration-300 cubic-bezier(0.16, 1, 0.3, 1)
                    ${isOpen ? 'translate-x-0' : '-translate-x-full'}
                    flex flex-col shadow-2xl
                `}>

                    {/* Navigation Items */}
                    <div className="flex-1 overflow-y-auto px-0 py-0 space-y-0 custom-scrollbar">
                        {menuItems.map((item, index) => {
                            const Icon = item.icon;
                            const isActive = item.view && item.view === view;
                            return (
                                <button
                                    key={index}
                                    onClick={item.onClick}
                                    className={`
                                        w-full group relative flex items-center gap-4 p-3 transition-all duration-300
                                        ${isActive ? 'bg-ef-accent/10 border-l-4 border-ef-accent shadow-[inset_0_0_20px_rgba(0,255,136,0.05)]' :
                                            'hover:bg-white/5 border-l-4 border-transparent'}
                                        text-left
                                    `}
                                >
                                    <Icon className={`w-4 h-4 ${isActive ? 'text-ef-accent' : 'text-white/40 group-hover:text-ef-accent'} transition-colors`} />
                                    <div className="flex flex-col flex-1">
                                        <span className={`text-[10px] sm:text-xs font-black uppercase tracking-[0.1em] ${isActive ? 'text-white' : 'text-white/80 group-hover:text-ef-accent'} transition-colors`}>
                                            {item.label}
                                        </span>
                                    </div>

                                    {isActive && (
                                        <div className="ml-auto w-1 h-6 sm:h-8 rounded-full bg-ef-accent hidden sm:group-hover:block transition-all animate-pulse"></div>
                                    )}
                                </button>
                            );
                        })}
                    </div>

                    {/* Bottom Actions Section */}
                    {user && (
                        <div className="p-4 sm:p-5 border-t border-white/5">
                            <button
                                onClick={() => { handleLogout(); setIsOpen(false); }}
                                className="w-full flex items-center justify-center gap-3 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 hover:bg-red-500 hover:text-white transition-all duration-300 font-black text-[10px] uppercase tracking-[0.2em] shadow-lg shadow-red-500/10 group"
                            >
                                <LogOut className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                                <span>Log Out</span>
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
