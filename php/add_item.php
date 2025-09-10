<?php
require_once 'db_connect.php';
require_once 'log_activity.php';
// require_once 'handle_image_upload.php'; // SE ELIMINA ESTA LÍNEA QUE CAUSABA EL ERROR.
header('Content-Type: application/json');
session_start();

$response = ['success' => false, 'message' => ''];

if (!isset($_SESSION['user_id'])) {
    $response['message'] = 'Acceso no autorizado.';
    echo json_encode($response);
    exit;
}

/**
 * Genera un código de ítem único y secuencial.
 * Busca el número más alto en los códigos existentes y devuelve el siguiente.
 * @param mysqli $conn Conexión a la base de datos.
 * @param string $prefix Prefijo para el código (ej: 'INV-').
 * @return string El nuevo código único (ej: 'INV-00001').
 */
function generateUniqueCodigoItem($conn, $prefix = 'INV-') {
    $stmt = $conn->prepare("SELECT codigo_item FROM inventory_items WHERE codigo_item LIKE ? ORDER BY id DESC LIMIT 1");
    $search_prefix = $prefix . '%';
    $stmt->bind_param("s", $search_prefix);
    $stmt->execute();
    $result = $stmt->get_result();
    $last_item = $result->fetch_assoc();
    $stmt->close();

    $number = 0;
    if ($last_item) {
        $number = (int)str_replace($prefix, '', $last_item['codigo_item']);
    }

    $new_number = $number + 1;
    $new_codigo = $prefix . str_pad($new_number, 5, '0', STR_PAD_LEFT);

    return $new_codigo;
}

if (!isset($_POST['name']) || !isset($_POST['category']) || !isset($_POST['status'])) {
    $response['message'] = 'Faltan datos requeridos (nombre, categoría, estado).';
    echo json_encode($response);
    exit;
}

// --- Recopilar y sanitizar datos del formulario ---
$node_id = !empty($_POST['node_id']) ? $_POST['node_id'] : null;
$name = trim($_POST['name']);
$quantity = (int)($_POST['quantity'] ?? 1);
$category = trim($_POST['category']);
$description = trim($_POST['description'] ?? '');
$incorporacion = !empty($_POST['incorporacion']) ? trim($_POST['incorporacion']) : null;
$status = trim($_POST['status']);
$encargado = trim($_POST['encargado'] ?? 'No Asignado');
$imagePath = null; // Se inicializa como nulo.

// --- Generar el código de ítem único ---
$codigo_item = generateUniqueCodigoItem($conn);

// --- Manejo de la subida de la imagen ---
// SE COMENTA ESTA SECCIÓN. Tu sistema actual de imágenes debería manejar esto.
// Si tu sistema de imágenes actualiza la ruta en la base de datos después,
// esta implementación funcionará bien.
/*
if (isset($_FILES['itemImage']) && $_FILES['itemImage']['error'] === UPLOAD_ERR_OK) {
    // Aquí deberías llamar a tu función de subida de imágenes
    // Por ejemplo: $imagePath = tuFuncionDeImagenes($_FILES['itemImage']);
}
*/


// --- Insertar en la base de datos ---
$sql = "INSERT INTO inventory_items (codigo_item, node_id, name, quantity, category, description, incorporacion, status, imagePath, encargado) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";

$stmt = $conn->prepare($sql);
if (!$stmt) {
    $response['message'] = 'Error al preparar la consulta: ' . $conn->error;
    echo json_encode($response);
    exit;
}

$stmt->bind_param(
    "sssissssss",
    $codigo_item,
    $node_id,
    $name,
    $quantity,
    $category,
    $description,
    $incorporacion,
    $status,
    $imagePath,
    $encargado
);

if ($stmt->execute()) {
    $response['success'] = true;
    $response['message'] = 'Ítem agregado con éxito.';
    
    $log_details = "Usuario '{$_SESSION['username']}' agregó el nuevo ítem '$name' con código '$codigo_item'.";
    log_activity($conn, $_SESSION['user_id'], $_SESSION['username'], 'add_item', $log_details);
} else {
    if ($conn->errno == 1062) {
         $response['message'] = "Error: El código de ítem '$codigo_item' ya existe. Intente de nuevo.";
    } else {
         $response['message'] = 'Error al agregar el ítem: ' . $stmt->error;
    }
}

$stmt->close();
$conn->close();

echo json_encode($response);
?>