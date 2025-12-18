import React from 'react';

/**
 * ClienteChat - Vista de chat con analistas
 * Muestra tabla de tickets con opciones de chat
 */
function ClienteChat({
    tickets,
    changeView,
    setSelectedTicketId,
    tieneAnalistaAsignado,
    getAnalistaAsignado,
    getFechaAsignacion,
    getEstadoColor,
    getPrioridadColor,
    setSelectedTicketImages,
    setSelectedImageIndex,
    solicitudesReapertura,
    cerrarTicket,
    solicitarReapertura,
    navigate
}) {
    return (
        <>
            <h1 className="hyper-page-title">Chat con Analistas</h1>

            <div className="hyper-widget">
                <div className="hyper-widget-header">
                    <h3 className="hyper-widget-title">Conversaciones Activas</h3>
                </div>
                <div className="hyper-widget-body">
                    <div className="table-responsive">
                        <table className="table table-hover">
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Título</th>
                                    <th>Imágenes</th>
                                    <th>Estado</th>
                                    <th>Prioridad</th>
                                    <th>Asignado a</th>
                                    <th>Fecha Creación</th>
                                    <th>Calificación</th>
                                    <th>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {tickets.map((ticket) => (
                                    <tr key={ticket.id}>
                                        <td>
                                            <div className="d-flex align-items-center">
                                                <span className="me-2">#{ticket.id}</span>
                                                {ticket.url_imagen ? (
                                                    <img
                                                        src={ticket.url_imagen}
                                                        alt="Imagen del ticket"
                                                        className="img-thumbnail"
                                                        style={{ width: '30px', height: '30px', objectFit: 'cover' }}
                                                    />
                                                ) : (
                                                    <span className="text-muted">
                                                        <i className="fas fa-image" style={{ fontSize: '12px' }}></i>
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td>
                                            <div>
                                                <strong>{ticket.titulo}</strong>
                                                <br />
                                                <small className="text-muted">
                                                    {ticket.descripcion.length > 50
                                                        ? `${ticket.descripcion.substring(0, 50)}...`
                                                        : ticket.descripcion
                                                    }
                                                </small>
                                            </div>
                                        </td>
                                        {/* Miniaturas de imágenes */}
                                        <td>
                                            {ticket.img_urls && ticket.img_urls.length > 0 ? (
                                                <div className="d-flex flex-wrap gap-1">
                                                    {ticket.img_urls.slice(0, 3).map((url, idx) => (
                                                        <img
                                                            key={idx}
                                                            src={url}
                                                            alt={`ticket-${ticket.id}-img-${idx}`}
                                                            className="img-thumbnail"
                                                            style={{ width: '50px', height: '50px', objectFit: 'cover', cursor: 'pointer' }}
                                                            onClick={() => { setSelectedTicketImages(ticket.img_urls); setSelectedImageIndex(idx); }}
                                                        />
                                                    ))}
                                                    {ticket.img_urls.length > 3 && <span className="badge bg-secondary">+{ticket.img_urls.length - 3}</span>}
                                                </div>
                                            ) : <span className="text-muted">Sin imágenes</span>}
                                        </td>
                                        <td>
                                            <div className="d-flex align-items-center gap-2">
                                                <span className={getEstadoColor(ticket.estado)}>
                                                    {ticket.estado}
                                                </span>
                                                {tieneAnalistaAsignado(ticket) && (
                                                    <span
                                                        className="badge bg-success"
                                                        title={`Asignado a ${getAnalistaAsignado(ticket)}`}
                                                    >
                                                        <i className="fas fa-user-tie me-1"></i>
                                                        Analista
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td>
                                            <span className={getPrioridadColor(ticket.prioridad)}>
                                                {ticket.prioridad}
                                            </span>
                                        </td>
                                        <td>
                                            {tieneAnalistaAsignado(ticket) ? (
                                                <div className="d-flex align-items-center gap-2">
                                                    <span className="badge bg-success">
                                                        <i className="fas fa-user-tie me-1"></i>
                                                        {getAnalistaAsignado(ticket)}
                                                    </span>
                                                    <small className="text-muted">
                                                        {getFechaAsignacion(ticket)}
                                                    </small>
                                                </div>
                                            ) : (
                                                <span className="text-muted">
                                                    <i className="fas fa-clock me-1"></i>
                                                    Sin asignar
                                                </span>
                                            )}
                                        </td>
                                        <td>
                                            {new Date(ticket.fecha_creacion).toLocaleDateString()}
                                        </td>
                                        <td>
                                            <div className="d-flex align-items-center">
                                                {ticket.calificacion ? (
                                                    [...Array(5)].map((_, i) => (
                                                        <i
                                                            key={i}
                                                            className={`fas fa-star ${i < ticket.calificacion ? 'text-warning' : 'text-muted'}`}
                                                        ></i>
                                                    ))
                                                ) : (
                                                    <span className="text-muted">Sin calificar</span>
                                                )}
                                                <button
                                                    className="btn btn-info btn-sm ms-2"
                                                    onClick={() => window.location.href = `/cliente/ver-ticket/${ticket.id}`}
                                                >
                                                    <i className="fas fa-eye"></i> Ver
                                                </button>
                                            </div>
                                        </td>
                                        <td>
                                            <div className="btn-group" role="group">
                                                {ticket.estado && ticket.estado.toLowerCase() === 'solucionado' && !solicitudesReapertura.has(ticket.id) && (
                                                    <>
                                                        <button
                                                            className="btn btn-success btn-sm"
                                                            onClick={() => cerrarTicket(ticket.id)}
                                                            title="Cerrar ticket y calificar"
                                                        >
                                                            <i className="fas fa-check"></i> Cerrar
                                                        </button>
                                                        <button
                                                            className="btn btn-info btn-sm"
                                                            onClick={() => solicitarReapertura(ticket.id)}
                                                            title="Solicitar reapertura al supervisor"
                                                        >
                                                            <i className="fas fa-redo"></i> Reabrir
                                                        </button>
                                                    </>
                                                )}
                                                {ticket.estado && ticket.estado.toLowerCase() === 'solucionado' && solicitudesReapertura.has(ticket.id) && (
                                                    <div className="alert alert-warning py-2 px-3 mb-0" role="alert">
                                                        <i className="fas fa-clock me-1"></i>
                                                        <strong>Solicitud enviada</strong>
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </>
    );
}

export default ClienteChat;
