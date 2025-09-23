// --- INICIO DE LA MODIFICACIÓN ---
// Se elimina la importación innecesaria y errónea de 'statusOptions'.
import { orgStructure } from './org-structure.js';
import { displayInventory, setupModalClosers } from './inventory-functions.js';

/**
 * Normaliza un texto: lo convierte a minúsculas y le quita los acentos.
 * Esto permite hacer búsquedas flexibles que ignoran tildes y mayúsculas.
 * @param {string} text El texto a normalizar.
 * @returns {string} El texto normalizado.
 */
function normalizeText(text) {
    if (!text) return '';
    return text
        .toLowerCase()
        .normalize("NFD") // Descompone los caracteres acentuados en letra + acento
        .replace(/[\u0300-\u036f]/g, ""); // Elimina los acentos
}
// --- FIN DE LA MODIFICACIÓN ---

const PHP_BASE_URL = 'php/';

// --- LÓGICA DE NOTIFICACIONES ---
let localNotifications = [];
let lastNotificationId = 0;
let lastAdminRequestCount = 0;
let lastAdminLogId = 0;
let pollingInterval;

function startPolling() {
    if (pollingInterval) return;
    fetchUpdates();
    pollingInterval = setInterval(fetchUpdates, 5000);
}

function stopPolling() {
    clearInterval(pollingInterval);
    pollingInterval = null;
}

function addNotificationToList(notif) {
    localNotifications.unshift({
        id: notif.id,
        message: notif.details,
        timestamp: notif.timestamp
    });
    if (localNotifications.length > 20) localNotifications.pop();
}

function updateNotificationCounter(count) {
    const counterElement = document.getElementById('notification-counter');
    const bellButton = document.getElementById('notification-bell-btn');
    if (!counterElement || !bellButton) return;

    if (count > 0) {
        counterElement.textContent = count;
        counterElement.style.display = 'block';
        bellButton.classList.add('has-notifications');
    } else {
        counterElement.style.display = 'none';
        bellButton.classList.remove('has-notifications');
    }
}

function shakeBell() {
    const bellButton = document.getElementById('notification-bell-btn');
    if (bellButton) {
        bellButton.classList.add('new-notification');
        setTimeout(() => bellButton.classList.remove('new-notification'), 500);
    }
}

async function fetchUpdates() {
    const isAdmin = sessionStorage.getItem('isAdmin') === 'true';
    const lastId = isAdmin ? lastAdminLogId : lastNotificationId;

    try {
        const response = await fetch(`${PHP_BASE_URL}get_updates.php?last_id=${lastId}`);
        const data = await response.json();

        if (isAdmin) {
            const newRequestCount = data.pending_admin_requests || 0;
            if (newRequestCount > lastAdminRequestCount) {
                shakeBell();
            }
            updateNotificationCounter(newRequestCount);
            lastAdminRequestCount = newRequestCount;

            if (data.new_notifications && data.new_notifications.length > 0) {
                data.new_notifications.forEach(notif => {
                    addNotificationToList(notif);
                    lastAdminLogId = Math.max(lastAdminLogId, notif.id);
                });

                const selectedNodeElement = document.querySelector('#org-nav .node-content.selected');
                if (selectedNodeElement) {
                    const nodeId = (selectedNodeElement.id === 'all-areas-btn') ? '' : selectedNodeElement.parentElement.dataset.nodeId;
                    const nodeName = selectedNodeElement.textContent.trim();
                    displayInventory({ id: nodeId, name: nodeName }, true);
                }
            }
        } else {
            if (data.new_notifications && data.new_notifications.length > 0) {
                data.new_notifications.forEach(notif => {
                    addNotificationToList(notif);
                    lastNotificationId = Math.max(lastNotificationId, notif.id);
                });
                shakeBell();
                updateNotificationCounter(localNotifications.length);
            }

            if (data.refresh_inventory) {
                const selectedNodeElement = document.querySelector('#org-nav .node-content.selected');
                if (selectedNodeElement) {
                    const nodeId = selectedNodeElement.parentElement.dataset.nodeId;
                    const nodeName = selectedNodeElement.textContent.trim();
                    displayInventory({ id: nodeId, name: nodeName }, false);
                }
            }
        }
    } catch (error) {
        console.error('Error en el polling de actualizaciones:', error);
    }
}

