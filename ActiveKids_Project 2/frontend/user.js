// user.js - see original user.html script (migrated). For brevity, use the full user.js created in the package README or original file.

const DB_NAME = 'ActiveKidsDB', STORE_NAME = 'videos';
let db;

function initDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, 1);
        request.onerror = e => reject("DB Error: " + e.target.errorCode);
        request.onsuccess = e => { db = e.target.result; resolve(db); };
        request.onupgradeneeded = e => {
            if (!e.target.result.objectStoreNames.contains(STORE_NAME)) {
                e.target.result.createObjectStore(STORE_NAME, { keyPath: 'id' });
            }
        };
    });
}
function addVideoToDB(videoFile, id) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const request = transaction.objectStore(STORE_NAME).put({ id, file: videoFile });
        request.onsuccess = () => resolve(request.result);
        request.onerror = e => reject("Add Error: " + e.target.errorCode);
    });
}
function getVideoFromDB(id) {
    return new Promise((resolve, reject) => {
        const request = db.transaction([STORE_NAME]).objectStore(STORE_NAME).get(id);
        request.onsuccess = () => resolve(request.result ? request.result.file : null);
        request.onerror = e => reject("Get Error: " + e.target.errorCode);
    });
}

let currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
if(!currentUser || currentUser.role !== 'user'){ window.location.href = 'login.html'; }

document.getElementById('welcomeText').innerText = `Hello, ${currentUser.username} 👋`;

async function main() {
    await initDB();
    syncAndRender();
}
main();

function syncAndRender() {
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const latestUserData = users.find(u => u.username === currentUser.username);
    if (latestUserData) {
        currentUser = latestUserData; 
        localStorage.setItem('currentUser', JSON.stringify(currentUser)); 
    }
    renderAll();
}

async function renderAll(){
    document.getElementById('pointsBadge').innerText = `${currentUser.points || 0} pts`;
    renderChallenges();
    renderPending();
    renderHistory();
    renderRewards();
    renderMyRewards();
    renderLeaderboard();
    renderNotifications();
    renderProgressChart();
}

function showTab(tab){
  ['challenges','pending','history','notifications','rewards'].forEach(id => {
    document.getElementById(id).style.display = (id === tab) ? 'block' : 'none';
  });
  document.querySelectorAll('nav button').forEach(b => b.classList.remove('active'));
  document.getElementById('tab' + tab.charAt(0).toUpperCase() + tab.slice(1)).classList.add('active');
}

function renderChallenges(){
  const list = document.getElementById('challengeList');
  const allChallenges = JSON.parse(localStorage.getItem('challenges')||'[]');
  const videos = JSON.parse(localStorage.getItem('videos')||'[]');
  const myApprovedVideos = videos.filter(v => v.user === currentUser.username && v.status === 'approved');
  const completedChallengeIds = new Set(myApprovedVideos.map(v => v.challengeId));
  let maxLevelToShow = 1;
  const levels = [...new Set(allChallenges.map(c => c.level))].sort((a, b) => a - b);
  for (const level of levels) {
    const challengesInLevel = allChallenges.filter(c => c.level === level);
    const allInLevelCompleted = challengesInLevel.every(c => completedChallengeIds.has(c.id));
    if (allInLevelCompleted) maxLevelToShow = level + 1;
    else break; 
  }
  list.innerHTML = '';
  allChallenges.forEach(ch => {
    const isLocked = ch.level > maxLevelToShow;
    const existingSubmission = videos.find(v => v.user === currentUser.username && v.challengeId === ch.id && v.status !== 'rejected');
    const div = document.createElement('div');
    div.className = `challenge ${isLocked ? 'locked' : ''}`;
    let actionHtml = isLocked ? `<div class="small" style="font-weight:600">🔒 LOCKED</div>` : 
      existingSubmission ? `<div class="small" style="font-weight:600">STATUS: ${existingSubmission.status.toUpperCase()}</div>` : 
      `<div class="upload-input"><input type="file" id="file-${ch.id}" accept="video/*"><button class="btn" onclick="submitChallenge('${ch.id}')">Upload</button></div>`;
    div.innerHTML = `<div class="meta"><div style="font-weight:700">${ch.name}</div><div class="small">Level ${ch.level} — up to ${ch.maxPoints} pts</div></div><div class="actions">${actionHtml}</div>`;
    list.appendChild(div);
  });
}

