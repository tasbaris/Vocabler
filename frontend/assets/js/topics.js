/**
 * Topics (Categories) Management and Listing
 */

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

                    const isSubscribed = category.UserWordCount > 0;
                    const btnClass = isSubscribed ? "btn-success" : "btn-primary";
                    const btnText = isSubscribed ? t('btn_added') : t('btn_learn_topic');
                    const btnDisabled = isSubscribed ? "disabled" : "";
                    const btnIcon = isSubscribed ? "fa-check-circle" : "fa-plus-circle";

                    col.innerHTML = `
                        <div class="custom-card h-100 p-4 text-center position-relative">
                            <div class="topic-actions position-absolute top-0 end-0 p-2">
                                <button class="btn btn-sm btn-link opacity-50 edit-cat-btn" data-id="${category.Id}" data-name="${category.CategoryName}">
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
                            <div class="d-grid gap-2 mt-3">
                                <button class="btn ${btnClass} btn-sm rounded-pill subscribe-cat-btn" data-id="${category.Id}" ${btnDisabled}>
                                    <i class="fas ${btnIcon} me-1"></i> ${btnText}
                                </button>
                                <a href="my-words.html?category=${category.Id}" class="btn btn-outline-light btn-sm rounded-pill" data-i18n="inspect_btn">
                                    ${translations[localStorage.getItem("vocabler_lang") || "tr"].inspect_btn}
                                </a>
                            </div>
                        </div>
                    `;
                    topicsContainer.appendChild(col);
                });
            } else {
                const lang = localStorage.getItem("vocabler_lang") || "tr";
                const dict = translations[lang] || translations['tr'];
                topicsContainer.innerHTML = `
                    <div class="text-center py-5 w-100" style="grid-column: 1 / -1;">
                        <p class="opacity-50">${dict.msg_no_words_found || 'Henüz konu eklenmemiş.'}</p>
                    </div>
                `;
            }
        }
    } catch (error) {
        console.error("Kategoriler getirilirken hata oluştu:", error);
        showToast(t('msg_list_error'), "error");
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
                            showToast(res.message || t('msg_update_error'), "error");
                        }
                    } catch (err) {
                        showToast(t('msg_connection_error'), "error");
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
                                showToast(result.message || t('msg_update_error'), "error");
                            }
                        } catch (err) {
                            showToast(t('msg_connection_error'), "error");
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
                                showToast(res.message || t('msg_update_error'), "error");
                            }
                        } catch (err) {
                            showToast(t('msg_connection_error'), "error");
                        }
                    }
                });
            }

            // Kategoriye Abone Olma (Kelimeleri Havuza Ekleme)
            if (e.target.closest(".subscribe-cat-btn")) {
                const btn = e.target.closest(".subscribe-cat-btn");
                const id = btn.getAttribute("data-id");
                const token = localStorage.getItem("vocabler_token");

                // Butonu yükleniyor durumuna getir
                const originalHtml = btn.innerHTML;
                btn.disabled = true;
                btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';

                try {
                    const response = await fetch(`${API_BASE_URL}/categories/subscribe.php`, {
                        method: "POST",
                        headers: {
                            Authorization: `Bearer ${token}`,
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify({ categoryId: id }),
                    });

                    const res = await response.json();
                    if (response.ok && res.status === "success") {
                        showToast(res.message, "success");
                        btn.innerHTML = `<i class="fas fa-check-circle me-1"></i> ${t('btn_added')}`;
                        btn.classList.replace("btn-primary", "btn-success");
                        btn.disabled = true;
                    } else {
                        showToast(res.message || t('msg_update_error'), "error");
                        btn.disabled = false;
                        btn.innerHTML = originalHtml;
                    }
                } catch (err) {
                    showToast(t('msg_server_error'), "error");
                    btn.disabled = false;
                    btn.innerHTML = originalHtml;
                }
            }
        });
    }
});
