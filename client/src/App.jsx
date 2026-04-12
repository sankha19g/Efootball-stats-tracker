import { useState, useEffect, useCallback, useMemo, lazy, Suspense, useRef } from 'react';
import PlayerCard from './components/PlayerCard';
import CustomDialog from './components/CustomDialog';
import { subscribeToAuthChanges, logout } from './services/authService';
import {
  getPlayers,
  addPlayer,
  updatePlayer,
  deletePlayer,
  uploadBase64Image,
  addPlayersBulk,
  updatePlayersBulk,
  batchUpdatePlayers,
  batchAddPlayers
} from './services/playerService';
import { getApps, addApp, deleteApp } from './services/miscService';
import { getSquads, saveSquad, deleteSquad } from './services/squadService';
import { searchTeams, searchLeagues, normalizeString } from './services/footballApi';
import { PLAYSTYLES, ALL_SKILLS, PLAYER_SKILLS, SPECIAL_SKILLS } from './constants';

// Lazy Load Heavy Components
const SidebarNav = lazy(() => import('./components/SidebarNav'));
const PlayerForm = lazy(() => import('./components/PlayerForm'));
const Leaderboard = lazy(() => import('./components/Leaderboard'));
const PlayerDetailsModal = lazy(() => import('./components/PlayerDetailsModal'));
const ScreenshotsModal = lazy(() => import('./components/ScreenshotsModal'));
const LinksModal = lazy(() => import('./components/LinksModal'));
const ImportSummaryModal = lazy(() => import('./components/ImportSummaryModal'));
const LoginModal = lazy(() => import('./components/LoginModal'));
const SettingsModal = lazy(() => import('./components/SettingsModal'));
const AppsDrawer = lazy(() => import('./components/AppsDrawer'));
const DatabasePlayerList = lazy(() => import('./components/DatabasePlayerList'));
const QuickStatsView = lazy(() => import('./components/QuickUpdateModal'));
const SquadBuilder = lazy(() => import('./components/SquadBuilder'));
const ProfileStatsModal = lazy(() => import('./components/ProfileStatsModal'));
const RemainderModal = lazy(() => import('./components/RemainderModal'));
const BadgesView = lazy(() => import('./components/BadgesView'));
const SocialDrawer = lazy(() => import('./components/SocialDrawer'));
const BrochureModal = lazy(() => import('./components/BrochureModal'));
const MySquadDB = lazy(() => import('./components/MySquadDB'));

