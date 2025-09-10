import { orgStructure } from './org-structure.js';

const API_URL = 'php/';

export const categories = [
    'Informática', 'Electrónica', 'Mobiliario', 'Vehículos', 'Equipamiento',
    'Herramientas', 'Materiales', 'Oficina', 'Otros electrónicos', 'Servicios',
    'Mobiliario Depósito', 'Equipamiento Logístico', 'Equipamiento Oficina'
];

export const statusOptions = [
  { value: 'A', label: 'Apto' },
  { value: 'N', label: 'No Apto' },
  { value: 'R', label: 'Recuperable' },
  { value: 'B', label: 'Bueno' },
  { value: 'M', label: 'Nuevo' },
  { value: 'S', label: 'Regular' },
  { value: 'D', label: 'De Baja' },
];

function getShortNameNodesMap() {
    const map = new Map();
    function traverse(nodes) {
        nodes.forEach(node => {
            map.set(node.id, node.name);
            if (node.children && node.children.length > 0) {
                traverse(node.children);
            }
        });
    }
    traverse(orgStructure);
    return map;
}
const nodesMap = getShortNameNodesMap();

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

function getFullPathNodesMap() {
    const map = new Map();
    function traverse(nodes, path = []) {
        nodes.forEach(node => {
            const currentPath = [...path, node.name];
            map.set(node.id, currentPath.join(' > '));
            if (node.children && node.children.length > 0) {
                traverse(node.children, currentPath);
            }
        });
    }
    traverse(orgStructure);
    return map;
}

let currentFormSubmitHandler = null;

