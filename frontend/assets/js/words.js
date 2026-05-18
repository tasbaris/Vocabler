/**
 * Ortak Bildirim Fonksiyonu (SweetAlert2 tabanlı)
 */
function showToast(message, type = "success") {
  const isLight = document.documentElement.classList.contains("light-theme");
  const Toast = Swal.mixin({
    toast: true,
    position: "top-end",
    showConfirmButton: false,
    timer: 3000,
    timerProgressBar: true,
    background: isLight ? "#FFFFFF" : "#1E2128",
    color: isLight ? "#1E2128" : "#F9F9F9",
    didOpen: (toast) => {
      toast.addEventListener("mouseenter", Swal.stopTimer);
      toast.addEventListener("mouseleave", Swal.resumeTimer);
    },
  });

  Toast.fire({
    icon: type,
    title: message,
  });
}

// Örnek cümleleri tutacak yerel dizi
let exampleSentences = [];

/**
 * Örnek cümleleri UI üzerinde listeler
 */
function renderSentences() {
  const sentenceList = document.getElementById("sentenceList");
  const noSentencesMsg = document.getElementById("noSentencesMsg");
  
  if (!sentenceList) return;

  // Temizle (mesaj hariç)
  sentenceList.innerHTML = '';
  
  if (exampleSentences.length === 0) {
    sentenceList.innerHTML = '<p class="small opacity-50 text-center py-2 mb-0" id="noSentencesMsg">Henüz cümle eklenmedi.</p>';
    return;
  }

  exampleSentences.forEach((s, index) => {
    const div = document.createElement("div");
    div.className = "sentence-item d-flex justify-content-between align-items-start mb-2 p-2 rounded bg-white bg-opacity-5 border border-white border-opacity-10";
    div.innerHTML = `
      <div class="flex-grow-1 me-2">
        <div class="small fw-bold text-accent">${s.target}</div>
        <div class="small opacity-75 italic">${s.native}</div>
      </div>
      <button type="button" class="btn btn-link text-danger p-0 ms-2 remove-sentence-btn" data-index="${index}">
        <i class="fas fa-times-circle"></i>
      </button>
    `;
    sentenceList.appendChild(div);
  });

  // Silme butonları için event listener
  document.querySelectorAll(".remove-sentence-btn").forEach(btn => {
    btn.addEventListener("click", (e) => {
      const idx = e.currentTarget.getAttribute("data-index");
      exampleSentences.splice(idx, 1);
      renderSentences();
    });
  });
}

/**
 * Backend'den kullanıcının kelimelerini çeker ve tabloyu günceller
 */
