
document.addEventListener("DOMContentLoaded", async () => {
    const token = localStorage.getItem("vocabler_token");
    if (!token) {
        window.location.href = "login.html";
        return;
    }

    // HTML Elementlerini Yakala
    const totalLearnedCount = document.getElementById("totalLearnedCount");
    const totalLearnedProgress = document.getElementById("totalLearnedProgress");
    const successRatePercent = document.getElementById("successRatePercent");
    const successRateProgress = document.getElementById("successRateProgress");
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
                headers: { "Authorization": `Bearer ${token}` }
            });
            const profileData = await profileRes.json();

            if (profileData.status === "success") {
                const user = profileData.user;
                const analysis = profileData.analysis || [];

                // Toplam Öğrenilen (Status = 2 olanlar)
                // Analiz verisinden çekilebilir veya ayrı bir endpoint
                let learnedCount = 0;
                let pendingCount = 0;
                let totalSuccess = 0;
                let quizCount = 0;

                analysis.forEach(stat => {
                    if (stat.Status == 2) learnedCount = stat.WordCount;
                    if (stat.Status == 1) pendingCount = stat.WordCount;
                    // Başarı oranı hesaplama (basit örnek)
                });

                if (totalLearnedCount) totalLearnedCount.innerText = learnedCount;
                if (totalLearnedProgress) totalLearnedProgress.style.width = Math.min((learnedCount / 100) * 100, 100) + "%";
                
                if (pendingWordsCount) pendingWordsCount.innerText = pendingCount;
                
                // Kullanıcı seviyesini göster
                if (user.Level) {
                    const levelSpan = document.createElement("span");
                    levelSpan.className = "badge bg-warning text-dark ms-2 align-middle";
                    levelSpan.innerText = user.Level;
                    const welcomeMsg = document.querySelector(".userNameDisplay").parentNode;
                    if (welcomeMsg && welcomeMsg.tagName === 'H4') {
                        welcomeMsg.appendChild(levelSpan);
                    }
                }
            }

            // 2. Son Eklenen Kelimeler
            const wordsRes = await fetch(`${API_BASE_URL}/words/get_words.php`, {
                headers: { "Authorization": `Bearer ${token}` }
            });
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
                                ? `<span class="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25 px-2 py-1">${dict.quiz_completed_title.split(' ')[0]}</span>`
                                : `<span class="badge bg-info bg-opacity-10 text-info border border-info border-opacity-25 px-2 py-1">Step ${rank}/6</span>`;

                            tr.innerHTML = `
                                <td><div class="fw-bold text-white">${word.EnglishTranslation}</div></td>
                                <td><div class="text-white opacity-75">${word.TurkishTranslation}</div></td>
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
