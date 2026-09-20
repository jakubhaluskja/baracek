import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js";
import {
  getFirestore, collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc,
  serverTimestamp, setDoc, getDoc
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";
import {
  getAuth, GoogleAuthProvider, signInWithPopup, onAuthStateChanged, signOut
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyANoWH1tc7UnCmPEKBTzdG76Z7aCe5LPE0",
  authDomain: "baracek-ec669.firebaseapp.com",
  projectId: "baracek-ec669",
  storageBucket: "baracek-ec669.firebasestorage.app",
  messagingSenderId: "995078854691",
  appId: "1:995078854691:web:a1ac3a2b20885ddb657996"
};
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const CLOUD_NAME = "cm0oafid";
const UPLOAD_PRESET = "rekonstrukce_upload";
const ALLOWED_EMAILS = ["info@jakubhaluska.cz", "jancahaluskova@gmail.com"];

const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();
let dataInitialized = false;

/* ---------- STATE ---------- */
const state = {
  rooms: [], contacts: [], statusEntries: [], documents: [],
  financeCategories: [], financeItems: [], budgets: [], tasks: [],
  photos: [], materials: [], notes: []
};
let ready = {};
let financeFilterCat = null;
let docCatFilter = null;
let onStateChange = null; // set by mountPage

/* ---------- ICONS ---------- */
const ICO = {
  dashboard:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="3" width="8" height="8" rx="2"/><rect x="13" y="3" width="8" height="5" rx="2"/><rect x="13" y="11" width="8" height="10" rx="2"/><rect x="3" y="13" width="8" height="8" rx="2"/></svg>',
  stav:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 3v9l6 3"/><circle cx="12" cy="12" r="9"/></svg>',
  dokumenty:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M7 3h7l5 5v13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z"/><path d="M14 3v5h5"/></svg>',
  finance:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="9"/><path d="M12 7v10M15 9.5c0-1.4-1.3-2.5-3-2.5s-3 1-3 2.3c0 3 6 1.4 6 4.3 0 1.4-1.3 2.4-3 2.4s-3-1-3-2.4"/></svg>',
  rozpocet:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M3 3v18h18"/><rect x="7" y="12" width="3" height="6"/><rect x="12" y="8" width="3" height="10"/><rect x="17" y="5" width="3" height="13"/></svg>',
  kontakty:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="8" r="3.5"/><path d="M4.5 20c1.6-3.6 4.4-5.5 7.5-5.5s5.9 1.9 7.5 5.5"/></svg>',
  ukoly:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 6h16M4 12h16M4 18h9"/><circle cx="19" cy="18" r="2.3"/></svg>',
  fotogalerie:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="9" cy="11" r="2"/><path d="M21 17l-5.5-5-4 4L8 13l-5 5"/></svg>',
  mistnosti:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V21h14V9.5"/></svg>',
  kalendar:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/></svg>',
  materialy:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M21 8 12 3 3 8l9 5 9-5z"/><path d="M3 8v8l9 5 9-5V8M12 13v8"/></svg>',
  poznamky:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 4h16v13l-4 4H4z"/><path d="M8 9h8M8 13h5"/></svg>',
  plus:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg>',
  edit:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/></svg>',
  trash:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/></svg>',
  x:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6 6 18M6 6l12 12"/></svg>',
  menu:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 7h16M4 12h16M4 17h16"/></svg>',
  check:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 13l4 4L19 7"/></svg>',
};
const CAT_ICONS = ["🔨","🧱","⚡","🚰","🎨","📦","🏠","💡","🪑","🧰","🌿","💶","🪟","🚪","🛋️","🚿","🛁","🧽","🪣","🧴","🔌","🪛","🪚","🔧","🧯","🚽","🏗️","🧾","📐","🖌️","🪵","🌡️","🔥","🛏️","🌳","🧹","🗑️","📺","🧺","🔑","🪜","🧵","🖼️","💧"];

export const SECTIONS = [
  {id:"dashboard", label:"Dashboard", href:"dashboard.html"},
  {id:"stav", label:"Stav", href:"stav.html"},
  {id:"dokumenty", label:"Dokumenty", href:"dokumenty.html"},
  {id:"finance", label:"Finance", href:"finance.html"},
  {id:"rozpocet", label:"Rozpočet", href:"rozpocet.html"},
  {id:"kontakty", label:"Kontakty", href:"kontakty.html"},
  {id:"ukoly", label:"Úkoly", href:"ukoly.html"},
  {id:"fotogalerie", label:"Fotogalerie", href:"fotogalerie.html"},
  {id:"mistnosti", label:"Místnosti", href:"mistnosti.html"},
  {id:"kalendar", label:"Kalendář", href:"kalendar.html"},
  {id:"materialy", label:"Materiály", href:"materialy.html"},
  {id:"poznamky", label:"Poznámky", href:"poznamky.html"},
];

/* ---------- UTIL ---------- */
function esc(s){ return (s===undefined||s===null) ? "" : String(s).replace(/[&<>"']/g, c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c])); }
function fmtDate(d){ if(!d) return "—"; const dt = new Date(d+"T00:00:00"); if(isNaN(dt)) return d; return dt.toLocaleDateString('cs-CZ',{day:'numeric',month:'long',year:'numeric'}); }
function fmtDateShort(d){ if(!d) return "—"; const dt = new Date(d+"T00:00:00"); if(isNaN(dt)) return d; return dt.toLocaleDateString('cs-CZ',{day:'numeric',month:'numeric',year:'numeric'}); }
function fmtMoney(n){ const v = Number(n)||0; return v.toLocaleString('cs-CZ',{maximumFractionDigits:0}) + " Kč"; }
function fmtDateTime(ts){ if(!ts) return "—"; const dt = ts.toDate ? ts.toDate() : new Date(ts); return dt.toLocaleDateString('cs-CZ',{day:'numeric',month:'numeric',year:'numeric'}); }
function todayISO(){ return new Date().toISOString().slice(0,10); }
function byId(list,id){ return list.find(x=>x.id===id); }
function roomName(id){ const r = byId(state.rooms,id); return r ? r.name : null; }
function contactName(id){ const c = byId(state.contacts,id); return c ? c.name : null; }
function catObj(id){ return byId(state.financeCategories,id); }
function statusLabel(s){ return s==='hotovo'?'Hotovo':s==='probiha'?'Probíhá':'Čeká'; }
function fmtDoba(d){
  if(!d) return "";
  const trimmed = String(d).trim();
  if(/^\d+([.,]\d+)?$/.test(trimmed)){
    const num = trimmed.replace(',', '.');
    const n = parseFloat(num);
    return `${trimmed} ${n===1?'hodina':(n>=2&&n<=4?'hodiny':'hodin')}`;
  }
  return trimmed;
}

/* ---------- FIRESTORE CRUD ---------- */
async function addItem(col, data){ return addDoc(collection(db,col), data); }
async function updateItem(col, id, data){ return updateDoc(doc(db,col,id), data); }
async function deleteItem(col, id){ return deleteDoc(doc(db,col,id)); }

function subscribe(col){
  onSnapshot(collection(db,col), snap=>{
    state[col] = snap.docs.map(d=>({id:d.id, ...d.data()}));
    ready[col] = true;
    maybeSeedFinanceCategories();
    if(onStateChange) onStateChange();
  }, err=>{
    console.error("Firestore chyba pro", col, err);
  });
}
function initData(){
  ["rooms","contacts","statusEntries","documents","financeCategories","financeItems","budgets","tasks","photos","materials","notes"].forEach(subscribe);
}

let seeded = false;
async function maybeSeedFinanceCategories(){
  if(seeded) return;
  if(!ready.financeCategories) return;
  seeded = true;
  if(state.financeCategories.length===0){
    const defaults = [
      {name:"Materiál", color:"#A85C36", icon:"🧱"},
      {name:"Práce řemeslníků", color:"#2F4A3D", icon:"🔨"},
      {name:"Elektro a instalace", color:"#7A5A12", icon:"⚡"},
      {name:"Vybavení", color:"#5B6EA8", icon:"🪑"},
      {name:"Úřady a poplatky", color:"#7A7266", icon:"📋"},
    ];
    for(const c of defaults){ await addItem("financeCategories", c); }
  }
}

/* ---------- CLOUDINARY ---------- */
async function uploadFile(file){
  const fd = new FormData();
  fd.append("file", file);
  fd.append("upload_preset", UPLOAD_PRESET);
  const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/auto/upload`, {method:"POST", body:fd});
  if(!res.ok) throw new Error("Nahrání souboru selhalo");
  const data = await res.json();
  return data.secure_url;
}

/* ---------- MODAL / FORM ENGINE ---------- */
function openModalRaw(html){
  document.getElementById("modalBox").innerHTML = html;
  document.getElementById("overlay").classList.add("open");
}
function closeModal(){ document.getElementById("overlay").classList.remove("open"); document.getElementById("modalBox").innerHTML=""; }

function fieldHTML(f, existing){
  const val = existing ? existing[f.key] : (f.default!==undefined ? f.default : "");
  const opts = typeof f.options === "function" ? f.options() : (f.options||[]);
  switch(f.type){
    case "textarea":
      return `<label class="field">${f.label}<textarea name="${f.key}" placeholder="${esc(f.placeholder||'')}" ${f.required?'required':''}>${esc(val)}</textarea></label>`;
    case "number":
      return `<label class="field">${f.label}<input type="number" step="any" name="${f.key}" value="${val!==undefined&&val!==null?val:''}" placeholder="${esc(f.placeholder||'')}" ${f.required?'required':''}></label>`;
    case "date":
      return `<label class="field">${f.label}<input type="date" name="${f.key}" value="${val||''}" ${f.required?'required':''}></label>`;
    case "url":
      return `<label class="field">${f.label}<input type="url" name="${f.key}" value="${esc(val)}" placeholder="${esc(f.placeholder||'https://')}"></label>`;
    case "color":
      return `<label class="field">${f.label}<input type="color" name="${f.key}" value="${val||'#2F4A3D'}"></label>`;
    case "select":
      return `<label class="field">${f.label}<select name="${f.key}">${f.allowEmpty?'<option value="">—</option>':''}${opts.map(o=>`<option value="${esc(o.value)}" ${String(o.value)===String(val)?'selected':''}>${esc(o.label)}</option>`).join('')}</select></label>`;
    case "icon":
      return `<label class="field">${f.label}<select name="${f.key}">${CAT_ICONS.map(i=>`<option value="${i}" ${i===val?'selected':''}>${i}</option>`).join('')}</select></label>`;
    case "checkbox":
      return `<label class="field checkbox-row"><input type="checkbox" name="${f.key}" ${val?'checked':''}> ${f.label}</label>`;
    case "file":
      return `<label class="field">${f.label}<input type="file" name="${f.key}" accept="${f.accept||'*'}" ${f.required && !val ? 'required':''}>${val?`<div class="current-file">Aktuální soubor: <a href="${val}" target="_blank" rel="noopener">otevřít</a></div>`:''}</label>`;
    default:
      return `<label class="field">${f.label}<input type="text" name="${f.key}" value="${esc(val)}" placeholder="${esc(f.placeholder||'')}" ${f.required?'required':''}></label>`;
  }
}

function openForm({title, fields, existing, onSubmit, extraFooter}){
  const html = `
    <div class="row-between" style="margin-bottom:10px;">
      <h2>${esc(title)}</h2>
      <button type="button" class="icon-btn" id="modalClose">${ICO.x}</button>
    </div>
    <form id="modalForm">
      ${fields.map(f=>fieldHTML(f, existing)).join("")}
      ${extraFooter||""}
      <div class="modal-actions">
        <button type="button" class="btn btn-ghost" id="modalCancel">Zrušit</button>
        <button type="submit" class="btn btn-primary">Uložit</button>
      </div>
    </form>
  `;
  openModalRaw(html);
  document.getElementById("modalClose").onclick = closeModal;
  document.getElementById("modalCancel").onclick = closeModal;
  document.getElementById("modalForm").onsubmit = async (e)=>{
    e.preventDefault();
    const btn = e.target.querySelector('button[type=submit]');
    btn.disabled = true; btn.textContent = "Ukládám…";
    try{
      const fd = new FormData(e.target);
      const out = {};
      for(const f of fields){
        if(f.type==="checkbox"){ out[f.key] = fd.has(f.key); continue; }
        if(f.type==="file"){
          const file = fd.get(f.key);
          if(file && file.size>0){ out[f.key] = await uploadFile(file); }
          else if(existing && existing[f.key]){ out[f.key] = existing[f.key]; }
          continue;
        }
        if(f.type==="number"){ const v = fd.get(f.key); out[f.key] = v===""? null : parseFloat(v); continue; }
        out[f.key] = fd.get(f.key) || "";
      }
      await onSubmit(out);
      closeModal();
    }catch(err){
      console.error(err);
      alert("Něco se nepovedlo: " + err.message);
      btn.disabled = false; btn.textContent = "Uložit";
    }
  };
}

function confirmDelete(msg, fn){
  if(confirm(msg||"Opravdu smazat?")) fn();
}

/* ---------- SHARED OPTION LISTS ---------- */
const roomOptions = ()=> state.rooms.map(r=>({value:r.id,label:r.name}));
const contactOptions = ()=> state.contacts.map(c=>({value:c.id,label:c.name}));
const financeCatOptions = ()=> state.financeCategories.map(c=>({value:c.id,label:`${c.icon||''} ${c.name}`}));
const statusEntryOptions = ()=> state.statusEntries
  .slice().sort((a,b)=> (b.date||'').localeCompare(a.date||''))
  .map(s=>({value:s.id,label:`${fmtDateShort(s.date)} — ${(s.popis||'').slice(0,40)}`}));

/* ================= DASHBOARD ================= */
function renderDashboard(){
  const doneEntries = state.statusEntries.filter(s=>!s.planned).slice().sort((a,b)=>(b.date||'').localeCompare(a.date||''));
  const lastEntry = doneEntries[0];
  const upcoming = getUpcomingItems().slice(0,5);
  const openTasks = state.tasks.filter(t=>t.status!=='hotovo').length;
  const totalTasks = state.tasks.length;
  const now = new Date();
  const monthStr = now.toISOString().slice(0,7);
  const spentThisMonth = state.financeItems.filter(i=>(i.date||'').startsWith(monthStr) && i.type==='vydaj').reduce((s,i)=>s+Math.abs(i.amount||0),0);
  const totalSpent = state.financeItems.filter(i=>i.type==='vydaj').reduce((s,i)=>s+Math.abs(i.amount||0),0);

  return `
    <div class="hero-tile">
      <div class="eyebrow">STAV K DNEŠNÍMU DNI — ${fmtDate(todayISO())}</div>
      <h2>${lastEntry ? esc(lastEntry.popis) : "Zatím žádné záznamy o průběhu"}</h2>
      <div class="sub">${lastEntry ? `Poslední zaznamenaný krok, ${fmtDate(lastEntry.date)}${lastEntry.roomId && roomName(lastEntry.roomId) ? ' · '+roomName(lastEntry.roomId) : ''}` : "Přidej první záznam v sekci Stav."}</div>
      <div class="hero-stats">
        <div class="hero-stat"><div class="num">${openTasks}/${totalTasks}</div><div class="lbl">otevřených úkolů</div></div>
        <div class="hero-stat"><div class="num">${fmtMoney(spentThisMonth)}</div><div class="lbl">utraceno tento měsíc</div></div>
        <div class="hero-stat"><div class="num">${fmtMoney(totalSpent)}</div><div class="lbl">celkem utraceno</div></div>
      </div>
      <div class="hero-next">
        <div class="hn-title">Nejbližší naplánované kroky</div>
        ${upcoming.length ? upcoming.map(u=>`<div class="hero-next-item"><span>${esc(u.title)}</span><span class="d">${fmtDateShort(u.date)}</span></div>`).join("") : `<div class="hero-next-item"><span>Žádné naplánované kroky</span></div>`}
      </div>
    </div>
    <div class="grid grid-2">
      <div class="card">
        <h3 style="margin-bottom:10px;font-size:16px;">Poslední záznamy ve Stavu</h3>
        ${doneEntries.slice(0,4).map(e=>`
          <div class="list-item" style="padding:10px 0;">
            <div class="item-main">
              <div class="item-title">${esc(e.popis)}</div>
              <div class="item-meta">${fmtDateShort(e.date)}${e.typ?` · ${esc(e.typ)}`:''}${e.roomId&&roomName(e.roomId)?` · ${roomName(e.roomId)}`:''}</div>
            </div>
          </div>`).join("") || `<div class="empty-state">Zatím žádné záznamy</div>`}
      </div>
      <div class="card">
        <h3 style="margin-bottom:10px;font-size:16px;">Otevřené úkoly</h3>
        ${state.tasks.filter(t=>t.status!=='hotovo').slice().sort((a,b)=>(a.dueDate||'9999').localeCompare(b.dueDate||'9999')).slice(0,4).map(t=>`
          <div class="list-item" style="padding:10px 0;">
            <div class="item-main">
              <div class="item-title">${esc(t.title)}</div>
              <div class="item-meta">${t.dueDate?fmtDateShort(t.dueDate):'bez termínu'}${t.assigneeId&&contactName(t.assigneeId)?` · ${contactName(t.assigneeId)}`:''}</div>
            </div>
            <span class="badge status-${t.status}">${statusLabel(t.status)}</span>
          </div>`).join("") || `<div class="empty-state">Žádné otevřené úkoly</div>`}
      </div>
    </div>
  `;
}
function getUpcomingItems(){
  const planned = state.statusEntries.filter(s=>s.planned && s.date).map(s=>({date:s.date, title:s.popis}));
  const tasks = state.tasks.filter(t=>t.status!=='hotovo' && t.dueDate).map(t=>({date:t.dueDate, title:t.title}));
  return planned.concat(tasks).sort((a,b)=>a.date.localeCompare(b.date));
}

/* ================= STAV ================= */
function renderStav(){
  const sorted = state.statusEntries.slice().sort((a,b)=>(b.date||'').localeCompare(a.date||''));
  return `
    <div class="section-lead">Historie a plánované kroky rekonstrukce, řazeno od nejnovějšího.</div>
    <div class="toolbar">
      <button class="btn btn-primary" data-action="add-stav">${ICO.plus} Přidat záznam</button>
    </div>
    ${sorted.length ? `
    <div class="timeline">
      ${sorted.map((e,idx)=>`
        <div class="timeline-item">
          <div class="timeline-marker">
            <div class="timeline-dot ${e.planned?'planned':''}"></div>
            ${idx<sorted.length-1?'<div class="timeline-line"></div>':''}
          </div>
          <div class="timeline-body">
            <div class="timeline-date">${fmtDate(e.date)} ${e.planned?'<span class="badge status-probiha">Plánováno</span>':''}</div>
            <div class="card timeline-card">
              <div class="row-between">
                <div class="item-main">
                  <div class="item-title">${esc(e.popis)}</div>
                  <div class="item-meta" style="margin-top:6px;">
                    ${e.doba?`<span>Délka: ${esc(fmtDoba(e.doba))}</span>`:''}
                    ${e.kdo?`<span>${e.doba?' · ':''}Pomáhal: ${esc(e.kdo)}</span>`:''}
                    ${e.typ?`<span>${(e.doba||e.kdo)?' · ':''}${esc(e.typ)}</span>`:''}
                    ${e.roomId&&roomName(e.roomId)?`<span>${(e.doba||e.kdo||e.typ)?' · ':''}<span class="room-tag">${roomName(e.roomId)}</span></span>`:''}
                  </div>
                </div>
                <div class="item-actions">
                  <button class="icon-btn" data-action="edit-stav" data-id="${e.id}">${ICO.edit}</button>
                  <button class="icon-btn" data-action="del-stav" data-id="${e.id}">${ICO.trash}</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      `).join("")}
    </div>
    ` : `<div class="empty-state">Zatím žádné záznamy. Přidej první krok rekonstrukce.</div>`}
  `;
}
const STAV_TYPY = ["Stavební práce","Elektrika","Voda a topení","Jednání s úřadem","Nákup materiálu","Úklid","Jiné"];
function stavFields(){
  return [
    {key:"date", label:"Datum", type:"date", required:true, default:todayISO()},
    {key:"popis", label:"Co se dělo / bude dít", type:"textarea", required:true},
    {key:"doba", label:"Jak dlouho (např. 3 hodiny, celý den)", type:"text"},
    {key:"kdo", label:"Kdo pomáhal", type:"text"},
    {key:"typ", label:"Typ", type:"select", allowEmpty:true, options:STAV_TYPY.map(t=>({value:t,label:t}))},
    {key:"roomId", label:"Místnost", type:"select", allowEmpty:true, options:roomOptions},
    {key:"planned", label:"Toto je plánovaný budoucí krok (ne proběhlá práce)", type:"checkbox"},
  ];
}

/* ================= DOKUMENTY ================= */
const DOC_KATEGORIE = ["Smlouva","Projektová dokumentace","Faktura","Stavební povolení","Revize","Jiné"];
function renderDokumenty(){
  const sorted = state.documents.slice().sort((a,b)=> (b.createdAt?.seconds||0)-(a.createdAt?.seconds||0));
  return `
    <div class="section-lead">Všechny důležité dokumenty k domu na jednom místě.</div>
    <div class="toolbar">
      <button class="btn btn-primary" data-action="add-doc">${ICO.plus} Nahrát dokument</button>
      ${docCatFilterChips()}
    </div>
    <div class="card">
      ${sorted.filter(docCatFilterFn).length ? sorted.filter(docCatFilterFn).map(d=>`
        <div class="list-item">
          <div class="doc-icon">${ICO.dokumenty}</div>
          <div class="item-main">
            <div class="item-title"><a href="${d.file}" target="_blank" rel="noopener">${esc(d.name)}</a></div>
            <div class="item-meta">${d.category?esc(d.category)+' · ':''}vloženo ${fmtDateTime(d.createdAt)}${d.updatedAt?` · upraveno ${fmtDateTime(d.updatedAt)}`:''}</div>
          </div>
          <div class="item-actions">
            <button class="icon-btn" data-action="edit-doc" data-id="${d.id}">${ICO.edit}</button>
            <button class="icon-btn" data-action="del-doc" data-id="${d.id}">${ICO.trash}</button>
          </div>
        </div>
      `).join("") : `<div class="empty-state">Zatím žádné dokumenty.</div>`}
    </div>
  `;
}
function docCatFilterFn(d){ return !docCatFilter || d.category===docCatFilter; }
function docCatFilterChips(){
  return `<div style="display:flex;gap:6px;flex-wrap:wrap;">
    <span class="chip clickable ${!docCatFilter?'active':''}" data-action="doc-filter" data-cat="">Vše</span>
    ${DOC_KATEGORIE.map(k=>`<span class="chip clickable ${docCatFilter===k?'active':''}" data-action="doc-filter" data-cat="${k}">${k}</span>`).join("")}
  </div>`;
}
function docFields(existing){
  return [
    {key:"name", label:"Název dokumentu", type:"text", required:true},
    {key:"category", label:"Kategorie", type:"select", allowEmpty:true, options:DOC_KATEGORIE.map(k=>({value:k,label:k}))},
    {key:"file", label:"Soubor", type:"file", accept:".pdf,image/*,.doc,.docx", required: !existing},
  ];
}

/* ================= FINANCE ================= */
function renderFinance(){
  const filtered = state.financeItems.filter(i=> !financeFilterCat || i.categoryId===financeFilterCat).slice().sort((a,b)=>(b.date||'').localeCompare(a.date||''));
  const totalCost = state.financeItems.filter(i=>i.type==='vydaj').reduce((s,i)=>s+Math.abs(i.amount||0),0);
  const totalIncome = state.financeItems.filter(i=>i.type==='prijem').reduce((s,i)=>s+Math.abs(i.amount||0),0);
  const budgetTotal = state.budgets.reduce((s,b)=>s+(b.plannedAmount||0),0);
  return `
    <div class="section-lead">Náklady a příjmy spojené s domem a rekonstrukcí.</div>
    <div class="grid grid-3" style="margin-bottom:18px;">
      <div class="card"><div class="item-meta">Celkem náklady</div><div class="display" style="font-size:22px;color:#9B4025;">${fmtMoney(totalCost)}</div></div>
      <div class="card"><div class="item-meta">Celkem příjmy</div><div class="display" style="font-size:22px;color:#3D6B4C;">${fmtMoney(totalIncome)}</div></div>
      <div class="card"><div class="item-meta">Rozpočet vs. utraceno</div><div class="display" style="font-size:22px;">${fmtMoney(totalCost)} / ${fmtMoney(budgetTotal)}</div><a class="link-inline" href="rozpocet.html">zobrazit rozpočet →</a></div>
    </div>
    <div class="toolbar">
      <button class="btn btn-primary" data-action="add-finance">${ICO.plus} Přidat položku</button>
      <button class="btn btn-ghost" data-action="add-cat">${ICO.plus} Nová kategorie</button>
    </div>
    <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:16px;">
      <span class="chip clickable ${!financeFilterCat?'active':''}" data-action="fin-filter" data-cat="">Vše</span>
      ${state.financeCategories.map(c=>`
        <span class="chip clickable ${financeFilterCat===c.id?'active':''}" data-action="fin-filter" data-cat="${c.id}" style="border-color:${c.color};">
          <span class="cat-color-dot" style="background:${c.color}"></span>${c.icon||''} ${esc(c.name)}
          <span data-action="edit-cat" data-id="${c.id}" style="opacity:.6;">✎</span>
          <span data-action="del-cat" data-id="${c.id}" style="opacity:.6;">✕</span>
        </span>
      `).join("")}
    </div>
    <div class="card">
      ${filtered.length ? filtered.map(i=>{
        const cat = catObj(i.categoryId);
        const isCost = i.type==='vydaj';
        return `
        <div class="list-item">
          <div class="doc-icon" style="font-size:16px;">${cat&&cat.icon?cat.icon:'💰'}</div>
          <div class="item-main">
            <div class="item-title">${esc(i.name||'Položka')}</div>
            <div class="item-meta">${fmtDateShort(i.date)}${cat?` · ${esc(cat.name)}`:''}</div>
            ${i.note?`<div class="item-meta" style="margin-top:2px;">${esc(i.note)}</div>`:''}
          </div>
          <div style="text-align:right;">
            <div class="${isCost?'amount-neg':'amount-pos'}">${isCost?'−':'+'}${fmtMoney(Math.abs(i.amount||0))}</div>
          </div>
          <div class="item-actions">
            <button class="icon-btn" data-action="edit-finance" data-id="${i.id}">${ICO.edit}</button>
            <button class="icon-btn" data-action="del-finance" data-id="${i.id}">${ICO.trash}</button>
          </div>
        </div>`;
      }).join("") : `<div class="empty-state">Žádné položky v této kategorii.</div>`}
    </div>
  `;
}
function financeFields(){
  return [
    {key:"name", label:"Název", type:"text", required:true},
    {key:"date", label:"Datum", type:"date", required:true, default:todayISO()},
    {key:"note", label:"Poznámka", type:"text"},
    {key:"type", label:"Typ", type:"select", default:"vydaj", options:[{value:"vydaj",label:"Výdaj"},{value:"prijem",label:"Příjem"}]},
    {key:"amount", label:"Částka", type:"number", required:true, placeholder:"1500"},
    {key:"categoryId", label:"Kategorie", type:"select", allowEmpty:true, options:financeCatOptions},
    {key:"supplierId", label:"Dodavatel / Obchod", type:"select", allowEmpty:true, options:contactOptions},
    {key:"roomId", label:"Místnost", type:"select", allowEmpty:true, options:roomOptions},
  ];
}
function catFields(){
  return [
    {key:"name", label:"Název kategorie", type:"text", required:true},
    {key:"color", label:"Barva", type:"color", default:"#2F4A3D"},
    {key:"icon", label:"Ikona", type:"icon", default:"📦"},
  ];
}

/* ================= ROZPOČET ================= */
function renderRozpocet(){
  const rows = state.financeCategories.map(c=>{
    const b = byId(state.budgets, c.id);
    const planned = b ? (b.plannedAmount||0) : 0;
    const spent = state.financeItems.filter(i=>i.categoryId===c.id && i.type==='vydaj').reduce((s,i)=>s+Math.abs(i.amount||0),0);
    const pct = planned>0 ? Math.min(100,(spent/planned)*100) : (spent>0?100:0);
    const over = planned>0 && spent>planned;
    return {c, planned, spent, pct, over};
  });
  const totalPlanned = rows.reduce((s,r)=>s+r.planned,0);
  const totalSpent = rows.reduce((s,r)=>s+r.spent,0);
  return `
    <div class="section-lead">Plánovaný rozpočet po kategoriích vs. skutečně utracené (podle nákladů ve Financích).</div>
    <div class="card">
      <table class="budget-table">
        <thead><tr><th>Kategorie</th><th>Plán</th><th>Utraceno</th><th style="width:30%;">Čerpání</th></tr></thead>
        <tbody>
        ${rows.map(r=>`
          <tr>
            <td>${r.c.icon||''} ${esc(r.c.name)}</td>
            <td><input type="number" data-action="set-budget" data-cat="${r.c.id}" value="${r.planned||0}" style="width:100px;padding:5px 7px;border:1px solid var(--border);border-radius:6px;background:var(--bg);"></td>
            <td class="${r.over?'amount-neg':''}">${fmtMoney(r.spent)}</td>
            <td><div class="bar-track"><div class="bar-fill ${r.over?'over':''}" style="width:${r.pct}%;"></div></div></td>
          </tr>
        `).join("")}
        <tr><td><strong>Celkem</strong></td><td><strong>${fmtMoney(totalPlanned)}</strong></td><td><strong>${fmtMoney(totalSpent)}</strong></td><td></td></tr>
        </tbody>
      </table>
      ${rows.length===0?`<div class="empty-state">Nejdřív založ kategorie na stránce Finance.</div>`:''}
    </div>
  `;
}

/* ================= KONTAKTY ================= */
function renderKontakty(){
  return `
    <div class="section-lead">Řemeslníci, firmy a další kontakty spojené s rekonstrukcí.</div>
    <div class="toolbar"><button class="btn btn-primary" data-action="add-contact">${ICO.plus} Přidat kontakt</button></div>
    <div class="grid grid-2">
      ${state.contacts.length ? state.contacts.map(c=>`
        <div class="card">
          <div class="row-between">
            <div>
              <div class="item-title">${esc(c.name)}</div>
              <div class="item-meta">${c.field?esc(c.field):''}</div>
            </div>
            <div class="item-actions">
              <button class="icon-btn" data-action="edit-contact" data-id="${c.id}">${ICO.edit}</button>
              <button class="icon-btn" data-action="del-contact" data-id="${c.id}">${ICO.trash}</button>
            </div>
          </div>
          <div style="margin-top:10px;font-size:13px;color:var(--ink-soft);">
            ${c.phone?`<div>${esc(c.phone)}</div>`:''}
            ${c.email?`<div>${esc(c.email)}</div>`:''}
            ${c.note?`<div style="margin-top:6px;">${esc(c.note)}</div>`:''}
          </div>
        </div>
      `).join("") : `<div class="empty-state">Zatím žádné kontakty.</div>`}
    </div>
  `;
}
function contactFields(){
  return [
    {key:"name", label:"Jméno", type:"text", required:true},
    {key:"phone", label:"Telefon", type:"text"},
    {key:"email", label:"E-mail", type:"text"},
    {key:"field", label:"Obor / co dělá", type:"text"},
    {key:"note", label:"Poznámka / hodnocení", type:"textarea"},
  ];
}

/* ================= ÚKOLY ================= */
function renderUkoly(){
  const sorted = state.tasks.slice().sort((a,b)=>(a.dueDate||'9999').localeCompare(b.dueDate||'9999'));
  return `
    <div class="section-lead">Konkrétní úkoly s termínem, stavem a odpovědnou osobou.</div>
    <div class="toolbar"><button class="btn btn-primary" data-action="add-task">${ICO.plus} Přidat úkol</button></div>
    <div class="card">
      ${sorted.length ? sorted.map(t=>`
        <div class="list-item">
          <button class="task-check ${t.status==='hotovo'?'checked':''}" data-action="toggle-task" data-id="${t.id}" title="${t.status==='hotovo'?'Označit jako nehotové':'Označit jako hotové'}">${t.status==='hotovo'?ICO.check:''}</button>
          <div class="item-main">
            <div class="item-title" style="${t.status==='hotovo'?'text-decoration:line-through;color:var(--ink-soft);':''}">${esc(t.title)}</div>
            <div class="item-meta">${t.dueDate?fmtDate(t.dueDate):'bez termínu'}${t.assigneeId&&contactName(t.assigneeId)?` · ${contactName(t.assigneeId)}`:''}${t.roomId&&roomName(t.roomId)?` · ${roomName(t.roomId)}`:''}</div>
          </div>
          <span class="badge status-${t.status}">${statusLabel(t.status)}</span>
          <div class="item-actions">
            <button class="icon-btn" data-action="edit-task" data-id="${t.id}">${ICO.edit}</button>
            <button class="icon-btn" data-action="del-task" data-id="${t.id}">${ICO.trash}</button>
          </div>
        </div>
      `).join("") : `<div class="empty-state">Zatím žádné úkoly.</div>`}
    </div>
  `;
}
function taskFields(){
  return [
    {key:"title", label:"Úkol", type:"text", required:true},
    {key:"dueDate", label:"Termín", type:"date"},
    {key:"status", label:"Stav", type:"select", default:"ceka", options:[{value:"ceka",label:"Čeká"},{value:"probiha",label:"Probíhá"},{value:"hotovo",label:"Hotovo"}]},
    {key:"assigneeId", label:"Přiřazená osoba", type:"select", allowEmpty:true, options:contactOptions},
    {key:"roomId", label:"Místnost", type:"select", allowEmpty:true, options:roomOptions},
  ];
}

/* ================= FOTOGALERIE ================= */
function renderFotogalerie(){
  const sorted = state.photos.slice().sort((a,b)=>(b.date||'').localeCompare(a.date||''));
  return `
    <div class="section-lead">Fotky provázané s místnostmi a záznamy ve Stavu.</div>
    <div class="toolbar"><button class="btn btn-primary" data-action="add-photo">${ICO.plus} Přidat fotku</button></div>
    <div class="photo-grid">
      ${sorted.length ? sorted.map(p=>`
        <div class="photo-card">
          <img class="thumb" src="${p.file}" alt="${esc(p.caption||'')}">
          <div class="pc-body">
            <div class="item-title" style="font-size:13px;">${esc(p.caption||'Bez popisu')}</div>
            <div class="item-meta">${p.date?fmtDateShort(p.date):''}${p.roomId&&roomName(p.roomId)?` · ${roomName(p.roomId)}`:''}</div>
            <div class="item-actions" style="margin-top:6px;">
              <button class="icon-btn" data-action="edit-photo" data-id="${p.id}">${ICO.edit}</button>
              <button class="icon-btn" data-action="del-photo" data-id="${p.id}">${ICO.trash}</button>
            </div>
          </div>
        </div>
      `).join("") : `<div class="empty-state">Zatím žádné fotky.</div>`}
    </div>
  `;
}
function photoFields(existing){
  return [
    {key:"file", label:"Fotka", type:"file", accept:"image/*", required: !existing},
    {key:"caption", label:"Popisek", type:"text"},
    {key:"date", label:"Datum", type:"date", default:todayISO()},
    {key:"roomId", label:"Místnost", type:"select", allowEmpty:true, options:roomOptions},
    {key:"statusEntryId", label:"Propojit se záznamem ve Stavu", type:"select", allowEmpty:true, options:statusEntryOptions},
  ];
}

/* ================= MÍSTNOSTI ================= */
function renderMistnosti(){
  return `
    <div class="section-lead">Prostory domu — propojují se se Stavem, Financemi, Úkoly i Fotogalerií.</div>
    <div class="toolbar"><button class="btn btn-primary" data-action="add-room">${ICO.plus} Přidat místnost</button></div>
    <div class="grid grid-3">
      ${state.rooms.length ? state.rooms.map(r=>{
        const n = state.statusEntries.filter(s=>s.roomId===r.id).length + state.financeItems.filter(i=>i.roomId===r.id).length + state.tasks.filter(t=>t.roomId===r.id).length + state.photos.filter(p=>p.roomId===r.id).length;
        return `
        <div class="card">
          <div class="row-between">
            <div class="item-title">${esc(r.name)}</div>
            <div class="item-actions">
              <button class="icon-btn" data-action="edit-room" data-id="${r.id}">${ICO.edit}</button>
              <button class="icon-btn" data-action="del-room" data-id="${r.id}">${ICO.trash}</button>
            </div>
          </div>
          <div class="item-meta" style="margin-top:6px;">${r.notes?esc(r.notes)+' · ':''}${n} propojených záznamů</div>
        </div>`;
      }).join("") : `<div class="empty-state">Zatím žádné místnosti. Přidej např. Kuchyň, Koupelna, Ložnice…</div>`}
    </div>
  `;
}
function roomFields(){
  return [
    {key:"name", label:"Název místnosti", type:"text", required:true},
    {key:"notes", label:"Poznámka", type:"text"},
  ];
}

/* ================= KALENDÁŘ ================= */
function renderKalendar(){
  const items = getUpcomingItems();
  return `
    <div class="section-lead">Automatický přehled sestavený z plánovaných kroků (Stav) a termínů úkolů.</div>
    <div class="card">
      ${items.length ? items.map(i=>`
        <div class="list-item" style="padding:12px 4px;">
          <div class="item-main"><div class="item-title">${esc(i.title)}</div></div>
          <div class="item-meta">${fmtDate(i.date)}</div>
        </div>
      `).join("") : `<div class="empty-state">Žádné naplánované kroky ani termíny úkolů.</div>`}
    </div>
  `;
}

/* ================= MATERIÁLY ================= */
function renderMaterialy(){
  return `
    <div class="section-lead">Nákupní seznam. Po označení „Koupeno" se položka automaticky přidá jako náklad do Financí.</div>
    <div class="toolbar"><button class="btn btn-primary" data-action="add-material">${ICO.plus} Přidat položku</button></div>
    <div class="card">
      ${state.materials.length ? state.materials.slice().sort((a,b)=>(a.bought===b.bought)?0:(a.bought?1:-1)).map(m=>`
        <div class="list-item">
          <div class="item-main">
            <div class="item-title" style="${m.bought?'text-decoration:line-through;color:var(--ink-soft);':''}">${esc(m.name)}</div>
            <div class="item-meta">${m.quantity?esc(m.quantity)+' · ':''}${m.price?fmtMoney(m.price)+' · ':''}${m.roomId&&roomName(m.roomId)?roomName(m.roomId):''}</div>
          </div>
          <span class="badge ${m.bought?'status-hotovo':'status-ceka'}">${m.bought?'Koupeno':'K nákupu'}</span>
          <div class="item-actions">
            <button class="icon-btn" data-action="edit-material" data-id="${m.id}">${ICO.edit}</button>
            <button class="icon-btn" data-action="del-material" data-id="${m.id}">${ICO.trash}</button>
          </div>
        </div>
      `).join("") : `<div class="empty-state">Zatím žádné položky.</div>`}
    </div>
  `;
}
function materialFields(){
  return [
    {key:"name", label:"Název materiálu", type:"text", required:true},
    {key:"quantity", label:"Množství", type:"text"},
    {key:"price", label:"Cena", type:"number"},
    {key:"categoryId", label:"Kategorie (pro Finance)", type:"select", allowEmpty:true, options:financeCatOptions},
    {key:"roomId", label:"Místnost", type:"select", allowEmpty:true, options:roomOptions},
    {key:"bought", label:"Koupeno", type:"checkbox"},
  ];
}

/* ================= POZNÁMKY ================= */
function renderPoznamky(){
  const sorted = state.notes.slice().sort((a,b)=>(b.date||'').localeCompare(a.date||''));
  return `
    <div class="section-lead">Volné poznámky, nápady a inspirace.</div>
    <div class="toolbar"><button class="btn btn-primary" data-action="add-note">${ICO.plus} Přidat poznámku</button></div>
    <div class="grid grid-2">
      ${sorted.length ? sorted.map(n=>`
        <div class="card">
          <div class="row-between">
            <div class="item-title">${esc(n.title||'Poznámka')}</div>
            <div class="item-actions">
              <button class="icon-btn" data-action="edit-note" data-id="${n.id}">${ICO.edit}</button>
              <button class="icon-btn" data-action="del-note" data-id="${n.id}">${ICO.trash}</button>
            </div>
          </div>
          <div class="item-meta">${n.date?fmtDateShort(n.date):''}</div>
          ${n.text?`<div style="margin-top:8px;font-size:13.5px;">${esc(n.text)}</div>`:''}
          ${n.link?`<div style="margin-top:6px;"><a class="link-inline" href="${n.link}" target="_blank" rel="noopener">${esc(n.link)}</a></div>`:''}
          ${n.image?`<img class="note-img" src="${n.image}">`:''}
        </div>
      `).join("") : `<div class="empty-state">Zatím žádné poznámky.</div>`}
    </div>
  `;
}
function noteFields(){
  return [
    {key:"title", label:"Název", type:"text"},
    {key:"text", label:"Text", type:"textarea"},
    {key:"link", label:"Odkaz (inspirace, produkt…)", type:"url"},
    {key:"image", label:"Obrázek", type:"file", accept:"image/*"},
    {key:"date", label:"Datum", type:"date", default:todayISO()},
  ];
}

const RENDERERS = {
  dashboard: renderDashboard, stav: renderStav, dokumenty: renderDokumenty,
  finance: renderFinance, rozpocet: renderRozpocet, kontakty: renderKontakty,
  ukoly: renderUkoly, fotogalerie: renderFotogalerie, mistnosti: renderMistnosti,
  kalendar: renderKalendar, materialy: renderMaterialy, poznamky: renderPoznamky
};

/* ================= EVENT BINDING (delegated on #content) ================= */
function bindContentEvents(rerender){
  const c = document.getElementById("content");
  c.onclick = async (e)=>{
    const t = e.target.closest("[data-action]");
    if(!t) return;
    const action = t.dataset.action;
    const id = t.dataset.id;

    if(action==="add-stav") return openForm({title:"Nový záznam", fields:stavFields(), onSubmit: d=>addItem("statusEntries", d)});
    if(action==="edit-stav") return openForm({title:"Upravit záznam", fields:stavFields(), existing:byId(state.statusEntries,id), onSubmit: d=>updateItem("statusEntries", id, d)});
    if(action==="del-stav") return confirmDelete("Smazat tento záznam?", ()=>deleteItem("statusEntries", id));

    if(action==="add-doc") return openForm({title:"Nahrát dokument", fields:docFields(), onSubmit: d=>addItem("documents", {...d, createdAt: serverTimestamp()})});
    if(action==="edit-doc") return openForm({title:"Upravit dokument", fields:docFields(byId(state.documents,id)), existing:byId(state.documents,id), onSubmit: d=>updateItem("documents", id, {...d, updatedAt: serverTimestamp()})});
    if(action==="del-doc") return confirmDelete("Smazat tento dokument?", ()=>deleteItem("documents", id));
    if(action==="doc-filter"){ docCatFilter = t.dataset.cat || null; return rerender(); }

    if(action==="add-finance") return openForm({title:"Nová položka", fields:financeFields(), onSubmit: d=>addItem("financeItems", d)});
    if(action==="edit-finance") return openForm({title:"Upravit položku", fields:financeFields(), existing:byId(state.financeItems,id), onSubmit: d=>updateItem("financeItems", id, d)});
    if(action==="del-finance") return confirmDelete("Smazat tuto položku?", ()=>deleteItem("financeItems", id));
    if(action==="fin-filter"){ financeFilterCat = t.dataset.cat || null; return rerender(); }
    if(action==="add-cat") return openForm({title:"Nová kategorie", fields:catFields(), onSubmit: d=>addItem("financeCategories", d)});
    if(action==="edit-cat"){ e.stopPropagation(); return openForm({title:"Upravit kategorii", fields:catFields(), existing:catObj(id), onSubmit: d=>updateItem("financeCategories", id, d)}); }
    if(action==="del-cat"){ e.stopPropagation(); return confirmDelete("Smazat tuto kategorii?", ()=>deleteItem("financeCategories", id)); }

    if(action==="add-contact") return openForm({title:"Nový kontakt", fields:contactFields(), onSubmit: d=>addItem("contacts", d)});
    if(action==="edit-contact") return openForm({title:"Upravit kontakt", fields:contactFields(), existing:byId(state.contacts,id), onSubmit: d=>updateItem("contacts", id, d)});
    if(action==="del-contact") return confirmDelete("Smazat tento kontakt?", ()=>deleteItem("contacts", id));

    if(action==="add-task") return openForm({title:"Nový úkol", fields:taskFields(), onSubmit: d=>addItem("tasks", d)});
    if(action==="edit-task") return openForm({title:"Upravit úkol", fields:taskFields(), existing:byId(state.tasks,id), onSubmit: d=>updateItem("tasks", id, d)});
    if(action==="del-task") return confirmDelete("Smazat tento úkol?", ()=>deleteItem("tasks", id));
    if(action==="toggle-task"){
      const task = byId(state.tasks,id);
      return updateItem("tasks", id, {status: task && task.status==='hotovo' ? 'ceka' : 'hotovo'});
    }

    if(action==="add-photo") return openForm({title:"Přidat fotku", fields:photoFields(), onSubmit: d=>addItem("photos", d)});
    if(action==="edit-photo") return openForm({title:"Upravit fotku", fields:photoFields(byId(state.photos,id)), existing:byId(state.photos,id), onSubmit: d=>updateItem("photos", id, d)});
    if(action==="del-photo") return confirmDelete("Smazat tuto fotku?", ()=>deleteItem("photos", id));

    if(action==="add-room") return openForm({title:"Nová místnost", fields:roomFields(), onSubmit: d=>addItem("rooms", d)});
    if(action==="edit-room") return openForm({title:"Upravit místnost", fields:roomFields(), existing:byId(state.rooms,id), onSubmit: d=>updateItem("rooms", id, d)});
    if(action==="del-room") return confirmDelete("Smazat tuto místnost? Propojené záznamy zůstanou, jen ztratí vazbu.", ()=>deleteItem("rooms", id));

    if(action==="add-material") return openForm({title:"Nová položka", fields:materialFields(), onSubmit: d=>handleMaterialSave(d, null)});
    if(action==="edit-material") return openForm({title:"Upravit položku", fields:materialFields(), existing:byId(state.materials,id), onSubmit: d=>handleMaterialSave(d, id)});
    if(action==="del-material") return confirmDelete("Smazat tuto položku?", ()=>deleteItem("materials", id));

    if(action==="add-note") return openForm({title:"Nová poznámka", fields:noteFields(), onSubmit: d=>addItem("notes", d)});
    if(action==="edit-note") return openForm({title:"Upravit poznámku", fields:noteFields(), existing:byId(state.notes,id), onSubmit: d=>updateItem("notes", id, d)});
    if(action==="del-note") return confirmDelete("Smazat tuto poznámku?", ()=>deleteItem("notes", id));
  };

  c.onchange = async (e)=>{
    const t = e.target.closest("[data-action='set-budget']");
    if(t){
      const catId = t.dataset.cat;
      const val = parseFloat(t.value)||0;
      await setDoc(doc(db,"budgets",catId), {plannedAmount: val}, {merge:true});
    }
  };
}

async function handleMaterialSave(data, id){
  const wasBought = id ? (byId(state.materials,id)?.bought) : false;
  if(id){ await updateItem("materials", id, data); }
  else { const ref = await addItem("materials", data); id = ref.id; }
  if(data.bought && !wasBought){
    await addItem("financeItems", {
      name: "Materiál: " + data.name,
      date: todayISO(),
      type: "vydaj",
      amount: Math.abs(data.price)||0,
      categoryId: data.categoryId||"",
      supplierId: "",
      roomId: data.roomId||"",
      note: ""
    });
  }
}

/* ================= PAGE SHELL / MOUNT ================= */
function buildShellDOM(sectionId){
  const root = document.getElementById("app-root");
  const section = SECTIONS.find(s=>s.id===sectionId);
  root.innerHTML = `
    <div id="loadingScreen"><div class="loading-spinner"></div></div>
    <div id="loginScreen" style="display:none;">
      <div class="login-card">
        <h1>Barák</h1>
        <p>Správa rekonstrukce — přístup jen pro rodinu.</p>
        <button class="google-btn" id="googleSignInBtn">
          <svg width="18" height="18" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.1 8 3l6-6C34.5 5.5 29.6 3.5 24 3.5 12.7 3.5 3.5 12.7 3.5 24S12.7 44.5 24 44.5 44.5 35.3 44.5 24c0-1.2-.1-2.4-.3-3.5z"/><path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.6 15.9 18.9 13 24 13c3.1 0 5.8 1.1 8 3l6-6C34.5 5.5 29.6 3.5 24 3.5c-7.6 0-14.1 4.3-17.5 10.6z"/><path fill="#4CAF50" d="M24 44.5c5.5 0 10.4-1.9 14.2-5.1l-6.6-5.4c-2 1.4-4.6 2.3-7.6 2.3-5.3 0-9.7-3.3-11.3-8l-6.6 5C9.9 40.2 16.4 44.5 24 44.5z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.2-4.3 5.6l6.6 5.4C41.4 35.6 44.5 30.3 44.5 24c0-1.2-.1-2.4-.3-3.5z"/></svg>
          Přihlásit se přes Google
        </button>
        <div id="loginError"></div>
      </div>
    </div>

    <div id="navBackdrop"></div>
    <div id="shell" style="display:none;">
      <nav id="sidebar">
        <div class="brand">
          <div>Barák<span>Správa rekonstrukce</span></div>
          <button id="sidebarClose" aria-label="Zavřít menu">${ICO.x}</button>
        </div>
        <div id="navlist"></div>
        <div class="user-box" id="userBox"></div>
      </nav>
      <div id="main">
        <div id="topbar">
          <div class="tb-left">
            <button id="hamburgerBtn" aria-label="Otevřít menu">${ICO.menu}</button>
            <h1>${esc(section.label)}</h1>
          </div>
        </div>
        <div id="content"></div>
      </div>
    </div>

    <div id="overlay"><div class="modal" id="modalBox"></div></div>
  `;

  document.getElementById("navlist").innerHTML = SECTIONS.map(s=>`
    <a class="nav-item ${s.id===sectionId?'active':''}" href="${s.href}">${ICO[s.id]}<span>${s.label}</span></a>
  `).join("");

  // Mobile drawer toggle
  const sidebarEl = document.getElementById("sidebar");
  const backdrop = document.getElementById("navBackdrop");
  function openDrawer(){ sidebarEl.classList.add("open"); backdrop.classList.add("open"); }
  function closeDrawer(){ sidebarEl.classList.remove("open"); backdrop.classList.remove("open"); }
  document.getElementById("hamburgerBtn").addEventListener("click", openDrawer);
  document.getElementById("sidebarClose").addEventListener("click", closeDrawer);
  backdrop.addEventListener("click", closeDrawer);

  document.getElementById("overlay").addEventListener("click", e=>{ if(e.target.id==="overlay") closeModal(); });
}

export function mountPage(sectionId){
  buildShellDOM(sectionId);

  document.getElementById("googleSignInBtn").addEventListener("click", async ()=>{
    document.getElementById("loginError").textContent = "";
    try{
      await signInWithPopup(auth, googleProvider);
    }catch(err){
      document.getElementById("loginError").textContent = "Přihlášení se nezdařilo: " + err.message;
    }
  });

  function renderUserBox(user){
    document.getElementById("userBox").innerHTML = `
      ${user.photoURL ? `<img src="${user.photoURL}" alt="">` : ''}
      <span class="u-email">${esc(user.displayName || user.email)}</span>
      <button id="logoutBtn" title="Odhlásit se">${ICO.x}</button>
    `;
    document.getElementById("logoutBtn").onclick = ()=> signOut(auth);
  }

  function renderContent(){
    document.getElementById("content").innerHTML = RENDERERS[sectionId]();
  }

  onStateChange = renderContent;
  bindContentEvents(renderContent);

  onAuthStateChanged(auth, user=>{
    document.getElementById("loadingScreen").style.display = "none";
    if(user){
      if(ALLOWED_EMAILS.includes(user.email)){
        document.getElementById("loginScreen").style.display = "none";
        document.getElementById("shell").style.display = "flex";
        renderUserBox(user);
        renderContent();
        if(!dataInitialized){ dataInitialized = true; initData(); }
      } else {
        document.getElementById("loginScreen").style.display = "flex";
        document.getElementById("loginError").textContent = `Účet ${user.email} nemá k appce přístup.`;
        signOut(auth);
      }
    } else {
      document.getElementById("shell").style.display = "none";
      document.getElementById("loginScreen").style.display = "flex";
    }
  });
}
