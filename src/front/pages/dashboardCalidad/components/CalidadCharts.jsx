/**
 * CalidadCharts.jsx
 * Gráficos y visualizaciones del dashboard de calidad
 * Parte de la modularización de DashboardCalidad.jsx
 */

import React from 'react';

// Gráfico de barras mensual
const MonthlyChart = () => {
    const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

    return (
        <div className="mt-4">
            <h6 className="text-muted mb-3">Tendencia Mensual</h6>
            <div className="d-flex align-items-end justify-content-between chart-container-md">
                {meses.map((mes) => {
                    const altura = Math.random() * 100 + 20;
                    return (
                        <div key={mes} className="d-flex flex-column align-items-center chart-bar-column">
                            <div
                                className="bg-primary rounded-top w-100"
                                style={{ height: `${altura}px`, minHeight: '20px' }}
                            ></div>
                            <div
                                className="bg-success rounded-bottom w-100"
                                style={{ height: `${altura * 0.6}px`, minHeight: '10px' }}
                            ></div>
                            <small className="text-muted mt-2">{mes}</small>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

// Panel de rendimiento
const RendimientoPanel = ({ selectedAnalista, analistas, getMetrica }) => (
    <div className="hyper-widget card border-0 shadow-sm">
        <div className="card-header bg-white border-0">
            <h5 className="mb-0">
                <i className="fas fa-chart-bar me-2"></i>
                {selectedAnalista ? 'Métricas del Analista' : 'Rendimiento del Equipo'}
            </h5>
        </div>
        <div className="card-body">
            <div className="row text-center mb-4 g-3">
                <div className="col-xl-3 col-lg-6 col-md-6">
                    <div className="border-end pe-3">
                        <h4 className="text-primary">{getMetrica('ticketsAsignados')}</h4>
                        <small className="text-muted">Asignados</small>
                    </div>
                </div>
                <div className="col-xl-3 col-lg-6 col-md-6">
                    <div className="border-end pe-3">
                        <h4 className="text-warning">{getMetrica('ticketsSolucionados')}</h4>
                        <small className="text-muted">Solucionados</small>
                    </div>
                </div>
                <div className="col-xl-3 col-lg-6 col-md-6">
                    <div className="border-end pe-3">
                        <h4 className="text-warning">{getMetrica('ticketsEscalados')}</h4>
                        <small className="text-muted">Escalados</small>
                    </div>
                </div>
                <div className="col-xl-3 col-lg-6 col-md-6">
                    <h4 className="text-danger">{getMetrica('ticketsReabiertos')}</h4>
                    <small className="text-muted">Reabiertos</small>
                </div>
            </div>
            <MonthlyChart />
        </div>
    </div>
);

// Panel de eficiencia
const EficienciaPanel = ({ selectedAnalista, analistas, getMetricaPromedio }) => {
    const analista = selectedAnalista ? analistas.find(a => a.id === selectedAnalista) : null;

    return (
        <div className="hyper-widget card border-0 shadow-sm h-100">
            <div className="card-header bg-white border-0">
                <h5 className="mb-0">
                    <i className="fas fa-tachometer-alt me-2"></i>
                    Eficiencia
                </h5>
            </div>
            <div className="card-body">
                <div className="text-center">
                    <div className="mb-3">
                        <div className="display-4 text-primary fw-bold">
                            {analista
                                ? analista.metricas.eficiencia
                                : getMetricaPromedio('eficiencia').toFixed(1)}%
                        </div>
                        <div className="text-muted">
                            {analista ? 'Eficiencia General' : 'Eficiencia Promedio'}
                        </div>
                    </div>
                    <div className="row text-center g-2">
                        <div className="col-6">
                            <div className="fw-bold text-success">
                                {analista
                                    ? analista.metricas.satisfaccion.toFixed(1)
                                    : getMetricaPromedio('satisfaccion').toFixed(1)}%
                            </div>
                            <div className="small text-muted">Satisfacción</div>
                        </div>
                        <div className="col-6">
                            <div className="fw-bold text-info">
                                {analista
                                    ? analista.metricas.tiempoRespuestaPromedio
                                    : getMetricaPromedio('tiempoRespuestaPromedio').toFixed(1)}h
                            </div>
                            <div className="small text-muted">Tiempo Resp.</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const CalidadCharts = ({ selectedAnalista, analistas, getMetrica, getMetricaPromedio }) => (
    <div className="row mb-4 g-3">
        <div className="col-xl-9 col-lg-8">
            <RendimientoPanel
                selectedAnalista={selectedAnalista}
                analistas={analistas}
                getMetrica={getMetrica}
            />
        </div>
        <div className="col-xl-3 col-lg-4">
            <EficienciaPanel
                selectedAnalista={selectedAnalista}
                analistas={analistas}
                getMetricaPromedio={getMetricaPromedio}
            />
        </div>
    </div>
);

export default CalidadCharts;
