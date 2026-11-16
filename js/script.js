const STORAGE_KEY = 'kinvest_mvp_db_v1';

// Dados Iniciais 
const DEFAULT_DB = {
  activeView: 'landing',
  selectedKidId: 'lucas',
  kids: [
    {
      id: 'lucas',
      name: 'Lucas Silva',
      age: 9,
      rank: 'Cadete Poupança Nv. 3',
      xp: 320,
      balance: 215.00,
      goalTitle: 'Bicicleta Espacial',
      goalTarget: 300.00,
      avatar: './src/assets/images/avatar_lucas_kid_1794688032193.jpg',
      fallbackAvatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Lucas'
    },
    {
      id: 'sofia',
      name: 'Sofia Silva',
      age: 11,
      rank: 'Comandante Estelar Nv. 5',
      xp: 540,
      balance: 180.00,
      goalTitle: 'Console Portátil',
      goalTarget: 250.00,
      avatar: './src/assets/images/avatar_sofia_kid_1794688032299.jpg',
      fallbackAvatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Sofia'
    }
  ],
  missions: [
    { id: 'm1', kidId: 'lucas', title: 'Arrumar a cama e organizar os brinquedos', category: 'Casa & Organização', reward: 15.00, xp: 50, status: 'pending' },
    { id: 'm2', kidId: 'lucas', title: 'Ler 1 capítulo do livro da escola', category: 'Estudos & Leitura', reward: 20.00, xp: 80, status: 'waiting_approval' }
  ]
};

let state = loadState();

function loadState() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch (e) {}
  return JSON.parse(JSON.stringify(DEFAULT_DB));
}

function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {}
}

function formatBRL(val) {
  return Number(val || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function showToast(msg, icon = '✅') {
  const container = document.getElementById('toast-container');
  document.getElementById('toast-message').textContent = msg;
  document.getElementById('toast-icon').textContent = icon;
  container.classList.remove('hidden');
  clearTimeout(window._toastTimer);
  window._toastTimer = setTimeout(() => container.classList.add('hidden'), 3200);
}

function setView(viewName) {
  state.activeView = viewName;
  saveState();
  renderAll();
}

function switchKidAndOpen(kidId) {
  state.selectedKidId = kidId;
  state.activeView = 'kids';
  saveState();
  renderAll();
}

function resetDatabase() {
  state = JSON.parse(JSON.stringify(DEFAULT_DB));
  saveState();
  renderAll();
  showToast('Banco de dados restaurado!', '🔄');
}

// RF02: Lançar Nova Missão
document.getElementById('form-create-mission').addEventListener('submit', function(e) {
  e.preventDefault();
  const title = document.getElementById('mission-title').value.trim();
  const kidId = document.getElementById('mission-kid').value;
  const reward = parseFloat(document.getElementById('mission-reward').value) || 10;
  if (!title) return;

  state.missions.unshift({
    id: 'm_' + Date.now(),
    kidId,
    title,
    category: 'Casa',
    reward,
    xp: 50,
    status: 'pending'
  });
  document.getElementById('mission-title').value = '';
  saveState();
  renderAll();
  showToast(`Missão enviada!`, '🚀');
});

// Ações Pais e Filhos
function completeMissionByKid(id) {
  const m = state.missions.find(x => x.id === id);
  if (m) { m.status = 'waiting_approval'; saveState(); renderAll(); showToast('Enviado para os pais!', '🎉'); }
}

function approveMissionByParent(id) {
  const m = state.missions.find(x => x.id === id);
  if (m) { 
    m.status = 'approved'; 
    const kid = state.kids.find(k => k.id === m.kidId);
    if (kid) { kid.balance += m.reward; kid.xp += m.xp; }
    saveState(); renderAll(); showToast('Missão aprovada!', '💰'); 
  }
}

// Renderização Dinâmica
function renderAll() {
  ['landing', 'parent', 'kids'].forEach(v => {
    const el = document.getElementById('view-' + v);
    if (el) el.style.display = (state.activeView === v) ? 'block' : 'none';
  });

  renderParentDashboard();
  renderKidsSpace();
}

function renderParentDashboard() {
  const totalSaved = state.kids.reduce((acc, k) => acc + k.balance, 0);
  document.getElementById('stat-total-saved').textContent = formatBRL(totalSaved);
  
  const waitingList = state.missions.filter(m => m.status === 'waiting_approval');
  document.getElementById('stat-pending-approvals').textContent = waitingList.length;

  const queueEl = document.getElementById('approval-queue-list');
  queueEl.innerHTML = waitingList.map(m => `
    <div class="bg-white p-4 rounded-xl border border-amber-300 flex justify-between">
      <div><b>${m.title}</b><p class="text-xs">Recompensa: ${formatBRL(m.reward)}</p></div>
      <button onclick="approveMissionByParent('${m.id}')" class="px-4 py-2 bg-brand-green text-white rounded-xl font-bold">Aprovar</button>
    </div>
  `).join('');

  document.getElementById('parent-missions-list').innerHTML = state.missions.map(m => `
    <div class="p-3 border-b border-slate-200"><b>${m.title}</b> - ${formatBRL(m.reward)} (${m.status})</div>
  `).join('');
}

function renderKidsSpace() {
  const kid = state.kids.find(k => k.id === state.selectedKidId) || state.kids[0];
  document.getElementById('kid-avatar').src = kid.avatar;
  document.getElementById('kid-name-header').textContent = `Comandante ${kid.name}`;
  document.getElementById('kid-balance-display').textContent = formatBRL(kid.balance);
  document.getElementById('kid-goal-title').textContent = `Sonho: ${kid.goalTitle}`;

  const pct = Math.min(100, Math.round((kid.balance / kid.goalTarget) * 100));
  document.getElementById('rocket-fuel-bar').style.height = `${pct}%`;
  document.getElementById('rocket-percent-text').textContent = `${pct}%`;

  const kidMissions = state.missions.filter(m => m.kidId === kid.id);
  document.getElementById('kid-missions-list').innerHTML = kidMissions.map(m => {
    const btn = m.status === 'pending' 
      ? `<button onclick="completeMissionByKid('${m.id}')" class="px-4 py-2 bg-brand-green rounded-xl font-bold">Completei!</button>`
      : `<span class="px-4 py-2 bg-white/20 rounded-xl">${m.status}</span>`;
    return `<div class="bg-white/10 p-4 rounded-xl border border-white/20 flex justify-between">
      <div><b>${m.title}</b><p class="text-brand-green">${formatBRL(m.reward)}</p></div>
      ${btn}
    </div>`;
  }).join('');
}

window.onload = renderAll;