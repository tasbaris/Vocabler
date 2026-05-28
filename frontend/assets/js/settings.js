
document.addEventListener("DOMContentLoaded", async () => {
    
    // Kullanıcı giriş yapmamışsa Ayarlar sayfasına erişimi engelle
    const token = localStorage.getItem("vocabler_token");
    if (!token) {
        window.location.href = "login.html";
        return;
    }

    // HTML Elementlerini Yakala
    const nameInput = document.getElementById("settingsNameInput");
    const levelInput = document.getElementById("settingsLevelInput");
    const emailInput = document.getElementById("settingsEmailInput");
    const bigAvatar = document.getElementById("settingsBigAvatar");
    const nativeLangSelect = document.getElementById("nativeLanguage");
    const targetLangSelect = document.getElementById("targetLanguage");
    const goalSlider = document.getElementById("goalSlider");
    const goalValue = document.getElementById("goalValue");

    const profileForm = document.getElementById("profileForm");
    const preferencesForm = document.getElementById("preferencesForm");

    try {
        // Sayfa yüklendiğinde mevcut dilleri backend'den canlı olarak çek
        const langRes = await fetch(`${API_BASE_URL}/languages/get_active.php`);
        const langData = await langRes.json();
        
        if (langData.status === "success") {
            let options = `<option value="" disabled>${t('placeholder_select')}</option>`;
            langData.languages.forEach(lang => {
                options += `<option value="${lang.Id}">${lang.LangName}</option>`;
            });
            if (nativeLangSelect) nativeLangSelect.innerHTML = options;
            if (targetLangSelect) targetLangSelect.innerHTML = options;
        }

        // LocalStorage yerine doğrudan veritabanından güncel bilgileri talep et
        const profileRes = await fetch(`${API_BASE_URL}/user/get_user_data.php`, {
            method: "GET",
            cache: "no-store",
            headers: {
                "Authorization": `Bearer ${token}`,
                "X-Vocabler-Token": token
            }
        });

        if (handleUnauthorized(profileRes)) return;

        const profileData = await profileRes.json();

        if (profileData.status === "success") {
            const user = profileData.user;
            
            // Veritabanından gelen güncel bilgiyi yerel hafızaya da yaz (Dil senkronizasyonu için kritik)
            localStorage.setItem("vocabler_user", JSON.stringify(user));
            if (user.NativeLangCode && typeof applyLanguage === "function") {
                localStorage.setItem("vocabler_lang", user.NativeLangCode);
                applyLanguage(user.NativeLangCode);
            }

            // Veritabanından gelen Ad ve Soyadı birleştirerek tam isim oluştur
            const firstName = user.Name || "";
            const lastName = user.Surname || "";
            const fullName = `${firstName} ${lastName}`.trim() || user.UserName || "Kullanıcı";

            if (nameInput) nameInput.value = fullName;
            if (levelInput) levelInput.value = user.Level || "A1";
            if (emailInput) emailInput.value = user.Email;
            
            if (bigAvatar) {
                bigAvatar.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&size=80&background=00ADB5&color=222831`;
            }

            if (nativeLangSelect && user.NativeLangId) {
                nativeLangSelect.value = user.NativeLangId;
            }
            if (targetLangSelect && user.CurrentTargetLangId) {
                targetLangSelect.value = user.CurrentTargetLangId;
            }

            if (goalSlider && user.DailyWord) {
                goalSlider.value = user.DailyWord;
                if (goalValue) goalValue.innerText = `${user.DailyWord} ${t('label_words')}`;
            }
        }
    } catch (error) {
        console.error("Yükleme hatası:", error);
    }

    // Slider değiştiğinde anlık olarak değeri güncelle
    if (goalSlider) {
        goalSlider.addEventListener("input", () => {
            if (goalValue) {
                goalValue.innerText = `${goalSlider.value} ${t('label_words')}`;
            }
        });
    }

    // --- Kayıt İşlemleri ---

    async function updateUserData(data) {
        try {
            const res = await fetch(`${API_BASE_URL}/user/update_user.php`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify(data)
            });

            if (handleUnauthorized(res)) return;

            const result = await res.json();
            if (result.status === "success") {
                showToast(t('msg_update_success'), "success");
                
                // Sunucudan gelen tam ve güncel kullanıcı objesini sakla
                if (result.user) {
                    localStorage.setItem("vocabler_user", JSON.stringify(result.user));
                }
                
                setTimeout(() => location.reload(), 1500); 
            } else {
                showToast(t('msg_update_error') + ": " + result.message, "error");
            }
        } catch (error) {
            console.error("Güncelleme hatası:", error);
            showToast(t('msg_server_error'), "error");
        }
    }

    if (profileForm) {
        profileForm.addEventListener("submit", (e) => {
            e.preventDefault();
            const fullName = nameInput.value.trim();
            const parts = fullName.split(" ");
            const name = parts[0] || "";
            const surname = parts.slice(1).join(" ") || "";
            const email = emailInput.value.trim();
            const level = levelInput.value;
            updateUserData({ name, surname, email, level });
        });
    }

    if (preferencesForm) {
        preferencesForm.addEventListener("submit", (e) => {
            e.preventDefault();
            const data = {
                nativeLangId: nativeLangSelect.value,
                targetLangId: targetLangSelect.value,
                dailyGoal: goalSlider.value
            };
            updateUserData(data);
        });
    }

    // --- Şifre Değiştirme İşlemi ---
    const changePasswordBtn = document.getElementById("changePasswordBtn");
    if (changePasswordBtn) {
        changePasswordBtn.addEventListener("click", () => {
            const isLight = document.documentElement.classList.contains("light-theme");
            const lang = localStorage.getItem("vocabler_lang") || "tr";
            const dict = translations[lang] || translations['tr'];

            Swal.fire({
                title: dict.btn_change_password || 'Şifre Değiştir',
                html: `
                    <div class="text-start">
                        <label class="form-label small opacity-50">${dict.label_old_password || 'Eski Şifre'}</label>
                        <input type="password" id="oldPassword" class="form-control mb-3" placeholder="******">

                        <label class="form-label small opacity-50">${dict.label_new_password || 'Yeni Şifre'}</label>
                        <input type="password" id="newPassword" class="form-control mb-3" placeholder="******">

                        <label class="form-label small opacity-50">${dict.label_confirm_password || 'Yeni Şifre (Tekrar)'}</label>
                        <input type="password" id="confirmPassword" class="form-control" placeholder="******">
                    </div>
                `,
                showCancelButton: true,
                confirmButtonText: dict.btn_save || 'Kaydet',
                cancelButtonText: dict.btn_cancel || 'İptal',
                confirmButtonColor: "#00ADB5",
                background: isLight ? "#FFFFFF" : "#1E2128",
                color: isLight ? "#1E2128" : "#F9F9F9",
                preConfirm: () => {
                    const oldPassword = Swal.getPopup().querySelector('#oldPassword').value;
                    const newPassword = Swal.getPopup().querySelector('#newPassword').value;
                    const confirmPassword = Swal.getPopup().querySelector('#confirmPassword').value;

                    if (!oldPassword || !newPassword || !confirmPassword) {
                        Swal.showValidationMessage(dict.msg_fill_required || 'Lütfen tüm alanları doldurun');
                        return false;
                    }

                    if (newPassword !== confirmPassword) {
                        Swal.showValidationMessage(dict.msg_passwords_dont_match || 'Yeni şifreler eşleşmiyor');
                        return false;
                    }

                    if (newPassword.length < 6) {
                        Swal.showValidationMessage(dict.msg_password_too_short || 'Yeni şifre en az 6 karakter olmalıdır');
                        return false;
                    }

                    return { oldPassword, newPassword };
                }
            }).then(async (result) => {
                if (result.isConfirmed) {
                    try {
                        const response = await fetch(`${API_BASE_URL}/user/change_password.php`, {
                            method: "POST",
                            headers: {
                                "Content-Type": "application/json",
                                "Authorization": `Bearer ${token}`
                            },
                            body: JSON.stringify(result.value)
                        });

                        if (handleUnauthorized(response)) return;

                        const data = await response.json();
                        if (data.status === "success") {
                            showToast(data.message, "success");
                        } else {
                            showToast(data.message || 'Bir hata oluştu', "error");
                        }
                    } catch (error) {
                        console.error("Şifre değiştirme hatası:", error);
                        showToast(dict.msg_server_error || 'Sunucu hatası', "error");
                    }
                }
            });
        });
    }
    });