/**
 * HeatmapComponent.jsx
 * Componente principal del mapa de calor - MODULARIZADO
 * 
 * Reducido de 646 líneas a ~200 líneas (-69%)
 * 
 * Estructura modular:
 * - hooks/useHeatmapData.js - Manejo de datos y estadísticas
 * - hooks/useHeatmapMap.js - Manejo del mapa de Google Maps
 * - components/HeatmapControls.jsx - Controles del mapa
 * - components/HeatmapStats.jsx - Estadísticas
 * - components/HeatmapSuggestions.jsx - Sugerencias de navegación
 */

import React, { useEffect } from 'react';
import { useGoogleMaps } from '../hooks/useGoogleMaps';
import useGlobalReducer from '../hooks/useGlobalReducer';

// Hooks modularizados
import { useHeatmapData } from './heatmap/hooks/useHeatmapData';
import { useHeatmapMap } from './heatmap/hooks/useHeatmapMap';

// Componentes modularizados
import HeatmapControls from './heatmap/components/HeatmapControls';
import HeatmapStats from './heatmap/components/HeatmapStats';
import HeatmapSuggestions from './heatmap/components/HeatmapSuggestions';

const HeatmapComponent = () => {
    const { isLoaded, error: googleMapsError } = useGoogleMaps();
    const { store } = useGlobalReducer();

    // Hook de datos
    const {
        rawData,
        loading,
        error,
        stats,
        fetchHeatmapData,
        getMarkerColor,
        calculateHeatmapWeight
    } = useHeatmapData(store);

    // Hook del mapa
    const {
        mapRef,
        heatmapLayerRef,
        showMarkers,
        showHeatmap,
        isTransitioning,
        mapInitialized,
        initializeMap,
        updateMapData,
        centerOnAllPoints,
        goToLocation,
        toggleMarkers,
        toggleHeatmap
    } = useHeatmapMap({
        rawData,
        isLoaded,
        googleMapsError,
        calculateHeatmapWeight,
        getMarkerColor
    });

    // Cargar datos cuando Google Maps esté listo
    useEffect(() => {
        if (isLoaded && !googleMapsError) {
            fetchHeatmapData();
        }
    }, [isLoaded, googleMapsError, fetchHeatmapData]);

    // Inicializar mapa
    useEffect(() => {
        if (isLoaded && !googleMapsError) {
            let attempts = 0;
            const maxAttempts = 50;

            const initializeWithDelay = () => {
                attempts++;
                if (mapRef.current) {
                    initializeMap();
                } else if (attempts < maxAttempts) {
                    setTimeout(initializeWithDelay, 100);
                }
            };

            initializeWithDelay();
        }
    }, [isLoaded, googleMapsError, initializeMap, mapRef]);

    // Actualizar datos del mapa
    useEffect(() => {
        if (mapInitialized && rawData.length > 0) {
            updateMapData();
        }
    }, [mapInitialized, rawData, updateMapData]);

    // WebSocket para actualizaciones en tiempo real
    useEffect(() => {
        const socket = store.websocket.socket;
        if (socket) {
            const handleNewTicket = () => fetchHeatmapData();
            socket.on('nuevo_ticket', handleNewTicket);
            socket.on('nuevo_ticket_disponible', handleNewTicket);
            return () => {
                socket.off('nuevo_ticket', handleNewTicket);
                socket.off('nuevo_ticket_disponible', handleNewTicket);
            };
        }
    }, [store.websocket.socket, fetchHeatmapData]);

    // Estados de carga
    if (!isLoaded) {
        return (
            <div className="d-flex justify-content-center align-items-center map-container-lg">
                <div className="text-center">
                    <div className="spinner-border text-primary mb-3" role="status">
                        <span className="visually-hidden">Cargando mapa...</span>
                    </div>
                    <p className="text-muted">Cargando Google Maps...</p>
                </div>
            </div>
        );
    }

    if (googleMapsError) {
        return (
            <div className="alert alert-danger" role="alert">
                <i className="fas fa-exclamation-triangle me-2"></i>
                Error al cargar Google Maps: {googleMapsError.message}
            </div>
        );
    }

    if (loading) {
        return (
            <div className="d-flex justify-content-center align-items-center map-container-lg">
                <div className="text-center">
                    <div className="spinner-border text-primary mb-3" role="status">
                        <span className="visually-hidden">Cargando datos...</span>
                    </div>
                    <p className="text-muted">Cargando datos del mapa de calor...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="alert alert-warning" role="alert">
                <i className="fas fa-exclamation-triangle me-2"></i>
                <strong>Información del Mapa de Calor:</strong> {error}
                <hr />
                <small>
                    <strong>Para que aparezcan los tickets en el mapa:</strong><br />
                    • Los clientes deben tener coordenadas de latitud y longitud en su perfil<br />
                    • Las direcciones deben estar geocodificadas (convertidas a coordenadas)<br />
                    • Los tickets heredan la ubicación del cliente que los creó
                </small>
            </div>
        );
    }

    return (
        <div className="heatmap-container">
            {/* Header */}
            <div className="row mb-3">
                <div className="col-12">
                    <div className="d-flex justify-content-between align-items-center">
                        <div>
                            <h5 className="mb-1">
                                <i className="fas fa-map-marker-alt me-2 text-primary"></i>
                                Mapa de Calor - Tickets por Ubicación del Cliente
                            </h5>
                            <small className="text-muted">
                                {stats.total} tickets ubicados según la dirección del cliente
                            </small>
                        </div>
                        <div className="d-flex gap-3">
                            <div className="d-flex align-items-center gap-2">
                                <div className="d-flex align-items-center gap-1">
                                    <div style={{
                                        width: '20px',
                                        height: '20px',
                                        background: 'linear-gradient(45deg, rgba(255,200,200,0.3), rgba(255,0,0,1))',
                                        borderRadius: '50%',
                                        border: '2px solid #fff',
                                        boxShadow: '0 2px 4px rgba(0,0,0,0.3)'
                                    }}></div>
                                    <small><strong>Mapa de Calor</strong></small>
                                </div>
                                <small className="text-muted">• Paleta completa de rojos según intensidad</small>
                            </div>
                            <div className="d-flex align-items-center gap-1">
                                <i className="fas fa-info-circle text-info"></i>
                                <small className="text-muted">
                                    {stats.total} tickets • Densidad: {stats.total > 0 ? 'Alta' : 'Baja'}
                                </small>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Controles */}
            <HeatmapControls
                showHeatmap={showHeatmap}
                showMarkers={showMarkers}
                isTransitioning={isTransitioning}
                heatmapLayerRef={heatmapLayerRef}
                toggleHeatmap={toggleHeatmap}
                toggleMarkers={toggleMarkers}
                centerOnAllPoints={centerOnAllPoints}
            />

            {/* Mapa */}
            <div className="map-container" style={{ height: '500px', width: '100%', position: 'relative' }}>
                {!mapInitialized && (
                    <div className="d-flex justify-content-center align-items-center" style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: '#f8f9fa',
                        borderRadius: '8px',
                        zIndex: 1000
                    }}>
                        <div className="text-center">
                            <div className="spinner-border text-primary mb-3" role="status">
                                <span className="visually-hidden">Cargando mapa...</span>
                            </div>
                            <p className="text-muted">Inicializando mapa...</p>
                        </div>
                    </div>
                )}
                <div
                    ref={mapRef}
                    style={{
                        height: '100%',
                        width: '100%',
                        borderRadius: '8px',
                        backgroundColor: '#e9ecef'
                    }}
                />
            </div>

            {/* Estadísticas */}
            <HeatmapStats stats={stats} />

            {/* Sugerencias de navegación */}
            <HeatmapSuggestions rawData={rawData} goToLocation={goToLocation} />
        </div>
    );
};

export default HeatmapComponent;
