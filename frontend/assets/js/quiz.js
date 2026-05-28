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
            fetch(`${API_BASE_URL}/quiz/get_questions.php`, { 
                headers: { 
                    "Authorization": `Bearer ${token}`,
                    "X-Vocabler-Token": token 
                } 
            }),
            fetch(`${API_BASE_URL}/words/get_words.php`, { 
                headers: { 
                    "Authorization": `Bearer ${token}`,
                    "X-Vocabler-Token": token 
                } 
            })
        ]);

        if (handleUnauthorized(quizRes)) return;
        if (handleUnauthorized(wordsRes)) return;

        const quizResult = await quizRes.json();
        const wordsResult = await wordsRes.json();

        if (quizRes.ok) {
            if (quizResult.status === "quota_reached") {
                showQuotaReachedState(quizResult);
                return;
            }

            if (quizResult.status === "success") {
                quizData = quizResult.data;
                if (quizData && quizData.length > 0) {
                    const totalWords = wordsResult.words ? wordsResult.words.length : 0;
                    document.getElementById("total-questions-num").textContent = quizData.length;
                    document.getElementById("total-words-count").textContent = totalWords;
                    
                    // Başlangıç ekranını güncelle
                    const labelQuizQ = t('label_quiz_question');
                    const labelTotalWords = t('label_total_words');
                    document.getElementById("quiz-info-text").innerHTML = `
                        <div class="d-flex justify-content-center gap-4">
                            <span><strong>${labelQuizQ}:</strong> ${quizData.length}</span>
                            <span><strong>${labelTotalWords}:</strong> ${totalWords}</span>
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
            }
        } else {
            // Hata durumunda (örn: 500 Server Error)
            console.error("Quiz verisi alınamadı:", quizResult.message);
            showEmptyState();
        }
    } catch (error) {
        console.error("Veri yüklenirken hata:", error);
        Swal.fire(t('msg_error'), t('msg_server_error'), "error");
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
        'Matching': t('qtype_matching'),
        'Flashcard': t('qtype_flashcard')
    };
    const qType = qTypes[question.QuestionType] || question.QuestionType;
    document.getElementById("front-type-level").textContent = `${qType} | ${question.Level || 'N/A'}`;
    
    // Seçenekleri oluştur
    const optionsContainer = document.createElement("div");
    optionsContainer.className = "d-grid gap-2 mt-4 w-100 options-container";
    
    const container = document.querySelector(".flashcard-container");
    const flashcardControls = document.getElementById("flashcard-controls");
    const mcHintArea = document.getElementById("mc-hint-area");

    if (question.QuestionType === 'Multiple Choice' && question.Options) {
        container.classList.add("multiple-choice-mode");
        if (flashcardControls) flashcardControls.classList.add("d-none");
        
        // Örnek cümle varsa ipucu olarak göster (kelimeyi maskele)
        if (question.Explanation && mcHintArea) {
            mcHintArea.classList.remove("d-none");
            const hintSentence = document.getElementById("hint-sentence");
            
            // Kelimeyi cümlede bulup maskele (____)
            // Backend'den gelen veriye göre: 
            // Eğer QuestionText'te boşluk varsa o bir cümledir/anlamdır, CorrectAnswer kelimedir.
            // Eğer yoksa QuestionText kelimedir.
            // Ama biz her zaman TargetWord'ü maskelemek istiyoruz.
            // get_questions.php'de CorrectAnswer her zaman TargetWord veya NativeWord.
            // Kelimeyi bulmak için hem QuestionText hem CorrectAnswer'ı deneyebiliriz.
            
            let maskedSentence = question.Explanation;
            [question.QuestionText, question.CorrectAnswer].forEach(term => {
                if (term && !term.includes(' ')) {
                    const pattern = new RegExp("\\b" + term + "\\b", "gi");
                    maskedSentence = maskedSentence.replace(pattern, "____");
                }
            });
            
            hintSentence.textContent = maskedSentence;
        } else if (mcHintArea) {
            mcHintArea.classList.add("d-none");
        }
        
        // Şıklar: A, B, C, D...
        const labels = ['a', 'b', 'c', 'd', 'e', 'f'];
        
        // Ensure options is an array
        const options = Array.isArray(question.Options) ? question.Options : Object.values(question.Options);

        options.forEach((value, i) => {
            const btn = document.createElement("button");
            btn.className = "btn btn-outline-light text-start p-3 rounded-3 option-btn d-flex align-items-center";
            btn.innerHTML = `<span class="fw-bold me-3 border border-secondary rounded px-2">${labels[i].toUpperCase()}</span> <span>${value}</span>`;
            btn.onclick = (e) => {
                e.stopPropagation();
                handleOptionClick(btn, value, question.CorrectAnswer);
            };
            optionsContainer.appendChild(btn);
        });
    } else {
        container.classList.remove("multiple-choice-mode");
        if (flashcardControls) flashcardControls.classList.remove("d-none");
        if (mcHintArea) mcHintArea.classList.add("d-none");
        
        document.getElementById("back-word").textContent = question.CorrectAnswer;
        document.getElementById("back-sentence").textContent = question.Explanation || "";
        document.getElementById("back-translation").textContent = question.SampleTranslation || "";
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
                    "X-Vocabler-Token": token,
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
            const flashcard = document.getElementById("main-flashcard");
            if (flashcard && flashcard.classList.contains("flipped")) {
                flashcard.classList.remove("flipped");
                // Animasyonun (0.6s) yarısında veya tamamında içeriği değiştir
                setTimeout(() => {
                    showQuestion();
                }, 300);
            } else {
                showQuestion();
            }
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
            <p class="opacity-50 mb-4">${dict.quiz_empty_text || 'Şu an gözden geçirilecek kelimen kalmadı.'}</p>
            <a href="topics.html" class="btn btn-primary px-5 rounded-pill d-flex align-items-center justify-content-center mx-auto" style="max-width: fit-content;">${dict.feature_topics_title || 'Konular'}</a>
        </div>
    `;
}

/**
 * Günlük kota dolduğunda gösterilecek ekran
 */
function showQuotaReachedState(data) {
    const lang = localStorage.getItem("vocabler_lang") || "tr";
    const dict = translations[lang] || translations['tr'];
    
    document.getElementById("quiz-area").parentElement.innerHTML = `
        <div class="text-center py-5">
            <div class="mb-4">
                <i class="fas fa-trophy fa-5x text-warning mb-3"></i>
                <h2 class="fw-bold">${dict.quiz_quota_reached_title}</h2>
                <p class="opacity-50">${dict.quiz_quota_reached_text}</p>
            </div>
            
            <div class="card bg-dark bg-opacity-25 border border-secondary border-opacity-25 rounded-4 p-4 mx-auto mb-4" style="max-width: 400px;">
                <div class="small text-uppercase fw-bold opacity-50 mb-3">${dict.label_next_quiz}</div>
                <div id="countdown-timer" class="display-5 fw-bold font-monospace text-primary">
                    00:00:00
                </div>
            </div>

            <div class="d-flex justify-content-center gap-3">
                <a href="dashboard.html" class="btn btn-outline-light px-4 rounded-pill d-flex align-items-center justify-content-center">${dict.quiz_back_home}</a>
                <a href="topics.html" class="btn btn-primary px-4 rounded-pill d-flex align-items-center justify-content-center">${dict.feature_topics_title}</a>
            </div>
        </div>
    `;

    // Geri sayım başlat
    let h = data.countdown.hours;
    let m = data.countdown.minutes;
    let s = data.countdown.seconds;

    const timerEl = document.getElementById("countdown-timer");
    
    const updateTimer = () => {
        if (s > 0) s--;
        else {
            if (m > 0) { m--; s = 59; }
            else {
                if (h > 0) { h--; m = 59; s = 59; }
                else {
                    clearInterval(timerInterval);
                    location.reload();
                    return;
                }
            }
        }
        timerEl.textContent = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    };

    const timerInterval = setInterval(updateTimer, 1000);
    updateTimer();
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
