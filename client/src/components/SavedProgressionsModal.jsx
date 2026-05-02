import { useState } from 'react';
import { POSITIONS } from '../constants';

const ALL_SKILLS = [
    "Acrobatic Finishing", "Chip Shot Control", "Dipping Shot", "First-time Shot", "Heading", "Knuckle Shot", "Long-Range Curler", "Long-Range Shooting", "Rising Shot", "Outside Curler",
    "Heel Trick", "Low Lofted Pass", "No Look Pass", "One-touch Pass", "Pinpoint Crossing", "Through Passing", "Weighted Pass",
    "Chop Turn", "Cut Behind & Turn", "Double Touch", "Flip Flap", "Gamesmanship", "Marseille Turn", "Rabona", "Scissors Feint", "Scotch Move", "Sole Control", "Sombrero",
    "Aerial Superiority", "Acrobatic Clear", "Blocker", "Interception", "Man Marking", "Sliding Tackle",
    "GK High Punt", "GK Long Throw", "GK Low Punt", "GK Penalty Saver",
    "Captaincy", "Fighting Spirit", "Penalty Specialist", "Super-sub", "Track Back"
];

const SavedProgressionsModal = ({ player, onClose, onUpdatePlayer, settings, showConfirm, openOnCreate = false, isInline = false, initialBuildId = null }) => {
    const [progressions, setProgressions] = useState(player.progressions || []);
    const [isAdding, setIsAdding] = useState(openOnCreate || !!initialBuildId);
    const [zoomedImage, setZoomedImage] = useState(null);
    const [activeSkillInput, setActiveSkillInput] = useState(null);
    const [editingBuildId, setEditingBuildId] = useState(initialBuildId);
    const [newBuild, setNewBuild] = useState(() => {
        if (initialBuildId) {
            const build = (player.progressions || []).find(p => p.id === initialBuildId);
            if (build) return { ...build };
        }
        return {
            name: '',
            description: '',
            image: player.image,
            rating: player.rating,
            position: player.position,
            shooting: 0,
            passing: 0,
            dribbling: 0,
            dexterity: 0,
            lowerBody: 0,
            aerial: 0,
            defending: 0,
            gk1: 0,
            gk2: 0,
            gk3: 0,
            skill1: '',
            skill2: '',
            skill3: '',
            skill4: '',
            skill5: ''
        };
    });

    // Save changes to the main player object in backend
    const saveToBackend = (updatedProgressions) => {
        onUpdatePlayer(player._id, { ...player, progressions: updatedProgressions }, false);
        setProgressions(updatedProgressions);
    };

    const handleSaveBuild = (e) => {
        e.preventDefault();
        let updated;
        if (editingBuildId) {
            updated = progressions.map(p =>
                p.id === editingBuildId ? { ...p, ...newBuild } : p
            );
            setEditingBuildId(null);
        } else {
            const build = {
                id: Date.now().toString(),
                ...newBuild
            };
            updated = [...progressions, build];
        }

        saveToBackend(updated);
        setIsAdding(false);
        setNewBuild({ name: '', description: '', image: player.image, rating: player.rating, position: player.position, shooting: 0, passing: 0, dribbling: 0, dexterity: 0, lowerBody: 0, aerial: 0, defending: 0, gk1: 0, gk2: 0, gk3: 0, skill1: '', skill2: '', skill3: '', skill4: '', skill5: '' });
        if (isInline) onClose();
    };

    const handleEdit = (build) => {
        setNewBuild({
            name: build.name,
            description: build.description || '',
            image: build.image,
            rating: build.rating,
            position: build.position,
            shooting: build.shooting || 0,
            passing: build.passing || 0,
            dribbling: build.dribbling || 0,
            dexterity: build.dexterity || 0,
            lowerBody: build.lowerBody || 0,
            aerial: build.aerial || 0,
            defending: build.defending || 0,
            gk1: build.gk1 || 0,
            gk2: build.gk2 || 0,
            gk3: build.gk3 || 0,
            skill1: build.skill1 || '',
            skill2: build.skill2 || '',
            skill3: build.skill3 || '',
            skill4: build.skill4 || '',
            skill5: build.skill5 || ''
        });
        setEditingBuildId(build.id);
        setIsAdding(true);
    };

    const handleDelete = (id) => {
        showConfirm('Delete Build', 'Delete this build?', () => {
            const updated = progressions.filter(p => p.id !== id);
            saveToBackend(updated);
            if (editingBuildId === id) {
                setEditingBuildId(null);
                setIsAdding(false);
            }
        }, 'danger', 'Delete');
    };

    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setNewBuild(prev => ({ ...prev, image: reader.result }));
            };
            reader.readAsDataURL(file);
        }
    };

    const statFields = [
        {
            key: 'shooting', label: 'Shooting', icon: (
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="16" />
                    <line x1="8" y1="12" x2="16" y2="12" />
                </svg>
            )
        },
        {
            key: 'passing', label: 'Passing', icon: (
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
                    <path d="M2 12h20" />
                </svg>
            )
        },
        {
            key: 'dribbling', label: 'Dribbling', icon: (
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2L2 22h20L12 2z" />
                    <path d="M12 6l-4 10" />
                    <path d="M12 6l4 10" />
                </svg>
            )
        },
        {
            key: 'dexterity', label: 'Dexterity', icon: (
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 12h16" />
                    <path d="M10 6l-4 6 4 6" />
                    <path d="M14 18l4-6-4-6" />
                </svg>
            )
        },
        {
            key: 'lowerBody', label: 'Lower Body Strength', icon: (
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 22h14a2 2 0 0 0 2-2V7.5L14.5 2H6a2 2 0 0 0-2 2v4" />
                    <path d="M14 2v6h6" />
                    <path d="M4 14h16" />
                </svg>
            )
        },
        {
            key: 'aerial', label: 'Aerial Strength', icon: (
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 19V5" />
                    <path d="M5 12l7-7 7 7" />
                    <path d="M5 17l7-7 7 7" transform="translate(0, 5)" />
                </svg>
            )
        },
        {
            key: 'defending', label: 'Defending', icon: (
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    <path d="M12 22V5" />
                </svg>
            )
        },
        {
            key: 'gk1', label: 'GK 1', icon: (
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2a5 5 0 0 0-5 5v2a2 2 0 0 0-2 2v5a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-5a2 2 0 0 0-2-2v-2a5 5 0 0 0-5-5z" />
                    <text x="12" y="15" textAnchor="middle" fill="currentColor" stroke="none" fontSize="8" fontWeight="bold">1</text>
                </svg>
            )
        },
        {
            key: 'gk2', label: 'GK 2', icon: (
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2a5 5 0 0 0-5 5v2a2 2 0 0 0-2 2v5a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-5a2 2 0 0 0-2-2v-2a5 5 0 0 0-5-5z" />
                    <text x="12" y="15" textAnchor="middle" fill="currentColor" stroke="none" fontSize="8" fontWeight="bold">2</text>
                </svg>
            )
        },
        {
            key: 'gk3', label: 'GK 3', icon: (
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2a5 5 0 0 0-5 5v2a2 2 0 0 0-2 2v5a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-5a2 2 0 0 0-2-2v-2a5 5 0 0 0-5-5z" />
                    <text x="12" y="15" textAnchor="middle" fill="currentColor" stroke="none" fontSize="8" fontWeight="bold">3</text>
                </svg>
            )
        },
    ];

    const modalContent = (
        <div className={`p-6 space-y-6 flex-1 ${isInline ? 'p-0 space-y-4' : ''}`}>
            {/* Add/Edit Build Section */}
            {isAdding ? (
                <form onSubmit={handleSaveBuild} className="bg-white/5 p-4 rounded-xl border border-white/10 space-y-4">
                    <h3 className="font-bold text-lg">{editingBuildId ? 'Edit Build' : 'New Custom Build'}</h3>

                    {/* Basic Info */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div className="space-y-1">
                            <label className="text-[10px] font-black uppercase opacity-40 ml-1 flex items-center gap-1">
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                Build Name
                            </label>
                            <input
                                type="text"
                                placeholder="e.g. Goal Poacher Build"
                                value={newBuild.name}
                                onChange={e => setNewBuild({ ...newBuild, name: e.target.value })}
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm focus:border-ef-accent focus:bg-white/10 outline-none font-bold transition-all"
                                required
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-black uppercase opacity-40 ml-1 flex items-center gap-1">
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                Position
                            </label>
                            <div className="relative">
                                <select
                                    value={newBuild.position}
                                    onChange={e => setNewBuild({ ...newBuild, position: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm focus:border-ef-accent focus:bg-white/10 outline-none font-bold appearance-none cursor-pointer transition-all"
                                >
                                    {POSITIONS.map(pos => (
                                        <option key={pos} value={pos} className="bg-ef-card text-white">{pos}</option>
                                    ))}
                                </select>
                                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none opacity-40">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                                </div>
                            </div>
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-black uppercase opacity-40 ml-1 flex items-center gap-1">
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                                Rating
                            </label>
                            <input
                                type="number"
                                placeholder="99"
                                value={newBuild.rating}
                                onChange={e => setNewBuild({ ...newBuild, rating: e.target.value })}
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm focus:border-ef-accent focus:bg-white/10 outline-none font-mono font-black text-ef-accent transition-all"
                            />
                        </div>
                    </div>

                    {/* Stat Sliders */}
                    <div className="grid grid-cols-2 gap-x-4 gap-y-3 md:gap-4 bg-black/20 p-3 sm:p-4 rounded-xl border border-white/5">
                        {statFields.map((stat) => (
                            <div key={stat.key} className="space-y-1">
                                <div className="flex justify-between items-center text-xs">
                                    <label className="flex items-center gap-1 opacity-80 font-bold">
                                        <span>{stat.icon}</span> {stat.label}
                                    </label>
                                    <div className="flex items-center gap-1.5">
                                        <button
                                            type="button"
                                            onClick={() => setNewBuild(prev => ({ ...prev, [stat.key]: Math.max(0, prev[stat.key] - 1) }))}
                                            className="w-5 h-5 flex items-center justify-center bg-white/5 hover:bg-white/10 border border-white/10 rounded transition-all text-xs opacity-60 hover:opacity-100"
                                        >
                                            -
                                        </button>
                                        <input
                                            type="text"
                                            value={newBuild[stat.key]}
                                            onChange={e => {
                                                const val = parseInt(e.target.value.replace(/\D/g, '')) || 0;
                                                setNewBuild(prev => ({ ...prev, [stat.key]: Math.min(20, Math.max(0, val)) }));
                                            }}
                                            className="w-7 bg-white/5 border border-white/10 rounded font-mono font-bold text-ef-accent text-center text-[10px] outline-none focus:border-ef-accent/50"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setNewBuild(prev => ({ ...prev, [stat.key]: Math.min(20, prev[stat.key] + 1) }))}
                                            className="w-5 h-5 flex items-center justify-center bg-white/5 hover:bg-white/10 border border-white/10 rounded transition-all text-xs opacity-60 hover:opacity-100"
                                        >
                                            +
                                        </button>
                                    </div>
                                </div>
                                <input
                                    type="range"
                                    min="0"
                                    max="20"
                                    value={newBuild[stat.key]}
                                    onChange={e => setNewBuild({ ...newBuild, [stat.key]: Number(e.target.value) })}
                                    className="w-full accent-ef-accent h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer"
                                />
                            </div>
                        ))}
                    </div>


                    {/* Additional Skills */}
                    <div className="bg-black/20 p-4 rounded-xl border border-white/5 space-y-3">
                        <h4 className="font-bold text-sm opacity-80 flex items-center gap-2">
                            <span>✨</span> Additional Skills
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {[1, 2, 3, 4, 5].map(i => (
                                <div key={i} className="relative group/skill">
                                    <input
                                        type="text"
                                        placeholder={`Added Skill ${i}`}
                                        value={newBuild[`skill${i}`]}
                                        onChange={e => setNewBuild({ ...newBuild, [`skill${i}`]: e.target.value })}
                                        onFocus={() => setActiveSkillInput(i)}
                                        onBlur={() => setTimeout(() => setActiveSkillInput(null), 200)}
                                        className="w-full bg-white/5 border border-white/10 rounded p-2 text-sm focus:border-ef-accent outline-none text-white placeholder-white/20 font-medium"
                                    />
                                    {/* Suggestions Dropdown */}
                                    {activeSkillInput === i && newBuild[`skill${i}`] && (
                                        <div className="absolute bottom-full left-0 right-0 mb-1 max-h-40 overflow-y-auto bg-[#1a1a1c] border border-white/10 rounded-lg shadow-xl z-50 scroller-thin">
                                            {ALL_SKILLS.filter(s => s.toLowerCase().includes(newBuild[`skill${i}`].toLowerCase()) && s !== newBuild[`skill${i}`]).map(skill => (
                                                <button
                                                    key={skill}
                                                    type="button"
                                                    onClick={() => {
                                                        setNewBuild({ ...newBuild, [`skill${i}`]: skill });
                                                        setActiveSkillInput(null);
                                                    }}
                                                    className="w-full text-left px-3 py-2 text-xs hover:bg-white/10 text-white/80 hover:text-ef-accent transition-colors block"
                                                >
                                                    {skill}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="flex gap-2">
                        <button
                            type="button"
                            onClick={() => {
                                setIsAdding(false);
                                setEditingBuildId(null);
                                if (isInline) onClose();
                                setNewBuild({ name: '', description: '', image: player.image, rating: player.rating, position: player.position, shooting: 0, passing: 0, dribbling: 0, dexterity: 0, lowerBody: 0, aerial: 0, defending: 0, gk1: 0, gk2: 0, gk3: 0, skill1: '', skill2: '', skill3: '', skill4: '', skill5: '' });
                            }}
                            className="flex-1 py-2 bg-white/10 rounded hover:bg-white/20 transition text-sm font-bold"
                        >
                            Cancel
                        </button>
                        <button type="submit" className="flex-1 py-2 bg-ef-accent text-ef-dark font-bold rounded hover:opacity-90 transition shadow-lg text-sm">
                            {editingBuildId ? 'Update Build' : 'Save Build'}
                        </button>
                    </div>
                </form>
            ) : !isInline ? (
                <button
                    onClick={() => setIsAdding(true)}
                    className="w-full py-4 border-2 border-dashed border-white/20 rounded-xl hover:bg-white/5 hover:border-ef-accent/50 transition flex items-center justify-center gap-2 text-white/60 hover:text-white group"
                >
                    <span className="text-xl group-hover:scale-125 transition-transform">+</span> Create New Build
                </button>
            ) : null}

            {/* Build List - only if not isInline or if we want to show it there too */}
            {(!isInline || !isAdding) && (
                <div className="space-y-3">
                    {Array.isArray(progressions) && progressions.map(build => (
                        <div key={build.id} className="bg-white/5 p-2 rounded-xl border border-white/10 flex items-center gap-3 hover:border-white/20 transition group">
                            <div
                                className="w-12 h-16 bg-black/30 rounded-lg overflow-hidden flex-shrink-0 cursor-zoom-in relative group/img shadow-[0_0_15px_rgba(59,235,176,0.3)] border border-ef-accent/20"
                                onClick={() => setZoomedImage(build.image)}
                            >
                                <img src={build.image} alt={build.name} className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition text-[8px] font-bold">ZOOM</div>
                            </div>

                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-3 mb-1">
                                    <div className="flex items-center gap-2 flex-shrink-0">
                                        <span className="font-bold text-sm truncate max-w-[120px] text-white">{build.name}</span>
                                        <button
                                            onClick={() => handleEdit(build)}
                                            className="p-1 px-2 text-white/20 hover:text-white hover:bg-white/10 rounded transition text-xs"
                                            title="Edit Build"
                                        >
                                            ✎
                                        </button>
                                    </div>

                                    {/* Divider */}
                                    <div className="h-3 w-px bg-white/10 flex-shrink-0"></div>

                                    {/* Stat Preview Icons */}
                                    <div className="flex items-center gap-2 opacity-80 flex-1 flex-wrap">
                                        {statFields.map(stat => {
                                            const value = build[stat.key];
                                            if (!value || value === 0) return null;
                                            return (
                                                <div key={stat.key} className="relative group/tooltip flex items-center gap-1.5 flex-shrink-0 bg-black/20 px-1.5 py-0.5 rounded border border-white/5 cursor-help hover:bg-white/10 transition-colors">
                                                    <span className="w-2.5 h-2.5 text-ef-accent opacity-60">{stat.icon}</span>
                                                    <span className="text-[15px] px-2 font-mono font-black">{value}</span>

                                                    {/* Tooltip */}
                                                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 hidden group-hover/tooltip:block bg-black/90 text-white text-[10px] font-bold px-2 py-1 rounded whitespace-nowrap z-50 pointer-events-none border border-white/10 shadow-xl backdrop-blur-sm">
                                                        {stat.label}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                <div className="flex gap-2 text-xs items-center">
                                    <span className="px-1.5 py-0.5 rounded bg-ef-accent/20 text-ef-accent font-mono font-bold">{build.rating}</span>
                                    <span className="px-1.5 py-0.5 rounded bg-white/10 font-bold opacity-60">{build.position}</span>
                                    {build.description && (
                                        <span className="px-1.5 py-0.5 rounded bg-white/5 text-[10px] opacity-50 truncate max-w-[200px]">{build.description}</span>
                                    )}
                                </div>
                            </div>

                            <button
                                onClick={() => handleDelete(build.id)}
                                className="p-2 text-white/20 hover:text-red-500 hover:bg-red-500/10 rounded transition"
                                title="Delete Build"
                            >
                                ✕
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );

    if (isInline) return modalContent;

    return (
        <div className={`fixed inset-0 bg-black/90 flex items-center justify-center z-[60] p-4 ${settings?.highPerf ? '' : 'animate-fade-in'}`}>
            <div className={`bg-ef-card border border-white/10 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl ${settings?.highPerf ? '' : 'animate-slide-up'} flex flex-col`}>
                <div className="p-6 border-b border-white/10 flex justify-between items-center sticky top-0 bg-ef-card z-10">
                    <h2 className="text-2xl font-bold">Saved Progressions</h2>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition">✕</button>
                </div>
                {modalContent}
            </div>

            {/* Image Zoom Overlay */}
            {
                zoomedImage && (
                    <div
                        className={`fixed inset-0 z-[70] bg-black/95 flex items-center justify-center p-8 ${settings?.highPerf ? '' : 'animate-fade-in'} cursor-zoom-out`}
                        onClick={() => setZoomedImage(null)}
                    >
                        <img src={zoomedImage} alt="Zoomed" className={`max-w-full max-h-full object-contain rounded-xl shadow-2xl ${settings?.highPerf ? '' : 'scale-110 transition-transform duration-500'}`} />
                    </div>
                )
            }
        </div >
    );
};

export default SavedProgressionsModal;
