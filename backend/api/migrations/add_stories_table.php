<?php
require_once __DIR__ . '/../conn.php';

try {
    $sql = "CREATE TABLE IF NOT EXISTS Stories (
        Id INT AUTO_INCREMENT PRIMARY KEY,
        UserId INT NOT NULL,
        StoryText TEXT NOT NULL,
        ImageUrl VARCHAR(255) DEFAULT NULL,
        Words VARCHAR(255) NOT NULL,
        CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (UserId) REFERENCES Users(Id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;";

    $pdo->exec($sql);
    echo "Stories table created successfully.\n";
} catch (PDOException $e) {
    echo "Error creating table: " . $e->getMessage() . "\n";
}
