/**
 * HeatmapControls.jsx
 * Controles del mapa de calor
 * Parte de la modularización de HeatmapComponent.jsx
 */

import React from 'react';

const HeatmapControls = ({
    showHeatmap,
    showMarkers,
    isTransitioning,
    heatmapLayerRef,
    toggleHeatmap,
    toggleMarkers,
    centerOnAllPoints
}) => {
    return (
        <div className="d-flex justify-content-between align-items-center mb-3">
            <div className="btn-group" role="group">
                <button
                    type="button"
                    className={`btn ${heatmapLayerRef?.current ? (showHeatmap ? 'btn-primary' : 'btn-outline-primary') : 'btn-outline-secondary'} btn-sm ${isTransitioning ? 'disabled' : ''}`}
                    onClick={toggleHeatmap}
                    disabled={isTransitioning || !heatmapLayerRef?.current}
                >
                    <i className="fas fa-fire me-1"></i>
                    {isTransitioning ? 'Procesando...' :
                        !heatmapLayerRef?.current ? 'Mapa de Calor N/A' :
                            (showHeatmap ? 'Mapa de Calor ON' : 'Mapa de Calor OFF')}
                </button>
                <button
                    type="button"
                    className={`btn ${showMarkers ? 'btn-success' : 'btn-outline-success'} btn-sm ${isTransitioning ? 'disabled' : ''}`}
                    onClick={toggleMarkers}
                    disabled={isTransitioning}
                >
                    <i className="fas fa-map-marker-alt me-1"></i>
                    {isTransitioning ? 'Procesando...' : (showMarkers ? 'Marcadores ON' : 'Marcadores OFF')}
                </button>
                <button
                    type="button"
                    className={`btn btn-outline-info btn-sm ${isTransitioning ? 'disabled' : ''}`}
                    onClick={centerOnAllPoints}
                    disabled={isTransitioning}
                >
                    <i className="fas fa-expand-arrows-alt me-1"></i>
                    {isTransitioning ? 'Centrando...' : 'Ver Todos'}
                </button>
            </div>
        </div>
    );
};

export default HeatmapControls;
