function refreshViewControls() {
  tempMode = applyQueryFiltersModeOnce();
  const mode = tempMode ?? document.getElementById("viewMode")?.value ?? "all";
  const modeDropdown = document.getElementById("viewMode");
  modeDropdown.value = mode;
  const sel = document.getElementById("viewValue");
  const label = document.getElementById("viewValueLabel");
  if (!sel || !label) return;

  if (mode === "all") {
    sel.innerHTML = "";
    sel.disabled = true;
    label.textContent = "Selection";
    applyFilterAndRender();
  }

  if (mode === "session") {
    label.textContent = "Session";
    sel.disabled = false;

    const recent = getMostRecentSession(RAW_MATCH_ROWS);
    sel.innerHTML = idx.sessionList
      .map(s => `<option value="${s}">${s}</option>`)
      .join("");

    // ✅ force default session selection
    sel.value = idx.sessionList.includes(recent)
      ? recent
      : idx.sessionList[idx.sessionList.length - 1];

  } else if (mode === "year") {
    label.textContent = "Year";
    sel.disabled = false;

    const recent = getMostRecentYear(RAW_MATCH_ROWS);
    sel.innerHTML = idx.yearList
      .map(y => `<option value="${y}">${y}</option>`)
      .join("");

    // ✅ force default year selection
    sel.value = idx.yearList.includes(recent)
      ? recent
      : idx.yearList[idx.yearList.length - 1];
  }
  //apply filtervalue once is a helper to load the query param on the first time the site is accessed.
  applyFilterValueOnce();

  //this renders all objects making sure every kpi/table is updated with the selected filter
  applyFilterAndRender();
}

function applyFilterAndRender() {
  if (!RAW_PLAYER_ROWS.length || !RAW_MATCH_ROWS.length) return;

  const mode = document.getElementById("viewMode")?.value || "all";
  const val = document.getElementById("viewValue")?.value || "";

  let fPlayers = RAW_PLAYER_ROWS;
  let fMatches = RAW_MATCH_ROWS;
  let tag = "All history";

  if (mode === "session") {
    fPlayers = RAW_PLAYER_ROWS.filter(r => String(r.session_id).trim() === val);
    fMatches = RAW_MATCH_ROWS.filter(r => String(r.session_id).trim() === val);
    tag = `Session: ${val}`;
  } else if (mode === "year") {
    fPlayers = RAW_PLAYER_ROWS.filter(r => yearOf(r.match_date) === val);
    fMatches = RAW_MATCH_ROWS.filter(r => yearOf(r.match_date) === val);
    tag = `Year: ${val}`;
  }

  const tagEl = document.getElementById("activeFilterTag");
  if (tagEl) {
    tagEl.textContent = `Filter: ${tag}`;
    tagEl.title = `Active filter: ${tag}`;
  }

  MATCHES_PAGE = 0;
  CURRENT_MODEL = buildModel(fPlayers, fMatches, ALLTIME_SESSIONS_BY_PLAYER);

  // Attach event-based stats (goals/assists/2nd assists) if events are loaded
  //const matchIdSet = new Set((CURRENT_MODEL.matchSummaries || []).map(m => m.match_id));
  const matchIdSet = new Set(
    (CURRENT_MODEL.matchSummaries || []).map(m => String(m.match_id).trim())
  );
  const eventAgg = buildEventAgg(RAW_EVENT_ROWS || [], matchIdSet);

  // Matches in the current filter that actually have event data
  const eventMatchIdSet = new Set(
    (RAW_EVENT_ROWS || [])
      .filter(e => matchIdSet.has(String(e.match_id).trim()))
      .map(e => e.match_id)
  );

  // Count event-games per player USING FILTERED DATA
  const eventGamesByPlayer = new Map();

  for (const p of CURRENT_MODEL.playerList || []) {
    const evGames = (p.timeline || []).filter(t =>
      eventMatchIdSet.has(String(t.match_id).trim())
    ).length;

    eventGamesByPlayer.set(p.player_id, evGames);
  }

  (CURRENT_MODEL.playerList || []).forEach(p => {
    const pid = normPid(p.player_id);
    const a = eventAgg.get(pid) || { goals: 0, assists: 0, secondAssists: 0 };

    p.evGoals = a.goals;
    p.evAssists = a.assists;
    p.evSecondAssists = a.secondAssists;
    p.evGames = eventGamesByPlayer.get(p.player_id) || 0;
  });
  renderAll(CURRENT_MODEL);
}

function getQueryParams() {
  const p = new URLSearchParams(window.location.search);
  return {
    player: p.get("player"),
    year: p.get("year"),
    session: p.get("session")
  };
}

function readQueryState() {
  if (QUERY_STATE) return QUERY_STATE;

  const p = new URLSearchParams(window.location.search);
  QUERY_STATE = {
    player: p.get("player"),
    year: p.get("year"),
    session: p.get("session")
  };
  return QUERY_STATE;
}

function applyFilterValueOnce() {
  if (QUERY_APPLIED) return;
  QUERY_APPLIED = true;

  const q = readQueryState();
  if (!q) return;

  // YEAR from query
  if (q.year && idx.yearList.includes(q.year)) {
    viewMode.value = "year";
    viewValue.value = q.year;
    return;
  }

  // SESSION from query
  if (q.session && idx.sessionList.includes(q.session)) {
    viewMode.value = "session";
    viewValue.value = q.session;
    return;
  }
}

