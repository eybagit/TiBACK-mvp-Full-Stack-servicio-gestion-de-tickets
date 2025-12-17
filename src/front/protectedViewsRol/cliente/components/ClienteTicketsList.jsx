import React from 'react';

/**
 * ClienteTicketsList - Vista de lista de tickets del cliente
 * Muestra tabla con tickets, filtros y acciones
 * 
 * Props requeridas:
 * - tickets: array de tickets
 * - loading: boolean
 * - filterEstado, filterAsignado, filterPrioridad: strings de filtro
 * - showFilterDropdown: boolean
 * - setShowFilterDropdown, setFilterEstado, setFilterAsignado, setFilterPrioridad: funciones set
 * - applyFilters, clearFilters: funciones
 * - getFilteredTickets: función que retorna tickets filtrados
 * - expandedTickets: Set de IDs expandidos
 * - toggleTicketExpansion: función
 * - solicitudesReapertura: Set de IDs con solicitudes
 * - ticketsConRecomendaciones: Set de IDs con recomendaciones
 * - changeView, setSelectedTicketId: funciones de navegación
 * - tieneAnalistaAsignado, getAnalistaAsignado: funciones helper
 * - generarRecomendacion, cerrarTicket, solicitarReapertura: funciones de acciones
 * - navigate: función de navegación (useNavigate)
 */
