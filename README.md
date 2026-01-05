# Sunday Soccer Dashboard ⚽📊
A lightweight, static, single-page dashboard to track Sunday soccer matches, player performance, and team dynamics.
Built with **plain HTML, CSS, and JavaScript** — no backend, no frameworks.

---

## ✨ Features

### 🌗 Theme Support
![alt text](https://github.com/paulosoderi/sunday_soccer_dashboard/blob/main/readme/01_theme.png "Toggle Theme")
- Light / Dark mode
    You can select between Dark and Light mode.
  Light:
    ![alt text](https://github.com/paulosoderi/sunday_soccer_dashboard/blob/main/readme/01_a_theme_light.png "Toggle Theme Light")
  Dark:
    ![alt text](https://github.com/paulosoderi/sunday_soccer_dashboard/blob/main/readme/01_a_theme_dark.png "Toggle Theme")

- Persisted per browser (local only)
    Toggling it will save the choice locally and will remember when the dashboard is oppened again
 

### 📅 Match & History Analysis
- View **all history**, a **specific year**, or a **specific session**
  
![alt text](https://github.com/paulosoderi/sunday_soccer_dashboard/blob/main/readme/02_filters.png "Filter")
  
- Filters are **independent and persistent**.
- Filters will apply through all KPIs and tables.
- When filtering the best record/streak/assist/scores/etc will be showing the best for the filter selected.
  
  Available Filters:  
    A) all-time: Display all data available to date  
    B) year: load the next dropdown where you can select the Year. All matches played within the choosen year will be used to calculate the KPIs.   
    C) session: load the next dropdown where you can select the session.  

  The selected filter is shown as a pill right next to the second dropdown
    
  When filter is selected, all visuals are updated. 
   ![alt text](https://github.com/paulosoderi/sunday_soccer_dashboard/blob/main/readme/02_a_filters.png "Filter")
  
  This can trigger empty data for KPIs that needs a minimum ammount of data points or when the data point does not exist for the filter in that period.
  ![alt text](https://github.com/paulosoderi/sunday_soccer_dashboard/blob/main/readme/02_b_filters.png "Filter")


### 🧮 KPIs Section

 ![alt text](https://github.com/paulosoderi/sunday_soccer_dashboard/blob/main/readme/02_a_filters.png "Filter")
 
- **📅 Matches**: Total matches played within selected filter.
- **🥅 Avg goals / Sunday:** Average goals per Sunday: total_goals / total_matches excluding 1-0 results as those are in the data to record the weekends where score was not recorded. 
- **⚖️ Draw rate:**: % of how many games ended in a draw total_draws / total_matches
- **⚔️ Close games (≤1 goal):** Count of matches that ended whitin 1 goal difference excluding 1-0 results  
- **🧢 Captains:** It shows the captain`s performance displaying the record (W-D-L) as a captain. it enforces a minimum of 3 matches to reduce noise. Sorts by the highest win%
- **Best win streak** (with most recent end date): Displays the best win streak for the period, date below show the day the streak ended (if current, it will show the last weekend)
- **🏆Top Scorers:** Sum of total goals per player. It shows top 3 best scorers
- **🎯 Top Assist:** Sum of total assists per player.It shows top 1 only


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

### 🏆 Achievements (Optional / WIP)
- Pixel-art achievements
- Bronze / Silver / Gold rarity
- Progress bars

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
   Enable via query string: ?mock=true

3. **Local CSV Uploads**  
Use the file upload panel for testing whe mpck=true

---

## 📁 Expected CSV Schemas

### `player_game.csv`
Required columns:
session_id, match_id, match_date, player_id, player_name, team, is_captain

### `match_team.csv`
session_id, match_id, match_date, team, goals_for, goals_against, result

Notes:
- `NO_DATA` results are excluded
- Placeholder scores (1–0, 0–1, 1–1) are excluded from some KPIs as those represents days where we have only the winner

### `match_events.csv`
session_id, match_id, Timestamp, Team, goal_player_id, assist_player_id, second_assist_player_id

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

- Year is derived from `match_date`
- Player names are assumed unique within a dataset
- CSVs are trusted input (no schema validation layer)

---

## 🚀 Running Locally

Simply open:
index.html

in a browser. No build step required. Running locally will not give you access to S3 CVSs. use the mock=true to upload your own CSV our use the mock data

---

## 🙌 Credits

Built for a friendly Sunday soccer group.  
Designed to be transparent, fast, and fun.
