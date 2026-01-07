
// -------------------------------
// KPI Pair Synergy 🤝 - BEGIN
// -------------------------------
    function computePairPlayerList(model) {
      return [...model.playerList].sort((a, b) =>
        a.player_name.localeCompare(b.player_name)
      );
    }

    function computePairSynergyData(model, minPair, playerId) {
      return model.pairList
        .filter(x => x.games >= minPair)
        .filter(x => pairMatchesPlayer(x.a_id, x.b_id, playerId));
    }

    function renderPairPlayerDropdown(model) {
      const sel = document.getElementById("pairPlayer");
      if (!sel) return;

      const prev = sel.value;
      const sorted = computePairPlayerList(model);

      sel.innerHTML =
        '<option value="">All players</option>' +
        sorted.map(p => `<option value="${p.player_id}">${p.player_name}</option>`).join("");

      // keep previous selection if still valid
      if (prev && sorted.some(p => p.player_id === prev)) {
        sel.value = prev;
      } else {
        sel.value = "";
      }
    }

    function renderPairSynergyHeader(table) {
      table.innerHTML = `
        <thead><tr>
          <th data-key="a_name">Player A</th>
          <th data-key="b_name">Player B</th>
          <th data-key="games">GP</th>
          <th data-key="winRate">Win%</th>
          <th data-key="expected">Exp.</th>
          <th data-key="synergy">Synergy</th>
          <th data-key="w">W</th>
          <th data-key="l">L</th>
          <th>Scoring Duo</th>
        </tr></thead>
        <tbody></tbody>
      `;
    }

    function renderPairSynergyRows(tbody, rows, minPair) {
      if (rows.length === 0) {
        tbody.innerHTML = `
          <tr><td colspan="9" class="small">
            No pairs match this filter (min games: ${minPair}).
          </td></tr>`;
        return;
      }

      tbody.innerHTML = rows
        .map(r => {
          const synCls = clsSign(r.synergy);
          return `
            <tr>
              <td>${r.a_name}</td>
              <td>${r.b_name}</td>
              <td>${r.games}</td>
              <td><span class="badge ${clsSign(r.winRate - 0.5)}">${pct0(r.winRate)}</span></td>
              <td>${pct0(r.expected)}</td>
              <td><span class="${synCls}">${signedPP(r.synergy)}</span></td>
              <td>${r.w}</td>
              <td>${r.l}</td>
              <td>${r.eventSynergy}</td>
            </tr>
          `;
        })
        .join("");
    }

    function renderPairSynergyTable(model) {
      // Dropdown
      renderPairPlayerDropdown(model);

      const minPair = Number(document.getElementById("minPairGames")?.value || "5");
      const playerId = document.getElementById("pairPlayer")?.value || "";

      const data = computePairSynergyData(model, minPair, playerId);

      const table = document.getElementById("tblPairs");
      if (!table) return;

      renderPairSynergyHeader(table);

      const tbody = table.querySelector("tbody");

      function draw(sortKey = "synergy", sortDir = -1) {
        const rows = [...data].sort((a, b) => {
          const va = a[sortKey];
          const vb = b[sortKey];
          if (typeof va === "string") return sortDir * va.localeCompare(vb);
          return sortDir * ((va ?? 0) - (vb ?? 0));
        });

        renderPairSynergyRows(tbody, rows, minPair);
      }

      makeSortable(table, draw);
      draw("synergy", -1);
    }
    
    function buildEventSynergy(eventRows, matchIdSet){
      const synergy = new Map();

      for (const e of eventRows || []) {
        if (!matchIdSet.has(String(e.match_id).trim())) continue;

        const players = new Set();
        if (e.goal_player_id) players.add(normPid(e.goal_player_id));
        if (e.assist_player_id) players.add(normPid(e.assist_player_id));
        if (e.second_assist_player_id) players.add(normPid(e.second_assist_player_id));

        const list = Array.from(players);
        if (list.length < 2) continue;

        for (let i = 0; i < list.length; i++) {
          for (let j = i + 1; j < list.length; j++) {
            const a = list[i];
            const b = list[j];
            const key = a < b ? `${a}||${b}` : `${b}||${a}`;
            synergy.set(key, (synergy.get(key) || 0) + 1);
          }
        }
      }

      return synergy;
    }

    
    function pairMatchesPlayer(aId, bId, playerId){
      if(!playerId) return true;
      return aId === playerId || bId === playerId;
    }


// -------------------------------
// KPI Pair Synergy 🤝 - END
// -------------------------------
