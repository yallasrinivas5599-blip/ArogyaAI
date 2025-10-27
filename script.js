// Frontend logic for Arogya AI
const chatArea = document.getElementById('chatArea');
const sendBtn = document.getElementById('sendBtn');
const userInput = document.getElementById('userInput');
const toggleSidebar = document.getElementById('toggleSidebar');
const sidebar = document.getElementById('sidebar');
const clearChatBtn = document.getElementById('clearChatBtn');
const exportBtn = document.getElementById('exportBtn');
const statusEl = document.getElementById('status');

let isRequesting = false;
const TABLETS = [
  { name: 'Paracetamol', dose: '500mg', note: 'Fever/pain. Take with water.' },
  { name: 'Ibuprofen', dose: '200mg', note: 'Pain/inflammation. Avoid on empty stomach.' },
  { name: 'Cetirizine', dose: '10mg', note: 'Antihistamine for allergies.' },
  { name: 'Aspirin', dose: '75-325mg', note: 'Blood thinner — consult before use.' },
  { name: 'Amoxicillin', dose: '500mg', note: 'Antibiotic — only use if prescribed.' }
];

// Populate tablet suggestions
const tabletList = document.getElementById('tabletList');
TABLETS.forEach(t => {
  const el = document.createElement('div');
  el.className = 'chip';
  el.innerHTML = `<div>
      <div class="name">${t.name}</div>
      <div class="meta">${t.dose} • ${t.note}</div>
    </div>
    <div>
      <button class="btn ghost quickAsk">Ask</button>
    </div>`;
  el.querySelector('.quickAsk').addEventListener('click', () => {
    userInput.value = `Tell me about ${t.name} ${t.dose} — uses, side effects, and how to take it.`;
    userInput.focus();
    // simulate send
    sendBtn.click();
  });
  tabletList.appendChild(el);
});

// Toggle sidebar on small screens
toggleSidebar.addEventListener('click', () => {
  sidebar.classList.toggle('open');
});

// Helper to create message nodes
function createMsg(text, who='bot'){
  const d = document.createElement('div');
  d.className = 'msg ' + (who==='user' ? 'user' : 'bot');
  d.innerHTML = `<div class="content">${escapeHtml(text)}</div>`;
  return d;
}

function escapeHtml(s){ return String(s || '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }

// Append a message and scroll
function appendMessage(who, text){
  // remove typing if present when adding final bot
  if(who==='bot' && chatArea.lastElementChild && chatArea.lastElementChild.dataset.typing === '1'){
    chatArea.removeChild(chatArea.lastElementChild);
  }
  const msg = createMsg(text, who);
  chatArea.appendChild(msg);
  chatArea.scrollTop = chatArea.scrollHeight;
}

// Add typing indicator (bot)
function showTyping(){
  const t = document.createElement('div');
  t.className = 'msg bot';
  t.dataset.typing = '1';
  t.innerHTML = `<div class="typing"><span></span><span></span><span></span></div>`;
  chatArea.appendChild(t);
  chatArea.scrollTop = chatArea.scrollHeight;
}

// Send message
async function sendMessage(){
  if(isRequesting) return;
  const message = userInput.value.trim();
  if(!message) return;
  appendMessage('user', message);
  userInput.value = '';
  isRequesting = true;
  sendBtn.disabled = true;
  showTyping();
  statusEl.textContent = 'Contacting AI...';

  try {
    const res = await fetch('/chat', {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ message })
    });
    if(!res.ok) throw new Error('Server error');

    const data = await res.json();
    const reply = data.reply || "Sorry, I couldn't generate a helpful reply.";

    appendMessage('bot', reply);
    statusEl.textContent = 'Online';
  } catch (err) {
    console.error(err);
    appendMessage('bot', "Sorry — I couldn't reach the server. Try again later.");
    statusEl.textContent = 'Offline';
  } finally {
    isRequesting = false;
    sendBtn.disabled = false;
  }
}

// wire send button and Enter key
sendBtn.addEventListener('click', sendMessage);
userInput.addEventListener('keydown', (e) => {
  if(e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
});

// clear chat
clearChatBtn.addEventListener('click', () => {
  if(!confirm('Clear chat history?')) return;
  chatArea.innerHTML = '';
  appendMessage('bot', "Hi there — I'm Arogya AI. Ask me anything about your health.");
});

// export chat (download)
exportBtn.addEventListener('click', () => {
  const messages = Array.from(chatArea.children).map(node => node.textContent);
  const blob = new Blob([messages.join('\n\n')], {type:'text/plain'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'arogya_chat.txt'; a.click();
  URL.revokeObjectURL(url);
});

// initial starter message
appendMessage('bot', "Hello Arjun 👋 I'm Arogya AI — your smart health assistant.");

// small accessibility: focus input
userInput.focus();
