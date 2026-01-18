/* WeeklyGym - Local Edition - v3.0 */

document.addEventListener('DOMContentLoaded', () => {
    let workouts = JSON.parse(localStorage.getItem('myWorkouts')) || {
        Pazartesi: [], Salı: [], Çarşamba: [], Perşembe: [], Cuma: [], Cumartesi: [], Pazar: []
    };

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

        if (!n || !s || !v) return alert("Boş alan bırakmayın!");

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
                        <button class="btn-delete" data-day="${day}" data-id="${ex.id}">🗑️</button>
                    </div>`;

                item.querySelector('input').onchange = (e) => {
                    ex.completed = e.target.checked;
                    saveData();
                };
                card.querySelector('.exercise-list').appendChild(item);
            });
            container.appendChild(card);
        });

        // Silme İşlemi
        document.querySelectorAll('.btn-delete').forEach(btn => {
            btn.onclick = () => {
                const day = btn.getAttribute('data-day');
                const id = btn.getAttribute('data-id');
                workouts[day] = workouts[day].filter(ex => ex.id != id);
                saveData();
            };
        });

        // Genel İlerleme
        const bar = document.getElementById('total-progress-bar');
        let total = 0, completed = 0;
        Object.values(workouts).forEach(d => { total += d.length; completed += d.filter(e => e.completed).length; });
        if (bar) bar.style.width = (total > 0 ? (completed / total) * 100 : 0) + '%';
    }

    // --- PDF RAPORU (KESİN ÇÖZÜM) ---
    document.getElementById('download-pdf').onclick = () => {
        const progressWidth = document.getElementById('total-progress-bar').style.width;
        
        // Görseldeki hatayı önlemek için HTML içeriğini sıfırdan oluşturuyoruz
        let pdfHTML = `
            <div style="padding: 20px; font-family: sans-serif; color: #333;">
                <div style="text-align: center; border-bottom: 3px solid #4f46e5; padding-bottom: 10px; margin-bottom: 20px;">
                    <h1 style="color: #4f46e5; margin: 0;">WeeklyGym Gelişim Raporu</h1>
                    <p style="font-size: 16px; margin: 10px 0;">Haftalık Genel Başarı: <b>%${parseInt(progressWidth) || 0}</b></p>
                    <p style="font-size: 12px; color: #666;">Tarih: ${new Date().toLocaleDateString('tr-TR')}</p>
                </div>
        `;

        Object.keys(workouts).forEach(day => {
            if (workouts[day].length > 0) {
                pdfHTML += `
                    <div style="margin-bottom: 25px;">
                        <h3 style="background: #f1f5f9; padding: 8px; border-left: 5px solid #4f46e5;">${day}</h3>
                        <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
                            <thead>
                                <tr style="background: #f8fafc; border-bottom: 2px solid #ddd; text-align: left;">
                                    <th style="padding: 8px;">Egzersiz</th>
                                    <th style="padding: 8px;">Detay</th>
                                    <th style="padding: 8px; text-align: center;">Durum</th>
                                </tr>
                            </thead>
                            <tbody>
                `;

                workouts[day].forEach(ex => {
                    const statusText = ex.completed ? "TAMAMLANDI" : "EKSİK";
                    const statusColor = ex.completed ? "#10b981" : "#ef4444";
                    pdfHTML += `
                        <tr style="border-bottom: 1px solid #eee;">
                            <td style="padding: 10px;"><b>${ex.name}</b></td>
                            <td style="padding: 10px;">${ex.weight ? ex.weight+'kg | ' : ''}${ex.sets}x${ex.value}</td>
                            <td style="padding: 10px; text-align: center; font-weight: bold; color: ${statusColor};">${statusText}</td>
                        </tr>
                    `;
                });

                pdfHTML += `</tbody></table></div>`;
            }
        });

        pdfHTML += `<p style="text-align: center; font-size: 10px; color: #999; margin-top: 30px;">WeeklyGym - Dijital Spor Günlüğü</p></div>`;

        // PDF'i oluştur ve indir
        const element = document.createElement('div');
        element.innerHTML = pdfHTML;

        const options = {
            margin: 10,
            filename: 'WeeklyGym_Haftalik_Rapor.pdf',
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };

        html2pdf().set(options).from(element).save();
    };

    // Tema Değiştirici
    document.getElementById('theme-toggle').onclick = () => {
        document.body.classList.toggle('light-mode');
        localStorage.setItem('theme', document.body.classList.contains('light-mode') ? 'light' : 'dark');
    };
    if (localStorage.getItem('theme') === 'light') document.body.classList.add('light-mode');

    // Sıfırlama
    document.getElementById('reset-all').onclick = () => {
        if(confirm('Tüm program silinsin mi?')) {
            Object.keys(workouts).forEach(d => workouts[d] = []);
            saveData();
        }
    };

    renderAll();
});
