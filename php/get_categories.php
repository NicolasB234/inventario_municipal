<?php
require_once 'db_connect.php';
header('Content-Type: application/json');

$response = ['success' => false, 'data' => []];

try {
    // Consulta para obtener todas las categorías únicas que no estén vacías o nulas, ordenadas alfabéticamente.
    $result = $conn->query("SELECT DISTINCT category FROM inventory_items WHERE category IS NOT NULL AND category != '' ORDER BY category ASC");
    
    $categories = [];
    while ($row = $result->fetch_assoc()) {
        $categories[] = $row['category'];
    }

    $response['success'] = true;
    $response['data'] = $categories;

} catch (Exception $e) {
    $response['message'] = 'Error de servidor: ' . $e->getMessage();
}

$conn->close();
echo json_encode($response);
?>