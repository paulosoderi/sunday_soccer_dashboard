/*1-  BUILD THE MODEL - BEGIN
this is the DATA that populates everything. this builds up the players, the matches , andeverything
this is the object that gets modified/filtered when navigating to everything
**********************************************/

      /* There are some major functions on this building the model:
      Normalize match rows
      Fix missing goals (cross-fill Black/White)
      Build match index + match summaries
      Normalize player rows into “plays”
      Build player stats (W/D/L, GF/GA, streaks, captaincy)
      Build pair synergy (win-based)
      Build event synergy (from RAW_EVENT_ROWS)
      Assemble final model
      */ 
      function buildModel(playerRows, matchRows, allTimeSessionsByPlayer) {
        // 1. Normalize & fix match data
        const normalizedMatches = normalizeMatches(matchRows);
        const fixedMatches = fixMissingGoals(normalizedMatches);
        const { matchIdx, matchesById } = buildMatchIndex(fixedMatches);

        // 2. Build player-match "plays"
        const plays = modelBuildPlays(playerRows, matchIdx);

        // 3. Base team stats
        const base = computeBaseTeamStats(fixedMatches);
        const baseWinRate = computeBaseWinRate(base);

        // 4. Match summaries
        const matchSummaries = modelBuildMatchSummaries(matchesById);

        // 5. Player stats (W/D/L, streaks, impact, captaincy, sessions)
        const { playerList, captainById } = modelBuildPlayerStats(
          plays,
          baseWinRate,
          allTimeSessionsByPlayer
        );

        // 6. Pair synergy (win-based)
        const pairList = modelBuildPairSynergy(plays, playerList);

        // 7. Event synergy (from RAW_EVENT_ROWS)
        attachEventSynergy(pairList, RAW_EVENT_ROWS, matchSummaries);

        // 8. Captain list (for captain KPI)
        const captainList = modelBuildCaptainList(captainById);

        // 9. Final model
        return {
          matchSummaries,
          baseWinRate,
          base,
          playerList,
          pairList,
          captainList
        };
      }


      function normalizeMatches(matchRows) {
        return matchRows
          .map(r => ({
            session_id: String(r.session_id).trim(),
            match_id: String(r.match_id ?? "").trim(),
            match_date: String(r.match_date ?? "").trim(),
            team: normTeam(r.team),
            goals_for: toInt(r.goals_for),
            goals_against:
              String(r.goals_against ?? "").trim() === "" ? null : toInt(r.goals_against),
            result: normResult(r.result)
          }))
          .filter(r => r.result !== "NO_DATA");
      }
      
      //this function normalizes goals when it`s either missing in the CSV or when the goals against/for does not match
      function fixMissingGoals(normalized) {
        const byMatch = new Map();

        for (const r of normalized) {
          if (!byMatch.has(r.match_id)) byMatch.set(r.match_id, []);
          byMatch.get(r.match_id).push(r);
        }

        for (const rows of byMatch.values()) {
          const b = rows.find(x => x.team === "Black");
          const w = rows.find(x => x.team === "White");

          if (b && w) {
            if (b.goals_against === null) b.goals_against = w.goals_for;
            if (w.goals_against === null) w.goals_against = b.goals_for;
          }
        }

        return normalized;
      }

      function buildMatchIndex(normalized) {
        const matchIdx = new Map();
        const matchesById = new Map();

        for (const r of normalized) {
          const mr = {
            session_id: r.session_id,
            match_id: r.match_id,
            match_date: r.match_date,
            year: yearOf(r.match_date),
            team: r.team,
            goals_for: r.goals_for,
            goals_against: r.goals_against ?? 0,
            result: r.result
          };

          matchIdx.set(key(mr.match_id, mr.team), mr);

          if (!matchesById.has(mr.match_id)) matchesById.set(mr.match_id, []);
          matchesById.get(mr.match_id).push(mr);
        }

        return { matchIdx, matchesById };
      }

      function modelBuildPlays(playerRows, matchIdx) {
        return playerRows.map(pr => {
          const mid = String(pr.match_id ?? "").trim();
          const tm = normTeam(pr.team);
          const mr = matchIdx.get(key(mid, tm));

          return {
            session_id: String(pr.session_id ?? "").trim(),
            match_id: mid,
            match_date: String(pr.match_date ?? "").trim(),
            year: yearOf(pr.match_date),
            player_id: normPid(pr.player_id ?? ""),
            player_name: String(pr.player_name ?? "").trim(),
            team: tm,
            is_captain: isTruthy(pr.is_captain),
            joined: mr || null
          };
        });
      }

      function computeBaseTeamStats(normalized) {
        const rows = normalized.map(r => ({
          session_id: r.session_id,
          match_id: r.match_id,
          match_date: r.match_date,
          team: r.team,
          gf: r.goals_for,
          ga: r.goals_against ?? 0,
          res: r.result
        }));

        return {
          teamGames: rows.length,
          wins: rows.filter(x => x.res === "W").length,
          draws: rows.filter(x => x.res === "D").length,
          losses: rows.filter(x => x.res === "L").length
        };
      }

      function computeBaseWinRate(base) {
        return base.teamGames ? base.wins / base.teamGames : 0;
      }

      function modelBuildMatchSummaries(matchesById) {
        const matchIds = Array.from(matchesById.keys()).sort();

        return matchIds.map(id => {
          const rows = matchesById.get(id);
          const b = rows.find(r => r.team === "Black");
          const w = rows.find(r => r.team === "White");

          const gd = b ? b.goals_for - b.goals_against : 0;
          const total = (b?.goals_for ?? 0) + (w?.goals_for ?? 0);

          const isPlaceholder10 =
            (b?.goals_for === 1 && b?.goals_against === 0) ||
            (b?.goals_for === 0 && b?.goals_against === 1);

          return {
            match_id: id,
            match_date: b?.match_date || w?.match_date || "",
            session_id: b?.session_id || w?.session_id,
            year: b?.year || w?.year || yearOf(b?.match_date || w?.match_date || ""),
            black_gf: b?.goals_for ?? 0,
            white_gf: w?.goals_for ?? 0,
            black_res: b?.result ?? "",
            gd_black: gd,
            totalGoals: total,
            close: Math.abs(gd) <= 1 && !isPlaceholder10
          };
        });
      }

      function modelBuildCaptainList(captainMap) {
        return Array.from(captainMap.values()).map(c => ({
          player_id: c.player_id,
          player_name: c.player_name,
          games: c.games,
          w: c.w,
          d: c.d,
          l: c.l,
          winRate: c.games ? c.w / c.games : 0
        }));
      }


  //Model Player Stats - BEGIN
    /*Functions below builds the player stats model
      Groups players by match
      Builds pair combinations
      Computes win-based synergy
      Computes expected win rate
      Attaches event synergy*/

      function groupPlaysByPlayer(plays) {
        const map = new Map();

        for (const p of plays) {
          if (!p.joined) continue;

          if (!map.has(p.player_id)) {
            map.set(p.player_id, {
              player_id: p.player_id,
              player_name: p.player_name,
              games: 0,
              w: 0,
              d: 0,
              l: 0,
              gf: 0,
              ga: 0,
              gd: 0,
              timeline: []
            });
          }

          const a = map.get(p.player_id);

          a.games++;
          if (p.joined.result === "W") a.w++;
          else if (p.joined.result === "D") a.d++;
          else if (p.joined.result === "L") a.l++;

          a.gf += p.joined.goals_for;
          a.ga += p.joined.goals_against;
          a.gd += (p.joined.goals_for - p.joined.goals_against);

          a.timeline.push({
            match_id: p.match_id,
            match_date: p.joined.match_date || p.match_date,
            team: p.team,
            res: p.joined.result,
            gf: p.joined.goals_for,
            ga: p.joined.goals_against,
            session_id: p.joined.session_id,
            is_captain: p.is_captain
          });
        }

        return map;
      }

      function computePlayerStreaks(timeline) {
        timeline.sort((a, b) => a.match_date < b.match_date ? 1 : -1);

        // Current win streak
        let currentStreak = 0;
        for (const t of timeline) {
          if (t.res === "W") currentStreak++;
          else break;
        }

        // Best win streak (scan oldest → newest)
        let run = 0, bestStreak = 0;
        for (const t of [...timeline].reverse()) {
          if (t.res === "W") {
            run++;
            bestStreak = Math.max(bestStreak, run);
          } else {
            run = 0;
          }
        }

        // Best streak end date
        let bestStreakEndDate = null;
        run = 0;
        for (const t of [...timeline].reverse()) {
          if (t.res === "W") {
            run++;
            if (run === bestStreak) bestStreakEndDate = t.match_date;
          } else {
            run = 0;
          }
        }

        // Cold streaks
        let currentCold = 0;
        for (const t of timeline) {
          if (t.res === "L") currentCold++;
          else break;
        }

        let bestCold = 0, coldRun = 0;
        for (const t of [...timeline].reverse()) {
          if (t.res === "L") {
            coldRun++;
            bestCold = Math.max(bestCold, coldRun);
          } else {
            coldRun = 0;
          }
        }

        return {
          currentStreak,
          bestStreak,
          bestStreakEndDate,
          currentCold,
          bestCold
        };
      }

      function computeCaptainStats(plays) {
        const map = new Map();

        for (const p of plays) {
          if (!p.joined || !p.is_captain) continue;

          if (!map.has(p.player_id)) {
            map.set(p.player_id, {
              player_id: p.player_id,
              player_name: p.player_name,
              games: 0,
              w: 0,
              d: 0,
              l: 0
            });
          }

          const c = map.get(p.player_id);
          c.games++;

          if (p.joined.result === "W") c.w++;
          else if (p.joined.result === "D") c.d++;
          else if (p.joined.result === "L") c.l++;
        }

        return map;
      }

      function finalizePlayerList(playerMap, captainMap, baseWinRate, allTimeSessionsByPlayer) {
        return Array.from(playerMap.values()).map(p => {
          const winRate = p.games ? p.w / p.games : 0;
          const impact = winRate - baseWinRate;

          const streaks = computePlayerStreaks(p.timeline);

          const sessionsPlayedAll = allTimeSessionsByPlayer?.get(p.player_id) ?? 1;

          const cap = captainMap.get(p.player_id) || {};
          const captainGames = cap.games || 0;

          return {
            ...p,
            winRate,
            impact,
            totalGF: p.gf,
            totalGA: p.ga,
            totalGD: p.gd,
            sessionsPlayedAll,
            captainGames,
            captainW: cap.w || 0,
            captainD: cap.d || 0,
            captainL: cap.l || 0,
            ...streaks
          };
        });
      }

      function modelBuildPlayerStats(plays, baseWinRate, allTimeSessionsByPlayer) {
        const playerMap = groupPlaysByPlayer(plays);
        const captainMap = computeCaptainStats(plays);

        const playerList = finalizePlayerList(
          playerMap,
          captainMap,
          baseWinRate,
          allTimeSessionsByPlayer
        );

        return {
          playerList,
          captainById: captainMap
        };
      }

    //Model Player Stats - END


    //Model Player Synergy - BEGIN  
      function groupPlayersByMatch(plays) {
        const map = new Map();

        for (const p of plays) {
          if (!p.joined) continue;

          const k = key(p.match_id, p.team);
          if (!map.has(k)) map.set(k, []);
          map.get(k).push(p);
        }

        return map;
      }

      function buildPairWinStats(grouped) {
        const pairs = new Map();

        for (const members of grouped.values()) {
          for (let i = 0; i < members.length; i++) {
            for (let j = i + 1; j < members.length; j++) {
              const a = members[i], b = members[j];
              const ida = a.player_id, idb = b.player_id;

              const pairId = ida < idb ? key(ida, idb) : key(idb, ida);

              if (!pairs.has(pairId)) {
                pairs.set(pairId, {
                  a: ida < idb ? ida : idb,
                  b: ida < idb ? idb : ida,
                  games: 0,
                  w: 0,
                  d: 0,
                  l: 0
                });
              }

              const pr = pairs.get(pairId);
              pr.games++;

              const res = a.joined.result;
              if (res === "W") pr.w++;
              else if (res === "D") pr.d++;
              else if (res === "L") pr.l++;
            }
          }
        }

        return pairs;
      }

      function computePairSynergy(pairs, playerList) {
        const pWin = new Map(playerList.map(p => [p.player_id, p.winRate]));
        const pName = new Map(playerList.map(p => [p.player_id, p.player_name]));

        return Array.from(pairs.values()).map(x => {
          const winRate = x.games ? x.w / x.games : 0;
          const expected = ((pWin.get(x.a) ?? 0) + (pWin.get(x.b) ?? 0)) / 2;
          const synergy = winRate - expected;

          return {
            a_id: x.a,
            a_name: pName.get(x.a) ?? x.a,
            b_id: x.b,
            b_name: pName.get(x.b) ?? x.b,
            games: x.games,
            w: x.w,
            d: x.d,
            l: x.l,
            winRate,
            expected,
            synergy
          };
        });
      }

      function attachEventSynergy(pairList, rawEvents, matchSummaries) {
        const matchIdSet = new Set(matchSummaries.map(m => m.match_id));
        const eventSynergy = buildEventSynergy(rawEvents, matchIdSet);

        for (const p of pairList) {
          const key = p.a_id < p.b_id
            ? `${p.a_id}||${p.b_id}`
            : `${p.b_id}||${p.a_id}`;

          p.eventSynergy = eventSynergy.get(key) || 0;
        }
      }
    
      function modelBuildPairSynergy(plays, playerList) {
        // 8.1 Group players by match+team
        const grouped = groupPlayersByMatch(plays);

        // 8.2 Build raw pair win/loss stats
        const pairStats = buildPairWinStats(grouped);

        // 8.3 Compute synergy (winRate, expected, synergy)
        const pairList = computePairSynergy(pairStats, playerList);

        return pairList;
      }
      
    //Model Player Synergy - end  

/*1-  BUILD THE MODEL - END
**********************************************/
