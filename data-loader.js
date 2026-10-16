// JSON is the editable source of truth. No build-time code generation required.
const url=new URL('./data/game.json',import.meta.url);
export const GAME_DATA=typeof window==='undefined'
 ? JSON.parse(await (await import('node:fs/promises')).readFile(url,'utf8'))
 : await fetch(url).then(r=>{if(!r.ok)throw Error('ゲームデータを読み込めません');return r.json();});
export function validateData(d){
 const fail=m=>{throw Error('ゲームデータ: '+m);};
 if(d.version!==2)fail('version は 2 が必要');
 for(const key of ['rooms','characters','items','tasks']){
  if(!Array.isArray(d[key]))fail(key+' は配列');
  const ids=d[key].map(x=>x.id??x.name);if(new Set(ids).size!==ids.length)fail(key+' のID重複');
 }
 if(d.characters.length!==5)fail('キャラクターは5人');
 const rooms=new Set(d.rooms.map(r=>r.name));
 if(d.schedule.length!==8||d.schedule.filter(r=>r==='主人室').length!==4||d.schedule.some(r=>!rooms.has(r)))fail('予定は8枠、主人室4枠');
 for(const i of d.items){if(!rooms.has(i.room))fail(i.id+' の部屋が不明');if(!Number.isFinite(i.value)||i.value<0)fail(i.id+' の価値が不正');}
 for(const t of d.tasks)if(!Number.isInteger(t.copies)||t.copies<0||!Number.isFinite(t.points)||t.points<0)fail(t.id+' の枚数／点数が不正');
 if(d.tasks.reduce((n,t)=>n+t.copies,0)<20)fail('タスクは20枚以上必要');
 for(const [key,v]of Object.entries({...d.rules,...d.costs}))if(!Number.isFinite(v)||v<0)fail(key+' は非負数');
 const ids=new Set(d.items.map(i=>i.id));for(const id of ['secret','diary','dict','forensic','sword','goGuide','billiardGuide','goBoard','billiardTable'])if(!ids.has(id))fail('必須物品 '+id+' がありません');
 if(!ids.has(d.explorationTarget))fail('探究対象がありません');
 for(const key of ['inspect','deep','take','harvest','guard','armor','blade','cook','tea','kill','body','deepBody','face','hide','moveBody','wipe','steal','eat','fireplace','askMoney','roomSearch','message','discard','go','billiards','readJapanese','readForeign'])if(!Number.isFinite(d.costs?.[key]))fail('費用 '+key+' がありません');
 return d;
}
validateData(GAME_DATA);
