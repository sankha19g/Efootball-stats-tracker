import { useState, useEffect, useCallback, lazy, Suspense } from 'react';
import PlayerCard from './components/PlayerCard';
import { subscribeToAuthChanges, logout } from './services/authService';
import {
  getPlayers,
  addPlayer,
  updatePlayer,
  deletePlayer,
  uploadBase64Image
} from './services/playerService';
import { getApps, addApp, deleteApp } from './services/miscService';
import { PLAYSTYLES } from './constants';

// Lazy Load Heavy Components
const SidebarNav = lazy(() => import('./components/SidebarNav'));
const PlayerForm = lazy(() => import('./components/PlayerForm'));
const Leaderboard = lazy(() => import('./components/Leaderboard'));
const ScanCardModal = lazy(() => import('./components/ScanCardModal'));
const PlayerDetailsModal = lazy(() => import('./components/PlayerDetailsModal'));
const ScreenshotsModal = lazy(() => import('./components/ScreenshotsModal'));
const LinksModal = lazy(() => import('./components/LinksModal'));
const LoginModal = lazy(() => import('./components/LoginModal'));
const SettingsModal = lazy(() => import('./components/SettingsModal'));
const AppsDrawer = lazy(() => import('./components/AppsDrawer'));

function App() {
  const [players, setPlayers] = useState([]);
  const [view, setView] = useState('list'); // 'list' or 'leaderboard'
  const [loading, setLoading] = useState(true);

  // Scanner State
  const [showScanner, setShowScanner] = useState(false);
  const [showAddPlayer, setShowAddPlayer] = useState(false);
  const [showScreenshots, setShowScreenshots] = useState(false);
  const [showLinks, setShowLinks] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [scannedData, setScannedData] = useState(null);

  // App Preferences
  const [settings, setSettings] = useState({
    cardSize: 'sm',
    showLabels: true,
    showRatings: true,
    showStats: true,
    highPerf: false
  });

  // Login State
  const [showLogin, setShowLogin] = useState(false);
  const [user, setUser] = useState(null);
  const [_isAuthenticated, setIsAuthenticated] = useState(false);

  // Listen to Auth Changes
  useEffect(() => {
    const unsubscribe = subscribeToAuthChanges((firebaseUser) => {
      if (firebaseUser) {
        // Map Firebase User to App User format
        setUser({
          uid: firebaseUser.uid,
          name: firebaseUser.displayName || firebaseUser.email.split('@')[0],
          email: firebaseUser.email,
          picture: firebaseUser.photoURL || `https://ui-avatars.com/api/?name=${firebaseUser.email}&background=random`
        });
        setIsAuthenticated(true);
      } else {
        setUser(null);
        setIsAuthenticated(false);
        setPlayers([]);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Fetch Players and Apps when user changes
  useEffect(() => {
    const fetchUserData = async () => {
      if (user?.uid) {
        setLoading(true);
        try {
          const [playerData, appData] = await Promise.all([
            getPlayers(user.uid),
            getApps(user.uid)
          ]);
          setPlayers(playerData);

          // Sort apps based on localStorage order
          const storedOrder = localStorage.getItem('ef-apps-order');
          let sortedApps = appData;
          if (storedOrder) {
            try {
              const orderIds = JSON.parse(storedOrder);
              sortedApps = [...appData].sort((a, b) => {
                const indexA = orderIds.indexOf(a.id);
                const indexB = orderIds.indexOf(b.id);
                // Items without stored order go to end
                if (indexA === -1 && indexB === -1) return 0;
                if (indexA === -1) return 1;
                if (indexB === -1) return -1;
                return indexA - indexB;
              });
            } catch (e) {
              console.warn('Failed to parse app order', e);
            }
          }
          setApps(sortedApps);
        } catch (err) {
          console.error("Error fetching user data:", err);
        } finally {
          setLoading(false);
        }
      }
    };
    fetchUserData();
  }, [user]);

  const [apps, setApps] = useState([]);

  const handleAddApp = async (app) => {
    if (!user) return;
    try {
      const addedApp = await addApp(user.uid, app);
      setApps(prev => [addedApp, ...prev]);
      alert(`${app.name} added to your Apps Drawer!`);
    } catch (err) {
      console.error("Error adding app:", err);
      alert("Failed to add app shortcut.");
    }
  };

  const handleDeleteApp = async (appId) => {
    if (!user) return;
    try {
      await deleteApp(user.uid, appId);
      setApps(prev => prev.filter(app => app.id !== appId));
    } catch (err) {
      console.error("Error deleting app:", err);
    }
  };

  const handleReorderApps = (newApps) => {
    setApps(newApps);
    localStorage.setItem('ef-apps-order', JSON.stringify(newApps.map(a => a.id)));
  };

  const handleLogout = async () => {
    if (window.confirm('Are you sure you want to log out?')) {
      await logout();
      setUser(null);
      setIsAuthenticated(false);
      setPlayers([]);
      setApps([]);
    }
  };

  // Filter & Sort State
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState('rating'); // rating, goals, assists
  const [filterPos, setFilterPos] = useState('All');
  const [filterType, setFilterType] = useState('All');

  // Selection Mode State
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set());

  // Leaderboard Specific Filters
  const [lbFilters, setLbFilters] = useState({
    positions: [], // empty means all
    club: '',
    league: '',
    country: '',
    cardTypes: [],
    playstyles: []
  });
  const [isLbFiltersExpanded, setIsLbFiltersExpanded] = useState(false);

  const toggleLbFilter = (key, value) => {
    setLbFilters(prev => {
      const currentArr = prev[key] || [];
      const newArr = currentArr.includes(value)
        ? currentArr.filter(v => v !== value)
        : [...currentArr, value];
      return { ...prev, [key]: newArr };
    });
  };

  const handleAddPlayer = async (newPlayer) => {
    if (!user) return;

    try {
      let playerToAdd = { ...newPlayer };
      let imageUploadFailed = false;

      // Helper for timeout (8 seconds)
      const uploadWithTimeout = (p) => Promise.race([
        p,
        new Promise((_, reject) => setTimeout(() => reject(new Error('Upload timed out')), 8000))
      ]);

      // Handle Image Upload if Base64
      if (playerToAdd.image && playerToAdd.image.startsWith('data:image')) {
        try {
          const imageUrl = await uploadWithTimeout(uploadBase64Image(user.uid, playerToAdd.image));
          playerToAdd.image = imageUrl;
        } catch (imgErr) {
          console.error("Image upload failed:", imgErr);
          // If upload fails/times out, we still save the player but without the image
          imageUploadFailed = true;
          playerToAdd.image = '';
        }
      }

      // Handle Progressions Images if Base64
      if (playerToAdd.progressions && Array.isArray(playerToAdd.progressions)) {
        playerToAdd.progressions = await Promise.all(playerToAdd.progressions.map(async (p) => {
          if (p.image && p.image.startsWith('data:image')) {
            try {
              const url = await uploadWithTimeout(uploadBase64Image(user.uid, p.image));
              return { ...p, image: url };
            } catch (err) {
              console.error("Progression image upload failed:", err);
              return { ...p, image: '' };
            }
          }
          return p;
        }));
      }

      const addedPlayer = await addPlayer(user.uid, playerToAdd);

      setPlayers(prev => [addedPlayer, ...prev]);
      setView('list');

      if (imageUploadFailed) {
        alert('Player added successfully, but the image failed to upload (network timeout or error). You can try uploading it again by editing the player.');
      }
    } catch (err) {
      console.error('Error adding player:', err);
      alert(`Failed to save player: ${err.message}`);
    }
  };

  const handleToggleSelect = useCallback((id) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  }, []);

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0 || !user) return;

    if (!window.confirm(`Are you sure you want to delete ${selectedIds.size} players?`)) return;

    try {
      console.log('Deleting IDs:', Array.from(selectedIds));
      // Execute all deletes
      await Promise.all(
        Array.from(selectedIds).map(id => deletePlayer(user.uid, id))
      );

      // Cleanup
      setPlayers(prev => prev.filter(p => !selectedIds.has(p._id)));
      setSelectedIds(new Set());
      setIsSelectionMode(false);
    } catch (err) {
      console.error('Error deleting players:', err);
      alert('Failed to delete some players.');
    }
  };

  // Search State
  const [searchQuery, setSearchQuery] = useState('');

  // Filter & Sort Logic
  const getProcessedPlayers = () => {
    let result = [...players];

    // Search Filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(p =>
        p.name.toLowerCase().includes(query) ||
        p.club?.toLowerCase().includes(query) ||
        p.position?.toLowerCase().includes(query)
      );
    }

    // Filter
    if (filterPos !== 'All') {
      result = result.filter(p => p.position === filterPos);
    }
    if (filterType !== 'All') {
      result = result.filter(p => p.cardType === filterType);
    }

    // Sort
    result.sort((a, b) => {
      if (sortBy === 'rating') return (b.rating || 0) - (a.rating || 0);
      if (sortBy === 'goals') return (b.goals || 0) - (a.goals || 0);
      if (sortBy === 'assists') return (b.assists || 0) - (a.assists || 0);
      if (sortBy === 'name') return (a.name || '').localeCompare(b.name || '');
      if (sortBy === 'position') return (a.position || '').localeCompare(b.position || '');
      return 0;
    });

    return result;
  };

  const handleUpdatePlayer = async (id, updates, shouldClose = true) => {
    if (!user) return;

    try {
      let updatesToSave = { ...updates };
      let imageUploadFailed = false;

      // Handle Image Upload if Base64
      if (updatesToSave.image && updatesToSave.image.startsWith('data:image')) {
        try {
          const imageUrl = await uploadBase64Image(user.uid, updatesToSave.image);
          updatesToSave.image = imageUrl;
        } catch (imgErr) {
          console.error("Image upload failed:", imgErr);
          imageUploadFailed = true;
          updatesToSave.image = ''; // Fallback
        }
      }

      // Handle Progressions Images if Base64
      if (updatesToSave.progressions && Array.isArray(updatesToSave.progressions)) {
        updatesToSave.progressions = await Promise.all(updatesToSave.progressions.map(async (p) => {
          if (p.image && p.image.startsWith('data:image')) {
            try {
              const url = await uploadBase64Image(user.uid, p.image);
              return { ...p, image: url };
            } catch (err) {
              console.error("Progression image upload failed:", err);
              return { ...p, image: '' };
            }
          }
          return p;
        }));
      }

      await updatePlayer(user.uid, id, updatesToSave);

      setPlayers(prev => prev.map(p => p._id === id ? { ...p, ...updatesToSave } : p));

      if (shouldClose) {
        setSelectedPlayer(null); // Close modal on save
        setStartInEditMode(false); // Reset mode
      } else {
        // If keeping open, update local state to reflect changes
        setSelectedPlayer(updatesToSave);
      }

      if (imageUploadFailed) {
        alert('Player updated, but image failed to upload.');
      }
    } catch (err) {
      console.error('Error updating player:', err);
      alert(`Failed to update player: ${err.message}`);
    }
  };

  const processedPlayers = getProcessedPlayers();

  // Selected Player for Details Modal
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [startInEditMode, setStartInEditMode] = useState(false);


  const LoadingFallback = () => (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-ef-accent"></div>
    </div>
  );

  return (
    <div className={`min-h-screen p-3 md:p-8 transition-colors duration-500 ${settings.highPerf ? 'eco-mode ![animation:none] ![transition:none] *:![animation:none] *:![transition:none]' : ''}`}>
      <header className="max-w-6xl mx-auto mb-8 sm:mb-12">
        {/* Mobile Top Bar (following sketch) */}
        <div className="flex md:hidden items-center gap-4 mb-4 pt-1.5 pl-12">
          <h1 className="text-2xl font-black text-white tracking-tighter uppercase italic">
            eFootball <span className="text-ef-accent">Stats</span>
          </h1>
        </div>

        {/* Desktop Title Section */}
        <div className="hidden md:flex flex-col md:flex-row justify-between items-center gap-8 mb-12">
          <div className="flex flex-col items-center md:items-start group">
            <h1 className="text-4xl md:text-6xl font-black text-white tracking-tighter leading-none transition-transform duration-500 group-hover:scale-[1.02]">
              eFOOTBALL <span className="text-ef-accent bg-gradient-to-r from-ef-accent to-ef-blue bg-clip-text text-transparent">STATS.</span>
            </h1>
            <div className="mt-4 flex items-center gap-3">
              <div className="h-1 w-12 bg-ef-accent rounded-full"></div>
              <p className="text-[10px] md:text-xs font-black uppercase tracking-[0.4em] opacity-40">Squad Management Hub v1.0.4</p>
            </div>
          </div>

          <div className="flex bg-white/5 rounded-xl p-1 border border-white/5">
            <button
              onClick={() => setView('list')}
              className={`px-6 py-2 rounded-lg transition text-sm font-bold ${view === 'list' ? 'bg-ef-blue text-white shadow-lg shadow-ef-blue/20' : 'text-white/40 hover:text-white'}`}
            >
              Squad
            </button>
            <button
              onClick={() => setView('leaderboard')}
              className={`px-6 py-2 rounded-lg transition text-sm font-bold ${view === 'leaderboard' ? 'bg-ef-blue text-white shadow-lg shadow-ef-blue/20' : 'text-white/40 hover:text-white'}`}
            >
              Ranks
            </button>
          </div>
        </div>

        {/* Mobile Tab Switcher */}
        <nav className="md:hidden grid grid-cols-2 gap-2 p-1 bg-white/5 border border-white/10 rounded-2xl mb-4">
          <button
            onClick={() => setView('list')}
            className={`py-2 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${view === 'list' ? 'bg-ef-accent text-black shadow-lg shadow-ef-accent/20' : 'text-white/40 bg-transparent'}`}
          >
            Squad
          </button>
          <button
            onClick={() => setView('leaderboard')}
            className={`py-2 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${view === 'leaderboard' ? 'bg-ef-accent text-black shadow-lg shadow-ef-accent/20' : 'text-white/40 bg-transparent'}`}
          >
            Ranks
          </button>
        </nav>
      </header>

      {/* Standalone Search Bar Section */}
      {
        view === 'list' && (
          <div className="max-w-6xl mx-auto mb-4 flex flex-col gap-4">
            {/* Search row (Responsive: Grid on Mobile, Flex on Desktop) */}
            <div className="flex flex-row items-stretch gap-2 md:gap-4 overflow-x-auto no-scrollbar pb-2 md:pb-0">
              {/* Search input (Flexible width) */}
              <div className="relative flex-1 min-w-[150px] group">
                <input
                  type="text"
                  placeholder={window.innerWidth < 640 ? "Search..." : "Search players by name, club, position..."}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl md:rounded-2xl px-10 md:px-12 py-3 md:py-4 text-white focus:outline-none focus:border-ef-accent/50 focus:bg-white/10 transition-all font-bold placeholder:text-white/20 shadow-xl text-xs md:text-sm"
                />
                <span className="absolute left-3 md:left-4 top-1/2 -translate-y-1/2 opacity-20 text-sm md:text-xl">🔍</span>
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 md:right-4 top-1/2 -translate-y-1/2 w-5 h-5 md:w-6 md:h-6 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white/40 hover:text-white transition-all overflow-hidden"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Action buttons group for mobile (following sketch) */}
              <div className="flex items-stretch gap-2">
                {/* Filter button */}
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`flex items-center justify-center w-12 md:w-auto md:px-6 py-3 md:py-4 rounded-xl md:rounded-2xl font-black uppercase tracking-widest text-[10px] md:text-xs transition-all border shadow-xl ${showFilters ? 'bg-ef-accent text-black border-ef-accent shadow-ef-accent/20' : 'bg-ef-card text-white border-white/10 hover:bg-white/5'}`}
                  title="Filter & Sort"
                >
                  <span className={`transition-transform duration-500 ${showFilters ? 'rotate-90' : ''}`}>
                    {showFilters ? (
                      <span className="text-sm">✕</span>
                    ) : (
                      <svg className="w-4 h-4 md:w-5 md:h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="4" y1="21" x2="4" y2="14" />
                        <line x1="4" y1="10" x2="4" y2="3" />
                        <line x1="12" y1="21" x2="12" y2="12" />
                        <line x1="12" y1="8" x2="12" y2="3" />
                        <line x1="20" y1="21" x2="20" y2="16" />
                        <line x1="20" y1="12" x2="20" y2="3" />
                        <line x1="2" y1="14" x2="6" y2="14" />
                        <line x1="10" y1="8" x2="14" y2="8" />
                        <line x1="18" y1="16" x2="22" y2="16" />
                      </svg>
                    )}
                  </span>
                  <span className="hidden md:inline ml-3">Filter & Sort</span>
                  <span className={`hidden md:inline ml-2 text-xs transition-transform duration-300 ${showFilters ? 'rotate-180' : ''}`}>▼</span>
                </button>

                {/* Total box (Small on mobile) */}
                <div className="flex flex-col items-center justify-center px-4 md:px-6 bg-ef-card border border-white/10 rounded-xl md:rounded-2xl shadow-xl min-w-[60px] md:min-w-[120px]">
                  <span className="text-[7px] md:text-[10px] font-black uppercase tracking-tighter opacity-40">Total</span>
                  <span className="text-base md:text-xl font-black text-ef-accent">{processedPlayers.length}</span>
                </div>

                {/* Select button (Mobile-only icon + Text on Select) */}
                {user && (
                  <button
                    onClick={() => {
                      if (isSelectionMode) {
                        if (selectedIds.size > 0 && window.confirm(`Delete ${selectedIds.size} cards?`)) {
                          handleBulkDelete();
                        } else {
                          setIsSelectionMode(false);
                          setSelectedIds(new Set());
                        }
                      } else {
                        setIsSelectionMode(true);
                      }
                    }}
                    className={`flex items-center justify-center px-4 md:px-6 py-3 md:py-4 rounded-xl md:rounded-2xl font-black uppercase tracking-widest text-[10px] md:text-xs transition-all border shadow-xl ${isSelectionMode ? (selectedIds.size > 0 ? 'bg-red-500 text-white border-red-500' : 'bg-white/20 text-white border-white/30') : 'bg-white/5 text-white/60 border-white/10 hover:bg-white/10'}`}
                  >
                    <span>{isSelectionMode ? (selectedIds.size > 0 ? '🗑️' : '✕') : '✓'}</span>
                    <span className="hidden md:inline ml-3">{isSelectionMode ? (selectedIds.size > 0 ? `Del (${selectedIds.size})` : 'Cancel') : 'Select'}</span>
                    <span className="md:hidden ml-1">{isSelectionMode && selectedIds.size > 0 && selectedIds.size}</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        )
      }

      {/* Toggleable Filter/Sort Controls */}
      {
        view === 'list' && showFilters && (
          <div className="max-w-6xl mx-auto mb-8 p-6 bg-ef-card border border-white/20 rounded-3xl animate-slide-up shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-ef-accent"></div>

            <div className="flex flex-col md:flex-row gap-8">
              {/* Left Column: Filters */}
              <div className="flex-1 space-y-6">
                <div>
                  <label className="block text-xs font-black uppercase tracking-widest opacity-40 mb-3">Position Filter</label>
                  <div className="flex flex-wrap gap-2">
                    {['All', 'CF', 'SS', 'LWF', 'RWF', 'AMF', 'CMF', 'DMF', 'CB', 'LB', 'RB', 'GK'].map(pos => (
                      <button
                        key={pos}
                        onClick={() => setFilterPos(pos)}
                        className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${filterPos === pos ? 'bg-ef-accent text-ef-dark shadow-lg shadow-ef-accent/20 scale-105' : 'bg-white/5 text-white/40 hover:bg-white/10 hover:text-white'}`}
                      >
                        {pos}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-black uppercase tracking-widest opacity-40 mb-3">Card Type Filter</label>
                  <div className="flex flex-wrap gap-2">
                    {['All', 'Normal', 'Legend', 'Epic', 'Featured', 'POTW', 'BigTime', 'ShowTime'].map(type => (
                      <button
                        key={type}
                        onClick={() => setFilterType(type)}
                        className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${filterType === type ? 'bg-ef-accent text-ef-dark shadow-lg shadow-ef-accent/20 scale-105' : 'bg-white/5 text-white/40 hover:bg-white/10 hover:text-white'}`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Divider */}
              <div className="w-full md:w-px h-px md:h-auto bg-white/10 flex-shrink-0"></div>

              {/* Right Column: Sort */}
              <div className="md:w-72 flex flex-col justify-start">
                <label className="block text-xs font-black uppercase tracking-widest opacity-40 mb-3">Sort By</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-5 py-3 text-sm font-bold outline-none cursor-pointer hover:border-ef-accent/50 transition-all text-white"
                >
                  <option value="rating" className="text-black">Overall Rating</option>
                  <option value="goals" className="text-black">Top Scorer</option>
                  <option value="assists" className="text-black">Most Assists</option>
                  <option value="name" className="text-black">Player Name</option>
                  <option value="position" className="text-black">Position</option>
                </select>
              </div>
            </div>
          </div>
        )
      }

      <Suspense fallback={<LoadingFallback />}>
        <SidebarNav
          view={view}
          setView={setView}
          setShowScanner={setShowScanner}
          setShowAddPlayer={setShowAddPlayer}
          setShowScreenshots={setShowScreenshots}
          setShowLinks={setShowLinks}
          setShowSettings={setShowSettings}
          user={user}
          setShowLogin={setShowLogin}
          handleLogout={handleLogout}
        />
        <main className="max-w-6xl mx-auto animate-fade-in pb-20 pt-4 md:pt-0">


          {showScanner && (
            <ScanCardModal
              onClose={() => setShowScanner(false)}
              onScanComplete={(data) => {
                setScannedData(data);
                setShowScanner(false);
                setShowAddPlayer(true);
              }}
            />
          )}

          {showAddPlayer && (
            <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 animate-fade-in">
              <div className="w-full max-w-2xl relative animate-slide-up">
                <button
                  onClick={() => {
                    setShowAddPlayer(false);
                    setScannedData(null);
                  }}
                  className="hidden md:flex absolute -top-12 right-0 text-white/60 hover:text-white transition text-xl font-bold bg-white/5 w-10 h-10 rounded-full items-center justify-center border border-white/10"
                >
                  ✕
                </button>
                <PlayerForm
                  onAdd={(data) => {
                    handleAddPlayer(data);
                    setShowAddPlayer(false);
                    setScannedData(null);
                  }}
                  initialData={scannedData}
                  onClose={() => {
                    setShowAddPlayer(false);
                    setScannedData(null);
                  }}
                />
              </div>
            </div>
          )}

          {selectedPlayer && (
            <PlayerDetailsModal
              player={selectedPlayer}
              players={players}
              onClose={() => {
                setSelectedPlayer(null);
                setStartInEditMode(false);
              }}
              onUpdate={handleUpdatePlayer}
              initialEditMode={startInEditMode}
              settings={settings}
            />
          )}

          {showScreenshots && (
            <ScreenshotsModal user={user} onClose={() => setShowScreenshots(false)} />
          )}

          {showLinks && (
            <LinksModal user={user} onClose={() => setShowLinks(false)} onAddApp={handleAddApp} />
          )}

          {showSettings && (
            <SettingsModal
              settings={settings}
              setSettings={setSettings}
              onClose={() => setShowSettings(false)}
            />
          )}

          {showLogin && (
            <LoginModal
              onClose={() => setShowLogin(false)}
            />
          )}

          {/* Persistent Apps Drawer */}
          {user && (
            <AppsDrawer apps={apps} onDeleteApp={handleDeleteApp} onReorderApps={handleReorderApps} />
          )}

          {/* Main Content Area */}
          <div className="animate-slide-up" style={{ animationDelay: '0.2s' }}>
            {loading ? (
              <div className="text-center py-20 opacity-50">Loading stats...</div>
            ) : (
              <>
                {view === 'list' ? (
                  <div className={`grid ${settings.cardSize === 'xs' ? 'grid-cols-5 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-1' :
                    settings.cardSize === 'sm' ? 'grid-cols-4 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-2 md:gap-3' :
                      settings.cardSize === 'md' ? 'grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-4' :
                        'grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6'
                    } ${settings.highPerf ? '![animation:none]' : ''}`}>
                    {processedPlayers.map(player => (
                      <div key={player._id} onClick={() => !isSelectionMode && setSelectedPlayer(player)}>
                        <PlayerCard
                          player={player}
                          isSelectionMode={isSelectionMode}
                          isSelected={selectedIds.has(player._id)}
                          onToggleSelect={handleToggleSelect}
                          settings={settings}
                        />
                      </div>
                    ))}
                    {processedPlayers.length === 0 && (
                      <div className="col-span-full text-center py-20 opacity-30 border-2 border-dashed border-white/10 rounded-xl">
                        {user ? 'No players found. Add your first card!' : 'Please login to view your squad.'}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Leaderboard Multi-Filters */}
                    <div className="bg-ef-card border border-white/10 rounded-2xl shadow-xl animate-dropdown mb-6 overflow-hidden">
                      <button
                        onClick={() => setIsLbFiltersExpanded(!isLbFiltersExpanded)}
                        className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-all text-left"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-ef-accent text-lg">⚡</span>
                          <div className="flex flex-col">
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white">Ranking Filters</span>
                            <span className="text-[8px] opacity-30 uppercase font-bold tracking-widest">{isLbFiltersExpanded ? 'Click to collapse' : 'Click to expand filters'}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          {!isLbFiltersExpanded && (
                            <div className="hidden md:flex items-center gap-2">
                              {lbFilters.positions.length > 0 && (
                                <span className="text-[8px] px-1.5 py-0.5 rounded bg-ef-accent/10 border border-ef-accent/20 text-ef-accent font-black">{lbFilters.positions.length} POS</span>
                              )}
                              {(lbFilters.club || lbFilters.league || lbFilters.country) && (
                                <span className="text-[8px] px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-white/40 font-black">SEARCH ACTIVE</span>
                              )}
                            </div>
                          )}
                          <span className={`text-[10px] opacity-40 transition-transform duration-300 ${isLbFiltersExpanded ? 'rotate-180' : ''}`}>▼</span>
                        </div>
                      </button>

                      {isLbFiltersExpanded && (
                        <div className="p-6 pt-0 border-t border-white/5 transition-all duration-300">
                          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
                            <div className="md:col-span-4">
                              <label className="block text-[10px] font-black uppercase tracking-[0.2em] opacity-40 mb-3">Positions</label>
                              <div className="flex flex-wrap gap-2">
                                {['CF', 'SS', 'LWF', 'RWF', 'AMF', 'CMF', 'DMF', 'CB', 'LB', 'RB', 'GK'].map(pos => (
                                  <button
                                    key={pos}
                                    onClick={() => toggleLbFilter('positions', pos)}
                                    className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${lbFilters.positions.includes(pos)
                                      ? 'bg-ef-accent border-ef-accent text-ef-dark shadow-lg shadow-ef-accent/20'
                                      : 'bg-white/5 border-white/10 text-white/40 hover:text-white hover:border-white/20'
                                      }`}
                                  >
                                    {pos}
                                  </button>
                                ))}
                                {lbFilters.positions.length > 0 && (
                                  <button
                                    onClick={() => setLbFilters(prev => ({ ...prev, positions: [] }))}
                                    className="px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest bg-red-500/10 border border-red-500/20 text-red-500 hover:bg-red-500/20 transition-all"
                                  >
                                    Reset
                                  </button>
                                )}
                              </div>
                            </div>
                            <div>
                              <label className="block text-xs font-black uppercase tracking-widest opacity-40 mb-2">Club</label>
                              <input
                                type="text"
                                placeholder="e.g. Barcelona"
                                value={lbFilters.club}
                                onChange={(e) => setLbFilters({ ...lbFilters, club: e.target.value })}
                                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm font-bold text-white outline-none focus:border-ef-accent transition-all"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-black uppercase tracking-widest opacity-40 mb-2">League</label>
                              <input
                                type="text"
                                placeholder="e.g. La Liga"
                                value={lbFilters.league}
                                onChange={(e) => setLbFilters({ ...lbFilters, league: e.target.value })}
                                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm font-bold text-white outline-none focus:border-ef-accent transition-all"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-black uppercase tracking-widest opacity-40 mb-2">Country</label>
                              <input
                                type="text"
                                placeholder="e.g. Brazil"
                                value={lbFilters.country}
                                onChange={(e) => setLbFilters({ ...lbFilters, country: e.target.value })}
                                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm font-bold text-white outline-none focus:border-ef-accent transition-all"
                              />
                            </div>
                            <div className="md:col-span-2">
                              <label className="block text-[10px] font-black uppercase tracking-[0.2em] opacity-40 mb-3">Card Types</label>
                              <div className="flex flex-wrap gap-2">
                                {['Normal', 'Legend', 'Epic', 'Featured', 'POTW', 'BigTime', 'ShowTime'].map(type => (
                                  <button
                                    key={type}
                                    onClick={() => toggleLbFilter('cardTypes', type)}
                                    className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all border ${lbFilters.cardTypes.includes(type)
                                      ? 'bg-ef-blue border-ef-blue text-ef-dark shadow-lg'
                                      : 'bg-white/5 border-white/10 text-white/40 hover:text-white'
                                      }`}
                                  >
                                    {type}
                                  </button>
                                ))}
                              </div>
                            </div>
                            <div className="md:col-span-2">
                              <label className="block text-[10px] font-black uppercase tracking-[0.2em] opacity-40 mb-3">Playstyles</label>
                              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 h-32 overflow-y-auto custom-scrollbar pr-2 p-1">
                                {PLAYSTYLES.map(style => (
                                  <button
                                    key={style}
                                    onClick={() => toggleLbFilter('playstyles', style)}
                                    className={`px-2 py-1.5 rounded text-[8px] font-bold text-left uppercase tracking-tighter transition-all border ${lbFilters.playstyles.includes(style)
                                      ? 'bg-white/20 border-white/40 text-white'
                                      : 'bg-white/5 border-white/5 text-white/30 hover:bg-white/10'
                                      }`}
                                  >
                                    {style}
                                  </button>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                    <Leaderboard
                      players={players.filter(p => {
                        const matchesPos = lbFilters.positions.length === 0 || lbFilters.positions.includes(p.position);
                        const matchesClub = !lbFilters.club || p.club?.toLowerCase().includes(lbFilters.club.toLowerCase());
                        const matchesLeague = !lbFilters.league || p.league?.toLowerCase().includes(lbFilters.league.toLowerCase());
                        const matchesCountry = !lbFilters.country || p.nationality?.toLowerCase().includes(lbFilters.country.toLowerCase());
                        const matchesType = lbFilters.cardTypes.length === 0 || lbFilters.cardTypes.includes(p.cardType);
                        const matchesStyle = lbFilters.playstyles.length === 0 || lbFilters.playstyles.includes(p.playstyle);
                        return matchesPos && matchesClub && matchesLeague && matchesCountry && matchesType && matchesStyle;
                      })}
                      onPlayerClick={setSelectedPlayer}
                    />
                  </div>
                )}
              </>
            )}
          </div>
        </main>
      </Suspense>
    </div >
  );
}

export default App;
