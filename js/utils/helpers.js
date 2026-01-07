//UTILITY Functions - helpers for all other functions that`s common accross many kpis
// Utility to safely set text*/


function setElText(id, text) { const el = document.getElementById(id); if (el) el.textContent = text; }
function normTeam(t) { const v = String(t ?? "").trim().toLowerCase(); if (v === "black" || v === "b") return "Black"; if (v === "white" || v === "w") return "White"; return String(t ?? "").trim() }
function normResult(r) { const v = String(r ?? "").trim().toUpperCase(); return (v === "W" || v === "D" || v === "L" || v === "NO_DATA") ? v : v }
function isTruthy(x) { const v = String(x ?? "").trim().toLowerCase(); return v === "1" || v === "true" || v === "t" || v === "y" || v === "yes" || v === "captain"; }
function toInt(x) { const n = Number.parseInt(x, 10); return Number.isFinite(n) ? n : 0 }
function pct(x) { return (x * 100).toFixed(1) + "%" }
function pct0(x) { return Math.round(x * 100) + "%"; }
function fmt(x, d = 2) { return Number.isFinite(x) ? x.toFixed(d) : "—" }
function perGame(val, games) { return games ? `${fmt(val / games, 1)}/pg` : "—"; }
function clsSign(x) { if (!Number.isFinite(x)) return ""; if (x > 0) return "pos"; if (x < 0) return "neg"; return "neu" }
function emojiSign(x) { if (!Number.isFinite(x)) return ""; if (x > 0) return "🟢"; if (x < 0) return "🔴"; return "🟡" }
function signedPP(x) { const pp = x * 100; return `${pp >= 0 ? "+" : ""}${fmt(pp, 0)}` }
function signedNum(x) { if (x > 0) return `+${x}`; if (x < 0) return `${x}`; else return `${x}`; }
function key(...p) { return p.join("||") }
function yearOf(dateStr) { return String(dateStr || "").slice(0, 4) }
function normPid(x) { return String(x ?? "").trim().toLowerCase(); }
function setText(id, val) { const el = document.getElementById(id); if (el) el.textContent = val }
function setStatus(msg) { const el = document.getElementById("status"); if (el) el.textContent = msg }

function dateKey(d) {
  if (!d) return -Infinity;
  const s = String(d).trim();

  // YYYY-MM-DD (safe lexicographically)
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return Date.parse(s);

  // MM/DD/YYYY (or M/D/YYYY)
  const m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (m) {
    const mm = +m[1], dd = +m[2], yy = +m[3];
    return Date.parse(`${yy}-${String(mm).padStart(2, "0")}-${String(dd).padStart(2, "0")}`);
  }

  // Fallback
  const t = Date.parse(s);
  return Number.isFinite(t) ? t : -Infinity;
}

function drawBarChart(canvas, labels, values) {
  const ctx = canvas.getContext("2d");
  const w = canvas.width, h = canvas.height;
  ctx.clearRect(0, 0, w, h);

  const cs = getComputedStyle(document.documentElement);
  const axisLine = cs.getPropertyValue("--axisLine").trim() || "rgba(233,235,240,0.18)";
  const axisText = cs.getPropertyValue("--axisText").trim() || "rgba(233,235,240,0.55)";
  const barPos = cs.getPropertyValue("--barPos").trim() || "rgba(122,162,255,0.85)";
  const barNeg = cs.getPropertyValue("--barNeg").trim() || "rgba(255,122,122,0.75)";

  const padL = 44, padR = 10, padT = 10, padB = 34;
  const innerW = w - padL - padR, innerH = h - padT - padB;
  const maxAbs = Math.max(1, ...values.map(v => Math.abs(v)));
  const midY = padT + innerH / 2;

  ctx.strokeStyle = axisLine;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(padL, midY);
  ctx.lineTo(w - padR, midY);
  ctx.stroke();

  ctx.fillStyle = axisText;
  ctx.font = "12px ui-monospace, Menlo, Consolas";
  ctx.fillText(String(maxAbs), 8, padT + 10);
  ctx.fillText("0", 20, midY + 4);
  ctx.fillText(String(-maxAbs), 2, padT + innerH + 10);

  const n = values.length, gap = 6;
  const barW = Math.max(6, (innerW - gap * (n - 1)) / n);

  for (let i = 0; i < n; i++) {
    const v = values[i];
    const x = padL + i * (barW + gap);
    const barH = (Math.abs(v) / maxAbs) * (innerH / 2 - 6);
    const y = v >= 0 ? (midY - barH) : midY;

    ctx.fillStyle = v >= 0 ? barPos : barNeg;
    ctx.fillRect(x, y, barW, barH);

    ctx.save();
    ctx.translate(x + barW / 2, h - 8);
    ctx.rotate(-0.6);
    ctx.fillStyle = axisText;
    ctx.font = "11px ui-monospace, Menlo, Consolas";
    ctx.textAlign = "right";
    //ctx.fillText(labels[i],0,0);
    ctx.restore();
  }
}

function makeSortable(table, drawFn) {
  let sortKey = null, sortDir = -1;
  table.querySelectorAll("th[data-key]").forEach(th => th.addEventListener("click", () => {
    const k = th.getAttribute("data-key");
    if (sortKey === k) sortDir *= -1;
    else { sortKey = k; sortDir = -1; }
    drawFn(sortKey, sortDir);
  }));
}

function buildPlayerIndex(playerList) {
  const set = new Set();
  for (const p of playerList || []) {
    if (p?.player_name) {
      set.add(normPid(p.player_name));
    }
  }
  return set;
}

async function readFileText(file) {
  return new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = () => resolve(String(fr.result || ""));
    fr.onerror = reject;
    fr.readAsText(file);
  });
}

function buildFilterIndex(matchRows) {
  const sessions = new Set();
  const years = new Set();
  for (const r of matchRows) {
    sessions.add(r.session_id);
    years.add(yearOf(r.match_date));
  }
  return { sessionList: [...sessions].sort(), yearList: [...years].sort() };
}

function getMostRecentSession(matchRows) {
  let bestDate = "", bestSession = "";
  for (const r of matchRows) {
    const d = String(r.match_date ?? "");
    const sid = String(r.session_id).trim();
    if (d > bestDate) { bestDate = d; bestSession = sid; }
    else if (d === bestDate && sid > bestSession) { bestSession = sid; }
  }
  return bestSession;
}

function getMostRecentYear(matchRows) {
  let best = "0000";
  for (const r of matchRows) {
    const y = yearOf(r.match_date);
    if (y > best) best = y;
  }
  return best;
}

function parseEventTimeToMinutes(e) {
  // Supports: "12/28/2025 19:14" OR "19:14" OR "7:14 PM"
  const raw = String(e.Timestamp ?? e.timestamp ?? e.time ?? "").trim();
  if (!raw) return null;

  // Try "MM/DD/YYYY HH:MM"
  const m1 = raw.match(/(\d{1,2}):(\d{2})/);
  if (!m1) return null;

  let hh = parseInt(m1[1], 10);
  const mm = parseInt(m1[2], 10);

  // Handle AM/PM if present
  if (/pm/i.test(raw) && hh < 12) hh += 12;
  if (/am/i.test(raw) && hh === 12) hh = 0;

  return hh * 60 + mm;
}


    function on(id,evt,fn){
      const el=document.getElementById(id);
      if(el) el.addEventListener(evt,fn);
    }
