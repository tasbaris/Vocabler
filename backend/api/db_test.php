<?php
$host = 'db';
$user = 'root';
$pass = 'root_password';
$db   = 'vocabler';
$charset = 'utf8mb4';

$dsn = "mysql:host=$host;dbname=$db;charset=$charset";
$options = [
    PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    PDO::ATTR_EMULATE_PREPARES   => false,
];

try {
     $pdo = new PDO($dsn, $user, $pass, $options);
     echo "Veritabanına PDO ile başarıyla bağlanıldı! <br>";

     $query = $pdo->query("SHOW TABLES");
     echo "Tablolar: <br>";
     while ($row = $query->fetch(PDO::FETCH_NUM)) {
         echo "- " . $row[0] . "<br>";
     }

} catch (\PDOException $e) {
     throw new \PDOException($e->getMessage(), (int)$e->getCode());
}
?>