function renderRewards(){
  const list = document.getElementById('rewardsList');
  const rewards = JSON.parse(localStorage.getItem('rewards')||'[]');
  list.innerHTML = '';
  rewards.forEach(r=>{
    const disabled = r.stock <= 0 || currentUser.points < r.cost;
    const card = document.createElement('div');
    card.className = 'reward-card';
    card.innerHTML = `<div><img src="${r.image}" alt="${r.name}"><div class="name">${r.name}</div><div class="small">Cost: ${r.cost} pts • Stock: ${r.stock}</div></div><button class="btn" style="margin-top: 12px;" ${disabled ? 'disabled' : ''} onclick="redeem('${r.id}')">Redeem</button>`;
    list.appendChild(card);
  });
}

function renderMyRewards() {
    const list = document.getElementById('myRewardsList');
    const myRewards = currentUser.rewards || [];
    if (myRewards.length === 0) {
        list.innerHTML = '<div class="small">You have not redeemed any rewards yet.</div>';
        return;
    }
    list.innerHTML = myRewards.map(reward => `<div class="history-item"><img src="${reward.image}" alt="${reward.name}"><div>${reward.name}</div></div>`).join('');
}

function redeem(rewardId){
  if (!confirm('Are you sure you want to redeem this reward?')) return;
  const rewards = JSON.parse(localStorage.getItem('rewards')||'[]');
  let users = JSON.parse(localStorage.getItem('users')||'[]');
  const r_idx = rewards.findIndex(r=>r.id===rewardId);
  const me_idx = users.findIndex(u=>u.username===currentUser.username);
  if (r_idx === -1 || me_idx === -1) { return; }

  const r = rewards[r_idx];
  const me = users[me_idx];

  if (r.stock <= 0 || me.points < r.cost) { alert('Cannot redeem. Check points or stock.'); return; }

  me.points -= r.cost;
  me.rewards.push({ name: r.name, image: r.image }); 
  r.stock -= 1;

  users[me_idx] = me;
  rewards[r_idx] = r;

  localStorage.setItem('users', JSON.stringify(users));
  localStorage.setItem('rewards', JSON.stringify(rewards));
  alert(`Redeemed ${r.name}!`);
  syncAndRender();
}

async function renderPending(){
  const list = document.getElementById('pendingList');
  const videos = JSON.parse(localStorage.getItem('videos')||'[]');
  const mine = videos.filter(v => v.user === currentUser.username && v.status === 'pending');
  list.innerHTML = mine.length===0 ? '<div class="small">No pending submissions.</div>' : '';
  for(const v of mine) {
    const videoFile = await getVideoFromDB(v.id);
    const videoURL = videoFile ? URL.createObjectURL(videoFile) : '';
    const box = document.createElement('div');
    box.className = 'history-item';
    box.style.cssText = 'padding:12px; justify-content:space-between;';
    box.innerHTML = `<div><div style="font-weight:700">${v.challengeName}</div><div class="small">Uploaded: ${v.date}</div></div><div><video controls src="${videoURL}" style="max-width:250px;border-radius:8px"></video></div>`;
    list.appendChild(box);
  }
}

