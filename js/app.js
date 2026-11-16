// Soul-Link-Dashboard: Logik. Pokémon-Namen kommen aus js/pokemon.js, Firebase-Daten aus config.js.
(function(){
"use strict";
var P=["p0","p1","p2"], MARK=["●","■","▲"], DEF=["Hagenau","Weissi","Zinni"];
var CAPS=[
 {id:"g1",name:"Benny / Maik / Colin",place:"Orion City",lv:14,gym:true},
 {id:"g2",name:"Aloe",place:"Septerna City",lv:20,gym:true},
 {id:"g3",name:"Artie",place:"Stratos City",lv:23,gym:true},
 {id:"g4",name:"Kamilla",place:"Rayono City",lv:27,gym:true},
 {id:"g5",name:"Turner",place:"Marea City",lv:31,gym:true},
 {id:"g6",name:"Géraldine",place:"Panaero City",lv:35,gym:true},
 {id:"g7",name:"Sandro",place:"Nevaio City",lv:39,gym:true},
 {id:"g8",name:"Lysander / Lilia",place:"Twindrake City",lv:43,gym:true},
 {id:"e4",name:"Top Vier",place:"Pokémon-Liga",lv:50},
 {id:"n",name:"N",place:"Schloss von N",lv:52},
 {id:"gc",name:"G-Cis",place:"Schloss von N",lv:54}];
var DEFAULT_ROUTES=[["r01",1,"Starter (Avenitia)"],["r02",2,"Route 1"],["r03",3,"Route 2"],["r04",4,"Orion City (Geschenk)"],["r05",5,"Traumbrache"],["r06",6,"Route 3"],["r07",7,"Grundwassersenke"],["r08",8,"Ewigenwald"],["r09",9,"Stratos City"],["r10",10,"Route 4"],["r11",11,"Wüstenresort"],["r42",11.2,"Alter Palast"],["r43",11.4,"Fossil (Extra-Encounter)",true],["r13",13,"Route 16"],["r14",14,"Hain der Täuschung"],["r15",15,"Route 5"],["r16",16,"Marea City"],["r17",17,"Route 6"],["r18",18,"Elektrolithhöhle"],["r19",19,"Panaero-Höhle"],["r20",20,"Route 7"],["r21",21,"Turm des Himmels"],["r22",22,"Wendelberg"],["r23",23,"Route 8"],["r24",24,"Moor von Nevaio"],["r25",25,"Drachenstiege"],["r26",26,"Route 9"],["r27",27,"Route 10"],["r28",28,"Siegesstraße"],["r29",29,"Route 11"],["r30",30,"Route 12"],["r31",31,"Dorfbrücke"],["r32",32,"Route 13"],["r33",33,"Ondula"],["r34",34,"Bucht von Ondula"],["r35",35,"Route 14"],["r36",36,"Schrein der Ernte"],["r37",37,"Route 15"],["r38",38,"Route 17"],["r39",39,"Route 18"],["r40",40,"Riesengrotte"],["r41",41,"Höhle der Prüfung"]];
var FOSSIL_HINT="Zählt nur, wenn alle drei ein Fossil finden. Schild- oder Federfossil, wiederbelebt im Museum von Septerna City.";
var EMPTY_CELLS=function(){return {p0:{sp:"",nick:"",st:""},p1:{sp:"",nick:"",st:""},p2:{sp:"",nick:"",st:""}}};
var NO_DEATHS=function(){return {p0:false,p1:false,p2:false}};

function defMeta(){return {players:{p0:{name:DEF[0]},p1:{name:DEF[1]},p2:{name:DEF[2]}},
  run:{no:1,status:"run",enders:NO_DEATHS(),where:"",cause:""},
  tally:{p0:{run:0,death:0,enc:0},p1:{run:0,death:0,enc:0},p2:{run:0,death:0,enc:0}},
  caps:{beaten:{},lv:{}},backupAt:""}}
var S={meta:defMeta(),routes:new Map(),history:[]};
var store=null, mode="local", canWrite=true, loaded=false, routesLoaded=false;
var auth=null, authUser=null, isAdmin=false, authKnown=false;   // nur im Firebase-Modus
var pend=new Map(), busy=new Set(), metaPend=null, metaBusy=false, timers=new Map(), metaTimer=null;
var ui={filter:"all",q:"",view:"edit"};
var $=function(id){return document.getElementById(id)};

function el(tag,attrs,kids){var e=document.createElement(tag);if(attrs)for(var k in attrs){if(k==="text")e.textContent=attrs[k];else if(k==="class")e.className=attrs[k];else e.setAttribute(k,attrs[k]);}(kids||[]).forEach(function(c){e.appendChild(c)});return e}
function dm(t,s){for(var k in s){var v=s[k];if(v&&typeof v==="object"&&!Array.isArray(v)){t[k]=dm(t[k]&&typeof t[k]==="object"&&!Array.isArray(t[k])?t[k]:{},v)}else t[k]=v}return t}
function clone(o){return JSON.parse(JSON.stringify(o))}
function sleep(ms){return new Promise(function(r){setTimeout(r,ms)})}
function pname(i){var n=(S.meta.players[P[i]]||{}).name;return n&&n.trim()?n.trim():DEF[i]}
function cellOf(r,i){var c=(r.cells||{})[P[i]]||{};return {sp:c.sp||"",nick:c.nick||"",st:c.st||""}}
function status(r){var s=P.map(function(_,i){return cellOf(r,i).st});
  if(s.indexOf("dead")>-1)return"dead";if(s.indexOf("miss")>-1)return"miss";
  if(s.every(function(x){return x==="alive"}))return"alive";if(s.indexOf("alive")>-1)return"part";return"open"}
var STL={alive:"Lebendig ♡",dead:"Tot (×_×)",miss:"Verpasst",part:"Teilweise",open:"Offen"};
var STC={alive:"Lebendig",dead:"Tot",miss:"Verpasst",part:"Teilweise",open:"Offen"};
function sorted(){return Array.from(S.routes.entries()).sort(function(a,b){return (a[1].order||0)-(b[1].order||0)})}
function killerName(r){return typeof r.killer==="number"&&r.killer>-1?pname(r.killer):""}
function deathNames(r){return [0,1,2].filter(function(i){return (r.deaths||{})[P[i]]}).map(pname).join(", ")}
function nickOf(r){if(typeof r.nick==="string")return r.nick;for(var i=0;i<3;i++){var n=((r.cells||{})[P[i]]||{}).nick;if(n)return n}return ""}
function spText(d){return d.st==="miss"?"nicht gefangen":(d.sp||(d.st?"gefangen":""))}

/* ---------- Pokémon-Suche ---------- */
function norm(s){return String(s).toLowerCase().replace(/ä/g,"ae").replace(/ö/g,"oe").replace(/ü/g,"ue").replace(/ß/g,"ss").replace(/♀/g,"w").replace(/♂/g,"m").normalize("NFD").replace(/[̀-ͯ]/g,"").replace(/[^a-z0-9]/g,"")}
function simp(s){return s.replace(/ph/g,"f").replace(/th/g,"t").replace(/ck/g,"k").replace(/c/g,"k").replace(/qu/g,"kw").replace(/y/g,"i").replace(/v/g,"f").replace(/z/g,"s").replace(/x/g,"ks").replace(/h/g,"").replace(/(.)\1+/g,"$1")}
var NORM=POKE.map(norm), SIMP=NORM.map(simp);
function osa(a,b){var m=a.length,n=b.length;if(!m)return n;if(!n)return m;var d=[];for(var i=0;i<=m;i++){d[i]=[i]}for(var j=1;j<=n;j++)d[0][j]=j;
  for(i=1;i<=m;i++)for(j=1;j<=n;j++){var c=a[i-1]===b[j-1]?0:1;d[i][j]=Math.min(d[i-1][j]+1,d[i][j-1]+1,d[i-1][j-1]+c);
    if(i>1&&j>1&&a[i-1]===b[j-2]&&a[i-2]===b[j-1])d[i][j]=Math.min(d[i][j],d[i-2][j-2]+1)}return d[m][n]}
function search(q){
  var n=norm(q);if(!n)return [];var out=[];
  if(/^\d+$/.test(n)){var k=String(+n);POKE.forEach(function(_,i){var dex=String(i+1);if(dex===k)out.push([i,1000]);else if(dex.indexOf(k)===0)out.push([i,800-dex.length])})}
  else{var sq=simp(n),lim=n.length<=3?0:(n.length<=5?1:(n.length<=8?2:3));
    for(var i=0;i<POKE.length;i++){var t=NORM[i],s=0,at;
      if(t===n)s=1000;
      else if(t.indexOf(n)===0)s=900-(t.length-n.length);
      else if((at=t.indexOf(n))>-1)s=720-at;
      else{var st=SIMP[i];
        if(sq.length>1&&st.indexOf(sq)===0)s=660;
        else if(sq.length>2&&st.indexOf(sq)>-1)s=620;
        else if(lim){var d=Math.min(osa(n,t.slice(0,n.length)),osa(n,t.slice(0,n.length+1)),osa(n,t.slice(0,Math.max(1,n.length-1))),osa(n,t));
          if(d<=lim)s=540-d*70}}
      if(s){if(i>=493)s+=25;out.push([i,s])}}}
  out.sort(function(a,b){return b[1]-a[1]||a[0]-b[0]});return out.slice(0,8).map(function(x){return x[0]});
}
var pk=el("ul",{id:"pk",role:"listbox","aria-label":"Pokémon-Vorschläge",hidden:""});document.body.appendChild(pk);
var pkFor=null,pkRes=[],pkAct=-1;
function showPk(inp){
  var res=search(inp.value);
  if(pkFor&&pkFor!==inp)closePk();
  if(!res.length){closePk();return}
  pkFor=inp;pkRes=res;pkAct=0;pk.textContent="";
  res.forEach(function(i,k){pk.appendChild(el("li",{id:"pk"+k,role:"option","aria-selected":String(k===0),"data-k":k},[el("span",{text:POKE[i]}),el("small",{text:"#"+String(i+1).padStart(3,"0")})]))});
  var r=inp.getBoundingClientRect();pk.style.left=(r.left+window.scrollX)+"px";pk.style.top=(r.bottom+window.scrollY+4)+"px";pk.style.width=Math.max(r.width,230)+"px";pk.hidden=false;
  inp.setAttribute("aria-expanded","true");inp.setAttribute("aria-activedescendant","pk0");
}
function closePk(){pk.hidden=true;if(pkFor){pkFor.setAttribute("aria-expanded","false");pkFor.removeAttribute("aria-activedescendant")}pkFor=null}
function movePk(d){if(pk.hidden||!pkRes.length)return;pkAct=(pkAct+d+pkRes.length)%pkRes.length;
  Array.prototype.forEach.call(pk.children,function(li,k){li.setAttribute("aria-selected",String(k===pkAct))});
  pkFor.setAttribute("aria-activedescendant","pk"+pkAct);pk.children[pkAct].scrollIntoView({block:"nearest"})}
function pickPk(k){var inp=pkFor;if(!inp||k<0)return;inp.value=POKE[pkRes[k]];closePk();onCellInput(inp)}
pk.addEventListener("mousedown",function(e){var li=e.target.closest("li");if(li){e.preventDefault();pickPk(+li.getAttribute("data-k"))}});
window.addEventListener("resize",closePk);

/* ---------- Speicher ---------- */
function setSync(s,t){$("sync").setAttribute("data-s",s);$("syncT").textContent=t}
function makeArtifactStore(db){return {
  watchDoc:function(path,cb,err){return db.doc(path).onSnapshot(function(s){cb(s.exists?s.data():null,!!(s.metadata&&s.metadata.fromCache))},err)},
  watchCol:function(path,cb,err){return db.collection(path).onSnapshot(function(q){cb(q.docs.map(function(d){return {id:d.id,data:d.data()}}),!!(q.metadata&&q.metadata.fromCache))},err)},
  merge:async function(path,part){try{await db.doc(path).update(part)}catch(e){var s=await db.doc(path).get();if(s.exists)throw e;await db.doc(path).set(part)}},
  set:function(path,data){return db.doc(path).set(data)},
  del:function(path){return db.doc(path).delete()}}}
function makeFirebaseStore(fs){return {
  watchDoc:function(path,cb,err){return fs.doc(path).onSnapshot(function(s){cb(s.exists?s.data():null,s.metadata.fromCache)},err)},
  watchCol:function(path,cb,err){return fs.collection(path).onSnapshot(function(q){cb(q.docs.map(function(d){return {id:d.id,data:d.data()}}),q.metadata.fromCache)},err)},
  merge:function(path,part){return fs.doc(path).set(part,{merge:true})},
  set:function(path,data){return fs.doc(path).set(data)},
  del:function(path){return fs.doc(path).delete()}}}
function makeLocalStore(){
  var KEY="soullink-bw-data",data={},subs=[];
  try{data=JSON.parse(localStorage.getItem(KEY)||"{}")||{}}catch(e){data={}}
  function save(){try{localStorage.setItem(KEY,JSON.stringify(data))}catch(e){}subs.forEach(function(f){f()})}
  function col(path){return Object.keys(data).filter(function(k){var a=k.split("/");return a.length===2&&a[0]===path})}
  return {
    watchDoc:function(path,cb){var f=function(){cb(data[path]?clone(data[path]):null,false)};subs.push(f);setTimeout(f,0)},
    watchCol:function(path,cb){var f=function(){cb(col(path).map(function(k){return {id:k.split("/")[1],data:clone(data[k])}}),false)};subs.push(f);setTimeout(f,0)},
    merge:function(path,part){data[path]=dm(data[path]||{},clone(part));save();return Promise.resolve()},
    set:function(path,d){data[path]=clone(d);save();return Promise.resolve()},
    del:function(path){delete data[path];save();return Promise.resolve()}}}

function patchRoute(id,part,delay){
  var r=S.routes.get(id);if(!r||!canWrite)return;dm(r,clone(part));
  pend.set(id,dm(pend.get(id)||{},clone(part)));
  clearTimeout(timers.get(id));timers.set(id,setTimeout(function(){flush(id)},delay||450));
}
async function flush(id){
  if(!store||busy.has(id)||!pend.has(id))return;
  var p=pend.get(id);pend.delete(id);busy.add(id);
  try{await store.merge("routes/"+id,p)}catch(e){setSync("warn","Speichern fehlgeschlagen")}
  busy.delete(id);if(pend.has(id))flush(id);
}
function patchMeta(part){
  if(!canWrite)return;dm(S.meta,clone(part));metaPend=dm(metaPend||{},clone(part));
  clearTimeout(metaTimer);metaTimer=setTimeout(flushMeta,450);
}
async function flushMeta(){
  if(!store||metaBusy||!metaPend)return;var p=metaPend;metaPend=null;metaBusy=true;
  try{await store.merge("meta/main",p)}catch(e){setSync("warn","Speichern fehlgeschlagen")}
  metaBusy=false;if(metaPend)flushMeta();
}

/* ---------- Routen-Zeilen ---------- */
var listEl=$("list"), rowEls=new Map();
function buildRow(id){
  var row=el("article",{class:"row","data-id":id});
  var info=el("div",{class:"rinfo"});
  info.appendChild(el("div",{class:"rtop"},[el("span",{class:"no"}),el("span",{class:"pill"}),el("span",{class:"tag",text:"Extra"})]));
  info.appendChild(el("input",{type:"text",class:"rn","aria-label":"Routenname","data-f":"name"}));
  info.appendChild(el("input",{type:"text",class:"rnk",placeholder:"Spitzname","aria-label":"Spitzname (gilt für alle drei)","data-f":"rnick"}));
  info.appendChild(el("p",{class:"hint"}));
  info.appendChild(el("button",{type:"button",class:"rm","data-act":"rm",text:"Route entfernen"}));
  var cells=el("div",{class:"cells"});
  for(var i=0;i<3;i++){
    var c=el("div",{class:"cell","data-p":i});
    c.appendChild(el("div",{class:"who"},[el("span",{text:MARK[i]}),el("span",{class:"wn"})]));
    c.appendChild(el("input",{type:"text",class:"sp",placeholder:"Pokémon (optional)","aria-label":"Pokémon, optional","data-f":"sp",role:"combobox","aria-autocomplete":"list","aria-controls":"pk","aria-expanded":"false",autocomplete:"off"}));
    var seg=el("div",{class:"seg",role:"group","aria-label":"Zustand"});
    [["alive","✓","Lebt"],["dead","✕","Tot"],["miss","∅","Nicht gefangen"]].forEach(function(b){
      seg.appendChild(el("button",{type:"button","data-act":"st","data-v":b[0],title:b[2],"aria-label":b[2],"aria-pressed":"false",text:b[1]}))});
    c.appendChild(seg);cells.appendChild(c);
  }
  var foot=el("div",{class:"foot",hidden:""});
  foot.appendChild(el("div",{class:"field"},[el("label",{text:"Encounter getötet von"}),el("select",{"data-f":"killer","aria-label":"Encounter getötet von"})]));
  var dch=el("div",{class:"chips",role:"group","aria-label":"Tod bei"});
  for(var q=0;q<3;q++)dch.appendChild(el("button",{type:"button",class:"chipb","data-act":"death","data-p":q,"aria-pressed":"false"},[el("span",{text:MARK[q]+" "}),el("span",{class:"dn"})]));
  foot.appendChild(el("div",{class:"field"},[el("span",{class:"lbl",text:"Tod bei (im Kampf gefallen)"}),dch]));
  foot.appendChild(el("div",{class:"field"},[el("label",{text:"Ursache"}),el("input",{type:"text","data-f":"cause",placeholder:"z. B. Trainer, Crit, Fehlklick","aria-label":"Ursache"})]));
  foot.appendChild(el("button",{type:"button",class:"btn","data-act":"revive",text:"Link wiederbeleben"}));
  row.appendChild(info);row.appendChild(cells);row.appendChild(foot);
  return row;
}
function fill(inp,val){if(document.activeElement!==inp&&inp.value!==val)inp.value=val}
function fillSelect(sel){
  if(sel.options.length!==4){sel.textContent="";[["-1","Nicht festgelegt"]].concat([0,1,2].map(function(i){return[String(i),pname(i)]})).forEach(function(o){sel.appendChild(el("option",{value:o[0],text:o[1]}))})}
  else{for(var j=0;j<3;j++)sel.options[j+1].textContent=pname(j)}
}
function updateRow(row,id,idx){
  var r=S.routes.get(id);if(!r)return;var st=status(r);
  row.setAttribute("data-st",st);row.setAttribute("data-extra",r.extra?"1":"0");
  row.querySelector(".no").textContent=String(idx+1).padStart(2,"0");
  row.querySelector(".pill").textContent=STL[st];
  row.querySelector(".tag").hidden=!r.extra;
  var h=row.querySelector(".hint");h.textContent=r.hint||"";h.hidden=!r.hint;
  fill(row.querySelector('[data-f="name"]'),r.name||"");
  fill(row.querySelector('[data-f="rnick"]'),nickOf(r));
  row.querySelector(".rm").hidden=!r.custom;
  for(var i=0;i<3;i++){
    var c=row.querySelector('.cell[data-p="'+i+'"]'),d=cellOf(r,i);
    c.setAttribute("data-v",d.st);
    c.querySelector(".wn").textContent=pname(i);
    fill(c.querySelector('[data-f="sp"]'),d.sp);
    c.querySelectorAll(".seg button").forEach(function(b){b.setAttribute("aria-pressed",String(b.getAttribute("data-v")===d.st))});
  }
  row.querySelector(".foot").hidden=st!=="dead";
  var sel=row.querySelector("select");fillSelect(sel);sel.value=String(typeof r.killer==="number"?r.killer:-1);
  fill(row.querySelector('[data-f="cause"]'),r.cause||"");
  row.querySelectorAll(".chipb").forEach(function(cb){var qi=+cb.getAttribute("data-p");cb.querySelector(".dn").textContent=pname(qi);cb.setAttribute("aria-pressed",String(!!(r.deaths||{})[P[qi]]))});
}
function matches(r,st){
  if(ui.filter!=="all"&&st!==ui.filter)return false;
  var q=ui.q.trim().toLowerCase();if(!q)return true;
  var hay=[r.name||"",nickOf(r)];for(var i=0;i<3;i++){hay.push(cellOf(r,i).sp)}
  return hay.join(" ").toLowerCase().indexOf(q)>-1;
}
function renderList(){
  var arr=sorted(),seen={},shown=0,pos=0;
  arr.forEach(function(e,idx){
    var id=e[0],row=rowEls.get(id);
    if(!row){row=buildRow(id);rowEls.set(id,row);if(!canWrite)row.querySelectorAll("input,select,button").forEach(function(x){x.disabled=true})}
    seen[id]=1;updateRow(row,id,idx);
    var vis=matches(e[1],status(e[1]));row.hidden=!vis;if(vis)shown++;
    if(listEl.children[pos]!==row)listEl.insertBefore(row,listEl.children[pos]||null);
    pos++;
  });
  rowEls.forEach(function(row,id){if(!seen[id]){row.remove();rowEls.delete(id)}});
  var em=$("empty"),seed=$("seedBtn");
  if(arr.length===0){em.hidden=!routesLoaded;$("emptyT").textContent="Noch keine Routen. Lege die Standard-Routen an oder spiel unten ein Backup ein. (・・;)";seed.hidden=!canWrite}
  else{$("emptyT").textContent="Keine Route passt zum Filter. (・・;)";seed.hidden=true;em.hidden=shown>0||ui.view!=="edit"}
  $("rtCount").textContent=shown+" von "+arr.length+" Routen";
}

/* ---------- Gesamtliste ---------- */
function renderAllView(){
  for(var g=0;g<3;g++)$("ah"+g).textContent=MARK[g]+" "+pname(g);
  var body=$("allBody");body.textContent="";
  sorted().forEach(function(e,idx){var r=e[1],st=status(r);if(!matches(r,st))return;
    var tr=el("tr",{"data-st":st},[el("td",{class:"n",text:String(idx+1).padStart(2,"0")}),el("td",{class:"k",text:(r.name||"")+(r.extra?" ✦":"")}),el("td",null,[el("span",{class:"mon"+(st==="dead"?" d":""),text:nickOf(r)})])]);
    for(var i=0;i<3;i++){var d=cellOf(r,i),td=el("td");
      if(d.st==="miss")td.appendChild(el("span",{class:"sm2",text:"∅ nicht gefangen"}));
      else if(d.st||d.sp)td.appendChild(el("span",{class:d.sp?"":"sm2",text:(d.st==="dead"?"✕ ":"")+(d.sp||"gefangen")}));
      tr.appendChild(td)}
    tr.appendChild(el("td",null,[el("span",{class:"chip "+st,text:STC[st]})]));
    tr.appendChild(el("td",{text:st==="dead"?(killerName(r)||"offen"):""}));
    tr.appendChild(el("td",{text:st==="dead"?deathNames(r):""}));
    tr.appendChild(el("td",{text:st==="dead"?(r.cause||""):""}));
    body.appendChild(tr)});
  if(!body.children.length)body.appendChild(el("tr",null,[el("td",{colspan:"10",text:"Keine Route passt zum Filter.",class:"sm2"})]));
}
function allText(){
  var lines=["Soul Link Run "+S.meta.run.no];sorted().forEach(function(e,idx){var r=e[1],st=status(r);if(!matches(r,st))return;
    var parts=[0,1,2].map(function(i){var d=cellOf(r,i);return pname(i)+": "+(spText(d)||"-")});
    lines.push(String(idx+1).padStart(2,"0")+" "+(r.name||"")+(nickOf(r)?" – "+nickOf(r):"")+" | "+parts.join(" | ")+" | "+STC[st]+(st==="dead"?" (Encounter: "+(killerName(r)||"offen")+(deathNames(r)?"; Tod bei "+deathNames(r):"")+(r.cause?"; "+r.cause:"")+")":""))});
  return lines.join("\n");
}

/* ---------- Überblick, Spieler, Friedhof ---------- */
function renderStats(){
  var arr=sorted().map(function(e){return e[1]}),c={alive:0,dead:0,miss:0,part:0,open:0};
  arr.forEach(function(r){c[status(r)]++});
  var items=[["Routen",arr.length],["Aktive Links",c.alive+c.part],["Tote Links",c.dead],["Verpasst",c.miss],["Offen",c.open]];
  var k=$("kpis");k.textContent="";
  items.forEach(function(it){k.appendChild(el("div",{class:"card kpi"},[el("b",{text:String(it[1])}),el("span",{text:it[0]})]))});
  $("kpiNote").textContent=(c.alive+c.dead)+" komplette Links gefangen";
  var pl=$("players");
  if(!pl.children.length){for(var i=0;i<3;i++){
    pl.appendChild(el("div",{class:"card pc","data-i":i},[
      el("div",{class:"nm"},[el("span",{class:"mk",text:MARK[i],"aria-hidden":"true"}),el("input",{type:"text","aria-label":"Name Spieler "+(i+1),"data-i":i})]),
      el("div",{class:"badgeline"}),el("div",{class:"pstats"})]))}}
  for(var i2=0;i2<3;i2++){
    var card2=pl.children[i2],inp2=card2.querySelector("input");
    fill(inp2,(S.meta.players[P[i2]]||{}).name||"");inp2.placeholder=DEF[i2];
    var alive=0,dead=0,got=0;
    arr.forEach(function(r){var d=cellOf(r,i2);if(d.st==="alive"||d.st==="dead")got++;if(d.st==="alive")alive++;if(d.st==="dead")dead++});
    var bl=card2.querySelector(".badgeline");bl.textContent="";
    if(S.meta.run.status==="lost"&&(S.meta.run.enders||{})[P[i2]])bl.appendChild(el("span",{class:"badge",text:"Run-Ender (×_×)"}));
    var ps=card2.querySelector(".pstats");ps.textContent="";
    [["Gefangen",got],["Leben",alive],["Tot",dead]].forEach(function(s){ps.appendChild(el("div",null,[el("b",{text:String(s[1])}),el("span",{text:s[0]})]))});
  }
  for(var g=0;g<3;g++)$("gh"+g).textContent=pname(g);
  var gb=$("grave");gb.textContent="";var deadRows=sorted().filter(function(e){return status(e[1])==="dead"});
  if(!deadRows.length)gb.appendChild(el("tr",null,[el("td",{colspan:"8",class:"sm2",text:"Noch kein Link gestorben. (◕‿◕)"})]));
  deadRows.forEach(function(e){var r=e[1];
    var tr=el("tr",null,[el("td",{class:"k",text:r.name||""}),el("td",{class:"k",text:nickOf(r)}),el("td",{text:killerName(r)||"offen"})]);
    for(var i=0;i<3;i++){tr.appendChild(el("td",{text:cellOf(r,i).sp||"–"}))}
    tr.appendChild(el("td",{text:deathNames(r)}));tr.appendChild(el("td",{text:r.cause||""}));gb.appendChild(tr)});
}

/* ---------- Run, Zähler, Level-Caps ---------- */
var TK=[["run","Run"],["death","Death"],["enc","Encounter"]];
function live(i){var o={run:0,death:0,enc:0},rn=S.meta.run;
  if(rn.status==="lost"&&(rn.enders||{})[P[i]])o.run=1;
  S.routes.forEach(function(r){if(status(r)!=="dead")return;if((r.deaths||{})[P[i]])o.death++;if(r.killer===i)o.enc++});
  return o}
function baseOf(i,k){var t=(S.meta.tally||{})[P[i]]||{};return +t[k]||0}
function totalOf(i,k){return baseOf(i,k)+live(i)[k]}
function renderTally(){
  var tb=$("tally");
  if(!tb.children.length){for(var i=0;i<3;i++){var tr=el("tr");
    tr.appendChild(el("td",{class:"k"},[el("span",{class:"mk sm",text:MARK[i],"aria-hidden":"true"}),el("span",{class:"tn"})]));
    TK.forEach(function(k){var td=el("td");td.appendChild(el("div",{class:"stepper"},[
      el("button",{type:"button",class:"stp","data-t":k[0],"data-p":i,"data-d":"-1","aria-label":k[1]+" verringern",text:"−"}),
      el("input",{type:"text",inputmode:"numeric","data-t":k[0],"data-p":i,"aria-label":k[1]}),
      el("button",{type:"button",class:"stp","data-t":k[0],"data-p":i,"data-d":"1","aria-label":k[1]+" erhöhen",text:"+"})]));
      td.appendChild(el("small",{class:"lv"}));tr.appendChild(td)});
    tb.appendChild(tr)}}
  for(var j=0;j<3;j++){var row=tb.children[j],lv=live(j);
    row.querySelector(".tn").textContent=pname(j);
    TK.forEach(function(k,ki){var td=row.children[ki+1],inp=td.querySelector("input");
      inp.setAttribute("aria-label",k[1]+" "+pname(j));fill(inp,String(baseOf(j,k[0])+lv[k[0]]));
      td.querySelector(".lv").textContent=lv[k[0]]?"+"+lv[k[0]]+" dieser Run":""})}
}
function setTotal(i,key,v){if(!(v>=0))return;var part={tally:{}};part.tally[P[i]]={};part.tally[P[i]][key]=v-live(i)[key];patchMeta(part);renderTally();renderAna()}
function setRunNo(n){if(!(n>=1))return;patchMeta({run:{no:n}});renderRun()}
function capLv(c){var o=((S.meta.caps||{}).lv||{})[c.id];return typeof o==="number"&&o>0?o:c.lv}
function beaten(c){return !!(((S.meta.caps||{}).beaten||{})[c.id])}
function nextCap(){for(var i=0;i<CAPS.length;i++)if(!beaten(CAPS[i]))return CAPS[i];return null}
function badgeCount(){return CAPS.filter(function(c){return c.gym&&beaten(c)}).length}
function renderCaps(){
  var box=$("caps"),nx=nextCap();
  if(!box.children.length){CAPS.forEach(function(c){
    box.appendChild(el("div",{class:"card cap","data-id":c.id},[
      el("button",{type:"button",class:"tick","data-id":c.id,"aria-pressed":"false","aria-label":c.name+" besiegt"}),
      el("div",null,[el("span",{class:"cn",text:c.name}),el("span",{class:"cp",text:c.place})]),
      el("label",{class:"lvw"},[el("span",{text:"Lv"}),el("input",{type:"text",inputmode:"numeric","data-id":c.id,"aria-label":"Level-Cap "+c.name})])]))})}
  CAPS.forEach(function(c,i){var card=box.children[i],on=beaten(c);
    card.setAttribute("data-on",on?"1":"0");card.setAttribute("data-next",nx&&nx.id===c.id?"1":"0");
    var t=card.querySelector(".tick");t.setAttribute("aria-pressed",String(on));t.textContent=on?"✓":"";
    fill(card.querySelector("input"),String(capLv(c)))});
  $("capLv").textContent=nx?String(capLv(nx)):"✓";
  $("capWho").textContent=nx?"bis "+nx.name:"alle geschafft";
}
function renderRun(){
  var r=S.meta.run;
  fill($("runNo"),String(r.no));
  $("runSt").querySelectorAll("button").forEach(function(b){b.setAttribute("aria-pressed",String(b.getAttribute("data-v")===r.status))});
  var lost=r.status==="lost";$("runEnd").hidden=!lost;
  $("enders").querySelectorAll("button").forEach(function(b){var i=+b.getAttribute("data-p");b.querySelector(".en").textContent=pname(i);b.setAttribute("aria-pressed",String(!!(r.enders||{})[P[i]]))});
  fill($("runWhere"),r.where||"");fill($("runCause"),r.cause||"");
  var names=[0,1,2].filter(function(i){return (r.enders||{})[P[i]]}).map(pname).join(" und "),line=$("runLine");
  if(lost)line.textContent=names?"Run beendet von "+names+" (×_×)":"Run verloren (×_×)";
  else if(r.status==="won")line.textContent="Run gewonnen ✧*。٩(ˊᗜˋ*)و✧*。";
  else line.textContent="Run läuft (๑•̀ㅂ•́)و✧";
}

/* ---------- Auswertung ---------- */
function barRow(label,p,val,max,extra){var w=max>0?Math.round(val/max*100):0;
  return el("div",{class:"bar","data-p":p},[el("span",{class:"nmb",text:label}),el("div",{class:"tr"},[el("div",{class:"fl",style:"width:"+w+"%"})]),el("span",{class:"vl"},[document.createTextNode(String(val))].concat(extra?[el("small",{text:extra})]:[]))])}
function topList(map,n){return Object.keys(map).map(function(k){return [k,map[k]]}).sort(function(a,b){return b[1].n-a[1].n}).slice(0,n)}
function renderAna(){
  var tot=$("anaTotals");tot.textContent="";
  TK.forEach(function(k){var vals=[0,1,2].map(function(i){return totalOf(i,k[0])}),sum=vals.reduce(function(a,b){return a+b},0),max=Math.max.apply(null,vals);
    var box=el("div",{class:"card box"},[el("h3",{text:k[1]+" gesamt: "+sum})]);
    vals.forEach(function(v,i){box.appendChild(barRow(pname(i),i,v,max,sum?Math.round(v/sum*100)+" %":""))});
    tot.appendChild(box)});
  var H=S.history.map(function(h){return h.data}).sort(function(a,b){return (a.no||0)-(b.no||0)});
  $("anaNote").textContent=H.length?H.length+(H.length===1?" Run gespeichert":" Runs gespeichert"):"Runs werden ab dem nächsten „Neuer Run starten“ gespeichert";
  var k=$("anaKpis");k.textContent="";
  var avg=function(f){return H.length?(H.reduce(function(a,h){return a+f(h)},0)/H.length):0};
  var best=H.slice().sort(function(a,b){return (b.badges||0)-(a.badges||0)||(b.links||0)-(a.links||0)})[0];
  [["Gespeicherte Runs",String(H.length)],["Ø Links pro Run",H.length?avg(function(h){return h.links||0}).toFixed(1).replace(".",","):"–"],["Ø Orden pro Run",H.length?avg(function(h){return h.badges||0}).toFixed(1).replace(".",","):"–"],["Bester Run",best?"Run "+best.no+" · "+(best.badges||0)+" Orden":"–"]]
    .forEach(function(it){k.appendChild(el("div",{class:"card kpi"},[el("b",{text:it[1],style:"font-size:28px"}),el("span",{text:it[0]})]))});
  var where={},routes={};
  H.forEach(function(h){var w=(h.where||"").trim();if(h.status==="lost"&&w){var key=w.toLowerCase();where[key]=where[key]||{n:0,label:w};where[key].n++}
    (h.deadLinks||[]).forEach(function(d){var key=(d.route||"?");routes[key]=routes[key]||{n:0,label:key};routes[key].n++})});
  [["anaWhere",where,"Noch keine verlorenen Runs mit „Wo / gegen wen“ gespeichert."],["anaRoutes",routes,"Noch keine toten Links in gespeicherten Runs."]].forEach(function(x){
    var box=$(x[0]);box.textContent="";var top=topList(x[1],6);
    if(!top.length){box.appendChild(el("p",{class:"empty2",text:x[2]}));return}
    var max=top[0][1].n;top.forEach(function(t){box.appendChild(barRow(t[1].label,"x",t[1].n,max))})});
  var hb=$("histBody");hb.textContent="";
  if(!H.length)hb.appendChild(el("tr",null,[el("td",{colspan:"8",class:"sm2",text:"Noch kein Run gespeichert. Ältere Runs stecken nur in den Gesamtzahlen oben."})]));
  H.slice().reverse().forEach(function(h){var res={lost:"Verloren",won:"Gewonnen",run:"Abgebrochen"}[h.status]||"–";
    var en=[0,1,2].filter(function(i){return (h.enders||{})[P[i]]}).map(pname).join(", ");
    var dt=h.endedAt?new Date(h.endedAt).toLocaleDateString("de-DE"):"";
    hb.appendChild(el("tr",null,[el("td",{class:"k",text:"Run "+h.no}),el("td",null,[el("span",{class:"chip "+(h.status||"run"),text:res})]),el("td",{text:en}),el("td",{text:h.where||""}),el("td",{text:String(h.badges||0)}),el("td",{text:String(h.links||0)}),el("td",{text:String((h.deadLinks||[]).length)}),el("td",{text:dt})]))});
}
function renderAll(){renderRun();renderCaps();renderTally();renderStats();renderList();if(ui.view==="all")renderAllView();renderAna();renderBk()}

/* ---------- Backup-Erinnerung ---------- */
var BK_DAYS=7, autoBk=null;   // autoBk: letztes automatisches Backup (GitHub Action, config.js autoBackupUrl)
function ageOf(iso){var t=Date.parse(iso||"");return isNaN(t)?null:Math.floor((Date.now()-t)/864e5)}
function ageText(iso){var a=ageOf(iso);return new Date(iso).toLocaleDateString("de-DE",{day:"numeric",month:"long",year:"numeric"})+(a===0?" (heute)":a===1?" (gestern)":" (vor "+a+" Tagen)")}
function canon(x){if(Array.isArray(x))return "["+x.map(canon).join(",")+"]";
  if(x&&typeof x==="object")return "{"+Object.keys(x).sort().map(function(k){return JSON.stringify(k)+":"+canon(x[k])}).join(",")+"}";
  return JSON.stringify(x)}
function dataKey(meta,routes,history){var m=clone(meta);delete m.backupAt;return canon({meta:m,routes:routes,history:history})}
function autoBkCurrent(){   // entspricht das automatische Backup genau den aktuellen Daten?
  if(!autoBk)return false;var r={},h={};S.routes.forEach(function(v,id){r[id]=v});S.history.forEach(function(x){h[x.id]=x.data});
  return dataKey(dm(defMeta(),clone(autoBk.meta||{})),autoBk.routes||{},autoBk.history||{})===dataKey(S.meta,r,h);
}
function loadAutoBackup(){
  var url=(window.SOULLINK_CONFIG||{}).autoBackupUrl;if(!url||mode!=="firebase")return;
  fetch(url,{cache:"no-store"}).then(function(r){return r.ok?r.json():null}).then(function(o){if(o&&o.app==="soullink-bw"){autoBk=o;renderBk()}}).catch(function(){});
}
function renderBk(){
  var man=S.meta.backupAt||"",auto=autoBk?autoBk.exportedAt:"",last=$("bkLast"),warn=$("bkWarn");
  var parts=[];if(auto)parts.push("Automatisch: "+ageText(auto));if(man)parts.push("Von Hand: "+ageText(man));
  last.textContent=parts.length?"Letzte Sicherung. "+parts.join(" · "):"Noch keine Sicherung gemacht.";
  var ages=[ageOf(man),ageOf(auto)].filter(function(a){return a!==null}),age=ages.length?Math.min.apply(null,ages):null;
  var show=loaded&&routesLoaded&&canWrite&&backupAllowed()&&S.routes.size>0&&(age===null||age>=BK_DAYS)&&!autoBkCurrent();
  warn.hidden=!show;
  if(show)$("bkWarnT").textContent=age===null?"Es gibt noch keine Sicherung der Daten.":"Die letzte Sicherung ist "+age+" Tage alt.";
}
function markBackup(){patchMeta({backupAt:new Date().toISOString()});renderBk()}

/* ---------- Neuer Run ---------- */
function startNewRun(){
  if(!canWrite||!store)return;
  var r=S.meta.run,c={alive:0,dead:0};S.routes.forEach(function(x){var s=status(x);if(s in c)c[s]++});
  var dead=sorted().filter(function(e){return status(e[1])==="dead"}).map(function(e){var x=e[1];
    return {route:x.name||"",nick:nickOf(x),mons:[0,1,2].map(function(i){return cellOf(x,i).sp}),killer:typeof x.killer==="number"?x.killer:-1,deaths:clone(x.deaths||{}),cause:x.cause||""}});
  var per={},tally={};for(var i=0;i<3;i++){var lv=live(i);per[P[i]]=lv;tally[P[i]]={run:baseOf(i,"run")+lv.run,death:baseOf(i,"death")+lv.death,enc:baseOf(i,"enc")+lv.enc}}
  var nc=nextCap();
  var hist={no:+r.no||0,status:r.status,enders:clone(r.enders||{}),where:r.where||"",cause:r.cause||"",endedAt:new Date().toISOString(),badges:badgeCount(),lastCap:nc?nc.name:"alle",links:c.alive+c.dead,deadLinks:dead,perPlayer:per};
  var hid="run"+hist.no+"-"+Date.now().toString(36);
  S.history.push({id:hid,data:hist});
  store.set("history/"+hid,hist).catch(function(){setSync("warn","Run-Verlauf nicht gespeichert")});
  var n=0;S.routes.forEach(function(x,id){patchRoute(id,{nick:"",cells:EMPTY_CELLS(),killer:-1,cause:"",deaths:NO_DEATHS()},450+n*90);n++});
  var beat={};CAPS.forEach(function(cp){beat[cp.id]=false});
  patchMeta({tally:tally,caps:{beaten:beat},run:{no:(+r.no||0)+1,status:"run",enders:NO_DEATHS(),where:"",cause:""}});
  renderAll();
}

/* ---------- Eingaben ---------- */
function rowsOf(t){var row=t.closest(".row");return row?row.getAttribute("data-id"):null}
function onCellInput(t){
  var id=rowsOf(t);if(!id)return;var f=t.getAttribute("data-f"),r=S.routes.get(id),cell=t.closest(".cell");
  if(f==="name")patchRoute(id,{name:t.value});
  else if(f==="cause")patchRoute(id,{cause:t.value});
  else if(f==="rnick"){var nk=t.value.trim(),cs={};
    for(var k=0;k<3;k++){var cc=cellOf(r,k);if(nk&&!cc.st)cs[P[k]]={st:"alive"};else if(!nk&&cc.st==="alive"&&!cc.sp)cs[P[k]]={st:""}}
    patchRoute(id,{nick:t.value,cells:cs})}
  else if(cell){var pi=+cell.getAttribute("data-p"),p=P[pi],part={};part[p]={};part[p][f]=t.value;
    var cur=cellOf(r,pi),has=!!(t.value.trim()||nickOf(r).trim());
    if(!cur.st&&has)part[p].st="alive";else if(cur.st==="alive"&&!has)part[p].st="";
    patchRoute(id,{cells:part})}
  var row=t.closest(".row");updateRow(row,id,Array.from(listEl.children).indexOf(row));renderStats();
}
listEl.addEventListener("input",function(e){var t=e.target;onCellInput(t);if(t.getAttribute("data-f")==="sp")showPk(t)});
listEl.addEventListener("keydown",function(e){var t=e.target;if(t.getAttribute("data-f")!=="sp")return;
  if(e.key==="ArrowDown"){if(pk.hidden)showPk(t);else movePk(1);e.preventDefault()}
  else if(e.key==="ArrowUp"){movePk(-1);e.preventDefault()}
  else if(e.key==="Enter"&&!pk.hidden&&pkFor===t){pickPk(pkAct);e.preventDefault()}
  else if(e.key==="Escape"){closePk()}});
listEl.addEventListener("focusout",function(e){if(e.target===pkFor)setTimeout(function(){if(document.activeElement!==pkFor)closePk()},120)});
listEl.addEventListener("change",function(e){
  var t=e.target;if(t.getAttribute("data-f")!=="killer")return;patchRoute(rowsOf(t),{killer:+t.value});renderAll();
});
listEl.addEventListener("click",function(e){
  var b=e.target.closest("button[data-act]");if(!b||b.disabled)return;var id=rowsOf(b),r=S.routes.get(id),act=b.getAttribute("data-act");
  if(act==="st"){
    var ci=+b.closest(".cell").getAttribute("data-p"),v=b.getAttribute("data-v"),cur=cellOf(r,ci).st,cells={},extra={};
    var next=cur===v?"":v;cells[P[ci]]={st:next};
    if(next==="dead"){
      for(var i=0;i<3;i++)if(i!==ci&&cellOf(r,i).st==="alive"){cells[P[i]]={st:"dead"}}
      if(!(typeof r.killer==="number"&&r.killer>-1))extra.killer=ci;
      extra.deaths={};extra.deaths[P[ci]]=true;
    }else{extra.deaths={};extra.deaths[P[ci]]=false}
    patchRoute(id,dm({cells:cells},extra));
    if(status(r)!=="dead"&&(r.killer>-1||r.cause||deathNames(r)))patchRoute(id,{killer:-1,cause:"",deaths:NO_DEATHS()});
  }else if(act==="death"){
    var di=+b.getAttribute("data-p"),dd={};dd[P[di]]=!((r.deaths||{})[P[di]]);
    var pp={deaths:dd};if(dd[P[di]]&&!(typeof r.killer==="number"&&r.killer>-1))pp.killer=di;
    patchRoute(id,pp);
  }else if(act==="revive"){
    var c2={};for(var k=0;k<3;k++)if(cellOf(r,k).st==="dead")c2[P[k]]={st:"alive"};
    patchRoute(id,{cells:c2,killer:-1,cause:"",deaths:NO_DEATHS()});
  }else if(act==="rm"){
    if(b.getAttribute("data-sure")!=="1"){b.setAttribute("data-sure","1");b.textContent="Wirklich entfernen?";return}
    S.routes.delete(id);pend.delete(id);if(store)store.del("routes/"+id).catch(function(){setSync("warn","Löschen fehlgeschlagen")});
  }
  renderAll();
});
$("addBtn").addEventListener("click",function(){
  if(!canWrite||!store)return;
  var max=0;S.routes.forEach(function(r){if((r.order||0)>max)max=r.order||0});
  var id="c"+Date.now().toString(36),r={order:Math.floor(max)+1,name:"Neue Route",nick:"",custom:true,killer:-1,cause:"",deaths:NO_DEATHS(),cells:EMPTY_CELLS()};
  S.routes.set(id,r);setView("edit");renderAll();
  store.set("routes/"+id,r).catch(function(){setSync("warn","Speichern fehlgeschlagen")});
  var row=rowEls.get(id);if(row){var inp=row.querySelector('[data-f="name"]');row.scrollIntoView({block:"center"});inp.focus();inp.select()}
});
async function seedRoutes(){
  if(!canWrite||!store)return;$("seedBtn").disabled=true;
  for(var i=0;i<DEFAULT_ROUTES.length;i++){var d=DEFAULT_ROUTES[i],r={order:d[1],name:d[2],nick:"",custom:false,killer:-1,cause:"",deaths:NO_DEATHS(),cells:EMPTY_CELLS()};
    if(d[3]){r.extra=true;r.hint=FOSSIL_HINT}
    S.routes.set(d[0],r);try{await store.set("routes/"+d[0],r)}catch(e){setSync("warn","Speichern fehlgeschlagen")}await sleep(40)}
  $("seedBtn").disabled=false;renderAll();
}
$("seedBtn").addEventListener("click",seedRoutes);
function setView(v){ui.view=v;
  $("viewSeg").querySelectorAll("button").forEach(function(x){x.setAttribute("aria-pressed",String(x.getAttribute("data-v")===v))});
  listEl.hidden=v!=="edit";$("viewAll").hidden=v!=="all";$("addBtn").hidden=v!=="edit";
  renderList();if(v==="all")renderAllView();
}
$("viewSeg").addEventListener("click",function(e){var b=e.target.closest("button");if(b)setView(b.getAttribute("data-v"))});
$("filter").addEventListener("click",function(e){var b=e.target.closest("button");if(!b)return;ui.filter=b.getAttribute("data-v");
  this.querySelectorAll("button").forEach(function(x){x.setAttribute("aria-pressed",String(x===b))});renderList();if(ui.view==="all")renderAllView()});
$("q").addEventListener("input",function(){ui.q=this.value;renderList();if(ui.view==="all")renderAllView()});
function copyText(txt,note,onOk){
  function fail(){note.textContent="Kopieren blockiert, bitte Text manuell markieren";note.classList.add("err")}
  try{navigator.clipboard.writeText(txt).then(function(){note.classList.remove("err");note.textContent="Kopiert ✧";if(onOk)onOk()},fail)}catch(e){fail()}
  setTimeout(function(){note.textContent=""},3500);
}
$("copyBtn").addEventListener("click",function(){copyText(allText(),$("copyNote"))});
$("players").addEventListener("input",function(e){var t=e.target,i=t.getAttribute("data-i");if(i===null)return;
  var part={players:{}};part.players[P[+i]]={name:t.value};patchMeta(part);
  renderRun();renderTally();renderAna();for(var g=0;g<3;g++)$("gh"+g).textContent=pname(g);
  rowEls.forEach(function(row,id){updateRow(row,id,Array.from(listEl.children).indexOf(row))});
  if(ui.view==="all")renderAllView()});
$("runWhere").addEventListener("input",function(){patchMeta({run:{where:this.value}})});
$("runCause").addEventListener("input",function(){patchMeta({run:{cause:this.value}})});
$("runSt").addEventListener("click",function(e){var b=e.target.closest("button");if(!b)return;patchMeta({run:{status:b.getAttribute("data-v")}});renderAll()});
$("enders").addEventListener("click",function(e){var b=e.target.closest("button");if(!b)return;var i=+b.getAttribute("data-p"),part={run:{enders:{}}};part.run.enders[P[i]]=!(S.meta.run.enders||{})[P[i]];patchMeta(part);renderAll()});
$("runNoM").addEventListener("click",function(){setRunNo((+S.meta.run.no||1)-1)});
$("runNoP").addEventListener("click",function(){setRunNo((+S.meta.run.no||0)+1)});
$("runNo").addEventListener("change",function(){var v=parseInt(this.value,10);if(isNaN(v)||v<1){renderRun();return}setRunNo(v)});
$("tally").addEventListener("click",function(e){var b=e.target.closest("button.stp");if(!b)return;var i=+b.getAttribute("data-p"),k=b.getAttribute("data-t");setTotal(i,k,totalOf(i,k)+(+b.getAttribute("data-d")))});
$("tally").addEventListener("change",function(e){var t=e.target;if(t.tagName!=="INPUT")return;var v=parseInt(t.value,10),i=+t.getAttribute("data-p"),k=t.getAttribute("data-t");if(isNaN(v)||v<0){renderTally();return}setTotal(i,k,v)});
$("caps").addEventListener("click",function(e){var b=e.target.closest(".tick");if(!b)return;var id=b.getAttribute("data-id"),part={caps:{beaten:{}}};
  part.caps.beaten[id]=!((S.meta.caps||{}).beaten||{})[id];patchMeta(part);renderCaps()});
$("caps").addEventListener("change",function(e){var t=e.target;if(t.tagName!=="INPUT")return;var v=parseInt(t.value,10),id=t.getAttribute("data-id");
  if(isNaN(v)||v<1){renderCaps();return}var part={caps:{lv:{}}};part.caps.lv[id]=v;patchMeta(part);renderCaps()});
var nrTimer;
$("newRun").addEventListener("click",function(){
  var b=this;
  if(b.getAttribute("data-sure")!=="1"){b.setAttribute("data-sure","1");b.textContent="Wirklich? Run "+((+S.meta.run.no||0)+1)+" starten";clearTimeout(nrTimer);nrTimer=setTimeout(function(){b.removeAttribute("data-sure");b.textContent="Neuer Run starten"},6000);return}
  clearTimeout(nrTimer);b.removeAttribute("data-sure");b.textContent="Neuer Run starten";startNewRun();
});

/* ---------- Backup ---------- */
function exportData(){var o={app:"soullink-bw",version:2,exportedAt:new Date().toISOString(),meta:clone(S.meta),routes:{},history:{}};
  S.routes.forEach(function(r,id){o.routes[id]=clone(r)});S.history.forEach(function(h){o.history[h.id]=clone(h.data)});return JSON.stringify(o)}
async function importData(txt){
  var o=JSON.parse(txt);if(!o||o.app!=="soullink-bw"||!o.meta||!o.routes)throw new Error("Das ist kein Soul-Link-Backup.");
  await store.set("meta/main",dm(defMeta(),o.meta));
  var ids=Object.keys(o.routes);
  for(var i=0;i<ids.length;i++){await store.set("routes/"+ids[i],o.routes[ids[i]]);await sleep(40)}
  var old=Array.from(S.routes.keys());for(var j=0;j<old.length;j++)if(!o.routes[old[j]]){await store.del("routes/"+old[j]);await sleep(40)}
  var hs=Object.keys(o.history||{});for(var h=0;h<hs.length;h++){await store.set("history/"+hs[h],o.history[hs[h]]);await sleep(40)}
  return ids.length;
}
$("bkCopy").addEventListener("click",function(){copyText(exportData(),$("bkS1"),markBackup)});
$("bkDl").addEventListener("click",function(){var a=el("a",{href:URL.createObjectURL(new Blob([exportData()],{type:"application/json"})),download:"soullink-backup-run"+S.meta.run.no+".json"});document.body.appendChild(a);a.click();a.remove();markBackup()});
$("bkWarnGo").addEventListener("click",function(){var box=$("bkBox");box.open=true;box.scrollIntoView({behavior:"smooth",block:"start"});($("bkDl").hidden?$("bkCopy"):$("bkDl")).focus({preventScroll:true})});
$("bkFile").addEventListener("change",function(){var f=this.files&&this.files[0];if(!f)return;var rd=new FileReader();rd.onload=function(){$("bkIn").value=String(rd.result||"")};rd.readAsText(f)});
var bkTimer;
$("bkGo").addEventListener("click",async function(){
  var b=this,s=$("bkS2");s.classList.remove("err");
  if(!canWrite||!store){s.textContent="Speichern ist hier nicht möglich.";s.classList.add("err");return}
  var txt=$("bkIn").value.trim();if(!txt){s.textContent="Bitte zuerst ein Backup einfügen oder eine Datei wählen.";s.classList.add("err");return}
  try{var o=JSON.parse(txt);if(o.app!=="soullink-bw")throw 0}catch(e){s.textContent="Das ist kein gültiges Soul-Link-Backup.";s.classList.add("err");return}
  if(b.getAttribute("data-sure")!=="1"){b.setAttribute("data-sure","1");b.textContent="Wirklich ersetzen?";s.textContent="Backup von Run "+(o.meta&&o.meta.run?o.meta.run.no:"?")+" mit "+Object.keys(o.routes||{}).length+" Routen. Die aktuellen Daten werden ersetzt.";
    clearTimeout(bkTimer);bkTimer=setTimeout(function(){b.removeAttribute("data-sure");b.textContent="Backup einspielen"},8000);return}
  clearTimeout(bkTimer);b.removeAttribute("data-sure");b.textContent="Backup einspielen";b.disabled=true;s.textContent="Spiele ein …";
  try{var n=await importData(txt);s.textContent="Fertig: "+n+" Routen eingespielt ✧";$("bkIn").value=""}catch(e){s.textContent="Fehler: "+(e&&e.message?e.message:"Einspielen fehlgeschlagen");s.classList.add("err")}
  b.disabled=false;
});

/* ---------- Anmeldung und Rechte (nur Firebase-Modus) ----------
   Lesen darf jeder. Schreiben darf, wer mit Google angemeldet ist und entweder Admin ist
   (config.js adminUid) oder dessen E-Mail in access/main steht. Backup und Freischaltung nur für den Admin.
   Die echte Prüfung machen die Firestore-Regeln; die Seite blendet nur passend ein und aus. */
function backupAllowed(){return mode!=="firebase"||isAdmin}
function setCanWrite(v){
  if(canWrite===v)return;canWrite=v;document.body.classList.toggle("ro",!v);
  rowEls.forEach(function(row){row.remove()});rowEls.clear();   // Zeilen neu bauen, damit Felder (de)aktiviert werden
  renderAll();if(loaded)setSync("live",v?LIVE_LABEL:"Nur Lesen");
}
function applyRole(){
  $("bkSec").hidden=!backupAllowed();
  $("accSec").hidden=!(mode==="firebase"&&isAdmin);
  renderBk();
}
function renderAuth(){
  var box=$("auth"),t=$("authT"),b=$("authBtn");box.hidden=mode!=="firebase";if(box.hidden)return;
  if(!authKnown){t.textContent="";b.hidden=true;return}
  b.hidden=false;
  if(!authUser){t.textContent="Zum Eintragen anmelden";b.textContent="Mit Google anmelden";box.removeAttribute("data-s");return}
  var who=authUser.displayName||authUser.email||"Angemeldet";
  b.textContent="Abmelden";
  if(canWrite){t.textContent=who+(isAdmin?" (Admin)":"");box.setAttribute("data-s","ok")}
  else{t.textContent=(authUser.email||who)+" ist nicht freigeschaltet";box.setAttribute("data-s","no")}
}
var accUnsub=null;
function watchAccess(){
  if(accUnsub){accUnsub();accUnsub=null}
  if(!isAdmin)return;
  accUnsub=firebase.firestore().doc("access/main").onSnapshot(function(s){
    var ta=$("accEmails");if(document.activeElement!==ta)ta.value=((s.exists&&s.data().emails)||[]).join("\n");
  },function(){$("accS").textContent="Freischaltungen konnten nicht geladen werden.";$("accS").classList.add("err")});
}
async function onAuth(u){
  authUser=u;authKnown=true;var adminUid=(window.SOULLINK_CONFIG||{}).adminUid||"";
  isAdmin=!!(u&&adminUid&&u.uid===adminUid);
  var ok=false;
  if(u&&isAdmin)ok=true;
  else if(u){try{await firebase.firestore().doc("access/main").get();ok=true}catch(e){ok=false}}   // lesbar nur für Freigeschaltete
  setCanWrite(ok);applyRole();renderAuth();watchAccess();
}
$("authBtn").addEventListener("click",function(){
  if(!auth)return;
  if(authUser){auth.signOut();return}
  var p=new firebase.auth.GoogleAuthProvider();p.setCustomParameters({prompt:"select_account"});
  auth.signInWithPopup(p).catch(function(e){
    var c=e&&e.code||"";
    if(c==="auth/popup-blocked"||c==="auth/operation-not-supported-in-this-environment")auth.signInWithRedirect(p);
    else if(c!=="auth/popup-closed-by-user"&&c!=="auth/cancelled-popup-request")setSync("warn","Anmeldung fehlgeschlagen");
  });
});
$("accSave").addEventListener("click",function(){
  var s=$("accS");s.classList.remove("err");
  var list=$("accEmails").value.split(/[\s,;]+/).map(function(x){return x.trim().toLowerCase()}).filter(Boolean);
  var bad=list.filter(function(x){return !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(x)});
  if(bad.length){s.textContent="Keine gültige E-Mail: "+bad.join(", ");s.classList.add("err");return}
  list=list.filter(function(x,i){return list.indexOf(x)===i});
  if(list.length>10){s.textContent="Höchstens 10 Adressen.";s.classList.add("err");return}
  firebase.firestore().doc("access/main").set({emails:list})   // eigenes Dokument, nicht Teil von meta/routes
    .then(function(){s.textContent="Gespeichert ✧ ("+list.length+" freigeschaltet)"},function(){s.textContent="Speichern fehlgeschlagen";s.classList.add("err")});
});

/* ---------- Start ---------- */
function loadScript(src){return new Promise(function(res,rej){var s=document.createElement("script");s.src=src;s.onload=res;s.onerror=function(){rej(new Error("Script "+src))};document.head.appendChild(s)})}
var LIVE_LABEL="Live synchronisiert";
function ready(fromCache){if(!fromCache){loaded=true;clearTimeout(tm);setSync(mode==="local"?"warn":"live",canWrite?LIVE_LABEL:"Nur Lesen");renderBk()}}
function subscribe(){
  var err=function(){setSync("warn","Verbindung getrennt")};
  store.watchDoc("meta/main",function(d,fc){
    if(d&&!metaPend&&!metaBusy){S.meta=dm(defMeta(),clone(d));renderAll()}
    ready(fc)},err);
  store.watchCol("routes",function(docs,fc){
    var ids={};
    docs.forEach(function(d){ids[d.id]=1;if(pend.has(d.id)||busy.has(d.id))return;S.routes.set(d.id,clone(d.data))});
    Array.from(S.routes.keys()).forEach(function(id){if(!ids[id]&&!pend.has(id))S.routes.delete(id)});
    if(!fc)routesLoaded=true;renderAll();ready(fc)},err);
  store.watchCol("history",function(docs){S.history=docs.map(function(d){return {id:d.id,data:clone(d.data)}});renderAna()},err);
}
renderAll();
var tm=setTimeout(function(){if(!loaded)setSync("warn","Daten noch nicht erreichbar")},10000);
(async function(){
  var CFG=window.SOULLINK_CONFIG||null;
  try{
    if(CFG&&CFG.firebase&&CFG.firebase.projectId&&CFG.firebase.projectId.indexOf("DEIN")!==0){
      mode="firebase";LIVE_LABEL="Live synchronisiert";
      await loadScript("https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js");
      await loadScript("https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore-compat.js");
      await loadScript("https://www.gstatic.com/firebasejs/10.12.2/firebase-auth-compat.js");
      firebase.initializeApp(CFG.firebase);store=makeFirebaseStore(firebase.firestore());
      $("bkDl").hidden=false;
      setCanWrite(false);applyRole();renderAuth();   // bis die Anmeldung geklärt ist: nur lesen
      auth=firebase.auth();auth.onAuthStateChanged(onAuth);
      loadAutoBackup();
    }else if(window.claude&&window.claude.use){
      mode="artifact";
      var user=await claude.use("user");
      if(user&&user.can){try{var w=await user.can("data.write");if(w===false)canWrite=false}catch(e){}}
      var db=await claude.use("db");
      if(!db){setSync("warn","Zum Speichern bitte in claude.ai anmelden");return}
      if(!canWrite)document.body.classList.add("ro");
      store=makeArtifactStore(db);
    }else{
      mode="local";LIVE_LABEL="Nur auf diesem Gerät gespeichert";store=makeLocalStore();$("bkDl").hidden=false;
    }
  }catch(e){mode="local";LIVE_LABEL="Online-Speicher nicht erreichbar, nur lokal";store=makeLocalStore();$("bkDl").hidden=false;setCanWrite(true);applyRole();renderAuth()}
  subscribe();
})();
})();
