/* Verified identity/kinship reference catalog. Never a roster or a contract source.
   Dates use the game's October 1 season-age convention. Sources checked 2026-10-16.
   No historical career totals or current teams are inferred from these records. */
const FAMILY_HISTORY_PEOPLE=[
 ['nba:209','Dell Curry','male','1964-06-25','NBA','https://www.nba.com/player/209/dell-curry'],
 ['nba:201939','Stephen Curry','male','1988-03-14','NBA','https://www.nba.com/player/201939/stephen-curry'],
 ['nba:203552','Seth Curry','male','1990-08-23','NBA','https://www.nba.com/player/203552/seth_curry'],
 ['nba:2544','LeBron James','male','1984-12-30','NBA','https://www.nba.com/player/2544'],
 ['nba:1642355','Bronny James','male','2004-10-06','NBA','https://www.nba.com/player/1642355/bronny-james/bio'],
 ['nba:203507','Giannis Antetokounmpo','male','1994-12-06','NBA','https://www.nba.com/player/203507/giannis-antetokounmpo'],
 ['nba:203648','Thanasis Antetokounmpo','male','1992-07-18','NBA','https://www.nba.com/player/203648/thanasis-antetokounmpo'],
 ['nba:2200','Pau Gasol','male','1980-07-06','NBA','https://www.nba.com/player/2200/pau-gasol'],
 ['nba:201188','Marc Gasol','male','1985-01-29','NBA','https://www.nba.com/player/201188/marc-gasol'],
 ['hof:cheryl-miller','Cheryl Miller','female','1964-01-03','Other','https://www.hoophall.com/hall-of-famers/cheryl-miller'],
 ['nba:397','Reggie Miller','male','1965-08-24','NBA','https://www.hoophall.com/hall-of-famers/reggie-miller'],
 ['wnba:203014','Nneka Ogwumike','female','1990-07-02','WNBA','https://www.basketball-reference.com/wnba/players/o/ogwumnn01w.html'],
 ['wnba:203823','Chiney Ogwumike','female','1992-03-21','WNBA','https://cdn.wnba.com/sites/1611661313/2022/07/NYL-Game-Notes-LA-7.3.22-UPDATED.pdf']
].map(([historicalId,name,gender,birthdate,league,source])=>({id:'h:'+historicalId,historicalId,name,gender,birthdate,league,source,origin:'historical',playerId:null,status:'reference',seasons:[],teams:[],reached:false}));
const FAMILY_HISTORY_LINKS=[
 ['nba:209','nba:201939','parent','https://www.nba.com/news/greatest-father-son-duos-in-nba-history'],
 ['nba:209','nba:203552','parent','https://www.nba.com/mavs/seth-brings-his-own-brand-of-curry-to-dallas'],
 ['nba:201939','nba:203552','sibling','https://www.nba.com/news/curry-brothers-warriors'],
 ['nba:2544','nba:1642355','parent','https://www.nba.com/news/lebron-bronny-james-1st-father-son-duo-to-play-in-preseason'],
 ['nba:203507','nba:203648','sibling','https://www.nba.com/news/bucks-band-brothers'],
 ['nba:2200','nba:201188','sibling','https://www.nba.com/bulls/features/pau-gasol-prepares-all-star-history'],
 ['hof:cheryl-miller','nba:397','sibling','https://www.nba.com/pacers/news/pacers-have-learned-older-sisters'],
 ['wnba:203014','wnba:203823','sibling','https://sparks.wnba.com/news/sister-sister-nneka-and-chiney-ogwumike']
].map(([a,b,type,source])=>({a:'h:'+a,b:'h:'+b,type,source,origin:'verified'}));
