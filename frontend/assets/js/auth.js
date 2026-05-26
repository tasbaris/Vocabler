
// Tüm API istekleri için kullanılacak ana sunucu adresi (Global değişken)
const API_BASE_URL = "http://localhost:8080";  

// DOMContentLoaded: Sayfa iskeleti tamamen yüklendikten sonra işlemlere başla
document.addEventListener("DOMContentLoaded", () => {
  
  // 1. Dilleri Veritabanından Çekme
  const nativeLangSelect = document.getElementById("nativeLanguage");
  const targetLangSelect = document.getElementById("targetLanguage");

  if (nativeLangSelect || targetLangSelect) {
    fetch(`${API_BASE_URL}/languages/get_active.php`)
      .then((res) => res.json())
      .then((data) => {
        if (data.status === "success") {
          let options = `<option value="" disabled selected>${t('placeholder_select')}</option>`;
          data.languages.forEach((lang) => {
            options += `<option value="${lang.Id}" data-code="${lang.LangCode}">${lang.LangName}</option>`;
          });
          if (nativeLangSelect) nativeLangSelect.innerHTML = options;
          if (targetLangSelect) targetLangSelect.innerHTML = options;
        }
      })
      .catch((err) => console.error("Diller yuklenirken hata olustu:", err));
  }

  // 2. KULLANICI GİRİŞ (LOGIN) İŞLEMLERİ
  const loginForm = document.getElementById("loginForm");
  if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const submitBtn = document.getElementById("loginBtn");
      const originalBtnText = submitBtn.innerHTML;
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Giriş Yapılıyor...';

      const formData = new FormData(loginForm);
      const loginData = Object.fromEntries(formData.entries());

      try {
        const response = await fetch(`${API_BASE_URL}/user/login.php`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(loginData),
        });

        const result = await response.json();
        if (response.ok && result.status === "success") {
          localStorage.setItem("vocabler_token", result.token);
          localStorage.setItem("vocabler_user", JSON.stringify(result.user));
          
          // Giriş anında dili ayarla
          if (result.user.NativeLangCode) {
              localStorage.setItem("vocabler_lang", result.user.NativeLangCode);
          }

          submitBtn.className = "btn btn-success w-100 mb-4 py-3";
          submitBtn.innerHTML = '<i class="fas fa-check me-2"></i>Başarılı!';
          setTimeout(() => { window.location.href = "dashboard.html"; }, 800);
        } else {
          alert(`Hata: ${result.message || "Giriş yapılamadı."}`);
          submitBtn.disabled = false;
          submitBtn.innerHTML = originalBtnText;
        }
      } catch (error) {
        console.error("Bağlantı hatası:", error);
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalBtnText;
      }
    });
  }

  // 3. KULLANICI KAYIT (REGISTER) İŞLEMLERİ
  const registerForm = document.getElementById("registerForm");
  if (registerForm) {
    registerForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const submitBtn = document.getElementById("registerBtn");
      const originalBtnText = submitBtn.innerHTML;
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Kayıt Yapılıyor...';

      const formData = new FormData(registerForm);
      const registerData = Object.fromEntries(formData.entries());

      try {
        const response = await fetch(`${API_BASE_URL}/user/register.php`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(registerData),
        });

        const result = await response.json();
        if (response.ok && result.status === "success") {
          submitBtn.className = "btn btn-success w-100 mb-4 py-3";
          submitBtn.innerHTML = '<i class="fas fa-check me-2"></i>Başarılı!';
          
          fetch(`${API_BASE_URL}/user/login.php`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ emailOrUsername: registerData.email, password: registerData.password })
          })
          .then(res => res.json())
          .then(loginData => {
              if (loginData.status === "success") {
                  localStorage.setItem("vocabler_token", loginData.token);
                  localStorage.setItem("vocabler_user", JSON.stringify(loginData.user));
                  if (loginData.user.NativeLangCode) {
                      localStorage.setItem("vocabler_lang", loginData.user.NativeLangCode);
                  }
                  window.location.replace("placement.html");
              } else { window.location.replace("login.html"); }
          }).catch(() => window.location.replace("login.html"));
        } else {
          alert(`Hata: ${result.message || "Kayıt yapılamadı."}`);
          submitBtn.disabled = false;
          submitBtn.innerHTML = originalBtnText;
        }
      } catch (error) {
        console.error("Bağlantı hatası:", error);
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalBtnText;
      }
    });
  }

  // 4. DİNAMİK KULLANICI PROFİLİ YÜKLEME
  const userStr = localStorage.getItem("vocabler_user");
  if (userStr) {
    const user = JSON.parse(userStr);
    const firstName = user.Name || user.name || "";
    const lastName = user.Surname || user.surname || "";
    const fullName = `${firstName} ${lastName}`.trim() || user.UserName || "Kullanıcı";

    const nameDisplays = document.querySelectorAll(".userNameDisplay");
    nameDisplays.forEach(el => el.textContent = fullName);

    const avatars = document.querySelectorAll(".profile-pill img, .userAvatar");
    avatars.forEach(img => {
      img.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&background=00ADB5&color=222831`;
    });

    // Dil Tercihini NativeLangCode'a göre ayarla
    const langCode = user.NativeLangCode || user.native_lang_code || user.nativeLangCode;
    if (langCode) {
        localStorage.setItem("vocabler_lang", langCode);
        if (typeof applyLanguage === "function") {
            applyLanguage(langCode);
        }
    }

    const authGuest = document.getElementById("auth-guest");
    const authUser = document.getElementById("auth-user");
    if (authGuest && authUser) {
        authGuest.classList.add("d-none");
        authUser.classList.remove("d-none");
    }

    const welcomeMessage = document.getElementById("welcomeMessage");
    if (welcomeMessage) {
      const levelHtml = user.Level ? `<span class="badge bg-warning text-dark ms-2 align-middle fs-6">${user.Level}</span>` : '';
      welcomeMessage.innerHTML = `${t('msg_welcome_back')}, ${firstName}! 👋 ${levelHtml}`;
    }
  }
}); 

function checkAuth() {
  const token = localStorage.getItem("vocabler_token");
  if (!token && !window.location.pathname.includes("login.html")) {
    window.location.href = "login.html";
  }
}

function logout() {
  localStorage.removeItem("vocabler_token");
  localStorage.removeItem("vocabler_user");
  window.location.href = "index.html";
}
