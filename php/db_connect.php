<?php
// db_connect.php

// --- INICIO DE LA CORRECCIÓN ---
// Se añaden estas líneas para forzar la visualización de errores y diagnosticar problemas.
// En un sitio en producción, esto debería estar desactivado, pero es vital para la depuración.
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);
// --- FIN DE LA CORRECCIÓN ---

$servername = "localhost"; // Asegúrate de que estos datos sean correctos
$username = "root";             // Tu usuario de la base de datos
$password = "";   // La contraseña de tu cuenta de hosting
$dbname = "if0_39455541_inventaio_municipal";  // El nombre de tu base de datos

// Crear conexión
$conn = new mysqli($servername, $username, $password, $dbname);

// Verificar conexión
if ($conn->connect_error) {
    // Si la conexión falla, detenemos todo y mostramos un error claro.
    die("Error de conexión a la base de datos: " . $conn->connect_error);
}

// Opcional pero recomendado: Establecer el conjunto de caracteres a UTF-8
$conn->set_charset("utf8mb4");
?>