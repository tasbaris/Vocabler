/**
 * Topics (Categories) Management and Listing
 */

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

/**
 * Backend'den kategorileri çeker ve grid yapısını günceller
 */
async function fetchCategories() {
    const topicsContainer = document.getElementById("topicsContainer");
    const token = localStorage.getItem("vocabler_token");

    if (!topicsContainer) return;

    try {
        const response = await fetch(`${API_BASE_URL}/categories/get_categories.php`, {
            method: "GET",
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
            },
        });

        const result = await response.json();

        if (response.ok && result.status === "success") {
            const categories = result.data;
            topicsContainer.innerHTML = ""; // Yükleniyor yazısını temizle

            if (categories && categories.length > 0) {
                categories.forEach((category) => {
                    const col = document.createElement("div");
                    col.className = "topic-card-wrapper";
                    
                    // Rastgele bir ikon seçimi (Görsellik için)
                    const icons = ["fa-language", "fa-book", "fa-graduation-cap", "fa-brain", "fa-globe", "fa-lightbulb"];
                    const randomIcon = icons[category.Id % icons.length];

                    col.innerHTML = `
                        <div class="custom-card h-100 p-4 text-center position-relative">
                            <div class="topic-actions position-absolute top-0 end-0 p-2">
                                <button class="btn btn-sm btn-link text-white-50 edit-cat-btn" data-id="${category.Id}" data-name="${category.CategoryName}">
                                    <i class="fas fa-edit"></i>
                                </button>
                                <button class="btn btn-sm btn-link text-danger delete-cat-btn" data-id="${category.Id}">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </div>
                            <div class="mb-3 fs-1" style="color: var(--accent);">
                                <i class="fas ${randomIcon}"></i>
                            </div>
                            <h4 class="fw-bold mb-2">${category.CategoryName}</h4>
                            <a href="my-words.html?category=${category.Id}" class="btn btn-outline-primary btn-sm rounded-pill px-4 mt-2" data-i18n="inspect_btn">
                                ${translations[localStorage.getItem("vocabler_lang") || "tr"].inspect_btn}
                            </a>
                        </div>
                    `;
                    topicsContainer.appendChild(col);
                });
            } else {
                topicsContainer.innerHTML = `
                    <div class="text-center py-5 w-100" style="grid-column: 1 / -1;">
                        <p class="text-muted">Henüz konu eklenmemiş.</p>
                    </div>
                `;
            }
        }
    } catch (error) {
        console.error("Kategoriler getirilirken hata oluştu:", error);
        showToast("Konular listelenirken bir hata oluştu.", "error");
    }
}

