
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
          submitBtn.innerHTML = `<i class="fas fa-check me-2"></i>${t('msg_success')}`;
          setTimeout(() => { window.location.href = "dashboard.html"; }, 800);
        } else {
          showToast(result.message || t('msg_login_failed'), "error");
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
      submitBtn.innerHTML = `<i class="fas fa-spinner fa-spin me-2"></i>${t('msg_registering')}`;

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
          submitBtn.innerHTML = `<i class="fas fa-check me-2"></i>${t('msg_success')}`;
          
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
          showToast(result.message || t('msg_register_failed'), "error");
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
    const fullName = `${firstName} ${lastName}`.trim() || user.UserName || t('label_user');

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

        // Landing page CTA butonlarını Panele Git olarak güncelle
        const ctaButtons = document.querySelectorAll('a[href="login.html"], a[href="register.html"]');
        ctaButtons.forEach(btn => {
            if (!btn.closest('#auth-guest')) { // Navbar'dakiler hariç (onlar zaten d-none olacak)
                btn.href = 'dashboard.html';
                if (btn.hasAttribute('data-i18n')) {
                    btn.setAttribute('data-i18n', 'nav_dashboard');
                    if (typeof t === 'function') btn.textContent = t('nav_dashboard');
                }
            }
        });
    }
  }
}); 

function checkAuth() {
  const token = localStorage.getItem("vocabler_token");
  const path = window.location.pathname;

  const isLoginPage = path.includes("login.html") || 
                     path.includes("register.html") || 
                     path.includes("forgot-password.html");
                     
  const isPublicPage = isLoginPage ||
                     path.endsWith("/") ||
                     path.includes("index.html");

  if (!token && !isPublicPage) {
    window.location.href = "login.html";
  } else if (token && isLoginPage) {
    // Oturum açıksa ve login/register sayfasına gidilmeye çalışılıyorsa dashboard'a yönlendir
    window.location.href = "dashboard.html";
  }
}

// Global 401 handler
function handleUnauthorized(response) {
  if (response.status === 401) {
    logout();
    return true;
  }
  return false;
}

function logout() {
  localStorage.removeItem("vocabler_token");
  localStorage.removeItem("vocabler_user");
  // localStorage.removeItem("vocabler_lang"); // Dili korumak isteyebiliriz
  window.location.href = "login.html";
}

// Call checkAuth immediately
checkAuth();
