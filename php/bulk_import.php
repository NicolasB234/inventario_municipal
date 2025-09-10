<?php
require_once 'db_connect.php';
require_once 'log_activity.php';
require_once 'org-structure-data.php';
require_once 'utils.php';
header('Content-Type: application/json');
session_start();

$response = ['success' => false, 'message' => ''];
$is_admin = isset($_SESSION['is_admin']) && $_SESSION['is_admin'] === true;

ini_set('memory_limit', '512M');

if (!isset($_SESSION['user_id'])) {
    $response['message'] = 'Acceso no autorizado.';
    echo json_encode($response);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    $response['message'] = 'Método no permitido.';
    echo json_encode($response);
    exit;
}

$json_data = file_get_contents('php://input');
$items = json_decode($json_data, true);

if (json_last_error() !== JSON_ERROR_NONE || !is_array($items)) { // Permitir array vacío
    $response['message'] = 'Error en los datos recibidos o formato incorrecto.';
    echo json_encode($response);
    exit;
}

function bind_params_array(mysqli_stmt $stmt, string $types, array $params) {
    $refs = [];
    $refs[] = &$types;
    foreach ($params as $i => $value) {
        $refs[] = &$params[$i];
    }
    return call_user_func_array([$stmt, 'bind_param'], $refs);
}

function deduplicatePayloadByCodigo(array $payload): array {
    $unique_items = [];
    foreach ($payload as $row) {
        $codigo = trim($row['codigo_item'] ?? $row['codigo'] ?? '');
        if ($codigo === '') {
            continue; // Ignorar filas sin código
        }
        // FORZAMOS LA CLAVE A SER STRING para evitar conflictos con códigos numéricos.
        $unique_items['code_' . $codigo] = $row; 
    }
    return array_values($unique_items); // Devuelve un array indexado normalmente
}


