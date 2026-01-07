

// -------------------------------
//  🕒 Weekly Matches - BEGIN - this renders the matches table, orchestrates the call to indiviudal renders/computes
// -------------------------------
    function computeSortedMatches(model) {
      return [...model.matchSummaries].sort((a, b) =>
        a.match_date < b.match_date ? 1 : -1
      );
    }
    //compute pagination
    function computeMatchesPage(allMatches) {
      const total = allMatches.length;
      const totalPages = Math.max(1, Math.ceil(total / MATCHES_PAGE_SIZE));

      MATCHES_PAGE = Math.min(MATCHES_PAGE, totalPages - 1);
      MATCHES_PAGE = Math.max(MATCHES_PAGE, 0);

      const start = MATCHES_PAGE * MATCHES_PAGE_SIZE;
      const end = Math.min(total, start + MATCHES_PAGE_SIZE);

      return {
        total,
        totalPages,
        start,
        end,
        rows: allMatches.slice(start, end)
      };
    }
    //compute events to build the timeline
    function computeEventMatchSet() {
      if (!Array.isArray(RAW_EVENT_ROWS)) return new Set();
      return new Set(
        RAW_EVENT_ROWS
          .map(e => String(e.match_id ?? "").trim())
          .filter(Boolean)
      );
    }

    function getTopEventsForMatch(matchId) {
      if (!Array.isArray(RAW_EVENT_ROWS)) {
        return { scorer: "—", assist: "—" };
      }

      const goals = {};
      const assists = {};

      for (const e of RAW_EVENT_ROWS) {
        if (e.match_id !== matchId) continue;

        if (e.goal_player_id) {
          goals[e.goal_player_id] = (goals[e.goal_player_id] || 0) + 1;
        }
        if (e.assist_player_id) {
          assists[e.assist_player_id] = (assists[e.assist_player_id] || 0) + 1;
        }
      }

      const topGoal = Object.entries(goals).sort((a,b) => b[1]-a[1])[0];
      const topAssist = Object.entries(assists).sort((a,b) => b[1]-a[1])[0];

      const scorer = topGoal ? `${topGoal[0]} (${topGoal[1]})` : "—";
      const assist = topAssist ? `${topAssist[0]} (${topAssist[1]})` : "—";

      return { scorer, assist };
    }

    //pagination render
    function renderMatchesPager({ total, start, end, totalPages }, model) {
      const label = document.getElementById("matchesPagerLabel");
      const pager = document.getElementById("matchesPager");

      if (label) {
        label.textContent = total
          ? `Showing ${start + 1}-${end} of ${total}`
          : "No matches";
      }

      if (!pager) return;

      if (total <= MATCHES_PAGE_SIZE) {
        pager.innerHTML = "";
        return;
      }

      pager.innerHTML = `
        <button class="btn" id="mPrev" ${MATCHES_PAGE === 0 ? "disabled" : ""} title="Newer">◀</button>
        <button class="btn" id="mNext" ${MATCHES_PAGE === totalPages - 1 ? "disabled" : ""} title="Older">▶</button>
      `;

      const prev = document.getElementById("mPrev");
      const next = document.getElementById("mNext");

      if (prev) prev.onclick = () => {
        MATCHES_PAGE = Math.max(0, MATCHES_PAGE - 1);
        renderMatchesTable(model);
      };

      if (next) next.onclick = () => {
        MATCHES_PAGE = Math.min(totalPages - 1, MATCHES_PAGE + 1);
        renderMatchesTable(model);
      };
    }

    function renderMatchesTableBody(table, pageRows, eventMatchSet) {
      table.innerHTML = `
        <thead>
          <tr>
            <th>Date</th>
            <th>⬛B.</th>
            <th>⬜W.</th>
            <th>Top Scorer</th>
            <th>Top Assist</th>
            <th>GD</th>
          </tr>
        </thead>
        <tbody>
          ${pageRows.map(m => {
            const { scorer, assist } = getTopEventsForMatch(String(m.match_id));

            const blackCls =
              m.black_gf > m.white_gf ? "cell-win" :
              m.black_gf < m.white_gf ? "cell-loss" :
              "cell-draw";

            const whiteCls =
              m.white_gf > m.black_gf ? "cell-win" :
              m.white_gf < m.black_gf ? "cell-loss" :
              "cell-draw";

            const hasEvents = eventMatchSet.has(String(m.match_id));

            return `
              <tr class="${hasEvents ? "match-has-events" : ""}" data-match="${String(m.match_id)}">
                <td>${hasEvents ? "ℹ️" : ""}${m.match_date}</td>
                <td class="${blackCls}">${m.black_gf}</td>
                <td class="${whiteCls}">${m.white_gf}</td>
                <td>${scorer}</td>
                <td>${assist}</td>
                <td>${m.gd_black}</td>
              </tr>
            `;
          }).join("")}
        </tbody>
      `;
    }

    function attachMatchRowHandlers(table, model) {
      table.querySelectorAll("tr.match-has-events").forEach(tr => {
        tr.style.cursor = "pointer";
        tr.addEventListener("click", () => {
          const matchId = tr.dataset.match;
          openMatchModal(matchId, model);
        });
      });
    }

    function computeSortedMatchesForGD(model) {
      return [...model.matchSummaries].sort((a, b) =>
        a.match_date.localeCompare(b.match_date)
      );
    }

    function computeGDChartData(model) {
      const matches = computeSortedMatchesForGD(model);

      return {
        labels: matches.map(m => m.match_date.slice(5)),   // MM-DD
        values: matches.map(m => m.gd_black)               // goal diff
      };
    }

    function renderGDChart(model) {
      const canvas = document.getElementById("chartGD");
      if (!canvas) return;

      const { labels, values } = computeGDChartData(model);

      drawBarChart(canvas, labels, values);
    }

    function renderMatchesTable(model) {
      const table = document.getElementById("tblMatches");
      if (!table) return;

      const allMatches = computeSortedMatches(model);
      const pageInfo = computeMatchesPage(allMatches);
      const eventMatchSet = computeEventMatchSet();

      renderMatchesPager(pageInfo, model);
      renderMatchesTableBody(table, pageInfo.rows, eventMatchSet);
      attachMatchRowHandlers(table, model);
      //goas diferential chart (weekly scores)
      renderGDChart(model);
    }
