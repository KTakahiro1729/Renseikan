const root=document.querySelector('#player');
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const b=(label,type,attrs='',cls='tiny')=>`<button class="${cls}" data-action="${esc(type)}" ${attrs}>${esc(view?.costs?.[type]!=null?label.replace(/\d+pt/,view.costs[type]+'pt'):label)}</button>`;
const tag=(label,cls='')=>`<span class="badge ${cls}">${esc(label)}</span>`;
const sel=(id,opts,label)=>`<div class="field"><label for="${id}">${label}</label><select id="${id}">${opts.map(([v,t])=>`<option value="${esc(v)}">${esc(t)}</option>`).join('')}</select></div>`;
function toast(t,error=false){const n=document.createElement('div');n.textContent=t;n.className=error?'error':'';document.querySelector('#flash').append(n);setTimeout(()=>n.remove(),4200);}
let room='',key='',channel=null,view=null,pending=new Map(),connected=false;
function connect(){try{channel?.close();}catch{}
 if(!room||!key)return;
 channel=new BroadcastChannel(`renjokan:${room}:seat:${key}`);
 channel.onmessage=event=>{const data=event.data||{};
  if(data.kind==='snapshot'){view=data.view;connected=true;render();return;}
  if(data.kind==='error'){pending.delete(data.requestId);toast(data.message,true);render();return;}
  if(data.kind==='ack'){pending.delete(data.requestId);return;}
 };
 sessionStorage.setItem('renjokan.join',JSON.stringify({room,key}));
 announce();render();
}
function announce(){const c=new BroadcastChannel(`renjokan:${room}:control`);c.postMessage({kind:'hello',key});c.close();}
function send(payload){if(!room||!key)return toast('まずGMに接続してください',true);
 const id=Math.random().toString(36).slice(2);pending.set(id,true);
 const c=new BroadcastChannel(`renjokan:${room}:control`);
 c.postMessage({kind:'command',key,requestId:id,payload});c.close();
 toast('操作をGMへ送信しました');
}
function admission(){return `<section class="panel" style="max-width:590px;margin:50px auto"><div class="eyebrow">GUEST ADMISSION</div><h2>参加者の認証</h2>
<p>GMから伝えられた部屋番号と席の鍵を入力してください。同じPC上の別タブでのみ同期します。</p>
<div class="field"><label>部屋番号</label><input id="roomId" placeholder="例：abc1234" value="${esc(room)}"></div>
<div class="field"><label>席の鍵</label><input id="seatKey" placeholder="GMから受け取った鍵" value="${esc(key)}"></div>
<button class="primary" id="join">接続</button><p class="subtle">同一オリジンのローカル試験用。参加者の本人確認や秘密の保護を保証しません。</p></section>`;}
const CHAR_NAMES={heir:'令嬢／御曹司',actor:'女優／俳優',writer:'作家',student:'学生',soldier:'軍人'};
const actorName=(q,id)=>q.status.find(x=>x.id===id)?`${String.fromCharCode(65+id)}・${CHAR_NAMES[q.status[id].character]||q.status[id].character}`:`PC ${id+1}`;
function phaseHeader(v){const p=v.player;
 return `<section class="panel"><div class="row spread"><div><div class="eyebrow">PERSONAL DOSSIER · PC ${String.fromCharCode(65+p.id)}</div><h2>${esc(CHAR_NAMES[p.character]||p.character)}</h2><span class="subtle">${esc(p.location)} · ${v.phase==='night'?`T${v.turn} ${v.clock}`:v.phase==='morning'?`朝 ${v.morning}/5`:v.phase==='vote'?'最終投票':'結果'}</span></div>${tag(v.phase==='night'?v.step:v.phase,'blue')}</div>
<div class="cols3"><div class="stat"><strong>${p.ap}</strong><span class="subtle">AP</span></div><div class="stat"><strong>${p.sleep.toFixed(1)} / ${p.required}</strong><span class="subtle">睡眠</span></div><div class="stat"><strong>${p.commonScore+p.mainScore}</strong><span class="subtle">タスク得点</span></div></div>
<div class="secret"><div class="eyebrow">SECRET MOTIVE · MAIN CARD</div><h3>${esc(p.mainCard.title)}</h3><p>${esc(p.mainCard.description)}</p><div class="small">メイン ${p.mainScore}点 ｜ 通常 ${p.commonScore}点 ｜ 推理点は別枠</div></div>
<p class="subtle">${esc(v.roomNote)}　主人：${esc(v.masterPublic.status)}${v.masterPublic.location!=='不明'?'（'+esc(v.masterPublic.location)+'）':''}</p></section>`;}
function locationPanel(v){const p=v.player;let body='';
 if(v.phase==='night'&&v.step==='planning'){
 const current=p.plan?.to??p.location;
 body=`<p>次ターンの行先と睡眠を決定してください。移動は大広間経由です。</p><div class="room-grid">${v.roomNames.map(r=>`<button type="button" class="room-cell ${r===current?'active':''} ${!v.legalMoves.includes(r)?'locked':''}" data-move="${esc(r)}" ${!v.legalMoves.includes(r)?'disabled':''}><strong>${esc(r)}</strong><span class="subtle">${r===p.location?'現在地':v.legalMoves.includes(r)?'移動可能':'経由が必要'}</span></button>`).join('')}</div>
<div class="gap"></div><div class="row">${[['awake','探索する'],['bed','共同寝室で眠る'],['sofa','ソファーで眠る'],['bell','警鐘を鳴らす']].map(([k,label])=>`<label><input type="radio" name="planMode" value="${k}" ${(p.plan?.mode||'awake')===k?'checked':''}> ${label}</label>`).join('')}</div>
<div class="gap"></div><button class="primary" id="submitPlan">移動・睡眠を提出</button><p class="subtle">${p.plan?`提出済み：${esc(p.plan.to)}（${esc(p.plan.mode)}）`:'未提出'}。全員の提出後にGMが同時に移動を処理します。</p>`;
 }else if(v.phase==='night'&&v.step==='exploring'){
 const same=v.status.filter(q=>q.location===p.location&&q.id!==p.id).map(q=>actorName(v,q.id));
 body=`<p><strong>${esc(p.location)}</strong>にいる。${p.sleeping?'睡眠中のため操作できません。':'行動の効果はGMに送られます。'}</p>
 <div class="notice">同室の人物：${same.length?same.map(esc).join('、'):'確認できない'}。会話はDiscordで行います。</div>
 ${p.sleeping?'':actions(v)}`;
 }else body=`<p>現在地：${esc(p.location)}</p>`;
 return `<section class="panel"><h3>${v.phase==='night'&&v.step==='planning'?'次の行動を決める':'館内行動'}</h3>${body}</section>`;}
