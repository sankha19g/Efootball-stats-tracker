import { useState, useEffect, useRef } from 'react';
import { POSITIONS, SPECIAL_SKILLS } from '../constants';

const getProgressionIcon = (key) => {
    const filenameMap = {
        shooting: 'shooting.png',
        passing: 'passing.png',
        dribbling: 'dribbling.png',
        dexterity: 'dexterity.png',
        lowerBody: 'lower-body-strength.png',
        aerial: 'aerial-strength.png',
        defending: 'defending.png',
        gk1: 'gk1.png',
        gk2: 'gk2.png',
        gk3: 'gk3.png'
    };
    return `https://efhub.com/icons/progression/${filenameMap[key] || (key + '.png')}`;
};

const ALL_SKILLS = [
    "Acrobatic Finishing", "Chip Shot Control", "Dipping Shot", "First-time Shot", "Heading", "Knuckle Shot", "Long-Range Curler", "Long-Range Shooting", "Rising Shot", "Outside Curler",
    "Heel Trick", "Low Lofted Pass", "No Look Pass", "One-touch Pass", "Pinpoint Crossing", "Through Passing", "Weighted Pass",
    "Chop Turn", "Cut Behind & Turn", "Double Touch", "Flip Flap", "Gamesmanship", "Marseille Turn", "Rabona", "Scissors Feint", "Scotch Move", "Sole Control", "Sombrero",
    "Aerial Superiority", "Acrobatic Clear", "Blocker", "Interception", "Man Marking", "Sliding Tackle",
    "GK High Punt", "GK Long Throw", "GK Low Punt", "GK Penalty Saver",
    "Captaincy", "Fighting Spirit", "Penalty Specialist", "Super-sub", "Track Back"
];

