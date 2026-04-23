<?php
$host = 'db';
$user = 'root';
$pass = 'root_password';
$db   = 'vocabler';

$conn = new mysqli($host, $user, $pass, $db);

if ($conn->connect_error) {
    die("Bağlantı hatası: " . $conn->connect_error);
}

echo "Veritabanına başarıyla bağlanıldı! <br>";

$result = $conn->query("SHOW TABLES");
echo "Tablolar: <br>";
while($row = $result->fetch_array()) {
    echo "- " . $row[0] . "<br>";
}
?>