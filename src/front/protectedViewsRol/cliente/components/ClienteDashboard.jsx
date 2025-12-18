import React from 'react';

/**
 * ClienteDashboard - Vista de dashboard del cliente
 * Muestra métricas, estadísticas y tickets recientes
 */
function ClienteDashboard({ tickets, changeView }) {
    return (
        <>
            <h1 className="mb-4 fw-semibold">Dashboard</h1>

            {/* Tarjetas de métricas */}
            <div className="row g-4 mb-5">
                <div className="col-md-4">
                    <div className="card border-0 shadow-sm">
                        <div className="card-body text-center">
                            <div className="mb-3">
                                <i className="fas fa-ticket-alt fa-2x text-primary"></i>
                            </div>
                            <h3 className="mb-1">{tickets.length}</h3>
                            <p className="text-muted mb-0">Total Tickets</p>
                        </div>
                    </div>
                </div>

                <div className="col-md-4">
                    <div className="card border-0 shadow-sm">
                        <div className="card-body text-center">
                            <div className="mb-3">
                                <i className="fas fa-clock fa-2x text-warning"></i>
                            </div>
                            <h3 className="mb-1">
                                {tickets.filter(t => ['creado', 'en_espera', 'en_proceso'].includes(t.estado.toLowerCase())).length}
                            </h3>
                            <p className="text-muted mb-0">En Proceso</p>
                        </div>
                    </div>
                </div>

                <div className="col-md-4">
                    <div className="card border-0 shadow-sm">
                        <div className="card-body text-center">
                            <div className="mb-3">
                                <i className="fas fa-check-circle fa-2x text-success"></i>
                            </div>
                            <h3 className="mb-1">
                                {tickets.filter(t => ['solucionado', 'cerrado'].includes(t.estado.toLowerCase())).length}
                            </h3>
                            <p className="text-muted mb-0">Resueltos</p>
                        </div>
                    </div>
                </div>

            </div>

            {/* Estadísticas adicionales */}
            <div className="row g-4 mb-5">
                <div className="col-md-6">
                    <div className="card border-0 shadow-sm">
                        <div className="card-body">
                            <div className="d-flex align-items-center mb-3">
                                <div className="me-3">
                                    <i className="fas fa-chart-line fa-2x text-info"></i>
                                </div>
                                <div>
                                    <h6 className="mb-1">Tiempo Promedio</h6>
                                    <h4 className="mb-0 text-info">
                                        {tickets.filter(t => t.fecha_solucion).length > 0
                                            ? Math.round(tickets.filter(t => t.fecha_solucion).reduce((acc, t) => {
                                                const created = new Date(t.fecha_creacion);
                                                const solved = new Date(t.fecha_solucion);
                                                return acc + (solved - created) / (1000 * 60 * 60 * 24);
                                            }, 0) / tickets.filter(t => t.fecha_solucion).length)
                                            : 0
                                        } días
                                    </h4>
                                </div>
                            </div>
                            <p className="text-muted mb-0 small">Tiempo promedio de resolución</p>
                        </div>
                    </div>
                </div>
                <div className="col-md-6">
                    <div className="card border-0 shadow-sm">
                        <div className="card-body">
                            <div className="d-flex align-items-center mb-3">
                                <div className="me-3">
                                    <i className="fas fa-star fa-2x text-warning"></i>
                                </div>
                                <div>
                                    <h6 className="mb-1">Calificación</h6>
                                    <h4 className="mb-0 text-warning">
                                        {tickets.filter(t => t.calificacion).length > 0
                                            ? (tickets.filter(t => t.calificacion).reduce((acc, t) => acc + t.calificacion, 0) / tickets.filter(t => t.calificacion).length).toFixed(1)
                                            : '0.0'
                                        }/5
                                    </h4>
                                </div>
                            </div>
                            <p className="text-muted mb-0 small">Calificación promedio recibida</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Distribución por estado */}
            <div className="row g-4 mb-5">
                <div className="col-12">
                    <div className="card border-0 shadow-sm">
                        <div className="card-header bg-white border-0">
                            <h5 className="card-title mb-0">Distribución por Estado</h5>
                        </div>
                        <div className="card-body">
                            <div className="row g-3">
                                <div className="col-md-3">
                                    <div className="text-center p-3 border rounded">
                                        <div className="mb-2">
                                            <i className="fas fa-plus-circle fa-2x text-primary"></i>
                                        </div>
                                        <h4 className="text-primary mb-1">
                                            {tickets.filter(t => t.estado.toLowerCase() === 'creado').length}
                                        </h4>
                                        <p className="text-muted mb-0 small">Creados</p>
                                    </div>
                                </div>
                                <div className="col-md-3">
                                    <div className="text-center p-3 border rounded">
                                        <div className="mb-2">
                                            <i className="fas fa-pause-circle fa-2x text-warning"></i>
                                        </div>
                                        <h4 className="text-warning mb-1">
                                            {tickets.filter(t => t.estado.toLowerCase() === 'en_espera').length}
                                        </h4>
                                        <p className="text-muted mb-0 small">En Espera</p>
                                    </div>
                                </div>
                                <div className="col-md-3">
                                    <div className="text-center p-3 border rounded">
                                        <div className="mb-2">
                                            <i className="fas fa-cog fa-2x text-info"></i>
                                        </div>
                                        <h4 className="text-info mb-1">
                                            {tickets.filter(t => t.estado.toLowerCase() === 'en_proceso').length}
                                        </h4>
                                        <p className="text-muted mb-0 small">En Proceso</p>
                                    </div>
                                </div>
                                <div className="col-md-3">
                                    <div className="text-center p-3 border rounded">
                                        <div className="mb-2">
                                            <i className="fas fa-check-circle fa-2x text-success"></i>
                                        </div>
                                        <h4 className="text-success mb-1">
                                            {tickets.filter(t => ['solucionado', 'cerrado'].includes(t.estado.toLowerCase())).length}
                                        </h4>
                                        <p className="text-muted mb-0 small">Completados</p>
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
                    <div className="card border-0 shadow-sm">
                        <div className="card-header bg-white border-0">
                            <h5 className="card-title mb-0">Tickets Recientes</h5>
                        </div>
                        <div className="card-body">
                            {tickets.length > 0 ? (
                                <div className="table-responsive">
                                    <table className="table table-hover">
                                        <thead>
                                            <tr>
                                                <th className="text-center">ID</th>
                                                <th className="text-center">Título</th>
                                                <th className="text-center">Estado</th>
                                                <th className="text-center">Fecha y Hora</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {tickets.slice(0, 5).map((ticket) => (
                                                <tr key={ticket.id}>
                                                    <td className="text-center">
                                                        <span className="d-flex align-items-center justify-content-center gap-2">
                                                            <span
                                                                className="rounded-circle d-inline-block dot-ct-blue"
                                                            ></span>
                                                            <span className="fw-bold text-dark dark-theme:text-white">
                                                                #{ticket.id}
                                                            </span>
                                                        </span>
                                                    </td>
                                                    <td className="text-center">
                                                        <span className="d-flex align-items-center justify-content-center gap-2">
                                                            <span
                                                                className="rounded-circle d-inline-block dot-ct-purple"
                                                            ></span>
                                                            <span className="text-dark dark-theme:text-white">
                                                                {ticket.titulo}
                                                            </span>
                                                        </span>
                                                    </td>
                                                    <td className="text-center">
                                                        <span className="d-flex align-items-center justify-content-center gap-2">
                                                            <span
                                                                className={`rounded-circle d-inline-block ${ticket.estado && ticket.estado.toLowerCase() === 'solucionado' ? 'dot-estado-solucionado' :
                                                                    ticket.estado && ticket.estado.toLowerCase() === 'en_proceso' ? 'dot-estado-en-proceso' :
                                                                        'dot-ct-blue'
                                                                    }`}
                                                            ></span>
                                                            <span className="text-dark dark-theme:text-white">
                                                                {ticket.estado}
                                                            </span>
                                                        </span>
                                                    </td>
                                                    <td className="text-center">
                                                        <span className="d-flex align-items-center justify-content-center gap-2">
                                                            <span className="rounded-circle d-inline-block status-dot dot-ct-info"></span>
                                                            <span className="text-dark dark-theme:text-white">
                                                                {new Date(ticket.fecha_creacion).toLocaleDateString('es-ES', {
                                                                    year: 'numeric',
                                                                    month: 'short',
                                                                    day: 'numeric',
                                                                    hour: '2-digit',
                                                                    minute: '2-digit',
                                                                    hour12: true
                                                                })}
                                                            </span>
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="text-center py-4">
                                    <i className="fas fa-ticket-alt fa-3x text-muted mb-3"></i>
                                    <p className="text-muted">No tienes tickets aún</p>
                                    <button
                                        className="btn btn-primary"
                                        onClick={() => changeView('create')}
                                    >
                                        Crear mi primer ticket
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Botón Ver Todos los Tickets */}
            <div className="row g-4">
                <div className="col-12">
                    <div className="card border-0 shadow-sm bg-gradient-primary text-white">
                        <div className="card-body text-center py-5">
                            <div className="mb-4">
                                <i className="fas fa-ticket-alt fa-4x mb-3 opacity-75"></i>
                                <h3 className="mb-2">Gestiona Todos tus Tickets</h3>
                                <p className="mb-4 opacity-90">
                                    Accede a la vista completa de todos tus tickets con filtros avanzados y acciones detalladas
                                </p>
                            </div>
                            <button
                                className="btn btn-light btn-lg px-5 py-3 fw-bold shadow-sm btn-pill-hover"
                                onClick={() => changeView('tickets')}
                            >
                                <i className="fas fa-list me-2"></i>
                                Ver Todos los Tickets
                                <i className="fas fa-arrow-right ms-2"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

        </>
    );
}

export default ClienteDashboard;
