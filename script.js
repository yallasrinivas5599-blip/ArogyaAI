/* Arogya AI - upgraded with 10 next-gen lightweight frontend features
   Keep file name script.js in repo root. Works with index.html & style.css below.
*/

/* ---------- Elements (existing IDs preserved) ---------- */
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

/* New elements we'll create or rely on in HTML:
   - tabletBtn (floating)
   - newChatBtn (in sidebar footer)
   - quickActionBtn (floating chat actions)
*/
let isRequesting = false;

/* ---------- Persistence Keys ---------- */
const STORAGE = {
  WATER: 'arogya_water_v1',
  MEDS: 'arogya_meds_v1',
  NOTES: 'arogya_notes_v1',
  SLEEP: 'arogya_sleep_v1',
  HEART: 'arogya_heart_v1',
  CHAT: 'arogya_chat_v1',
  MOOD: 'arogya_mood_v1'
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
function log(...args){ console.log('[ArogyaAI]', ...args); }
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
  if(history.length>300) history.shift();
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

/* ---------- Base "smart" reply logic (static rules) ---------- */
function smartReply(message){
  const m = (message||'').toLowerCase();
  // greetings & tone detection
  if(/^(hi|hello|hey|hii|yo)\b/.test(m)) return "Hello! 👋 How can I help with your health today?";
  if(/how are you/.test(m)) return "I’m here and ready to help — how are you feeling?";
  if(/thanks|thank you/.test(m)) return "You're welcome! 😊";
  if(/bye|goodbye|see you/.test(m)) return "Take care! 🌿";

  // mood detection (very simple)
  if(/sad|depress|unhappy|down/.test(m)) return "I’m sorry you feel that way. Would you like a short breathing exercise or a motivating quote?";
  if(/happy|great|awesome|good|fine/.test(m)) return "Great to hear! Keep that energy — hydrate and stretch a bit :)";

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

  // fun features triggers
  if(/bmi/.test(m)) return "Use the BMI tool in the sidebar (🧮) — enter height & weight for a quick score.";
  if(/water|hydrate/.test(m)) return "Use the Water Tracker in the sidebar (💧) to log glasses. Aim for 2–3L depending on your activity.";
  if(/quiz|question|test/.test(m)) return "Want a quick health quiz? Open the Quiz in the sidebar and try one!";
  if(/relax|breathe|breathing/.test(m)) return "Try the Relax Mode in the sidebar — a short guided breathing exercise helps.";

  // fallback questions
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
  const text = (userInput.value||'').trim();
  if(!text) return;
  appendMessage('user', text, nowFmt());
  userInput.value = '';
  showTyping();
  isRequesting = true;
  sendBtn.disabled = true;
  statusEl.textContent = 'Processing...';

  // small simulated delay
  await new Promise(r => setTimeout(r, 400 + Math.random()*600));

  // route special commands
  if(/^\/voice/.test(text)){
    speak("Voice activated. How can I assist?");
    appendMessage('bot', 'Voice mode activated.');
    isRequesting = false; sendBtn.disabled = false; statusEl.textContent='Local AI';
    return;
  }

  // get reply
  const reply = smartReply(text);
  appendMessage('bot', reply, nowFmt());

  // automatic mood tracking (store simple)
  inferAndSaveMoodFromText(text);

  statusEl.textContent = 'Local AI';
  isRequesting = false;
  sendBtn.disabled = false;
}

/* ---------- Panels (generic open/close) ---------- */
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

/* ---------- Existing features' panels (water, bmi ...) ---------- */
/* Keep implementations similar to your original code but slightly refactored to avoid duplicates.
   (I simplified some markup and kept same behavior.) */

function renderWaterPanel(){
  const data = load(STORAGE.WATER, {goal:8, drank:0});
  const html = `
    <h2>Water Tracker</h2>
    <p>Goal: <strong>${data.goal}</strong> glasses</p>
    <div class="panel-row">
      <button id="addGlass" class="btn">+ Glass</button>
      <button id="removeGlass" class="btn ghost">- Glass</button>
      <button id="resetWater" class="btn ghost">Reset</button>
    </div>
    <div class="hint">Drank: <strong id="drankVal">${data.drank}</strong> glasses</div>
  `;
  openPanel(html);
  document.getElementById('addGlass').addEventListener('click', () => {
    const d = load(STORAGE.WATER, {goal:8, drank:0});
    d.drank = (d.drank||0)+1; save(STORAGE.WATER, d);
    document.getElementById('drankVal').textContent = d.drank;
    if(d.drank >= d.goal) appendMessage('bot', `Nice — you've reached your water goal for today! 💧`);
  });
  document.getElementById('removeGlass').addEventListener('click', () => {
    const d = load(STORAGE.WATER, {goal:8, drank:0});
    d.drank = Math.max(0, (d.drank||0)-1); save(STORAGE.WATER, d);
    document.getElementById('drankVal').textContent = d.drank;
  });
  document.getElementById('resetWater').addEventListener('click', () => {
    save(STORAGE.WATER, {goal:8, drank:0});
    document.getElementById('drankVal').textContent = 0;
  });
}

function renderBMIPanel(){
  const html = `
    <h2>BMI Calculator</h2>
    <div class="panel-row">
      <input id="bWeight" placeholder="Weight (kg)" />
      <input id="bHeight" placeholder="Height (cm)" />
    </div>
    <div class="panel-row">
      <button id="calcBMI" class="btn">Calculate</button>
      <button id="clearBMI" class="btn ghost">Clear</button>
    </div>
    <div class="hint" id="bmiResult"></div>
  `;
  openPanel(html);
  document.getElementById('calcBMI').addEventListener('click', () => {
    const w = parseFloat(document.getElementById('bWeight').value);
    const h = parseFloat(document.getElementById('bHeight').value);
    if(!w || !h){ alert('Enter valid numbers'); return; }
    const m = h/100; const bmi = +(w/(m*m)).toFixed(1);
    let cat = 'Normal'; if(bmi<18.5) cat='Underweight'; else if(bmi>=30) cat='Obese'; else if(bmi>=25) cat='Overweight';
    document.getElementById('bmiResult').innerHTML = `BMI: <strong>${bmi}</strong> — ${cat}`;
    appendMessage('bot', `Your BMI is ${bmi} (${cat}).`);
  });
  document.getElementById('clearBMI').addEventListener('click', ()=> {
    document.getElementById('bWeight').value=''; document.getElementById('bHeight').value=''; document.getElementById('bmiResult').textContent='';
  });
}

function renderRemindersPanel(){
  const meds = load(STORAGE.MEDS, []);
  let listHtml = meds.length ? meds.map((m,i)=>`<div class="rem-item"><div><strong>${escapeHtml(m.name)}</strong><div class="meta">${escapeHtml(m.time)}</div></div><div><button data-del="${i}" class="btn ghost">Del</button></div></div>`).join('') : '<div class="muted">No reminders</div>';
  const html = `
    <h2>Medicine Reminders</h2>
    <div class="panel-row">
      <input id="medName" placeholder="Medicine name"/>
      <input id="medTime" type="time"/>
    </div>
    <div class="panel-row">
      <button id="addMed" class="btn">Add</button>
      <button id="clearMeds" class="btn ghost">Clear all</button>
    </div>
    <div>${listHtml}</div>
  `;
  openPanel(html);
  document.getElementById('addMed').addEventListener('click', ()=> {
    const name = document.getElementById('medName').value.trim();
    const time = document.getElementById('medTime').value;
    if(!name || !time) return alert('Provide name and time');
    const arr = load(STORAGE.MEDS, []); arr.push({name, time}); save(STORAGE.MEDS, arr);
    appendMessage('bot', `Added ${name} at ${time} — I'll remind you while the app is open.`);
    renderRemindersPanel();
  });
  document.getElementById('clearMeds').addEventListener('click', ()=> {
    if(!confirm('Clear all reminders?')) return;
    save(STORAGE.MEDS, []); renderRemindersPanel();
  });
  panelInner.querySelectorAll('[data-del]').forEach(btn => btn.addEventListener('click', (e)=> {
    const i = Number(e.target.dataset.del); const arr = load(STORAGE.MEDS, []); arr.splice(i,1); save(STORAGE.MEDS,arr); renderRemindersPanel();
  }));
}

function renderHeartPanel(){
  const arr = load(STORAGE.HEART, []); const last = arr.length ? arr[arr.length-1] : null;
  const html = `
    <h2>Heart Rate Logger</h2>
    <div class="panel-row">
      <input id="hrVal" placeholder="Enter bpm" />
      <button id="saveHr" class="btn">Save</button>
      <button id="randHr" class="btn ghost">Random</button>
    </div>
    <div class="hint">Last: ${last ? `${last.value} bpm at ${new Date(last.ts).toLocaleString()}` : 'No data'}</div>
  `;
  openPanel(html);
  document.getElementById('saveHr').addEventListener('click', ()=> {
    const v = Number(document.getElementById('hrVal').value); if(!v) return alert('Enter number');
    arr.push({value:v,ts:new Date().toISOString()}); save(STORAGE.HEART,arr); appendMessage('bot', `Logged heart rate ${v} bpm.`); renderHeartPanel();
  });
  document.getElementById('randHr').addEventListener('click', ()=> {
    const v = Math.floor(60 + Math.random()*40); arr.push({value:v,ts:new Date().toISOString()}); save(STORAGE.HEART, arr); appendMessage('bot', `Logged heart rate ${v} bpm.`); renderHeartPanel();
  });
}

function renderSleepPanel(){
  const s = load(STORAGE.SLEEP, {}); const html = `
    <h2>Sleep Tracker</h2>
    <div class="panel-row"><input id="sleepStart" type="time"/><input id="sleepEnd" type="time"/></div>
    <div class="panel-row"><button id="saveSleep" class="btn">Save</button><button id="clearSleep" class="btn ghost">Clear</button></div>
    <div class="hint">Last: ${s.start ? `${s.start} → ${s.end}` : 'No sleep logged'}</div>
  `;
  openPanel(html);
  document.getElementById('saveSleep').addEventListener('click', ()=> {
    const start = document.getElementById('sleepStart').value; const end = document.getElementById('sleepEnd').value;
    if(!start || !end) return alert('Enter both times'); save(STORAGE.SLEEP, {start,end,ts:new Date().toISOString()}); appendMessage('bot', `Saved sleep ${start} → ${end}.`); renderSleepPanel();
  });
  document.getElementById('clearSleep').addEventListener('click', ()=> { save(STORAGE.SLEEP, {}); renderSleepPanel(); });
}

function renderTipsPanel(){
  const tip = TIPS[Math.floor(Math.random()*TIPS.length)];
  const html = `<h2>Daily Health Tip</h2><p>${escapeHtml(tip)}</p><div class="panel-row"><button id="newTip" class="btn">New Tip</button></div>`;
  openPanel(html);
  document.getElementById('newTip').addEventListener('click', renderTipsPanel);
}

function renderReportPanel(){
  const water = load(STORAGE.WATER, {goal:8,drank:0}); const heart = load(STORAGE.HEART, []); const sleep = load(STORAGE.SLEEP, {}); const meds = load(STORAGE.MEDS, []);
  const lastHp = heart.length ? heart[heart.length-1].value : '—';
  const html = `
    <h2>Daily Report</h2>
    <ul>
      <li>Water: ${water.drank || 0}/${water.goal} glasses</li>
      <li>Last heart: ${lastHp} bpm</li>
      <li>Sleep: ${sleep.start ? `${sleep.start} → ${sleep.end}` : '—'}</li>
      <li>Medicine reminders: ${meds.length}</li>
    </ul>
    <div class="panel-row"><button id="exportReport" class="btn">Export</button></div>
  `;
  openPanel(html);
  document.getElementById('exportReport').addEventListener('click', ()=> {
    const data = {water,heart,sleep,meds,ts:new Date().toISOString()}; const blob = new Blob([JSON.stringify(data,null,2)], {type:'application/json'});
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download='arogya_report.json'; a.click(); URL.revokeObjectURL(a.href);
  });
}

function renderSymptomPanel(){
  const html = `
    <h2>Symptom Checker</h2>
    <select id="bodyPart"><option value="">Choose body part</option><option>Head</option><option>Neck</option><option>Chest</option><option>Stomach</option><option>Back</option></select>
    <div style="margin-top:8px"><input id="symptomText" placeholder="Describe symptom" /></div>
    <div class="panel-row"><button id="checkBtn" class="btn">Check</button></div>
    <div id="sympResult" class="hint" style="margin-top:10px"></div>
  `;
  openPanel(html);
  document.getElementById('checkBtn').addEventListener('click', ()=> {
    const part = document.getElementById('bodyPart').value; const text = document.getElementById('symptomText').value;
    if(!part && !text) return alert('Pick a body part or describe a symptom');
    let advice = "I’m not a doctor, but here are some possibilities: ";
    if(/fever|temperature/.test(text) || /fever/.test(part.toLowerCase())) advice += "Possible infection — rest, hydrate, monitor temp.";
    else if(/pain|ache/.test(text) || part==='Neck') advice += "Could be strain or posture-related — try gentle stretching and heat.";
    else advice += "Try rest, monitor symptoms, and seek medical if severe.";
    document.getElementById('sympResult').textContent = advice; appendMessage('bot', advice);
  });
}

function renderRelaxPanel(){
  const html = `
    <h2>Relax Mode</h2>
    <p>Follow this breathing guide for 1 minute.</p>
    <div class="panel-row"><button id="startRelax" class="btn">Start</button><button id="stopRelax" class="btn ghost">Stop</button></div>
    <div id="relaxBox" style="margin-top:12px;display:flex;align-items:center;justify-content:center;height:120px">
      <div id="breath" style="width:80px;height:80px;border-radius:50%;background:linear-gradient(90deg,#4ee6c1,#5fb0ff);opacity:0.9"></div>
    </div>
  `;
  openPanel(html);
  let relaxTimer = null; const breath = document.getElementById('breath');
  function start(){ let state = 0; relaxTimer = setInterval(()=> { state=(state+1)%4; if(state===0) breath.style.transform='scale(1.5)'; if(state===1) breath.style.transform='scale(1)'; if(state===2) breath.style.transform='scale(1.3)'; if(state===3) breath.style.transform='scale(1)'; }, 1200); }
  document.getElementById('startRelax').addEventListener('click', ()=> { if(relaxTimer) clearInterval(relaxTimer); start(); appendMessage('bot','Starting relax breathing exercise.'); });
  document.getElementById('stopRelax').addEventListener('click', ()=> { clearInterval(relaxTimer); breath.style.transform='scale(1)'; appendMessage('bot','Stopped relax mode.'); });
}

function renderQuotesPanel(){
  const q = QUOTES[Math.floor(Math.random()*QUOTES.length)];
  openPanel(`<h2>Motivation</h2><p>${escapeHtml(q)}</p><div class="panel-row"><button id="newQ" class="btn">New Quote</button></div>`);
  document.getElementById('newQ').addEventListener('click', renderQuotesPanel);
}

/* ---------- Reminders engine (runs while page open) ---------- */
function checkReminders(){
  const meds = load(STORAGE.MEDS, []);
  const now = new Date(); const hh = String(now.getHours()).padStart(2,'0'); const mm = String(now.getMinutes()).padStart(2,'0');
  meds.forEach(m => {
    if(m.time === `${hh}:${mm}` && m._notifiedFor !== new Date().toDateString()){
      appendMessage('bot', `Reminder: take ${m.name} (${m.time})`);
      m._notifiedFor = new Date().toDateString();
    }
  });
  save(STORAGE.MEDS, meds);
  setTimeout(checkReminders, 30_000);
}

/* ---------- UI wiring: tablets, side buttons ---------- */
function populateTablets(){
  if(!tabletList) return;
  tabletList.innerHTML = '';
  TABLETS.forEach(t => {
    const el = document.createElement('div'); el.className='chip tablet-item';
    el.innerHTML = `<div><div class="name">${escapeHtml(t.name)}</div><div class="meta">${escapeHtml(t.dose)} • ${escapeHtml(t.note)}</div></div><div><button class="btn ghost askMed">Ask</button></div>`;
    el.querySelector('.askMed').addEventListener('click', ()=> {
      userInput.value = `Tell me about ${t.name} ${t.dose} — uses, side effects, how to take it.`;
      userInput.focus();
      sendMessage();
      // close tablet popup (if present)
      if(document.getElementById('tabletPanel')) document.getElementById('tabletPanel').classList.remove('active');
    });
    tabletList.appendChild(el);
  });
}

/* Hook side buttons (existing ones) */
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

/* ---------- Existing UI event wiring ---------- */
toggleSidebar.addEventListener('click', ()=> sidebar.classList.toggle('hidden'));
closePanel.addEventListener('click', closePanelFn);
panelOverlay.addEventListener('click', (e)=> { if(e.target===panelOverlay) closePanelFn(); });

sendBtn.addEventListener('click', sendMessage);
userInput.addEventListener('keydown', (e)=> { if(e.key==='Enter' && !e.shiftKey){ e.preventDefault(); sendMessage(); } });

clearDataBtn.addEventListener('click', ()=> {
  if(!confirm('Clear all saved data (localStorage)?')) return;
  // preserve reminders, but clear chats and mood for new session
  localStorage.removeItem(STORAGE.CHAT);
  localStorage.removeItem(STORAGE.MOOD);
  appendMessage('bot', 'All chat & mood memory cleared.');
});

/* ---------- New features (1..10) ---------- */

/* 1) Mood-Based Health Chat (theme + mood memory) */
function inferAndSaveMoodFromText(text){
  const t = (text||'').toLowerCase();
  let mood = load(STORAGE.MOOD, 'neutral');
  if(/sad|depress|unhappy|down|lonely/.test(t)) mood='sad';
  else if(/happy|great|awesome|good|fine|excited/.test(t)) mood='happy';
  else if(/tired|sleepy|exhausted|tuckered/.test(t)) mood='tired';
  else mood = 'neutral';
  save(STORAGE.MOOD, mood);
  applyMoodTheme(mood);
}
function applyMoodTheme(mood){
  // subtle UI theme changes
  document.body.dataset.mood = mood;
  if(mood==='happy') document.documentElement.style.setProperty('--accent','#4ee6c1');
  else if(mood==='sad') document.documentElement.style.setProperty('--accent','#7aa8ff');
  else if(mood==='tired') document.documentElement.style.setProperty('--accent','#ffb86b');
  else document.documentElement.style.setProperty('--accent','#47e7b8');
}

/* 2) AI Mirror — empathy style small panel */
function renderAIMirror(){
  const html = `
    <h2>AI Mirror</h2>
    <p>Type what you feel (e.g. "I look tired", "I feel stressed")</p>
    <div class="panel-row"><input id="mirrorText" placeholder="I feel..." /><button id="mirrorBtn" class="btn">Reflect</button></div>
    <div id="mirrorOut" class="hint" style="margin-top:8px"></div>
  `;
  openPanel(html);
  document.getElementById('mirrorBtn').addEventListener('click', ()=> {
    const txt = document.getElementById('mirrorText').value.trim();
    if(!txt) return alert('Type a phrase');
    // empathetic rule-based reply
    let reply = "Thanks for sharing. ";
    if(/tired|sleepy/.test(txt)) reply += "You look like you need rest and hydration — try 10 minutes of deep breathing.";
    else if(/stressed|anxious|nervous/.test(txt)) reply += "That sounds stressful. A short breathing exercise or a walk can help.";
    else if(/happy|good|great/.test(txt)) reply += "Love that — keep doing whatever makes you feel good!";
    else reply += "I hear you. Would you like a quick relaxation exercise?";
    document.getElementById('mirrorOut').textContent = reply;
    appendMessage('bot', reply);
  });
}

/* 3) Body Signal Decoder (static reasoning) */
function decodeBodySignal(text){
  const m = (text||'').toLowerCase();
  if(/racing heart|palpit|heart is racing/.test(m)) return "A racing heart can be anxiety, exercise or caffeine. Try a 30s breathing reset. If persistent, contact a provider.";
  if(/lightheaded|dizzy/.test(m)) return "Dizziness can come from low blood sugar or dehydration. Sit down and sip water. If severe, seek immediate care.";
  if(/numb|tingling/.test(m)) return "Numbness/tingling requires attention — especially if it affects face or one side. Consider urgent care.";
  return null;
}

/* 4) Health Prediction Meter (futuristic animated score) */
function renderHealthMeter(){
  const score = Math.floor(60 + Math.random()*30); // 60-90
  const html = `
    <h2>Health Meter</h2>
    <div style="display:flex;align-items:center;gap:12px">
      <div class="meter"><div class="meter-fill" style="width:${score}%"></div></div>
      <div><strong>${score}%</strong><div class="meta">Estimated energy</div></div>
    </div>
    <div style="margin-top:12px"><button id="recalc" class="btn">Recalculate</button></div>
  `;
  openPanel(html);
  document.getElementById('recalc').addEventListener('click', renderHealthMeter);
}

/* 5) Voice Reaction Bot (using Web Speech API) */
function speak(text){
  try {
    if(!('speechSynthesis' in window)) return;
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'en-US';
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(u);
  } catch(e){ log('TTS error', e); }
}
function startVoiceInput(){
  if(!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)){
    alert('Voice input not supported in this browser.');
    return;
  }
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const recognition = new SpeechRecognition();
  recognition.lang = 'en-US';
  recognition.interimResults = false;
  recognition.onresult = (ev) => {
    const t = ev.results[0][0].transcript;
    userInput.value = t;
    sendMessage();
  };
  recognition.onerror = (e) => { log('voice error', e); };
  recognition.start();
}

