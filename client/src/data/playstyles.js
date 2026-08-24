export const OFFENSIVE_PLAYSTYLES = [
    'Goal Poacher',
    'Fox in the Box',
    'Target Man',
    'Dummy Runner',
    'Deep Lying Forward',
    'Hole Player',
    'Classic N.10',
    'Creative Playmaker',
    'Cross Specialist',
    'Roaming Flank',
    'Prolific Winger',
    'Orchestrator',
    'Anchor Man',
    'Box-to-Box',
    'Offensive Fullback',
    'Defensive Fullback',
    'Fullback Finisher',
    'Build Up',
    'Basic'
];

export const DEFENSIVE_PLAYSTYLES = [
    'Front Line Pressure',
    'Front Line Poacher',
    'Attack Outlet',
    'Pass Disruptor',
    'Box-to-Box',
    'All Action Defender',
    'Anchor Man',
    'Covering Role',
    'High Line Master',
    'The Destroyer',
    'Sweeper GK',
    'Offensive GK',
    'Defensive GK',
    'Basic'
];

export const PLAYSTYLE_DETAILS = {
    // ── Offensive Playing Styles ──────────────────────────────────────────────
    'Goal Poacher': {
        name: 'Goal Poacher',
        subtitle: 'Adv. Striker',
        type: 'offensive',
        category: 'Offensive Playing Style',
        description: 'Players will position themselves by the last defender and actively make runs toward the box. The ideal style for those looking to get the most out of the through-ball meta.',
        shortDesc: 'Positions by the last defender and actively makes runs toward the box.',
        icon: 'up',
        color: '#ff2a5f'
    },
    'Goal Poacher (Adv. Striker)': {
        name: 'Goal Poacher',
        subtitle: 'Adv. Striker',
        type: 'offensive',
        category: 'Offensive Playing Style',
        description: 'Players will position themselves by the last defender and actively make runs toward the box. The ideal style for those looking to get the most out of the through-ball meta.',
        shortDesc: 'Positions by the last defender and actively makes runs toward the box.',
        icon: 'up',
        color: '#ff2a5f'
    },
    'Fox in the Box': {
        name: 'Fox in the Box',
        type: 'offensive',
        category: 'Offensive Playing Style',
        description: 'Players will stay in the box and work as the classic number 9 by focusing on getting open and drawing defenders.',
        shortDesc: 'Classic number 9 staying inside the box, drawing defenders and getting open.',
        icon: 'up',
        color: '#ff2a5f'
    },
    'Target Man': {
        name: 'Target Man',
        type: 'offensive',
        category: 'Offensive Playing Style',
        description: 'Players will work as the main cog for your offense by drawing markers, holding the ball, and setting up runs while turned against the goal.',
        shortDesc: 'Holds up play, draws markers, and sets up attacking runs with back to goal.',
        icon: 'up',
        color: '#ff2a5f'
    },
    'Dummy Runner': {
        name: 'Dummy Runner',
        type: 'offensive',
        category: 'Offensive Playing Style',
        description: 'Players will stay mobile and perform adaptable runs based on the situation. Work as a middle-of-the-road option between a Poacher and Deep Lying Forward.',
        shortDesc: 'Mobile, adaptable decoy runs creating openings for teammates.',
        icon: 'up',
        color: '#ff2a5f'
    },
    'Deep Lying Forward': {
        name: 'Deep Lying Forward',
        type: 'offensive',
        category: 'Offensive Playing Style',
        description: 'Players will both start and finish plays while not staying locked in their positions.',
        shortDesc: 'Drops deep to link play and finishes moves across attacking areas.',
        icon: 'up',
        color: '#ff2a5f'
    },
    'Deep-lying Forward': {
        name: 'Deep Lying Forward',
        type: 'offensive',
        category: 'Offensive Playing Style',
        description: 'Players will both start and finish plays while not staying locked in their positions.',
        shortDesc: 'Drops deep to link play and finishes moves across attacking areas.',
        icon: 'up',
        color: '#ff2a5f'
    },
    'Hole Player': {
        name: 'Hole Player',
        type: 'offensive',
        category: 'Offensive Playing Style',
        description: 'Players will search for gaps in the opposing defense and stay open for key passes.',
        shortDesc: 'Finds space in defensive gaps and makes aggressive late runs.',
        icon: 'up',
        color: '#ff2a5f'
    },
    'Classic N.10': {
        name: 'Classic N.10',
        subtitle: 'Classic No. 10',
        type: 'offensive',
        category: 'Offensive Playing Style',
        description: 'Players will avoid making runs and instead prioritize orchestrating the offense.',
        shortDesc: 'Avoids excessive runs, focuses on orchestrating and dictating play.',
        icon: 'up',
        color: '#ff2a5f'
    },
    'Classic No. 10': {
        name: 'Classic N.10',
        subtitle: 'Classic No. 10',
        type: 'offensive',
        category: 'Offensive Playing Style',
        description: 'Players will avoid making runs and instead prioritize orchestrating the offense.',
        shortDesc: 'Avoids excessive runs, focuses on orchestrating and dictating play.',
        icon: 'up',
        color: '#ff2a5f'
    },
    'Creative Playmaker': {
        name: 'Creative Playmaker',
        type: 'offensive',
        category: 'Offensive Playing Style',
        description: 'Players will hunt for the ball on both sides of the pitch and focus on putting themselves in positions to receive.',
        shortDesc: 'Roams freely to receive possession and craft goalscoring opportunities.',
        icon: 'up',
        color: '#ff2a5f'
    },
    'Cross Specialist': {
        name: 'Cross Specialist',
        type: 'offensive',
        category: 'Offensive Playing Style',
        description: 'Players will actively position themselves on the edges to facilitate crosses.',
        shortDesc: 'Hugs the touchline to deliver pinpoint crosses into the penalty area.',
        icon: 'up',
        color: '#ff2a5f'
    },
    'Roaming Flank': {
        name: 'Roaming Flank',
        type: 'offensive',
        category: 'Offensive Playing Style',
        description: 'Players will cover the flanks but often cut to the inside during attacks.',
        shortDesc: 'Covers wide areas but frequently cuts inside toward goal during attacks.',
        icon: 'up',
        color: '#ff2a5f'
    },
    'Prolific Winger': {
        name: 'Prolific Winger',
        type: 'offensive',
        category: 'Offensive Playing Style',
        description: 'Players will stay wide and play like classic wingers.',
        shortDesc: 'Stays wide along the wing, taking on defenders and delivering service.',
        icon: 'up',
        color: '#ff2a5f'
    },
    'Orchestrator': {
        name: 'Orchestrator',
        type: 'offensive',
        category: 'Offensive Playing Style',
        description: 'Players will drop back to start the play or help you retain possession.',
        shortDesc: 'Deep-lying playmaker who distributes passes and controls tempo.',
        icon: 'up',
        color: '#ff2a5f'
    },
    'Offensive Fullback': {
        name: 'Offensive Fullback',
        subtitle: 'Attacking Full-back',
        type: 'offensive',
        category: 'Offensive Playing Style',
        description: 'Players will play an active role in attacking and often open themselves for runs from the flanks.',
        shortDesc: 'Surges forward to support attacks with overlapping wide runs.',
        icon: 'up',
        color: '#ff2a5f'
    },
    'Attacking Full-back': {
        name: 'Offensive Fullback',
        subtitle: 'Attacking Full-back',
        type: 'offensive',
        category: 'Offensive Playing Style',
        description: 'Players will play an active role in attacking and often open themselves for runs from the flanks.',
        shortDesc: 'Surges forward to support attacks with overlapping wide runs.',
        icon: 'up',
        color: '#ff2a5f'
    },
    'Defensive Fullback': {
        name: 'Defensive Fullback',
        subtitle: 'Defensive Full-back',
        type: 'offensive',
        category: 'Offensive Playing Style',
        description: 'Players will remain in the defensive end and avoid leaving their positions.',
        shortDesc: 'Stays back during attacks to maintain defensive stability.',
        icon: 'up',
        color: '#ff2a5f'
    },
    'Defensive Full-back': {
        name: 'Defensive Fullback',
        subtitle: 'Defensive Full-back',
        type: 'offensive',
        category: 'Offensive Playing Style',
        description: 'Players will remain in the defensive end and avoid leaving their positions.',
        shortDesc: 'Stays back during attacks to maintain defensive stability.',
        icon: 'up',
        color: '#ff2a5f'
    },
    'Fullback Finisher': {
        name: 'Fullback Finisher',
        subtitle: 'Full-back Finisher',
        type: 'offensive',
        category: 'Offensive Playing Style',
        description: 'Players won’t refrain from joining the buildup of attacks or getting into positions to score. Can leave you open often.',
        shortDesc: 'Inverts inside into central attacking zones and scoring positions.',
        icon: 'up',
        color: '#ff2a5f'
    },
    'Full-back Finisher': {
        name: 'Fullback Finisher',
        subtitle: 'Full-back Finisher',
        type: 'offensive',
        category: 'Offensive Playing Style',
        description: 'Players won’t refrain from joining the buildup of attacks or getting into positions to score. Can leave you open often.',
        shortDesc: 'Inverts inside into central attacking zones and scoring positions.',
        icon: 'up',
        color: '#ff2a5f'
    },
    'Build Up': {
        name: 'Build Up',
        type: 'offensive',
        category: 'Offensive Playing Style',
        description: 'Players will venture higher to support the midfield.',
        shortDesc: 'Steps forward from defense to initiate attacks and circulate possession.',
        icon: 'up',
        color: '#ff2a5f'
    },

    // ── Defensive Playing Styles ──────────────────────────────────────────────
    'Front Line Pressure': {
        name: 'Front Line Pressure',
        type: 'defensive',
        category: 'Defensive Playing Style',
        description: 'Players will actively pressure the opposing keeper and defenders to force errors.',
        shortDesc: 'Relentlessly presses opponent defenders and goalkeeper high up the pitch.',
        icon: 'down',
        color: '#00e5ff'
    },
    'Front Line Poacher': {
        name: 'Front Line Poacher',
        type: 'defensive',
        category: 'Defensive Playing Style',
        description: 'Players will close passing lanes up high to force interceptions.',
        shortDesc: 'Anticipates passing routes in high zones to force critical turnovers.',
        icon: 'down',
        color: '#00e5ff'
    },
    'Attack Outlet': {
        name: 'Attack Outlet',
        type: 'defensive',
        category: 'Defensive Playing Style',
        description: 'Players will stay high up the pitch and not track back as often to conserve energy for when it matters the most.',
        shortDesc: 'Conserves stamina by staying high upfield as an immediate counter-attack target.',
        icon: 'down',
        color: '#00e5ff'
    },
    'Pass Disruptor': {
        name: 'Pass Disruptor',
        type: 'defensive',
        category: 'Defensive Playing Style',
        description: 'Players will focus on closing passing lanes and aggressively go for interceptions.',
        shortDesc: 'Aggressively cuts passing channels and executes forward interceptions.',
        icon: 'down',
        color: '#00e5ff'
    },
    'All Action Defender': {
        name: 'All Action Defender',
        type: 'defensive',
        category: 'Defensive Playing Style',
        description: 'Like Kanté, players will stay active in defense by covering the whole field and tracking back more efficiently. The best style for CMFs.',
        shortDesc: 'High-workrate defensive motor covering the entire midfield.',
        icon: 'down',
        color: '#00e5ff'
    },
    'Covering Role': {
        name: 'Covering Role',
        type: 'defensive',
        category: 'Defensive Playing Style',
        description: 'Players will actively cover the spaces left by their teammates and challenge attackers. Ideal for those looking to secure themselves while pressuring.',
        shortDesc: 'Covers spaces vacated by advancing teammates and snuffs out counter-attacks.',
        icon: 'down',
        color: '#00e5ff'
    },
    'High Line Master': {
        name: 'High Line Master',
        type: 'defensive',
        category: 'Defensive Playing Style',
        description: 'Players will make an effort to hold their positions and preserve your team’s shape on defense.',
        shortDesc: 'Disciplined defender holding defensive lines and maintaining compact team structure.',
        icon: 'down',
        color: '#00e5ff'
    },
    'The Destroyer': {
        name: 'The Destroyer',
        type: 'defensive',
        category: 'Defensive Playing Style',
        description: 'Players will excel when pursuing and disarming attackers via physicality.',
        shortDesc: 'Uses physical dominance and assertive challenges to halt attacks.',
        icon: 'down',
        color: '#00e5ff'
    },
    'Sweeper GK': {
        name: 'Sweeper GK',
        type: 'defensive',
        category: 'Defensive Playing Style',
        description: 'Keepers will challenge players on the run by rushing and often position themselves up high.',
        shortDesc: 'Proactive goalkeeper positioned high to sweep through-balls and rush attackers.',
        icon: 'down',
        color: '#00e5ff'
    },
    'Offensive GK': {
        name: 'Offensive GK',
        subtitle: 'Offensive Goalkeeper',
        type: 'defensive',
        category: 'Defensive Playing Style',
        description: 'Your number one will often move up to help with the build-up.',
        shortDesc: 'Steps up into possession to assist team build-up play.',
        icon: 'down',
        color: '#00e5ff'
    },
    'Offensive Goalkeeper': {
        name: 'Offensive GK',
        subtitle: 'Offensive Goalkeeper',
        type: 'defensive',
        category: 'Defensive Playing Style',
        description: 'Your number one will often move up to help with the build-up.',
        shortDesc: 'Steps up into possession to assist team build-up play.',
        icon: 'down',
        color: '#00e5ff'
    },
    'Defensive GK': {
        name: 'Defensive GK',
        subtitle: 'Defensive Goalkeeper',
        type: 'defensive',
        category: 'Defensive Playing Style',
        description: 'Keepers will stay close to the goal line and prioritize positioning over aggression. Demands help from the backline to close out shots or stop deep runs.',
        shortDesc: 'Stays grounded on the goal line, prioritizing shot-stopping positioning.',
        icon: 'down',
        color: '#00e5ff'
    },
    'Defensive Goalkeeper': {
        name: 'Defensive GK',
        subtitle: 'Defensive Goalkeeper',
        type: 'defensive',
        category: 'Defensive Playing Style',
        description: 'Keepers will stay close to the goal line and prioritize positioning over aggression. Demands help from the backline to close out shots or stop deep runs.',
        shortDesc: 'Stays grounded on the goal line, prioritizing shot-stopping positioning.',
        icon: 'down',
        color: '#00e5ff'
    },

    // ── Dual Roles (Present in Both) ──────────────────────────────────────────
    'Anchor Man': {
        name: 'Anchor Man',
        type: 'both',
        category: 'Playing Style',
        description: 'Players will stay back during attacks and position themselves as your secondary line of defense from the center. Perfect for those looking to employ a solid defensive shield.',
        shortDesc: 'Disciplined defensive midfielder holding central shielding position.',
        icon: 'up',
        color: '#00e5ff'
    },
    'Box-to-Box': {
        name: 'Box-to-Box',
        type: 'both',
        category: 'Playing Style',
        description: 'True to the role, players will participate tirelessly in both attack and defense across the entire pitch.',
        shortDesc: 'Covers entire pitch, contributing dynamically to both attacking and defending phases.',
        icon: 'up',
        color: '#ffb300'
    },

    // ── Basic / None Fallback ────────────────────────────────────────────────
    'Basic': {
        name: 'Basic',
        type: 'neutral',
        category: 'Standard Playing Style',
        description: 'No specialized playing style. The player behaves according to their fundamental positioning, natural attributes, and team instructions.',
        shortDesc: 'Standard positioning and duties with no specialized AI behavior.',
        icon: 'neutral',
        color: '#94a3b8'
    },
    'None': {
        name: 'Basic',
        type: 'neutral',
        category: 'Standard Playing Style',
        description: 'No specialized playing style. The player behaves according to their fundamental positioning, natural attributes, and team instructions.',
        shortDesc: 'Standard positioning and duties with no specialized AI behavior.',
        icon: 'neutral',
        color: '#94a3b8'
    }
};