export function showItemForm(node, item = null) {
    const modal = document.getElementById('modal-agregar-item');
    const form = document.getElementById('form-agregar-item');
    if (!modal || !form) return;

    const isEditing = item !== null;
    form.reset();

    const areaSelectionRow = document.getElementById('area-selection-row');
    const nodeIdInput = form.querySelector('[name="node_id"]');
    const areaSearchInput = document.getElementById('area-search-input-modal');

    // clonar input para evitar listeners dobles (si existe)
    let newAreaSearchInput = null;
    if (areaSearchInput) {
        newAreaSearchInput = areaSearchInput.cloneNode(true);
        areaSearchInput.parentNode.replaceChild(newAreaSearchInput, areaSearchInput);
    }

    const needsAreaSelection = !isEditing && (!node || !node.id);

    if (needsAreaSelection && newAreaSearchInput && areaSelectionRow) {
        areaSelectionRow.style.display = 'block';
        newAreaSearchInput.required = true;
        nodeIdInput.value = '';

        const searchResults = document.getElementById('area-search-results-modal');
        const allAreas = getAllInventoryNodes(orgStructure);

        const searchHandler = () => {
            const query = newAreaSearchInput.value.toLowerCase().trim();
            if (!searchResults) return;
            searchResults.innerHTML = '';
            nodeIdInput.value = '';
            if (query.length < 2) {
                searchResults.style.display = 'none';
                return;
            }
            const filteredAreas = allAreas.filter(area =>
                area.name.toLowerCase().includes(query)
            );
            if (filteredAreas.length > 0) {
                filteredAreas.forEach(area => {
                    const itemDiv = document.createElement('div');
                    itemDiv.className = 'result-item';
                    itemDiv.textContent = area.name;
                    itemDiv.addEventListener('click', () => {
                        newAreaSearchInput.value = area.name;
                        nodeIdInput.value = area.id;
                        searchResults.style.display = 'none';
                    });
                    searchResults.appendChild(itemDiv);
                });
                searchResults.style.display = 'block';
            } else {
                searchResults.style.display = 'none';
            }
        };
        newAreaSearchInput.addEventListener('input', searchHandler);

        document.addEventListener('click', function hideResults(e) {
            if (!e.target.closest('.search-container')) {
                if (searchResults) searchResults.style.display = 'none';
                document.removeEventListener('click', hideResults);
            }
        }, { once: true });

        if (isEditing && item && item.area) {
            newAreaSearchInput.value = item.area;
        }

    } else {
        if (areaSelectionRow) areaSelectionRow.style.display = 'none';
        if (newAreaSearchInput) newAreaSearchInput.required = false;
        nodeIdInput.value = isEditing ? (item.node_id || '') : (node ? node.id : '');
    }

    modal.querySelector('h2').textContent = isEditing ? `Editar Ítem: ${item ? item.name : ''}` : 'Agregar Nuevo Ítem';
    form.querySelector('[name="id"]').value = isEditing && item ? item.id : '';
    
    // --- INICIO DE LA CORRECCIÓN ---
    // Muestra el código del ítem como texto solo si se está editando
    const codigoDisplayRow = document.getElementById('codigo-display-row');
    const codigoDisplayText = document.getElementById('codigo-display-text');
    if (isEditing && item && codigoDisplayRow && codigoDisplayText) {
        codigoDisplayText.textContent = item.codigo_item || 'N/A';
        codigoDisplayRow.style.display = 'flex';
    } else if (codigoDisplayRow) {
        codigoDisplayRow.style.display = 'none';
    }
    // --- FIN DE LA CORRECCIÓN ---
    
    form.querySelector('[name="existingImagePath"]').value = isEditing && item && item.imagePath ? item.imagePath : '';
    form.querySelector('[name="name"]').value = isEditing && item ? item.name : '';
    form.querySelector('[name="quantity"]').value = isEditing && item ? item.quantity : 1;
    form.querySelector('[name="description"]').value = isEditing && item ? item.description : '';
    form.querySelector('[name="incorporacion"]').value = isEditing && item ? item.incorporacion : '';
    form.querySelector('[name="encargado"]').value = isEditing && item ? (item.encargado || 'No Asignado') : 'No Asignado';

    const categorySelect = form.querySelector('[name="category"]');
    categorySelect.innerHTML = categories.map(cat => `<option value="${cat}" ${isEditing && item && item.category === cat ? 'selected' : ''}>${cat}</option>`).join('');

    const statusSelect = form.querySelector('[name="status"]');
    statusSelect.innerHTML = statusOptions.map(option => `<option value="${option.value}" ${isEditing && item && item.status === option.value ? 'selected' : ''}>${option.label}</option>`).join('');

    const imagePreview = document.getElementById('imagePreview');
    const imageInput = document.getElementById('form-itemImage');
    if(imageInput && imagePreview){
        imageInput.onchange = () => {
            if (imageInput.files && imageInput.files[0]) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    imagePreview.src = e.target.result;
                    imagePreview.style.display = 'block';
                };
                reader.readAsDataURL(imageInput.files[0]);
            }
        };

        if (isEditing && item && item.imagePath) {
            imagePreview.src = item.imagePath;
            imagePreview.style.display = 'block';
        } else {
            imagePreview.style.display = 'none';
            imagePreview.src = '#';
        }
    }

    if (currentFormSubmitHandler) {
        form.removeEventListener('submit', currentFormSubmitHandler);
    }

    currentFormSubmitHandler = async (event) => {
        event.preventDefault();

        if (!isEditing && (!node || !node.id) && !form.querySelector('[name="node_id"]').value) {
            alert('Por favor, seleccione un área de destino para el nuevo ítem.');
            return;
        }

        const formData = new FormData(form);
        const endpoint = isEditing ? 'update_item.php' : 'add_item.php';

        try {
            const response = await fetch(API_URL + endpoint, { method: 'POST', body: formData });
            const text = await response.text();
            let result = null;
            try {
                result = JSON.parse(text);
            } catch (err) {
                console.error('Respuesta no JSON del servidor:', text);
                alert('Respuesta inválida del servidor. Revisa la consola para más detalles.');
                return;
            }

            alert(result.message || 'Operación completada.');

            if (result.success) {
                closeItemForm();
                const isAdmin = sessionStorage.getItem('isAdmin') === 'true';
                displayInventory(node, isAdmin);
            }
        } catch (error) {
            console.error('Error al guardar:', error);
            alert('Error de conexión al guardar el ítem.');
        }
    };
    form.addEventListener('submit', currentFormSubmitHandler);
    modal.style.display = 'flex';
}

export function closeItemForm() {
    const modal = document.getElementById('modal-agregar-item');
    if (modal) {
        modal.style.display = 'none';
    }
}

export function setupModalClosers() {
    const modal = document.getElementById('modal-agregar-item');
    if (modal) {
        const closeBtn = modal.querySelector('.close-modal');
        if (closeBtn) closeBtn.addEventListener('click', closeItemForm);
        const cancelBtn = modal.querySelector('#cancel-item-btn');
        if (cancelBtn) cancelBtn.addEventListener('click', closeItemForm);
        modal.addEventListener('click', (e) => { if (e.target === modal) closeItemForm(); });
    }
}