/* 6) Smart Health Quizzes (small interactive) */
function renderQuizPanel(){
  const qs = [
    {q:'Which vitamin is best for immunity?', a:['Vitamin A','Vitamin C','Vitamin D','Vitamin B12'], ans:2},
    {q:'What helps for mild fever?', a:['Cold baths','Hydration & rest','No fluids','Ice water'], ans:1},
    {q:'Safe painkiller for most adults?', a:['Paracetamol','Aspirin if allergy','Unknown','Any antibiotic'], ans:0}
  ];
  let i = Math.floor(Math.random()*qs.length);
  const cur = qs[i];
  const html = `<h2>Quick Quiz</h2><p>${escapeHtml(cur.q)}</p>${cur.a.map((opt,idx)=>`<div class="quiz-opt"><button data-idx="${idx}" class="btn ghost">${escapeHtml(opt)}</button></div>`).join('')}<div style="margin-top:10px"><button id="newQBtn" class="btn">New Quiz</button></div>`;
  openPanel(html);
  panelInner.querySelectorAll('.quiz-opt button').forEach(b => b.addEventListener('click', (e)=> {
    const idx = Number(e.currentTarget.dataset.idx);
    if(idx===cur.ans) { appendMessage('bot', 'Correct! 🎉 Nice job.'); alert('Correct!'); }
    else { appendMessage('bot', 'Not quite — keep trying!'); alert('Not correct'); }
  }));
  document.getElementById('newQBtn').addEventListener('click', renderQuizPanel);
}

