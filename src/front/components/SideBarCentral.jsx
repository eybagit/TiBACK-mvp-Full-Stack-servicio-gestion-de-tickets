import React from 'react';
import useGlobalReducer from '../hooks/useGlobalReducer';

export const SideBarCentral = ({ sidebarHidden, activeView, changeView, toggleSidebar }) => {
    const { store } = useGlobalReducer();
    const userData = store.auth.user;


    // Obtener el rol directamente del token JWT usando la variable dinámica
    const token = store.auth.token;
    const userRole = token ? (() => {
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            return payload.role;
        } catch (error) {
            console.error('Error decodificando token:', error);
            return null;
        }
    })() : null;



    // Verificar si el usuario está autenticado
    if (!userData || !userRole) {
        return null;
    }

    // Configuración de navegación según el rol
    const getNavigationItems = (role) => {
        switch (role) {
            case 'cliente':
                return [
                    {
                        id: 'dashboard',
                        label: 'Dashboard',
                        icon: 'fas fa-tachometer-alt',
                        view: 'dashboard'
                    },
                    {
                        id: 'tickets',
                        label: 'Mis Tickets',
                        icon: 'fas fa-ticket-alt',
                        view: 'tickets'
                    },
                    {
                        id: 'create',
                        label: 'Crear Ticket',
                        icon: 'fas fa-plus',
                        view: 'create'
                    }
                ];

            case 'analista':
                return [
                    {
                        id: 'dashboard',
                        label: 'Dashboard',
                        icon: 'fas fa-tachometer-alt',
                        view: 'dashboard'
                    },
                    {
                        id: 'tickets',
                        label: 'Mis Tickets',
                        icon: 'fas fa-ticket-alt',
                        view: 'tickets'
                    }
                ];

            case 'supervisor':
                return [
                    {
                        id: 'dashboard',
                        label: 'Dashboard',
                        icon: 'fas fa-tachometer-alt',
                        view: 'dashboard'
                    },
                    {
                        id: 'tickets',
                        label: 'Todos los Tickets',
                        icon: 'fas fa-ticket-alt',
                        view: 'tickets'
                    },
                    {
                        id: 'dashboard-calidad',
                        label: 'Dashboard de Calidad',
                        icon: 'fas fa-chart-line',
                        view: 'dashboard-calidad'
                    }
                ];

            case 'administrador':
                return [
                    {
                        id: 'dashboard',
                        label: 'Dashboard',
                        icon: 'fas fa-tachometer-alt',
                        view: 'dashboard'
                    },
                    {
                        id: 'usuarios',
                        label: 'Gestión de Usuarios',
                        icon: 'fas fa-users',
                        view: 'usuarios'
                    },
                    {
                        id: 'roles',
                        label: 'Gestión de Roles',
                        icon: 'fas fa-user-shield',
                        view: 'roles'
                    },
                    {
                        id: 'sistema',
                        label: 'Configuración del Sistema',
                        icon: 'fas fa-cogs',
                        view: 'sistema'
                    },
                    {
                        id: 'reportes',
                        label: 'Reportes Generales',
                        icon: 'fas fa-chart-bar',
                        view: 'reportes'
                    },
                    {
                        id: 'auditoria',
                        label: 'Auditoría',
                        icon: 'fas fa-clipboard-list',
                        view: 'auditoria'
                    }
                ];

            default:
                return [];
        }
    };

    const navigationItems = getNavigationItems(userRole);

    return (
        <div className={`hyper-sidebar ${sidebarHidden ? 'hidden' : ''} overflow-auto`} data-hidden={sidebarHidden}>
            {/* Botón de cierre flotante - SOLO MÓVILES */}
            {!sidebarHidden && toggleSidebar && (
                <button
                    className="btn btn-link position-absolute top-0 end-0 m-2 d-md-none text-white"
                    onClick={toggleSidebar}
                    style={{ zIndex: 1100, fontSize: '1.5rem' }}
                    title="Cerrar menú"
                >
                    <i className="fas fa-times"></i>
                </button>
            )}

            {/* Header con logo - responsive */}
            <div className="hyper-sidebar-header p-3 p-md-4">
                <img
                    src="https://res.cloudinary.com/mystoreimg/image/upload/v1759679927/fsq6shibpipmssroqwe4.webp"
                    className="w-default-logo d-block mx-auto"
                    alt="TiBACK Logo"
                />
            </div>

            <nav className="p-2 p-md-3">
                <div className="mb-3 mb-md-4">
                    <div className="hyper-nav-title px-3 mb-2 d-none d-md-block">Navegación</div>
                    {navigationItems.map((item) => (
                        <a
                            key={item.id}
                            href="#"
                            className={`hyper-nav-item d-flex align-items-center justify-content-start gap-2 gap-md-3 px-2 px-md-3 py-2 rounded text-decoration-none ${activeView === item.view ? 'active' : ''}`}
                            onClick={(e) => {
                                e.preventDefault();
                                // Si es Dashboard y estamos en comentarios o chat, redirigir al dashboard del rol
                                if (item.id === 'dashboard' && (activeView === 'comentarios' || activeView === 'chat')) {
                                    // Redirigir al dashboard del rol correspondiente
                                    if (userRole === 'cliente') {
                                        window.open('/cliente', '_self');
                                    } else if (userRole === 'analista') {
                                        window.open('/analista', '_self');
                                    } else if (userRole === 'supervisor') {
                                        window.open('/supervisor', '_self');
                                    } else if (userRole === 'administrador') {
                                        window.open('/administrador', '_self');
                                    }
                                } else {
                                    // Para otros casos, usar changeView normal
                                    changeView(item.view);
                                }
                            }}
                        >
                            <i className={`${item.icon} fs-5`}></i>
                            {!sidebarHidden && <span className="flex-grow-1">{item.label}</span>}
                        </a>
                    ))}
                </div>



                {/* Información del usuario - responsive */}
                {!sidebarHidden && (
                    <div className="px-2 px-md-3 py-2 mt-auto">
                        <div className="hyper-nav-title mb-2 d-none d-md-block">Usuario</div>
                        <div className="d-flex align-items-center gap-2 p-2 bg-light rounded">
                            <div className="hyper-user-avatar bg-primary d-flex align-items-center justify-content-center rounded-circle sidebar-user-avatar flex-shrink-0">
                                <i className="fas fa-user text-white icon-small"></i>
                            </div>
                            <div className="flex-grow-1 overflow-hidden">
                                <div className="fw-semibold sidebar-user-name text-truncate">
                                    {userData?.nombre === 'Pendiente' ? userRole : userData?.nombre}
                                </div>
                                <div className="text-muted sidebar-user-role small text-truncate">
                                    {userRole === 'cliente' ? 'Cliente' :
                                        userRole === 'analista' ? 'Analista' :
                                            userRole === 'supervisor' ? 'Supervisor' :
                                                userRole === 'administrador' ? 'Administrador' : 'Usuario'}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </nav>
        </div>
    );
};
