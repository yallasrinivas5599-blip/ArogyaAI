/* Arogya AI - static-smart frontend + features */
/* Elements */
const chatArea = document.getElementById('chatArea');
const sendBtn = document.getElementById('sendBtn');
const userInput = document.getElementById('userInput');
const toggleSidebar = document.getElementById('toggleSidebar');
const sidebar = document.getElementById('sidebar');
const panelOverlay = document.getElementById('panelOverlay');
const panelInner = document.getElementById('panelInner');
const closePanel = document.getElementById('closePanel');
const tabletList = document.getElementById('tabletList');
const clearDataBtn = document.getElementById('clearData');
const statusEl = document.getElementById('status');

let isRequesting = false;

/* ---------- Persistence Keys ---------- */
const STORAGE = {
  WATER: 'arogya_water_v1',
  MEDS: 'arogya_meds_v1',
  NOTES: 'arogya_notes_v1',
  SLEEP: 'arogya_sleep_v1',
  HEART: 'arogya_heart_v1',
  CHAT: 'arogya_chat_v1'
};

/* ---------- Starter data ---------- */
const TABLETS = [
  { name: 'Paracetamol', dose: '500mg', note: 'Fever / pain' },
  { name: 'Ibuprofen', dose: '200mg', note: 'Pain / inflammation' },
  { name: 'Cetirizine', dose: '10mg', note: 'Allergies' },
  { name: 'Aspirin', dose: '75-325mg', note: 'Blood thinner - consult' },
  { name: 'Amoxicillin', dose: '500mg', note: 'Antibiotic - prescription' }
];

const TIPS = [
  "Drink a glass of water first thing in the morning.",
  "Take short breaks and stretch if you sit for long hours.",
  "Include colorful vegetables in each meal.",
  "Aim for 7–9 hours of sleep each night for recovery.",
  "Walk 20 minutes a day to boost circulation."
];

const QUOTES = [
  "Caring for your body is an act of self-respect.",
  "Small healthy habits compound over time.",
  "Rest is productive — allow your body to recover.",
  "Hydration and sleep are the foundation of health."
];