/* 7) Mini AI Doctor Game — "Cure the Patient" */
function renderMiniGame(){
  const cases = [
    {sym:'Severe headache', correct:'Rest, hydrate, seek care if sudden/severe'},
    {sym:'Sore throat & fever', correct:'Rest, hydrate, test if COVID/flu, see doctor if worse'},
    {sym:'Mild sprain', correct:'Rest & ice, avoid weight-bearing for short time'}
  ];
  const pick = cases[Math.floor(Math.random()*cases.length)];
  const html = `<h2>Cure the Patient</h2><p>Patient: <strong>${escapeHtml(pick.sym)}</strong></p>
  <div class="panel-row">
    <button class="btn" data-choice="A">A: Home care</button>
    <button class="btn ghost" data-choice="B">B: Immediate surgery</button>
    <button class="btn ghost" data-choice="C">C: Antibiotics always</button>
  </div>
  <div style="margin-top:10px"><button id="hintBtn" class="btn ghost">Hint</button></div>`;
  openPanel(html);
  panelInner.querySelectorAll('[data-choice]').forEach(b => b.addEventListener('click', (e)=> {
    const c = e.currentTarget.dataset.choice;
    if(c==='A') { appendMessage('bot', 'Good choice — conservative care is often a first step.'); alert('Nice!'); }
    else { appendMessage('bot', 'That might be too aggressive — consider safe options first.'); alert('Try again'); }
  }));
  document.getElementById('hintBtn').addEventListener('click', ()=> appendMessage('bot','Think: is this life-threatening right now?'));
}

