import React, { useMemo } from 'react';

/**
 * TicketRow - Componente ultra dinámico para fila de ticket del analista
 * Reacciona automáticamente a cambios de estado via WebSocket
 */
function TicketRow({
    ticket,
    isExpanded,
    tieneSolicitudReapertura,
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
    // ====== LÓGICA DINÁMICA REACTIVA A WEBSOCKET ======

    /**
     * Determinar acciones disponibles basadas en el estado del ticket
     * Esto se recalcula automáticamente cuando el ticket cambia vía WebSocket
     */
    const actions = useMemo(() => {
        const estado = ticket.estado?.toLowerCase();

        return {
            // Puede iniciar trabajo si está en espera
            canStart: estado === 'en_espera' || estado === 'asignado',

            // Puede marcar como resuelto si está en proceso
            canResolve: estado === 'en_proceso',

            // Puede escalar en cualquier momento (excepto si ya está escalado)
            canEscalate: estado !== 'escalado' && estado !== 'solucionado' && estado !== 'cerrado',

            // Mostrar indicador de solicitud de reapertura
            hasReopenRequest: tieneSolicitudReapertura
        };
    }, [ticket.estado, tieneSolicitudReapertura]);

    return (
        <React.Fragment>
            <tr
                data-ticket-id={ticket.id}
                className={actions.hasReopenRequest ? 'table-warning' : ''}
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
                            <div className="fw-semibold mb-1 text-dark">{ticket.titulo}</div>
                            <small className="text-muted">
                                {ticket.descripcion?.length > 50
                                    ? `${ticket.descripcion.substring(0, 50)}...`
                                    : ticket.descripcion
                                }
                            </small>
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
                        <span className="text-dark">{ticket.estado}</span>
                    </span>
                    {actions.hasReopenRequest && (
                        <div className="mt-1">
                            <small className="badge bg-warning text-dark">
                                <i className="fas fa-clock me-1"></i>
                                Solicitud enviada
                            </small>
                        </div>
                    )}
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
                        <span className="text-dark">{ticket.prioridad || 'Normal'}</span>
                    </span>
                </td>

                {/* Cliente */}
                <td className="text-center px-3">
                    <span className="d-flex align-items-center justify-content-center gap-2">
                        <span className="status-dot bg-info"></span>
                        <span className="text-dark">{ticket.cliente?.nombre || 'Sin cliente'}</span>
                    </span>
                </td>

                {/* Fecha */}
                <td className="text-center px-3">
                    <span className="d-flex align-items-center justify-content-center gap-2">
                        <span className="status-dot bg-info"></span>
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

                {/* Acciones */}
                <td className="text-center px-4">
                    <div className="d-flex flex-column gap-2">
                        {/* Fila 1: Ver, Comentarios, Chats, IA */}
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

            {/* Fila expandida - BOTONES DINÁMICOS */}
            {isExpanded && (
                <tr className={actions.hasReopenRequest ? 'table-warning' : ''}>
                    <td colSpan="8" className="px-0 py-0">
                        <div className={`w-100 border-top ${actions.hasReopenRequest ? 'bg-warning bg-opacity-25' : 'bg-light'}`}>
                            <div className="px-4 py-3">
                                <div className="d-flex gap-2 flex-wrap justify-content-center">
                                    {/* Acciones estáticas */}
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
                                        Chat Cliente
                                    </button>
                                    <button
                                        className="btn btn-sidebar-warning flex-fill btn-action-min"
                                        title="Chat con supervisor"
                                        onClick={() => openSupervisorChat(ticket.id)}
                                    >
                                        <i className="fas fa-user-tie me-2"></i>
                                        Chat Supervisor
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

                                    {/* ====== BOTONES DINÁMICOS REACTIVOS A WEBSOCKET ====== */}

                                    {/* Mostrar alerta si tiene solicitud de reapertura */}
                                    {actions.hasReopenRequest ? (
                                        <div className="alert alert-warning py-2 mb-0 flex-fill text-center" role="alert">
                                            <i className="fas fa-clock me-2"></i>
                                            <strong>Solicitud de reapertura pendiente</strong>
                                            <p className="mb-0 mt-1 small">Esperando resolución del supervisor</p>
                                        </div>
                                    ) : (
                                        <>
                                            {/* INICIAR - Solo si está en espera */}
                                            {actions.canStart && (
                                                <button
                                                    className="btn btn-success flex-fill btn-action-min"
                                                    onClick={() => iniciarTrabajo(ticket.id)}
                                                    title="Iniciar trabajo en este ticket"
                                                >
                                                    <i className="fas fa-play me-2"></i>
                                                    Iniciar Trabajo
                                                </button>
                                            )}

                                            {/* RESOLVER - Solo si está en proceso */}
                                            {actions.canResolve && (
                                                <button
                                                    className="btn btn-outline-success flex-fill btn-action-min"
                                                    onClick={() => marcarComoResuelto(ticket.id)}
                                                    title="Marcar ticket como resuelto"
                                                >
                                                    <i className="fas fa-check me-2"></i>
                                                    Marcar Resuelto
                                                </button>
                                            )}

                                            {/* ESCALAR - Disponible en la mayoría de estados */}
                                            {actions.canEscalate && (
                                                <button
                                                    className="btn btn-outline-warning flex-fill btn-action-min"
                                                    onClick={() => escalarTicket(ticket.id)}
                                                    title="Escalar al supervisor"
                                                >
                                                    <i className="fas fa-arrow-up me-2"></i>
                                                    Escalar a Supervisor
                                                </button>
                                            )}
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
}

export default TicketRow;
