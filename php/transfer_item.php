<?php
require_once 'db_connect.php';
require_once 'log_activity.php';
require_once 'org-structure-data.php';
require_once 'utils.php';
header('Content-Type: application/json');
session_start();

$response = ['success' => false, 'message' => ''];
$is_admin = $_SESSION['is_admin'] ?? false;

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

$itemId = $_POST['itemId'] ?? 0;
$destinationNodeId = $_POST['destinationNodeId'] ?? '';
$reason = $_POST['reason'] ?? '';
// --- INICIO DE LA CORRECCIÓN ---
// Se captura el nuevo encargado desde el formulario.
$new_encargado = trim($_POST['new_encargado'] ?? 'No Asignado');
// --- FIN DE LA CORRECCIÓN ---

if (empty($itemId) || empty($destinationNodeId)) {
    $response['message'] = 'Faltan datos para realizar el traspaso.';
    echo json_encode($response);
    exit;
}

$stmt_item = $conn->prepare("SELECT name, node_id FROM inventory_items WHERE id = ?");
$stmt_item->bind_param("i", $itemId);
$stmt_item->execute();
$item_result = $stmt_item->get_result();
$item = $item_result->fetch_assoc();
$stmt_item->close();

if (!$item) {
    $response['message'] = 'El ítem a traspasar no existe.';
    echo json_encode($response);
    exit;
}

$originAreaName = getAreaNameById($orgStructure, $item['node_id']) ?? 'un área desconocida';
$destinationAreaName = getAreaNameById($orgStructure, $destinationNodeId) ?? 'un área desconocida';

// --- INICIO DE LA CORRECCIÓN ---
// Se añade 'new_encargado' a los datos de la acción.
$action_data = [
    'item_id' => $itemId,
    'item_name' => $item['name'],
    'destination_node_id' => $destinationNodeId,
    'reason' => $reason,
    'new_encargado' => $new_encargado
];
// --- FIN DE LA CORRECCIÓN ---

if ($is_admin) {
    $conn->begin_transaction();
    try {
        // --- INICIO DE LA CORRECCIÓN ---
        // Si el admin hace el traspaso directo, también se actualiza el encargado.
        $stmt_update = $conn->prepare("UPDATE inventory_items SET node_id = ?, encargado = ? WHERE id = ?");
        $stmt_update->bind_param("ssi", $destinationNodeId, $new_encargado, $itemId);
        // --- FIN DE LA CORRECCIÓN ---
        
        if ($stmt_update->execute()) {
            $stmt_update->close();
            $conn->commit();
            $response['success'] = true;
            $response['message'] = 'Ítem traspasado correctamente.';

            $details = "Admin '{$_SESSION['username']}' traspasó el ítem '{$item['name']}' desde '{$originAreaName}' hacia '{$destinationAreaName}' (Encargado: {$new_encargado}).";
            log_activity($conn, $_SESSION['user_id'], $_SESSION['username'], 'item_transferred_admin', $details);
        } else {
            throw new Exception('No se pudo actualizar el área o el encargado del ítem.');
        }
    } catch (Exception $e) {
        $conn->rollback();
        $response['message'] = 'Error en el traspaso: ' . $e->getMessage();
    }
} else {
    $json_data = json_encode($action_data);
    $stmt_request = $conn->prepare(
        "INSERT INTO pending_actions (user_id, username, action_type, item_id, action_data, status) VALUES (?, ?, 'transfer', ?, ?, 'pending')"
    );
    $stmt_request->bind_param("isis", $_SESSION['user_id'], $_SESSION['username'], $itemId, $json_data);

    if ($stmt_request->execute()) {
        $response['success'] = true;
        $response['message'] = 'Solicitud de traspaso enviada para aprobación.';

        $details = "Usuario '{$_SESSION['username']}' solicitó traspasar el ítem '{$item['name']}' desde '{$originAreaName}' hacia '{$destinationAreaName}'.";
        log_activity($conn, $_SESSION['user_id'], $_SESSION['username'], 'request_transfer', $details);
    } else {
        $response['message'] = 'Error al enviar la solicitud de traspaso.';
    }
    $stmt_request->close();
}

$conn->close();
echo json_encode($response);