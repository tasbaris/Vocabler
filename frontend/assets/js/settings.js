
document.addEventListener("DOMContentLoaded", async () => {
    
    // Kullanıcı giriş yapmamışsa Ayarlar sayfasına erişimi engelle
    const token = localStorage.getItem("vocabler_token");
    if (!token) {
        window.location.href = "login.html";
        return;
    }

    // HTML Elementlerini Yakala
    const nameInput = document.getElementById("settingsNameInput");
    const emailInput = document.getElementById("settingsEmailInput");
    const bigAvatar = document.getElementById("settingsBigAvatar");
    const nativeLangSelect = document.getElementById("nativeLanguage");
    const targetLangSelect = document.getElementById("targetLanguage");
    const goalSlider = document.getElementById("goalSlider");
    const goalValue = document.getElementById("goalValue");

    try {
        // Sayfa yüklendiğinde mevcut dilleri backend'den canlı olarak çek
        const langRes = await fetch(`${API_BASE_URL}/languages/get_active.php`);
        const langData = await langRes.json();
        
        if (langData.status === "success") {
            let options = '<option value="" disabled>Seçiniz</option>';
            langData.languages.forEach(lang => {
                options += `<option value="${lang.Id}">${lang.LangName}</option>`;
            });
            if (nativeLangSelect) nativeLangSelect.innerHTML = options;
            if (targetLangSelect) targetLangSelect.innerHTML = options;
        }

        // LocalStorage yerine doğrudan veritabanından güncel bilgileri talep et
        const profileRes = await fetch(`${API_BASE_URL}/user/get_user_data.php`, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}` // JWT Güvenlik biletini Header içine ekle
            }
        });
        const profileData = await profileRes.json();

        if (profileData.status === "success") {
            const user = profileData.user;
            
            // Veritabanından gelen Ad ve Soyadı birleştirerek tam isim oluştur
            const firstName = user.Name || "";
            const lastName = user.Surname || "";
            const fullName = `${firstName} ${lastName}`.trim() || user.UserName || "Kullanıcı";

            // Gelen taze verileri inputların içine yerleştir (Kullanıcı bunları güncelleyebilir)
            if (nameInput) nameInput.value = fullName;
            if (emailInput) emailInput.value = user.Email;
            
            // Büyük profil fotoğrafını kullanıcı ismine göre oluştur
            if (bigAvatar) {
                bigAvatar.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&size=80&background=00ADB5&color=222831`;
            }

            // Seçim kutularını (Select) kullanıcının mevcut tercihlerine göre otomatik ayarla
            if (nativeLangSelect && user.NativeLangId) {
                nativeLangSelect.value = user.NativeLangId;
            }
            if (targetLangSelect && user.CurrentTargetLangId) {
                targetLangSelect.value = user.CurrentTargetLangId;
            }

            // Günlük kelime hedefi kaydırıcısını veritabanındaki değere konumlandır
            if (goalSlider && user.DailyWord) {
                goalSlider.value = user.DailyWord;
                if (goalValue) goalValue.innerText = `${user.DailyWord} Kelime`;
            }
        } else {
            console.error("Profil çekilemedi:", profileData.message);
        }

    } catch (error) {
        console.error("Sunucuya bağlanırken hata oluştu:", error);
    }
});