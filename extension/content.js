// ─── eFootball Stats Tracker Content Script for PESDB ───
(function () {
    console.log('[eFootball Stats Tracker Extension v1.1.0] Active on PESDB.');

    const SPECIAL_SKILLS_SET = new Set([
        'Blitz Curler', 'Long-Reach Tackle', 'Acceleration Burst', 'Phenomenal Pass',
        'Momentum Dribbling', 'Phenomenal Finishing', 'Magnetic Feet', 'Attack Trigger',
        'Aerial Fort', 'Edged Crossing', 'Low Screamer', 'Bullet Header', 'Visionary Pass',
        'Willpower', 'Fortress', 'Game-Changing Pass', 'GK Directing Defense', 'GK Spirit Roar'
    ]);

    const WF_USAGE_MAP = { '1': 'Almost Never', '2': 'Rarely', '3': 'Occasionally', '4': 'Frequently' };
    const WF_ACC_MAP = { '1': 'Low', '2': 'Medium', '3': 'High', '4': 'Very High' };
    const INJURY_MAP = { '1': 'Low', '2': 'Medium', '3': 'High', 'A': 'Low', 'B': 'Medium', 'C': 'High' };
    const FORM_MAP = { '1': 'Inconsistent', '2': 'Standard', '3': 'Consistent', '4': 'Unwavering', 'A': 'Unwavering', 'B': 'Consistent', 'C': 'Standard', 'D': 'Inconsistent', 'E': 'Inconsistent' };

    function normalizePlaystyle(name) {
        if (!name || name === 'None' || name === '---') return 'Basic';
        return name.trim();
    }

    function formatFoot(foot) {
        if (!foot) return 'Right foot';
        const str = foot.toLowerCase();
        if (str.includes('left')) return 'Left foot';
        if (str.includes('right')) return 'Right foot';
        return foot;
    }

    // ─── 1. In-Page DOM Extractor ───
    function extractPlayerDataFromDOM() {
        const urlParams = new URLSearchParams(window.location.search);
        const pesdbId = urlParams.get('id') || (window.location.href.match(/id=(\d+)/) || [])[1] || String(Date.now());

        const nameHeader = document.querySelector('h1, .player_name, table.player_header th, table th h2');
        let name = nameHeader ? nameHeader.innerText.trim() : document.title.split('-')[0].trim();

        let image = '';
        const imgEl = document.querySelector('img[src*="/images/players/"], img[src*="card"], .player_image img, img[src*="efootball"]');
        if (imgEl) {
            image = imgEl.src.startsWith('http') ? imgEl.src : new URL(imgEl.src, window.location.origin).href;
        } else {
            image = `https://pesdb.net/efootball/images/players/${pesdbId}.png`;
        }

        let rating = 75;
        let position = 'CF';
        const posEl = document.querySelector('.player_position, .pos, td.pos, span.position');
        if (posEl) position = posEl.innerText.trim().toUpperCase();

        const ovrEl = document.querySelector('.overall_rating, .rating, td.rating');
        if (ovrEl) {
            const parsedOvr = parseInt(ovrEl.innerText.replace(/\D/g, ''), 10);
            if (!isNaN(parsedOvr) && parsedOvr > 40) rating = parsedOvr;
        }

        let age = 24;
        let height = '';
        let weight = '';
        let nationality = '';
        let club = '';
        let league = '';
        let strongFoot = 'Right foot';
        let offensivePlaystyle = 'Basic';
        let defensivePlaystyle = 'Basic';
        let weakFootUsage = 'Rarely';
        let weakFootAcc = 'High';
        let form = 'Standard';
        let injuryRes = 'Medium';
        let dateAdded = '';
        let featuredPack = '';
        let skills = [];
        let aiPlayingStyles = [];

        // Scan all table rows
        const rows = document.querySelectorAll('table tr');
        rows.forEach(tr => {
            const th = tr.querySelector('th');
            const td = tr.querySelector('td');
            const thText = th ? th.innerText.trim().toLowerCase().replace(/:$/, '').trim() : '';
            const tdText = td ? td.innerText.trim() : '';

            if (thText === 'player name' && tdText) name = tdText;
            if (thText === 'nationality' || thText === 'region') nationality = tdText;
            if (thText === 'team name' || thText === 'team' || thText === 'club') club = tdText;
            if (thText === 'league') league = tdText;
            if (thText === 'position' && tdText) position = tdText.toUpperCase();
            if (thText === 'overall rating') {
                const num = parseInt(tdText, 10);
                if (!isNaN(num)) rating = num;
            }
            if (thText === 'age') {
                const parsedAge = parseInt(tdText.replace(/\D/g, ''), 10);
                if (!isNaN(parsedAge) && parsedAge > 14 && parsedAge < 55) age = parsedAge;
            }
            if (thText === 'height') height = tdText;
            if (thText === 'weight') weight = tdText;
            if (thText === 'foot') strongFoot = formatFoot(tdText);
            if (thText === 'date added' || thText === 'release date') dateAdded = tdText;
            if (thText === 'featured players' || thText === 'featured' || thText === 'pack') featuredPack = tdText;

            if (thText === 'weak foot usage' || thText === 'weak foot use') {
                weakFootUsage = WF_USAGE_MAP[tdText] || tdText;
            }
            if (thText === 'weak foot accuracy' || thText === 'weak foot acc') {
                weakFootAcc = WF_ACC_MAP[tdText] || tdText;
            }
            if (thText === 'form' || thText === 'player form' || thText === 'condition') {
                form = FORM_MAP[tdText] || tdText;
            }
            if (thText === 'injury resistance' || thText === 'injury') {
                injuryRes = INJURY_MAP[tdText] || tdText;
            }
        });

        // Scan playing styles specifically
        const playStyleTables = document.querySelectorAll('table.playing_styles, table');
        playStyleTables.forEach(table => {
            const text = table.innerText;
            const attMatch = text.match(/Att:\s*([^\n\r\t]+)/i);
            if (attMatch && attMatch[1]) offensivePlaystyle = normalizePlaystyle(attMatch[1]);
            const defMatch = text.match(/Def:\s*([^\n\r\t]+)/i);
            if (defMatch && defMatch[1]) defensivePlaystyle = normalizePlaystyle(defMatch[1]);
        });

        // Scan Player Skills strictly (10 main player skills)
        const skillLinks = document.querySelectorAll('table.player_skills td, table.playing_styles tr');
        let isAiSection = false;
        skillLinks.forEach(el => {
            const txt = el.innerText.trim();
            if (!txt) return;
            if (txt.toLowerCase().includes('ai playing style')) {
                isAiSection = true;
                return;
            }
            if (txt.startsWith('Att:') || txt.startsWith('Def:') || txt.toLowerCase().includes('player skill')) return;

            if (isAiSection) {
                if (!aiPlayingStyles.includes(txt) && txt.length > 2) aiPlayingStyles.push(txt);
            } else if (el.closest('table.player_skills') || el.closest('table.playing_styles')) {
                // Split multi-line cells
                const lines = txt.split('\n').map(l => l.trim()).filter(Boolean);
                lines.forEach(line => {
                    if (!skills.includes(line) && line.length > 2 && !line.includes(':') && skills.length < 20) {
                        skills.push(line);
                    }
                });
            }
        });

        return {
            id: pesdbId,
            pesdb_id: pesdbId,
            name: name,
            image: image,
            position: position,
            rating: rating,
            age: age,
            height: height.replace(/cm/i, '').trim(),
            weight: weight.replace(/kg/i, '').trim(),
            nationality: nationality || 'Unknown',
            club: club || 'Free Agent',
            league: league || 'Unknown',
            strongFoot: strongFoot,
            offensivePlaystyle: offensivePlaystyle,
            defensivePlaystyle: defensivePlaystyle,
            playstyle: offensivePlaystyle !== 'Basic' ? offensivePlaystyle : defensivePlaystyle,
            'Weak Foot Usage': weakFootUsage,
            'Weak Foot Accuracy': weakFootAcc,
            'Form': form,
            'Injury Resistance': injuryRes,
            'Date Added': dateAdded,
            'Featured Players': featuredPack,
            skills: skills.slice(0, 10),
            aiPlayingStyles: aiPlayingStyles,
            source: 'Browser Extension PESDB'
        };
    }

    // ─── 2. Floating Action Button on Individual Player Page ───
    function initFloatingActionButton() {
        if (document.getElementById('ef-tracker-fab')) return;
        const isPlayerPage = window.location.href.includes('?id=') || document.querySelector('table.playing_styles');
        if (!isPlayerPage) return;

        const fab = document.createElement('button');
        fab.id = 'ef-tracker-fab';
        fab.innerHTML = '<span class="ef-icon">⚡</span><span>Add to Tracker</span>';

        fab.addEventListener('click', async () => {
            fab.classList.add('ef-loading');
            fab.innerHTML = '<span class="ef-icon">⏳</span><span>Saving...</span>';

            const localPlayer = extractPlayerDataFromDOM();

            try {
                // Send scrape request via Background Service Worker
                chrome.runtime.sendMessage({
                    action: 'SCRAPE_PLAYER',
                    url: window.location.href
                }, (response) => {
                    fab.classList.remove('ef-loading');
                    fab.classList.add('ef-success');
                    fab.innerHTML = '<span class="ef-icon">✓</span><span>Added!</span>';

                    const finalPlayer = (response && response.success && response.player) ? response.player : localPlayer;
                    showScrapeCompleteModal([finalPlayer]);

                    setTimeout(() => {
                        fab.classList.remove('ef-success');
                        fab.innerHTML = '<span class="ef-icon">⚡</span><span>Add to Tracker</span>';
                    }, 4000);
                });
            } catch (err) {
                console.error('[eFootball Extension] Error:', err);
                fab.classList.remove('ef-loading');
                showScrapeCompleteModal([localPlayer]);
            }
        });

        document.body.appendChild(fab);
    }

    // ─── 3. In-Table Add Buttons & "Add All" Top Bar for Lists ───
    function initTableFeatures() {
        const table = document.querySelector('table.players');
        if (!table) return;

        const rowLinks = Array.from(table.querySelectorAll('tbody tr, tr:not(:first-child)'))
            .map(tr => tr.querySelector('a[href*="?id="]'))
            .filter(Boolean);

        if (rowLinks.length === 0) return;

        // Top Bar: Add All Visible (N)
        if (!document.getElementById('ef-table-topbar')) {
            const topbar = document.createElement('div');
            topbar.id = 'ef-table-topbar';
            topbar.innerHTML = `
                <div class="ef-topbar-title">
                    <span>⚡</span>
                    <span>eFootball Tracker Importer</span>
                    <span class="ef-topbar-count">(${rowLinks.length} visible players)</span>
                </div>
                <button id="ef-btn-add-all-table" class="ef-btn-add-all">
                    ⚡ Add All (${rowLinks.length})
                </button>
            `;

            table.parentNode.insertBefore(topbar, table);

            document.getElementById('ef-btn-add-all-table').addEventListener('click', () => {
                const addAllBtn = document.getElementById('ef-btn-add-all-table');
                addAllBtn.innerText = '⏳ Importing all...';
                addAllBtn.disabled = true;

                const urls = rowLinks.map(a => a.href);
                chrome.runtime.sendMessage({
                    action: 'SCRAPE_MULTIPLE',
                    urls: urls
                }, (response) => {
                    addAllBtn.innerText = '✓ All Added!';
                    addAllBtn.disabled = false;
                    if (response && response.success && response.players) {
                        showScrapeCompleteModal(response.players);
                    } else {
                        alert(response?.error || 'Failed to import all players.');
                    }
                });
            });
        }

        // Header Column
        const headerRow = table.querySelector('thead tr, tr:first-child');
        if (headerRow && !headerRow.querySelector('.ef-header-col')) {
            const th = document.createElement('th');
            th.className = 'ef-header-col';
            th.innerText = '⚡ Tracker';
            th.style.color = '#00ff88';
            th.style.width = '70px';
            th.style.textAlign = 'center';
            headerRow.appendChild(th);
        }

        // Row Buttons
        const rows = table.querySelectorAll('tbody tr, tr:not(:first-child)');
        rows.forEach(row => {
            if (row.querySelector('.ef-table-add-btn')) return;
            const link = row.querySelector('a[href*="?id="]');
            if (!link) return;

            const td = document.createElement('td');
            td.style.textAlign = 'center';

            const btn = document.createElement('button');
            btn.className = 'ef-table-add-btn';
            btn.innerText = '+ Add';

            btn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                btn.innerText = '⏳...';

                chrome.runtime.sendMessage({
                    action: 'SCRAPE_PLAYER',
                    url: link.href
                }, (response) => {
                    if (response && response.success && response.player) {
                        btn.classList.add('added');
                        btn.innerText = '✓ Added';
                        showScrapeCompleteModal([response.player]);
                    } else {
                        btn.innerText = '⚠️ Retry';
                        alert('Scrape failed: ' + (response?.error || 'Unknown error'));
                    }
                });
            });

            td.appendChild(btn);
            row.appendChild(td);
        });
    }

    // ─── 4. Scrape Complete HUD Modal (Matches Website Screenshot 1:1) ───
    function showScrapeCompleteModal(players) {
        if (!players || !players.length) return;

        let overlay = document.getElementById('ef-hud-overlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'ef-hud-overlay';
            document.body.appendChild(overlay);
        }

        const totalSkills = players.reduce((s, p) => s + (p.skills?.length || 0), 0);
        const withHeight = players.filter(p => p.height).length;
        const withFoot = players.filter(p => p.strongFoot).length;
        const withForm = players.filter(p => p['Form']).length;
        const withDateAdded = players.filter(p => p['Date Added']).length;
        const withFeatured = players.filter(p => p['Featured Players']).length;
        const withPlaystyle = players.filter(p => p.playstyle && p.playstyle !== 'None' && p.playstyle !== 'Basic').length;

        // Render Player Rows HTML
        const playersHtml = players.map((p, idx) => {
            const skills = (p.skills || []).filter(Boolean);
            const skillsListHtml = skills.map(skill => {
                const isSpecial = SPECIAL_SKILLS_SET.has(skill);
                return `<span class="ef-skill-pill ${isSpecial ? 'special' : ''}">${isSpecial ? '🔥 ' : ''}${skill}</span>`;
            }).join('');

            return `
                <div class="ef-player-item" data-idx="${idx}">
                    <!-- Summary Row -->
                    <div class="ef-player-summary">
                        <span class="ef-player-idx">${idx + 1}</span>
                        <div class="ef-player-thumb-box">
                            <img src="${p.image || `https://pesdb.net/efootball/images/players/${p.id}.png`}" class="ef-player-thumb-img" alt="${p.name}" />
                        </div>
                        <div class="ef-player-name-block">
                            <div class="ef-player-name-txt">${p.name}</div>
                            <div class="ef-player-nat-txt">${p.nationality || ''}</div>
                        </div>
                        <span class="ef-pos-badge">${p.position || 'CF'}</span>
                        <span class="ef-ovr-txt">${p.rating || 75}</span>
                        <span class="ef-club-txt">${p.club_original || p.club || 'Free Agent'}</span>

                        <!-- Dual Playstyles -->
                        <div class="ef-playstyle-pill-box">
                            <div class="ef-style-row-compact">
                                <span class="ef-badge-att">▲</span>
                                <span class="ef-style-name-att">${p.offensivePlaystyle || 'BASIC'}</span>
                            </div>
                            <div class="ef-style-row-compact">
                                <span class="ef-badge-def">▼</span>
                                <span class="ef-style-name-def">${p.defensivePlaystyle || 'BASIC'}</span>
                            </div>
                        </div>

                        ${skills.length > 0 ? `<span class="ef-skills-cnt-pill">${skills.length} ⚡</span>` : ''}
                        <span class="ef-chevron">▼</span>
                    </div>

                    <!-- Expanded Detail Panel -->
                    <div class="ef-player-detail-panel" style="display: ${players.length === 1 ? 'flex' : 'none'};">
                        <div class="ef-stats-pills-wrap">
                            ${p.height ? `<div class="ef-stat-pill"><span class="ef-stat-lbl">HEIGHT</span><span class="ef-stat-val">${p.height}cm</span></div>` : ''}
                            ${p.weight ? `<div class="ef-stat-pill"><span class="ef-stat-lbl">WEIGHT</span><span class="ef-stat-val">${p.weight}kg</span></div>` : ''}
                            ${p.age ? `<div class="ef-stat-pill"><span class="ef-stat-lbl">AGE</span><span class="ef-stat-val">${p.age}</span></div>` : ''}
                            ${p.strongFoot ? `<div class="ef-stat-pill"><span class="ef-stat-lbl">FOOT</span><span class="ef-stat-val">${p.strongFoot}</span></div>` : ''}
                            ${p['Form'] ? `<div class="ef-stat-pill"><span class="ef-stat-lbl">FORM</span><span class="ef-stat-val">${p['Form']}</span></div>` : ''}
                            ${p['Injury Resistance'] ? `<div class="ef-stat-pill"><span class="ef-stat-lbl">INJURY</span><span class="ef-stat-val">${p['Injury Resistance']}</span></div>` : ''}
                            ${p['Weak Foot Usage'] ? `<div class="ef-stat-pill"><span class="ef-stat-lbl">WF USE</span><span class="ef-stat-val">${p['Weak Foot Usage']}</span></div>` : ''}
                            ${p['Weak Foot Accuracy'] ? `<div class="ef-stat-pill"><span class="ef-stat-lbl">WF ACC</span><span class="ef-stat-val">${p['Weak Foot Accuracy']}</span></div>` : ''}
                            ${p.league ? `<div class="ef-stat-pill"><span class="ef-stat-lbl">LEAGUE</span><span class="ef-stat-val">${p.league}</span></div>` : ''}
                            <div class="ef-stat-pill"><span class="ef-stat-lbl">ATT STYLE</span><span class="ef-stat-val accent">${p.offensivePlaystyle || 'Basic'}</span></div>
                            <div class="ef-stat-pill"><span class="ef-stat-lbl">DEF STYLE</span><span class="ef-stat-val accent">${p.defensivePlaystyle || 'Basic'}</span></div>
                        </div>

                        ${skills.length > 0 ? `
                            <div class="ef-skills-section">
                                <div class="ef-skills-sec-title">SKILLS (${skills.length})</div>
                                <div class="ef-skills-list-grid">${skillsListHtml}</div>
                            </div>
                        ` : ''}
                    </div>
                </div>
            `;
        }).join('');

        overlay.innerHTML = `
            <div id="ef-hud-card">
                <!-- Header -->
                <div class="ef-modal-header">
                    <div>
                        <div class="ef-modal-title">SCRAPE COMPLETE</div>
                        <div class="ef-modal-sub">
                            <strong>${players.length}</strong> players imported into the Global Database.
                        </div>
                    </div>
                    <button class="ef-modal-close" id="ef-modal-close-x">✕</button>
                </div>

                <!-- Coverage Chips -->
                <div class="ef-coverage-row">
                    <div class="ef-cov-chip"><span class="ef-cov-label">SKILLS</span><span class="ef-cov-val" style="color: #c084fc;">${totalSkills}</span></div>
                    <div class="ef-cov-chip"><span class="ef-cov-label">PLAYSTYLE</span><span class="ef-cov-val" style="color: #f472b6;">${withPlaystyle}</span></div>
                    <div class="ef-cov-chip"><span class="ef-cov-label">FEATURED</span><span class="ef-cov-val" style="color: #fbbf24;">${withFeatured}</span></div>
                    <div class="ef-cov-chip"><span class="ef-cov-label">HEIGHT</span><span class="ef-cov-val" style="color: #22d3ee;">${withHeight}</span></div>
                    <div class="ef-cov-chip"><span class="ef-cov-label">FOOT</span><span class="ef-cov-val" style="color: #60a5fa;">${withFoot}</span></div>
                    <div class="ef-cov-chip"><span class="ef-cov-label">FORM</span><span class="ef-cov-val" style="color: #facc15;">${withForm}</span></div>
                    <div class="ef-cov-chip"><span class="ef-cov-label">DATE ADDED</span><span class="ef-cov-val" style="color: #00ff88;">${withDateAdded}</span></div>
                </div>

                <!-- Controls Bar -->
                <div class="ef-controls-bar">
                    <span class="ef-controls-left">${players.length} PLAYERS · CLICK ▼ TO EXPAND</span>
                    <button class="ef-btn-expand-all" id="ef-btn-toggle-all">
                        ${players.length === 1 ? '▲ COLLAPSE ALL' : '▼ EXPAND ALL'}
                    </button>
                </div>

                <!-- Players Container -->
                <div class="ef-players-container">
                    ${playersHtml}
                </div>

                <!-- Footer -->
                <div class="ef-modal-footer">
                    <span class="ef-footer-status">COMMUNITY DATABASE UPDATED</span>
                    <div class="ef-footer-btn-group">
                        <button class="ef-btn-undo" id="ef-btn-undo-scrape">UNDO SCRAPE</button>
                        <button class="ef-btn-finish" id="ef-btn-finish-modal">FINISH</button>
                    </div>
                </div>
            </div>
        `;

        overlay.classList.add('ef-show');

        // Accordion Expand/Collapse for each row
        overlay.querySelectorAll('.ef-player-item').forEach(item => {
            const summary = item.querySelector('.ef-player-summary');
            const panel = item.querySelector('.ef-player-detail-panel');
            if (summary && panel) {
                summary.addEventListener('click', () => {
                    const isVisible = panel.style.display === 'flex';
                    panel.style.display = isVisible ? 'none' : 'flex';
                    item.classList.toggle('expanded', !isVisible);
                });
            }
        });

        // Toggle All Button
        let allExpanded = players.length === 1;
        const toggleAllBtn = document.getElementById('ef-btn-toggle-all');
        if (toggleAllBtn) {
            toggleAllBtn.addEventListener('click', () => {
                allExpanded = !allExpanded;
                toggleAllBtn.innerText = allExpanded ? '▲ COLLAPSE ALL' : '▼ EXPAND ALL';
                overlay.querySelectorAll('.ef-player-detail-panel').forEach(panel => {
                    panel.style.display = allExpanded ? 'flex' : 'none';
                });
                overlay.querySelectorAll('.ef-player-item').forEach(item => {
                    item.classList.toggle('expanded', allExpanded);
                });
            });
        }

        const closeModal = () => overlay.classList.remove('ef-show');
        document.getElementById('ef-modal-close-x').onclick = closeModal;
        document.getElementById('ef-btn-finish-modal').onclick = closeModal;

        // Undo Scrape Button
        const undoBtn = document.getElementById('ef-btn-undo-scrape');
        if (undoBtn) {
            undoBtn.onclick = () => {
                undoBtn.innerText = 'Undoing…';
                undoBtn.disabled = true;
                const playerIds = players.map(p => String(p.id));
                chrome.runtime.sendMessage({
                    action: 'DELETE_PLAYERS',
                    playerIds: playerIds
                }, () => {
                    alert(`Scrape undone. ${players.length} players removed from database.`);
                    closeModal();
                });
            };
        }
    }

    // Initialize scripts
    initFloatingActionButton();
    initTableFeatures();
})();
