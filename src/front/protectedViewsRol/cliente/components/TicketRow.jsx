import React from 'react';

/**
 * TicketRow - Fila individual de ticket en la tabla
 * Incluye datos del ticket y acciones disponibles
 */
function TicketRow({
    ticket,
    isExpanded,
    solicitudesReapertura,
    ticketsConRecomendaciones,
    changeView,
    setSelectedTicketId,
    toggleTicketExpansion,
    tieneAnalistaAsignado,
    getAnalistaAsignado,
    generarRecomendacion,
    cerrarTicket,
    solicitarReapertura,
    navigate
}) {
    return (
        <React.Fragment>
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
                        <span className="status-dot mt-1 bg-purple"></span>
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
                            <span className="status-dot bg-success"></span>
                            <span className="text-dark dark-theme:text-white">
                                {getAnalistaAsignado(ticket)}
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
                <td className="text-center px-3">
                    {ticket.calificacion ? (
                        <span className="d-flex align-items-center justify-content-center gap-2">
                            <span className="status-dot bg-warning"></span>
                            <div className="d-flex align-items-center">
                                {[...Array(5)].map((_, i) => (
                                    <i
                                        key={i}
                                        className={`fas fa-star star-rating ${i < ticket.calificacion ? 'text-warning' : 'text-muted'}`}
                                    ></i>
                                ))}
                                <small className="ms-1 text-dark dark-theme:text-white">({ticket.calificacion}/5)</small>
                            </div>
                        </span>
                    ) : (
                        <span className="d-flex align-items-center justify-content-center gap-2">
                            <span className="status-dot bg-secondary"></span>
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
                                onClick={() => changeView(`ticket-${ticket.id}`)}
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
                        className="btn btn-outline-secondary btn-sm btn-action-full d-flex align-items-center justify-content-center"
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
                                        className="btn btn-sidebar-teal flex-fill btn-action-min"
                                        title="Ver detalles del ticket"
                                        onClick={() => changeView(`ticket-${ticket.id}`)}
                                    >
                                        <i className="fas fa-eye me-2"></i>
                                        Ver Detalles
                                    </button>
                                    <button
                                        className="btn btn-sidebar-accent flex-fill btn-action-min"
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
                                        className="btn btn-sidebar-secondary flex-fill btn-action-min"
                                        title={tieneAnalistaAsignado(ticket) ? `Chat con ${getAnalistaAsignado(ticket)}` : "Chat con analista"}
                                        onClick={() => {
                                            setSelectedTicketId(ticket.id);
                                            changeView(`chat-${ticket.id}`);
                                        }}
                                    >
                                        <i className={`fas ${tieneAnalistaAsignado(ticket) ? 'fa-signal' : 'fa-comments'} me-2`}></i>
                                        Chat
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
                                            className="btn btn-sidebar-teal flex-fill btn-action-min"
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
                                                className="btn btn-outline-success flex-fill btn-action-min"
                                                title="Cerrar ticket y calificar servicio"
                                                onClick={() => cerrarTicket(ticket.id)}
                                            >
                                                <i className="fas fa-check me-2"></i>
                                                Cerrar
                                            </button>
                                            <button
                                                className="btn btn-outline-warning flex-fill btn-action-min"
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
                                        <div className="alert alert-warning py-3 px-4 mb-0 flex-fill text-center" role="alert">
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
}

export default TicketRow;
