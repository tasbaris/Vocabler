-- Veritabanı oluşturma
CREATE DATABASE IF NOT EXISTS vocabler;
USE vocabler;

-- 1. Diller Tablosu
CREATE TABLE IF NOT EXISTS Languages (
    Id INT AUTO_INCREMENT PRIMARY KEY,
    LangCode CHAR(2) NOT NULL,
    LangName VARCHAR(20) NOT NULL,
    Active TINYINT DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Kategoriler Tablosu
CREATE TABLE IF NOT EXISTS Categories (
    Id INT AUTO_INCREMENT PRIMARY KEY,
    CategoryName VARCHAR(50) NOT NULL,
    Active TINYINT DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Kullanıcılar Tablosu
CREATE TABLE IF NOT EXISTS Users (
    Id INT AUTO_INCREMENT PRIMARY KEY,
    Name VARCHAR(50) NOT NULL,
    Surname VARCHAR(50) NOT NULL,
    Email VARCHAR(50) NOT NULL UNIQUE,
    UserName VARCHAR(50) NOT NULL UNIQUE,
    PasswordHash VARCHAR(255) NOT NULL,
    DailyWord INT NOT NULL DEFAULT 10,
    NativeLangId INT,
    CurrentTargetLangId INT,
    StreakDays INT DEFAULT 0,
    CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    Active TINYINT DEFAULT 1,
    FOREIGN KEY (NativeLangId) REFERENCES Languages(Id) ON DELETE SET NULL,
    FOREIGN KEY (CurrentTargetLangId) REFERENCES Languages(Id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Kelimeler Tablosu (Konsept/Kavram)
CREATE TABLE IF NOT EXISTS Words (
    Id INT AUTO_INCREMENT PRIMARY KEY,
    Level ENUM('A1', 'A2', 'B1', 'B2', 'C1', 'C2') NOT NULL,
    CategoryId INT NOT NULL,
    Picture VARCHAR(255),
    AddedById INT DEFAULT 0,
    Active TINYINT DEFAULT 1,
    FOREIGN KEY (CategoryId) REFERENCES Categories(Id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Kelime Çevirileri Tablosu
CREATE TABLE IF NOT EXISTS WordTranslations (
    Id INT AUTO_INCREMENT PRIMARY KEY,
    WordId INT NOT NULL,
    LangId INT NOT NULL,
    WordType VARCHAR(20) COMMENT 'Noun, Verb, Adj, Adv, Conj',
    Translation VARCHAR(255) NOT NULL,
    Pronunciation VARCHAR(100),
    FOREIGN KEY (WordId) REFERENCES Words(Id) ON DELETE CASCADE,
    FOREIGN KEY (LangId) REFERENCES Languages(Id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. Örnek Cümleler Tablosu
CREATE TABLE IF NOT EXISTS WordSamples (
    Id INT AUTO_INCREMENT PRIMARY KEY,
    WordId INT NOT NULL,
    LangId INT NOT NULL,
    SampleText VARCHAR(255) NOT NULL,
    FOREIGN KEY (WordId) REFERENCES Words(Id) ON DELETE CASCADE,
    FOREIGN KEY (LangId) REFERENCES Languages(Id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. Kullanıcı Kelime Takip Tablosu (SRS Algoritması İçin)
CREATE TABLE IF NOT EXISTS UserWords (
    Id INT AUTO_INCREMENT PRIMARY KEY,
    UserId INT NOT NULL,
    SourceLangId INT NOT NULL,
    TargetLangId INT NOT NULL,
    WordId INT NOT NULL,
    LearnRank TINYINT NOT NULL DEFAULT 1 COMMENT '1-6 arası seviye',
    LastLearnDate DATETIME,
    NextReviewDate DATETIME,
    Status TINYINT DEFAULT 0 COMMENT '0:Bekliyor, 1:Öğreniliyor',
    CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (UserId) REFERENCES Users(Id) ON DELETE CASCADE,
    FOREIGN KEY (SourceLangId) REFERENCES Languages(Id) ON DELETE CASCADE,
    FOREIGN KEY (TargetLangId) REFERENCES Languages(Id) ON DELETE CASCADE,
    FOREIGN KEY (WordId) REFERENCES Words(Id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. Sabit Sorular Tablosu
CREATE TABLE IF NOT EXISTS Questions (
    Id INT AUTO_INCREMENT PRIMARY KEY,
    WordId INT,
    LangId INT NOT NULL,
    Level VARCHAR(5) NOT NULL,
    QuestionText TEXT NOT NULL,
    OptionA VARCHAR(255) NOT NULL,
    OptionB VARCHAR(255) NOT NULL,
    OptionC VARCHAR(255) NOT NULL,
    OptionD VARCHAR(255) NOT NULL,
    CorrectOption CHAR(1) NOT NULL COMMENT 'A, B, C, D',
    Explanation TEXT,
    FOREIGN KEY (WordId) REFERENCES Words(Id) ON DELETE SET NULL,
    FOREIGN KEY (LangId) REFERENCES Languages(Id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 9. Şifre Sıfırlama Tablosu
CREATE TABLE IF NOT EXISTS PasswordResets (
    Id INT AUTO_INCREMENT PRIMARY KEY,
    UserId INT NOT NULL,
    ResetToken VARCHAR(100) NOT NULL,
    CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    ExpiresAt DATETIME NOT NULL,
    IsUsed TINYINT DEFAULT 0,
    FOREIGN KEY (UserId) REFERENCES Users(Id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- BAŞLANGIÇ VERİLERİ (Opsiyonel)
INSERT IGNORE INTO Languages (Id, LangCode, LangName,Active) VALUES 
(1, 'tr', 'Turkish', 1),
(2, 'en', 'English', 1),
(3, 'de', 'German', 0),
(4, 'jp', 'Japanese', 0),
(5, 'fr', 'French', 0),
(6, 'es', 'Spanish', 0),
(7, 'it', 'Italian', 0),
(8, 'ru', 'Russian', 0),
(9, 'cn', 'Chinese', 0),
(10, 'ar', 'Arabic', 0);

INSERT IGNORE INTO Categories (Id, CategoryName) VALUES 
(1, 'General'),
(2, 'Cooking'),
(3, 'Travel'),
(4, 'Business'),
(5, 'Education'),
(6, 'Health'),
(7, 'Technology'),
(8, 'Sports'),
(9, 'Entertainment'),
(10, 'Nature');

-- HERKES ICIN TEST KULLANICISI (Sifre: password123)
INSERT IGNORE INTO Users (Id, Name, Surname, Email, UserName, PasswordHash, DailyWord, NativeLangId, CurrentTargetLangId, Active) VALUES 
(1, 'Test', 'Kullanıcısı', 'test@vocabler.com', 'testuser', '$2y$10$n4qGfJ4E3y.i0/bF30Z/hOcYvOOMHhQ8RInJz/q3bQWzK7QyqFw8q', 10, 1, 2, 1);
