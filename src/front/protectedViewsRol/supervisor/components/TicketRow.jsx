import React from 'react';

/**
 * TicketRow - Fila individual de ticket del supervisor
 * Diseño unificado con cliente, mantiene semáforo y botones específicos
 */
function TicketRow({
    ticket,
    expandedTickets,
    toggleTicketExpansion,
    getSemaforoColor,
    tieneSolicitudReapertura,
    fueEscaladoPorAnalista,
    ticketsConRecomendaciones,
    getAvailableActions,
    asignarTicket,
    reasignarTicket,
    analistasCombinados,
    setActiveView,
    changeView,
    cerrarTicket,
    reabrirTicket,
    generarRecomendacion
}) {
    const isExpanded = expandedTickets.has(ticket.id);
    const actions = getAvailableActions ? getAvailableActions(ticket) : {};
    const tieneSolicitud = tieneSolicitudReapertura ? tieneSolicitudReapertura(ticket) : false;
    const fueEscalado = fueEscaladoPorAnalista ? fueEscaladoPorAnalista(ticket) : false;

    return (
        <React.Fragment>
            <tr
                data-ticket-id={ticket.id}
                className={`${getSemaforoColor ? getSemaforoColor(ticket, []) : ''} ${tieneSolicitud ? 'table-warning' : ''}`}
            >
                {/* ID + Imagen */}
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

                {/* Título + Descripción */}
                <td className="px-4">
                    <div className="d-flex align-items-start gap-2">
                        <span className="status-dot mt-1 bg-purple"></span>
                        <div>
                            <div className="fw-semibold mb-1 text-dark dark-theme:text-white">{ticket.titulo}</div>
                            <small className="text-muted dark-theme:text-white">
                                {ticket.descripcion?.length > 50
                                    ? `${ticket.descripcion.substring(0, 50)}...`
                                    : ticket.descripcion
                                }
                            </small>
                            {/* Indicadores */}
                            <div className="d-flex gap-1 mt-1">
                                {tieneSolicitud && (
                                    <span className="badge bg-warning text-dark" title="Solicitud de reapertura">
                                        <i className="fas fa-inbox"></i>
                                    </span>
                                )}
                                {fueEscalado && (
                                    <span className="badge bg-info" title="Escalado por analista">
                                        <i className="fas fa-arrow-up"></i>
                                    </span>
                                )}
                                {ticketsConRecomendaciones && ticketsConRecomendaciones.has(ticket.id) && (
                                    <span className="badge bg-success" title="Tiene recomendaciones IA">
                                        <i className="fas fa-lightbulb"></i>
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                </td>

                {/* Estado */}
                <td className="text-center px-3">
                    <span className="d-flex align-items-center justify-content-center gap-2">
                        <span
                            className={`rounded-circle d-inline-block ${ticket.estado?.toLowerCase() === 'solucionado' ? 'dot-estado-solucionado' :
                                ticket.estado?.toLowerCase() === 'en_proceso' ? 'dot-estado-en-proceso' :
                                    ticket.estado?.toLowerCase() === 'en_espera' ? 'dot-estado-en-espera' :
                                        'dot-ct-blue'
                                }`}
                        ></span>
                        <span className="text-dark dark-theme:text-white">
                            {ticket.estado}
                        </span>
                    </span>
                </td>

                {/* Prioridad */}
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

                {/* Analista Asignado */}
                <td className="text-center px-3">
                    {ticket.asignacion_actual?.analista ? (
                        <span className="d-flex align-items-center justify-content-center gap-2">
                            <span className="status-dot bg-success"></span>
                            <span className="text-dark dark-theme:text-white">
                                {ticket.asignacion_actual.analista.nombre}
                            </span>
                        </span>
                    ) : (
                        <span className="d-flex align-items-center justify-content-center gap-2">
                            <span className="status-dot bg-secondary"></span>
                            <span className="text-dark dark-theme:text-white">
                                Sin asignar
                            </span>
                        </span>
                    )}
                </td>

                {/* Fecha */}
                <td className="text-center px-3">
                    <span className="d-flex align-items-center justify-content-center gap-2">
                        <span className="status-dot bg-info"></span>
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

                {/* Cliente */}
                <td className="text-center px-3">
                    <span className="d-flex align-items-center justify-content-center gap-2">
                        <span className="status-dot bg-info"></span>
                        <span className="text-dark dark-theme:text-white">
                            {ticket.cliente?.nombre || 'Sin cliente'}
                        </span>
                    </span>
                </td>

                {/* Acciones */}
                <td className="text-center px-4">
                    <div className="d-flex flex-column gap-2">
                        {/* Fila 1: Ver, Comentarios, Chat */}
                        <div className="d-flex gap-1">
                            <button
                                className="btn btn-sidebar-teal btn-sm"
                                title="Ver detalles"
                                onClick={() => setActiveView(`ticket-${ticket.id}`)}
                            >
                                <i className="fas fa-eye"></i>
                            </button>
                            <button
                                className="btn btn-sidebar-accent btn-sm"
                                title="Ver y agregar comentarios"
                                onClick={() => changeView(`comentarios-${ticket.id}`)}
                            >
                                <i className="fas fa-users"></i>
                            </button>
                            <button
                                className="btn btn-sidebar-secondary btn-sm"
                                title="Chat con analista asignado"
                                onClick={() => changeView(`supervisor-chat-${ticket.id}`)}
                            >
                                <i className="fas fa-user-tie"></i>
                            </button>
                        </div>

                        {/* Fila 2: IA, Asignar, Cerrar/Reabrir */}
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
                                            onClick={() => changeView(`identificar-${ticket.id}`)}
                                        >
                                            <i className="fas fa-camera me-2"></i>
                                            Analizar Imagen
                                        </button>
                                    </li>
                                </ul>
                            </div>

                            {/* Asignar/Reasignar */}
                            {actions.canAssign && analistasCombinados && (
                                <div className="dropdown">
                                    <button
                                        className="btn btn-outline-primary btn-sm dropdown-toggle"
                                        type="button"
                                        data-bs-toggle="dropdown"
                                        title={ticket.asignacion_actual?.analista ? 'Reasignar' : 'Asignar'}
                                    >
                                        <i className="fas fa-user-plus"></i>
                                    </button>
                                    <ul className="dropdown-menu">
                                        {analistasCombinados.map((analista) => (
                                            <li key={analista.id}>
                                                <button
                                                    className="dropdown-item"
                                                    onClick={() => {
                                                        if (ticket.asignacion_actual?.analista && reasignarTicket) {
                                                            reasignarTicket(ticket.id, analista.id);
                                                        } else {
                                                            asignarTicket(ticket.id, analista.id);
                                                        }
                                                    }}
                                                >
                                                    <i className="fas fa-user me-2"></i>
                                                    {analista.nombre} {analista.apellido}
                                                </button>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {/* Cerrar */}
                            {actions.canClose && (
                                <button
                                    className="btn btn-outline-success btn-sm"
                                    title="Cerrar ticket"
                                    onClick={() => cerrarTicket(ticket.id)}
                                >
                                    <i className="fas fa-check"></i>
                                </button>
                            )}

                            {/* Reabrir */}
                            {actions.showReopenButton && (
                                <button
                                    className="btn btn-outline-warning btn-sm"
                                    title="Reabrir ticket"
                                    onClick={() => reabrirTicket(ticket.id)}
                                >
                                    <i className="fas fa-redo"></i>
                                </button>
                            )}
                        </div>
                    </div>
                </td>

                {/* Expandir */}
                <td className="text-center px-2">
                    <button
                        className="btn btn-outline-secondary btn-sm btn-action-full d-flex align-items-center justify-content-center"
                        onClick={() => toggleTicketExpansion(ticket.id)}
                        title={isExpanded ? "Colapsar acciones" : "Expandir acciones"}
                    >
                        <i className={`fas ${isExpanded ? 'fa-arrow-down' : 'fa-arrow-up'}`}></i>
                    </button>
                </td>
            </tr>

            {/* Fila expandida */}
            {isExpanded && (
                <tr className={tieneSolicitud ? 'table-warning' : ''}>
                    <td colSpan="9" className="px-0 py-0">
                        <div className={`w-100 border-top ${tieneSolicitud ? 'bg-warning bg-opacity-25' : 'bg-light'}`}>
                            <div className="px-4 py-3">
                                <div className="d-flex gap-2 flex-wrap justify-content-center">
                                    <button
                                        className="btn btn-sidebar-teal flex-fill btn-action-min"
                                        title="Ver detalles del ticket"
                                        onClick={() => setActiveView(`ticket-${ticket.id}`)}
                                    >
                                        <i className="fas fa-eye me-2"></i>
                                        Ver Detalles
                                    </button>
                                    <button
                                        className="btn btn-sidebar-accent flex-fill btn-action-min"
                                        title="Ver y agregar comentarios"
                                        onClick={() => changeView(`comentarios-${ticket.id}`)}
                                    >
                                        <i className="fas fa-comments me-2"></i>
                                        Comentarios
                                    </button>
                                    <button
                                        className="btn btn-sidebar-secondary flex-fill btn-action-min"
                                        title="Chat con analista asignado"
                                        onClick={() => changeView(`supervisor-chat-${ticket.id}`)}
                                    >
                                        <i className="fas fa-user-tie me-2"></i>
                                        Chat Analista
                                    </button>
                                    <div className="btn-group flex-fill btn-action-min" role="group">
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
                                                    onClick={() => changeView(`identificar-${ticket.id}`)}
                                                >
                                                    <i className="fas fa-camera me-2"></i>
                                                    Analizar Imagen
                                                </button>
                                            </li>
                                        </ul>
                                    </div>

                                    {/* Asignar/Reasignar */}
                                    {actions.canAssign && analistasCombinados && (
                                        <div className="dropdown flex-fill btn-action-min">
                                            <button
                                                className="btn btn-outline-primary dropdown-toggle w-100"
                                                type="button"
                                                data-bs-toggle="dropdown"
                                            >
                                                <i className="fas fa-user-plus me-2"></i>
                                                {ticket.asignacion_actual?.analista ? 'Reasignar' : 'Asignar'}
                                            </button>
                                            <ul className="dropdown-menu">
                                                {analistasCombinados.map((analista) => (
                                                    <li key={analista.id}>
                                                        <button
                                                            className="dropdown-item"
                                                            onClick={() => {
                                                                if (ticket.asignacion_actual?.analista && reasignarTicket) {
                                                                    reasignarTicket(ticket.id, analista.id);
                                                                } else {
                                                                    asignarTicket(ticket.id, analista.id);
                                                                }
                                                            }}
                                                        >
                                                            <i className="fas fa-user me-2"></i>
                                                            {analista.nombre} {analista.apellido}
                                                        </button>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}

                                    {/* Cerrar */}
                                    {actions.canClose && (
                                        <button
                                            className="btn btn-outline-success flex-fill btn-action-min"
                                            title="Cerrar ticket"
                                            onClick={() => cerrarTicket(ticket.id)}
                                        >
                                            <i className="fas fa-check me-2"></i>
                                            Cerrar
                                        </button>
                                    )}

                                    {/* Reabrir */}
                                    {actions.showReopenButton && (
                                        <button
                                            className="btn btn-outline-warning flex-fill btn-action-min"
                                            title="Reabrir ticket"
                                            onClick={() => reabrirTicket(ticket.id)}
                                        >
                                            <i className="fas fa-redo me-2"></i>
                                            Reabrir
                                        </button>
                                    )}

                                    {/* Mensaje de solicitud de reapertura */}
                                    {tieneSolicitud && (
                                        <div className="alert alert-warning py-3 px-4 mb-0 flex-fill text-center" role="alert">
                                            <i className="fas fa-clock me-2"></i>
                                            <strong>Solicitud de reapertura pendiente</strong>
                                            <p className="mb-0 mt-1 small">El cliente ha solicitado reabrir este ticket</p>
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
}

export default TicketRow;
