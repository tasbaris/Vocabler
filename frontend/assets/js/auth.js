
// Tüm API istekleri için kullanılacak ana sunucu adresi (Global değişken)
const API_BASE_URL = "http://localhost:8080";  

// DOMContentLoaded: Sayfa iskeleti tamamen yüklendikten sonra işlemlere başla
document.addEventListener("DOMContentLoaded", () => {
  
  // 1. Dilleri Veritabanından Çekme
  const nativeLangSelect = document.getElementById("nativeLanguage");
  const targetLangSelect = document.getElementById("targetLanguage");

// Sigorta: Sadece dil seçim kutularının olduğu sayfalarda (Örn: Register) bu isteği at. 
  // Böylece kutunun olmadığı sayfalarda 'null' hatası almayı önlüyoruz.
  if (nativeLangSelect || targetLangSelect) {

    // Backend'den aktif dil listesini çek
    fetch(`${API_BASE_URL}/languages/get_active.php`)
      .then((res) => res.json())
      .then((data) => {
        if (data.status === "success") {
          // Gelen veriyi HTML <option> etiketlerine dönüştürerek kutuların içini doldur
          let options = '<option value="" disabled selected>Seçiniz</option>';
          data.languages.forEach((lang) => {
            options += `<option value="${lang.Id}">${lang.LangName}</option>`;
          });
          if (nativeLangSelect) nativeLangSelect.innerHTML = options;
          if (targetLangSelect) targetLangSelect.innerHTML = options;
        }
      })
      .catch((err) => console.error("Diller yuklenirken hata olustu:", err));
  }

  // 2. KULLANICI GİRİŞ (LOGIN) İŞLEMLERİ
  const loginForm = document.getElementById("loginForm");

  // Sadece login formunun bulunduğu sayfada çalışması için güvenlik kontrolü
  if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
      // Formun varsayılan davranışı olan 'sayfayı yenileme' işlemini durdur (Asenkron işlem yapacağız)
      e.preventDefault();
      const submitBtn = document.getElementById("loginBtn");
      const originalBtnText = submitBtn.innerHTML;

      // Kullanıcının butona art arda basmasını (spam) engelle ve görsel geri bildirim ver
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Giriş Yapılıyor...';

      // Formdaki input verilerini otomatik topla ve JSON formatına çevrilecek bir objeye dönüştür
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
          // Sunucudan gelen yetkilendirme biletini (JWT) ve kullanıcı bilgilerini tarayıcı hafızasına kaydet (Oturum açma)
          localStorage.setItem("vocabler_token", result.token);
          localStorage.setItem("vocabler_user", JSON.stringify(result.user));

          // Kullanıcıya görsel başarı mesajı ver
          submitBtn.className = "btn btn-success w-100 mb-4 py-3";
          submitBtn.innerHTML = '<i class="fas fa-check me-2"></i>Başarılı!';

          // Pürüzsüz bir deneyim için 800ms bekleyip ana ekrana (Dashboard) yönlendir
          setTimeout(() => {
            window.location.href = "dashboard.html";
          }, 800);
        } else {
          alert(`Hata: ${result.message || "Giriş yapılamadı."}`);
          // Butonu kilitli durumdan kurtar ve eski yazısını geri getir
          submitBtn.disabled = false;
          submitBtn.innerHTML = originalBtnText;
        }
      } catch (error) {
        console.error("Bağlantı hatası:", error);
        alert("Sunucuya ulaşılamıyor. Docker konteynerlerinin çalıştığından ve 8080 portunun açık olduğundan emin olun.");
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalBtnText;
      }
    });
  }

  // 3. KULLANICI KAYIT (REGISTER) İŞLEMLERİ
  const registerForm = document.getElementById("registerForm");
  if (registerForm) {
    registerForm.addEventListener("submit", async (e) => {
      // Formun klasik gönderimini engelle (Modern Single Page Application -SPA- mantığı)
      e.preventDefault();
  
      const submitBtn = document.getElementById("registerBtn");
      const originalBtnText = submitBtn.innerHTML;

      // Kullanıcıya işlemin başladığını gösteren görsel geri bildirim (Spinner aktifleştirme)
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Kayıt Yapılıyor...';

      // Form verilerini backend API'sine uygun JSON formatına dönüştürmek için topla
      const formData = new FormData(registerForm);
      const registerData = Object.fromEntries(formData.entries());

      try {
        // Verileri POST metoduyla register.php dosyasına ilet
        const response = await fetch(`${API_BASE_URL}/user/register.php`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(registerData),
        });

        const result = await response.json();

        if (response.ok && result.status === "success") {
          // Butonu 'Başarılı' moduna sokarak kullanıcıya onay ver
          submitBtn.className = "btn btn-success w-100 mb-4 py-3";
          submitBtn.innerHTML = '<i class="fas fa-check me-2"></i>Başarılı!';
          // Kayıt sonrası tarayıcı yenileme tuzağına düşmemek için anında Login sayfasına yönlendir
          window.location.replace("login.html");
        } else {
          alert(`Hata: ${result.message || "Kayıt yapılamadı."}`);
          // Formu tekrar kullanılabilir hale getir
          submitBtn.disabled = false;
          submitBtn.innerHTML = originalBtnText;
        }
      } catch (error) {
        console.error("Bağlantı hatası:", error);
        alert("Sunucuya ulaşılamıyor. Docker konteynerlerinin çalıştığından ve 8080 portunun açık olduğundan emin olun.");
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalBtnText;
      }
    });
  }

  // 4. DİNAMİK KULLANICI PROFİLİ YÜKLEME (Doğru ve bağımsız yer burası)

  // Giriş yapmış kullanıcının bilgilerini yerel hafızadan (cache) çek
  const userStr = localStorage.getItem("vocabler_user");
  
  if (userStr) {
    const user = JSON.parse(userStr);
    
    // Farklı backend isimlendirme senaryolarına karşı veriyi normalize et
    const firstName = user.Name || user.name || "";
    const lastName = user.Surname || user.surname || "";
    const fullName = `${firstName} ${lastName}`.trim() || user.UserName || "Kullanıcı";

    // Sayfa genelindeki tüm isim alanlarını (class: userNameDisplay) tek seferde güncelle
    const nameDisplays = document.querySelectorAll(".userNameDisplay");
    nameDisplays.forEach(el => el.textContent = fullName);

    // Kullanıcı ismine özel dinamik profil ikonları (Avatar) oluştur ve yerleştir
    const avatars = document.querySelectorAll(".profile-pill img");
    avatars.forEach(img => {
      img.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&background=00ADB5&color=222831`;
    });

    // Dashboard'a özel karşılama mesajını kişiselleştir
    const welcomeMessage = document.getElementById("welcomeMessage");
    if (welcomeMessage) {
      welcomeMessage.innerHTML = `Tekrar Hoş Geldin, ${firstName}! 👋`;
    }
  }

}); 

/**
 * OTURUM KONTROLÜ
 * Yetkisiz kullanıcıların Dashboard veya Ayarlar gibi gizli sayfalara erişimini engeller.
 * Token bulunamazsa kullanıcıyı zorunlu olarak giriş sayfasına yönlendirir.
 */
function checkAuth() {
  const token = localStorage.getItem("vocabler_token");
  if (!token && !window.location.pathname.includes("login.html")) {
    window.location.href = "login.html";
  }
}

/**
 * LOGOUT
 * Kullanıcının oturum bilgilerini tamamen siler ve sistemi sıfırlar.
 */
function logout() {
  localStorage.removeItem("vocabler_token");
  localStorage.removeItem("vocabler_user");
  window.location.href = "index.html";
}

