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
});

// Sayfalar arası geçişte anlık kontrol
window.addEventListener('storage', (e) => {
    if (e.key === 'vocabler_theme') applyTheme();
});