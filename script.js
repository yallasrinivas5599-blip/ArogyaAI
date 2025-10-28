/* Arogya AI - v2 (radial menu + friendly companion + 10 features)
   Place as script.js (replace existing) - keeps everything client-side and uses localStorage.
*/

(() => {
  /* ---------- Elements ---------- */
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
  const floatingMain = document.getElementById('floatingMain');
  const floatingMenu = document.getElementById('floatingMenu');
  const newChatBtn = document.getElementById('newChatBtn');

  let isRequesting = false;

  /* ---------- Persistence Keys ---------- */
  const STORAGE = {
    WATER: 'arogya_water_v2',
    MEDS: 'arogya_meds_v2',
    SLEEP: 'arogya_sleep_v2',
    HEART: 'arogya_heart_v2',
    CHAT: 'arogya_chat_v2',
    QUIZ: 'arogya_quiz_v2'
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
    "Drink a glass of water when you wake up.",
    "Take short movement breaks every hour.",
    "Include a portion of protein with each meal.",
    "Aim for consistent sleep times.",
    "Breathe deeply for 1 minute if stressed."
  ];

  const QUOTES = [
    "Small healthy steps make a big difference.",
    "Rest is part of progress — be kind to yourself.",
    "Hydration and movement = energy.",
    "You’re doing better than you think."
  ];

  const QUIZ_Q = [
    { q: "How many hours of sleep is recommended for teenagers?", a: "8-10" },
    { q: "Which vitamin is abundant in citrus fruits?", a: "Vitamin C" },
    { q: "Is fever always a sign of infection? (yes/no)", a: "no" },
    { q: "Drink water when you are thirsty. (true/false)", a: "true" }
  ];

  /* ---------- Helpers ---------- */
  function escapeHtml(s){ return String(s||'').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
  function save(key,val){ localStorage.setItem(key, JSON.stringify(val)); }
  function load(key, def){ try{ const v = JSON.parse(localStorage.getItem(key)); return v === null ? def : (v ?? def); }catch(e){return def;} }
  function nowFmt(){ return new Date().toLocaleString(); }
  function el(q){ return document.querySelector(q); }

  /* ---------- Chat rendering ---------- */
  function renderHistory(){
    const history = load(STORAGE.CHAT, []);
    chatArea.innerHTML = '';
    history.forEach(m => {
      const div = document.createElement('div');
      div.className = 'msg ' + (m.who === 'user' ? 'user' : 'bot');
      div.innerHTML = `<div class="text">${escapeHtml(m.text)}</div>${m.ts ? `<div class="meta">${escapeHtml(new Date(m.ts).toLocaleString())}</div>` : ''}`;
      chatArea.appendChild(div);
    });
    chatArea.scrollTop = chatArea.scrollHeight;
  }

  function appendMessage(who, text, meta=''){
    // if adding bot final - remove typing indicator
    if(who==='bot'){
      const last = chatArea.lastElementChild;
      if(last && last.dataset && last.dataset.typing==='1') chatArea.removeChild(last);
    }
    const div = document.createElement('div');
    div.className = 'msg ' + (who==='user' ? 'user' : 'bot');
    div.innerHTML = `<div class="text">${escapeHtml(text)}</div>${ meta ? `<div class="meta">${escapeHtml(meta)}</div>` : '' }`;
    chatArea.appendChild(div);
    chatArea.scrollTop = chatArea.scrollHeight;
    // persist
    const history = load(STORAGE.CHAT, []);
    history.push({who, text, ts: new Date().toISOString()});
    if(history.length>200) history.shift();
    save(STORAGE.CHAT, history);
  }

  function showTyping(){
    const t = document.createElement('div');
    t.className = 'msg bot';
    t.dataset.typing='1';
    t.innerHTML = `<div class="typing"><span></span><span></span><span></span></div>`;
    chatArea.appendChild(t);
    chatArea.scrollTop = chatArea.scrollHeight;
  }

  /* ---------- Smart reply engine (pattern + emotion) ---------- */
  function detectEmotion(text){
    const m = text.toLowerCase();
    if(/\b(sad|depress|depressed|cry|unhappy|lonely)\b/.test(m)) return 'sad';
    if(/\b(tired|exhausted|sleepy|fatigued)\b/.test(m)) return 'tired';
    if(/\b(anxious|anxiety|nervous|worried)\b/.test(m)) return 'anxious';
    if(/\b(happy|good|great|fine|well)\b/.test(m)) return 'happy';
    return null;
  }

  function smartReply(message){
    const m = (message||'').toLowerCase().trim();
    // emotion
    const emo = detectEmotion(message);
    if(emo==='sad') return "I hear you — I'm sorry you're feeling down. Would you like some breathing tips or a short mood-boost exercise?";
    if(emo==='tired') return "Feeling tired? Try a 15-minute nap or a glass of water and some light stretch. Want a quick energizer?";
    if(emo==='anxious') return "Take a slow breath with me — inhale for 4, hold 2, exhale 6. I can guide you through one if you'd like.";
    if(emo==='happy') return "Awesome! Love to hear that 😊 Keep it going — a quick walk boosts that mood even more.";

    // direct small talk
    if(/^(hi|hello|hey|hii|yo)\b/.test(m)) return "Hello! 👋 How can I help with your health today?";
    if(/how are you\b/.test(m)) return "I’m here and ready to help — how are you feeling right now?";
    if(/\b(thanks|thank you|thx)\b/.test(m)) return "You’re welcome! If you need more, I’m here.";
    if(/\b(bye|goodbye|see you)\b/.test(m)) return "Take care — reach out anytime 🌿";

    // symptom patterns (expanded)
    if(/fever|temperature|hot\b/.test(m)) return "For fever: drink fluids, rest, and consider Paracetamol (500 mg) if needed. If temp >39°C or lasts >48 hrs, see a doctor.";
    if(/cough|cold|sore throat/.test(m)) return "For cough/cold: warm fluids, steam, saline gargle for sore throat. See a doctor if breathing is difficult.";
    if(/headache|migraine/.test(m)) return "Headache: check hydration & rest; try a dark quiet room. Sudden severe headache needs urgent care.";
    if(/neck pain|stiff neck/.test(m)) return "Neck pain often from posture — try gentle stretches, heat. See doctor if numbness or weakness occurs.";
    if(/stomach|nausea|vomit|diarrhea/.test(m)) return "Stomach upset: sip clear fluids, avoid fatty foods. See doctor if severe pain, blood, or persistent vomiting.";
    if(/back pain/.test(m)) return "Back pain: gentle movement, avoid heavy lifting, apply heat for muscle strain; see doctor for severe or radiating pain.";
    if(/dizzy|dizziness|lightheaded/.test(m)) return "Dizziness: sit and hydrate. If it happens often, check blood pressure and see a doctor.";
    if(/rash|itch|allergy/.test(m)) return "Skin rash/itch: avoid irritants, cool compress; consider an antihistamine for allergies. See doctor for spreading or severe rashes.";

    // medicines direct ask
    if(/paracetamol|acetaminophen/.test(m)) return "Paracetamol: common dose 500mg for adults every 4-6 hours as needed — max ~4g/day. Avoid mixing with many cold meds.";
    if(/ibuprofen/.test(m)) return "Ibuprofen: an NSAID — usually 200-400mg every 4-6 hours (adults). Take with food; not for those with stomach ulcers.";
    if(/antibiotic|amoxicillin|augmentin/.test(m)) return "Antibiotics should be used when prescribed. Don't start antibiotics without a doctor; finish the course if given.";

    // features prompts
    if(/\bbmi\b/.test(m)) return "Open the BMI tool from the sidebar (🧮) to calculate your BMI quickly.";
    if(/\bwater|hydrate|hydration\b/.test(m)) return "Use Water Tracker (💧) in the sidebar to log glasses and meet your goal.";
    if(/\bhelp|what can you do\b/.test(m)) return "I can give basic health advice, explain common medicines, track water/sleep/heart, run quizzes, and more — choose a sidebar tool or ask me.";

    // fallback: clarifier
    const fallbacks = [
      "Tell me more about how you feel — when did it start?",
      "Do you have any allergies or medications I should know about?",
      "Is this mild, moderate or severe? I can give home tips or urgent advice."
    ];
    return fallbacks[Math.floor(Math.random()*fallbacks.length)];
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
    statusEl.textContent = 'Thinking...';

    // small delay to feel realistic
    await new Promise(r => setTimeout(r, 350 + Math.random()*650));
    const reply = smartReply(text);
    appendMessage('bot', reply, nowFmt());
    statusEl.textContent = 'Local AI (companion)';
    isRequesting = false;
    sendBtn.disabled = false;
  }

  /* ---------- Panels (features) ---------- */
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

  // Water tracker panel
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
      <div class="hint">Drank: <strong id="drankVal">${data.drank}</strong></div>
    `;
    openPanel(html);
    document.getElementById('addGlass').addEventListener('click', () => {
      const d = load(STORAGE.WATER, {goal:8, drank:0});
      d.drank = (d.drank||0) + 1; save(STORAGE.WATER,d);
      document.getElementById('drankVal').textContent = d.drank;
      appendMessage('bot', `Great — ${d.drank}/${d.goal} glasses done today!`);
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

  // BMI
  function renderBMIPanel(){
    const html = `
      <h2>BMI Calculator</h2>
      <div class="panel-row">
        <input id="bWeight" type="number" placeholder="Weight (kg)" />
        <input id="bHeight" type="number" placeholder="Height (cm)" />
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

  // Reminders (meds)
  function renderRemindersPanel(){
    const meds = load(STORAGE.MEDS, []);
    let listHtml = meds.length ? meds.map((m,i)=>`<div class="rem-item"><div><strong>${escapeHtml(m.name)}</strong><div class="meta">${escapeHtml(m.time)}</div></div><div><button data-del="${i}" class="btn ghost small">Del</button></div></div>`).join('') : '<div class="muted">No reminders</div>';
    const html = `
      <h2>Medicine Reminders</h2>
      <div class="panel-row"><input id="medName" placeholder="Medicine name"/><input id="medTime" type="time"/></div>
      <div class="panel-row"><button id="addMed" class="btn">Add</button><button id="clearMeds" class="btn ghost">Clear all</button></div>
      <div style="margin-top:12px">${listHtml}</div>
    `;
    openPanel(html);
    document.getElementById('addMed').addEventListener('click', () => {
      const name = document.getElementById('medName').value.trim();
      const time = document.getElementById('medTime').value;
      if(!name || !time) return alert('Provide name and time');
      const arr = load(STORAGE.MEDS, []); arr.push({name, time}); save(STORAGE.MEDS, arr);
      appendMessage('bot', `Added ${name} at ${time} — I'll remind you while this page is open.`);
      renderRemindersPanel();
    });
    document.getElementById('clearMeds').addEventListener('click', () => {
      if(!confirm('Clear all reminders?')) return;
      save(STORAGE.MEDS, []); renderRemindersPanel();
    });
    panelInner.querySelectorAll('[data-del]').forEach(btn => btn.addEventListener('click', (e)=> {
      const i = Number(e.target.dataset.del);
      const arr = load(STORAGE.MEDS, []); arr.splice(i,1); save(STORAGE.MEDS,arr); renderRemindersPanel();
    }));
  }

  // Heart logger
  function renderHeartPanel(){
    const arr = load(STORAGE.HEART, []);
    const last = arr.length ? arr[arr.length-1] : null;
    const html = `
      <h2>Heart Rate Logger</h2>
      <div class="panel-row"><input id="hrVal" placeholder="Enter bpm" /><button id="saveHr" class="btn">Save</button></div>
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
  }

  // Sleep tracker
  function renderSleepPanel(){
    const s = load(STORAGE.SLEEP, {});
    const html = `
      <h2>Sleep Tracker</h2>
      <div class="panel-row"><input id="sleepStart" type="time"/><input id="sleepEnd" type="time"/></div>
      <div class="panel-row"><button id="saveSleep" class="btn">Save</button><button id="clearSleep" class="btn ghost">Clear</button></div>
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

  // Tips
  function renderTipsPanel(){
    const tip = TIPS[Math.floor(Math.random()*TIPS.length)];
    const html = `<h2>Daily Health Tip</h2><p>${escapeHtml(tip)}</p><div class="panel-row"><button id="newTip" class="btn">New Tip</button><button id="doneTip" class="btn ghost">I did it</button></div>`;
    openPanel(html);
    document.getElementById('newTip').addEventListener('click', renderTipsPanel);
    document.getElementById('doneTip').addEventListener('click', ()=> {
      appendMessage('bot', 'Nice! Small wins add up — well done 🎉');
    });
  }

  // Daily report
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
      <div class="panel-row"><button id="exportReport" class="btn">Export</button></div>
    `;
    openPanel(html);
    document.getElementById('exportReport').addEventListener('click', ()=> {
      const data = {water,heart,sleep,meds,ts:new Date().toISOString()};
      const blob = new Blob([JSON.stringify(data,null,2)], {type:'application/json'});
      const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download='arogya_report.json'; a.click(); URL.revokeObjectURL(a.href);
    });
  }

  // Symptom checker
  function renderSymptomPanel(){
    const html = `
      <h2>Symptom Checker</h2>
      <select id="bodyPart"><option value="">Choose body part</option><option>Head</option><option>Neck</option><option>Chest</option><option>Stomach</option><option>Back</option><option>Leg</option><option>Arm</option></select>
      <div style="margin-top:8px"><input id="symptomText" placeholder="Describe symptom" /></div>
      <div class="panel-row"><button id="checkBtn" class="btn">Check</button></div>
      <div id="sympResult" class="hint" style="margin-top:10px"></div>
    `;
    openPanel(html);
    document.getElementById('checkBtn').addEventListener('click', ()=> {
      const part = document.getElementById('bodyPart').value;
      const text = document.getElementById('symptomText').value;
      if(!part && !text) return alert('Pick a body part or describe a symptom');
      let advice = "I’m not a doctor, but here are suggestions: ";
      if(/fever|temperature/.test(text) || /fever/.test(part.toLowerCase())) advice += "Possible infection — rest and hydrate; monitor temp.";
      else if(/pain|ache/.test(text) || part==='Neck' || part==='Back') advice += "Commonly strain — try gentle stretches, heat and rest. See a doctor for numbness.";
      else if(/chest|pressure|tightness/.test(text) || part==='Chest') advice = "Chest symptoms can be serious — seek immediate medical care if severe or sudden.";
      else advice += "Try rest and monitor. Seek care if symptoms worsen.";
      document.getElementById('sympResult').textContent = advice;
      appendMessage('bot', advice);
    });
  }

  // Relax mode (simple animation)
  function renderRelaxPanel(){
    const html = `
      <h2>Relax Mode</h2>
      <p>Follow guided breathing. Tap Start.</p>
      <div class="panel-row"><button id="startRelax" class="btn">Start</button><button id="stopRelax" class="btn ghost">Stop</button></div>
      <div id="relaxBox" class="relax-box"><div id="breath" class="breath-ball"></div></div>
    `;
    openPanel(html);
    let relaxTimer = null;
    const breath = document.getElementById('breath');
    function start(){
      let scaleUp = true;
      relaxTimer = setInterval(()=> {
        breath.style.transform = scaleUp ? 'scale(1.6)' : 'scale(1)';
        scaleUp = !scaleUp;
      }, 1500);
    }
    document.getElementById('startRelax').addEventListener('click', ()=> { if(relaxTimer) clearInterval(relaxTimer); start(); appendMessage('bot','Starting relax breathing exercise.'); });
    document.getElementById('stopRelax').addEventListener('click', ()=> { clearInterval(relaxTimer); breath.style.transform='scale(1)'; appendMessage('bot','Stopped relax mode.'); });
  }

  // Quotes
  function renderQuotesPanel(){
    const q = QUOTES[Math.floor(Math.random()*QUOTES.length)];
    openPanel(`<h2>Motivation</h2><p>${escapeHtml(q)}</p><div class="panel-row"><button id="newQ" class="btn">New Quote</button></div>`);
    document.getElementById('newQ').addEventListener('click', renderQuotesPanel);
  }

  // Mini Quiz
  function renderQuizPanel(){
    const state = { idx: 0, score: 0 };
    function showQuestion(){
      const item = QUIZ_Q[state.idx];
      openPanel(`
        <h2>Mini Quiz</h2>
        <div class="hint">Q${state.idx+1}: ${escapeHtml(item.q)}</div>
        <div class="panel-row"><input id="quizAns" placeholder="Your answer" /></div>
        <div class="panel-row"><button id="submitQuiz" class="btn">Submit</button><button id="skipQuiz" class="btn ghost">Skip</button></div>
        <div class="hint">Score: ${state.score}</div>
      `);
      document.getElementById('submitQuiz').addEventListener('click', ()=> {
        const ans = document.getElementById('quizAns').value.trim().toLowerCase();
        const correct = String(item.a || '').toLowerCase();
        if(!ans) return alert('Type an answer');
        if(ans.includes(correct) || correct.includes(ans)) { state.score++; appendMessage('bot','Correct! 🎉'); }
        else appendMessage('bot', `Not quite — correct: ${item.a}`);
        state.idx++;
        if(state.idx >= QUIZ_Q.length){
          appendMessage('bot', `Quiz finished. Score ${state.score}/${QUIZ_Q.length}`);
          save(STORAGE.QUIZ, {last: state.score,ts:new Date().toISOString()});
          openPanel(`<h2>Quiz Complete</h2><div class="hint">Score: ${state.score}/${QUIZ_Q.length}</div><div class="panel-row"><button id="closeQ" class="btn">Close</button></div>`);
          document.getElementById('closeQ').addEventListener('click', closePanelFn);
        } else showQuestion();
      });
      document.getElementById('skipQuiz').addEventListener('click', ()=> { state.idx++; if(state.idx >= QUIZ_Q.length) closePanelFn(); else showQuestion(); });
    }
    showQuestion();
  }

  // Mini game (tap reaction)
  function renderGamePanel(){
    openPanel(`<h2>Reaction Tap</h2><p>Tap the circle as soon as it appears. 10 rounds.</p><div class="game-area"><div id="gameCircle" class="game-circle hidden"></div></div><div class="panel-row"><button id="startGame" class="btn">Start</button></div><div id="gameScore" class="hint"></div>`);
    const circle = document.getElementById('gameCircle');
    const scoreEl = document.getElementById('gameScore');
    let rounds = 0, score = 0, timer = null;
    function nextRound(){
      rounds++;
      if(rounds>10){ scoreEl.textContent = `Game over — score ${score}/10`; appendMessage('bot', `Game over — score ${score}/10`); return; }
      const delay = 800 + Math.random()*1800;
      circle.classList.add('hidden');
      setTimeout(()=> {
        circle.classList.remove('hidden');
        const start = Date.now();
        function onTap(){ 
          const rt = Date.now() - start;
          if(rt < 500) score++;
          scoreEl.textContent = `Round ${rounds}/10 — Reaction ${rt}ms — Score ${score}`;
          circle.removeEventListener('click', onTap);
          nextRound();
        }
        circle.addEventListener('click', onTap);
      }, delay);
    }
    document.getElementById('startGame').addEventListener('click', ()=> { rounds=0; score=0; scoreEl.textContent='Starting...'; nextRound(); });
  }

  // AI Mirror (self-care)
  function renderMirrorPanel(){
    const html = `
      <h2>AI Mirror — Self Care</h2>
      <div><input id="mirrorText" placeholder="How are you feeling?" /></div>
      <div class="panel-row"><button id="mirrorGo" class="btn">Reflect</button></div>
      <div id="mirrorResp" class="hint" style="margin-top:10px"></div>
    `;
    openPanel(html);
    document.getElementById('mirrorGo').addEventListener('click', ()=> {
      const t = document.getElementById('mirrorText').value.trim();
      if(!t) return alert('Type how you feel');
      const emo = detectEmotion(t);
      let resp = "You’re seen. Keep breathing — small steps help.";
      if(emo==='sad') resp = "I see you’re sad. It's okay to feel this. Would you like a breathing exercise?";
      if(emo==='tired') resp = "Tiredness shows you’ve been working hard. Try a short rest and hydrate.";
      if(emo==='anxious') resp = "Anxiety is tough — focus on a single breath: in 4, hold 2, out 6. Want to try?";
      appendMessage('bot', resp);
      document.getElementById('mirrorResp').textContent = resp;
    });
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
        m._notifiedToday = new Date().toDateString();
      }
    });
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

  // Hook side buttons
  document.querySelectorAll('.side-btn').forEach(btn=>{
    btn.addEventListener('click', (e)=>{
      const panel = e.currentTarget.dataset.panel;
      switch(panel){
        case 'water': renderWaterPanel(); break;
        case 'bmi': renderBMIPanel(); break;
        case 'reminders': renderRemindersPanel(); break;
        case 'heart': renderHeartPanel(); break;
        case 'sleep': renderSleepPanel(); break;
        case 'tips': renderTipsPanel(); break;
        case 'report': renderReportPanel(); break;
        case 'symptom': renderSymptomPanel(); break;
        case 'relax': renderRelaxPanel(); break;
        case 'quotes': renderQuotesPanel(); break;
        default: break;
      }
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
    chatArea.innerHTML = '';
    appendMessage('bot', 'Local data cleared.');
  });

  // Floating radial menu wiring
  floatingMain && floatingMain.addEventListener('click', (e)=>{
    floatingMenu.classList.toggle('open');
  });

  // Floating child buttons
  document.getElementById('floatChat')?.addEventListener('click', ()=> { userInput.focus(); floatingMenu.classList.remove('open'); });
  document.getElementById('floatTablets')?.addEventListener('click', ()=> { renderTabletsPanel(); floatingMenu.classList.remove('open'); });
  document.getElementById('floatQuiz')?.addEventListener('click', ()=> { renderQuizPanel(); floatingMenu.classList.remove('open'); });
  document.getElementById('floatGame')?.addEventListener('click', ()=> { renderGamePanel(); floatingMenu.classList.remove('open'); });
  document.getElementById('floatMirror')?.addEventListener('click', ()=> { renderMirrorPanel(); floatingMenu.classList.remove('open'); });

  function renderTabletsPanel(){
    let html = `<h2>Tablet Suggestions</h2><div class="chips-panel">`;
    TABLETS.forEach(t => html += `<div class="chip"><div><strong>${escapeHtml(t.name)}</strong><div class="meta">${escapeHtml(t.dose)} • ${escapeHtml(t.note)}</div></div><div><button data-med="${escapeHtml(t.name)}" class="btn ghost small askMed">Ask</button></div></div>`);
    html += `</div><div class="panel-row"><button id="closeTab" class="btn">Close</button></div>`;
    openPanel(html);
    panelInner.querySelectorAll('.askMed').forEach(b => b.addEventListener('click', e => {
      const med = e.currentTarget.dataset.med;
      userInput.value = `Tell me about ${med} — uses, dose, side effects.`;
      sendBtn.click();
      closePanelFn();
    }));
    document.getElementById('closeTab').addEventListener('click', closePanelFn);
  }

  // New chat (reset conversation)
  newChatBtn.addEventListener('click', ()=> {
    if(!confirm('Start a new chat? This will clear the current chat view (history saved).')) return;
    // just add a small system message and create "new session" token (we keep history but show fresh welcome)
    appendMessage('bot', "🟦 New chat started. How can I help?");
    statusEl.textContent = 'New chat';
  });

  /* ---------- Init ---------- */
  function bootstrap(){
    populateTablets();

    // render history or show welcome once
    const history = load(STORAGE.CHAT, []);
    if(history && history.length){
      renderHistory();
      // show small welcome back snippet
      const last = history[history.length-1];
      appendMessage('bot', `Welcome back! Last snippet: "${last.text.slice(0,80)}"`);
    } else {
      appendMessage('bot','👩‍⚕️ Welcome to Arogya AI — your personal health assistant.');
    }

    checkReminders();
    statusEl.textContent = 'Ready (friendly companion)';
  }

  document.addEventListener('DOMContentLoaded', bootstrap);
})();
