/**
 * Quiz (Flashcard) Logic
 */

let quizData = [];
let currentIndex = 0;
let correctCount = 0;
let wrongCount = 0;

/**
 * Backend'den günlük quiz kelimelerini çeker
 */
async function fetchQuizWords() {
    const token = localStorage.getItem("vocabler_token");
    const quizArea = document.getElementById("quiz-area");
    const topicsContainer = document.getElementById("question-container");

    try {
        const response = await fetch(`${API_BASE_URL}/quiz/get_quiz_words.php`, {
            method: "GET",
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
            },
        });

        const result = await response.json();

        if (response.ok && result.status === "success") {
            quizData = result.data;
            if (quizData.length > 0) {
                document.getElementById("total-questions-num").textContent = quizData.length;
                showQuestion();
            } else {
                showEmptyState();
            }
        }
    } catch (error) {
        console.error("Quiz verileri alınırken hata:", error);
        Swal.fire("Hata", "Sorular yüklenirken bir sorun oluştu.", "error");
    }
}

/**
 * Mevcut soruyu (kartı) ekrana basar
 */
function showQuestion() {
    if (currentIndex >= quizData.length) {
        showResults();
        return;
    }

    const word = quizData[currentIndex];
    const lang = localStorage.getItem("vocabler_lang") || "tr";
    
    // UI Güncelleme
    document.getElementById("current-question-num").textContent = currentIndex + 1;
    const progress = ((currentIndex) / quizData.length) * 100;
    document.getElementById("quiz-progress-bar").style.width = `${progress}%`;

    // Kartı ön yüzüne çevir ve içeriği hazırla
    const flashcard = document.querySelector(".flashcard");
    if (flashcard) flashcard.classList.remove("flipped");

    // Kelime Türü Çevirisi (Noun -> İsim vb.)
    const typeKey = `word_type_${(word.WordType || "").toLowerCase()}`;
    const translatedType = translations[lang][typeKey] || word.WordType || "";

    document.getElementById("front-word").textContent = word.TargetWord;
    document.getElementById("front-pronunciation").textContent = word.Pronunciation ? `/${word.Pronunciation}/` : "";
    document.getElementById("front-type-level").textContent = `${translatedType} / ${word.Level}`;

    document.getElementById("back-word").textContent = word.SourceWord;
    document.getElementById("back-sentence").textContent = word.SampleSentence || "";
    document.getElementById("back-translation").textContent = word.SampleTranslation || "";

    if (word.Picture) {
        document.getElementById("front-image").src = `${API_BASE_URL}/uploads/${word.Picture}`;
        document.getElementById("front-image").parentElement.classList.remove("d-none");
    } else {
        document.getElementById("front-image").parentElement.classList.add("d-none");
    }
}

/**
 * Kullanıcı sonucunu backend'e gönderir
 */
async function submitResult(isCorrect) {
    const word = quizData[currentIndex];
    const token = localStorage.getItem("vocabler_token");

    if (isCorrect) correctCount++;
    else wrongCount++;

    try {
        // Arka planda sonucu gönder (await etmiyoruz ki akış hızlansın, ama hata kontrolü yapıyoruz)
        fetch(`${API_BASE_URL}/quiz/submit_quiz_result.php`, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                wordId: word.WordId,
                isCorrect: isCorrect
            }),
        });
        
        currentIndex++;
        showQuestion();
    } catch (err) {
        console.error("Sonuç gönderilemedi:", err);
    }
}

/**
 * Boş durum mesajı
 */
function showEmptyState() {
    const lang = localStorage.getItem("vocabler_lang") || "tr";
    document.getElementById("quiz-area").innerHTML = `
        <div class="text-center py-5">
            <i class="fas fa-check-circle fa-5x text-success mb-4 opacity-50"></i>
            <h2 class="fw-bold mb-3" data-i18n="quiz_empty_title">${translations[lang].quiz_empty_title}</h2>
            <p class="text-muted mb-4" data-i18n="quiz_empty_text">${translations[lang].quiz_empty_text}</p>
            <a href="topics.html" class="btn btn-primary px-5 rounded-pill" data-i18n="feature_topics_title">${translations[lang].feature_topics_title}</a>
        </div>
    `;
}

/**
 * Quiz sonuçlarını gösterir
 */
function showResults() {
    const lang = localStorage.getItem("vocabler_lang") || "tr";
    document.getElementById("quiz-area").classList.add("d-none");
    document.getElementById("quiz-results").classList.remove("d-none");
    
    document.getElementById("correct-count").textContent = correctCount;
    document.getElementById("wrong-count").textContent = wrongCount;

    Swal.fire({
        title: translations[lang].quiz_completed_title,
        text: translations[lang].quiz_completed_text,
        icon: "success",
        confirmButtonText: "Harika!",
        confirmButtonColor: "#00ADB5"
    });
}

document.addEventListener("DOMContentLoaded", () => {
    if (typeof checkAuth === "function") checkAuth();

    fetchQuizWords();

    // Kartı çevirme
    const flipBtn = document.getElementById("flip-card-btn");
    const flashcard = document.querySelector(".flashcard");
    if (flipBtn && flashcard) {
        flipBtn.addEventListener("click", () => {
            flashcard.classList.toggle("flipped");
        });
    }

    // Bildim/Bilemedim Butonları
    const correctBtn = document.getElementById("quiz-correct-btn");
    const wrongBtn = document.getElementById("quiz-wrong-btn");

    if (correctBtn) correctBtn.addEventListener("click", () => submitResult(true));
    if (wrongBtn) wrongBtn.addEventListener("click", () => submitResult(false));
});
