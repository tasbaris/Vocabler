/**
 * Vocabler - Authentication Logic
 * Handles Login, Registration, and Session Management
 */

const API_BASE_URL = 'http://localhost:8080';

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');

    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const submitBtn = document.getElementById('loginBtn');
            const originalBtnText = submitBtn.innerHTML;
            
            // UI Loading State
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Giriş Yapılıyor...';

            // Prepare Data
            const formData = new FormData(loginForm);
            const loginData = Object.fromEntries(formData.entries());

            try {
                const response = await fetch(`${API_BASE_URL}/user/login.php`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(loginData)
                });

                const result = await response.json();

                if (response.ok && result.status === 'success') {
                    // Store session data
                    localStorage.setItem('vocabler_token', result.token);
                    localStorage.setItem('vocabler_user', JSON.stringify(result.user));
                    
                    // Success feedback and redirect
                    submitBtn.className = 'btn btn-success w-100 mb-4 py-3';
                    submitBtn.innerHTML = '<i class="fas fa-check me-2"></i>Başarılı!';
                    
                    setTimeout(() => {
                        window.location.href = 'index.html';
                    }, 800);
                } else {
                    // Error feedback
                    alert(`Hata: ${result.message || 'Giriş yapılamadı.'}`);
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = originalBtnText;
                }

            } catch (error) {
                console.error('Bağlantı hatası:', error);
                alert('Sunucuya ulaşılamıyor. Docker konteynerlerinin çalıştığından ve 8080 portunun açık olduğundan emin olun.');
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalBtnText;
            }
        });
    }
});

/**
 * Check if user is logged in
 * Useful for protected pages like profile.html or quiz.html
 */
function checkAuth() {
    const token = localStorage.getItem('vocabler_token');
    if (!token && !window.location.pathname.includes('login.html')) {
        window.location.href = 'login.html';
    }
}

/**
 * Logout utility
 */
function logout() {
    localStorage.removeItem('vocabler_token');
    localStorage.removeItem('vocabler_user');
    window.location.href = 'login.html';
}
