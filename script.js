/* =========================================
   GUESS THE FLAG — script.js
   ========================================= */

'use strict';

// ─── FLAG DATA ───────────────────────────────────────────────────────────────
const FLAGS = [
  { name: "France",         flag: "https://flagcdn.com/w320/fr.png" },
  { name: "Germany",        flag: "https://flagcdn.com/w320/de.png" },
  { name: "Morocco",        flag: "https://flagcdn.com/w320/ma.png" },
  { name: "Spain",          flag: "https://flagcdn.com/w320/es.png" },
  { name: "Italy",          flag: "https://flagcdn.com/w320/it.png" },
  { name: "Brazil",         flag: "https://flagcdn.com/w320/br.png" },
  { name: "Canada",         flag: "https://flagcdn.com/w320/ca.png" },
  { name: "Japan",          flag: "https://flagcdn.com/w320/jp.png" },
  { name: "China",          flag: "https://flagcdn.com/w320/cn.png" },
  { name: "India",          flag: "https://flagcdn.com/w320/in.png" },
  { name: "United States",  flag: "https://flagcdn.com/w320/us.png" },
  { name: "United Kingdom", flag: "https://flagcdn.com/w320/gb.png" },
  { name: "Mexico",         flag: "https://flagcdn.com/w320/mx.png" },
  { name: "Argentina",      flag: "https://flagcdn.com/w320/ar.png" },
  { name: "Portugal",       flag: "https://flagcdn.com/w320/pt.png" },
  { name: "Netherlands",    flag: "https://flagcdn.com/w320/nl.png" },
  { name: "Belgium",        flag: "https://flagcdn.com/w320/be.png" },
  { name: "Turkey",         flag: "https://flagcdn.com/w320/tr.png" },
  { name: "Egypt",          flag: "https://flagcdn.com/w320/eg.png" },
  { name: "Saudi Arabia",   flag: "https://flagcdn.com/w320/sa.png" },
  { name: "South Korea",    flag: "https://flagcdn.com/w320/kr.png" },
  { name: "Australia",      flag: "https://flagcdn.com/w320/au.png" },
  { name: "Switzerland",    flag: "https://flagcdn.com/w320/ch.png" },
  { name: "Sweden",         flag: "https://flagcdn.com/w320/se.png" },
  { name: "Norway",         flag: "https://flagcdn.com/w320/no.png" },
  { name: "Denmark",        flag: "https://flagcdn.com/w320/dk.png" },
  { name: "Greece",         flag: "https://flagcdn.com/w320/gr.png" },
  { name: "Poland",         flag: "https://flagcdn.com/w320/pl.png" },
  { name: "Ukraine",        flag: "https://flagcdn.com/w320/ua.png" },
  { name: "Indonesia",      flag: "https://flagcdn.com/w320/id.png" },
  { name: "South Africa",   flag: "https://flagcdn.com/w320/za.png" },
  { name: "Nigeria",        flag: "https://flagcdn.com/w320/ng.png" },
  { name: "Thailand",       flag: "https://flagcdn.com/w320/th.png" },
  { name: "Vietnam",        flag: "https://flagcdn.com/w320/vn.png" },
  { name: "Colombia",       flag: "https://flagcdn.com/w320/co.png" },
];

const TOTAL_FLAGS   = 10;
const LS_KEY        = 'gtf_leaderboard_v2';

// ─── STATE ───────────────────────────────────────────────────────────────────
let state = {
  username:    '',
  queue:       [],
  current:     0,
  score:       0,
  startTime:   0,
  timerRef:    null,
  locked:      false,
};

// ─── SOUND ───────────────────────────────────────────────────────────────────
function playCorrectSound() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const t   = ctx.currentTime;
    [523, 659, 784].forEach((freq, i) => {
      const osc  = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.type      = 'sine';
      osc.frequency.setValueAtTime(freq, t + i * 0.1);
      gain.gain.setValueAtTime(0.18, t + i * 0.1);
      gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.1 + 0.25);
      osc.start(t + i * 0.1);
      osc.stop(t + i * 0.1 + 0.3);
    });
  } catch (_) {}
}

