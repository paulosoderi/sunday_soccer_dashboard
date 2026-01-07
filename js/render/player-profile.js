
// -------------------------------
// KPI Player  Profile Card 🎯- BEGIN
// -------------------------------
    
    function computeSessionsByPlayer(allPlayerRows){
      const m=new Map();
      for(const r of allPlayerRows){
        const pid=normPid( String(r.player_id??"").trim());
        if(!pid) continue;
        const sid=String(r.session_id).trim();
        if(!m.has(pid)) m.set(pid,new Set());
        m.get(pid).add(sid);
      }
      const out=new Map();
      for(const [pid,set] of m.entries()) out.set(pid,set.size);
      return out;
    }

    function computePlayerList(model) {
      return [...model.playerList].sort((a, b) =>
        a.player_name.localeCompare(b.player_name)
      );
    }

    function renderPlayerSelect(model) {
      const sel = document.getElementById("playerSelect");
      if (!sel) return;

      const sorted = computePlayerList(model);

      sel.innerHTML = sorted
        .map(p => `<option value="${p.player_id}">${p.player_name}</option>`)
        .join("");

      sel.onchange = () => {
        const pid = sel.value;
        PROFILE_PAGE_BY_PLAYER.delete(pid);
        renderPlayerProfile(model, pid);
      };

      // Auto-load first player
      if (sorted[0]) {
        PROFILE_PAGE_BY_PLAYER.delete(sorted[0].player_id);
        renderPlayerProfile(model, sorted[0].player_id);
      }
    }

    function computePlayerProfile(model, playerId) {
      const p = model.playerList.find(x => x.player_id === playerId);
      if (!p) return null;

      const page = PROFILE_PAGE_BY_PLAYER.get(playerId) || 0;

      const total = p.timeline.length;
      const totalPages = Math.max(1, Math.ceil(total / PROFILE_PAGE_SIZE));

      const safePage = Math.min(Math.max(page, 0), totalPages - 1);
      PROFILE_PAGE_BY_PLAYER.set(playerId, safePage);

      const start = safePage * PROFILE_PAGE_SIZE;
      const end = Math.min(total, start + PROFILE_PAGE_SIZE);
      const slice = p.timeline.slice(start, end);

      return {
        p,
        page: safePage,
        total,
        totalPages,
        start,
        end,
        slice
      };
    }

    function renderPlayerHeader(p, model) {
      setText("pWDL", `${p.w}-${p.d}-${p.l}`);
      setText("pWR", `${emojiSign(p.winRate - 0.5)} ${pct0(p.winRate)}`);
      setText("pSessions", String(p.sessionsPlayedAll || 0));
    }

    function renderPlayerStreaks(p) {
      const row = document.getElementById("pStreakRow");
      if (!row) return;

      const items = [];
      if (p.currentStreak > 0)
        items.push(`<span class="badge pos">🔥 Current W: ${p.currentStreak}</span>`);
      if (p.bestStreak > 0)
        items.push(`<span class="badge pos">🏆 Best W: ${p.bestStreak}</span>`);
      if (p.currentCold > 0)
        items.push(`<span class="badge neg">❄️ Current L: ${p.currentCold}</span>`);
      if (p.bestCold > 0)
        items.push(`<span class="badge neg">🧊 Worst L: ${p.bestCold}</span>`);

      row.innerHTML = items.length
        ? items.join("")
        : `<span class="small">No active streaks</span>`;
    }

    function renderPlayerImpact(p, model) {
      const elImp = document.getElementById("pImpact");
      if (elImp) elImp.className = clsSign(p.impact);

      setText("pImpact", `${emojiSign(p.impact)} ${signedPP(p.impact)}`);

      setText("pTeamGoals", `${p.totalGF} / ${p.totalGA}`);
      setText("pTeamGD", `${emojiSign(p.totalGD)} ${p.totalGD}`);

      setText(
        "pImpactNote",
        `Baseline win rate: ${pct0(model.baseWinRate)} • Player win rate: ${pct0(p.winRate)}`
      );

      const evGames = p.evGames || 0;

      setText("pEvGames", evGames ? String(evGames) : "0");

      setText("pEvGoals", String(p.evGoals || 0));
      setText("pEvGoalsPg", evGames && p.evGoals > 0 ? perGame(p.evGoals, evGames) : "—");

      setText("pEvAssists", String(p.evAssists || 0));
      setText("pEvAssistsPg", evGames && p.evAssists > 0 ? perGame(p.evAssists, evGames) : "—");

      setText("pEv2A", String(p.evSecondAssists || 0));
      setText("pEv2APg", evGames && p.evSecondAssists > 0 ? perGame(p.evSecondAssists, evGames) : "—");
    }

    function renderPlayerCaptainCard(p) {
      const card = document.getElementById("pCaptainCard");
      const row = document.getElementById("pCaptainRow");
      if (!card || !row) return;

      if (!p.captainGames) {
        card.style.display = "none";
        return;
      }

      card.style.display = "block";

      const wr = p.captainGames ? p.captainW / p.captainGames : 0;

      row.innerHTML = `
        <span class="badge">Games: ${p.captainGames}</span>
        <span class="badge pos">W: ${p.captainW}</span>
        <span class="badge neu">D: ${p.captainD}</span>
        <span class="badge neg">L: ${p.captainL}</span>
        <span class="badge ${clsSign(wr - 0.5)}">Win%: ${pct0(wr)}</span>
      `;
    }

    function renderPlayerTimeline(profile, model, playerId) {
      const { page, total, totalPages, start, end, slice } = profile;

      const controls = document.getElementById("pTimelineControls");
      if (controls) {
        if (total <= PROFILE_PAGE_SIZE) {
          controls.innerHTML = "";
        } else {
          controls.innerHTML = `
            <span class="small">#${start + 1}-${end}/${total}</span>
            <button class="btn" id="pPrev" ${page === 0 ? "disabled" : ""}>◀</button>
            <button class="btn" id="pNext" ${page === totalPages - 1 ? "disabled" : ""}>▶</button>
          `;

          const prev = document.getElementById("pPrev");
          const next = document.getElementById("pNext");

          if (prev)
            prev.onclick = () => {
              PROFILE_PAGE_BY_PLAYER.set(playerId, Math.max(0, page - 1));
              renderPlayerProfile(model, playerId);
            };

          if (next)
            next.onclick = () => {
              PROFILE_PAGE_BY_PLAYER.set(playerId, Math.min(totalPages - 1, page + 1));
              renderPlayerProfile(model, playerId);
            };
        }
      }

      const timelineEl = document.getElementById("pTimeline");
      if (timelineEl) {
        timelineEl.innerHTML =
          slice
            .map(t => {
              const cls =
                t.res === "W" ? "game-win" :
                t.res === "D" ? "game-draw" :
                t.res === "L" ? "game-loss" : "";

              return `<div>${t.match_date} | ${t.team} | <span class="${cls}">${t.res}</span> | ${t.gf}-${t.ga}</div>`;
            })
            .join("") || "—";
      }
    }

    function renderPlayerProfile(model, playerId) {
      const profile = computePlayerProfile(model, playerId);
      if (!profile) return;

      const { p } = profile;

      renderPlayerHeader(p, model);
      renderPlayerStreaks(p);
      renderPlayerImpact(p, model);
      renderPlayerCaptainCard(p);
      renderPlayerTimeline(profile, model, playerId);
      renderPlayerAchievementsCard();

      renderAchievements(p);
    }

    function renderPlayerAchievementsCard() {
      const mode = document.getElementById("viewMode")?.value || "all";
      const achCard = document.getElementById("playerAchievementsCard");

      if (achCard) {
        achCard.style.display = mode === "all" ? "" : "none";
        if (hasQueryFlag("mock")) achCard.style.display = "block";
      }
    }
// -------------------------------
// KPI Player Profile Card 🎯  - END
// -------------------------------
