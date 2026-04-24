

// Backend API'nizin temel adresi (barış söyleyecek)
const API_BASE_URL = 'http://localhost/vocabler_backend/api'; 

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');

    if (loginForm) {
        // Form "submit" (gönder) olayını dinliyoruz
        loginForm.addEventListener('submit', async (e) => {
            
            e.preventDefault(); 

            //  "Giriş Yapılıyor..." animasyonu için
            const submitBtn = document.getElementById('loginBtn');
            const originalBtnText = submitBtn.innerHTML;
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Giriş Yapılıyor...';

            //backand için veirlei istenen form yapıyoz
            const formData = new FormData(loginForm);
            const loginData = Object.fromEntries(formData.entries());

            try {  //burada backand e yolluyoz
                const response = await fetch(`${API_BASE_URL}/login.php`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    credentials: 'include',  // 
                    body: JSON.stringify(loginData) // JSON paketimizi yolluyoruz
                });

                const result = await response.json();

                if (response.ok && result.success) {
                    window.location.href = 'index.html'; // Anasayfaya yönlendir
                } else {
                    alert(`Giriş Başarısız: ${result.message}`);
                }

            } catch (error) {
                console.error('Bağlantı hatası:', error);
                alert('Sunucuya ulaşılamıyor. Lütfen bağlantınızı kontrol edin.');
            } finally {
                // İşlem bitince butonu eski haline (tıklanabilir) getirir
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalBtnText;
            }
        });
    }
});
