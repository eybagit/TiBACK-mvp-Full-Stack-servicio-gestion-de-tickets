import React from 'react';
import { Link } from 'react-router-dom';

/**
 * ClosedTicketsTable - Tabla de tickets cerrados
 * Extraído de SupervisorTicketsList para modularización
 */
function ClosedTicketsTable({
    showCerrados,
    setShowCerrados,
    ticketsCerradosCombinados,
    loadingCerrados,
    cargarTicketsCerrados,
    getEstadoColor,
    getPrioridadColor,
    setActiveView
}) {
    return (
        <div className="hyper-widget card border-0 shadow-sm mt-4">
            <div className="card-header bg-white border-0 d-flex justify-content-between align-items-center">
                <div className="d-flex align-items-center">
                    <h5 className="mb-0 me-2">Tickets Cerrados</h5>
                    {loadingCerrados && (
                        <div className="spinner-border spinner-border-sm text-primary" role="status">
                            <span className="visually-hidden">Actualizando...</span>
                        </div>
                    )}
                </div>
                <button
                    className="btn btn-outline-secondary btn-sm"
                    onClick={() => {
                        const newShowCerrados = !showCerrados;
                        setShowCerrados(newShowCerrados);
                        if (newShowCerrados) {
                            cargarTicketsCerrados();
                        }
                    }}
                    title={showCerrados ? "Ocultar tickets cerrados" : "Mostrar tickets cerrados"}
                >
                    <i className={`fas ${showCerrados ? 'fa-eye-slash' : 'fa-eye'} me-1`}></i>
                    {showCerrados ? 'Ocultar' : 'Mostrar'}
                </button>
            </div>

            {showCerrados && (
                <div className="card-body p-0">
                    {ticketsCerradosCombinados.length === 0 ? (
                        <div className="text-center py-4">
                            <i className="fas fa-check-circle fa-2x text-muted mb-2"></i>
                            <p className="text-muted mb-0">No hay tickets cerrados</p>
                        </div>
                    ) : (
                        <div className="table-responsive">
                            <table className="table table-hover mb-0">
                                <thead className="table-light">
                                    <tr>
                                        <th>ID</th>
                                        <th>Título</th>
                                        <th>Estado</th>
                                        <th>Prioridad</th>
                                        <th>Fecha Cierre</th>
                                        <th>Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {Array.isArray(ticketsCerradosCombinados) && ticketsCerradosCombinados.map((ticket) => (
                                        <tr key={ticket.id}>
                                            <td>#{ticket.id}</td>
                                            <td>
                                                <div>
                                                    <strong>{ticket.titulo}</strong>
                                                    <br />
                                                    <small className="text-muted">
                                                        {ticket.descripcion?.substring(0, 50)}...
                                                    </small>
                                                </div>
                                            </td>
                                            <td>
                                                <span className={getEstadoColor ? getEstadoColor(ticket.estado) : 'badge bg-secondary'}>
                                                    {ticket.estado}
                                                </span>
                                            </td>
                                            <td>
                                                <span className={getPrioridadColor ? getPrioridadColor(ticket.prioridad) : 'badge bg-secondary'}>
                                                    {ticket.prioridad}
                                                </span>
                                            </td>
                                            <td>
                                                {ticket.fecha_cierre
                                                    ? new Date(ticket.fecha_cierre).toLocaleDateString()
                                                    : '-'
                                                }
                                            </td>
                                            <td>
                                                <button
                                                    className="btn btn-sm btn-outline-primary"
                                                    onClick={() => setActiveView(`ticket-${ticket.id}`)}
                                                    title="Ver detalle"
                                                >
                                                    <i className="fas fa-eye"></i>
                                                </button>
                                                <Link
                                                    to={`/ticket/${ticket.id}/comentarios`}
                                                    className="btn btn-sm btn-outline-secondary ms-1"
                                                    title="Comentarios"
                                                >
                                                    <i className="fas fa-comments"></i>
                                                </Link>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

export default ClosedTicketsTable;
