<?php
// db_connect.php

// --- INICIO DE LA CORRECCIÓN ---
// En un entorno de producción, es mejor desactivar la visualización de errores
// y registrarlos en un archivo de log en su lugar.
// Para depuración, puedes descomentar las siguientes líneas.
/*
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);
*/
// --- FIN DE LA CORRECCIÓN ---

$servername = "localhost"; // Asegúrate de que estos datos sean correctos
$username = "root";             // Tu usuario de la base de datos
$password = "";   // La contraseña de tu cuenta de hosting
$dbname = "if0_39455541_inventaio_municipal";  // El nombre de tu base de datos

// Crear conexión
$conn = new mysqli($servername, $username, $password, $dbname);

// Verificar conexión
if ($conn->connect_error) {
    // Si la conexión falla, detenemos todo y mostramos un error genérico.
    // En un sistema en producción, deberías registrar el error detallado en un archivo.
    error_log("Error de conexión a la base de datos: " . $conn->connect_error);
    http_response_code(500);
    die("Error de conexión al servidor. Por favor, intente más tarde.");
}

// Opcional pero recomendado: Establecer el conjunto de caracteres a UTF-8
$conn->set_charset("utf8mb4");
?>