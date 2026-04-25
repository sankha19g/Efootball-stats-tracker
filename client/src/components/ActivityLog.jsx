import React, { useMemo } from 'react';
import { History, UserPlus, Zap, Clock, Database, Smartphone, Laptop, Trash2, Edit3, ShieldAlert } from 'lucide-react';

const ActivityLog = ({ activities, isSidebarOpen }) => {
    
    const formatDate = (dateStr) => {
        try {
            const date = new Date(dateStr);
            return new Intl.DateTimeFormat('en-US', {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            }).format(date);
        } catch (e) {
            return 'Recent';
        }
    };

    const getIcon = (type) => {
        switch (type) {
            case 'player_add': return UserPlus;
            case 'player_edit': return Edit3;
            case 'player_delete_bulk': return Trash2;
            case 'badge_update': return Zap;
            default: return History;
        }
    };

    const getColor = (type) => {
        switch (type) {
            case 'player_add': return 'text-ef-accent';
            case 'player_edit': return 'text-ef-blue';
            case 'player_delete_bulk': return 'text-red-500';
            default: return 'text-white/60';
        }
    };

    const getBg = (type) => {
        switch (type) {
            case 'player_add': return 'bg-ef-accent/10';
            case 'player_edit': return 'bg-ef-blue/10';
            case 'player_delete_bulk': return 'bg-red-500/10';
            default: return 'bg-white/5';
        }
    };

    return (
        <div className="w-full animate-fade-in -mt-8 md:-mt-12">
            <div className="max-w-4xl mx-auto w-full px-2">
                {/* Header */}
                <div className="flex items-center justify-between gap-4 mb-8 animate-slide-up">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-2xl bg-ef-accent/10 flex items-center justify-center border border-ef-accent/20">
                            <History className="w-8 h-8 text-ef-accent" />
                        </div>
                        <div>
                            <h2 className="text-4xl font-black text-white uppercase italic tracking-tighter">
                                Activity <span className="text-ef-accent">Log</span>
                            </h2>
                            <p className="text-white/40 text-xs font-bold tracking-widest uppercase mt-1 flex items-center gap-2">
                                <ShieldAlert className="w-3 h-3 text-ef-accent" />
                                Logs are auto-deleted after 2 days
                            </p>
                        </div>
                    </div>
                    
                    {/* Storage Info */}
                    <div className="hidden md:flex flex-col items-end gap-1 px-4 py-2 bg-white/5 border border-white/10 rounded-2xl">
                        <div className="flex items-center gap-2 text-[10px] font-black text-white/40 uppercase tracking-widest">
                            <Database className="w-3 h-3 text-ef-accent" />
                            Data Storage
                        </div>
                        <div className="text-xs font-bold text-ef-accent">Firebase Cloud Firestore</div>
                    </div>
                </div>

                {/* Timeline */}
                <div className="relative space-y-6 pb-20">
                    {/* Vertical Line */}
                    {activities.length > 0 && (
                        <div className="absolute left-6 top-4 bottom-4 w-px bg-gradient-to-b from-ef-accent/50 via-white/5 to-transparent"></div>
                    )}

                    {activities.length > 0 ? (
                        activities.map((item, idx) => {
                            const Icon = getIcon(item.type);
                            const DeviceIcon = item.device?.includes('Desktop') ? Laptop : Smartphone;
                            
                            return (
                                <div 
                                    key={item.id || idx} 
                                    className="relative flex gap-8 animate-slide-up"
                                    style={{ animationDelay: `${idx * 0.05}s` }}
                                >
                                    {/* Icon Bubble */}
                                    <div className={`relative z-10 w-12 h-12 rounded-xl ${getBg(item.type)} border border-white/5 flex items-center justify-center shrink-0 shadow-lg`}>
                                        <Icon className={`w-5 h-5 ${getColor(item.type)}`} />
                                    </div>

                                    {/* Content Card */}
                                    <div className="flex-1 bg-white/5 border border-white/10 rounded-2xl p-5 hover:bg-white/10 transition-all group">
                                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-3">
                                            <div className="flex items-center gap-3">
                                                <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${getColor(item.type)}`}>
                                                    {item.title}
                                                </span>
                                                <span className="w-1 h-1 rounded-full bg-white/10"></span>
                                                <div className="flex items-center gap-1.5 text-white/30 font-medium text-[10px] uppercase tracking-widest">
                                                    <Clock className="w-3 h-3" />
                                                    {formatDate(item.timestamp)}
                                                </div>
                                            </div>

                                            {/* Device Info */}
                                            <div className="flex items-center gap-2 px-2 py-1 bg-black/40 rounded-lg border border-white/5">
                                                <DeviceIcon className="w-3 h-3 text-white/40" />
                                                <span className="text-[9px] font-bold text-white/40 uppercase tracking-widest">{item.device || 'Unknown Device'}</span>
                                            </div>
                                        </div>

                                        <p className="text-white text-base font-bold leading-relaxed mb-3">
                                            {item.description}
                                        </p>

                                        {item.player && (
                                            <div className="flex items-center gap-4 p-3 bg-black/30 rounded-xl border border-white/5 group-hover:border-white/10 transition-colors">
                                                <div className="w-10 h-10 rounded-lg bg-black/40 overflow-hidden border border-white/10 shrink-0">
                                                    {item.player.image ? (
                                                        <img src={item.player.image} alt="" className="w-full h-full object-cover" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center opacity-20">👤</div>
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-xs font-black text-white uppercase truncate">{item.player.name}</p>
                                                    <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest truncate">
                                                        {item.player.position} • {item.player.rating} Rating
                                                    </p>
                                                </div>
                                            </div>
                                        )}
                                        
                                        {/* Storage Sub-text */}
                                        <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-between">
                                            <div className="text-[8px] font-black text-white/20 uppercase tracking-[0.2em]">
                                                Stored in: {item.storage || 'Cloud Database'}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        <div className="text-center py-24 bg-white/5 rounded-[3rem] border border-dashed border-white/10">
                            <History className="w-16 h-16 text-white/10 mx-auto mb-6" />
                            <p className="text-white/20 font-black uppercase tracking-widest">No activity recorded yet</p>
                            <p className="text-white/10 text-[10px] uppercase tracking-widest mt-2">Changes you make will appear here automatically</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ActivityLog;
