# 📚 Vocabler - Dil Öğrenme Uygulaması

Vocabler, aralıklı tekrar (SRS) algoritması kullanarak kelime öğrenmeyi eğlenceli hale getiren bir dil öğrenme platformudur. Bu rehber, ekibin projeyi sorunsuz ayağa kaldırması ve geliştirmesi için hazırlanmıştır.

## 🚀 Proje Yapısı
```text
Vocabler/
├── frontend/           # HTML, CSS ve Vanilla JS dosyaları
└── backend/            # PHP API, MySQL ve Docker yapılandırması
    ├── api/            # PHP Endpoint'leri (.php dosyaları)
    ├── init.sql        # Veritabanı şeması ve başlangıç verileri
    └── docker-compose.yml
```

---

## 🎨 Frontend Geliştiricileri İçin Kurulum

Frontend tarafı **Vanilla CSS** ve **Bootstrap 5** kullanılarak tasarlanmıştır.

1.  **Arayüzü Görüntüleme:** 
    *   `frontend/index.html` dosyasını tarayıcınızda açarak projeyi görebilirsiniz.
    *   **Tavsiye:** VS Code üzerinden **"Live Server"** eklentisini kullanırsanız yaptığınız CSS değişikliklerini anında görebilirsiniz.
2.  **Tasarım Standartları:**
    *   **Font:** Poppins (Google Fonts).
    *   **Renk Paleti:** 
        *   Arkaplan: `#222831`
        *   Kartlar: `#393E46`
        *   Vurgu (Accent): `#00ADB5`
        *   Yazı: `#EEEEEE`

---

## ⚙️ Backend ve API Kurulumu (Docker)

Backend, PHP 8.2 ve MySQL 8.0 kullanır. Tüm ekipte aynı ortamın çalışması için Docker zorunludur.

1.  **Gereksinimler:** [Docker Desktop](https://www.docker.com/products/docker-desktop/) yüklü ve çalışıyor olmalıdır.
2.  **Sistemi Başlatma:**
    *   Terminalden `Vocabler/backend/` klasörüne gidin.
    *   Şu komutu çalıştırın: `docker-compose up -d --build`
3.  **Kontrol:**
    *   Tarayıcıdan `http://localhost:8080/db_test.php` adresine gidin.
    *   **"Veritabanına PDO ile başarıyla bağlanıldı!"** yazısını görüyorsanız her şey hazırdır.

---

## 💻 JavaScript Geliştiricileri İçin Teknik Bilgiler

Backend ile iletişim tamamen **JSON** formatında yapılacaktır.

### 1. API İstekleri (Fetch)
Backend API `http://localhost:8080/` adresinden hizmet vermektedir. Örnek bir veri çekme işlemi:

```javascript
const BASE_URL = 'http://localhost:8080';

async function getWords() {
    try {
        const response = await fetch(`${BASE_URL}/get_words.php`);
        const data = await response.json();
        console.log(data);
    } catch (error) {
        console.error('API Hatası:', error);
    }
}
```

### 2. Veritabanı Bağlantı Bilgileri (PHP & PDO İçin)
Yeni bir `.php` dosyası oluştururken güvenli ve modern bir yapı olan **PDO** kullanmalısınız:

```php
$host = 'db';
$db   = 'vocabler';
$user = 'root';
$pass = 'root_password';
$charset = 'utf8mb4';

$dsn = "mysql:host=$host;dbname=$db;charset=$charset";
$options = [
    PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    PDO::ATTR_EMULATE_PREPARES   => false,
];

try {
     $pdo = new PDO($dsn, $user, $pass, $options);
} catch (\PDOException $e) {
     throw new \PDOException($e->getMessage(), (int)$e->getCode());
}
```

### 3. Önemli Tablolar ve Mantık
*   **UserWords:** Kelimelerin öğrenilme durumunu tutar. `LearnRank` (1-6) değeri kelimenin ne kadar iyi bilindiğini temsil eder.
*   **Questions:** `WordId` ile ilişkilidir. Sadece kullanıcının "öğreniliyor" statüsündeki kelimelerinden soru sormalısınız.
*   **SRS Algoritması:** Kullanıcı bir soruyu doğru bildiğinde `NextReviewDate` değerini ileri bir tarihe atan API'yi tetikleyin.

---

## 🆘 Sorun Giderme
*   **Port Hatası:** Eğer 8080 portu doluysa `docker-compose.yml` içindeki `8080:80` satırını `8081:80` olarak değiştirin.
*   **Veritabanı Sıfırlama:** Tablo yapısını tamamen sıfırlamak isterseniz, `mysql_data` klasörünü silip Docker'ı tekrar başlatın.
*   **CORS Hatası:** PHP dosyalarınızın en başına şu satırı eklediğinizden emin olun: 
    `header("Access-Control-Allow-Origin: *");`

---
**Vocabler Takımı - 2026**