// -------------------------------
//  🕒 Weekly Matches - END
// -------------------------------


// -------------------------------
// KPI Timeline Events Modal - BEGIN
// -------------------------------
    function computeMatchEvents(matchId) {
      const events = Array.isArray(RAW_EVENT_ROWS) ? RAW_EVENT_ROWS : [];
      return events
        .filter(e => String(e.match_id ?? "").trim() === String(matchId));
    }

    function computeTimelineOffsets(events) {
      const mins = events
        .map(parseEventTimeToMinutes)
        .filter(v => typeof v === "number");

      const minT = mins.length ? Math.min(...mins) : null;
      const startMin = minT != null ? Math.floor(minT / 60) * 60 : 0;
      const duration = 120; // 2 hours

      const enriched = events.map(e => {
        const t = parseEventTimeToMinutes(e);
        const offset = t == null ? null : (t - startMin);
        return { e, t, offset };
      });

      enriched.sort((a, b) =>
        (a.offset ?? 999999) - (b.offset ?? 999999)
      );

      return { enriched, startMin, duration };
    }

    function computeTimelinePositions(enriched, wrapHeight, duration) {
      const EVENT_GAP = 18;
      let lastY = -Infinity;

      return enriched.map(({ e, offset }) => {
        const off = typeof offset === "number"
          ? Math.max(0, Math.min(duration, offset))
          : 0;

        const pct = off / duration;
        let y = pct * wrapHeight;

        if (y < lastY + EVENT_GAP) {
          y = lastY + EVENT_GAP;
        }

        lastY = y;

        return { e, offset, y };
      });
    }

    function renderTimelineEvent(host, e, offset, y) {
      const teamRaw = String(e.Team ?? e.team ?? "").trim().toLowerCase();
      const side = teamRaw === "black" ? "left" :
                  teamRaw === "white" ? "right" : "left";

      const goal = String(e.goal_player_id ?? "").trim();
      const asst = String(e.assist_player_id ?? "").trim();

      const parts = [];
      if (goal) parts.push(`${goal} ⚽`);
      if (asst) parts.push(`${asst} 👟`);

      const minuteLabel =
        typeof offset === "number" && offset >= 0
          ? `${Math.floor(offset)}′ `
          : "";

      const label = minuteLabel + (parts.length ? parts.join(" · ") : "Event");

      const div = document.createElement("div");
      div.className = `tl-event ${side === "left" ? "tl-left" : "tl-right"}`;
      div.style.top = `${y}px`;
      div.textContent = label;

      host.appendChild(div);
    }

    function renderMatchTimeline(matchId) {
      const wrap = document.querySelector(".timeline-wrap");
      const host = document.getElementById("matchTimelineEvents");
      if (!wrap || !host) return;

      const events = computeMatchEvents(matchId);
      host.innerHTML = "";

      if (!events.length) {
        host.innerHTML = `
          <div class="small" style="padding:10px; opacity:.8;">
            No event data for this match.
          </div>`;
        return;
      }

      const { enriched, duration } = computeTimelineOffsets(events);
      const wrapH = wrap.clientHeight || 300;

      const positioned = computeTimelinePositions(enriched, wrapH, duration);

      positioned.forEach(({ e, offset, y }) =>
        renderTimelineEvent(host, e, offset, y)
      );
    }

// -------------------------------
// KPI Timeline Events Modal - END
// -------------------------------
