/**
 * HeatmapControls.jsx
 * Controles del mapa de calor - DISEÑO PREMIUM
 * Toggle switches modernos con animaciones
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
    // Estilos para botones premium
    const buttonBaseStyle = {
        borderRadius: '25px',
        padding: '10px 20px',
        fontWeight: '600',
        fontSize: '0.875rem',
        border: 'none',
        transition: 'all 0.3s ease',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)'
    };

    const heatmapActiveStyle = showHeatmap ? {
        ...buttonBaseStyle,
        background: 'linear-gradient(135deg, #ff512f 0%, #f09819 100%)',
        color: 'white',
        boxShadow: '0 6px 20px rgba(255, 81, 47, 0.4)'
    } : {
        ...buttonBaseStyle,
        background: 'rgba(255, 255, 255, 0.9)',
        color: '#6c757d',
        border: '2px solid #e9ecef'
    };

    const markersActiveStyle = showMarkers ? {
        ...buttonBaseStyle,
        background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
        color: 'white',
        boxShadow: '0 6px 20px rgba(17, 153, 142, 0.4)'
    } : {
        ...buttonBaseStyle,
        background: 'rgba(255, 255, 255, 0.9)',
        color: '#6c757d',
        border: '2px solid #e9ecef'
    };

    const viewAllStyle = {
        ...buttonBaseStyle,
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        boxShadow: '0 6px 20px rgba(102, 126, 234, 0.4)'
    };

    return (
        <div
            className="d-flex flex-wrap justify-content-between align-items-center mb-4 p-3"
            style={{
                background: 'rgba(255, 255, 255, 0.8)',
                backdropFilter: 'blur(10px)',
                borderRadius: '20px',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)'
            }}
        >
            {/* Leyenda del gradiente */}
            <div className="d-flex align-items-center gap-3">
                <div className="d-flex align-items-center gap-2">
                    <span className="text-muted fw-medium" style={{ fontSize: '0.8rem' }}>Intensidad:</span>
                    <div
                        style={{
                            width: '150px',
                            height: '12px',
                            background: 'linear-gradient(to right, rgba(0,0,255,0.3), #00ffff, #00ff00, #ffff00, #ff8c00, #ff0000)',
                            borderRadius: '6px',
                            boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.2)'
                        }}
                    />
                    <div className="d-flex gap-2" style={{ fontSize: '0.7rem' }}>
                        <span className="text-info">Baja</span>
                        <span className="text-warning">Media</span>
                        <span className="text-danger">Alta</span>
                    </div>
                </div>
            </div>

            {/* Botones de control */}
            <div className="d-flex gap-2 flex-wrap mt-2 mt-md-0">
                <button
                    type="button"
                    style={heatmapLayerRef?.current ? heatmapActiveStyle : { ...buttonBaseStyle, opacity: 0.5 }}
                    onClick={toggleHeatmap}
                    disabled={isTransitioning || !heatmapLayerRef?.current}
                >
                    <i className={`fas fa-fire ${showHeatmap ? 'fa-beat' : ''}`} style={{ fontSize: '1rem' }} />
                    <span>{isTransitioning ? 'Procesando...' : (showHeatmap ? 'Calor ON' : 'Calor OFF')}</span>
                </button>

                <button
                    type="button"
                    style={markersActiveStyle}
                    onClick={toggleMarkers}
                    disabled={isTransitioning}
                >
                    <i className={`fas fa-map-marker-alt ${showMarkers ? 'fa-bounce' : ''}`} style={{ fontSize: '1rem' }} />
                    <span>{isTransitioning ? 'Procesando...' : (showMarkers ? 'Puntos ON' : 'Puntos OFF')}</span>
                </button>

                <button
                    type="button"
                    style={viewAllStyle}
                    onClick={centerOnAllPoints}
                    disabled={isTransitioning}
                >
                    <i className="fas fa-expand-arrows-alt" style={{ fontSize: '1rem' }} />
                    <span>{isTransitioning ? 'Centrando...' : 'Ver Todo'}</span>
                </button>
            </div>
        </div>
    );
};

export default HeatmapControls;
