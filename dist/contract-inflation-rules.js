/* Contract limits affect new agreements; signed salaries and terms remain intact. */
function validateContractRules(r){
 if(r.inflationMin>r.inflationMax||r.capInflation<r.inflationMin||r.capInflation>r.inflationMax)throw Error('Inflation average must fall between the minimum and maximum.');
 if(r.minContract>r.maxContract)throw Error('Minimum contract salary cannot exceed maximum contract salary.');
 if(r.minContractYears>r.maxContractYears)throw Error('Minimum contract length cannot exceed maximum contract length.');
}
function parseRookieLengths(value){if(typeof value!=='string'||!/^\d+(,\s*\d+)*$/.test(value.trim()))throw Error('Enter rookie lengths by round, e.g. 4,2; use 0 for the default.');const years=value.split(',').map(Number);if(years.length>5||years.some(n=>!Number.isInteger(n)||n<0||n>10))throw Error('Use one to five rookie lengths from 0 to 10.');return years;}
function contractMoneyStep(){return state?.leagueSettings?.historicalSource&&state.leagueSettings.historicalSource!=='custom'?.000001:.1;}
function roundContractAmount(value){const scale=1/contractMoneyStep();return Math.round(value*scale)/scale;}
function contractSalary(value){const r=leagueRules();return Math.max(r.minContract,Math.min(r.maxContract,roundContractAmount(value)));}
function contractTerm(years){return Math.max(leagueRules().minContractYears,Math.min(leagueRules().maxContractYears,years));}
function contractTerms(){const r=leagueRules();return Array.from({length:r.maxContractYears-r.minContractYears+1},(_,i)=>r.minContractYears+i);}
function rookieContractYears(round){const r=leagueRules(),lengths=parseRookieLengths(r.rookieRoundYears);return lengths[Math.min(round-1,lengths.length-1)]||r.rookieYears;}
function rookieContractSalary(index,round,rounds){const r=leagueRules();if(!r.rookieScaleEnabled||round>rounds-Math.min(rounds,r.rookieMinimumRounds))return r.minContract;const top=r.rookieTopMode==='percent'?r.maxContract*r.rookieMaxPercent/100:r.rookieTopSalary;return contractSalary(top*Math.max(.25,1-index*.025)*r.rookieSalary);}
function annualInflationRate(r,year){if(!r.inflationStdDev)return r.capInflation;const random=scheduleRandom(year*7919+193),u=Math.max(Number.EPSILON,random()),v=random(),normal=Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*v);return Math.max(r.inflationMin,Math.min(r.inflationMax,Math.round((r.capInflation+normal*r.inflationStdDev)*10000)/10000));}
const contractExtensionQuote=extensionQuote;extensionQuote=function(p){return contractSalary(contractExtensionQuote(p));};
const contractValidateCareer=validateCareerData;validateCareerData=function(raw){const out=contractValidateCareer(raw),entry=raw.inflationApplied;if(entry!==undefined){if(!entry||!Number.isInteger(entry.year)||entry.year<1900||entry.year>raw.year||!Number.isFinite(entry.rate)||entry.rate< -20||entry.rate>50)throw Error('Invalid inflation record.');out.inflationApplied={year:entry.year,rate:entry.rate};}return out;};