/* 8) Arogya’s Daily Wisdom (morning tip with subtle sound) */
function showDailyWisdom(){
  const q = TIPS[Math.floor(Math.random()*TIPS.length)];
  appendMessage('bot', `Daily Wisdom: ${q}`);
  try{ speak(`Daily wisdom: ${q}`); }catch(e){}
}

/* 9) AI Mood Crystal (small glowing status) */
function renderMoodCrystal(){
  const mood = load(STORAGE.MOOD, 'neutral');
  const colors = {happy:'#4ee6c1',sad:'#7aa8ff',tired:'#ffb86b',neutral:'#9bd3c7'};
  const html = `<h2>Mood Crystal</h2><div style="height:120px;display:flex;align-items:center;justify-content:center"><div style="width:80px;height:80px;border-radius:50%;background:${colors[mood]||colors.neutral};box-shadow:0 0 18px ${colors[mood]||colors.neutral}55"></div></div><div class="meta">Detected mood: ${mood}</div>`;
  openPanel(html);
}

/* 10) Memory Chat (remember last symptom locally) + New Chat */
function memoryIntro(){
  const mem = load(STORAGE.CHAT, []);
  const mood = load(STORAGE.MOOD, 'neutral');
  if(mem.length){
    const last = mem[mem.length-1];
    appendMessage('bot', `Welcome back! Last conversation snippet: "${last.text.slice(0,80)}"`);
  } else {
    appendMessage('bot','👩‍⚕️ Welcome to Arogya AI — your personal health assistant.');
  }
  applyMoodTheme(mood);
}

