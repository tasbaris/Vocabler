# Vocabler - Dil Öğrenme Platformu

Vocabler, kullanıcıların kelime dağarcığını eğlenceli ve interaktif bir şekilde geliştirmelerini sağlayan modern bir dil öğrenme platformudur. SRS (Spaced Repetition System) algoritması, oyunlaştırılmış testler ve dinamik içerik yönetimi ile dil öğrenme sürecini optimize eder.

## 🚀 Temel Özellikler

- **SRS Tabanlı Öğrenme:** Kelimeleri unutma eğrinize göre planlayan akıllı tekrar sistemi.
- **Gelişmiş Quiz Sistemi:** Çoktan seçmeli, doğru/yanlış ve yazma pratikleri.
- **Oyunlaştırma (Wordle & Word Chain):** Kelime bilginizi strateji ve oyunlarla test edin.
- **Kişiselleştirilmiş Kelime Havuzu:** Kendi kelimelerinizi ekleyin veya hazır kategorilerden (Teknoloji, Doğa, İş dünyası vb.) kelime setlerine abone olun.
- **Seviye Tespit Sınavı:** Başlangıç seviyenizi belirleyen dinamik yerleştirme testi.
- **Karanlık/Aydınlık Tema:** Göz yormayan, modern ve duyarlı (responsive) arayüz.
- **Çoklu Dil Desteği:** Tamamen yerelleştirilmiş (TR/EN) içerik ve arayüz.

## 🛠 Teknik Mimari

### Frontend (İstemci)
- **Vanilla JS & Bootstrap 5:** Saf JavaScript ve modern CSS framework'ü ile hızlı ve hafif bir yapı.
- **İnternasyonalizasyon (i18n):** `translations.js` üzerinden yönetilen dinamik dil sistemi.
- **Responsive Tasarım:** Mobil, tablet ve masaüstü cihazlarla tam uyum.

### Backend (Sunucu)
- **PHP 8.x:** RESTful API mimarisi ile veri yönetimi.
- **MySQL:** Saklı yordamlar (Stored Procedures) ve tetikleyiciler (Triggers) ile veritabanı seviyesinde iş mantığı.
- **JWT (JSON Web Token):** Güvenli oturum yönetimi ve yetkilendirme.

### Altyapı
- **Docker & Docker Compose:** Kolay kurulum ve izole çalışma ortamı.
- **SRS Algoritması:** Veritabanı seviyesinde çalışan, `sp_UpdateWordProgress` yordamı ile yönetilen bilimsel tekrar sistemi.

## 📦 Kurulum

1. Projeyi bilgisayarınıza klonlayın:
   ```bash
   git clone https://github.com/Vocabler/Vocabler.git
   ```
2. Docker kullanarak sistemi ayağa kaldırın:
   ```bash
   docker-compose up -d
   ```
3. Go Live ile siteyi açın:
   ```
   http://127.0.0.1:5500/frontend/
   ```

### Veritabanı Yapısı ve Yönetimi

Proje, veritabanı seviyesinde yüksek performanslı iş mantığı kullanmaktadır. Ana yordamlar:
- `sp_AssignWordsToUser`: Kullanıcının dil ve seviyesine uygun kelimeleri otomatik atar.
- `sp_UpdateWordProgress`: Kullanıcının cevaplarına göre kelime ilerlemesini (SRS) hesaplar.
- `sp_GetDailyWords`: Kullanıcının günlük hedefine ve tekrar zamanı gelen kelimelere göre çalışma listesi hazırlar.

### 🛠 Yönetici ve Geliştirici Araçları

#### 1. Toplu Kelime Yükleme (Bulk Upload)
Sisteme tek tek kelime eklemek yerine, önceden hazırlanmış bir JSON dosyasından binlerce kelimeyi saniyeler içinde içe aktarabilirsiniz.
- **Dosya:** `backend/api/bulk_words.json` (Örnek veriler burada yer alır).
- **Çalıştırma:**
  ```bash
  # CLI üzerinden (Tavsiye edilen)
  php backend/api/words/bulk_upload.php

  # Veya tarayıcı üzerinden (Güvenlik anahtarı ile)
  http://localhost/backend/api/words/bulk_upload.php?key=import123
  ```

#### 2. Konu ve Kategori Yönetimi
- **Konular Sayfası:** Arayüz üzerinden yeni kategoriler (Mutfak, Teknoloji vb.) oluşturabilir, mevcut olanları güncelleyebilir veya silebilirsiniz.
- **Toplu Silme:** "Kelimelerim" sayfasında birden fazla kelimeyi seçerek tek tıkla toplu silme işlemi gerçekleştirebilirsiniz.

---
*Bu proje, modern yazılım prensipleri (DRY, KISS) ve verimli veritabanı yönetimi odaklı geliştirilmiştir.*
