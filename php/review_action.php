<?php
require_once 'db_connect.php';
require_once 'log_activity.php';
header('Content-Type: application/json');
session_start();

$response = ['success' => false, 'message' => ''];
$is_admin = isset($_SESSION['is_admin']) && $_SESSION['is_admin'] === true;

if (!$is_admin) {
    $response['message'] = 'Acceso denegado.';
    echo json_encode($response);
    exit;
}

$action_id = isset($_POST['action_id']) ? (int)$_POST['action_id'] : 0;
$review_status = isset($_POST['status']) ? $_POST['status'] : '';
$review_comment = isset($_POST['comment']) ? trim($_POST['comment']) : '';

if (empty($action_id) || !in_array($review_status, ['approved', 'rejected'])) {
    $response['message'] = 'Datos de revisión no válidos.';
    echo json_encode($response);
    exit;
}

$conn->begin_transaction();
try {
    $stmt_get = $conn->prepare("SELECT * FROM pending_actions WHERE id = ? AND status = 'pending'");
    $stmt_get->bind_param("i", $action_id);
    $stmt_get->execute();
    $result = $stmt_get->get_result();
    $action = $result->fetch_assoc();
    $stmt_get->close();

    if (!$action) {
        throw new Exception("Solicitud no encontrada o ya procesada.");
    }
    
    $requester_id = (int)$action['user_id'];
    $admin_username = $_SESSION['username'];

    $item_id = $action['item_id'] ?? null;
    $item_name_for_log = '';
    
    // Si la acción es 'approved', ejecutar la lógica de la acción
    if ($review_status === 'approved') {
        $action_data = json_decode($action['action_data'], true);
        
        switch ($action['action_type']) {
            case 'edit':
                $action_text = 'editar';
                $item_name_for_log = $action_data['name'] ?? 'ítem editado';

                $stmt_edit = $conn->prepare("UPDATE inventory_items SET name = ?, description = ?, category = ?, quantity = ?, status = ?, encargado = ? WHERE id = ?");
                $stmt_edit->bind_param("sssssii", $action_data['name'], $action_data['description'], $action_data['category'], $action_data['quantity'], $action_data['status'], $action_data['encargado'], $item_id);
                if (!$stmt_edit->execute()) throw new Exception('Error al editar el ítem: ' . $stmt_edit->error);
                $stmt_edit->close();

                log_activity($conn, $_SESSION['user_id'], $admin_username, 'item_edited_by_admin', "El administrador '{$admin_username}' aprobó la edición del ítem '{$item_name_for_log}'.", $requester_id);
                break;
                
            case 'transfer':
                $action_text = 'traspasar';
                $item_name_for_log = $action_data['item_name'] ?? 'ítem traspasado';

                $stmt_transfer = $conn->prepare("UPDATE inventory_items SET node_id = ?, encargado = ? WHERE id = ?");
                $stmt_transfer->bind_param("ssi", $action_data['new_node_id'], $action_data['new_encargado'], $item_id);
                if (!$stmt_transfer->execute()) throw new Exception('Error al traspasar el ítem: ' . $stmt_transfer->error);
                $stmt_transfer->close();

                log_activity($conn, $_SESSION['user_id'], $admin_username, 'item_transferred_by_admin', "El administrador '{$admin_username}' aprobó el traspaso del ítem '{$item_name_for_log}'.", $requester_id);
                break;
                
            case 'decommission':
                $action_text = 'dar de baja';
                $item_name_for_log = $action_data['item_name'] ?? 'ítem dado de baja';

                $stmt_decommission = $conn->prepare("UPDATE inventory_items SET status = 'B' WHERE id = ?");
                $stmt_decommission->bind_param("i", $item_id);
                if (!$stmt_decommission->execute()) throw new Exception('Error al dar de baja el ítem: ' . $stmt_decommission->error);
                $stmt_decommission->close();

                log_activity($conn, $_SESSION['user_id'], $admin_username, 'item_decommissioned_by_admin', "El administrador '{$admin_username}' aprobó la baja del ítem '{$item_name_for_log}'.", $requester_id);
                break;

            default:
                throw new Exception("Tipo de acción desconocido.");
        }
        $log_action_type = 'request_approved';
        $log_details = "Su solicitud para {$action_text} el ítem '{$item_name_for_log}' ha sido APROBADA.";
    } else {
        $action_data = json_decode($action['action_data'], true);
        $action_text = match($action['action_type']) {
            'edit' => 'editar',
            'transfer' => 'traspasar',
            'decommission' => 'dar de baja',
            'import' => 'importar',
            default => 'realizar una acción'
        };
        $item_name_for_log = $action_data['item_name'] ?? 'un ítem';

        $log_action_type = 'request_rejected';
        $log_details = "Su solicitud para {$action_text} el ítem '{$item_name_for_log}' ha sido RECHAZADA.";
    }

    if (!empty($review_comment)) {
        $log_details .= " Comentario del admin: '" . $review_comment . "'";
    }
    
    // Loguear la acción para el usuario que hizo la solicitud
    log_activity($conn, $_SESSION['user_id'], $admin_username, $log_action_type, $log_details, $requester_id);

    $stmt_update = $conn->prepare("UPDATE pending_actions SET status = ?, reviewed_by = ?, reviewed_at = NOW(), review_comment = ? WHERE id = ?");
    $stmt_update->bind_param("sisi", $review_status, $_SESSION['user_id'], $review_comment, $action_id);
    if (!$stmt_update->execute()) throw new Exception("Fallo al actualizar el estado de la solicitud.");
    $stmt_update->close();

    $conn->commit();
    $response['success'] = true;
    $response['message'] = 'Solicitud procesada correctamente.';

} catch (Exception $e) {
    $conn->rollback();
    $response['message'] = 'Error al procesar la solicitud: ' . $e->getMessage();
}

$conn->close();
echo json_encode($response);
?>