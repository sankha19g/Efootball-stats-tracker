import { useState, useEffect } from 'react';
import * as remainderService from '../services/remainderService';

const RemainderModal = ({ onClose, user, showAlert, showConfirm }) => {
    const [remainders, setRemainders] = useState([]);
    const [reminderItems, setReminderItems] = useState([
        { id: '1', title: 'Renew Contract' },
        { id: '2', title: 'Player Upgrade' },
        { id: '3', title: 'Level Up' },
        { id: '4', title: 'Skill Training' }
    ]);
    const [loading, setLoading] = useState(true);
    const [showAddForm, setShowAddForm] = useState(false);
    const [showDB, setShowDB] = useState(false);
    const [newItemTitle, setNewItemTitle] = useState('');
    const [newItemImage, setNewItemImage] = useState('');
    const [formData, setFormData] = useState({
        title: '',
        dueDate: '',
        image: '',
        status: 'pending'
    });

    const [selectedIds, setSelectedIds] = useState([]);
    const [editingRemainderId, setEditingRemainderId] = useState(null);
    const [editingItemId, setEditingItemId] = useState(null);
    const [editItemTitle, setEditItemTitle] = useState('');
    const [editItemImage, setEditItemImage] = useState('');
    const [sortType, setSortType] = useState('date');

    // Fetch Initial Data from Firestore
    useEffect(() => {
        const fetchData = async () => {
            if (!user?.uid) return;
            setLoading(true);
            try {
                const [rData, iData] = await Promise.all([
                    remainderService.getRemainders(user.uid),
                    remainderService.getReminderItems(user.uid)
                ]);

                // If the user has old local data, we could migrate it once here.
                // For simplicity, we'll just use Firestore data.
                setRemainders(rData);
                if (iData && iData.length > 0) {
                    setReminderItems(iData);
                }
            } catch (err) {
                console.error("Error fetching data:", err);
                showAlert('Error', 'Failed to load reminders from Cloud', 'danger');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [user?.uid]);

    const handleAdd = async () => {
        if (!formData.title || !formData.dueDate) {
            showAlert('Error', 'Please fill in the title and due date', 'danger');
            return;
        }

        try {
            const result = await remainderService.saveRemainder(user.uid, {
                ...formData,
                id: editingRemainderId || null
            });

            if (editingRemainderId) {
                setRemainders(remainders.map(r => r.id === editingRemainderId ? result : r));
                showAlert('Success', 'Reminder updated in Cloud', 'success');
            } else {
                setRemainders([result, ...remainders]);
                showAlert('Success', 'Reminder saved to Cloud', 'success');
            }

            setShowAddForm(false);
            setEditingRemainderId(null);
            setFormData({ title: '', dueDate: '', image: '', status: 'pending' });
            setSelectedIds([]);
        } catch (err) {
            console.error("Save error:", err);
            showAlert('Error', 'Failed to save to Cloud', 'danger');
        }
    };

    const handleUpdateDBItem = async () => {
        if (!editItemTitle.trim()) return;
        try {
            const result = await remainderService.saveReminderItem(user.uid, {
                id: editingItemId,
                title: editItemTitle.trim(),
                image: editItemImage
            });

            setReminderItems(reminderItems.map(item => item.id === editingItemId ? result : item));
            setEditingItemId(null);
            setEditItemTitle('');
            setEditItemImage('');
            showAlert('Success', 'Item updated in DB', 'success');
        } catch (err) {
            showAlert('Error', 'Failed to update item in Cloud', 'danger');
        }
    };

    const handleAddDBItem = async () => {
        if (!newItemTitle.trim()) return;
        try {
            const newItem = {
                title: newItemTitle.trim(),
                image: newItemImage
            };
            const result = await remainderService.saveReminderItem(user.uid, newItem);
            setReminderItems([result, ...reminderItems]);
            setNewItemTitle('');
            setNewItemImage('');
            showAlert('Success', 'Item added to DB', 'success');
        } catch (err) {
            showAlert('Error', 'Failed to add item to Cloud', 'danger');
        }
    };

    const handleDeleteDBItem = async (itemId) => {
        showConfirm('Delete Item', 'Are you sure you want to remove this from your Database?', async () => {
            try {
                await remainderService.deleteReminderItem(itemId);
                setReminderItems(reminderItems.filter(i => i.id !== itemId));
                showAlert('Deleted', 'Item removed from DB', 'success');
            } catch (err) {
                showAlert('Error', 'Failed to delete from Cloud', 'danger');
            }
        });
    };

    const handleBulkComplete = async () => {
        if (selectedIds.length === 0) return;
        try {
            await remainderService.bulkCompleteRemainders(selectedIds);
            setRemainders(remainders.map(r =>
                selectedIds.includes(r.id) ? { ...r, status: 'completed' } : r
            ));
            setSelectedIds([]);
            showAlert('Updated', `${selectedIds.length} items marked as completed`, 'success');
        } catch (err) {
            showAlert('Error', 'Failed to update Cloud status', 'danger');
        }
    };

    const handleDelete = async (id, e) => {
        if (e) e.stopPropagation();
        showConfirm('Confirm Delete', 'Are you sure you want to remove this reminder?', async () => {
            try {
                await remainderService.deleteRemainder(id);
                setRemainders(remainders.filter(r => r.id !== id));
                setSelectedIds(prev => prev.filter(i => i !== id));
                showAlert('Deleted', 'Reminder removed from Cloud', 'success');
            } catch (err) {
                showAlert('Error', 'Failed to delete from Cloud', 'danger');
            }
        });
    };

    const handleStartEdit = () => {
        const itemToEdit = remainders.find(r => r.id === selectedIds[0]);
        if (itemToEdit) {
            setFormData({
                title: itemToEdit.title,
                dueDate: itemToEdit.dueDate,
                image: itemToEdit.image || '',
                status: itemToEdit.status
            });
            setEditingRemainderId(itemToEdit.id);
            setShowAddForm(true);
        }
    };

    const toggleSelection = (id) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const handleImageUpload = (e, callback = null) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                if (callback) {
                    callback(reader.result);
                } else {
                    setFormData(prev => ({ ...prev, image: reader.result }));
                }
            };
            reader.readAsDataURL(file);
        }
    };

    const getTimeLeft = (dueDate) => {
        const diff = new Date(dueDate) - new Date();
        if (diff < 0) return 'Overdue';
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        return `${days}d ${hours}h`;
    };

    const sortedRemainders = [...remainders].sort((a, b) => {
        if (sortType === 'name') return a.title.localeCompare(b.title);
        return new Date(a.dueDate) - new Date(b.dueDate);
    });

    if (!user) {
        return (
            <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[1000] p-4 animate-fade-in backdrop-blur-sm">
                <div className="bg-ef-card border border-white/10 rounded-3xl p-8 text-center max-w-sm shadow-2xl">
                    <div className="text-4xl mb-4">🔒</div>
                    <h3 className="text-xl font-bold text-white mb-2 uppercase">Login Required</h3>
                    <p className="text-white/40 text-sm mb-6">Please log in to your account to access and sync your reminders.</p>
                    <button onClick={onClose} className="w-full py-3 bg-ef-accent text-ef-dark font-black rounded-xl text-xs uppercase">Close</button>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[1000] p-4 animate-fade-in backdrop-blur-sm">
            <div className="w-full max-w-2xl bg-ef-card border border-white/10 rounded-3xl shadow-2xl animate-slide-up flex flex-col h-[85vh] relative overflow-hidden">
                {/* Header */}
                <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/5">
                    <h3 className="text-xl font-black flex items-center gap-3">
                        <span className="text-ef-accent">🔔</span>
                        <span className="bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent uppercase italic">Remainder</span>
                    </h3>
                    <div className="flex items-center gap-2">
                        {loading ? (
                            <div className="w-10 h-10 border-2 border-ef-accent/20 border-t-ef-accent rounded-full animate-spin"></div>
                        ) : (
                            <>
                                {selectedIds.length === 1 && (
                                    <button
                                        onClick={handleStartEdit}
                                        className="h-10 px-4 rounded-xl bg-white/10 border border-white/10 text-[9px] font-black uppercase tracking-widest hover:bg-white/20 hover:text-white transition-all flex items-center gap-2"
                                        title="Edit Selected"
                                    >✏️ Edit</button>
                                )}
                                {selectedIds.length > 0 && (
                                    <button
                                        onClick={handleBulkComplete}
                                        className="h-10 px-4 rounded-xl bg-ef-accent text-ef-dark text-[9px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-lg flex items-center gap-2"
                                    >✔️ Done ({selectedIds.length})</button>
                                )}
                                <button
                                    onClick={() => setSortType(sortType === 'date' ? 'name' : 'date')}
                                    className="h-10 px-3 rounded-xl bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest text-white/60 hover:text-white transition-all flex items-center gap-2"
                                >🔃 {sortType === 'date' ? 'Days' : 'Name'}</button>
                                <button
                                    onClick={() => setShowDB(true)}
                                    className="h-10 px-3 rounded-xl bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest text-white/60 hover:text-white transition-all flex items-center gap-2"
                                >🗄️ DB</button>
                                <button
                                    onClick={() => setShowAddForm(true)}
                                    className="w-10 h-10 rounded-xl bg-ef-accent text-ef-dark flex items-center justify-center font-black hover:scale-110 active:scale-95 transition-all shadow-lg"
                                >+</button>
                            </>
                        )}
                        <button onClick={onClose} className="text-white/40 hover:text-white transition-colors ml-2">✕</button>
                    </div>
                </div>

                {/* Content Container */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center h-full space-y-4">
                            <div className="w-12 h-12 border-4 border-ef-accent/20 border-t-ef-accent rounded-full animate-spin"></div>
                            <span className="text-xs uppercase font-black tracking-widest text-white/20">Syncing with Cloud...</span>
                        </div>
                    ) : remainders.length === 0 ? (
                        <div className="text-center py-12 space-y-4">
                            <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-white/10">
                                <span className="text-3xl opacity-20">📝</span>
                            </div>
                            <h4 className="text-lg font-bold text-white uppercase tracking-wider">No Reminders</h4>
                            <p className="text-sm text-white/40 leading-relaxed">Your cloud remains are empty. Add your first one to start syncing!</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            {sortedRemainders.map(item => (
                                <div
                                    key={item.id}
                                    onClick={() => toggleSelection(item.id)}
                                    className={`relative group bg-white/5 border rounded-2xl transition-all cursor-pointer flex flex-col aspect-square overflow-hidden ${selectedIds.includes(item.id) ? 'border-ef-accent ring-1 ring-ef-accent/50' : 'border-white/10'} ${item.status === 'completed' ? 'opacity-40 grayscale-[0.5]' : 'hover:scale-[1.02] active:scale-95 shadow-lg shadow-black/60'}`}
                                >
                                    {item.image ? (
                                        <img src={item.image} alt="" className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                                    ) : (
                                        <div className="absolute inset-0 flex items-center justify-center bg-white/5">
                                            <span className="text-4xl opacity-10">📌</span>
                                        </div>
                                    )}

                                    {selectedIds.includes(item.id) && (
                                        <div className="absolute top-2 left-2 z-[30] w-6 h-6 bg-ef-accent rounded-full flex items-center justify-center text-xs text-ef-dark font-black shadow-lg animate-pop-in">✓</div>
                                    )}

                                    <div className="absolute top-2 right-2 z-[30] flex gap-1">
                                        <button
                                            onClick={(e) => handleDelete(item.id, e)}
                                            className="w-8 h-8 flex items-center justify-center rounded-lg bg-black/60 backdrop-blur-md text-red-500 opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500 hover:text-white shadow-xl"
                                        >🗑️</button>
                                    </div>

                                    <div className="relative z-[20] mt-auto bg-black p-3 space-y-1">
                                        <h4 className={`font-black uppercase tracking-wider text-[14px] leading-tight line-clamp-2 ${item.status === 'completed' ? 'line-through text-white/40' : 'text-white'}`}>
                                            {item.title}
                                        </h4>
                                        <div className="flex flex-col gap-0.5 text-[10px] font-black uppercase tracking-widest">
                                            <span className="text-white/40 truncate">📅 {new Date(item.dueDate).toLocaleDateString()}</span>
                                            <span className={`truncate ${getTimeLeft(item.dueDate) === 'Overdue' ? 'text-red-500 font-black' : 'text-ef-accent'}`}>⏳ {getTimeLeft(item.dueDate)}</span>
                                        </div>
                                        {item.status === 'completed' && (
                                            <div className="absolute top-[-30px] right-2 bg-ef-accent text-ef-dark text-[8px] px-2 py-0.5 rounded font-black tracking-widest uppercase shadow-lg z-[40]">DONE</div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* DB Management View */}
                {showDB && (
                    <div className="absolute inset-0 z-[60] bg-ef-dark/95 animate-fade-in p-6 flex flex-col">
                        <div className="flex justify-between items-center mb-6">
                            <h4 className="text-xl font-black uppercase text-white italic tracking-tighter flex items-center gap-3">
                                <span className="text-ef-accent">🗄️</span> Item Database
                            </h4>
                            <button onClick={() => setShowDB(false)} className="text-white/40 hover:text-white">✕</button>
                        </div>

                        <div className="space-y-4 mb-6">
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    placeholder="Add new preset item name..."
                                    value={newItemTitle}
                                    onChange={e => setNewItemTitle(e.target.value)}
                                    className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-ef-accent/50 transition-all font-bold text-xs"
                                    onKeyDown={(e) => e.key === 'Enter' && handleAddDBItem()}
                                />
                                <button
                                    onClick={handleAddDBItem}
                                    className="px-6 bg-ef-accent text-ef-dark rounded-xl font-black text-xs uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-lg shadow-ef-accent/20"
                                >Add Item</button>
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                                <div className="relative group/upload h-[42px]">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => handleImageUpload(e, (res) => setNewItemImage(res))}
                                        className="absolute inset-0 opacity-0 z-10 cursor-pointer"
                                    />
                                    <div className={`w-full h-full border-2 border-dashed rounded-xl flex items-center justify-center transition-all ${newItemImage && !newItemImage.startsWith('http') ? 'bg-ef-accent/10 border-ef-accent/40 text-ef-accent font-black' : 'bg-white/5 border-white/10 text-white/20 hover:text-white/40'}`}>
                                        <span className="text-[10px] uppercase tracking-[0.2em] font-black">
                                            {newItemImage && !newItemImage.startsWith('http') ? '✅ File Ready' : '📸 + Upload File'}
                                        </span>
                                    </div>
                                </div>
                                <div className="relative h-[42px]">
                                    <input
                                        type="text"
                                        placeholder="Paste image link..."
                                        value={newItemImage && newItemImage.startsWith('http') ? newItemImage : ''}
                                        onChange={e => setNewItemImage(e.target.value)}
                                        className="w-full h-full bg-white/5 border border-white/10 rounded-xl px-3 text-white focus:outline-none focus:border-ef-accent/50 transition-all font-bold text-[10px]"
                                    />
                                    {newItemImage && newItemImage.startsWith('http') && (
                                        <button onClick={() => setNewItemImage('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-white/40 hover:text-white text-xs z-20">✕</button>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto custom-scrollbar p-1 space-y-2">
                            {reminderItems.map(item => (
                                <div key={item.id} className="bg-white/5 border border-white/10 rounded-xl p-3 flex flex-col gap-3 group hover:bg-white/10 transition-all">
                                    {editingItemId === item.id ? (
                                        <div className="space-y-3">
                                            <div className="flex gap-2">
                                                <input
                                                    type="text"
                                                    value={editItemTitle}
                                                    onChange={e => setEditItemTitle(e.target.value)}
                                                    className="flex-1 bg-white/10 border border-white/10 rounded-lg px-3 py-2 text-white text-xs font-bold focus:outline-none"
                                                />
                                                <button onClick={handleUpdateDBItem} className="px-4 py-2 bg-ef-accent text-ef-dark rounded-lg font-black text-[10px] uppercase">Save</button>
                                                <button onClick={() => setEditingItemId(null)} className="px-4 py-2 bg-white/5 text-white/40 rounded-lg font-black text-[10px] uppercase">Cancel</button>
                                            </div>
                                            <div className="grid grid-cols-2 gap-2">
                                                <div className="relative h-8">
                                                    <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, (res) => setEditItemImage(res))} className="absolute inset-0 opacity-0 z-10 cursor-pointer" />
                                                    <div className={`w-full h-full border border-dashed rounded-lg flex items-center justify-center text-[8px] font-black uppercase ${editItemImage && !editItemImage.startsWith('http') ? 'text-ef-accent border-ef-accent/40 bg-ef-accent/5' : 'text-white/20'}`}>
                                                        {editItemImage && !editItemImage.startsWith('http') ? '✅ File' : '📸 File'}
                                                    </div>
                                                </div>
                                                <div className="relative h-8">
                                                    <input type="text" placeholder="Paste link..." value={editItemImage && editItemImage.startsWith('http') ? editItemImage : ''} onChange={e => setEditItemImage(e.target.value)} className="w-full h-full bg-white/5 border border-white/10 rounded-lg px-2 text-white text-[8px] font-bold" />
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex justify-between items-center">
                                            <div className="flex items-center gap-3">
                                                {item.image && (
                                                    <div className="w-8 h-8 rounded-lg overflow-hidden border border-white/10 shrink-0">
                                                        <img src={item.image} alt="" className="w-full h-full object-cover" />
                                                    </div>
                                                )}
                                                <span className="text-[10px] font-black uppercase tracking-widest text-white/80">{item.title}</span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <button onClick={() => { setEditingItemId(item.id); setEditItemTitle(item.title); setEditItemImage(item.image || ''); }} className="text-white/40 opacity-0 group-hover:opacity-100 p-2 hover:bg-white/10 rounded-lg text-xs">✏️</button>
                                                <button onClick={() => handleDeleteDBItem(item.id)} className="text-red-500 opacity-0 group-hover:opacity-100 p-2 hover:bg-red-500/20 rounded-lg text-xs">🗑️</button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>

                        <button onClick={() => setShowDB(false)} className="mt-6 w-full py-4 bg-white/5 border border-white/10 text-white/40 font-black uppercase rounded-2xl text-[10px] hover:text-white">Return to Reminders</button>
                    </div>
                )}

                {/* Add/Edit Form Backdrop */}
                {showAddForm && (
                    <div className="absolute inset-0 z-50 bg-ef-dark/95 animate-fade-in p-6 flex flex-col">
                        <div className="flex justify-between items-center mb-6">
                            <h4 className="text-xl font-black uppercase text-white italic tracking-tighter">
                                {editingRemainderId ? 'Edit Reminder' : 'New Reminder'}
                            </h4>
                            <button onClick={() => { setShowAddForm(false); setEditingRemainderId(null); setFormData({ title: '', dueDate: '', image: '', status: 'pending' }); }} className="text-white/40 hover:text-white">✕</button>
                        </div>

                        <div className="space-y-6 overflow-y-auto custom-scrollbar flex-1 pr-2">
                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-widest opacity-30 mb-2">Select Item From DB</label>
                                <div className="grid grid-cols-2 gap-2 mb-4">
                                    {reminderItems.map(item => (
                                        <button
                                            key={item.id}
                                            onClick={() => setFormData({ ...formData, title: item.title, image: item.image || formData.image })}
                                            className={`p-2 rounded-xl text-[8px] font-black uppercase tracking-tighter text-left border transition-all ${formData.title === item.title ? 'bg-ef-accent border-ef-accent text-ef-dark shadow-lg' : 'bg-white/5 border-white/10 text-white/40 hover:text-white'}`}
                                        >
                                            <div className="flex items-center gap-2">
                                                {item.image && <img src={item.image} className="w-4 h-4 rounded-sm object-cover" alt="" />}
                                                <span>{item.title}</span>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                                <label className="block text-[10px] font-black uppercase tracking-widest opacity-30 mb-2">Or Type New Name</label>
                                <input type="text" placeholder="Enter custom task..." value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-ef-accent/50 transition-all font-bold text-xs" />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-[10px] font-black uppercase tracking-widest opacity-30 mb-2">Due Date</label>
                                        <input type="date" value={formData.dueDate} onChange={e => setFormData({ ...formData, dueDate: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-ef-blue/50" />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black uppercase tracking-widest opacity-30 mb-2">Or Days Remaining</label>
                                        <input type="number" placeholder="7" onChange={e => { const days = parseInt(e.target.value); if (!isNaN(days)) { const date = new Date(); date.setDate(date.getDate() + days); setFormData({ ...formData, dueDate: date.toISOString().split('T')[0] }); } }} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none" />
                                    </div>
                                </div>
                                <div className="flex flex-col justify-between">
                                    <label className="block text-[10px] font-black uppercase tracking-widest opacity-30 mb-2">Image Reference</label>
                                    <div className="grid grid-cols-2 gap-2">
                                        <div className="relative h-[46px]">
                                            <input type="file" accept="image/*" onChange={handleImageUpload} className="absolute inset-0 opacity-0 z-10 cursor-pointer" />
                                            <div className="w-full h-full bg-white/5 border border-white/10 border-dashed rounded-xl flex items-center justify-center text-[10px] font-black uppercase tracking-widest text-white/40">
                                                {formData.image && !formData.image.startsWith('http') ? '✅ File' : '📸 File'}
                                            </div>
                                        </div>
                                        <div className="relative h-[46px]">
                                            <input type="text" placeholder="Paste link..." value={formData.image && formData.image.startsWith('http') ? formData.image : ''} onChange={e => setFormData({ ...formData, image: e.target.value })} className="w-full h-full bg-white/5 border border-white/10 rounded-xl px-3 text-white text-[10px]" />
                                        </div>
                                    </div>
                                    <div className="mt-4 p-3 bg-white/5 border border-white/5 rounded-xl text-center">
                                        <span className={`text-xs font-black text-ef-blue uppercase`}>{formData.dueDate ? getTimeLeft(formData.dueDate) : 'Set Date'}</span>
                                    </div>
                                </div>
                            </div>

                            {formData.image && (
                                <div className="relative w-full aspect-video rounded-2xl overflow-hidden border border-white/10">
                                    <img src={formData.image} alt="" className="w-full h-full object-cover" />
                                    <button onClick={() => setFormData({ ...formData, image: '' })} className="absolute top-2 right-2 p-1 bg-black/60 rounded-lg text-white/60 hover:text-white">✕</button>
                                </div>
                            )}
                        </div>

                        <button onClick={handleAdd} className="mt-6 w-full py-4 bg-ef-accent text-ef-dark font-black uppercase tracking-[0.2em] rounded-2xl text-xs shadow-xl shadow-ef-accent/20">Save Reminder</button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default RemainderModal;
