
// -------------------------------
//  KPIs Section - BEGIN- this function loads all cards in the kpi section (TOP ROW)
// -------------------------------
    // -------------------------------
    // KPI: Sundays Count
    // -------------------------------
    function computeSundays(model) {
      return model.matchSummaries.length;
    }

    function renderSundays(model) {
      const sundays = computeSundays(model);
      setElText("kpiSundays", String(sundays));
    }

    // -------------------------------
    // KPI: Average Goals (excluding 1–0 and 1–1)
    // -------------------------------
    function computeTrackedMatches(model) {
      return model.matchSummaries.filter(m => {
        const g = m.totalGoals;
        return !(g === 1 || g === 2);
      });
    }

    function computeAvgGoals(model) {
      const tracked = computeTrackedMatches(model);
      if (!tracked.length) return 0;
      const total = tracked.reduce((acc, m) => acc + m.totalGoals, 0);
      return total / tracked.length;
    }

    function renderAvgGoals(model) {
      const avg = computeAvgGoals(model);
      setElText("kpiAvgGoals", fmt(avg, 2));
    }

    // -------------------------------
    // KPI: Draw Rate
    // -------------------------------
    function computeDrawRate(model) {
      return model.base.teamGames
        ? model.base.draws / model.base.teamGames
        : 0;
    }

    function renderDrawRate(model) {
      const rate = computeDrawRate(model);
      setElText("kpiDrawRate", pct0(rate));
    }

    // -------------------------------
    // KPI: Close Games Rate
    // -------------------------------
    function computeCloseRate(model) {
      const sundays = computeSundays(model);
      if (!sundays) return 0;
      const closeGames = model.matchSummaries.filter(m => m.close).length;
      return closeGames / sundays;
    }

    function renderCloseRate(model) {
      const rate = computeCloseRate(model);
      setElText("kpiClose", pct0(rate));
    }

    // -------------------------------
    // KPI: Best Streak
    // -------------------------------
    function computeBestStreak(model) {
      const list = model.playerList || [];
      const best = list.reduce((m, p) => Math.max(m, p.bestStreak || 0), 0);
      const winners = list.filter(p => (p.bestStreak || 0) === best && best > 0);

      // Find most recent streak end date
      let bestEndDate = null;
      let bestEndKey = -Infinity;

      for (const p of winners) {
        const d = p.bestStreakEndDate;
        const k = dateKey(d);
        if (d && k > bestEndKey) {
          bestEndKey = k;
          bestEndDate = d;
        }
      }

      return { best, winners, bestEndDate };
    }

    function renderBestStreak(model) {
      const { best, winners, bestEndDate } = computeBestStreak(model);

      const kpiEl = document.getElementById("kpiBestStreak");
      const detEl = document.getElementById("kpiBestStreakDetail");
      if (!kpiEl || !detEl) return;

      if (best === 0 || winners.length === 0) {
        kpiEl.textContent = "—";
        detEl.textContent = "No win streaks yet";
        return;
      }

      const names = winners.map(p => p.player_name).join(", ");
      kpiEl.textContent = `${names}: ${best} Win(s)`;
      detEl.textContent = bestEndDate ? `Last achieved: ${bestEndDate}` : "";
    }

    // -------------------------------
    // KPI: Top Scorers
    // -------------------------------
    function computeTopScorers(model) {
      const players = (model.playerList || [])
        .filter(p => (p.evGoals || 0) > 0)
        .sort((a, b) => b.evGoals - a.evGoals);

      return players.slice(0, 3); // top 3
    }

    function renderTopScorers(model) {
      const ul = document.getElementById("kpiTopScorers");
      const det = document.getElementById("kpiTopScorersDetail");
      if (!ul || !det) return;

      const top3 = computeTopScorers(model);

      if (!top3.length) {
        ul.innerHTML = `<li class="rank-2">— No goals in this filter</li>`;
        det.textContent = "";
        return;
      }

      const medals = ["🥇", "🥈", "🥉"];

      ul.innerHTML = top3.map((p, i) => `
        <li class="rank-${i+1}">
          <span class="medal">${medals[i]}</span>
          <span>${p.player_name}</span>
          <span>(${p.evGoals})</span>
        </li>
      `).join("");

      det.textContent = "";
    }

    // -------------------------------
    // KPI: Top Assist
    // -------------------------------
    function computeTopAssist(model) {
      const players = (model.playerList || [])
        .filter(p => (p.evAssists || 0) > 0)
        .sort((a, b) => b.evAssists - a.evAssists);

      return players[0] || null; // top 1
    }

    function renderTopAssist(model) {
      const el = document.getElementById("kpiTopAssist");
      const det = document.getElementById("kpiTopAssistDetail");
      if (!el || !det) return;

      const top = computeTopAssist(model);

      det.textContent = "";
      if (!top) {
        el.textContent = "—";
        det.textContent = "No assists in this filter";
        return;
      }

      el.textContent = `${top.player_name} (${top.evAssists})`;
      det.textContent = "";
    }

    // -------------------------------
    // KPI: Captain KPI
    // -------------------------------
    function computeCaptainKPI(model) {
      const list = (model?.captainList || [])
        .filter(c => c.games >= MIN_CAPTAIN_GAMES);

      if (list.length === 0) {
        return {
          empty: true,
          message: `No captains with ≥ ${MIN_CAPTAIN_GAMES} games`,
          rows: []
        };
      }

      // Sort captains by win rate, then games played, then name
      const rows = [...list].sort((a, b) => {
        const wrA = a.games ? a.w / a.games : 0;
        const wrB = b.games ? b.w / b.games : 0;

        if (wrB !== wrA) return wrB - wrA;               // highest win% first
        if (b.games !== a.games) return b.games - a.games; // more games first
        return a.player_name.localeCompare(b.player_name);
      });

      return {
        empty: false,
        rows
      };
    }

    function renderCaptainKPI(model) {
      const listEl = document.getElementById("kpiCaptainList");
      const emptyEl = document.getElementById("kpiCaptainEmpty");
      if (!listEl || !emptyEl) return;

      const { empty, message, rows } = computeCaptainKPI(model);

      if (empty) {
        emptyEl.textContent = message;
        listEl.innerHTML = "";
        return;
      }

      emptyEl.textContent = "";

      listEl.innerHTML = rows.map(r => {
        const wr = r.games ? (r.w / r.games) : 0;
        const wrCls = clsSign(wr - 0.5);

        return `
          <div class="row" style="justify-content:space-between; gap:8px;">
            <span style="font-weight:700; font-size:13px;">${r.player_name}</span>
            <span class="mono" title="Captain record (W-D-L) and win% within the selected filter.">
              <span class="badge ${wrCls}">${r.w}-${r.d}-${r.l}</span>
              <span class="small" style="margin-left:6px;">${pct0(wr)}</span>
            </span>
          </div>
        `;
      }).join("");
    }

    function renderKPIsSection(model) {
      renderSundays(model);
      renderAvgGoals(model);
      renderDrawRate(model);
      renderCloseRate(model);
      renderCaptainKPI(model);
      renderTopScorers(model);
      renderTopAssist(model);
      renderBestStreak(model);

    }
// -------------------------------
//  KPIs Section - END- this function loads all cards in the kpi section (TOP ROW)
// -------------------------------