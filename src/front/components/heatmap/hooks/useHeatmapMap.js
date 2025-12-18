/**
 * useHeatmapMap.js
 * Hook para manejo del mapa de Google Maps
 * Parte de la modularización de HeatmapComponent.jsx
 */

import { useState, useRef, useCallback, useMemo, useEffect } from 'react';

/**
 * Hook para manejo del mapa
 */
export const useHeatmapMap = ({ rawData, isLoaded, googleMapsError, calculateHeatmapWeight, getMarkerColor }) => {
    // Referencias
    const mapRef = useRef(null);
    const mapInstanceRef = useRef(null);
    const markersRef = useRef([]);
    const markerClustererRef = useRef(null);
    const infoWindowRef = useRef(null);
    const heatmapLayerRef = useRef(null);

    // Estados
    const [showMarkers, setShowMarkers] = useState(false);
    const [showHeatmap, setShowHeatmap] = useState(true);
    const [isTransitioning, setIsTransitioning] = useState(false);
    const [mapInitialized, setMapInitialized] = useState(false);

    // Configuración del mapa
    const mapCenter = useMemo(() => ({ lat: 4.6097, lng: -74.0817 }), []);
    
    const mapConfig = useMemo(() => ({
        center: mapCenter,
        zoom: 6,
        mapTypeControl: true,
        streetViewControl: true,
        fullscreenControl: true,
        zoomControl: true,
        gestureHandling: 'cooperative',
        zoomControlOptions: {
            position: window.google?.maps?.ControlPosition?.TOP_RIGHT
        },
        disableDefaultUI: false,
        clickableIcons: true,
        keyboardShortcuts: true,
        scrollwheel: true,
        disableDoubleClickZoom: false,
        styles: [{
            featureType: 'poi',
            elementType: 'labels',
            stylers: [{ visibility: 'off' }]
        }]
    }), [mapCenter]);

    // Gradiente de calor
    const heatmapGradient = useMemo(() => [
        'rgba(255, 0, 0, 0)',
        'rgba(255, 200, 200, 1)',
        'rgba(255, 180, 180, 1)',
        'rgba(255, 160, 160, 1)',
        'rgba(255, 140, 140, 1)',
        'rgba(255, 120, 120, 1)',
        'rgba(255, 100, 100, 1)',
        'rgba(255, 80, 80, 1)',
        'rgba(255, 60, 60, 1)',
        'rgba(255, 40, 40, 1)',
        'rgba(255, 20, 20, 1)',
        'rgba(255, 10, 10, 1)',
        'rgba(255, 5, 5, 1)',
        'rgba(255, 0, 0, 1)'
    ], []);

    // Crear datos del heatmap
    const createHeatmapData = useCallback((transformedData) => {
        return transformedData.map((item) => {
            const latVariation = (Math.random() - 0.5) * 0.001;
            const lngVariation = (Math.random() - 0.5) * 0.001;

            return {
                location: new window.google.maps.LatLng(
                    item.lat + latVariation,
                    item.lng + lngVariation
                ),
                weight: calculateHeatmapWeight(item)
            };
        });
    }, [calculateHeatmapWeight]);

    // Crear contenido de InfoWindow
    const createInfoContent = useCallback((item) => {
        return `
            <div style="max-width: 300px; font-family: Arial, sans-serif;">
                <div style="border-bottom: 1px solid #dee2e6; padding-bottom: 10px; margin-bottom: 10px;">
                    <h6 style="margin: 0; color: #495057; font-weight: bold;">${item.ticket_titulo}</h6>
                </div>
                <div style="margin-bottom: 8px;">
                    <strong>Estado:</strong> 
                    <span style="color: ${getMarkerColor(item.ticket_estado)}; font-weight: bold;">
                        ${item.ticket_estado?.toUpperCase() || 'N/A'}
                    </span>
                </div>
                <div style="margin-bottom: 8px;">
                    <strong>Descripción:</strong><br>
                    <span style="color: #6c757d; font-size: 0.9em;">
                        ${item.ticket_descripcion ? item.ticket_descripcion.substring(0, 100) + '...' : 'Sin descripción'}
                    </span>
                </div>
                <div style="margin-bottom: 8px;">
                    <strong>Fecha de Creación:</strong><br>
                    <span style="color: #6c757d; font-size: 0.9em;">
                        ${new Date(item.ticket_fecha_creacion).toLocaleDateString('es-CO', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                        })}
                    </span>
                </div>
                <div style="margin-bottom: 8px;">
                    <strong>Prioridad:</strong> 
                    <span style="color: ${item.ticket_prioridad === 'alta' ? '#dc3545' : item.ticket_prioridad === 'media' ? '#ffc107' : '#198754'}; font-weight: bold;">
                        ${item.ticket_prioridad?.toUpperCase() || 'N/A'}
                    </span>
                </div>
                <div style="margin-top: 10px; padding-top: 10px; border-top: 1px solid #dee2e6;">
                    <small style="color: #6c757d;">
                        ID: ${item.ticket_id} | Cliente: ${item.cliente_nombre} ${item.cliente_apellido || ''}
                    </small>
                </div>
            </div>
        `;
    }, [getMarkerColor]);

    // Inicializar mapa
    const initializeMap = useCallback(() => {
        if (!window.google?.maps || !mapRef.current || mapInstanceRef.current) return;

        try {
            const map = new window.google.maps.Map(mapRef.current, mapConfig);
            mapInstanceRef.current = map;

            infoWindowRef.current = new window.google.maps.InfoWindow();

            if (window.MarkerClusterer) {
                markerClustererRef.current = new window.MarkerClusterer(map, [], {
                    imagePath: 'https://developers.google.com/maps/documentation/javascript/examples/markerclusterer/m',
                    gridSize: 20,
                    maxZoom: 18,
                    minimumClusterSize: 3
                });
            }

            if (window.google.maps.visualization?.HeatmapLayer) {
                heatmapLayerRef.current = new window.google.maps.visualization.HeatmapLayer({
                    data: [],
                    map: null,
                    radius: 50,
                    opacity: 0.8,
                    gradient: heatmapGradient,
                    dissipating: true,
                    maxIntensity: 10
                });
            }

            setMapInitialized(true);

            setTimeout(() => {
                if (mapInstanceRef.current) {
                    window.google.maps.event.trigger(mapInstanceRef.current, 'resize');
                }
            }, 100);

        } catch (error) {
            console.error('Error al crear el mapa:', error);
        }
    }, [mapConfig, heatmapGradient]);

    // Actualizar datos del mapa
    const updateMapData = useCallback(() => {
        if (!mapInstanceRef.current || !rawData.length) return;

        // Actualizar heatmap
        if (heatmapLayerRef.current && showHeatmap) {
            const heatmapData = createHeatmapData(rawData);
            heatmapLayerRef.current.setData(heatmapData);
            heatmapLayerRef.current.setMap(mapInstanceRef.current);
        } else if (heatmapLayerRef.current) {
            heatmapLayerRef.current.setMap(null);
        }

        // Limpiar marcadores existentes
        markersRef.current.forEach(marker => marker.setMap(null));
        markersRef.current = [];

        if (markerClustererRef.current) {
            markerClustererRef.current.clearMarkers();
        }

        // Crear nuevos marcadores si están habilitados
        if (showMarkers) {
            const newMarkers = rawData.map((item) => {
                const marker = new window.google.maps.Marker({
                    position: { lat: item.lat, lng: item.lng },
                    map: null,
                    title: `Ticket #${item.ticket_id} - ${item.ticket_titulo}`,
                    icon: {
                        path: window.google.maps.SymbolPath.CIRCLE,
                        fillColor: '#dc3545',
                        fillOpacity: 0.8,
                        strokeColor: '#ffffff',
                        strokeWeight: 2,
                        scale: 10
                    },
                    animation: window.google.maps.Animation.DROP
                });

                marker.addListener('click', () => {
                    if (infoWindowRef.current) {
                        infoWindowRef.current.setContent(createInfoContent(item));
                        infoWindowRef.current.open(mapInstanceRef.current, marker);
                    }
                });

                return marker;
            });

            markersRef.current = newMarkers;

            if (markerClustererRef.current) {
                markerClustererRef.current.addMarkers(newMarkers);
            } else {
                newMarkers.forEach(marker => marker.setMap(mapInstanceRef.current));
            }

            if (newMarkers.length > 0) {
                const bounds = new window.google.maps.LatLngBounds();
                newMarkers.forEach(marker => bounds.extend(marker.getPosition()));
                mapInstanceRef.current.fitBounds(bounds);
            }
        }
    }, [rawData, showMarkers, showHeatmap, createHeatmapData, createInfoContent]);

    // Centrar en todos los puntos
    const centerOnAllPoints = useCallback(() => {
        if (!rawData.length || !mapInstanceRef.current) return;

        setIsTransitioning(true);
        const bounds = new window.google.maps.LatLngBounds();
        rawData.forEach(item => {
            bounds.extend(new window.google.maps.LatLng(item.lat, item.lng));
        });

        mapInstanceRef.current.fitBounds(bounds);

        const listener = window.google.maps.event.addListener(mapInstanceRef.current, 'bounds_changed', () => {
            if (mapInstanceRef.current.getZoom() > 15) {
                mapInstanceRef.current.setZoom(15);
            }
            window.google.maps.event.removeListener(listener);
            setIsTransitioning(false);
        });
    }, [rawData]);

    // Ir a ubicación
    const goToLocation = useCallback((lat, lng) => {
        if (mapInstanceRef.current) {
            mapInstanceRef.current.setCenter({ lat, lng });
            mapInstanceRef.current.setZoom(15);
        }
    }, []);

    // Alternar marcadores
    const toggleMarkers = useCallback(() => {
        setIsTransitioning(true);
        setShowMarkers(!showMarkers);
        setTimeout(() => setIsTransitioning(false), 300);
    }, [showMarkers]);

    // Alternar heatmap
    const toggleHeatmap = useCallback(() => {
        setIsTransitioning(true);
        setShowHeatmap(!showHeatmap);
        setTimeout(() => setIsTransitioning(false), 300);
    }, [showHeatmap]);

    return {
        mapRef,
        mapInstanceRef,
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
    };
};

export default useHeatmapMap;
