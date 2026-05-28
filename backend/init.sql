-- Vocabler Database Initialization Script
-- Final Optimized Version (Synchronized with Docker Environment)

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- 1. Diller Tablosu
CREATE TABLE IF NOT EXISTS Languages (
    Id INT AUTO_INCREMENT PRIMARY KEY,
    LangCode VARCHAR(10) NOT NULL UNIQUE,
    LangName VARCHAR(50) NOT NULL,
    Active TINYINT DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Kullanıcılar Tablosu
CREATE TABLE IF NOT EXISTS Users (
    Id INT AUTO_INCREMENT PRIMARY KEY,
    UserName VARCHAR(50) NOT NULL UNIQUE,
    Email VARCHAR(100) NOT NULL UNIQUE,
    PasswordHash VARCHAR(255) NOT NULL,
    Name VARCHAR(50),
    Surname VARCHAR(50),
    NativeLangId INT,
    CurrentTargetLangId INT,
    DailyWord INT DEFAULT 10,
    Level ENUM('A1', 'A2', 'B1', 'B2', 'C1', 'C2') DEFAULT 'A1',
    StreakDays INT DEFAULT 0,
    LastActivityDate DATE,
    CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (NativeLangId) REFERENCES Languages(Id) ON DELETE SET NULL,
    FOREIGN KEY (CurrentTargetLangId) REFERENCES Languages(Id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Kategoriler Tablosu
CREATE TABLE IF NOT EXISTS Categories (
    Id INT AUTO_INCREMENT PRIMARY KEY,
    CategoryName VARCHAR(100) NOT NULL,
    Active TINYINT DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Kelimeler Tablosu (Ana Kök)
CREATE TABLE IF NOT EXISTS Words (
    Id INT AUTO_INCREMENT PRIMARY KEY,
    CategoryId INT,
    Picture VARCHAR(255),
    AddedById INT,
    Active TINYINT DEFAULT 1,
    CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (CategoryId) REFERENCES Categories(Id) ON DELETE SET NULL,
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
    TargetLangId INT NOT NULL,
    NativeLangId INT NOT NULL,
    SampleText VARCHAR(255) NOT NULL,
    TranslatedText VARCHAR(255) NULL,
    FOREIGN KEY (WordId) REFERENCES Words(Id) ON DELETE CASCADE,
    FOREIGN KEY (TargetLangId) REFERENCES Languages(Id) ON DELETE CASCADE,
    FOREIGN KEY (NativeLangId) REFERENCES Languages(Id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. Kullanıcı Kelime Takip Tablosu (SRS Algoritması İçin)
CREATE TABLE IF NOT EXISTS UserWords (
    Id INT AUTO_INCREMENT PRIMARY KEY,
    UserId INT NOT NULL,
    NativeLangId INT NOT NULL,
    TargetLangId INT NOT NULL,
    WordId INT NOT NULL,
    LearnRank TINYINT NOT NULL DEFAULT 0 COMMENT '0-6 arası seviye',
    LastLearnDate DATETIME,
    NextReviewDate DATETIME,
    Status TINYINT DEFAULT 0 COMMENT '0:Bekliyor, 1:Öğreniliyor, 2:Mastered',
    CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (UserId) REFERENCES Users(Id) ON DELETE CASCADE,
    FOREIGN KEY (NativeLangId) REFERENCES Languages(Id) ON DELETE CASCADE,
    FOREIGN KEY (TargetLangId) REFERENCES Languages(Id) ON DELETE CASCADE,
    FOREIGN KEY (WordId) REFERENCES Words(Id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. Hikayeler Tablosu (Word Chain)
CREATE TABLE IF NOT EXISTS Stories (
  Id INT AUTO_INCREMENT PRIMARY KEY,
  UserId INT NOT NULL,
  StoryText TEXT NOT NULL,
  ImageUrl VARCHAR(255) DEFAULT NULL,
  Words VARCHAR(255) NOT NULL,
  CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (UserId) REFERENCES Users(Id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 9. Sabit Sorular Tablosu
CREATE TABLE IF NOT EXISTS Questions (
    Id INT AUTO_INCREMENT PRIMARY KEY,
    WordId INT NULL,
    NativeLangId INT NOT NULL,
    TargetLangId INT NOT NULL,
    Level VARCHAR(5) NOT NULL,
    QuestionType ENUM('Multiple Choice', 'True/False', 'Short Answer', 'Matching') NOT NULL,
    QuestionText TEXT NOT NULL,    
    Options JSON DEFAULT NULL,
    CorrectAnswer VARCHAR(255) NOT NULL,
    Explanation TEXT,
    ImageUrl VARCHAR(255) DEFAULT NULL,
    CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (WordId) REFERENCES Words(Id) ON DELETE SET NULL,
    FOREIGN KEY (TargetLangId) REFERENCES Languages(Id) ON DELETE CASCADE,
    FOREIGN KEY (NativeLangId) REFERENCES Languages(Id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 10. Şifre Sıfırlama Tablosu
CREATE TABLE IF NOT EXISTS PasswordResets (
    Id INT AUTO_INCREMENT PRIMARY KEY,
    UserId INT NOT NULL,
    ResetToken VARCHAR(100) NOT NULL,
    CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    ExpiresAt DATETIME NOT NULL,
    IsUsed TINYINT DEFAULT 0,
    FOREIGN KEY (UserId) REFERENCES Users(Id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;

-- BAŞLANGIÇ VERİLERİ
INSERT IGNORE INTO Languages (Id, LangCode, LangName, Active) VALUES 
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
(1, 'General'), (2, 'Cooking'), (3, 'Travel'), (4, 'Business'), (5, 'Education'), 
(6, 'Health'), (7, 'Technology'), (8, 'Sports'), (9, 'Entertainment'), (10, 'Nature');

-- SAKLI YORDAMLAR (STORED PROCEDURES)
DELIMITER //

-- Kullanıcıya Kelime Atama (Dil Duyarlı)
DROP PROCEDURE IF EXISTS sp_AssignWordsToUser //
CREATE PROCEDURE sp_AssignWordsToUser(
    IN p_UserId INT,
    IN p_CategoryId INT,
    IN p_TargetLangId INT,
    IN p_Limit INT
)
BEGIN
    DECLARE v_NativeLangId INT;
    SELECT NativeLangId INTO v_NativeLangId FROM Users WHERE Id = p_UserId;

    IF v_NativeLangId IS NOT NULL THEN
        INSERT IGNORE INTO UserWords (UserId, NativeLangId, TargetLangId, WordId, Status, NextReviewDate)
        SELECT p_UserId, v_NativeLangId, p_TargetLangId, w.Id, 0, NOW()
        FROM Words w
        WHERE (p_CategoryId IS NULL OR w.CategoryId = p_CategoryId)
          AND w.Active = 1
          AND EXISTS (SELECT 1 FROM WordTranslations wt WHERE wt.WordId = w.Id AND wt.LangId = p_TargetLangId)
          AND EXISTS (SELECT 1 FROM WordTranslations wt WHERE wt.WordId = w.Id AND wt.LangId = v_NativeLangId)
          AND NOT EXISTS (
              SELECT 1 FROM UserWords uw 
              WHERE uw.UserId = p_UserId 
                AND uw.WordId = w.Id 
                AND uw.TargetLangId = p_TargetLangId
          )
        LIMIT p_Limit;
    END IF;
END //

-- Kelime İlerleme Güncelleme (SRS)
DROP PROCEDURE IF EXISTS sp_UpdateWordProgress //
CREATE PROCEDURE sp_UpdateWordProgress(
    IN p_UserId INT,
    IN p_WordId INT,
    IN p_IsCorrect TINYINT
)
BEGIN
    DECLARE v_CurrentRank TINYINT;
    DECLARE v_Interval INT;
    DECLARE v_Status TINYINT;
    DECLARE v_LastActivity DATE;
    DECLARE v_CurrentStreak INT;

    SELECT LearnRank, Status INTO v_CurrentRank, v_Status
    FROM UserWords 
    WHERE UserId = p_UserId AND WordId = p_WordId;

    SELECT StreakDays, LastActivityDate INTO v_CurrentStreak, v_LastActivity FROM Users WHERE Id = p_UserId;
    
    IF v_LastActivity IS NULL OR v_LastActivity < CURDATE() THEN
        IF v_LastActivity = DATE_SUB(CURDATE(), INTERVAL 1 DAY) THEN
            UPDATE Users SET StreakDays = StreakDays + 1, LastActivityDate = CURDATE() WHERE Id = p_UserId;
        ELSE
            UPDATE Users SET StreakDays = 1, LastActivityDate = CURDATE() WHERE Id = p_UserId;
        END IF;
    END IF;

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
                SET v_Status = 2; -- Mastered
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

-- Günlük Kelimeleri Getir
DROP PROCEDURE IF EXISTS sp_GetDailyWords //
CREATE PROCEDURE sp_GetDailyWords(
    IN p_UserId INT
)
BEGIN
    DECLARE v_DailyLimit INT;
    DECLARE v_NewWordsStartedToday INT;
    DECLARE v_RemainingNewWords INT;

    SELECT DailyWord INTO v_DailyLimit FROM Users WHERE Id = p_UserId;

    SELECT COUNT(*) INTO v_NewWordsStartedToday 
    FROM UserWords 
    WHERE UserId = p_UserId 
      AND (LearnRank >= 1 OR Status = 2)
      AND DATE(LastLearnDate) = CURDATE()
      AND WordId NOT IN (SELECT WordId FROM UserWords WHERE UserId = p_UserId AND DATE(LastLearnDate) < CURDATE());

    SET v_RemainingNewWords = v_DailyLimit - v_NewWordsStartedToday;
    IF v_RemainingNewWords < 0 THEN SET v_RemainingNewWords = 0; END IF;

    SELECT WordId, TargetLangId, NativeLangId, LearnRank FROM (
        (SELECT uw.WordId, uw.TargetLangId, uw.NativeLangId, uw.LearnRank, 1 as Priority, uw.NextReviewDate
         FROM UserWords uw
         WHERE uw.UserId = p_UserId 
           AND uw.Status = 1 
           AND (uw.NextReviewDate <= NOW() OR uw.NextReviewDate IS NULL))
        UNION ALL
        (SELECT uw.WordId, uw.TargetLangId, uw.NativeLangId, uw.LearnRank, 2 as Priority, uw.NextReviewDate
         FROM UserWords uw
         WHERE uw.UserId = p_UserId AND uw.Status = 0
         LIMIT v_RemainingNewWords)
    ) as Combined
    ORDER BY Priority ASC, NextReviewDate ASC;
END //

-- Dashboard Özet İstatistikleri
DROP PROCEDURE IF EXISTS sp_GetDashboardSummary //
CREATE PROCEDURE sp_GetDashboardSummary(
    IN p_UserId INT
)
BEGIN
    DECLARE v_DailyNewGoal INT;
    DECLARE v_NewDoneToday INT;
    DECLARE v_ReviewsDoneToday INT;
    DECLARE v_ReviewsPendingNow INT;

    SELECT DailyWord INTO v_DailyNewGoal FROM Users WHERE Id = p_UserId;

    SELECT COUNT(*) INTO v_NewDoneToday
    FROM UserWords
    WHERE UserId = p_UserId
      AND DATE(LastLearnDate) = CURDATE()
      AND (LearnRank >= 1 OR Status = 2)
      AND WordId NOT IN (SELECT WordId FROM UserWords WHERE UserId = p_UserId AND DATE(LastLearnDate) < CURDATE());

    SELECT COUNT(*) INTO v_ReviewsDoneToday
    FROM UserWords
    WHERE UserId = p_UserId
      AND DATE(LastLearnDate) = CURDATE()
      AND WordId IN (SELECT WordId FROM UserWords WHERE UserId = p_UserId AND DATE(LastLearnDate) < CURDATE());

    SELECT COUNT(*) INTO v_ReviewsPendingNow
    FROM UserWords
    WHERE UserId = p_UserId 
      AND Status = 1 
      AND (NextReviewDate <= NOW() OR NextReviewDate IS NULL);

    SELECT
        SUM(CASE WHEN Status = 2 THEN 1 ELSE 0 END) as MasteredCount,
        v_ReviewsPendingNow as OverdueCount,
        SUM(CASE WHEN Status = 1 THEN 1 ELSE 0 END) as LearningCount,
        COUNT(*) as TotalWords,
        v_NewDoneToday as NewWordsDone,
        v_DailyNewGoal as NewWordsGoal,
        v_ReviewsDoneToday as ReviewsDone,
        (v_ReviewsDoneToday + v_ReviewsPendingNow) as TotalReviewsGoal
    FROM UserWords
    WHERE UserId = p_UserId;
END //

-- Toplu Global Kelime Ekleme (Admin/Sistem İçin)
DROP PROCEDURE IF EXISTS sp_AddGlobalWord //
CREATE PROCEDURE sp_AddGlobalWord(
    IN p_TargetTranslation VARCHAR(255),
    IN p_NativeTranslation VARCHAR(255),
    IN p_Level ENUM('A1', 'A2', 'B1', 'B2', 'C1', 'C2'),
    IN p_CategoryId INT,
    IN p_WordType VARCHAR(20),
    IN p_SampleText VARCHAR(255),
    IN p_SampleTranslation VARCHAR(255),
    IN p_Picture VARCHAR(255)
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
        INSERT INTO Words (CategoryId, Picture, AddedById, Active) VALUES (p_CategoryId, p_Picture, NULL, 1);
        SET v_WordId = LAST_INSERT_ID();
        INSERT INTO WordTranslations (WordId, LangId, Level, WordType, Translation)
        VALUES (v_WordId, v_EN_Id, p_Level, p_WordType, p_TargetTranslation);
        INSERT INTO WordTranslations (WordId, LangId, Level, WordType, Translation)
        VALUES (v_WordId, v_TR_Id, p_Level, p_WordType, p_NativeTranslation);
        IF p_SampleText IS NOT NULL THEN
            INSERT INTO WordSamples (WordId, TargetLangId, NativeLangId, SampleText, TranslatedText)
            VALUES (v_WordId, v_EN_Id, v_TR_Id, p_SampleText, p_SampleTranslation);
        END IF;
    ELSE
        SET v_WordId = v_Exists;
        IF p_Picture IS NOT NULL THEN
            UPDATE Words SET Picture = p_Picture WHERE Id = v_WordId;
        END IF;
    END IF;
    SELECT v_WordId as WordId;
END //

DELIMITER ;