const SavedProgressionsModal = ({ player, onClose, onUpdatePlayer, settings, showConfirm, openOnCreate = false, isInline = false, initialBuildId = null, addToast }) => {
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

    // Skill Selector Additions
    const [isSkillDropdownOpen, setIsSkillDropdownOpen] = useState(false);
    const [skillSearchQuery, setSkillSearchQuery] = useState('');
    const skillDropdownRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (skillDropdownRef.current && !skillDropdownRef.current.contains(e.target)) {
                setIsSkillDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const currentSkills = [
        newBuild.skill1,
        newBuild.skill2,
        newBuild.skill3,
        newBuild.skill4,
        newBuild.skill5
    ].filter(Boolean);

    const coreSkills = Array.isArray(player.skills || player.Skills)
        ? (player.skills || player.Skills).filter(Boolean)
        : [];

    const availableSkills = ALL_SKILLS.filter(
        (skill) => !coreSkills.includes(skill) && !currentSkills.includes(skill)
    ).filter(
        (skill) => !skillSearchQuery || skill.toLowerCase().includes(skillSearchQuery.toLowerCase())
    );

    const handleAddSkill = (skillName) => {
        let updatedObj = { ...newBuild };
        for (let i = 1; i <= 5; i++) {
            if (!updatedObj[`skill${i}`]) {
                updatedObj[`skill${i}`] = skillName;
                break;
            }
        }
        setNewBuild(updatedObj);
        setIsSkillDropdownOpen(false);
        setSkillSearchQuery('');
    };

    const handleRemoveSkill = (skillIndex) => {
        const updated = currentSkills.filter((_, idx) => idx !== skillIndex);
        const updatedObj = { ...newBuild };
        for (let i = 1; i <= 5; i++) {
            updatedObj[`skill${i}`] = updated[i - 1] || '';
        }
        setNewBuild(updatedObj);
    };

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
            if (addToast) {
                addToast(newBuild.name || 'Build', 'build_added');
            }
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
        const build = progressions.find(p => p.id === id);
        const buildName = build ? build.name : 'Build';
        showConfirm('Delete Build', 'Delete this build?', () => {
            const updated = progressions.filter(p => p.id !== id);
            saveToBackend(updated);
            if (addToast) {
                addToast(buildName, 'build_removed');
            }
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
                <img src={getProgressionIcon('shooting')} alt="" className="w-4 h-4 object-contain" />
            )
        },
        {
            key: 'passing', label: 'Passing', icon: (
                <img src={getProgressionIcon('passing')} alt="" className="w-4 h-4 object-contain" />
            )
        },
        {
            key: 'dribbling', label: 'Dribbling', icon: (
                <img src={getProgressionIcon('dribbling')} alt="" className="w-4 h-4 object-contain" />
            )
        },
        {
            key: 'dexterity', label: 'Dexterity', icon: (
                <img src={getProgressionIcon('dexterity')} alt="" className="w-4 h-4 object-contain" />
            )
        },
        {
            key: 'lowerBody', label: 'Lower Body Strength', icon: (
                <img src={getProgressionIcon('lowerBody')} alt="" className="w-4 h-4 object-contain" />
            )
        },
        {
            key: 'aerial', label: 'Aerial Strength', icon: (
                <img src={getProgressionIcon('aerial')} alt="" className="w-4 h-4 object-contain" />
            )
        },
        {
            key: 'defending', label: 'Defending', icon: (
                <img src={getProgressionIcon('defending')} alt="" className="w-4 h-4 object-contain" />
            )
        },
        {
            key: 'gk1', label: 'GK 1', icon: (
                <img src={getProgressionIcon('gk1')} alt="" className="w-4 h-4 object-contain" />
            )
        },
        {
            key: 'gk2', label: 'GK 2', icon: (
                <img src={getProgressionIcon('gk2')} alt="" className="w-4 h-4 object-contain" />
            )
        },
        {
            key: 'gk3', label: 'GK 3', icon: (
                <img src={getProgressionIcon('gk3')} alt="" className="w-4 h-4 object-contain" />
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
                        <div className="flex items-center gap-2 flex-wrap relative" ref={skillDropdownRef}>
                            {currentSkills.map((skill, index) => {
                                const displayClean = skill.replace('⚡', '').trim();
                                const isSpecial = SPECIAL_SKILLS.includes(displayClean) || skill.includes('⚡');
                                return (
                                    <div
                                        key={index}
                                        className={`flex items-center h-[28px] gap-1.5 px-[12px] rounded-full transition-all font-inter text-[12px] font-bold tracking-tight border ${
                                            isSpecial
                                                ? 'bg-red-500/10 border-red-500/30 text-red-300'
                                                : 'bg-blue-500/10 border-blue-500/30 text-blue-300'
                                        }`}
                                    >
                                        <span>{displayClean}</span>
                                        {isSpecial && <span className="text-red-400">⚡</span>}
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveSkill(index)}
                                            className="text-white/40 hover:text-white text-xs leading-none ml-1 flex-shrink-0 active:scale-90 transition-all font-bold"
                                            title="Remove skill"
                                        >
                                            ✕
                                        </button>
                                    </div>
                                );
                            })}

                            {currentSkills.length < 5 && (
                                <div className="relative">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setIsSkillDropdownOpen(!isSkillDropdownOpen);
                                            setSkillSearchQuery('');
                                        }}
                                        className="flex items-center h-[28px] gap-1 px-[12px] bg-white/[0.03] border border-dashed border-white/20 rounded-full hover:bg-white/[0.08] hover:border-white/40 transition-all text-white/50 text-[12px] font-bold tracking-tight font-inter"
                                    >
                                        <span className="text-xs font-black">+</span>
                                        <span>Add skill</span>
                                    </button>

                                    {isSkillDropdownOpen && (
                                        <div className="absolute left-0 top-full mt-1.5 bg-[#18181c] border border-white/15 rounded-xl shadow-[0_10px_30px_rgba(0,0,0,0.8)] z-[80] overflow-hidden min-w-[220px]">
                                            <div className="p-2 border-b border-white/5">
                                                <input
                                                    autoFocus
                                                    type="text"
                                                    value={skillSearchQuery}
                                                    onChange={(e) => setSkillSearchQuery(e.target.value)}
                                                    placeholder="Search skills..."
                                                    className="w-full bg-white/5 border border-white/10 rounded-lg px-[10px] h-[26px] text-xs font-medium tracking-tight font-inter text-white placeholder-white/20 focus:outline-none focus:border-blue-400/40"
                                                />
                                            </div>
                                            <div className="overflow-y-auto max-h-[160px] custom-scrollbar">
                                                {availableSkills.map((skill) => (
                                                    <button
                                                        key={skill}
                                                        type="button"
                                                        onClick={() => handleAddSkill(skill)}
                                                        className="w-full text-left px-[10px] h-[28px] text-xs font-medium tracking-tight font-inter text-white/60 hover:text-white hover:bg-white/5 flex items-center gap-2 border-b border-white/5 last:border-0 transition-all"
                                                    >
                                                        <span className="w-1.5 h-1.5 rounded-full flex-shrink-0 bg-ef-accent/40"></span>
                                                        {skill}
                                                    </button>
                                                ))}
                                                {availableSkills.length === 0 && (
                                                    <div className="px-3 py-4 text-center text-xs font-medium tracking-tight text-white/30 font-inter">
                                                        No skills found
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
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
                                                    <span className="w-4 h-4 flex-shrink-0 flex items-center justify-center">{stat.icon}</span>
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
