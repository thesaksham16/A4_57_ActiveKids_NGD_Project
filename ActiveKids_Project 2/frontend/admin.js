// admin.js - see original admin.html script migrated to admin.js

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
function getVideoFromDB(id) {
    return new Promise((resolve, reject) => {
        const request = db.transaction([STORE_NAME]).objectStore(STORE_NAME).get(id);
        request.onsuccess = () => resolve(request.result ? request.result.file : null);
        request.onerror = e => reject("Get Error: " + e.target.errorCode);
    });
}

let currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
if(!currentUser || currentUser.role !== 'admin'){ window.location.href = 'login.html'; }
document.getElementById('adminWelcome').innerText = `Hello, ${currentUser.username}`;

async function main() {
    await initDB();
    renderAll();
}
main();

function renderAll() {
    renderPending();
    renderAllSubmissions();
    renderStats();
}

async function renderPending(){
  const container = document.getElementById('pendingContainer');
  const videos = JSON.parse(localStorage.getItem('videos') || '[]');
  const pending = videos.filter(v => v.status === 'pending');
  container.innerHTML = pending.length === 0 ? '<div class="small">No pending submissions.</div>' : '';
  
  for(const [idx, v] of pending.entries()) {
    const videoFile = await getVideoFromDB(v.id);
    const videoURL = videoFile ? URL.createObjectURL(videoFile) : '';
    const box = document.createElement('div'); 
    box.className='video-row';
    box.innerHTML = `<div style="flex:1"><div style="font-weight:700">${v.challengeName}</div><div class="small">User: ${v.user} • Uploaded: ${v.date}</div><div style="margin-top:8px"><textarea id="comment-${v.id}" placeholder="Admin comment (optional)"></textarea></div><div style="margin-top:8px"><label>Points (max ${v.maxPoints || ''}): </label><input id="points-${v.id}" type="number" min="0" max="${v.maxPoints || ''}" value="${v.maxPoints || ''}"></div><div style="margin-top:10px"><button onclick="approve('${v.id}')">Approve</button><button class="warn" onclick="reject('${v.id}')" style="margin-left:8px;">Reject</button></div></div><div style="width:340px"><video controls src="${videoURL}" style="max-width:100%;border-radius:8px"></video></div>`;
    container.appendChild(box);
  }
}

async function renderAllSubmissions(){
  const container = document.getElementById('allSubmissions');
  const videos = JSON.parse(localStorage.getItem('videos')||'[]');
  container.innerHTML = videos.length === 0 ? '<div class="small">No submissions yet.</div>' : '';

  for(const v of videos.slice().reverse()) {
    const videoFile = await getVideoFromDB(v.id);
    const videoURL = videoFile ? URL.createObjectURL(videoFile) : '';
    const el = document.createElement('div'); el.className='video-row';
    el.innerHTML = `<div style="flex:1"><div style="font-weight:700">${v.challengeName} — ${v.user}</div><div class="small">Status: ${v.status.toUpperCase()} • Points: ${v.points || 0} • On ${v.date}</div><div class="small">Admin comment: ${v.adminComment || '-'}</div></div><div style="width:300px"><video controls src="${videoURL}" style="max-width:100%;border-radius:8px"></video></div>`;
    container.appendChild(el);
  }
}

function updateVideoStatus(videoId, status, getPoints, getComment) {
    let videos = JSON.parse(localStorage.getItem('videos') || '[]');
    let users = JSON.parse(localStorage.getItem('users') || '[]');
    const videoIndex = videos.findIndex(v => v.id === videoId);
    if (videoIndex === -1) return;

    const v = videos[videoIndex];
    const userIndex = users.findIndex(u => u.username === v.user);
    if (userIndex === -1) return;

    v.status = status;
    v.points = getPoints(v);
    v.adminComment = getComment(v);
    
    if (status === 'approved') {
        users[userIndex].points = (users[userIndex].points || 0) + v.points;
    }

    users[userIndex].notifications = users[userIndex].notifications || [];
    const notificationTitle = status === 'approved' ? 'Video Approved' : 'Video Rejected';
    const notificationMessage = `Your "${v.challengeName}" submission was ${status}. Comment: ${v.adminComment || (status === 'approved' ? 'Great job!' : 'Please try again.')}`;
    users[userIndex].notifications.push({ title: notificationTitle, message: notificationMessage });

    localStorage.setItem('videos', JSON.stringify(videos));
    localStorage.setItem('users', JSON.stringify(users));
    alert(`Submission ${status}.`);
    renderAll();
}

function approve(videoId) {
    const pointsInput = document.getElementById(`points-${videoId}`);
    const commentInput = document.getElementById(`comment-${videoId}`);
    updateVideoStatus(videoId, 'approved', 
        (v) => Math.max(0, Math.min(parseInt(pointsInput.value) || 0, v.maxPoints || 0)),
        () => commentInput.value.trim()
    );
}

function reject(videoId) {
    const comment = prompt('Optional rejection comment for the user:', '');
    updateVideoStatus(videoId, 'rejected', () => 0, () => comment || '');
}

function renderStats(){
  const statsList = document.getElementById('statsList');
  const videos = JSON.parse(localStorage.getItem('videos')||'[]');
  const users = JSON.parse(localStorage.getItem('users')||'[]');
  const topUsers = users.filter(u => u.role === 'user').sort((a,b)=> (b.points||0)-(a.points||0)).slice(0,5);
  statsList.innerHTML = `
    <div class="small">Pending: ${videos.filter(v=>v.status==='pending').length}</div>
    <div class="small">Approved: ${videos.filter(v=>v.status==='approved').length}</div>
    <div class="small">Rejected: ${videos.filter(v=>v.status==='rejected').length}</div>
    <div style="margin-top:8px"><strong>Top users</strong></div>
    ${topUsers.map(u=>`<div class="small">${u.username} — ${u.points || 0} pts</div>`).join('')}`;
  
  const rewards = JSON.parse(localStorage.getItem('rewards')||'[]');
  document.getElementById('rewardStock').innerHTML = rewards.map(r=>`<div class="small">${r.name}: ${r.stock} in stock</div>`).join('');
}

function logout(){
  localStorage.setItem('currentUser', JSON.stringify(null));
  window.location.href = 'login.html';
}
