/**
 * CalidadAnalistaDetail.jsx
 * Detalles del analista seleccionado
 * Parte de la modularización de DashboardCalidad.jsx
 */

import React from 'react';

const MetricBox = ({ value, label, color }) => (
    <div className="col-xl-2 col-lg-3 col-md-6 mb-3">
        <div className="text-center p-3 bg-light rounded">
            <div className={`fw-bold text-${color} fs-4`}>{value}</div>
            <div className="text-muted">{label}</div>
        </div>
    </div>
);

const CalidadAnalistaDetail = ({ analistas, selectedAnalista }) => {
    const analista = analistas.find(a => a.id === selectedAnalista);

    if (!analista) return null;

    return (
        <div className="row mb-4 g-3">
            <div className="col-12">
                <div className="hyper-widget card border-0 shadow-sm">
                    <div className="card-header bg-white border-0">
                        <h5 className="mb-0">
                            <i className="fas fa-user-tie me-2"></i>
                            Detalles del Analista
                        </h5>
                    </div>
                    <div className="card-body">
                        <div className="row g-3">
                            <MetricBox
                                value={analista.metricas.ticketsAsignados}
                                label="Tickets Asignados"
                                color="primary"
                            />
                            <MetricBox
                                value={analista.metricas.ticketsSolucionados}
                                label="Tickets Solucionados"
                                color="warning"
                            />
                            <MetricBox
                                value={analista.metricas.ticketsEscalados}
                                label="Tickets Escalados"
                                color="warning"
                            />
                            <MetricBox
                                value={analista.metricas.ticketsReabiertos}
                                label="Tickets Reabiertos"
                                color="danger"
                            />
                            <MetricBox
                                value={analista.metricas.calificacionPromedio}
                                label="Calificación Promedio"
                                color="info"
                            />
                            <MetricBox
                                value={`${analista.metricas.eficiencia}%`}
                                label="Eficiencia"
                                color="primary"
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CalidadAnalistaDetail;
