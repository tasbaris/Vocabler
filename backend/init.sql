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
    CategoryId INT NOT NULL,
    Picture VARCHAR(255),
    AddedById INT DEFAULT NULL,
    Active TINYINT DEFAULT 1,
    FOREIGN KEY (CategoryId) REFERENCES Categories(Id) ON DELETE CASCADE,
    FOREIGN KEY (AddedById) REFERENCES Users(Id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Kelime Çevirileri Tablosu
CREATE TABLE IF NOT EXISTS WordTranslations (
    Id INT AUTO_INCREMENT PRIMARY KEY,
    WordId INT NOT NULL,
    LangId INT NOT NULL,
    Level ENUM('A1', 'A2', 'B1', 'B2', 'C1', 'C2') NOT NULL,
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
    TranslatedText VARCHAR(255) NULL,
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
    WordId INT NULL, -- Hangi kelimeyle ilgili olduğu
    SourceLangId INT NOT NULL, -- Sorunun hangi dilden olduğu
    LangId INT NOT NULL, -- Kelime dili
    Level VARCHAR(5) NOT NULL, -- A1, B2 vb.
    QuestionType ENUM('Multiple Choice', 'True/False', 'Short Answer', 'Matching') NOT NULL,
    QuestionText TEXT NOT NULL,    
    Options JSON DEFAULT NULL COMMENT '{"A": "Apple", "B": "Banana"...}',
    CorrectAnswer VARCHAR(255) NOT NULL,
    Explanation TEXT,
    ImageUrl VARCHAR(255) DEFAULT NULL,
    CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (WordId) REFERENCES Words(Id) ON DELETE SET NULL,
    FOREIGN KEY (LangId) REFERENCES Languages(Id) ON DELETE CASCADE,
    FOREIGN KEY (SourceLangId) REFERENCES Languages(Id) ON DELETE CASCADE
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

-- BAŞLANGIÇ VERİLERİ
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

-- TEST KULLANICISI (Sifre: password123)
INSERT IGNORE INTO Users (Id, Name, Surname, Email, UserName, PasswordHash, DailyWord, NativeLangId, CurrentTargetLangId, Active) VALUES 
(1, 'Test', 'Kullanıcısı', 'test@vocabler.com', 'testuser', '$2y$10$n4qGfJ4E3y.i0/bF30Z/hOcYvOOMHhQ8RInJz/q3bQWzK7QyqFw8q', 10, 1, 2, 1);

CREATE INDEX idx_user_review ON UserWords (UserId, Status, NextReviewDate);

DELIMITER //

-- 1. Kelime İlerleme Güncelleme
CREATE PROCEDURE sp_UpdateWordProgress(
    IN p_UserId INT,
    IN p_WordId INT,
    IN p_IsCorrect TINYINT
)
BEGIN
    DECLARE v_CurrentRank TINYINT;
    DECLARE v_Interval INT;
    DECLARE v_Status TINYINT;

    SELECT LearnRank, Status INTO v_CurrentRank, v_Status
    FROM UserWords 
    WHERE UserId = p_UserId AND WordId = p_WordId;

    IF p_IsCorrect = 1 THEN
        SET v_CurrentRank = v_CurrentRank + 1;
        SET v_Status = 1;
        
        CASE v_CurrentRank
            WHEN 1 THEN SET v_Interval = 1;
            WHEN 2 THEN SET v_Interval = 7;
            WHEN 3 THEN SET v_Interval = 30;
            WHEN 4 THEN SET v_Interval = 90;
            WHEN 5 THEN SET v_Interval = 180;
            WHEN 6 THEN SET v_Interval = 365;
            ELSE 
                SET v_Interval = 0;
                SET v_Status = 2;
        END CASE;
    ELSE
        SET v_CurrentRank = 0;
        SET v_Interval = 0;
        SET v_Status = 1;
    END IF;

    UPDATE UserWords 
    SET LearnRank = v_CurrentRank,
        Status = v_Status,
        LastLearnDate = NOW(),
        NextReviewDate = IF(v_Status = 2, NULL, DATE_ADD(NOW(), INTERVAL v_Interval DAY))
    WHERE UserId = p_UserId AND WordId = p_WordId;
END //

-- 2. Günlük Kelime Listesi Getirme (LearnRank Dahil)
CREATE PROCEDURE sp_GetDailyWords(
    IN p_UserId INT
)
BEGIN
    DECLARE v_DailyLimit INT;
    SELECT DailyWord INTO v_DailyLimit FROM Users WHERE Id = p_UserId;

    SELECT WordId, TargetLangId, SourceLangId, LearnRank FROM (
        (SELECT uw.WordId, uw.TargetLangId, uw.SourceLangId, uw.LearnRank, 1 as Priority, uw.NextReviewDate
         FROM UserWords uw
         WHERE uw.UserId = p_UserId AND uw.Status = 1 AND (uw.NextReviewDate <= NOW() OR uw.NextReviewDate IS NULL)
         LIMIT v_DailyLimit)
        UNION ALL
        (SELECT uw.WordId, uw.TargetLangId, uw.SourceLangId, uw.LearnRank, 2 as Priority, uw.NextReviewDate
         FROM UserWords uw
         WHERE uw.UserId = p_UserId AND uw.Status = 0
         LIMIT v_DailyLimit)
    ) as Combined
    ORDER BY Priority ASC, NextReviewDate ASC
    LIMIT v_DailyLimit;
END //

-- 3. Kullanıcıya Kelime Atama
CREATE PROCEDURE sp_AssignWordsToUser(
    IN p_UserId INT,
    IN p_CategoryId INT,
    IN p_TargetLangId INT,
    IN p_Limit INT
)
BEGIN
    DECLARE v_NativeLangId INT;
    SELECT NativeLangId INTO v_NativeLangId FROM Users WHERE Id = p_UserId;

    INSERT IGNORE INTO UserWords (UserId, SourceLangId, TargetLangId, WordId, Status)
    SELECT p_UserId, v_NativeLangId, p_TargetLangId, w.Id, 0
    FROM Words w
    WHERE (p_CategoryId IS NULL OR w.CategoryId = p_CategoryId)
      AND w.Active = 1
      AND w.Id NOT IN (SELECT WordId FROM UserWords WHERE UserId = p_UserId AND TargetLangId = p_TargetLangId)
    LIMIT p_Limit;
END //

-- 4. Kategori Bazlı Analiz Raporu
CREATE PROCEDURE sp_GetUserStats(
    IN p_UserId INT
)
BEGIN
    SELECT 
        c.CategoryName,
        COUNT(uw.Id) as TotalWords,
        SUM(CASE WHEN uw.Status = 2 THEN 1 ELSE 0 END) as MasteredWords,
        ROUND((SUM(CASE WHEN uw.Status = 2 THEN 1 ELSE 0 END) / NULLIF(COUNT(uw.Id), 0)) * 100, 2) as SuccessPercentage
    FROM Categories c
    LEFT JOIN Words w ON c.Id = w.CategoryId
    LEFT JOIN UserWords uw ON w.Id = uw.WordId AND uw.UserId = p_UserId
    GROUP BY c.Id, c.CategoryName;
END //

-- 4.1 Dashboard Özet İstatistikleri
CREATE PROCEDURE sp_GetDashboardSummary(
    IN p_UserId INT
)
BEGIN
    SELECT 
        SUM(CASE WHEN Status = 2 THEN 1 ELSE 0 END) as MasteredCount,
        SUM(CASE WHEN Status = 1 AND (NextReviewDate <= NOW() OR NextReviewDate IS NULL) THEN 1 ELSE 0 END) as OverdueCount,
        SUM(CASE WHEN Status = 1 THEN 1 ELSE 0 END) as LearningCount,
        COUNT(*) as TotalWords
    FROM UserWords 
    WHERE UserId = p_UserId;
END //

-- 5. Kullanıcının Kendi Kelimesini Eklemesi
CREATE PROCEDURE sp_AddUserWord(
    IN p_UserId INT,
    IN p_TargetTranslation VARCHAR(255),
    IN p_NativeTranslation VARCHAR(255),
    IN p_Level ENUM('A1', 'A2', 'B1', 'B2', 'C1', 'C2'),
    IN p_CategoryId INT,
    IN p_WordType VARCHAR(20)
)
BEGIN
    DECLARE v_NativeLangId INT;
    DECLARE v_TargetLangId INT;
    DECLARE v_WordId INT;

    SELECT NativeLangId, CurrentTargetLangId INTO v_NativeLangId, v_TargetLangId 
    FROM Users WHERE Id = p_UserId;

    INSERT INTO Words (CategoryId, AddedById, Active) 
    VALUES (p_CategoryId, p_UserId, 1);
    SET v_WordId = LAST_INSERT_ID();

    INSERT INTO WordTranslations (WordId, LangId, Level, WordType, Translation)
    VALUES (v_WordId, v_TargetLangId, p_Level, p_WordType, p_TargetTranslation);

    INSERT INTO WordTranslations (WordId, LangId, Level, WordType, Translation)
    VALUES (v_WordId, v_NativeLangId, p_Level, p_WordType, p_NativeTranslation);

    INSERT INTO UserWords (UserId, SourceLangId, TargetLangId, WordId, Status, NextReviewDate)
    VALUES (p_UserId, v_NativeLangId, v_TargetLangId, v_WordId, 1, NOW());

    SELECT v_WordId as WordId;
END //

-- 5.1 Örnek Cümle Ekleme
CREATE PROCEDURE sp_AddWordSample(
    IN p_WordId INT,
    IN p_LangId INT,
    IN p_SampleText VARCHAR(255),
    IN p_TranslatedText VARCHAR(255)
)
BEGIN
    INSERT INTO WordSamples (WordId, LangId, SampleText, TranslatedText)
    VALUES (p_WordId, p_LangId, p_SampleText, p_TranslatedText);
END //

-- 5.2 Sisteme Genel Kelime Ekleme (Admin/Toplu Ekleme İçin)
CREATE PROCEDURE sp_AddGlobalWord(
    IN p_TargetTranslation VARCHAR(255),
    IN p_NativeTranslation VARCHAR(255),
    IN p_Level ENUM('A1', 'A2', 'B1', 'B2', 'C1', 'C2'),
    IN p_CategoryId INT,
    IN p_WordType VARCHAR(20),
    IN p_SampleText VARCHAR(255),
    IN p_SampleTranslation VARCHAR(255)
)
BEGIN
    DECLARE v_WordId INT;
    DECLARE v_TR_Id INT DEFAULT 1;
    DECLARE v_EN_Id INT DEFAULT 2;
    DECLARE v_Exists INT;

    SELECT w.Id INTO v_Exists
    FROM Words w
    JOIN WordTranslations wt ON w.Id = wt.WordId
    WHERE wt.Translation = p_TargetTranslation AND wt.LangId = v_EN_Id AND w.AddedById IS NULL
    LIMIT 1;

    IF v_Exists IS NULL THEN
        INSERT INTO Words (CategoryId, AddedById, Active) VALUES (p_CategoryId, NULL, 1);
        SET v_WordId = LAST_INSERT_ID();
        INSERT INTO WordTranslations (WordId, LangId, Level, WordType, Translation)
        VALUES (v_WordId, v_EN_Id, p_Level, p_WordType, p_TargetTranslation);
        INSERT INTO WordTranslations (WordId, LangId, Level, WordType, Translation)
        VALUES (v_WordId, v_TR_Id, p_Level, p_WordType, p_NativeTranslation);
        IF p_SampleText IS NOT NULL THEN
            INSERT INTO WordSamples (WordId, LangId, SampleText, TranslatedText)
            VALUES (v_WordId, v_EN_Id, p_SampleText, p_SampleTranslation);
        END IF;
    ELSE
        SET v_WordId = v_Exists;
    END IF;
    SELECT v_WordId as WordId;
END //

-- 6. Custom Quiz (TranslatedText Dahil)
CREATE PROCEDURE sp_GetCustomQuiz(
    IN p_UserId INT,
    IN p_CategoryId INT,
    IN p_Level VARCHAR(5),
    IN p_Limit INT
)
BEGIN
    DECLARE v_NativeLangId INT;
    DECLARE v_TargetLangId INT;
    SELECT NativeLangId, CurrentTargetLangId INTO v_NativeLangId, v_TargetLangId FROM Users WHERE Id = p_UserId;

    SELECT 
        w.Id as WordId,
        wt_target.Translation as TargetWord,
        wt_native.Translation as NativeWord,
        wt_target.Level,
        wt_target.WordType,
        ws.SampleText,
        ws.TranslatedText as SampleTranslation
    FROM Words w
    JOIN WordTranslations wt_target ON w.Id = wt_target.WordId AND wt_target.LangId = v_TargetLangId
    JOIN WordTranslations wt_native ON w.Id = wt_native.WordId AND wt_native.LangId = v_NativeLangId
    LEFT JOIN WordSamples ws ON w.Id = ws.WordId AND ws.LangId = v_TargetLangId
    WHERE (p_CategoryId IS NULL OR w.CategoryId = p_CategoryId)
      AND (p_Level IS NULL OR wt_target.Level = p_Level)
      AND w.Active = 1
    ORDER BY RAND()
    LIMIT p_Limit;
END //

-- SORU YÖNETİMİ
CREATE PROCEDURE sp_AddQuestion(
    IN p_WordId INT,
    IN p_SourceLangId INT,
    IN p_LangId INT,
    IN p_Level VARCHAR(5),
    IN p_Type ENUM('Multiple Choice', 'True/False', 'Short Answer', 'Matching'),
    IN p_Text TEXT,
    IN p_Options JSON,
    IN p_CorrectAnswer VARCHAR(255),
    IN p_Explanation TEXT
)
BEGIN
    INSERT INTO Questions (WordId, SourceLangId, LangId, Level, QuestionType, QuestionText, Options, CorrectAnswer, Explanation)
    VALUES (p_WordId, p_SourceLangId, p_LangId, p_Level, p_Type, p_Text, p_Options, p_CorrectAnswer, p_Explanation);
    SELECT LAST_INSERT_ID() as QuestionId;
END //

CREATE PROCEDURE sp_GetQuestionsForWord(IN p_WordId INT, IN p_SourceLangId INT, IN p_Limit INT)
BEGIN
    SELECT * FROM Questions WHERE WordId = p_WordId AND SourceLangId = p_SourceLangId ORDER BY RAND() LIMIT p_Limit;
END //

CREATE PROCEDURE sp_GetGeneralQuestions(IN p_SourceLangId INT, IN p_LangId INT, IN p_Level VARCHAR(5), IN p_Limit INT)
BEGIN
    SELECT * FROM Questions WHERE SourceLangId = p_SourceLangId AND LangId = p_LangId AND (p_Level IS NULL OR Level = p_Level) ORDER BY RAND() LIMIT p_Limit;
END //

DELIMITER ;
