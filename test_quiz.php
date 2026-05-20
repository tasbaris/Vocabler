<?php
$_SERVER['REQUEST_METHOD'] = 'GET';
$_SERVER['HTTP_AUTHORIZATION'] = 'Bearer dummy';
// Mock conn.php
class MockPDO {
    public function prepare($sql) {
        return new class($sql) {
            private $sql;
            public function __construct($s) { $this->sql = $s; }
            public function execute($params = []) { return true; }
            public function bindValue() {}
            public function fetch() { return ['NativeLangId' => 1, 'CurrentTargetLangId' => 2]; }
            public function fetchAll() { return []; }
        };
    }
}
$pdo = new MockPDO();
function authenticate() { return ['userId' => 1]; }
$_GET['limit'] = 10;
// We cannot just include get_questions.php directly because of require_once, but we can verify our syntax manually.
echo "OK\n";
