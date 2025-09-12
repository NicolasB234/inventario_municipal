export const orgStructure = [
    // --- INICIO DE LA MODIFICACIÓN ---
    {
        id: 'auditor',
        name: 'Auditor',
        type: 'area',
        children: []
    },
    {
        id: 'tribunal-faltas',
        name: 'Tribunal de faltas',
        type: 'area',
        children: []
    },
    // --- FIN DE LA MODIFICACIÓN ---
    {
        id: 'intendencia',
        name: 'Intendencia',
        type: 'intendencia',
        children: [
            {
                id: 'unclassified',
                name: 'Área no reconocida / A clasificar',
                type: 'area',
                children: []
            },
            {
                id: 'sec-gobierno',
                name: 'Secretaría de Gobierno y Coordinación',
                type: 'secretaria',
                children: [
                    {
                        id: 'dir-catastrofe',
                        name: 'Dirección de Catástrofe',
                        type: 'direccion',
                        children: [
                            { id: 'coord-concientizacion-ambiental', name: 'Coordinación de Concientización Ambiental', type: 'coordinacion', children: [] },
                        ]
                    },
                    {
                        id: 'dir-bromatologia',
                        name: 'Dirección de Bromatología',
                        type: 'direccion',
                        children: [
                            // --- INICIO DE LA MODIFICACIÓN ---
                            { id: 'coord-zoonosis', name: 'Coordinación de Zoonosis', type: 'coordinacion', children: [] },
                            // --- FIN DE LA MODIFICACIÓN ---
                        ]
                    },
                    { id: 'dir-empleo-capacitacion', name: 'Dirección de Empleo y Capacitación', type: 'direccion', children: [] },
                    { id: 'dir-administrativa', name: 'Dirección Administrativa', type: 'direccion', children: [] },
                    { id: 'dir-gestion-provincial', name: 'Dirección de Gestión Provincial', type: 'direccion', children: [] },
                    {
                        id: 'dir-cultura-turismo',
                        name: 'Dirección de Cultura y Turismo',
                        type: 'direccion',
                        children: [
                            { id: 'coord-musicos', name: 'Coordinación de Músicos', type: 'coordinacion', children: [] },
                        ]
                    },
                    {
                        id: 'dir-transito',
                        name: 'Dirección de Tránsito y Seguridad Vial',
                        type: 'direccion',
                        children: [
                            { id: 'coord-licencias', name: 'Coordinación de Licencias de Conducir', type: 'coordinacion', children: [] },
                        ]
                    },
                    { id: 'dir-deportes', name: 'Dirección de Deportes y Recreación', type: 'direccion', children: [] },
                    { id: 'dir-ninez-familia', name: 'Dirección de Niñez, Adolescencia y Familia', type: 'direccion', children: [] },
                    { id: 'sub-familia', name: 'Subdirección de Familia', type: 'subdireccion', children: [] },
                    { id: 'dir-recursos-naturales', name: 'Dirección de Recursos Naturales', type: 'direccion', children: [] },
                ]
            },
            {
                id: 'sec-hacienda',
                name: 'Secretaría de Hacienda',
                type: 'secretaria',
                children: [
                    { id: 'sub-compras', name: 'Subdirección Compras', type: 'subdireccion', children: [] },
                    { id: 'dir-ingresos-publicos', name: 'Dirección de Ingresos Públicos', type: 'direccion', children: [] },
                    { id: 'coord-tesoreria', name: 'Coordinación de Tesorería', type: 'coordinacion', children: [] },
                    { id: 'coord-convenios-pagos', name: 'Coordinación de Convenios y Planes de Pagos', type: 'coordinacion', children: [] },
                    { id: 'dir-contable-presupuestaria', name: 'Dirección Contable y de Ejecución Presupuestaria', type: 'direccion', children: [] },
                    { id: 'sub-liquidacion-sueldos', name: 'Subdirección de Liquidación de Sueldos', type: 'subdireccion', children: [] },
                    { id: 'sub-sistemas', name: 'Subdirección de Sistemas', type: 'subdireccion', children: [] },
                ]
            },
            {
                id: 'sec-produccion',
                name: 'Secretaría de Producción',
                type: 'secretaria',
                children: [
                    { id: 'dir-valor-agregado', name: 'Dirección de Valor Agregado', type: 'direccion', children: [] },
                ]
            },
            {
                id: 'sec-obras-publicas',
                name: 'Secretaría de Obras Públicas',
                type: 'secretaria',
                children: [
                    { id: 'dir-taller-municipal', name: 'Dirección de Taller Municipal', type: 'direccion', children: [] },
                    {
                        id: 'dir-infraestructura-vial',
                        name: 'Dirección de Infraestructura Vial',
                        type: 'direccion',
                        children: [
                            { id: 'coord-bacheo', name: 'Coordinación de Bacheo', type: 'coordinacion', children: [] },
                            { id: 'coord-calles-ripio', name: 'Coordinación de Mantenimiento de Calles de Ripio', type: 'coordinacion', children: [] },
                        ]
                    },
                    {
                        id: 'sub-planeamiento-urbano',
                        name: 'Subdirección de Planeamiento Urbano',
                        type: 'subdireccion',
                        children: [
                            { id: 'coord-obras-privadas', name: 'Coordinación de Obras Privadas', type: 'coordinacion', children: [] },
                        ]
                    },
                    {
                        id: 'sub-parques-plazas',
                        name: 'Subdirección de Parque, Plazas y Paseos',
                        type: 'subdireccion',
                        children: [
                            { id: 'coord-mantenimiento-plazas', name: 'Coordinación de Mantenimiento de Plazas y Paseos', type: 'coordinacion', children: [] },
                            { id: 'coord-embellecimiento', name: 'Coordinación de Embellecimiento de Parque, Plaza y Paseos', type: 'coordinacion', children: [] },
                            { id: 'coord-recoleccion', name: 'Coordinación de Recolección', type: 'coordinacion', children: [] },
                            { id: 'coord-agua-cloacas', name: 'Coordinación de Conexión de Agua y Cloacas', type: 'coordinacion', children: [] },
                            { id: 'coord-cementerio', name: 'Coordinación Cementerio', type: 'coordinacion', children: [] },
                            { id: 'coord-parque-acuatico', name: 'Coordinación Parque Acuático', type: 'coordinacion', children: [] },
                        ]
                    },
                ]
            },
            {
                id: 'sec-servicios-publicos',
                name: 'Secretaría de Servicios Públicos',
                type: 'secretaria',
                children: [
                    { id: 'subsec-servicios-publicos', name: 'Subsecretaría de Servicios Públicos', type: 'subsecretaria', children: [] },
                    { id: 'sub-barrido-limpieza', name: 'Subdirección de Barrido y Limpieza', type: 'subdireccion', children: [] },
                    { id: 'dir-palmares', name: 'Dirección de Palmares', type: 'direccion', children: [] },
                    { id: 'coord-corte-pasto', name: 'Coordinación de Corte de Pasto, Poda y Recolección', type: 'coordinacion', children: [] },
                    { id: 'coord-infra-eventos', name: 'Coordinación de Infraestructura de Eventos', type: 'coordinacion', children: [] },
                ]
            },
            {
                id: 'sec-legales',
                name: 'Secretaría de Legales',
                type: 'secretaria',
                children: [
                    { id: 'coord-ejecucion-fiscal', name: 'Coordinación de Ejecución Fiscal', type: 'coordinacion', children: [] },
                ]
            },
            { id: 'dir-protocolo', name: 'Dirección de Ceremonial y Protocolo', type: 'direccion', children: [] },
            { id: 'dir-personal', name: 'Dirección de Personal', type: 'direccion', children: [] },
            { id: 'dir-secretaria-privada', name: 'Dirección de Secretaría Privada', type: 'direccion', children: [] },
            { id: 'dir-prensa', name: 'Dirección de Prensa y Coordinación', type: 'direccion', children: [] },
            { id: 'dir-control-patrimonial', name: 'Dirección de Control Patrimonial', type: 'direccion', children: [] },
            {
                id: 'dir-accion-social',
                name: 'Dirección de Acción Social',
                type: 'direccion',
                children: [
                    { id: 'sub-accion-social', name: 'Subdirección de Acción Social', type: 'subdireccion', children: [] },
                    { id: 'coord-cim', name: 'Coordinación del CIM', type: 'coordinacion', children: [] },
                    { id: 'coord-cic', name: 'Coordinación del CIC', type: 'coordinacion', children: [] },
                    { id: 'coord-refugio', name: 'Coordinación de Refugio', type: 'coordinacion', children: [] },
                ]
            },
            {
                id: 'viceintendencia',
                name: 'Viceintendencia',
                type: 'viceintendencia',
                children: [
                    { id: 'area-salud', name: 'Área de Salud', type: 'area', children: [] },
                    {
                        id: 'dir-salud',
                        name: 'Dirección de Salud',
                        type: 'direccion',
                        // --- INICIO DE LA MODIFICACIÓN ---
                        children: [
                            { id: 'sala-salud-1', name: 'Sala de Salud 1', type: 'area', children: [] },
                            { id: 'sala-salud-2', name: 'Sala de Salud 2', type: 'area', children: [] },
                            { id: 'sala-salud-3', name: 'Sala de Salud 3', type: 'area', children: [] },
                            { id: 'sala-salud-4', name: 'Sala de Salud 4', type: 'area', children: [] },
                            { id: 'sala-salud-5', name: 'Sala de Salud 5', type: 'area', children: [] },
                            { id: 'sala-salud-6', name: 'Sala de Salud 6', type: 'area', children: [] },
                            { id: 'sala-salud-7', name: 'Sala de Salud 7', type: 'area', children: [] },
                            { id: 'sala-salud-8', name: 'Sala de Salud 8', type: 'area', children: [] },
                            { id: 'sala-salud-9', name: 'Sala de Salud 9', type: 'area', children: [] },
                        ]
                        // --- FIN DE LA MODIFICACIÓN ---
                    },
                    // --- INICIO DE LA MODIFICACIÓN ---
                    { id: 'coord-club-dia', name: 'Coordinación Club de Día', type: 'coordinacion', children: [] },
                    // --- FIN DE LA MODIFICACIÓN ---
                    { id: 'sub-discapacidad', name: 'Subdirección de Discapacidad', type: 'subdireccion', children: [] },
                    { id: 'coord-salud', name: 'Coordinación de Salud', type: 'coordinacion', children: [] },
                ]
            },
        ]
    }
];