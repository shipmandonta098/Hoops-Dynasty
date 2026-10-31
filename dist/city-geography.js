/* City coordinates and time zones for travel. Default and expansion cities use arena-area coordinates (approximate,
   two to three decimals); franchise presets carry their own lat/lon/timeZone. Custom cities can set coordinates on the
   team; otherwise they are estimated from their division (or conference, or league) and take the nearest known city's
   time zone. */
const CITY_GEOGRAPHY={
 'Atlanta':[33.757,-84.396,'America/New_York'],'New York':[40.751,-73.993,'America/New_York'],'Los Angeles':[34.043,-118.267,'America/Los_Angeles'],
 'Chicago':[41.881,-87.674,'America/Chicago'],'Miami':[25.781,-80.188,'America/New_York'],'Memphis':[35.138,-90.051,'America/Chicago'],
 'Seattle':[47.622,-122.354,'America/Los_Angeles'],'New Orleans':[29.949,-90.082,'America/Chicago'],'Boston':[42.366,-71.062,'America/New_York'],
 'Brooklyn':[40.683,-73.976,'America/New_York'],'Philadelphia':[39.901,-75.172,'America/New_York'],'Toronto':[43.643,-79.379,'America/Toronto'],
 'Cleveland':[41.497,-81.688,'America/New_York'],'Detroit':[42.341,-83.055,'America/Detroit'],'Indiana':[39.764,-86.155,'America/Indiana/Indianapolis'],
 'Milwaukee':[43.045,-87.917,'America/Chicago'],'Charlotte':[35.225,-80.839,'America/New_York'],'Orlando':[28.539,-81.384,'America/New_York'],
 'Washington':[38.898,-77.021,'America/New_York'],'Denver':[39.749,-105.008,'America/Denver'],'Minnesota':[44.979,-93.276,'America/Chicago'],
 'Portland':[45.532,-122.667,'America/Los_Angeles'],'Salt Lake':[40.768,-111.901,'America/Denver'],'Dallas':[32.790,-96.810,'America/Chicago'],
 'Houston':[29.751,-95.362,'America/Chicago'],'San Antonio':[29.427,-98.438,'America/Chicago'],'Phoenix':[33.446,-112.071,'America/Phoenix'],
 'Sacramento':[38.580,-121.500,'America/Los_Angeles'],'San Francisco':[37.768,-122.388,'America/Los_Angeles'],'San Diego':[32.755,-117.212,'America/Los_Angeles'],
 'Las Vegas':[36.103,-115.178,'America/Los_Angeles'],'Vancouver':[49.278,-123.109,'America/Vancouver'],'Montreal':[45.496,-73.569,'America/Toronto'],
 'Kansas City':[39.097,-94.580,'America/Chicago'],'Louisville':[38.257,-85.754,'America/Kentucky/Louisville'],'Pittsburgh':[40.439,-79.989,'America/New_York'],
 'Baltimore':[39.289,-76.612,'America/New_York'],'Mexico City':[19.404,-99.096,'America/Mexico_City']
};
function knownCityGeography(city){const c=CITY_GEOGRAPHY[city];if(c)return {lat:c[0],lon:c[1],timeZone:c[2],source:'city'};const p=typeof FRANCHISE_PRESETS!=='undefined'&&FRANCHISE_PRESETS.find(x=>x.city===city);return p&&Number.isFinite(p.lat)?{lat:p.lat,lon:p.lon,timeZone:p.timeZone,source:'preset'}:null}
function validGeoPoint(lat,lon){return Number.isFinite(lat)&&Number.isFinite(lon)&&lat>=-90&&lat<=90&&lon>=-180&&lon<=180}
function geoMiles(a,b){if(!a||!b)return 0;const r=Math.PI/180,dLat=(b.lat-a.lat)*r,dLon=(b.lon-a.lon)*r,h=Math.sin(dLat/2)**2+Math.cos(a.lat*r)*Math.cos(b.lat*r)*Math.sin(dLon/2)**2;return 3958.8*2*Math.asin(Math.min(1,Math.sqrt(h)))}
function nearestKnownCity(point){let best=null,bestMiles=Infinity;for(const city of Object.keys(CITY_GEOGRAPHY)){const g=knownCityGeography(city),m=geoMiles(point,g);if(m<bestMiles){best=g;bestMiles=m}}for(const p of typeof FRANCHISE_PRESETS!=='undefined'?FRANCHISE_PRESETS:[]){const m=geoMiles(point,p);if(m<bestMiles){best={lat:p.lat,lon:p.lon,timeZone:p.timeZone};bestMiles=m}}return best}
// Geography for every team of a league: user-set coordinates, a known city, or an estimate from nearby teams.
function leagueGeography(teams){
 const known=teams.map(t=>validGeoPoint(t.lat,t.lon)?{lat:t.lat,lon:t.lon,timeZone:t.timeZone||nearestKnownCity({lat:t.lat,lon:t.lon})?.timeZone||'America/New_York',source:'team'}:knownCityGeography(t.arenaCity||t.city)||knownCityGeography(t.city));
 const centroid=list=>{const pts=list.filter(Boolean);if(!pts.length)return null;return {lat:pts.reduce((n,p)=>n+p.lat,0)/pts.length,lon:pts.reduce((n,p)=>n+p.lon,0)/pts.length}};
 return teams.map((t,i)=>{if(known[i])return known[i];const mates=g=>teams.map((x,j)=>x!==t&&g(x)?known[j]:null),point=centroid(mates(x=>t.divisionId&&x.divisionId===t.divisionId))||centroid(mates(x=>x.conference&&x.conference===t.conference))||centroid(known)||{lat:39.8,lon:-98.6};return {...point,timeZone:nearestKnownCity(point)?.timeZone||'America/Chicago',source:'estimate'}});
}