/* ---------- Helpers ---------- */
function escapeHtml(s){ return String(s||'').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
function save(key,val){ localStorage.setItem(key, JSON.stringify(val)); }
function load(key, def){ try{ const v = JSON.parse(localStorage.getItem(key)); return v === null ? def : (v ?? def); }catch(e){return def;} }
function nowFmt(){ return new Date().toLocaleString(); }

/* ---------- Chat rendering ---------- */
function appendMessage(who, text, meta=''){
  // remove typing indicator if adding bot final
  if(who==='bot'){
    const last = chatArea.lastElementChild;
    if(last && last.dataset.typing==='1') chatArea.removeChild(last);
  }
  const div = document.createElement('div');
  div.className = 'msg ' + (who==='user' ? 'user' : 'bot');
  div.innerHTML = `<div class="text">${escapeHtml(text)}</div>${ meta ? `<div class="meta">${escapeHtml(meta)}</div>` : '' }`;
  chatArea.appendChild(div);
  chatArea.scrollTop = chatArea.scrollHeight;
  // persist short chat history
  const history = load(STORAGE.CHAT, []);
  history.push({who, text, ts: new Date().toISOString()});
  if(history.length>200) history.shift();
  save(STORAGE.CHAT, history);
}

/* typing indicator */
function showTyping(){
  const t = document.createElement('div');
  t.className = 'msg bot';
  t.dataset.typing='1';
  t.innerHTML = `<div class="typing"><span></span><span></span><span></span></div>`;
  chatArea.appendChild(t);
  chatArea.scrollTop = chatArea.scrollHeight;
}

/* ---------- Simple 'AI' logic (static but smart) ---------- */
function smartReply(message){
  const m = (message||'').toLowerCase();
  // greetings & small talk
  if(/^(hi|hello|hey|hii|yo)\b/.test(m)) return "Hello! 👋 How can I help with your health today?";
  if(/how are you/.test(m)) return "I’m here and ready to help — how are you feeling?";
  if(/thanks|thank you/.test(m)) return "You're welcome! 😊";
  if(/bye|goodbye|see you/.test(m)) return "Take care! 🌿";
  // direct symptom keywords
  if(/fever|temperature/.test(m)) return "For fever: rest, hydrate, and consider Paracetamol (as per dosage). If fever is >39°C or persists >48hrs, see a doctor.";
  if(/cough|cold/.test(m)) return "Cough and cold: rest, warm fluids, steam inhalation, and honey (if adult). If shortness of breath or high fever, seek care.";
  if(/neck pain|stiff neck/.test(m)) return "Neck pain often from posture or strain — try gentle stretching, heat, and avoid heavy phone use. Seek medical care if severe or with tingling.";
  if(/headache/.test(m)) return "Headache: check hydration, rest in a quiet dark room, and avoid screens. If sudden severe headache, go to emergency.";
  if(/stomach|nausea|vomit/.test(m)) return "Stomach upset: rest, sip clear fluids, avoid solid foods for a few hours. See doctor if severe pain or persistent vomiting.";
  // medicines
  if(/paracetamol|acetaminophen/.test(m)) return "Paracetamol (500mg typical) is used for fever & pain — do not exceed recommended daily dose. Check label or your physician.";
  if(/ibuprofen/.test(m)) return "Ibuprofen is an NSAID — take with food; avoid if you have stomach ulcers or certain conditions.";
  if(/amoxicillin|antibiotic/.test(m)) return "Antibiotics like Amoxicillin should only be used when prescribed. Finish the course if prescribed.";
  // symptom checker patterns
  if(/pain in (.*)/.test(m)) return "Pain in that area can have many causes. If it's severe, worsening, or accompanied by fever/numbness, visit a doctor.";
  if(/what should i (eat|drink)/.test(m)) return "Prefer light, easy-to-digest meals (soups, bananas, rice) if unwell; hydrate frequently.";
  // help and features
  if(/bmi/.test(m)) return "Use the BMI tool in the sidebar (🧮) — enter height & weight for a quick score.";
  if(/water|hydrate/.test(m)) return "Use the Water Tracker in the sidebar (💧) to log glasses. Aim for 2–3L depending on your activity.";
  if(/help|what can you do/.test(m)) return "I can give basic health advice, explain common medicines, track water, sleep, and show tips. Not a replacement for a doctor.";
  // fallback: ask clarifying question
  const prompts = [
    "Tell me more about your symptom — when did it start?",
    "Do you have any allergies or current medicines?",
    "Is the symptom mild, moderate, or severe?"
  ];
  return prompts[Math.floor(Math.random()*prompts.length)];
}

/* ---------- Send message flow ---------- */
async function sendMessage(){
  if(isRequesting) return;
  const text = userInput.value.trim();
  if(!text) return;
  appendMessage('user', text, nowFmt());
  userInput.value = '';
  showTyping();
  isRequesting = true;
  sendBtn.disabled = true;
  statusEl.textContent = 'Processing...';

  // simulate thinking delay & generate reply locally
  await new Promise(r => setTimeout(r, 500 + Math.random()*700));
  const reply = smartReply(text);
  appendMessage('bot', reply, nowFmt());
  statusEl.textContent = 'Local AI';
  isRequesting = false;
  sendBtn.disabled = false;
}

/* ---------- Panels (each feature) ---------- */
function openPanel(html){
  panelInner.innerHTML = html;
  panelOverlay.classList.remove('hidden');
  panelOverlay.setAttribute('aria-hidden','false');
}
function closePanelFn(){
  panelOverlay.classList.add('hidden');
  panelOverlay.setAttribute('aria-hidden','true');
  panelInner.innerHTML = '';
}

/* Water tracker */
function renderWaterPanel(){
  const data = load(STORAGE.WATER, {goal:8, drank:0}); // glasses
  const html = `
    <h2>Water Tracker</h2>
    <p>Goal: <strong>${data.goal}</strong> glasses</p>
    <div style="display:flex;gap:8px;margin:10px 0">
      <button id="addGlass" class="btn">+ Glass</button>
      <button id="removeGlass" class="btn ghost">- Glass</button>
      <button id="resetWater" class="btn ghost">Reset</button>
    </div>
    <div class="hint">Drank: <strong id="drankVal">${data.drank}</strong> glasses</div>
  `;
  openPanel(html);
  document.getElementById('addGlass').addEventListener('click', () => {
    const d = load(STORAGE.WATER, {goal:8, drank:0});
    d.drank = (d.drank||0) + 1; save(STORAGE.WATER,d);
    document.getElementById('drankVal').textContent = d.drank;
    if(d.drank >= d.goal) appendMessage('bot', `Nice — you've reached your water goal for today! 💧`);
  });
  document.getElementById('removeGlass').addEventListener('click', () => {
    const d = load(STORAGE.WATER, {goal:8, drank:0});
    d.drank = Math.max(0,(d.drank||0)-1); save(STORAGE.WATER,d);
    document.getElementById('drankVal').textContent = d.drank;
  });
  document.getElementById('resetWater').addEventListener('click', () => {
    save(STORAGE.WATER, {goal:8, drank:0});
    document.getElementById('drankVal').textContent = 0;
  });
}

/* BMI */
function renderBMIPanel(){
  const html = `
    <h2>BMI Calculator</h2>
    <div style="display:flex;gap:8px;margin:10px 0">
      <input id="bWeight" placeholder="Weight (kg)" />
      <input id="bHeight" placeholder="Height (cm)" />
    </div>
    <div style="display:flex;gap:8px">
      <button id="calcBMI" class="btn">Calculate</button>
      <button id="clearBMI" class="btn ghost">Clear</button>
    </div>
    <div class="hint" id="bmiResult" style="margin-top:10px"></div>
  `;
  openPanel(html);
  document.getElementById('calcBMI').addEventListener('click', () => {
    const w = parseFloat(document.getElementById('bWeight').value);
    const h = parseFloat(document.getElementById('bHeight').value);
    if(!w || !h){ alert('Enter valid numbers'); return; }
    const m = h/100;
    const bmi = +(w / (m*m)).toFixed(1);
    let cat = 'Normal';
    if(bmi < 18.5) cat = 'Underweight';
    else if(bmi >= 25) cat = 'Overweight';
    if(bmi >= 30) cat = 'Obese';
    document.getElementById('bmiResult').innerHTML = `BMI: <strong>${bmi}</strong> — ${cat}`;
    appendMessage('bot', `Your BMI is ${bmi} (${cat}).`);
  });
  document.getElementById('clearBMI').addEventListener('click', () => {
    document.getElementById('bWeight').value = ''; document.getElementById('bHeight').value = ''; document.getElementById('bmiResult').textContent = '';
  });
}

/* Medicine reminders */
function renderRemindersPanel(){
  const meds = load(STORAGE.MEDS, []);
  let listHtml = meds.length ? meds.map((m,i)=>`<div style="display:flex;justify-content:space-between;padding:8px;border-radius:8px;background:rgba(255,255,255,0.02);margin-bottom:6px"><div><strong>${escapeHtml(m.name)}</strong><div class="meta">${escapeHtml(m.time)}</div></div><div><button data-del="${i}" class="btn ghost">Del</button></div></div>`).join('') : '<div class="muted">No reminders</div>';
  const html = `
    <h2>Medicine Reminders</h2>
    <div style="display:flex;gap:8px;margin:8px 0"><input id="medName" placeholder="Medicine name"/><input id="medTime" type="time"/></div>
    <div style="display:flex;gap:8px"><button id="addMed" class="btn">Add</button><button id="clearMeds" class="btn ghost">Clear all</button></div>
    <div style="margin-top:12px">${listHtml}</div>
  `;
  openPanel(html);
  document.getElementById('addMed').addEventListener('click', () => {
    const name = document.getElementById('medName').value.trim();
    const time = document.getElementById('medTime').value;
    if(!name || !time) return alert('Provide name and time');
    const arr = load(STORAGE.MEDS, []); arr.push({name, time}); save(STORAGE.MEDS, arr);
    appendMessage('bot', `Added ${name} at ${time} — I'll remind you while the app is open.`);
    renderRemindersPanel(); // re-open to refresh
  });
  document.getElementById('clearMeds').addEventListener('click', () => {
    if(!confirm('Clear all reminders?')) return;
    save(STORAGE.MEDS, []); renderRemindersPanel();
  });
  // delete buttons
  panelInner.querySelectorAll('[data-del]').forEach(btn => btn.addEventListener('click', (e)=> {
    const i = Number(e.target.dataset.del);
    const arr = load(STORAGE.MEDS, []); arr.splice(i,1); save(STORAGE.MEDS,arr); renderRemindersPanel();
  }));
}

/* Heart logger */
function renderHeartPanel(){
  const arr = load(STORAGE.HEART, []);
  const last = arr.length ? arr[arr.length-1] : null;
  const html = `
    <h2>Heart Rate Logger</h2>
    <div style="display:flex;gap:8px;margin:8px 0">
      <input id="hrVal" placeholder="Enter bpm" />
      <button id="saveHr" class="btn">Save</button>
      <button id="randHr" class="btn ghost">Random</button>
    </div>
    <div class="hint">Last: ${last ? `${last.value} bpm at ${new Date(last.ts).toLocaleString()}` : 'No data'}</div>
  `;
  openPanel(html);
  document.getElementById('saveHr').addEventListener('click', () => {
    const v = Number(document.getElementById('hrVal').value);
    if(!v) return alert('Enter number');
    arr.push({value:v,ts:new Date().toISOString()}); save(STORAGE.HEART,arr);
    appendMessage('bot', `Logged heart rate ${v} bpm.`);
    renderHeartPanel();
  });
  document.getElementById('randHr').addEventListener('click', ()=> {
    const v = Math.floor(60 + Math.random()*40);
    arr.push({value:v,ts:new Date().toISOString()}); save(STORAGE.HEART,arr);
    appendMessage('bot', `Logged heart rate ${v} bpm.`);
    renderHeartPanel();
  });
}

/* Sleep tracker */
function renderSleepPanel(){
  const s = load(STORAGE.SLEEP, {});
  const html = `
    <h2>Sleep Tracker</h2>
    <div style="display:flex;gap:8px;margin:8px 0"><input id="sleepStart" type="time"/><input id="sleepEnd" type="time"/></div>
    <div style="display:flex;gap:8px"><button id="saveSleep" class="btn">Save</button><button id="clearSleep" class="btn ghost">Clear</button></div>
    <div class="hint">Last: ${s.start ? `${s.start} → ${s.end}` : 'No sleep logged'}</div>
  `;
  openPanel(html);
  document.getElementById('saveSleep').addEventListener('click', ()=> {
    const start = document.getElementById('sleepStart').value;
    const end = document.getElementById('sleepEnd').value;
    if(!start || !end) return alert('Enter both times');
    save(STORAGE.SLEEP, {start,end,ts:new Date().toISOString()});
    appendMessage('bot', `Saved sleep ${start} → ${end}.`);
    renderSleepPanel();
  });
  document.getElementById('clearSleep').addEventListener('click', ()=> {
    save(STORAGE.SLEEP, {}); renderSleepPanel();
  });
}

/* Tips */
function renderTipsPanel(){
  const tip = TIPS[Math.floor(Math.random()*TIPS.length)];
  const html = `<h2>Daily Health Tip</h2><p>${escapeHtml(tip)}</p><div style="display:flex;gap:8px;margin-top:12px"><button id="newTip" class="btn">New Tip</button></div>`;
  openPanel(html);
  document.getElementById('newTip').addEventListener('click', renderTipsPanel);
}

/* Daily report */
function renderReportPanel(){
  const water = load(STORAGE.WATER, {goal:8,drank:0});
  const heart = load(STORAGE.HEART, []);
  const sleep = load(STORAGE.SLEEP, {});
  const meds = load(STORAGE.MEDS, []);
  const lastHp = heart.length ? heart[heart.length-1].value : '—';
  const html = `
    <h2>Daily Report</h2>
    <ul>
      <li>Water: ${water.drank || 0}/${water.goal} glasses</li>
      <li>Last heart: ${lastHp} bpm</li>
      <li>Sleep: ${sleep.start ? `${sleep.start} → ${sleep.end}` : '—'}</li>
      <li>Medicine reminders: ${meds.length}</li>
    </ul>
    <div style="display:flex;gap:8px;margin-top:12px"><button id="exportReport" class="btn">Export</button></div>
  `;
  openPanel(html);
  document.getElementById('exportReport').addEventListener('click', ()=> {
    const data = {water,heart,sleep,meds,ts:new Date().toISOString()};
    const blob = new Blob([JSON.stringify(data,null,2)], {type:'application/json'});
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download='arogya_report.json'; a.click(); URL.revokeObjectURL(a.href);
  });
}

/* Symptom checker */
function renderSymptomPanel(){
  const html = `
    <h2>Symptom Checker</h2>
    <select id="bodyPart"><option value="">Choose body part</option><option>Head</option><option>Neck</option><option>Chest</option><option>Stomach</option><option>Back</option></select>
    <div style="margin-top:8px"><input id="symptomText" placeholder="Describe symptom" /></div>
    <div style="display:flex;gap:8px;margin-top:10px"><button id="checkBtn" class="btn">Check</button></div>
    <div id="sympResult" class="hint" style="margin-top:10px"></div>
  `;
  openPanel(html);
  document.getElementById('checkBtn').addEventListener('click', ()=> {
    const part = document.getElementById('bodyPart').value;
    const text = document.getElementById('symptomText').value;
    if(!part && !text) return alert('Pick a body part or describe a symptom');
    // simple rule-based advice
    let advice = "I’m not a doctor, but here are some possibilities: ";
    if(/fever|temperature/.test(text) || /fever/.test(part.toLowerCase())) advice += "Possible infection — rest, hydrate, monitor temp.";
    else if(/pain|ache/.test(text) || part==='Neck') advice += "Could be strain or posture-related — try gentle stretching and heat.";
    else advice += "Try rest, monitor symptoms, and seek medical if severe.";
    document.getElementById('sympResult').textContent = advice;
    appendMessage('bot', advice);
  });
}

/* Relax mode */
function renderRelaxPanel(){
  const html = `
    <h2>Relax Mode</h2>
    <p>Follow this breathing guide for 1 minute.</p>
    <div style="display:flex;gap:8px;margin-top:12px">
      <button id="startRelax" class="btn">Start</button>
      <button id="stopRelax" class="btn ghost">Stop</button>
    </div>
    <div id="relaxBox" style="margin-top:12px;display:flex;align-items:center;justify-content:center;height:120px">
      <div id="breath" style="width:80px;height:80px;border-radius:50%;background:linear-gradient(90deg,#4ee6c1,#5fb0ff);opacity:0.9"></div>
    </div>
  `;
  openPanel(html);
  let relaxTimer = null;
  const breath = document.getElementById('breath');
  function start(){
    let state = 0;
    relaxTimer = setInterval(()=> {
      state = (state+1)%4;
      if(state===0) { breath.style.transform='scale(1.5)'; }
      if(state===1) { breath.style.transform='scale(1)'; }
      if(state===2) { breath.style.transform='scale(1.3)'; }
      if(state===3) { breath.style.transform='scale(1)'; }
    }, 1200);
  }
  document.getElementById('startRelax').addEventListener('click', ()=> { if(relaxTimer) clearInterval(relaxTimer); start(); appendMessage('bot','Starting relax breathing exercise.'); });
  document.getElementById('stopRelax').addEventListener('click', ()=> { clearInterval(relaxTimer); breath.style.transform='scale(1)'; appendMessage('bot','Stopped relax mode.'); });
}

/* Quotes */
function renderQuotesPanel(){
  const q = QUOTES[Math.floor(Math.random()*QUOTES.length)];
  openPanel(`<h2>Motivation</h2><p>${escapeHtml(q)}</p><div style="display:flex;gap:8px;margin-top:12px"><button id="newQ" class="btn">New Quote</button></div>`);
  document.getElementById('newQ').addEventListener('click', renderQuotesPanel);
}

/* ---------- Reminders engine (simple while page open) ---------- */
function checkReminders(){
  const meds = load(STORAGE.MEDS, []);
  const now = new Date();
  const hh = String(now.getHours()).padStart(2,'0');
  const mm = String(now.getMinutes()).padStart(2,'0');
  meds.forEach(m => {
    if(m.time === `${hh}:${mm}` && !m._notifiedToday){
      appendMessage('bot', `Reminder: take ${m.name} (${m.time})`);
      // mark notified for today
      m._notifiedToday = new Date().toDateString();
    }
  });
  // reset _notifiedToday at midnight
  setTimeout(checkReminders, 30_000);
}

/* ---------- UI wiring ---------- */
function populateTablets(){
  tabletList.innerHTML = '';
  TABLETS.forEach(t => {
    const el = document.createElement('div'); el.className='chip';
    el.innerHTML = `<div><div class="name">${escapeHtml(t.name)}</div><div class="meta">${escapeHtml(t.dose)} • ${escapeHtml(t.note)}</div></div><div><button class="btn ghost askMed">Ask</button></div>`;
    el.querySelector('.askMed').addEventListener('click', ()=>{
      userInput.value = `Tell me about ${t.name} ${t.dose} — uses, side effects, how to take it.`;
      userInput.focus();
      sendBtn.click();
    });
    tabletList.appendChild(el);
  });
}

/* Hook side buttons */
document.querySelectorAll('.side-btn').forEach(btn=>{
  btn.addEventListener('click', (e)=>{
    const panel = e.currentTarget.dataset.panel;
    if(panel==='water') renderWaterPanel();
    if(panel==='bmi') renderBMIPanel();
    if(panel==='reminders') renderRemindersPanel();
    if(panel==='heart') renderHeartPanel();
    if(panel==='sleep') renderSleepPanel();
    if(panel==='tips') renderTipsPanel();
    if(panel==='report') renderReportPanel();
    if(panel==='symptom') renderSymptomPanel();
    if(panel==='relax') renderRelaxPanel();
    if(panel==='quotes') renderQuotesPanel();
  });
});

toggleSidebar.addEventListener('click', ()=> sidebar.classList.toggle('hidden'));
closePanel.addEventListener('click', closePanelFn);
panelOverlay.addEventListener('click', (e)=> { if(e.target===panelOverlay) closePanelFn(); });

sendBtn.addEventListener('click', sendMessage);
userInput.addEventListener('keydown', (e)=> { if(e.key==='Enter' && !e.shiftKey){ e.preventDefault(); sendMessage(); } });

clearDataBtn.addEventListener('click', ()=> {
  if(!confirm('Clear all saved data (localStorage)?')) return;
  Object.values(STORAGE).forEach(k=>localStorage.removeItem(k));
  appendMessage('bot', 'All local data cleared.');
});

/* ---------- Init ---------- */
function bootstrap(){
  populateTablets();
  appendMessage('bot','Hello Arjun 👋 I’m Arogya AI — your smart health assistant.');
  checkReminders();
  statusEl.textContent = 'Ready (static AI)';
}
bootstrap();
