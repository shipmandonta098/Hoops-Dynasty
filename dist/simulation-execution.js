/* Execution policy only. NORMAL never changes basketball rules or persistence. */
const SIMULATION_MODES=Object.freeze({NORMAL:'normal',FAST:'fast',HEADLESS:'headless'});
const simulationExecution={mode:SIMULATION_MODES.NORMAL,autopilot:false,isolated:false,onProgress:null,context:{},warnings:[],games:0,players:0,saveRequests:0};
function simulationHeadless(){return simulationExecution.mode!==SIMULATION_MODES.NORMAL}
function simulationAutopilot(){return simulationHeadless()&&simulationExecution.autopilot}
function simulationFailure(error){if(simulationHeadless())throw error instanceof Error?error:Error(String(error))}
