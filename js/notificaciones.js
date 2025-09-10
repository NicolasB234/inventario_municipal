document.addEventListener('DOMContentLoaded', async () => {
    const logsContent = document.getElementById('logs-content');
    const API_URL = 'php/';

    try {
        const response = await fetch(`${API_URL}get_log.php`);
        const result = await response.json();

        if (result.success && result.data.length > 0) {
            const table = document.createElement('table');
            table.className = 'log-table';
            
            let tableHTML = `
                <thead>
                    <tr>
                        <th>Fecha y Hora</th>
                        <th>Usuario</th>
                        <th>Tipo de Acción</th>
                        <th>Detalles</th>
                    </tr>
                </thead>
                <tbody>
            `;

            result.data.forEach(log => {
                const date = new Date(log.timestamp).toLocaleString('es-AR');
                tableHTML += `
                    <tr>
                        <td>${date}</td>
                        <td>${log.username}</td>
                        <td>${log.action_type}</td>
                        <td>${log.details}</td>
                    </tr>
                `;
            });

            tableHTML += '</tbody>';
            table.innerHTML = tableHTML;
            logsContent.innerHTML = '';
            logsContent.appendChild(table);

        } else if (result.success) {
            logsContent.innerHTML = '<p>No hay registros de actividad en el sistema.</p>';
        } else {
            logsContent.innerHTML = `<p>Error al cargar los registros: ${result.message}</p>`;
        }
    } catch (error) {
        console.error('Error al obtener los logs:', error);
        logsContent.innerHTML = '<p>Error de conexión al cargar el historial de actividad.</p>';
    }
});