/**
 * Normalizes a playstyle name for lookup
 */
export const normalizePlaystyleName = (name) => {
    if (!name || name === 'None' || name === '---') return 'Basic';
    const str = String(name).trim();
    if (PLAYSTYLE_DETAILS[str]) return PLAYSTYLE_DETAILS[str].name;
    
    // Check case-insensitive
    const lower = str.toLowerCase();
    const foundKey = Object.keys(PLAYSTYLE_DETAILS).find(k => k.toLowerCase() === lower);
    if (foundKey) return PLAYSTYLE_DETAILS[foundKey].name;

    return str;
};

/**
 * Checks if a playstyle name belongs to offensive styles
 */
export const isOffensivePlaystyle = (name) => {
    if (!name || name === 'None' || name === 'Basic') return false;
    const normalized = normalizePlaystyleName(name);
    return OFFENSIVE_PLAYSTYLES.includes(normalized) || OFFENSIVE_PLAYSTYLES.includes(name);
};

/**
 * Checks if a playstyle name belongs to defensive styles
 */
export const isDefensivePlaystyle = (name) => {
    if (!name || name === 'None' || name === 'Basic') return false;
    const normalized = normalizePlaystyleName(name);
    return DEFENSIVE_PLAYSTYLES.includes(normalized) || DEFENSIVE_PLAYSTYLES.includes(name);
};

