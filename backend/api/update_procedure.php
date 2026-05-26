<?php
require_once 'backend/api/conn.php';

$sql = "
DROP PROCEDURE IF EXISTS sp_UpdateWordProgress;
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

    -- 1. Get current word status
    SELECT LearnRank, Status INTO v_CurrentRank, v_Status
    FROM UserWords
    WHERE UserId = p_UserId AND WordId = p_WordId;

    -- 2. Streak Logic: ANY activity (correct or incorrect) counts towards the streak
    SELECT StreakDays, LastActivityDate INTO v_CurrentStreak, v_LastActivity FROM Users WHERE Id = p_UserId;

    IF v_LastActivity IS NULL OR v_LastActivity < CURDATE() THEN
        IF v_LastActivity = DATE_SUB(CURDATE(), INTERVAL 1 DAY) THEN
            -- Continued streak
            UPDATE Users SET StreakDays = StreakDays + 1, LastActivityDate = CURDATE() WHERE Id = p_UserId;
        ELSE
            -- New streak or broken streak (was NULL or older than 1 day)
            UPDATE Users SET StreakDays = 1, LastActivityDate = CURDATE() WHERE Id = p_UserId;
        END IF;
    END IF;

    -- 3. Handle Correct/Incorrect Answer Logic for the word itself
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
        -- On wrong answer, reset progress but keep learning status
        SET v_CurrentRank = 0;
        SET v_Interval = 0;
        SET v_Status = 1;
    END IF;

    -- 4. Update Word Status
    UPDATE UserWords
    SET LearnRank = v_CurrentRank,
        Status = v_Status,
        LastLearnDate = NOW(),
        NextReviewDate = IF(v_Status = 2, NULL, DATE_ADD(NOW(), INTERVAL v_Interval DAY))
    WHERE UserId = p_UserId AND WordId = p_WordId;
END;
";

try {
    $pdo->exec($sql);
    echo "sp_UpdateWordProgress updated successfully.\n";
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
