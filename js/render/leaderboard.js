//Player Leaderboard 👑
// -------------------------------
function computeMinGames(model) {
  const minGamesEl = document.getElementById("minGames");
  const maxGamesInSelection = Math.max(
    0,
    ...(model.playerList || []).map(p => p.games || 0)
  );

  const defaultMinGames = Math.min(3, maxGamesInSelection);

  if (minGamesEl && !minGamesEl.dataset.userSet) {
    minGamesEl.value = String(defaultMinGames);
  }

  return Number(minGamesEl?.value ?? defaultMinGames);
}

function computeLeaderBoardData(model, minGames) {
  return (model.playerList || [])
    .filter(p => p.games >= minGames)
    .map(p => ({
      player_id: p.player_id,
      player_name: p.player_name,
      games: p.games,
      w: p.w,
      d: p.d,
      l: p.l,
      winRate: p.winRate,
      evGoals: p.evGoals || 0,
      evAssists: p.evAssists || 0,
      evSecondAssists: p.evSecondAssists || 0,
      goalsPro: p.totalGF,
      goalsAgainst: p.totalGA,
      goalDiff: p.totalGD,
      impact: p.impact,
      currentStreak: p.currentStreak,
      currentCold: p.currentCold
    }));
}

function renderLeaderBoardHeader(table) {
  table.innerHTML = `
    <thead><tr>
      <th data-key="player_name">Player</th>
      <th data-key="games">GP</th>
      <th data-key="w">W</th>
      <th data-key="d">D</th>
      <th data-key="l">L</th>
      <th data-key="winRate">Win%</th>

      <th data-key="evGoals">G</th>
      <th data-key="evAssists">A</th>
      <th data-key="evSecondAssists">2A</th>

      <th data-key="goalsPro">Goals Pro ⚽</th>
      <th data-key="goalsAgainst">Goals Against 🧤</th>
      <th data-key="goalDiff">Goal Diff</th>
      <th data-key="impact">Imp.</th>
      <th data-key="currentStreak">Streak</th>
    </tr></thead>
    <tbody></tbody>
  `;
}

function renderLeaderBoardRows(tbody, data, model) {
  tbody.innerHTML = data
    .map(r => {
      const gdCls = clsSign(r.goalDiff);
      const impCls = clsSign(r.impact);

      return `
        <tr data-player="${r.player_id}">
          <td>${r.player_name}</td>
          <td>${r.games}</td>
          <td>${r.w}</td>
          <td>${r.d}</td>
          <td>${r.l}</td>
          <td><span class="badge ${clsSign(r.winRate - 0.5)}">${pct0(r.winRate)}</span></td>

          <td>${r.evGoals}</td>
          <td>${r.evAssists}</td>
          <td>${r.evSecondAssists}</td>

          <td>${r.goalsPro}</td>
          <td>${r.goalsAgainst}</td>

          <td><span class="${gdCls}">${signedNum(r.goalDiff)}</span></td>
          <td><span class="${impCls}">${signedPP(r.impact)}</span></td>

          <td>${
            r.currentStreak > 0
              ? `<span class="badge pos">🔥${r.currentStreak}</span>`
              : r.currentCold > 0
              ? `<span class="badge neg">❄️${r.currentCold}</span>`
              : ""
          }</td>
        </tr>
      `;
    })
    .join("");

  // Row click handlers
  tbody.querySelectorAll("tr[data-player]").forEach(tr => {
    tr.addEventListener("click", () => {
      const pid = tr.getAttribute("data-player");
      const sel = document.getElementById("playerSelect");
      if (sel) sel.value = pid;

      PROFILE_PAGE_BY_PLAYER.delete(pid);
      renderPlayerProfile(model, pid);

      const profile = document.getElementById("playerProfileCard");
      if (profile) {
        profile.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    });
  });
}

function renderLeaderBoard(model) {
  const table = document.getElementById("tblPlayers");
  if (!table) return;

  const minGames = computeMinGames(model);
  const data = computeLeaderBoardData(model, minGames);

  renderLeaderBoardHeader(table);

  const tbody = table.querySelector("tbody");

  function draw(sortKey = "winRate", sortDir = -1) {
    data.sort((a, b) => {
      const va = a[sortKey];
      const vb = b[sortKey];
      if (typeof va === "string") return sortDir * va.localeCompare(vb);
      return sortDir * ((va ?? 0) - (vb ?? 0));
    });

    renderLeaderBoardRows(tbody, data, model);
  }

  makeSortable(table, draw);
  draw("winRate", -1);

  CURRENT_MODEL.playerNameIndex = buildPlayerIndex(CURRENT_MODEL.playerList);
}
// -------------------------------
// KPI  - END - Player Leaderboard 👑
// -------------------------------
