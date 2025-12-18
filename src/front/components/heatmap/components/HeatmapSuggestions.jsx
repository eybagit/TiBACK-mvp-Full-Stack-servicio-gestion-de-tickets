/**
 * HeatmapSuggestions.jsx
 * Sugerencias de navegación del mapa de calor
 * Parte de la modularización de HeatmapComponent.jsx
 */

import React from 'react';

const HeatmapSuggestions = ({ rawData, goToLocation }) => {
    if (!rawData.length) return null;

    return (
        <div className="mt-3">
            <h6>
                <i className="fas fa-list me-2"></i>
                Sugerencias de Navegación
            </h6>
            <div className="row">
                {rawData.slice(0, 6).map((item, index) => (
                    <div key={index} className="col-md-4 mb-2">
                        <div className="card h-100">
                            <div className="card-body p-2">
                                <h6 className="card-title small mb-1">Ticket #{item.ticket_id}</h6>
                                <p className="card-text small text-muted mb-1">{item.ticket_titulo}</p>
                                <p className="card-text small text-muted mb-1">
                                    <strong>Cliente:</strong> {item.cliente_nombre} {item.cliente_apellido}
                                </p>
                                <button
                                    className="btn btn-outline-primary btn-sm w-100"
                                    onClick={() => goToLocation(item.lat, item.lng)}
                                >
                                    <i className="fas fa-map-marker-alt me-1"></i>
                                    Ir a ubicación
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default HeatmapSuggestions;
