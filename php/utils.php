<?php
// php/utils.php

/**
 * Busca de forma recursiva el nombre de un nodo (área) a partir de su ID.
 *
 * @param array $nodes La estructura del organigrama donde buscar.
 * @param string $id El ID del nodo a encontrar.
 * @return string|null El nombre del nodo o null si no se encuentra.
 */
function getAreaNameById($nodes, $id) {
    foreach ($nodes as $node) {
        if ($node['id'] === $id) {
            return $node['name'];
        }
        if (!empty($node['children'])) {
            $found = getAreaNameById($node['children'], $id);
            if ($found) {
                return $found;
            }
        }
    }
    return null;
}

/**
 * Crea un mapa asociativo de 'Nombre del Área' => 'ID del Área'.
 * Ahora mapea desde el nombre corto, haciendo la importación más flexible.
 *
 * @param array $structure La estructura completa del organigrama.
 * @return array El mapa generado.
 */
function createAreaMap($structure) {
    $map = [];
    $traverse = function ($nodes, &$map) use (&$traverse) {
        foreach ($nodes as $node) {
            // Mapea el nombre corto al ID.
            // Nota: Si hay nombres de área duplicados, este método usará el último que encuentre.
            // Para la estructura actual, esto es seguro.
            $map[trim($node['name'])] = $node['id'];
            if (!empty($node['children'])) {
                $traverse($node['children'], $map);
            }
        }
    };
    $traverse($structure, $map);
    return $map;
}
?>