# Sunday Soccer Dashboard ⚽📊

A lightweight, static, single-page dashboard to track Sunday soccer matches, player performance, and team dynamics.

Built with **plain HTML, CSS, and JavaScript** — no backend, no frameworks.

---

## ✨ Features

### 📅 Match & History Analysis
- View **all history**, a **specific year**, or a **specific session**
- Filters are **independent and persistent**
- Supports legacy data with missing session information

### 🧮 KPIs
- Matches played
- Average goals per Sunday
- Draw rate
- Close games (≤ 1 goal)
- Best win streak (with most recent end date)
- Top scorers and assists
- Captain performance (minimum threshold enforced)

### 👤 Player Leaderboard
- Ranked player table
- Minimum games filter
- Click any player to open their profile

### 🎯 Player Profile
- Win / Draw / Loss record
- Win percentage
- Sessions played (all-time)
- Event-based stats (goals, assists, second assists)
- Team impact (goal differential, impact vs baseline)
- Best win streak & cold streak
- Captain record
- Recent games timeline with pagination

### 🤝 Pair Synergy
- Measures how pairs perform together vs expected
- Filters by player
- Minimum games threshold
- Includes **event-based synergy**  
  (goal + assist + second assist counted once per event)

### 🕒 Match Timeline
- Visual timeline of match events
- Non-overlapping events
- Team-aware layout (Black vs White)
- Mobile-safe scrolling

### 🏆 Achievements (Optional / WIP)
- Pixel-art achievements
- Bronze / Silver / Gold rarity
- Progress bars
- Modal details
- Can be hidden or gated via query flags

### 🌗 Theme Support
- Light / Dark mode
- Persisted per browser (local only)

---

## 🧠 Technical Architecture

### Stack
- **Static HTML + CSS + JavaScript**
- Designed for **S3 + CloudFront**
- No backend, no server state
- No frameworks

### Data Sources
The app supports **three data loading modes**:

1. **Remote CSVs (Production)**  
   Loaded from CloudFront (default)

2. **Embedded Mock Data**  
   Enable via query string:
?mock=true


3. **Local CSV Uploads**  
Use the file upload panel for testing

---

## 📁 Expected CSV Schemas

### `player_game.csv`
Required columns:
session_id, match_id, match_date, player_id, player_name, team


Optional:
is_captain

### `match_team.csv`
session_id, match_id, match_date, team, goals_for, goals_against, result

Notes:
- `NO_DATA` results are excluded
- Placeholder scores (1–0, 0–1, 1–1) are excluded from some KPIs

### `match_events.csv`
session_id, match_id, Timestamp, Team,
goal_player_id, assist_player_id, second_assist_player_id

---

## 🔎 Filters & Query Parameters

### Supported Query Params (applied once on load)

?player=NAME
?year=YYYY
?session=SXX
?mock=true

### Important Behavior
- Query params are **applied once** during initialization
- After load, **user interaction controls everything**
- Invalid values are ignored safely
- One filter never resets another unless explicitly changed by the user

---

## 🧩 Core Design Principles

### ✔ Side-Effect-Free Rendering
- Render functions **never mutate controls**
- UI updates only happen in controllers / event handlers

### ✔ Single Source of Truth
- Raw CSV data is never mutated
- All derived state is computed per render
- Indexes (players, sessions, years) are built explicitly

### ✔ Event-Driven Updates
- Programmatic control changes dispatch native DOM events
- Ensures consistent behavior between user input and query seeding

### ✔ Minimal Refactors
- Changes are surgical
- No framework abstractions
- Easy to debug and reason about

---

## ⚠️ Known Assumptions & Defaults

- Missing `session_id` is treated as `"S01"` at **read time**
- Year is derived from `match_date`
- Player names are assumed unique within a dataset
- CSVs are trusted input (no schema validation layer)

---

## 🚀 Running Locally

Simply open:

index.html


in a browser.  
No build step required.

---

## 🛠️ Deployment

Recommended:
- **Amazon S3 + CloudFront**
- Cache disabled or short TTL for CSVs

Works on **any static host**.

---

## 📜 License

Add a license before reuse.  
MIT is recommended if you want others to fork and adapt freely.

---

## 🙌 Credits

Built for a friendly Sunday soccer group.  
Designed to be transparent, fast, and fun.
