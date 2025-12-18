import React from 'react';

/**
 * AnalistaTicketsList - Componente de presentación para la lista de tickets
 */
function AnalistaTicketsList({
    tickets,
    expandedTickets,
    ticketsSolicitudReapertura,
    toggleTicketExpansion,
    openVerHD,
    openComments,
    openChat,
    openSupervisorChat,
    setModalTicketId,
    setActiveView,
    iniciarTrabajo,
    marcarComoResuelto,
    escalarTicket
}) {
    return (
        <>
            <h1 className="hyper-page-title">Mis Tickets</h1>

            <div className="card border-0 shadow-sm">
                <div className="card-header bg-white border-0 d-flex justify-content-between align-items-center">
                    <h5 className="card-title mb-0">Mis Tickets</h5>
                </div>
                <div className="card-body p-0">
                    {tickets.length === 0 ? (
                        <div className="text-center py-5">
                            <div className="mb-3">
                                <i className="fas fa-ticket-alt fa-3x text-muted"></i>
                            </div>
                            <h5 className="text-muted">No tienes tickets asignados</h5>
                            <p className="text-muted">
                                Los tickets aparecerán aquí cuando te sean asignados por un supervisor.
                            </p>
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
                                        <th className="text-center px-3">Cliente</th>
                                        <th className="text-center px-3">Fecha</th>
                                        <th className="text-center px-4">Acciones</th>
                                        <th className="text-center px-2 th-expand">Expandir</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {tickets.map((ticket) => {
                                        const isExpanded = expandedTickets.has(ticket.id);
                                        return (
                                            <React.Fragment key={ticket.id}>
                                                <tr
                                                    data-ticket-id={ticket.id}
                                                    className={ticketsSolicitudReapertura.has(ticket.id) ? 'table-warning' : ''}
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
                                                            <span className="rounded-circle d-inline-block mt-1 status-dot bg-purple"></span>
                                                            <div>
                                                                <div className="fw-semibold mb-1 text-dark">{ticket.titulo}</div>
                                                                <small className="text-muted">
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
                                                                className={`rounded-circle d-inline-block ${ticket.estado.toLowerCase() === 'solucionado' ? 'dot-estado-solucionado' :
                                                                    ticket.estado.toLowerCase() === 'en_proceso' ? 'dot-estado-en-proceso' :
                                                                        ticket.estado.toLowerCase() === 'en_espera' ? 'dot-estado-en-espera' :
                                                                            'dot-ct-blue'
                                                                    }`}
                                                            ></span>
                                                            <span className="text-dark">
                                                                {ticket.estado}
                                                            </span>
                                                        </span>
                                                        {ticketsSolicitudReapertura.has(ticket.id) && (
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
                                                            <span className="text-dark">
                                                                {ticket.prioridad || 'Normal'}
                                                            </span>
                                                        </span>
                                                    </td>
                                                    <td className="text-center px-3">
                                                        <span className="d-flex align-items-center justify-content-center gap-2">
                                                            <span className="rounded-circle d-inline-block status-dot dot-ct-info"></span>
                                                            <span className="text-dark">
                                                                {ticket.cliente?.nombre || 'Sin cliente'}
                                                            </span>
                                                        </span>
                                                    </td>
                                                    <td className="text-center px-3">
                                                        <span className="d-flex align-items-center justify-content-center gap-2">
                                                            <span className="rounded-circle d-inline-block status-dot dot-ct-info"></span>
                                                            <small className="text-dark">
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
                                                    <td className="text-center px-4">
                                                        <div className="d-flex flex-column gap-2">
                                                            <div className="d-flex gap-1">
                                                                <button
                                                                    className="btn btn-sidebar-teal btn-sm"
                                                                    title="Ver detalles"
                                                                    onClick={() => openVerHD(ticket.id)}
                                                                >
                                                                    <i className="fas fa-eye"></i>
                                                                </button>
                                                                <button
                                                                    className="btn btn-sidebar-accent btn-sm"
                                                                    title="Ver y agregar comentarios"
                                                                    onClick={() => openComments(ticket.id)}
                                                                >
                                                                    <i className="fas fa-users"></i>
                                                                </button>
                                                                <button
                                                                    className="btn btn-sidebar-secondary btn-sm"
                                                                    title="Chat con cliente"
                                                                    onClick={() => openChat(ticket.id)}
                                                                >
                                                                    <i className="fas fa-comments"></i>
                                                                </button>
                                                                <button
                                                                    className="btn btn-sidebar-warning btn-sm"
                                                                    title="Chat con supervisor"
                                                                    onClick={() => openSupervisorChat(ticket.id)}
                                                                >
                                                                    <i className="fas fa-user-tie"></i>
                                                                </button>
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
                                                                                onClick={() => {
                                                                                    setModalTicketId(ticket.id);
                                                                                    setActiveView(`recomendacion-${ticket.id}`);
                                                                                }}
                                                                            >
                                                                                <i className="fas fa-lightbulb me-2"></i>
                                                                                Generar Recomendación
                                                                            </button>
                                                                        </li>
                                                                        <li>
                                                                            <button
                                                                                className="dropdown-item"
                                                                                onClick={() => {
                                                                                    setModalTicketId(ticket.id);
                                                                                    setActiveView(`identificar-${ticket.id}`);
                                                                                }}
                                                                            >
                                                                                <i className="fas fa-image me-2"></i>
                                                                                Identificar Imagen
                                                                            </button>
                                                                        </li>
                                                                    </ul>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="text-center px-2">
                                                        <button
                                                            className="btn btn-link p-0 btn-expand-toggle"
                                                            onClick={() => toggleTicketExpansion(ticket.id)}
                                                            title={isExpanded ? "Colapsar acciones" : "Expandir acciones"}
                                                        >
                                                            <i className={`fas ${isExpanded ? 'fa-arrow-down' : 'fa-arrow-up'}`}></i>
                                                        </button>
                                                    </td>
                                                </tr>

                                                {/* Fila expandida */}
                                                {isExpanded && (
                                                    <tr className={ticketsSolicitudReapertura.has(ticket.id) ? 'table-warning' : ''}>
                                                        <td colSpan="8" className="px-0 py-0">
                                                            <div className={`w-100 border-top ${ticketsSolicitudReapertura.has(ticket.id) ? 'bg-warning bg-opacity-25' : 'bg-light'}`}>
                                                                <div className="px-4 py-3">
                                                                    <div className="d-flex gap-2 flex-wrap justify-content-center">
                                                                        <button
                                                                            className="btn btn-sidebar-teal flex-fill btn-action-min"
                                                                            title="Ver detalles del ticket"
                                                                            onClick={() => openVerHD(ticket.id)}
                                                                        >
                                                                            <i className="fas fa-eye me-2"></i>
                                                                            Ver Detalles
                                                                        </button>
                                                                        <button
                                                                            className="btn btn-sidebar-accent flex-fill btn-action-min"
                                                                            title="Ver y agregar comentarios"
                                                                            onClick={() => openComments(ticket.id)}
                                                                        >
                                                                            <i className="fas fa-comments me-2"></i>
                                                                            Comentarios
                                                                        </button>
                                                                        <button
                                                                            className="btn btn-sidebar-secondary flex-fill btn-action-min"
                                                                            title="Chat con cliente"
                                                                            onClick={() => openChat(ticket.id)}
                                                                        >
                                                                            <i className="fas fa-comments me-2"></i>
                                                                            Chat
                                                                        </button>
                                                                        <div className="btn-group flex-fill" role="group">
                                                                            <button
                                                                                className="btn btn-sidebar-primary dropdown-toggle btn-action-min"
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
                                                                                        onClick={() => {
                                                                                            setModalTicketId(ticket.id);
                                                                                            setActiveView(`recomendacion-${ticket.id}`);
                                                                                        }}
                                                                                    >
                                                                                        <i className="fas fa-lightbulb me-2"></i>
                                                                                        Generar Recomendación
                                                                                    </button>
                                                                                </li>
                                                                                <li>
                                                                                    <button
                                                                                        className="dropdown-item"
                                                                                        onClick={() => {
                                                                                            setModalTicketId(ticket.id);
                                                                                            setActiveView(`identificar-${ticket.id}`);
                                                                                        }}
                                                                                    >
                                                                                        <i className="fas fa-image me-2"></i>
                                                                                        Identificar Imagen
                                                                                    </button>
                                                                                </li>
                                                                            </ul>
                                                                        </div>

                                                                        {ticketsSolicitudReapertura.has(ticket.id) ? (
                                                                            <div className="text-center p-2">
                                                                                <small className="text-muted">Solicitud de reapertura enviada. Esperando resolución del supervisor.</small>
                                                                            </div>
                                                                        ) : (
                                                                            <>
                                                                                {ticket.estado === 'en_espera' && (
                                                                                    <button
                                                                                        className="btn btn-success flex-fill btn-action-min"
                                                                                        onClick={() => iniciarTrabajo(ticket.id)}
                                                                                    >
                                                                                        <i className="fas fa-play me-2"></i>
                                                                                        Iniciar
                                                                                    </button>
                                                                                )}

                                                                                {ticket.estado === 'en_proceso' && (
                                                                                    <button
                                                                                        className="btn btn-outline-success flex-fill btn-action-min"
                                                                                        onClick={() => marcarComoResuelto(ticket.id)}
                                                                                    >
                                                                                        <i className="fas fa-check me-2"></i>
                                                                                        Resolver
                                                                                    </button>
                                                                                )}

                                                                                <button
                                                                                    className="btn btn-outline-warning flex-fill btn-action-min"
                                                                                    onClick={() => escalarTicket(ticket.id)}
                                                                                >
                                                                                    <i className="fas fa-arrow-up me-2"></i>
                                                                                    Escalar
                                                                                </button>
                                                                            </>
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

export default AnalistaTicketsList;
