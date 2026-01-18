/* WeeklyGym Security Engine - v3.0 - 2026 */

// Firebase Yapılandırması
const firebaseConfig = {
    apiKey: "AIzaSyBg-_Go01JU8roA7qRe7pR55dvEAfKz4Sg",
    authDomain: "weeklygym-4abc2.firebaseapp.com",
    projectId: "weeklygym-4abc2",
    storageBucket: "weeklygym-4abc2.firebasestorage.app",
    messagingSenderId: "986809474109",
    appId: "1:986809474109:web:a6323b839235df220a9e54",
    measurementId: "G-7N6ZQPQHTD"
};

// Firebase Servislerini Başlat
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const auth = firebase.auth();
const db = firebase.firestore();
const provider = new firebase.auth.GoogleAuthProvider();

document.addEventListener('DOMContentLoaded', () => {
    // Başlangıç verisi
    let workouts = JSON.parse(localStorage.getItem('myWorkouts')) || {
        Pazartesi: [], Salı: [], Çarşamba: [], Perşembe: [], Cuma: [], Cumartesi: [], Pazar: []
    };
    let currentUser = null;

    const loginBtn = document.getElementById('login-btn');
    const logoutBtn = document.getElementById('logout-btn');
    const userDisplay = document.getElementById('user-display');
    const userNameSpan = document.getElementById('user-name');
    const themeToggle = document.getElementById('theme-toggle');

    // --- AUTH TAKİBİ ---
    auth.onAuthStateChanged(async (user) => {
        if (user) {
            currentUser = user;
            if(loginBtn) loginBtn.style.display = 'none';
            if(userDisplay) userDisplay.style.display = 'flex';
            if(userNameSpan) userNameSpan.innerText = `Merhaba, ${user.displayName.split(' ')[0]}`;
            await loadFromCloud(); // Giriş yapınca buluttan çek
        } else {
            currentUser = null;
            if(loginBtn) loginBtn.style.display = 'inline-block';
            if(userDisplay) userDisplay.style.display = 'none';
            renderAll();
        }
    });

    // --- GİRİŞ / ÇIKIŞ İŞLEMLERİ ---
    if(loginBtn) {
        loginBtn.onclick = () => {
            auth.signInWithPopup(provider).catch(err => console.error("Giriş Hatası:", err));
        };
    }

    if(logoutBtn) {
        logoutBtn.onclick = () => {
            auth.signOut().then(() => {
                localStorage.removeItem('myWorkouts');
                location.reload();
            });
        };
    }

    // --- VERİ SENKRONİZASYONU ---
    async function syncData() {
        localStorage.setItem('myWorkouts', JSON.stringify(workouts));
        
        if (currentUser) {
            try {
                // Firestore'da 'users' koleksiyonu altına UID ile kaydet
                await db.collection("users").doc(currentUser.uid).set({
                    workouts: JSON.stringify(workouts),
                    lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
                });
            } catch (e) {
                console.error("Bulut Senkronizasyon Hatası:", e);
            }
        }
        renderAll();
    }

    // --- BULUTTAN VERİ ÇEKME ---
    async function loadFromCloud() {
        if (!currentUser) return;
        try {
            const doc = await db.collection("users").doc(currentUser.uid).get();
            if (doc.exists) {
                const cloudData = JSON.parse(doc.data().workouts);
                workouts = cloudData;
                localStorage.setItem('myWorkouts', JSON.stringify(workouts));
                renderAll();
            }
        } catch (e) {
            console.error("Veri Yükleme Hatası:", e);
        }
    }

    // --- EGZERSİZ EKLEME ---
    document.getElementById('add-btn').onclick = () => {
        const d = document.getElementById('day-select').value;
        const n = document.getElementById('exercise-name').value;
        const s = document.getElementById('sets').value;
        const v = document.getElementById('value-per-set').value;
        const w = document.getElementById('exercise-weight').value;

        if (!n || !s || !v) return alert("Lütfen gerekli alanları doldurun!");

        workouts[d].push({
            id: Date.now(),
            name: n,
            weight: w || null,
            sets: parseInt(s),
            type: document.getElementById('type-select').value === 'reps' ? 'Tekrar' : 'Dakika',
            value: parseInt(v),
            completed: false
        });

        syncData();
        // Formu temizle
        ['exercise-name', 'exercise-weight', 'sets', 'value-per-set'].forEach(id => document.getElementById(id).value = '');
    };

    // --- ARAYÜZÜ GÜNCELLE ---
    function renderAll() {
        const container = document.getElementById('daily-planner');
        if (!container) return;
        container.innerHTML = '';

        Object.keys(workouts).forEach(day => {
            const list = workouts[day];
            const done = list.filter(ex => ex.completed).length;
            const perc = list.length > 0 ? Math.round((done / list.length) * 100) : 0;

            const card = document.createElement('div');
            card.className = 'day-card card';
            card.innerHTML = `<h4>${day} <span class="perc">%${perc}</span></h4><div class="exercise-list"></div>`;

            list.forEach(ex => {
                const item = document.createElement('div');
                item.className = `exercise-item ${ex.completed ? 'completed' : ''}`;
                
                item.innerHTML = `
                    <div style="flex:1">
                        <strong>${ex.name}</strong><br>
                        <small>${ex.weight ? ex.weight+'kg | ' : ''}${ex.sets}x${ex.value} ${ex.type}</small>
                    </div>
                    <div class="actions">
                        <input type="checkbox" ${ex.completed ? 'checked' : ''}>
                        <button class="btn-delete">🗑️</button>
                    </div>
                `;

                // Checkbox ve Silme olayları
                item.querySelector('input').onchange = (e) => {
                    ex.completed = e.target.checked;
                    syncData();
                };
                item.querySelector('.btn-delete').onclick = () => {
                    if(confirm('Bu egzersizi silmek istediğine emin misin?')) {
                        workouts[day] = list.filter(i => i.id !== ex.id);
                        syncData();
                    }
                };

                card.querySelector('.exercise-list').appendChild(item);
            });
            container.appendChild(card);
        });

        // Genel ilerleme çubuğu
        const bar = document.getElementById('total-progress-bar');
        let totalEx = 0, completedEx = 0;
        Object.values(workouts).forEach(day => {
            totalEx += day.length;
            completedEx += day.filter(e => e.completed).length;
        });
        if (bar) bar.style.width = (totalEx > 0 ? (completedEx / totalEx) * 100 : 0) + '%';
    }

    // --- DİĞER FONKSİYONLAR (Tema, PDF, Reset) ---
    themeToggle.onclick = () => {
        document.body.classList.toggle('light-mode');
        localStorage.setItem('theme', document.body.classList.contains('light-mode') ? 'light' : 'dark');
    };
    if (localStorage.getItem('theme') === 'light') document.body.classList.add('light-mode');

    document.getElementById('reset-all').onclick = () => {
        if(confirm('Tüm haftalık programı sıfırlamak istediğine emin misin?')) {
            Object.keys(workouts).forEach(d => workouts[d] = []);
            syncData();
        }
    };

    // Rehberdeki egzersizlere tıklayınca inputa yazdır
    document.querySelectorAll('.exercise-guide li:not(.category-title)').forEach(item => {
        item.onclick = () => {
            const input = document.getElementById('exercise-name');
            input.value = item.innerText;
            input.focus();
        };
    });

    // PDF Kaydetme (Mevcut kodunu korudum)
    document.getElementById('download-pdf').onclick = () => {
        const progress = document.getElementById('total-progress-bar').style.width;
        let content = `<div style="padding:30px; font-family:Arial; color:#1e293b; background:white;">
            <h1 style="color:#4f46e5; text-align:center;">WeeklyGym Gelişim Raporu</h1>
            <p style="text-align:center;">Tarih: ${new Date().toLocaleDateString('tr-TR')} | Başarı: %${parseInt(progress) || 0}</p><hr>`;

        Object.keys(workouts).forEach(day => {
            if (workouts[day].length > 0) {
                content += `<h3>${day}</h3><table style="width:100%; border-collapse:collapse; margin-bottom:15px;">`;
                workouts[day].forEach(ex => {
                    content += `<tr style="border-bottom:1px solid #eee;">
                        <td style="padding:8px;"><b>${ex.name}</b></td>
                        <td style="padding:8px;">${ex.weight || '-'}kg</td>
                        <td style="padding:8px;">${ex.sets}x${ex.value}</td>
                        <td style="padding:8px; text-align:right;">${ex.completed ? '✅' : '❌'}</td>
                    </tr>`;
                });
                content += `</table>`;
            }
        });
        content += `</div>`;
        html2pdf().set({ 
            filename: 'WeeklyGym_Rapor.pdf',
            html2canvas: { scale: 2 },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        }).from(content).save();
    };

    renderAll();
});