/**
 * Resolves the offensive playstyle for a player object
 */
export const getOffensivePlaystyle = (player) => {
    if (!player) return 'Basic';
    if (player.offensivePlaystyle && player.offensivePlaystyle !== 'None') {
        return normalizePlaystyleName(player.offensivePlaystyle);
    }
    if (player.attackPlaystyle && player.attackPlaystyle !== 'None') {
        return normalizePlaystyleName(player.attackPlaystyle);
    }
    // Check legacy playstyle field
    const legacy = player.playstyle || player.Playstyle;
    if (legacy && legacy !== 'None') {
        const norm = normalizePlaystyleName(legacy);
        // If it's explicitly offensive or dual, return it
        if (isOffensivePlaystyle(norm) || norm === 'Box-to-Box' || norm === 'Anchor Man') {
            return norm;
        }
    }
    return 'Basic';
};

/**
 * Resolves the defensive playstyle for a player object
 */
export const getDefensivePlaystyle = (player) => {
    if (!player) return 'Basic';
    if (player.defensivePlaystyle && player.defensivePlaystyle !== 'None') {
        return normalizePlaystyleName(player.defensivePlaystyle);
    }
    if (player.defensePlaystyle && player.defensePlaystyle !== 'None') {
        return normalizePlaystyleName(player.defensePlaystyle);
    }
    // Check legacy playstyle field
    const legacy = player.playstyle || player.Playstyle;
    if (legacy && legacy !== 'None') {
        const norm = normalizePlaystyleName(legacy);
        // If it's explicitly defensive, or if it's dual, return it
        if (isDefensivePlaystyle(norm)) {
            return norm;
        }
    }
    return 'Basic';
};

/**
 * Returns complete info for a playstyle with default fallback
 */
export const getPlaystyleInfo = (name, type = 'offensive') => {
    if (!name || name === 'None') name = 'Basic';
    const norm = normalizePlaystyleName(name);
    const detail = PLAYSTYLE_DETAILS[name] || PLAYSTYLE_DETAILS[norm];
    
    if (detail) {
        return {
            ...detail,
            resolvedType: detail.type === 'both' ? type : detail.type
        };
    }

    return {
        name: name,
        type: type,
        resolvedType: type,
        category: type === 'offensive' ? 'Offensive Playing Style' : 'Defensive Playing Style',
        description: `${name} playing style for player tactical instructions.`,
        shortDesc: `${name} playing style.`,
        icon: type === 'offensive' ? 'up' : 'down',
        color: type === 'offensive' ? '#ff2a5f' : '#00e5ff'
    };
};