function playWrongSound() {
  try {
    const ctx  = new (window.AudioContext || window.webkitAudioContext)();
    const osc  = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(200, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.3);
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.35);
  } catch (_) {}
}

// ─── LEADERBOARD ─────────────────────────────────────────────────────────────
function loadLeaderboard() {
  try { return JSON.parse(localStorage.getItem(LS_KEY)) || []; }
  catch { return []; }
}

function saveScore(username, score, timeMs) {
  const lb = loadLeaderboard();
  lb.push({ username, score, timeMs, date: Date.now() });
  lb.sort((a, b) => b.score - a.score || a.timeMs - b.timeMs);
  const top = lb.slice(0, 10);
  localStorage.setItem(LS_KEY, JSON.stringify(top));
  return top;
}

function formatTime(ms) {
  const s   = Math.floor(ms / 1000);
  const min = Math.floor(s / 60);
  const sec = s % 60;
  return `${min}:${sec.toString().padStart(2, '0')}`;
}

function renderLeaderboard(listEl, data) {
  listEl.innerHTML = '';
  if (!data.length) {
    listEl.innerHTML = '<li class="lb-empty">No scores yet. Be the first!</li>';
    return;
  }
  const medals = ['🥇','🥈','🥉'];
  data.forEach((entry, i) => {
    const li = document.createElement('li');
    li.innerHTML = `
      <span class="lb-rank">${medals[i] || (i+1)}</span>
      <span class="lb-name">${escHtml(entry.username)}</span>
      <span class="lb-score">${entry.score}/10</span>
      <span class="lb-time">${formatTime(entry.timeMs)}</span>
    `;
    listEl.appendChild(li);
  });
}

function escHtml(s) {
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

// ─── SCREEN TRANSITIONS ───────────────────────────────────────────────────────
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}

// ─── TIMER ───────────────────────────────────────────────────────────────────
function startTimer() {
  state.startTime = Date.now();
  clearInterval(state.timerRef);
  state.timerRef = setInterval(() => {
    const el = document.getElementById('timer-display');
    if (el) el.textContent = formatTime(Date.now() - state.startTime);
  }, 500);
}

function stopTimer() {
  clearInterval(state.timerRef);
  state.timerRef = null;
}

function elapsed() { return Date.now() - state.startTime; }

// ─── GAME LOGIC ──────────────────────────────────────────────────────────────
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function startGame() {
  const usernameInput = document.getElementById('username-input');
  const name = usernameInput.value.trim();
  if (!name) {
    usernameInput.focus();
    usernameInput.style.borderColor = 'var(--accent2)';
    usernameInput.style.boxShadow   = '0 0 16px rgba(232,67,106,0.3)';
    usernameInput.placeholder = 'Please enter your name first!';
    setTimeout(() => {
      usernameInput.style.borderColor = '';
      usernameInput.style.boxShadow   = '';
      usernameInput.placeholder = 'Enter username…';
    }, 2000);
    return;
  }

  state.username = name;
  state.queue    = shuffle(FLAGS).slice(0, TOTAL_FLAGS);
  state.current  = 0;
  state.score    = 0;
  state.locked   = false;

  showScreen('screen-game');
  updateHUD();
  loadFlag();
  startTimer();
}

function loadFlag() {
  const img   = document.getElementById('flag-img');
  const frame = document.getElementById('flag-frame');
  const entry = state.queue[state.current];

  // reset UI
  clearFeedback();
  document.getElementById('answer-input').value       = '';
  document.getElementById('answer-input').className   = '';
  document.getElementById('hint-text').textContent    = '';
  document.getElementById('hint-text').className      = 'hint-text';
  document.getElementById('answer-input').disabled    = false;
  document.getElementById('btn-submit').disabled      = false;
  state.locked = false;

  // animate flag in
  img.style.opacity = '0';
  frame.classList.remove('flag-enter');

  img.onload = () => {
    img.style.opacity = '1';
    frame.classList.add('flag-enter');
    setTimeout(() => frame.classList.remove('flag-enter'), 400);
  };
  img.src = entry.flag;

  // update progress
  updateHUD();
  document.getElementById('answer-input').focus();
}

