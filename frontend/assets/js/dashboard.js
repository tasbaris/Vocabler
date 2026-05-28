
document.addEventListener("DOMContentLoaded", async () => {
    const token = localStorage.getItem("vocabler_token");
    if (!token) {
        window.location.href = "login.html";
        return;
    }

    // HTML Elementlerini Yakala
    const totalLearnedCount = document.getElementById("totalLearnedCount");
    const totalLearnedProgress = document.getElementById("totalLearnedProgress");
    const streakCount = document.getElementById("streakCount");
    const pendingWordsCount = document.getElementById("pendingWordsCount");
    const recentWordsTableBody = document.getElementById("recentWordsTableBody");
    const welcomeMessage = document.getElementById("welcomeMessage");

    // Dil ve Çeviri Sözlüğü
    const lang = localStorage.getItem("vocabler_lang") || "tr";
    const dict = translations[lang] || translations['tr'];

    /**
     * Dashboard verilerini backend'den çek
     */
    async function fetchDashboardData() {
        try {
            // 1. Profil ve Analiz Verileri
            const profileRes = await fetch(`${API_BASE_URL}/user/get_user_data.php`, {
                method: 'GET',
                cache: 'no-store',
                headers: { 
                    "Authorization": `Bearer ${token}`,
                    "X-Vocabler-Token": token
                }
            });

            if (handleUnauthorized(profileRes)) return;

            const profileData = await profileRes.json();

            if (profileData.status === "success") {
                const user = profileData.user;
                const summary = profileData.summary;

                // İstatistikleri Yerleştir
                const mastered = parseInt(summary.MasteredCount) || 0;
                const overdue = parseInt(summary.OverdueCount) || 0;
                const total = parseInt(summary.TotalWords) || 1; // 0'a bölmeyi önle
                const completedToday = parseInt(summary.CompletedToday) || 0;
                const dailyGoal = parseInt(summary.TotalDailyGoal) || parseInt(user.DailyWord) || 10;

                if (totalLearnedCount) totalLearnedCount.innerText = mastered;
                if (totalLearnedProgress) {
                    const progress = (mastered / total) * 100;
                    totalLearnedProgress.style.width = progress + "%";
                }
                
                if (pendingWordsCount) pendingWordsCount.innerText = overdue;

                // Günlük Hedef (Daily Goal) Progress
                const dailyGoalProgress = document.getElementById("dailyGoalProgress");
                const dailyGoalCount = document.getElementById("dailyGoalCount");
                const dailyGoalDetails = document.getElementById("dailyGoalDetails");
                
                const newDone = parseInt(summary.NewWordsDone) || 0;
                const newGoal = parseInt(summary.NewWordsGoal) || 10;
                const revDone = parseInt(summary.ReviewsDone) || 0;
                const revGoal = parseInt(summary.TotalReviewsGoal) || 0;

                const totalDone = newDone + revDone;
                const totalGoal = newGoal + revGoal;
                const totalPercent = totalGoal > 0 ? Math.round((totalDone / totalGoal) * 100) : 100;

                if (dailyGoalCount) dailyGoalCount.innerText = `${totalPercent}%`;
                
                if (dailyGoalDetails) {
                    dailyGoalDetails.innerHTML = `
                        <span>🆕 ${newDone}/${newGoal}</span>
                        <span class="ms-2">🔄 ${revDone}/${revGoal}</span>
                    `;
                }

                if (dailyGoalProgress) {
                    dailyGoalProgress.style.width = totalPercent + "%";
                }

                // Öğrenme Serisi (Streak)
                if (streakCount) {
                    const streak = user.StreakDays || 0;
                    streakCount.innerText = `${streak} ${t('label_days')}`;
                }
                
                // Kullanıcı seviyesini göster (Mevcut olanı temizle veya güncelle)
                if (user.Level) {
                    const welcomeMsgHeader = document.querySelector("#welcomeMessage");
                    if (welcomeMsgHeader) {
                        // Eğer zaten bir level badge varsa onu kaldır
                        const existingBadge = welcomeMsgHeader.querySelector(".level-badge");
                        if (existingBadge) existingBadge.remove();

                        const levelSpan = document.createElement("span");
                        levelSpan.className = "badge bg-warning text-dark ms-2 align-middle level-badge";
                        levelSpan.innerText = user.Level;
                        welcomeMsgHeader.appendChild(levelSpan);
                    }
                }
            }

            // 2. Son Eklenen Kelimeler
            const wordsRes = await fetch(`${API_BASE_URL}/words/get_words.php`, {
                headers: { 
                    "Authorization": `Bearer ${token}`,
                    "X-Vocabler-Token": token
                }
            });

            if (handleUnauthorized(wordsRes)) return;

            const wordsData = await wordsRes.json();

            if (wordsData.status === "success") {
                const words = wordsData.words.slice(0, 5); // Son 5 kelime
                
                if (recentWordsTableBody) {
                    recentWordsTableBody.innerHTML = "";
                    if (words.length === 0) {
                        recentWordsTableBody.innerHTML = `<tr><td colspan="4" class="text-center py-4 text-white opacity-50">${dict.msg_no_words_found}</td></tr>`;
                    } else {
                        words.forEach(word => {
                            const tr = document.createElement("tr");
                            tr.className = "align-middle";
                            
                            const rank = parseInt(word.LearnRank) || 0;
                            const statusHtml = word.SRSStatus == 2 
                                ? `<span class="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25 px-2 py-1">${t('label_mastered')}</span>`
                                : `<span class="badge bg-info bg-opacity-10 text-info border border-info border-opacity-25 px-2 py-1">${t('label_step')} ${rank}/6</span>`;

                            const picture = word.Picture ? (word.Picture.startsWith('http') ? word.Picture : `${API_BASE_URL}/../${word.Picture}`) : null;
                            const imgHtml = picture ? `<img src="${picture}" class="rounded me-2" style="width: 32px; height: 32px; object-fit: cover;">` : `<div class="rounded me-2 bg-secondary bg-opacity-10 d-flex align-items-center justify-content-center" style="width: 32px; height: 32px;"><i class="fas fa-image opacity-25 fa-xs"></i></div>`;

                            tr.innerHTML = `
                                <td>
                                    <div class="d-flex align-items-center">
                                        ${imgHtml}
                                        <div class="fw-bold">${word.EnglishTranslation}</div>
                                    </div>
                                </td>
                                <td><div class="opacity-75">${word.TurkishTranslation}</div></td>
                                <td><span class="badge bg-primary bg-opacity-10 text-primary border border-primary border-opacity-25 px-2 py-1">${word.Level}</span></td>
                                <td class="text-center">${statusHtml}</td>
                            `;
                            recentWordsTableBody.appendChild(tr);
                        });
                    }
                }
            }

        } catch (error) {
            console.error("Dashboard yükleme hatası:", error);
        }
    }

    fetchDashboardData();
});
