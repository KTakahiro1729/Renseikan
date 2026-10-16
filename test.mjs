import assert from 'node:assert/strict';
import {createGame,advance,command,completeBallot,finalize,project,setCharacter,changeMotive} from './core.js';
function run(){
 const s=createGame();assert.equal(s.players.length,5);assert.equal(s.players.every(p=>p.location==='大広間'),true);
 assert.equal(s.players.every(p=>p.hand.length===4),true);
 assert.equal(s.items.herbA.room,'庭園');
 setCharacter(s,0,'soldier');assert.equal(s.players[0].character,'soldier');assert.equal(s.players[4].character,'heir');
 assert.equal(s.items.personal_4_saber.holder,0);
 const old=s.players[0].mainScore;s.players[0].mainScore=5;changeMotive(s,0,'探究');assert.equal(s.players[0].mainScore,5);assert.equal(s.players[0].hand.length,4);
 advance(s,'start');
 command(s,0,{type:'plan',to:'主人室',mode:'awake'});
 for(let i=1;i<5;i++)command(s,i,{type:'plan',to:'大広間',mode:'awake'});
 advance(s,'explore');assert.equal(s.players[0].location,'主人室');
 assert.equal(project(s,1).status[0].location,null,'other locations hidden');
 assert.equal(project(s,0).status[1].location,null);
 command(s,0,{type:'armor'});assert.equal(s.players[0].ap,14);
 // Manually put a valuable manor item in the room for a take/give/place test.
 let it=s.items.jewel;it.room='主人室';s.master.location='大広間';
 command(s,0,{type:'take',itemId:'jewel'});assert.equal(it.carrier,0);
 command(s,0,{type:'place',itemId:'jewel'});assert.equal(it.carrier,null);
 let taskId=s.players[0].hand[0].id;command(s,0,{type:'discard',taskId});assert.equal(s.players[0].hand.length,4);
 for(let t=1;t<=8;t++){
  if(t!==1){for(let i=0;i<5;i++)command(s,i,{type:'plan',to:s.players[i].location,mode:'awake'});advance(s,'explore');}
  advance(s,'next');
 }
 assert.equal(s.phase,'morning');assert.equal(s.players[0].ap>=10,true);
 for(let m=1;m<=5;m++){
  for(let i=0;i<5;i++)if(!s.players[i].morningDone)command(s,i,{type:'skip'});
  advance(s,'talk');advance(s,'nextMorning');
 }
 assert.equal(s.phase,'vote');
 for(let i=0;i<5;i++)command(s,i,{type:'vote',value:'事故死'});
 assert.equal(completeBallot(s),'done');finalize(s);
 assert.equal(s.phase,'result');assert.equal(s.result.players.length,5);
 console.log('Core smoke test: PASSED, events:',s.events.length);
}
run();
// Poison A on the master: death at the next 60-min boundary, no vomit.
{
 const s=createGame({schedule:['主人室','主人室','食堂','主人室','図書室','主人室','大広間','庭園']});
 advance(s,'start');for(let i=0;i<5;i++)command(s,i,{type:'plan',to:i===0?'主人室':'大広間',mode:'awake'});
 advance(s,'explore');const tea=s.items.drink;tea.holder=0;tea.room=null;tea.poison={type:'A',actor:0};
 command(s,0,{type:'place',itemId:'drink'});assert.equal(s.pendingEffects.length,1);
 assert.equal(s.master.death,null);advance(s,'next');assert(s.master.alive);advance(s,'explore');
 assert.equal(s.master.death.cause,'毒殺');
 assert.equal(s.master.traces.some(x=>x.kind==='吐瀉物'),false);
}
// Poison B: no death on T2 boundary, vomit on T3.
{
 const s=createGame();advance(s,'start');for(let i=0;i<5;i++)command(s,i,{type:'plan',to:i===0?'主人室':'大広間',mode:'awake'});
 advance(s,'explore');const tea=s.items.drink;tea.holder=0;tea.room=null;tea.poison={type:'B',actor:0};
 command(s,0,{type:'place',itemId:'drink'});advance(s,'next');assert.equal(s.master.alive,true);
 for(let i=0;i<5;i++)command(s,i,{type:'plan',to:s.players[i].location,mode:'awake'});
 advance(s,'explore');advance(s,'next');advance(s,'explore');assert.equal(s.master.death.cause,'毒殺');
 assert.equal(s.master.traces.some(x=>x.kind==='吐瀉物'),true);
}
console.log('Toxin boundary tests: PASSED');
