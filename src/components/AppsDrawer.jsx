import { useState } from 'react';

const AppsDrawer = ({ apps, onDeleteApp, onReorderApps }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [draggedIndex, setDraggedIndex] = useState(null);

    const handleDragStart = (e, index) => {
        setDraggedIndex(index);
        e.dataTransfer.effectAllowed = "move";
        // Ghost image styling usually handled by browser, but we can set specific data
    };

    const handleDragOver = (e, index) => {
        e.preventDefault(); // Necessary to allow dropping
        if (draggedIndex === null || draggedIndex === index) return;

        if (onReorderApps) {
            const newApps = [...apps];
            const draggedItem = newApps[draggedIndex];
            newApps.splice(draggedIndex, 1);
            newApps.splice(index, 0, draggedItem);
            onReorderApps(newApps);
            setDraggedIndex(index);
        }
    };

    const handleDragEnd = () => {
        setDraggedIndex(null);
    };

    return (
        <>
            {/* Toggle Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="fixed right-0 top-1/2 -translate-y-1/2 z-[90] p-3 bg-ef-card border-l border-t border-b border-white/10 rounded-l-xl shadow-2xl hover:bg-white/5 transition-all group"
                style={{
                    transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    transform: `translateY(-50%) translateX(${isOpen ? (window.innerWidth < 640 ? '-280px' : '-320px') : '0'})`
                }}
            >
                <span className={`block text-xl transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}>◀</span>
                <span className="absolute right-full top-1/2 -translate-y-1/2 mr-2 px-2 py-1 bg-black/80 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition whitespace-nowrap pointer-events-none">
                    Apps
                </span>
            </button>

            {/* Drawer */}
            <div
                className={`fixed top-0 right-0 h-full w-[280px] sm:w-80 bg-[#0a0a0c]/95 backdrop-blur-xl border-l border-white/10 shadow-2xl z-[100] transform transition-transform duration-300 ease-out flex flex-col ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
            >
                {/* Header */}
                <div className="p-6 border-b border-white/10 flex justify-between items-center bg-white/5">
                    <h2 className="text-xl font-black flex items-center gap-2">
                        <span className="text-ef-accent">📱</span>
                        <span className="bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">MY APPS</span>
                    </h2>
                    <button
                        onClick={() => setIsOpen(false)}
                        className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10 text-white/40 hover:text-white transition"
                    >
                        ✕
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                    {apps.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-center opacity-30 space-y-4">
                            <div className="text-6xl grayscale">📱</div>
                            <p className="text-sm font-bold max-w-[200px]">Add apps from Quick Links</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-3 gap-4">
                            {apps.map((app, index) => (
                                <div
                                    key={app.id}
                                    draggable
                                    onDragStart={(e) => handleDragStart(e, index)}
                                    onDragOver={(e) => handleDragOver(e, index)}
                                    onDragEnd={handleDragEnd}
                                    className={`group relative flex flex-col items-center gap-2 transition-all ${draggedIndex === index ? 'opacity-50 scale-95' : 'opacity-100'}`}
                                >
                                    <a
                                        href={app.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden hover:scale-105 hover:border-ef-accent/50 hover:shadow-[0_0_15px_rgba(59,235,176,0.3)] transition-all cursor-move relative"
                                        title={app.name}
                                        onClick={(e) => {
                                            // Prevent click if effectively dragging? Native drag usually handles this correctly.
                                        }}
                                        draggable={false} // Prevent inner anchor dragging interfering
                                    >
                                        {app.icon ? (
                                            <img src={app.icon} alt={app.name} className="w-full h-full object-cover pointer-events-none" />
                                        ) : (
                                            <span className="text-2xl grayscale group-hover:grayscale-0 transition-all pointer-events-none">🌍</span>
                                        )}
                                    </a>
                                    <span className="text-[10px] font-bold text-center truncate w-full opacity-60 group-hover:opacity-100 transition-opacity cursor-default">
                                        {app.name}
                                    </span>

                                    {/* Delete Button */}
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            e.preventDefault();
                                            if (window.confirm(`Remove ${app.name} from apps?`)) {
                                                onDeleteApp(app.id);
                                            }
                                        }}
                                        className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity shadow-lg cursor-pointer z-10 hover:scale-110"
                                    >
                                        ✕
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-white/10 bg-black/20 text-center">
                    <p className="text-[9px] uppercase font-bold tracking-widest opacity-20">Quick Access</p>
                </div>
            </div>

            {/* Overlay for closing when clicking outside */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/20 backdrop-blur-[1px] z-[90]"
                    onClick={() => setIsOpen(false)}
                />
            )}
        </>
    );
};

export default AppsDrawer;
