/**
 * CalidadTop3.jsx
 * Top 3 analistas y distribución del equipo
 * Parte de la modularización de DashboardCalidad.jsx
 */

import React from 'react';

const CalidadTop3 = ({ analistas }) => {
    const top3 = [...analistas]
        .sort((a, b) => b.metricas.eficiencia - a.metricas.eficiencia)
        .slice(0, 3);

    return (
        <div className="row mb-4 g-3">
            {/* Top 3 Analistas */}
            <div className="col-xl-7 col-lg-6">
                <div className="hyper-widget card border-0 shadow-sm">
                    <div className="card-header bg-white border-0">
                        <h5 className="mb-0">
                            <i className="fas fa-trophy me-2"></i>
                            Top 3 Analistas
                        </h5>
                    </div>
                    <div className="card-body">
                        {top3.map((analista, index) => (
                            <div key={analista.id} className="d-flex justify-content-between align-items-center mb-3 p-3 bg-light rounded">
                                <div className="d-flex align-items-center">
                                    <span className={`badge bg-${index === 0 ? 'warning' : index === 1 ? 'secondary' : 'info'} me-3`}>
                                        #{index + 1}
                                    </span>
                                    <div>
                                        <h6 className="mb-0">{analista.nombre} {analista.apellido}</h6>
                                        <small className="text-muted">{analista.email}</small>
                                    </div>
                                </div>
                                <div className="text-end">
                                    <span className="badge bg-success fs-6">{analista.metricas.eficiencia.toFixed(1)}%</span>
                                    <br />
                                    <small className="text-muted">{analista.metricas.ticketsEscalados} escalados</small>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Distribución del Equipo */}
            <div className="col-xl-5 col-lg-6">
                <div className="hyper-widget card border-0 shadow-sm">
                    <div className="card-header bg-white border-0">
                        <h5 className="mb-0">
                            <i className="fas fa-chart-pie me-2"></i>
                            Distribución del Equipo
                        </h5>
                    </div>
                    <div className="card-body">
                        <div className="row text-center g-3">
                            <div className="col-4">
                                <div className="border-end pe-3">
                                    <h4 className="text-primary">
                                        {analistas.reduce((sum, a) => sum + a.metricas.ticketsAsignados, 0)}
                                    </h4>
                                    <small className="text-muted">Asignados</small>
                                </div>
                            </div>
                            <div className="col-4">
                                <div className="border-end pe-3">
                                    <h4 className="text-success">
                                        {analistas.reduce((sum, a) => sum + a.metricas.ticketsSolucionados, 0)}
                                    </h4>
                                    <small className="text-muted">Solucionados</small>
                                </div>
                            </div>
                            <div className="col-4">
                                <h4 className="text-warning">
                                    {analistas.reduce((sum, a) => sum + a.metricas.ticketsEscalados, 0)}
                                </h4>
                                <small className="text-muted">Escalados</small>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CalidadTop3;