function showTransferForm(node, items) {
    if (items.length === 0) {
        alert('No hay ítems en esta área para traspasar.');
        return;
    }
    if (document.getElementById('transfer-modal')) return;

    const modalOverlay = document.createElement('div');
    modalOverlay.className = 'modal-overlay';
    modalOverlay.id = 'transfer-modal';

    const fullPathMap = getFullPathNodesMap();
    let allNodes = [];
    for (const [id, name] of fullPathMap.entries()) {
        if (id !== node.id) {
            allNodes.push({ id, name });
        }
    }
    allNodes.sort((a, b) => a.name.localeCompare(b.name));

    // --- INICIO DE LA CORRECCIÓN ---
    // Se añade el campo para el nuevo encargado.
    modalOverlay.innerHTML = `
        <div class="modal-content" style="width: 500px; cursor: default;">
            <button class="close-modal" id="cancel-transfer-btn-x">&times;</button>
            <h3>Traspaso de Ítem</h3>
            <form id="transfer-form">
                <div class="form-row"><label>Área Origen:</label><input type="text" value="${node.name}" disabled></div>
                <div class="form-row"><label for="item-to-transfer">Ítem a Traspasar:</label><select id="item-to-transfer" name="itemId" required>
                    <option value="" disabled selected>Seleccione un ítem...</option>
                    ${items.map(item => `<option value="${item.id}">${item.name} (ID: ${item.id})</option>`).join('')}
                </select></div>
                <div class="form-row"><label for="destination-area">Área de Destino:</label><select id="destination-area" name="destinationNodeId" required>
                    <option value="" disabled selected>Seleccione un destino...</option>
                    ${allNodes.map(n => `<option value="${n.id}">${n.name}</option>`).join('')}
                </select></div>
                <div class="form-row">
                    <label for="new-encargado">Nuevo Encargado:</label>
                    <input type="text" id="new-encargado" name="new_encargado" placeholder="Nombre del nuevo responsable" value="No Asignado" required>
                </div>
                <div class="form-row"><label for="transfer-reason">Motivo del Traspaso:</label><textarea id="transfer-reason" name="reason" rows="3" placeholder="Especifique el motivo del traspaso..." required></textarea></div>
                <div class="form-row" style="flex-direction: row; justify-content: flex-end; gap: 10px;">
                    <button type="button" id="cancel-transfer-btn" class="button">Cancelar</button>
                    <button type="submit" class="button">Confirmar Traspaso</button>
                </div>
            </form>
        </div>
    `;
    // --- FIN DE LA CORRECCIÓN ---

    document.body.appendChild(modalOverlay);

    const closeModal = () => modalOverlay.remove();
    const cancelBtn = document.getElementById('cancel-transfer-btn');
    const cancelX = document.getElementById('cancel-transfer-btn-x');
    if (cancelBtn) cancelBtn.onclick = closeModal;
    if (cancelX) cancelX.onclick = closeModal;
    modalOverlay.onclick = (e) => { if (e.target === modalOverlay) closeModal(); };

    document.getElementById('transfer-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        if (!confirm(`¿Está seguro de que desea solicitar el traspaso de este ítem?`)) return;

        try {
            const response = await fetch(`${API_URL}transfer_item.php`, { method: 'POST', body: formData });
            const text = await response.text();
            let result;
            try { result = JSON.parse(text); } catch (err) {
                console.error('Respuesta no JSON en transfer:', text);
                alert('Respuesta inválida del servidor al transferir. Revisa la consola.');
                return;
            }
            alert(result.message || 'Operación completada.');
            if (result.success) {
                closeModal();
                const isAdmin = sessionStorage.getItem('isAdmin') === 'true';
                if (isAdmin) displayInventory(node, isAdmin);
            }
        } catch (error) {
            console.error('Error de conexión:', error);
            alert('Error de conexión al realizar el traspaso.');
        }
    });
}