document.addEventListener("DOMContentLoaded", () => {
    if (typeof checkAuth === "function") checkAuth();

    fetchCategories();

    const addTopicBtn = document.getElementById("addTopicBtn");
    const topicsContainer = document.getElementById("topicsContainer");

    // 1. KATEGORİ EKLEME (SweetAlert2 Modal ile)
    if (addTopicBtn) {
        addTopicBtn.addEventListener("click", () => {
            const isLight = document.documentElement.classList.contains("light-theme");
            Swal.fire({
                title: translations[localStorage.getItem("vocabler_lang") || "tr"].modal_add_topic,
                input: 'text',
                inputLabel: translations[localStorage.getItem("vocabler_lang") || "tr"].label_topic_name,
                showCancelButton: true,
                confirmButtonText: translations[localStorage.getItem("vocabler_lang") || "tr"].btn_save,
                cancelButtonText: translations[localStorage.getItem("vocabler_lang") || "tr"].btn_cancel,
                confirmButtonColor: "#00ADB5",
                background: isLight ? "#FFFFFF" : "#1E2128",
                color: isLight ? "#1E2128" : "#F9F9F9",
                inputValidator: (value) => {
                    if (!value) {
                        return 'Konu adı boş olamaz!';
                    }
                }
            }).then(async (result) => {
                if (result.isConfirmed) {
                    const token = localStorage.getItem("vocabler_token");
                    try {
                        const response = await fetch(`${API_BASE_URL}/categories/add_category.php`, {
                            method: "POST",
                            headers: {
                                Authorization: `Bearer ${token}`,
                                "Content-Type": "application/json",
                            },
                            body: JSON.stringify({ categoryName: result.value }),
                        });

                        const res = await response.json();
                        if (response.ok && res.status === "success") {
                            showToast(res.message, "success");
                            fetchCategories();
                        } else {
                            showToast(res.message || "Ekleme hatası.", "error");
                        }
                    } catch (err) {
                        showToast("Bağlantı hatası.", "error");
                    }
                }
            });
        });
    }

    // 2. KATEGORİ SİLME VE GÜNCELLEME (Event Delegation)
    if (topicsContainer) {
        topicsContainer.addEventListener("click", async (e) => {
            const isLight = document.documentElement.classList.contains("light-theme");
            const lang = localStorage.getItem("vocabler_lang") || "tr";

            // Silme
            if (e.target.closest(".delete-cat-btn")) {
                const btn = e.target.closest(".delete-cat-btn");
                const id = btn.getAttribute("data-id");

                Swal.fire({
                    title: "Emin misiniz?",
                    text: translations[lang].confirm_delete_topic,
                    icon: "warning",
                    showCancelButton: true,
                    confirmButtonColor: "#00ADB5",
                    cancelButtonColor: "#d33",
                    confirmButtonText: "Evet, Sil!",
                    cancelButtonText: translations[lang].btn_cancel,
                    background: isLight ? "#FFFFFF" : "#1E2128",
                    color: isLight ? "#1E2128" : "#F9F9F9",
                }).then(async (swalResult) => {
                    if (swalResult.isConfirmed) {
                        const token = localStorage.getItem("vocabler_token");
                        try {
                            const response = await fetch(`${API_BASE_URL}/categories/delete_category.php`, {
                                method: "POST",
                                headers: {
                                    Authorization: `Bearer ${token}`,
                                    "Content-Type": "application/json",
                                },
                                body: JSON.stringify({ id: id }),
                            });

                            const result = await response.json();
                            if (response.ok && result.status === "success") {
                                showToast(result.message, "success");
                                fetchCategories();
                            } else {
                                showToast(result.message || "Silme başarısız.", "error");
                            }
                        } catch (err) {
                            showToast("Bağlantı hatası.", "error");
                        }
                    }
                });
            }

            // Güncelleme
            if (e.target.closest(".edit-cat-btn")) {
                const btn = e.target.closest(".edit-cat-btn");
                const id = btn.getAttribute("data-id");
                const oldName = btn.getAttribute("data-name");

                Swal.fire({
                    title: translations[lang].modal_edit_topic,
                    input: 'text',
                    inputValue: oldName,
                    inputLabel: translations[lang].label_topic_name,
                    showCancelButton: true,
                    confirmButtonText: translations[lang].btn_save,
                    cancelButtonText: translations[lang].btn_cancel,
                    confirmButtonColor: "#00ADB5",
                    background: isLight ? "#FFFFFF" : "#1E2128",
                    color: isLight ? "#1E2128" : "#F9F9F9",
                    inputValidator: (value) => {
                        if (!value) {
                            return 'Konu adı boş olamaz!';
                        }
                    }
                }).then(async (result) => {
                    if (result.isConfirmed) {
                        const token = localStorage.getItem("vocabler_token");
                        try {
                            const response = await fetch(`${API_BASE_URL}/categories/update_category.php`, {
                                method: "POST",
                                headers: {
                                    Authorization: `Bearer ${token}`,
                                    "Content-Type": "application/json",
                                },
                                body: JSON.stringify({ id: id, categoryName: result.value }),
                            });

                            const res = await response.json();
                            if (response.ok && res.status === "success") {
                                showToast(res.message, "success");
                                fetchCategories();
                            } else {
                                showToast(res.message || "Güncelleme hatası.", "error");
                            }
                        } catch (err) {
                            showToast("Bağlantı hatası.", "error");
                        }
                    }
                });
            }
        });
    }
});