if ($is_admin) {
    $areaMap = createAreaMap($orgStructure);
    $areaMap['Sin Area'] = null;

    $conn->begin_transaction();
    $processed_count = 0;
    $skipped_items = 0;

    try {
        if (empty($items)) {
            throw new Exception("El archivo no contiene ítems para procesar.");
        }
        
        $items_to_process = deduplicatePayloadByCodigo($items);
        $total_items_in_file = count($items_to_process);

        if ($total_items_in_file === 0) {
             throw new Exception("No se encontraron ítems con 'codigo_item' válido para procesar.");
        }

        $onDuplicateKeyUpdateClause = " ON DUPLICATE KEY UPDATE
            node_id = IF(VALUES(node_id) IS NOT NULL, VALUES(node_id), node_id),
            name = IF(VALUES(name) IS NOT NULL AND VALUES(name) <> '', VALUES(name), name),
            quantity = VALUES(quantity),
            category = IF(VALUES(category) IS NOT NULL AND VALUES(category) <> '', VALUES(category), category),
            description = IF(VALUES(description) IS NOT NULL AND VALUES(description) <> '', VALUES(description), description),
            imagePath = IF(VALUES(imagePath) IS NOT NULL AND VALUES(imagePath) <> '', VALUES(imagePath), imagePath),
            incorporacion = IF(VALUES(incorporacion) IS NOT NULL, VALUES(incorporacion), incorporacion),
            status = IF(VALUES(status) IS NOT NULL AND VALUES(status) <> '', VALUES(status), status),
            encargado = IF(VALUES(encargado) IS NOT NULL AND VALUES(encargado) <> '', VALUES(encargado), encargado)
        ";

        $queryBase = "INSERT INTO inventory_items 
            (codigo_item, node_id, name, quantity, category, description, imagePath, incorporacion, status, encargado) 
            VALUES ";
        $placeholdersPerItem = "(?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
        $batchSize = 300;
        $currentBatch = [];

        foreach ($items_to_process as $item) {
            $areaName = trim($item['area'] ?? '');
            if (empty($areaName)) $areaName = 'Sin Area';
            $node_id = $areaMap[$areaName] ?? null;

            if ($node_id === null && $areaName !== 'Sin Area') {
                $skipped_items++;
                continue;
            }

            if ($node_id !== null && !in_array($node_id, $affected_areas_temp ?? [], true)) {
                $affected_areas_temp[] = $node_id;
            }

            $codigo_item = trim((string)($item['codigo_item'] ?? ''));
            if ($codigo_item === '') {
                 $skipped_items++;
                 continue;
            }

            // --- INICIO DE SANITIZACIÓN ROBUSTA ---
            $name = trim((string)($item['nombre'] ?? ''));
            $quantity = (int)($item['cantidad'] ?? 1);
            if ($quantity <= 0) $quantity = 1; // Asegurar que la cantidad sea al menos 1
            $category = trim((string)($item['categoria'] ?? $item['category'] ?? ''));
            $description = trim((string)($item['descripcion'] ?? $item['description'] ?? ''));
            $imagePath = trim((string)($item['imagePath'] ?? $item['image'] ?? $item['imagen'] ?? ''));
            $imagePath = ($imagePath !== '') ? $imagePath : null; // Guardar null si está vacío

            if ($imagePath && !preg_match('#^https?://#i', $imagePath) && strpos($imagePath, '/') !== 0 && stripos($imagePath, 'uploads/') !== 0) {
                $imagePath = 'uploads/' . ltrim($imagePath, '/');
            }
            
            $incorporacion = !empty($item['incorporacion']) ? trim($item['incorporacion']) : null;
            
            $statusLabel = strtolower(trim($item['estado'] ?? ''));
            $statusMap = ['apto'=>'A','no apto'=>'N','recuperable'=>'R','de baja'=>'D', 'bueno' => 'B', 'nuevo' => 'M', 'regular' => 'S'];
            $status = $statusMap[$statusLabel] ?? '';

            $encargado = trim((string)($item['encargado'] ?? ''));
            // --- FIN DE SANITIZACIÓN ROBUSTA ---

            $currentBatch = array_merge($currentBatch, [
                $codigo_item, $node_id, $name, $quantity, $category, 
                $description, $imagePath, $incorporacion, $status, $encargado
            ]);
            $processed_count++;

            if (($processed_count % $batchSize === 0) || ($processed_count === $total_items_in_file)) {
                $items_in_batch = count($currentBatch) / 10;
                $valuesPart = implode(',', array_fill(0, $items_in_batch, $placeholdersPerItem));
                
                $stmt = $conn->prepare($queryBase . $valuesPart . $onDuplicateKeyUpdateClause);
                if (!$stmt) throw new Exception("Error preparando consulta: " . $conn->error);
                
                $types = str_repeat('sssissssss', $items_in_batch);
                if (!bind_params_array($stmt, $types, $currentBatch)) throw new Exception("Error bind_param: ".$stmt->error);
                if (!$stmt->execute()) throw new Exception("Error ejecutando batch: ".$stmt->error);

                $stmt->close();
                $currentBatch = [];
            }
        }

        $conn->commit();
        $response['success'] = true;
        
        $message = "Importación completada. Se procesaron {$processed_count} registro(s) del archivo.";
        if ($skipped_items > 0) $message .= " Se omitieron {$skipped_items} ítem(s) por área no encontrada o código inválido.";
        $response['message'] = $message;
        log_activity($conn, $_SESSION['user_id'], $_SESSION['username'], 'import_admin', $message);
        
        if (!empty($affected_areas_temp)) {
            foreach ($affected_areas_temp as $area_id) {
                $stmt_find_users = $conn->prepare("SELECT id FROM users WHERE area_id = ?");
                if (!$stmt_find_users) continue;
                $stmt_find_users->bind_param("s", $area_id);
                $stmt_find_users->execute();
                $users_result = $stmt_find_users->get_result();
                while ($user = $users_result->fetch_assoc()) {
                    $areaNameForLog = getAreaNameById($orgStructure, $area_id) ?? 'desconocida';
                    $user_notification_details = "El administrador '{$_SESSION['username']}' importó/actualizó ítems en tu área ({$areaNameForLog}).";
                    log_activity($conn, $_SESSION['user_id'], $_SESSION['username'], 'bulk_import_by_admin', $user_notification_details, $user['id']);
                }
                $stmt_find_users->close();
            }
        }

    } catch (Exception $e) {
        $conn->rollback();
        $response['message'] = 'Error durante la importación: '.$e->getMessage();
    }

} else {
    // Lógica para usuarios no-admin (sin cambios)
    $action_data = json_encode($items);
    $stmt_request = $conn->prepare("INSERT INTO pending_actions (user_id, username, action_type, action_data, status) VALUES (?, ?, 'import', ?, 'pending')");
    $stmt_request->bind_param("iss", $_SESSION['user_id'], $_SESSION['username'], $action_data);

    if ($stmt_request->execute()) {
        $response['success'] = true;
        $response['message'] = 'Solicitud de importación enviada para aprobación.';
    } else {
        $response['message'] = 'Error al enviar la solicitud de importación.';
    }
    $stmt_request->close();
}

$conn->close();
echo json_encode($response);