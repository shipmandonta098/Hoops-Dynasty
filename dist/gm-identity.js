/* Stable franchise IDs never change when a GM changes jobs. */
function controlledTeamId(data=state){return data.gmCareer ? (data.gmCareer.status==='employed'?data.gmCareer.teamId:-1) : 0}
function gmCanAdvance(){return controlledTeamId()<0?(simulationAutopilot()||state.gmCareer.dismissalAcknowledged):ownerCanManage()}
