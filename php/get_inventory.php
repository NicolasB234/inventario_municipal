<?php
require_once 'db_connect.php';
header('Content-Type: application/json');
session_start();

$response = ['success' => false, 'data' => [], 'total' => 0];
$node_id = $_GET['node_id'] ?? '';
$is_admin = $_SESSION['is_admin'] ?? false;
$page = isset($_GET['page']) ? (int)$_GET['page'] : 1;
$limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 20;
$offset = ($page - 1) * $limit;

if (empty($node_id) && !$is_admin) {
    $response['message'] = 'Node ID no proporcionado.';
    echo json_encode($response);
    exit;
}

try {
    // --- INICIO DE LA MODIFICACIÓN: Lógica de Filtros ---
    $base_sql = "FROM inventory_items WHERE status != 'D'";
    $params = [];
    $types = "";

    // Filtro base por área (si no es admin viendo todas las áreas)
    if (!($is_admin && empty($node_id))) {
        $base_sql .= " AND node_id = ?";
        $params[] = $node_id;
        $types .= "s";
    }

    // Añadir filtros de la URL
    if (!empty($_GET['filter_codigo'])) {
        $base_sql .= " AND codigo_item LIKE ?";
        $params[] = '%' . $_GET['filter_codigo'] . '%';
        $types .= "s";
    }
    if (!empty($_GET['filter_name'])) {
        $base_sql .= " AND name LIKE ?";
        $params[] = '%' . $_GET['filter_name'] . '%';
        $types .= "s";
    }
    if (!empty($_GET['filter_category'])) {
        $base_sql .= " AND category = ?";
        $params[] = $_GET['filter_category'];
        $types .= "s";
    }
    if (!empty($_GET['filter_status'])) {
        $base_sql .= " AND status = ?";
        $params[] = $_GET['filter_status'];
        $types .= "s";
    }
    if (!empty($_GET['filter_date_from'])) {
        $base_sql .= " AND incorporacion >= ?";
        $params[] = $_GET['filter_date_from'];
        $types .= "s";
    }
    if (!empty($_GET['filter_date_to'])) {
        $base_sql .= " AND incorporacion <= ?";
        $params[] = $_GET['filter_date_to'];
        $types .= "s";
    }

    // --- Contar el total de ítems CON filtros ---
    $count_sql = "SELECT COUNT(*) as total " . $base_sql;
    $stmt_count = $conn->prepare($count_sql);
    if ($types) {
        $stmt_count->bind_param($types, ...$params);
    }
    $stmt_count->execute();
    $count_result = $stmt_count->get_result()->fetch_assoc();
    $response['total'] = (int)$count_result['total'];
    $stmt_count->close();

    // --- Obtener los ítems paginados CON filtros ---
    $data_sql = "SELECT id, node_id, name, quantity, category, description, incorporacion, status, imagePath, encargado, codigo_item " . $base_sql . " ORDER BY name ASC LIMIT ? OFFSET ?";
    $params[] = $limit;
    $params[] = $offset;
    $types .= "ii";

    $stmt = $conn->prepare($data_sql);
    $stmt->bind_param($types, ...$params);
    $stmt->execute();
    $result = $stmt->get_result();
    
    $items = [];
    while ($row = $result->fetch_assoc()) {
        $row['id'] = (int)$row['id'];
        $row['quantity'] = (int)$row['quantity'];
        $items[] = $row;
    }

    $response['success'] = true;
    $response['data'] = $items;
    $stmt->close();
    // --- FIN DE LA MODIFICACIÓN ---

} catch (Exception $e) {
    $response['message'] = 'Error de servidor: ' . $e->getMessage();
}

$conn->close();
echo json_encode($response, JSON_INVALID_UTF8_SUBSTITUTE);
?>