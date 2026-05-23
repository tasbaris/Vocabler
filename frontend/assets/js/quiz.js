/**
 * Quiz (Flashcard) Logic
 */

let quizData = [];
let currentIndex = 0;
let correctCount = 0;
let wrongCount = 0;

/**
 * Quiz'i başlat
 */
async function initQuiz() {
    document.getElementById("quiz-start-screen").classList.add("d-none");
    document.getElementById("quiz-area").classList.remove("d-none");
    showQuestion();
}

/**
 * Backend'den günlük quiz kelimelerini/sorularını ve toplam kelime sayısını çeker
 */
async function fetchQuizWords() {
    const token = localStorage.getItem("vocabler_token");
    if (!token) {
        window.location.href = "login.html";
        return;
    }

    try {
        // Hem soruları hem de toplam kelime sayısını çek
        const [quizRes, wordsRes] = await Promise.all([
            fetch(`${API_BASE_URL}/quiz/get_questions.php?limit=10`, { headers: { Authorization: `Bearer ${token}` } }),
            fetch(`${API_BASE_URL}/words/get_words.php`, { headers: { Authorization: `Bearer ${token}` } })
        ]);

        const quizResult = await quizRes.json();
        const wordsResult = await wordsRes.json();

        if (quizRes.ok && quizResult.status === "success") {
            quizData = quizResult.data;
            if (quizData && quizData.length > 0) {
                const totalWords = wordsResult.words ? wordsResult.words.length : 0;
                document.getElementById("total-questions-num").textContent = quizData.length;
                document.getElementById("total-words-count").textContent = totalWords;
                
                // Başlangıç ekranını güncelle
                document.getElementById("quiz-info-text").innerHTML = `
                    <div class="d-flex justify-content-center gap-4">
                        <span><strong>Quiz Sorusu:</strong> ${quizData.length}</span>
                        <span><strong>Toplam Kelime:</strong> ${totalWords}</span>
                    </div>
                `;

                // Zorluk Göstergesi Mantığı: 1=Yeşil, 2=Sarı, 3=Kırmızı
                const indicator = document.getElementById("difficulty-indicator");
                const lines = indicator.querySelectorAll(".line");
                const difficulty = 2; // Örnek zorluk seviyesi

                // Renk tanımları
                const colors = {
                    1: ['#2ed573', '#ccc', '#ccc'],
                    2: ['#ffa502', '#ffa502', '#ccc'],
                    3: ['#ff4757', '#ff4757', '#ff4757']
                };

                // Görünürlük ve renk yönetimi
                lines.forEach((line, index) => {
                    if (difficulty === 1) {
                        line.style.background = index === 0 ? colors[1][0] : '#ccc';
                    } else if (difficulty === 2) {
                        line.style.background = index < 2 ? colors[2][0] : '#ccc';
                    } else if (difficulty === 3) {
                        line.style.background = colors[3][0];
                    }
                });

                const btn = document.getElementById("start-quiz-btn");
                btn.disabled = false;
                btn.addEventListener("click", initQuiz);
            } else {
                showEmptyState();
            }
        } else {
            showEmptyState();
        }
    } catch (error) {
        console.error("Veri yüklenirken hata:", error);
        Swal.fire("Hata", "Veriler yüklenirken bir sorun oluştu.", "error");
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

    const question = quizData[currentIndex];
    
    // UI Güncelleme
    document.getElementById("current-question-num").textContent = currentIndex + 1;

    // Soru metni ve Görsel
    const wordDisplay = document.getElementById("currentWord");
    wordDisplay.textContent = question.QuestionText;
    
    // Clear previous image if exists
    const oldImg = document.getElementById("question-image");
    if (oldImg) oldImg.remove();

    if (question.ImageUrl) {
        const img = document.createElement("img");
        img.id = "question-image";
        img.src = question.ImageUrl.startsWith('http') ? question.ImageUrl : `${API_BASE_URL}/../${question.ImageUrl}`;
        img.className = "img-fluid rounded mb-3";
        img.style.maxHeight = "200px";
        wordDisplay.parentNode.insertBefore(img, wordDisplay);
    }

    document.getElementById("front-pronunciation").textContent = question.Pronunciation || "";
    
    const qTypes = {
        'Multiple Choice': t('qtype_multiple'),
        'True/False': t('qtype_tf'),
        'Short Answer': t('qtype_short'),
        'Matching': t('qtype_matching')
    };
    const qType = qTypes[question.QuestionType] || question.QuestionType;
    document.getElementById("front-type-level").textContent = `${qType} | ${question.Level || 'N/A'}`;
    
    // Seçenekleri oluştur
    const optionsContainer = document.createElement("div");
    optionsContainer.className = "d-grid gap-2 mt-4 w-100 options-container";
    
    const container = document.querySelector(".flashcard-container");

    if (question.QuestionType === 'Multiple Choice' && question.Options) {
        container.classList.add("multiple-choice-mode");
        
        // Şıklar: A, B, C, D...
        const labels = ['a', 'b', 'c', 'd', 'e', 'f'];
        
        // Ensure options is an array
        const options = Array.isArray(question.Options) ? question.Options : Object.values(question.Options);

        options.forEach((value, i) => {
            const btn = document.createElement("button");
            btn.className = "btn btn-outline-light text-start p-3 rounded-3 option-btn";
            btn.innerHTML = `<span class="fw-bold me-3 border border-secondary rounded px-2">${labels[i].toUpperCase()}</span> ${value}`;
            btn.onclick = (e) => {
                e.stopPropagation();
                handleOptionClick(btn, value, question.CorrectAnswer);
            };
            optionsContainer.appendChild(btn);
        });
    } else {
        container.classList.remove("multiple-choice-mode");
        document.getElementById("back-word").textContent = question.CorrectAnswer;
        document.getElementById("back-sentence").textContent = question.Explanation || "";
    }

    // Seçenekleri ön yüze ekle
    const frontFace = document.querySelector(".flashcard-front");
    const oldOptions = frontFace.querySelector(".options-container");
    if (oldOptions) oldOptions.remove();
    frontFace.appendChild(optionsContainer);
    
    const flashcard = document.getElementById("main-flashcard");
    if (flashcard) flashcard.classList.remove("flipped");
}

function handleOptionClick(btn, selectedValue, correctAnswer) {
    const isCorrect = selectedValue === correctAnswer;
    
    const allBtns = document.querySelectorAll(".option-btn");
    allBtns.forEach(b => b.disabled = true);

    if (isCorrect) {
        btn.classList.replace("btn-outline-light", "btn-success");
        btn.innerHTML += ' <i class="fas fa-check float-end mt-1"></i>';
    } else {
        btn.classList.replace("btn-outline-light", "btn-danger");
        btn.innerHTML += ' <i class="fas fa-times float-end mt-1"></i>';
        
        allBtns.forEach(b => {
            if (b.innerText.includes(correctAnswer)) {
                b.classList.replace("btn-outline-light", "btn-success");
            }
        });
    }

    setTimeout(() => {
        submitResult(isCorrect);
    }, 1500);
}

/**
 * Kullanıcı sonucunu backend'e gönderir
 */
async function submitResult(isCorrect) {
    const question = quizData[currentIndex];
    const token = localStorage.getItem("vocabler_token");

    if (isCorrect) correctCount++;
    else wrongCount++;

    try {
        if (question.WordId || question.Id) {
            fetch(`${API_BASE_URL}/quiz/submit_question_result.php`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    wordId: question.WordId,
                    questionId: question.Id,
                    isCorrect: isCorrect
                }),
            });
        }
        
        currentIndex++;
        
        const progressBar = document.getElementById("quiz-progress-bar");
        if (progressBar) {
            const progress = (currentIndex / quizData.length) * 100;
            progressBar.style.width = `${progress}%`;
        }
        
        if (currentIndex >= quizData.length) {
            showResults();
        } else {
            showQuestion();
        }
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
    
    document.getElementById("quiz-area").parentElement.innerHTML = `
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
    if (typeof checkAuth === "function") checkAuth();
    fetchQuizWords();

    const flipBtn = document.getElementById("flip-card-btn");
    const flashcard = document.getElementById("main-flashcard");
    if (flipBtn && flashcard) {
        flipBtn.addEventListener("click", () => flashcard.classList.toggle("flipped"));
    }

    const btnKnown = document.getElementById("btnKnown");
    const btnUnknown = document.getElementById("btnUnknown");
    if (btnKnown) btnKnown.addEventListener("click", () => submitResult(true));
    if (btnUnknown) btnUnknown.addEventListener("click", () => submitResult(false));
});