function exportToXLSX(node, items) {
    if (items.length === 0) {
        alert('No hay datos en esta área para exportar.');
        return;
    }

    const dataToExport = items.map(item => ({
        'codigo_item': item.codigo_item || '',
        nombre: item.name,
        cantidad: item.quantity,
        categoria: item.category,
        descripcion: item.description || '',
        incorporacion: item.incorporacion,
        estado: statusOptions.find(s => s.value === item.status)?.label || item.status,
        area: nodesMap.get(item.node_id) || 'N/A',
        encargado: item.encargado || 'No Asignado'
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Inventario");
    XLSX.writeFile(workbook, `inventario_${node.id || 'global'}.xlsx`);
}

export async function displayInventory(node, isAdmin = false) {
    // guardamos contexto global para acciones de header (import/export)
    window.currentInventoryContext = { node, items: null, isAdmin };

    const tableView = document.getElementById('table-view');
    const galleryView = document.getElementById('gallery-view');

    if (tableView) tableView.innerHTML = '<p>Cargando inventario...</p>';
    if (galleryView) {
        const galleryContainer = galleryView.querySelector('#gallery-container');
        if (galleryContainer) galleryContainer.innerHTML = '<p>Cargando galería...</p>';
    }

    try {
        const response = await fetch(`${API_URL}get_inventory.php?node_id=${encodeURIComponent(node.id || '')}`);
        const text = await response.text();
        let result;
        try { 
            result = JSON.parse(text);
        } catch (err) {
            console.error('Respuesta no JSON en get_inventory:', text);
            if (tableView) tableView.innerHTML = '<p>Error: respuesta inválida del servidor. Revisa la consola.</p>';
            return;
        }

        if (result.success) {
            // actualizamos contexto con items recibidos
            window.currentInventoryContext = { node, items: result.data, isAdmin };
            setupInventoryUI(node, result.data, isAdmin);
            renderTable(node, result.data, isAdmin);
            renderGallery(result.data, isAdmin);
        } else {
            const errorMessage = `<p>Error al cargar el inventario: ${result.message}</p>`;
            if (tableView) tableView.innerHTML = errorMessage;
            const galleryContainer = document.getElementById('gallery-container');
            if (galleryContainer) galleryContainer.innerHTML = errorMessage;
            const controls = document.getElementById('global-controls-container');
            if (controls) controls.innerHTML = '';
        }
    } catch (error) {
        console.error('Error al obtener el inventario:', error);
        if (tableView) tableView.innerHTML = '<p>Error de conexión al cargar el inventario.</p>';
        const galleryContainer = document.getElementById('gallery-container');
        if (galleryContainer) galleryContainer.innerHTML = '<p>Error de conexión al cargar el inventario.</p>';
    }
}

function setupInventoryUI(node, items, isAdmin) {
    const controlsContainer = document.getElementById('global-controls-container');
    if (!controlsContainer) return;

    // Guardar contexto global (por si se llama directamente)
    window.currentInventoryContext = { node, items, isAdmin };

    controlsContainer.innerHTML = `
        <div class="inventory-controls">
            <button id="add-item-btn"><i class="fas fa-plus"></i> Agregar Item</button>
            <button id="transfer-item-btn"><i class="fas fa-random"></i> Traspasar Item</button>
            <button id="toggle-filters-btn"><i class="fas fa-filter"></i> Mostrar Filtros</button>
        </div>
        <div class="filter-controls-container">
            <div class="filter-row"><label for="filter-id">Buscar por codigo_Item:</label><input type="text" id="filter-id" placeholder="Código del ítem"></div>
            <div class="filter-row"><label for="filter-name">Buscar por Nombre:</label><input type="text" id="filter-name" placeholder="Nombre del ítem"></div>
            <div class="filter-row"><label for="filter-category">Categoría:</label><select id="filter-category"><option value="">Todas</option>${categories.map(cat => `<option value="${cat}">${cat}</option>`).join('')}</select></div>
            <div class="filter-row"><label for="filter-status">Estado:</label><select id="filter-status"><option value="">Todos</option>${statusOptions.map(option => `<option value="${option.value}">${option.label}</option>`).join('')}</select></div>
            <div class="filter-row"><label for="filter-date-from">Incorporado Desde:</label><input type="date" id="filter-date-from"></div>
            <div class="filter-row"><label for="filter-date-to">Incorporado Hasta:</label><input type="date" id="filter-date-to"></div>
            <div class="filter-actions">
                <button id="apply-filters-btn" class="button"><i class="fas fa-check"></i> Aplicar</button>
                <button id="reset-filters-btn" class="button reset-filters-btn"><i class="fas fa-undo"></i> Limpiar</button>
            </div>
        </div>
    `;

    document.getElementById("add-item-btn").addEventListener('click', () => showItemForm(node, null));
    document.getElementById("transfer-item-btn").addEventListener('click', () => showTransferForm(node, items));
    setupHeaderActions();

    const filterControls = controlsContainer.querySelector('.filter-controls-container');
    document.getElementById('toggle-filters-btn').addEventListener('click', () => {
        filterControls.classList.toggle('visible');
        const button = document.getElementById('toggle-filters-btn');
        button.innerHTML = filterControls.classList.contains('visible')
            ? '<i class="fas fa-eye-slash"></i> Ocultar Filtros'
            : '<i class="fas fa-filter"></i> Mostrar Filtros';
    });

    document.getElementById('apply-filters-btn').addEventListener('click', () => {
        const filters = {
            id: document.getElementById('filter-id').value.trim(),
            name: document.getElementById('filter-name').value.toLowerCase().trim(),
            category: document.getElementById('filter-category').value,
            status: document.getElementById('filter-status').value,
            dateFrom: document.getElementById('filter-date-from').value,
            dateTo: document.getElementById('filter-date-to').value,
        };
        const filteredItems = items.filter(item => {
            const itemDate = item.incorporacion ? new Date(item.incorporacion) : null;
            const fromDate = filters.dateFrom ? new Date(filters.dateFrom) : null;
            const toDate = filters.dateTo ? new Date(filters.dateTo) : null;
            if(itemDate) itemDate.setUTCHours(0, 0, 0, 0);
            if(fromDate) fromDate.setUTCHours(0, 0, 0, 0);
            if(toDate) toDate.setUTCHours(0, 0, 0, 0);

            return (!filters.id || String(item.id).includes(filters.id)) &&
                   (!filters.name || item.name.toLowerCase().includes(filters.name)) &&
                   (!filters.category || item.category === filters.category) &&
                   (!filters.status || item.status === filters.status) &&
                   (!fromDate || (itemDate && itemDate >= fromDate)) &&
                   (!toDate || (itemDate && itemDate <= toDate));
        });
        renderTable(node, filteredItems, isAdmin);
        renderGallery(filteredItems, isAdmin);
    });

    document.getElementById('reset-filters-btn').addEventListener('click', () => {
        filterControls.querySelectorAll('input, select').forEach(el => el.value = '');
        renderTable(node, items, isAdmin);
        renderGallery(items, isAdmin);
    });
}

function setupHeaderActions() {
    if (window.headerActionsInitialized) return;
    window.headerActionsInitialized = true;

    const init = () => {
        const headerBtn = document.getElementById('header-actions-btn');
        const headerMenu = document.getElementById('header-actions-menu');
        const headerWrapper = headerBtn ? headerBtn.closest('.header-actions') || headerBtn.parentElement : null;
        const importBtn = document.getElementById('import-btn-header');
        const fileInput = document.getElementById('xlsx-file-input-header');
        const exportXlsxBtn = document.getElementById('export-xlsx-header');
        const exportDocxBtn = document.getElementById('export-docx-header');

        if (!headerBtn || !headerWrapper || !headerMenu) {
            return;
        }

        headerWrapper.classList.remove('open');
        headerBtn.setAttribute('aria-expanded', 'false');
        headerMenu.style.display = 'none';

        headerBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const isOpen = headerWrapper.classList.toggle('open');
            headerBtn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
            headerMenu.style.display = isOpen ? 'flex' : 'none';
        });

        document.addEventListener('click', (e) => {
            if (!headerWrapper.contains(e.target)) {
                headerWrapper.classList.remove('open');
                headerBtn.setAttribute('aria-expanded', 'false');
                headerMenu.style.display = 'none';
            }
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                headerWrapper.classList.remove('open');
                headerBtn.setAttribute('aria-expanded', 'false');
                headerMenu.style.display = 'none';
            }
        });

        if (importBtn && fileInput) {
            importBtn.addEventListener('click', () => fileInput.click());
            fileInput.addEventListener('change', async (event) => {
                const file = event.target.files[0];
                if (!file) return;
                await handleXlsxImportFile(file);
                fileInput.value = '';
                headerWrapper.classList.remove('open');
                headerMenu.style.display = 'none';
            });
        }

        if (exportXlsxBtn) {
            exportXlsxBtn.addEventListener('click', () => {
                const ctx = window.currentInventoryContext || {};
                if (!ctx.items || ctx.items.length === 0) {
                    alert('No hay datos para exportar en la vista actual.');
                    headerWrapper.classList.remove('open');
                    headerMenu.style.display = 'none';
                    return;
                }
                exportToXLSX(ctx.node || { id: 'global' }, ctx.items);
                headerWrapper.classList.remove('open');
                headerMenu.style.display = 'none';
            });
        }

        if (exportDocxBtn) {
            exportDocxBtn.addEventListener('click', () => {
                if (typeof exportToDOCX === 'function') {
                    const ctx = window.currentInventoryContext || {};
                    exportToDOCX(ctx.node || { id: 'global' }, ctx.items || []);
                } else {
                    alert('Exportar a DOCX no está implementado aún.');
                }
                headerWrapper.classList.remove('open');
                headerMenu.style.display = 'none';
            });
        }
    };

    try { init(); } catch (e) { /* ignore */ }
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init, { once: true });
    }
}

