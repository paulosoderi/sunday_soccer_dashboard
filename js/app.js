//CONSTANTS - BEGIN
//****************************************

//constant used in the query parameter, this is used to prevent query parameter to be applied in every iteration
let QUERY_STATE = null;
let QUERY_APPLIED = false;

//set the minimum number of matches as captain to be considered in the captain card
const MIN_CAPTAIN_GAMES = 3;

const PROFILE_PAGE_SIZE = 10;
const PROFILE_PAGE_BY_PLAYER = new Map();
const MATCHES_PAGE_SIZE = 10;
let MATCHES_PAGE = 0;
let CURRENT_MODEL=null;
let RAW_PLAYER_ROWS=[];
let RAW_MATCH_ROWS=[];
let RAW_EVENT_ROWS = []; 
//helper to populate filters and auxilar in all logic
let idx =[];
let ALLTIME_SESSIONS_BY_PLAYER=new Map();


// --- Remote CSV source 
//points to the cloudfront s3 files
const CLOUDFRONT_BASE_URL = "YOUR_CSV_URL"; 
const PLAYER_CSV_URL = `${CLOUDFRONT_BASE_URL}/data/player_game.csv`;
const MATCH_CSV_URL  = `${CLOUDFRONT_BASE_URL}/data/match_team.csv`;
const EVENTS_CSV_URL = `${CLOUDFRONT_BASE_URL}/data/match_events.csv`;

const ACHIEVEMENTS = [
  // 🏟️ Games Played (The Journey)
  { id:"gp10",  icon:"icons/game_bronze.png", title:"Park Regular", rarity:"bronze", 
    desc:"You’re no longer a stranger to the sidelines.", target_desc:"Play at least 10 games", target:10, value:p=>p.games },

  { id:"gp50",  icon:"icons/game_silver.png", title:"Every Blade of Grass", rarity:"silver", 
    desc:"You have literally run over every inch of this pitch.", target_desc:"Play at least 50 games", target:50, value:p=>p.games },

  { id:"gp100", icon:"icons/game_gold.png", title:"Club Legend", rarity:"gold", 
    desc:"They are considering building a statue of you outside the gates.", target_desc:"Play at least 100 games", target:100, value:p=>p.games },

  // 🗓️ Sessions (Consistency)
  { id:"s5",   icon:"icons/session_bronze.png", title:"Off the Couch", rarity:"bronze", 
    desc:"You have officially traded the remote for the cleats.", target_desc:"Play at least 5 sessions", target:5, value:p=>p.sessionsPlayedAll },

  { id:"s10",  icon:"icons/session_silver.png", title:"Rain or Shine", rarity:"silver", 
    desc:"Through mud, wind, and heat—you never miss a beat.", target_desc:"Play at least 10 sessions", target:10, value:p=>p.sessionsPlayedAll },

  { id:"s15",  icon:"icons/session_gold.png", title:"The Professional", rarity:"gold",
    desc:"15 sessions. Your work rate is absolutely elite.", target_desc:"Play at least 15 sessions", target:15, value:p=>p.sessionsPlayedAll },

  // ⚽ Goals (The Finish)
  { id:"g10",   icon:"icons/goal_bronze.png", title:"The Goal Thief", rarity:"bronze", 
    desc:"10 goals. Does not matter if they were ugly, they count!", target_desc:"Score at least 10 goals", target:10, value:p=>p.evGoals },

  { id:"g50",   icon:"icons/goal_silver.png", title:"Golden Boot Hunter", rarity:"silver", 
    desc:"50 goals? The keepers are starting to call in sick.", target_desc:"Score at least 50 goals", target:50, value:p=>p.evGoals },

  { id:"g100",  icon:"icons/goal_gold.png", title:"Hall of Fame", rarity:"gold",
    desc:"100 goals. You have officially entered the pantheon of legends.", target_desc:"Score at least 100 goals", target:100, value:p=>p.evGoals },

  // 🏆 Wins (The Swagger)
  { id:"w5",   icon:"icons/win_bronze.png", title:"Better than Argentina", rarity:"bronze", 
    desc:"5 wins? You have already got more wins than Argentina has World Cups! 🇦🇷", target_desc:"Win at least 5 games", target:5, value:p=>p.w },

  { id:"w25",  icon:"icons/win_silver.png", title:"The 3-Point Specialist", rarity:"silver", 
    desc:"25 wins. You show up, you win, you go home. Easy.", target_desc:"Win at least 25 games",target:25, value:p=>p.w },

  { id:"w50",  icon:"icons/win_gold.png", title:"Trophy Cabinet Full", rarity:"gold",
    desc:"50 wins. You are going to need a bigger shelf for all this hardware.", target_desc:"Win at least 50 games", target:50, value:p=>p.w }
];

//CONSTANTS - END
//****************************************


//main JS orchestrate everything else
init();
