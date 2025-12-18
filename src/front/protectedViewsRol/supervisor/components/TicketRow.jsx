import React from 'react';
import { Link } from 'react-router-dom';

/**
 * TicketRow - Fila individual de ticket en la tabla activa
 * Extraído de SupervisorTicketsList para modularización
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
    analistasCombinados,
    setActiveView,
    changeView,
    cerrarTicket,
    reabrirTicket,
    generarRecomendacion
}) {
    const isExpanded = expandedTickets.has(ticket.id);
    const actions = getAvailableActions ? getAvailableActions(ticket) : {};

    // Indicadores de estado
    const indicadores = [];
    if (tieneSolicitudReapertura && tieneSolicitudReapertura(ticket)) {
        indicadores.push({ icon: 'fa-inbox', color: 'warning', title: 'Solicitud de reapertura' });
    }
    if (fueEscaladoPorAnalista && fueEscaladoPorAnalista(ticket)) {
        indicadores.push({ icon: 'fa-arrow-up', color: 'info', title: 'Escalado por analista' });
    }
    if (ticketsConRecomendaciones && ticketsConRecomendaciones.has(ticket.id)) {
        indicadores.push({ icon: 'fa-lightbulb', color: 'success', title: 'Tiene recomendaciones IA' });
    }

    return (
        <React.Fragment>
            <tr
                className={`cursor-pointer ${getSemaforoColor ? getSemaforoColor(ticket, []) : ''}`}
            >
                <td onClick={() => toggleTicketExpansion(ticket.id)}>
                    <div className="d-flex align-items-center gap-2">
                        <i className={`fas ${isExpanded ? 'fa-chevron-down' : 'fa-chevron-right'} text-muted`}></i>
                        <strong>#{ticket.id}</strong>
                        {indicadores.map((ind, idx) => (
                            <span key={idx} className={`badge bg-${ind.color}`} title={ind.title}>
                                <i className={`fas ${ind.icon}`}></i>
                            </span>
                        ))}
                    </div>
                </td>
                <td onClick={() => toggleTicketExpansion(ticket.id)}>
                    <div>
                        <strong>{ticket.titulo}</strong>
                        <br />
                        <small className="text-muted">{ticket.descripcion?.substring(0, 50)}...</small>
                    </div>
                </td>
                <td>
                    <span className={`badge bg-${ticket.estado === 'activo' ? 'warning' :
                        ticket.estado === 'en_progreso' ? 'info' :
                            ticket.estado === 'resuelto' ? 'success' :
                                ticket.estado === 'escalado' ? 'danger' :
                                    ticket.estado === 'solucionado' ? 'success' :
                                        ticket.estado === 'solicitud_reapertura' ? 'warning' :
                                            ticket.estado === 'reabierto' ? 'info' :
                                                'secondary'
                        }`}>
                        {ticket.estado}
                    </span>
                </td>
                <td>
                    <span className={`badge bg-${ticket.prioridad === 'baja' ? 'success' :
                        ticket.prioridad === 'media' ? 'warning' :
                            ticket.prioridad === 'alta' ? 'danger' :
                                ticket.prioridad === 'critica' ? 'dark' : 'secondary'
                        }`}>
                        {ticket.prioridad}
                    </span>
                </td>
                <td>
                    {ticket.asignacion_actual?.analista ? (
                        <span className="badge bg-info">
                            {ticket.asignacion_actual.analista.nombre}
                        </span>
                    ) : (
                        <span className="badge bg-secondary">Sin asignar</span>
                    )}
                </td>
                <td>
                    <div className="btn-group" role="group">
                        <button
                            className="btn btn-sm btn-outline-primary"
                            onClick={() => setActiveView(`ticket-${ticket.id}`)}
                            title="Ver detalle"
                        >
                            <i className="fas fa-eye"></i>
                        </button>
                        <Link
                            to={`/ticket/${ticket.id}/comentarios`}
                            className="btn btn-sm btn-outline-secondary"
                            title="Comentarios"
                        >
                            <i className="fas fa-comments"></i>
                        </Link>
                    </div>
                </td>
            </tr>

            {/* Fila expandible */}
            {isExpanded && (
                <tr className="bg-light">
                    <td colSpan="6">
                        <div className="p-3">
                            <div className="row">
                                <div className="col-md-8">
                                    <h6>Descripción completa</h6>
                                    <p className="mb-2">{ticket.descripcion}</p>
                                    <small className="text-muted">
                                        Creado: {new Date(ticket.fecha_creacion).toLocaleString()}
                                    </small>
                                </div>
                                <div className="col-md-4">
                                    <h6>Acciones</h6>
                                    <div className="d-flex flex-wrap gap-2">
                                        {/* Asignar/Reasignar */}
                                        {actions.canAssign && (
                                            <div className="dropdown">
                                                <button
                                                    className="btn btn-sm btn-outline-primary dropdown-toggle"
                                                    type="button"
                                                    data-bs-toggle="dropdown"
                                                >
                                                    <i className="fas fa-user-plus me-1"></i>
                                                    {ticket.asignacion_actual?.analista ? 'Reasignar' : 'Asignar'}
                                                </button>
                                                <ul className="dropdown-menu">
                                                    {analistasCombinados && analistasCombinados.map((analista) => (
                                                        <li key={analista.id}>
                                                            <button
                                                                className="dropdown-item"
                                                                onClick={() => asignarTicket(ticket.id, analista.id)}
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
                                                className="btn btn-sm btn-outline-danger"
                                                onClick={() => cerrarTicket(ticket.id)}
                                            >
                                                <i className="fas fa-times me-1"></i>Cerrar
                                            </button>
                                        )}

                                        {/* Reabrir */}
                                        {actions.showReopenButton && (
                                            <button
                                                className="btn btn-sm btn-outline-success"
                                                onClick={() => reabrirTicket(ticket.id)}
                                            >
                                                <i className="fas fa-redo me-1"></i>Reabrir
                                            </button>
                                        )}

                                        {/* Recomendación IA */}
                                        {generarRecomendacion && (
                                            <button
                                                className="btn btn-sm btn-outline-info"
                                                onClick={() => generarRecomendacion(ticket)}
                                            >
                                                <i className="fas fa-robot me-1"></i>IA
                                            </button>
                                        )}
                                    </div>
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
