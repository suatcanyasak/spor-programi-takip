/* WeeklyGym Security Engine - v2.1 - 2026 */
const _0x12a9=['DOMContentLoaded','getItem','myWorkouts','parse','initializeApp','auth','firestore','login-btn','logout-btn','user-display','user-name','theme-toggle','click','GoogleAuthProvider','signInWithPopup','signOut','reload','onAuthStateChanged','displayName','split','loadFromCloud','syncData','setItem','currentUser','uid','collection','users','doc','set','serverTimestamp','error','theme','light','add','body','classList','toggle','contains','dark','querySelectorAll','li:not(.category-title)','forEach','exercise-name','value','focus','reset-all','confirm','download-pdf','total-progress-bar','width','toLocaleDateString','tr-TR','add-btn','day-select','exercise-weight','sets','type-select','value-per-set','push','now','daily-planner','innerHTML','day-card','completed','btn-delete'];const _0x3b1c=function(_0x32e1a3,_0x12a9e1){_0x32e1a3=_0x32e1a3-0x0;let _0x3b1ccb=_0x12a9[_0x32e1a3];return _0x3b1ccb;};

const firebaseConfig = {
    apiKey: "AIzaSyBg-_Go01JU8roA7qRe7pR55dvEAfKz4Sg",
    authDomain: "weeklygym-4abc2.firebaseapp.com",
    projectId: "weeklygym-4abc2",
    storageBucket: "weeklygym-4abc2.firebasestorage.app",
    messagingSenderId: "986809474109",
    appId: "1:986809474109:web:a6323b839235df220a9e54",
    measurementId: "G-7N6ZQPQHTD"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

document.addEventListener('DOMContentLoaded', () => {
    let workouts = JSON.parse(localStorage.getItem('myWorkouts')) || {
        Pazartesi: [], Salı: [], Çarşamba: [], Perşembe: [], Cuma: [], Cumartesi: [], Pazar: []
    };
    let currentUser = null;

    const loginBtn = document.getElementById('login-btn');
    const logoutBtn = document.getElementById('logout-btn');
    const userDisplay = document.getElementById('user-display');
    const userNameSpan = document.getElementById('user-name');
    const themeToggle = document.getElementById('theme-toggle');

    auth.onAuthStateChanged(async (user) => {
        if (user) {
            currentUser = user;
            if(loginBtn) loginBtn.style.display = 'none';
            if(userDisplay) userDisplay.style.display = 'flex';
            if(userNameSpan) userNameSpan.innerText = `Merhaba, ${user.displayName.split(' ')[0]}`;
            await loadFromCloud();
        } else {
            currentUser = null;
            renderAll();
        }
    });

    if(loginBtn) loginBtn.onclick = () => auth.signInWithPopup(new firebase.auth.GoogleAuthProvider());
    if(logoutBtn) logoutBtn.onclick = () => auth.signOut().then(() => { localStorage.removeItem('myWorkouts'); location.reload(); });

    async function syncData() {
        localStorage.setItem('myWorkouts', JSON.stringify(workouts));
        if (currentUser) {
            try {
                await db.collection("users").doc(currentUser.uid).set({
                    workouts: JSON.stringify(workouts),
                    lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
                });
            } catch (e) { console.error("Sync Error", e); }
        }
        renderAll();
    }

    async function loadFromCloud() {
        if (!currentUser) return;
        const doc = await db.collection("users").doc(currentUser.uid).get();
        if (doc.exists) { workouts = JSON.parse(doc.data().workouts); renderAll(); }
    }

    document.querySelectorAll('.exercise-guide li:not(.category-title)').forEach(item => {
        item.onclick = () => {
            const input = document.getElementById('exercise-name');
            input.value = item.innerText;
            input.focus();
        };
    });

    document.getElementById('add-btn').onclick = () => {
        const d = document.getElementById('day-select').value;
        const n = document.getElementById('exercise-name').value;
        const s = document.getElementById('sets').value;
        const v = document.getElementById('value-per-set').value;
        if (!n || !s || !v) return alert("Eksik bilgi!");
        workouts[d].push({
            id: Date.now(),
            name: n,
            weight: document.getElementById('exercise-weight').value || null,
            sets: parseInt(s),
            type: document.getElementById('type-select').value === 'reps' ? 'Tekrar' : 'Dk',
            value: parseInt(v),
            completed: false
        });
        syncData();
        ['exercise-name', 'exercise-weight', 'sets', 'value-per-set'].forEach(id => document.getElementById(id).value = '');
    };

    function renderAll() {
        const container = document.getElementById('daily-planner');
        if (!container) return;
        container.innerHTML = '';
        Object.keys(workouts).forEach(day => {
            const list = workouts[day];
            const done = list.filter(ex => ex.completed).length;
            const perc = list.length > 0 ? Math.round((done / list.length) * 100) : 0;
            const card = document.createElement('div');
            card.className = 'day-card';
            card.innerHTML = `<h4>${day} <span>%${perc}</span></h4><div class="exercise-list"></div>`;
            list.forEach(ex => {
                const item = document.createElement('div');
                item.className = `exercise-item ${ex.completed ? 'completed' : ''}`;
                const info = document.createElement('div');
                info.style.flex = "1";
                info.innerHTML = `<strong>${ex.name}</strong><br><small>${ex.weight ? ex.weight+'kg | ' : ''}${ex.sets}x${ex.value} ${ex.type}</small>`;
                const actions = document.createElement('div');
                actions.className = "actions";
                const check = document.createElement('input');
                check.type = "checkbox";
                check.checked = ex.completed;
                check.onchange = () => { ex.completed = check.checked; syncData(); };
                const del = document.createElement('button');
                del.innerHTML = '🗑️';
                del.className = 'btn-delete';
                del.onclick = () => { if(confirm('Silinsin mi?')) { workouts[day] = list.filter(i => i.id !== ex.id); syncData(); } };
                actions.append(check, del);
                item.append(info, actions);
                card.querySelector('.exercise-list').appendChild(item);
            });
            container.appendChild(card);
        });
        const bar = document.getElementById('total-progress-bar');
        let t = 0, d = 0;
        Object.values(workouts).forEach(day => { t += day.length; d += day.filter(e => e.completed).length; });
        if (bar) bar.style.width = (t > 0 ? (d / t) * 100 : 0) + '%';
    }

    themeToggle.onclick = () => {
        document.body.classList.toggle('light-mode');
        localStorage.setItem('theme', document.body.classList.contains('light-mode') ? 'light' : 'dark');
    };
    if (localStorage.getItem('theme') === 'light') document.body.classList.add('light-mode');

    document.getElementById('reset-all').onclick = () => {
        if(confirm('Tüm hafta silinsin mi?')) { Object.keys(workouts).forEach(d => workouts[d] = []); syncData(); }
    };

    // --- PDF OLUŞTURUCU (ESKİ FORMAT GERİ GELDİ) ---
    document.getElementById('download-pdf').onclick = () => {
        const progress = document.getElementById('total-progress-bar').style.width;
        let content = `<div id="pdf-export" style="padding:30px; font-family:Arial; color:#1e293b; background:#fff;">
            <h1 style="color:#4f46e5; text-align:center;">WeeklyGym Gelişim Raporu</h1>
            <p style="text-align:center;">Tarih: ${new Date().toLocaleDateString('tr-TR')} | Başarı: %${parseInt(progress) || 0}</p><hr style="border:1px solid #eee; margin:20px 0;">`;

        Object.keys(workouts).forEach(day => {
            if (workouts[day].length > 0) {
                content += `<h3 style="color:#4f46e5; border-bottom:2px solid #4f46e5; padding-bottom:5px;">${day}</h3>
                <table style="width:100%; margin-bottom:20px; border-collapse:collapse;">
                    <thead><tr style="background:#f8fafc;"><th style="text-align:left; padding:8px; border-bottom:1px solid #ddd;">Egzersiz</th><th style="padding:8px; border-bottom:1px solid #ddd;">Ağırlık</th><th style="padding:8px; border-bottom:1px solid #ddd;">Set/Sayı</th><th style="text-align:right; padding:8px; border-bottom:1px solid #ddd;">Durum</th></tr></thead>
                    <tbody>`;
                workouts[day].forEach(ex => {
                    content += `<tr>
                        <td style="padding:8px; border-bottom:1px solid #eee;"><b>${ex.name}</b></td>
                        <td style="padding:8px; border-bottom:1px solid #eee; text-align:center;">${ex.weight || '-'} kg</td>
                        <td style="padding:8px; border-bottom:1px solid #eee; text-align:center;">${ex.sets} x ${ex.value}</td>
                        <td style="padding:8px; border-bottom:1px solid #eee; text-align:right;">${ex.completed ? '✅' : '❌'}</td>
                    </tr>`;
                });
                content += `</tbody></table>`;
            }
        });
        content += `<p style="text-align:center; font-size:12px; color:#94a3b8; margin-top:30px;">Bu rapor WeeklyGym tarafından oluşturulmuştur.</p></div>`;
        
        const opt = {
            margin: 10,
            filename: 'WeeklyGym_Haftalik_Rapor.pdf',
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };
        html2pdf().set(opt).from(content).save();
    };

    renderAll();
});
