import React from 'react';

/**
 * ClienteHeader - Barra superior del panel cliente
 * Incluye: toggle sidebar, búsqueda, sincronizar, dropdown usuario
 */
function ClienteHeader({
    // Sidebar
    sidebarHidden,
    toggleSidebar,
    // Búsqueda
    searchQuery,
    handleSearch,
    searchResults,
    showSearchResults,
    setShowSearchResults,
    closeSearchResults,
    selectTicketFromSearch,
    getEstadoColor,
    // Sincronizar
    actualizarTickets,
    // Usuario dropdown
    userData,
    showUserDropdown,
    setShowUserDropdown,
    changeView,
    navigate,
    isDarkMode,
    toggleTheme,
    logout
}) {
    return (
        <header className="hyper-header bg-white border-bottom p-2 p-md-3">
            <div className="d-flex align-items-center justify-content-between w-100">
                <div className="d-flex align-items-center gap-2 gap-md-3">
                    {/* Botón toggle - VISIBLE EN MÓVILES */}
                    <button
                        className="btn btn-link text-dark p-2 fs-4"
                        onClick={toggleSidebar}
                        title={sidebarHidden ? "Mostrar menú" : "Ocultar menú"}
                    >
                        <i className="fas fa-bars"></i>
                    </button>

                    {/* Búsqueda - oculta en xs, visible sm+ */}
                    <div className="hyper-search position-relative d-none d-sm-block flex-grow-1">
                        <i className="fas fa-search position-absolute top-50 start-0 translate-middle-y ms-3 text-muted"></i>
                        <input
                            type="text"
                            className="form-control"
                            placeholder="Buscar tickets..."
                            value={searchQuery}
                            onChange={(e) => handleSearch(e.target.value)}
                            onFocus={() => {
                                if (searchResults.length > 0) {
                                    setShowSearchResults(true);
                                }
                            }}
                        />

                        {/* Resultados de búsqueda */}
                        {showSearchResults && searchResults.length > 0 && (
                            <div className="position-absolute w-100 bg-white border border-top-0 rounded-bottom shadow-lg dropdown-menu-custom">
                                <div className="p-3">
                                    <div className="d-flex justify-content-between align-items-center mb-3 w-100">
                                        <small className="text-muted fw-semibold">

                                            Tickets encontrados ({searchResults.length})
                                        </small>
                                        <button
                                            className="btn btn-sm btn-outline-secondary ms-3"
                                            onClick={closeSearchResults}
                                            title="Cerrar resultados"
                                        >
                                            <span>X</span>
                                        </button>
                                    </div>
                                    {searchResults.map((ticket) => (
                                        <div
                                            key={ticket.id}
                                            className="search-result-item p-2 border-bottom cursor-pointer"
                                            onClick={() => selectTicketFromSearch(ticket)}
                                            onMouseEnter={(e) => e.target.style.backgroundColor = 'var(--ct-gray-100)'}
                                            onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                                        >
                                            <div className="d-flex justify-content-between align-items-start">
                                                <div className="flex-grow-1">
                                                    <div className="fw-semibold text-primary">#{ticket.id}</div>
                                                    <div className="text-dark">{ticket.titulo}</div>
                                                    <small className="text-muted">
                                                        {ticket.descripcion.length > 60
                                                            ? `${ticket.descripcion.substring(0, 60)}...`
                                                            : ticket.descripcion
                                                        }
                                                    </small>
                                                </div>
                                                <div className="ms-3">
                                                    <span className={getEstadoColor(ticket.estado)}>
                                                        {ticket.estado}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="d-flex align-items-center gap-2 gap-md-3">
                    {/* Botón sincronizar - solo icono en móviles */}
                    <button
                        className="btn btn-outline-primary btn-sync d-flex align-items-center gap-2 px-2 px-md-3"
                        onClick={async () => {
                            try {
                                console.log('🔄 Iniciando sincronización desde ClienteHeader...');
                                await actualizarTickets();
                                console.log('✅ Sincronización completada desde ClienteHeader');
                            } catch (error) {
                                console.error('❌ Error en sincronización desde ClienteHeader:', error);
                            }
                        }}
                        title="Sincronizar datos"
                    >
                        <i className="fas fa-sync-alt"></i>
                        <span className="d-none d-md-inline">Sincronizar</span>
                    </button>

                    {/* Dropdown del usuario */}
                    <div className="position-relative dropdown">
                        <button
                            className="btn btn-link d-flex align-items-center gap-2 text-decoration-none"
                            onClick={() => {
                                setShowUserDropdown(!showUserDropdown);
                            }}
                        >
                            {userData?.url_imagen ? (
                                <img
                                    src={userData.url_imagen}
                                    alt="Avatar"
                                    className="avatar-header-normal rounded-circle"
                                />
                            ) : (
                                <div className="avatar-header-normal bg-primary d-flex align-content-center rounded-circle">
                                    <i className="fa-solid fa-user fa-xl text-white text-center"></i>
                                </div>
                            )}
                            <span className="fw-semibold">
                                {userData?.nombre === 'Pendiente' ? 'Cliente' : userData?.nombre}
                            </span>
                            <i className="fas fa-chevron-down"></i>
                        </button>

                        {showUserDropdown && (
                            <div className="position-absolute end-0 mt-2 bg-white border rounded shadow-lg dropdown-menu-min-width z-index-1000">
                                <div className="p-3 border-bottom">
                                    <div className="fw-semibold">
                                        {userData?.nombre === 'Pendiente' ? 'Cliente' : userData?.nombre}
                                    </div>
                                    <small className="text-muted">Cliente</small>
                                </div>
                                <div className="p-2">
                                    <button
                                        className="btn btn-link link-plain w-100 text-start d-flex align-items-center gap-2"
                                        onClick={() => {
                                            changeView('profile');
                                            setShowUserDropdown(false);
                                        }}
                                    >
                                        <i className="fas fa-user-edit"></i>
                                        Mi Perfil
                                    </button>
                                    <button
                                        className="btn btn-link link-plain w-100 text-start d-flex align-items-center gap-2"
                                        onClick={() => {
                                            navigate('/');
                                            setShowUserDropdown(false);
                                        }}
                                    >
                                        <i className="fas fa-home"></i>
                                        Inicio
                                    </button>
                                    <div className="d-flex align-items-center justify-content-between p-2">
                                        <span className="small">Modo Oscuro</span>
                                        <div className="form-check form-switch">
                                            <input
                                                className="form-check-input"
                                                type="checkbox"
                                                checked={isDarkMode}
                                                onChange={toggleTheme}
                                            />
                                        </div>
                                    </div>
                                    <hr className="my-2" />
                                    <button
                                        className="btn btn-link w-100 text-start text-danger d-flex align-items-center gap-2"
                                        onClick={logout}
                                    >
                                        <i className="fas fa-sign-out-alt"></i>
                                        Cerrar Sesión
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
}

export default ClienteHeader;
