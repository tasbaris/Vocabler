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
    if (!token) {
        window.location.href = "login.html";
        return;
    }

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
            if (quizData && quizData.length > 0) {
                document.getElementById("total-questions-num").textContent = quizData.length;
                showQuestion();
            } else {
                showEmptyState();
            }
        } else {
            console.error("Quiz fetch failed:", result.message);
            showEmptyState();
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
    const progress = (currentIndex / quizData.length) * 100;
    document.getElementById("quiz-progress-bar").style.width = `${progress}%`;

    // Kartı ön yüzüne çevir ve içeriği hazırla
    const flashcard = document.getElementById("main-flashcard");
    if (flashcard) flashcard.classList.remove("flipped");

    // Kelime Türü Çevirisi (Noun -> İsim vb.)
    const typeKey = `word_type_${(word.WordType || "").toLowerCase()}`;
    const dict = translations[lang] || translations['tr'];
    const translatedType = dict[typeKey] || word.WordType || "";

    document.getElementById("currentWord").textContent = word.TargetWord;
    document.getElementById("front-pronunciation").textContent = word.Pronunciation ? `/${word.Pronunciation}/` : "";
    document.getElementById("front-type-level").textContent = `${translatedType} / ${word.Level}`;

    document.getElementById("back-word").textContent = word.SourceWord;
    document.getElementById("back-sentence").textContent = word.SampleSentence || "";
    document.getElementById("back-translation").textContent = word.SampleTranslation || "";

    const frontImage = document.getElementById("front-image");
    if (word.Picture) {
        frontImage.src = `${API_BASE_URL}/uploads/${word.Picture}`;
        frontImage.parentElement.classList.remove("d-none");
    } else {
        frontImage.parentElement.classList.add("d-none");
    }
}

/**
 * Kullanıcı sonucunu backend'e gönderir
 */
async function submitResult(isCorrect) {
    if (currentIndex >= quizData.length) return;

    const word = quizData[currentIndex];
    const token = localStorage.getItem("vocabler_token");

    if (isCorrect) correctCount++;
    else wrongCount++;

    try {
        // API_BASE_URL/quiz/submit_result.php ucuna POST isteği
        fetch(`${API_BASE_URL}/quiz/submit_result.php`, {
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
        
        // Progress bar'ı son kelimeden sonra %100 yap
        if (currentIndex === quizData.length) {
            document.getElementById("quiz-progress-bar").style.width = "100%";
        }
        
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
    const dict = translations[lang] || translations['tr'];
    
    document.getElementById("quiz-area").innerHTML = `
        <div class="text-center py-5">
            <i class="fas fa-check-circle fa-5x text-success mb-4 opacity-50"></i>
            <h2 class="fw-bold mb-3">${dict.quiz_empty_title || 'Harika İş!'}</h2>
            <p class="text-muted mb-4">${dict.quiz_empty_text || 'Şu an gözden geçirilecek kelimen kalmadı.'}</p>
            <a href="topics.html" class="btn btn-primary px-5 rounded-pill">${dict.feature_topics_title || 'Konular'}</a>
        </div>
    `;
}

/**
 * Quiz sonuçlarını gösterir
 */
function showResults() {
    const lang = localStorage.getItem("vocabler_lang") || "tr";
    const dict = translations[lang] || translations['tr'];
    
    document.getElementById("quiz-area").classList.add("d-none");
    document.getElementById("quiz-results").classList.remove("d-none");
    
    document.getElementById("correct-count").textContent = correctCount;
    document.getElementById("wrong-count").textContent = wrongCount;

    Swal.fire({
        title: dict.quiz_completed_title || "Quiz Tamamlandı! 🎉",
        text: dict.quiz_completed_text || "Tebrikler, quizi tamamladın!",
        icon: "success",
        confirmButtonText: "Tamam",
        confirmButtonColor: "#00ADB5"
    });
}

document.addEventListener("DOMContentLoaded", () => {
    // Auth kontrolü (eğer auth.js yüklüyse)
    if (typeof checkAuth === "function") {
        checkAuth();
    }

    fetchQuizWords();

    // Kartı çevirme butonu
    const flipBtn = document.getElementById("flip-card-btn");
    const flashcard = document.getElementById("main-flashcard");
    if (flipBtn && flashcard) {
        flipBtn.addEventListener("click", () => {
            flashcard.classList.toggle("flipped");
        });
    }

    // Doğru (Known) / Yanlış (Unknown) Butonları
    const btnKnown = document.getElementById("btnKnown");
    const btnUnknown = document.getElementById("btnUnknown");

    if (btnKnown) btnKnown.addEventListener("click", () => submitResult(true));
    if (btnUnknown) btnUnknown.addEventListener("click", () => submitResult(false));
});
