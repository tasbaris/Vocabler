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
let allWords = []; // Tüm kelimeleri bellekte tutmak için
let currentPage = 1;
const itemsPerPage = 10;

let currentSortColumn = 'newest';
let currentSortDirection = 'desc';

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
    const lang = localStorage.getItem("vocabler_lang") || "tr";
    const dict = translations[lang] || translations['tr'];
    sentenceList.innerHTML = `<p class="small opacity-50 text-center py-2 mb-0" id="noSentencesMsg">${dict.msg_no_sentences || 'Henüz cümle eklenmedi.'}</p>`;
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
 * Backend'den kullanıcının kelimelerini çeker ve belleğe alır
 */
async function fetchWords() {
  const token = localStorage.getItem("vocabler_token");
  
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
      allWords = result.words || [];
      renderWordsTable();
    }
  } catch (error) {
    console.error("Kelimeler yüklenirken hata:", error);
    showToast(t('msg_list_error'), "error");
  }
}

/**
 * Filtreleme ve sıralama uygulayarak tabloyu çizer
 */
function renderWordsTable() {
  const wordTableBody = document.getElementById("wordTableBody");
  const noWordsRow = document.getElementById("noWordsRow");
  if (!wordTableBody) return;

  const searchTerm = (document.getElementById("wordSearchInput")?.value || "").toLowerCase().trim();
  const filterCat = document.getElementById("filterCategory")?.value || "";
  const filterType = document.getElementById("filterType")?.value || "";
  const filterLevel = document.getElementById("filterLevel")?.value || "";

  // Filtreleme
  let filtered = allWords.filter(word => {
    const en = (word.EnglishTranslation || "").toLowerCase();
    const tr = (word.TurkishTranslation || "").toLowerCase();
    
    if (searchTerm && !en.includes(searchTerm) && !tr.includes(searchTerm)) return false;
    if (filterCat && word.CategoryId != filterCat) return false;
    if (filterType && word.WordType !== filterType) return false;
    if (filterLevel && word.Level !== filterLevel) return false;
    
    return true;
  });

  // Sıralama
  filtered.sort((a, b) => {
    let valA, valB;
    switch(currentSortColumn) {
      case 'word':
        valA = (a.EnglishTranslation || "").toLowerCase();
        valB = (b.EnglishTranslation || "").toLowerCase();
        break;
      case 'meaning':
        valA = (a.TurkishTranslation || "").toLowerCase();
        valB = (b.TurkishTranslation || "").toLowerCase();
        break;
      case 'type':
        valA = (a.WordType || "").toLowerCase();
        valB = (b.WordType || "").toLowerCase();
        break;
      case 'level':
        valA = (a.Level || "").toLowerCase();
        valB = (b.Level || "").toLowerCase();
        break;
      case 'category':
        valA = (a.CategoryName || "").toLowerCase();
        valB = (b.CategoryName || "").toLowerCase();
        break;
      case 'status':
        valA = parseInt(a.LearnRank) || 0;
        if (a.SRSStatus == 2) valA = 99;
        valB = parseInt(b.LearnRank) || 0;
        if (b.SRSStatus == 2) valB = 99;
        break;
      default: // 'newest'
        valA = a.Id;
        valB = b.Id;
        // Varsayılan sıralama en yeni üstte (Id descending)
        if (currentSortColumn === 'newest') {
            return currentSortDirection === 'desc' ? (valB - valA) : (valA - valB);
        }
        break;
    }

    if (valA < valB) return currentSortDirection === 'asc' ? -1 : 1;
    if (valA > valB) return currentSortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  // Başlık (Header) İkonlarını Güncelle
  document.querySelectorAll('.sortable-header').forEach(th => {
     const icon = th.querySelector('.sort-icon');
     if (!icon) return;
     if (th.dataset.sort === currentSortColumn) {
         icon.className = `fas fa-sort-${currentSortDirection === 'asc' ? 'up' : 'down'} ms-1 sort-icon`;
         icon.classList.remove('opacity-50');
     } else {
         icon.className = 'fas fa-sort ms-1 opacity-50 sort-icon';
     }
  });

  // Pagination Logic
  const totalItems = filtered.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  if (currentPage > totalPages) currentPage = totalPages;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedItems = filtered.slice(startIndex, startIndex + itemsPerPage);

  // UI Temizle
  wordTableBody.querySelectorAll("tr:not(#noWordsRow)").forEach((row) => row.remove());
  
  // Checkbox state sıfırla
  updateBulkDeleteState();
  const selectAllCb = document.getElementById("selectAllCheckbox");
  if (selectAllCb) selectAllCb.checked = false;

  if (paginatedItems.length > 0) {
    if (noWordsRow) noWordsRow.classList.add("d-none");

    const lang = localStorage.getItem("vocabler_lang") || "tr";
    const dict = translations[lang] || translations['tr'];

    paginatedItems.forEach((word) => {
      const tr = document.createElement("tr");
      tr.className = "align-middle word-row";

      const en = word.EnglishTranslation || "";
      const trWord = word.TurkishTranslation || "";
      const pronunciation = word.Pronunciation || "";
      const level = word.Level || "";
      const categoryName = word.CategoryName || "Genel";
      const rank = parseInt(word.LearnRank) || 0;

      const typeKey = `word_type_${(word.WordType || "").toLowerCase()}`;
      const translatedType = dict[typeKey] || word.WordType || "";

      tr.setAttribute("data-word", JSON.stringify(word));

      let rankHtml = "";
      if (word.SRSStatus == 2) {
          rankHtml = `<span class="badge bg-success px-2 py-1 shadow-sm"><i class="fas fa-graduation-cap me-1"></i>${dict.quiz_completed_title ? dict.quiz_completed_title.split(' ')[0] : 'Öğrenildi'}</span>`;
      } else {
          const progressPercent = Math.min((rank / 6) * 100, 100);
          const rankColor = rank >= 5 ? 'bg-info' : (rank >= 3 ? 'bg-warning' : 'bg-secondary');
          const stepLabel = lang === 'en' ? 'Step' : 'Adım';
          rankHtml = `
            <div class="d-flex flex-column align-items-center" style="min-width: 80px;">
                <div class="progress w-100 mb-1" style="height: 4px; background: rgba(255,255,255,0.05);">
                    <div class="progress-bar ${rankColor}" style="width: ${progressPercent}%"></div>
                </div>
                <span class="small opacity-75" style="font-size: 0.7rem;">${stepLabel} ${rank}/6</span>
            </div>
          `;
      }

      tr.innerHTML = `
        <td class="text-center">
            <input class="form-check-input word-checkbox" type="checkbox" value="${word.Id}">
        </td>
        <td>
          <div class="fw-bold text-white word-en">${en}</div>
          <div class="small opacity-50">${pronunciation}</div>
        </td>
        <td>
          <div class="text-white opacity-75 word-tr">${trWord}</div>
        </td>
        <td class="text-center">
            <span class="small text-white-50">${translatedType}</span>
        </td>
        <td class="text-center">
            <span class="badge bg-primary bg-opacity-10 text-primary border border-primary border-opacity-25 px-2 py-1">${level}</span>
        </td>
        <td class="text-center">
            <span class="small text-white-50">${categoryName}</span>
        </td>
        <td class="text-center">
            ${rankHtml}
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
  }

  renderPagination(totalPages);
}

/**
 * Sayfalama (Pagination) HTML'ini oluşturur
 */
function renderPagination(totalPages) {
  const paginationList = document.getElementById("paginationList");
  if (!paginationList) return;
  paginationList.innerHTML = '';

  if (totalPages <= 1) return; // Tek sayfa varsa gizle

  // Önceki Butonu
  const prevLi = document.createElement("li");
  prevLi.className = `page-item ${currentPage === 1 ? 'disabled' : ''}`;
  prevLi.innerHTML = `<a class="page-link border-opacity-10 bg-transparent text-white" href="#" aria-label="Previous">&laquo;</a>`;
  prevLi.onclick = (e) => {
    e.preventDefault();
    if (currentPage > 1) {
      currentPage--;
      renderWordsTable();
    }
  };
  paginationList.appendChild(prevLi);

  // Sayfa Numaraları
  for (let i = 1; i <= totalPages; i++) {
    const li = document.createElement("li");
    li.className = `page-item ${currentPage === i ? 'active' : ''}`;
    li.innerHTML = `<a class="page-link border-opacity-10 ${currentPage === i ? 'bg-primary border-primary' : 'bg-transparent text-white'}" href="#">${i}</a>`;
    li.onclick = (e) => {
      e.preventDefault();
      currentPage = i;
      renderWordsTable();
    };
    paginationList.appendChild(li);
  }

  // Sonraki Butonu
  const nextLi = document.createElement("li");
  nextLi.className = `page-item ${currentPage === totalPages ? 'disabled' : ''}`;
  nextLi.innerHTML = `<a class="page-link border-opacity-10 bg-transparent text-white" href="#" aria-label="Next">&raquo;</a>`;
  nextLi.onclick = (e) => {
    e.preventDefault();
    if (currentPage < totalPages) {
      currentPage++;
      renderWordsTable();
    }
  };
  paginationList.appendChild(nextLi);
}

/**
 * Toplu silme butonunun durumunu günceller
 */
function updateBulkDeleteState() {
  const checkboxes = document.querySelectorAll(".word-checkbox:checked");
  const count = checkboxes.length;
  const btn = document.getElementById("bulkDeleteBtn");
  const countSpan = document.getElementById("selectedCount");
  
  if(countSpan) countSpan.textContent = count;
  if(btn) {
    if (count > 0) {
      btn.removeAttribute("disabled");
    } else {
      btn.setAttribute("disabled", "true");
    }
  }
}

// Sayfa yüklendiğinde çalışacak işlemler
document.addEventListener("DOMContentLoaded", () => {
  if (typeof checkAuth === "function") checkAuth();

  fetchWords();
  fetchCategories();

  const addWordForm = document.getElementById("addWordForm");
  const formTitle = document.querySelector("#addWordForm")?.closest(".custom-card")?.querySelector("h5");
  const wordSearchInput = document.getElementById("wordSearchInput");
  const wordTableBody = document.getElementById("wordTableBody");
  const filterCategory = document.getElementById("filterCategory");
  const sortOptions = document.getElementById("sortOptions");
  const selectAllCheckbox = document.getElementById("selectAllCheckbox");
  const bulkDeleteBtn = document.getElementById("bulkDeleteBtn");

  /**
   * Kategorileri backend'den çeker ve select kutusunu doldur
   */
  async function fetchCategories() {
    const categorySelect = document.getElementById("wordCategory");
    const token = localStorage.getItem("vocabler_token");
    if (!categorySelect) return;

    try {
      const response = await fetch(`${API_BASE_URL}/categories/get_categories.php`, {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` }
      });
      const result = await response.json();
      if (response.ok && result.status === "success") {
        let options = `<option value="" selected disabled>${t('placeholder_select')}</option>`;
        let filterOptions = `<option value="">${t('filter_all_categories')}</option>`;
        result.data.forEach(cat => {
          options += `<option value="${cat.Id}">${cat.CategoryName}</option>`;
          filterOptions += `<option value="${cat.Id}">${cat.CategoryName}</option>`;
        });
        categorySelect.innerHTML = options;
        if(filterCategory) filterCategory.innerHTML = filterOptions;
      }
    } catch (error) {
      console.error("Kategoriler yüklenirken hata:", error);
    }
  }

  // Arama, Filtreleme ve Sıralama tetikleyicileri
  const filterType = document.getElementById("filterType");
  const filterLevel = document.getElementById("filterLevel");
  
  if (wordSearchInput) wordSearchInput.addEventListener("input", () => { currentPage = 1; renderWordsTable(); });
  if (filterCategory) filterCategory.addEventListener("change", () => { currentPage = 1; renderWordsTable(); });
  if (filterType) filterType.addEventListener("change", () => { currentPage = 1; renderWordsTable(); });
  if (filterLevel) filterLevel.addEventListener("change", () => { currentPage = 1; renderWordsTable(); });
  if (sortOptions) sortOptions.addEventListener("change", () => { currentPage = 1; renderWordsTable(); });

  // Sütun Başlıklarına Tıklayarak Sıralama
  document.querySelectorAll('.sortable-header').forEach(th => {
    th.addEventListener('click', () => {
      const sortCol = th.dataset.sort;
      if (currentSortColumn === sortCol) {
          currentSortDirection = currentSortDirection === 'asc' ? 'desc' : 'asc';
      } else {
          currentSortColumn = sortCol;
          currentSortDirection = 'asc';
      }
      currentPage = 1;
      renderWordsTable();
    });
  });

  // Select All Checkbox
  if (selectAllCheckbox) {
    selectAllCheckbox.addEventListener("change", (e) => {
      const isChecked = e.target.checked;
      document.querySelectorAll(".word-checkbox").forEach(cb => {
        cb.checked = isChecked;
      });
      updateBulkDeleteState();
    });
  }

  // Event Delegation for Table elements (Delete, Edit, Checkbox)
  if (wordTableBody) {
    wordTableBody.addEventListener("change", (e) => {
      if (e.target.classList.contains("word-checkbox")) {
        updateBulkDeleteState();
        
        // Eğer tüm kutular seçiliyse/değilse Select All kutusunu güncelle
        const total = document.querySelectorAll(".word-checkbox").length;
        const checked = document.querySelectorAll(".word-checkbox:checked").length;
        if (selectAllCheckbox) {
          selectAllCheckbox.checked = (total > 0 && total === checked);
        }
      }
    });

    wordTableBody.addEventListener("click", async (e) => {
      // Tekil Silme İşlemi
      if (e.target.closest(".delete-btn")) {
        const btn = e.target.closest(".delete-btn");
        const wordId = btn.getAttribute("data-id");
        const isLight = document.documentElement.classList.contains("light-theme");

        Swal.fire({
          title: t('confirm_delete_topic'),
          text: t('confirm_delete_word'),
          icon: "warning",
          showCancelButton: true,
          confirmButtonColor: "#00ADB5",
          cancelButtonColor: "#d33",
          confirmButtonText: t('btn_yes_delete'),
          cancelButtonText: t('btn_cancel'),
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
                showToast(result.message || t('msg_update_error'), "error");
              }
            } catch (err) {
              showToast(t('msg_connection_error'), "error");
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
        
        if (wordData.Sentences) {
           exampleSentences = Array.isArray(wordData.Sentences) ? wordData.Sentences : JSON.parse(wordData.Sentences);
           renderSentences();
        } else {
           exampleSentences = [];
           renderSentences();
        }

        if (formTitle) formTitle.textContent = t('modal_edit_word');
        const submitBtn = document.getElementById("submitWordBtn");
        submitBtn.innerHTML = `<i class="fas fa-save me-2"></i>${t('btn_update_save')}`;
        submitBtn.classList.replace("btn-primary", "btn-warning");

        if (!document.getElementById("cancelEditBtn")) {
          const cancelBtn = document.createElement("button");
          cancelBtn.id = "cancelEditBtn";
          cancelBtn.type = "button";
          cancelBtn.className = "btn btn-outline-light w-100 mt-2 py-2";
          cancelBtn.textContent = t('btn_cancel');
          cancelBtn.onclick = resetAddForm;
          submitBtn.after(cancelBtn);
        }

        document.querySelector(".custom-card").scrollIntoView({ behavior: "smooth" });
      }
    });
  }

  // Toplu Silme İşlemi
  if (bulkDeleteBtn) {
    bulkDeleteBtn.addEventListener("click", () => {
      const checkboxes = document.querySelectorAll(".word-checkbox:checked");
      if (checkboxes.length === 0) return;

      const isLight = document.documentElement.classList.contains("light-theme");
      Swal.fire({
        title: "Toplu Silme",
        text: `Seçili ${checkboxes.length} kelimeyi silmek istediğinize emin misiniz?`,
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#00ADB5",
        cancelButtonColor: "#d33",
        confirmButtonText: t('btn_yes_delete'),
        cancelButtonText: t('btn_cancel'),
        background: isLight ? "#FFFFFF" : "#1E2128",
        color: isLight ? "#1E2128" : "#F9F9F9",
      }).then(async (swalResult) => {
        if (swalResult.isConfirmed) {
          const token = localStorage.getItem("vocabler_token");
          
          bulkDeleteBtn.disabled = true;
          bulkDeleteBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Siliniyor...';

          try {
            const promises = Array.from(checkboxes).map(cb => {
              return fetch(`${API_BASE_URL}/words/delete_word.php`, {
                method: "POST",
                headers: {
                  Authorization: `Bearer ${token}`,
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({ wordId: cb.value }),
              }).then(res => res.json());
            });

            await Promise.all(promises);
            
            showToast(`${checkboxes.length} kelime silindi.`, "success");
            fetchWords(); // Tabloyu yenile
          } catch (err) {
            showToast(t('msg_connection_error'), "error");
          } finally {
            bulkDeleteBtn.disabled = false;
            bulkDeleteBtn.innerHTML = `<i class="fas fa-trash me-1"></i> <span data-i18n="btn_delete_selected">${t('btn_delete_selected')}</span> (<span id="selectedCount">0</span>)`;
          }
        }
      });
    });
  }

  // Örnek Cümle Ekleme Butonu
  const addSentenceBtn = document.getElementById("addSentenceBtn");
  if (addSentenceBtn) {
    addSentenceBtn.addEventListener("click", () => {
      const sentenceText = document.getElementById("sentenceText").value.trim();
      const sentenceTranslation = document.getElementById("sentenceTranslation").value.trim();

      if (!sentenceText || !sentenceTranslation) {
        showToast(t('msg_fill_required'), "warning");
        return;
      }
      exampleSentences.push({
        target: sentenceText,
        native: sentenceTranslation
      });

      document.getElementById("sentenceText").value = "";
      document.getElementById("sentenceTranslation").value = "";

      renderSentences();
    });
  }

  function resetAddForm() {
    addWordForm.reset();
    document.getElementById("wordId").value = "";
    exampleSentences = [];
    renderSentences();
    
    if (formTitle) formTitle.textContent = t('label_new_word');
    const submitBtn = document.getElementById("submitWordBtn");
    submitBtn.innerHTML = `<i class="fas fa-plus-circle me-2"></i>${t('btn_submit_word')}`;
    submitBtn.classList.replace("btn-warning", "btn-primary");
    const cancelBtn = document.getElementById("cancelEditBtn");
    if (cancelBtn) cancelBtn.remove();
  }

  if (addWordForm) {
    addWordForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      
      const wordId = document.getElementById("wordId").value;
      const submitBtn = document.getElementById("submitWordBtn");
      const originalBtnContent = submitBtn.innerHTML;

      const mainWord = document.getElementById("mainWord").value.trim();
      const targetWord = document.getElementById("targetWord").value.trim();
      const wordType = document.getElementById("wordType").value;
      const wordLevel = document.getElementById("wordLevel").value;
      const wordCategory = document.getElementById("wordCategory").value;

      if (!mainWord || !targetWord || !wordType || !wordLevel || !wordCategory) {
        showToast(t('msg_fill_required'), "warning");
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
      
      payload.append("sentences", JSON.stringify(exampleSentences));

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
          showToast(result.message || t('msg_update_error'), "error");
        }
      } catch (error) {
        showToast(t('msg_server_error'), "error");
      } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalBtnContent;
      }
    });
  }
});
