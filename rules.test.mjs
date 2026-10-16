import test from 'node:test';import assert from 'node:assert/strict';
import {createGame,advance,command,project,finalize,changeMotive} from './core.js';
function night(room='大広間'){const s=createGame();advance(s,'start');for(let id=0;id<5;id++)command(s,id,{type:'plan',to:room});advance(s,'explore');return s;}
function next(s){advance(s,'next');if(s.phase==='night')advance(s,'explore');}
function dose(s,type,component='a',consumer='master'){let it=s.items.drink;Object.assign(it,{holder:0,room:null,consumed:false,poison:{type,component,actor:0}});if(consumer==='master')command(s,0,{type:'serve',itemId:'drink',to:'master'});else {it.holder=consumer;command(s,consumer,{type:'eat',itemId:'drink'});}}
test('C: imbalance kills after two boundaries, no vomit',()=>{const s=night('主人室');dose(s,'C');next(s);assert(s.master.alive);next(s);assert.equal(s.master.death.cause,'毒殺');assert(!s.master.traces.some(t=>t.kind==='吐瀉物'));});
test('C: balance cancels, later imbalance starts new timer',()=>{const s=night('主人室');dose(s,'C','a');dose(s,'C','b');next(s);next(s);assert(s.master.alive);dose(s,'C','a');next(s);assert(s.master.alive);next(s);assert(!s.master.alive);});
test('C on PC balances too',()=>{const s=night();dose(s,'C','a',0);dose(s,'C','b',0);next(s);next(s);assert.equal(s.players[0].required,3);});
test('antidote cancels pending and recovers sleep penalty only',()=>{const s=night();dose(s,'A','a',0);next(s);assert.equal(s.players[0].required,5);let ap=s.players[0].ap;dose(s,'antidote','a',0);assert.equal(s.players[0].required,3);assert.equal(s.players[0].ap,ap-1);});
test('sleep herb adds .5',()=>{const s=night();dose(s,'sleep','a',0);assert.equal(s.players[0].sleep,.5);});
test('rejected commands leave complete state unchanged',()=>{const s=night();s.phase='morning';s.step='individual';const old=structuredClone(s);assert.throws(()=>command(s,0,{type:'message',to:1,text:''}));assert.deepEqual(s,old);});
test('sleepers visible to awake roommate, can steal',()=>{const s=createGame();advance(s,'start');for(let id=0;id<5;id++)command(s,id,{type:'plan',to:'共同寝室',mode:id===0?'bed':'awake'});advance(s,'explore');assert.equal(project(s,1).status[0].sleeping,true);assert.equal(project(s,0).status[1].location,null);command(s,1,{type:'steal',otherId:0});assert.equal(s.items.personal_0_jewel.holder,1);});
test('cleaning removes blood, retains recoverable evidence',()=>{const s=night('主人室');command(s,4,{type:'kill'});command(s,4,{type:'wipe'});assert(!s.master.traces.some(t=>t.kind==='血痕'));assert(s.master.previousTraces.some(t=>t.kind==='血痕'));});
test('kill points awarded to corrected culprit using motive at death',()=>{const s=night('主人室');s.players[0].motive=s.players[4].motive='殺意';command(s,4,{type:'kill'});changeMotive(s,0,'金銭');s.phase='vote';s.verdict='事故死';finalize(s,{culprits:[0]});assert(s.events.some(e=>e.type==='MAIN_SCORE'&&e.actor===0&&e.data.points===5));assert(!s.events.some(e=>e.type==='MAIN_SCORE'&&e.actor===4));});
test('no remote invitation',()=>{const s=night();assert.throws(()=>command(s,0,{type:'invite',to:'庭園'}));});
test('joint play requires consent and splits AP',()=>{const s=night('娯楽室');command(s,0,{type:'go',otherId:1,pay:1});assert.equal(s.players[0].ap,15);const proposal=s.proposals[0];command(s,1,{type:'respondJoint',proposalId:proposal.id,accept:true});assert.equal(s.players[0].ap,14);assert.equal(s.players[1].ap,14);assert.equal(s.items.goBoard.state,'used');assert.equal(s.proposals.length,0);});
test('client cannot forge consent',()=>{const s=night('娯楽室');assert.throws(()=>command(s,0,{type:'go',otherId:1,accepted:true}));});
test('bell notifies at next planning, no broadcast history',()=>{const s=createGame();advance(s,'start');command(s,0,{type:'plan',to:'大広間',mode:'bell'});command(s,1,{type:'plan',to:'共同寝室',mode:'bed'});advance(s,'explore');assert(!s.players[2].clues.some(c=>c.kind==='警鐘'));advance(s,'next');assert(s.players[2].clues.some(c=>c.kind==='警鐘'));assert(!s.players[1].clues.some(c=>c.kind==='警鐘'));assert(!('lastBell' in project(s,1)));});
test('morning cannot inspect others inventories',()=>{const s=night();s.phase='morning';s.step='individual';assert.throws(()=>command(s,0,{type:'investigate',itemId:'personal_4_saber'}));});
test('invalid moves rejected even from hall',()=>{const s=createGame();advance(s,'start');assert.throws(()=>command(s,0,{type:'plan',to:'unknown'}));});
test('served PC food waits for consent and consumption',()=>{const s=night();Object.assign(s.items.drink,{room:null,holder:0,poison:{type:'A',actor:0}});command(s,0,{type:'serve',itemId:'drink',to:1});assert.equal(s.pendingEffects.length,0);command(s,1,{type:'eat',itemId:'drink'});assert.equal(s.pendingEffects.length,1);});
test('chair groups restrict evidence sharing',()=>{const s=night();s.phase='morning';s.step='talk';s.morning=1;s.players[0].clues=[{id:'a',text:'情報'}];command(s,0,{type:'conversation',partner:1});command(s,0,{type:'shareClue',clueId:'a'});assert(s.players[1].clues.some(c=>c.kind==='共有'));assert(!s.players[2].clues.some(c=>c.kind==='共有'));});

test('PL renderer handles all phases and joint proposal data',async()=>{
 const {readFile}=await import('node:fs/promises');const {createContext,runInContext}=await import('node:vm');
 const root={innerHTML:'',addEventListener(){}};
 const sandbox=createContext({document:{querySelector:()=>root},sessionStorage:{getItem:()=>null},location:{hash:''},URLSearchParams,setTimeout,console});
 runInContext(await readFile(new URL('./player.js',import.meta.url),'utf8'),sandbox);
 const s=night('娯楽室');command(s,0,{type:'go',otherId:1,pay:1});
 for(const [phase,step]of [['night','exploring'],['night','planning'],['morning','individual'],['morning','talk'],['vote','ballot']]){
  s.phase=phase;s.step=step;s.morning=1;sandbox.input=project(s,1);runInContext('view=input;render()',sandbox);assert(root.innerHTML.includes('連星館')||root.innerHTML.includes('タスク'));
 }
});
