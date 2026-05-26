
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
            updateUserData({ name, surname });
        });
    }

    if (preferencesForm) {
        preferencesForm.addEventListener("submit", (e) => {
            e.preventDefault();
            const data = {
                nativeLangId: nativeLangSelect.value,
                targetLangId: targetLangSelect.value,
                dailyWord: goalSlider.value
            };
            updateUserData(data);
        });
    }
});