export const PLAYSTYLES = [
    'None', 'Goal Poacher', 'Fox in the Box', 'Target Man', 'Deep-lying Forward',
    'Dummy Runner', 'Prolific Winger', 'Roaming Flank', 'Cross Specialist',
    'Creative Playmaker', 'Hole Player', 'Box-to-Box', 'Orchestrator',
    'Anchor Man', 'Classic No. 10', 'Build Up', 'The Destroyer',
    'Extra Frontman', 'Attacking Full-back', 'Defensive Full-back',
    'Full-back Finisher', 'Offensive Goalkeeper', 'Defensive Goalkeeper'
];

export const TOP_LEAGUES = [
    'Premier League', 'La Liga', 'Serie A', 'Bundesliga', 'Ligue 1',
    'Eredivisie', 'Liga Portugal', 'Saudi Pro League', 'MLS', 'Brasileirão'
];

export const STAT_OPTIONS = [
    { id: 'matches', label: 'Matches', short: 'M' },
    { id: 'goals', label: 'Goals', short: 'G' },
    { id: 'assists', label: 'Assists', short: 'A' },
    { id: 'totalGA', label: 'G+A', short: 'GA' },
    { id: 'rank_goals', label: 'Goal Rank', short: 'G#' },
    { id: 'rank_assists', label: 'Assist Rank', short: 'A#' },
    { id: 'rank_matches', label: 'Matches Rank', short: 'M#' },
    { id: 'rank_ga', label: 'G+A Rank', short: 'GA#' },
    { id: 'rank_gpg', label: 'Goal/Game Rank', short: 'GPG#' },
    { id: 'rank_apg', label: 'Assist/Game Rank', short: 'APG#' },
    { id: 'rank_gapg', label: 'G+A/Game Rank', short: 'GAPG#' }
];

export const POSITIONS = [
    'GK', 'CB', 'LB', 'RB', 'DMF', 'CMF', 'AMF', 'LMF', 'RMF', 'LWF', 'RWF', 'SS', 'CF'
];

export const CARD_TYPES = [
    'Normal', 'POTW', 'Featured', 'Legendary', 'Epic', 'Big Time', 'Show Time', 'Highlights', 'Trendstars'
];

export const SPECIAL_SKILLS = [
    "Blitz Curler", "Long-Reach Tackle", "Acceleration Burst", "Phenomenal Pass", "Momentum Dribbling",
    "Phenomenal Finishing", "Magnetic Feet", "Attack Trigger", "Aerial Fort", "Edged Crossing",
    "Low Screamer", "Bullet Header", "Visionary Pass", "Willpower", "Fortress",
    "Game-Changing Pass", "GK Directing Defense", "GK Spirit Roar"
];

export const PLAYER_SKILLS = [
    "Acrobatic Finishing", "Chip Shot Control", "Dipping Shot", "First-time Shot", "Heading", "Knuckle Shot", "Long-Range Curler", "Long-Range Shooting", "Rising Shot", "Outside Curler",
    "Heel Trick", "Low Lofted Pass", "No Look Pass", "One-touch Pass", "Pinpoint Crossing", "Through Passing", "Weighted Pass",
    "Chop Turn", "Cut Behind & Turn", "Double Touch", "Flip Flap", "Gamesmanship", "Marseille Turn", "Rabona", "Scissors Feint", "Scotch Move", "Sole Control", "Sombrero",
    "Aerial Superiority", "Acrobatic Clear", "Blocker", "Interception", "Man Marking", "Sliding Tackle",
    "GK High Punt", "GK Long Throw", "GK Low Punt", "GK Penalty Saver",
    "Captaincy", "Fighting Spirit", "Penalty Specialist", "Super-sub", "Track Back"
];

export const ALL_SKILLS = [...SPECIAL_SKILLS, ...PLAYER_SKILLS];
