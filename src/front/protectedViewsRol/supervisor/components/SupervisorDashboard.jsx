import React from 'react';
import { TICKET_STATES } from '../../../constants/ticketEnums';
import { normalizeFromBackend } from '../../../utils/normalize';
import { getEstadoDotClass } from '../../../utils/cssHelpers';

/**
 * SupervisorDashboard - Vista de dashboard del supervisor
 * Muestra métricas, estadísticas y tickets recientes
 */
function SupervisorDashboard({
    stats,
    tickets,
    changeView,
    tieneSolicitudReapertura
}) {
    return (
        <>
            <h1 className="hyper-page-title">Dashboard Supervisor</h1>

            {/* Métricas principales */}
            <div className="row mb-4 g-3">
                <div className="col-xl-2 col-lg-3 col-md-6 mb-3">
                    <div className="hyper-widget card border-0 shadow-sm h-100">
                        <div className="card-body">
                            <div className="text-center">
                                <h6 className="card-title text-muted mb-2">Total Tickets</h6>
                                <div className="d-flex align-items-center justify-content-center mb-2">
                                    <h3 className="mb-0 text-primary me-2">{stats.total}</h3>
                                    <div className="bg-primary bg-opacity-10 rounded-circle p-2">
                                        <i className="fas fa-ticket-alt text-primary"></i>
                                    </div>
                                </div>
                                <small className="text-muted">Total del sistema</small>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="col-xl-2 col-lg-3 col-md-6 mb-3">
                    <div className="hyper-widget card border-0 shadow-sm h-100">
                        <div className="card-body">
                            <div className="text-center">
                                <h6 className="card-title text-muted mb-2">Tickets Activos</h6>
                                <div className="d-flex align-items-center justify-content-center mb-2">
                                    <h3 className="mb-0 text-warning me-2">{stats.activos}</h3>
                                    <div className="bg-warning bg-opacity-10 rounded-circle p-2">
                                        <i className="fas fa-clock text-warning"></i>
                                    </div>
                                </div>
                                <small className="text-muted">En proceso</small>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="col-xl-2 col-lg-3 col-md-6 mb-3">
                    <div className="hyper-widget card border-0 shadow-sm h-100">
                        <div className="card-body">
                            <div className="text-center">
                                <h6 className="card-title text-muted mb-2">Tickets Resueltos</h6>
                                <div className="d-flex align-items-center justify-content-center mb-2">
                                    <h3 className="mb-0 text-success me-2">{stats.resueltos}</h3>
                                    <div className="bg-success bg-opacity-10 rounded-circle p-2">
                                        <i className="fas fa-check-circle text-success"></i>
                                    </div>
                                </div>
                                <small className="text-muted">Completados</small>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="col-xl-2 col-lg-3 col-md-6 mb-3">
                    <div className="hyper-widget card border-0 shadow-sm h-100">
                        <div className="card-body">
                            <div className="text-center">
                                <h6 className="card-title text-muted mb-2">Tickets Escalados</h6>
                                <div className="d-flex align-items-center justify-content-center mb-2">
                                    <h3 className="mb-0 text-danger me-2">{stats.escalados}</h3>
                                    <div className="bg-danger bg-opacity-10 rounded-circle p-2">
                                        <i className="fas fa-exclamation-triangle text-danger"></i>
                                    </div>
                                </div>
                                <small className="text-muted">Requieren atención</small>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="col-xl-2 col-lg-3 col-md-6 mb-3">
                    <div className="hyper-widget card border-0 shadow-sm h-100">
                        <div className="card-body">
                            <div className="text-center">
                                <h6 className="card-title text-muted mb-2">Tickets Reabiertos</h6>
                                <div className="d-flex align-items-center justify-content-center mb-2">
                                    <h3 className="mb-0 text-info me-2">{tickets.filter(t => ['en_espera', 'reabierto'].includes(t.estado)).length}</h3>
                                    <div className="bg-info bg-opacity-10 rounded-circle p-2">
                                        <i className="fas fa-redo text-info"></i>
                                    </div>
                                </div>
                                <small className="text-muted">Reactivados</small>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="col-xl-2 col-lg-3 col-md-6 mb-3">
                    <div className="hyper-widget card border-0 shadow-sm h-100">
                        <div className="card-body">
                            <div className="text-center">
                                <h6 className="card-title text-muted mb-2">Satisfacción Cliente</h6>
                                <div className="d-flex align-items-center justify-content-center mb-2">
                                    <h3 className="mb-0 text-warning me-2">
                                        {tickets.filter(t => t.calificacion).length > 0
                                            ? (tickets.filter(t => t.calificacion).reduce((sum, t) => sum + t.calificacion, 0) / tickets.filter(t => t.calificacion).length).toFixed(1)
                                            : '0.0'
                                        }
                                    </h3>
                                    <div className="bg-warning bg-opacity-10 rounded-circle p-2">
                                        <i className="fas fa-star text-warning"></i>
                                    </div>
                                </div>
                                <small className="text-muted">Promedio general</small>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Widgets del dashboard */}
            {/* Tickets recientes */}
            <div className="row g-4">
                <div className="col-12">
                    <div className="card border-0 shadow-sm">
                        <div className="card-header bg-white border-0 d-flex justify-content-between align-items-center">
                            <h5 className="card-title mb-0">Tickets Recientes</h5>
                            <button
                                className="btn btn-sidebar-primary btn-sm"
                                onClick={() => changeView('tickets')}
                            >
                                <i className="fas fa-list me-1"></i>
                                Ver Todos los Tickets
                            </button>
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
                                                                className={`rounded - circle d - inline - block ${getEstadoDotClass(ticket.estado)}
                                                                    }`}
                                                            ></span>
                                                            <span className="text-dark dark-theme:text-white">
                                                                {ticket.estado}
                                                            </span>
                                                        </span>
                                                        {tieneSolicitudReapertura(ticket) && (
                                                            <div className="mt-1">
                                                                <small className="badge bg-warning text-dark">
                                                                    <i className="fas fa-exclamation-triangle me-1"></i>
                                                                    Solicitud de reapertura
                                                                </small>
                                                            </div>
                                                        )}
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
                                    <p className="text-muted">No hay tickets disponibles</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

export default SupervisorDashboard;