function renderHistory(){
  const completedList = document.getElementById('completedList');
  const failedList = document.getElementById('failedList');
  const videos = JSON.parse(localStorage.getItem('videos')||'[]');
  const myHistory = videos.filter(v=>v.user===currentUser.username && v.status!=='pending');
  const approved = myHistory.filter(v => v.status === 'approved');
  const rejected = myHistory.filter(v => v.status === 'rejected');
  completedList.innerHTML = approved.length === 0 ? '<div class="small">No completed challenges yet.</div>' : 
    approved.map(v => `<div class="history-item" style="justify-content: space-between;"><div><div style="font-weight:700">${v.challengeName}</div><div class="small">Comment: ${v.adminComment || '—'}</div></div><div style="font-weight:700; color:var(--good)">+${v.points} pts</div></div>`).join('');
  failedList.innerHTML = rejected.length === 0 ? '<div class="small">No rejected challenges.</div>' : 
    rejected.map(v => `<div class="history-item"><div><div style="font-weight:700">${v.challengeName}</div><div class="small">Comment: ${v.adminComment || '—'}</div></div></div>`).join('');
}

function renderNotifications(){
  const list = document.getElementById('notificationsList');
  const users = JSON.parse(localStorage.getItem('users')||'[]');
  const me = users.find(u=>u.username===currentUser.username);
  if(!me || !me.notifications || me.notifications.length===0){
    list.innerHTML = '<div class="small">No new notifications</div>'; return;
  }
  list.innerHTML = me.notifications.slice().reverse().map(n => `<div class="notif" style="margin-bottom:8px"><div style="font-weight:700">${n.title||'Notification'}</div><div class="small">${n.message}</div></div>`).join('');
  me.notifications = [];
  localStorage.setItem('users', JSON.stringify(users));
}

function renderLeaderboard(){
  const users = JSON.parse(localStorage.getItem('users')||'[]');
  const sorted = users.filter(u => u.role === 'user').sort((a,b)=> (b.points||0) - (a.points||0)).slice(0,6);
  document.getElementById('leaderboardList').innerHTML = sorted.map(u => `<div style="padding:6px;border-bottom:1px dashed #eef4ff"><strong>${u.username}</strong> — ${u.points||0} pts</div>`).join('');
}

let progressChart = null;
function renderProgressChart(){
  const ctx = document.getElementById('progressChart').getContext('2d');
  const videos = JSON.parse(localStorage.getItem('videos')||'[]');
  const done = videos.filter(v=>v.user === currentUser.username && v.status === 'approved');
  if(progressChart) progressChart.destroy();
  progressChart = new Chart(ctx, {
    type:'bar', data:{ labels: done.map(d=> d.challengeName.substring(0,15)), datasets:[{ label:'Points', data: done.map(d=> d.points || 0), backgroundColor:'#ff6f61'}]},
    options:{plugins:{legend:{display:false}}, scales:{y:{beginAtZero:true}}}
  });
}

async function submitChallenge(challengeId){
  const fileInput = document.querySelector(`#file-${challengeId}`);
  if(!fileInput || fileInput.files.length===0){ alert('Please choose a video file.'); return; }
  const file = fileInput.files[0];
  const videoId = 'v' + Date.now();
  try {
    await addVideoToDB(file, videoId);
    const videos = JSON.parse(localStorage.getItem('videos')||'[]');
    const ch = JSON.parse(localStorage.getItem('challenges')||'[]').find(c=>c.id===challengeId);
    videos.push({ id: videoId, user: currentUser.username, challengeId, challengeName: ch?ch.name:'', maxPoints: ch?ch.maxPoints:0, status: 'pending', points: 0, adminComment: '', date: new Date().toLocaleString() });
    localStorage.setItem('videos', JSON.stringify(videos));
    alert('Uploaded! Pending admin verification.');
    syncAndRender(); 
  } catch(err){ alert('Upload failed: ' + err); }
}

function logout(){
  localStorage.setItem('currentUser', JSON.stringify(null));
  window.location.href = 'login.html';
}

window.addEventListener('storage', (event) => {
  if (['users', 'videos', 'rewards'].includes(event.key)) {
    syncAndRender();
  }
});