function actions(v){let p=v.player,items=v.items,held=items.filter(x=>x.holder===p.id),here=items.filter(x=>x.room===p.location),other=v.status.filter(x=>x.id!==p.id&&x.location===p.location),awakeOther=other.filter(x=>!x.sleeping);
 const partnerOpts=awakeOther.map(x=>[x.id,actorName(v,x.id)]);
 const ownedOpts=held.map(i=>[i.id,i.name]),foods=held.filter(i=>i.kind==='飲食物'&&!i.consumed),poisons=held.filter(i=>i.ingredient);
 let html=`<h4>物品と調査</h4>`;
 for(const it of items){html+=`<div class="item"><div class="title-row"><strong>${esc(it.name)}</strong>${tag(it.holder===p.id?'所持中':it.lang||it.kind)}</div>
<div class="subtle">${it.room===p.location?'この部屋にある':'所持中'} / ${esc(it.kind)} ${it.state!=='unused'?'／使用痕あり':''}</div><div class="row">${b('調べる 1pt','inspect',`data-item-id="${it.id}"`)}
${it.state!=='unused'?b('深く調べる +1pt','deep',`data-item-id="${it.id}"`):''}
${it.room===p.location&&it.kind!=='設備'?b('持ち出す 1pt','take',`data-item-id="${it.id}"`):''}
${it.kind==='書籍'?b(`読む ${it.lang==='日本語'?1:2}pt`,'read',`data-item-id="${it.id}"`):''}
${it.holder===p.id?b('配置する 0pt','place',`data-item-id="${it.id}"`):''}
${it.kind==='植物'&&it.room===p.location?b('採取する 1pt','harvest',`data-item-id="${it.id}"`):''}${it.holder===p.id&&it.kind==='飲食物'&&!it.consumed?b('飲食する 1pt','eat',`data-item-id="${it.id}"`):''}${b('痕跡を工作','tamper',`data-item-id="${it.id}"`)}</div></div>`;}
 if(items.length===0)html+=`<p class="subtle">この部屋の可視物品はありません。</p>`;
 if(ownedOpts.length&&awakeOther.length)html+=`<div class="separator"></div><h4>譲渡</h4><div class="field-row">${sel('giveItem',ownedOpts,'渡す物品')}${sel('giveTo',partnerOpts,'相手')}</div>${b('0ptで譲渡','give','','primary')}`;
 if(foods.length&&poisons.length)html+=`<div class="separator"></div><h4>飲食物に混ぜる</h4><div class="field-row">${sel('mixFood',foods.map(i=>[i.id,i.name]),'飲食物')}${sel('mixPoison',poisons.map(i=>[i.id,i.name]),'薬品')}</div>${b('混入する 1pt','mix')}`;
 if(foods.length)html+=`<div class="separator"></div><h4>飲食物を渡す</h4>${sel('serveFood',foods.map(i=>[i.id,i.name]),'飲食物')}${sel('serveTo',[...awakeOther.map(o=>[o.id,actorName(v,o.id)]),['master','主人（同室時）']],'渡す相手')}${b('渡す 0pt','serve')}`;
 if(awakeOther.length)html+=`<div class="separator"></div><h4>同室での共同アクション</h4>${sel('partner',partnerOpts,'相手')}${sel('jointPay',[[0,'相手が全額'],[1,'自分1AP'],[2,'自分が全額（2APまで）']],'自分の負担AP')}
<div class="row">${p.location==='娯楽室'?b('囲碁 2pt','go')+b('ビリヤード 2pt','billiards'):''}
${b('誘導する 0pt','induce')}${items.some(it=>it.kind==='書籍')?b('一緒に読む','jointRead'):''}</div>${sel('jointBook',items.filter(i=>i.kind==='書籍').map(i=>[i.id,i.name]),'共同読書に使う本')}`;
 const room=p.location;
 html+=`<div class="separator"></div><h4>部屋固有の行動</h4><div class="row">
${room==='大広間'?b('守衛に話を聞く 2pt','guard'):''}
${room==='主人室'?b('鎧武者を調べる 1pt','armor')+b('剣を外す 2pt','blade')+b('暖炉を調べる 1pt','fireplace'):''}
${room==='食堂'?b('料理を作る 2pt','cook')+b('お茶を淹れる 1pt','tea'):''}
${room==='共同寝室'&&other.length?b('睡眠者を調べる 0pt','sleepInspect')+b('睡眠中の相手から盗む 2pt','steal'):''}
${room==='庭園'?b('1ターン休息・AP+2','rest'):''}
${b('隠し場所を捜索 1pt','roomSearch')}
${v.masterPublic.location==='同室'?b('主人を殺す 3pt','kill')+b('主人を誘う','invite')+b('金品をねだる 1pt','askMoney'):''}
${v.masterPublic.status==='死亡が確認されている'&&v.masterPublic.location===room?b('遺体調査 1pt','body')+b('遺体を精査 1pt','deepBody')+b('遺体を隠す 2pt','hide')+b('次の移動先へ遺体を隠す 3pt','moveBody')+b('表情を工作 2pt','face')+b('現場を拭く 2pt','wipe'):''}</div>`;
 if(room==='共同寝室'&&other.length)html+=`${sel('stealTo',other.filter(o=>o.sleeping).map(o=>[o.id,actorName(v,o.id)]),'窃盗対象')}`;
 if(v.masterPublic.location==='同室')html+=sel('inviteRoom',v.roomNames.map(r=>[r,r]),'主人を誘う行先');
 html+=sel('faceValue',['平穏','苦悶','驚愕','笑い'].map(x=>[x,x]),'工作後の表情');
 if(room==='娯楽室'&&v.masterPublic.location==='同室')html+=b('主人と囲碁 2pt','masterGo')+b('主人とビリヤード 2pt','masterBilliards');
 for(const proposal of v.proposals||[])html+=`<div class="notice">PC ${proposal.from+1}から ${esc(proposal.command.type)} の提案（提案者負担 ${proposal.command.pay}AP）${b('参加','acceptJoint',`data-proposal="${proposal.id}"`)}${b('断る','declineJoint',`data-proposal="${proposal.id}"`)}</div>`;
 return html;
}
function taskPanel(v){const p=v.player;return `<section class="panel"><h3>通常タスク（共通山札）</h3><p class="subtle">誰が達成しても同じ点数。達成時は無料で補充。未達成は1ptで破棄・補充できます。</p>
${p.hand.map(t=>`<div class="task"><div><strong>${esc(t.title)}</strong><span class="subtle">　${esc(t.id)}</span></div><div class="row"><span class="points">${t.points}点</span>${v.phase==='night'&&v.step==='exploring'&&!p.sleeping?b('破棄 1pt','discard',`data-task-id="${t.id}"`):''}</div></div>`).join('')}
<p class="subtle">達成${p.completed}枚。次に引くカードは共通山札から補充されます。</p></section>`;}
function cluePanel(v){const p=v.player;return `<section class="panel"><h3>取得した情報と証拠</h3><div class="log">${p.clues.slice().reverse().slice(0,120).map(x=>`<div class="event"><span class="time">${x.turn?'T'+x.turn:'朝'}</span>${tag(x.kind)} ${esc(x.text)}${v.phase==='morning'&&v.step==='talk'?b('会話相手へ共有','shareClue',`data-clue="${x.id}"`):''}</div>`).join('')||'<p class="subtle" style="padding:10px">まだ情報はありません。</p>'}</div><div class="gap"></div><h3>秘密通信の受信</h3>${p.messages.length?p.messages.map(x=>`<div class="item"><div class="subtle">朝${x.turn}／PC ${String.fromCharCode(65+x.from)}から</div>${esc(x.text)}</div>`).join(''):'<p class="subtle">まだありません。</p>'}</section>`;}
function morningPanel(v){if(v.phase!=='morning')return '';
 const p=v.player,questionnaire=`<section class="panel"><h3>朝の殺害申告（GMのみ）</h3><div class="field"><label><input type="checkbox" id="qNear" ${p.questionnaire?.near?'checked':''}> 近接殺害した</label></div>
<div class="field"><label><input type="checkbox" id="qRemote" ${p.questionnaire?.remote?'checked':''}> 遠隔殺害を試みた</label><input id="qRemoteText" placeholder="いつ・どの行動か" value="${esc(p.questionnaire?.remoteText||'')}"></div>
<div class="field"><label><input type="checkbox" id="qIndirect" ${p.questionnaire?.indirect?'checked':''}> 他人を殺害トリガーへ誘導した</label><input id="qIndirectText" placeholder="いつ・誰を・どう誘導したか" value="${esc(p.questionnaire?.indirectText||'')}"></div>
<button data-action="questionnaire">申告を提出</button></section>`;
 let indiv='';if(v.step==='individual'){
  indiv=p.morningDone?`<div class="notice">このフェーズの個別行動は終了しています。</div>`:
   `<p>1回だけ行動できます。APが不足する調査は不可。</p>${sel('investigateItem',v.roomNames.flatMap(r=>[]) .concat(v.items.map(x=>[x.id,x.name])),'調査対象（全館・他人の所持品を含む）')}
<div class="row">${b('調べる 1pt','investigate')}${b('深く調べる 2pt','investigateDeep')}${b('パス','skip')}${b('取得する 1pt','morningTake')}${b('遺体調査 1pt','investigateBody')}${b('遺体を深く調べる 2pt','investigateBodyDeep')}</div><div class="separator"></div>
${sel('messageTo',v.status.filter(q=>q.id!==p.id).map(q=>[q.id,actorName(v,q.id)]),'一方的な通信先')}
<div class="field"><label>メッセージ本文</label><textarea id="messageText" placeholder="相手のみに送る情報を入力"></textarea></div>${b('一方的な私信 2pt','message')}`;
 }else indiv=`${p.id===v.morning-1?sel('groupPartner',[['all','全員で会話'],...v.status.filter(q=>q.id!==p.id).map(q=>[q.id,actorName(v,q.id)])],'議長：組になる相手')+b('組分けを決定','conversation'):''}<p>${(v.conversation||[]).map(g=>g.map(i=>'PC '+(i+1)).join('・')).join(' ／ ')}</p><div class="notice">現在はDiscordでの会話フェーズ。議長はPC ${String.fromCharCode(64+v.morning)}です。</div>`;
 return `<section class="panel"><h3>朝${v.morning}：${v.step==='individual'?'個別行動':'会話'}</h3>${indiv}</section>${questionnaire}`;
}
function votePanel(v){if(v.phase!=='vote')return '';
 const choices=v.eligibleVote;return `<section class="panel"><h2>最終投票</h2><p>PC5人・事故死・病死から認定先を選びます。同数の場合、GMが決選投票を開始します。</p><div class="field">${sel('ballotChoice',choices.map(o=>[o,/^[0-4]$/.test(o)?actorName(v,Number(o)):o]),'認定先')}</div>${b(v.player.vote!=null?'投票を変更':'投票を提出','vote','','primary')}<p class="subtle">現在${v.completedVotes}/5人が投票提出済み。投票先は他人に公開しません。</p></section>`;}
