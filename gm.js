import {createGame,advance,command,completeBallot,finalize,updateMasterSchedule,setCharacter,setTrigger,changeMotive,project,
 CHARS,ROOMS,DEFAULT_SCHEDULE,DEFAULT_ITEMS,MOTIVES,charOf,clock,triggerLabel,conditionLabel} from './core.js';
const root=document.querySelector('#gm');const STORAGE='renjokan.host.v2';
const escaped=t=>String(t??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const input=(id,label,val='')=>`<div class="field"><label for="${id}">${escaped(label)}</label><input id="${id}" value="${escaped(val)}"></div>`;
const opt=(value,title,current)=>`<option value="${escaped(value)}" ${current===value?'selected':''}>${escaped(title)}</option>`;
function toast(msg,error=false){const el=document.createElement('div');el.textContent=msg;if(error)el.className='error';document.querySelector('#flash').append(el);setTimeout(()=>el.remove(),4300);}
function makeKeys(){return Array.from({length:5},()=>crypto.randomUUID().replace(/-/g,'').slice(0,14));}
let host;
try { host=JSON.parse(localStorage.getItem(STORAGE)||'null'); }catch{}
if(!host?.state||!Array.isArray(host.keys)||host.keys.length!==5){host={state:createGame(),keys:makeKeys()};}
let s=host.state,keys=host.keys;let control,receivers=[];
function connect(){try{control?.close();receivers.forEach(x=>x.close());}catch{}
 control=new BroadcastChannel(`renjokan:${s.id}:control`);
 receivers=keys.map(k=>new BroadcastChannel(`renjokan:${s.id}:seat:${k}`));
 control.onmessage=ev=>{
  const data=ev.data||{};let seat=keys.indexOf(data.key);
  if(seat<0)return;
  if(data.kind==='hello'){sendSeat(seat);return;}
  if(data.kind==='command'){
   try{mutate(()=>command(s,seat,data.payload));receivers[seat].postMessage({kind:'ack',requestId:data.requestId});}
   catch(error){receivers[seat].postMessage({kind:'error',requestId:data.requestId,message:error.message});}
  }
 };
}
function sendSeat(i){receivers[i].postMessage({kind:'snapshot',view:project(s,i)});}
function broadcast(){for(let i=0;i<5;i++)sendSeat(i);}
function save(){s.rev++;try{localStorage.setItem(STORAGE,JSON.stringify({state:s,keys}));}catch(e){toast('ブラウザへの保存に失敗。JSONでバックアップしてください。',true);}broadcast();}
function mutate(fn){fn();save();render();}
connect();save();
const tag=(x,cls='')=>`<span class="badge ${cls}">${escaped(x)}</span>`;
const fmtActor=id=>id==null?'GM':`${String.fromCharCode(65+id)}・${charOf(s.players[id]?.character)?.name||''}`;
const allItems=Object.values(s.items);
function setupPanel(){return `<section class="panel"><div class="eyebrow">SESSION SETUP</div><h2>舞台と配役</h2>
  <div class="cols3">${s.players.map(p=>`<div class="item"><h4>PC ${String.fromCharCode(65+p.id)}</h4><select data-char="${p.id}">${CHARS.map(c=>opt(c.id,c.name,p.character)).join('')}</select><div class="subtle">席の識別子は固定</div></div>`).join('')}</div>
  <div class="separator"></div><h3>主人の行動予定</h3><p class="subtle">8ターン中4ターンを主人室に設定。その他は館内のいずれか。守衛から予定を知ることができる。</p>
  <div class="cols3">${s.master.schedule.map((x,i)=>`<div class="field"><label>T${i+1} ${clock(i+1)}</label><select data-schedule="${i}">${Object.keys(ROOMS).map(r=>opt(r,r,x)).join('')}</select></div>`).join('')}</div>
  <div class="row"><button data-gm="saveSchedule">予定を確定</button></div>
  <div class="separator"></div><h3>鎧武者の遠隔装置</h3>
  <div class="field-row"><div class="field"><label>トリガー</label><select id="triggerType">${[['read','書籍を読む'],['take','物品を持ち出す'],['go','囲碁'],['billiards','ビリヤード'],['bell','警鐘']].map(([k,v])=>opt(k,v,s.settings.trigger.type)).join('')}</select></div>
  <div class="field"><label>書籍／物品の対象</label><select id="triggerItem">${allItems.filter(x=>x.source==='manor').map(x=>opt(x.id,x.name,s.settings.trigger.item)).join('')}</select></div>
  <div class="field"><label>追加条件</label><select id="triggerCondition">${[['none','なし'],['time','午前0時～4時'],['bedroom','共同寝室に2人'],['item','指定品が持ち出し中']].map(([k,v])=>opt(k,v,s.settings.trigger.condition)).join('')}</select></div>
  <div class="field"><label>追加条件の対象品</label><select id="conditionItem">${allItems.filter(x=>x.source==='manor').map(x=>opt(x.id,x.name,s.settings.trigger.conditionItem)).join('')}</select></div>
  <div class="field"><label>病死予定</label><select id="illnessTurn">${opt('7','T7',String(s.settings.illness))}${opt('8','T8',String(s.settings.illness))}</select></div></div>
  <div class="row"><button data-gm="saveTrigger">装置・病死時刻を確定</button><button class="primary" data-gm="start">夜を開始</button></div></section>`;}
function phasePanel(){let title=s.phase==='night'?`夜 T${s.turn} ${clock(s.turn)}`:s.phase==='morning'?`朝 ${s.morning}/5`:s.phase==='vote'?'最終投票':s.phase==='result'?'精算終了':'開始前';
 let body='';if(s.phase==='night'&&s.step==='planning'){const ready=s.players.filter(x=>!!x.plan).length;
 body=`<p>移動・睡眠の予約中。<strong>${ready}/5人</strong>が提出済み。</p><button class="primary" data-gm="explore">移動を確定して探索を開始</button>`;}
 if(s.phase==='night'&&s.step==='exploring')body=`<p>現在は各PCの探索行動中。Discordで同室者と会話できます。</p><div class="row"><button class="primary" data-gm="next">探索終了・次ターンへ</button></div>`;
 if(s.phase==='morning')body=s.step==='individual'?`<p>個別行動の受付中。調査または一方向の私信を各自1回。</p><button class="primary" data-gm="talk">個別行動終了・会話開始</button>`:
 `<p>会話フェーズ中。議長はPC ${String.fromCharCode(64+s.morning)}。</p><button class="primary" data-gm="nextMorning">${s.morning<5?'次の朝フェーズ':'最終投票へ'}</button>`;
 if(s.phase==='vote')body=`<p>第${s.ballotRound}回投票。<strong>${s.players.filter(p=>p.vote!==null).length}/5</strong>が提出。</p><button class="primary" data-gm="countVotes">投票を集計</button>${s.runoffOptions?`<p class="subtle">決選投票の候補：${s.runoffOptions.map(v=>/^[0-4]$/.test(v)?fmtActor(Number(v)):v).join('、')}</p>`:''}${s.verdict?`<div class="notice">最終認定：${escaped(s.verdict)}</div>${finalizePanel()}`:''}`;
 if(s.phase==='result')body=`<div class="notice">最終認定：${escaped(s.result?.verdict)}</div><div class="table-wrap"><table><tr><th>席</th><th>目的型</th><th>通常</th><th>メイン</th><th>タスク</th><th>推理</th></tr>${s.result.players.map(x=>`<tr><td>${fmtActor(x.id)}</td><td>${x.motive}</td><td>${x.common}</td><td>${x.main}</td><td>${x.task}</td><td>${x.inference}</td></tr>`).join('')}</table></div>`;
 return `<section class="panel"><div class="row spread"><div><div class="eyebrow">GAME CONTROL</div><h2>${title}</h2></div>${tag(s.phase==='night'?s.step:s.phase,'blue')}</div><div class="cols3"><div class="stat"><strong>${s.events.length}</strong><span class="subtle">GMイベント履歴</span></div><div class="stat"><strong>${s.deck.length}</strong><span class="subtle">通常タスク残り</span></div><div class="stat"><strong>${s.master.alive?'生存':'死亡'}</strong><span class="subtle">主人の状態</span></div></div><div class="gap"></div>${body}</section>`;}
function finalizePanel(){return `<div class="separator"></div><h3>真相の確認・精算</h3><p class="subtle">アクション履歴と非公開申告を照合してから確定します。必要ならGMが裁定を修正できます。</p>
  <div class="field"><label>GMが採用する死因</label><select id="finalCause">${['近接殺害','遠隔殺害','間接正犯','毒殺','事故死','病死'].map(x=>opt(x,x,s.master.death?.cause||'病死')).join('')}</select></div>
  <div class="field"><label>真犯人（複数選択可）</label><div class="row">${s.players.map(x=>`<label><input type="checkbox" data-culprit="${x.id}" ${(s.master.death?.culprits||[]).includes(x.id)?'checked':''}> ${String.fromCharCode(65+x.id)}</label>`).join('')}</div></div><button class="primary" data-gm="finalize">自動返還・最終採点を実行</button>`;}
function seatsPanel(){return `<section class="panel"><div class="eyebrow">LOCAL TEST CONNECTION</div><h2>PCの参加鍵</h2><p class="subtle">同一オリジン・同じ端末の別タブで接続します。PLごとに専用リンクを開いてください。</p>
  <div class="stack">${s.players.map((p,i)=>`<div class="item"><div class="row spread"><strong>${String.fromCharCode(65+i)} — ${charOf(p.character).name}</strong>${tag(p.plan?'移動提出済':'—',p.plan?'green':'')}</div><div class="row"><code>${s.id}</code><code>${keys[i]}</code><button class="tiny" data-gm="openSeat" data-seat="${i}">このPC画面を開く</button><button class="tiny" data-gm="copySeat" data-seat="${i}">リンクをコピー</button></div></div>`).join('')}</div></section>`;}
function statusPanel(){return `<section class="panel"><h3>プレイヤー一覧</h3><div class="table-wrap"><table><thead><tr><th>PC</th><th>目的型</th><th>所在</th><th>AP</th><th>睡眠</th><th>個別行動</th></tr></thead><tbody>
  ${s.players.map(p=>`<tr><td>${String.fromCharCode(65+p.id)}・${charOf(p.character).name}</td><td>${p.motive}${p.target!=null?'→'+String.fromCharCode(65+p.target):''}</td><td>${p.location}${p.sleeping?'（睡眠）':''}</td><td>${p.ap}</td><td>${p.sleep}/${p.required}</td><td>${p.morningDone?'済':'—'}</td></tr>`).join('')}</tbody></table></div>
 <div class="separator"></div><div class="field-row"><div class="field"><label>PC</label><select id="gmChangePC">${s.players.map(p=>opt(String(p.id),`PC ${String.fromCharCode(65+p.id)}`,String(0))).join('')}</select></div><div class="field"><label>新しい目的型</label><select id="gmChangeMotive">${MOTIVES.map(x=>opt(x,x,'探究')).join('')}</select></div></div><button data-gm="changeMotive">メインカードを変更</button>
 <div class="separator"></div><h3>GMが知る主人の情報</h3><p>現在位置：<strong>${s.master.location}</strong>／死亡：${s.master.death?escaped(s.master.death.cause):'なし'}／招待：${s.master.invites}/2</p>
 <p class="subtle">装置：${escaped(triggerLabel(s))} ／ ${escaped(conditionLabel(s))}</p><p class="subtle">主人の予定：${s.master.schedule.map((x,i)=>`T${i+1} ${x}`).join(' → ')}</p></section>`;}
function allItemsPanel(){return `<section class="panel"><h3>物品と証拠（GM）</h3><div class="table-wrap"><table><thead><tr><th>物品</th><th>場所・所有</th><th>持ち出し者</th><th>状態</th><th>読者</th></tr></thead><tbody>${Object.values(s.items).map(it=>`<tr><td>${escaped(it.name)} <span class="subtle">${escaped(it.id)}</span></td><td>${it.holder!=null?'PC '+String.fromCharCode(65+it.holder):it.room||'消費'}</td><td>${it.carrier==null?'—':String.fromCharCode(65+it.carrier)}</td><td>${it.state}${it.tampered?'・工作':''}</td><td>${it.readBy.map(i=>String.fromCharCode(65+i)).join(',')}</td></tr>`).join('')}</tbody></table></div></section>`;}
function eventsPanel(){let events=s.events.slice().reverse();return `<section class="panel"><div class="row spread"><h3>全アクション履歴</h3>${tag(`${s.events.length}件`)}</div><div class="log">${events.map(e=>`<div class="event"><span class="time">${e.turn?`T${e.turn} ${e.clock}`:'準備'}</span><span class="actor">${e.actor==null?'GM':String.fromCharCode(65+e.actor)}</span> ${escaped(e.label)}<span class="subtle"> #${e.seq}</span></div>`).join('')}</div></section>`;}
function questionnaires(){return `<section class="panel"><h3>朝の非公開申告</h3>${s.players.map(p=>`<div class="item"><strong>${String.fromCharCode(65+p.id)}・${charOf(p.character).name}</strong><div class="subtle">${p.questionnaire?`近接:${p.questionnaire.near?'Y':'N'}／遠隔:${p.questionnaire.remote?'Y':'N'}／誘導:${p.questionnaire.indirect?'Y':'N'}`:'未提出'}</div>${p.questionnaire?`<p class="small">遠隔：${escaped(p.questionnaire.remoteText)}</p><p class="small">誘導：${escaped(p.questionnaire.indirectText)}</p>`:''}</div>`).join('')}</section>`;}
function toolsPanel(){return `<section class="panel"><h3>保存・検証</h3><p class="subtle">GMの状態はこのブラウザのlocalStorageに保存されます。重要なテストはJSONでも退避してください。</p><div class="row"><button data-gm="export">JSONバックアップ</button><label class="button" style="cursor:pointer">JSONを読み込む<input id="importJson" type="file" accept="application/json" hidden></label><button class="danger" data-gm="reset">新しいゲームを作成</button></div></section>`;}
function render(){root.innerHTML=`<div class="layout"><div>${phasePanel()}${s.phase==='lobby'?setupPanel():''}${statusPanel()}${allItemsPanel()}${eventsPanel()}</div><aside class="aside">${seatsPanel()}${questionnaires()}${toolsPanel()}</aside></div>`;}
const seatUrl=i=>new URL(`player.html#room=${encodeURIComponent(s.id)}&key=${encodeURIComponent(keys[i])}`,location.href).href;
root.addEventListener('change',async e=>{
 if(e.target.id==='importJson'){
  const f=e.target.files?.[0];if(!f)return;
  try{const data=JSON.parse(await f.text());if(data.state?.schema!==2||!Array.isArray(data.keys)||data.keys.length!==5)throw Error('形式が異なります');
   host=data;s=host.state;keys=host.keys;connect();save();render();toast('バックアップから復旧しました');}
  catch(ex){toast('読み込み失敗：'+ex.message,true);}
 }
 if(e.target.matches('[data-char]')){
  try{mutate(()=>setCharacter(s,Number(e.target.dataset.char),e.target.value));}
  catch(ex){toast(ex.message,true);render();}
 }
});
root.addEventListener('click',async e=>{
 const b=e.target.closest('[data-gm]');if(!b)return;const op=b.dataset.gm;
 try{
  if(op==='openSeat'){window.open(seatUrl(Number(b.dataset.seat)),'_blank');return;}
  if(op==='copySeat'){await navigator.clipboard.writeText(seatUrl(Number(b.dataset.seat)));toast('PCリンクをコピーしました');return;}
  if(op==='export'){const blob=new Blob([JSON.stringify({state:s,keys},null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=`renjokan_${s.id}_T${s.turn}_backup.json`;a.click();URL.revokeObjectURL(url);return;}
  if(op==='reset'){if(!confirm('現在のGM状態を初期化します。バックアップ済みですか？'))return;s=createGame();keys=makeKeys();connect();save();render();return;}
  if(op==='saveSchedule'){
   const values=Array.from(root.querySelectorAll('[data-schedule]')).map(x=>x.value);mutate(()=>updateMasterSchedule(s,values));toast('主人の予定を更新');return;
  }
  if(op==='saveTrigger'){const t={type:root.querySelector('#triggerType').value,item:root.querySelector('#triggerItem').value,condition:root.querySelector('#triggerCondition').value,conditionItem:root.querySelector('#conditionItem').value};
   mutate(()=>{setTrigger(s,t);s.settings.illness=Number(root.querySelector('#illnessTurn').value);});toast('装置の設定を更新');return;}
  if(op==='changeMotive'){mutate(()=>changeMotive(s,Number(root.querySelector('#gmChangePC').value),root.querySelector('#gmChangeMotive').value,null));return;}
  if(op==='countVotes'){mutate(()=>completeBallot(s));return;}
  if(op==='finalize'){const cause=root.querySelector('#finalCause').value,culprits=Array.from(root.querySelectorAll('[data-culprit]:checked')).map(x=>Number(x.dataset.culprit));mutate(()=>finalize(s,{cause,culprits}));return;}
  mutate(()=>advance(s,op));
 }catch(ex){toast(ex.message,true);render();}
});
render();
