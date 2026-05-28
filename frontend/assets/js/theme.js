/**
 * Vocabler - Universal Theme Management
 * Handles dark/light mode switching and icon synchronization
 */

function applyTheme() {
    const savedTheme = localStorage.getItem('vocabler_theme') || 'dark';
    const root = document.documentElement;
    const icons = document.querySelectorAll('.theme-toggle i');

    if (savedTheme === 'light') {
        root.classList.add('light-theme');
        icons.forEach(icon => icon.classList.replace('fa-moon', 'fa-sun'));
    } else {
        root.classList.remove('light-theme');
        icons.forEach(icon => icon.classList.replace('fa-sun', 'fa-moon'));
    }
}

document.addEventListener('DOMContentLoaded', () => {
    applyTheme(); // İlk yüklemede ikonları senkronize et

    // Tüm tema değiştirme butonlarını yakala (Navbar, Sidebar vb.)
    document.addEventListener('click', (e) => {
        const toggleBtn = e.target.closest('.theme-toggle');
        if (toggleBtn) {
            const isLight = document.documentElement.classList.toggle('light-theme');
            const newTheme = isLight ? 'light' : 'dark';
            localStorage.setItem('vocabler_theme', newTheme);
            applyTheme(); // Değişikliği tüm ikonlara yansıt
        }
    });

    // Language Toggle
    const langSelector = document.getElementById('langSelector');
    if (langSelector) {
        const savedLang = localStorage.getItem('vocabler_lang') || 'tr';
        
        // Fetch languages from backend
        fetch(`${typeof API_BASE_URL !== 'undefined' ? API_BASE_URL : 'http://localhost:8080'}/languages/get_active.php`)
            .then(res => res.json())
            .then(data => {
                if (data.status === 'success') {
                    langSelector.innerHTML = '';
                    data.languages.forEach(lang => {
                        const option = document.createElement('option');
                        option.value = lang.LangCode.toLowerCase();
                        option.className = 'text-dark';
                        option.textContent = lang.LangCode.toUpperCase();
                        if (option.value === savedLang) option.selected = true;
                        langSelector.appendChild(option);
                    });
                }
            })
            .catch(err => console.error("Diller yüklenirken hata:", err));
        
        langSelector.addEventListener('change', (e) => {
            const newLang = e.target.value;
            localStorage.setItem('vocabler_lang', newLang);
            if (typeof applyLanguage === 'function') {
                applyLanguage(newLang);
            }
        });
    }
});

// Sayfalar arası geçişte anlık kontrol
window.addEventListener('storage', (e) => {
    if (e.key === 'vocabler_theme') applyTheme();
});