const parseEfDate = (dateStr) => {
  if (!dateStr) return null;
  let d = new Date(dateStr);
  if (!isNaN(d.getTime())) return d;
  
  // Handle "2 Apr '26" format
  const match = String(dateStr).match(/(\d+)\s+([A-Za-z]+)\s+'(\d+)/);
  if (match) {
      const day = match[1];
      const month = match[2];
      const year = "20" + match[3];
      const parsed = new Date(`${month} ${day}, ${year}`);
      if (!isNaN(parsed.getTime())) return parsed;
  }
  return null;
};

function App() {
  const [players, setPlayers] = useState([]);
  const [squads, setSquads] = useState([]);
  const [view, setView] = useState('list'); // 'list', 'leaderboard', or 'squad-builder'
  const [loading, setLoading] = useState(true);
  const [importPreviewData, setImportPreviewData] = useState(null);

  // Modal Visibility State
  const [showAddPlayer, setShowAddPlayer] = useState(false);
  const [showScreenshots, setShowScreenshots] = useState(false);
  const [showLinks, setShowLinks] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showDatabase, setShowDatabase] = useState(false);
  const [showProfileStats, setShowProfileStats] = useState(false);
  const [showRemainder, setShowRemainder] = useState(false);
  const [showSocial, setShowSocial] = useState(false);
  const [showBrochure, setShowBrochure] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  // App Preferences
  const [settings, setSettings] = useState(() => {
    const saved = localStorage.getItem('ef-squad-settings');
    return saved ? JSON.parse(saved) : {
      cardSize: 'sm',
      showLabels: true,
      showRatings: true,
      showStats: true,
      showClub: true,
      showPlaystyle: true,
      showClubBadge: true,
      showNationBadge: true,
      customStatSlots: ['matches', 'goals', 'assists'],
      highPerf: false,
      enablePagination: false,
      itemsPerPage: 40,
      activeSquadId: null,
      appLogo: ''
    };
  });

  // Favicon Sync
  useEffect(() => {
    const link = document.querySelector("link[rel~='icon']");
    if (link) {
      link.href = settings.appLogo || '/favicon.jpg';
    }
  }, [settings.appLogo]);

  // Save Settings to LocalStorage
  useEffect(() => {
    localStorage.setItem('ef-squad-settings', JSON.stringify(settings));
  }, [settings]);

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
          const [playerData, appData, squadData] = await Promise.all([
            getPlayers(user.uid),
            getApps(user.uid),
            getSquads(user.uid)
          ]);
          setPlayers(playerData);
          // Sanitize squads to ensure they have IDs
          const validSquads = squadData.filter(s => s.id);
          setSquads(validSquads);
          if (squadData.length !== validSquads.length) {
            console.warn("Filtered out squads without IDs");
          }

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
      showAlert('Success', `${app.name} added to your Apps Drawer!`, 'success');
    } catch (err) {
      console.error("Error adding app:", err);
      showAlert('Error', 'Failed to add app shortcut.', 'danger');
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
    showConfirm('Logout', 'Are you sure you want to log out?', async () => {
      await logout();
      setUser(null);
      setIsAuthenticated(false);
      setPlayers([]);
      setApps([]);
    });
  };

  // Filter & Sort State
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState(() => localStorage.getItem('ef-squad-sort') || 'rating'); // rating, goals, assists, dateAdded

  useEffect(() => {
    localStorage.setItem('ef-squad-sort', sortBy);
  }, [sortBy]);
  const [filterPos, setFilterPos] = useState('All');
  const [filterType, setFilterType] = useState('All');
  const [filterInactive, setFilterInactive] = useState(false);
  const [filterMissing, setFilterMissing] = useState('All');
  const [filterLeague, setFilterLeague] = useState('');
  const [filterClub, setFilterClub] = useState('');
  const [filterNationality, setFilterNationality] = useState('');
  const [filterRating, setFilterRating] = useState('');
  const [filterPlaystyle, setFilterPlaystyle] = useState('All');
  const [filterSkill, setFilterSkill] = useState('All');
  const [includeSecondary, setIncludeSecondary] = useState(false);

  // Custom Dialog State
  const [dialog, setDialog] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'info',
    onConfirm: null,
    onCancel: null,
    confirmText: 'Confirm',
    cancelText: 'Cancel'
  });

  const showAlert = (title, message, type = 'info') => {
    setDialog({
      isOpen: true,
      title,
      message,
      type,
      confirmText: 'OK',
      onConfirm: () => setDialog(prev => ({ ...prev, isOpen: false })),
      onCancel: null
    });
  };

  const showConfirm = (title, message, onConfirm, type = 'confirm', confirmText = 'Confirm', cancelText = 'Cancel') => {
    setDialog({
      isOpen: true,
      title,
      message,
      type,
      confirmText,
      cancelText,
      onConfirm: () => {
        onConfirm();
        setDialog(prev => ({ ...prev, isOpen: false }));
      },
      onCancel: () => setDialog(prev => ({ ...prev, isOpen: false }))
    });
  };

  // Selection Mode State
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [showBulkEdit, setShowBulkEdit] = useState(false);
  const [bulkEditData, setBulkEditData] = useState({
    playstyle: '',
    cardType: '',
    club: '',
    league: '',
    nationality: '',
    rating: '',
    age: '',
    height: '',
    strongFoot: '',
    logos: { club: '', league: '', country: '' },
    tags: []
  });
  const [bulkTagInput, setBulkTagInput] = useState('');

  const activeSquad = useMemo(() => {
    return squads.find(s => s.id?.toString() === settings.activeSquadId?.toString());
  }, [squads, settings.activeSquadId]);

  // Extract unique club data from current players for recommendations
  const localClubBadges = useMemo(() => {
    const clubsDict = {};
    players.forEach(p => {
      if (p.club && !clubsDict[p.club]) {
        clubsDict[p.club] = {
          idTeam: 'local-' + p.club,
          strTeam: p.club,
          strBadge: p.logos?.club || p.club_badge_url || '',
          strLeague: p.league || '',
          strLeagueBadge: p.logos?.league || '',
          isLocal: true
        };
      }
    });
    return Object.values(clubsDict);
  }, [players]);

  // Extract unique nationality data from current players for recommendations
  const localNationBadges = useMemo(() => {
    const natsDict = {};
    players.forEach(p => {
      if (p.nationality && !natsDict[p.nationality]) {
        natsDict[p.nationality] = {
          idTeam: 'local-' + p.nationality,
          name: p.nationality,
          flag: p.logos?.country || p.nationality_flag_url || '',
          isLocal: true
        };
      }
    });
    return Object.values(natsDict);
  }, [players]);

  // Leaderboard Specific Filters
  const [lbFilters, setLbFilters] = useState({
    positions: [], // empty means all
    club: '',
    league: '',
    country: '',
    skill: '',
    cardTypes: [],
    playstyles: [],
    minGames: 100,
    includeSecondary: false
  });
  const [isLbFiltersExpanded, setIsLbFiltersExpanded] = useState(false);

  // Bulk Edit Search State
  const [bulkClubResults, setBulkClubResults] = useState([]);
  const [isBulkSearchingClub, setIsBulkSearchingClub] = useState(false);
  const [showBulkClubResults, setShowBulkClubResults] = useState(false);
  const bulkClubSearchTimeout = useRef(null);
  const latestBulkClubSearchId = useRef(0);

  const [bulkNationResults, setBulkNationResults] = useState([]);
  const [isBulkSearchingNation, setIsBulkSearchingNation] = useState(false);
  const [showBulkNationResults, setShowBulkNationResults] = useState(false);
  const bulkNationSearchTimeout = useRef(null);
  const latestBulkNationSearchId = useRef(0);

  const handleBulkClubSearch = async (query) => {
    if (query.length < 1) {
      setBulkClubResults([]);
      setShowBulkClubResults(false);
      return;
    }

    const currentId = ++latestBulkClubSearchId.current;

    // 1. First, find matches from our existing "Badges" system / current players
    const localMatches = localClubBadges.filter(c =>
      c.strTeam.toLowerCase().includes(query.toLowerCase())
    ).slice(0, 15);

    setBulkClubResults(localMatches);
    setShowBulkClubResults(true);

    // If query is very short, just stop with local results
    if (query.length < 2) {
      setIsBulkSearchingClub(false);
      return;
    }

    setIsBulkSearchingClub(true);
    try {
      const clubs = await searchTeams(query);
      if (currentId === latestBulkClubSearchId.current) {
        // Filter out results that are already in local results to avoid duplicates
        const externalClubs = (clubs || []).filter(ec =>
          !localMatches.some(lm => lm.strTeam.toLowerCase() === ec.strTeam.toLowerCase())
        ).slice(0, 5);

        setBulkClubResults(prev => {
          // Keep local results at top, add external results below
          const locals = prev.filter(r => r.isLocal);
          return [...locals, ...externalClubs];
        });
      }
    } catch (err) {
      console.error('Bulk Club Search Error:', err);
    } finally {
      if (currentId === latestBulkClubSearchId.current) {
        setIsBulkSearchingClub(false);
      }
    }
  };

  const handleSelectBulkClub = async (club) => {
    setShowBulkClubResults(false);
    setBulkEditData(prev => ({
      ...prev,
      club: club.strTeam,
      league: club.strLeague || prev.league,
      logos: {
        ...prev.logos,
        club: club.strBadge || '',
        league: club.strLeagueBadge || prev.logos?.league || ''
      }
    }));

    // Try to fetch better league logo if needed for EXTERNAL clubs without league logo
    if (!club.isLocal && club.strLeague && !club.strLeagueBadge) {
      const leagueInfo = await searchLeagues(club.strLeague);
      if (leagueInfo?.strBadge) {
        setBulkEditData(prev => ({
          ...prev,
          logos: { ...prev.logos, league: leagueInfo.strBadge }
        }));
      }
    }
  };

  const handleBulkNationSearch = async (query) => {
    if (query.length < 1) {
      setBulkNationResults([]);
      setShowBulkNationResults(false);
      return;
    }

    const currentId = ++latestBulkNationSearchId.current;

    // 1. First, find matches from our existing "Badges" system / current players
    const localMatches = localNationBadges.filter(n =>
      n.name.toLowerCase().includes(query.toLowerCase())
    ).slice(0, 15);

    setBulkNationResults(localMatches);
    setShowBulkNationResults(true);

    // If query is very short, just stop with local results
    if (query.length < 2) {
      setIsBulkSearchingNation(false);
      return;
    }

    setIsBulkSearchingNation(true);
    try {
      const nations = await searchCountries(query);
      if (currentId === latestBulkNationSearchId.current) {
        // Filter out results that are already in local results to avoid duplicates
        const externalNations = (nations || []).filter(en =>
          !localMatches.some(lm => lm.name.toLowerCase() === en.name.toLowerCase())
        ).slice(0, 5);

        setBulkNationResults(prev => {
          // Keep local results at top, add external results below
          const locals = prev.filter(r => r.isLocal);
          return [...locals, ...externalNations];
        });
      }
    } catch (err) {
      console.error('Bulk Nation Search Error:', err);
    } finally {
      if (currentId === latestBulkNationSearchId.current) {
        setIsBulkSearchingNation(false);
      }
    }
  };

  const handleSelectBulkNation = (nation) => {
    setShowBulkNationResults(false);
    setBulkEditData(prev => ({
      ...prev,
      nationality: nation.name,
      logos: {
        ...prev.logos,
        country: nation.flag || ''
      }
    }));
  };

  // Helper to sync bulk edit data (now handles object or function)
  const setBulkClubData = (updates) => {
    setBulkEditData(prev => {
      const next = typeof updates === 'function' ? updates(prev) : updates;
      return { ...prev, ...next };
    });
  };

  const handleBulkBadgeUpload = (type, file) => {
    if (!file) return;
    const img = new Image();
    img.src = URL.createObjectURL(file);
    img.onload = () => {
      const MAX_SIZE = 120;
      let width = img.width;
      let height = img.height;
      if (width > MAX_SIZE || height > MAX_SIZE) {
        if (width > height) {
          height *= MAX_SIZE / width;
          width = MAX_SIZE;
        } else {
          width *= MAX_SIZE / height;
          height = MAX_SIZE;
        }
      }
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);
      const optimizedImage = canvas.toDataURL('image/png', 0.8);

      setBulkEditData(prev => ({
        ...prev,
        logos: {
          ...prev.logos,
          [type]: optimizedImage
        }
      }));
      URL.revokeObjectURL(img.src);
    };
  };

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

      // Only switch to list view if it's NOT a badge template
      if (!playerToAdd.tags?.includes('badge_template')) {
        setView('list');
      }

      if (imageUploadFailed) {
        showAlert('Warning', 'Player added successfully, but the image failed to upload (network timeout or error). You can try uploading it again by editing the player.', 'danger');
      }
    } catch (err) {
      console.error('Error adding player:', err);
      showAlert('Error', `Failed to save player: ${err.message}`, 'danger');
    }
  };

  const handleBulkAddPlayers = async (playersList) => {
    if (!user) return;
    try {
      const addedPlayers = await addPlayersBulk(user.uid, playersList);
      setPlayers(prev => [...addedPlayers, ...prev]);
      setShowDatabase(false);
      showAlert('Bulk Import', `Successfully added ${playersList.length} players to your squad!`, 'success');
      return addedPlayers;
    } catch (err) {
      console.error('Error bulk adding players:', err);
      showAlert('Error', `Failed to add players: ${err.message}`, 'danger');
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

    showConfirm('Delete Players', `Are you sure you want to delete ${selectedIds.size} players?`, async () => {
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
        showAlert('Deleted', 'Players removed from squad.', 'success');
      } catch (err) {
        console.error('Error deleting players:', err);
        showAlert('Error', 'Failed to delete some players.', 'danger');
      }
    }, 'danger', 'Delete All');
  };

  const handleBulkUpdate = async () => {
    if (selectedIds.size === 0 || !user) return;

    // Filter out empty updates
    const updates = {};
    if (bulkEditData.playstyle) updates.playstyle = bulkEditData.playstyle;
    if (bulkEditData.cardType) updates.cardType = bulkEditData.cardType;
    if (bulkEditData.club) updates.club = bulkEditData.club;
    if (bulkEditData.league) updates.league = bulkEditData.league;
    if (bulkEditData.nationality) updates.nationality = bulkEditData.nationality;
    if (bulkEditData.rating) updates.rating = parseInt(bulkEditData.rating);
    if (bulkEditData.age) updates.age = parseInt(bulkEditData.age);
    if (bulkEditData.height) updates.height = parseInt(bulkEditData.height);
    if (bulkEditData.strongFoot) updates.strongFoot = bulkEditData.strongFoot;

    // Handle nested logo updates with dot notation to avoid overwriting entire object
    if (bulkEditData.logos?.club) {
      updates['logos.club'] = bulkEditData.logos.club;
      updates.club_badge_url = bulkEditData.logos.club;
    }
    if (bulkEditData.logos?.league) updates['logos.league'] = bulkEditData.logos.league;
    if (bulkEditData.logos?.country) {
      updates['logos.country'] = bulkEditData.logos.country;
      updates.nationality_flag_url = bulkEditData.logos.country;
    }

    if (bulkEditData.tags && bulkEditData.tags.length > 0) {
      updates.tags = bulkEditData.tags;
    }

    if (Object.keys(updates).length === 0) {
      showAlert('Error', 'Please select at least one field to update.', 'danger');
      return;
    }

    try {
      const idArray = Array.from(selectedIds);
      await updatePlayersBulk(user.uid, idArray, updates);

      // Update local state
      setPlayers(prev => prev.map(p => {
        if (selectedIds.has(p._id)) {
          const updatedPlayer = { ...p };

          Object.keys(updates).forEach(key => {
            if (key === 'tags') {
              updatedPlayer.tags = [...new Set([...(p.tags || []), ...updates.tags])];
            } else if (!key.includes('.')) {
              updatedPlayer[key] = updates[key];
            } else {
              // Handle dot notation locally (e.g., logos.club)
              const [parent, child] = key.split('.');
              if (parent === 'logos') {
                updatedPlayer.logos = { ...(updatedPlayer.logos || {}), [child]: updates[key] };
              }
            }
          });

          return updatedPlayer;
        }
        return p;
      }));

      // Cleanup
      setSelectedIds(new Set());
      setIsSelectionMode(false);
      setShowBulkEdit(false);
      setBulkEditData({
        playstyle: '',
        cardType: '',
        club: '',
        league: '',
        nationality: '',
        rating: '',
        age: '',
        height: '',
        strongFoot: '',
        tags: [],
        logos: { club: '', league: '', country: '' }
      });
      setBulkTagInput('');
      showAlert('Success', `Updated ${idArray.length} players!`, 'success');
    } catch (err) {
      console.error('Error bulk updating:', err);
      showAlert('Error', 'Failed to update players.', 'danger');
    }
  };

  const handleImportSquadJSON = async (importedPlayers) => {
    if (!user || !importedPlayers || !Array.isArray(importedPlayers)) return;

    const toUpdate = [];
    const toAdd = [];
    const details = [];
    const existingPlayers = [...players];

    importedPlayers.forEach(imp => {
      // Identify player by _id, ID, pesdb_id, or playerId
      const match = existingPlayers.find(p => 
        (imp._id && p._id === imp._id) || 
        (imp.id && p._id === imp.id) ||
        (imp.playerId && p.playerId === imp.playerId) || 
        (imp.pesdb_id && p.pesdb_id === imp.pesdb_id) ||
        (imp.ID && (p.playerId === String(imp.ID) || p.pesdb_id === String(imp.ID)))
      );

      // Mapping for exported headers -> internal keys
      const mapping = {
        'Name': 'name',
        'Position': 'position',
        'Rating': 'rating',
        'Height': 'height',
        'Weight': 'weight',
        'Age': 'age',
        'Foot': 'strongFoot',
        'Playstyle': 'playstyle',
        'Club': 'club',
        'League': 'league',
        'Nationality': 'nationality',
        'CardType': 'cardType',
        // Weak Foot
        'WFUsage': 'Weak Foot Usage',
        'Weak Foot Usage': 'Weak Foot Usage',
        'WFAccuracy': 'Weak Foot Accuracy',
        'Weak Foot Accuracy': 'Weak Foot Accuracy',
        // Condition / Form
        'Condition': 'Form',
        'Form': 'Form',
        'Player Form': 'Form',
        // Injury
        'InjuryRes': 'Injury Resistance',
        'Injury Resistance': 'Injury Resistance',
        // Meta
        'Featured': 'Featured Players',
        'Featured Players': 'Featured Players',
        'Date Added': 'Date Added',
        'DateAdded': 'Date Added'
      };

      if (match) {
        const updates = {};
        const changes = [];
        Object.keys(imp).forEach(k => {
          const trimmedKey = k.trim();
          const internalKey = mapping[trimmedKey] || trimmedKey;
          
          // Exclude internal fields and the primary ID used for matching
          if (['_id', 'id', 'ID', '#', 'Photo'].includes(internalKey)) return;
          
          if (imp[k] !== undefined && imp[k] !== null && imp[k] !== '') {
            const newVal = imp[k];
            const oldVal = match[internalKey];
            
            // Only consider it a change if values are different
            if (String(newVal) !== String(oldVal || "")) {
              updates[internalKey] = newVal;
              changes.push({ field: internalKey, old: oldVal, new: newVal });
            }
          }
        });

        if (changes.length > 0) {
          toUpdate.push({ id: match._id, updates });
          details.push({
            name: match.name || imp.Name || 'Unknown Player',
            id: match._id,
            type: 'update',
            changes
          });
        }
      } else {
        const newPlayer = {};
        const changes = [];
        Object.keys(imp).forEach(k => {
          const internalKey = mapping[k] || k;
          if (internalKey === '#' || internalKey === 'Photo' || internalKey === 'DateAdded') return;
          
          if (k === 'ID') newPlayer.pesdb_id = String(imp[k]);
          else if (imp[k] !== undefined && imp[k] !== null && imp[k] !== '') {
            newPlayer[internalKey] = imp[k];
          }
          
          if (newPlayer[internalKey]) {
             changes.push({ field: internalKey, new: newPlayer[internalKey] });
          }
        });
        
        if (newPlayer.name || newPlayer.pesdb_id) {
           toAdd.push(newPlayer);
           details.push({
             name: newPlayer.name || 'New Player',
             type: 'add',
             changes
           });
        }
      }
    });

    if (toUpdate.length === 0 && toAdd.length === 0) {
      showAlert('Info', 'No new data or changes found in this file.', 'info');
      return;
    }

    setImportPreviewData({
      summary: { added: toAdd.length, updated: toUpdate.length, total: importedPlayers.length },
      details,
      rawActions: { toUpdate, toAdd }
    });
  };

  const handleConfirmImportSave = async () => {
    if (!user || !importPreviewData) return;
    const { toUpdate, toAdd } = importPreviewData.rawActions;

    setLoading(true);
    try {
      if (toUpdate.length > 0) {
        for (let i = 0; i < toUpdate.length; i += 500) {
          await batchUpdatePlayers(user.uid, toUpdate.slice(i, i + 500));
        }
      }
      if (toAdd.length > 0) {
        for (let i = 0; i < toAdd.length; i += 500) {
          await batchAddPlayers(user.uid, toAdd.slice(i, i + 500));
        }
      }

      const updatedPlayersList = await getPlayers(user.uid);
      setPlayers(updatedPlayersList);
      showAlert('Import Complete', `Successfully added ${toAdd.length} new players and updated ${toUpdate.length} matches.`, 'success');
      setImportPreviewData(null);
    } catch (err) {
      console.error('Import error:', err);
      showAlert('Import Failed', `Error: ${err.message}`, 'danger');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateBadge = async (oldValue, newValue, newLogo, type, newLeague) => {
    if (!user) return;

    const matchingPlayers = players.filter(p => {
      if (type === 'club') return p.club === oldValue;
      if (type === 'national') return p.nationality === oldValue;
      if (type === 'league') return p.league === oldValue;
      return false;
    });

    if (matchingPlayers.length === 0) return;

    const ids = matchingPlayers.map(p => p._id);
    const updates = {};

    if (type === 'club') {
      updates.club = newValue;
      if (newLeague) updates.league = newLeague;
      if (newLogo) {
        updates['logos.club'] = newLogo;
        updates.club_badge_url = newLogo;
      }
    } else if (type === 'national') {
      updates.nationality = newValue;
      if (newLogo) {
        updates['logos.country'] = newLogo;
        updates.nationality_flag_url = newLogo;
      }
    } else if (type === 'league') {
      updates.league = newValue;
      if (newLogo) {
        updates['logos.league'] = newLogo;
      }
    }

    try {
      await updatePlayersBulk(user.uid, ids, updates);

      setPlayers(prev => prev.map(p => {
        if (ids.includes(p._id)) {
          const updated = { ...p };
          if (type === 'club') {
            updated.club = newValue;
            if (newLeague) updated.league = newLeague;
            if (newLogo) {
              updated.logos = { ...p.logos, club: newLogo };
              updated.club_badge_url = newLogo;
            }
          } else if (type === 'national') {
            updated.nationality = newValue;
            if (newLogo) {
              updated.logos = { ...p.logos, country: newLogo };
              updated.nationality_flag_url = newLogo;
            }
          } else if (type === 'league') {
            updated.league = newValue;
            if (newLogo) {
              updated.logos = { ...p.logos, league: newLogo };
            }
          }
          return updated;
        }
        return p;
      }));

      showAlert('Success', `${type === 'club' ? 'Club' : type === 'league' ? 'League' : 'National'} badge updated for ${ids.length} players!`, 'success');
    } catch (err) {
      console.error('Error updating badge:', err);
      showAlert('Error', 'Failed to update badge.', 'danger');
    }
  };

  const handleMergeBadges = async (oldValues, newValue, newLogo, type, newLeague) => {
    if (!user) return;

    // Find all players matching ANY of the old values
    const matchingPlayers = players.filter(p => {
      if (type === 'club') return oldValues.includes(p.club);
      if (type === 'national') return oldValues.includes(p.nationality);
      if (type === 'league') return oldValues.includes(p.league);
      return false;
    });

    if (matchingPlayers.length === 0) return;

    const ids = matchingPlayers.map(p => p._id);
    const updates = {};

    if (type === 'club') {
      updates.club = newValue;
      if (newLeague) updates.league = newLeague;
      if (newLogo) {
        updates['logos.club'] = newLogo;
        updates.club_badge_url = newLogo;
      }
    } else if (type === 'national') {
      updates.nationality = newValue;
      if (newLogo) {
        updates['logos.country'] = newLogo;
        updates.nationality_flag_url = newLogo;
      }
    } else if (type === 'league') {
      updates.league = newValue;
      if (newLogo) {
        updates['logos.league'] = newLogo;
      }
    }

    try {
      await updatePlayersBulk(user.uid, ids, updates);

      setPlayers(prev => prev.map(p => {
        if (ids.includes(p._id)) {
          const updated = { ...p };
          if (type === 'club') {
            updated.club = newValue;
            if (newLeague) updated.league = newLeague;
            if (newLogo) {
              updated.logos = { ...p.logos, club: newLogo };
              updated.club_badge_url = newLogo;
            }
          } else if (type === 'national') {
            updated.nationality = newValue;
            if (newLogo) {
              updated.logos = { ...p.logos, country: newLogo };
              updated.nationality_flag_url = newLogo;
            }
          } else if (type === 'league') {
            updated.league = newValue;
            if (newLogo) {
              updated.logos = { ...p.logos, league: newLogo };
            }
          }
          return updated;
        }
        return p;
      }));

      showAlert('Success', `Merged ${oldValues.length} badges into "${newValue}" for ${ids.length} players!`, 'success');
    } catch (err) {
      console.error('Error merging badges:', err);
      showAlert('Error', 'Failed to merge badges.', 'danger');
    }
  };

  // Search State
  const [searchQuery, setSearchQuery] = useState('');

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [
    searchQuery,
    filterPos,
    filterType,
    filterInactive,
    filterMissing,
    filterLeague,
    filterClub,
    filterNationality,
    filterRating,
    filterPlaystyle,
    filterSkill,
    sortBy
  ]);

  // Filter & Sort Logic
  const getProcessedPlayers = () => {
    let result = [...players];

    // Search Filter
    if (searchQuery) {
      const query = normalizeString(searchQuery);
      result = result.filter(p =>
        normalizeString(p.name).includes(query) ||
        normalizeString(p.search_name || "").includes(query) ||
        normalizeString(p.club || "").includes(query) ||
        normalizeString(p.position || "").includes(query) ||
        normalizeString(p.secondaryPosition || "").includes(query) ||
        (Array.isArray(p.additionalPositions) ? p.additionalPositions.join(' ').toLowerCase() : String(p.additionalPositions || '')).includes(query) ||
        (p.tags && p.tags.some(tag => normalizeString(tag).includes(query)))
      );
    }

    // Filter
    if (filterPos !== 'All') {
      if (includeSecondary) {
        result = result.filter(p =>
          p.position === filterPos ||
          (p.secondaryPosition && p.secondaryPosition.toUpperCase().includes(filterPos.toUpperCase()))
        );
      } else {
        result = result.filter(p => p.position === filterPos);
      }
    }
    if (filterType !== 'All') {
      result = result.filter(p => p.cardType === filterType);
    }
    if (filterInactive) {
      result = result.filter(p => (p.matches || 0) === 0);
    }

    if (filterLeague) {
      result = result.filter(p => p.league?.toLowerCase().includes(filterLeague.toLowerCase()));
    }
    if (filterClub) {
      result = result.filter(p => p.club?.toLowerCase().includes(filterClub.toLowerCase()));
    }
    if (filterNationality) {
      result = result.filter(p => p.nationality?.toLowerCase().includes(filterNationality.toLowerCase()));
    }
    if (filterRating) {
      result = result.filter(p => p.rating && p.rating.toString() === filterRating.toString());
    }
    if (filterPlaystyle !== 'All') {
      result = result.filter(p => p.playstyle === filterPlaystyle);
    }
    if (filterSkill !== 'All') {
      const target = filterSkill.toLowerCase().trim();
      result = result.filter(p => {
        const check = (arr) => {
          if (!arr) return false;
          const skillsArray = Array.isArray(arr) ? arr : [arr];
          
          if (filterSkill === 'Any Special Skill') {
            return skillsArray.some(s => SPECIAL_SKILLS.includes(s));
          }
          
          return skillsArray.some(s => s?.toString().toLowerCase().trim() === target);
        };
        return check(p.skills) || check(p.additionalSkills);
      });
    }

    // Missing Details Filter
    if (filterMissing !== 'All') {
      if (filterMissing === 'Missing Picture') {
        result = result.filter(p => !p.image || p.image === '');
      } else if (filterMissing === 'Missing Player ID') {
        result = result.filter(p => !p.pesdb_id && !p.playerId);
      } else if (filterMissing === 'Missing Playstyle') {
        result = result.filter(p => !p.playstyle || p.playstyle === 'None');
      } else if (filterMissing === 'Missing Card Type') {
        result = result.filter(p => !p.cardType || p.cardType === 'Normal');
      } else if (filterMissing === 'Missing Club') {
        result = result.filter(p => !p.club);
      } else if (filterMissing === 'Missing League') {
        result = result.filter(p => !p.league);
      } else if (filterMissing === 'Missing Club Badge') {
        result = result.filter(p => !p.logos?.club && !p.club_badge_url);
      } else if (filterMissing === 'Missing Country Badge') {
        result = result.filter(p => !p.logos?.country && !p.nationality_flag_url);
      } else if (filterMissing === 'Missing Age') {
        result = result.filter(p => !p.age || p.age === '');
      } else if (filterMissing === 'Missing Height') {
        result = result.filter(p => !p.height || p.height === '');
      } else if (filterMissing === 'Missing Tags') {
        result = result.filter(p => !p.tags || p.tags.length === 0);
      } else if (filterMissing === 'Missing Foot') {
        result = result.filter(p => !p.strongFoot || p.strongFoot === '');
      } else if (filterMissing === 'No Skills Found') {
        result = result.filter(p => {
          const hasSkills = p.skills && p.skills.filter(s => s && s.trim() !== '').length > 0;
          return !hasSkills;
        });
      } else if (filterMissing === 'No Additional Skills') {
        result = result.filter(p => {
          if (!p.additionalSkills) return true;
          const realAdditional = p.additionalSkills.filter(s => s && s.trim() !== '');
          return realAdditional.length === 0;
        });
      } else if (filterMissing === 'Incomplete Additional Skills') {
        result = result.filter(p => {
          const filled = (p.additionalSkills || []).filter(s => s && s.trim() !== '').length;
          return filled > 0 && filled < 5;
        });
      }
    }

    // Sort
    result.sort((a, b) => {
      if (sortBy === 'rating') return (b.rating || 0) - (a.rating || 0);
      if (sortBy === 'goals') return (b.goals || 0) - (a.goals || 0);
      if (sortBy === 'assists') return (b.assists || 0) - (a.assists || 0);
      if (sortBy === 'name') return (a.name || '').localeCompare(b.name || '');
      if (sortBy === 'position') return (a.position || '').localeCompare(b.position || '');
      if (sortBy === 'dateAdded_desc') {
        const dateA = parseEfDate(a['Date Added'] || a.DateAdded || a.dateAdded || 0)?.getTime() || 0;
        const dateB = parseEfDate(b['Date Added'] || b.DateAdded || b.dateAdded || 0)?.getTime() || 0;
        return dateB - dateA;
      }
      if (sortBy === 'dateAdded_asc') {
        const dateA = parseEfDate(a['Date Added'] || a.DateAdded || a.dateAdded || 0)?.getTime() || 0;
        const dateB = parseEfDate(b['Date Added'] || b.DateAdded || b.dateAdded || 0)?.getTime() || 0;
        return dateA - dateB;
      }
      if (sortBy === 'uploaded_desc') {
        const dateA = new Date(a.createdAt || 0).getTime();
        const dateB = new Date(b.createdAt || 0).getTime();
        return dateB - dateA;
      }
      if (sortBy === 'uploaded_asc') {
        const dateA = new Date(a.createdAt || 0).getTime();
        const dateB = new Date(b.createdAt || 0).getTime();
        return dateA - dateB;
      }
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
        setSelectedPlayer(prev => ({ ...prev, ...updatesToSave }));
      }

      if (imageUploadFailed) {
        showAlert('Warning', 'Player updated, but image failed to upload.', 'danger');
      }
    } catch (err) {
      console.error('Error updating player:', err);
      showAlert('Error', `Failed to update player: ${err.message}`, 'danger');
    }
  };

  const handleSaveSquad = async (squad) => {
    if (!user) return;
    try {
      const saved = await saveSquad(user.uid, squad);
      setSquads(prev => {
        const index = prev.findIndex(s => s.id === saved.id);
        if (index >= 0) {
          const updated = [...prev];
          updated[index] = saved;
          return updated;
        }
        return [saved, ...prev];
      });
      showAlert('Success', 'Squad saved successfully!', 'success');
    } catch (err) {
      console.error("Error saving squad:", err);
      showAlert('Error', 'Failed to save squad', 'danger');
    }
  };

  const handleDeleteSquad = async (squadId) => {
    if (!user || !squadId) {
      console.warn("Delete aborted: No user or no squad ID provided");
      return;
    }

    const idStr = squadId.toString();
    if (idStr.startsWith('demo-')) {
      setSquads(prev => prev.filter(s => s.id !== squadId));
      showAlert('Success', 'Demo squad removed!', 'success');
      return;
    }

    showConfirm('Delete Squad', 'Are you sure you want to delete this squad?', async () => {
      try {
        await deleteSquad(user.uid, squadId);
        setSquads(prev => prev.filter(s => s.id !== squadId));
        showAlert('Success', 'Squad deleted!', 'success');
      } catch (err) {
        console.error("Error deleting squad:", err);
        showAlert('Error', `Failed to delete squad: ${err.message}`, 'danger');
      }
    }, 'danger', 'Delete All');
  };

  const handleDeleteSquads = async (squadIds) => {
    if (!user || !squadIds || squadIds.length === 0) return;

    showConfirm('Delete Squads', `Delete ${squadIds.length} squads permanently?`, async () => {
      try {
        // Optimistically update UI
        const idsToRemove = new Set(squadIds);
        setSquads(prev => prev.filter(s => !idsToRemove.has(s.id)));

        // Background delete
        await Promise.all(squadIds.map(id => {
          if (id.toString().startsWith('demo-')) return Promise.resolve();
          return deleteSquad(user.uid, id).catch(e => console.error("Error deleting one squad:", e));
        }));

        showAlert('Success', `${squadIds.length} squads deleted!`, 'success');
      } catch (err) {
        console.error("Error deleting squads:", err);
        showAlert('Error', 'Failed to delete some squads', 'danger');
      }
    }, 'danger', 'Delete Selected');
  };

  const handleSetActiveSquad = (squadId) => {
    if (!squadId) {
      console.error("Attempted to set active squad with null ID");
      return;
    }
    // Force a re-render and saving by spreading into a new object
    setSettings(prev => {
      const next = { ...prev, activeSquadId: squadId.toString() };
      localStorage.setItem('ef-squad-settings', JSON.stringify(next));
      return next;
    });
    // Optional: Also sync to server user profile if needed
    showAlert('Success', 'Squad set as active!', 'success');
  };

  const handleDuplicateSquad = async (squadId) => {
    if (!user) return;

    // Check real squads first, then check demo/mock display squads
    // We need to find the squad data to copy it
    let original = squads.find(s => s.id === squadId);

    // If it's a demo squad, we handle it too
    if (!original && squadId.startsWith('demo-')) {
      // Manual find in the mock logic (simulated)
      const demoSquads = [
        { id: 'demo-1', name: 'Main Competition XV', formation: '4-3-3', players: [] },
        { id: 'demo-2', name: 'Defensive Wall', formation: '4-4-2', players: [] },
        { id: 'demo-3', name: 'Standard Tactics', formation: '4-3-3', players: [] }
      ];
      original = demoSquads.find(s => s.id === squadId);
    }

    if (!original) return;

    try {
      const { id, _id, updatedAt, createdAt, ...rest } = original;
      const copy = {
        ...rest,
        name: `${original.name} (Copy)`
      };
      const saved = await saveSquad(user.uid, copy);

      // Update state
      setSquads(prev => [saved, ...prev]);
      showAlert('Success', 'Squad duplicated!', 'success');
    } catch (err) {
      console.error("Error duplicating squad:", err);
      showAlert('Error', 'Failed to duplicate squad', 'danger');
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
      {view !== 'badges' && (
        <header className="max-w-6xl mx-auto mb-8 sm:mb-12">
          {/* Mobile Top Bar (following sketch) */}
          <div className="flex md:hidden items-center gap-3 mb-4 pt-1.5 pl-12">
            <img src={settings.appLogo || "/favicon.jpg"} alt="Logo" className="w-6 h-6 object-contain rounded-md" />
            <h1 className="text-2xl font-black text-white tracking-tighter uppercase italic">
              eFootball <span className="text-ef-accent">Stats</span>
            </h1>
          </div>

          {/* Desktop Title Section */}
          <div className="hidden md:flex flex-col md:flex-row justify-between items-center gap-8 mb-12">
            <div className="flex flex-col items-center md:items-start group">
              <h1 className="flex items-center gap-4 text-4xl md:text-6xl font-black text-white tracking-tighter leading-none transition-transform duration-500 group-hover:scale-[1.02]">
                <img src={settings.appLogo || "/favicon.jpg"} alt="Logo" className="w-10 h-10 md:w-16 md:h-16 object-contain rounded-xl shadow-2xl" />
                <span>eFOOTBALL <span className="text-ef-accent bg-gradient-to-r from-ef-accent to-ef-blue bg-clip-text text-transparent">STATS.</span></span>
              </h1>
              <div className="mt-4 flex items-center gap-3">
                <div className="h-1 w-12 bg-ef-accent rounded-full"></div>
                <p className="text-[10px] md:text-xs font-black uppercase tracking-[0.4em] opacity-40">Squad Management Hub v1.0.4</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Total box relocated from action hub */}
              <div className="flex flex-col items-center justify-center px-5 py-2 bg-white/5 border border-white/10 rounded-xl min-w-[80px]">
                <span className="text-[8px] font-black uppercase tracking-tighter opacity-30">Total</span>
                <span className="text-sm font-black text-ef-accent leading-tight">{processedPlayers.length}</span>
              </div>

              <div className="flex bg-white/5 rounded-xl p-1 border border-white/5">
                <button
                  onClick={() => setView('list')}
                  className={`px-6 py-2 rounded-lg transition text-sm font-bold ${view === 'list' ? 'bg-ef-accent text-ef-dark shadow-lg shadow-ef-accent/20' : 'text-white/40 hover:text-white'}`}
                >
                  Squad
                </button>
                <button
                  onClick={() => setView('leaderboard')}
                  className={`px-6 py-2 rounded-lg transition text-sm font-bold ${view === 'leaderboard' ? 'bg-ef-accent text-ef-dark shadow-lg shadow-ef-accent/20' : 'text-white/40 hover:text-white'}`}
                >
                  Ranks
                </button>
                <button
                  onClick={() => setView('squad-builder')}
                  className={`px-6 py-2 rounded-lg transition text-sm font-bold ${view === 'squad-builder' ? 'bg-ef-accent text-ef-dark shadow-lg shadow-ef-accent/20' : 'text-white/40 hover:text-white'}`}
                >
                  Formations
                </button>
              </div>
            </div>
          </div>

          {/* Mobile Tab Switcher */}
          <nav className="md:hidden grid grid-cols-3 gap-2 p-1 bg-white/5 border border-white/10 rounded-2xl mb-4">
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
            <button
              onClick={() => setView('squad-builder')}
              className={`py-2 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${view === 'squad-builder' ? 'bg-ef-accent text-black shadow-lg shadow-ef-accent/20' : 'text-white/40 bg-transparent'}`}
            >
              Formations
            </button>
          </nav>
        </header>
      )}

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

              {/* Action Buttons Hub */}
              <div className="flex items-center gap-2 pr-4 md:pr-0">
                {/* Quick Update Button */}
                {user && (
                  <button
                    onClick={() => setView('quick-stats')}
                    className="flex flex-col items-center justify-center px-4 md:px-6 py-1.5 md:py-2 bg-ef-accent border border-ef-accent/20 rounded-xl md:rounded-2xl shadow-xl hover:scale-105 active:scale-95 transition-all text-ef-dark group"
                    title="Quickly update player stats"
                  >
                    <span className="text-xs md:text-lg">⚡</span>
                    <span className="text-[7px] md:text-[8px] font-black uppercase tracking-tighter">Stats</span>
                  </button>
                )}

                {/* Remainder Button */}
                {user && (
                  <button
                    onClick={() => setShowRemainder(true)}
                    className="flex flex-col items-center justify-center px-4 md:px-6 py-1.5 md:py-2 bg-white/5 border border-white/10 rounded-xl md:rounded-2xl shadow-xl hover:bg-white/10 active:scale-95 transition-all text-white/40 hover:text-white group"
                    title="Reminders & Notes"
                  >
                    <span className="text-xs md:text-lg">🔔</span>
                    <span className="text-[7px] md:text-[8px] font-black uppercase tracking-tighter">Remainder</span>
                  </button>
                )}

                {/* Filter button (Mobile-only icon + Text) */}
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`flex items-center justify-center px-4 md:px-6 py-3 md:py-4 rounded-xl md:rounded-2xl font-black uppercase tracking-widest transition-all border shadow-xl text-[10px] md:text-xs ${showFilters ? 'bg-ef-accent text-ef-dark border-ef-accent' : 'bg-white/5 text-white/40 border-white/10 hover:bg-white/10 hover:text-white'}`}
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



                {/* Select button (Mobile-only icon + Text on Select) */}
                {user && (
                  <div className="flex items-center gap-2">
                    {isSelectionMode && selectedIds.size > 0 && (
                      <button
                        onClick={() => setShowBulkEdit(true)}
                        className="flex items-center justify-center px-4 md:px-6 py-3 md:py-4 rounded-xl md:rounded-2xl font-black uppercase tracking-widest text-[10px] md:text-xs transition-all border shadow-xl bg-ef-blue text-white border-ef-blue/50 hover:bg-ef-blue/80"
                      >
                        <span>📝</span>
                        <span className="hidden md:inline ml-3">Bulk Edit</span>
                      </button>
                    )}
                    {/* Delete button - only shows when players are selected */}
                    {isSelectionMode && selectedIds.size > 0 && (
                      <button
                        onClick={() => handleBulkDelete()}
                        className="flex items-center justify-center px-4 md:px-6 py-3 md:py-4 rounded-xl md:rounded-2xl font-black uppercase tracking-widest text-[10px] md:text-xs transition-all border shadow-xl bg-red-500 text-white border-red-500 hover:bg-red-600 active:scale-95"
                      >
                        <span>🗑️</span>
                        <span className="hidden md:inline ml-3">Del ({selectedIds.size})</span>
                        <span className="md:hidden ml-1">{selectedIds.size}</span>
                      </button>
                    )}
                    {/* Cancel button - shows in selection mode */}
                    {isSelectionMode ? (
                      <button
                        onClick={() => { setIsSelectionMode(false); setSelectedIds(new Set()); }}
                        className="flex items-center justify-center px-4 md:px-6 py-3 md:py-4 rounded-xl md:rounded-2xl font-black uppercase tracking-widest text-[10px] md:text-xs transition-all border shadow-xl bg-white/10 text-white/60 border-white/20 hover:bg-white/20 hover:text-white active:scale-95"
                        title="Cancel Selection"
                      >
                        <span>✕</span>
                        <span className="hidden md:inline ml-2">Cancel</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => setIsSelectionMode(true)}
                        className="flex items-center justify-center px-4 md:px-6 py-3 md:py-4 rounded-xl md:rounded-2xl font-black uppercase tracking-widest text-[10px] md:text-xs transition-all border shadow-xl bg-white/5 text-white/60 border-white/10 hover:bg-white/10"
                      >
                        <span>✓</span>
                        <span className="hidden md:inline ml-3">Select</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )
      }

      {/* Bulk Edit Modal */}
      {showBulkEdit && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[1000] p-4 animate-fade-in backdrop-blur-sm">
          <div className="w-full max-w-md max-h-[95vh] flex flex-col bg-ef-card border border-white/10 rounded-3xl overflow-hidden shadow-2xl animate-slide-up">
            <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/5">
              <h3 className="text-xl font-black flex items-center gap-3">
                <span className="text-ef-blue">📝</span>
                <span className="bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent uppercase italic">Bulk Edit Players</span>
              </h3>
              <button
                onClick={() => setShowBulkEdit(false)}
                className="text-white/40 hover:text-white transition-colors"
              >✕</button>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
              <p className="text-[10px] font-black uppercase tracking-widest opacity-40">Updating {selectedIds.size} Selected Players</p>

              {/* Suggestions Datalists */}
              <datalist id="bulk-club-list">
                {[...new Set(players.map(p => p.club))].filter(Boolean).sort().map(club => (
                  <option key={club} value={club} />
                ))}
              </datalist>
              <datalist id="bulk-league-list">
                {[...new Set(players.map(p => p.league))].filter(Boolean).sort().map(league => (
                  <option key={league} value={league} />
                ))}
              </datalist>
              <datalist id="bulk-nat-list">
                {[...new Set(players.map(p => p.nationality))].filter(Boolean).sort().map(nat => (
                  <option key={nat} value={nat} />
                ))}
              </datalist>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest opacity-30 mb-2">Change Playstyle</label>
                    <select
                      value={bulkEditData.playstyle}
                      onChange={(e) => setBulkEditData(prev => ({ ...prev, playstyle: e.target.value }))}
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm font-bold text-white outline-none focus:border-ef-blue/40 transition-all"
                    >
                      <option value="" className="text-black italic">-- Keep Original --</option>
                      {PLAYSTYLES.map(style => (
                        <option key={style} value={style} className="text-black">{style}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest opacity-30 mb-2">Change Card Type</label>
                    <select
                      value={bulkEditData.cardType}
                      onChange={(e) => setBulkEditData(prev => ({ ...prev, cardType: e.target.value }))}
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm font-bold text-white outline-none focus:border-ef-blue/40 transition-all"
                    >
                      <option value="" className="text-black italic">-- Keep Original --</option>
                      {['Normal', 'Legend', 'Epic', 'Featured', 'POTW', 'BigTime', 'ShowTime'].map(type => (
                        <option key={type} value={type} className="text-black">{type}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest opacity-30 mb-2">Change Rating</label>
                    <input
                      type="number"
                      placeholder="Enter rating..."
                      value={bulkEditData.rating}
                      onChange={(e) => setBulkEditData(prev => ({ ...prev, rating: e.target.value }))}
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm font-bold text-white outline-none focus:border-ef-blue/40 transition-all placeholder:text-white/10"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="relative">
                    <label className="block text-[10px] font-black uppercase tracking-widest opacity-30 mb-2">Change Club Name</label>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Search club..."
                        value={bulkEditData.club}
                        onChange={(e) => {
                          const val = e.target.value;
                          setBulkEditData(prev => ({ ...prev, club: val }));
                          if (bulkClubSearchTimeout.current) clearTimeout(bulkClubSearchTimeout.current);
                          bulkClubSearchTimeout.current = setTimeout(() => handleBulkClubSearch(val), 400);
                        }}
                        onFocus={() => bulkEditData.club?.length >= 2 && setShowBulkClubResults(true)}
                        onBlur={() => setTimeout(() => setShowBulkClubResults(false), 200)}
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm font-bold text-white outline-none focus:border-ef-blue/40 transition-all placeholder:text-white/10"
                      />
                      {isBulkSearchingClub && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                          <div className="w-3 h-3 border-2 border-ef-accent border-t-transparent rounded-full animate-spin"></div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest opacity-30 mb-2">Change League</label>
                    <input
                      type="text"
                      placeholder="Enter league..."
                      list="bulk-league-list"
                      value={bulkEditData.league}
                      onChange={(e) => setBulkEditData(prev => ({ ...prev, league: e.target.value }))}
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm font-bold text-white outline-none focus:border-ef-blue/40 transition-all placeholder:text-white/10"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="relative">
                    <label className="block text-[10px] font-black uppercase tracking-widest opacity-30 mb-2">Change Nationality</label>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Search nation..."
                        value={bulkEditData.nationality}
                        onChange={(e) => {
                          const val = e.target.value;
                          setBulkEditData(prev => ({ ...prev, nationality: val }));
                          if (bulkNationSearchTimeout.current) clearTimeout(bulkNationSearchTimeout.current);
                          bulkNationSearchTimeout.current = setTimeout(() => handleBulkNationSearch(val), 400);
                        }}
                        onFocus={() => bulkEditData.nationality?.length >= 2 && setShowBulkNationResults(true)}
                        onBlur={() => setTimeout(() => setShowBulkNationResults(false), 200)}
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm font-bold text-white outline-none focus:border-ef-blue/40 transition-all placeholder:text-white/10"
                      />
                      {isBulkSearchingNation && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                          <div className="w-3 h-3 border-2 border-ef-accent border-t-transparent rounded-full animate-spin"></div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest opacity-30 mb-2">Change Age</label>
                    <input
                      type="number"
                      placeholder="Enter age..."
                      value={bulkEditData.age}
                      onChange={(e) => setBulkEditData(prev => ({ ...prev, age: e.target.value }))}
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm font-bold text-white outline-none focus:border-ef-blue/40 transition-all placeholder:text-white/10"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest opacity-30 mb-2">Change Height (cm)</label>
                    <input
                      type="number"
                      placeholder="Enter height..."
                      value={bulkEditData.height}
                      onChange={(e) => setBulkEditData(prev => ({ ...prev, height: e.target.value }))}
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm font-bold text-white outline-none focus:border-ef-blue/40 transition-all placeholder:text-white/10"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest opacity-30 mb-2">Change Strong Foot</label>
                    <select
                      value={bulkEditData.strongFoot}
                      onChange={(e) => setBulkEditData(prev => ({ ...prev, strongFoot: e.target.value }))}
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm font-bold text-white outline-none focus:border-ef-blue/40 transition-all"
                    >
                      <option value="" className="text-black italic">-- Keep Original --</option>
                      <option value="Right" className="text-black">Right Foot</option>
                      <option value="Left" className="text-black">Left Foot</option>
                    </select>
                  </div>
                </div>

                {showBulkClubResults && (
                  <div className="absolute z-[60] left-6 right-6 mt-0 bg-[#1a1a1e] border border-white/10 rounded-xl shadow-2xl overflow-hidden max-h-[200px] overflow-y-auto">
                    {bulkClubResults.length > 0 ? (
                      bulkClubResults.map(club => (
                        <div
                          key={club.idTeam}
                          onClick={() => handleSelectBulkClub(club)}
                          className={`px-4 py-3 hover:bg-white/10 cursor-pointer flex items-center gap-3 transition-colors border-b border-white/5 last:border-0 ${club.isLocal ? 'bg-ef-accent/5' : ''}`}
                        >
                          <div className="relative">
                            <img src={club.strBadge} alt="" className="w-8 h-8 object-contain" />
                            {club.isLocal && (
                              <div className="absolute -top-1 -right-1 bg-ef-accent text-black text-[6px] font-black px-1 rounded-sm shadow-sm ring-1 ring-black/10">BADGE</div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-baseline gap-2">
                              <span className="text-xs font-black text-white truncate">{club.strTeam}</span>
                              {club.isLocal && <span className="text-[7px] text-ef-accent font-black uppercase tracking-tighter opacity-60">Existing</span>}
                            </div>
                            <div className="text-[8px] uppercase font-bold opacity-30 truncate">{club.strLeague || 'No League Info'}</div>
                          </div>
                          <div className="text-xs opacity-20">➜</div>
                        </div>
                      ))
                    ) : (
                      !isBulkSearchingClub && bulkEditData.club?.length >= 2 && (
                        <div className="px-4 py-6 text-center text-white/40 text-[10px] font-bold uppercase tracking-widest">
                          No clubs found
                        </div>
                      )
                    )}
                  </div>
                )}

                {showBulkNationResults && (
                  <div className="absolute z-[60] left-6 right-6 mt-0 bg-[#1a1a1e] border border-white/10 rounded-xl shadow-2xl overflow-hidden max-h-[200px] overflow-y-auto">
                    {bulkNationResults.length > 0 ? (
                      bulkNationResults.map(nation => (
                        <div
                          key={nation.idTeam || nation.name}
                          onClick={() => handleSelectBulkNation(nation)}
                          className={`px-4 py-3 hover:bg-white/10 cursor-pointer flex items-center gap-3 transition-colors border-b border-white/5 last:border-0 ${nation.isLocal ? 'bg-ef-accent/5' : ''}`}
                        >
                          <div className="relative">
                            <img src={nation.flag} alt="" className="w-8 h-8 object-contain" />
                            {nation.isLocal && (
                              <div className="absolute -top-1 -right-1 bg-ef-accent text-black text-[6px] font-black px-1 rounded-sm shadow-sm ring-1 ring-black/10">BADGE</div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-baseline gap-2">
                              <span className="text-xs font-black text-white truncate">{nation.name}</span>
                              {nation.isLocal && <span className="text-[7px] text-ef-accent font-black uppercase tracking-tighter opacity-60">Existing</span>}
                            </div>
                          </div>
                          <div className="text-xs opacity-20">➜</div>
                        </div>
                      ))
                    ) : (
                      !isBulkSearchingNation && bulkEditData.nationality?.length >= 2 && (
                        <div className="px-4 py-6 text-center text-white/40 text-[10px] font-bold uppercase tracking-widest">
                          No nations found
                        </div>
                      )
                    )}
                  </div>
                )}
              </div>

              {bulkEditData.league && (
                <div className="p-3 bg-white/5 border border-white/10 rounded-xl flex items-center gap-3 animate-fade-in">
                  <img src={bulkEditData.logos?.league} alt="" className="w-6 h-6 opacity-60" />
                  <div>
                    <p className="text-[8px] font-black text-white/30 uppercase tracking-widest">Auto-detected League</p>
                    <p className="text-[10px] font-bold text-ef-accent uppercase">{bulkEditData.league}</p>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div className="relative group">
                  <input
                    type="file"
                    accept="image/*"
                    id="bulk-club-badge-input"
                    className="hidden"
                    onChange={(e) => handleBulkBadgeUpload('club', e.target.files[0])}
                  />
                  <button
                    onClick={() => document.getElementById('bulk-club-badge-input').click()}
                    className={`w-full py-4 border rounded-xl flex flex-col items-center justify-center gap-2 transition-all ${bulkEditData.logos?.club ? 'bg-ef-accent/10 border-ef-accent text-ef-accent' : 'bg-black/40 border-white/10 text-white/40 hover:bg-white/5 hover:text-white'}`}
                  >
                    {bulkEditData.logos?.club ? (
                      <img src={bulkEditData.logos.club} className="w-6 h-6 object-contain" alt="" />
                    ) : (
                      <span className="text-xl">🛡️</span>
                    )}
                    <span className="text-[8px] font-black uppercase tracking-widest">{bulkEditData.logos?.club ? 'Change Club' : 'Add Club'}</span>
                  </button>
                </div>

                <div className="relative group">
                  <input
                    type="file"
                    accept="image/*"
                    id="bulk-nation-badge-input"
                    className="hidden"
                    onChange={(e) => handleBulkBadgeUpload('country', e.target.files[0])}
                  />
                  <button
                    onClick={() => document.getElementById('bulk-nation-badge-input').click()}
                    className={`w-full py-4 border rounded-xl flex flex-col items-center justify-center gap-2 transition-all ${bulkEditData.logos?.country ? 'bg-ef-blue/10 border-ef-blue text-ef-blue' : 'bg-black/40 border-white/10 text-white/40 hover:bg-white/5 hover:text-white'}`}
                  >
                    {bulkEditData.logos?.country ? (
                      <img src={bulkEditData.logos.country} className="w-6 h-6 object-contain" alt="" />
                    ) : (
                      <span className="text-xl">🏴</span>
                    )}
                    <span className="text-[8px] font-black uppercase tracking-widest">{bulkEditData.logos?.country ? 'Change Nation' : 'Add Nation'}</span>
                  </button>
                </div>
              </div>

              {/* Bulk Tags */}
              <div className="pt-4 border-t border-white/5">
                <label className="block text-[10px] font-black uppercase tracking-widest opacity-30 mb-2">Add Bulk Tags</label>
                <div className="flex gap-2 mb-3">
                  <input
                    type="text"
                    value={bulkTagInput}
                    onChange={(e) => setBulkTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        const tag = bulkTagInput.trim().toLowerCase().replace(/#/g, '');
                        if (tag && !bulkEditData.tags.includes(tag)) {
                          setBulkEditData(prev => ({ ...prev, tags: [...prev.tags, tag] }));
                          setBulkTagInput('');
                        }
                      }
                    }}
                    placeholder="Type and press Enter to add tag..."
                    className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm font-bold text-white outline-none focus:border-ef-accent/40 transition-all placeholder:text-white/10"
                  />
                  <button
                    onClick={() => {
                      const tag = bulkTagInput.trim().toLowerCase().replace(/#/g, '');
                      if (tag && !bulkEditData.tags.includes(tag)) {
                        setBulkEditData(prev => ({ ...prev, tags: [...prev.tags, tag] }));
                        setBulkTagInput('');
                      }
                    }}
                    className="px-4 bg-ef-accent text-ef-dark rounded-xl font-black uppercase tracking-tighter text-[10px] hover:scale-105 active:scale-95 transition-all"
                  >
                    Add
                  </button>
                </div>
                {bulkEditData.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {bulkEditData.tags.map(tag => (
                      <span key={tag} className="flex items-center gap-1.5 px-3 py-1 bg-ef-accent/10 border border-ef-accent/30 rounded-full text-ef-accent text-[9px] font-black uppercase tracking-widest group">
                        #{tag}
                        <button
                          onClick={() => setBulkEditData(prev => ({ ...prev, tags: prev.tags.filter(t => t !== tag) }))}
                          className="hover:text-white transition-colors"
                        >✕</button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Link inputs for badges */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="block text-[8px] font-black uppercase tracking-widest opacity-30 mb-1 ml-1">Or Paste Club Link</label>
                  <input
                    type="text"
                    placeholder="https://..."
                    value={bulkEditData.logos?.club?.startsWith('data:image') ? '' : bulkEditData.logos?.club}
                    onChange={(e) => setBulkEditData(prev => ({ ...prev, logos: { ...prev.logos, club: e.target.value } }))}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-[9px] font-bold text-white outline-none focus:border-ef-accent/40 transition-all placeholder:text-white/5"
                  />
                </div>
                <div>
                  <label className="block text-[8px] font-black uppercase tracking-widest opacity-30 mb-1 ml-1">Or Paste Nation Link</label>
                  <input
                    type="text"
                    placeholder="https://..."
                    value={bulkEditData.logos?.country?.startsWith('data:image') ? '' : bulkEditData.logos?.country}
                    onChange={(e) => setBulkEditData(prev => ({ ...prev, logos: { ...prev.logos, country: e.target.value } }))}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-[9px] font-bold text-white outline-none focus:border-ef-blue/40 transition-all placeholder:text-white/5"
                  />
                </div>
              </div>
            </div>

            <div className="p-6 pt-0 flex gap-3">
              <button
                onClick={() => setShowBulkEdit(false)}
                className="flex-1 py-4 px-6 rounded-xl bg-white/5 border border-white/10 text-white/40 font-black uppercase tracking-widest text-[10px] transition-all hover:bg-white/10"
              >
                Cancel
              </button>
              <button
                onClick={handleBulkUpdate}
                className="flex-1 py-4 px-6 rounded-xl bg-ef-blue text-white font-black uppercase tracking-widest text-[10px] transition-all shadow-lg shadow-ef-blue/20 hover:scale-[1.02] active:scale-95"
              >
                Apply Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toggleable Filter/Sort Controls */}
      {
        view === 'list' && showFilters && (
          <div className="max-w-6xl mx-auto mb-8 p-6 bg-ef-card border border-white/20 rounded-3xl animate-slide-up shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-ef-accent"></div>

            <div className="flex flex-col md:flex-row gap-8">
              {/* Left Column: Filters */}
              <div className="flex-1 space-y-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">Active Filters</h3>
                  <button
                    onClick={() => {
                      setFilterPos('All');
                      setFilterType('All');
                      setFilterInactive(false);
                      setFilterLeague('');
                      setFilterClub('');
                      setFilterNationality('');
                      setFilterRating('');
                      setFilterPlaystyle('All');
                      setFilterSkill('All');
                      setFilterMissing('All');
                      setIncludeSecondary(false);
                    }}
                    className="text-[10px] font-black uppercase tracking-widest text-ef-accent hover:opacity-80 transition-opacity"
                  >
                    Clear All
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-black uppercase tracking-widest opacity-40 mb-3">Position Filter</label>
                    <select
                      value={filterPos}
                      onChange={(e) => setFilterPos(e.target.value)}
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm font-bold text-white outline-none focus:border-ef-accent/40 transition-all"
                    >
                      {['All', 'CF', 'SS', 'LWF', 'RWF', 'LMF', 'RMF', 'AMF', 'CMF', 'DMF', 'CB', 'LB', 'RB', 'GK'].map(pos => (
                        <option key={pos} value={pos} className="text-black">{pos === 'All' ? 'All Positions' : pos}</option>
                      ))}
                    </select>
                    {filterPos !== 'All' && (
                      <div className="mt-3 flex items-center gap-2">
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            className="sr-only peer"
                            checked={includeSecondary}
                            onChange={(e) => setIncludeSecondary(e.target.checked)}
                          />
                          <div className="w-9 h-5 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white/40 after:border-white/10 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-ef-accent peer-checked:after:bg-ef-dark"></div>
                        </label>
                        <span className={`text-[10px] font-black uppercase tracking-wider transition-colors ${includeSecondary ? 'text-ef-accent' : 'opacity-30'}`}>
                          Include Secondary Positions
                        </span>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-black uppercase tracking-widest opacity-40 mb-3">Card Type Filter</label>
                    <select
                      value={filterType}
                      onChange={(e) => setFilterType(e.target.value)}
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm font-bold text-white outline-none focus:border-ef-accent/40 transition-all"
                    >
                      {['All', 'Normal', 'Legend', 'Epic', 'Featured', 'POTW', 'BigTime', 'ShowTime'].map(type => (
                        <option key={type} value={type} className="text-black">{type === 'All' ? 'All Card Types' : type}</option>
                      ))}
                    </select>
                  </div>
                </div>


                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-white/5">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest opacity-30 mb-2">Club Name</label>
                      <input
                        type="text"
                        placeholder="Search club..."
                        list="bulk-club-list"
                        value={filterClub}
                        onChange={(e) => setFilterClub(e.target.value)}
                        className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-2.5 text-xs font-bold text-white outline-none focus:border-ef-accent/40 transition-all uppercase placeholder:text-white/10"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest opacity-30 mb-2">League</label>
                      <input
                        type="text"
                        placeholder="Search league..."
                        list="bulk-league-list"
                        value={filterLeague}
                        onChange={(e) => setFilterLeague(e.target.value)}
                        className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-2.5 text-xs font-bold text-white outline-none focus:border-ef-accent/40 transition-all uppercase placeholder:text-white/10"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest opacity-30 mb-2">Rating</label>
                      <input
                        type="number"
                        placeholder="Exact rating..."
                        value={filterRating}
                        onChange={(e) => setFilterRating(e.target.value)}
                        className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-2.5 text-xs font-bold text-white outline-none focus:border-ef-accent/40 transition-all placeholder:text-white/10"
                        min="1"
                        max="150"
                      />
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest opacity-30 mb-2">Nationality</label>
                      <input
                        type="text"
                        placeholder="Search country..."
                        list="bulk-nat-list"
                        value={filterNationality}
                        onChange={(e) => setFilterNationality(e.target.value)}
                        className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-2.5 text-xs font-bold text-white outline-none focus:border-ef-accent/40 transition-all uppercase placeholder:text-white/10"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest opacity-30 mb-2">Playstyle</label>
                      <select
                        value={filterPlaystyle}
                        onChange={(e) => setFilterPlaystyle(e.target.value)}
                        className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-2.5 text-xs font-bold text-white outline-none focus:border-ef-accent/40 transition-all font-outfit"
                      >
                        <option value="All" className="text-black">All Styles</option>
                        {PLAYSTYLES.map(style => (
                          <option key={style} value={style} className="text-black">{style}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest opacity-30 mb-2">Skill Filter</label>
                      <select
                        value={filterSkill}
                        onChange={(e) => setFilterSkill(e.target.value)}
                        className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-2.5 text-xs font-bold text-white outline-none focus:border-ef-accent/40 transition-all font-outfit"
                      >
                        <option value="All" className="text-black">All Skills</option>
                        <option value="Any Special Skill" className="text-black font-black">✨ Any Special Skill</option>
                        
                        <optgroup label="Special Skills" className="text-black bg-white/5">
                          {SPECIAL_SKILLS.map(skill => (
                            <option key={skill} value={skill} className="text-black">{skill}</option>
                          ))}
                        </optgroup>
                        
                        <optgroup label="Standard Skills" className="text-black bg-white/5">
                          {PLAYER_SKILLS.map(skill => (
                            <option key={skill} value={skill} className="text-black">{skill}</option>
                          ))}
                        </optgroup>
                      </select>
                    </div>
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
                  <option value="uploaded_desc" className="text-black">Date Uploaded (Newest)</option>
                  <option value="uploaded_asc" className="text-black">Date Uploaded (Oldest)</option>
                  <option value="dateAdded_desc" className="text-black">Date Added (Newest)</option>
                  <option value="dateAdded_asc" className="text-black">Date Added (Oldest)</option>
                  <option value="goals" className="text-black">Top Scorer</option>
                  <option value="assists" className="text-black">Most Assists</option>
                  <option value="name" className="text-black">Player Name</option>
                  <option value="position" className="text-black">Position</option>
                </select>

                <div className="mt-8">
                  <label className="block text-xs font-black uppercase tracking-widest opacity-40 mb-3">Participation</label>
                  <button
                    onClick={() => setFilterInactive(!filterInactive)}
                    className={`w-full py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all border ${filterInactive ? 'bg-ef-accent border-ef-accent text-ef-dark shadow-lg shadow-ef-accent/20' : 'bg-white/5 border-white/10 text-white/40 hover:bg-white/10 hover:text-white'}`}
                  >
                    {filterInactive ? '🎯 Showing 0 Matches' : '👻 Show Inactive'}
                  </button>
                </div>

                <div className="mt-6 pt-6 border-t border-white/5">
                  <label className="block text-xs font-black uppercase tracking-widest opacity-40 mb-3">Performance</label>
                  <button
                    onClick={() => {
                      setSettings(prev => ({ ...prev, enablePagination: !prev.enablePagination }));
                      setCurrentPage(1);
                    }}
                    className={`w-full py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all border ${settings.enablePagination ? 'bg-ef-blue border-ef-blue text-white shadow-lg' : 'bg-white/5 border-white/10 text-white/40 hover:bg-white/10 hover:text-white'}`}
                  >
                    {settings.enablePagination ? '📖 Pagination Enabled' : '📜 Infinite Scroll Mode'}
                  </button>
                  {settings.enablePagination && (
                    <div className="mt-3 flex items-center justify-between px-1">
                      <span className="text-[10px] font-black uppercase tracking-widest opacity-30">Per Page:</span>
                      <div className="flex gap-1">
                        {[20, 40, 80].map(size => (
                          <button
                            key={size}
                            onClick={() => setSettings(prev => ({ ...prev, itemsPerPage: size }))}
                            className={`w-8 h-8 rounded-lg text-[10px] font-black transition-all border ${settings.itemsPerPage === size ? 'bg-ef-blue border-ef-blue text-white' : 'bg-white/5 border-white/10 text-white/40 hover:text-white'}`}
                          >
                            {size}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-6">
                  <label className="block text-xs font-black uppercase tracking-widest opacity-40 mb-3">Missing Details</label>
                  <select
                    value={filterMissing}
                    onChange={(e) => setFilterMissing(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-5 py-3 text-sm font-bold outline-none cursor-pointer hover:border-ef-accent/50 transition-all text-white"
                  >
                    <option value="All" className="text-black">All Players</option>
                    <option value="Missing Picture" className="text-black">Missing Picture</option>
                    <option value="Missing Player ID" className="text-black">Missing Player ID</option>
                    <option value="Missing Playstyle" className="text-black">Missing Playstyle</option>
                    <option value="Missing Card Type" className="text-black">Missing Card Type</option>
                    <option value="Missing Club" className="text-black">Missing Club</option>
                    <option value="Missing League" className="text-black">Missing League</option>
                    <option value="Missing Club Badge" className="text-black">Missing Club Badge</option>
                    <option value="Missing Country Badge" className="text-black">Missing Country Badge</option>
                    <option value="Missing Age" className="text-black">Missing Age</option>
                    <option value="Missing Height" className="text-black">Missing Height</option>
                    <option value="Missing Tags" className="text-black">Missing Tags</option>
                    <option value="Missing Foot" className="text-black">Missing Foot</option>
                    <option value="No Skills Found" className="text-black">No Skills Found</option>
                    <option value="No Additional Skills" className="text-black">No Additional Skills (0/5)</option>
                    <option value="Incomplete Additional Skills" className="text-black">Incomplete Additional Skills (1–4/5)</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        )
      }

      <Suspense fallback={<LoadingFallback />}>
        <SidebarNav
          view={view}
          setView={setView}
          setShowAddPlayer={setShowAddPlayer}
          setShowDatabase={setShowDatabase}
          setShowScreenshots={setShowScreenshots}
          setShowLinks={setShowLinks}
          setShowSettings={setShowSettings}
          user={user}
          setShowLogin={setShowLogin}
          handleLogout={handleLogout}
          showAlert={showAlert}
          setShowProfileStats={setShowProfileStats}
          setShowSocial={setShowSocial}
          setShowBrochure={setShowBrochure}
        />
        <main className="max-w-6xl mx-auto animate-fade-in pb-20 pt-4 md:pt-0">



          {showAddPlayer && (
            <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 animate-fade-in backdrop-blur-sm">
              <div className="w-full max-w-2xl max-h-[95vh] relative animate-slide-up flex flex-col bg-ef-card rounded-3xl border border-white/10 shadow-2xl overflow-hidden">
                {/* Persistent Header with Close Button */}
                <div className="flex items-center justify-between p-4 px-6 border-b border-white/5 bg-black/20">
                  <h3 className="text-xl font-black flex items-center gap-3">
                    <span className="text-ef-accent text-2xl">✍️</span>
                    <span className="bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent uppercase tracking-tighter italic">Player Recruitment</span>
                  </h3>
                  <button
                    onClick={() => setShowAddPlayer(false)}
                    className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 text-white transition-all flex items-center justify-center border border-white/10"
                    title="Close"
                  >
                    ✕
                  </button>
                </div>

                {/* Scrollable Form Content */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-1">
                  <PlayerForm
                    onAdd={(data) => {
                      handleAddPlayer(data);
                      setShowAddPlayer(false);
                    }}
                    onClose={() => setShowAddPlayer(false)}
                    showAlert={showAlert}
                    showConfirm={showConfirm}
                    hideExternalClose={true} // We'll handle close in the header
                  />
                </div>
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
              showAlert={showAlert}
              showConfirm={showConfirm}
            />
          )}

          {showScreenshots && (
            <ScreenshotsModal user={user} onClose={() => setShowScreenshots(false)} showAlert={showAlert} showConfirm={showConfirm} />
          )}

          {showLinks && (
            <LinksModal user={user} onClose={() => setShowLinks(false)} onAddApp={handleAddApp} showAlert={showAlert} showConfirm={showConfirm} />
          )}

          {showSettings && (
            <SettingsModal
              settings={settings}
              setSettings={setSettings}
              onClose={() => setShowSettings(false)}
              user={user}
              players={players}
              setPlayers={setPlayers}
            />
          )}

          {showLogin && (
            <LoginModal
              onClose={() => setShowLogin(false)}
            />
          )}

          {/* Persistent Apps Drawer */}
          {user && (
            <AppsDrawer apps={apps} onDeleteApp={handleDeleteApp} onReorderApps={handleReorderApps} showAlert={showAlert} showConfirm={showConfirm} />
          )}

          {showProfileStats && (
            <ProfileStatsModal
              players={players}
              onClose={() => setShowProfileStats(false)}
            />
          )}

          {/* Main Dialog */}
          <CustomDialog
            isOpen={dialog.isOpen}
            title={dialog.title}
            message={dialog.message}
            type={dialog.type}
            onConfirm={dialog.onConfirm}
            onCancel={dialog.onCancel}
            confirmText={dialog.confirmText}
            cancelText={dialog.cancelText}
          />

          {showBrochure && (
            <BrochureModal
              players={players}
              onClose={() => setShowBrochure(false)}
              user={user}
              activeSquad={activeSquad}
            />
          )}

          {importPreviewData && (
            <ImportSummaryModal
              data={importPreviewData}
              onSave={handleConfirmImportSave}
              onUndo={() => setImportPreviewData(null)}
            />
          )}

          {/* Main Content Area */}
          <div className="animate-slide-up" style={{ animationDelay: '0.2s' }}>
            {loading ? (
              <div className="text-center py-20 opacity-50">Loading stats...</div>
            ) : (
              <>
                {view === 'list' && (
                  <>
                    <div className={`grid ${settings.cardSize === 'mini' ? 'grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-3 md:gap-4' :
                      settings.cardSize === 'xs' ? 'grid-cols-5 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-1' :
                      settings.cardSize === 'sm' ? 'grid-cols-4 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-2 md:gap-3' :
                        settings.cardSize === 'md' ? 'grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-4' :
                          'grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6'
                      } ${settings.highPerf ? '![animation:none]' : ''}`}>
                      {(settings.enablePagination
                        ? processedPlayers.slice((currentPage - 1) * settings.itemsPerPage, currentPage * settings.itemsPerPage)
                        : processedPlayers
                      ).map(player => (
                        <div key={player._id} onClick={() => !isSelectionMode && setSelectedPlayer(player)}>
                          <PlayerCard
                            player={player}
                            players={players}
                            isSelectionMode={isSelectionMode}
                            isSelected={selectedIds.has(player._id)}
                            onToggleSelect={handleToggleSelect}
                            settings={settings}
                            secondaryMatch={includeSecondary && filterPos !== 'All' && player.secondaryPosition?.toUpperCase().includes(filterPos.toUpperCase()) && player.position !== filterPos ? filterPos : null}
                          />
                        </div>
                      ))}
                      {processedPlayers.length === 0 && (
                        <div className="col-span-full text-center py-20 opacity-30 border-2 border-dashed border-white/10 rounded-xl">
                          {user ? 'No players found. Add your first card!' : 'Please login to view your squad.'}
                        </div>
                      )}
                    </div>

                    {/* Pagination Controls */}
                    {settings.enablePagination && processedPlayers.length > settings.itemsPerPage && (
                      <div className="mt-12 flex flex-col items-center gap-6 pb-12">
                        <div className="flex items-center gap-2">
                          <button
                            disabled={currentPage === 1}
                            onClick={() => {
                              setCurrentPage(p => Math.max(1, p - 1));
                              window.scrollTo({ top: 0, behavior: 'smooth' });
                            }}
                            className={`w-12 h-12 rounded-2xl flex items-center justify-center border transition-all ${currentPage === 1 ? 'opacity-10 border-white/5 cursor-not-allowed' : 'bg-white/5 border-white/10 text-white hover:bg-ef-blue hover:text-white hover:border-ef-blue hover:scale-105 active:scale-95 shadow-xl'}`}
                          >
                            <span className="text-xl">←</span>
                          </button>

                          <div className="flex items-center gap-1.5 px-4 h-12 bg-white/5 border border-white/10 rounded-2xl shadow-xl">
                            {(() => {
                              const totalPages = Math.ceil(processedPlayers.length / settings.itemsPerPage);
                              const pages = [];
                              let start = Math.max(1, currentPage - 1);
                              let end = Math.min(totalPages, start + 2);
                              if (end === totalPages) start = Math.max(1, end - 2);

                              for (let i = start; i <= end; i++) {
                                pages.push(
                                  <button
                                    key={i}
                                    onClick={() => {
                                      setCurrentPage(i);
                                      window.scrollTo({ top: 0, behavior: 'smooth' });
                                    }}
                                    className={`w-9 h-9 rounded-xl text-xs font-black transition-all ${currentPage === i ? 'bg-ef-blue text-white shadow-lg' : 'text-white/30 hover:text-white hover:bg-white/5'}`}
                                  >
                                    {i}
                                  </button>
                                );
                              }
                              return pages;
                            })()}
                            {Math.ceil(processedPlayers.length / settings.itemsPerPage) > 3 && currentPage < Math.ceil(processedPlayers.length / settings.itemsPerPage) - 1 && (
                              <>
                                <span className="text-white/10 px-1 italic text-[10px]">..</span>
                                <button
                                  onClick={() => {
                                    setCurrentPage(Math.ceil(processedPlayers.length / settings.itemsPerPage));
                                    window.scrollTo({ top: 0, behavior: 'smooth' });
                                  }}
                                  className={`w-9 h-9 rounded-xl text-xs font-black text-white/30 hover:text-white hover:bg-white/5 transition-all`}
                                >
                                  {Math.ceil(processedPlayers.length / settings.itemsPerPage)}
                                </button>
                              </>
                            )}
                          </div>

                          <button
                            disabled={currentPage === Math.ceil(processedPlayers.length / settings.itemsPerPage)}
                            onClick={() => {
                              setCurrentPage(p => Math.min(Math.ceil(processedPlayers.length / settings.itemsPerPage), p + 1));
                              window.scrollTo({ top: 0, behavior: 'smooth' });
                            }}
                            className={`w-12 h-12 rounded-2xl flex items-center justify-center border transition-all ${currentPage === Math.ceil(processedPlayers.length / settings.itemsPerPage) ? 'opacity-10 border-white/5 cursor-not-allowed' : 'bg-white/5 border-white/10 text-white hover:bg-ef-blue hover:text-white hover:border-ef-blue hover:scale-105 active:scale-95 shadow-xl'}`}
                          >
                            <span className="text-xl">→</span>
                          </button>
                        </div>
                        <p className="text-[10px] font-black uppercase tracking-[0.4em] opacity-20">
                          Showing {(currentPage - 1) * settings.itemsPerPage + 1} - {Math.min(currentPage * settings.itemsPerPage, processedPlayers.length)} of {processedPlayers.length} Players
                        </p>
                      </div>
                    )}
                  </>
                )}

                {view === 'leaderboard' && (
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
                                {['CF', 'SS', 'LWF', 'RWF', 'LMF', 'RMF', 'AMF', 'CMF', 'DMF', 'CB', 'LB', 'RB', 'GK'].map(pos => (
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
                                    onClick={() => setLbFilters(prev => ({ ...prev, positions: [], includeSecondary: false }))}
                                    className="px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest bg-red-500/10 border border-red-500/20 text-red-500 hover:bg-red-500/20 transition-all"
                                  >
                                    Reset
                                  </button>
                                )}
                              </div>
                              <div className="mt-3 flex items-center gap-2">
                                <label className="relative inline-flex items-center cursor-pointer">
                                  <input
                                    type="checkbox"
                                    className="sr-only peer"
                                    checked={lbFilters.includeSecondary}
                                    onChange={(e) => setLbFilters(prev => ({ ...prev, includeSecondary: e.target.checked }))}
                                  />
                                  <div className="w-9 h-5 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white/40 after:border-white/10 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-ef-accent peer-checked:after:bg-ef-dark"></div>
                                </label>
                                <span className={`text-[10px] font-black uppercase tracking-wider transition-colors ${lbFilters.includeSecondary ? 'text-ef-accent' : 'opacity-30'}`}>
                                  Include Secondary Positions
                                </span>
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
                            <div>
                              <label className="block text-xs font-black uppercase tracking-widest opacity-40 mb-2">Skill</label>
                              <select
                                value={lbFilters.skill}
                                onChange={(e) => setLbFilters({ ...lbFilters, skill: e.target.value })}
                                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm font-bold text-white outline-none focus:border-ef-accent transition-all"
                              >
                                <option value="" className="text-white/40 italic">-- Any Skill --</option>
                                <option value="Any Special Skill" className="bg-ef-dark text-ef-accent font-black">✨ Any Special Skill</option>
                                
                                <optgroup label="Special Skills" className="bg-ef-dark text-white/50">
                                  {SPECIAL_SKILLS.map(s => (
                                    <option key={s} value={s} className="bg-ef-dark text-white">{s}</option>
                                  ))}
                                </optgroup>
                                
                                <optgroup label="Standard Skills" className="bg-ef-dark text-white/50">
                                  {PLAYER_SKILLS.map(s => (
                                    <option key={s} value={s} className="bg-ef-dark text-white">{s}</option>
                                  ))}
                                </optgroup>
                              </select>
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
                            <div className="md:col-span-4 mt-4 border-t border-white/5 pt-0 md:pt-4">
                              <label className="block text-[10px] font-black uppercase tracking-[0.2em] opacity-40 mb-3">Minimum Games Played</label>
                              <div className="flex gap-6">
                                <label className="flex items-center gap-3 cursor-pointer group">
                                  <div className="relative flex items-center justify-center">
                                    <input
                                      type="radio"
                                      name="minGames"
                                      checked={lbFilters.minGames === 0}
                                      onChange={() => setLbFilters({ ...lbFilters, minGames: 0 })}
                                      className="peer appearance-none w-5 h-5 border-2 border-white/10 rounded-full checked:border-ef-accent transition-all"
                                    />
                                    <div className="absolute w-2.5 h-2.5 rounded-full bg-ef-accent scale-0 peer-checked:scale-100 transition-transform"></div>
                                  </div>
                                  <span className={`text-xs font-black uppercase tracking-widest transition-colors ${lbFilters.minGames === 0 ? 'text-ef-accent' : 'text-white/40 group-hover:text-white/60'}`}>All</span>
                                </label>

                                <label className="flex items-center gap-3 cursor-pointer group">
                                  <div className="relative flex items-center justify-center">
                                    <input
                                      type="radio"
                                      name="minGames"
                                      checked={lbFilters.minGames === 50}
                                      onChange={() => setLbFilters({ ...lbFilters, minGames: 50 })}
                                      className="peer appearance-none w-5 h-5 border-2 border-white/10 rounded-full checked:border-ef-accent transition-all"
                                    />
                                    <div className="absolute w-2.5 h-2.5 rounded-full bg-ef-accent scale-0 peer-checked:scale-100 transition-transform"></div>
                                  </div>
                                  <span className={`text-xs font-black uppercase tracking-widest transition-colors ${lbFilters.minGames === 50 ? 'text-ef-accent' : 'text-white/40 group-hover:text-white/60'}`}>Min games 50</span>
                                </label>

                                <label className="flex items-center gap-3 cursor-pointer group">
                                  <div className="relative flex items-center justify-center">
                                    <input
                                      type="radio"
                                      name="minGames"
                                      checked={lbFilters.minGames === 100}
                                      onChange={() => setLbFilters({ ...lbFilters, minGames: 100 })}
                                      className="peer appearance-none w-5 h-5 border-2 border-white/10 rounded-full checked:border-ef-accent transition-all"
                                    />
                                    <div className="absolute w-2.5 h-2.5 rounded-full bg-ef-accent scale-0 peer-checked:scale-100 transition-transform"></div>
                                  </div>
                                  <span className={`text-xs font-black uppercase tracking-widest transition-colors ${lbFilters.minGames === 100 ? 'text-ef-accent' : 'text-white/40 group-hover:text-white/60'}`}>Min games 100</span>
                                </label>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                    <Leaderboard
                      players={players.filter(p => {
                        let matchesPos = lbFilters.positions.length === 0 || lbFilters.positions.includes(p.position);

                        if (!matchesPos && lbFilters.includeSecondary && lbFilters.positions.length > 0) {
                          matchesPos = lbFilters.positions.some(pos =>
                            p.secondaryPosition && p.secondaryPosition.toUpperCase().includes(pos.toUpperCase())
                          );
                        }

                        const matchesClub = !lbFilters.club || normalizeString(p.club).includes(normalizeString(lbFilters.club));
                        const matchesLeague = !lbFilters.league || normalizeString(p.league).includes(normalizeString(lbFilters.league));
                        const matchesCountry = !lbFilters.country || normalizeString(p.nationality).includes(normalizeString(lbFilters.country));
                        const matchesSkill = !lbFilters.skill || 
                          (lbFilters.skill === 'Any Special Skill' 
                            ? ((p.skills && p.skills.some(s => SPECIAL_SKILLS.includes(s))) || (p.additionalSkills && p.additionalSkills.some(s => SPECIAL_SKILLS.includes(s))))
                            : ((p.skills && p.skills.includes(lbFilters.skill)) || (p.additionalSkills && p.additionalSkills.includes(lbFilters.skill))));
                        const matchesType = lbFilters.cardTypes.length === 0 || lbFilters.cardTypes.includes(p.cardType);
                        const matchesStyle = lbFilters.playstyles.length === 0 || lbFilters.playstyles.includes(p.playstyle);
                        const matchesMinGames = (p.matches || 0) >= lbFilters.minGames;
                        return matchesPos && matchesClub && matchesLeague && matchesCountry && matchesSkill && matchesType && matchesStyle && matchesMinGames;
                      })}
                      onPlayerClick={setSelectedPlayer}
                      activePositions={lbFilters.positions}
                      includeSecondary={lbFilters.includeSecondary}
                    />
                  </div>
                )}

                {view === 'squad-builder' && (
                  <SquadBuilder
                    players={players}
                    squads={squads}
                    activeSquadId={settings.activeSquadId}
                    onSetActive={handleSetActiveSquad}
                    onDuplicate={handleDuplicateSquad}
                    onSave={handleSaveSquad}
                    onDelete={handleDeleteSquad}
                    onDeleteBulk={handleDeleteSquads}
                    onUpdatePlayer={handleUpdatePlayer}
                    onAddPlayers={handleBulkAddPlayers}
                    user={user}
                  />
                )}

                {view === 'badges' && (
                  <BadgesView
                    players={players}
                    onUpdateBadge={handleUpdateBadge}
                    onAddBadge={handleAddPlayer}
                    onMergeBadge={handleMergeBadges}
                  />
                )}
              </>
            )}
          </div>
        </main>
        {showDatabase && (
          <DatabasePlayerList
            onAddPlayers={handleBulkAddPlayers}
            onBack={() => setShowDatabase(false)}
            settings={settings}
            ownersPlayers={players}
            showAlert={showAlert}
            showConfirm={showConfirm}
          />
        )}

                {view === 'squad-db' && (
                  <MySquadDB
                    players={players}
                    onBack={() => setView('list')}
                    onImport={handleImportSquadJSON}
                    onPlayerClick={setSelectedPlayer}
                  />
                )}

                {view === 'quick-stats' && (
          <QuickStatsView
            players={players}
            user={user}
            activeSquad={activeSquad}
            onUpdate={(id, updates) => handleUpdatePlayer(id, updates, false)}
            onClose={() => setView('list')}
          />
        )}
        {showRemainder && (
          <RemainderModal
            user={user}
            onClose={() => setShowRemainder(false)}
            showAlert={showAlert}
            showConfirm={showConfirm}
          />
        )}
        <SocialDrawer
          isOpen={showSocial}
          onClose={() => setShowSocial(false)}
        />
      </Suspense>
    </div >
  );
}

export default App;
