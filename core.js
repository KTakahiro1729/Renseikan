import { GAME_DATA } from './data-loader.js';
export const RULES=GAME_DATA.rules;
export const COSTS=GAME_DATA.costs;
export const ROOMS=Object.fromEntries(GAME_DATA.rooms.map(r=>[r.name,r.floor]));
export const ROOM_NOTE=Object.fromEntries(GAME_DATA.rooms.map(r=>[r.name,r.description]));
export const CHARS=GAME_DATA.characters;
export const MOTIVES=GAME_DATA.motives;
export const DEFAULT_SCHEDULE=GAME_DATA.schedule;
export const DEFAULT_ITEMS=GAME_DATA.items;
export const TASK_TEMPLATES=GAME_DATA.tasks;
const enc=n=>String(n).padStart(2,'0');
export const clock=t=>`${enc((22+t-1)%24)}:00`;
export const charOf=id=>CHARS.find(c=>c.id===id);
export const uid=(prefix='id')=>`${prefix}_${Math.random().toString(36).slice(2,11)}`;
export function makeItem(row) {
 const {id,name,kind,room,value=0,lang='日本語',text='',...extra} = Array.isArray(row)?Object.fromEntries(['id','name','kind','room','value','lang','text'].map((k,i)=>[k,row[i]])):row;
 return {...extra,id,name,kind,room,holder:null,carrier:null,source:'manor',value,lang,text,
   state:'unused',previous:'unused',tampered:false,readBy:[],poison:null,poisoner:null, created:0};
}
function shuffle(a){for(let i=a.length-1;i>0;i--){let j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
export function createGame({schedule=DEFAULT_SCHEDULE, characters=CHARS.map(x=>x.id), trigger={type:'read',item:'secret',condition:'none'}, illness=8}={}){
 const players=characters.map((character,i)=>({id:i,character,motive:MOTIVES[Math.floor(Math.random()*MOTIVES.length)],target:null,
   location:'大広間',plan:null,ap:RULES.nightAP,sleep:0,required:RULES.requiredSleep,sleeping:false,readBooks:[],mainRead:[],
   exploredTarget:GAME_DATA.explorationTarget,inspected:[],bodyInspected:false,knownDevice:false,hasHerbGuide:character==='student',knownValues:[],
   hand:[],commonScore:0,mainScore:0,mainFlags:[],mainWorks:[],mainHistory:[],
   clues:[],messages:[],personalLog:[],completed:0,questionnaire:null,vote:null,forcedSleep:0,
   morningDone:false,invites:0,poisonPenalty:0,knowsDeath:false,restedTurn:0,actedTurn:0}));
 const charTargets=(p)=>players.filter(q=>q.id!==p.id && charOf(p.character).targets.includes(q.character));
 for(const p of players){if(['親密','嫌悪'].includes(p.motive)){const c=charTargets(p);p.target=c[Math.floor(Math.random()*c.length)]?.id??null;}}
 let items=Object.fromEntries(DEFAULT_ITEMS.map(x=>[x.id,makeItem(x)]));
 for(const p of players)for(const template of GAME_DATA.initialItems.filter(x=>x.character===p.character)){const item=makeItem({...template,id:`personal_${p.id}_${template.id}`,room:null});items[item.id]={...item,holder:p.id,source:'personal',ownerCharacter:p.character};}

 const deck=shuffle(TASK_TEMPLATES.flatMap(t=>Array.from({length:t.copies},(_,i)=>({...t,id:`${t.id}_${i}`}))));
 const state={schema:3,id:uid('room').slice(-7),rev:0,phase:'lobby',step:'planning',turn:0,morning:0,
  players,items,deck,events:[],nextSeq:1, gmNotes:'', settings:{schedule:[...schedule],illness,trigger},
  master:{alive:true,location:'大広間',schedule:[...schedule],invites:0,death:null,face:'平穏',hidden:false,bodyRoom:null,
   traces:[],lastInvitation:null,bodyCarrier:null},
  pendingEffects:[],lastBell:-100,bellHistory:[],hallHistory:[],deviceFired:false,
  verdict:null,runoffOptions:null,ballotRound:1,voteHistory:[],result:null};
 for(const p of players){ for(let i=0;i<4;i++)p.hand.push(state.deck.pop()); }
 log(state,'SESSION_CREATED',null,'ゲームを作成',{});
 return state;
}
export function log(s,type,actor,label,data={}){
 const ev={seq:s.nextSeq++,turn:s.turn,phase:s.phase,type,actor,label,data,clock:s.turn?clock(s.turn):null};
 s.events.push(ev);return ev;
}
export const ownItems=(s,id)=>Object.values(s.items).filter(x=>x.holder===id);
export const roomItems=(s,room)=>Object.values(s.items).filter(x=>x.room===room&&x.holder===null);
function moveValid(from,to){if(!Object.hasOwn(ROOMS,from)||!Object.hasOwn(ROOMS,to))return false;return ROOMS[from]===ROOMS[to]||from==='大広間'||to==='大広間';}
export const MOVE_VALID=moveValid;
export function availableMoves(s,id){return Object.keys(ROOMS).filter(r=>moveValid(s.players[id].location,r));}
export function mainCard(p,s){
 const target=p.target!=null?s.players[p.target]?.character:null;
 return {title:`${p.motive}型`,description:GAME_DATA.mainCards[p.motive]+(target?' 対象：'+charOf(target).name:'')+(p.motive==='探究'?' 指定物品：'+s.items[p.exploredTarget]?.name:'')};
}
export function project(s,id){
 const p=s.players[id]; const seen=new Set(p.clues.map(x=>x.itemId).filter(Boolean));
 const viewItems=Object.values(s.items).filter(it=>it.holder===id || (s.phase==='morning'?(it.room!==null||it.holder!==null):it.room===p.location));
 const status=s.players.map(q=>({id:q.id,character:q.character,
   location:q.id===id?q.location:(q.location===p.location&&!p.sleeping?q.location:null),
   isSelf:q.id===id,ready:q.id===id?!!q.plan:null,submittedVote:q.id===id?q.vote!==null:null,
   sleeping:q.id===id||q.location===p.location&&!p.sleeping?q.sleeping:null}));
 return {rev:s.rev,phase:s.phase,step:s.step,turn:s.turn,morning:s.morning,
  costs:COSTS,proposals:(s.proposals||[]).filter(x=>x.to===id&&x.turn===s.turn),conversation:s.conversation||[[0,1,2,3,4]],roomId:s.id,roomNote:ROOM_NOTE[p.location],clock:s.turn?clock(s.turn):'—',
  player:{...p,hand:p.hand.map(t=>({...t})),mainCard:mainCard(p,s)},
  masterPublic:p.knowsDeath ? {status:'死亡が確認されている',location:!p.sleeping&&s.master.bodyRoom===p.location&&!s.master.hidden?p.location:'不明'} :
    (s.master.alive&&s.master.location===p.location?{status:'生存',location:'同室'}:{status:'不明',location:'不明'}),
  items:viewItems.map(it=>({id:it.id,name:it.name,kind:it.kind,room:it.room,holder:it.holder,lang:it.lang,state:it.state,
    tampered:it.tampered,ingredient:!!it.effect,consumed:!!it.consumed})),
  knownItemIds:[...seen],status,legalMoves:availableMoves(s,id),
  waitingPlans:s.players.filter(x=>!x.plan).map(x=>x.id),
  eligibleVote:s.phase==='vote'? (s.runoffOptions||['0','1','2','3','4','事故死','病死']):[],
  roomNames:Object.keys(ROOMS),
  completedVotes:s.players.filter(x=>x.vote!==null).length,
  result:s.phase==='result'?s.result:null};
}
export function viewGM(s){return s;}
function clue(s,p,kind,text,itemId=null){
 p.clues.push({id:uid('clue'),turn:s.turn,kind,text,itemId});
}
function inform(s,room,actor,text,{quiet=false}={}){
 if(quiet)return;
 for(const p of s.players){if(p.id!==actor && p.location===room && !p.sleeping){
  clue(s,p,'目撃',`${s.players[actor] ? visibleName(s,actor):'不明な人物'}：${text}`);
 }}
}
function visibleName(s,id){return ownItems(s,id).some(x=>x.kind==='仮面')?'仮面の人物':charOf(s.players[id].character).name;}
function scoreCommon(s,p,kind,meta={}){
 let hits=[];for(const task of [...p.hand]){
  if(task.kind!==kind)continue;
  if(task.require==='foreign'&&!meta.foreign)continue;
  if(task.require==='used'&&!meta.used)continue;
  if(task.require==='book'&&!meta.book)continue;
  hits.push(task);
 }
 for(const t of hits){p.hand.splice(p.hand.findIndex(x=>x.id===t.id),1);p.commonScore+=t.points;p.completed++;
  clue(s,p,'タスク',`「${t.title}」達成：+${t.points}点`);
  log(s,'TASK_DONE',p.id,`通常タスク達成：${t.title}`,{task:t.id,points:t.points});
  if(s.deck.length)p.hand.push(s.deck.pop());
 }
}
function scoreMain(s,p,key,points){if(p.mainFlags.includes(key))return;
 p.mainFlags.push(key);p.mainScore+=points;
 log(s,'MAIN_SCORE',p.id,`メイン目標：${key} +${points}点`,{points,motive:p.motive});
 clue(s,p,'得点',`${key}：+${points}点`);
}
function expense(p,cost){if(!Number.isFinite(cost)||cost<0)throw Error('費用設定が不正');if(p.ap<cost)throw Error(`AP不足：必要${cost}pt／残${p.ap}pt`);p.ap-=cost;}
function describe(i){return i.descriptions?.[i.state]||`${i.name}：${i.state==='unused'?'使用された跡はない':i.state==='tampered'?'工作の痕跡がある':'使用された跡がある'}`;}
function touch(i){if(i.state==='unused'){i.previous=describe(i);i.state='used';}}
function contentFor(s,p,it){let msg=it.text||`${it.name}の記述。`;
 if(it.id==='secret')msg+=` 装置の設定：トリガー=${triggerLabel(s)}、追加条件=${conditionLabel(s)}。主人が主人室に単独でいる必要がある。`;
 if(it.id==='diary')msg+=` 書き手の裏切りが記され、あなたの目的を変える可能性がある。`;
 return msg;
}
export function triggerLabel(s){const t=s.settings.trigger;return ({read:`「${s.items[t.item]?.name||t.item}」を読む`,take:`「${s.items[t.item]?.name||t.item}」を持ち出す`,go:'囲碁を行う',billiards:'ビリヤードを行う',bell:'警鐘を鳴らす'})[t.type]||t.type;}
export function conditionLabel(s){const t=s.settings.trigger;return t.condition==='none'?'なし':t.condition==='time'?'午前0時〜午前4時':t.condition==='bedroom'?'共同寝室に2人':t.condition==='item'?`「${s.items[t.conditionItem]?.name||'特定物品'}」持ち出し中`:'未設定';}
function device(s,action,itemId,actor){const t=s.settings.trigger;
 if(t.type!==action || (['read','take'].includes(action)&&t.item!==itemId))return;
 if(t.condition==='time' && !(s.turn>=3 && s.turn<=7))return;
 if(t.condition==='bedroom'&&s.players.filter(p=>p.location==='共同寝室').length!==2)return;
 if(t.condition==='item'&&!s.items[t.conditionItem]?.carrier && s.items[t.conditionItem]?.carrier!==0)return;
 s.deviceFired=true; log(s,'DEVICE',actor,'鎧武者の遠隔装置が作動',{trigger:action,itemId});
 s.master.traces.push({kind:'device',turn:s.turn});
 if(!s.master.alive||s.master.location!=='主人室'||s.players.some(p=>p.location==='主人室'))return;
 let executor=s.players[actor],culprits=[],cause='事故死';
 if(executor.knownDevice){culprits=[actor];cause='遠隔殺害';}
 else{
  const induces=s.events.filter(e=>e.type==='INDUCE'&&e.data.target===actor&&e.data.trigger===action&&e.seq<s.nextSeq);
  if(induces.length){const last=induces.at(-1);culprits=[last.actor];cause='間接正犯';}
 }
 kill(s,cause,culprits,actor);
}
function kill(s,cause,culprits,actor,details={}){if(!s.master.alive)return;
 s.master.alive=false;s.master.bodyRoom=s.master.location;s.master.hidden=false;
 s.master.face=cause==='病死'?'平穏':cause==='毒殺'?'苦悶':cause==='近接殺害'?(s.players[actor]?.character==='heir'?'驚愕':'苦悶'):'驚愕';
 s.master.death={motives:s.players.map(p=>p.motive),cause,culprits:[...new Set(culprits)],at:s.turn,clock:clock(s.turn),actor};
 for(const p of s.players)if(p.location===s.master.bodyRoom&&!p.sleeping){p.knowsDeath=true;clue(s,p,'目撃','主人が死亡した。');}
 if(cause==='近接殺害'||cause==='遠隔殺害'||cause==='間接正犯'||cause==='事故死')s.master.traces.push({kind:'刺し傷',turn:s.turn},{kind:'血痕',turn:s.turn});
 if(cause==='毒殺'&&details.poisonType==='B'&&!s.master.traces.some(x=>x.kind==='吐瀉物'))s.master.traces.push({kind:'吐瀉物',turn:s.turn});
 log(s,'DEATH',actor,`館主死亡（GM非公開：${cause}）`,{cause,culprits});

}
function ingest(s,consumer,food){if(!food.poison)return;
 const type=food.poison.type;
 if(!['A','B'].includes(type))throw Error('未対応の毒です');
 const effect={target:consumer,type,due:s.turn+(type==='A'?1:2),poisoner:food.poison.actor,
  active:true};
 s.pendingEffects.push(effect);
 log(s,'POISON_INGEST',food.poison.actor,'毒物が摂取された',{consumer,type,due:effect.due});
 if(consumer!=='master'){
  let instigator=s.players[food.poison.actor];if(instigator.motive==='嫌悪'&&instigator.target===consumer)scoreMain(s,instigator,'嫌悪対象に毒を摂取させる',RULES.poisonPoints);
 }
}
function consumeFood(s,item,consumer){
 if(consumer!=='master'&&item.servedBy!=null){const chef=s.players[item.servedBy];if(chef.motive==='親密'&&chef.target===consumer&&item.name==='手料理')scoreMain(s,chef,'対象に料理を振る舞う',RULES.affinityPoints);}
 item.room=consumer==='master'?s.master.location:s.players[consumer].location;item.holder=null;item.carrier=null;
 item.state='used';item.consumed=true;
 if(item.poison?.type==='sleep'){if(consumer!=='master')s.players[consumer].sleep+=0.5;}
 else if(item.poison?.type==='antidote'){
  for(const e of s.pendingEffects)if(e.target===consumer)e.active=false;
  const target=consumer==='master'?s.master:s.players[consumer];
  if(consumer!=='master'){target.required-=target.poisonPenalty;target.poisonPenalty=0;}
 }else ingest(s,consumer,item);
}
function foodAtMaster(s){if(!s.master.alive)return;
 const foods=roomItems(s,s.master.location).filter(i=>i.kind==='飲食物'&&!i.consumed);
 for(const food of foods){log(s,'MASTER_EATS',null,`主人が${food.name}を食べた`,{item:food.id});consumeFood(s,food,'master');}
}
function poisonBoundary(s){for(const effect of s.pendingEffects){if(!effect.active||effect.due>s.turn)continue;effect.active=false;
  if(effect.target==='master'){if(s.master.alive){
    kill(s,'毒殺',effect.poisoner!=null?[effect.poisoner]:[],effect.poisoner,{poisonType:effect.type});
  }}else{
    const p=s.players[effect.target];p.poisonEpisodes??=[];p.poisonEpisodes.push(effect.type);p.ap=Math.max(0,p.ap-5);p.required+=2;p.poisonPenalty+=2;
    log(s,'POISON_EFFECT',effect.target,'毒の発症：AP−5、必要睡眠+2',{type:effect.type});
  }
 }}
function chooseMaster(s){if(!s.master.alive)return;s.master.location=s.master.schedule[s.turn-1]||'主人室';log(s,'NPC_MOVE',null,'主人が予定に従い移動',{to:s.master.location});foodAtMaster(s);}
function specialMotiveChange(s,p){if(p.mainHistory.some(x=>x.type==='diaryChanged'))return;
 if(Math.random()<0.5){const candidates=MOTIVES.filter(x=>x!==p.motive);const m=candidates[Math.floor(Math.random()*candidates.length)];changeMotive(s,p.id,m,null);
  p.mainHistory.push({type:'diaryChanged',turn:s.turn});}}
export function changeMotive(s,id,motive,target){const p=s.players[id],before=p.motive;
 if(!MOTIVES.includes(motive))throw Error('不正な目的型');
 p.mainHistory.push({type:'motive',before,after:motive,turn:s.turn,score:p.mainScore});
 p.motive=motive;p.mainFlags=[];p.mainRead=[];p.mainWorks=[];
 if(['親密','嫌悪'].includes(motive)){
  const targets=s.players.filter(q=>q.id!==id&&charOf(p.character).targets.includes(q.character));
  p.target=target!=null?Number(target):(targets[0]?.id??null);
 }else p.target=null;
 log(s,'MOTIVE_CHANGED',id,`目的型変更：${before} → ${motive}`,{target:p.target});
 clue(s,p,'秘密',`目的が${motive}型に変更された。過去の得点は保持される。`);
}
function advanceInternal(s,op){
 if(op==='start'){
  if(s.phase!=='lobby')throw Error('既に開始しています');updateMasterSchedule(s,s.master.schedule);s.phase='night';s.turn=1;s.step='planning';
  log(s,'START',null,'夜の探索を開始');return;
 }
 if(op==='explore'){
  if(s.phase!=='night'||s.step!=='planning')throw Error('移動計画中ではありません');
  for(const p of s.players)if(!p.plan)p.plan={to:p.location,mode:'awake'};
  s.step='exploring';s.deviceFired=false;s.proposals=[];
  for(const p of s.players)if(p.plan.mode==='bell'){const old=p.location;p.location='大広間';p.sleeping=false;log(s,'BELL_MOVE',p.id,'鐘を鳴らすため一足早く大広間へ移動',{old,to:p.location});ringBell(s,p.id);}
  chooseMaster(s);
  for(const p of s.players){const old=p.location;p.location=p.plan.to;p.sleeping=['bed','sofa'].includes(p.plan.mode);
   log(s,'MOVE',p.id,`${old} → ${p.location}${p.sleeping?'（睡眠）':''}`,{old,to:p.location,mode:p.plan.mode});
  }
  if(s.master.bodyCarrier!==null){const carrier=s.players[s.master.bodyCarrier];s.master.bodyRoom=carrier.location;s.master.hidden=true;
   log(s,'BODY_MOVE',carrier.id,'遺体を移送し、隠した',{room:carrier.location});s.master.bodyCarrier=null;}
  for(const p of s.players)if(!p.sleeping&&!s.master.alive&&!s.master.hidden&&p.location===s.master.bodyRoom&&!p.knowsDeath){p.knowsDeath=true;clue(s,p,'遺体発見','この部屋に遺体がある。');}
  poisonBoundary(s);
  const hall=s.players.filter(x=>x.location==='大広間').map(x=>x.id);
  s.hallHistory.push({turn:s.turn,people:hall});
  for(const p of s.players){p.plan=null;}
  log(s,'EXPLORE',null,`T${s.turn}探索開始・主人は${s.master.location}`);return;
 }
 if(op==='next'){
  if(s.phase!=='night'||s.step!=='exploring')throw Error('探索中ではありません');
  if(s.master.alive&&s.turn===s.settings.illness)kill(s,'病死',[],null);
  const bed=s.players.filter(x=>x.location==='共同寝室').length;
  for(const p of s.players){if(!p.sleeping)continue;
    const thefts=s.events.filter(x=>x.turn===s.turn&&x.type==='STEAL');const disruptive=thefts.some(x=>s.players[x.actor]?.character!=='actor');
    const anotherStolen=s.events.some(x=>x.turn===s.turn&&x.type==='STEAL'&&x.data.victim!==p.id);
    const actor=charOf(p.character).id==='actor';
    let amount=p.location==='大広間'?0.5:
      (s.deviceFired||bed>=3||disruptive||(actor&&anotherStolen))?0.5:1;
    p.sleep+=amount; log(s,'SLEEP',p.id,`睡眠 +${amount}`,{amount,total:p.sleep});
  }
  for(const p of s.players)p.sleeping=false;
  if(s.turn>=8){startMorning(s);return;}
  s.turn++;s.step='planning';
  log(s,'TURN',null,`T${s.turn}：移動先を決定`);return;
 }
 if(op==='talk'){
  if(s.phase!=='morning'||s.step!=='individual')throw Error('個別行動中ではありません');
  s.conversation=[[0,1,2,3,4]];s.step='talk';log(s,'TALK',null,`朝${s.morning}：会話開始`);return;
 }
 if(op==='nextMorning'){
  if(s.phase!=='morning'||s.step!=='talk')throw Error('会話中ではありません');
  if(s.morning>=5){s.phase='vote';s.ballotRound=1;s.step='ballot';s.players.forEach(p=>p.vote=null);log(s,'VOTE_START',null,'最終投票を開始');return;}
  s.morning++;s.step='individual';morningForcedSleep(s);
  log(s,'MORNING_PHASE',null,`朝${s.morning}：個別行動開始`);return;
 }
 throw Error('未知の進行操作');
}
function startMorning(s){s.phase='morning';s.step='individual';s.morning=1;
 s.players.forEach(p=>p.ap+=RULES.morningAP);morningForcedSleep(s);log(s,'MORNING_START',null,'朝の議論開始');}
function morningForcedSleep(s){for(const p of s.players){p.morningDone=false;
 if(p.sleep+1e-7<p.required){p.sleep+=1;p.forcedSleep++;p.morningDone=true;
  clue(s,p,'睡眠',`朝${s.morning}の個別行動は強制睡眠。現在${p.sleep}/${p.required}`);
  log(s,'FORCED_SLEEP',p.id,'睡眠不足のため個別行動を消費');}
 }}
function ringBell(s,id){if(s.lastBell+2>=s.turn)throw Error('警鐘はあと2ターン使用できません');
 s.lastBell=s.turn;s.bellHistory.push({turn:s.turn,id});
 log(s,'BELL',id,`${visibleName(s,id)}が警鐘を鳴らした`);
 for(const p of s.players){if(!p.sleeping&&!['共同寝室','地下室'].includes(p.location))clue(s,p,'警鐘',`T${s.turn}の移動前に鐘が鳴った。`);}
 device(s,'bell',null,id);
}
function doNightAction(s,id,cmd){const p=s.players[id];
 if(s.phase!=='night'||s.step!=='exploring'||p.sleeping||p.restedTurn===s.turn)throw Error('探索行動を実行できません');
 const {type,itemId,to,otherId,poisonId,face}=cmd;
 const it=itemId?s.items[itemId]:null, other=Number.isInteger(otherId)?s.players[otherId]:null;
 const requireIt=()=>{if(!it)throw Error('物品がありません');};
 const accessible=()=>it&&(it.holder===id||it.room===p.location);
 const canRoom=room=>{if(p.location!==room)throw Error(`${room}でのみ実行可能`);};
 const canMaster=()=>s.master.alive&&s.master.location===p.location;
 const take=()=>{
  requireIt();if(it.kind==='設備'||it.room!==p.location||it.holder!==null)throw Error('この場所にありません');
  if(p.location==='主人室'&&canMaster())throw Error('主人がいる間は物品を持ち出せません');
  expense(p,COSTS[type]);p.inspected??=[];if(!p.inspected.includes(itemId))p.inspected.push(itemId);clue(s,p,'客観証拠',describe(it),itemId);it.room=null;it.holder=id;it.carrier=id;touch(it);
  log(s,'TAKE',id,`${it.name}を持ち出した`,{itemId});scoreCommon(s,p,'take',{book:it.kind==='書籍'});if(p.motive==='探究'&&p.exploredTarget===it.id)scoreMain(s,p,'指定物品の入手',RULES.targetItemPoints);inform(s,p.location,id,`${it.name}を取得`);device(s,'take',itemId,id);
 };
 if(p.location==='主人室'&&canMaster()&&['inspect','deep','read','tamper','blade','jointRead'].includes(type))throw Error('主人が在室中は物品操作できません');
 switch(type){
 case 'eat':{requireIt();if(it.holder!==id||it.kind!=='飲食物'||it.consumed)throw Error('飲食物が必要');expense(p,COSTS[type]);consumeFood(s,it,id);log(s,'EAT',id,'飲食した',{itemId});break;}
 case 'sleepInspect':{if(!other||!other.sleeping||other.location!==p.location||p.location!=='共同寝室')throw Error('同室の睡眠者が必要');clue(s,p,'睡眠者',ownItems(s,other.id).map(x=>`${x.id}: ${x.name}`).join('、')||'所持品なし');log(s,'SLEEP_INSPECT',id,'睡眠者を調べた',{otherId});break;}
 case 'fireplace':{canRoom('主人室');expense(p,COSTS[type]);clue(s,p,'客観証拠','暖炉には燃え残った薪がある。');log(s,'FIREPLACE',id,'暖炉を調査');break;}
 case 'askMoney':{if(!canMaster())throw Error('主人が同室ではありません');if(p.askedMoney)throw Error('既に金品を受け取っています');expense(p,COSTS[type]);p.askedMoney=true;const gift=makeItem({id:uid('gift'),name:'主人からの小遣い',kind:'金銭',room:null,value:GAME_DATA.rules.giftValue});gift.holder=id;gift.source='gift';s.items[gift.id]=gift;log(s,'GIFT',id,'主人に金品をねだった');break;}
 case 'tamper':{requireIt();if(it.tampered)throw Error('既に工作済みです');if(!accessible())throw Error('対象がありません');expense(p,GAME_DATA.rules.tamperAP);it.previous=describe(it);it.state='tampered';it.tampered=true;log(s,'TAMPER',id,'物品の痕跡を工作',{itemId});break;}

 case 'rest':{canRoom('庭園');if(p.actedTurn===s.turn)throw Error('休息するターンには他の探索行動を実行できません');p.ap+=2;p.restedTurn=s.turn;log(s,'REST',id,'庭園で休み、AP+2');break;}
 case 'roomSearch':{expense(p,COSTS[type]);if(!s.master.alive&&s.master.hidden&&s.master.bodyRoom===p.location){s.master.hidden=false;p.knowsDeath=true;clue(s,p,'遺体発見','この部屋の隠し場所で遺体を発見した。');log(s,'BODY_DISCOVERY',id,'隠された遺体を発見');}else clue(s,p,'探索','部屋の隠し場所を調べたが、遺体は見つからなかった。');break;}
 case 'inspect':{requireIt();if(!accessible())throw Error('物品がありません');expense(p,COSTS[type]);p.inspected??=[];if(!p.inspected.includes(itemId))p.inspected.push(itemId);
  const deep=p.character==='writer';
  clue(s,p,'客観証拠',`${describe(it)}${deep&&it.state!=='unused'?'／過去の描写：'+it.previous:''}`,itemId);
  log(s,'INSPECT',id,`${it.name}を調べた`,{itemId});scoreCommon(s,p,'inspect',{used:it.state!=='unused'});inform(s,p.location,id,`${it.name}を調査`);break;}
 case 'deep':{requireIt();if(!p.inspected?.includes(itemId))throw Error('先に通常調査が必要です');if(!accessible()||it.state==='unused')throw Error('精査できません');expense(p,COSTS[type]);
  clue(s,p,'客観証拠',`${it.name}の以前の描写：${it.previous}。${it.tampered?'証拠工作の痕跡が残っている。':''}`,itemId);
  log(s,'DEEP',id,`${it.name}を深く調べた`,{itemId});break;}
 case 'take':take();break;
 case 'read':{
  requireIt();if(it.kind!=='書籍'||!accessible())throw Error('読めません');
  if(it.lang!=='日本語'&&!charOf(p.character).lang.includes(it.lang)&&!ownItems(s,id).some(x=>x.id==='dict'))throw Error('この言語を読めません');
  const cost=it.lang==='日本語'?COSTS.readJapanese:COSTS.readForeign;expense(p,cost);touch(it);if(!it.readBy.includes(id))it.readBy.push(id);
  p.readBooks.push(...(p.readBooks.includes(itemId)?[]:[itemId]));
  clue(s,p,'書籍',`${it.name}：${contentFor(s,p,it)}`,itemId);
  log(s,'READ',id,`${it.name}を読んだ`,{itemId,lang:it.lang});scoreCommon(s,p,'read',{foreign:it.lang!=='日本語'});inform(s,p.location,id,`${it.name}を読んだ`);
  if(it.id==='secret')p.knownDevice=true;
  if(it.id==='herbal')p.hasHerbGuide=true;
  if(it.id.startsWith('price'))p.knownValues.push(it.id);

  if(p.motive==='探究'&&!p.mainRead.includes(itemId)){p.mainRead.push(itemId);scoreMain(s,p,`書籍を読む：${itemId}`,RULES.readPoints);}
  device(s,'read',itemId,id);if(it.id==='diary')specialMotiveChange(s,p);break;}
 case 'place':{requireIt();if(it.holder!==id)throw Error('所持していません');it.holder=null;it.room=p.location;it.carrier=null;touch(it);
  log(s,'PLACE',id,`${it.name}を${p.location}へ配置`,{itemId});scoreCommon(s,p,'place');inform(s,p.location,id,`${it.name}を置いた`);foodAtMaster(s);break;}
 case 'give':{requireIt();if(it.holder!==id||!other||other.id===id||other.location!==p.location||other.sleeping)throw Error('譲渡先が同室にいません');
  it.holder=other.id;touch(it);log(s,'GIVE',id,`${other.id+1}番へ${it.name}を渡した`,{itemId,to:other.id});
  scoreCommon(s,p,'give');inform(s,p.location,id,`${it.name}を譲渡`);
  if(other.motive==='探究'&&other.exploredTarget===itemId)scoreMain(s,other,'指定物品の入手',RULES.targetItemPoints);
  break;}
 case 'harvest':{requireIt();if(it.kind!=='植物'||it.room!==p.location)throw Error('採取できません');expense(p,COSTS[type]);
  const newIt={...it,id:uid('picked'),room:null,holder:id,carrier:id,source:'harvest',created:s.turn};s.items[newIt.id]=newIt;
  log(s,'HARVEST',id,`${it.name}を採取`,{itemId:newIt.id});scoreCommon(s,p,'harvest');inform(s,p.location,id,`${it.name}を採取`);break;}
 case 'guard':{canRoom('大広間');expense(p,COSTS[type]);
  const last=s.hallHistory.filter(x=>x.turn>=s.turn-1).map(x=>`T${x.turn}: ${x.people.map(i=>i+1).join(',')||'なし'}`).join('／');
  clue(s,p,'守衛',`主人の予定：${s.master.schedule.map((loc,i)=>`T${i+1} ${loc}`).join('、')}。大広間記録：${last}。警鐘：${s.bellHistory.map(x=>`T${x.turn} ${x.id+1}番`).join('、')||'なし'}`);
  log(s,'GUARD',id,'守衛に尋ねた');scoreCommon(s,p,'guard');inform(s,p.location,id,'守衛に質問');break;}
 case 'armor':{canRoom('主人室');expense(p,COSTS[type]);clue(s,p,'調査','鎧武者の内部に不可解な仕掛けがある。');
  log(s,'ARMOR',id,'鎧武者を調査');scoreCommon(s,p,'armor');break;}
 case 'blade':{canRoom('主人室');if(canMaster())throw Error('館主が在室中');if(!ownItems(s,id).some(x=>x.kind==='工具'))throw Error('工具が必要');
  expense(p,COSTS[type]);const sword=s.items.sword;if(sword.holder!==null)throw Error('剣は既にない');sword.room=null;sword.holder=id;sword.carrier=id;touch(sword);
  log(s,'TAKE_BLADE',id,'鎧武者の剣を取り外す');inform(s,p.location,id,'剣を外した');break;}
 case 'cook':case 'tea':{canRoom('食堂');expense(p,COSTS[type]);
  const obj=makeItem([uid('food'),type==='cook'?'手料理':'淹れたお茶','飲食物',null,0]);obj.holder=id;obj.source='crafted';obj.created=s.turn;s.items[obj.id]=obj;
  log(s,'COOK',id,`飲食物を調理：${obj.name}`,{itemId:obj.id});scoreCommon(s,p,type);inform(s,p.location,id,'調理をした');break;}
 case 'mix':{requireIt();const poison=s.items[poisonId];if(it.consumed||it.holder!==id||it.kind!=='飲食物'||!poison||poison.holder!==id||!['A','B','sleep','antidote'].includes(poison.effect))throw Error('混入条件を満たしていません');
  if(it.poison)throw Error('混入済み');expense(p,RULES.mixAP);
  const kind=poison.effect;
  it.poison={type:kind,actor:id};
  poison.holder=null;poison.room=null;poison.carrier=null;touch(it);
  log(s,'MIX',id,'飲食物へ薬品を混入',{itemId,type:kind});break;}
 case 'serve':{requireIt();if(it.consumed||it.holder!==id||it.kind!=='飲食物')throw Error('飲食物を所持していません');
  let consumer=to==='master'?'master':Number(to);
  if(consumer==='master'&&!canMaster())throw Error('主人が同室ではありません');
  if(consumer!=='master'&&(!s.players[consumer]||s.players[consumer].location!==p.location||s.players[consumer].sleeping))throw Error('相手がいません');
  log(s,'SERVE',id,`${it.name}を${consumer==='master'?'主人':consumer+1+'番'}へ渡した`,{itemId,consumer});
  if(consumer==='master')consumeFood(s,it,consumer);else{it.holder=consumer;it.room=null;it.servedBy=id;}scoreCommon(s,p,'serve');

  break;}
 case 'go':case 'billiards':case 'jointRead':{
  if(cmd.otherId==='master'){
   if(type==='jointRead'||p.location!=='娯楽室'||!canMaster())throw Error('主人と対局できません');
   expense(p,COSTS[type]);const winner=gameWinner(s,type,id,'master');touch(s.items[type==='go'?'goBoard':'billiardTable']);clue(s,p,'対局',`${type==='go'?'囲碁':'ビリヤード'}：${winner===id?'あなた':'主人'}の勝ち`);scoreCommon(s,p,type);log(s,'JOINT',id,'主人と対局',{kind:type,winner});device(s,type,null,id);break;
  }

  if(!other||other.id===id||other.location!==p.location||other.sleeping||other.restedTurn===s.turn)throw Error('一緒に行動する相手がいません');
  if(type==='jointRead'){
    requireIt();if(it.kind!=='書籍'||!accessible())throw Error('書籍が必要');
    for(const who of [p,other])if(it.lang!=='日本語'&&!charOf(who.character).lang.includes(it.lang)&&!ownItems(s,who.id).some(x=>x.id==='dict'))throw Error('いずれかが外国語を読めません');
  }else canRoom('娯楽室');
  const cost=type==='jointRead'?(it.lang==='日本語'?RULES.jointReadJapanese:RULES.jointReadForeign):COSTS[type];
  const pay=cmd.pay??cost;
  if(!Number.isInteger(pay)||pay<0||pay>cost)throw Error('費用分担が不正');
  if(!cmd.accepted){
   if(p.ap<pay||other.ap<cost-pay)throw Error('参加者のAP不足');
   s.proposals??=[];s.proposals.push({id:uid('joint'),from:id,to:other.id,turn:s.turn,command:{type,itemId,otherId:other.id,pay}});log(s,'PROPOSE',id,'共同行動を提案',{to:other.id,type});return;
  }
  expense(p,pay);expense(other,cost-pay);other.actedTurn=s.turn;
  // 原則2AP。共同読書は言語に応じ1/2APとする試作上の仮定。

  if(type!=='jointRead'){const board=s.items[type==='go'?'goBoard':'billiardTable'];touch(board);const winner=gameWinner(s,type,id,other.id);for(const q of [p,other])clue(s,q,'対局',`${type==='go'?'囲碁':'ビリヤード'}：${visibleName(s,winner)}の勝ち`);}
  if(type==='jointRead'){
   for(const q of [p,other]){if(!it.readBy.includes(q.id))it.readBy.push(q.id);
    if(!q.readBooks.includes(it.id))q.readBooks.push(it.id);
    clue(s,q,'書籍',`${it.name}：${contentFor(s,q,it)}`,it.id);
    if(it.id==='secret')q.knownDevice=true;
    if(q.motive==='探究'&&!q.mainRead.includes(it.id)){q.mainRead.push(it.id);scoreMain(s,q,`読書：${it.id}`,RULES.readPoints);}
   }
   touch(it);
  }
  log(s,'JOINT',id,`${other.id+1}番と${type==='go'?'囲碁':type==='billiards'?'ビリヤード':'共同読書'}をした`,{kind:type,otherId,itemId});
  if(type!=='jointRead'||it.entertainment){scoreCommon(s,p,type);scoreCommon(s,other,type);}
  if((type!=='jointRead'||it.entertainment)&&p.motive==='親密'&&p.target===other.id)scoreMain(s,p,`${type}を共にする`,RULES.affinityPoints);
  if((type!=='jointRead'||it.entertainment)&&other.motive==='親密'&&other.target===p.id)scoreMain(s,other,`${type}を共にする`,RULES.affinityPoints);
  inform(s,p.location,id,'共同で遊んだ／読んだ');device(s,type==='jointRead'?'read':type,itemId,id);if(type==='jointRead'&&it.id==='diary')for(const q of [p,other])specialMotiveChange(s,q);break;}
 case 'kill':{if(!canMaster())throw Error('主人が同室ではありません');const weapon=ownItems(s,id).find(x=>x.kind==='凶器');if(!weapon)throw Error('凶器が必要');expense(p,COSTS[type]);
  kill(s,'近接殺害',[id],id);touch(weapon);log(s,'KILL',id,'近接殺害を行った',{weapon:weapon.id});inform(s,p.location,id,'主人を殺害した');break;}
 case 'body':case 'deepBody':case 'face':case 'hide':case 'moveBody':case 'wipe':{
  if(s.master.alive||s.master.bodyRoom!==p.location)throw Error('この部屋に遺体がありません');
  if(type==='moveBody'&&s.turn===8)throw Error('最後のターンでは次の移動先がありません');
  if(type==='deepBody'&&!p.bodyInspected)throw Error('先に遺体の通常調査が必要です');
  if(type==='wipe'&&s.master.cleaned)throw Error('既に清掃済みです');
  if(type==='body')p.bodyInspected=true;
  const cost=COSTS[type];expense(p,cost);
  if(type==='body'||type==='deepBody')clue(s,p,'検死',`遺体：${s.master.face}の表情。${s.master.traces.map(x=>x.kind).join('、')||'目立つ痕跡なし'}。${type==='deepBody'||p.character==='writer'?'以前の痕跡：'+(s.master.previousTraces||s.master.traces).map(x=>x.kind).join('、'):''}${ownItems(s,id).some(x=>x.id==='forensic')?'／死亡：夜の'+(s.master.death.at<=4?'前半':'後半')+'。刺し傷は死亡時のもの。':''}`);
  if(type==='face'){if(!['平穏','苦悶','驚愕','笑い'].includes(face))throw Error('表情が不正');s.master.face=face;s.master.traces.push({kind:'表情の工作',turn:s.turn});}
  if(type==='hide')s.master.hidden=true;
  if(type==='moveBody'){s.master.hidden=true;s.master.bodyCarrier=id;s.master.bodyRoom=null;}
  if(type==='wipe'){s.master.cleaned=true;s.master.previousTraces=structuredClone(s.master.traces);s.master.traces=s.master.traces.filter(x=>!['血痕','吐瀉物'].includes(x.kind));s.master.traces.push({kind:'清掃の痕跡',turn:s.turn});}
  log(s,'BODY',id,`遺体への行為：${type}`,{kind:type});scoreCommon(s,p,({body:'body',face:'face',wipe:'wipe'})[type]||'none');
  if(p.motive==='殺意'&&['face','hide','moveBody','wipe'].includes(type)&&p.mainWorks.length<2&&!p.mainWorks.includes(type)){
   const category=['hide','moveBody'].includes(type)?'遺体の隠匿・移送':type;
   if(!p.mainWorks.includes(category)){p.mainWorks.push(category);scoreMain(s,p,`工作：${category}`,RULES.workPoints);}
  }break;}
 case 'steal':{canRoom('共同寝室');if(!other||other.id===id||!other.sleeping||other.location!=='共同寝室')throw Error('対象は睡眠中である必要があります');
  const possessions=ownItems(s,other.id);if(!possessions.length)throw Error('盗む品がありません');expense(p,COSTS[type]);const target=cmd.itemId?possessions.find(x=>x.id===cmd.itemId):possessions[0];if(!target)throw Error('対象の所持品ではありません');touch(target);target.holder=id;
  log(s,'STEAL',id,`${other.id+1}番から物品を盗む`,{victim:other.id,itemId:target.id});
  if(p.motive==='嫌悪'&&p.target===other.id)scoreMain(s,p,'嫌悪対象から盗む',RULES.theftPoints);break;}
 case 'invite':{if(!canMaster())throw Error('主人が同室ではありません');if(s.master.invites>=2||!s.master.alive)throw Error('主人はこれ以上招待に応じません');expense(p,RULES.inviteAP);
  if(!s.master.schedule.some((x,i)=>i>=s.turn&&x==='主人室'))throw Error('変更可能な主人室の予定がありません');
  if(!Object.hasOwn(ROOMS,to)||to==='主人室')throw Error('主人室以外の招待先を指定してください');
  s.master.invites++;
  // 未来の在室予定を先頭から1枠変更する。即時移動はしない。
  const idx=s.master.schedule.findIndex((x,i)=>i>=s.turn&&x==='主人室');
  if(idx>=0)s.master.schedule[idx]=ROOMS.hasOwnProperty(to)?to:p.location;
  const destination=ROOMS.hasOwnProperty(to)?to:p.location;
  // Only the future schedule changes; the NPC remains here this turn.
  log(s,'INVITE',id,`主人を${destination}へ誘った`,{consumedSlot:idx+1});scoreCommon(s,p,'invite');break;}
 case 'induce':{if(!p.knownDevice)throw Error('この装置についての知識が必要です');if(!other||other.id===id||other.location!==p.location||other.sleeping)throw Error('対象が同室にいません');
  log(s,'INDUCE',id,`${other.id+1}番を特定の行動へ誘導`,{target:other.id,trigger:s.settings.trigger.type});
  clue(s,p,'申告用',`T${s.turn}に${other.id+1}番を誘導した。`);break;}
 default: throw Error('未実装の行動：'+type);
 }
 p.actedTurn=s.turn;
}
function commandInternal(s,id,cmd){
 if(!Number.isInteger(id)||id<0||id>=5)throw Error('人物番号が不正です');const p=s.players[id];
 if(cmd.accepted)throw Error('不正な承諾フラグ');
 if(cmd.type==='respondJoint'){
  const proposal=s.proposals?.find(x=>x.id===cmd.proposalId&&x.to===id);
  if(!proposal||proposal.turn!==s.turn||s.phase!=='night'||s.step!=='exploring')throw Error('有効な提案がありません');
  if(cmd.accept)doNightAction(s,proposal.from,{...proposal.command,accepted:true});
  s.proposals=s.proposals.filter(x=>x.id!==proposal.id);return;
 }
 if(cmd.type==='conversation'){
  if(s.phase!=='morning'||s.step!=='talk'||id!==s.morning-1)throw Error('議長が会話中に選択します');
  const partner=cmd.partner===null?null:Number(cmd.partner);
  if(partner!==null&&(!Number.isInteger(partner)||partner<0||partner>4||partner===id))throw Error('相手が不正');
  s.conversation=partner===null?[[0,1,2,3,4]]:[[id,partner],[0,1,2,3,4].filter(x=>x!==id&&x!==partner)];log(s,'GROUPS',id,'会話の組分けを決定',{groups:s.conversation});return;
 }
 if(cmd.type==='shareClue'){
  if(s.phase!=='morning'||s.step!=='talk')throw Error('朝の会話中のみ共有できます');
  const evidence=p.clues.find(x=>x.id===cmd.clueId);if(!evidence)throw Error('所持していない情報');
  const group=(s.conversation||[[0,1,2,3,4]]).find(g=>g.includes(id));
  for(const target of group)if(target!==id)clue(s,s.players[target],'共有',`${visibleName(s,id)}から：${evidence.text}`,evidence.itemId);
  log(s,'SHARE',id,'情報を共有',{clueId:cmd.clueId,recipients:group});return;
 }
 if(cmd.type==='plan'){
  if(s.phase!=='night'||s.step!=='planning')throw Error('現在は移動選択中ではありません');
  if(!moveValid(p.location,cmd.to))throw Error('大広間経由の移動規則に違反');
  const mode=cmd.mode||'awake';if(!['awake','bed','sofa','bell'].includes(mode))throw Error('選択が不正です');
  if(mode==='bed'&&cmd.to!=='共同寝室')throw Error('共同寝室へ移動する必要があります');
  if((mode==='sofa'||mode==='bell')&&cmd.to!=='大広間')throw Error('大広間へ移動する必要があります');
  p.plan={to:cmd.to,mode};log(s,'PLAN',id,'次ターンの移動を提出',{to:cmd.to,mode});return;
 }
 if(cmd.type==='discard'){
  const index=p.hand.findIndex(t=>t.id===cmd.taskId);if(index<0)throw Error('手札にありません');
  if(s.phase!=='night'||s.step!=='exploring'||p.sleeping)throw Error('夜の探索中のみ破棄できます');
  expense(p,COSTS.discard);const [task]=p.hand.splice(index,1);if(s.deck.length)p.hand.push(s.deck.pop());
  log(s,'DISCARD',id,`通常タスクを破棄：${task.title}`);return;
 }
 if(cmd.type==='vote'){
  if(s.phase!=='vote')throw Error('投票時間ではありません');
  const allowed=s.runoffOptions||['0','1','2','3','4','事故死','病死'];
  if(!allowed.includes(String(cmd.value)))throw Error('不正な投票先');p.vote=String(cmd.value);
  log(s,'BALLOT',id,'投票を提出',{round:s.ballotRound});return;
 }
 if(cmd.type==='questionnaire'){
  if(!['morning','vote'].includes(s.phase))throw Error('申告できる時点ではありません');
  p.questionnaire={near:!!cmd.near,remote:!!cmd.remote,remoteText:String(cmd.remoteText||''),indirect:!!cmd.indirect,indirectText:String(cmd.indirectText||'')};
  log(s,'QUESTIONNAIRE',id,'非公開申告を提出');return;
 }
 if(s.phase==='morning'&&s.step==='individual'){
  if(p.morningDone)throw Error('個別行動は終了しています');
  if(cmd.type==='message'){
   const dest=s.players[Number(cmd.to)];if(!dest||dest.id===id)throw Error('宛先が不正');expense(p,COSTS.message);
   const text=String(cmd.text||'').slice(0,1200).trim();if(!text)throw Error('本文が空');
   dest.messages.push({from:id,text,turn:s.morning});p.morningDone=true;scoreCommon(s,p,'send');
   log(s,'MESSAGE',id,`${dest.id+1}番へ一方向メッセージ`,{to:dest.id});return;
  }
  if(cmd.type==='investigateBody'){
  if(s.master.alive)throw Error('遺体がありません');if(cmd.deep&&!p.bodyInspected)throw Error('先に遺体の通常調査が必要です');p.bodyInspected=true;expense(p,cmd.deep&&p.character!=='writer'?COSTS.inspect+COSTS.deep:COSTS.inspect);
  clue(s,p,'検死',`遺体：${s.master.face}。${s.master.traces.map(x=>x.kind).join('、')}。${cmd.deep||p.character==='writer'?'以前の痕跡：'+(s.master.previousTraces||s.master.traces).map(x=>x.kind).join('、'):''}${ownItems(s,id).some(x=>x.id==='forensic')?'／死亡は夜の'+(s.master.death.at<=4?'前半':'後半'):''}`);p.morningDone=true;log(s,'MORNING_BODY',id,'朝に遺体を調査');return;
 }
 if(cmd.type==='morningTake'){
   const it=s.items[cmd.itemId];if(!it||it.holder!==null||it.room===null||it.kind==='設備')throw Error('他人の所持品・設備は取得できません');
   expense(p,COSTS.take);p.inspected??=[];if(!p.inspected.includes(it.id))p.inspected.push(it.id);clue(s,p,'客観証拠',describe(it),it.id);
   it.holder=id;it.room=null;it.carrier=id;touch(it);p.morningDone=true;log(s,'MORNING_TAKE',id,'朝に物品を取得',{itemId:it.id});return;
  }
  if(cmd.type==='investigate'){
   const it=s.items[cmd.itemId];if(!it || (it.holder===null&&it.room===null))throw Error('調査可能な物品ではありません');if(cmd.deep&&!p.inspected?.includes(it.id))throw Error('先に通常調査が必要です');p.inspected??=[];if(!p.inspected.includes(it.id))p.inspected.push(it.id);expense(p,cmd.deep&&p.character!=='writer'?COSTS.inspect+COSTS.deep:COSTS.inspect);
   clue(s,p,'朝の調査',`${it.name}：${(cmd.deep||p.character==='writer')?`以前の描写=${it.previous}／`:''}現在=${describe(it)}。${it.tampered?'証拠隠滅の痕跡あり。':''}`,it.id);
   p.morningDone=true;log(s,'MORNING_INSPECT',id,`朝：${it.name}を調査`,{itemId:it.id,deep:!!cmd.deep});return;
  }
  if(cmd.type==='skip'){p.morningDone=true;log(s,'MORNING_SKIP',id,'朝の個別行動をパス');return;}
 }
 doNightAction(s,id,cmd);
}
export function completeBallot(s){if(s.phase!=='vote')throw Error('投票フェーズではありません');
 for(const p of s.players)if(p.vote===null)throw Error('未投票のPCがいます');
 const votes=s.players.map(x=>x.vote),ct={};for(const x of votes)ct[x]=(ct[x]||0)+1;
 const max=Math.max(...Object.values(ct)),winners=Object.keys(ct).filter(k=>ct[k]===max);
 s.voteHistory.push({round:s.ballotRound,votes:[...votes],counts:ct});
 if(winners.length>1&&s.ballotRound===1){s.runoffOptions=winners;s.ballotRound=2;s.players.forEach(p=>p.vote=null);log(s,'RUNOFF',null,'同数により決選投票',{options:winners});return 'runoff';}
 s.verdict=winners.length===1?winners[0]:'事故死';
 log(s,'VERDICT',null,`最終認定：${s.verdict}`);return 'done';
}
function pointsInference(p,culprits,verdict,deathCause){
 const votedPerson=/^[0-4]$/.test(verdict),v=votedPerson?Number(verdict):null,isCulprit=culprits.includes(p.id);
 if(p.motive==='嫌悪')return v===p.target?2:votedPerson?0:1;
 if(p.motive==='親密')return !votedPerson?1:(v!==p.target&&(!isCulprit||v!==p.id)?2:0);
 if(isCulprit)return !votedPerson?2:v===p.id?0:1;
 if(p.motive==='殺意')return v===p.id?2:!votedPerson?1:0;
 if(!culprits.length){const correct=(verdict==='病死'&&deathCause==='病死')||(verdict==='事故死'&&deathCause==='事故死');
  if(p.motive==='金銭')return correct?2:votedPerson?1:0;
  if(p.motive==='探究')return correct?2:votedPerson?0:1;
 }
 if(p.motive==='金銭')return votedPerson?(culprits.includes(v)?2:1):0;
 if(p.motive==='探究')return votedPerson?(culprits.includes(v)?2:0):1;
 return 0;
}
export function finalize(s,{cause,culprits}={}){
 if(s.phase!=='vote'||!s.verdict)throw Error('投票結果を確定してください');
 if(!s.master.death)s.master.death={cause:'病死',culprits:[],at:8,actor:null};
 if(cause)s.master.death.cause=cause;
 if(culprits?.some(id=>!Number.isInteger(Number(id))||Number(id)<0||Number(id)>4))throw Error('真犯人が不正');
 if(culprits!==undefined)s.master.death.culprits=[...new Set(culprits.map(Number))];
 for(const id of s.master.death.culprits)if(s.master.death.motives?.[id]==='殺意')scoreMain(s,s.players[id],'殺害成立（真相確定）',RULES.killPoints);
 // 最終認定された人物が持ち出した品は、最終所有者を問わず返還。
 if(/^[0-4]$/.test(s.verdict)){
  const target=Number(s.verdict);
  for(const it of Object.values(s.items))if(it.carrier===target){
   log(s,'RETURN',target,`${it.name}を館へ自動返還`,{itemId:it.id,oldOwner:it.holder});it.holder=null;it.room='倉庫';it.carrier=null;
  }
 }
 for(const p of s.players){
  if(p.motive==='金銭'){
   const money=ownItems(s,p.id).reduce((sum,it)=>sum+it.value,0);
   p.mainScore+=money;log(s,'MONEY_SCORE',p.id,`財物の最終価値：+${money}点`);
  }
  if(p.motive==='探究')for(const itemId of p.mainRead){
   const it=s.items[itemId];if(it?.readBy.length===1&&it.readBy[0]===p.id){p.mainScore+=RULES.exclusivePoints;log(s,'EXCLUSIVE',p.id,`${it.name}の独占読書：+2点`);}
  }
  p.inferenceScore=pointsInference(p,s.master.death.culprits,s.verdict,s.master.death.cause);
 }
 s.result={verdict:s.verdict,death:s.master.death,players:s.players.map(p=>({id:p.id,character:p.character,
   motive:p.motive,task:p.mainScore+p.commonScore,main:p.mainScore,common:p.commonScore,inference:p.inferenceScore}))};
 s.phase='result';log(s,'RESULT',null,'最終精算を完了');
}
export function updateMasterSchedule(s,schedule){if(s.phase!=='lobby')throw Error('開始後は変更できません');
 if(schedule.length!==8||schedule.filter(x=>x==='主人室').length!==4||schedule.some(x=>!ROOMS.hasOwnProperty(x)))throw Error('8ターン中、主人室を4ターン指定してください');
 s.settings.schedule=[...schedule];s.master.schedule=[...schedule];}
export function setCharacter(s,id,char){if(s.phase!=='lobby')throw Error('開始後は変更できません');if(!CHARS.some(x=>x.id===char))throw Error('不明なキャラクター');
 const previous=s.players[id].character,other=s.players.find(x=>x.id!==id&&x.character===char);
 s.players[id].character=char;if(other)other.character=previous;
 for(const it of Object.values(s.items))if(it.source==='personal'){
   it.holder=s.players.find(x=>x.character===it.ownerCharacter)?.id??null;
 }
 for(const p of s.players){if(!['親密','嫌悪'].includes(p.motive))continue;
  const allowed=s.players.filter(x=>x.id!==p.id&&charOf(p.character).targets.includes(x.character));
  if(!allowed.some(x=>x.id===p.target))p.target=allowed[0]?.id??null;
 }
}
export function setTrigger(s,trigger){if(s.phase!=='lobby')throw Error('開始後は変更できません');
 s.settings.trigger=trigger;}
// Commit a command only after all validations succeed; rejected requests are atomic.
export function command(s,id,cmd){const draft=structuredClone(s);commandInternal(draft,id,cmd);reconcile(s,draft);}
function reconcile(target,source){for(const k of Object.keys(target))if(!(k in source))delete target[k];for(const [k,v]of Object.entries(source)){if(v&&typeof v==='object'&&target[k]&&typeof target[k]==='object'&&Array.isArray(v)===Array.isArray(target[k])){reconcile(target[k],v);if(Array.isArray(v))target[k].length=v.length;}else target[k]=v;}return target;}

function gameWinner(s,type,a,b){const order=GAME_DATA.rankings[type];const rank=id=>{const character=id==='master'?'master':s.players[id].character;let n=order.indexOf(character);if(id!=='master'&&ownItems(s,id).some(i=>i.id===(type==='go'?'goGuide':'billiardGuide')))n=Math.min(n,order.indexOf('guide'));return n;};return rank(a)<=rank(b)?a:b;}

export function advance(s,op){const draft=structuredClone(s);advanceInternal(draft,op);reconcile(s,draft);}