function initializeNotifications() {
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            stopPolling();
        } else {
            startPolling();
        }
    });

    if (!document.hidden) {
        startPolling();
    }
}

function toggleNotifPanel() {
    const isAdmin = sessionStorage.getItem('isAdmin') === 'true';
    const notificationBellButton = document.getElementById('notification-bell-btn');
    const existingPanel = document.querySelector('.notifications-panel');
    if (existingPanel) {
        existingPanel.remove();
        return;
    }

    const notifPanel = document.createElement('div');
    notifPanel.className = 'notifications-panel';
    let notificationsHtml = `<h3>${isAdmin ? 'Actividad del Sistema' : 'Mis Notificaciones'}</h3><div class="notifications-list">`;

    if (isAdmin) {
        if (localNotifications.length === 0 && lastAdminRequestCount === 0) {
            notificationsHtml += '<p>No hay actividad reciente.</p>';
        } else {
            if (lastAdminRequestCount > 0) {
                notificationsHtml += `<p>Hay <strong>${lastAdminRequestCount}</strong> solicitud(es) esperando revisión.</p>`;
            }
            localNotifications.forEach(notif => {
                 const date = new Date(notif.timestamp).toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' });
                 const areaRegex = /(al área|del área|en el área|desde|hacia)\s'([^']+)'/g;
                 const styledMessage = notif.message.replace(areaRegex, (match, keyword, areaName) => {
                     return `${keyword} '<span class="notif-area">${areaName}</span>'`;
                 });
                 notificationsHtml += `<p>[${date}] <strong>${styledMessage}</strong></p>`;
            });
        }
    } else {
        if (localNotifications.length === 0) {
            notificationsHtml += '<p>No hay notificaciones para mostrar.</p>';
        } else {
            localNotifications.forEach(notif => {
                const date = new Date(notif.timestamp).toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' });
                const areaRegex = /(al área|del área|en el área|desde|hacia)\s'([^']+)'/g;
                const styledMessage = notif.message.replace(areaRegex, (match, keyword, areaName) => {
                    return `${keyword} '<span class="notif-area">${areaName}</span>'`;
                });
                notificationsHtml += `<p>[${date}] <strong>${styledMessage}</strong></p>`;
            });
        }
    }

    const link = isAdmin ? 'solicitudes.html' : 'notificaciones.html';
    const linkText = isAdmin ? `Ir a Solicitudes (${lastAdminRequestCount})` : 'Ver todo el historial';
    notificationsHtml += `</div><a href="${link}" class="view-all-notifs">${linkText}</a>`;

    notifPanel.innerHTML = notificationsHtml;
    document.body.appendChild(notifPanel);

    localNotifications = [];
    if (!isAdmin) {
        updateNotificationCounter(0);
    }

    setTimeout(() => {
        const closePanel = (e) => {
            if (!notifPanel.contains(e.target) && e.target !== notificationBellButton && !notificationBellButton.contains(e.target)) {
                notifPanel.remove();
                document.removeEventListener('click', closePanel);
            }
        };
        document.addEventListener('click', closePanel);
    }, 0);
}

async function handleLogin(username, password) {
    const formData = new FormData();
    formData.append('username', username);
    formData.append('password', password);
    try {
        const response = await fetch(`${PHP_BASE_URL}login.php`, { method: 'POST', body: formData });
        return await response.json();
    } catch (error) {
        console.error('Error en handleLogin:', error);
        return { success: false, message: 'Error de conexión.' };
    }
}

// CAMBIO: La función de registro ahora también envía si el usuario es admin
async function handleRegister(username, password, areaId, isAdmin) {
    const formData = new FormData();
    formData.append('username', username);
    formData.append('password', password);
    formData.append('area_id', areaId);
    if (isAdmin) {
        formData.append('is_admin', '1');
    }
    try {
        const response = await fetch(`${PHP_BASE_URL}register.php`, { method: 'POST', body: formData });
        return await response.json();
    } catch (error) {
        console.error('Error en handleRegister:', error);
        return { success: false, message: 'Error de conexión.' };
    }
}