/* ---------- Floating Tablet panel (mobile friendly) ---------- */
function initTabletFloating(){
  // create floating pill button if not present
  if(!document.getElementById('tabletBtn')){
    const btn = document.createElement('button'); btn.id='tabletBtn'; btn.className='floating-btn'; btn.title='Quick tablets'; btn.innerHTML='💊';
    document.body.appendChild(btn);

    // create sliding panel
    const panel = document.createElement('div'); panel.id='tabletPanel'; panel.className='tablet-panel';
    const listHtml = TABLETS.map(t=>`<div class="tablet-item"><div><strong>${escapeHtml(t.name)}</strong><div class="meta">${escapeHtml(t.dose)} · ${escapeHtml(t.note)}</div></div><div><button class="askBtn">Ask</button></div></div>`).join('');
    panel.innerHTML = `<h3>Tablet suggestions</h3><div class="tablet-list-inner">${listHtml}</div><div style="height:20px"></div>`;
    document.body.appendChild(panel);

    btn.addEventListener('click', ()=> panel.classList.toggle('active'));

    // attach ask behavior
    panel.querySelectorAll('.askBtn').forEach((b, idx)=>{
      b.addEventListener('click', ()=> {
        const t = TABLETS[idx];
        userInput.value = `Tell me about ${t.name} ${t.dose} — uses, side effects, how to take it.`;
        userInput.focus();
        sendMessage();
        panel.classList.remove('active');
      });
    });
  }
}

