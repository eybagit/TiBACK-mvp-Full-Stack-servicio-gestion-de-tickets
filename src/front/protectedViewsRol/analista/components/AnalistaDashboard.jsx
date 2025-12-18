import React from 'react';

/**
 * AnalistaDashboard - Componente de presentación para el dashboard del analista
 * Incluye: métricas, distribución por prioridad, tickets recientes
 */
function AnalistaDashboard({ tickets, setActiveView }) {
    return (
        <>
            <h1 className="hyper-page-title">Dashboard Analista</h1>

            {/* Métricas principales */}
            <div className="row mb-4 g-3">
                <div className="col-xl-3 col-lg-4 col-md-6 mb-3">
                    <div className="hyper-widget card border-0 shadow-sm h-100">
                        <div className="card-body">
                            <div className="text-center">
                                <h6 className="card-title text-muted mb-2">Total Tickets</h6>
                                <div className="d-flex align-items-center justify-content-center mb-2">
                                    <h3 className="mb-0 text-primary me-2">{tickets.length}</h3>
                                    <div className="bg-primary bg-opacity-10 rounded-circle p-2">
                                        <i className="fas fa-ticket-alt text-primary"></i>
                                    </div>
                                </div>
                                <small className="text-muted">Asignados a mí</small>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="col-xl-3 col-lg-4 col-md-6 mb-3">
                    <div className="hyper-widget card border-0 shadow-sm h-100">
                        <div className="card-body">
                            <div className="text-center">
                                <h6 className="card-title text-muted mb-2">En Espera</h6>
                                <div className="d-flex align-items-center justify-content-center mb-2">
                                    <h3 className="mb-0 text-warning me-2">
                                        {tickets.filter(t => t.estado.toLowerCase() === 'en_espera').length}
                                    </h3>
                                    <div className="bg-warning bg-opacity-10 rounded-circle p-2">
                                        <i className="fas fa-clock text-warning"></i>
                                    </div>
                                </div>
                                <small className="text-muted">Pendientes de iniciar</small>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="col-xl-3 col-lg-4 col-md-6 mb-3">
                    <div className="hyper-widget card border-0 shadow-sm h-100">
                        <div className="card-body">
                            <div className="text-center">
                                <h6 className="card-title text-muted mb-2">En Proceso</h6>
                                <div className="d-flex align-items-center justify-content-center mb-2">
                                    <h3 className="mb-0 text-info me-2">
                                        {tickets.filter(t => t.estado.toLowerCase() === 'en_proceso').length}
                                    </h3>
                                    <div className="bg-info bg-opacity-10 rounded-circle p-2">
                                        <i className="fas fa-cog text-info"></i>
                                    </div>
                                </div>
                                <small className="text-muted">Trabajando actualmente</small>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="col-xl-3 col-lg-4 col-md-6 mb-3">
                    <div className="hyper-widget card border-0 shadow-sm h-100">
                        <div className="card-body">
                            <div className="text-center">
                                <h6 className="card-title text-muted mb-2">Resueltos</h6>
                                <div className="d-flex align-items-center justify-content-center mb-2">
                                    <h3 className="mb-0 text-success me-2">
                                        {tickets.filter(t => ['solucionado', 'cerrado'].includes(t.estado.toLowerCase())).length}
                                    </h3>
                                    <div className="bg-success bg-opacity-10 rounded-circle p-2">
                                        <i className="fas fa-check-circle text-success"></i>
                                    </div>
                                </div>
                                <small className="text-muted">Completados</small>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Estadísticas por prioridad */}
            <div className="row mb-4 g-3">
                <div className="col-12">
                    <div className="hyper-widget card border-0 shadow-sm">
                        <div className="hyper-widget-header">
                            <h3 className="hyper-widget-title">Distribución por Prioridad</h3>
                        </div>
                        <div className="hyper-widget-body">
                            <div className="row g-3">
                                <div className="col-md-4">
                                    <div className="text-center p-3 border rounded">
                                        <div className="mb-2">
                                            <i className="fas fa-exclamation-triangle fa-2x text-danger"></i>
                                        </div>
                                        <h4 className="text-danger mb-1">
                                            {tickets.filter(t => t.prioridad === 'alta').length}
                                        </h4>
                                        <p className="text-muted mb-0 small">Alta Prioridad</p>
                                    </div>
                                </div>
                                <div className="col-md-4">
                                    <div className="text-center p-3 border rounded">
                                        <div className="mb-2">
                                            <i className="fas fa-exclamation-circle fa-2x text-warning"></i>
                                        </div>
                                        <h4 className="text-warning mb-1">
                                            {tickets.filter(t => t.prioridad === 'media').length}
                                        </h4>
                                        <p className="text-muted mb-0 small">Media Prioridad</p>
                                    </div>
                                </div>
                                <div className="col-md-4">
                                    <div className="text-center p-3 border rounded">
                                        <div className="mb-2">
                                            <i className="fas fa-info-circle fa-2x text-info"></i>
                                        </div>
                                        <h4 className="text-info mb-1">
                                            {tickets.filter(t => t.prioridad === 'baja' || !t.prioridad).length}
                                        </h4>
                                        <p className="text-muted mb-0 small">Baja Prioridad</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tickets recientes */}
            <div className="row g-4">
                <div className="col-12">
                    <div className="hyper-widget card border-0 shadow-sm">
                        <div className="hyper-widget-header">
                            <h3 className="hyper-widget-title">Tickets Recientes</h3>
                        </div>
                        <div className="hyper-widget-body">
                            {tickets.length === 0 ? (
                                <div className="text-center py-4">
                                    <i className="fas fa-ticket-alt fa-3x text-muted mb-3"></i>
                                    <p className="text-muted">No tienes tickets asignados</p>
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
                                                <th>Cliente</th>
                                                <th>Fecha</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {tickets.slice(0, 5).map((ticket) => (
                                                <tr key={ticket.id}>
                                                    <td>
                                                        <span className="badge bg-secondary">#{ticket.id}</span>
                                                    </td>
                                                    <td>
                                                        <div className="fw-semibold">{ticket.titulo}</div>
                                                        <small className="text-muted">
                                                            {ticket.descripcion.length > 50
                                                                ? `${ticket.descripcion.substring(0, 50)}...`
                                                                : ticket.descripcion
                                                            }
                                                        </small>
                                                    </td>
                                                    <td>
                                                        <span className={`badge ${ticket.estado.toLowerCase() === 'solucionado' ? 'bg-success' :
                                                            ticket.estado.toLowerCase() === 'en_proceso' ? 'bg-info' :
                                                                ticket.estado.toLowerCase() === 'en_espera' ? 'bg-warning' :
                                                                    'bg-secondary'
                                                            }`}>
                                                            {ticket.estado}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        <span className={`badge ${ticket.prioridad === 'alta' ? 'bg-danger' :
                                                            ticket.prioridad === 'media' ? 'bg-warning' :
                                                                'bg-info'
                                                            }`}>
                                                            {ticket.prioridad || 'Normal'}
                                                        </span>
                                                    </td>
                                                    <td>{ticket.cliente?.nombre || 'Sin cliente'}</td>
                                                    <td>
                                                        <small>
                                                            {new Date(ticket.fecha_creacion).toLocaleDateString('es-ES', {
                                                                year: 'numeric',
                                                                month: 'short',
                                                                day: 'numeric'
                                                            })}
                                                        </small>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Sección de acción profesional */}
            <div className="row g-4 mt-4">
                <div className="col-12">
                    <div className="hyper-widget card border-0 shadow-sm card-gradient-purple">
                        <div className="card-body text-center text-white py-5">
                            <div className="mb-4">
                                <i className="fas fa-ticket-alt fa-4x mb-3 opacity-75"></i>
                                <h3 className="mb-3 fw-bold">Gestiona todos tus tickets</h3>
                                <p className="mb-4 fs-5 opacity-75">
                                    Accede a la vista completa de tickets para gestionar, resolver y escalar tus tareas asignadas
                                </p>
                            </div>
                            <button
                                className="btn btn-light btn-lg px-5 py-3 fw-semibold btn-pill-hover"
                                onClick={() => setActiveView('tickets')}
                            >
                                <i className="fas fa-arrow-right me-2"></i>
                                Ir a Todos los Tickets
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

export default AnalistaDashboard;