async function checkLoginStatusFromServer() {
    try {
        const response = await fetch(`${PHP_BASE_URL}check_session.php`);
        return await response.json();
    } catch (error) {
        console.error('Error en checkLoginStatusFromServer:', error);
        return { loggedIn: false };
    }
}

function getAllInventoryNodes(structure) {
    let nodes = [];
    function traverse(arr, path = []) {
        arr.forEach(item => {
            const currentPath = [...path, item.name];
            if (['departamento', 'coordinacion', 'area', 'direccion', 'subdireccion', 'subsecretaria', 'secretaria', 'celda', 'intendencia', 'viceintendencia'].includes(item.type)) {
                nodes.push({ id: item.id, name: currentPath.join(' > ') });
            }
            if (item.children) {
                traverse(item.children, currentPath);
            }
        });
    }
    traverse(structure);
    return nodes;
}

function findNodeById(id, nodes) {
    for (const node of nodes) {
        if (node.id === id) {
            return node;
        }
        if (node.children) {
            const found = findNodeById(id, node.children);
            if (found) {
                return found;
            }
        }
    }
    return null;
}

document.addEventListener('DOMContentLoaded', async () => {

    if (document.getElementById('login-section')) {
        const loginStatus = await checkLoginStatusFromServer();
        if (loginStatus.loggedIn) {
            window.location.href = 'index.html';
            return;
        }

        const loginForm = document.getElementById('login-section');
        const registerForm = document.getElementById('register-section');
        const loginMessage = document.getElementById('login-message');
        const registerMessage = document.getElementById('register-message');

        document.querySelectorAll('.toggle-form').forEach(button => {
            button.addEventListener('click', () => {
                loginForm.classList.toggle('active');
                registerForm.classList.toggle('active');
                loginMessage.textContent = '';
                registerMessage.textContent = '';
            });
        });

        document.getElementById('login-btn').addEventListener('click', async () => {
            const username = document.getElementById('login-username').value.trim();
            const password = document.getElementById('login-password').value.trim();
            if (!username || !password) {
                loginMessage.textContent = 'Por favor, introduce usuario y contraseña.';
                return;
            }
            const result = await handleLogin(username, password);
            if (result.success) {
                sessionStorage.setItem('userAreaId', result.areaId);
                sessionStorage.setItem('username', username);
                sessionStorage.setItem('isAdmin', result.isAdmin || false);
                window.location.href = 'index.html';
            } else {
                loginMessage.textContent = result.message || 'Error al iniciar sesión.';
            }
        });

        const searchInput = document.getElementById('area-search-input');
        const searchResults = document.getElementById('area-search-results');
        const hiddenAreaIdInput = document.getElementById('register-area-id');
        const allAreas = getAllInventoryNodes(orgStructure);

        searchInput.addEventListener('input', () => {
            const query = normalizeText(searchInput.value);
            searchResults.innerHTML = '';
            hiddenAreaIdInput.value = '';
            if (query.length < 2) {
                searchResults.style.display = 'none';
                return;
            }
            const filteredAreas = allAreas.filter(area => normalizeText(area.name).includes(query));
            if (filteredAreas.length > 0) {
                filteredAreas.forEach(area => {
                    const item = document.createElement('div');
                    item.className = 'result-item';
                    item.textContent = area.name;
                    item.addEventListener('click', () => {
                        searchInput.value = area.name;
                        hiddenAreaIdInput.value = area.id;
                        searchResults.style.display = 'none';
                    });
                    searchResults.appendChild(item);
                });
                searchResults.style.display = 'block';
            } else {
                searchResults.style.display = 'none';
            }
        });

        document.addEventListener('click', (e) => {
            if (!e.target.closest('.search-container')) {
                searchResults.style.display = 'none';
            }
        });

        document.getElementById('register-btn').addEventListener('click', async () => {
            const username = document.getElementById('register-username').value.trim();
            const password = document.getElementById('register-password').value.trim();
            const areaId = hiddenAreaIdInput.value;
            // CAMBIO: Leer el valor del checkbox
            const isAdmin = document.getElementById('register-is-admin').checked;

            if (!username || !password || !areaId) {
                registerMessage.textContent = 'Por favor, rellene todos los campos (incluyendo el área).';
                return;
            }
            // CAMBIO: Enviar el valor del checkbox a la función
            const result = await handleRegister(username, password, areaId, isAdmin);
            registerMessage.textContent = result.message;
            registerMessage.style.color = result.success ? '#2ecc71' : '#e74c3c';
            if (result.success) {
                setTimeout(() => {
                    loginForm.classList.add('active');
                    registerForm.classList.remove('active');
                }, 2000);
            }
        });

    } else if (document.getElementById('inventory-section')) {
        const loginStatus = await checkLoginStatusFromServer();
        if (!loginStatus.loggedIn) {
            window.location.href = 'login.html';
            return;
        }

        setupModalClosers();

        const notificationBellButton = document.getElementById('notification-bell-btn');
        if (notificationBellButton) {
            notificationBellButton.addEventListener('click', toggleNotifPanel);
        }

        initializeNotifications();

        const viewButtons = document.querySelectorAll('.view-btn');
        const viewSections = document.querySelectorAll('.view-section');

        function switchView(viewId) {
            viewSections.forEach(section => section.classList.remove('active'));
            viewButtons.forEach(button => button.classList.remove('active'));
            const activeSection = document.getElementById(viewId);
            if (activeSection) activeSection.classList.add('active');
            const activeButton = document.getElementById(`show-${viewId}-btn`);
            if (activeButton) activeButton.classList.add('active');
        }

        viewButtons.forEach(button => {
            button.addEventListener('click', () => {
                const viewId = button.id.replace('show-', '').replace('-btn', '');
                switchView(viewId);
            });
        });

        const userAreaId = sessionStorage.getItem('userAreaId');
        const currentUsername = sessionStorage.getItem('username');
        const isAdmin = sessionStorage.getItem('isAdmin') === 'true';
        const orgNav = document.getElementById('org-nav');
        const contentTitle = document.getElementById('content-title');
        let selectedNodeElement = null;

        function buildOrgTree(nodes, parentElement) {
            const ul = document.createElement('ul');
            nodes.forEach(node => {
                const li = document.createElement('li');
                li.dataset.nodeId = node.id;
                const nodeContent = document.createElement('div');
                nodeContent.className = 'node-content';
                
                const toggle = document.createElement('span');
                toggle.className = 'toggle';

                const nodeNameSpan = document.createElement('span');
                nodeNameSpan.textContent = node.name;
                nodeNameSpan.className = 'node-name';

                if (node.children && node.children.length > 0) {
                    toggle.innerHTML = '<i class="fas fa-bars"></i>';
                }

                nodeContent.append(toggle, nodeNameSpan);

                nodeContent.onclick = () => {
                    selectNode(li, node);
                    if (node.children && node.children.length > 0) {
                        toggleNode(li);
                    }
                };

                li.appendChild(nodeContent);
                if (node.children) {
                    buildOrgTree(node.children, li);
                }
                ul.appendChild(li);
            });
            parentElement.appendChild(ul);
        }

        function toggleNode(liElement) {
            liElement.classList.toggle('expanded');
        }

        const sidebarToggleBtn = document.getElementById('sidebar-toggle-btn');
        const sidebarOverlay = document.getElementById('sidebar-overlay');
        const body = document.body;

        const openSidebar = () => body.classList.add('sidebar-open');
        const closeSidebar = () => body.classList.remove('sidebar-open');
        
        if (sidebarToggleBtn) sidebarToggleBtn.addEventListener('click', openSidebar);
        if (sidebarOverlay) sidebarOverlay.addEventListener('click', closeSidebar);

        function selectNode(liElement, node) {
            if (selectedNodeElement) {
                selectedNodeElement.classList.remove('selected');
            }

            if (liElement) {
                 liElement.querySelector('.node-content').classList.add('selected');
                 selectedNodeElement = liElement.querySelector('.node-content');
            } else {
                const allAreasButton = document.getElementById('all-areas-btn');
                if (allAreasButton) {
                    allAreasButton.classList.add('selected');
                    selectedNodeElement = allAreasButton;
                }
            }
            
            let title = `Bienvenido`;
            if (isAdmin) {
                title += ` Jefe de Área`;
            }
            title += ` ${currentUsername}`;

            displayInventory({ id: node.id, name: node.name }, isAdmin);
        }
        
        function setupHeaderButtons() {
            const container = document.getElementById('header-right-container');
            if (!container) return;

            const dynamicButtons = container.querySelectorAll('.header-btn, #requests-btn');
            dynamicButtons.forEach(btn => btn.remove());
            
            const historyButton = document.createElement('button');
            historyButton.id = 'history-btn';
            historyButton.innerHTML = '<i class="fas fa-history"></i>';
            historyButton.title = "Historial";
            historyButton.className = "header-btn";
            historyButton.onclick = () => { window.location.href = 'notificaciones.html'; };
            
            const logoutButton = document.createElement('button');
            logoutButton.id = 'logout-btn';
            logoutButton.innerHTML = '<i class="fas fa-sign-out-alt"></i>';
            logoutButton.title = "Cerrar Sesión";
            logoutButton.className = "header-btn";
            logoutButton.addEventListener('click', () => { window.location.href = `${PHP_BASE_URL}logout.php`; });
            
            container.prepend(logoutButton);
            container.prepend(historyButton);

            if (isAdmin) {
                const requestsButton = document.createElement('button');
                requestsButton.id = 'requests-btn';
                requestsButton.innerHTML = '<i class="fas fa-inbox"></i>';
                requestsButton.title = "Solicitudes Pendientes";
                requestsButton.className = "header-btn";
                requestsButton.onclick = () => { window.location.href = 'solicitudes.html'; };
                container.prepend(requestsButton);
            }
        }
        
        function init() {
            orgNav.innerHTML = '';
            
            let welcomeMessage = `Bienvenido`;
            if (isAdmin) {
                welcomeMessage += ` Jefe de Área`;
            }
            welcomeMessage += `, ${currentUsername}`;
            contentTitle.textContent = welcomeMessage;

            setupHeaderButtons();
            const searchContainer = document.querySelector('.sidebar-search-container');

            if (isAdmin) {
                if (searchContainer) searchContainer.style.display = 'block';
                const allAreasButton = document.createElement('div');
                allAreasButton.id = 'all-areas-btn';
                allAreasButton.className = 'node-content';
                allAreasButton.innerHTML = `<i class="fas fa-globe" style="margin-right: 10px;"></i> Todas las Áreas`;
                allAreasButton.onclick = () => selectNode(null, { id: '', name: 'Todas las Áreas' });
                orgNav.appendChild(allAreasButton);
                buildOrgTree(orgStructure, orgNav);
                selectNode(null, { id: '', name: 'Todas las Áreas' });
            } else {
                if (searchContainer) searchContainer.style.display = 'none';
                const userNode = findNodeById(userAreaId, orgStructure);
                
                if (!userNode) {
                    contentTitle.textContent = 'Error de Configuración';
                    document.getElementById('table-view').innerHTML = `<p class="error-message"><b>Error:</b> Su área asignada ('${userAreaId}') no se encontró.</p>`;
                } else {
                    const userAreaStructure = [userNode];
                    buildOrgTree(userAreaStructure, orgNav);
                    
                    const nodeElement = orgNav.querySelector(`li[data-node-id="${userNode.id}"]`);
                    if (nodeElement) {
                       selectNode(nodeElement, userNode);
                       nodeElement.classList.add('expanded');
                    }
                }
            }
        }

        init();
        
        // --- ▼▼▼ LÓGICA COMBINADA ▼▼▼ ---

        // 1. Lógica para el botón de descarga del protocolo
        const downloadProtocolBtn = document.getElementById('download-protocol-btn');
        if (downloadProtocolBtn) {
            downloadProtocolBtn.addEventListener('click', () => {
                // Se añade un mensaje de confirmación antes de la descarga.
                if (confirm("¿Desea descargar la información sobre el Protocolo de Carga?")) {
                    const link = document.createElement('a');
                    link.href = 'uploads/PROTOCOLO DE CARGA.docx';
                    link.download = 'PROTOCOLO DE CARGA.docx';
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                }
            });
        }
        
        // 2. Lógica para la galería de imágenes con navegación
        const imageModal = document.getElementById('image-modal');
        let galleryItems = [];
        let currentImageIndex = -1;

        function updateModalContent(index) {
            if (index < 0 || index >= galleryItems.length) return;
            
            currentImageIndex = index;
            const data = galleryItems[index].dataset;
            
            document.getElementById('modal-image').src = data.imgSrc;
            document.getElementById('modal-item-name').textContent = data.name;
            document.getElementById('modal-item-description').textContent = data.description;
            document.getElementById('modal-item-category').textContent = data.category;
            document.getElementById('modal-item-quantity').textContent = data.quantity;
            document.getElementById('modal-item-status').textContent = data.status;
            document.getElementById('modal-item-date').textContent = data.date;
        }

        if (imageModal) {
            const closeBtn = imageModal.querySelector('.close-modal-gallery');
            const prevBtn = imageModal.querySelector('.prev-gallery-btn');
            const nextBtn = imageModal.querySelector('.next-gallery-btn');

            const closeModal = () => imageModal.style.display = "none";
            
            if(closeBtn) closeBtn.addEventListener('click', closeModal);
            imageModal.addEventListener('click', (e) => {
                 if (e.target === imageModal) closeModal();
            });

            if(prevBtn) {
                prevBtn.addEventListener('click', () => {
                    const newIndex = (currentImageIndex - 1 + galleryItems.length) % galleryItems.length;
                    updateModalContent(newIndex);
                });
            }

            if(nextBtn) {
                nextBtn.addEventListener('click', () => {
                    const newIndex = (currentImageIndex + 1) % galleryItems.length;
                    updateModalContent(newIndex);
                });
            }
        }
        
        const galleryView = document.getElementById('gallery-view');
        if(galleryView) {
            galleryView.addEventListener('click', (event) => {
                const card = event.target.closest('.gallery-card');
                if (card && imageModal) {
                    galleryItems = Array.from(galleryView.querySelectorAll('.gallery-card'));
                    const clickedIndex = galleryItems.findIndex(item => item === card);
                    
                    updateModalContent(clickedIndex);
                    imageModal.style.display = "flex";
                }
            });
        }

        const orgSearchInput = document.getElementById('org-search-input');
        if (orgSearchInput) {
            orgSearchInput.addEventListener('input', () => {
                const searchTerm = normalizeText(orgSearchInput.value);
                const allNodes = orgNav.querySelectorAll('#org-nav li');

                allNodes.forEach(li => {
                    const nodeNameElement = li.querySelector('.node-content > span:last-of-type');
                    const nodeName = nodeNameElement ? normalizeText(nodeNameElement.textContent) : '';
                    if (nodeName.includes(searchTerm)) {
                        li.style.display = "";
                        let parent = li.parentElement.closest('li');
                        while(parent) {
                            parent.style.display = "";
                            parent.classList.add('expanded');
                            const toggle = parent.querySelector('.toggle');
                            if(toggle) toggle.textContent = '▾';
                            parent = parent.parentElement.closest('li');
                        }
                    } else {
                        li.style.display = "none";
                    }
                });
                if(!searchTerm) {
                     allNodes.forEach(li => {
                        li.style.display = "";
                        li.classList.remove('expanded');
                        const toggle = li.querySelector('.toggle');
                        if(toggle && toggle.textContent === '▾') toggle.textContent = '▸';
                     });
                }
            });
        }
    }
});