function resultPanel(v){if(v.phase!=='result')return '';
 let r=v.result;return `<section class="panel"><h2>事件の結末</h2><p>最終認定：<strong>${esc(r.verdict)}</strong>／真相：<strong>${esc(r.death.cause)}</strong></p>
<div class="table-wrap"><table><thead><tr><th>人物</th><th>タスク点</th><th>推理点</th></tr></thead><tbody>${r.players.map(x=>`<tr><td>${actorName(v,x.id)}</td><td>${x.task}（通常${x.common}＋メイン${x.main}）</td><td>${x.inference}</td></tr>`).join('')}</tbody></table></div>
<p class="subtle">二つの点数は合算しません。</p></section>`;}
function render(){if(!view){root.innerHTML=admission();return;}
 const v=view;
 root.innerHTML=`<div class="layout"><div>${phaseHeader(v)}${v.phase==='night'?locationPanel(v):''}${morningPanel(v)}${votePanel(v)}${resultPanel(v)}${taskPanel(v)}</div>
 <aside class="aside">${cluePanel(v)}<section class="panel"><h3>共有状況</h3><p class="subtle">他人が睡眠中なら、部屋の同室確認に制限があります。</p><div class="table-wrap"><table><tr><th>席</th><th>人物</th><th>所在</th></tr>${v.status.map(x=>`<tr><td>${String.fromCharCode(65+x.id)}</td><td>${esc(x.character)}</td><td>${esc(x.location??'不明')}</td></tr>`).join('')}</table></div></section>
 <section class="panel"><div class="row spread"><span class="subtle">通信状況</span>${tag(connected?'GM接続済み':'接続待ち',connected?'green':'amber')}</div><button class="tiny" id="reconnect">再同期</button><button class="tiny" id="leave">別席で接続</button></section></aside></div>`;
}
let selectedMove=null;
function val(id){return document.querySelector('#'+id)?.value;}
root.addEventListener('click',e=>{
 const mv=e.target.closest('[data-move]');if(mv){selectedMove=mv.dataset.move;document.querySelectorAll('[data-move]').forEach(n=>n.classList.toggle('active',n===mv));return;}
 if(e.target.closest('#join')){room=val('roomId').trim();key=val('seatKey').trim();connect();return;}
 if(e.target.closest('#reconnect')){announce();toast('再同期を要求しました');return;}
 if(e.target.closest('#leave')){view=null;connected=false;room='';key='';channel?.close();sessionStorage.removeItem('renjokan.join');render();return;}
 if(e.target.closest('#submitPlan')){const mode=document.querySelector('input[name="planMode"]:checked')?.value||'awake';
  const to=selectedMove||view.player.plan?.to||view.player.location;send({type:'plan',to,mode});return;}
 const a=e.target.closest('[data-action]');if(!a)return;let type=a.dataset.action,itemId=a.dataset.itemId,payload={type,itemId};
 if(type==='masterGo'||type==='masterBilliards'){send({type:type==='masterGo'?'go':'billiards',otherId:'master'});return;}
 if(type==='acceptJoint'||type==='declineJoint'){send({type:'respondJoint',proposalId:a.dataset.proposal,accept:type==='acceptJoint'});return;}
 if(type==='shareClue'){send({type,clueId:a.dataset.clue});return;}
 if(type==='conversation'){send({type,partner:val('groupPartner')==='all'?null:Number(val('groupPartner'))});return;}
 if(type==='discard'){send({type,taskId:a.dataset.taskId});return;}
 if(type==='give'){payload.itemId=val('giveItem');payload.otherId=Number(val('giveTo'));}
 if(type==='mix'){payload.itemId=val('mixFood');payload.poisonId=val('mixPoison');}
 if(type==='serve'){payload.itemId=val('serveFood');payload.to=val('serveTo');}
 if(['go','billiards','jointRead','induce'].includes(type)){payload.otherId=Number(val('partner'));if(['go','billiards','jointRead'].includes(type))payload.pay=Number(val('jointPay'));if(type==='jointRead')payload.itemId=val('jointBook');}
 if(['steal','sleepInspect'].includes(type))payload.otherId=Number(val('stealTo'));
 if(type==='invite')payload.to=val('inviteRoom');
 if(type==='face')payload.face=val('faceValue')||'平穏';
 if(type==='message'){payload.to=val('messageTo');payload.text=val('messageText');}
 if(type==='morningTake')payload.itemId=val('investigateItem');
 if(type==='investigateBodyDeep'){payload.type='investigateBody';payload.deep=true;}
 if(type==='investigate'||type==='investigateDeep'){payload.type='investigate';payload.itemId=val('investigateItem');payload.deep=type==='investigateDeep';}
 if(type==='vote')payload.value=val('ballotChoice');
 if(type==='questionnaire')payload={type,near:document.querySelector('#qNear')?.checked,remote:document.querySelector('#qRemote')?.checked,
  remoteText:val('qRemoteText'),indirect:document.querySelector('#qIndirect')?.checked,indirectText:val('qIndirectText')};
 send(payload);
});
// local test only: open a seat-specific link from GM and reconnect after page reload.
try {let params=new URLSearchParams(location.hash.slice(1)),stored=JSON.parse(sessionStorage.getItem('renjokan.join')||'null');
 room=params.get('room')||stored?.room||'';key=params.get('key')||stored?.key||'';if(room&&key)connect();else render();}catch{render();}