function updateHUD() {
  document.getElementById('score-display').textContent = state.score;
  document.getElementById('flag-counter').textContent  = `${state.current + 1} / ${TOTAL_FLAGS}`;
  const pct = (state.current / TOTAL_FLAGS) * 100;
  document.getElementById('progress-bar').style.width = pct + '%';
}

function normalise(s) {
  return s.trim().toLowerCase()
    .replace(/[àáâãäå]/g,'a').replace(/[èéêë]/g,'e')
    .replace(/[ìíîï]/g,'i').replace(/[òóôõö]/g,'o')
    .replace(/[ùúûü]/g,'u').replace(/[ý]/g,'y')
    .replace(/[ñ]/g,'n').replace(/[ç]/g,'c');
}

function submitAnswer() {
  if (state.locked) return;

  const input   = document.getElementById('answer-input');
  const val     = input.value;
  const correct = state.queue[state.current].name;
  const isRight = normalise(val) === normalise(correct);

  state.locked = true;
  input.disabled  = true;
  document.getElementById('btn-submit').disabled = true;

  if (isRight) {
    state.score++;
    playCorrectSound();
    showFeedback(true, '✓');
    input.classList.add('correct');
    setHint(`✓ Correct! It's ${correct}`, 'correct-msg');
    setTimeout(nextFlag, 1200);
  } else {
    playWrongSound();
    showFeedback(false, '✗');
    input.classList.add('wrong');
    setHint(`✗ It was: ${correct}`, 'wrong-msg');
    setTimeout(nextFlag, 2000);
  }
}

function showFeedback(isCorrect, symbol) {
  const el = document.getElementById('feedback-overlay');
  el.textContent = symbol;
  el.className   = 'feedback-overlay ' + (isCorrect ? 'show-correct' : 'show-wrong');
}

function clearFeedback() {
  const el = document.getElementById('feedback-overlay');
  el.className   = 'feedback-overlay';
  el.textContent = '';
}

function setHint(msg, cls) {
  const el = document.getElementById('hint-text');
  el.textContent = msg;
  el.className   = 'hint-text ' + cls;
}

function nextFlag() {
  state.current++;
  if (state.current >= TOTAL_FLAGS) {
    endGame();
  } else {
    loadFlag();
  }
}

function endGame() {
  stopTimer();
  const totalMs = elapsed();

  // update progress to 100%
  document.getElementById('progress-bar').style.width = '100%';

  // save & build leaderboard
  const lb = saveScore(state.username, state.score, totalMs);

  // populate result screen
  document.getElementById('final-score').textContent    = `${state.score} / ${TOTAL_FLAGS}`;
  document.getElementById('final-time').textContent     = formatTime(totalMs);
  document.getElementById('final-accuracy').textContent = `${Math.round((state.score/TOTAL_FLAGS)*100)}%`;

  const trophy = state.score === 10 ? '🏆' : state.score >= 7 ? '🥈' : state.score >= 4 ? '🥉' : '😅';
  document.getElementById('result-trophy').textContent  = trophy;
  const titles = { 10:'Perfect Score!', 9:'Outstanding!', 8:'Great Job!', 7:'Well Done!', 6:'Not Bad!', 5:'Halfway There!' };
  document.getElementById('result-title').textContent   = titles[state.score] || 'Keep Practicing!';

  renderLeaderboard(document.getElementById('lb-list-result'), lb);

  setTimeout(() => showScreen('screen-result'), 300);
}

function playAgain() {
  showScreen('screen-start');
  renderLeaderboard(document.getElementById('lb-list-start'), loadLeaderboard());
}

// ─── EVENT LISTENERS ──────────────────────────────────────────────────────────
document.getElementById('btn-start').addEventListener('click', startGame);
document.getElementById('btn-submit').addEventListener('click', submitAnswer);
document.getElementById('btn-again').addEventListener('click', playAgain);

document.getElementById('answer-input').addEventListener('keydown', e => {
  if (e.key === 'Enter') submitAnswer();
});

document.getElementById('username-input').addEventListener('keydown', e => {
  if (e.key === 'Enter') startGame();
});

// ─── INIT ────────────────────────────────────────────────────────────────────
renderLeaderboard(document.getElementById('lb-list-start'), loadLeaderboard());
