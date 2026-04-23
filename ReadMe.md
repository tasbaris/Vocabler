📚 Vocabler - Dil Öğrenme Uygulaması

  Vocabler, aralıklı tekrar (SRS) algoritması kullanarak kelime öğrenmeyi eğlenceli hale getiren bir dil öğrenme platformudur. Bu rehber, ekibin projeyi sorunsuz ayağa kaldırması ve geliştirmesi için
  hazırlanmıştır.

  🚀 Proje Yapısı

   1 Vocabler/
   2 ├── frontend/           # HTML, CSS ve Vanilla JS dosyaları
   3 └── backend/            # PHP API, MySQL ve Docker yapılandırması
   4     ├── api/            # PHP Endpoint'leri (.php dosyaları)
   5     ├── init.sql        # Veritabanı şeması ve başlangıç verileri
   6     └── docker-compose.yml

  ---

  🎨 Frontend Geliştiricileri İçin Kurulum

  Frontend tarafı Vanilla CSS ve Bootstrap 5 kullanılarak tasarlanmıştır.

   1. Arayüzü Görüntüleme:
       * frontend/index.html dosyasını tarayıcınızda açarak projeyi görebilirsiniz.
       * Tavsiye: VS Code üzerinden "Live Server" eklentisini kullanırsanız yaptığınız CSS değişikliklerini anında görebilirsiniz.
   2. Tasarım Standartları:
       * Font: Poppins (Google Fonts).
       * Renk Paleti:
           * Arkaplan: #222831
           * Kartlar: #393E46
           * Vurgu (Accent): #00ADB5
           * Yazı: #EEEEEE

  ---

  ⚙️ Backend ve API Kurulumu (Docker)

  Backend, PHP 8.2 ve MySQL 8.0 kullanır. Tüm ekipte aynı ortamın çalışması için Docker zorunludur.

   1. Gereksinimler: Docker Desktop (https://www.docker.com/products/docker-desktop/) yüklü ve çalışıyor olmalıdır.
   2. Sistemi Başlatma:
       * Terminalden Vocabler/backend/ klasörüne gidin.
       * Şu komutu çalıştırın: docker-compose up -d --build
   3. Kontrol:
       * Tarayıcıdan http://localhost:8080/db_test.php adresine gidin.
       * "Veritabanına başarıyla bağlanıldı!" yazısını görüyorsanız her şey hazırdır.

  ---

  💻 JavaScript Geliştiricileri İçin Teknik Bilgiler

  Backend ile iletişim tamamen JSON formatında yapılacaktır.

  1. API İstekleri (Fetch)
  Backend API http://localhost:8080/ adresinden hizmet vermektedir. Örnek bir veri çekme işlemi:

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

  2. Veritabanı Bağlantı Bilgileri (PHP İçin)
  Eğer yeni bir .php dosyası oluşturursanız, veritabanına şu bilgilerle bağlanmalısınız:
   * Host: db (localhost DEĞİL!)
   * User: root
   * Pass: root_password
   * DB Name: vocabler

  3. Önemli Tablolar ve Mantık
   * UserWords: Kelimelerin öğrenilme durumunu tutar. LearnRank (1-6) değeri kelimenin ne kadar iyi bilindiğini temsil eder.
   * Questions: WordId ile ilişkilidir. Sadece kullanıcının "öğreniliyor" statüsündeki kelimelerinden soru sormalısınız.
   * SRS Algoritması: Kullanıcı bir soruyu doğru bildiğinde NextReviewDate değerini ileri bir tarihe atan API'yi tetikleyin.

  ---

  🆘 Sorun Giderme
   * Port Hatası: Eğer 8080 portu doluysa docker-compose.yml içindeki 8080:80 satırını 8081:80 olarak değiştirin.
   * Veritabanı Sıfırlama: Tablo yapısını tamamen sıfırlamak isterseniz, mysql_data klasörünü silip Docker'ı tekrar başlatın.
   * CORS Hatası: PHP dosyalarınızın en başına şu satırı eklediğinizden emin olun:
      header("Access-Control-Allow-Origin: *");

  ---
  Vocabler Takımı - 2026