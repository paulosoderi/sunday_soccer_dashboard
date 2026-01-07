/*1- BEGIN LOAD DATA 
**********************************************
Default loads data from CSVs, but for testing purpose you can pass 
mock=true in the query param and that will enable you to use the mock data or upload cvsfor quick test
Mock data will be automatically populated, but it is very limited
*/


//init function is the first one to be called. it`s responsible for orchestrating the data load and the params
async function init(){
  // set default view once
  const vm = document.getElementById("viewMode");
  if (vm) vm.value = "all";

  try {
    // choose loader
    if (hasQueryFlag("mock")) {
      await loadFromMock();
    } else{
      await loadFromRemoteCSVs(); // production default
    }

    //populate helper for filters available
     idx = buildFilterIndex(RAW_MATCH_ROWS);

    // AFTER data is guaranteed loaded, refresh the controls
    refreshViewControls();

  } catch (e) {
    setStatus("Init failed: " + (e?.message || e));
  }
}

//this function is only used when mock=true, it will load data from the constants
// //very limited, but useful for quick tweak and test
async function loadFromMock(){
  try{
    setStatus("Loading mock data...");
    RAW_PLAYER_ROWS=parseCSV(MOCK_PLAYER_GAME);
    RAW_MATCH_ROWS=parseCSV(MOCK_MATCH_TEAM);
    RAW_EVENT_ROWS  = parseEventsCSV(MOCK_MATCH_EVENTS);

    //calculate the only KPI that needs full raw data
    ALLTIME_SESSIONS_BY_PLAYER=computeSessionsByPlayer(RAW_PLAYER_ROWS);
    setStatus("Loaded mock data.");
  }catch(e){
    setStatus("Error: "+(e?.message||e));
  }
}

async function loadFromUploads(){
  const fP=document.getElementById("filePlayers")?.files?.[0];
  const fM=document.getElementById("fileMatches")?.files?.[0];
  const fE = document.getElementById("fileEvents")?.files?.[0]; 
  if(!fP||!fM||!fE){setStatus("Select both CSV files first.");return;}
  try{
    setStatus("Reading files...");
    const [tP,tM,tE]=await Promise.all([readFileText(fP),readFileText(fM), readFileText(fE)]);
    RAW_PLAYER_ROWS=parseCSV(tP);
    RAW_MATCH_ROWS=parseCSV(tM);
    RAW_EVENT_ROWS=parseCSV(tE);

    //calculate the only KPI that needs full raw data
    ALLTIME_SESSIONS_BY_PLAYER=computeSessionsByPlayer(RAW_PLAYER_ROWS);

    //build up the filter index as a helper to functions that needs to validate if the content exists in the list
    idx = buildFilterIndex(RAW_MATCH_ROWS);

    setStatus("Loaded uploaded data.");
  }catch(e){
    setStatus("Error: "+(e?.message||e));
  }
  // AFTER data is guaranteed loaded
    refreshViewControls();
}

//this is the default function that loads data from S3. it will load the full CSV into the lists and create the MODEL
async function loadFromRemoteCSVs(){
  try{
    setStatus("Loading data...");

    const [playerText, matchText, eventsText] = await Promise.all([
      fetch(PLAYER_CSV_URL, { cache: "no-store" }).then(r => {
        if(!r.ok) throw new Error(`player_game.csv load failed (${r.status})`);
        return r.text();
      }),
      fetch(MATCH_CSV_URL, { cache: "no-store" }).then(r => {
        if(!r.ok) throw new Error(`match_team.csv load failed (${r.status})`);
        return r.text();
      }),
      fetch(EVENTS_CSV_URL, { cache: "no-store" }).then(r => {
        if(!r.ok) throw new Error(`match_events.csv load failed (${r.status})`);
        return r.text();
      })

    ]);

    RAW_PLAYER_ROWS = parseCSV(playerText);
    RAW_MATCH_ROWS  = parseCSV(matchText);
    RAW_EVENT_ROWS = parseEventsCSV(eventsText);

    //calculate the only KPI that needs full raw data
    ALLTIME_SESSIONS_BY_PLAYER = computeSessionsByPlayer(RAW_PLAYER_ROWS);
    setStatus("Loaded.");
  }catch(e){
    console.error(e);
    setStatus("Error: " + (e?.message || e));
  }
}

function parseCSV(text){
  const raw = String(text ?? "").trim();
  if(!raw) return [];
  const lines = raw.split(/\r?\n/);
  if(!lines.length) return [];
  const header = lines[0].split(",").map(s=>s.trim());
  const rows=[];
  for(let i=1;i<lines.length;i++){
    if(!lines[i].trim()) continue;
    const cols=lines[i].split(",");
    const o={};
    header.forEach((h,idx)=>o[h]=(cols[idx]??"").trim());
    rows.push(o);
  }
  return rows;
}

function parseEventsCSV(text){
  const rows = parseCSV(text);

  return rows.map(r => ({
    session_id: String(r.session_id ?? "").trim(),
    match_id: String(r.match_id ?? "").trim(),
    match_date: String(r.match_date ?? "").trim(),
    timestamp: String(r.Timestamp ?? r.timestamp ?? "").trim(),
    team: normTeam(r.Team),
    second_assist_player_id: normPid(r.second_assist_player_id),
    assist_player_id: normPid(r.assist_player_id),
    goal_player_id: normPid(r.goal_player_id)
  }));
}