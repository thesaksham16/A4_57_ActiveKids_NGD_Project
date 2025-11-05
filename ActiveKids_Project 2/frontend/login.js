// login.js - calls backend /api/ if available, else localStorage fallback
async function apiFetch(path, options){ try{ const res=await fetch(path, options); if(!res.ok) throw new Error('bad'); return await res.json(); }catch(e){return null;} }
(function initLocal(){ if(!localStorage.getItem('users')){ localStorage.setItem('users', JSON.stringify([{username:'admin',password:'admin123',role:'admin',points:0,rewards:[],notifications:[]}])) }
if(!localStorage.getItem('challenges')) localStorage.setItem('challenges', JSON.stringify([]));
if(!localStorage.getItem('videos')) localStorage.setItem('videos', JSON.stringify([]));
if(!localStorage.getItem('rewards')) localStorage.setItem('rewards', JSON.stringify([]));
})();
document.getElementById('signInBtn').addEventListener('click', async ()=>{ const u=document.getElementById('loginUsername').value.trim(); const p=document.getElementById('loginPassword').value; const r=document.getElementById('loginRole').value; if(!u||!p){alert('Enter username & password');return;}
const api=await apiFetch('/api/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({username:u,password:p,role:r})});
if(api && api.success){ localStorage.setItem('currentUser',JSON.stringify(api.user)); window.location.href = api.user.role==='admin'?'admin.html':'user.html'; return;}
const users=JSON.parse(localStorage.getItem('users')||'[]'); const found=users.find(x=>x.username===u&&x.password===p&&x.role===r); if(!found){alert('Invalid');return;} localStorage.setItem('currentUser',JSON.stringify(found)); window.location.href = found.role==='admin'?'admin.html':'user.html'; });
document.getElementById('registerBtn').addEventListener('click', async ()=>{ const u=document.getElementById('regUsername').value.trim(); const p=document.getElementById('regPassword').value; const r=document.getElementById('regRole').value; if(!u||!p){alert('Enter username & password');return;}
const api=await apiFetch('/api/register',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({username:u,password:p,role:r})}); if(api && api.success){ alert('Registered via backend'); return;}
let users=JSON.parse(localStorage.getItem('users')||'[]'); if(users.find(x=>x.username===u)){alert('Exists');return;} users.push({username:u,password:p,role:r,points:0,rewards:[],notifications:[]}); localStorage.setItem('users',JSON.stringify(users)); alert('Registered locally'); });