async function handleXlsxImportFile(file) {
    try {
        const data = await file.arrayBuffer();
        const workbook = XLSX.read(new Uint8Array(data), { type: 'array', cellDates: true });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const json = XLSX.utils.sheet_to_json(worksheet);
        if (json.length === 0) {
            alert('El archivo XLSX está vacío.');
            return;
        }

        const mappedJson = json
            .filter(row => Object.keys(row).length > 0)
            .map(row => {
                const newRow = {};
                for (const key in row) {
                    const lowerKey = key.toLowerCase().trim().replace(/\s+/g, '');
                    if (lowerKey.startsWith('codigo')) newRow.codigo_item = row[key];
                    else if (lowerKey.startsWith('nombre')) newRow.nombre = row[key];
                    else if (lowerKey.startsWith('cantidad')) newRow.cantidad = row[key];
                    else if (lowerKey.startsWith('categor')) newRow.categoria = row[key];
                    else if (lowerKey.startsWith('descripci')) newRow.descripcion = row[key];
                    else if (lowerKey.startsWith('incorporaci')) {
                        if (row[key]) {
                            const date = new Date(row[key]);
                            if (!isNaN(date.getTime())) {
                                const userTimezoneOffset = date.getTimezoneOffset() * 60000;
                                const correctedDate = new Date(date.getTime() + userTimezoneOffset);
                                const year = correctedDate.getUTCFullYear();
                                const month = String(correctedDate.getUTCMonth() + 1).padStart(2, '0');
                                const day = String(correctedDate.getUTCDate()).padStart(2, '0');
                                newRow.incorporacion = `${year}-${month}-${day}`;
                            } else {
                                newRow.incorporacion = null;
                            }
                        } else {
                            newRow.incorporacion = null;
                        }
                    } else if (lowerKey.startsWith('imagen') || lowerKey.startsWith('image') || lowerKey.startsWith('rutaimagen') || lowerKey.startsWith('imagepath')) {
                        let img = row[key] ? String(row[key]).trim() : '';
                        if (img) {
                            if (!/^https?:\/\//i.test(img) && !img.startsWith('/') && !img.toLowerCase().startsWith('uploads/')) {
                                img = `uploads/${img}`;
                            }
                            newRow.imagePath = img;
                        } else {
                            newRow.imagePath = null;
                        }
                    } else if (lowerKey.startsWith('estado')) newRow.estado = row[key];
                    else if (lowerKey.startsWith('area')) newRow.area = row[key];
                    else if (lowerKey.startsWith('encargado')) newRow.encargado = row[key];
                }
                return newRow;
            });

        // envío al servidor
        const response = await fetch(`${API_URL}bulk_import.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(mappedJson)
        });

        const text = await response.text();
        let result;
        try { result = JSON.parse(text); } catch (err) {
            console.error('Respuesta inválida desde bulk_import.php:', text);
            const openHtml = confirm('El servidor devolvió una respuesta no JSON (posible error PHP). ¿Deseas abrirla en una nueva pestaña para revisar?');
            if (openHtml) { const w = window.open(); if (w) { w.document.open(); w.document.write(text); w.document.close(); } }
            return;
        }

        if (!response.ok) {
            alert(result.message || ('Error del servidor: ' + (response.statusText || response.status)));
            return;
        }

        alert(result.message || 'Importación completada.');
        if (result.success) {
            const ctx = window.currentInventoryContext || {};
            displayInventory(ctx.node || { id: '' }, ctx.isAdmin || false);
        }
    } catch (error) {
        console.error('Error durante la importación:', error);
        alert(`Error al importar los datos: ${error.message || error}`);
    }
}

function renderTable(node, items, isAdmin) {
    const tableContainer = document.getElementById('table-view');
    if (!tableContainer) return;
    tableContainer.innerHTML = '';

    if (!items || items.length === 0) {
        tableContainer.innerHTML = '<p>No hay ítems en esta área o no coinciden con los filtros.</p>';
        return;
    }

    tableContainer.innerHTML = `
        <div class="table-responsive">
            <table id="inventory-table" class="inventory-table">
                <thead><tr>
                    <th>codigo_Item</th>
                    <th>Nombre</th>
                    <th>Cantidad</th>
                    <th>Categoría</th>
                    <th>Descripción</th>
                    <th>Incorporación</th>
                    <th>Estado</th>
                    <th>Área</th>
                    <th>Encargado</th>
                    <th>Acciones</th>
                </tr></thead>
                <tbody>
                    ${items.map(item => `
                        <tr>
                            <td>${item.codigo_item || item.id || ''}</td>
                            <td>${item.name || ''}</td>
                            <td>${item.quantity || 0}</td>
                            <td>${item.category || ''}</td>
                            <td>${item.description || ''}</td>
                            <td>${item.incorporacion || 'No especificada'}</td>
                            <td>${statusOptions.find(s => s.value === item.status)?.label || 'Desconocido'}</td>
                            <td>${nodesMap.get(item.node_id) || (item.area || 'N/A')}</td>
                            <td>${item.encargado || 'No Asignado'}</td>
                            <td class="actions">
                                <button class="edit-btn" data-item-id="${item.id}"><i class="fas fa-edit"></i></button>
                                <button class="delete-btn" data-item-id="${item.id}" title="Dar de baja"><i class="fas fa-arrow-down"></i></button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;

    tableContainer.querySelectorAll('.edit-btn').forEach(button => {
        button.addEventListener('click', () => {
            const itemToEdit = items.find(i => i.id == button.dataset.itemId);
            showItemForm(node, itemToEdit);
        });
    });

    tableContainer.querySelectorAll('.delete-btn').forEach(button => {
        button.addEventListener('click', async () => {
            const itemToDelete = items.find(i => i.id == button.dataset.itemId);
            if (!itemToDelete) return;
            if (confirm(`¿Estás seguro de que deseas solicitar la BAJA del ítem "${itemToDelete.name}"? Esta acción no se puede deshacer.`)) {
                try {
                    const formData = new FormData();
                    formData.append('id', itemToDelete.id);

                    const response = await fetch(API_URL + 'delete_item.php', { method: 'POST', body: formData });
                    const text = await response.text();
                    let result;
                    try { result = JSON.parse(text); } catch (err) {
                        console.error('Respuesta no JSON en delete_item:', text);
                        alert('Respuesta inválida del servidor. Revisa la consola.');
                        return;
                    }
                    alert(result.message || 'Operación completada.');
                    if (result.success) displayInventory(node, isAdmin);
                } catch (error) {
                    console.error('Error al intentar dar de baja el ítem:', error);
                    alert('Error de conexión al procesar la solicitud de baja.');
                }
            }
        });
    });
}

function renderGallery(items, isAdmin) {
    const galleryContainer = document.getElementById('gallery-container');
    if (!galleryContainer) return;

    const itemsWithImages = items.filter(item => item.imagePath);

    if (itemsWithImages.length === 0) {
        galleryContainer.innerHTML = items.length > 0
            ? '<p>Ningún ítem en esta vista tiene una imagen asociada.</p>'
            : '<p>No hay ítems para mostrar en esta área.</p>';
        return;
    }

    galleryContainer.innerHTML = itemsWithImages.map(item => `
        <div class="gallery-card" 
             data-id="${item.id}"
             data-codigo="${item.codigo_item || item.id || ''}"
             data-name="${item.name}" 
             data-description="${item.description || 'Sin descripción.'}" 
             data-category="${item.category || ''}"
             data-quantity="${item.quantity || 0}"
             data-status="${statusOptions.find(s => s.value === item.status)?.label || 'Desconocido'}"
             data-date="${item.incorporacion || 'No especificada'}"
             data-img-src="${item.imagePath}">
            <div class="gallery-card-img-container">
                <img src="${item.imagePath}" alt="${(item.codigo_item ? item.codigo_item + ' - ' : '')}${item.name}" class="gallery-card-img">
            </div>
            <div class="gallery-card-title">${item.name}</div>
            <div class="gallery-card-code">Código: ${item.codigo_item || item.id || ''}</div>
        </div>
    `).join('');
}