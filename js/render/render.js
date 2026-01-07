//********************************************
/*Renders are the most important functions of this code.
  each section in the page will be handled by a specifc render
  all renders share the same model (that gets filtered in the same way)
  kpis have 2 distinct functions: compute which is responsible for calculating the KPI, 
  and then render which is responsible for DOM manipulation .*/
 
//Main function, this is the orchestrator that calls all the other renders
function renderAll(model){
  //top row
  renderKPIsSection(model);
  //weekly matches table
  renderMatchesTable(model);
  //leaderboard
  renderLeaderBoard(model);
  //playerprofile  
  renderPlayerSelect(model);
  //pair sinergy Table
  renderPairSynergyTable(model);
  
  //apply all filters and renders it
  applyPlayerFilter();
}
//RENDERS END
//********************************************
