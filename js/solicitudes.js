document.addEventListener('DOMContentLoaded', async () => {
    const isAdmin = sessionStorage.getItem('isAdmin') === 'true';
    if (!isAdmin) {
        window.location.href = 'index.html';
        return;
    }
    loadPendingActions();
});

const API_URL = 'php/';

async function loadPendingActions() {
    const requestsContent = document.getElementById('requests-content');
    requestsContent.innerHTML = '<p>Cargando solicitudes...</p>';
    try {
        const response = await fetch(`${API_URL}get_pending_actions.php`);
        const result = await response.json();

        if (result.success && result.data.length > 0) {
            renderActions(result.data);
        } else if (result.success) {
            requestsContent.innerHTML = '<p>No hay solicitudes pendientes de aprobación.</p>';
        } else {
            requestsContent.innerHTML = `<p>Error al cargar las solicitudes: ${result.message}</p>`;
        }
    } catch (error) {
        console.error('Error de conexión:', error);
        requestsContent.innerHTML = '<p>Error de conexión al cargar las solicitudes.</p>';
    }
}

function renderActions(actions) {
    const requestsContent = document.getElementById('requests-content');
    let html = '';
    actions.forEach(action => {
        const actionDetails = formatActionDetails(action);
        html += `
            <div class="request-card">
                <div class="request-header">
                    <span class="action-type ${action.action_type}">${actionDetails.title}</span>
                    <span class="request-user">Usuario: <strong>${action.username}</strong></span>
                    <span class="request-date">${new Date(action.created_at).toLocaleString('es-AR')}</span>
                </div>
                <div class="request-body">
                    ${actionDetails.body}
                </div>
                <div class="request-footer">
                    <button class="button review-btn" data-action-id="${action.id}">Revisar</button>
                </div>
            </div>
        `;
    });
    requestsContent.innerHTML = html;
    
    document.querySelectorAll('.review-btn').forEach(button => {
        button.addEventListener('click', () => {
            const action = actions.find(a => a.id == button.dataset.actionId);
            showReviewModal(action);
        });
    });
}

function formatActionDetails(action) {
    // Verificación de seguridad: si action_data es nulo, devuelve un mensaje de error.
    if (!action.action_data) {
        return { title: 'Error en Solicitud', body: '<p>Los datos de esta solicitud están corruptos o incompletos.</p>' };
    }
    const data = JSON.parse(action.action_data);
    if (!data) {
        return { title: 'Error en Solicitud', body: '<p>No se pudieron leer los detalles de la solicitud.</p>' };
    }

    switch (action.action_type) {
        case 'decommission':
            return {
                title: 'Solicitud de Baja',
                body: `<p>Solicitud para dar de baja el ítem: <strong>${data.item_name || `ID ${data.item_id}`}</strong>.</p>`
            };
        case 'edit':
            let editDetails = '<ul>';
            for (const key in data) {
                if (['name', 'quantity', 'category', 'description', 'acquisitionDate', 'status'].includes(key)) {
                    editDetails += `<li><strong>${key.charAt(0).toUpperCase() + key.slice(1)}:</strong> ${data[key] || 'No especificado'}</li>`;
                }
            }
            editDetails += '</ul>';
            return {
                title: 'Edición',
                body: `<p>Solicitud para editar el ítem <strong>ID ${data.id || 'desconocido'}</strong> con los siguientes datos:</p>${editDetails}`
            };
        case 'transfer':
             return {
                title: 'Traspaso',
                body: `<p>Solicitud para traspasar el ítem <strong>${data.item_name || `ID ${data.item_id}`}</strong> al área con ID <strong>${data.destination_node_id}</strong>.</p><p><strong>Motivo:</strong> ${data.reason || 'No especificado'}</p>`
            };
        case 'import':
            return {
                title: 'Importación Masiva',
                body: `<p>Solicitud para importar <strong>${data.length}</strong> ítems desde un archivo XLSX.</p>`
            };
        default:
            return { title: 'Desconocido', body: '<p>Detalles no disponibles.</p>' };
    }
}

function showReviewModal(action) {
    const modal = document.getElementById('review-modal');
    const actionDetails = formatActionDetails(action);

    document.getElementById('review-action-id').value = action.id;
    document.getElementById('review-username').textContent = action.username;
    document.getElementById('review-action-type').textContent = actionDetails.title;
    document.getElementById('review-details').innerHTML = actionDetails.body;
    document.getElementById('review-comment').value = '';
    
    const approveBtn = modal.querySelector('.approve-btn');
    const rejectBtn = modal.querySelector('.reject-btn');

    const handleReview = async (status) => {
        const formData = new FormData();
        formData.append('action_id', document.getElementById('review-action-id').value);
        formData.append('comment', document.getElementById('review-comment').value);
        formData.append('status', status);

        try {
            const response = await fetch(`${API_URL}review_action.php`, {
                method: 'POST',
                body: formData
            });
            const result = await response.json();
            
            if (result.success) {
                alert('Acción revisada correctamente.');
                modal.style.display = 'none';
                loadPendingActions();
            } else {
                alert(`Error al revisar: ${result.message}`);
            }

        } catch (error) {
            console.error('Error de conexión:', error);
            alert('Error de conexión al procesar la solicitud.');
        }
    };

    approveBtn.onclick = () => handleReview('approved');
    rejectBtn.onclick = () => handleReview('rejected');
    
    modal.querySelector('.close-modal').onclick = () => {
        modal.style.display = 'none';
        approveBtn.onclick = null;
        rejectBtn.onclick = null;
    };
    
    modal.style.display = 'flex';
}