function applyPlayerFilter() {
  const q = readQueryState();
  if (!q) return;
  playerSelect = document.getElementById("playerSelect");
  pairSel = document.getElementById("pairPlayer");

  // Player from query
  if (q.player && playerExists(q.player)) {
    playerSelect.value = q.player
    playerSelect.dispatchEvent(new Event("change", { bubbles: true }));

    pairSel.value = q.player;
    pairSel.dispatchEvent(new Event("change", { bubbles: true }));
    return;
  }
}

function applyQueryFiltersModeOnce() {
  if (QUERY_APPLIED) return;
  const q = readQueryState();
  if (!q) return;

  if (q.year) {
    return "year"
  } else if (q.session) {
    return "session"
  } else {
    return "all"
  }
}

function hasQueryFlag(name) {
  const v = new URLSearchParams(window.location.search).get(name);
  return v === "1" || v === "true" || v === "yes";
}


(function initTheme() {
  const root = document.documentElement;
  const saved = localStorage.getItem("soccer_theme");
  if (saved === "light" || saved === "dark") root.dataset.theme = saved;
  const label = document.getElementById("themeLabel");
  function syncLabel() { if (label) label.textContent = (root.dataset.theme === "light") ? "Light" : "Dark" }
  syncLabel();
  on("themeToggle", "click", () => {
    const next = (root.dataset.theme === "light") ? "dark" : "light";
    root.dataset.theme = next;
    localStorage.setItem("soccer_theme", next);
    syncLabel();
    if (CURRENT_MODEL) renderGDChart(CURRENT_MODEL);
  });
})();

(function toggleDataPanel() {
  const panel = document.getElementById("dataPanel");
  if (!panel) return;

  if (hasQueryFlag("mock")) {
    panel.style.display = "block";
  }

  const achievements = document.getElementById("playerAchievementsCard");
  if (!achievements) return;

  if (hasQueryFlag("mock")) {
    achievements.style.display = "block";
  }
})();


document.getElementById("achModalOverlay")?.addEventListener("click", e => {
  if (e.target.id === "achModalOverlay") closeAchievementModal();
});

document.getElementById("matchModalOverlay")?.addEventListener("click", e => {
  if (e.target.id === "matchModalOverlay") closeMatchModal();
});

document.addEventListener("keydown", e => {
  if (e.key === "Escape") closeMatchModal();
});

document.addEventListener("keydown", e => {
  if (e.key === "Escape") closeAchievementModal();
});

function openMatchModal(matchId, model) {
  const overlay = document.getElementById("matchModalOverlay");
  const titleEl = document.getElementById("matchModalTitle");
  const subEl = document.getElementById("matchModalSub");
  if (!overlay || !titleEl || !subEl) return;

  const m = (model?.matchSummaries || []).find(x => String(x.match_id) === String(matchId));

  titleEl.textContent = m ? `${m.match_date} · Black ${m.black_gf}–${m.white_gf} White` : `Match ${matchId}`;
  subEl.textContent = m ? `Session ${m.session_id || "—"} · Match ${m.match_id}` : "—";

  renderMatchTimeline(matchId);

  overlay.style.display = "flex";
}

function closeMatchModal() {
  const overlay = document.getElementById("matchModalOverlay");
  if (overlay) overlay.style.display = "none";
}


on("useMock", "click", loadFromMock);
on("loadFiles", "click", loadFromUploads);
on("minGames", "change", e => {
  e.target.dataset.userSet = "1";
  CURRENT_MODEL && renderPlayersTable(CURRENT_MODEL);
});
on("minPairGames", "change", () => CURRENT_MODEL && renderPairSynergyTable(CURRENT_MODEL));
on("pairPlayer", "change", () => CURRENT_MODEL && renderPairSynergyTable(CURRENT_MODEL));
on("viewMode", "change", refreshViewControls);
on("viewValue", "change", applyFilterAndRender);


function buildEventAgg(rows, matchIdSet) {
  const agg = new Map();

  for (const r of rows || []) {
    if (!matchIdSet.has(String(r.match_id).trim())) continue;

    // GOAL
    if (r.goal_player_id) {
      const pid = normPid(r.goal_player_id);
      const a = agg.get(normPid(pid)) || { goals: 0, assists: 0, secondAssists: 0 };
      a.goals++;
      agg.set(normPid(pid), a);
    }

    // ASSIST
    if (r.assist_player_id) {
      const pid = normPid(r.assist_player_id);
      const a = agg.get(normPid(pid)) || { goals: 0, assists: 0, secondAssists: 0 };
      a.assists++;
      agg.set(normPid(pid), a);
    }

    // SECOND ASSIST
    if (r.second_assist_player_id) {
      const pid = normPid(r.second_assist_player_id);
      const a = agg.get(normPid(pid)) || { goals: 0, assists: 0, secondAssists: 0 };
      a.secondAssists++;
      agg.set(normPid(pid), a);
    }
  }

  return agg;
}


function playerExists(name) {
  if (!name) return false;
  return CURRENT_MODEL?.playerNameIndex?.has(name) ?? false;
}

