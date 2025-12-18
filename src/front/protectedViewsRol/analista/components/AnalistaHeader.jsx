import React from 'react';

/**
 * AnalistaHeader - Componente de presentación para el header del analista
 * Incluye: toggle sidebar, búsqueda, sincronizar, dropdown usuario
 */
function AnalistaHeader({
    sidebarHidden,
    toggleSidebar,
    searchQuery,
    handleSearch,
    setSearchQuery,
    searchResults,
    showSearchResults,
    setShowSearchResults,
    closeSearchResults,
    selectTicketFromSearch,
    actualizarTickets,
    userData,
    store,
    showUserDropdown,
    setShowUserDropdown,
    setActiveView,
    isDarkMode,
    toggleTheme,
    navigate,
    logout
}) {
    return (
        <header className="hyper-header bg-white border-bottom p-3">
            <div className="d-flex align-items-center justify-content-between w-100">
                <div className="d-flex align-items-center gap-3">
                    <button
                        className="hyper-sidebar-toggle btn btn-link p-2"
                        onClick={toggleSidebar}
                        title={sidebarHidden ? "Mostrar menú" : "Ocultar menú"}
                    >
                        <i className="fas fa-bars"></i>
                    </button>

                    {/* Barra de búsqueda */}
                    <div className="hyper-search position-relative">
                        <i className="fas fa-search position-absolute top-50 start-0 translate-middle-y ms-3 text-muted"></i>
                        <input
                            type="text"
                            className="form-control pe-5"
                            placeholder="Buscar tickets por título..."
                            value={searchQuery}
                            onChange={(e) => handleSearch(e.target.value)}
                            onFocus={() => {
                                if (searchResults.length > 0) {
                                    setShowSearchResults(true);
                                }
                            }}
                        />
                        {searchQuery && (
                            <button
                                className="btn btn-link position-absolute top-50 end-0 translate-middle-y me-3 p-0 z-index-10"
                                onClick={() => {
                                    setSearchQuery('');
                                    closeSearchResults();
                                }}
                                title="Limpiar búsqueda"
                            >
                                <i className="fas fa-times text-muted"></i>
                            </button>
                        )}

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
                                        >
                                            <div className="fw-semibold">#{ticket.id} - {ticket.titulo}</div>
                                            <small className="text-muted">
                                                {ticket.estado} • {ticket.prioridad}
                                            </small>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="d-flex align-items-center gap-3">
                    {/* Botón de sincronizar */}
                    <button
                        className="btn btn-outline-primary d-flex align-items-center gap-2"
                        onClick={actualizarTickets}
                        title="Sincronizar datos"
                        style={{
                            borderColor: 'var(--ct-primary)',
                            color: 'var(--ct-primary)',
                            fontSize: '0.9rem',
                            fontWeight: '500',
                            padding: '0.5rem 1rem',
                            borderRadius: '0.5rem',
                            transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                            e.target.style.backgroundColor = 'var(--ct-primary)';
                            e.target.style.color = 'white';
                        }}
                        onMouseLeave={(e) => {
                            e.target.style.backgroundColor = 'transparent';
                            e.target.style.color = 'var(--ct-primary)';
                        }}
                    >
                        <i className="fas fa-sync-alt"></i>
                        <span>Sincronizar</span>
                    </button>

                    {/* Dropdown del usuario */}
                    <div className="position-relative dropdown">
                        <button
                            className="btn btn-link d-flex align-items-center gap-2 text-decoration-none"
                            onClick={() => setShowUserDropdown(!showUserDropdown)}
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
                                {userData?.nombre || store.auth.user?.nombre || 'Analista'}
                            </span>
                            <i className="fas fa-chevron-down"></i>
                        </button>

                        {showUserDropdown && (
                            <div className="position-absolute end-0 mt-2 bg-white border rounded shadow-lg dropdown-menu-min-width">
                                <div className="p-3 border-bottom">
                                    <div className="fw-semibold">
                                        {userData?.nombre || store.auth.user?.nombre || 'Analista'}
                                    </div>
                                    <small className="text-muted">Analista</small>
                                </div>
                                <div className="p-2">
                                    <button
                                        className="btn btn-link w-100 text-start d-flex align-items-center gap-2"
                                        style={{ textDecoration: 'none' }}
                                        onClick={() => {
                                            setActiveView('profile');
                                            setShowUserDropdown(false);
                                        }}
                                    >
                                        <i className="fas fa-user-edit"></i>
                                        <span>Mi Perfil</span>
                                    </button>
                                    <button
                                        className="btn btn-link w-100 text-start d-flex align-items-center gap-2"
                                        style={{ textDecoration: 'none' }}
                                        onClick={() => {
                                            setShowUserDropdown(false);
                                            navigate('/');
                                        }}
                                    >
                                        <i className="fas fa-home"></i>
                                        <span>Ir al inicio</span>
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
                                        className="btn btn-link w-100 text-start d-flex align-items-center gap-2 text-danger"
                                        style={{ textDecoration: 'none' }}
                                        onClick={() => {
                                            setShowUserDropdown(false);
                                            logout();
                                        }}
                                    >
                                        <i className="fas fa-sign-out-alt"></i>
                                        <span>Cerrar sesión</span>
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

export default AnalistaHeader;
