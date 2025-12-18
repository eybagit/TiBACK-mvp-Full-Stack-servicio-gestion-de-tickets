/**
 * HeatmapStats.jsx
 * Estadísticas del mapa de calor
 * Parte de la modularización de HeatmapComponent.jsx
 */

import React from 'react';

const HeatmapStats = ({ stats }) => {
    return (
        <div className="row mt-3">
            <div className="col-md-3">
                <div className="card bg-light">
                    <div className="card-body text-center py-2">
                        <h6 className="card-title mb-1">{stats.total}</h6>
                        <small className="text-muted">Total Tickets</small>
                    </div>
                </div>
            </div>
            <div className="col-md-3">
                <div className="card bg-light">
                    <div className="card-body text-center py-2">
                        <h6 className="card-title mb-1">{stats.enProceso}</h6>
                        <small className="text-muted">En Proceso</small>
                    </div>
                </div>
            </div>
            <div className="col-md-3">
                <div className="card bg-light">
                    <div className="card-body text-center py-2">
                        <h6 className="card-title mb-1">{stats.solucionados}</h6>
                        <small className="text-muted">Solucionados</small>
                    </div>
                </div>
            </div>
            <div className="col-md-3">
                <div className="card bg-light">
                    <div className="card-body text-center py-2">
                        <h6 className="card-title mb-1">{stats.cerrados}</h6>
                        <small className="text-muted">Cerrados</small>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HeatmapStats;