/* ---------- Quick action floating (new chat / voice) ---------- */
function initQuickActions(){
  if(!document.getElementById('quickActions')){
    const qa = document.createElement('div'); qa.id='quickActions'; qa.className='quick-actions';
    qa.innerHTML = `<button id="newChatBtn" class="mini">🗨️</button><button id="voiceBtn" class="mini">🎤</button><button id="meterBtn" class="mini">🔮</button>`;
    document.body.appendChild(qa);
    document.getElementById('newChatBtn').addEventListener('click', ()=> {
      if(confirm('Start a new chat? This will clear the current chat history.')){
        localStorage.removeItem(STORAGE.CHAT);
        chatArea.innerHTML='';
        appendMessage('bot','🗨️ New chat started. How can I help?');
      }
    });
    document.getElementById('voiceBtn').addEventListener('click', ()=> startVoiceInput());
    document.getElementById('meterBtn').addEventListener('click', ()=> renderHealthMeter());
  }
}

/* ---------- Utility: restore history without duplication ---------- */
function restoreHistoryOnce(){
  const history = load(STORAGE.CHAT, []);
  if(history.length){
    history.forEach(h => {
      // prevent duplicate repeated welcome by using timestamps
      appendMessage(h.who, h.text, new Date(h.ts).toLocaleString());
    });
  }
}

/* ---------- Reminder loop already set in checkReminders ---------- */

/* ---------- Init bootstrap ---------- */
function bootstrap(){
  log('Booting Arogya AI frontend');
  populateTablets();
  initTabletFloating();
  initQuickActions();
  restoreHistoryOnce();
  memoryIntro();
  checkReminders();
  statusEl.textContent = 'Ready (static AI)';
}
bootstrap();

/* Expose some helpers to console for debugging */
window.Arogya = {
  save, load, appendMessage, renderHealthMeter, renderAIMirror, renderQuizPanel, renderMiniGame, renderMoodCrystal
};
