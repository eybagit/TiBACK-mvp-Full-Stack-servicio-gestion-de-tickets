/**
 * CalidadMetrics.jsx
 * Métricas principales del dashboard de calidad
 * Parte de la modularización de DashboardCalidad.jsx
 */

import React from 'react';

const MetricCard = ({ title, value, icon, color, subtitle }) => (
    <div className="col-xl-2 col-lg-3 col-md-6 mb-3">
        <div className="hyper-widget card border-0 shadow-sm h-100">
            <div className="card-body">
                <div className="text-center">
                    <h6 className="card-title text-muted mb-2">{title}</h6>
                    <div className="d-flex align-items-center justify-content-center mb-2">
                        <h3 className={`mb-0 text-${color} me-2`}>{value}</h3>
                        <div className={`bg-${color} bg-opacity-10 rounded-circle p-2`}>
                            <i className={`fas ${icon} text-${color}`}></i>
                        </div>
                    </div>
                    <small className="text-muted">{subtitle}</small>
                </div>
            </div>
        </div>
    </div>
);

const CalidadMetrics = ({ analistas, selectedAnalista, getMetrica, getMetricaPromedio }) => {
    const subtitulo = selectedAnalista ? 'Del analista' : 'Total del equipo';
    const subtituloPromedio = selectedAnalista ? 'Del analista' : 'Promedio del equipo';

    return (
        <div className="row mb-4 g-3">
            <MetricCard
                title="Tickets Asignados"
                value={getMetrica('ticketsAsignados')}
                icon="fa-ticket-alt"
                color="info"
                subtitle={subtitulo}
            />
            <MetricCard
                title="Tickets Solucionados"
                value={getMetrica('ticketsSolucionados')}
                icon="fa-tools"
                color="warning"
                subtitle={subtitulo}
            />
            <MetricCard
                title="Tickets Escalados"
                value={getMetrica('ticketsEscalados')}
                icon="fa-arrow-up"
                color="warning"
                subtitle={subtitulo}
            />
            <MetricCard
                title="Calificación Promedio"
                value={typeof getMetricaPromedio('calificacionPromedio') === 'number'
                    ? getMetricaPromedio('calificacionPromedio').toFixed(1)
                    : '0.0'}
                icon="fa-star"
                color="warning"
                subtitle={subtituloPromedio}
            />
            <MetricCard
                title="Eficiencia"
                value={`${typeof getMetricaPromedio('eficiencia') === 'number'
                    ? getMetricaPromedio('eficiencia').toFixed(1)
                    : '0.0'}%`}
                icon="fa-tachometer-alt"
                color="primary"
                subtitle={subtituloPromedio}
            />
        </div>
    );
};

export default CalidadMetrics;