function ClienteTicketsList({
    tickets,
    loading,
    filterEstado,
    filterAsignado,
    filterPrioridad,
    showFilterDropdown,
    setShowFilterDropdown,
    setFilterEstado,
    setFilterAsignado,
    setFilterPrioridad,
    applyFilters,
    clearFilters,
    getFilteredTickets,
    expandedTickets,
    toggleTicketExpansion,
    solicitudesReapertura,
    ticketsConRecomendaciones,
    changeView,
    setSelectedTicketId,
    tieneAnalistaAsignado,
    getAnalistaAsignado,
    generarRecomendacion,
    cerrarTicket,
    solicitarReapertura,
    navigate
}) {
    return (
        <>
            <h1 className="hyper-page-title">Mis Tickets</h1>

            <div className="card border-0 shadow-sm">
                <div className="card-header bg-white border-0 d-flex justify-content-between align-items-center">
                    <h5 className="card-title mb-0">Mis Tickets</h5>
                    <div className="d-flex gap-2">
                        <div className="dropdown filter-dropdown">
                            <button
                                className="btn btn-outline-primary btn-sm dropdown-toggle"
                                type="button"
                                onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                            >
                                <i className="fas fa-filter me-1"></i>
                                Filtrar
                                {(filterEstado || filterAsignado || filterPrioridad) && (
                                    <span className="badge bg-primary ms-1">{(filterEstado ? 1 : 0) + (filterAsignado ? 1 : 0) + (filterPrioridad ? 1 : 0)}</span>
                                )}
                            </button>

                            {showFilterDropdown && (
                                <div className="dropdown-menu show position-absolute dropdown-menu-positioned">
                                    <div className="dropdown-header">
                                        <h6 className="mb-0">Filtrar Tickets</h6>
                                    </div>

                                    <div className="px-3 py-2">
                                        <label className="form-label small">Por Estado:</label>
                                        <select
                                            className="form-select form-select-sm"
                                            value={filterEstado}
                                            onChange={(e) => setFilterEstado(e.target.value)}
                                        >
                                            <option value="">Todos los estados</option>
                                            <option value="creado">Creado</option>
                                            <option value="en_espera">En Espera</option>
                                            <option value="en_proceso">En Proceso</option>
                                            <option value="solucionado">Solucionado</option>
                                            <option value="cerrado">Cerrado</option>
                                        </select>
                                    </div>

                                    <div className="px-3 py-2">
                                        <label className="form-label small">Por Asignación:</label>
                                        <select
                                            className="form-select form-select-sm"
                                            value={filterAsignado}
                                            onChange={(e) => setFilterAsignado(e.target.value)}
                                        >
                                            <option value="">Todos</option>
                                            <option value="asignados">Con Analista Asignado</option>
                                            <option value="sin_asignar">Sin Asignar</option>
                                        </select>
                                    </div>

                                    <div className="px-3 py-2">
                                        <label className="form-label small">Por Prioridad:</label>
                                        <select
                                            className="form-select form-select-sm"
                                            value={filterPrioridad}
                                            onChange={(e) => setFilterPrioridad(e.target.value)}
                                        >
                                            <option value="">Todas las prioridades</option>
                                            <option value="alta">Alta</option>
                                            <option value="media">Media</option>
                                            <option value="normal">Normal</option>
                                            <option value="baja">Baja</option>
                                        </select>
                                    </div>

                                    <div className="dropdown-divider"></div>

                                    <div className="d-flex gap-2 px-3 py-2">
                                        <button
                                            className="btn btn-primary btn-sm flex-fill"
                                            onClick={applyFilters}
                                        >
                                            <i className="fas fa-check me-1"></i>
                                            Aplicar
                                        </button>
                                        <button
                                            className="btn btn-outline-secondary btn-sm flex-fill"
                                            onClick={clearFilters}
                                        >
                                            <i className="fas fa-times me-1"></i>
                                            Limpiar
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
                <div className="card-body p-0">

                    {loading ? (
                        <div className="text-center py-4">
                            <div className="spinner-border text-primary" role="status">
                                <span className="visually-hidden">Cargando tickets...</span>
                            </div>
                        </div>
                    ) : getFilteredTickets().length === 0 ? (
                        <div className="text-center py-4">
                            <i className="fas fa-filter fa-3x text-muted mb-3"></i>
                            <p className="text-muted">
                                {tickets.length === 0
                                    ? "No tienes tickets creados aún."
                                    : "No se encontraron tickets con los filtros aplicados."
                                }
                            </p>
                            {tickets.length === 0 ? (
                                <button
                                    className="btn btn-primary"
                                    onClick={() => changeView('create')}
                                >
                                    <i className="fas fa-plus me-1"></i>
                                    Crear mi primer ticket
                                </button>
                            ) : (
                                <button
                                    className="btn btn-outline-secondary"
                                    onClick={clearFilters}
                                >
                                    <i className="fas fa-times me-1"></i>
                                    Limpiar filtros
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className="table-responsive">
                            <table className="table table-hover mb-0">
                                <thead className="table-light">
                                    <tr>
                                        <th className="text-center px-3">ID</th>
                                        <th className="text-center px-4">Título</th>
                                        <th className="text-center px-3">Estado</th>
                                        <th className="text-center px-3">Prioridad</th>
                                        <th className="text-center px-3">Asignado a</th>
                                        <th className="text-center px-3">Fecha</th>
                                        <th className="text-center px-3">Calificación</th>
                                        <th className="text-center px-4">Acciones</th>
                                        <th className="text-center px-2" style={{ width: '50px' }}>Expandir</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {getFilteredTickets().map((ticket) => {
                                        const isExpanded = expandedTickets.has(ticket.id);
                                        return (
                                            <React.Fragment key={ticket.id}>
                                                <tr
                                                    data-ticket-id={ticket.id}
                                                    className={solicitudesReapertura.has(ticket.id) ? 'table-warning' : ''}
                                                >
                                                    <td className="text-center px-3">
                                                        <div className="d-flex align-items-center justify-content-center">
                                                            <span className="me-2">#{ticket.id}</span>
                                                            {ticket.url_imagen ? (
                                                                <img
                                                                    src={ticket.url_imagen}
                                                                    alt="Imagen del ticket"
                                                                    className="img-thumbnail thumbnail-small"
                                                                />
                                                            ) : (
                                                                <span className="text-muted">
                                                                    <i className="fas fa-image icon-tiny"></i>
                                                                </span>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="px-4">
                                                        <div className="d-flex align-items-start gap-2">
                                                            <span
                                                                className="rounded-circle d-inline-block mt-1"
                                                                style={{
                                                                    width: '8px',
                                                                    height: '8px',
                                                                    backgroundColor: '#6f42c1'
                                                                }}
                                                            ></span>
                                                            <div>
                                                                <div className="fw-semibold mb-1 text-dark dark-theme:text-white">{ticket.titulo}</div>
                                                                <small className="text-muted dark-theme:text-white">
                                                                    {ticket.descripcion.length > 50
                                                                        ? `${ticket.descripcion.substring(0, 50)}...`
                                                                        : ticket.descripcion
                                                                    }
                                                                </small>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="text-center px-3">
                                                        <span className="d-flex align-items-center justify-content-center gap-2">
                                                            <span
                                                                className={`rounded-circle d-inline-block ${ticket.estado && ticket.estado.toLowerCase() === 'solucionado' ? 'dot-estado-solucionado' :
                                                                    ticket.estado && ticket.estado.toLowerCase() === 'en_proceso' ? 'dot-estado-en-proceso' :
                                                                        ticket.estado && ticket.estado.toLowerCase() === 'en_espera' ? 'dot-estado-en-espera' :
                                                                            'dot-ct-blue'
                                                                    }`}
                                                            ></span>
                                                            <span className="text-dark dark-theme:text-white">
                                                                {ticket.estado}
                                                            </span>
                                                        </span>
                                                        {solicitudesReapertura.has(ticket.id) && (
                                                            <div className="mt-1">
                                                                <small className="badge bg-warning text-dark">
                                                                    <i className="fas fa-clock me-1"></i>
                                                                    Solicitud enviada
                                                                </small>
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td className="text-center px-3">
                                                        <span className="d-flex align-items-center justify-content-center gap-2">
                                                            <span
                                                                className={`rounded-circle d-inline-block ${ticket.prioridad === 'alta' ? 'dot-prioridad-alta' :
                                                                    ticket.prioridad === 'media' ? 'dot-prioridad-media' :
                                                                        'dot-prioridad-baja'
                                                                    }`}
                                                            ></span>
                                                            <span className="text-dark dark-theme:text-white">
                                                                {ticket.prioridad || 'Normal'}
                                                            </span>
                                                        </span>
                                                    </td>
                                                    <td className="text-center px-3">
                                                        {tieneAnalistaAsignado(ticket) ? (
                                                            <span className="d-flex align-items-center justify-content-center gap-2">
                                                                <span
                                                                    className="rounded-circle d-inline-block"
                                                                    style={{
                                                                        width: '8px',
                                                                        height: '8px',
                                                                        backgroundColor: '#28a745'
                                                                    }}
                                                                ></span>
                                                                <span className="text-dark dark-theme:text-white">
                                                                    {getAnalistaAsignado(ticket)}
                                                                </span>
                                                            </span>
                                                        ) : (
                                                            <span className="d-flex align-items-center justify-content-center gap-2">
                                                                <span
                                                                    className="rounded-circle d-inline-block"
                                                                    style={{
                                                                        width: '8px',
                                                                        height: '8px',
                                                                        backgroundColor: '#6c757d'
                                                                    }}
                                                                ></span>
                                                                <span className="text-dark dark-theme:text-white">
                                                                    Sin asignar
                                                                </span>
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="text-center px-3">
                                                        <span className="d-flex align-items-center justify-content-center gap-2">
                                                            <span
                                                                className="rounded-circle d-inline-block"
                                                                style={{
                                                                    width: '8px',
                                                                    height: '8px',
                                                                    backgroundColor: '#17a2b8'
                                                                }}
                                                            ></span>
                                                            <small className="text-dark dark-theme:text-white">
                                                                {new Date(ticket.fecha_creacion).toLocaleDateString('es-ES', {
                                                                    year: 'numeric',
                                                                    month: 'short',
                                                                    day: 'numeric',
                                                                    hour: '2-digit',
                                                                    minute: '2-digit',
                                                                    hour12: true
                                                                })}
                                                            </small>
                                                        </span>
                                                    </td>
                                                    <td className="text-center px-3">
                                                        {ticket.calificacion ? (
                                                            <span className="d-flex align-items-center justify-content-center gap-2">
                                                                <span
                                                                    className="rounded-circle d-inline-block"
                                                                    style={{
                                                                        width: '8px',
                                                                        height: '8px',
                                                                        backgroundColor: '#ffc107'
                                                                    }}
                                                                ></span>
                                                                <div className="d-flex align-items-center">
                                                                    {[...Array(5)].map((_, i) => (
                                                                        <i
                                                                            key={i}
                                                                            className={`fas fa-star ${i < ticket.calificacion ? 'text-warning' : 'text-muted'}`}
                                                                            style={{ fontSize: '0.8rem' }}
                                                                        ></i>
                                                                    ))}
                                                                    <small className="ms-1 text-dark dark-theme:text-white">({ticket.calificacion}/5)</small>
                                                                </div>
                                                            </span>
                                                        ) : (
                                                            <span className="d-flex align-items-center justify-content-center gap-2">
                                                                <span
                                                                    className="rounded-circle d-inline-block"
                                                                    style={{
                                                                        width: '8px',
                                                                        height: '8px',
                                                                        backgroundColor: '#6c757d'
                                                                    }}
                                                                ></span>
                                                                <span className="text-dark dark-theme:text-white">Sin calificar</span>
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="text-center px-4">
                                                        <div className="d-flex flex-column gap-2">
                                                            {/* Fila superior: Ver detalles, Comentarios, Chat */}
                                                            <div className="d-flex gap-1">
                                                                <button
                                                                    className="btn btn-sidebar-teal btn-sm"
                                                                    title="Ver detalles"
                                                                    onClick={() => {
                                                                        changeView(`ticket-${ticket.id}`);
                                                                    }}
                                                                >
                                                                    <i className="fas fa-eye"></i>
                                                                </button>
                                                                <button
                                                                    className="btn btn-sidebar-accent btn-sm"
                                                                    title="Ver y agregar comentarios"
                                                                    onClick={() => {
                                                                        setSelectedTicketId(ticket.id);
                                                                        changeView(`comentarios-${ticket.id}`);
                                                                    }}
                                                                >
                                                                    <i className="fas fa-users"></i>
                                                                </button>
                                                                <button
                                                                    className="btn btn-sidebar-secondary btn-sm"
                                                                    title={tieneAnalistaAsignado(ticket) ? `Chat con ${getAnalistaAsignado(ticket)}` : "Chat con analista"}
                                                                    onClick={() => {
                                                                        setSelectedTicketId(ticket.id);
                                                                        changeView(`chat-${ticket.id}`);
                                                                    }}
                                                                >
                                                                    <i className={`fas ${tieneAnalistaAsignado(ticket) ? 'fa-signal' : 'fa-comments'}`}></i>
                                                                </button>
                                                            </div>

                                                            {/* Fila inferior: IA, Sugerencias, y botones de Cerrar/Reabrir */}
                                                            <div className="d-flex gap-1">
                                                                <div className="btn-group" role="group">
                                                                    <button
                                                                        className="btn btn-sidebar-primary btn-sm dropdown-toggle"
                                                                        type="button"
                                                                        data-bs-toggle="dropdown"
                                                                        aria-expanded="false"
                                                                        title="Opciones de IA"
                                                                    >
                                                                        <i className="fas fa-robot"></i> IA
                                                                    </button>
                                                                    <ul className="dropdown-menu">
                                                                        <li>
                                                                            <button
                                                                                className="dropdown-item"
                                                                                onClick={() => generarRecomendacion(ticket)}
                                                                            >
                                                                                <i className="fas fa-lightbulb me-2"></i>
                                                                                Generar Recomendación
                                                                            </button>
                                                                        </li>
                                                                        <li>
                                                                            <button
                                                                                className="dropdown-item"
                                                                                onClick={() => {
                                                                                    setSelectedTicketId(ticket.id);
                                                                                    changeView(`identificar-${ticket.id}`);
                                                                                }}
                                                                            >
                                                                                <i className="fas fa-camera me-2"></i>
                                                                                Analizar Imagen
                                                                            </button>
                                                                        </li>
                                                                    </ul>
                                                                </div>
                                                                {ticketsConRecomendaciones.has(ticket.id) && (
                                                                    <button
                                                                        className="btn btn-sidebar-teal btn-sm"
                                                                        title="Ver sugerencias disponibles"
                                                                        onClick={() => navigate(`/ticket/${ticket.id}/recomendaciones-similares`)}
                                                                    >
                                                                        <i className="fas fa-lightbulb"></i>
                                                                    </button>
                                                                )}

                                                                {/* Botones de Cerrar y Reabrir */}
                                                                {['solucionado', 'asignado', 'en_progreso', 'escalado'].includes(ticket.estado.toLowerCase()) && !solicitudesReapertura.has(ticket.id) && (
                                                                    <>
                                                                        <button
                                                                            className="btn btn-outline-success btn-sm"
                                                                            title="Cerrar ticket y calificar servicio"
                                                                            onClick={() => cerrarTicket(ticket.id)}
                                                                        >
                                                                            <i className="fas fa-check"></i>
                                                                        </button>
                                                                        <button
                                                                            className="btn btn-outline-warning btn-sm"
                                                                            title="Reabrir ticket si la solución no fue satisfactoria"
                                                                            onClick={() => solicitarReapertura(ticket.id)}
                                                                        >
                                                                            <i className="fas fa-redo"></i>
                                                                        </button>
                                                                    </>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="text-center px-2">
                                                        <button
                                                            className="btn btn-outline-secondary btn-sm"
                                                            style={{
                                                                height: '100%',
                                                                minHeight: '60px',
                                                                width: '40px',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center'
                                                            }}
                                                            onClick={() => toggleTicketExpansion(ticket.id)}
                                                            title={isExpanded ? "Colapsar acciones" : "Expandir acciones"}
                                                        >
                                                            <i className={`fas ${isExpanded ? 'fa-arrow-down' : 'fa-arrow-up'}`}></i>
                                                        </button>
                                                    </td>
                                                </tr>

                                                {/* Fila expandida con acciones grandes */}
                                                {isExpanded && (
                                                    <tr className={solicitudesReapertura.has(ticket.id) ? 'table-warning' : ''}>
                                                        <td colSpan="9" className="px-0 py-0">
                                                            <div className={`w-100 border-top ${solicitudesReapertura.has(ticket.id) ? 'bg-warning bg-opacity-25' : 'bg-light'}`}>
                                                                <div className="px-4 py-3">
                                                                    <div className="d-flex gap-2 flex-wrap justify-content-center">
                                                                        <button
                                                                            className="btn btn-sidebar-teal flex-fill"
                                                                            style={{ minWidth: '120px' }}
                                                                            title="Ver detalles del ticket"
                                                                            onClick={() => {
                                                                                changeView(`ticket-${ticket.id}`);
                                                                            }}
                                                                        >
                                                                            <i className="fas fa-eye me-2"></i>
                                                                            Ver Detalles
                                                                        </button>
                                                                        <button
                                                                            className="btn btn-sidebar-accent flex-fill"
                                                                            style={{ minWidth: '120px' }}
                                                                            title="Ver y agregar comentarios"
                                                                            onClick={() => {
                                                                                setSelectedTicketId(ticket.id);
                                                                                changeView(`comentarios-${ticket.id}`);
                                                                            }}
                                                                        >
                                                                            <i className="fas fa-comments me-2"></i>
                                                                            Comentarios
                                                                        </button>
                                                                        <button
                                                                            className="btn btn-sidebar-secondary flex-fill"
                                                                            style={{ minWidth: '120px' }}
                                                                            title={tieneAnalistaAsignado(ticket) ? `Chat con ${getAnalistaAsignado(ticket)}` : "Chat con analista"}
                                                                            onClick={() => {
                                                                                setSelectedTicketId(ticket.id);
                                                                                changeView(`chat-${ticket.id}`);
                                                                            }}
                                                                        >
                                                                            <i className={`fas ${tieneAnalistaAsignado(ticket) ? 'fa-signal' : 'fa-comments'} me-2`}></i>
                                                                            Chat
                                                                        </button>
                                                                        <div className="btn-group flex-fill" role="group" style={{ minWidth: '120px' }}>
                                                                            <button
                                                                                className="btn btn-sidebar-primary dropdown-toggle"
                                                                                type="button"
                                                                                data-bs-toggle="dropdown"
                                                                                aria-expanded="false"
                                                                                title="Opciones de IA"
                                                                            >
                                                                                <i className="fas fa-robot me-2"></i>
                                                                                IA
                                                                            </button>
                                                                            <ul className="dropdown-menu">
                                                                                <li>
                                                                                    <button
                                                                                        className="dropdown-item"
                                                                                        onClick={() => generarRecomendacion(ticket)}
                                                                                    >
                                                                                        <i className="fas fa-lightbulb me-2"></i>
                                                                                        Generar Recomendación
                                                                                    </button>
                                                                                </li>
                                                                                <li>
                                                                                    <button
                                                                                        className="dropdown-item"
                                                                                        onClick={() => {
                                                                                            setSelectedTicketId(ticket.id);
                                                                                            changeView(`identificar-${ticket.id}`);
                                                                                        }}
                                                                                    >
                                                                                        <i className="fas fa-camera me-2"></i>
                                                                                        Analizar Imagen
                                                                                    </button>
                                                                                </li>
                                                                            </ul>
                                                                        </div>
                                                                        {ticketsConRecomendaciones.has(ticket.id) && (
                                                                            <button
                                                                                className="btn btn-sidebar-teal flex-fill"
                                                                                style={{ minWidth: '120px' }}
                                                                                title="Ver sugerencias disponibles"
                                                                                onClick={() => navigate(`/ticket/${ticket.id}/recomendaciones-similares`)}
                                                                            >
                                                                                <i className="fas fa-lightbulb me-2"></i>
                                                                                Sugerencias
                                                                            </button>
                                                                        )}

                                                                        {/* Botones de Cerrar y Reabrir en vista expandida */}
                                                                        {['solucionado', 'asignado', 'en_progreso', 'escalado'].includes(ticket.estado.toLowerCase()) && !solicitudesReapertura.has(ticket.id) && (
                                                                            <>
                                                                                <button
                                                                                    className="btn btn-outline-success flex-fill"
                                                                                    style={{ minWidth: '120px' }}
                                                                                    title="Cerrar ticket y calificar servicio"
                                                                                    onClick={() => cerrarTicket(ticket.id)}
                                                                                >
                                                                                    <i className="fas fa-check me-2"></i>
                                                                                    Cerrar
                                                                                </button>
                                                                                <button
                                                                                    className="btn btn-outline-warning flex-fill"
                                                                                    style={{ minWidth: '120px' }}
                                                                                    title="Reabrir ticket si la solución no fue satisfactoria"
                                                                                    onClick={() => solicitarReapertura(ticket.id)}
                                                                                >
                                                                                    <i className="fas fa-redo me-2"></i>
                                                                                    Reabrir
                                                                                </button>
                                                                            </>
                                                                        )}

                                                                        {/* Mensaje de solicitud de reapertura pendiente */}
                                                                        {['solucionado', 'asignado', 'en_progreso', 'escalado'].includes(ticket.estado.toLowerCase()) && solicitudesReapertura.has(ticket.id) && (
                                                                            <div className="alert alert-warning py-3 px-4 mb-0 flex-fill text-center" role="alert" style={{ minWidth: '250px' }}>
                                                                                <i className="fas fa-clock me-2"></i>
                                                                                <strong>Solicitud de reapertura enviada</strong>
                                                                                <p className="mb-0 mt-1 small">El supervisor revisará tu solicitud pronto</p>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                )}
                                            </React.Fragment>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}

export default ClienteTicketsList;
