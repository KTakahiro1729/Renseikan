export const ROOMS = {
 '大広間':1,'食堂':1,'娯楽室':1,'図書室':1,'庭園':1,
 '共同寝室':2,'主人室':2,'倉庫':2,'地下室':0
};
export const CHARS = [
 {id:'heir',name:'令嬢／御曹司',lang:['英語','フランス語'],targets:['actor','student'],desc:'館主の第二子。高価な宝石を所持。'},
 {id:'actor',name:'女優／俳優',lang:['英語','フランス語'],targets:['heir','soldier'],desc:'館主の第一子。睡眠中の盗難に強い。'},
 {id:'writer',name:'作家',lang:['英語','ドイツ語','フランス語'],targets:['heir','actor','student','soldier'],desc:'怪奇小説家。物品を調べると深い情報も得る。'},
 {id:'student',name:'学生',lang:['英語','ドイツ語'],targets:['heir','writer'],desc:'医学部学生。薬草学の本を所持。'},
 {id:'soldier',name:'軍人',lang:['英語','ドイツ語','中国語'],targets:['actor','student'],desc:'陸軍下級将校。サーベルを所持。'}
];
export const MOTIVES = ['殺意','金銭','探究','親密','嫌悪'];
export const DEFAULT_SCHEDULE=['主人室','食堂','主人室','大広間','主人室','図書室','主人室','庭園'];
export const ROOM_NOTE={
 '大広間':'守衛、館の時計、警鐘、ソファー。', '食堂':'厨房。調理、お茶、飲食。',
 '娯楽室':'囲碁盤とビリヤード台。', '図書室':'多言語の書籍と資料。',
 '庭園':'さまざまな植物。', '共同寝室':'共同の寝台。睡眠者からの窃盗。',
 '主人室':'鎧武者と暖炉。館主が滞在する。', '倉庫':'財物が保管される場所。', '地下室':'古い品々が置かれた地下室。'
};
const enc = n => String(n).padStart(2,'0');
export const clock = t => `${enc((22 + (t-1)) % 24)}:00`;
export const charOf = id => CHARS.find(c=>c.id===id);
export const uid = (prefix='id') => `${prefix}_${Math.random().toString(36).slice(2,11)}`;
const moneyNames={宝石:4,金細工:3,天球儀:5,置物:3,サイン本:4,鎧武者の剣:2,懐中時計:2};
export const DEFAULT_ITEMS = [
 ['jewel','高価な宝石','宝石','倉庫',4],['gold','金細工','金細工','倉庫',3],['tool','工具','工具','倉庫',0],
 ['orb','天球儀','天球儀','大広間',5],['clock','懐中時計','懐中時計','大広間',2],
 ['knife','包丁','凶器','食堂',0],['drink','紅茶','飲食物','食堂',0],['mask','謎の仮面','仮面','娯楽室',1],
 ['ornament','謎の置物','置物','娯楽室',3],['sword','鎧武者の剣','凶器','主人室',2],
 ['herbA','毒草A','植物','庭園',0],['herbB','毒草B','植物','庭園',0],
 ['herbCa','毒物C原料a','植物','庭園',0],['herbCb','毒物C原料b','植物','庭園',0],
 ['herbSleep','睡眠用ハーブ','植物','図書室',0],['antidote','解毒剤','植物','地下室',0],
 ['dict','外国語辞典','書籍','図書室',0,'日本語','あらゆる外国語の解読に使える。'],
 ['secret','星辰仕掛けの覚書','書籍','図書室',1,'ドイツ語','鎧武者は特定の行為を契機に動く。作動条件はGMの設定による。'],
 ['diary','館主の日記','書籍','主人室',1,'日本語','主人は家族や招待者について秘密を記している。'],
 ['will','館主の遺言状','書籍','主人室',2,'日本語','家族への思いが綴られている。'],
 ['herbal','薬草図鑑','書籍','図書室',1,'日本語','毒草Aは1時間、毒草Bは2時間後に発症。毒物Cは配合量の差が2時間継続すると発症。'],
 ['forensic','検死手順書','書籍','地下室',1,'日本語','遺体の傷、死後損傷、夜の前半・後半を調べる方法がある。'],
 ['goGuide','囲碁の心得','書籍','図書室',1,'日本語','囲碁の心得。'],
 ['billiardGuide','ビリヤードの心得','書籍','娯楽室',1,'英語','ビリヤードの心得。'],
 ['novel','怪奇小説','書籍','図書室',2,'日本語','大正の怪奇小説。娯楽本。'],
 ['play','仏語戯曲集','書籍','図書室',3,'フランス語','海外の娯楽本。'],
 ['priceJ','宝飾品目録','書籍','倉庫',0,'日本語','宝石4点、金細工3点、懐中時計2点。'],
 ['priceA','古美術評価録','書籍','地下室',0,'フランス語','天球儀5点、置物3点。'],
 ['priceB','古書取引録','書籍','大広間',0,'ドイツ語','希少なサイン本4点、仏語戯曲集3点。'],
 ['signature','作家のサイン本','書籍','図書室',4,'日本語','著名な怪奇小説家のサイン入り。']
];
export function makeItem(row) {
 const [id,name,kind,room,value=0,lang='日本語',text=''] = row;
 return {id,name,kind,room,holder:null,carrier:null,source:'manor',value,lang,text,
   state:'unused',previous:'unused',tampered:false,readBy:[],poison:null,poisoner:null, created:0};
}
export const TASK_TEMPLATES=[
 ['read','書籍を1冊読む',1],['read','外国語の書籍を読む',2,'foreign'],
 ['inspect','物品を1個調べる',1],['take','物品を1個持ち出す',1],
 ['give','物品を誰かに譲る',1],['place','館内に物品を配置する',1],
 ['go','二人で囲碁をする',2],['billiards','二人でビリヤードをする',2],
 ['jointRead','二人で娯楽本を読む',2],['cook','料理を作る',2],['tea','お茶を淹れる',1],
 ['serve','飲食物を誰かに渡す',1],['harvest','植物を採取する',1],
 ['guard','守衛に話を聞く',2],['armor','鎧武者を調べる',1],['body','遺体を調べる',2],
 ['face','遺体の表情を変える',2],['wipe','現場を清掃する',2],['read','新しい書籍を読む',1],
 ['invite','主人を誘う',2],['inspect','使用された物品を調べる',1,'used'],
 ['take','書籍を持ち出す',1,'book'],['send','一方的な私信を送る',1]
];
function shuffle(a){for(let i=a.length-1;i>0;i--){let j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
export function createGame({schedule=DEFAULT_SCHEDULE, characters=CHARS.map(x=>x.id), trigger={type:'read',item:'secret',condition:'none'}, illness=8}={}){
 const players=characters.map((character,i)=>({id:i,character,motive:MOTIVES[Math.floor(Math.random()*MOTIVES.length)],target:null,
   location:'大広間',plan:null,ap:15,sleep:0,required:3,sleeping:false,readBooks:[],mainRead:[],
   knownDevice:false,hasHerbGuide:character==='student',knownValues:[],
   hand:[],commonScore:0,mainScore:0,mainFlags:[],mainWorks:[],mainHistory:[],
   clues:[],messages:[],personalLog:[],completed:0,questionnaire:null,vote:null,forcedSleep:0,
   morningDone:false,invites:0,poisonPenalty:0,knowsDeath:false,restedTurn:0,actedTurn:0}));
 const charTargets=(p)=>players.filter(q=>q.id!==p.id && charOf(p.character).targets.includes(q.character));
 for(const p of players){if(['親密','嫌悪'].includes(p.motive)){const c=charTargets(p);p.target=c[Math.floor(Math.random()*c.length)]?.id??null;}}
 let items=Object.fromEntries(DEFAULT_ITEMS.map(x=>[x[0],makeItem(x)]));
 for(let p of players){if(p.character==='heir')items[`personal_${p.id}_jewel`]={...makeItem(['personal_'+p.id+'_jewel','家伝の宝石','宝石',null,4]),holder:p.id,source:'personal'};
  if(p.character==='soldier')items[`personal_${p.id}_saber`]={...makeItem(['personal_'+p.id+'_saber','サーベル','凶器',null,0]),holder:p.id,source:'personal'};
  if(p.character==='student')items[`personal_${p.id}_herbal`]={...makeItem(['personal_'+p.id+'_herbal','薬草学の本','書籍',null,1]),holder:p.id,source:'personal'};
 }
 const deck=shuffle(Array.from({length:100},(_,i)=>{const t=TASK_TEMPLATES[i%TASK_TEMPLATES.length];return {id:`task_${i}`,kind:t[0],title:t[1],points:t[2],require:t[3]||null};}));
 const state={schema:1,id:uid('room').slice(-7),rev:0,phase:'lobby',step:'planning',turn:0,morning:0,
  players,items,deck,events:[],nextSeq:1, gmNotes:'', settings:{schedule:[...schedule],illness,trigger},
  master:{alive:true,location:'大広間',schedule:[...schedule],invites:0,death:null,face:'平穏',hidden:false,bodyRoom:null,
   traces:[],poisons:[],lastInvitation:null,bodyCarrier:null},
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
function moveValid(from,to){return ROOMS[from]===ROOMS[to]||from==='大広間'||to==='大広間';}
export const MOVE_VALID=moveValid;
export function availableMoves(s,id){return Object.keys(ROOMS).filter(r=>moveValid(s.players[id].location,r));}
export function mainCard(p,s){
 const target=p.target!=null?s.players[p.target]?.character:null;
 return {title:`${p.motive}型`,description:({
 '殺意':'館主の殺害と遺体・現場の工作。殺害5点、異なる工作2点ずつ最大4点（暫定）。',
 '金銭':'最終的に持ち帰った財物の価値。館内書籍に価格表が分散している。',
 '探究':'書籍の読破、自分しか読まなかった本の加点、指定物品の取得。',
 '親密':`対象者との料理・対局・共同読書。対象：${target?charOf(target).name:'未指定'}`,
 '嫌悪':`対象者に毒を盛る、持ち物を奪う。対象：${target?charOf(target).name:'未指定'}`
 })[p.motive]};
}
export function project(s,id){
 const p=s.players[id]; const seen=new Set(p.clues.map(x=>x.itemId).filter(Boolean));
 const viewItems=Object.values(s.items).filter(it=>it.room===p.location || it.holder===id);
 const status=s.players.map(q=>({id:q.id,character:q.character,
   location:q.id===id?q.location:(q.location===p.location&&!q.sleeping&&!p.sleeping?q.location:null),
   isSelf:q.id===id,ready:q.id===id?!!q.plan:null,submittedVote:q.id===id?q.vote!==null:null,
   sleeping:q.id===id?q.sleeping:null}));
 return {rev:s.rev,phase:s.phase,step:s.step,turn:s.turn,morning:s.morning,
  roomId:s.id,roomNote:ROOM_NOTE[p.location],clock:s.turn?clock(s.turn):'—',
  player:{...p,hand:p.hand.map(t=>({...t})),mainCard:mainCard(p,s)},
  masterPublic:p.knowsDeath ? {status:'死亡が確認されている',location:s.master.hidden?'不明':s.master.bodyRoom} :
    (s.master.alive&&s.master.location===p.location?{status:'生存',location:'同室'}:{status:'不明',location:'不明'}),
  items:viewItems.map(it=>({id:it.id,name:it.name,kind:it.kind,room:it.room,holder:it.holder,lang:it.lang,state:it.state,
    tampered:it.tampered})),
  knownItemIds:[...seen],status,legalMoves:availableMoves(s,id),
  waitingPlans:s.players.filter(x=>!x.plan).map(x=>x.id),
  eligibleVote:s.phase==='vote'? (s.runoffOptions||['0','1','2','3','4','事故死','病死']):[],
  lastBell:s.bellHistory.slice(-3),roomNames:Object.keys(ROOMS),
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
function expense(p,cost){if(p.ap<cost)throw Error(`AP不足：必要${cost}pt／残${p.ap}pt`);p.ap-=cost;}
function touch(i){if(i.state==='unused'){i.previous='unused';i.state='used';}}
function contentFor(s,p,it){let msg=it.text||`${it.name}の記述。`;
 if(it.id==='secret')msg+=` 装置の設定：トリガー=${triggerLabel(s)}、追加条件=${conditionLabel(s)}。主人が主人室に単独でいる必要がある。`;
 if(it.id==='diary')msg+=` 書き手の裏切りが記され、あなたの目的を変える可能性がある。`;
 return msg;
}
export function triggerLabel(s){const t=s.settings.trigger;return ({read:`「${s.items[t.item]?.name||t.item}」を読む`,take:`「${s.items[t.item]?.name||t.item}」を持ち出す`,go:'囲碁を行う',billiards:'ビリヤードを行う',bell:'警鐘を鳴らす'})[t.type]||t.type;}
export function conditionLabel(s){const t=s.settings.trigger;return t.condition==='none'?'なし':t.condition==='time'?'午前0時〜午前4時':t.condition==='bedroom'?'共同寝室に2人':t.condition==='item'?`「${s.items[t.conditionItem]?.name||'特定物品'}」持ち出し中`:'未設定';}
function device(s,action,itemId,actor){const t=s.settings.trigger;
 if(t.type!==action || (['read','take'].includes(action)&&t.item!==itemId))return;
 if(t.condition==='time' && !(s.turn>=3 && s.turn<=6))return;
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
 s.master.death={cause,culprits:[...new Set(culprits)],at:s.turn,clock:clock(s.turn),actor};
 for(const p of s.players)if(p.location===s.master.bodyRoom&&!p.sleeping){p.knowsDeath=true;clue(s,p,'目撃','主人が死亡した。');}
 if(cause==='近接殺害'||cause==='遠隔殺害'||cause==='間接正犯'||cause==='事故死')s.master.traces.push({kind:'血痕',turn:s.turn});
 if(cause==='毒殺'&&details.poisonType==='B'&&!s.master.traces.some(x=>x.kind==='吐瀉物'))s.master.traces.push({kind:'吐瀉物',turn:s.turn});
 log(s,'DEATH',actor,`館主死亡（GM非公開：${cause}）`,{cause,culprits});
 for(const id of culprits)if(s.players[id].motive==='殺意')scoreMain(s,s.players[id],'殺害成立',5);
}
function ingest(s,consumer,food){if(!food.poison)return;
 const type=food.poison.type; const effect={target:consumer,type,due:s.turn+(type==='A'?1:2),poisoner:food.poison.actor,
  unbalanced:type==='C',active:true};
 s.pendingEffects.push(effect);
 log(s,'POISON_INGEST',food.poison.actor,'毒物が摂取された',{consumer,type,due:effect.due});
 if(consumer!=='master'){
  let instigator=s.players[food.poison.actor];if(instigator.motive==='嫌悪'&&instigator.target===consumer)scoreMain(s,instigator,'嫌悪対象に毒を摂取させる',4);
 }
}
function consumeFood(s,item,consumer){
 item.room=null;item.holder=null;item.carrier=null;
 item.state='used';
 ingest(s,consumer,item);
}
function foodAtMaster(s){if(!s.master.alive)return;
 const foods=roomItems(s,s.master.location).filter(i=>i.kind==='飲食物');
 for(const food of foods){log(s,'MASTER_EATS',null,`主人が${food.name}を食べた`,{item:food.id});consumeFood(s,food,'master');}
}
function poisonBoundary(s){for(const effect of s.pendingEffects){if(!effect.active||effect.due>s.turn)continue;effect.active=false;
  if(effect.target==='master'){if(s.master.alive){
    if(effect.type==='C'){
      const imbalance=s.master.poisons.filter(x=>x.type==='C').reduce((a,x)=>a+(x.component==='a'?1:-1),0);
      if(!imbalance)continue;
    }
    kill(s,'毒殺',effect.poisoner!=null?[effect.poisoner]:[],effect.poisoner,{poisonType:effect.type});
  }}else{
    const p=s.players[effect.target];p.ap=Math.max(0,p.ap-5);p.required+=2;p.poisonPenalty+=2;
    log(s,'POISON_EFFECT',effect.target,'毒の発症：AP−5、必要睡眠+2',{type:effect.type});
  }
 }}
function chooseMaster(s){s.master.location=s.master.schedule[s.turn-1]||'主人室';foodAtMaster(s);}
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
export function advance(s,op){
 if(op==='start'){
  if(s.phase!=='lobby')throw Error('既に開始しています');s.phase='night';s.turn=1;s.step='planning';
  log(s,'START',null,'夜の探索を開始');return;
 }
 if(op==='explore'){
  if(s.phase!=='night'||s.step!=='planning')throw Error('移動計画中ではありません');
  for(const p of s.players)if(!p.plan)p.plan={to:p.location,mode:'awake'};
  s.step='exploring';s.deviceFired=false;
  for(const p of s.players){const old=p.location;p.location=p.plan.to;p.sleeping=['bed','sofa'].includes(p.plan.mode);
   log(s,'MOVE',p.id,`${old} → ${p.location}${p.sleeping?'（睡眠）':''}`,{old,to:p.location,mode:p.plan.mode});
  }
  chooseMaster(s);
  if(s.master.bodyCarrier!==null){const carrier=s.players[s.master.bodyCarrier];s.master.bodyRoom=carrier.location;s.master.hidden=true;
   log(s,'BODY_MOVE',carrier.id,'遺体を移送し、隠した',{room:carrier.location});s.master.bodyCarrier=null;}
  for(const p of s.players)if(!p.sleeping&&!s.master.alive&&!s.master.hidden&&p.location===s.master.bodyRoom&&!p.knowsDeath){p.knowsDeath=true;clue(s,p,'遺体発見','この部屋に遺体がある。');}
  const hall=s.players.filter(x=>x.location==='大広間').map(x=>x.id);
  s.hallHistory.push({turn:s.turn,people:hall});
  for(const p of s.players){if(p.plan.mode==='bell')ringBell(s,p.id);}
  for(const p of s.players){p.plan=null;}
  log(s,'EXPLORE',null,`T${s.turn}探索開始・主人は${s.master.location}`);return;
 }
 if(op==='next'){
  if(s.phase!=='night'||s.step!=='exploring')throw Error('探索中ではありません');
  const bed=s.players.filter(x=>x.location==='共同寝室').length;
  for(const p of s.players){if(!p.sleeping)continue;
    const stolen=s.events.some(x=>x.turn===s.turn&&x.type==='STEAL'&&x.data.victim===p.id);
    const anotherStolen=s.events.some(x=>x.turn===s.turn&&x.type==='STEAL'&&x.data.victim!==p.id);
    const actor=charOf(p.character).id==='actor';
    let amount=p.location==='大広間'?0.5:
      (s.deviceFired||bed>=3||(stolen&&!s.events.some(x=>x.turn===s.turn&&x.type==='STEAL'&&x.actor!==p.id&&s.players[x.actor]?.character==='actor'))||(actor&&anotherStolen))?0.5:1;
    p.sleep+=amount; log(s,'SLEEP',p.id,`睡眠 +${amount}`,{amount,total:p.sleep});
  }
  for(const p of s.players)p.sleeping=false;
  if(s.turn>=8){startMorning(s);return;}
  s.turn++;s.step='planning';poisonBoundary(s);
  if(s.master.alive && s.turn===s.settings.illness)kill(s,'病死',[],null);
  log(s,'TURN',null,`T${s.turn}：移動先を決定`);return;
 }
 if(op==='talk'){
  if(s.phase!=='morning'||s.step!=='individual')throw Error('個別行動中ではありません');
  s.step='talk';log(s,'TALK',null,`朝${s.morning}：会話開始`);return;
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
 s.players.forEach(p=>p.ap+=10);morningForcedSleep(s);log(s,'MORNING_START',null,'朝の議論開始');}
function morningForcedSleep(s){for(const p of s.players){p.morningDone=false;
 if(p.sleep+1e-7<p.required){p.sleep+=1;p.forcedSleep++;p.morningDone=true;
  clue(s,p,'睡眠',`朝${s.morning}の個別行動は強制睡眠。現在${p.sleep}/${p.required}`);
  log(s,'FORCED_SLEEP',p.id,'睡眠不足のため個別行動を消費');}
 }}
function ringBell(s,id){if(s.lastBell+2>=s.turn)throw Error('警鐘はあと2ターン使用できません');
 s.lastBell=s.turn;s.bellHistory.push({turn:s.turn,id});
 log(s,'BELL',id,`${visibleName(s,id)}が警鐘を鳴らした`);
 for(const p of s.players){if(!p.sleeping&&!['共同寝室','地下室'].includes(p.location))clue(s,p,'警鐘',`T${s.turn}に警鐘が鳴った。次のターンに大広間で集合する合図。`);}
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
  requireIt();if(it.room!==p.location||it.holder!==null)throw Error('この場所にありません');
  if(p.location==='主人室'&&canMaster())throw Error('主人がいる間は物品を持ち出せません');
  expense(p,1);it.room=null;it.holder=id;it.carrier=id;touch(it);
  log(s,'TAKE',id,`${it.name}を持ち出した`,{itemId});scoreCommon(s,p,'take',{book:it.kind==='書籍'});inform(s,p.location,id,`${it.name}を取得`);device(s,'take',itemId,id);
 };
 switch(type){
 case 'rest':{canRoom('庭園');if(p.actedTurn===s.turn)throw Error('休息するターンには他の探索行動を実行できません');p.ap+=2;p.restedTurn=s.turn;log(s,'REST',id,'庭園で休み、AP+2');break;}
 case 'roomSearch':{expense(p,1);if(!s.master.alive&&s.master.hidden&&s.master.bodyRoom===p.location){s.master.hidden=false;p.knowsDeath=true;clue(s,p,'遺体発見','この部屋の隠し場所で遺体を発見した。');log(s,'BODY_DISCOVERY',id,'隠された遺体を発見');}else clue(s,p,'探索','部屋の隠し場所を調べたが、遺体は見つからなかった。');break;}
 case 'inspect':{requireIt();if(!accessible())throw Error('物品がありません');expense(p,1);
  const deep=p.character==='writer';
  clue(s,p,'客観証拠',`${it.name}：${it.state==='unused'?'使用前の状態':it.state==='used'?'最初と違うようだ':'最初と違うようだ（工作の痕跡あり）'}${deep&&it.state!=='unused'?`／追加描写：${it.previous}`:''}`,itemId);
  log(s,'INSPECT',id,`${it.name}を調べた`,{itemId});scoreCommon(s,p,'inspect',{used:it.state!=='unused'});inform(s,p.location,id,`${it.name}を調査`);break;}
 case 'deep':{requireIt();if(!accessible()||it.state==='unused')throw Error('精査できません');expense(p,1);
  clue(s,p,'客観証拠',`${it.name}の以前の描写：${it.previous}。${it.tampered?'証拠工作の痕跡が残っている。':''}`,itemId);
  log(s,'DEEP',id,`${it.name}を深く調べた`,{itemId});break;}
 case 'take':take();break;
 case 'read':{
  requireIt();if(it.kind!=='書籍'||!accessible())throw Error('読めません');
  if(it.lang!=='日本語'&&!charOf(p.character).lang.includes(it.lang)&&!ownItems(s,id).some(x=>x.id==='dict'))throw Error('この言語を読めません');
  const cost=it.lang==='日本語'?1:2;expense(p,cost);touch(it);if(!it.readBy.includes(id))it.readBy.push(id);
  p.readBooks.push(...(p.readBooks.includes(itemId)?[]:[itemId]));
  clue(s,p,'書籍',`${it.name}：${contentFor(s,p,it)}`,itemId);
  log(s,'READ',id,`${it.name}を読んだ`,{itemId,lang:it.lang});scoreCommon(s,p,'read',{foreign:cost===2});inform(s,p.location,id,`${it.name}を読んだ`);
  if(it.id==='secret')p.knownDevice=true;
  if(it.id==='herbal')p.hasHerbGuide=true;
  if(it.id.startsWith('price'))p.knownValues.push(it.id);
  if(it.id==='diary')specialMotiveChange(s,p);
  if(p.motive==='探究'&&!p.mainRead.includes(itemId)){p.mainRead.push(itemId);scoreMain(s,p,`書籍を読む：${itemId}`,1);}
  device(s,'read',itemId,id);break;}
 case 'place':{requireIt();if(it.holder!==id)throw Error('所持していません');it.holder=null;it.room=p.location;it.carrier=null;touch(it);
  log(s,'PLACE',id,`${it.name}を${p.location}へ配置`,{itemId});scoreCommon(s,p,'place');inform(s,p.location,id,`${it.name}を置いた`);foodAtMaster(s);break;}
 case 'give':{requireIt();if(it.holder!==id||!other||other.id===id||other.location!==p.location||other.sleeping)throw Error('譲渡先が同室にいません');
  it.holder=other.id;touch(it);log(s,'GIVE',id,`${other.id+1}番へ${it.name}を渡した`,{itemId,to:other.id});
  scoreCommon(s,p,'give');inform(s,p.location,id,`${it.name}を譲渡`);
  if(other.motive==='探究'&&other.exploredTarget===itemId)scoreMain(s,other,'指定物品の入手',3);
  break;}
 case 'harvest':{requireIt();canRoom('庭園');if(it.kind!=='植物'||it.room!==p.location)throw Error('採取できません');expense(p,1);
  const newIt={...it,id:uid('picked'),room:null,holder:id,carrier:id,source:'harvest',created:s.turn};s.items[newIt.id]=newIt;
  log(s,'HARVEST',id,`${it.name}を採取`,{itemId:newIt.id});scoreCommon(s,p,'harvest');inform(s,p.location,id,`${it.name}を採取`);break;}
 case 'guard':{canRoom('大広間');expense(p,2);
  const last=s.hallHistory.filter(x=>x.turn>=s.turn-2).map(x=>`T${x.turn}: ${x.people.map(i=>i+1).join(',')||'なし'}`).join('／');
  clue(s,p,'守衛',`主人の予定：${s.master.schedule.map((loc,i)=>`T${i+1} ${loc}`).join('、')}。大広間記録：${last}。警鐘：${s.bellHistory.map(x=>`T${x.turn} ${x.id+1}番`).join('、')||'なし'}`);
  log(s,'GUARD',id,'守衛に尋ねた');scoreCommon(s,p,'guard');inform(s,p.location,id,'守衛に質問');break;}
 case 'armor':{canRoom('主人室');expense(p,1);clue(s,p,'調査','鎧武者の内部に不可解な仕掛けがある。');
  log(s,'ARMOR',id,'鎧武者を調査');scoreCommon(s,p,'armor');break;}
 case 'blade':{canRoom('主人室');if(canMaster())throw Error('館主が在室中');if(!ownItems(s,id).some(x=>x.kind==='工具'))throw Error('工具が必要');
  expense(p,2);const sword=s.items.sword;if(sword.holder!==null)throw Error('剣は既にない');sword.room=null;sword.holder=id;sword.carrier=id;touch(sword);
  log(s,'TAKE_BLADE',id,'鎧武者の剣を取り外す');inform(s,p.location,id,'剣を外した');break;}
 case 'cook':case 'tea':{canRoom('食堂');expense(p,type==='cook'?2:1);
  const obj=makeItem([uid('food'),type==='cook'?'手料理':'淹れたお茶','飲食物',null,0]);obj.holder=id;obj.source='crafted';obj.created=s.turn;s.items[obj.id]=obj;
  log(s,'COOK',id,`飲食物を調理：${obj.name}`,{itemId:obj.id});scoreCommon(s,p,type);inform(s,p.location,id,'調理をした');break;}
 case 'mix':{requireIt();const poison=s.items[poisonId];if(it.holder!==id||it.kind!=='飲食物'||!poison||poison.holder!==id||!poison.name.includes('毒'))throw Error('混入条件を満たしていません');
  if(it.poison)throw Error('混入済み');expense(p,1);
  const kind=poison.name.includes('毒草A')?'A':poison.name.includes('毒草B')?'B':'C';
  it.poison={type:kind,actor:id,component:poison.name.includes('原料a')?'a':'b'};
  poison.holder=null;poison.room=null;poison.carrier=null;touch(it);
  log(s,'MIX',id,'飲食物へ薬品を混入',{itemId,type:kind});break;}
 case 'serve':{requireIt();if(it.holder!==id||it.kind!=='飲食物')throw Error('飲食物を所持していません');
  let consumer=to==='master'?'master':Number(to);
  if(consumer==='master'&&!canMaster())throw Error('主人が同室ではありません');
  if(consumer!=='master'&&(!s.players[consumer]||s.players[consumer].location!==p.location||s.players[consumer].sleeping))throw Error('相手がいません');
  log(s,'SERVE',id,`${it.name}を${consumer==='master'?'主人':consumer+1+'番'}へ渡した`,{itemId,consumer});
  consumeFood(s,it,consumer);scoreCommon(s,p,'serve');
  if(p.motive==='親密'&&consumer===p.target)scoreMain(s,p,'対象に料理を振る舞う',3);
  break;}
 case 'go':case 'billiards':case 'jointRead':{
  if(!other||other.id===id||other.location!==p.location||other.sleeping)throw Error('一緒に行動する相手がいません');
  if(type==='jointRead'){
    requireIt();if(it.kind!=='書籍'||!accessible())throw Error('書籍が必要');
    for(const who of [p,other])if(it.lang!=='日本語'&&!charOf(who.character).lang.includes(it.lang)&&!ownItems(s,who.id).some(x=>x.id==='dict'))throw Error('いずれかが外国語を読めません');
  }else canRoom('娯楽室');
  // 原則2AP。共同読書は言語に応じ1/2APとする試作上の仮定。
  expense(p,type==='jointRead'?(it.lang==='日本語'?1:2):2);
  if(type==='jointRead'){
   for(const q of [p,other]){if(!it.readBy.includes(q.id))it.readBy.push(q.id);
    if(!q.readBooks.includes(it.id))q.readBooks.push(it.id);
    clue(s,q,'書籍',`${it.name}：${contentFor(s,q,it)}`,it.id);
    if(it.id==='secret')q.knownDevice=true;
    if(q.motive==='探究'&&!q.mainRead.includes(it.id)){q.mainRead.push(it.id);scoreMain(s,q,`読書：${it.id}`,1);}
   }
   touch(it);
  }
  log(s,'JOINT',id,`${other.id+1}番と${type==='go'?'囲碁':type==='billiards'?'ビリヤード':'共同読書'}をした`,{kind:type,otherId,itemId});
  scoreCommon(s,p,type);scoreCommon(s,other,type);
  if(p.motive==='親密'&&p.target===other.id)scoreMain(s,p,`${type}を共にする`,3);
  if(other.motive==='親密'&&other.target===p.id)scoreMain(s,other,`${type}を共にする`,3);
  inform(s,p.location,id,'共同で遊んだ／読んだ');device(s,type,itemId,id);break;}
 case 'kill':{if(!canMaster())throw Error('主人が同室ではありません');const weapon=ownItems(s,id).find(x=>x.kind==='凶器');if(!weapon)throw Error('凶器が必要');expense(p,3);
  kill(s,'近接殺害',[id],id);touch(weapon);log(s,'KILL',id,'近接殺害を行った',{weapon:weapon.id});inform(s,p.location,id,'主人を殺害した');break;}
 case 'body':case 'deepBody':case 'face':case 'hide':case 'moveBody':case 'wipe':{
  if(s.master.alive||s.master.bodyRoom!==p.location)throw Error('この部屋に遺体がありません');
  if(type==='moveBody'&&s.turn===8)throw Error('最後のターンでは次の移動先がありません');
  const cost=({body:1,deepBody:1,face:2,hide:2,moveBody:3,wipe:2})[type];expense(p,cost);
  if(type==='body'||type==='deepBody')clue(s,p,'検死',`遺体：${s.master.face}の表情。${s.master.traces.map(x=>x.kind).join('、')||'目立つ痕跡なし'}。${type==='deepBody'?'詳しい傷の情報が得られた。':''}`);
  if(type==='face'){s.master.face=face||'平穏';s.master.traces.push({kind:'表情の工作',turn:s.turn});}
  if(type==='hide')s.master.hidden=true;
  if(type==='moveBody'){s.master.hidden=true;s.master.bodyCarrier=id;s.master.bodyRoom=null;}
  if(type==='wipe')s.master.traces.push({kind:'清掃の痕跡',turn:s.turn});
  log(s,'BODY',id,`遺体への行為：${type}`,{kind:type});scoreCommon(s,p,({body:'body',face:'face',wipe:'wipe'})[type]||'none');
  if(p.motive==='殺意'&&['face','hide','moveBody','wipe'].includes(type)&&p.mainWorks.length<2&&!p.mainWorks.includes(type)){
   const category=['hide','moveBody'].includes(type)?'遺体の隠匿・移送':type;
   if(!p.mainWorks.includes(category)){p.mainWorks.push(category);scoreMain(s,p,`工作：${category}`,2);}
  }break;}
 case 'steal':{canRoom('共同寝室');if(!other||other.id===id||!other.sleeping||other.location!=='共同寝室')throw Error('対象は睡眠中である必要があります');
  const possessions=ownItems(s,other.id);if(!possessions.length)throw Error('盗む品がありません');expense(p,2);const target=possessions[0];target.holder=id;
  log(s,'STEAL',id,`${other.id+1}番から物品を盗む`,{victim:other.id,itemId:target.id});
  if(p.motive==='嫌悪'&&p.target===other.id)scoreMain(s,p,'嫌悪対象から盗む',3);break;}
 case 'invite':{if(s.master.invites>=2||!s.master.alive)throw Error('主人はこれ以上招待に応じません');expense(p,1);
  s.master.invites++;
  // 招待ターンに主人を招待者の部屋へ移す。元の在室枠を先頭から1つ消費する。
  const idx=s.master.schedule.findIndex((x,i)=>i>=s.turn-1&&x==='主人室');
  if(idx>=0)s.master.schedule[idx]=ROOMS.hasOwnProperty(to)?to:p.location;
  const destination=ROOMS.hasOwnProperty(to)?to:p.location;
  s.master.location=destination;foodAtMaster(s);
  log(s,'INVITE',id,`主人を${destination}へ誘った`,{consumedSlot:idx+1});scoreCommon(s,p,'invite');break;}
 case 'induce':{if(!p.knownDevice)throw Error('この装置についての知識が必要です');if(!other||other.id===id||other.location!==p.location||other.sleeping)throw Error('対象が同室にいません');
  log(s,'INDUCE',id,`${other.id+1}番を特定の行動へ誘導`,{target:other.id,trigger:s.settings.trigger.type});
  clue(s,p,'申告用',`T${s.turn}に${other.id+1}番を誘導した。`);break;}
 default: throw Error('未実装の行動：'+type);
 }
 p.actedTurn=s.turn;
}
export function command(s,id,cmd){
 if(id<0||id>=5)throw Error('人物番号が不正です');const p=s.players[id];
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
  expense(p,1);const [task]=p.hand.splice(index,1);if(s.deck.length)p.hand.push(s.deck.pop());
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
   const dest=s.players[Number(cmd.to)];if(!dest||dest.id===id)throw Error('宛先が不正');expense(p,2);
   const text=String(cmd.text||'').slice(0,1200).trim();if(!text)throw Error('本文が空');
   dest.messages.push({from:id,text,turn:s.morning});p.morningDone=true;scoreCommon(s,p,'send');
   log(s,'MESSAGE',id,`${dest.id+1}番へ一方向メッセージ`,{to:dest.id});return;
  }
  if(cmd.type==='investigate'){
   const it=s.items[cmd.itemId];if(!it)throw Error('物品がありません');expense(p,cmd.deep?2:1);
   clue(s,p,'朝の調査',`${it.name}：${cmd.deep?`以前の描写=${it.previous}／`:''}現在=${it.state}。${it.tampered?'証拠隠滅の痕跡あり。':''}`,it.id);
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
 if(culprits!==undefined)s.master.death.culprits=[...new Set(culprits.map(Number))];
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
   const it=s.items[itemId];if(it?.readBy.length===1&&it.readBy[0]===p.id){p.mainScore+=2;log(s,'EXCLUSIVE',p.id,`${it.name}の独占読書：+2点`);}
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
   const original=it.id.split('_').slice(2).join('_');
   const ownerChar=original==='jewel'?'heir':original==='saber'?'soldier':'student';
   it.holder=s.players.find(x=>x.character===ownerChar)?.id??null;
 }
 for(const p of s.players){if(!['親密','嫌悪'].includes(p.motive))continue;
  const allowed=s.players.filter(x=>x.id!==p.id&&charOf(p.character).targets.includes(x.character));
  if(!allowed.some(x=>x.id===p.target))p.target=allowed[0]?.id??null;
 }
}
export function setTrigger(s,trigger){if(s.phase!=='lobby')throw Error('開始後は変更できません');
 s.settings.trigger=trigger;}