async function fetchWords() {
  const wordTableBody = document.getElementById("wordTableBody");
  const noWordsRow = document.getElementById("noWordsRow");
  const token = localStorage.getItem("vocabler_token");

  if (!wordTableBody) return;

  // URL'den kategori filtresini kontrol et
  const urlParams = new URLSearchParams(window.location.search);
  const categoryId = urlParams.get("category");
  let apiUrl = `${API_BASE_URL}/words/get_words.php`;
  if (categoryId) {
    apiUrl += `?category=${categoryId}`;
  }

  try {
    const response = await fetch(apiUrl, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    const result = await response.json();

    if (response.ok && result.status === "success") {
      const words = result.words;

      if (words && words.length > 0) {
        if (noWordsRow) noWordsRow.classList.add("d-none");

        wordTableBody
          .querySelectorAll("tr:not(#noWordsRow)")
          .forEach((row) => row.remove());

        words.forEach((word) => {
          const tr = document.createElement("tr");
          tr.className = "align-middle word-row";

          // Filtreleme için anahtar kelimeleri data-search içine ekle
          tr.setAttribute("data-english", word.EnglishTranslation.toLowerCase());
          tr.setAttribute("data-turkish", word.TurkishTranslation.toLowerCase());

          // Düzenleme için tüm veriyi sakla (data-word-json)
          tr.setAttribute("data-word", JSON.stringify(word));

          const en = word.EnglishTranslation || "";
          const trWord = word.TurkishTranslation || "";
          const pronunciation = word.Pronunciation || "";
          const type = word.WordType || "";
          const level = word.Level || "";

          tr.innerHTML = `
            <td>
              <div class="fw-bold text-white word-en">${en}</div>
              <div class="small opacity-50">${pronunciation}</div>
            </td>
            <td>
              <div class="text-white opacity-75 word-tr">${trWord}</div>
            </td>
            <td class="text-center">
              <span class="badge bg-primary bg-opacity-10 text-primary border border-primary border-opacity-25 px-2 py-1">
                ${type} / ${level}
              </span>
            </td>
            <td class="text-end">
              <div class="d-flex justify-content-end gap-2">
                <button class="btn btn-sm btn-outline-light border-opacity-10 edit-btn" title="Düzenle" data-id="${word.Id}">
                  <i class="fas fa-edit fa-xs"></i>
                </button>
                <button class="btn btn-sm btn-outline-danger border-opacity-10 delete-btn" title="Sil" data-id="${word.Id}">
                  <i class="fas fa-trash fa-xs"></i>
                </button>
              </div>
            </td>
          `;

          wordTableBody.appendChild(tr);
        });
      } else {
        if (noWordsRow) noWordsRow.classList.remove("d-none");
        wordTableBody
          .querySelectorAll("tr:not(#noWordsRow)")
          .forEach((row) => row.remove());
      }
    }
  } catch (error) {
    console.error("Kelimeler getirilirken hata oluştu:", error);
    showToast("Kelimeler listelenirken bir hata oluştu.", "error");
  }
}

// Sayfa yüklendiğinde çalışacak işlemler
document.addEventListener("DOMContentLoaded", () => {
  if (typeof checkAuth === "function") checkAuth();

  fetchWords();

  const addWordForm = document.getElementById("addWordForm");
  const formTitle = document.querySelector("#addWordForm")?.closest(".custom-card")?.querySelector("h5");
  const wordSearchInput = document.getElementById("wordSearchInput");
  const wordTableBody = document.getElementById("wordTableBody");

  // Örnek Cümle Ekleme Butonu
  const addSentenceBtn = document.getElementById("addSentenceBtn");
  if (addSentenceBtn) {
    addSentenceBtn.addEventListener("click", () => {
      const sentenceText = document.getElementById("sentenceText").value.trim();
      const sentenceTranslation = document.getElementById("sentenceTranslation").value.trim();

      if (!sentenceText || !sentenceTranslation) {
        showToast("Lütfen her iki alanı da doldurun.", "warning");
        return;
      }

      exampleSentences.push({
        target: sentenceText,
        native: sentenceTranslation
      });

      // İnputları temizle
      document.getElementById("sentenceText").value = "";
      document.getElementById("sentenceTranslation").value = "";

      renderSentences();
    });
  }

  // 1. ARAMA / FİLTRELEME
  if (wordSearchInput) {
    wordSearchInput.addEventListener("input", (e) => {
      const searchTerm = e.target.value.toLowerCase().trim();
      const rows = document.querySelectorAll(".word-row");
      let hasVisibleRow = false;

      rows.forEach((row) => {
        const en = row.getAttribute("data-english");
        const tr = row.getAttribute("data-turkish");

        if (en.includes(searchTerm) || tr.includes(searchTerm)) {
          row.classList.remove("d-none");
          hasVisibleRow = true;
        } else {
          row.classList.add("d-none");
        }
      });

      const noWordsRow = document.getElementById("noWordsRow");
      if (!hasVisibleRow) {
        noWordsRow.classList.remove("d-none");
      } else {
        noWordsRow.classList.add("d-none");
      }
    });
  }

  // 2. KELİME SİLME VE GÜNCELLEME (EVENT DELEGATION)
  if (wordTableBody) {
    wordTableBody.addEventListener("click", async (e) => {
      // Silme İşlemi
      if (e.target.closest(".delete-btn")) {
        const btn = e.target.closest(".delete-btn");
        const wordId = btn.getAttribute("data-id");
        const isLight = document.documentElement.classList.contains("light-theme");

        Swal.fire({
          title: "Emin misiniz?",
          text: "Bu kelimeyi silmek istediğinize emin misiniz? Bu işlem geri alınamaz.",
          icon: "warning",
          showCancelButton: true,
          confirmButtonColor: "#00ADB5",
          cancelButtonColor: "#d33",
          confirmButtonText: "Evet, Sil!",
          cancelButtonText: "Vazgeç",
          background: isLight ? "#FFFFFF" : "#1E2128",
          color: isLight ? "#1E2128" : "#F9F9F9",
        }).then(async (swalResult) => {
          if (swalResult.isConfirmed) {
            const token = localStorage.getItem("vocabler_token");
            try {
              const response = await fetch(`${API_BASE_URL}/words/delete_word.php`, {
                method: "POST",
                headers: {
                  Authorization: `Bearer ${token}`,
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({ wordId: wordId }),
              });

              const result = await response.json();
              if (response.ok && result.status === "success") {
                showToast(result.message, "success");
                fetchWords();
              } else {
                showToast(result.message || "Silme işlemi başarısız.", "error");
              }
            } catch (err) {
              showToast("Bağlantı hatası.", "error");
            }
          }
        });
      }

      // Güncelleme Moduna Geçiş
      if (e.target.closest(".edit-btn")) {
        const btn = e.target.closest(".edit-btn");
        const row = btn.closest(".word-row");
        const wordData = JSON.parse(row.getAttribute("data-word"));

        // Formu doldur
        document.getElementById("wordId").value = wordData.Id;
        document.getElementById("mainWord").value = wordData.EnglishTranslation;
        document.getElementById("targetWord").value = wordData.TurkishTranslation;
        document.getElementById("wordType").value = wordData.WordType;
        document.getElementById("wordLevel").value = wordData.Level;
        document.getElementById("wordCategory").value = wordData.CategoryId;
        document.getElementById("wordPronunciation").value = wordData.Pronunciation || "";
        document.getElementById("wordPicture").value = "";
        
        // Örnek cümleler varsa doldur (Backend'den geliyorsa)
        if (wordData.Sentences) {
           exampleSentences = Array.isArray(wordData.Sentences) ? wordData.Sentences : JSON.parse(wordData.Sentences);
           renderSentences();
        } else {
           exampleSentences = [];
           renderSentences();
        }

        // UI Güncelle
        if (formTitle) formTitle.textContent = "Kelimeyi Güncelle";
        const submitBtn = document.getElementById("submitWordBtn");
        submitBtn.innerHTML = '<i class="fas fa-save me-2"></i>Güncelle ve Kaydet';
        submitBtn.classList.replace("btn-primary", "btn-warning");

        // Vazgeç butonu ekle
        if (!document.getElementById("cancelEditBtn")) {
          const cancelBtn = document.createElement("button");
          cancelBtn.id = "cancelEditBtn";
          cancelBtn.type = "button";
          cancelBtn.className = "btn btn-outline-light w-100 mt-2 py-2";
          cancelBtn.textContent = "Vazgeç";
          cancelBtn.onclick = resetAddForm;
          submitBtn.after(cancelBtn);
        }

        document.querySelector(".custom-card").scrollIntoView({ behavior: "smooth" });
      }
    });
  }

  // 3. FORM RESET FONKSİYONU
  function resetAddForm() {
    addWordForm.reset();
    document.getElementById("wordId").value = "";
    exampleSentences = [];
    renderSentences();
    
    if (formTitle) formTitle.textContent = "Yeni Kelime Ekle";
    const submitBtn = document.getElementById("submitWordBtn");
    submitBtn.innerHTML = '<i class="fas fa-plus-circle me-2"></i>Listeme Ekle';
    submitBtn.classList.replace("btn-warning", "btn-primary");
    const cancelBtn = document.getElementById("cancelEditBtn");
    if (cancelBtn) cancelBtn.remove();
  }

  // 4. FORM SUBMIT (EKLE VEYA GÜNCELLE)
  if (addWordForm) {
    addWordForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      
      const wordId = document.getElementById("wordId").value;
      const submitBtn = document.getElementById("submitWordBtn");
      const originalBtnContent = submitBtn.innerHTML;

      // Zorunlu alanların kontrolü
      const mainWord = document.getElementById("mainWord").value.trim();
      const targetWord = document.getElementById("targetWord").value.trim();
      const wordType = document.getElementById("wordType").value;
      const wordLevel = document.getElementById("wordLevel").value;
      const wordCategory = document.getElementById("wordCategory").value;

      if (!mainWord || !targetWord || !wordType || !wordLevel || !wordCategory) {
        showToast("Lütfen tüm zorunlu alanları doldurun.", "warning");
        return;
      }

      submitBtn.disabled = true;
      submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>İşlem yapılıyor...';

      const payload = new FormData();
      payload.append("mainWord", mainWord);
      payload.append("targetWord", targetWord);
      payload.append("wordType", wordType);
      payload.append("wordLevel", wordLevel);
      payload.append("wordCategory", wordCategory);
      payload.append("wordPronunciation", document.getElementById("wordPronunciation").value.trim());
      
      // Cümleleri JSON formatında ekle (Gelecek hazırlığı)
      payload.append("sentences", JSON.stringify(exampleSentences));

      // Backend şu an sadece tek cümle desteklediği için ilk cümleyi özel alanlarda gönder
      if (exampleSentences.length > 0) {
        payload.append("wordSentence", exampleSentences[0].target);
        payload.append("wordSentenceTurkish", exampleSentences[0].native);
      } else {
        payload.append("wordSentence", "");
        payload.append("wordSentenceTurkish", "");
      }

      const pictureFile = document.getElementById("wordPicture").files[0];
      if (pictureFile) payload.append("wordPicture", pictureFile);

      let apiUrl = `${API_BASE_URL}/words/add_word.php`;
      if (wordId) {
        payload.append("wordId", wordId);
        apiUrl = `${API_BASE_URL}/words/update_word.php`;
      }

      const token = localStorage.getItem("vocabler_token");
      try {
        const response = await fetch(apiUrl, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: payload,
        });

        const result = await response.json();
        if (response.ok && result.status === "success") {
          showToast(result.message, "success");
          resetAddForm();
          fetchWords();
        } else {
          showToast(result.message || "Bir hata oluştu.", "error");
        }
      } catch (error) {
        showToast("Sunucu hatası.", "error");
      } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalBtnContent;
      }
    });
  }
});
