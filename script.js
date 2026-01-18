/* WeeklyGym - Local Edition - v1.0 */

document.addEventListener('DOMContentLoaded', () => {
    // Verileri LocalStorage'dan çek veya boş taslak oluştur
    let workouts = JSON.parse(localStorage.getItem('myWorkouts')) || {
        Pazartesi: [], Salı: [], Çarşamba: [], Perşembe: [], Cuma: [], Cumartesi: [], Pazar: []
    };

    const themeToggle = document.getElementById('theme-toggle');

    // --- VERİ KAYDETME ---
    function saveData() {
        localStorage.setItem('myWorkouts', JSON.stringify(workouts));
        renderAll();
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

        saveData();
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

                item.querySelector('input').onchange = (e) => {
                    ex.completed = e.target.checked;
                    saveData();
                };

                item.querySelector('.btn-delete').onclick = () => {
                    if(confirm('Egzersizi silmek istediğine emin misin?')) {
                        workouts[day] = list.filter(i => i.id !== ex.id);
                        saveData();
                    }
                };

                card.querySelector('.exercise-list').appendChild(item);
            });
            container.appendChild(card);
        });

        // İlerleme Çubuğu
        const bar = document.getElementById('total-progress-bar');
        let total = 0, completed = 0;
        Object.values(workouts).forEach(d => { total += d.length; completed += d.filter(e => e.completed).length; });
        if (bar) bar.style.width = (total > 0 ? (completed / total) * 100 : 0) + '%';
    }

    // --- EKSTRA ÖZELLİKLER ---
    themeToggle.onclick = () => {
        document.body.classList.toggle('light-mode');
        localStorage.setItem('theme', document.body.classList.contains('light-mode') ? 'light' : 'dark');
    };
    if (localStorage.getItem('theme') === 'light') document.body.classList.add('light-mode');

    document.getElementById('reset-all').onclick = () => {
        if(confirm('Tüm program sıfırlansın mı?')) {
            Object.keys(workouts).forEach(d => workouts[d] = []);
            saveData();
        }
    };

    document.querySelectorAll('.exercise-guide li:not(.category-title)').forEach(item => {
        item.onclick = () => {
            document.getElementById('exercise-name').value = item.innerText;
            document.getElementById('exercise-name').focus();
        };
    });

    // PDF Kaydetme
    document.getElementById('download-pdf').onclick = () => {
        const progress = document.getElementById('total-progress-bar').style.width;
        let content = `<div style="padding:30px; font-family:Arial;">
            <h1 style="color:#4f46e5; text-align:center;">WeeklyGym Raporu</h1>
            <p style="text-align:center;">Haftalık Başarı: %${parseInt(progress) || 0}</p><hr>`;

        Object.keys(workouts).forEach(day => {
            if (workouts[day].length > 0) {
                content += `<h3>${day}</h3><table style="width:100%; border-collapse:collapse;">`;
                workouts[day].forEach(ex => {
                    content += `<tr style="border-bottom:1px solid #eee;">
                        <td style="padding:8px;">${ex.name}</td>
                        <td style="padding:8px;">${ex.weight || '-'}kg</td>
                        <td style="padding:8px;">${ex.sets}x${ex.value}</td>
                        <td style="padding:8px;">${ex.completed ? '✅' : '❌'}</td>
                    </tr>`;
                });
                content += `</table>`;
            }
        });
        content += `</div>`;
        html2pdf().set({ filename: 'Haftalik_Spor_Raporu.pdf' }).from(content).save();
    };

    renderAll();
});
